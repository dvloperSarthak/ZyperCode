import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ZYPECODE_DIR = path.join(os.homedir(), ".zypecode");
const CREDENTIALS_FILE = path.join(ZYPECODE_DIR, "credentials");

function ensureDirectoryExists(): void {
  if (!fs.existsSync(ZYPECODE_DIR)) {
    fs.mkdirSync(ZYPECODE_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Derives a machine/user specific encryption key so credentials cannot be
 * read simply by copying the file to another machine or another user account.
 */
function getDerivedKey(): Buffer {
  const secretMaterial = `${os.userInfo().username}-${os.hostname()}-zypecode-secure-salt`;
  return crypto.pbkdf2Sync(
    secretMaterial,
    "zypecode-salt-v1",
    100000,
    32,
    "sha256",
  );
}

function encrypt(data: string): string {
  const iv = crypto.randomBytes(12);
  const key = getDerivedKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    content: encrypted.toString("hex"),
  });
}

function decrypt(encryptedPayload: string): string {
  try {
    const parsed = JSON.parse(encryptedPayload) as {
      iv: string;
      tag: string;
      content: string;
    };
    const key = getDerivedKey();
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(parsed.iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.content, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "{}";
  }
}

function readEncryptedStore(): Record<string, string> {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf8");
    const jsonStr = decrypt(raw);
    return JSON.parse(jsonStr) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeEncryptedStore(data: Record<string, string>): void {
  ensureDirectoryExists();
  const encrypted = encrypt(JSON.stringify(data));
  fs.writeFileSync(CREDENTIALS_FILE, encrypted, {
    mode: 0o600,
    encoding: "utf8",
  });
  // Ensure mode is 0o600 even if already existed
  try {
    fs.chmodSync(CREDENTIALS_FILE, 0o600);
  } catch {
    // Windows chmod may be partial, continue
  }
}

/**
 * Securely retrieves an API key for a provider.
 */
export async function getApiKey(provider: string): Promise<string | null> {
  const store = readEncryptedStore();
  const key = store[provider.toLowerCase()];
  return key && key.trim().length > 0 ? key.trim() : null;
}

/**
 * Securely stores an API key for a provider.
 */
export async function setApiKey(provider: string, key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    throw new Error("Cannot save empty API key.");
  }
  const store = readEncryptedStore();
  store[provider.toLowerCase()] = trimmed;
  writeEncryptedStore(store);
}

/**
 * Clears an API key for a provider.
 */
export async function deleteApiKey(provider: string): Promise<void> {
  const store = readEncryptedStore();
  if (provider.toLowerCase() in store) {
    delete store[provider.toLowerCase()];
    writeEncryptedStore(store);
  }
}

/**
 * Returns a list of provider IDs that have a configured key.
 */
export async function listConfiguredKeyProviders(): Promise<string[]> {
  const store = readEncryptedStore();
  return Object.keys(store);
}

/**
 * Masks an API key for safe display (never reveals full key).
 * Examples:
 *   "sk-or-v1-abcdef123456" -> "sk-or-...3456"
 *   "gsk_xyz987654321"     -> "gsk_...4321"
 *   "short"                -> "••••••••"
 */
export function maskApiKey(key?: string | null): string {
  if (!key || key.trim().length === 0) {
    return "(not configured)";
  }
  const str = key.trim();
  if (str.length <= 8) {
    return "••••••••";
  }

  // Check common prefixes
  const prefixes = ["sk-or-v1-", "sk-or-", "sk-ant-", "gsk_", "csk-", "sk-"];
  for (const prefix of prefixes) {
    if (str.startsWith(prefix) && str.length > prefix.length + 4) {
      const suffix = str.slice(-4);
      return `${prefix}...${suffix}`;
    }
  }

  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

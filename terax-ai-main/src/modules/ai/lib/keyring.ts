import { invoke } from "@tauri-apps/api/core";
import {
  getProvider,
  KEYRING_SERVICE,
  LEGACY_KEYRING_SERVICE,
  PROVIDERS,
  providerSupportsKey,
  type CustomEndpoint,
  type ProviderId,
} from "../config";

export type ProviderKeys = Record<ProviderId, string | null>;
export type CustomEndpointKeys = Record<string, string | null>;

export const EMPTY_PROVIDER_KEYS: ProviderKeys = {
  openai: null,
  anthropic: null,
  google: null,
  xai: null,
  cerebras: null,
  groq: null,
  deepseek: null,
  mistral: null,
  openrouter: null,
  "openai-compatible": null,
  lmstudio: null,
  mlx: null,
  ollama: null,
};

export async function getKey(provider: ProviderId): Promise<string | null> {
  if (!providerSupportsKey(provider)) return null;
  try {
    const v = await invoke<string | null>("secrets_get", {
      service: KEYRING_SERVICE,
      account: getProvider(provider).keyringAccount,
    });
    if (v && v.length > 0) return v;
  } catch {
    // fall back
  }
  try {
    const legacy = await invoke<string | null>("secrets_get", {
      service: LEGACY_KEYRING_SERVICE,
      account: getProvider(provider).keyringAccount,
    });
    if (legacy && legacy.length > 0) {
      void setKey(provider, legacy).catch(() => {});
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setKey(provider: ProviderId, key: string): Promise<void> {
  if (!providerSupportsKey(provider)) {
    throw new Error(`${provider} does not use an API key`);
  }
  const trimmed = key.trim();
  if (!trimmed) throw new Error("API key is empty");
  await invoke("secrets_set", {
    service: KEYRING_SERVICE,
    account: getProvider(provider).keyringAccount,
    password: trimmed,
  });
}

export async function clearKey(provider: ProviderId): Promise<void> {
  if (!providerSupportsKey(provider)) return;
  try {
    await invoke("secrets_delete", {
      service: KEYRING_SERVICE,
      account: getProvider(provider).keyringAccount,
    });
  } catch {
    // already absent — fine
  }
}

export async function getAllKeys(): Promise<ProviderKeys> {
  const out = { ...EMPTY_PROVIDER_KEYS };
  const need = PROVIDERS.filter((p) => providerSupportsKey(p.id));
  try {
    const results = await invoke<(string | null)[]>("secrets_get_all", {
      service: KEYRING_SERVICE,
      accounts: need.map((p) => p.keyringAccount),
    });
    const missing: typeof need = [];
    need.forEach((p, i) => {
      const v = results[i];
      if (v && v.length > 0) {
        out[p.id] = v;
      } else {
        missing.push(p);
      }
    });

    if (missing.length > 0) {
      try {
        const legacyResults = await invoke<(string | null)[]>("secrets_get_all", {
          service: LEGACY_KEYRING_SERVICE,
          accounts: missing.map((p) => p.keyringAccount),
        });
        for (let i = 0; i < missing.length; i++) {
          const p = missing[i];
          const legacyVal = legacyResults[i];
          if (legacyVal && legacyVal.length > 0) {
            out[p.id] = legacyVal;
            void setKey(p.id, legacyVal).catch(() => {});
          }
        }
      } catch {
        for (const p of missing) {
          const val = await getKey(p.id);
          if (val) out[p.id] = val;
        }
      }
    }
    return out;
  } catch {
    const entries = await Promise.all(
      need.map(async (p) => [p.id, await getKey(p.id)] as const),
    );
    for (const [id, v] of entries) out[id] = v;
    return out;
  }
}

export function hasAnyKey(keys: ProviderKeys): boolean {
  return PROVIDERS.some((p) => providerSupportsKey(p.id) && !!keys[p.id]);
}

function compatKeyringAccount(endpointId: string): string {
  return `compat-${endpointId}-api-key`;
}

export async function getCustomEndpointKey(
  endpointId: string,
): Promise<string | null> {
  try {
    const v = await invoke<string | null>("secrets_get", {
      service: KEYRING_SERVICE,
      account: compatKeyringAccount(endpointId),
    });
    if (v && v.length > 0) return v;
  } catch {
    // fall back
  }
  try {
    const legacy = await invoke<string | null>("secrets_get", {
      service: LEGACY_KEYRING_SERVICE,
      account: compatKeyringAccount(endpointId),
    });
    if (legacy && legacy.length > 0) {
      void setCustomEndpointKey(endpointId, legacy).catch(() => {});
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCustomEndpointKey(
  endpointId: string,
  key: string,
): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) throw new Error("API key is empty");
  await invoke("secrets_set", {
    service: KEYRING_SERVICE,
    account: compatKeyringAccount(endpointId),
    password: trimmed,
  });
}

export async function clearCustomEndpointKey(
  endpointId: string,
): Promise<void> {
  try {
    await invoke("secrets_delete", {
      service: KEYRING_SERVICE,
      account: compatKeyringAccount(endpointId),
    });
  } catch {}
}

export async function getAllCustomEndpointKeys(
  endpoints: readonly CustomEndpoint[],
): Promise<CustomEndpointKeys> {
  if (endpoints.length === 0) return {};
  const out: CustomEndpointKeys = {};
  try {
    const accounts = endpoints.map((e) => compatKeyringAccount(e.id));
    const results = await invoke<(string | null)[]>("secrets_get_all", {
      service: KEYRING_SERVICE,
      accounts,
    });
    const missing: CustomEndpoint[] = [];
    endpoints.forEach((e, i) => {
      const v = results[i];
      if (v && v.length > 0) {
        out[e.id] = v;
      } else {
        missing.push(e);
      }
    });

    if (missing.length > 0) {
      for (const e of missing) {
        const val = await getCustomEndpointKey(e.id);
        if (val) out[e.id] = val;
      }
    }
  } catch {
    for (const e of endpoints) {
      out[e.id] = await getCustomEndpointKey(e.id);
    }
  }
  return out;
}

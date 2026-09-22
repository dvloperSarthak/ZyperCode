import { useCallback, useEffect, useState } from "react";
import {
  getAllKeys,
  hasAnyKey,
  setKey,
  type ProviderKeys,
} from "../ai/lib/keyring";
import {
  MODELS,
  type ProviderId,
} from "../ai/config";
import { setDefaultModel } from "../settings/store";

export type CredentialState =
  | "CHECKING"
  | "NO_KEY"
  | "READY"
  | "SAVING"
  | "ERROR";

export const BYOK_SKIPPED_STORAGE_KEY = "zypercode_byok_skipped";

export interface CredentialGateResult {
  state: CredentialState;
  keys: ProviderKeys | null;
  errorMessage: string | null;
  saveKey: (providerId: ProviderId, apiKey: string) => Promise<boolean>;
  skip: () => void;
  resetGate: () => void;
}

/**
 * Checks if the user has at least one configured API key in the OS keychain.
 */
export async function checkHasAnyStoredCredential(): Promise<boolean> {
  try {
    const providerKeys = await getAllKeys().catch(() => null);
    if (providerKeys && hasAnyKey(providerKeys)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function hasUserSkippedByok(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(BYOK_SKIPPED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function resetByokSkippedStatus(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BYOK_SKIPPED_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function useCredentialGate(): CredentialGateResult {
  const [state, setState] = useState<CredentialState>("CHECKING");
  const [keys, setKeys] = useState<ProviderKeys | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const evaluateCredentials = useCallback(async () => {
    setState("CHECKING");
    setErrorMessage(null);

    // If previously skipped, enter app directly in limited/offline mode
    if (hasUserSkippedByok()) {
      setState("READY");
      return;
    }

    try {
      const allKeys = await getAllKeys();
      setKeys(allKeys);

      const hasKey = await checkHasAnyStoredCredential();
      if (hasKey) {
        setState("READY");
      } else {
        setState("NO_KEY");
      }
    } catch {
      // If unable to query keychain, check skipped status as fallback
      if (hasUserSkippedByok()) {
        setState("READY");
      } else {
        setState("NO_KEY");
      }
    }
  }, []);

  useEffect(() => {
    void evaluateCredentials();
  }, [evaluateCredentials]);

  const save = useCallback(
    async (providerId: ProviderId, rawKey: string): Promise<boolean> => {
      const trimmed = rawKey.trim();
      if (!trimmed) {
        setErrorMessage("Please enter a valid API key.");
        return false;
      }

      setState("SAVING");
      setErrorMessage(null);

      try {
        // Save to native OS keychain
        await setKey(providerId, trimmed);

        // Clear skipped flag if set
        resetByokSkippedStatus();

        // Update default chat model preference if appropriate
        const matchingModel = MODELS.find((m) => m.provider === providerId);
        if (matchingModel) {
          void setDefaultModel(matchingModel.id);
        }

        // Re-read keys to verify persistence
        const refreshed = await getAllKeys().catch(() => null);
        if (refreshed) setKeys(refreshed);

        setState("READY");
        return true;
      } catch (err: unknown) {
        setState("NO_KEY");
        const msg =
          err instanceof Error
            ? err.message
            : "Could not save your API key to the secure store. Please try again.";
        setErrorMessage(msg);
        return false;
      }
    },
    [],
  );

  const skip = useCallback(() => {
    try {
      localStorage.setItem(BYOK_SKIPPED_STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setState("READY");
  }, []);

  const resetGate = useCallback(() => {
    resetByokSkippedStatus();
    void evaluateCredentials();
  }, [evaluateCredentials]);

  return {
    state,
    keys,
    errorMessage,
    saveKey: save,
    skip,
    resetGate,
  };
}

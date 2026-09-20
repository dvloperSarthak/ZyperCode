import { useEffect, useState } from "react";
import { firePendingReviewForSession } from "@/modules/agents/lib/review";
import { usePreferencesStore } from "@/modules/settings/preferences";
import { onKeysChanged } from "@/modules/settings/store";
import {
  getAllCustomEndpointKeys,
  getAllKeys,
  hasAnyKey,
} from "../lib/keyring";
import {
  MODELS,
  providerNeedsKey,
  isCompatModelId,
  endpointIdFromCompatModel,
  type ProviderId,
} from "../config";
import { useAgentsStore } from "../store/agentsStore";
import { useChatStore } from "../store/chatStore";
import { useSnippetsStore } from "../store/snippetsStore";

const PREFERRED_PROVIDER_MODELS: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  google: "gemini-2.5-flash",
  openrouter: "openrouter-custom",
  mistral: "mistral-large-latest",
  deepseek: "deepseek-v4-flash",
  openai: "gpt-5.4-mini",
  anthropic: "claude-sonnet-4-6",
  xai: "grok-4.3",
  cerebras: "llama3.3-70b",
};

const PROVIDER_ORDER: ProviderId[] = [
  "groq",
  "google",
  "openrouter",
  "mistral",
  "deepseek",
  "openai",
  "anthropic",
  "xai",
  "cerebras",
];

function hasValidKeyForModel(
  modelId: string,
  keys: Partial<Record<string, string | null>>,
  customEndpointKeys: Record<string, string | null>,
): boolean {
  if (!modelId) return false;
  if (isCompatModelId(modelId)) {
    const eid = endpointIdFromCompatModel(modelId);
    return !!customEndpointKeys[eid]?.trim();
  }
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return false;
  if (!providerNeedsKey(model.provider)) return true;
  return !!keys[model.provider]?.trim();
}

function findBestConfiguredModel(
  preferredModelId: string,
  keys: Partial<Record<string, string | null>>,
  customEndpointKeys: Record<string, string | null>,
  customEndpoints: Array<{ id: string; modelId: string }>,
  localConfig: {
    lmstudio: boolean;
    mlx: boolean;
    ollama: boolean;
    openaiCompat: boolean;
  },
): string | null {
  // 1. If preferred model has a valid key or is keyless local, keep it!
  if (hasValidKeyForModel(preferredModelId, keys, customEndpointKeys)) {
    return preferredModelId;
  }

  // 2. Check each provider with a configured non-empty key in our preferred order
  for (const provider of PROVIDER_ORDER) {
    if (keys[provider]?.trim()) {
      const preferred = PREFERRED_PROVIDER_MODELS[provider];
      if (preferred && MODELS.some((m) => m.id === preferred)) {
        return preferred;
      }
      const first = MODELS.find((m) => m.provider === provider);
      if (first) return first.id;
    }
  }

  // 3. Check any other provider key that might be present in keys
  for (const [provider, keyVal] of Object.entries(keys)) {
    if (keyVal?.trim()) {
      const match = MODELS.find((m) => m.provider === provider);
      if (match) return match.id;
    }
  }

  // 4. Check custom endpoints if configured with keys
  for (const ep of customEndpoints) {
    if (customEndpointKeys[ep.id]?.trim() && ep.modelId?.trim()) {
      return `compat-${ep.id}`;
    }
  }

  // 5. Check local models
  if (localConfig.ollama) return "ollama-local";
  if (localConfig.lmstudio) return "lmstudio-local";
  if (localConfig.mlx) return "mlx-local";
  if (localConfig.openaiCompat) return "openai-compatible-custom";

  return null;
}

/**
 * Startup wiring for the AI subsystem: loads provider keys (and keeps them in
 * sync), hydrates the preference store and mirrors the default model, hydrates
 * chat/agents/snippets stores, and fires any pending review for the active
 * session. Returns the two derived flags the shell needs.
 */
export function useAiBootstrap(): {
  hasComposer: boolean;
  keysLoaded: boolean;
} {
  const apiKeys = useChatStore((s) => s.apiKeys);
  const setApiKeys = useChatStore((s) => s.setApiKeys);
  const customEndpointKeys = useChatStore((s) => s.customEndpointKeys);
  const setCustomEndpointKeys = useChatStore((s) => s.setCustomEndpointKeys);
  const setSelectedModelId = useChatStore((s) => s.setSelectedModelId);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const hydrateSessions = useChatStore((s) => s.hydrateSessions);

  useEffect(() => {
    if (activeSessionId) firePendingReviewForSession(activeSessionId);
  }, [activeSessionId]);

  const lmstudioModelId = usePreferencesStore((s) => s.lmstudioModelId);
  const lmstudioBaseURL = usePreferencesStore((s) => s.lmstudioBaseURL);
  const mlxModelId = usePreferencesStore((s) => s.mlxModelId);
  const mlxBaseURL = usePreferencesStore((s) => s.mlxBaseURL);
  const ollamaModelId = usePreferencesStore((s) => s.ollamaModelId);
  const ollamaBaseURL = usePreferencesStore((s) => s.ollamaBaseURL);
  const openaiCompatibleModelId = usePreferencesStore(
    (s) => s.openaiCompatibleModelId,
  );
  const openaiCompatibleBaseURL = usePreferencesStore(
    (s) => s.openaiCompatibleBaseURL,
  );
  const customEndpoints = usePreferencesStore((s) => s.customEndpoints);
  const hasLocalModel =
    (lmstudioBaseURL.trim().length > 0 && lmstudioModelId.trim().length > 0) ||
    (mlxBaseURL.trim().length > 0 && mlxModelId.trim().length > 0) ||
    (ollamaBaseURL.trim().length > 0 && ollamaModelId.trim().length > 0) ||
    (openaiCompatibleBaseURL.trim().length > 0 &&
      openaiCompatibleModelId.trim().length > 0) ||
    customEndpoints.some(
      (e) => e.baseURL.trim().length > 0 && e.modelId.trim().length > 0,
    );
  const hasComposer = hasAnyKey(apiKeys) || hasLocalModel;

  const prefsHydrated = usePreferencesStore((s) => s.hydrated);
  const [keysLoaded, setKeysLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    const reload = () => {
      void getAllKeys().then((keys) => {
        if (!alive) return;
        setApiKeys(keys);
        setKeysLoaded(true);
      });
      if (!prefsHydrated) return;
      void getAllCustomEndpointKeys(
        usePreferencesStore.getState().customEndpoints,
      ).then((epKeys) => {
        if (!alive) return;
        setCustomEndpointKeys(epKeys);
      });
    };
    reload();
    const unlistenP = onKeysChanged(reload);
    return () => {
      alive = false;
      void unlistenP.then((fn) => fn());
    };
  }, [setApiKeys, setCustomEndpointKeys, prefsHydrated]);

  // Hydrate the cross-window preference store and mirror the default model
  // into chatStore so the dropdown reflects what the user picked in Settings.
  const initPrefs = usePreferencesStore((s) => s.init);
  const prefDefaultModel = usePreferencesStore((s) => s.defaultModelId);
  useEffect(() => {
    void initPrefs();
  }, [initPrefs]);

  // Auto-select the AI who's API keys are configured
  useEffect(() => {
    if (!prefsHydrated && !keysLoaded) return;
    const currentModelId = useChatStore.getState().selectedModelId;
    const targetCandidate = prefDefaultModel || currentModelId;

    const bestModel = findBestConfiguredModel(
      targetCandidate,
      apiKeys,
      customEndpointKeys,
      customEndpoints,
      {
        lmstudio:
          lmstudioBaseURL.trim().length > 0 &&
          lmstudioModelId.trim().length > 0,
        mlx: mlxBaseURL.trim().length > 0 && mlxModelId.trim().length > 0,
        ollama:
          ollamaBaseURL.trim().length > 0 &&
          ollamaModelId.trim().length > 0,
        openaiCompat:
          openaiCompatibleBaseURL.trim().length > 0 &&
          openaiCompatibleModelId.trim().length > 0,
      },
    );

    if (bestModel) {
      if (!hasValidKeyForModel(currentModelId, apiKeys, customEndpointKeys)) {
        setSelectedModelId(bestModel);
      } else if (
        hasValidKeyForModel(prefDefaultModel, apiKeys, customEndpointKeys) &&
        currentModelId !== prefDefaultModel
      ) {
        setSelectedModelId(prefDefaultModel);
      }
    }
  }, [
    prefsHydrated,
    keysLoaded,
    prefDefaultModel,
    apiKeys,
    customEndpointKeys,
    customEndpoints,
    lmstudioBaseURL,
    lmstudioModelId,
    mlxBaseURL,
    mlxModelId,
    ollamaBaseURL,
    ollamaModelId,
    openaiCompatibleBaseURL,
    openaiCompatibleModelId,
    setSelectedModelId,
  ]);

  useEffect(() => {
    void hydrateSessions();
    void useAgentsStore.getState().hydrate();
    void useSnippetsStore.getState().hydrate();
  }, [hydrateSessions]);

  return { hasComposer, keysLoaded };
}

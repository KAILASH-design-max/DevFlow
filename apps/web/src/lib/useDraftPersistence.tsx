"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Check, CloudOff, FileEdit } from "lucide-react";

export type SaveState = "idle" | "draft_saved" | "saving_to_server" | "saved_to_server" | "error";

interface UseDraftPersistenceOptions<T> {
  key: string;
  initialValues: T;
  debounceMs?: number;
}

/**
 * Hook to automatically preserve form state across network failures and accidental tab closures.
 * Drafts are kept locally in localStorage until successfully confirmed by the server.
 * NEVER use this hook for passwords, tokens, or OTP codes.
 */
export function useDraftPersistence<T extends Record<string, any>>({
  key,
  initialValues,
  debounceMs = 400,
}: UseDraftPersistenceOptions<T>) {
  const storageKey = `devflow_draft_${key}`;
  const [values, setValues] = useState<T>(initialValues);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load draft on mount if available
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setValues((prev) => ({ ...prev, ...parsed }));
          setSaveState("draft_saved");
          setLastSavedTime(new Date());
        }
      }
    } catch (e) {
      console.warn("Failed to restore form draft:", e);
    } finally {
      setIsDraftLoaded(true);
    }
  }, [storageKey]);

  // Debounced save to localStorage
  const saveDraft = useCallback(
    (newValues: T) => {
      setValues(newValues);
      if (typeof window === "undefined") return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newValues));
          setSaveState("draft_saved");
          setLastSavedTime(new Date());
        } catch (e) {
          console.warn("Failed to write form draft:", e);
        }
      }, debounceMs);
    },
    [storageKey, debounceMs]
  );

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value };
        saveDraft(updated);
        return updated;
      });
    },
    [saveDraft]
  );

  /**
   * Clear local draft once the backend confirms the operation succeeded
   */
  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    setSaveState("saved_to_server");
    setTimeout(() => setSaveState("idle"), 3000);
  }, [storageKey]);

  return {
    values,
    setValues,
    updateField,
    saveDraft,
    clearDraft,
    saveState,
    setSaveState,
    lastSavedTime,
    isDraftLoaded,
  };
}

/**
 * Visual indicator informing the user about the preservation state of their work.
 * Clearly differentiates between "Draft saved locally" and "Saved to DevFlow server".
 */
export function DraftIndicator({
  saveState,
  isOffline = false,
  className = "",
}: {
  saveState: SaveState;
  isOffline?: boolean;
  className?: string;
}) {
  if (saveState === "idle" && !isOffline) {
    return null;
  }

  if (isOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs text-amber-400/90 font-medium ${className}`}
      >
        <CloudOff className="w-3.5 h-3.5 shrink-0" />
        <span>Offline — draft preserved locally</span>
      </div>
    );
  }

  if (saveState === "draft_saved") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs text-slate-400 font-medium ${className}`}
      >
        <FileEdit className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
        <span>Draft saved locally</span>
      </div>
    );
  }

  if (saveState === "saving_to_server") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs text-indigo-400 font-medium ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping inline-block" />
        <span>Saving to server...</span>
      </div>
    );
  }

  if (saveState === "saved_to_server") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 text-xs text-emerald-400 font-medium ${className}`}
      >
        <Check className="w-3.5 h-3.5 shrink-0" />
        <span>Saved to DevFlow server</span>
      </div>
    );
  }

  return null;
}

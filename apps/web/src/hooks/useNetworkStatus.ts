/**
 * useNetworkStatus — Convenience hook for reading network state.
 *
 * Re-exports the hook from NetworkContext so consumers only need
 * to import from "@/hooks/useNetworkStatus" instead of the context.
 *
 * Usage:
 *   const { isOnline, isOffline, isSlow, checkConnection } = useNetworkStatus();
 */

export {
  useNetworkStatus,
  NetworkStatusBanner,
  OfflineModal,
} from "../context/NetworkContext";

export type { NetworkState } from "../context/NetworkContext";

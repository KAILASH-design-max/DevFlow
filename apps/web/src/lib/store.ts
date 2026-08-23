import { create } from "zustand";

interface UiState {
  isCreateIssueOpen: boolean;
  defaultStatus: string;
  openCreateIssue: (initialStatus?: string) => void;
  closeCreateIssue: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isCreateIssueOpen: false,
  defaultStatus: "BACKLOG",
  openCreateIssue: (initialStatus = "BACKLOG") =>
    set({ isCreateIssueOpen: true, defaultStatus: initialStatus }),
  closeCreateIssue: () =>
    set({ isCreateIssueOpen: false }),
}));

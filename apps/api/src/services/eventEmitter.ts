import { EventEmitter } from "events";

export interface DomainEvents {
  "issue.created": {
    issueId: string;
    projectId: string;
    userId: string;
    title: string;
    assigneeId?: string | null;
  };
  "issue.updated": {
    issueId: string;
    projectId: string;
    userId: string;
    changes: Record<string, any>;
  };
  "issue.status_changed": {
    issueId: string;
    projectId: string;
    userId: string;
    oldStatus: string;
    newStatus: string;
  };
  "comment.created": {
    commentId: string;
    issueId: string;
    userId: string;
    content: string;
  };
  "sprint.started": {
    sprintId: string;
    projectId: string;
    userId: string;
    name: string;
  };
  "sprint.completed": {
    sprintId: string;
    projectId: string;
    userId: string;
    name: string;
  };
  "webhook.pr_processed": {
    repositoryId: string;
    prNumber: number;
    action: string;
    issueIds: string[];
  };
  "webhook.status_transition": {
    issueId: string;
    projectId: string;
    oldStatus: string;
    newStatus: string;
    prNumber: number;
    prUrl: string;
    trigger: string; // e.g. "pr_opened", "pr_merged", "pr_closed"
  };
}

class AppEventEmitter extends EventEmitter {
  emitEvent<K extends keyof DomainEvents>(event: K, data: DomainEvents[K]): boolean {
    return this.emit(event, data);
  }

  onEvent<K extends keyof DomainEvents>(event: K, listener: (data: DomainEvents[K]) => void): this {
    return this.on(event, listener);
  }
}

export const eventBus = new AppEventEmitter();

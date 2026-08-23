# DevFlow CLI

Terminal tooling for developers to create issues, view branch commands, and inspect logs.

## Installation

```bash
pnpm install
pnpm --filter @devflow/cli run build
node apps/cli/dist/index.js --help
```

## Quick Start

```bash
devflow config set-url http://localhost:4000
devflow auth login
devflow config set-project <project-uuid>
devflow status
```

## Commands

| Command | Description |
|---|---|
| `devflow auth login` | Interactive login |
| `devflow auth logout` | Clear credentials |
| `devflow auth whoami` | Show current user |
| `devflow config set-url <url>` | Set API base URL |
| `devflow config show` | Show all config |
| `devflow issues list` | List issues |
| `devflow issues list --status IN_PROGRESS` | Filter by status |
| `devflow issues view PHX-42` | View issue details |
| `devflow issues create` | Interactive issue creation |
| `devflow issues move PHX-42 DONE` | Move issue status |
| `devflow branch suggest PHX-42` | Get branch name + git checkout cmd |
| `devflow branch conventions` | Show naming conventions |
| `devflow prs list` | List open PRs |
| `devflow prs view 123 --open` | View PR + open in browser |
| `devflow sprint current` | Active sprint with progress bar |
| `devflow logs audit` | View audit logs |
| `devflow logs activity PHX-42` | Issue activity feed |
| `devflow logs webhook` | Recent webhook events |
| `devflow status` | API health check with latency |

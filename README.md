# @aker/ai-monitor-sdk

The complete AI-Powered Monitoring Solution. This repository contains the core monitoring logic, notification providers, and auto-instrumentation packages.

## 📦 Modules

1.  **[@aker/ai-monitor-core](./packages/ai-monitor-core)** - The brain (AI logic, Monitor class).
2.  **[@aker/ai-monitor-notifiers](./packages/ai-monitor-notifiers)** - Connectors for Telegram, Slack, Email.
3.  **[@aker/ai-monitor-instrumentation](./packages/ai-monitor-instrumentation)** - Plug-and-play auto-monitoring (Golden Signals).

## 🚀 Usage

### Installation

```bash
pnpm install
```

### Development

This is a monorepo managed by `pnpm`.

```bash
# Build all packages
pnpm run build

# Run tests
pnpm run test
```

### Publishing to GitHub/NPM

1.  Initialize git:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Create a repo on GitHub (e.g., `my-org/ai-monitor-sdk`).
3.  Push:
    ```bash
    git remote add origin https://github.com/my-org/ai-monitor-sdk.git
    git push -u origin main
    ```

## 💡 Examples

Check the [examples directory](./examples) for usage patterns.

- **[Standalone Service](./examples/standalone-service)**: How to run the monitor as a separate microservice.

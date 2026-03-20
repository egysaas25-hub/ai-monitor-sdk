# Deployment Guide

How to update and use the `@momen124/ai-monitor-sdk` on your server.

Choose the scenario that matches your setup:

---

## Scenario A: Manual Pull & Build (Recommended for Monorepo/Local Link)

**Use this if:** You have cloned the `ai-monitor-sdk` repo on the server and are linking it to your app (e.g. `npm link` or workspace).

1.  **Navigate to SDK Directory:**

    ```bash
    cd /path/to/ai-monitor-sdk
    ```

2.  **Pull Latest Changes:**

    ```bash
    git pull origin main
    ```

3.  **Install Dependencies & Build:**
    âš ï¸ **Critical Step:** You typically invoke the SDK's build script to generate the `.js` files in `dist/`.

    ```bash
    # using pnpm (recommended)
    pnpm install
    pnpm run build

    # OR using npm
    npm install
    npm run build
    ```

4.  **Restart Your Application:**
    Your application needs to reload the new code.
    ```bash
    pm2 restart all
    # or
    docker restart my-app
    ```

---

## Scenario B: Git Dependency (package.json)

**Use this if:** Your application's `package.json` points directly to the GitHub URL.
Example: `"@momen124/ai-monitor-core": "github:AKER-LINK/ai-monitor-sdk#main"`

1.  **Update Lockfile & Reinstall:**
    Running install will fetch the latest commit from the branch.

    ```bash
    cd /path/to/your-app

    # Force upgrade the package from git
    npm update @momen124/ai-monitor-core @momen124/ai-monitor-notifiers @momen124/ai-monitor-instrumentation

    # OR remove and re-add to force fetch
    npm uninstall @momen124/ai-monitor-core
    npm install github:AKER-LINK/ai-monitor-sdk#main
    ```

2.  **Rebuild Your App:**
    ```bash
    npm run build
    pm2 restart all
    ```

_Note: This method requires the SDK repo to have a `prepare` script or compiled files committed (which we don't usually do). **Scenario A is preferred** unless you set up a build pipeline._

---

## Scenario C: Private NPM Registry (Verdaccio / GitHub Packages)

**Use this if:** You publish the SDK to a registry.

1.  **Publish (from your local machine):**

    ```bash
    # Bump version
    npm version patch

    # Build & Publish
    pnpm run build
    pnpm publish -r
    ```

2.  **Update on Server:**
    ```bash
    cd /path/to/your-app
    npm install @momen124/ai-monitor-core@latest
    pm2 restart all
    ```

---

## ðŸ” Troubleshooting

**"Cannot find module..."**

- Did you run `pnpm run build` in the SDK folder? The `dist/` folder must exist.
- Check `package.json` `main` field points to `dist/index.js`.

**"Class not found (e.g. DiscordNotifier)"**

- You might be running the _old_ cached version.
- Restart your application process (Node.js caches required modules in memory).

**"Lint/Format Errors during Build"**

- Run `pnpm lint:fix` to auto-correct style issues before building.

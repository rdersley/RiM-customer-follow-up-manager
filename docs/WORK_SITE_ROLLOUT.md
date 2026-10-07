# Rolling out to the Retail inMotion sites

Retail inMotion Customer Follow-Up Manager is its own Forge app, so a site that ran the
Marketplace app moves over once.

## One-off setup

1. Add the repository secrets `FORGE_EMAIL` and `FORGE_API_TOKEN`.
2. Actions → **Register Forge app** → Run (with the Developer Space id if the run asks for one). It
   registers this app with Forge and commits the new app id to `manifest.yml`.

## Work site (retailinmotion.atlassian.net)

1. In the old app, open any JSM project's **Project settings → Apps → Follow-Up Manager →
   Backup & restore** (Jira admins only) and **Download backup**. The file holds every project's
   rules, the follow-up cycles in progress and the run history.
2. Actions → **Deploy to Retail inMotion work site** (type `DEPLOY`). It deploys the Forge
   `production` environment.
3. Both apps react to ticket updates and comments, so uninstall the old app (Manage apps) straight
   after taking the backup, before restoring, so no ticket gets two follow-ups.
4. In the new app's **Backup & restore** tab: choose the file → **Restore this backup**, then reload
   and check a project's rules and Run history.

Follow-up cycles carry on from the restored state: the hourly job picks up where the old app left
off.

## Sandbox (retailinmotion-sandbox1.atlassian.net)

The same steps; commits with `[deploy-development]` in the message deploy the Forge `development`
environment to the sandbox.

# model-lock

Keeps Claude Code on **Opus 5.5, Sonnet 5.5 and Haiku 5.5**.

- **Blocks model switches** (`/model`, the picker, SDK `set_model`) to anything outside the 5.5 family.
- **Checks each device at session start** for the managed-settings allowlist in [`policy/managed-settings.json`](policy/managed-settings.json). If it's missing or out of date, the transcript shows the one command that installs it.

The plugin hook can't stop a subagent that picks its own model, or Claude Code's background helper calls. The managed-settings file does, so install it on every device.

## Install

At the prompt of a terminal session:

```
/plugin install model-lock --marketplace Wyvest/model-lock
```

From a shell:

```bash
claude plugin install model-lock --marketplace Wyvest/model-lock
```

Answer `y` to add the marketplace, then pick the **user** scope. In the desktop app, where `/plugin` doesn't run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `Wyvest/model-lock`, then **Add plugin**.

If the repository is private, the machine needs a git credential for github.com (an SSH key, or `gh auth login` then `gh auth setup-git`). The install never asks for one.

## Install the managed settings (once per device)

The session-start warning prints this with the real path. From the plugin folder:

macOS / Linux:

```bash
sudo sh install.sh
```

Windows, from an elevated PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File install.ps1
```

Both merge into an existing `managed-settings.json`, keep its other keys, and save a `.bak` copy first. Restart Claude Code afterwards.

| OS | Path |
| --- | --- |
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

## Changing the allowlist

Edit `policy/managed-settings.json` and push. The start-up check and both installers read that file, so they all pick up the change. Each device then warns until its installer is run again.

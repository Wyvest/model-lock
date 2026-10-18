import type { Register } from 'claude-code'

// The 5.5 family, in any spelling: dated, -fast, [1m], or a provider-prefixed id.
const ALLOWED = /claude-(opus|sonnet|haiku)-5-5(?!\d)/

const MANAGED = {
  mac: '/Library/Application Support/ClaudeCode/managed-settings.json',
  linux: '/etc/claude-code/managed-settings.json',
  windows: 'C:\\Program Files\\ClaudeCode\\managed-settings.json',
}

// Arrays compare as sets: order in the installed file doesn't matter.
const normalize = (v: unknown) => JSON.stringify(Array.isArray(v) ? [...v].sort() : v)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const os = (await $.env.get('OS')) === 'Windows_NT'
      ? 'windows'
      : (await $.fs.exists('/System/Library/CoreServices')) ? 'mac' : 'linux'
    const policy = JSON.parse(await $.fs.read(`${$.plugin.root}/policy/managed-settings.json`))
    const installed = await $.fs.read(MANAGED[os]).then(JSON.parse).catch(() => undefined)
    const missing = Object.keys(policy).filter(k => normalize(installed?.[k]) !== normalize(policy[k]))

    if (missing.length > 0) {
      const command = os === 'windows'
        ? `powershell -ExecutionPolicy Bypass -File "${$.plugin.root}\\install.ps1"   (from an admin PowerShell)`
        : `sudo sh "${$.plugin.root}/install.sh"`
      $.ui.log(
        `model-lock: this device's managed settings ${installed ? `are missing ${missing.join(', ')}` : 'are not installed'}, ` +
        `so non-5.5 models can still be used. Fix: ${command}, then restart Claude Code.`,
      )
    }
    return next(e)
  })

  on('classic.PreModelSwitch', ($, e, next) =>
    ALLOWED.test(e.to_model)
      ? next(e)
      : {
          permissionDecision: 'deny',
          permissionDecisionReason: `model-lock: only Opus 5.5, Sonnet 5.5 and Haiku 5.5 are allowed (asked for ${e.to_model}).`,
        },
  )
}

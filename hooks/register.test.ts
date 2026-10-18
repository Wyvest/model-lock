import { test, expect, mock } from 'claude-code/testing'

const MAC = '/Library/Application Support/ClaudeCode/managed-settings.json'
const POLICY = {
  availableModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
  enforceAvailableModels: true,
  deniedModels: ['fable', 'claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4'],
}

const sw = (to_model: string) => ({
  from_model: 'claude-opus-5-5',
  to_model,
  requested_model: to_model,
  source: 'command' as const,
  context_tokens: 0,
  prompt_cache_warm: false,
  cache_ttl: '5m' as const,
})

test('denies switches outside the 5.5 family', async ($, on) => {
  on('classic.PreModelSwitch', () => ({}))
  for (const ok of ['claude-sonnet-5-5', 'claude-haiku-5-5-20260601', 'claude-opus-5-5[1m]', 'us.anthropic.claude-opus-5-5-v1:0']) {
    expect((await $.classic.PreModelSwitch(sw(ok))).permissionDecision).toBe(undefined)
  }
  for (const bad of ['claude-fable-5-1', 'claude-opus-5', 'claude-opus-4-8', 'claude-sonnet-5-55']) {
    expect((await $.classic.PreModelSwitch(sw(bad))).permissionDecision).toBe('deny')
  }
})

const start = (name: string, installed: unknown) => {
  const logs: string[] = []
  test(`session.start: ${name}`, async ($, on) => {
    mock.env(on, {})
    on('fs.exists', ($, e) => ({ value: e.path === '/System/Library/CoreServices' }))
    on('fs.read', ($, e) => {
      if (e.path.endsWith('/policy/managed-settings.json')) return { value: JSON.stringify(POLICY) }
      if (e.path === MAC && installed !== undefined) return { value: JSON.stringify(installed) }
      throw new Error('ENOENT')
    })
    on('ui.log', ($, e) => { logs.push(e.text); return { value: undefined } })
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
    if (installed === undefined) expect(logs.join()).toContain('are not installed')
    else if ((installed as typeof POLICY).enforceAvailableModels) expect(logs).toEqual([])
    else expect(logs.join()).toContain('missing enforceAvailableModels')
  })
}

start('no file', undefined)
start('complete, reordered, extra key', { ...POLICY, availableModels: [...POLICY.availableModels].reverse(), otherKey: 1 })
start('missing a key', { ...POLICY, enforceAvailableModels: undefined })

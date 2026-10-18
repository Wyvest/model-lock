# Installs policy\managed-settings.json as Claude Code managed settings (Windows).
# Run from an elevated PowerShell. Keys already in an existing managed-settings.json are kept.
$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw 'Run this from an elevated (Run as administrator) PowerShell.' }

$src = Join-Path $PSScriptRoot 'policy\managed-settings.json'
$dir = 'C:\Program Files\ClaudeCode'
$dst = Join-Path $dir 'managed-settings.json'

$policy = Get-Content $src -Raw | ConvertFrom-Json
if (Test-Path $dst) {
  Copy-Item $dst "$dst.bak" -Force
  $current = Get-Content $dst -Raw | ConvertFrom-Json
  foreach ($p in $policy.PSObject.Properties) {
    $current | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
  }
  $policy = $current
}
New-Item -ItemType Directory -Force $dir | Out-Null
$policy | ConvertTo-Json -Depth 20 | Set-Content $dst -Encoding UTF8
Write-Host "Installed $dst. Restart Claude Code to apply."

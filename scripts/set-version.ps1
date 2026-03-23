param(
  [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Default version if -Version is not provided.
$TargetVersion = if ($PSBoundParameters.ContainsKey("Version")) {
  $Version
} else {
  "1.0.3"
}

if ($TargetVersion -notmatch '^\d+\.\d+\.\d+$') {
  throw "Invalid version format. Use X.Y.Z"
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Update-VersionLine {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$VersionLinePattern,
    [Parameter(Mandatory = $true)][scriptblock]$InsertFallback
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "File not found: $Path"
  }

  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  $rx = [regex]::new($VersionLinePattern, [Text.RegularExpressions.RegexOptions]::Multiline)

  if ($rx.IsMatch($raw)) {
    $updated = $rx.Replace($raw, {
      param($m)
      return $m.Groups[1].Value + $TargetVersion + $m.Groups[3].Value
    }, 1)
  } else {
    $updated = & $InsertFallback $raw
  }

  if ($updated -eq $raw) {
    Write-Warning "No changes in $Label"
    return
  }

  Write-Utf8NoBom -Path $Path -Content $updated
  Write-Host "Updated $Label"
}

$packageJson = Join-Path $repoRoot "package.json"
$appMetaJson = Join-Path $repoRoot "src/data/app-meta.json"
$appHtml = Join-Path $repoRoot "src/app.html"
$readme = Join-Path $repoRoot "README.md"

# 1) package.json
Update-VersionLine `
  -Path $packageJson `
  -Label "package.json" `
  -VersionLinePattern '^(\s*"version"\s*:\s*")(\d+\.\d+\.\d+)("\s*,\s*)$' `
  -InsertFallback {
    param($raw)
    return [regex]::Replace(
      $raw,
      '^(\s*"name"\s*:\s*"[^"]+"\s*,\s*)$',
      ('$1' + "`r`n" + '    "version": "' + $TargetVersion + '",'),
      [Text.RegularExpressions.RegexOptions]::Multiline,
      [TimeSpan]::FromSeconds(1)
    )
  }

# 2) src/data/app-meta.json
Update-VersionLine `
  -Path $appMetaJson `
  -Label "src/data/app-meta.json" `
  -VersionLinePattern '^(\s*"version"\s*:\s*")(\d+\.\d+\.\d+)("\s*,\s*)$' `
  -InsertFallback {
    param($raw)
    return [regex]::Replace(
      $raw,
      '^(\s*"description"\s*:\s*\{[\s\S]*?\}\s*,\s*)$',
      ('$1' + "`r`n" + '    "version": "' + $TargetVersion + '",'),
      [Text.RegularExpressions.RegexOptions]::Multiline,
      [TimeSpan]::FromSeconds(1)
    )
  }

# 3) src/app.html footer text
if (Test-Path -LiteralPath $appHtml) {
  $raw = Get-Content -LiteralPath $appHtml -Raw -Encoding UTF8
  $updated = [regex]::Replace(
    $raw,
    '(<small\s+id="app-footer-text">[^<]*v)\d+\.\d+\.\d+(</small>)',
    {
      param($m)
      return $m.Groups[1].Value + $TargetVersion + $m.Groups[2].Value
    },
    [Text.RegularExpressions.RegexOptions]::None,
    [TimeSpan]::FromSeconds(1)
  )
  if ($updated -eq $raw) {
    Write-Warning "No changes in src/app.html"
  } else {
    Write-Utf8NoBom -Path $appHtml -Content $updated
    Write-Host "Updated src/app.html"
  }
}

# 4) README version line
if (Test-Path -LiteralPath $readme) {
  $raw = Get-Content -LiteralPath $readme -Raw -Encoding UTF8
  $readmePrefix = [regex]::Escape("**Current app version: **")
  $readmeSuffix = [regex]::Escape("**.")
  $readmeVersionPattern = "($readmePrefix)\d+\.\d+\.\d+($readmeSuffix)"
  $updated = [regex]::Replace(
    $raw,
    $readmeVersionPattern,
    {
      param($m)
      return $m.Groups[1].Value + $TargetVersion + $m.Groups[2].Value
    },
    [Text.RegularExpressions.RegexOptions]::None,
    [TimeSpan]::FromSeconds(1)
  )
  if ($updated -eq $raw) {
    Write-Warning "No changes in README.md"
  } else {
    Write-Utf8NoBom -Path $readme -Content $updated
    Write-Host "Updated README.md"
  }
}

Write-Host ""
Write-Host "Done. Version set to $TargetVersion"

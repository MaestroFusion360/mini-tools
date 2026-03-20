#!/usr/bin/env pwsh

[CmdletBinding()]
param(
  [string]$OutputFile = "git_rep.txt"
)

$ErrorActionPreference = "Stop"

# Resolve repository root as parent of this script directory.
$scriptDir = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

$targets = @("README.md")
if (Test-Path "src") {
  $targets += Get-ChildItem -Path "src" -Recurse -File | ForEach-Object { $_.FullName }
}

$reportRows = @()
$total = 0

foreach ($path in $targets) {
  if (-not (Test-Path $path)) { continue }

  $lines = (Get-Content -Path $path -ErrorAction Stop | Measure-Object -Line).Lines
  $relative = Resolve-Path -Relative $path
  $reportRows += [pscustomobject]@{
    Lines = [int]$lines
    Path  = $relative
  }
  $total += [int]$lines
}

$sorted = $reportRows | Sort-Object -Property Lines

$outPath = if ([System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile
} else {
  Join-Path $repoRoot $OutputFile
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$linesOut = @()
foreach ($row in $sorted) {
  $linesOut += "$($row.Lines)`t$($row.Path)"
}
$linesOut += "TOTAL`t$total"

[System.IO.File]::WriteAllLines($outPath, $linesOut, $utf8NoBom)
Write-Host "Report saved: $outPath"
Write-Host "Files counted: $($sorted.Count); total lines: $total"

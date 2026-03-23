Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$exts = @(".cs", ".json", ".md")
$defaultExcludedDirs = @(".git", ".vs", "vs", "bin", "obj")

function Get-GitignoreDirRules {
    param(
        [Parameter(Mandatory = $true)][string]$GitignorePath
    )

    if (-not (Test-Path -LiteralPath $GitignorePath)) {
        return @()
    }

    $rules = New-Object System.Collections.Generic.List[string]

    foreach ($line in Get-Content -LiteralPath $GitignorePath -Encoding UTF8) {
        $rule = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($rule)) { continue }
        if ($rule.StartsWith("#")) { continue }
        if ($rule.StartsWith("!")) { continue } # negation not handled in this script

        # Directory-only patterns are enough for our traversal filter.
        # Skip complex glob patterns for simplicity and predictability.
        if ($rule -match "[\*\?\[\]]") { continue }

        $rule = $rule.TrimStart("/")
        $rule = $rule.TrimEnd("/")
        if ([string]::IsNullOrWhiteSpace($rule)) { continue }

        $rules.Add($rule.Replace("\", "/"))
    }

    return $rules
}

function ShouldSkipFileByDir {
    param(
        [Parameter(Mandatory = $true)][System.IO.FileInfo]$File,
        [Parameter(Mandatory = $true)][string]$RootPath,
        [Parameter(Mandatory = $true)][string[]]$IgnoredDirs
    )

    $rootUri = New-Object System.Uri(($RootPath.TrimEnd("\", "/") + "/"))
    $dirUri = New-Object System.Uri(($File.DirectoryName.TrimEnd("\", "/") + "/"))
    $relativeDir = [System.Uri]::UnescapeDataString($rootUri.MakeRelativeUri($dirUri).ToString()).Replace("\", "/").TrimEnd("/")
    if ($relativeDir -eq ".") { $relativeDir = "" }

    $segments = @()
    if ($relativeDir) {
        $segments = $relativeDir.Split("/")
    }

    foreach ($rule in $IgnoredDirs) {
        if ($rule -match "/") {
            if ($relativeDir -eq $rule -or $relativeDir.StartsWith("$rule/")) {
                return $true
            }
            continue
        }

        foreach ($segment in $segments) {
            if ($segment -eq $rule) {
                return $true
            }
        }
    }

    return $false
}

$gitignorePath = Join-Path $root ".gitignore"
$gitignoreDirRules = Get-GitignoreDirRules -GitignorePath $gitignorePath
$ignoredDirs = @($defaultExcludedDirs + $gitignoreDirRules | Select-Object -Unique)

$results = @()
Get-ChildItem -Path $root -Recurse -File |
Where-Object { $exts -contains $_.Extension.ToLowerInvariant() } |
ForEach-Object {
    if (ShouldSkipFileByDir -File $_ -RootPath $root -IgnoredDirs $ignoredDirs) {
        return
    }

    try {
        $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
        if (
            $bytes.Length -ge 3 -and
            $bytes[0] -eq 0xEF -and
            $bytes[1] -eq 0xBB -and
            $bytes[2] -eq 0xBF
        ) {
            $results += $_.FullName
        }
    }
    catch {
        # Ignore unreadable files and continue scan.
    }
}

$results | ForEach-Object { $_ }

if (-not $results) {
    Write-Host "No UTF-8 BOM files found."
}

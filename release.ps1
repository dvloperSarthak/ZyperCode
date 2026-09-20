param (
    [string]$Version = "",
    [string]$Notes = "ZyperCode automatic update with latest improvements and bug fixes.",
    [switch]$SkipBuild,
    [switch]$NoGit
)

& "$PSScriptRoot\scripts\auto-push-update.ps1" -Version $Version -Notes $Notes -SkipBuild:$SkipBuild -NoGit:$NoGit

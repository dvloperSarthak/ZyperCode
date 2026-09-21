# ZyperCode Auto-Push-Update Pipeline
# Automates: Version Increment -> Tauri Build -> Portable NSIS Packaging -> latest.json Manifest -> Final Exe Refresh -> Git/GitHub Release

param (
    [string]$Version = "",
    [string]$Notes = "ZyperCode automatic update with latest improvements and bug fixes.",
    [switch]$SkipBuild,
    [switch]$NoGit
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ProjectDir = Join-Path $Root "terax-ai-main"
$FinalDir = Join-Path $Root "Final exe's"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   ZYPERCODE AUTO-PUSH-UPDATE PIPELINE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Resolve / Increment Version
$PackageJsonPath = Join-Path $ProjectDir "package.json"
$Pkg = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
$CurrentVersion = $Pkg.version

if ([string]::IsNullOrWhiteSpace($Version)) {
    $parts = $CurrentVersion.Split(".")
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2] + 1
    $TargetVersion = "$major.$minor.$patch"
    Write-Host "[+] Auto-incrementing version: $CurrentVersion -> $TargetVersion" -ForegroundColor Green
} else {
    $TargetVersion = $Version.TrimStart("v")
    Write-Host "[+] Setting specified version: $TargetVersion" -ForegroundColor Green
}

# 2. Synchronize Version across configurations
Write-Host "[+] Syncing version $TargetVersion across project files..." -ForegroundColor Yellow

# Update terax-ai-main/package.json
$Pkg.version = $TargetVersion
$Pkg | ConvertTo-Json -Depth 10 | Set-Content $PackageJsonPath

# Update tauri.conf.json
$TauriConfPath = Join-Path $ProjectDir "src-tauri\tauri.conf.json"
if (Test-Path $TauriConfPath) {
    $TauriConf = Get-Content $TauriConfPath -Raw | ConvertFrom-Json
    $TauriConf.version = $TargetVersion
    $TauriConf | ConvertTo-Json -Depth 10 | Set-Content $TauriConfPath
}

# Update Cargo.toml (only package version and workspace.package version)
$CargoTomlPath = Join-Path $ProjectDir "src-tauri\Cargo.toml"
if (Test-Path $CargoTomlPath) {
    $cargoContent = Get-Content $CargoTomlPath -Raw
    $cargoContent = $cargoContent -replace '(?m)(^\[package\][\s\S]*?^version\s*=\s*)"[^"]+"', "`$1`"$TargetVersion`""
    $cargoContent = $cargoContent -replace '(?m)(^\[workspace\.package\][\s\S]*?^version\s*=\s*)"[^"]+"', "`$1`"$TargetVersion`""
    Set-Content -Path $CargoTomlPath -Value $cargoContent
}

# 3. Build Windows Executable
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[+] Building ZyperCode v$TargetVersion with Tauri (target: x86_64-pc-windows-gnu)..." -ForegroundColor Cyan
    Push-Location $ProjectDir
    try {
        $env:RUST_MIN_STACK = "67108864"
        pnpm run release:windows
        if ($LASTEXITCODE -ne 0) {
            throw "Tauri build failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host ""
    Write-Host "[!] Skipping build step as requested (-SkipBuild)." -ForegroundColor Yellow
}

# 4. Refresh Deliverables in Final exe's
if (-not (Test-Path $FinalDir)) {
    New-Item -ItemType Directory -Path $FinalDir | Out-Null
}

$TauriInstaller = Join-Path $ProjectDir "src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis\ZyperCode_${TargetVersion}_x64-setup.exe"
if (-not (Test-Path $TauriInstaller)) {
    $TauriInstaller = (Get-ChildItem -Path (Join-Path $ProjectDir "src-tauri\target\x86_64-pc-windows-gnu\release\bundle\nsis") -Filter "*setup.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
}

$FinalInstaller = Join-Path $FinalDir "zypercode-v${TargetVersion}-beta-installer.exe"
$LegacyInstaller = Join-Path $FinalDir "zypecode-v${TargetVersion}-beta-installer.exe"
if ($TauriInstaller -and (Test-Path $TauriInstaller)) {
    Copy-Item -Path $TauriInstaller -Destination $FinalInstaller -Force
    Copy-Item -Path $TauriInstaller -Destination $LegacyInstaller -Force
    Write-Host "[+] Created installer: $FinalInstaller" -ForegroundColor Green
}

# 5. Compile Standalone Portable Launcher
$MakensisPath = "C:\Users\Sarvadnya\AppData\Local\tauri\NSIS\Bin\makensis.exe"
if (-not (Test-Path $MakensisPath)) {
    $cmd = Get-Command makensis -ErrorAction SilentlyContinue
    if ($cmd) { $MakensisPath = $cmd.Source }
}

$NsiFile = Join-Path $Root "portable-launcher.nsi"
$FinalStandalone = Join-Path $FinalDir "zypercode-v${TargetVersion}-beta-standalone.exe"
$LegacyStandalone = Join-Path $FinalDir "zypecode-v${TargetVersion}-beta-standalone.exe"

if ((Test-Path $MakensisPath) -and (Test-Path $NsiFile)) {
    Write-Host "[+] Compiling single-file standalone executable with NSIS LZMA..." -ForegroundColor Cyan
    & $MakensisPath "/DOUTFILE=$FinalStandalone" $NsiFile | Out-Null
    Copy-Item -Path $FinalStandalone -Destination $LegacyStandalone -Force
    Write-Host "[+] Created standalone: $FinalStandalone" -ForegroundColor Green
}

# 6. Generate update manifest (latest.json)
Write-Host "[+] Generating latest.json update manifest..." -ForegroundColor Cyan
$DateStr = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$Manifest = @{
    version = $TargetVersion
    notes = $Notes
    pub_date = $DateStr
    platforms = @{
        "windows-x86_64" = @{
            signature = ""
            url = "https://github.com/dvloperSarthak/ZyperCode/releases/download/v${TargetVersion}/zypercode-v${TargetVersion}-beta-installer.exe"
        }
    }
}

$ManifestPath = Join-Path $FinalDir "latest.json"
$Manifest | ConvertTo-Json -Depth 5 | Set-Content $ManifestPath
Write-Host "[+] Update manifest written to: $ManifestPath" -ForegroundColor Green

# 7. Git Commit & GitHub Release (Auto Push Update)
if (-not $NoGit) {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        if (Test-Path "C:\Program Files\Git\cmd\git.exe") {
            $env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
        } elseif (Test-Path "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe") {
            $env:PATH = "$env:LOCALAPPDATA\Programs\Git\cmd;" + $env:PATH
        }
    }
    $hasGit = Get-Command git -ErrorAction SilentlyContinue
    $hasGh = Get-Command gh -ErrorAction SilentlyContinue
    
    if ($hasGit) {
        Write-Host ""
        Write-Host "[+] Git detected. Staging and committing release v$TargetVersion..." -ForegroundColor Cyan
        git add .
        git commit -m "release: v$TargetVersion - auto push update"
        git tag -a "v$TargetVersion" -m "ZyperCode Release v$TargetVersion" -f
        
        $remotes = git remote
            Write-Host "[+] Pushing to Git remote (main) with tags..." -ForegroundColor Cyan
            git push origin main --tags
        
        if ($hasGh) {
            Write-Host "[+] GitHub CLI detected. Publishing GitHub Release..." -ForegroundColor Cyan
            gh release create "v$TargetVersion" $FinalInstaller $FinalStandalone $ManifestPath --title "ZyperCode v$TargetVersion" --notes "$Notes"
            Write-Host "[OK] GitHub Release published successfully! All users will automatically receive this update." -ForegroundColor Green
        } else {
            Write-Host "[i] Tip: Install GitHub CLI (gh) to automatically upload releases directly to GitHub." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "[i] Git not detected in PATH. Binaries and latest.json are prepared in Final exe folder." -ForegroundColor Yellow
        Write-Host "    You can upload latest.json and zypecode-v${TargetVersion}-beta-installer.exe to your GitHub Releases page to distribute the update." -ForegroundColor Yellow
    }
}

# 8. Summary Display
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "   ZYPERCODE v$TargetVersion READY!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Get-ChildItem -Path $FinalDir | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize


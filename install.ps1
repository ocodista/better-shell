# better-shell Windows installer
# Supports WSL2 or native Windows

$ErrorActionPreference = "Stop"

# Colors
function Write-Color {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "`n🚀 better-shell installer (Windows)" "Cyan"
Write-Color ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Color "⚠️  Not running as Administrator" "Yellow"
    Write-Color "Some features may require admin privileges" "Yellow"
    Write-Color ""
}

# Function to check WSL2
function Test-WSL2 {
    try {
        $wslVersion = wsl --status 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# Check for WSL2
$hasWSL2 = Test-WSL2

if ($hasWSL2) {
    Write-Color "✓ WSL2 detected" "Green"
    Write-Color ""
    Write-Color "Installing better-shell in WSL2 (recommended)..." "Cyan"
    Write-Color ""

    # Run the bash installer in WSL
    wsl bash -c "curl -fsSL https://shell.ocodista.com/install.sh | bash"

    Write-Color ""
    Write-Color "✨ Installation complete!" "Green"
    Write-Color ""
    Write-Color "To use better-shell:" "White"
    Write-Color "  wsl" "Cyan"
    Write-Color ""
    exit 0
}

# WSL2 not available - install native Windows tools
Write-Color "WSL2 not detected" "Yellow"
Write-Color ""
Write-Color "Options:" "White"
Write-Color "  1. Install WSL2 (recommended) - Full Linux experience" "White"
Write-Color "  2. Install Windows-native tools - PowerShell, fzf, eza" "White"
Write-Color ""

$choice = Read-Host "Choose option (1 or 2)"

if ($choice -eq "1") {
    Write-Color ""
    Write-Color "Installing WSL2..." "Cyan"
    Write-Color ""

    try {
        # Install WSL2
        wsl --install

        Write-Color ""
        Write-Color "✓ WSL2 installation started" "Green"
        Write-Color ""
        Write-Color "Next steps:" "White"
        Write-Color "  1. Restart your computer" "Yellow"
        Write-Color "  2. Open WSL2 (it will complete setup)" "Yellow"
        Write-Color "  3. Run this installer again" "Yellow"
        Write-Color ""
    } catch {
        Write-Color "❌ Failed to install WSL2" "Red"
        Write-Color "Error: $_" "Red"
        Write-Color ""
        Write-Color "Manual installation:" "White"
        Write-Color "  https://learn.microsoft.com/en-us/windows/wsl/install" "Cyan"
        Write-Color ""
        exit 1
    }
    exit 0
}

if ($choice -eq "2") {
    Write-Color ""
    Write-Color "Installing Windows-native tools..." "Cyan"
    Write-Color ""

    # Check for Scoop
    $hasScoop = Get-Command scoop -ErrorAction SilentlyContinue

    if (-not $hasScoop) {
        Write-Color "Installing Scoop package manager..." "Cyan"
        try {
            Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Invoke-RestMethod get.scoop.sh | Invoke-Expression
        } catch {
            Write-Color "❌ Failed to install Scoop" "Red"
            Write-Color "Error: $_" "Red"
            exit 1
        }
    }

    Write-Color "✓ Scoop is ready" "Green"
    Write-Color ""

    # Install tools
    $tools = @("fzf", "eza", "git")

    foreach ($tool in $tools) {
        Write-Color "Installing $tool..." "Cyan"
        try {
            scoop install $tool
            Write-Color "✓ Installed $tool" "Green"
        } catch {
            Write-Color "⚠️  Failed to install $tool" "Yellow"
        }
    }

    Write-Color ""
    Write-Color "Installing PowerShell modules..." "Cyan"

    # Install PSReadLine for auto-suggestions
    try {
        Install-Module -Name PSReadLine -Force -SkipPublisherCheck -AllowClobber
        Write-Color "✓ Installed PSReadLine (auto-suggestions)" "Green"
    } catch {
        Write-Color "⚠️  Failed to install PSReadLine" "Yellow"
    }

    # Install posh-git for git integration
    try {
        Install-Module -Name posh-git -Force -SkipPublisherCheck -AllowClobber
        Write-Color "✓ Installed posh-git" "Green"
    } catch {
        Write-Color "⚠️  Failed to install posh-git" "Yellow"
    }

    # Install Terminal-Icons
    try {
        Install-Module -Name Terminal-Icons -Force -SkipPublisherCheck -AllowClobber
        Write-Color "✓ Installed Terminal-Icons" "Green"
    } catch {
        Write-Color "⚠️  Failed to install Terminal-Icons" "Yellow"
    }

    Write-Color ""
    Write-Color "Configuring PowerShell profile..." "Cyan"

    # Create PowerShell profile
    $profileContent = @"
# better-shell PowerShell configuration

# PSReadLine - Auto-suggestions
Import-Module PSReadLine
Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -PredictionViewStyle ListView
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# posh-git - Git integration
Import-Module posh-git

# Terminal-Icons - File icons
Import-Module Terminal-Icons

# Aliases
Set-Alias -Name ls -Value eza -Option AllScope -Force
function lsx { eza -l -a --icons }

# fzf integration
Set-PsFzfOption -PSReadlineChordProvider 'Ctrl+t' -PSReadlineChordReverseHistory 'Ctrl+r'

# Oh My Posh (optional - install with: winget install JanDeDobbeleer.OhMyPosh)
# oh-my-posh init pwsh | Invoke-Expression
"@

    # Backup existing profile
    if (Test-Path $PROFILE) {
        $backupPath = "$PROFILE.backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
        Copy-Item $PROFILE $backupPath
        Write-Color "✓ Backed up existing profile to $backupPath" "Green"
    }

    # Create profile directory if it doesn't exist
    $profileDir = Split-Path $PROFILE
    if (-not (Test-Path $profileDir)) {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    }

    # Write profile
    Set-Content -Path $PROFILE -Value $profileContent
    Write-Color "✓ Created PowerShell profile" "Green"

    Write-Color ""
    Write-Color "✨ Installation complete!" "Green"
    Write-Color ""
    Write-Color "Next steps:" "White"
    Write-Color "  1. Restart PowerShell or run: . `$PROFILE" "Yellow"
    Write-Color "  2. Try: lsx (list files with icons)" "Yellow"
    Write-Color "  3. Try: Ctrl+R (search history with fzf)" "Yellow"
    Write-Color ""
    Write-Color "Installed:" "White"
    Write-Color "  ✓ fzf - Fuzzy finder (Ctrl+R)" "Green"
    Write-Color "  ✓ eza - Modern ls with icons" "Green"
    Write-Color "  ✓ PSReadLine - Auto-suggestions" "Green"
    Write-Color "  ✓ posh-git - Git integration" "Green"
    Write-Color "  ✓ Terminal-Icons - File icons" "Green"
    Write-Color ""
    Write-Color "Recommended:" "White"
    Write-Color "  • Windows Terminal (winget install Microsoft.WindowsTerminal)" "Cyan"
    Write-Color "  • Oh My Posh theme (winget install JanDeDobbeleer.OhMyPosh)" "Cyan"
    Write-Color ""

} else {
    Write-Color ""
    Write-Color "Installation cancelled" "Yellow"
    Write-Color ""
    exit 0
}

# DAN CLI Installation Script for Windows (PowerShell)
# This script installs the DAN CLI either from npm or by building from source

# Exit on any error
$ErrorActionPreference = "Stop"

# Function to print colored output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

# Check if running on Windows
if ($env:OS -ne "Windows_NT") {
    Write-Error "This script is designed for Windows only. Please use install-dan-cli.sh on Linux/macOS."
}

# Check if Node.js is installed
function Check-Node {
    try {
        $nodeVersion = node --version
        Write-Info "Node.js $nodeVersion detected."
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js version 20 or higher from https://nodejs.org/"
    }

    # Extract major version
    $versionStr = $nodeVersion.TrimStart('v')
    $majorVersion = [int]$versionStr.Split('.')[0]

    if ($majorVersion -lt 20) {
        Write-Error "Node.js version $versionStr is not supported. Please upgrade to Node.js version 20 or higher."
    }
}

# Check if npm is installed
function Check-Npm {
    try {
        $npmVersion = npm --version
        Write-Info "npm $npmVersion detected."
    }
    catch {
        Write-Error "npm is not installed. Please ensure npm is installed with Node.js."
    }
}

# Install from npm
function Install-FromNpm {
    Write-Info "Installing DAN CLI from npm..."

    # Check if we're in development mode (inside the project directory)
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        if ($packageJson.name -eq "@qwen-code/qwen-code") {
            Write-Warning "You are in the project directory. Installing the package globally from the current directory."
            npm install -g . --silent
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to install from current directory."
            }
        }
    }
    else {
        # Install the latest version from npm
        npm install -g @qwen-code/qwen-code@latest --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install from npm."
        }
    }

    Write-Success "DAN CLI installed successfully!"
    Write-Info "You can now run: dan or qwen"
}

# Install from source
function Install-FromSource {
    Write-Info "Installing DAN CLI from source..."

    # Check if git is installed
    try {
        git --version | Out-Null
        Write-Info "Git detected."
    }
    catch {
        Write-Error "Git is not installed. Please install git first."
    }

    # Ask for installation directory
    $installDir = Read-Host "Enter the directory where you want to install the source code (default: $env:USERPROFILE\dan-cli)"
    if ([string]::IsNullOrWhiteSpace($installDir)) {
        $installDir = "$env:USERPROFILE\dan-cli"
    }

    # Create directory if it doesn't exist
    if (!(Test-Path $installDir)) {
        New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    }

    # Clone the repository if it doesn't exist
    $gitDirPath = Join-Path $installDir ".git"
    if (!(Test-Path $gitDirPath)) {
        Write-Info "Cloning DAN CLI repository to $installDir..."
        git clone https://github.com/somdipto/DAN-cli.git $installDir
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to clone the repository."
        }
    }
    else {
        Write-Info "Repository already exists. Pulling latest changes..."
        Set-Location $installDir
        git pull
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to pull latest changes."
        }
    }

    # Change directory to the installation directory
    Set-Location $installDir

    Write-Info "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies."
    }

    Write-Info "Building the project..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build the project."
    }

    Write-Info "Installing globally..."
    npm install -g .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install globally."
    }

    Write-Success "DAN CLI installed successfully from source!"
    Write-Info "You can now run: dan or qwen"
    Write-Info "The source code is available in: $installDir"
}

# Main function
function Main {
    Write-Info "DAN CLI Installation Script"
    Write-Info "============================"

    Check-Node
    Check-Npm

    Write-Host ""
    Write-Host "Choose an installation method:"
    Write-Host "1. Install from npm (recommended, faster)"
    Write-Host "2. Install from source (latest development version)"
    
    $choice = Read-Host "Enter your choice (1 or 2)"
    
    switch ($choice) {
        "1" {
            Install-FromNpm
        }
        "2" {
            Install-FromSource
        }
        default {
            Write-Error "Invalid choice. Please enter 1 or 2."
        }
    }

    Write-Host ""
    Write-Success "Installation completed successfully!"
    Write-Info "Run 'dan' or 'qwen' to start using the CLI."
    Write-Info "Visit https://github.com/somdipto/DAN-cli for documentation."
}

# Run the main function
Main
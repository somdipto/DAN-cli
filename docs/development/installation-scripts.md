# Installation Scripts

This project provides cross-platform installation scripts to make it easier to install the DAN CLI on different operating systems.

## Overview

Instead of manually installing via npm, you can use our installation scripts which automate the process and provide additional options for installation.

## Installation Scripts

### Linux/macOS
- **File**: `install-dan-cli.sh`
- **Usage**: 
  ```bash
  chmod +x install-dan-cli.sh
  ./install-dan-cli.sh
  ```

### Windows
- **File**: `install-dan-cli.ps1`
- **Usage**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  .\install-dan-cli.ps1
  ```

## Installation Methods

The scripts offer two installation methods:

1. **Install from npm** (recommended):
   - Downloads and installs the latest published version from npm
   - Faster installation
   - Stable release

2. **Install from source**:
   - Clones the repository and builds from source code
   - Gets the latest development version
   - Requires more time and resources

## Prerequisites

- Node.js version 20 or higher
- npm (comes with Node.js)
- Git (for source installation method)

## Quick Installation

For a streamlined experience, you can also use the quick installation script:

```bash
# Linux/macOS
./quick-install.sh
```

This script automatically detects your operating system and runs the appropriate installer.

## What the Scripts Do

### For npm installation:
- Checks for Node.js and npm prerequisites
- Installs the `@qwen-code/qwen-code` package globally using npm
- Makes the `dan` and `qwen` commands available system-wide

### For source installation:
- Checks for Node.js, npm, and Git
- Clones the DAN CLI repository
- Installs dependencies
- Builds the project
- Installs globally

## After Installation

After successful installation, you can use the CLI by running either:
- `dan` - Main command
- `qwen` - Alternative command

## Troubleshooting

If you encounter issues:

1. Make sure you have the required prerequisites (Node.js >= 20)
2. Ensure your npm installation has proper permissions
3. If installing globally fails, try running the command with appropriate permissions
4. Check that git is installed if using the source installation method
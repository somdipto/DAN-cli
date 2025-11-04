# DAN CLI Installation Scripts

This repository includes cross-platform installation scripts for the DAN CLI tool to make installation easier across different operating systems.

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

## Prerequisites

- Node.js version 20 or higher
- npm (comes with Node.js)
- Git (for source installation method)

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
3. If installing globally fails, try running the command with appropriate permissions (e.g., using npx instead, or configuring npm for global packages without sudo)

For more information about the DAN CLI, visit the [main repository](https://github.com/somdipto/DAN-cli).
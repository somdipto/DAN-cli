#!/bin/bash

# DAN CLI Installation Script
# This script installs the DAN CLI either from npm or by building from source

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows (WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_error "This script is not designed for Windows. Please use install-dan-cli.ps1 instead."
    exit 1
fi

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js version 20 or higher."
        print_info "You can download it from https://nodejs.org/"
        exit 1
    fi

    # Check Node.js version
    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)

    if [ "$NODE_MAJOR" -lt 20 ]; then
        print_error "Node.js version ${NODE_VERSION} is not supported. Please upgrade to Node.js version 20 or higher."
        exit 1
    fi

    print_info "Node.js version $NODE_VERSION detected."
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm along with Node.js."
        exit 1
    fi

    print_info "npm detected."
}

# Install from npm
install_from_npm() {
    print_info "Installing DAN CLI from npm..."

    # Check if we're in development mode (inside the project directory)
    if [ -f "package.json" ] && grep -q '"@qwen-code/qwen-code"' "package.json" 2>/dev/null; then
        print_warning "You are in the project directory. Installing the package globally from the current directory."
        npm install -g . || {
            print_error "Failed to install from current directory."
            exit 1
        }
    else
        # Install the latest version from npm
        npm install -g @qwen-code/qwen-code@latest || {
            print_error "Failed to install from npm."
            exit 1
        }
    fi

    print_success "DAN CLI installed successfully!"
    print_info "You can now run: dan or qwen"
}

# Install from source
install_from_source() {
    print_info "Installing DAN CLI from source..."

    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install git first."
        exit 1
    fi

    print_info "Git detected."

    # Ask for installation directory
    read -p "Enter the directory where you want to install the source code (default: ~/dan-cli): " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-$HOME/dan-cli}

    # Create directory if it doesn't exist
    mkdir -p "$INSTALL_DIR"

    # Clone the repository if it doesn't exist
    if [ ! -d "$INSTALL_DIR/.git" ]; then
        print_info "Cloning DAN CLI repository to $INSTALL_DIR..."
        git clone https://github.com/somdipto/DAN-cli.git "$INSTALL_DIR" || {
            print_error "Failed to clone the repository."
            exit 1
        }
    else
        print_info "Repository already exists. Pulling latest changes..."
        cd "$INSTALL_DIR"
        git pull || {
            print_error "Failed to pull latest changes."
            exit 1
        }
    fi

    # Change directory to the installation directory
    cd "$INSTALL_DIR"

    print_info "Installing dependencies..."
    npm install || {
        print_error "Failed to install dependencies."
        exit 1
    }

    print_info "Building the project..."
    npm run build || {
        print_error "Failed to build the project."
        exit 1
    }

    print_info "Installing globally..."
    npm install -g . || {
        print_error "Failed to install globally."
        exit 1
    }

    print_success "DAN CLI installed successfully from source!"
    print_info "You can now run: dan or qwen"
    print_info "The source code is available in: $INSTALL_DIR"
}

# Main function
main() {
    print_info "DAN CLI Installation Script"
    print_info "============================"

    check_node
    check_npm

    # Ask user for installation method
    echo
    echo "Choose an installation method:"
    echo "1. Install from npm (recommended, faster)"
    echo "2. Install from source (latest development version)"
    read -p "Enter your choice (1 or 2): " choice

    case $choice in
        1)
            install_from_npm
            ;;
        2)
            install_from_source
            ;;
        *)
            print_error "Invalid choice. Please enter 1 or 2."
            exit 1
            ;;
    esac

    echo
    print_success "Installation completed successfully!"
    print_info "Run 'dan' or 'qwen' to start using the CLI."
    print_info "Visit https://github.com/somdipto/DAN-cli for documentation."
}

# Run the main function
main "$@"
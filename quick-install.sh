#!/bin/bash
# Quick install script for DAN CLI

# Detect OS and run appropriate installer
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "Windows detected. Please run: powershell -ExecutionPolicy Bypass -File install-dan-cli.ps1"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS detected."
    ./install-dan-cli.sh
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Linux detected."
    ./install-dan-cli.sh
else
    echo "Unknown OS. Please run the appropriate installation script manually."
    exit 1
fi
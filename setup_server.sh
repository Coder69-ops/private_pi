#!/bin/bash

# Exit on error
set -e

echo "Initialising server setup..."

# Check for apt-get (Debian/Ubuntu)
if command -v apt-get &> /dev/null; then
    echo "Detected Debian/Ubuntu system."
    PKG_MANAGER="apt-get"
    # Update system
    echo "Updating system packages..."
    sudo apt-get update && sudo apt-get upgrade -y
    # Install prerequisites
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
elif command -v yum &> /dev/null; then
    echo "Detected Amazon Linux/RHEL/CentOS."
    PKG_MANAGER="yum"
    sudo yum update -y
    sudo yum install -y git
else
    echo "Unsupported package manager. Please install Docker manually."
    exit 1
fi

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "Docker installed."
else
    echo "Docker is already installed."
fi

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Clean up
rm -f get-docker.sh

echo "Setup complete!"
echo "IMPORTANT: You must log out and log back in for docker group permissions to take effect."

#!/bin/bash

# Color variables
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  echo -e "${BLUE}==>${NC} $1"
}

# Function to print success
print_success() {
  echo -e "${GREEN}==>${NC} $1"
}

# Function to print error
print_error() {
  echo -e "${RED}==>${NC} $1"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}==>${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
  print_error "No .env file found. Please create one based on .env.example"
  exit 1
fi

# Display menu for network selection
select_network() {
  echo "Select deployment network:"
  echo "1) Local Hardhat node"
  echo "2) Sepolia Testnet"
  echo "3) Mumbai Testnet"
  echo "4) Ethereum Mainnet"
  echo "5) Polygon Mainnet"
  
  read -p "Enter choice [1-5]: " network_choice
  
  case $network_choice in
    1) NETWORK="localhost" ;;
    2) NETWORK="sepolia" ;;
    3) NETWORK="mumbai" ;;
    4) NETWORK="mainnet" ;;
    5) NETWORK="polygon" ;;
    *) 
      print_error "Invalid choice"
      exit 1
      ;;
  esac
  
  # If mainnet selected, ask for confirmation
  if [[ "$NETWORK" == "mainnet" || "$NETWORK" == "polygon" ]]; then
    read -p "WARNING: You're about to deploy to MAINNET. Are you sure? (y/n): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      print_warning "Mainnet deployment cancelled"
      exit 0
    fi
  fi
}

# Deploy smart contracts
deploy_contracts() {
  print_status "Deploying smart contracts to $NETWORK network..."
  
  if [[ "$NETWORK" == "localhost" ]]; then
    # Start local node in background if not running
    if ! nc -z localhost 8545 >/dev/null 2>&1; then
      print_status "Starting local Hardhat node..."
      npx hardhat node &
      HARDHAT_PID=$!
      sleep 5
    fi
  fi
  
  # Run deployment script
  npx hardhat run scripts/deploy.js --network $NETWORK
  
  if [ $? -ne 0 ]; then
    print_error "Contract deployment failed"
    # Kill Hardhat node if we started it
    if [ ! -z "$HARDHAT_PID" ]; then
      kill $HARDHAT_PID
    fi
    exit 1
  fi
  
  print_success "Contracts deployed successfully"
}

# Update frontend config with new contract addresses
update_frontend_config() {
  print_status "Updating frontend contract addresses..."
  
  # Directory paths
  FRONTEND_DIR="frontend"
  DEPLOYMENT_FILE="deployment-$NETWORK.json"
  CONFIG_FILE="$FRONTEND_DIR/src/utils/contractAddresses.json"
  
  if [ ! -f "$DEPLOYMENT_FILE" ]; then
    print_error "Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
  fi
  
  # Extract contract addresses from deployment file
  FLIGHT_INSURANCE_ADDRESS=$(grep -o '"flightInsurance":"[^"]*"' $DEPLOYMENT_FILE | cut -d'"' -f4)
  ORACLE_CONNECTOR_ADDRESS=$(grep -o '"oracleConnector":"[^"]*"' $DEPLOYMENT_FILE | cut -d'"' -f4)
  
  # Get network ID
  if [[ "$NETWORK" == "localhost" ]]; then
    NETWORK_ID=1337
  elif [[ "$NETWORK" == "sepolia" ]]; then
    NETWORK_ID=11155111
  elif [[ "$NETWORK" == "mumbai" ]]; then
    NETWORK_ID=80001
  elif [[ "$NETWORK" == "mainnet" ]]; then
    NETWORK_ID=1
  elif [[ "$NETWORK" == "polygon" ]]; then
    NETWORK_ID=137
  fi
  
  # Create backup of config file
  if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
  fi
  
  # Update config file using temporary file to avoid parsing issues
  jq ".$NETWORK_ID.flightInsurance = \"$FLIGHT_INSURANCE_ADDRESS\" | .$NETWORK_ID.oracleConnector = \"$ORACLE_CONNECTOR_ADDRESS\"" $CONFIG_FILE > $CONFIG_FILE.tmp
  mv $CONFIG_FILE.tmp $CONFIG_FILE
  
  print_success "Frontend configuration updated"
}

# Build and deploy frontend
build_frontend() {
  print_status "Building frontend..."
  
  cd frontend
  
  # Install dependencies
  print_status "Installing frontend dependencies..."
  npm install
  
  # Build production version
  print_status "Building production version..."
  npm run build
  
  print_success "Frontend built successfully"
  
  # Ask if user wants to deploy frontend
  read -p "Do you want to deploy the frontend? (y/n): " deploy_frontend
  if [[ "$deploy_frontend" == "y" || "$deploy_frontend" == "Y" ]]; then
    # This is a placeholder for the deployment command
    # Replace with your actual deployment command based on your hosting service
    print_status "Deploying frontend (placeholder)..."
    # Example: npm run deploy
    print_success "Frontend deployed"
  fi
  
  cd ..
}

# Main execution
print_status "Starting deployment process..."

# Select network
select_network

# Deploy contracts
deploy_contracts

# Update frontend config
update_frontend_config

# Build and deploy frontend
build_frontend

print_success "Deployment process completed successfully!"

# Kill Hardhat node if we started it
if [ ! -z "$HARDHAT_PID" ]; then
  kill $HARDHAT_PID
fi
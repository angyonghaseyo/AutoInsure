#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color configuration for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Deployment environments
const ENVIRONMENTS = {
  local: 'local',
  staging: 'staging',
  production: 'production'
};

// Directory paths
const FRONTEND_DIR = path.join(__dirname, 'frontend');
const CONFIG_DIR = path.join(FRONTEND_DIR, 'src', 'utils');
const DEPLOYMENT_FILES = {
  local: path.join(__dirname, 'deployment-localhost.json'),
  staging: path.join(__dirname, 'deployment-sepolia.json'),
  production: path.join(__dirname, 'deployment-mainnet.json'),
};
const CONTRACT_ADDRESSES_FILE = path.join(CONFIG_DIR, 'contractAddresses.json');
const ENV_CONFIGS = {
  local: path.join(__dirname, 'local.json'),
  staging: path.join(__dirname, 'staging.json'),
  production: path.join(__dirname, 'production.json')
};

/**
 * Displays a status message with color
 */
function logStatus(message, type = 'info') {
  const color = type === 'error' ? colors.red 
               : type === 'success' ? colors.green 
               : type === 'warning' ? colors.yellow 
               : colors.blue;
  
  console.log(`${color}==>${colors.reset} ${message}`);
}

/**
 * Prompts the user for a choice from a list of options
 */
async function promptChoice(question, options) {
  return new Promise((resolve) => {
    console.log(question);
    options.forEach((option, index) => {
      console.log(`${index + 1}) ${option}`);
    });
    
    rl.question(`Enter choice [1-${options.length}]: `, (answer) => {
      const choice = parseInt(answer);
      if (isNaN(choice) || choice < 1 || choice > options.length) {
        logStatus(`Invalid choice: ${answer}. Please try again.`, 'error');
        resolve(promptChoice(question, options));
      } else {
        resolve(options[choice - 1]);
      }
    });
  });
}

/**
 * Prompts the user for confirmation
 */
async function promptConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Updates contract addresses in the frontend config
 */
function updateContractAddresses(environment) {
  logStatus(`Updating contract addresses for ${environment} environment...`);

  try {
    // Check if deployment file exists
    const deploymentFile = DEPLOYMENT_FILES[environment];
    if (!fs.existsSync(deploymentFile)) {
      logStatus(`Deployment file not found: ${deploymentFile}`, 'error');
      return false;
    }

    // Read deployment data
    const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    
    // Read existing contract addresses
    let contractAddresses = {};
    if (fs.existsSync(CONTRACT_ADDRESSES_FILE)) {
      contractAddresses = JSON.parse(fs.readFileSync(CONTRACT_ADDRESSES_FILE, 'utf8'));
    }

    // Get network ID based on environment
    let networkId;
    switch (environment) {
      case ENVIRONMENTS.local:
        networkId = '31337';
        break;
      case ENVIRONMENTS.staging:
        networkId = '11155111'; // Sepolia
        break;
      case ENVIRONMENTS.production:
        networkId = '1'; // Ethereum Mainnet
        break;
      default:
        logStatus(`Unknown environment: ${environment}`, 'error');
        return false;
    }

    // Update contract addresses
    contractAddresses[networkId] = {
      flightInsurance: deploymentData.flightInsurance,
      oracleConnector: deploymentData.oracleConnector
    };

    // Write updated contract addresses
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(
      CONTRACT_ADDRESSES_FILE,
      JSON.stringify(contractAddresses, null, 2)
    );

    logStatus(`Contract addresses updated successfully`, 'success');
    return true;
  } catch (error) {
    logStatus(`Error updating contract addresses: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Updates environment-specific configuration
 */
function updateEnvironmentConfig(environment) {
  logStatus(`Updating environment configuration for ${environment}...`);

  try {
    // Check if environment config file exists
    const envConfigFile = ENV_CONFIGS[environment];
    if (!fs.existsSync(envConfigFile)) {
      logStatus(`Environment config file not found: ${envConfigFile}`, 'warning');
      return true; // Not critical, can continue
    }

    // Read environment config
    const envConfig = JSON.parse(fs.readFileSync(envConfigFile, 'utf8'));
    
    // Write environment config to frontend
    const envConfigDest = path.join(CONFIG_DIR, 'environment.json');
    fs.writeFileSync(
      envConfigDest,
      JSON.stringify(envConfig, null, 2)
    );

    logStatus(`Environment configuration updated successfully`, 'success');
    return true;
  } catch (error) {
    logStatus(`Error updating environment configuration: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Builds the frontend application
 */
function buildFrontend() {
  logStatus('Building frontend application...');

  try {
    // Ensure we're in the frontend directory
    process.chdir(FRONTEND_DIR);
    
    // Install dependencies
    logStatus('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build the application
    logStatus('Running build...');
    execSync('npm run build', { stdio: 'inherit' });
    
    logStatus('Frontend built successfully', 'success');
    return true;
  } catch (error) {
    logStatus(`Error building frontend: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Deploys the frontend to the hosting provider
 */
async function deployFrontend(environment) {
  // Different deployment commands based on environment
  const deployCommands = {
    local: 'npm run start',
    staging: 'vercel --confirm',
    production: 'vercel --prod --confirm'
  };

  logStatus(`Deploying frontend to ${environment}...`);

  try {
    // Deploy based on environment
    const deployCommand = deployCommands[environment];
    execSync(deployCommand, { stdio: 'inherit' });
    
    logStatus(`Frontend deployed successfully to ${environment}`, 'success');
    return true;
  } catch (error) {
    logStatus(`Error deploying frontend: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  logStatus('AutoInsure Frontend Deployment', 'info');
  logStatus('------------------------------', 'info');
  
  try {
    // Select environment
    const environment = await promptChoice(
      'Select deployment environment:',
      [ENVIRONMENTS.local, ENVIRONMENTS.staging, ENVIRONMENTS.production]
    );

    // Confirm production deployment
    if (environment === ENVIRONMENTS.production) {
      const confirmed = await promptConfirmation(
        `WARNING: You're about to deploy to PRODUCTION. Are you sure?`
      );
      if (!confirmed) {
        logStatus('Production deployment cancelled', 'warning');
        rl.close();
        return;
      }
    }

    // Update contract addresses
    const addressesUpdated = updateContractAddresses(environment);
    if (!addressesUpdated) {
      logStatus('Deployment aborted due to contract address configuration failure', 'error');
      rl.close();
      return;
    }

    // Update environment config
    updateEnvironmentConfig(environment);

    // Build frontend
    const buildSuccessful = buildFrontend();
    if (!buildSuccessful) {
      logStatus('Deployment aborted due to build failure', 'error');
      rl.close();
      return;
    }

    // Ask if user wants to deploy
    const deployConfirmed = await promptConfirmation(
      'Do you want to deploy the frontend now?'
    );
    
    if (deployConfirmed) {
      await deployFrontend(environment);
    } else {
      logStatus('Deployment skipped. Build is ready for manual deployment.', 'info');
    }

    logStatus('Deployment process completed', 'success');
  } catch (error) {
    logStatus(`Deployment failed: ${error.message}`, 'error');
  } finally {
    rl.close();
  }
}

// Run the main function
main();
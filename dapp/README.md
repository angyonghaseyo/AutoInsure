# AutoInsure Frontend Application

A Next.js frontend for the decentralized flight and baggage insurance platform.

## Overview

This frontend application provides interfaces for both regular users and insurance providers to interact with the flight and baggage insurance smart contracts. It allows users to purchase insurance policies and track claims, while insurers can create policy templates and manage funds.

## Features

### For Users
- Connect wallet (MetaMask, WalletConnect)
- Browse active insurance policy templates
- Purchase flight and baggage insurance policies
- View purchased policies and their status
- Claim payouts for eligible policies

### For Insurers
- Create and manage policy templates
- View all purchased policies by users
- Monitor claims and payouts
- Deposit and withdraw funds from the contract
- View statistics on premiums, claims, and profit margins

## Tech Stack

- **Next.js**: React framework for SSR and routing
- **TypeScript**: Type safety and better developer experience
- **Ant Design**: UI component library
- **Ethers.js**: Ethereum library for blockchain interactions
- **Web3.js**: Additional blockchain interaction utilities
- **MongoDB**: Database for policy template management
- **Tailwind CSS**: Utility-first CSS framework

## Project Structure

```
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CreatePolicyTemplate.tsx    # Template creation form
│   │   ├── DepositWithdraw.tsx         # Fund management component
│   │   ├── Footer.tsx                  # Page footer
│   │   ├── Navbar.tsx                  # Navigation bar
│   │   ├── PurchasePolicy.tsx          # Policy purchase form
│   │   ├── ViewPolicyModal.tsx         # Policy details modal
│   │   ├── WalletConnect.tsx           # Wallet connection UI
│   │   └── Web3Provider.tsx            # Blockchain context provider
│   ├── pages/               # Next.js pages
│   │   ├── api/             # API routes for MongoDB integration
│   │   ├── user/            # Pages for regular users
│   │   ├── insurer/         # Pages for insurance providers
│   │   ├── _app.tsx         # Next.js app component
│   │   └── index.tsx        # Homepage
│   ├── services/            # API service integrations
│   │   ├── flightInsurance.ts     # Flight policy contract interactions
│   │   └── baggageInsurance.ts    # Baggage policy contract interactions
│   ├── styles/              # Global styles
│   │   └── global.css       # Global CSS
│   ├── types/               # TypeScript type definitions
│   │   ├── FlightPolicy.ts  # Flight policy types
│   │   └── BaggagePolicy.ts # Baggage policy types
│   └── utils/               # Utility functions
│       ├── abis/            # Contract ABIs
│       ├── contractAddresses.json  # Deployed contract addresses
│       └── utils.ts         # Helper functions
├── .env.local               # Environment variables
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MetaMask or another Web3 wallet
- MongoDB database (for policy templates)

### Installation

1. Clone the repository and navigate to the dapp directory
```bash
git clone https://github.com/yourusername/flight-insurance-dapp.git
cd flight-insurance-dapp/dapp
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_mongodb_database_name
```

4. Update contract addresses
Make sure the contract addresses in `src/utils/contractAddresses.json` match your deployed contracts.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Pages Overview

### User Pages

- **Home (`/`)**: Landing page with platform information
- **Browse Policies (`/user/BrowsePolicyTemplates`)**: Browse available insurance templates
- **My Policies (`/user/MyPolicies`)**: View purchased policies
- **Claims & Payouts (`/user/MyClaims`)**: View and manage claims

### Insurer Pages

- **Policy Templates (`/insurer/InsurerPolicyTemplates`)**: Create and manage policy templates
- **Claims Overview (`/insurer/InsurerClaimsOverview`)**: View and manage claims across all users

## Component Overview

### Key User Components

- **UserPolicyTemplateCard**: Displays policy template details for users
- **PurchasePolicy**: Form for purchasing a new policy
- **ViewPolicyModal**: Modal showing policy details and claim options

### Key Insurer Components

- **InsurerPolicyTemplateCard**: Displays policy template with management options
- **CreatePolicyTemplate**: Form for creating new policy templates
- **EditPolicyTemplate**: Form for updating existing templates
- **DepositWithdraw**: Component for managing contract funds

### Shared Components

- **WalletConnect**: Wallet connection component
- **Web3Provider**: Context provider for blockchain interaction
- **Navbar**: Navigation with role-based menu items
- **Footer**: Application footer

## Wallet Integration

The app integrates with MetaMask and other Ethereum wallets through the Web3Provider component:

1. User clicks "Connect Wallet" in the navbar
2. WalletConnect component triggers connection to browser wallet
3. Web3Provider establishes connection to the blockchain
4. User's address and role (user/insurer) are determined
5. UI updates based on the connected wallet and role

## Contract Interaction

The app interacts with the blockchain through service classes:

- **flightInsurance.ts**: Manages flight insurance contract interactions
- **baggageInsurance.ts**: Manages baggage insurance contract interactions

These services use ethers.js to:
1. Read data from the blockchain (policies, templates, etc.)
2. Send transactions (purchase, claim, etc.)
3. Listen for events (policy purchased, claim processed, etc.)

## MongoDB Integration

The application uses MongoDB to store policy templates:

- Templates are stored in separate collections for flight and baggage policies
- API routes in `/pages/api` provide CRUD operations for templates
- Services retrieve template data and pass it to the blockchain contracts during transactions

## Styling

The application uses a combination of:

- Tailwind CSS for utility-based styling
- Ant Design components for UI elements
- Custom CSS for specific components

## Building for Production

```bash
npm run build
# or
yarn build
```

To run the production build:
```bash
npm start
# or
yarn start
```

## Customization

### Adding New Insurance Types

To add a new insurance type (e.g., travel cancellation insurance):

1. Create new type definitions in `src/types/`
2. Add new service file in `src/services/`
3. Create new UI components for the insurance type
4. Add new pages for browsing and purchasing the new insurance type
5. Update the API routes for template management

### Changing the UI Theme

The UI theme can be customized in several ways:

1. Edit `tailwind.config.js` to change color schemes and defaults
2. Modify Ant Design theme variables in component imports
3. Update global styles in `src/styles/global.css`

## Testing

```bash
# Run tests
npm test
# or
yarn test

# Run tests with coverage
npm test -- --coverage
# or
yarn test --coverage
```

## Troubleshooting

### Common Issues

1. **Wallet Connection Issues**
   - Make sure MetaMask or another wallet is installed
   - Check that you're on the correct network (Ethereum Mainnet, Sepolia, etc.)

2. **Transaction Errors**
   - Ensure sufficient ETH for gas fees
   - Check contract addresses in `contractAddresses.json`

3. **UI Display Issues**
   - Clear browser cache and reload
   - Check browser console for errors
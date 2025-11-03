# Vault Program Frontend

A modern Next.js frontend for testing the Solana Vault Program.

## Features

- ✅ **Initialize Vault**: Set up a vault with a target amount
- ✅ **Deposit**: Deposit SOL into the vault (max 1 SOL per transaction)
- ✅ **Withdraw**: Withdraw SOL from the vault (max 3 SOL per transaction)
- ✅ **Vault Status**: Real-time display of vault state and balance
- ✅ **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- ✅ **Auto-refund**: Vault automatically refunds when balance reaches target

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm/npm/yarn
- A Solana wallet (Phantom, Solflare, etc.)
- Deployed vault program on devnet

### Installation

```bash
cd frontend
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

## Program Information

- **Program ID**: `Ef4mxmArsCQg5qybkk9zhpcbHujiQMHtX8wDsazp9V4G`
- **Network**: Devnet
- **Program Address**: Located in `lib/solana.ts`

## Usage

1. **Connect Your Wallet**: Click the wallet button in the top right and connect your Solana wallet

2. **Initialize Vault**: 
   - Navigate to the "Initialize" tab
   - Enter a target amount in SOL
   - Click "Initialize Vault"
   - This sets the target amount that triggers auto-refund

3. **Deposit**:
   - Navigate to the "Deposit" tab
   - Enter amount (max 1 SOL per transaction)
   - Click "Deposit"
   - Note: When vault balance reaches target, deposits will automatically refund

4. **Withdraw**:
   - Navigate to the "Withdraw" tab
   - Enter amount (max 3 SOL per transaction)
   - Click "Withdraw"

5. **View Status**: The vault status card shows:
   - Initialization status
   - Current balance
   - Target amount
   - Progress bar

## Program Rules

- **Deposit Limit**: Maximum 1 SOL per deposit transaction
- **Withdrawal Limit**: Maximum 3 SOL per withdrawal transaction
- **Auto-refund**: When vault balance reaches the target amount, the next deposit will automatically refund all funds to you

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Main page with tabs
│   ├── providers.tsx # Wallet and connection providers
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── ui/          # Shadcn UI components
│   ├── vault-status.tsx
│   ├── initialize-vault.tsx
│   ├── deposit.tsx
│   └── withdraw.tsx
└── lib/             # Utilities
    ├── solana.ts    # Solana utilities (PDAs, conversions)
    ├── vault.ts     # Vault-specific functions
    └── instructions.ts # Instruction builders
```

## License

MIT

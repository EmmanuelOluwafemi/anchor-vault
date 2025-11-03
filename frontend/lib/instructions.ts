import { TransactionInstruction, PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { VAULT_PROGRAM_ID, STANDARD_PROGRAMS, getStatePDA, getVaultPDA } from "./solana";

// Instruction discriminators from IDL
const INITIALIZE_DISCRIMINATOR = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
const DEPOSIT_DISCRIMINATOR = Buffer.from([242, 35, 198, 137, 82, 225, 242, 182]);
const WITHDRAW_DISCRIMINATOR = Buffer.from([183, 18, 70, 156, 148, 109, 161, 34]);

function encodeU64(value: bigint): Buffer {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(value, 0);
  return buffer;
}

export function buildInitializeInstruction(
  user: PublicKey,
  amount: bigint
): TransactionInstruction {
  const [statePDA] = getStatePDA(user);
  const [vaultPDA] = getVaultPDA(statePDA);

  const data = Buffer.concat([INITIALIZE_DISCRIMINATOR, encodeU64(amount)]);

  // When Anchor uses `init` constraint on a PDA, it requires the rent sysvar account
  // to be included in the transaction, even though it's not explicitly in the IDL accounts.
  // Account order must match Anchor's expectation:
  // 1. user (signer, writable) - the payer
  // 2. state (writable, PDA) - account being initialized  
  // 3. vault (PDA) - derived account
  // 4. system_program
  // 5. rent_sysvar (required for account initialization with init constraint)
  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      {
        pubkey: user,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: statePDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: vaultPDA,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: STANDARD_PROGRAMS.systemProgram,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });
}

export function buildDepositInstruction(
  user: PublicKey,
  stateBump: number,
  amount: bigint
): TransactionInstruction {
  const [statePDA] = getStatePDA(user);
  const [vaultPDA] = getVaultPDA(statePDA);

  const data = Buffer.concat([DEPOSIT_DISCRIMINATOR, encodeU64(amount)]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      {
        pubkey: user,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: statePDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: vaultPDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: STANDARD_PROGRAMS.systemProgram,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });
}

export function buildWithdrawInstruction(
  user: PublicKey,
  stateBump: number,
  vaultBump: number,
  amount: bigint
): TransactionInstruction {
  const [statePDA] = getStatePDA(user);
  const [vaultPDA] = getVaultPDA(statePDA);

  const data = Buffer.concat([WITHDRAW_DISCRIMINATOR, encodeU64(amount)]);

  return new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    keys: [
      {
        pubkey: user,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: statePDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: vaultPDA,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: STANDARD_PROGRAMS.systemProgram,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });
}

import { Connection, PublicKey } from "@solana/web3.js";
import { getStatePDA, getVaultPDA } from "./solana";

export interface VaultState {
  amount: bigint;
  vaultBump: number;
  stateBump: number;
}

const VAULT_STATE_DISCRIMINATOR = Buffer.from([228, 196, 82, 165, 98, 210, 235, 152]);

export async function fetchVaultState(
  connection: Connection,
  user: PublicKey
): Promise<VaultState | null> {
  try {
    const [statePDA] = getStatePDA(user);
    const accountInfo = await connection.getAccountInfo(statePDA);

    if (!accountInfo) {
      return null;
    }

    const data = accountInfo.data;

    // Check discriminator
    const discriminator = data.slice(0, 8);
    if (!discriminator.equals(VAULT_STATE_DISCRIMINATOR)) {
      return null;
    }

    const amount = data.readBigUInt64LE(8);
    const vaultBump = data[16];
    const stateBump = data[17];

    return {
      amount,
      vaultBump,
      stateBump,
    };
  } catch (error) {
    console.error("Error fetching vault state:", error);
    return null;
  }
}

export async function getVaultBalance(connection: Connection, user: PublicKey): Promise<bigint> {
  try {
    const [statePDA] = getStatePDA(user);
    const [vaultPDA] = getVaultPDA(statePDA);
    const balance = await connection.getBalance(vaultPDA);
    return BigInt(balance);
  } catch (error) {
    console.error("Error fetching vault balance:", error);
    return 0n;
  }
}

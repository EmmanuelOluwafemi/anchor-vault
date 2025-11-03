import { PublicKey } from "@solana/web3.js";

export const VAULT_PROGRAM_ID = new PublicKey("Ef4mxmArsCQg5qybkk9zhpcbHujiQMHtX8wDsazp9V4G");

export const STANDARD_PROGRAMS = {
  systemProgram: new PublicKey("11111111111111111111111111111111"),
};

export const LAMPORTS_PER_SOL = 1_000_000_000n;

/**
 * Derives the state PDA address for a user
 * Seeds: ["state", user.key()]
 */
export function getStatePDA(user: PublicKey): [PublicKey, number] {
  const [statePDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("state"), user.toBuffer()],
    VAULT_PROGRAM_ID
  );

  return [statePDA, bump];
}

/**
 * Derives the vault PDA address from the state PDA
 * Seeds: ["vault", state.key()]
 */
export function getVaultPDA(state: PublicKey): [PublicKey, number] {
  const [vaultPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), state.toBuffer()],
    VAULT_PROGRAM_ID
  );

  return [vaultPDA, bump];
}

export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * Number(LAMPORTS_PER_SOL)));
}

export function lamportsToSol(lamports: bigint | number): number {
  const lamportsBigInt = typeof lamports === "number" ? BigInt(lamports) : lamports;
  return Number(lamportsBigInt) / Number(LAMPORTS_PER_SOL);
}

export function formatSol(lamports: bigint | number): string {
  const sol = lamportsToSol(lamports);
  return sol.toFixed(9).replace(/\.?0+$/, "");
}

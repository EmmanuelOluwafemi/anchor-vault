"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWithdrawInstruction } from "@/lib/instructions";
import { fetchVaultState, getVaultBalance } from "@/lib/vault";
import { solToLamports, formatSol, LAMPORTS_PER_SOL } from "@/lib/solana";

export function Withdraw() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  async function handleWithdraw() {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const [vaultState, vaultBalance] = await Promise.all([
        fetchVaultState(connection, publicKey),
        getVaultBalance(connection, publicKey),
      ]);

      if (!vaultState) {
        throw new Error("Vault not initialized. Please initialize your vault first.");
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const amountLamports = solToLamports(amountNum);
      const threeSol = 3n * LAMPORTS_PER_SOL;

      if (amountLamports > threeSol) {
        throw new Error("Withdrawal amount cannot exceed 3 SOL per transaction");
      }

      if (amountLamports > vaultBalance) {
        throw new Error(
          `Insufficient vault balance. Available: ${formatSol(vaultBalance)} SOL`
        );
      }

      const instruction = buildWithdrawInstruction(
        publicKey,
        vaultState.stateBump,
        vaultState.vaultBump,
        amountLamports
      );

      const transaction = new Transaction().add(instruction);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      setSuccess(`Withdrew ${formatSol(amountLamports)} SOL! Signature: ${signature}`);
      setAmount("");
    } catch (err: any) {
      console.error("Error withdrawing:", err);
      setError(err.message || "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw</CardTitle>
        <CardDescription>
          Withdraw SOL from your vault (max 3 SOL per transaction)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            max="3"
            placeholder="Enter amount (max 3 SOL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum 3 SOL per withdrawal. Cannot exceed vault balance.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        <Button
          onClick={handleWithdraw}
          disabled={loading || !publicKey}
          className="w-full"
          variant="destructive"
        >
          {loading ? "Withdrawing..." : "Withdraw"}
        </Button>
      </CardContent>
    </Card>
  );
}

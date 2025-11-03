"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDepositInstruction } from "@/lib/instructions";
import { fetchVaultState } from "@/lib/vault";
import { solToLamports, formatSol, LAMPORTS_PER_SOL } from "@/lib/solana";

export function Deposit() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  async function handleDeposit() {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const vaultState = await fetchVaultState(connection, publicKey);
      if (!vaultState) {
        throw new Error("Vault not initialized. Please initialize your vault first.");
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const amountLamports = solToLamports(amountNum);
      const oneSol = LAMPORTS_PER_SOL;

      if (amountLamports > oneSol) {
        throw new Error("Deposit amount cannot exceed 1 SOL per transaction");
      }

      const instruction = buildDepositInstruction(publicKey, vaultState.stateBump, amountLamports);

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

      setSuccess(`Deposited ${formatSol(amountLamports)} SOL! Signature: ${signature}`);
      setAmount("");
    } catch (err: any) {
      console.error("Error depositing:", err);
      setError(err.message || "Failed to deposit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit</CardTitle>
        <CardDescription>
          Deposit SOL into your vault (max 1 SOL per transaction)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            max="1"
            placeholder="Enter amount (max 1 SOL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Maximum 1 SOL per deposit. When vault reaches target, deposits will auto-refund.
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

        <Button onClick={handleDeposit} disabled={loading || !publicKey} className="w-full">
          {loading ? "Depositing..." : "Deposit"}
        </Button>
      </CardContent>
    </Card>
  );
}

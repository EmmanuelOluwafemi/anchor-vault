"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildInitializeInstruction } from "@/lib/instructions";
import { solToLamports, formatSol } from "@/lib/solana";

export function InitializeVault() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  async function handleInitialize() {
    if (!publicKey) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const amountLamports = solToLamports(amountNum);

      // Check if vault is already initialized
      const { fetchVaultState } = await import("@/lib/vault");
      const existingState = await fetchVaultState(connection, publicKey);
      if (existingState) {
        throw new Error("Vault is already initialized. You can only initialize once.");
      }

      // Build instruction
      const instruction = buildInitializeInstruction(publicKey, amountLamports);

      // Create transaction and add instruction (matching escrow pattern)
      const transaction = new Transaction().add(instruction);

      // Get recent blockhash and set transaction properties (escrow pattern)
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Send transaction (simple call like escrow - no extra options)
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      setSuccess(`Vault initialized with target amount of ${formatSol(amountLamports)} SOL! Signature: ${signature}`);
      setAmount("");
    } catch (err: any) {
      console.error("Error initializing vault:", err);
      setError(err.message || "Failed to initialize vault");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initialize Vault</CardTitle>
        <CardDescription>
          Initialize your vault with a target amount in SOL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Target Amount (SOL)</Label>
          <Input
            id="amount"
            type="number"
            step="0.001"
            placeholder="Enter target amount in SOL"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This is the target amount. When vault reaches this amount, deposits will auto-refund.
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

        <Button onClick={handleInitialize} disabled={loading || !publicKey} className="w-full">
          {loading ? "Initializing..." : "Initialize Vault"}
        </Button>
      </CardContent>
    </Card>
  );
}

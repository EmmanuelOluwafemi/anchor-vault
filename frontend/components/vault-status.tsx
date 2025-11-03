"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchVaultState, getVaultBalance } from "@/lib/vault";
import { formatSol, lamportsToSol } from "@/lib/solana";
import type { VaultState } from "@/lib/vault";

export function VaultStatus() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [vaultState, setVaultState] = useState<VaultState | null>(null);
  const [vaultBalance, setVaultBalance] = useState<bigint>(BigInt(0));

  async function loadVaultData() {
    if (!publicKey) {
      setVaultState(null);
      setVaultBalance(BigInt(0));
      return;
    }

    setLoading(true);
    try {
      const [state, balance] = await Promise.all([
        fetchVaultState(connection, publicKey),
        getVaultBalance(connection, publicKey),
      ]);
      setVaultState(state);
      setVaultBalance(balance);
    } catch (err) {
      console.error("Failed to load vault data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVaultData();
    const interval = setInterval(loadVaultData, 5000);
    return () => clearInterval(interval);
  }, [connection, publicKey]);

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vault Status</CardTitle>
          <CardDescription>Connect your wallet to view vault status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isInitialized = vaultState !== null;
  const targetAmount = vaultState?.amount || 0n;
  const progress = targetAmount > 0n ? Number(vaultBalance) / Number(targetAmount) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vault Status</CardTitle>
            <CardDescription>Your vault information</CardDescription>
          </div>
          <Button onClick={loadVaultData} variant="outline" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">
              {isInitialized ? (
                <span className="text-green-600 dark:text-green-400">Initialized</span>
              ) : (
                <span className="text-muted-foreground">Not Initialized</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
            <p className="text-lg font-semibold">{formatSol(vaultBalance)} SOL</p>
          </div>
        </div>

        {isInitialized && (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Target Amount</p>
              <p className="text-lg font-semibold">{formatSol(targetAmount)} SOL</p>
            </div>
            {targetAmount > 0n && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatSol(vaultBalance)} / {formatSol(targetAmount)} SOL
                </p>
              </div>
            )}
            {vaultBalance >= targetAmount && targetAmount > 0n && (
              <div className="rounded-md bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400">
                ⚠️ Vault balance has reached target! The next deposit will automatically refund all funds to you.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

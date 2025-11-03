"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultStatus } from "@/components/vault-status";
import { InitializeVault } from "@/components/initialize-vault";
import { Deposit } from "@/components/deposit";
import { Withdraw } from "@/components/withdraw";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Vault Program
            </h1>
            <p className="text-muted-foreground mt-2">
              Test frontend for Solana Vault Program
            </p>
          </div>
          <WalletMultiButton />
        </header>

        <div className="mb-6">
          <VaultStatus />
        </div>

        <Tabs defaultValue="deposit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="initialize">Initialize</TabsTrigger>
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="initialize">
            <InitializeVault />
          </TabsContent>

          <TabsContent value="deposit">
            <Deposit />
          </TabsContent>

          <TabsContent value="withdraw">
            <Withdraw />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

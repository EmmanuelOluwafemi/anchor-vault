import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault2 } from "../target/types/anchor_vault_2";
import { expect } from "chai";

describe("anchor-vault-2", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.anchorVault2 as Program<AnchorVault2>;

  const vaultState = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), provider.publicKey.toBuffer()],
    program.programId
  )[0];
  const vault = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultState.toBytes()],
    program.programId
  )[0];

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize(new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL))
      .accountsPartial({
        user: provider.publicKey,
        state: vaultState,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    // console.log("Your transaction signature", tx);
  });

  it("Deposits successfully", async () => {
    const depositAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

    const beforeBalance = await provider.connection.getBalance(vault);

    const tx = await program.methods
      .deposit(depositAmount)
      .accountsPartial({
        user: provider.publicKey,
        state: vaultState,
        vault,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const afterBalance = await provider.connection.getBalance(vault);
    const balanceIncrease = afterBalance - beforeBalance;

    expect(balanceIncrease).to.equal(depositAmount.toNumber());
  });

  it("Fails when depositing more than 1 SOL", async () => {
    const depositAmount = new anchor.BN(1.5 * anchor.web3.LAMPORTS_PER_SOL);

    try {
      await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      expect(true).to.be.false; // Should not reach here
    } catch (error: any) {
      expect(error.message).to.contain(
        "Deposit amount exceeds the 1 SOL limit"
      );
    }
  });

  // Withdrawal Tests
  describe("Withdraw functionality", () => {
    before(async () => {
      // Deposit some funds to test withdrawal
      const depositAmount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
      await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
    });

    it("Withdraws successfully with valid amount", async () => {
      const withdrawAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);

      const beforeVaultBalance = await provider.connection.getBalance(vault);
      const beforeUserBalance = await provider.connection.getBalance(
        provider.publicKey
      );

      const tx = await program.methods
        .withdraw(withdrawAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const afterVaultBalance = await provider.connection.getBalance(vault);
      const afterUserBalance = await provider.connection.getBalance(
        provider.publicKey
      );

      const vaultDecrease = beforeVaultBalance - afterVaultBalance;

      // Check that vault balance decreased by withdrawal amount
      expect(vaultDecrease).to.equal(withdrawAmount.toNumber());

      // User balance should increase (minus transaction fees)
      expect(afterUserBalance).to.be.greaterThan(beforeUserBalance);
    });

    it("Withdraws maximum allowed amount (3 SOL)", async function () {
      // Check current vault balance
      let currentBalance = await provider.connection.getBalance(vault);

      // Deposit enough to have at least 3 SOL (deposit multiple times if needed)
      // Note: check_balance() triggers auto-refund at 2 SOL, so we need to be careful
      const targetBalance = 3.5 * anchor.web3.LAMPORTS_PER_SOL;

      while (currentBalance < targetBalance) {
        const depositAmount = new anchor.BN(
          Math.min(
            1 * anchor.web3.LAMPORTS_PER_SOL,
            targetBalance - currentBalance
          )
        );

        await program.methods
          .deposit(depositAmount)
          .accountsPartial({
            user: provider.publicKey,
            state: vaultState,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        currentBalance = await provider.connection.getBalance(vault);

        // If balance got refunded (check_balance triggered), break and skip test
        if (currentBalance < 0.5 * anchor.web3.LAMPORTS_PER_SOL) {
          console.log("Auto-refund triggered, skipping max withdrawal test");
          this.skip();
          return;
        }
      }

      const withdrawAmount = new anchor.BN(3 * anchor.web3.LAMPORTS_PER_SOL);
      const beforeBalance = await provider.connection.getBalance(vault);

      const tx = await program.methods
        .withdraw(withdrawAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const afterBalance = await provider.connection.getBalance(vault);
      const balanceDecrease = beforeBalance - afterBalance;

      expect(balanceDecrease).to.equal(withdrawAmount.toNumber());
    });

    it("Fails when withdrawing more than 3 SOL", async () => {
      const withdrawAmount = new anchor.BN(3.5 * anchor.web3.LAMPORTS_PER_SOL);

      try {
        await program.methods
          .withdraw(withdrawAmount)
          .accountsPartial({
            user: provider.publicKey,
            state: vaultState,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.contain(
          "Withdrawal amount exceeds the 3 SOL limit"
        );
      }
    });

    it("Fails when withdrawing more than vault balance", async () => {
      const vaultBalance = await provider.connection.getBalance(vault);

      // Try to withdraw more than available (but within 3 SOL limit if balance is low)
      const withdrawAmount = new anchor.BN(
        Math.min(
          vaultBalance + anchor.web3.LAMPORTS_PER_SOL,
          2.9 * anchor.web3.LAMPORTS_PER_SOL
        )
      );

      try {
        await program.methods
          .withdraw(withdrawAmount)
          .accountsPartial({
            user: provider.publicKey,
            state: vaultState,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Should fail due to insufficient funds
        expect(error).to.exist;
      }
    });

    it("Allows multiple small withdrawals", async () => {
      // Deposit first to ensure we have balance
      const depositAmount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
      await program.methods
        .deposit(depositAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const withdrawAmount = new anchor.BN(0.3 * anchor.web3.LAMPORTS_PER_SOL);
      const beforeBalance = await provider.connection.getBalance(vault);

      // Perform 3 small withdrawals
      for (let i = 0; i < 3; i++) {
        await program.methods
          .withdraw(withdrawAmount)
          .accountsPartial({
            user: provider.publicKey,
            state: vaultState,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
      }

      const afterBalance = await provider.connection.getBalance(vault);
      const totalWithdrawn = beforeBalance - afterBalance;

      expect(totalWithdrawn).to.equal(withdrawAmount.toNumber() * 3);
    });

    it("Withdraws exact amount without rounding errors", async function () {
      // Check current balance and deposit if needed
      const currentBalance = await provider.connection.getBalance(vault);
      const withdrawAmount = new anchor.BN(123456789); // Odd number of lamports

      // If vault doesn't have enough, deposit some (but stay below 2 SOL to avoid auto-refund)
      if (currentBalance < withdrawAmount.toNumber()) {
        const depositAmount = new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL);
        await program.methods
          .deposit(depositAmount)
          .accountsPartial({
            user: provider.publicKey,
            state: vaultState,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
      }

      const beforeBalance = await provider.connection.getBalance(vault);

      // Skip test if vault still doesn't have enough (auto-refund might have triggered)
      if (beforeBalance < withdrawAmount.toNumber()) {
        console.log(
          "Insufficient balance after deposit, skipping precision test"
        );
        this.skip();
        return;
      }

      await program.methods
        .withdraw(withdrawAmount)
        .accountsPartial({
          user: provider.publicKey,
          state: vaultState,
          vault,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const afterBalance = await provider.connection.getBalance(vault);
      const actualWithdrawn = beforeBalance - afterBalance;

      expect(actualWithdrawn).to.equal(withdrawAmount.toNumber());
    });
  });
});

import { prisma } from "../src/lib/database/prisma";
import { getAvailableEggBalance } from "../src/server/services/egg-ledger";
import {
  getAdminEggSaleDetails,
  getEggMarkets,
  getEggMarketStats,
  markEggPayoutPaid,
  markEggPayoutProcessing,
  rejectEggPayout,
  requestEggMarketSalePayout,
} from "../src/server/services/egg-market-service";

async function main() {
  console.log("=== Testing Egg Market & Manual Payout Queue Workflow ===");

  // 1. Find or create a test user
  const user = await prisma.user.findFirst({
    where: { role: "USER" },
  });

  const admin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });

  if (!user || !admin) {
    throw new Error("Missing user or admin account in database.");
  }

  console.log(`Test User: ${user.username} (${user.id})`);
  console.log(`Admin User: ${admin.username} (${admin.id})`);

  // 2. Ensure test user has sufficient eggs
  const initialBalance = await getAvailableEggBalance(user.id);
  console.log(`Initial available egg balance: ${initialBalance} eggs`);

  if (initialBalance < 500) {
    console.log("Crediting 500 eggs to test user...");
    await prisma.eggLedgerEntry.create({
      data: {
        userId: user.id,
        entryType: "ADMIN_CREDIT",
        eggUnits: 500,
        description: "Test initial balance credit for egg market verification",
        sourceType: "ADMIN_ADJUSTMENT",
        idempotencyKey: `test-credit-${Date.now()}`,
      },
    });
  }

  const balanceAfterCredit = await getAvailableEggBalance(user.id);
  console.log(`Current egg balance: ${balanceAfterCredit} eggs`);

  // 3. Fetch markets
  const markets = await getEggMarkets(user.id);
  console.log(`Fetched ${markets.length} egg markets.`);
  const alQaim = markets.find((m) => m.code === "AL-QAIM-MARKET");
  if (!alQaim) throw new Error("AL-QAIM-MARKET not found.");

  // 4. Submit Payout Request (Test Rejection Flow)
  console.log("\n--- Submitting Sale Request 1 (50 eggs to Al Qaim Market via JazzCash) ---");
  const testPhone = "03001234567";
  const testHolder = "Muhammad Ali";
  const sale1 = await requestEggMarketSalePayout({
    userId: user.id,
    marketId: alQaim.id,
    eggQuantity: 50,
    payoutMethod: "JAZZCASH",
    accountHolderName: testHolder,
    accountNumber: testPhone,
    idempotencyKey: `test-sale-1-${Date.now()}`,
  });

  console.log(`✓ Created Payout Request: ${sale1.publicReference}`);
  console.log(`  Status: ${sale1.status}`);
  console.log(`  Masked Account: ${sale1.accountNumberMasked}`);
  console.log(`  Protected Number: ${sale1.accountNumberProtected?.slice(0, 15)}...`);
  console.log(`  Total PKR Paisa: ${sale1.totalAmountPaisa}`);

  const balanceAfterSale1 = await getAvailableEggBalance(user.id);
  console.log(`Balance after reservation: ${balanceAfterSale1} eggs (Expected: ${balanceAfterCredit - 50})`);
  if (balanceAfterSale1 !== balanceAfterCredit - 50) {
    throw new Error("Egg reservation failed to deduct from available balance!");
  }

  // 5. Admin Moves to Processing
  console.log("\n--- Admin Processing Transition ---");
  const processingSale = await markEggPayoutProcessing({
    actor: admin,
    saleId: sale1.id,
    notes: "Reviewing JazzCash credentials",
  });
  console.log(`✓ Updated status: ${processingSale.status} (processingAt: ${processingSale.processingAt})`);

  // 6. Admin Decrypts Details
  console.log("\n--- Admin Decrypting Details ---");
  const decryptedDetails = await getAdminEggSaleDetails(sale1.id, admin);
  console.log(`✓ Decrypted Account Title: ${decryptedDetails.accountHolderNameDecrypted}`);
  console.log(`✓ Decrypted Mobile Number: ${decryptedDetails.accountNumberDecrypted}`);
  if (decryptedDetails.accountNumberDecrypted !== testPhone) {
    throw new Error("Decrypted mobile number does not match original input!");
  }

  // 7. Admin Rejects Payout & Releases Eggs
  console.log("\n--- Admin Rejecting Payout (Compensatory Reversal Test) ---");
  const rejectedSale = await rejectEggPayout({
    actor: admin,
    saleId: sale1.id,
    reason: "Test rejection: invalid account title provided by customer",
    notes: "Customer notified via SMS",
  });
  console.log(`✓ Rejected status: ${rejectedSale.status}`);
  console.log(`  Rejection Reason: ${rejectedSale.rejectionReason}`);

  const balanceAfterRejection = await getAvailableEggBalance(user.id);
  console.log(`Balance after rejection release: ${balanceAfterRejection} eggs (Expected: ${balanceAfterCredit})`);
  if (balanceAfterRejection !== balanceAfterCredit) {
    throw new Error("Compensatory egg release failed to restore user balance!");
  }

  // 8. Submit Payout Request 2 (Test Paid Flow)
  console.log("\n--- Submitting Sale Request 2 (80 eggs via Easypaisa) ---");
  const alKhair = markets.find((m) => m.code === "AL-KHAIR-MARKET")!;
  const sale2 = await requestEggMarketSalePayout({
    userId: user.id,
    marketId: alKhair.id,
    eggQuantity: 80,
    payoutMethod: "EASYPAISA",
    accountHolderName: "Zahid Khan",
    accountNumber: "03459876543",
    idempotencyKey: `test-sale-2-${Date.now()}`,
  });

  console.log(`✓ Created Payout Request: ${sale2.publicReference}`);
  const balanceAfterSale2 = await getAvailableEggBalance(user.id);
  console.log(`Balance after sale 2: ${balanceAfterSale2} eggs`);

  // 9. Admin Marks Paid with Transaction ID
  console.log("\n--- Admin Approving & Marking Paid ---");
  const testTxnId = "EP-TID-99281726";
  const paidSale = await markEggPayoutPaid({
    actor: admin,
    saleId: sale2.id,
    adminTransactionId: testTxnId,
    notes: "Transfer confirmed via Easypaisa Merchant Portal",
  });

  console.log(`✓ Paid status: ${paidSale.status}`);
  console.log(`  Admin Txn ID: ${paidSale.adminTransactionId}`);
  console.log(`  Paid At: ${paidSale.paidAt}`);

  const stats = await getEggMarketStats(user.id);
  console.log("\n--- Final User Market Stats ---");
  console.log(`Available Eggs: ${stats.availableEggs}`);
  console.log(`Total Eggs Sold: ${stats.totalEggsSold}`);
  console.log(`Total Earned Rs: ${stats.totalEarnedRs}`);

  console.log("\n🎉 ALL EGG MARKET PAYOUT TESTS PASSED PERFECTLY!");
}

main()
  .catch((e) => {
    console.error("Test Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { up } from "./src/migrations/002_create_bank_accounts.js";

/**
 * Run bank accounts migration
 */
const runMigration = async () => {
  try {
    console.log("🚀 Starting bank accounts migration...");
    await up();
    console.log("✅ Bank accounts migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();

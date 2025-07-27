import { up } from "./001_update_order_structure.js";
import { up as migration2 } from "./002_create_bank_accounts.js";
import migration3 from "./003_update_order_model_new_requirements.js";
import sequelize from "../config/database.js";

const runMigration = async () => {
  try {
    console.log("Starting migration process...");

    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Run migrations in order
    console.log("\n🔄 Running migration 1: Update order structure...");
    await up();

    console.log("\n🔄 Running migration 2: Create bank accounts...");
    await migration2();

    console.log(
      "\n🔄 Running migration 3: Update order model with new requirements..."
    );
    await migration3();

    console.log("\n🎉 All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();

import { up } from "./001_update_order_structure.js";
import sequelize from "../config/database.js";

const runMigration = async () => {
  try {
    console.log("Starting migration process...");

    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Run migration
    await up();

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();

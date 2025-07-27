import migration3 from "./src/migrations/003_update_order_model_new_requirements.js";
import sequelize from "./src/config/database.js";

const runNewMigration = async () => {
  try {
    console.log("Starting new migration process...");

    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection established successfully");

    // Run only the new migration
    console.log(
      "\n🔄 Running migration: Update order model with new requirements..."
    );
    await migration3();

    console.log("\n🎉 New migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runNewMigration();

import { syncModels } from "./src/models/index.js";
import dotenv from "dotenv";

dotenv.config();

console.log("⚠️  WARNING: This will completely reset the database!");
console.log("All data will be lost. Are you sure? (y/N)");

// Read from stdin
process.stdin.setEncoding("utf8");
process.stdin.on("data", async (data) => {
  const input = data.trim().toLowerCase();

  if (input === "y" || input === "yes") {
    console.log("Resetting database...");

    // Set environment variable to force sync
    process.env.FORCE_SYNC = "true";

    try {
      await syncModels();
      console.log("✅ Database reset successfully!");
    } catch (error) {
      console.error("❌ Error resetting database:", error);
    }
  } else {
    console.log("Database reset cancelled.");
  }

  process.exit(0);
});

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\nDatabase reset cancelled.");
  process.exit(0);
});

import sequelize from "../config/database.js";

/**
 * Migration to fix bank_accounts table indexes
 */
export const up = async () => {
  try {
    console.log("🔧 Fixing bank accounts table indexes...");

    // Remove incorrect unique indexes
    await sequelize
      .getQueryInterface()
      .removeIndex("bank_accounts", "sqlite_autoindex_bank_accounts_2");
    console.log("✅ Removed unique index on managerId");

    await sequelize
      .getQueryInterface()
      .removeIndex("bank_accounts", "sqlite_autoindex_bank_accounts_3");
    console.log("✅ Removed unique index on identifier");

    // Keep only the correct composite unique index
    console.log("✅ Kept composite unique index on (managerId, identifier)");

    console.log("✅ Bank accounts table indexes fixed successfully");
  } catch (error) {
    console.error("❌ Error fixing bank accounts table indexes:", error);
    throw error;
  }
};

/**
 * Migration to restore bank_accounts table indexes
 */
export const down = async () => {
  try {
    console.log("🔄 Restoring bank accounts table indexes...");

    // Add back the unique indexes (if needed for rollback)
    await sequelize.getQueryInterface().addIndex("bank_accounts", {
      fields: ["managerId"],
      unique: true,
      name: "sqlite_autoindex_bank_accounts_2",
    });

    await sequelize.getQueryInterface().addIndex("bank_accounts", {
      fields: ["identifier"],
      unique: true,
      name: "sqlite_autoindex_bank_accounts_3",
    });

    console.log("✅ Bank accounts table indexes restored");
  } catch (error) {
    console.error("❌ Error restoring bank accounts table indexes:", error);
    throw error;
  }
};

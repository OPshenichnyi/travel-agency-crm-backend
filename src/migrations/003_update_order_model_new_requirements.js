import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Migration: Update Order Model with New Requirements
 *
 * Changes:
 * 1. Add clientDocumentNumber field (string, nullable)
 * 2. Update statusOrder enum values: ["pending", "approved", "rejected"]
 * 3. Update default status to "pending"
 * 4. Update payments structure to use paymentMethods array
 */

const migration = async () => {
  try {
    console.log(
      "🔄 Starting migration: Update Order Model with New Requirements"
    );

    // 1. Add clientDocumentNumber column if it doesn't exist
    console.log("📝 Checking clientDocumentNumber column...");
    const [columns] = await sequelize.query(`
      PRAGMA table_info(orders)
    `);

    const hasClientDocumentNumber = columns.some(
      (col) => col.name === "clientDocumentNumber"
    );

    if (!hasClientDocumentNumber) {
      console.log("📝 Adding clientDocumentNumber column...");
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN clientDocumentNumber VARCHAR(255) NULL
      `);
      console.log("✅ clientDocumentNumber column added");
    } else {
      console.log("✅ clientDocumentNumber column already exists");
    }

    // 2. Update statusOrder column to use new enum values
    console.log("📝 Updating statusOrder column with new enum values...");

    // First, update existing records to use new status values
    await sequelize.query(`
      UPDATE orders 
      SET statusOrder = 'pending' 
      WHERE statusOrder = 'unpaid'
    `);

    await sequelize.query(`
      UPDATE orders 
      SET statusOrder = 'approved' 
      WHERE statusOrder = 'aprove'
    `);

    await sequelize.query(`
      UPDATE orders 
      SET statusOrder = 'rejected' 
      WHERE statusOrder = 'paid'
    `);

    console.log("✅ Status values updated");

    // 3. Update payments structure to use paymentMethods
    console.log("📝 Updating payments structure...");

    // Get all orders with payments
    const [orders] = await sequelize.query(`
      SELECT id, payments FROM orders WHERE payments IS NOT NULL
    `);

    for (const order of orders) {
      if (order.payments) {
        let payments = order.payments;
        let updated = false;

        // Update deposit structure
        if (payments.deposit) {
          if (payments.deposit.method && !payments.deposit.paymentMethods) {
            payments.deposit.paymentMethods = [payments.deposit.method];
            delete payments.deposit.method;
            updated = true;
          } else if (!payments.deposit.paymentMethods) {
            payments.deposit.paymentMethods = [];
          }
        }

        // Update balance structure
        if (payments.balance) {
          if (payments.balance.method) {
            delete payments.balance.method;
            updated = true;
          }
          if (!payments.balance.paymentMethods) {
            payments.balance.paymentMethods = [];
          }
        }

        // Update the record if changes were made
        if (updated) {
          await sequelize.query(
            `
            UPDATE orders 
            SET payments = ? 
            WHERE id = ?
          `,
            {
              replacements: [JSON.stringify(payments), order.id],
            }
          );
        }
      }
    }

    console.log("✅ Payments structure updated");

    // 4. Update default value for statusOrder (SQLite doesn't support ALTER COLUMN SET DEFAULT)
    // This will be handled by the model definition
    console.log("✅ Default value will be handled by model definition");

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

export default migration;

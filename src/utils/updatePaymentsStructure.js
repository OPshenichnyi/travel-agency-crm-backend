import sequelize from "../config/database.js";

/**
 * Update payments structure in existing orders
 * Remove method field from balance payments
 */
const updatePaymentsStructure = async () => {
  try {
    console.log("Starting payments structure update...");

    // Get all orders with payments
    const [orders] = await sequelize.query(`
      SELECT id, payments FROM orders WHERE payments IS NOT NULL
    `);

    let updatedCount = 0;

    for (const order of orders) {
      if (!order.payments) continue;

      let payments = order.payments;
      let needsUpdate = false;

      // Parse payments if it's a string
      if (typeof payments === "string") {
        try {
          payments = JSON.parse(payments);
        } catch (error) {
          console.warn(
            `Failed to parse payments for order ${order.id}:`,
            error.message
          );
          continue;
        }
      }

      // Update balance structure - remove method field
      if (payments.balance && payments.balance.method !== undefined) {
        delete payments.balance.method;
        needsUpdate = true;
      }

      // Update deposit structure - ensure method field exists
      if (payments.deposit && payments.deposit.method === undefined) {
        payments.deposit.method = "default";
        needsUpdate = true;
      }

      if (needsUpdate) {
        await sequelize.query(
          `
          UPDATE orders 
          SET payments = ? 
          WHERE id = ?
        `,
          {
            replacements: [JSON.stringify(payments), order.id],
            type: sequelize.QueryTypes.UPDATE,
          }
        );
        updatedCount++;
      }
    }

    console.log(`Updated payments structure for ${updatedCount} orders`);
  } catch (error) {
    console.error("Failed to update payments structure:", error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updatePaymentsStructure()
    .then(() => {
      console.log("Payments structure update completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Payments structure update failed:", error);
      process.exit(1);
    });
}

export default updatePaymentsStructure;

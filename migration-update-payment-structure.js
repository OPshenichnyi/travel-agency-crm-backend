import sequelize from "./src/config/database.js";

const updatePaymentStructure = async () => {
  try {
    console.log("🔄 Starting payment structure migration...");

    // Add new payment fields
    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN depositAmount FLOAT DEFAULT 0;
    `);
    console.log("✅ Added depositAmount field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN depositStatus VARCHAR(10) DEFAULT 'unpaid';
    `);
    console.log("✅ Added depositStatus field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN depositDueDate DATE;
    `);
    console.log("✅ Added depositDueDate field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN depositPaidDate DATE;
    `);
    console.log("✅ Added depositPaidDate field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN depositPaymentMethods JSON DEFAULT '[]';
    `);
    console.log("✅ Added depositPaymentMethods field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN balanceAmount FLOAT DEFAULT 0;
    `);
    console.log("✅ Added balanceAmount field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN balanceStatus VARCHAR(10) DEFAULT 'unpaid';
    `);
    console.log("✅ Added balanceStatus field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN balanceDueDate DATE;
    `);
    console.log("✅ Added balanceDueDate field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN balancePaidDate DATE;
    `);
    console.log("✅ Added balancePaidDate field");

    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN balancePaymentMethods JSON DEFAULT '[]';
    `);
    console.log("✅ Added balancePaymentMethods field");

    // Migrate existing data from payments JSON to new fields
    const orders = await sequelize.query(
      `
      SELECT id, payments FROM orders WHERE payments IS NOT NULL
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(
      `📋 Found ${orders.length} orders with payments data to migrate`
    );

    for (const order of orders) {
      if (order.payments) {
        const payments =
          typeof order.payments === "string"
            ? JSON.parse(order.payments)
            : order.payments;

        const updateData = {};

        if (payments.deposit) {
          updateData.depositAmount = payments.deposit.amount || 0;
          updateData.depositStatus = payments.deposit.status || "unpaid";
          updateData.depositDueDate = payments.deposit.dueDate || null;
          updateData.depositPaidDate = payments.deposit.paidDate || null;
          updateData.depositPaymentMethods = JSON.stringify(
            payments.deposit.paymentMethods || []
          );
        }

        if (payments.balance) {
          updateData.balanceAmount = payments.balance.amount || 0;
          updateData.balanceStatus = payments.balance.status || "unpaid";
          updateData.balanceDueDate = payments.balance.dueDate || null;
          updateData.balancePaidDate = payments.balance.paidDate || null;
          updateData.balancePaymentMethods = JSON.stringify(
            payments.balance.paymentMethods || []
          );
        }

        if (Object.keys(updateData).length > 0) {
          const setClause = Object.keys(updateData)
            .map((key) => `${key} = ?`)
            .join(", ");
          const values = Object.values(updateData);

          await sequelize.query(
            `
            UPDATE orders SET ${setClause} WHERE id = ?
          `,
            {
              replacements: [...values, order.id],
              type: sequelize.QueryTypes.UPDATE,
            }
          );
        }
      }
    }

    console.log("✅ Migrated existing payments data");

    // Remove old payments column
    await sequelize.query(`
      ALTER TABLE orders DROP COLUMN payments;
    `);
    console.log("✅ Removed old payments column");

    console.log("🎉 Payment structure migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await sequelize.close();
  }
};

updatePaymentStructure();

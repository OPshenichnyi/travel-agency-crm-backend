import { sequelize } from "./src/models/index.js";

const checkDatabaseConstraints = async () => {
  try {
    console.log("🔍 Checking database constraints...");

    // Check table structure
    const tableInfo = await sequelize
      .getQueryInterface()
      .describeTable("bank_accounts");
    console.log("📊 Bank accounts table structure:");
    console.log(JSON.stringify(tableInfo, null, 2));

    // Check indexes
    const indexes = await sequelize
      .getQueryInterface()
      .showIndex("bank_accounts");
    console.log("\n📋 Bank accounts table indexes:");
    console.log(JSON.stringify(indexes, null, 2));

    // Check foreign keys
    const foreignKeys = await sequelize
      .getQueryInterface()
      .getForeignKeyReferencesForTable("bank_accounts");
    console.log("\n🔗 Bank accounts table foreign keys:");
    console.log(JSON.stringify(foreignKeys, null, 2));

    // Check current data
    const [results] = await sequelize.query(
      "SELECT COUNT(*) as count FROM bank_accounts"
    );
    console.log("\n📈 Current bank accounts count:", results[0].count);

    // Check for any unique constraints
    const [uniqueConstraints] = await sequelize.query(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='index' AND tbl_name='bank_accounts' AND sql LIKE '%UNIQUE%'
    `);
    console.log("\n🔒 Unique constraints:");
    console.log(JSON.stringify(uniqueConstraints, null, 2));
  } catch (error) {
    console.error("❌ Error checking database constraints:", error.message);
  } finally {
    await sequelize.close();
  }
};

checkDatabaseConstraints();

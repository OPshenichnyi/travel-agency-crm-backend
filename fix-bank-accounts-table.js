import { sequelize, BankAccount, User } from "./src/models/index.js";

const fixBankAccountsTable = async () => {
  try {
    console.log("🔧 Fixing bank accounts table...");

    // Backup existing data
    console.log("📋 Backing up existing data...");
    const existingAccounts = await BankAccount.findAll({
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "email"],
        },
      ],
    });

    console.log(
      `📊 Found ${existingAccounts.length} existing accounts to backup`
    );

    // Drop the table
    console.log("🗑️ Dropping existing table...");
    await sequelize.getQueryInterface().dropTable("bank_accounts");

    // Recreate the table with correct structure
    console.log("🏗️ Recreating table with correct structure...");
    await sequelize.getQueryInterface().createTable("bank_accounts", {
      id: {
        type: "UUID",
        defaultValue: "UUIDV4",
        primaryKey: true,
      },
      managerId: {
        type: "UUID",
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      bankName: {
        type: "VARCHAR(255)",
        allowNull: false,
      },
      swift: {
        type: "VARCHAR(255)",
        allowNull: false,
      },
      iban: {
        type: "VARCHAR(255)",
        allowNull: false,
      },
      holderName: {
        type: "VARCHAR(255)",
        allowNull: false,
      },
      address: {
        type: "VARCHAR(255)",
        allowNull: true,
      },
      identifier: {
        type: "VARCHAR(255)",
        allowNull: false,
      },
      createdAt: {
        type: "DATETIME",
        allowNull: false,
        defaultValue: "NOW",
      },
      updatedAt: {
        type: "DATETIME",
        allowNull: false,
        defaultValue: "NOW",
      },
    });

    // Add only the correct composite unique index
    console.log("🔒 Adding correct composite unique index...");
    await sequelize.getQueryInterface().addIndex("bank_accounts", {
      fields: ["managerId", "identifier"],
      unique: true,
      name: "unique_manager_identifier",
    });

    // Restore data
    console.log("📥 Restoring data...");
    for (const account of existingAccounts) {
      await BankAccount.create({
        id: account.id,
        managerId: account.managerId,
        bankName: account.bankName,
        swift: account.swift,
        iban: account.iban,
        holderName: account.holderName,
        address: account.address,
        identifier: account.identifier,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      });
    }

    console.log("✅ Bank accounts table fixed successfully!");
    console.log(`📊 Restored ${existingAccounts.length} accounts`);

    // Verify the fix
    console.log("🔍 Verifying the fix...");
    const newAccounts = await BankAccount.findAll();
    console.log(`📊 Total accounts after fix: ${newAccounts.length}`);

    const indexes = await sequelize
      .getQueryInterface()
      .showIndex("bank_accounts");
    console.log("📋 Indexes after fix:");
    indexes.forEach((index) => {
      console.log(
        `   - ${index.name}: ${index.fields
          .map((f) => f.attribute)
          .join(", ")} (unique: ${index.unique})`
      );
    });
  } catch (error) {
    console.error("❌ Error fixing bank accounts table:", error.message);
  } finally {
    await sequelize.close();
  }
};

fixBankAccountsTable();

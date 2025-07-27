import { sequelize, BankAccount, User } from "./src/models/index.js";

const checkBankAccounts = async () => {
  try {
    console.log("🔍 Checking bank accounts in database...");

    const bankAccounts = await BankAccount.findAll({
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["email", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    console.log(`📊 Found ${bankAccounts.length} bank accounts:`);
    bankAccounts.forEach((account, index) => {
      console.log(
        `   ${index + 1}. ${account.bankName} (${account.identifier})`
      );
      console.log(`      - IBAN: ${account.iban}`);
      console.log(`      - SWIFT: ${account.swift}`);
      console.log(`      - Manager: ${account.manager?.email}`);
      console.log(`      - Created: ${account.createdAt}`);
      console.log(`      - ID: ${account.id}`);
      console.log("");
    });

    // Check for duplicate identifiers per manager
    const managers = await User.findAll({
      where: { role: "manager", isActive: true },
      include: [
        {
          model: BankAccount,
          as: "bankAccounts",
          attributes: ["id", "identifier", "bankName"],
        },
      ],
    });

    console.log("👨‍💼 Managers and their bank accounts:");
    managers.forEach((manager) => {
      console.log(`   ${manager.email}:`);
      if (manager.bankAccounts.length === 0) {
        console.log(`      - No bank accounts`);
      } else {
        manager.bankAccounts.forEach((account) => {
          console.log(`      - ${account.bankName} (${account.identifier})`);
        });
      }
    });
  } catch (error) {
    console.error("❌ Error checking bank accounts:", error.message);
  } finally {
    await sequelize.close();
  }
};

checkBankAccounts();

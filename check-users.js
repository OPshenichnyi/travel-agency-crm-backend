import { sequelize, User } from "./src/models/index.js";

const checkUsers = async () => {
  try {
    console.log("🔍 Checking users in database...");

    const users = await User.findAll({
      attributes: ["id", "email", "role", "firstName", "lastName", "isActive"],
      order: [["createdAt", "ASC"]],
    });

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.email} (${user.role}) - ${user.firstName} ${
          user.lastName
        } - Active: ${user.isActive}`
      );
    });

    // Check for managers specifically
    const managers = await User.findAll({
      where: { role: "manager", isActive: true },
      attributes: ["id", "email", "firstName", "lastName"],
    });

    console.log(`\n👨‍💼 Found ${managers.length} active managers:`);
    managers.forEach((manager, index) => {
      console.log(
        `   ${index + 1}. ${manager.email} - ${manager.firstName} ${
          manager.lastName
        }`
      );
    });
  } catch (error) {
    console.error("❌ Error checking users:", error.message);
  } finally {
    await sequelize.close();
  }
};

checkUsers();

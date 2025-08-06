import User from "./src/models/user.js";
import sequelize from "./src/config/database.js";

async function checkTestUser() {
  try {
    await sequelize.sync();

    const user = await User.findOne({
      where: { email: "test@example.com" },
    });

    if (user) {
      console.log("Test user found:");
      console.log("Email:", user.email);
      console.log("Role:", user.role);
      console.log("Password hash:", user.password.substring(0, 20) + "...");
    } else {
      console.log("Test user not found");
    }
  } catch (error) {
    console.error("Error checking test user:", error);
  } finally {
    await sequelize.close();
  }
}

checkTestUser();

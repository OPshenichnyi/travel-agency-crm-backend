import bcrypt from "bcryptjs";
import User from "./src/models/user.js";
import sequelize from "./src/config/database.js";

async function createTestUser() {
  try {
    await sequelize.sync();

    // Check if test user already exists
    const existingUser = await User.findOne({
      where: { email: "test@example.com" },
    });

    if (existingUser) {
      console.log("Test user already exists");
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash("testpass123", 10);

    const testUser = await User.create({
      email: "test@example.com",
      password: hashedPassword,
      role: "manager",
      firstName: "Test",
      lastName: "User",
    });

    console.log("Test user created successfully:", testUser.email);
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    await sequelize.close();
  }
}

createTestUser();

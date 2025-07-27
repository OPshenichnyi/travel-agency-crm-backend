import { sequelize, User } from "./src/models/index.js";
import bcrypt from "bcryptjs";

const createTestManager = async () => {
  try {
    console.log("🔧 Creating test manager user...");

    // Check if manager already exists
    const existingManager = await User.findOne({
      where: { email: "manager@example.com" },
    });

    if (existingManager) {
      console.log("✅ Test manager already exists:", existingManager.email);
      console.log("   - ID:", existingManager.id);
      console.log("   - Role:", existingManager.role);
      return existingManager;
    }

    // Create test manager
    const hashedPassword = await bcrypt.hash("password123", 10);

    const manager = await User.create({
      email: "manager@example.com",
      password: hashedPassword,
      role: "manager",
      firstName: "Test",
      lastName: "Manager",
      isActive: true,
    });

    console.log("✅ Test manager created successfully!");
    console.log("   - Email:", manager.email);
    console.log("   - Role:", manager.role);
    console.log("   - ID:", manager.id);
    console.log("   - Password: password123");

    return manager;
  } catch (error) {
    console.error("❌ Failed to create test manager:", error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
};

createTestManager();

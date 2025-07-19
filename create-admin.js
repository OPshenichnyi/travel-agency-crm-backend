import { sequelize } from "./src/models/index.js";
import { User } from "./src/models/index.js";
import { registerFirstAdmin } from "./src/services/adminService.js";

const createAdmin = async () => {
  try {
    console.log("🔧 Creating admin user...");

    const adminData = {
      email: "admin@example.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
    };

    const result = await registerFirstAdmin(adminData);

    console.log("✅ Admin created successfully!");
    console.log("   - Email:", result.user.email);
    console.log("   - Role:", result.user.role);
    console.log("   - Token:", result.token ? "Generated" : "Not generated");
  } catch (error) {
    console.error("❌ Failed to create admin:", error.message);
  } finally {
    await sequelize.close();
  }
};

createAdmin();

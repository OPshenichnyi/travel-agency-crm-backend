import bcrypt from "bcryptjs";
import { User } from "./src/models/index.js";

const resetAdminPassword = async () => {
  try {
    // Створюємо новий пароль і хешуємо його
    const newPassword = "admin123"; // Простий пароль для тестування
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Оновлюємо пароль для адміністратора
    const result = await User.update(
      { password: hashedPassword },
      { where: { email: "admin@example.com" } }
    );

    if (result[0] > 0) {
      console.log("Password reset successful");
      console.log("New password: admin123");
    } else {
      console.log("User not found or password not updated");
    }
  } catch (error) {
    console.error("Error during password reset:", error);
  } finally {
    process.exit();
  }
};

resetAdminPassword();

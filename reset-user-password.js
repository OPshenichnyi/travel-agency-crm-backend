import bcrypt from "bcryptjs";
import { User } from "./src/models/index.js";

const resetUserPassword = async () => {
  try {
    // Вкажіть email користувача
    const userEmail = "user@example.com"; // Змініть на ваш email
    const newPassword = "password123"; // Новий простий пароль

    // Знаходимо користувача
    const user = await User.findOne({ where: { email: userEmail } });

    if (!user) {
      console.log(`Користувача з email ${userEmail} не знайдено`);
      return;
    }

    // Хешуємо новий пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Оновлюємо пароль напряму через запит
    await User.update(
      { password: hashedPassword },
      { where: { email: userEmail } }
    );

    console.log(
      `Пароль для користувача ${userEmail} успішно скинуто на: ${newPassword}`
    );
  } catch (error) {
    console.error("Помилка при скиданні пароля:", error);
  } finally {
    process.exit();
  }
};

resetUserPassword();

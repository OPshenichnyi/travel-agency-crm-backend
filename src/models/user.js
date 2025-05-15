import { Model, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import logger from "../utils/logger.js";

class User extends Model {
  /**
   * Method to compare provided password with stored hash
   * @param {string} candidatePassword - Password to verify
   * @returns {Promise<boolean>} - Comparison result
   */
  async comparePassword(candidatePassword) {
    try {
      logger.info("Comparing password...");
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      logger.info(`Password comparison result: ${isMatch}`);
      return isMatch;
    } catch (error) {
      logger.error(`Error comparing passwords: ${error.message}`);
      return false;
    }
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    role: {
      type: DataTypes.STRING, // SQLite не підтримує ENUM
      allowNull: false,
      validate: {
        isIn: {
          args: [["admin", "manager", "agent"]],
          msg: "Role must be one of: admin, manager, agent",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Invalid email format",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [8, 100],
          msg: "Password must be at least 8 characters long",
        },
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: {
          args: /^\+?[0-9]{10,15}$/,
          msg: "Invalid phone number format",
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    hooks: {
      // Hash password before saving to database
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;

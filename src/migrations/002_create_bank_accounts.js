import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Migration to create bank_accounts table
 */
export const up = async () => {
  try {
    await sequelize.getQueryInterface().createTable("bank_accounts", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      managerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      swift: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      iban: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      holderName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      identifier: {
        type: DataTypes.STRING,
        allowNull: false,
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
    });

    // Create unique index for managerId + identifier
    await sequelize.getQueryInterface().addIndex("bank_accounts", {
      fields: ["managerId", "identifier"],
      unique: true,
      name: "unique_manager_identifier",
    });

    console.log("✅ Bank accounts table created successfully");
  } catch (error) {
    console.error("❌ Error creating bank accounts table:", error);
    throw error;
  }
};

/**
 * Migration to drop bank_accounts table
 */
export const down = async () => {
  try {
    await sequelize.getQueryInterface().dropTable("bank_accounts");
    console.log("✅ Bank accounts table dropped successfully");
  } catch (error) {
    console.error("❌ Error dropping bank accounts table:", error);
    throw error;
  }
};

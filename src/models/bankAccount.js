import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class BankAccount extends Model {}

BankAccount.init(
  {
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
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [3, 100],
          msg: "Bank name must be at least 3 characters long",
        },
        notEmpty: {
          msg: "Bank name cannot be empty",
        },
      },
    },
    swift: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
          msg:
            "Invalid SWIFT/BIC format. Must be 8 or 11 characters, uppercase letters and numbers only",
        },
      },
    },
    iban: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,
          msg: "Invalid IBAN format",
        },
      },
    },
    holderName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/,
          msg: "Holder name can only contain letters and spaces",
        },
        len: {
          args: [2, 100],
          msg: "Holder name must be between 2 and 100 characters",
        },
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: "Address cannot exceed 200 characters",
        },
        is: {
          args: /^[a-zA-Zа-яА-ЯіІїЇєЄ0-9\s\.,\-\(\)]+$/,
          msg: "Address contains invalid characters",
        },
      },
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Identifier cannot be empty",
        },
        len: {
          args: [1, 50],
          msg: "Identifier must be between 1 and 50 characters",
        },
      },
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
    modelName: "BankAccount",
    tableName: "bank_accounts",
    indexes: [
      {
        unique: true,
        fields: ["managerId", "identifier"],
        name: "unique_manager_identifier",
      },
    ],
  }
);

export default BankAccount;

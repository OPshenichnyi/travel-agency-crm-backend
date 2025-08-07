import { Model, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../config/database.js";

class Invitation extends Model {}

Invitation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Invalid email format",
        },
      },
    },
    role: {
      type: DataTypes.STRING, // SQLite doesn't support ENUM
      allowNull: false,
      validate: {
        isIn: {
          args: [["manager", "agent"]],
          msg: "Role must be one of: manager, agent",
        },
      },
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: () => uuidv4(),
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => {
        // Invitation valid for 7 days from current date
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      },
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    modelName: "Invitation",
    tableName: "invitations",
    hooks: {
      // Generate unique token before creation
      beforeCreate: (invitation) => {
        if (!invitation.token) {
          invitation.token = uuidv4();
        }
      },
    },
  }
);

export default Invitation;

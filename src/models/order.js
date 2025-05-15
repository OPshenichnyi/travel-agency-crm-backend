import { Model, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import sequelize from "../config/database.js";

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    createdOrder: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    agentName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    agentCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    locationTravel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reservationNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientPhone: {
      type: DataTypes.JSON, // Store as array
      allowNull: false,
    },
    clientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: {
          msg: "Invalid email format",
        },
      },
    },
    guests: {
      type: DataTypes.JSON, // Store guests info as JSON
      allowNull: false,
    },
    officialPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    taxClean: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    bankAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payments: {
      type: DataTypes.JSON, // Store payments info as JSON
      allowNull: false,
    },
    statusOrder: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "unpaid", // Default status
      validate: {
        isIn: {
          args: [["aprove", "unpaid", "paid"]],
          msg: "Status must be one of: aprove, unpaid, paid",
        },
      },
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    hooks: {
      beforeCreate: (order) => {
        // Calculate total price if not provided
        if (!order.totalPrice || order.totalPrice === 0) {
          order.totalPrice = order.officialPrice + (order.taxClean || 0);
        }

        // Set order ID if not provided
        if (!order.id) {
          order.id = uuidv4();
        }
      },
    },
  }
);

export default Order;

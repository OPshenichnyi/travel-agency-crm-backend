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
    reservationNumber: {
      type: DataTypes.STRING,
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
        isEmailOrEmpty: function (value) {
          if (value !== null && value !== "" && value !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error("Invalid email format");
            }
          }
        },
      },
    },
    clientCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientDocumentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      description: "Passport number or other client document number",
    },
    countryTravel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cityTravel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    propertyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    propertyNumber: {
      type: DataTypes.STRING,
      allowNull: false,
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
    discount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    bankAccount: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Deposit payment fields
    depositAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    depositStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "unpaid",
      validate: {
        isIn: {
          args: [["unpaid", "paid"]],
          msg: "Deposit status must be unpaid or paid",
        },
      },
    },
    depositDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    depositPaidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    depositPaymentMethods: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Balance payment fields
    balanceAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    balanceStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "unpaid",
      validate: {
        isIn: {
          args: [["unpaid", "paid"]],
          msg: "Balance status must be unpaid or paid",
        },
      },
    },
    balanceDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    balancePaidDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    balancePaymentMethods: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    statusOrder: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending", // Default status
      validate: {
        isIn: {
          args: [["pending", "approved", "rejected"]],
          msg: "Status must be one of: pending, approved, rejected",
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
          const discount = order.discount || 0;
          order.totalPrice =
            order.officialPrice + (order.taxClean || 0) - discount;
        }

        // Set order ID if not provided
        if (!order.id) {
          order.id = uuidv4();
        }

        // Set default payment statuses
        if (!order.depositStatus) {
          order.depositStatus = "unpaid";
        }
        if (!order.balanceStatus) {
          order.balanceStatus = "unpaid";
        }
      },
    },
  }
);

export default Order;

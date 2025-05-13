import { Model, DataTypes } from "sequelize";
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
    checkIn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    checkOut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nights: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    propertyName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reservationNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reservationCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientIdNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guests: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    officialPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    depositBank: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    cashOnCheckIn: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    damageDeposit: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [["yes", "no"]],
          msg: "Damage deposit must be either 'yes' or 'no'",
        },
      },
    },
    depositPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "draft",
      validate: {
        isIn: {
          args: [["draft", "confirmed", "paid"]],
          msg: "Status must be one of: draft, confirmed, paid",
        },
      },
    },
    pdfInvoiceUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pdfVoucherUrl: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: "Order",
    tableName: "orders",
  }
);

export default Order;

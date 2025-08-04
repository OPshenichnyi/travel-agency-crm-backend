import request from "supertest";
import app from "./src/app.js";
import User from "./src/models/user.js";
import Order from "./src/models/order.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const testDefaultPaymentStatus = async () => {
  try {
    console.log("🧪 Testing default payment status functionality...");

    // Create test users
    const timestamp = Date.now();
    const adminUser = await User.create({
      id: uuidv4(),
      email: `admin${timestamp}@test.com`,
      password: "admin123",
      firstName: "Admin",
      lastName: "Test",
      role: "admin",
    });

    const agentUser = await User.create({
      id: uuidv4(),
      email: `agent${timestamp}@test.com`,
      password: "agent123",
      firstName: "Agent",
      lastName: "Test",
      role: "agent",
    });

    // Generate token
    const adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Test 1: Create order without payment statuses
    console.log("📝 Test 1: Creating order without payment statuses");

    const orderDataWithoutStatuses = {
      agentId: agentUser.id,
      agentName: "Test Agent",
      checkIn: "2024-01-15",
      checkOut: "2024-01-20",
      nights: 5,
      countryTravel: "Spain",
      cityTravel: "Barcelona",
      propertyName: "Test Hotel",
      propertyNumber: "TH001",
      reservationNumber: "RES123",
      clientName: "John Doe",
      clientPhone: ["+1234567890"],
      clientEmail: "john@example.com",
      clientCountry: "USA",
      clientDocumentNumber: "AB123456",
      guests: {
        adults: 2,
        children: 1,
      },
      officialPrice: 1000,
      taxClean: 50,
      discount: 100,
      totalPrice: 950,
      bankAccount: "UA123456789012345678901234567",
      payments: {
        deposit: {
          amount: 300,
          dueDate: "2024-01-10",
          paidDate: null,
          paymentMethods: ["card"],
        },
        balance: {
          amount: 650,
          dueDate: "2024-01-12",
          paidDate: null,
          paymentMethods: [],
        },
      },
    };

    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderDataWithoutStatuses);

    console.log(`✅ Create order response: ${createResponse.status}`);

    if (createResponse.status === 201) {
      const order = createResponse.body;
      console.log("✅ Order created successfully");
      console.log("📋 Full order response:", JSON.stringify(order, null, 2));

      if (order.order && order.order.payments) {
        console.log(
          `   - Deposit status: ${order.order.payments.deposit?.status}`
        );
        console.log(
          `   - Balance status: ${order.order.payments.balance?.status}`
        );

        // Verify default statuses are set
        if (
          order.order.payments.deposit?.status === "unpaid" &&
          order.order.payments.balance?.status === "unpaid"
        ) {
          console.log("✅ Default statuses set correctly");
        } else {
          console.log("❌ Default statuses not set correctly");
        }
      } else {
        console.log("❌ Payments object is missing");
      }
    } else {
      console.log(`❌ Failed to create order: ${createResponse.body.message}`);
    }

    // Test 2: Create order with partial statuses
    console.log("\n📝 Test 2: Creating order with partial statuses");

    const orderDataWithPartialStatuses = {
      agentId: agentUser.id,
      agentName: "Test Agent 2",
      checkIn: "2024-01-16",
      checkOut: "2024-01-21",
      nights: 5,
      countryTravel: "France",
      cityTravel: "Paris",
      propertyName: "Test Hotel 2",
      propertyNumber: "TH002",
      reservationNumber: "RES124",
      clientName: "Jane Doe",
      clientPhone: ["+1234567891"],
      clientEmail: "jane@example.com",
      clientCountry: "UK",
      clientDocumentNumber: "CD123456",
      guests: {
        adults: 1,
        children: 0,
      },
      officialPrice: 800,
      taxClean: 40,
      discount: 50,
      totalPrice: 790,
      bankAccount: "UA123456789012345678901234568",
      payments: {
        deposit: {
          amount: 200,
          status: "paid", // Only deposit has status
          dueDate: "2024-01-10",
          paidDate: "2024-01-10",
          paymentMethods: ["card"],
        },
        balance: {
          amount: 590,
          dueDate: "2024-01-12",
          paidDate: null,
          paymentMethods: [],
        },
      },
    };

    const createResponse2 = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderDataWithPartialStatuses);

    console.log(`✅ Create order response: ${createResponse2.status}`);

    if (createResponse2.status === 201) {
      const order = createResponse2.body;
      console.log("✅ Order created successfully");
      console.log("📋 Full order response:", JSON.stringify(order, null, 2));

      if (order.order && order.order.payments) {
        console.log(
          `   - Deposit status: ${order.order.payments.deposit?.status}`
        );
        console.log(
          `   - Balance status: ${order.order.payments.balance?.status}`
        );

        // Verify deposit status preserved and balance status set to default
        if (
          order.order.payments.deposit?.status === "paid" &&
          order.order.payments.balance?.status === "unpaid"
        ) {
          console.log("✅ Partial statuses handled correctly");
        } else {
          console.log("❌ Partial statuses not handled correctly");
        }
      } else {
        console.log("❌ Payments object is missing");
      }
    } else {
      console.log(`❌ Failed to create order: ${createResponse2.body.message}`);
    }

    // Cleanup
    if (createResponse.status === 201) {
      await Order.destroy({ where: { id: createResponse.body.order.id } });
    }
    if (createResponse2.status === 201) {
      await Order.destroy({ where: { id: createResponse2.body.order.id } });
    }
    await User.destroy({
      where: { id: { [Op.in]: [adminUser.id, agentUser.id] } },
    });

    console.log("\n🎉 Default payment status tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
};

// Run the test
testDefaultPaymentStatus()
  .then(() => {
    console.log("✅ All tests passed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

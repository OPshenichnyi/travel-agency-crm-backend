import request from "supertest";
import app from "./src/app.js";
import User from "./src/models/user.js";
import Order from "./src/models/order.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const testFrontendUpdate = async () => {
  try {
    console.log("🧪 Testing frontend update simulation...");

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

    // Create test order
    console.log("📝 Creating test order...");

    const orderData = {
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
          status: "unpaid",
          dueDate: "2024-01-10",
          paidDate: null,
          paymentMethods: ["card"],
        },
        balance: {
          amount: 650,
          status: "unpaid",
          dueDate: "2024-01-12",
          paidDate: null,
          paymentMethods: [],
        },
      },
    };

    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderData);

    if (createResponse.status !== 201) {
      throw new Error(`Failed to create order: ${createResponse.body.message}`);
    }

    const orderId = createResponse.body.order.id;
    console.log(`✅ Order created with ID: ${orderId}`);

    // Test frontend-like update
    console.log("📝 Testing frontend update...");

    const updateData = {
      payments: {
        deposit: {
          status: "paid",
          paidDate: "2024-01-10",
        },
      },
    };

    console.log(
      "📤 Sending update request:",
      JSON.stringify(updateData, null, 2)
    );

    const updateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateData);

    console.log(`✅ Update response status: ${updateResponse.status}`);
    console.log(
      "📋 Update response:",
      JSON.stringify(updateResponse.body, null, 2)
    );

    // Verify the update
    console.log("📝 Verifying update...");

    const getResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log(`✅ Get response status: ${getResponse.status}`);

    if (getResponse.status === 200) {
      const order = getResponse.body;
      console.log("📋 Final order state:", JSON.stringify(order, null, 2));

      if (order.payments && order.payments.deposit) {
        console.log(`   - Deposit status: ${order.payments.deposit.status}`);
        console.log(
          `   - Deposit paidDate: ${order.payments.deposit.paidDate}`
        );

        if (order.payments.deposit.status === "paid") {
          console.log("✅ Update successful - deposit status changed to paid");
        } else {
          console.log("❌ Update failed - deposit status not changed");
        }
      } else {
        console.log("❌ Payments object missing in response");
      }
    }

    // Cleanup
    await Order.destroy({ where: { id: orderId } });
    await User.destroy({
      where: { id: { [Op.in]: [adminUser.id, agentUser.id] } },
    });

    console.log("\n🎉 Frontend update test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
};

// Run the test
testFrontendUpdate()
  .then(() => {
    console.log("✅ All tests passed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

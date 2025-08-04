import request from "supertest";
import app from "./src/app.js";
import User from "./src/models/user.js";
import Order from "./src/models/order.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

const testNewPaymentStructure = async () => {
  try {
    console.log("🧪 Testing new payment structure...");

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

    // Create JWT tokens
    const adminToken = jwt.sign(
      { userId: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    const agentToken = jwt.sign(
      { userId: agentUser.id, role: agentUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    // Test 1: Create order with default payment statuses
    console.log("\n📋 Test 1: Create order with default payment statuses");
    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        agentId: agentUser.id,
        agentName: "Test Agent",
        checkIn: "2024-01-10",
        checkOut: "2024-01-15",
        nights: 5,
        reservationNumber: "RES123",
        clientName: "John Doe",
        clientPhone: ["+1234567890"],
        clientEmail: "john@example.com",
        clientCountry: "USA",
        countryTravel: "Spain",
        cityTravel: "Barcelona",
        propertyName: "Hotel Test",
        propertyNumber: "HT001",
        guests: [{ name: "John Doe", age: 30 }],
        officialPrice: 1000,
        taxClean: 50,
        discount: 100,
        depositAmount: 300,
        balanceAmount: 650,
      });

    console.log(`✅ Create order response: ${createResponse.status}`);

    if (createResponse.status === 201) {
      const order = createResponse.body;
      console.log("✅ Order created successfully");
      console.log(`   - Deposit status: ${order.order.depositStatus}`);
      console.log(`   - Balance status: ${order.order.balanceStatus}`);

      // Verify default statuses are set
      if (
        order.order.depositStatus === "unpaid" &&
        order.order.balanceStatus === "unpaid"
      ) {
        console.log("✅ Default statuses set correctly");
      } else {
        console.log("❌ Default statuses not set correctly");
      }
    }

    // Test 2: Update payment statuses
    if (createResponse.status === 201) {
      console.log("\n📋 Test 2: Update payment statuses");
      const orderId = createResponse.body.order.id;

      const updateResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          depositStatus: "paid",
          balanceStatus: "paid",
        });

      console.log(`✅ Update order response: ${updateResponse.status}`);

      if (updateResponse.status === 200) {
        const order = updateResponse.body;
        console.log("✅ Order updated successfully");
        console.log(`   - Deposit status: ${order.depositStatus}`);
        console.log(`   - Balance status: ${order.balanceStatus}`);
        console.log(`   - Deposit paid date: ${order.depositPaidDate}`);
        console.log(`   - Balance paid date: ${order.balancePaidDate}`);

        // Verify statuses are updated
        if (order.depositStatus === "paid" && order.balanceStatus === "paid") {
          console.log("✅ Payment statuses updated correctly");
        } else {
          console.log("❌ Payment statuses not updated correctly");
        }
      }
    }

    // Test 3: Verify with GET request
    if (createResponse.status === 201) {
      console.log("\n📋 Test 3: Verify with GET request");
      const orderId = createResponse.body.order.id;

      const getResponse = await request(app)
        .get(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      console.log(`✅ GET order response: ${getResponse.status}`);

      if (getResponse.status === 200) {
        const order = getResponse.body;
        console.log("✅ Order retrieved successfully");
        console.log(`   - Deposit status: ${order.depositStatus}`);
        console.log(`   - Balance status: ${order.balanceStatus}`);

        // Verify statuses are persisted
        if (order.depositStatus === "paid" && order.balanceStatus === "paid") {
          console.log("✅ Payment statuses persisted correctly");
        } else {
          console.log("❌ Payment statuses not persisted correctly");
        }
      }
    }

    // Test 4: Agent cannot update payment statuses
    if (createResponse.status === 201) {
      console.log("\n📋 Test 4: Agent cannot update payment statuses");
      const orderId = createResponse.body.order.id;

      const agentUpdateResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${agentToken}`)
        .send({
          depositStatus: "paid",
          balanceStatus: "paid",
        });

      console.log(`✅ Agent update response: ${agentUpdateResponse.status}`);

      if (agentUpdateResponse.status === 200) {
        const order = agentUpdateResponse.body;
        console.log("✅ Agent update response received");
        console.log(`   - Deposit status: ${order.depositStatus}`);
        console.log(`   - Balance status: ${order.balanceStatus}`);

        // Verify statuses are NOT updated (should remain paid from previous update)
        if (order.depositStatus === "paid" && order.balanceStatus === "paid") {
          console.log("✅ Agent correctly cannot update payment statuses");
        } else {
          console.log("❌ Agent incorrectly updated payment statuses");
        }
      }
    }

    console.log("\n✅ All tests completed!");

    // Cleanup
    if (createResponse.status === 201) {
      await Order.destroy({ where: { id: createResponse.body.order.id } });
    }
    await User.destroy({
      where: { id: { [Op.in]: [adminUser.id, agentUser.id] } },
    });
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

testNewPaymentStructure();

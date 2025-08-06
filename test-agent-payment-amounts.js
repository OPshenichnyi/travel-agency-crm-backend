import request from "supertest";
import app from "./src/app.js";
import { Order, User } from "./src/models/index.js";
import sequelize from "./src/config/database.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

async function runTests() {
  console.log("🧪 Starting Agent Payment Amounts Tests...\n");

  let agentToken, managerToken, adminToken;
  let testOrder, agent, manager, admin;

  try {
    // Create test users
    console.log("📝 Creating test users...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    agent = await User.create({
      email: "agent@test.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "Agent",
      role: "agent",
      isActive: true,
    });

    manager = await User.create({
      email: "manager@test.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "Manager",
      role: "manager",
      isActive: true,
    });

    admin = await User.create({
      email: "admin@test.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "Admin",
      role: "admin",
      isActive: true,
    });

    // Create test order
    console.log("📋 Creating test order...");
    testOrder = await Order.create({
      agentId: agent.id,
      agentName: "Test Agent",
      checkIn: "2024-01-01",
      checkOut: "2024-01-05",
      nights: 4,
      countryTravel: "Ukraine",
      cityTravel: "Kyiv",
      propertyName: "Test Hotel",
      propertyNumber: "TH001",
      reservationNumber: "RES001",
      clientName: "Test Client",
      clientPhone: ["+380123456789"],
      clientEmail: "client@test.com",
      clientCountry: "Ukraine",
      clientDocumentNumber: "AB123456",
      guests: { adults: 2, children: 1 },
      officialPrice: 1000,
      taxClean: 50,
      discount: 100,
      totalPrice: 950,
      bankAccount: "UA123456789",
      depositAmount: 200,
      depositStatus: "unpaid",
      balanceAmount: 750,
      balanceStatus: "unpaid",
      statusOrder: "pending",
    });

    // Get tokens
    console.log("🔑 Getting authentication tokens...");
    const agentResponse = await request(app).post("/auth/login").send({
      email: "agent@test.com",
      password: "password123",
    });
    agentToken = agentResponse.body.token;

    const managerResponse = await request(app).post("/auth/login").send({
      email: "manager@test.com",
      password: "password123",
    });
    managerToken = managerResponse.body.token;

    const adminResponse = await request(app).post("/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });
    adminToken = adminResponse.body.token;

    // Test 1: Agent can edit deposit amount when status is unpaid
    console.log(
      "\n✅ Test 1: Agent can edit deposit amount when status is unpaid"
    );
    const test1Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({
        depositAmount: 300,
      });

    if (
      test1Response.status === 200 &&
      test1Response.body.order.depositAmount === 300
    ) {
      console.log(
        "   PASS: Agent can update deposit amount when deposit status is unpaid"
      );
    } else {
      console.log(
        "   FAIL: Agent cannot update deposit amount when deposit status is unpaid"
      );
      console.log(
        `   Status: ${test1Response.status}, Amount: ${test1Response.body.order?.depositAmount}`
      );
    }

    // Test 2: Agent can edit balance amount when status is unpaid
    console.log(
      "\n✅ Test 2: Agent can edit balance amount when status is unpaid"
    );
    const test2Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({
        balanceAmount: 800,
      });

    if (
      test2Response.status === 200 &&
      test2Response.body.order.balanceAmount === 800
    ) {
      console.log(
        "   PASS: Agent can update balance amount when balance status is unpaid"
      );
    } else {
      console.log(
        "   FAIL: Agent cannot update balance amount when balance status is unpaid"
      );
      console.log(
        `   Status: ${test2Response.status}, Amount: ${test2Response.body.order?.balanceAmount}`
      );
    }

    // Test 3: Manager sets deposit status to paid
    console.log("\n✅ Test 3: Manager sets deposit status to paid");
    await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        depositStatus: "paid",
      });
    console.log("   PASS: Manager set deposit status to paid");

    // Test 4: Agent cannot edit deposit amount when status is paid
    console.log(
      "\n✅ Test 4: Agent cannot edit deposit amount when status is paid"
    );
    const test4Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({
        depositAmount: 400,
      });

    if (
      test4Response.status === 403 &&
      test4Response.body.error.message ===
        "Cannot modify deposit amount when deposit status is paid"
    ) {
      console.log(
        "   PASS: Agent cannot update deposit amount when deposit status is paid"
      );
    } else {
      console.log(
        "   FAIL: Agent was able to update deposit amount when deposit status is paid"
      );
      console.log(
        `   Status: ${test4Response.status}, Message: ${test4Response.body.error?.message}`
      );
    }

    // Test 5: Manager sets balance status to paid
    console.log("\n✅ Test 5: Manager sets balance status to paid");
    await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        balanceStatus: "paid",
      });
    console.log("   PASS: Manager set balance status to paid");

    // Test 6: Agent cannot edit balance amount when status is paid
    console.log(
      "\n✅ Test 6: Agent cannot edit balance amount when status is paid"
    );
    const test6Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send({
        balanceAmount: 900,
      });

    if (
      test6Response.status === 403 &&
      test6Response.body.error.message ===
        "Cannot modify balance amount when balance status is paid"
    ) {
      console.log(
        "   PASS: Agent cannot update balance amount when balance status is paid"
      );
    } else {
      console.log(
        "   FAIL: Agent was able to update balance amount when balance status is paid"
      );
      console.log(
        `   Status: ${test6Response.status}, Message: ${test6Response.body.error?.message}`
      );
    }

    // Test 7: Manager can edit amounts regardless of status
    console.log("\n✅ Test 7: Manager can edit amounts regardless of status");
    const test7Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        depositAmount: 500,
        balanceAmount: 1000,
      });

    if (test7Response.status === 200) {
      console.log(
        "   PASS: Manager can update amounts even when status is paid"
      );
    } else {
      console.log("   FAIL: Manager cannot update amounts when status is paid");
      console.log(`   Status: ${test7Response.status}`);
    }

    // Test 8: Admin can edit amounts regardless of status
    console.log("\n✅ Test 8: Admin can edit amounts regardless of status");
    const test8Response = await request(app)
      .put(`/orders/${testOrder.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        depositAmount: 600,
        balanceAmount: 1200,
      });

    if (test8Response.status === 200) {
      console.log("   PASS: Admin can update amounts even when status is paid");
    } else {
      console.log("   FAIL: Admin cannot update amounts when status is paid");
      console.log(`   Status: ${test8Response.status}`);
    }

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response body:", error.response.body);
    }
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    try {
      await Order.destroy({ where: {} });
      await User.destroy({ where: {} });
      await sequelize.close();
      console.log("✅ Cleanup completed");
    } catch (cleanupError) {
      console.log("⚠️ Cleanup error:", cleanupError.message);
    }
  }
}

runTests();

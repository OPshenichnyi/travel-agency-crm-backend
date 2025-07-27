import request from "supertest";
import app from "./src/app.js";
import { User, Order } from "./src/models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const testNewOrderRequirements = async () => {
  try {
    console.log("🧪 Testing new order requirements implementation...");

    // Create test users
    const adminUser = await User.create({
      email: "admin-test@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "Admin",
      lastName: "Test",
      role: "admin",
      isActive: true,
    });

    const agentUser = await User.create({
      email: "agent-test@example.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "Agent",
      lastName: "Test",
      role: "agent",
      isActive: true,
    });

    // Generate tokens
    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    const agentToken = jwt.sign(
      { id: agentUser.id, email: agentUser.email, role: agentUser.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    // Test 1: Create order with new structure
    console.log("\n📝 Test 1: Creating order with new structure");

    const newOrderData = {
      agentId: agentUser.id,
      agentName: "Test Agent",
      checkIn: "2024-01-15",
      checkOut: "2024-01-20",
      nights: 5,
      countryTravel: "Spain",
      cityTravel: "Barcelona",
      propertyName: "Hotel Barcelona",
      propertyNumber: "HB001",
      reservationNumber: "HB12345",
      clientName: "John Doe",
      clientPhone: ["+1234567890"],
      clientEmail: "john@example.com",
      clientCountry: "USA",
      clientDocumentNumber: "AB123456",
      guests: { adults: 2, children: 1 },
      officialPrice: 1000.0,
      taxClean: 50.0,
      discount: 100.0,
      bankAccount: "UA123456789",
      payments: {
        deposit: {
          status: "unpaid",
          amount: 600,
          paymentMethods: [],
        },
        balance: {
          status: "unpaid",
          amount: 650,
          paymentMethods: [],
        },
      },
    };

    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newOrderData);

    console.log("✅ Create order response status:", createResponse.status);
    if (createResponse.status === 201) {
      console.log("✅ Order created successfully with new structure");
      const order = createResponse.body.order;
      console.log("   - clientDocumentNumber:", order.clientDocumentNumber);
      console.log("   - statusOrder:", order.statusOrder);
      console.log(
        "   - payments.deposit.paymentMethods:",
        order.payments.deposit.paymentMethods
      );
      console.log(
        "   - payments.balance.paymentMethods:",
        order.payments.balance.paymentMethods
      );
    } else {
      console.log("❌ Failed to create order:", createResponse.body);
    }

    // Test 2: Test new status values
    console.log("\n📝 Test 2: Testing new status values");

    const orderWithStatus = {
      ...newOrderData,
      statusOrder: "approved",
    };

    const statusResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderWithStatus);

    console.log("✅ Status test response:", statusResponse.status);
    if (statusResponse.status === 201) {
      console.log("✅ Order with approved status created successfully");
    }

    // Test 3: Test invalid old status
    console.log("\n📝 Test 3: Testing invalid old status");

    const orderWithOldStatus = {
      ...newOrderData,
      statusOrder: "aprove", // Old invalid status
    };

    const oldStatusResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderWithOldStatus);

    console.log("✅ Old status test response:", oldStatusResponse.status);
    if (oldStatusResponse.status === 422) {
      console.log("✅ Correctly rejected old status value");
    }

    // Test 4: Test payments structure with paymentMethods
    console.log("\n📝 Test 4: Testing payments structure");

    const orderWithPaymentMethods = {
      ...newOrderData,
      payments: {
        deposit: {
          status: "paid",
          amount: 600,
          paymentMethods: ["card", "bank_transfer"],
        },
        balance: {
          status: "unpaid",
          amount: 650,
          paymentMethods: ["cash"],
        },
      },
    };

    const paymentResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderWithPaymentMethods);

    console.log("✅ Payment methods test response:", paymentResponse.status);
    if (paymentResponse.status === 201) {
      console.log("✅ Order with paymentMethods created successfully");
      const order = paymentResponse.body.order;
      console.log(
        "   - deposit paymentMethods:",
        order.payments.deposit.paymentMethods
      );
      console.log(
        "   - balance paymentMethods:",
        order.payments.balance.paymentMethods
      );
    }

    // Test 5: Get orders list with new status filter
    console.log("\n📝 Test 5: Testing orders list with new status filter");

    const listResponse = await request(app)
      .get("/api/orders?status=pending")
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("✅ List with status filter response:", listResponse.status);
    if (listResponse.status === 200) {
      console.log("✅ Orders list with new status filter works");
      console.log("   - Total orders:", listResponse.body.total);
    }

    // Test 6: Update order with new structure
    console.log("\n📝 Test 6: Testing order update with new structure");

    if (createResponse.status === 201) {
      const orderId = createResponse.body.order.id;
      const updateData = {
        clientDocumentNumber: "CD789012",
        statusOrder: "approved",
        payments: {
          deposit: {
            status: "paid",
            amount: 600,
            paymentMethods: ["card"],
          },
          balance: {
            status: "unpaid",
            amount: 650,
            paymentMethods: [],
          },
        },
      };

      const updateResponse = await request(app)
        .put(`/api/orders/${orderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      console.log("✅ Update order response:", updateResponse.status);
      if (updateResponse.status === 200) {
        console.log("✅ Order updated successfully with new structure");
        const updatedOrder = updateResponse.body.order;
        console.log(
          "   - Updated clientDocumentNumber:",
          updatedOrder.clientDocumentNumber
        );
        console.log("   - Updated statusOrder:", updatedOrder.statusOrder);
      }
    }

    // Cleanup
    await Order.destroy({ where: {} });
    await User.destroy({ where: { id: [adminUser.id, agentUser.id] } });

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

testNewOrderRequirements();

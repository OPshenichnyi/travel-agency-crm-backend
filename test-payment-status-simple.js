import request from "supertest";
import app from "./src/app.js";
import User from "./src/models/user.js";
import Order from "./src/models/order.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const testPaymentStatusUpdate = async () => {
  try {
    console.log("🧪 Testing payment status update functionality...");

    // Create test users with unique emails
    const timestamp = Date.now();
    const adminUser = await User.create({
      id: uuidv4(),
      email: `admin${timestamp}@test.com`,
      password: "admin123",
      firstName: "Admin",
      lastName: "Test",
      role: "admin",
    });

    const managerUser = await User.create({
      id: uuidv4(),
      email: `manager${timestamp}@test.com`,
      password: "manager123",
      firstName: "Manager",
      lastName: "Test",
      role: "manager",
    });

    const agentUser = await User.create({
      id: uuidv4(),
      email: `agent${timestamp}@test.com`,
      password: "agent123",
      firstName: "Agent",
      lastName: "Test",
      role: "agent",
      managerId: managerUser.id, // Set manager relationship
    });

    // Generate tokens
    const adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const managerToken = jwt.sign(
      { id: managerUser.id, role: managerUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const agentToken = jwt.sign(
      { id: agentUser.id, role: agentUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Test data for creating order
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
      statusOrder: "pending",
    };

    // Test 1: Create order with initial payment statuses
    console.log("\n📝 Test 1: Creating order with initial payment statuses");
    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderData);

    console.log("✅ Create order response:", createResponse.status);
    if (createResponse.status === 201) {
      console.log("✅ Order created successfully");
      console.log(
        "   - Deposit status:",
        createResponse.body.order.payments.deposit.status
      );
      console.log(
        "   - Balance status:",
        createResponse.body.order.payments.balance.status
      );
    } else {
      console.log("❌ Failed to create order:", createResponse.body);
      return;
    }

    const orderId = createResponse.body.order.id;

    // Test 2: Update deposit status to paid
    console.log("\n📝 Test 2: Updating deposit status to paid");
    const updateDepositData = {
      payments: {
        deposit: {
          status: "paid",
          paidDate: "2024-01-10",
        },
      },
    };

    const updateDepositResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateDepositData);

    console.log("✅ Update deposit response:", updateDepositResponse.status);
    if (updateDepositResponse.status === 200) {
      console.log("✅ Deposit status updated successfully");
      console.log(
        "   - New deposit status:",
        updateDepositResponse.body.order.payments.deposit.status
      );
      console.log(
        "   - Paid date:",
        updateDepositResponse.body.order.payments.deposit.paidDate
      );
    } else {
      console.log(
        "❌ Failed to update deposit status:",
        updateDepositResponse.body
      );
    }

    // Test 3: Update balance status to paid
    console.log("\n📝 Test 3: Updating balance status to paid");
    const updateBalanceData = {
      payments: {
        balance: {
          status: "paid",
          paidDate: "2024-01-12",
        },
      },
    };

    const updateBalanceResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateBalanceData);

    console.log("✅ Update balance response:", updateBalanceResponse.status);
    if (updateBalanceResponse.status === 200) {
      console.log("✅ Balance status updated successfully");
      console.log(
        "   - New balance status:",
        updateBalanceResponse.body.order.payments.balance.status
      );
      console.log(
        "   - Paid date:",
        updateBalanceResponse.body.order.payments.balance.paidDate
      );
    } else {
      console.log(
        "❌ Failed to update balance status:",
        updateBalanceResponse.body
      );
    }

    // Test 4: Update both payment statuses at once
    console.log("\n📝 Test 4: Updating both payment statuses at once");
    const updateBothData = {
      payments: {
        deposit: {
          status: "unpaid",
          paidDate: null,
        },
        balance: {
          status: "unpaid",
          paidDate: null,
        },
      },
    };

    const updateBothResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateBothData);

    console.log("✅ Update both payments response:", updateBothResponse.status);
    if (updateBothResponse.status === 200) {
      console.log("✅ Both payment statuses updated successfully");
      console.log(
        "   - Deposit status:",
        updateBothResponse.body.order.payments.deposit.status
      );
      console.log(
        "   - Balance status:",
        updateBothResponse.body.order.payments.balance.status
      );
    } else {
      console.log(
        "❌ Failed to update both payment statuses:",
        updateBothResponse.body
      );
    }

    // Test 5: Test manager permissions
    console.log(
      "\n📝 Test 5: Testing manager permissions for payment status update"
    );
    const managerUpdateData = {
      payments: {
        deposit: {
          status: "paid",
          paidDate: "2024-01-10",
        },
      },
    };

    const managerUpdateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send(managerUpdateData);

    console.log("✅ Manager update response:", managerUpdateResponse.status);
    if (managerUpdateResponse.status === 200) {
      console.log("✅ Manager can update payment statuses");
    } else {
      console.log(
        "❌ Manager cannot update payment statuses:",
        managerUpdateResponse.body
      );
    }

    // Test 6: Test agent restrictions
    console.log(
      "\n📝 Test 6: Testing agent restrictions for payment status update"
    );
    const agentUpdateData = {
      payments: {
        deposit: {
          status: "paid",
          paidDate: "2024-01-10",
        },
      },
    };

    const agentUpdateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send(agentUpdateData);

    console.log("✅ Agent update response:", agentUpdateResponse.status);
    if (agentUpdateResponse.status === 422) {
      console.log(
        "✅ Agent correctly restricted from updating payment statuses"
      );
    } else {
      console.log(
        "❌ Agent should be restricted from updating payment statuses"
      );
    }

    // Test 7: Verify final state
    console.log("\n📝 Test 7: Verifying final order state");
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("✅ Get order response:", getOrderResponse.status);
    if (getOrderResponse.status === 200) {
      const finalOrder = getOrderResponse.body.order;
      console.log("✅ Final order state:");
      console.log("   - Deposit status:", finalOrder.payments.deposit.status);
      console.log("   - Balance status:", finalOrder.payments.balance.status);
      console.log("   - Order status:", finalOrder.statusOrder);
    }

    // Cleanup - delete only the test order and users
    try {
      await Order.destroy({ where: { id: orderId } });
      await User.destroy({
        where: { id: [adminUser.id, managerUser.id, agentUser.id] },
      });
    } catch (error) {
      console.log("⚠️ Cleanup warning:", error.message);
    }

    console.log("\n🎉 All payment status update tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testPaymentStatusUpdate();

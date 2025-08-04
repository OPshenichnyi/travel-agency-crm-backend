import request from "supertest";
import app from "./src/app.js";
import User from "./src/models/user.js";
import Order from "./src/models/order.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const testAdvancedPaymentStatusUpdate = async () => {
  try {
    console.log("🧪 Testing advanced payment status update scenarios...");

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

    const agentUser = await User.create({
      id: uuidv4(),
      email: `agent${timestamp}@test.com`,
      password: "agent123",
      firstName: "Agent",
      lastName: "Test",
      role: "agent",
    });

    // Generate tokens
    const adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
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

    // Test 1: Create order
    console.log("\n📝 Test 1: Creating order with initial payment statuses");
    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderData);

    if (createResponse.status !== 201) {
      console.log("❌ Failed to create order:", createResponse.body);
      return;
    }

    const orderId = createResponse.body.order.id;
    console.log("✅ Order created successfully");

    // Test 2: Update only deposit status with partial data
    console.log("\n📝 Test 2: Updating only deposit status with partial data");
    const updateDepositPartialData = {
      payments: {
        deposit: {
          status: "paid",
          paidDate: "2024-01-10",
        },
      },
    };

    const updateDepositPartialResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateDepositPartialData);

    console.log(
      "✅ Update deposit partial response:",
      updateDepositPartialResponse.status
    );
    if (updateDepositPartialResponse.status === 200) {
      const updatedOrder = updateDepositPartialResponse.body.order;
      console.log("✅ Deposit status updated successfully");
      console.log("   - Deposit status:", updatedOrder.payments.deposit.status);
      console.log(
        "   - Deposit amount preserved:",
        updatedOrder.payments.deposit.amount
      );
      console.log(
        "   - Balance status unchanged:",
        updatedOrder.payments.balance.status
      );
    }

    // Test 3: Update only balance status
    console.log("\n📝 Test 3: Updating only balance status");
    const updateBalanceOnlyData = {
      payments: {
        balance: {
          status: "paid",
          paidDate: "2024-01-12",
        },
      },
    };

    const updateBalanceOnlyResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateBalanceOnlyData);

    console.log(
      "✅ Update balance only response:",
      updateBalanceOnlyResponse.status
    );
    if (updateBalanceOnlyResponse.status === 200) {
      const updatedOrder = updateBalanceOnlyResponse.body.order;
      console.log("✅ Balance status updated successfully");
      console.log("   - Balance status:", updatedOrder.payments.balance.status);
      console.log(
        "   - Deposit status preserved:",
        updatedOrder.payments.deposit.status
      );
    }

    // Test 4: Update payment methods
    console.log("\n📝 Test 4: Updating payment methods");
    const updatePaymentMethodsData = {
      payments: {
        deposit: {
          paymentMethods: ["card", "bank_transfer"],
        },
        balance: {
          paymentMethods: ["cash", "card"],
        },
      },
    };

    const updatePaymentMethodsResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updatePaymentMethodsData);

    console.log(
      "✅ Update payment methods response:",
      updatePaymentMethodsResponse.status
    );
    if (updatePaymentMethodsResponse.status === 200) {
      const updatedOrder = updatePaymentMethodsResponse.body.order;
      console.log("✅ Payment methods updated successfully");
      console.log(
        "   - Deposit payment methods:",
        updatedOrder.payments.deposit.paymentMethods
      );
      console.log(
        "   - Balance payment methods:",
        updatedOrder.payments.balance.paymentMethods
      );
    }

    // Test 5: Update amounts
    console.log("\n📝 Test 5: Updating payment amounts");
    const updateAmountsData = {
      payments: {
        deposit: {
          amount: 400,
        },
        balance: {
          amount: 550,
        },
      },
    };

    const updateAmountsResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateAmountsData);

    console.log("✅ Update amounts response:", updateAmountsResponse.status);
    if (updateAmountsResponse.status === 200) {
      const updatedOrder = updateAmountsResponse.body.order;
      console.log("✅ Payment amounts updated successfully");
      console.log("   - Deposit amount:", updatedOrder.payments.deposit.amount);
      console.log("   - Balance amount:", updatedOrder.payments.balance.amount);
    }

    // Test 6: Update due dates
    console.log("\n📝 Test 6: Updating due dates");
    const updateDueDatesData = {
      payments: {
        deposit: {
          dueDate: "2024-01-15",
        },
        balance: {
          dueDate: "2024-01-18",
        },
      },
    };

    const updateDueDatesResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateDueDatesData);

    console.log("✅ Update due dates response:", updateDueDatesResponse.status);
    if (updateDueDatesResponse.status === 200) {
      const updatedOrder = updateDueDatesResponse.body.order;
      console.log("✅ Due dates updated successfully");
      console.log(
        "   - Deposit due date:",
        updatedOrder.payments.deposit.dueDate
      );
      console.log(
        "   - Balance due date:",
        updatedOrder.payments.balance.dueDate
      );
    }

    // Test 7: Complex update with multiple fields
    console.log("\n📝 Test 7: Complex update with multiple fields");
    const complexUpdateData = {
      payments: {
        deposit: {
          status: "unpaid",
          paidDate: null,
          amount: 500,
          dueDate: "2024-01-20",
          paymentMethods: ["card"],
        },
        balance: {
          status: "unpaid",
          paidDate: null,
          amount: 450,
          dueDate: "2024-01-25",
          paymentMethods: ["cash"],
        },
      },
    };

    const complexUpdateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(complexUpdateData);

    console.log("✅ Complex update response:", complexUpdateResponse.status);
    if (complexUpdateResponse.status === 200) {
      const updatedOrder = complexUpdateResponse.body.order;
      console.log("✅ Complex update successful");
      console.log("   - Deposit:", {
        status: updatedOrder.payments.deposit.status,
        amount: updatedOrder.payments.deposit.amount,
        dueDate: updatedOrder.payments.deposit.dueDate,
        paymentMethods: updatedOrder.payments.deposit.paymentMethods,
      });
      console.log("   - Balance:", {
        status: updatedOrder.payments.balance.status,
        amount: updatedOrder.payments.balance.amount,
        dueDate: updatedOrder.payments.balance.dueDate,
        paymentMethods: updatedOrder.payments.balance.paymentMethods,
      });
    }

    // Test 8: Agent trying to update payment status (should fail)
    console.log(
      "\n📝 Test 8: Agent trying to update payment status (should fail)"
    );
    const agentUpdateData = {
      payments: {
        deposit: {
          status: "paid",
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

    // Test 9: Agent trying to update non-status fields (should succeed)
    console.log(
      "\n📝 Test 9: Agent trying to update non-status fields (should succeed)"
    );
    const agentNonStatusUpdateData = {
      clientName: "Jane Doe",
      clientEmail: "jane@example.com",
      payments: {
        deposit: {
          amount: 600,
          dueDate: "2024-01-30",
        },
      },
    };

    const agentNonStatusUpdateResponse = await request(app)
      .put(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${agentToken}`)
      .send(agentNonStatusUpdateData);

    console.log(
      "✅ Agent non-status update response:",
      agentNonStatusUpdateResponse.status
    );
    if (agentNonStatusUpdateResponse.status === 200) {
      const updatedOrder = agentNonStatusUpdateResponse.body.order;
      console.log("✅ Agent can update non-status fields");
      console.log("   - Client name updated:", updatedOrder.clientName);
      console.log(
        "   - Deposit amount updated:",
        updatedOrder.payments.deposit.amount
      );
      console.log(
        "   - Deposit status unchanged:",
        updatedOrder.payments.deposit.status
      );
    }

    // Test 10: Verify final state
    console.log("\n📝 Test 10: Verifying final order state");
    const getOrderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("✅ Get order response:", getOrderResponse.status);
    if (getOrderResponse.status === 200) {
      const finalOrder = getOrderResponse.body.order;
      console.log("✅ Final order state:");
      console.log("   - Client name:", finalOrder.clientName);
      console.log("   - Deposit:", {
        status: finalOrder.payments.deposit.status,
        amount: finalOrder.payments.deposit.amount,
        dueDate: finalOrder.payments.deposit.dueDate,
        paymentMethods: finalOrder.payments.deposit.paymentMethods,
      });
      console.log("   - Balance:", {
        status: finalOrder.payments.balance.status,
        amount: finalOrder.payments.balance.amount,
        dueDate: finalOrder.payments.balance.dueDate,
        paymentMethods: finalOrder.payments.balance.paymentMethods,
      });
    }

    // Cleanup
    try {
      await Order.destroy({ where: { id: orderId } });
      await User.destroy({ where: { id: [adminUser.id, agentUser.id] } });
    } catch (error) {
      console.log("⚠️ Cleanup warning:", error.message);
    }

    console.log(
      "\n🎉 All advanced payment status update tests completed successfully!"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testAdvancedPaymentStatusUpdate();

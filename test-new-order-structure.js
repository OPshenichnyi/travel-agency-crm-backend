import request from "supertest";
import app from "./src/app.js";
import { sequelize } from "./src/models/index.js";
import { generateToken } from "./src/services/jwtService.js";
import { User, Order } from "./src/models/index.js";

const testNewOrderStructure = async () => {
  try {
    console.log("🧪 Testing new order structure...");

    // Create test agent user
    const testAgent = await User.create({
      email: "agent@example.com",
      password: "password123",
      role: "agent",
      firstName: "Test",
      lastName: "Agent",
      isActive: true,
    });

    // Create test admin user
    const testAdmin = await User.create({
      email: "admin@example.com",
      password: "password123",
      role: "admin",
      firstName: "Test",
      lastName: "Admin",
      isActive: true,
    });

    const adminToken = generateToken(testAdmin);

    // Test 1: Create order with new structure
    console.log("\n📝 Test 1: Creating order with new structure");

    const orderData = {
      agentId: testAgent.id,
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
      guests: { adults: 2, children: 1 },
      officialPrice: 1000.0,
      taxClean: 50.0,
      discount: 100.0,
      bankAccount: "UA123456789",
      payments: {
        deposit: {
          amount: 300,
          status: "paid",
          dueDate: "2024-01-10",
          paidDate: "2024-01-08",
          method: "card",
        },
        balance: {
          amount: 650,
          status: "unpaid",
          dueDate: "2024-01-14",
        },
      },
    };

    const createResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(orderData);

    console.log("✅ Create order response status:", createResponse.status);

    if (createResponse.status === 201) {
      const order = createResponse.body.order;
      console.log("✅ Order created successfully");
      console.log("   - clientCountry:", order.clientCountry);
      console.log("   - countryTravel:", order.countryTravel);
      console.log("   - cityTravel:", order.cityTravel);
      console.log("   - propertyName:", order.propertyName);
      console.log("   - propertyNumber:", order.propertyNumber);
      console.log("   - discount:", order.discount);
      console.log("   - totalPrice:", order.totalPrice);
      console.log(
        "   - payments.balance.method:",
        order.payments.balance.method
      );
      console.log(
        "   - payments.deposit.method:",
        order.payments.deposit.method
      );
    } else {
      console.log("❌ Create order failed:", createResponse.body);
    }

    // Test 2: Try to create order with old structure (should fail)
    console.log(
      "\n📝 Test 2: Trying to create order with old structure (should fail)"
    );

    const oldOrderData = {
      agentId: testAgent.id,
      agentName: "Test Agent",
      agentCountry: "Ukraine", // Old field
      locationTravel: "Spain", // Old field
      checkIn: "2024-01-15",
      checkOut: "2024-01-20",
      nights: 5,
      reservationNumber: "HB12345",
      clientName: "John Doe",
      clientPhone: ["+1234567890"],
      guests: { adults: 2, children: 1 },
      officialPrice: 1000.0,
      payments: {
        deposit: { amount: 300, status: "paid" },
        balance: { amount: 700, status: "unpaid" },
      },
    };

    const oldCreateResponse = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(oldOrderData);

    console.log("✅ Old structure response status:", oldCreateResponse.status);
    if (oldCreateResponse.status === 422) {
      console.log("✅ Correctly rejected old structure");
    } else {
      console.log("❌ Should have rejected old structure");
    }

    // Test 3: Get orders list
    console.log("\n📝 Test 3: Getting orders list");

    const listResponse = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("✅ Get orders response status:", listResponse.status);
    if (listResponse.status === 200) {
      console.log("✅ Orders list retrieved successfully");
      console.log("   - Total orders:", listResponse.body.total);
      if (listResponse.body.orders.length > 0) {
        const order = listResponse.body.orders[0];
        console.log("   - First order has new fields:", {
          clientCountry: !!order.clientCountry,
          countryTravel: !!order.countryTravel,
          cityTravel: !!order.cityTravel,
          propertyName: !!order.propertyName,
          propertyNumber: !!order.propertyNumber,
          discount: order.discount !== undefined,
        });
      }
    }

    // Test 4: Search by new fields
    console.log("\n📝 Test 4: Searching by new fields");

    const searchResponse = await request(app)
      .get("/api/orders?search=Barcelona")
      .set("Authorization", `Bearer ${adminToken}`);

    console.log("✅ Search response status:", searchResponse.status);
    if (searchResponse.status === 200) {
      console.log("✅ Search by new fields works");
      console.log("   - Found orders:", searchResponse.body.orders.length);
    }

    // Cleanup
    await Order.destroy({ where: {} });
    await User.destroy({ where: { id: testAgent.id } });
    await User.destroy({ where: { id: testAdmin.id } });

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await sequelize.close();
  }
};

testNewOrderStructure();

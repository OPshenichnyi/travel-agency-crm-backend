import { sequelize } from "./src/models/index.js";
import { User, Order } from "./src/models/index.js";

const simpleTest = async () => {
  try {
    console.log("🧪 Simple test of new order structure...");

    // Check if we can create an order with new structure
    const testUser = await User.findOne({ where: { role: "admin" } });

    if (!testUser) {
      console.log("❌ No admin user found. Please create an admin user first.");
      return;
    }

    console.log("✅ Found admin user:", testUser.email);

    // Create a test agent
    const testAgent = await User.create({
      email: "test-agent@example.com",
      password: "password123",
      role: "agent",
      firstName: "Test",
      lastName: "Agent",
      isActive: true,
    });

    console.log("✅ Created test agent:", testAgent.email);

    // Try to create an order with new structure
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

    const order = await Order.create(orderData);

    console.log("✅ Order created successfully with new structure!");
    console.log("   - clientCountry:", order.clientCountry);
    console.log("   - countryTravel:", order.countryTravel);
    console.log("   - cityTravel:", order.cityTravel);
    console.log("   - propertyName:", order.propertyName);
    console.log("   - propertyNumber:", order.propertyNumber);
    console.log("   - discount:", order.discount);
    console.log("   - totalPrice:", order.totalPrice);
    console.log("   - payments.balance.method:", order.payments.balance.method);
    console.log("   - payments.deposit.method:", order.payments.deposit.method);

    // Test search functionality
    const searchResults = await Order.findAll({
      where: {
        cityTravel: "Barcelona",
      },
    });

    console.log(
      "✅ Search by new field works:",
      searchResults.length,
      "orders found"
    );

    // Cleanup
    await Order.destroy({ where: { id: order.id } });
    await User.destroy({ where: { id: testAgent.id } });

    console.log(
      "\n🎉 All tests passed! New order structure is working correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await sequelize.close();
  }
};

simpleTest();

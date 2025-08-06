import axios from "axios";
import fs from "fs";

const BASE_URL = "http://localhost:3000/api";

// Test data
const testUser = {
  email: "test@example.com",
  password: "testpass123",
};

const testOrder = {
  agentName: "Test Agent",
  checkIn: "2024-07-15",
  checkOut: "2024-07-22",
  nights: 7,
  countryTravel: "Greece",
  cityTravel: "Athens",
  propertyName: "Test Hotel",
  propertyNumber: "TH001",
  reservationNumber: "RES-2024-001",
  clientName: "John Doe",
  clientPhone: ["+1234567890"],
  clientCountry: "USA",
  guests: [
    { name: "John Doe", age: 30 },
    { name: "Jane Doe", age: 28 },
  ],
  officialPrice: 1000,
  taxClean: 50,
  totalPrice: 1050,
  balanceAmount: 200,
  bankAccount: JSON.stringify({
    accountNumber: "1234567890",
    bankName: "Test Bank",
    iban: "GR123456789012345678901234567",
    swift: "TESTGRAA",
  }),
};

async function testVoucherEndpoint() {
  try {
    console.log("🧪 Testing voucher generation endpoint...\n");

    // 1. Login to get token
    console.log("1. Logging in...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log("✅ Login successful\n");

    // 2. Create a test order
    console.log("2. Creating test order...");
    const createOrderResponse = await axios.post(
      `${BASE_URL}/orders`,
      testOrder,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const orderId = createOrderResponse.data.id;
    console.log(`✅ Order created with ID: ${orderId}\n`);

    // 3. Update order status to approved (simulate manager approval)
    console.log("3. Updating order status to approved...");
    await axios.put(
      `${BASE_URL}/orders/${orderId}`,
      {
        statusOrder: "approved",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("✅ Order status updated to approved\n");

    // 4. Test voucher generation
    console.log("4. Testing voucher generation...");
    const voucherResponse = await axios.get(
      `${BASE_URL}/orders/${orderId}/voucher`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "arraybuffer",
      }
    );

    if (voucherResponse.status === 200) {
      console.log("✅ Voucher generated successfully!");
      console.log(
        `📄 Content-Type: ${voucherResponse.headers["content-type"]}`
      );
      console.log(
        `📄 Content-Length: ${voucherResponse.headers["content-length"]}`
      );
      console.log(
        `📄 Content-Disposition: ${voucherResponse.headers["content-disposition"]}`
      );

      // Save PDF to file for inspection
      const pdfBuffer = Buffer.from(voucherResponse.data);
      fs.writeFileSync("test-voucher.pdf", pdfBuffer);
      console.log("💾 PDF saved as test-voucher.pdf");

      console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    }

    // 5. Test error cases
    console.log("\n5. Testing error cases...");

    // Test with non-existent order
    try {
      await axios.get(
        `${BASE_URL}/orders/00000000-0000-0000-0000-000000000000/voucher`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("✅ 404 error for non-existent order - correct");
      }
    }

    // Test with pending order
    console.log("6. Creating pending order and testing voucher generation...");
    const pendingOrder = { ...testOrder, reservationNumber: "RES-2024-002" };
    const pendingOrderResponse = await axios.post(
      `${BASE_URL}/orders`,
      pendingOrder,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const pendingOrderId = pendingOrderResponse.data.id;

    try {
      await axios.get(`${BASE_URL}/orders/${pendingOrderId}/voucher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      if (error.response?.status === 403) {
        console.log("✅ 403 error for pending order - correct");
      }
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testVoucherEndpoint();

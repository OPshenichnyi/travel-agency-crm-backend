import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Test data with duplicate identifier
const duplicateData = {
  bankName: "Test Bank Duplicate",
  swift: "DUPLICATE",
  iban: "UA987654321098765432109876543",
  holderName: "Test Holder",
  address: "Test Address 123",
  identifier: "TEST", // Same as existing account
};

// Test data with unique identifier
const uniqueData = {
  bankName: "Test Bank Unique",
  swift: "UNIQUE12", // 8 characters: 6 letters + 2 alphanumeric
  iban: "UA111111111111111111111111111",
  holderName: "Test Holder",
  address: "Test Address 123",
  identifier: "UNIQUE_TEST", // Unique identifier
};

const testDuplicateIdentifier = async () => {
  try {
    console.log("🔐 Step 1: Login as manager...");

    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "manager@example.com",
      password: "ьфтфпук12345",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful");

    console.log("\n📝 Step 2: Testing duplicate identifier...");
    console.log("📊 Data:", JSON.stringify(duplicateData, null, 2));

    try {
      // Try to create account with duplicate identifier
      const duplicateResponse = await axios.post(
        `${API_BASE_URL}/bank-accounts`,
        duplicateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("❌ Unexpected success with duplicate identifier!");
    } catch (error) {
      console.log("✅ Correctly rejected duplicate identifier");
      console.log("Status:", error.response?.status);
      console.log("Message:", error.response?.data?.message);
    }

    console.log("\n📝 Step 3: Testing unique identifier...");
    console.log("📊 Data:", JSON.stringify(uniqueData, null, 2));

    try {
      // Try to create account with unique identifier
      const uniqueResponse = await axios.post(
        `${API_BASE_URL}/bank-accounts`,
        uniqueData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ Successfully created account with unique identifier!");
      console.log("Account ID:", uniqueResponse.data.data.id);

      // Clean up - delete the created account
      await axios.delete(
        `${API_BASE_URL}/bank-accounts/${uniqueResponse.data.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ Cleaned up - deleted test account");
    } catch (error) {
      console.log("❌ Failed to create account with unique identifier");
      console.log("Status:", error.response?.status);
      console.log("Message:", error.response?.data?.message);
      console.log(
        "Details:",
        error.response?.data?.error?.details || error.response?.data?.details
      );
    }
  } catch (error) {
    console.error("❌ Error occurred:", error.message);
  }
};

testDuplicateIdentifier();

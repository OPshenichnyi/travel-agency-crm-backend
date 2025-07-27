import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

// Correct bank account data with valid formats
const bankAccountData = {
  bankName: "Second Bank",
  swift: "SECOND12", // 8 characters: 6 letters + 2 alphanumeric
  iban: "UA123456789012345678901234567", // 27 characters - matches validation
  holderName: "Konstantinos Vasileiadis",
  address: "City Serres, str. Eleftheriou Venizelou 78 (1st floor)",
  identifier: "Second Account", // Unique identifier
};

const createBankAccount = async () => {
  try {
    console.log("🔐 Step 1: Login as manager...");

    // Login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "manager@example.com",
      password: "ьфтфпук12345",
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful");
    console.log("👤 User:", loginResponse.data.user.email);

    console.log("\n📝 Step 2: Creating bank account...");
    console.log("📊 Data:", JSON.stringify(bankAccountData, null, 2));

    // Create bank account
    const createResponse = await axios.post(
      `${API_BASE_URL}/bank-accounts`,
      bankAccountData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Bank account created successfully!");
    console.log("📊 Response:", JSON.stringify(createResponse.data, null, 2));

    console.log("\n📋 Step 3: Getting all bank accounts...");

    // Get all bank accounts
    const listResponse = await axios.get(`${API_BASE_URL}/bank-accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Bank accounts list:");
    console.log("📊 Total accounts:", listResponse.data.data.length);
    listResponse.data.data.forEach((account, index) => {
      console.log(
        `   ${index + 1}. ${account.bankName} (${account.identifier}) - ${
          account.iban
        }`
      );
    });

    console.log("\n🎉 SUCCESS! You can now create multiple bank accounts!");
  } catch (error) {
    console.error("❌ Error occurred:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message);
    console.error(
      "Details:",
      error.response?.data?.error?.details || error.response?.data?.details
    );
    console.error(
      "Full response:",
      JSON.stringify(error.response?.data, null, 2)
    );
  }
};

createBankAccount();

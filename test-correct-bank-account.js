import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";
let authToken = "";

// Correct test data with valid SWIFT and IBAN formats
const correctBankAccount = {
  bankName: "Test Bank Correct",
  swift: "TESTBANK", // 8 characters - valid
  iban: "UA123456789012345678901234567890", // 30 characters - valid Ukrainian IBAN
  holderName: "Test Holder",
  address: "Test Address 123",
  identifier: "Correct Test Account",
};

/**
 * Login as manager
 */
const loginAsManager = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "manager@example.com",
      password: "ьфтфпук12345",
    });

    authToken = response.data.token;
    console.log("✅ Logged in as manager:", response.data.user.id);
    return true;
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return false;
  }
};

/**
 * Test creating bank account with correct data
 */
const testCreateCorrectBankAccount = async () => {
  try {
    console.log("🧪 Testing creation of bank account with correct data...");
    console.log("📝 Data:", JSON.stringify(correctBankAccount, null, 2));

    const response = await axios.post(
      `${API_BASE_URL}/bank-accounts`,
      correctBankAccount,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Bank account created successfully!");
    console.log("📊 Response:", JSON.stringify(response.data, null, 2));
    return response.data.data.id;
  } catch (error) {
    console.error("❌ Create bank account failed:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message);
    console.error(
      "Details:",
      error.response?.data?.error?.details || error.response?.data?.details
    );
    console.error(
      "Full error response:",
      JSON.stringify(error.response?.data, null, 2)
    );
    return null;
  }
};

/**
 * Test getting bank accounts list
 */
const testGetBankAccounts = async () => {
  try {
    console.log("🧪 Testing getting bank accounts list...");
    const response = await axios.get(`${API_BASE_URL}/bank-accounts`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log("✅ Bank accounts list:");
    console.log("📊 Total accounts:", response.data.data.length);
    response.data.data.forEach((account, index) => {
      console.log(
        `   ${index + 1}. ${account.bankName} (${account.identifier})`
      );
    });
  } catch (error) {
    console.error(
      "❌ Get bank accounts failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Test deleting bank account
 */
const testDeleteBankAccount = async (accountId) => {
  try {
    console.log(`🧪 Testing deletion of bank account ${accountId}...`);
    const response = await axios.delete(
      `${API_BASE_URL}/bank-accounts/${accountId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Bank account deleted:", response.data);
  } catch (error) {
    console.error(
      "❌ Delete bank account failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Run test
 */
const runTest = async () => {
  console.log("🧪 Starting test with correct bank account data...\n");

  const loginSuccess = await loginAsManager();
  if (!loginSuccess) {
    console.log("❌ Cannot proceed without authentication");
    return;
  }

  console.log("=== Test 1: Get current accounts ===");
  await testGetBankAccounts();

  console.log("\n=== Test 2: Create new account with correct data ===");
  const accountId = await testCreateCorrectBankAccount();

  console.log("\n=== Test 3: Get accounts list after creation ===");
  await testGetBankAccounts();

  if (accountId) {
    console.log("\n=== Test 4: Delete created account ===");
    await testDeleteBankAccount(accountId);

    console.log("\n=== Test 5: Get accounts list after deletion ===");
    await testGetBankAccounts();
  }

  console.log("\n✅ Test completed!");
};

runTest().catch(console.error);

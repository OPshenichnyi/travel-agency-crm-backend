import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";
let authToken = "";
let managerId = "";
let bankAccountId = "";

// Test data
const testBankAccount = {
  bankName: "Test Bank",
  swift: "TESTBANK",
  iban: "UA123456789012345678901234567890",
  holderName: "Test Holder",
  address: "Test Address 123",
  identifier: "Test Account 1",
};

/**
 * Login as manager
 */
const loginAsManager = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "manager@example.com", // Replace with actual manager email
      password: "password123",
    });

    authToken = response.data.token;
    managerId = response.data.user.id;
    console.log("✅ Logged in as manager");
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
  }
};

/**
 * Test creating bank account
 */
const testCreateBankAccount = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bank-accounts`,
      testBankAccount,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    bankAccountId = response.data.data.id;
    console.log("✅ Bank account created:", response.data.data);
  } catch (error) {
    console.error(
      "❌ Create bank account failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Test getting bank accounts list
 */
const testGetBankAccounts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bank-accounts`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log("✅ Bank accounts list:", response.data.data);
  } catch (error) {
    console.error(
      "❌ Get bank accounts failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Test getting bank account by identifier
 */
const testGetBankAccountByIdentifier = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/bank-accounts/${testBankAccount.identifier}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Bank account by identifier:", response.data.data);
  } catch (error) {
    console.error(
      "❌ Get bank account by identifier failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Test updating bank account
 */
const testUpdateBankAccount = async () => {
  try {
    const updateData = {
      ...testBankAccount,
      bankName: "Updated Test Bank",
      address: "Updated Test Address 456",
    };

    const response = await axios.put(
      `${API_BASE_URL}/bank-accounts/${bankAccountId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Bank account updated:", response.data.data);
  } catch (error) {
    console.error(
      "❌ Update bank account failed:",
      error.response?.data || error.message
    );
  }
};

/**
 * Test deleting bank account
 */
const testDeleteBankAccount = async () => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/bank-accounts/${bankAccountId}`,
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
 * Run all tests
 */
const runTests = async () => {
  console.log("🧪 Starting bank accounts API tests...\n");

  await loginAsManager();
  if (!authToken) {
    console.log("❌ Cannot proceed without authentication");
    return;
  }

  await testCreateBankAccount();
  await testGetBankAccounts();
  await testGetBankAccountByIdentifier();
  await testUpdateBankAccount();
  await testDeleteBankAccount();

  console.log("\n✅ All tests completed!");
};

runTests().catch(console.error);

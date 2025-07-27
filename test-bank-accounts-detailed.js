import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";
let authToken = "";
let managerId = "";

// Test data for first account (should work)
const firstBankAccount = {
  bankName: "First Bank",
  swift: "FIRSTBANK",
  iban: "UA123456789012345678901234567890",
  holderName: "Test Holder",
  address: "Test Address 123",
  identifier: "First Account",
};

// Test data for second account (fails)
const secondBankAccount = {
  bankName: "Second Bank",
  swift: "SECONDBANK",
  iban: "GR0902601310000730200343275",
  holderName: "Konstantinos Vasileiadis",
  address: "City Serres, str. Eleftheriou Venizelou 78 (1st floor)",
  identifier: "Second Account",
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
    managerId = response.data.user.id;
    console.log("✅ Logged in as manager:", managerId);
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
  }
};

/**
 * Test creating first bank account
 */
const testCreateFirstBankAccount = async () => {
  try {
    console.log("🧪 Testing creation of first bank account...");
    const response = await axios.post(
      `${API_BASE_URL}/bank-accounts`,
      firstBankAccount,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ First bank account created:", response.data.data);
    return response.data.data.id;
  } catch (error) {
    console.error(
      "❌ Create first bank account failed:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Test creating second bank account
 */
const testCreateSecondBankAccount = async () => {
  try {
    console.log("🧪 Testing creation of second bank account...");
    const response = await axios.post(
      `${API_BASE_URL}/bank-accounts`,
      secondBankAccount,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log("✅ Second bank account created:", response.data.data);
    return response.data.data.id;
  } catch (error) {
    console.error(
      "❌ Create second bank account failed:",
      error.response?.data || error.message
    );
    console.error("Full error:", error);
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

    console.log("✅ Bank accounts list:", response.data.data);
    console.log("📊 Total accounts:", response.data.data.length);
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
 * Test creating second account after deleting first
 */
const testCreateSecondAfterDelete = async () => {
  try {
    console.log(
      "🧪 Testing creation of second account after deleting first..."
    );

    // First, create first account
    const firstId = await testCreateFirstBankAccount();
    if (!firstId) {
      console.log("❌ Cannot proceed - first account creation failed");
      return;
    }

    // Get accounts list
    await testGetBankAccounts();

    // Delete first account
    await testDeleteBankAccount(firstId);

    // Get accounts list again
    await testGetBankAccounts();

    // Try to create second account
    const secondId = await testCreateSecondBankAccount();

    if (secondId) {
      console.log("✅ Success! Second account created after deleting first");
      // Clean up
      await testDeleteBankAccount(secondId);
    } else {
      console.log("❌ Still cannot create second account");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

/**
 * Test validation with different data
 */
const testValidationWithDifferentData = async () => {
  const testCases = [
    {
      name: "Same data as first account but different identifier",
      data: {
        ...firstBankAccount,
        identifier: "Different Identifier",
      },
    },
    {
      name: "Same identifier but different IBAN",
      data: {
        ...firstBankAccount,
        iban: "UA987654321098765432109876543210",
      },
    },
    {
      name: "Same identifier but different SWIFT",
      data: {
        ...firstBankAccount,
        swift: "DIFFERENT",
      },
    },
    {
      name: "Original second account data",
      data: secondBankAccount,
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`);
      const response = await axios.post(
        `${API_BASE_URL}/bank-accounts`,
        testCase.data,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      console.log("✅ Success:", response.data.data.id);

      // Clean up
      await testDeleteBankAccount(response.data.data.id);
    } catch (error) {
      console.error(
        `❌ Failed: ${testCase.name}`,
        error.response?.data || error.message
      );
    }
  }
};

/**
 * Run all tests
 */
const runTests = async () => {
  console.log("🧪 Starting detailed bank accounts API tests...\n");

  await loginAsManager();
  if (!authToken) {
    console.log("❌ Cannot proceed without authentication");
    return;
  }

  console.log("=== Test 1: Create first account ===");
  await testCreateFirstBankAccount();

  console.log("\n=== Test 2: Try to create second account ===");
  await testCreateSecondBankAccount();

  console.log("\n=== Test 3: Get accounts list ===");
  await testGetBankAccounts();

  console.log("\n=== Test 4: Create second after deleting first ===");
  await testCreateSecondAfterDelete();

  console.log("\n=== Test 5: Test different data combinations ===");
  await testValidationWithDifferentData();

  console.log("\n✅ All tests completed!");
};

runTests().catch(console.error);

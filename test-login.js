import axios from "axios";

const BASE_URL = "http://localhost:3000/api";

async function testLogin() {
  try {
    console.log("Testing login...");

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "testpass123",
    });

    console.log("Login successful:", response.data);
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
  }
}

testLogin();

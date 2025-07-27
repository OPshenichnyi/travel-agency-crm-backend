import request from "supertest";
import app from "../src/app.js";
import { sequelize } from "../src/models/index.js";
import { generateToken } from "../src/services/jwtService.js";
import { User, Order } from "../src/models/index.js";

describe("Order API Tests", () => {
  let adminToken, managerToken, agentToken;
  let adminUser, managerUser, agentUser;

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create({
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    });

    managerUser = await User.create({
      email: "manager@test.com",
      password: "password123",
      role: "manager",
      firstName: "Manager",
      lastName: "User",
      isActive: true,
    });

    agentUser = await User.create({
      email: "agent@test.com",
      password: "password123",
      role: "agent",
      firstName: "Agent",
      lastName: "User",
      managerId: managerUser.id,
      isActive: true,
    });

    adminToken = generateToken(adminUser);
    managerToken = generateToken(managerUser);
    agentToken = generateToken(agentUser);
  });

  afterAll(async () => {
    await Order.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe("POST /orders", () => {
    it("should create order with new structure", async () => {
      const orderData = {
        agentId: agentUser.id,
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
        clientDocumentNumber: "AB123456",
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
            paymentMethods: ["card"],
          },
          balance: {
            amount: 650,
            status: "unpaid",
            dueDate: "2024-01-14",
            paymentMethods: [],
          },
        },
      };

      const response = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order).toBeDefined();
      expect(response.body.order.clientCountry).toBe("USA");
      expect(response.body.order.clientDocumentNumber).toBe("AB123456");
      expect(response.body.order.countryTravel).toBe("Spain");
      expect(response.body.order.cityTravel).toBe("Barcelona");
      expect(response.body.order.propertyName).toBe("Hotel Barcelona");
      expect(response.body.order.propertyNumber).toBe("HB001");
      expect(response.body.order.discount).toBe(100.0);
      expect(response.body.order.totalPrice).toBe(950.0); // 1000 + 50 - 100
      expect(response.body.order.statusOrder).toBe("pending"); // Default status
      expect(response.body.order.payments.balance.paymentMethods).toEqual([]);
      expect(response.body.order.payments.deposit.paymentMethods).toEqual([
        "card",
      ]);
    });

    it("should reject order with old structure fields", async () => {
      const orderData = {
        agentId: agentUser.id,
        agentName: "Test Agent",
        agentCountry: "Ukraine", // Old field - should be rejected
        locationTravel: "Spain", // Old field - should be rejected
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

      const response = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(orderData)
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it("should require new required fields", async () => {
      const orderData = {
        agentId: agentUser.id,
        agentName: "Test Agent",
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

      const response = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(orderData)
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });

    it("should validate new status values", async () => {
      const orderData = {
        agentId: agentUser.id,
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
        clientCountry: "USA",
        guests: { adults: 2, children: 1 },
        officialPrice: 1000.0,
        statusOrder: "approved", // New valid status
        payments: {
          deposit: {
            amount: 300,
            status: "paid",
            paymentMethods: ["card"],
          },
          balance: {
            amount: 700,
            status: "unpaid",
            paymentMethods: [],
          },
        },
      };

      const response = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.order.statusOrder).toBe("approved");
    });

    it("should reject invalid status values", async () => {
      const orderData = {
        agentId: agentUser.id,
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
        clientCountry: "USA",
        guests: { adults: 2, children: 1 },
        officialPrice: 1000.0,
        statusOrder: "aprove", // Old invalid status
        payments: {
          deposit: {
            amount: 300,
            status: "paid",
            paymentMethods: ["card"],
          },
          balance: {
            amount: 700,
            status: "unpaid",
            paymentMethods: [],
          },
        },
      };

      const response = await request(app)
        .post("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(orderData)
        .expect(422);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /orders/:id", () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        agentId: agentUser.id,
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
        totalPrice: 950.0,
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
        statusOrder: "unpaid",
      });
    });

    afterEach(async () => {
      await Order.destroy({ where: { id: testOrder.id } });
    });

    it("should update order with new structure", async () => {
      const updateData = {
        cityTravel: "Madrid",
        propertyName: "Hotel Madrid",
        discount: 150.0,
      };

      const response = await request(app)
        .put(`/orders/${testOrder.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.order.cityTravel).toBe("Madrid");
      expect(response.body.order.propertyName).toBe("Hotel Madrid");
      expect(response.body.order.discount).toBe(150.0);
      expect(response.body.order.totalPrice).toBe(900.0); // 1000 + 50 - 150
    });

    it("should not allow updating old structure fields", async () => {
      const updateData = {
        agentCountry: "Ukraine", // Old field
        locationTravel: "Italy", // Old field
      };

      const response = await request(app)
        .put(`/orders/${testOrder.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      // Fields should not be updated
      expect(response.body.order.agentCountry).toBeUndefined();
      expect(response.body.order.locationTravel).toBeUndefined();
    });
  });

  describe("GET /orders", () => {
    beforeEach(async () => {
      await Order.create({
        agentId: agentUser.id,
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
        totalPrice: 950.0,
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
        statusOrder: "unpaid",
      });
    });

    afterEach(async () => {
      await Order.destroy({ where: {} });
    });

    it("should return orders with new structure", async () => {
      const response = await request(app)
        .get("/orders")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBeGreaterThan(0);

      const order = response.body.orders[0];
      expect(order.clientCountry).toBeDefined();
      expect(order.countryTravel).toBeDefined();
      expect(order.cityTravel).toBeDefined();
      expect(order.propertyName).toBeDefined();
      expect(order.propertyNumber).toBeDefined();
      expect(order.discount).toBeDefined();
      expect(order.agentCountry).toBeUndefined();
      expect(order.locationTravel).toBeUndefined();
    });

    it("should search by new fields", async () => {
      const response = await request(app)
        .get("/orders?search=Barcelona")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBeGreaterThan(0);
    });
  });
});

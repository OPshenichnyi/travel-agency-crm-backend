import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Basic Swagger settings
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Travel Agency CRM API",
      version: "1.0.0",
      description: "API for Travel Agency CRM system",
      contact: {
        name: "Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      status: {
                        type: "integer",
                        example: 401,
                      },
                      message: {
                        type: "string",
                        example: "Authentication required",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Unique user identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
            },
            role: {
              type: "string",
              enum: ["admin", "manager", "agent"],
              description: "User role",
            },
            firstName: {
              type: "string",
              description: "User first name",
            },
            lastName: {
              type: "string",
              description: "User last name",
            },
            phone: {
              type: "string",
              description: "User phone number",
            },
            isActive: {
              type: "boolean",
              description: "User activity status",
            },
            managerId: {
              type: "string",
              format: "uuid",
              description: "Manager ID (only for agents)",
            },
          },
        },
        Invitation: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Unique invitation identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email to which the invitation was sent",
            },
            role: {
              type: "string",
              enum: ["manager", "agent"],
              description: "Role for the invited user",
            },
            invitedBy: {
              type: "string",
              format: "uuid",
              description: "ID of the user who created the invitation",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Invitation expiration date",
            },
            used: {
              type: "boolean",
              description: "Whether the invitation was used",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Invitation creation date",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Unique order identifier",
            },
            agentId: {
              type: "string",
              format: "uuid",
              description: "ID of the agent who created the order",
            },
            checkIn: {
              type: "string",
              format: "date-time",
              description: "Check-in date",
            },
            checkOut: {
              type: "string",
              format: "date-time",
              description: "Check-out date",
            },
            nights: {
              type: "integer",
              description: "Number of nights",
            },
            propertyName: {
              type: "string",
              description: "Accommodation property name",
            },
            location: {
              type: "string",
              description: "Location",
            },
            reservationNo: {
              type: "integer",
              description: "Reservation number",
            },
            reservationCode: {
              type: "string",
              description: "Reservation code",
            },
            country: {
              type: "string",
              description: "Country",
            },
            clientName: {
              type: "string",
              description: "Client name",
            },
            clientIdNo: {
              type: "string",
              description: "Client ID number",
            },
            guests: {
              type: "string",
              description: "Guest information",
            },
            clientPhone: {
              type: "string",
              description: "Client phone number",
            },
            officialPrice: {
              type: "number",
              format: "float",
              description: "Official price",
            },
            tax: {
              type: "number",
              format: "float",
              description: "Tax",
            },
            totalPrice: {
              type: "number",
              format: "float",
              description: "Total price",
            },
            depositBank: {
              type: "number",
              format: "float",
              description: "Bank deposit amount to be paid",
            },
            cashOnCheckIn: {
              type: "number",
              format: "float",
              description: "Amount to be paid on check-in",
            },
            damageDeposit: {
              type: "string",
              enum: ["yes", "no"],
              description: "Damage deposit presence",
            },
            depositPaid: {
              type: "boolean",
              description: "Is deposit paid",
            },
            status: {
              type: "string",
              enum: ["draft", "confirmed", "paid"],
              description: "Order status",
            },
            pdfInvoiceUrl: {
              type: "string",
              description: "PDF invoice URL",
            },
            pdfVoucherUrl: {
              type: "string",
              description: "PDF voucher URL",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Order creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Order last update date",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // paths to files with annotations
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export { swaggerSpec, swaggerUi };

import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Базові налаштування Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Travel Agency CRM API",
      version: "1.0.0",
      description: "API для CRM системи туристичної агенції",
      contact: {
        name: "Підтримка",
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
                        example: "Необхідна авторизація",
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
              description: "Унікальний ідентифікатор користувача",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email користувача",
            },
            role: {
              type: "string",
              enum: ["admin", "manager", "agent"],
              description: "Роль користувача",
            },
            firstName: {
              type: "string",
              description: "Ім'я користувача",
            },
            lastName: {
              type: "string",
              description: "Прізвище користувача",
            },
            phone: {
              type: "string",
              description: "Номер телефону користувача",
            },
            isActive: {
              type: "boolean",
              description: "Статус активності користувача",
            },
            managerId: {
              type: "string",
              format: "uuid",
              description: "ID менеджера (тільки для агентів)",
            },
          },
        },
        Invitation: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Унікальний ідентифікатор запрошення",
            },
            email: {
              type: "string",
              format: "email",
              description: "Email, на який надіслано запрошення",
            },
            role: {
              type: "string",
              enum: ["manager", "agent"],
              description: "Роль для запрошеного користувача",
            },
            invitedBy: {
              type: "string",
              format: "uuid",
              description: "ID користувача, який створив запрошення",
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "Дата закінчення дії запрошення",
            },
            used: {
              type: "boolean",
              description: "Чи було використано запрошення",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Дата створення запрошення",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "Унікальний ідентифікатор замовлення",
            },
            agentId: {
              type: "string",
              format: "uuid",
              description: "ID агента, який створив замовлення",
            },
            checkIn: {
              type: "string",
              format: "date-time",
              description: "Дата заїзду",
            },
            checkOut: {
              type: "string",
              format: "date-time",
              description: "Дата виїзду",
            },
            nights: {
              type: "integer",
              description: "Кількість ночей",
            },
            propertyName: {
              type: "string",
              description: "Назва об'єкта розміщення",
            },
            location: {
              type: "string",
              description: "Місце розташування",
            },
            reservationNo: {
              type: "integer",
              description: "Номер бронювання",
            },
            reservationCode: {
              type: "string",
              description: "Код бронювання",
            },
            country: {
              type: "string",
              description: "Країна",
            },
            clientName: {
              type: "string",
              description: "Ім'я клієнта",
            },
            clientIdNo: {
              type: "string",
              description: "Номер ID клієнта",
            },
            guests: {
              type: "string",
              description: "Інформація про гостей",
            },
            clientPhone: {
              type: "string",
              description: "Телефон клієнта",
            },
            officialPrice: {
              type: "number",
              format: "float",
              description: "Офіційна ціна",
            },
            tax: {
              type: "number",
              format: "float",
              description: "Податок",
            },
            totalPrice: {
              type: "number",
              format: "float",
              description: "Загальна ціна",
            },
            depositBank: {
              type: "number",
              format: "float",
              description: "Сума депозиту до сплати через банк",
            },
            cashOnCheckIn: {
              type: "number",
              format: "float",
              description: "Сума до сплати при заїзді",
            },
            damageDeposit: {
              type: "string",
              enum: ["yes", "no"],
              description: "Наявність депозиту за пошкодження",
            },
            depositPaid: {
              type: "boolean",
              description: "Чи оплачено депозит",
            },
            status: {
              type: "string",
              enum: ["draft", "confirmed", "paid"],
              description: "Статус замовлення",
            },
            pdfInvoiceUrl: {
              type: "string",
              description: "URL PDF-рахунку",
            },
            pdfVoucherUrl: {
              type: "string",
              description: "URL PDF-ваучера",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Дата створення замовлення",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Дата останнього оновлення замовлення",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"], // шляхи до файлів з анотаціями
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export { swaggerSpec, swaggerUi };

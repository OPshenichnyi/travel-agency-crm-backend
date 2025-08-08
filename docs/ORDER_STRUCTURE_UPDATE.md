# Оновлення структури замовлень (Order)

## Опис змін

Цей документ описує оновлення структури замовлень згідно з новими бізнес-вимогами.

## Зміни в структурі Order

### Видалені поля:
- `agentCountry` - країна агента
- `locationTravel` - місце подорожі

### Додані поля:
- `clientCountry` (STRING, NOT NULL) - країна клієнта
- `countryTravel` (STRING, NOT NULL) - країна подорожі
- `cityTravel` (STRING, NOT NULL) - місто подорожі
- `propertyName` (STRING, NOT NULL) - назва об'єкта розміщення
- `propertyNumber` (STRING, NOT NULL) - номер об'єкта розміщення
- `discount` (FLOAT, DEFAULT 0) - знижка

### Змінені поля:
- `reservationNumber` (STRING, NOT NULL) - номер бронювання (змінено з INTEGER на STRING для підтримки буквено-цифрових номерів)

### Оновлена логіка розрахунку ціни:
```javascript
totalPrice = officialPrice + taxClean - discount
```

## Оновлення структури payments

### Стара структура:
```javascript
{
  "payments": {
    "deposit": {
      "amount": number,
      "status": string,
      "dueDate": string,
      "paidDate": string,
      "method": string
    },
    "balance": {
      "amount": number,
      "status": string,
      "dueDate": string,
      "paidDate": string,
      "method": string  // Видалено
    }
  }
}
```

### Нова структура:
```javascript
{
  "payments": {
    "deposit": {
      "amount": number,
      "status": string,
      "dueDate": string,
      "paidDate": string,
      "method": string  // Залишається тільки в deposit
    },
    "balance": {
      "amount": number,
      "status": string,
      "dueDate": string,
      "paidDate": string
      // Поле method видалено
    }
  }
}
```

## Зміни в API

### POST /orders
**Нові обов'язкові поля:**
- `countryTravel`
- `cityTravel`
- `propertyName`
- `propertyNumber`
- `clientCountry`

**Нові опціональні поля:**
- `discount`

**Змінені поля:**
- `reservationNumber` - тепер STRING замість INTEGER (підтримує буквено-цифрові номери)

**Видалені поля:**
- `agentCountry`
- `locationTravel`

### PUT /orders/:id
Всі нові поля можуть бути оновлені через PUT запит.

### GET /orders
Пошук тепер працює по нових полях:
- `countryTravel`
- `cityTravel`
- `clientCountry`

## Міграція бази даних

### Запуск міграції:
```bash
node src/migrations/runMigration.js
```

### Оновлення структури payments:
```bash
node src/utils/updatePaymentsStructure.js
```

## Тестування

### Запуск тестів:
```bash
npm test tests/order.test.js
```

### Тести перевіряють:
1. Створення замовлень з новою структурою
2. Відхилення замовлень зі старою структурою
3. Оновлення замовлень з новими полями
4. Правильний розрахунок totalPrice з урахуванням discount
5. Оновлену структуру payments

## Валідація

### Нові правила валідації:
- `countryTravel` - обов'язкове поле
- `cityTravel` - обов'язкове поле
- `propertyName` - обов'язкове поле
- `propertyNumber` - обов'язкове поле
- `clientCountry` - обов'язкове поле
- `discount` - опціональне поле, має бути >= 0

### Видалені правила:
- `agentCountry` - більше не валідується
- `locationTravel` - більше не валідується

## Swagger документація

Swagger документація оновлена для всіх ендпоінтів:
- POST /orders
- PUT /orders/:id
- GET /orders/:id
- GET /orders

## Зворотна сумісність

**УВАГА:** Ці зміни не є зворотно сумісними. Старі поля `agentCountry` та `locationTravel` більше не підтримуються.

### Рекомендації для клієнтів API:
1. Оновіть клієнтський код для використання нових полів
2. Видаліть посилання на старі поля
3. Оновіть логіку розрахунку ціни з урахуванням discount
4. Оновіть структуру payments (видаліть method з balance)

## Приклад нового запиту

```javascript
// Створення замовлення
const orderData = {
  agentId: "uuid",
  agentName: "John Agent",
  checkIn: "2024-01-15",
  checkOut: "2024-01-20",
  nights: 5,
  countryTravel: "Spain",
  cityTravel: "Barcelona",
  propertyName: "Hotel Barcelona",
  propertyNumber: "HB001",
  reservationNumber: "12345",
  clientName: "John Doe",
  clientPhone: ["+1234567890"],
  clientEmail: "john@example.com",
  clientCountry: "USA",
  guests: { adults: 2, children: 1 },
  officialPrice: 1000.00,
  taxClean: 50.00,
  discount: 100.00,
  bankAccount: "UA123456789",
  payments: {
    deposit: {
      amount: 300,
      status: "paid",
      dueDate: "2024-01-10",
      paidDate: "2024-01-08",
      method: "card"
    },
    balance: {
      amount: 650,
      status: "unpaid",
      dueDate: "2024-01-14"
    }
  }
};
```

## Підтримка

При виникненні питань звертайтеся до команди розробки або створюйте issue в репозиторії. 
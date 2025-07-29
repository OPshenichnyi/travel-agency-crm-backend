# Bank Accounts Management API

Цей документ описує функціонал управління банківськими реквізитами в Travel Agency CRM.

## Опис функціоналу

Система дозволяє менеджерам створювати, редагувати та видаляти банківські рахунки, а агентам - переглядати та вибирати рахунки свого менеджера для генерації ваучерів.

## Ролі та права доступу

### Менеджер
- ✅ Створювати банківські рахунки
- ✅ Редагувати свої банківські рахунки
- ✅ Видаляти свої банківські рахунки
- ✅ Переглядати свої банківські рахунки

### Агент
- ✅ Переглядати банківські рахунки свого менеджера
- ✅ Вибирати рахунок за ідентифікатором для генерації ваучера
- ❌ Створювати банківські рахунки
- ❌ Редагувати банківські рахунки
- ❌ Видаляти банківські рахунки

### Адмін
- ✅ Переглядати всі банківські рахунки
- ❌ Створювати банківські рахунки
- ❌ Редагувати банківські рахунки
- ❌ Видаляти банківські рахунки

## API Endpoints

### POST /api/bank-accounts
Створення нового банківського рахунку (тільки менеджер)

**Request Body:**
```json
{
  "bankName": "ПриватБанк",
  "swift": "PBANUA2X",
  "iban": "UA123456789012345678901234567890",
  "holderName": "Іван Петренко",
  "address": "вул. Хрещатик, 1, Київ",
  "identifier": "Мій рахунок 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bank account created successfully",
  "data": {
    "id": "uuid",
    "managerId": "uuid",
    "bankName": "ПриватБанк",
    "swift": "PBANUA2X",
    "iban": "UA123456789012345678901234567890",
    "holderName": "Іван Петренко",
    "address": "вул. Хрещатик, 1, Київ",
    "identifier": "Мій рахунок 1",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /api/bank-accounts/:id
Оновлення банківського рахунку (тільки менеджер)

**Request Body:** (аналогічно POST)

### DELETE /api/bank-accounts/:id
Видалення банківського рахунку (тільки менеджер)

### GET /api/bank-accounts
Отримання списку банківських рахунків

**Response:**
```json
{
  "success": true,
  "message": "Bank accounts retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "managerId": "uuid",
      "bankName": "ПриватБанк",
      "swift": "PBANUA2X",
      "iban": "UA123456789012345678901234567890",
      "holderName": "Іван Петренко",
      "address": "вул. Хрещатик, 1, Київ",
      "identifier": "Мій рахунок 1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "manager": {
        "id": "uuid",
        "email": "manager@example.com",
        "firstName": "Іван",
        "lastName": "Петренко"
      }
    }
  ]
}
```

### GET /api/bank-accounts/:id
Отримання банківського рахунку за ID (UUID)

**Parameters:**
- `id` (UUID) - ID банківського рахунку

**Response:**
```json
{
  "success": true,
  "message": "Bank account retrieved successfully",
  "data": {
    "id": "uuid",
    "managerId": "uuid",
    "bankName": "ПриватБанк",
    "swift": "PBANUA2X",
    "iban": "UA123456789012345678901234567890",
    "holderName": "Іван Петренко",
    "address": "вул. Хрещатик, 1, Київ",
    "identifier": "Мій рахунок 1",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "manager": {
      "id": "uuid",
      "email": "manager@example.com",
      "firstName": "Іван",
      "lastName": "Петренко"
    }
  }
}
```

## Валідація полів

### bankName
- Обов'язкове поле
- Мінімум 3 символи
- Максимум 100 символів
- Не може бути порожнім

### swift
- Обов'язкове поле
- Формат: 8 або 11 символів
- Тільки великі літери та цифри
- Приклад: `PBANUA2X` або `PBANUA2XXXX`

### iban
- Обов'язкове поле
- Формат IBAN з перевіркою контрольної суми
- Приклад: `UA123456789012345678901234567890`

### holderName
- Обов'язкове поле
- Мінімум 2 символи
- Максимум 100 символів
- Тільки літери та пробіли (латиниця/кирилиця)

### address
- Опціональне поле
- Максимум 200 символів
- Дозволені символи: літери, цифри, пробіли, крапки, коми, дефіси, дужки

### identifier
- Обов'язкове поле
- Мінімум 1 символ
- Максимум 50 символів
- Унікальний в межах одного менеджера
- Приклад: "Мій рахунок 1", "Рахунок для виплат"

## Структура бази даних

### Таблиця: bank_accounts

| Поле | Тип | Обов'язкове | Опис |
|------|-----|-------------|------|
| id | UUID | ✅ | Первинний ключ |
| managerId | UUID | ✅ | Зовнішній ключ до users |
| bankName | STRING | ✅ | Назва банку |
| swift | STRING | ✅ | SWIFT/BIC код |
| iban | STRING | ✅ | IBAN номер |
| holderName | STRING | ✅ | Ім'я власника рахунку |
| address | STRING | ❌ | Адреса |
| identifier | STRING | ✅ | Унікальний ідентифікатор |
| createdAt | DATETIME | ✅ | Дата створення |
| updatedAt | DATETIME | ✅ | Дата оновлення |

### Індекси
- `unique_manager_identifier` - унікальний індекс на (managerId, identifier)

## Встановлення та запуск

### 1. Запуск міграції
```bash
node run-bank-accounts-migration.js
```

### 2. Тестування API
```bash
node test-bank-accounts.js
```

## Приклади використання

### Створення рахунку менеджером
```javascript
const response = await axios.post('/api/bank-accounts', {
  bankName: 'ПриватБанк',
  swift: 'PBANUA2X',
  iban: 'UA123456789012345678901234567890',
  holderName: 'Іван Петренко',
  address: 'вул. Хрещатик, 1, Київ',
  identifier: 'Мій рахунок 1'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Отримання рахунку за ID агентом для генерації ваучера
```javascript
const response = await axios.get('/api/bank-accounts/1ac17a7e-272a-463d-ac4c-a216aad0f0ac', {
  headers: { Authorization: `Bearer ${token}` }
});

const bankAccount = response.data.data;
// Використовувати дані для генерації ваучера
```

## Обробка помилок

### 400 Bad Request
- Невірний формат IBAN
- Невірний формат SWIFT
- Ідентифікатор не унікальний для менеджера
- Помилки валідації полів

### 403 Forbidden
- Спроба створення/редагування/видалення рахунку не менеджером
- Спроба доступу до чужого рахунку

### 404 Not Found
- Рахунок не знайдено
- Агент не призначений до менеджера

### 422 Unprocessable Entity
- Помилки валідації вхідних даних 
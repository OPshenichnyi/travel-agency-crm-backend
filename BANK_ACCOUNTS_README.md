# Bank Accounts Management

## Feature Description

The bank accounts management system allows managers to create and manage bank accounts for their agents. Agents can view their assigned accounts and generate vouchers for orders.

## Roles and Permissions

### Manager
- Create bank accounts for their agents
- View all accounts assigned to their agents
- Edit account details
- Delete accounts (if not used in orders)

### Agent
- View their assigned bank accounts
- Generate vouchers using account information
- Cannot create, edit, or delete accounts

### Admin
- Full access to all bank accounts
- Can manage accounts for any agent
- Can view all system accounts

## Field Validation

### Required Fields
- `accountName` - Account name (string, 1-100 characters)
- `accountNumber` - Account number (string, 1-50 characters)
- `bankName` - Bank name (string, 1-100 characters)
- `agentId` - Agent ID (UUID, must exist in users table)

### Optional Fields
- `swiftCode` - SWIFT/BIC code (string, 8-11 characters)
- `iban` - IBAN code (string, 15-34 characters)
- `currency` - Currency code (string, 3 characters, default: "USD")
- `notes` - Additional notes (string, max 500 characters)

### Validation Rules
- Account number must be unique per agent
- Agent must exist and have role "agent"
- Manager can only assign accounts to their agents
- Currency must be valid ISO 4217 code
- IBAN must be valid format if provided
- SWIFT code must be valid format if provided

## Database Structure

### Table: bank_accounts

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountName | STRING | Account name |
| accountNumber | STRING | Account number |
| bankName | STRING | Bank name |
| swiftCode | STRING | SWIFT/BIC code |
| iban | STRING | IBAN code |
| currency | STRING | Currency code |
| agentId | UUID | Foreign key to users table |
| notes | TEXT | Additional notes |
| createdAt | DATE | Creation timestamp |
| updatedAt | DATE | Last update timestamp |

### Relationships
- `agentId` references `users.id` (many-to-one)
- `agentId` must have role "agent"
- `agentId` must have `managerId` matching the creating manager

## Installation and Setup

1. Ensure database migrations are run
2. Verify user roles are properly set up
3. Test account creation with manager role
4. Verify agent access restrictions

## Usage Examples

### Creating an account as a manager

```javascript
const accountData = {
  accountName: "Main Business Account",
  accountNumber: "1234567890",
  bankName: "Example Bank",
  swiftCode: "EXBKUS33",
  iban: "US12345678901234567890",
  currency: "USD",
  agentId: "agent-uuid-here",
  notes: "Primary account for client payments"
};

const account = await createBankAccount(accountData, managerId);
```

### Getting account by ID as an agent for voucher generation

```javascript
const account = await getBankAccountById(accountId, agentId);
// Use account details to generate voucher
const voucherData = {
  accountName: account.accountName,
  accountNumber: account.accountNumber,
  bankName: account.bankName,
  // ... other voucher fields
};
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid account data
- Unauthorized access attempts
- Non-existent agents
- Duplicate account numbers
- Invalid currency codes
- Database connection issues 
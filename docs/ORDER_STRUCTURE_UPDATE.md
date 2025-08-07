# Order Structure Update

## Change Description

This document describes the changes made to the Order structure to improve data organization and add new functionality.

## Changes in Order Structure

### Removed Fields:
- `totalPrice` - moved to payments table
- `depositAmount` - moved to payments table
- `remainingAmount` - calculated from payments

### Added Fields:
- `status` - order status (draft, confirmed, paid)
- `pdfInvoiceUrl` - URL to generated invoice PDF
- `pdfVoucherUrl` - URL to generated voucher PDF
- `damageDeposit` - damage deposit requirement (yes/no)
- `depositPaid` - deposit payment status

### Modified Fields:
- `officialPrice` - renamed from `price`
- `tax` - now separate field instead of calculated

### Updated Price Calculation Logic:
- `totalPrice` = `officialPrice` + `tax`
- `depositBank` = calculated based on payment schedule
- `cashOnCheckIn` = remaining amount after deposit

## Payment Structure Update

### Old Structure:
```javascript
{
  orderId: "uuid",
  amount: 1000,
  paymentDate: "2024-01-01",
  paymentMethod: "bank_transfer"
}
```

### New Structure:
```javascript
{
  orderId: "uuid",
  amount: 1000,
  paymentDate: "2024-01-01",
  paymentMethod: "bank_transfer",
  paymentType: "deposit", // deposit, final, refund
  status: "completed", // pending, completed, failed
  transactionId: "txn_123",
  notes: "Payment notes"
}
```

## API Changes

### New Endpoints:
- `POST /api/orders/:id/payments` - Add payment to order
- `GET /api/orders/:id/payments` - Get order payments
- `PUT /api/orders/:id/status` - Update order status

### Modified Endpoints:
- `POST /api/orders` - Updated request body structure
- `PUT /api/orders/:id` - Updated request body structure
- `GET /api/orders/:id` - Updated response structure

## Database Migration

### Run Migration:
```bash
npm run migrate:orders
```

### Update Payment Structure:
```bash
npm run migrate:payments
```

## Testing

### Run Tests:
```bash
npm test -- --grep "Order"
```

### Tests Verify:
- Order creation with new structure
- Payment calculation accuracy
- Status transitions
- PDF generation
- Data validation

## Validation

### New Validation Rules:
- `status` must be one of: draft, confirmed, paid
- `damageDeposit` must be: yes, no
- `depositPaid` must be boolean
- `officialPrice` must be positive number
- `tax` must be non-negative number

### Removed Rules:
- `totalPrice` validation (now calculated)
- `depositAmount` validation (moved to payments)

## Backward Compatibility

The API maintains backward compatibility for existing clients by:
- Providing default values for new fields
- Supporting old field names in responses
- Maintaining existing endpoint behavior

### Recommendations for API Clients:
- Update to use new field names
- Handle new status values
- Implement payment tracking
- Update validation logic

## New Request Example

```javascript
{
  "agentId": "uuid",
  "checkIn": "2024-06-01",
  "checkOut": "2024-06-05",
  "nights": 4,
  "propertyName": "Hotel Example",
  "location": "Paris, France",
  "reservationNo": 12345,
  "reservationCode": "RES123",
  "country": "France",
  "clientName": "John Doe",
  "clientIdNo": "ID123456",
  "guests": "2 adults, 1 child",
  "clientPhone": "+1234567890",
  "officialPrice": 1000.00,
  "tax": 50.00,
  "damageDeposit": "yes",
  "depositPaid": false,
  "status": "draft"
}
```

## Support

For questions about the new structure, contact the development team. 
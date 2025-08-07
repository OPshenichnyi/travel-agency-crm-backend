# Database Configuration

## Current Configuration

The project uses SQLite database with the following settings:
- Database file: `database.sqlite`
- ORM: Sequelize
- Connection pooling enabled

## Data Overwrite Issue

When `FORCE_SYNC=true` is set in environment variables, the database is completely reset on each application restart, losing all data.

**Solution**: Use `FORCE_SYNC=false` for production and development with existing data.

## Database Commands

### Normal startup (preserves data)
```bash
npm start
# or
FORCE_SYNC=false npm start
```

### Complete database reset (WARNING: will lose all data!)
```bash
FORCE_SYNC=true npm start
```

### Create administrator
```bash
npm run create-admin
```

### Reset user password
```bash
npm run reset-password
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=travel_agency_crm
DB_USER=postgres
DB_PASSWORD=password

# Sync mode
FORCE_SYNC=false  # Uncomment ONLY when you want to completely reset the database
```

## Database Structure

The database includes the following main tables:
- `users` - User accounts and profiles
- `invitations` - User registration invitations
- `orders` - Travel orders and bookings
- `payments` - Payment records
- `bank_accounts` - Bank account management

## Migrations

Database schema changes are handled through Sequelize migrations.

## Logging

Database operations are logged in development mode for debugging purposes. 
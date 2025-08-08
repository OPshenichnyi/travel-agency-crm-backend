# Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL 15-alpine image available
- Environment variables configured

## Deployment Steps

### 1. Environment Setup

Create `.env` file based on `env.example`:

```bash
cp env.example .env
```

Configure the following variables:
- `DB_PASSWORD` - Secure PostgreSQL password
- `JWT_SECRET` - Strong JWT secret key
- `SMTP_*` - Email service credentials
- `FRONTEND_URL` - Your frontend domain

### 2. Database Migration (if migrating from SQLite)

If you have existing SQLite data:

```bash
npm run migrate-to-postgres
```

### 3. Build and Deploy

```bash
# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check health
curl http://localhost:3000/api/health
```

### 4. Verify Deployment

- Health check: `GET /api/health`
- API docs: `GET /api-docs`
- Base endpoint: `GET /api`

### 5. Security Checklist

- [ ] Strong database password set
- [ ] JWT secret is secure and unique
- [ ] SMTP credentials configured
- [ ] Frontend URL set correctly
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed
- [ ] Regular backups configured

### 6. Monitoring

- Health checks are configured for both app and database
- Logs are available in `./logs` directory
- Database data is persisted in Docker volume

### 7. Backup Strategy

```bash
# Database backup
docker exec travel-agency-db pg_dump -U postgres travel_agency > backup.sql

# Restore
docker exec -i travel-agency-db psql -U postgres travel_agency < backup.sql
```

### 8. Troubleshooting

- Check container logs: `docker-compose logs [service-name]`
- Verify database connection: `docker exec travel-agency-db psql -U postgres -d travel_agency`
- Restart services: `docker-compose restart` 
# Retail Shop Management System

A full-stack system for managing daily sales and expenses in a retail clothing shop.

## Features

- Staff management (owner, manager, worker roles)
- Sales tracking with multiple payment modes (cash, online)
- Expense tracking with categories
- Daily summaries with auto-calculated totals
- Audit logging for all changes
- Support for different data entry methods (form, WhatsApp, OCR)

## Tech Stack

- **Database**: PostgreSQL
- **ORM**: Prisma
- **Backend**: Node.js with TypeScript
- **Frontend**: (To be implemented)

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL (v12 or later)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your database:
   - Create a new PostgreSQL database
   - Update the `.env` file with your database connection string

4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

## Database Schema

![Database Schema](prisma/ERD.png)

### Key Tables

- **Staff**: Store employee information and roles
- **SaleEntry**: Record of each sale transaction
- **SaleItem**: Individual items within a sale
- **Expense**: Track shop expenses
- **DailySummary**: Aggregated daily financials
- **AuditLog**: Track all changes in the system

## API Documentation

(To be implemented in Part 2)

## Development

- Run in development mode:
  ```bash
  npm run dev
  ```

- Generate Prisma client:
  ```bash
  npx prisma generate
  ```

## License

MIT

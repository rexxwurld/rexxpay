# RexxPay

A secure payment infrastructure API built with Node.js, Express, and MongoDB.

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- JWT (Cookie Auth)
- Mongoose
- Bcrypt

## Features

- User Authentication (Register, Login, Logout)
- Cookie-based JWT Authentication
- OTP Verification
- Forgot/Reset Password
- Wallet System
- Money Transfer
- Transaction History with Receipt

## Project Structure

Rexxpay/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── transaction/
│   │   └── wallet/
│   ├── utils/
│   ├── public/
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account

### Installation

1. Clone the repo
   git clone https://github.com/rexxwurld/rexxpay.git

2. Install dependencies
   npm install

3. Create a .env file in the root folder
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret

4. Run the server
   npm run dev

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/verify-otp
- POST /api/auth/resend-otp
- POST /api/auth/reset-password

### Wallet
- GET /api/wallet

### Transactions
- GET  /api/transaction
- POST /api/transaction/transfer

## What's been added beyond the original prototype

- **`ledger` module** — double-entry `LedgerEntry` rows are posted alongside
  every transfer's two `Wallet.balance` updates, inside the same DB
  transaction. `balance` is now a cache; the ledger is the source of truth.
- **Idempotency** — `POST /api/transaction/transfer` accepts an
  `idempotencyKey` (body field or `Idempotency-Key` header). A retried
  request with the same key returns the original result instead of
  transferring twice. Enforced by a unique DB index, not just app logic.
- **Transfer limits** — per-transaction and rolling 24h outbound limits
  (`src/config/limits.js`), checked before any money moves.
- **`audit` module** — logs, register/login/login-failure and every
  completed or limit-blocked transfer to an append-only `AuditLog`
  collection.

## Still not real

Same caveats as `rexxpay_infra`'s README: no real bank/NIBSS connection
(this app *is* the mocked "real bank" that infra calls), no fraud/AML
screening, no license. See that repo's README for the fuller list.

## Deployment

Deployed on Render - https://rexxpay.onrender.com

## Author

Built by Rexxwurld
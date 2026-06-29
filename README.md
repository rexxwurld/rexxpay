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

## Deployment

Deployed on Render - https://rexxpay.onrender.com

## Author

Built by Rexxwurld
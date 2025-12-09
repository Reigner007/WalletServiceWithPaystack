Wallet Service with Paystack Integration
A robust backend wallet service built with NestJS, Prisma, PostgreSQL, and TypeScript. This application provides secure wallet management with Paystack payment integration, JWT authentication, and API key-based service-to-service access.



Features
Core Functionality

🔐 Google OAuth Authentication - Secure user authentication with JWT tokens
💳 Paystack Integration - Seamless deposit transactions with Paystack
🔔 Webhook Support - Mandatory webhook implementation for transaction verification
💸 Wallet-to-Wallet Transfers - Instant transfers between users
📊 Transaction History - Complete audit trail of all wallet activities
🔑 API Key Management - Service-to-service authentication with permissions



Security Features

✅ JWT token-based authentication
✅ API key permissions (deposit, transfer, read)
✅ Maximum 5 active API keys per user
✅ API key expiration and rollover
✅ Paystack webhook signature verification
✅ Idempotent transaction processing
✅ Atomic wallet operations




Installation

Clone the repository

bashgit clone https://github.com/Reigner007/WalletServiceWithPaystack.git
cd WalletServiceWithPaystack

npm install

Set up environment variables
.env.example .env


Generate Prisma Client

bashnpm run prisma:generate

Run database migrations

bashnpm run prisma:migrate

Start the development server

bashnpm run start:dev





Authentication Endpoints

1. Google Sign-In
httpGET /auth/google
Initiates Google OAuth flow.

2. Google Callback
httpGET /auth/google/callback
Response:
json{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}


API Key Management
3. Create API Key
httpPOST /keys/create
Authorization: Bearer {jwt_token}
Request Body:
json{
  "name": "wallet-service",
  "permissions": ["deposit", "transfer", "read"],
  "expiry": "1D"
}
Expiry Options: 1H (hour), 1D (day), 1M (month), 1Y (year)
Response:
json{
  "api_key": "sk_live_xxxxx",
  "expires_at": "2025-12-10T20:00:00Z"
}

4. Rollover Expired API Key
httpPOST /keys/rollover
Authorization: Bearer {jwt_token}
Request Body:
json{
  "expired_key_id": "uuid",
  "expiry": "1M"
}

Wallet Operations

5. Deposit Money

httpPOST /wallet/deposit
Authorization: Bearer {jwt_token}
OR
x-api-key: {api_key}
Request Body:
json{
  "amount": 5000
}
Response:
json{
  "reference": "DEP_1733775600_abc123",
  "authorization_url": "https://checkout.paystack.com/xxxxx"
}

6. Paystack Webhook (Mandatory)

httpPOST /wallet/paystack/webhook
x-paystack-signature: {signature}
This endpoint is automatically called by Paystack to confirm transactions. It verifies the webhook signature and credits the wallet upon successful payment.

7. Check Deposit Status

httpGET /wallet/deposit/{reference}/status
Authorization: Bearer {jwt_token}
OR
x-api-key: {api_key}
Response:
json{
  "reference": "DEP_1733775600_abc123",
  "status": "success",
  "amount": 5000
}

8. Get Wallet Balance

httpGET /wallet/balance
Authorization: Bearer {jwt_token}
OR
x-api-key: {api_key}
Response:
json{
  "balance": 15000
}

9. Transfer Money

httpPOST /wallet/transfer
Authorization: Bearer {jwt_token}
OR
x-api-key: {api_key}
Request Body:
json{
  "wallet_number": "1733775123456",
  "amount": 3000
}
Response:
json{
  "status": "success",
  "message": "Transfer completed"
}

10. Transaction History

httpGET /wallet/transactions
Authorization: Bearer {jwt_token}
OR
x-api-key: {api_key}
Response:
json[
  {
    "type": "deposit",
    "amount": 5000,
    "status": "success",
    "description": "Wallet deposit via Paystack",
    "created_at": "2025-12-09T20:00:00Z"
  },
  {
    "type": "transfer_out",
    "amount": 3000,
    "status": "success",
    "description": "Transfer to 1733775123456",
    "created_at": "2025-12-09T20:05:00Z"
  }
]


Database Schema
Models
User

Stores user information from Google OAuth
One-to-one relationship with Wallet
One-to-many relationship with ApiKey

Wallet

Unique wallet number per user
Tracks balance with decimal precision
One-to-many relationship with Transaction

ApiKey

Supports multiple permissions
Expiration tracking
Revocation capability

Transaction

Records all wallet activities
Supports deposits and transfers
Immutable transaction history


Security
Implemented Security Measures

✅ JWT token expiration (7 days)
✅ API key expiration and rollover
✅ Paystack webhook signature verification (HMAC SHA-512)
✅ Permission-based access control
✅ Idempotent transaction processing
✅ Atomic database operations
✅ Environment variable protection
✅ Input validation with class-validator
✅ SQL injection prevention via Prisma ORM


Author
Reigner007

GitHub: @Reigner007
Email: chireigns46@gmail.com
# Wallet API (Firebase + Vercel)

## 🚀 API Endpoint
`POST /api/createWallet`

### Request
```json
{
  "username": "testuser"
}

Response

{
  "username": "testuser",
  "publicKey": "0x...",
  "privateKey": "0x..."
}

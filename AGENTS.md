# Agent Integration Guide

Welcome to the OpenMemo Agent Integration Guide. This document explains how AI agents and LLM-powered applications can leverage OpenMemo to achieve persistent, cross-platform memory while maintaining end-to-end encryption.

## The Workflow: "Login with Memory"

OpenMemo follows a zero-knowledge architecture. The server never sees the plaintext memory content or the user's master private key. As an agent, you are responsible for the encryption/decryption lifecycle.

### 1. Authentication

To access a user's memory, your agent must first authenticate.

**Endpoint**: `POST /auth/login`  
**Payload**:

```json
{
  "email": "user@example.com",
  "password": "user_password"
}
```

**Response**:

- A secure `httpOnly` cookie named `token` is set.
- (Recommended) The agent should store the `password` temporarily in memory to derive the decryption key.

### 2. Retrieving the Identity Keys

Once authenticated, fetch the user's profile to get the encryption metadata.

**Endpoint**: `GET /users/me`  
**Response Structure**:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "publicKey": "RSA_PUBLIC_KEY_PEM",
  "firstName": "Udaykumar",
  "lastName": "Dhokia"
}
```

### 3. Decrypting the Private Key (The Zero-Knowledge Step)

The `privateKey` in the response is encrypted. To use it, you must:

1.  **Derive the Key**: Use the user's `password` and `encryptionSalt` with the `scrypt` algorithm (32-byte key).
2.  **Decrypt**: Use AES-256-GCM with the derived key, `privateKeyIv`, and `privateKeyTag` to get the plaintext RSA Private Key.

### 4. Managing Memories

#### Reading Memories

**Endpoint**: `GET /memories` (Coming Soon)

- Fetch the list of memories.
- Each memory `content` will be encrypted with the user's `publicKey`.
- Use the decrypted `privateKey` to decrypt the content.

#### Writing Memories

**Endpoint**: `POST /memories` (Coming Soon)

- Encrypt the new memory content using the user's `publicKey`.
- Send the encrypted string to the server.

---

## Best Practices for Agents

1.  **Memory Management**: Store the decrypted `privateKey` only in volatile memory. Never write it to disk or logs.
2.  **Context Injection**: When a user "Logins with Memory," retrieve the top `N` memories based on `importanceScore` or semantic similarity (using `vectorId`) and inject them into your LLM's system prompt.
3.  **Dynamic Updates**: As the conversation progresses, summarize key points and push them back to OpenMemo as new memories.

## Implementation Example (Node.js)

```javascript
const crypto = require("crypto");

// 1. Derive Key from Password
const key = crypto.scryptSync(password, salt, 32);

// 2. Decrypt Private Key
const decipher = crypto.createDecipheriv(
  "aes-256-gcm",
  key,
  Buffer.from(iv, "hex"),
);
decipher.setAuthTag(Buffer.from(tag, "hex"));

let decryptedPrivateKey = decipher.update(encryptedPrivateKey, "hex", "utf8");
decryptedPrivateKey += decipher.final("utf8");

// 3. You now have the RSA Private Key to decrypt user memories!
```

---

## Support

For technical support or integration questions, please open an issue in the main repository.

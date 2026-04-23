# OpenMemo Test Suite & AI Integration Guide

This guide provides instructions on how to test the OpenMemo system and integrate the MCP server with your favorite AI agents.

## 1. Backend Testing

### Prerequisites
- Node.js installed.
- PostgreSQL database running and configured in `backend/.env` via `DATABASE_URL`.

### Steps
1. **Start the Backend**:
   ```powershell
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
2. **Register a User**:
   Use an HTTP client (e.g., Postman, Insomnia, or curl) to create a user:
   ```bash
   POST http://localhost:3000/auth/register
   {
     "email": "test@example.com",
     "password": "securepassword",
     "firstName": "Test",
     "lastName": "User"
   }
   ```
3. **Generate an API Key**:
   Login and use the returned JWT to create an API key via the dashboard or API:
   ```bash
   POST http://localhost:3000/api-keys
   {
     "name": "MCP Key"
   }
   ```
   *Note: Save the API Key (`om_...`) for the next step.*

---

## 2. MCP Server Testing

### Setup
1. **Configure Environment**:
   In `mcp-server/openmemo-mcp/.env`, add:
   ```env
   BACKEND_URL=http://localhost:3000
   OPENMEMO_API_KEY=your_api_key_here
   ```
2. **Build and Start**:
   ```powershell
   cd mcp-server/openmemo-mcp
   npm install
   npm run build
   npm run start
   ```

### Verification Scenarios
- **Scenario A: Update Preferences**:
  Ask the AI: *"Update my preferences core memory. Add that I prefer TypeScript for all my projects."*
  - **Verify**: Check the database or use `get_core_memory` to see the decrypted content.
- **Scenario B: Autonomous Fetching**:
  Ask the AI: *"Who am I and what are my preferences?"*
  - **Verify**: The AI should automatically call `get_core_memory` for `identity` and `preferences`.
- **Scenario C: Upsert Verification**:
  Update `goals` twice.
  - **Verify**: Check that only one entry exists for the `goals` category in the database.

---

## 3. Integrating with AI (Claude Desktop)

To add OpenMemo's persistent memory to Claude, follow these steps:

1. **Locate Config**:
   Open `%APPDATA%\Claude\claude_desktop_config.json` in your file explorer.

2. **Add Configuration**:
   Add the following entry under the `mcpServers` object:

   ```json
   {
     "mcpServers": {
       "openmemo": {
         "command": "node",
         "args": ["C:\\absolute\\path\\to\\OpenMemo\\mcp-server\\openmemo-mcp\\dist\\index.js"],
         "env": {
           "BACKEND_URL": "http://localhost:3000",
           "OPENMEMO_API_KEY": "om_your_api_key_here"
         }
       }
     }
   }
   ```
   *IMPORTANT: Replace the path and API key with your actual local values.*

3. **Restart Claude**:
   Fully exit Claude Desktop and restart it. You should see a hammer icon indicating that the OpenMemo tools are available.

---

## 4. Troubleshooting
- **Decryption Failed**: Ensure you are using the same password for login/register as used for the initial memory creation.
- **API Key Invalid**: Verify that the `x-api-key` header matches the key generated in the backend.
- **Connection Refused**: Ensure the backend is running on the port specified in `BACKEND_URL`.

# OpenMemo: Login with Memory

> **The Universal Memory Layer for LLMs and AI Agents.**

OpenMemo is a secure, cross-platform memory infrastructure designed to give AI agents a persistent, long-term memory that travels with the user. Imagine "Login with Google," but instead of just identity, you provide your AI agent with your entire context, knowledge, and history—all secured with end-to-end encryption.

---

## The Vision: "Login with Memory"

Current AI interactions are fragmented. Every time you start a new chat or use a different agent, you start from zero. OpenMemo solves this by providing a unified, encrypted memory vault.

- **Cross-Platform**: Use your memory in ChatGPT, Claude, local agents, or custom apps.
- **Privacy First**: Memories are end-to-end encrypted (E2EE). Even OpenMemo cannot read your data.
- **AI-Ready**: Built-in support for vector embeddings, importance scoring, and semantic tagging.

---

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Security**: 
  - RSA-2048 for Key Exchange
  - AES-256-GCM for Data Encryption
  - JWT (Secure httpOnly Cookies) for Session Management
- **Validation**: Class-validator / Class-transformer

---

## Database Architecture

OpenMemo uses a relational schema optimized for both structured retrieval and semantic search integration.

### Core Entities

1.  **`User`**: The root of the identity. Stores the user's public key and an **encrypted** version of their private key.
2.  **`Memory`**: The fundamental unit of context.
    - `content`: The E2EE encrypted memory string.
    - `vectorId`: Reference to a vector database (e.g., Pinecone/Milvus) for semantic retrieval.
    - `importanceScore`: Dynamic score to help agents prioritize information.
3.  **`MemoryTag`**: Semantic labels for organized filtering and knowledge graph construction.

### Security Model
- **Registration**: On signup, a unique RSA-2048 key pair is generated for the user.
- **Key Storage**: The public key is stored in plaintext. The private key is encrypted using AES-256-GCM with a key derived from the user's password (via `scrypt`).
- **Encryption**: Data is encrypted on the client or server-side before storage, ensuring zero-knowledge privacy.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- `npm` or `yarn`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/udaykumar-dhokia/OpenMemo.git
   cd OpenMemo/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/openmemo"
   JWT_SECRET="your_secure_secret"
   ```

4. **Database Migration**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the server**
   ```bash
   npm run start:dev
   ```

---

## 🤝 Contributing

We welcome contributions! Whether it's improving the encryption logic, adding vector database integrations, or refining the API.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ for the AI community.</p>

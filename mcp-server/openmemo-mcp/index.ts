import { MCPServer, text } from "mcp-use/server";
import { z } from "zod";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname.replace(/[\\/]dist$/, "");
process.chdir(projectRoot);

const originalLog = console.log;
console.log = (...args: any[]) => {
  console.error(...args);
};
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const server = new MCPServer({
  name: "openmemo-mcp",
  title: "OpenMemo",
  version: "1.3.0",
  description: "MCP Server for OpenMemo - Zero-Knowledge Memory Management",
  baseUrl: process.env.MCP_URL || "http://localhost:5555",
});

const MemoryCategory = z.enum([
  "preferences",
  "identity",
  "projects",
  "expertise",
  "ideas",
  "relationships",
  "constraints",
  "goals",
]);

/**
 * Middleware-like check for API Key
 */
const getHeaders = () => {
  const apiKey = process.env.OPENMEMO_API_KEY;
  const password = process.env.OPENMEMO_PASSWORD;
  if (!apiKey) {
    throw new Error(
      "OPENMEMO_API_KEY is not configured. \n" +
        "Please add it to your .env file or your MCP client configuration.\n",
    );
  }
  return {
    "x-api-key": apiKey,
    ...(password ? { "x-memory-password": password } : {}),
  };
};

/**
 * Create Memory Tool
 */
server.tool(
  {
    name: "create_memory",
    description: "Store a new memory in OpenMemo",
    schema: z.object({
      content: z.string().describe("The content of the memory"),
      category: MemoryCategory.describe("The category of the memory"),
      title: z.string().optional().describe("Optional title for the memory"),
      tags: z.array(z.string()).optional().describe("Optional tags"),
      summary: z.string().describe("A short summary of the memory"),
      vectorId: z.string().describe("A unique vector ID for semantic indexing"),
    }),
  },
  async ({ content, category, title, tags, summary, vectorId }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/memories`,
        { content, category, title, tags, summary, vectorId },
        { headers: getHeaders() },
      );
      return text(`Memory stored successfully! (ID: ${response.data.id})`);
    } catch (error: any) {
      return text(
        `Failed to store memory: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

/**
 * Get Core Memory Tool
 */
server.tool(
  {
    name: "get_core_memory",
    description:
      "Fetch and decrypt a specific category of memory (Core Identity)",
    schema: z.object({
      category: MemoryCategory.describe("The category to fetch"),
    }),
  },
  async ({ category }) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/memories/category/${category}`,
        {
          headers: getHeaders(),
        },
      );

      const memory = response.data;
      if (!memory) {
        return text(`No core memory found for category: ${category}`);
      }

      // Check if the content still looks encrypted (hex string of exactly 100+ chars)
      const isEncrypted = /^[0-9a-f]{64,}$/i.test(memory.content);
      if (isEncrypted) {
        return text(
          `⚠️ Core Memory [${category}] is still encrypted on the server.\n\n` +
            `Raw Content: ${memory.content.substring(0, 20)}...\n\n` +
            `Please ensure your API Key is valid and the backend decryption logic is working.`,
        );
      }

      return text(
        `### Core Memory: ${category.toUpperCase()}\n\n${memory.content}`,
      );
    } catch (error: any) {
      return text(
        `Failed to fetch core memory: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

/**
 * Update Core Memory Tool
 */
server.tool(
  {
    name: "update_core_memory",
    description: "Update a specific category of memory (Core Identity)",
    schema: z.object({
      category: MemoryCategory.describe("The category to update"),
      content: z.string().describe("The new full content for this category"),
      summary: z.string().describe("A brief summary of what changed"),
    }),
  },
  async ({ category, content, summary }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/memories`,
        {
          content,
          category,
          summary,
          title: `Updated ${category}`,
          vectorId: `${category}_${Date.now()}`,
        },
        { headers: getHeaders() },
      );
      return text(`Core memory [${category}] updated successfully!`);
    } catch (error: any) {
      return text(
        `Failed to update core memory: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

/**
 * Search Memories Tool
 */
server.tool(
  {
    name: "search_memories",
    description: "Search your OpenMemo memories using semantic search",
    schema: z.object({
      query: z.string().describe("The search query"),
      limit: z
        .number()
        .optional()
        .default(5)
        .describe("Number of memories to return"),
    }),
  },
  async ({ query, limit }) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/memories`, {
        params: { query, limit },
        headers: getHeaders(),
      });

      const results = response.data.map((m: any) => {
        const isEncrypted = /^[0-9a-f]{64,}$/i.test(m.content);
        return {
          id: m.id,
          category: m.category,
          title: m.title,
          content: isEncrypted ? "[Encrypted Content]" : m.content,
          summary: isEncrypted ? "[Encrypted Summary]" : m.summary,
        };
      });

      return text(
        `### Search results for "${query}":\n\n${JSON.stringify(results, null, 2)}`,
      );
    } catch (error: any) {
      return text(
        `Failed to search memories: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

/**
 * AI Guidance Prompt
 */
server.prompt(
  {
    name: "memory_lifecycle",
    description: "Guidelines for managing user memories in OpenMemo",
  },
  async () => {
    return text(`
You are an AI assistant with access to OpenMemo, a secure long-term memory system.
Follow these rules for managing the user's memory:

1. **Initialization**: At the start of a session, use \`get_core_memory\` to fetch 'identity' and 'preferences'. This establishes the user's persona and interaction style.
2. **Contextual Awareness**: If the user mentions a new project, relationship, or constraint, use \`update_core_memory\` for the respective category.
3. **Identity Evolution**: If you learn something significant about the user's expertise or goals, update those core memories.
4. **Markdown Format**: Always store core memories in clean Markdown format.
    `);
  },
);

const PORT = Number(process.env.PORT) || 5555;
console.error(`OpenMemo MCP Server running on port ${PORT}`);
server.listen(PORT);

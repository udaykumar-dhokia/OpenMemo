import { MCPServer, text } from "mcp-use/server";
import { z } from "zod";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const server = new MCPServer({
  name: "openmemo-mcp",
  title: "OpenMemo",
  version: "1.2.0",
  description: "MCP Server for OpenMemo - API Key Authenticated",
  baseUrl: process.env.MCP_URL || "http://localhost:3001",
});

/**
 * Middleware-like check for API Key from environment
 */
const getHeaders = () => {
  const apiKey = process.env.OPENMEMO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENMEMO_API_KEY is not configured. \n" +
        "Please add it to your .env file or your MCP client configuration (e.g., claude_desktop_config.json).\n" +
        "Example in .env: OPENMEMO_API_KEY=om_your_key_here",
    );
  }
  return {
    "x-api-key": apiKey,
  };
};

/**
 * Create Memory Tool
 */
server.tool(
  {
    name: "create_memory",
    description: "Store a new memory in OpenMemo using your API Key",
    schema: z.object({
      content: z.string().describe("The content of the memory"),
      title: z.string().optional().describe("Optional title for the memory"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional tags for categorization"),
      summary: z.string().describe("A short summary of the memory"),
      vectorId: z.string().describe("A unique vector ID for semantic indexing"),
    }),
  },
  async ({ content, title, tags, summary, vectorId }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/memories`,
        {
          content,
          title,
          tags,
          summary,
          vectorId,
        },
        {
          headers: getHeaders(),
        },
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

      return text(
        `Search results for "${query}":\n\n${JSON.stringify(response.data, null, 2)}`,
      );
    } catch (error: any) {
      return text(
        `Failed to search memories: ${error.response?.data?.message || error.message}`,
      );
    }
  },
);

const PORT = 3001;
console.log(`OpenMemo MCP Server (API Key Mode) running on port ${PORT}`);
server.listen(PORT);

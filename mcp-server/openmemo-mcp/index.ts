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
  if (!apiKey) {
    throw new Error(
      "OPENMEMO_API_KEY is not configured. \n" +
        "Please add it to your .env file or your MCP client configuration.\n",
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
    description: "Store a new memory in OpenMemo",
    schema: z.object({
      content: z.string().describe("The content of the memory"),
      category: MemoryCategory.describe("The category of the memory"),
      title: z.string().optional().describe("Optional title for the memory"),
      tags: z.array(z.string()).optional().describe("Optional tags"),
      summary: z.string().describe("A short summary of the memory"),
    }),
  },
  async ({ content, category, title, tags, summary }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/memories`,
        { content, category, title, tags, summary },
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
        return {
          id: m.id,
          category: m.category,
          title: m.title,
          content: m.content,
          summary: m.summary,
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

**Available Core Categories**:
- \`identity\`: Personal background, developer persona, bio.
- \`preferences\`: UI/UX settings, coding style, tool choices.
- \`projects\`: Current work, side projects, client engagements.
- \`expertise\`: Skills, tech stack, domain knowledge.
- \`ideas\`: Future concepts, brainstorming notes.
- \`relationships\`: Clients, colleagues, networking info.
- \`constraints\`: Deadlines, hardware limits, architectural rules.
- \`goals\`: Career objectives, project milestones.

1. **Initialization**: At the start of a session, use \`search_memories\` to fetch memories related to the user's query.
2. **Check Before Create**: Before creating a new memory, always use \`search_memories\` or \`get_core_memory\` to check if similar information already exists.
3. **Update vs. Create**: If information belongs to one of the **Core Categories** above, use \`update_core_memory\` instead of creating a new memory record.
4. **Semantic Retrieval**: Use \`search_memories\` for general knowledge retrieval outside core categories.
5. **Contextual Awareness**: Consolidate related information (e.g., multiple projects) into a single Markdown list within the respective core category.
6. **Markdown Format**: Always store and update memories in clean, structured Markdown format.
7. **Before Coding**: Always use \`get_core_memory(preferences)\` and \`get_core_memory(identity)\` to get the user's preferences and identity & ask user to continue the coding with user preferences and identity.
8. **Post-Task Updates**: After completing a significant task (e.g., finishing a feature, resolving a complex bug, or establishing a new workflow), proactively update the relevant core memory category to reflect the updated state of the user's projects, expertise, or constraints.
    `);
  },
);

const PORT = Number(process.env.PORT) || 5555;
console.error(`OpenMemo MCP Server running on port ${PORT}`);
server.listen(PORT);

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const z = require("zod");
const {
  SUPPORTED_STYLES,
  formatListAllIconsText,
  formatSearchIconsText,
  listAllIcons,
  retrieveIcon,
  searchIcons,
} = require("./icons");

function createServer() {
  const server = new McpServer({
    name: "heroicons-svg-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "list_icons",
    {
      description:
        "Lists all available Heroicons, optionally filtered by style (outline, solid, mini, micro).",
      inputSchema: {
        style: z
          .enum(SUPPORTED_STYLES)
          .optional()
          .describe("Filter icon variants by style"),
      },
    },
    async ({ style }) => {
      const result = listAllIcons(style);

      return {
        content: [
          {
            type: "text",
            text: formatListAllIconsText(result),
          },
        ],
        structuredContent: result,
      };
    }
  );

  server.registerTool(
    "search_icons",
    {
      description:
        "Searches for Heroicons by name or keywords across all styles.",
      inputSchema: {
        query: z.string().trim().min(1).describe("Search query"),
        style: z
          .enum(SUPPORTED_STYLES)
          .optional()
          .describe("Filter icon variants by style"),
      },
    },
    async ({ query, style }) => {
      const result = searchIcons(query, style);

      return {
        content: [
          {
            type: "text",
            text: formatSearchIconsText(result),
          },
        ],
        structuredContent: result,
      };
    }
  );

  server.registerTool(
    "retrieve_icon",
    {
      description: "Retrieves the source of the icon in SVG format.",
      inputSchema: {
        name: z.string().trim().min(1).describe("Icon name"),
        style: z.enum(SUPPORTED_STYLES).describe("Icon style"),
      },
    },
    async ({ name, style }) => {
      const result = retrieveIcon(name, style);

      return {
        content: [
          {
            type: "text",
            text: result.svg,
          },
        ],
        structuredContent: result,
      };
    }
  );

  return server;
}

async function startStdioServer(transport = new StdioServerTransport()) {
  const server = createServer();
  await server.connect(transport);
  return { server, transport };
}

module.exports = {
  createServer,
  startStdioServer,
};

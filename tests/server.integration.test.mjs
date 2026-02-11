import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = require("@modelcontextprotocol/sdk/inMemory.js");
const { createServer, startStdioServer } = require("../src/server.js");

let client;
let server;
let clientTransport;
let serverTransport;

beforeAll(async () => {
  server = createServer();
  client = new Client({
    name: "heroicons-svg-mcp-integration-tests",
    version: "1.0.0",
  });

  [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
}, 15_000);

afterAll(async () => {
  if (clientTransport) {
    await clientTransport.close();
  }
  if (serverTransport) {
    await serverTransport.close();
  }
}, 15_000);

describe("server MCP integration", () => {
  it("registers all expected tools", async () => {
    const { tools } = await client.listTools();
    const toolNames = tools.map((tool) => tool.name).sort();

    expect(toolNames).toEqual(["list_icons", "retrieve_icon", "search_icons"]);
  });

  it("handles list, search and retrieve tool calls", async () => {
    const listResult = await client.callTool({
      name: "list_icons",
      arguments: { style: "outline" },
    });
    const searchResult = await client.callTool({
      name: "search_icons",
      arguments: { query: "academic cap", style: "outline" },
    });
    const retrieveResult = await client.callTool({
      name: "retrieve_icon",
      arguments: { name: "academic-cap", style: "outline" },
    });

    expect(listResult.isError).not.toBe(true);
    expect(listResult.structuredContent.total).toBeGreaterThan(0);
    expect(searchResult.isError).not.toBe(true);
    expect(searchResult.structuredContent.total).toBeGreaterThan(0);
    expect(retrieveResult.isError).not.toBe(true);
    expect(retrieveResult.structuredContent.name).toBe("academic-cap");
    expect(retrieveResult.structuredContent.style).toBe("outline");
    expect(retrieveResult.structuredContent.svg).toContain("<svg");
    expect(retrieveResult.structuredContent.svg).toContain("</svg>");
  });

  it("returns verbose errors for invalid retrieve_icon input", async () => {
    const result = await client.callTool({
      name: "retrieve_icon",
      arguments: { name: "acad../cap", style: "outline" },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Invalid icon name");
  });
});

describe("startStdioServer", () => {
  it("accepts an injected transport and serves tools", async () => {
    const [localClientTransport, localServerTransport] = InMemoryTransport.createLinkedPair();
    const localClient = new Client({
      name: "local-start-stdio-server-test-client",
      version: "1.0.0",
    });

    const startPromise = startStdioServer(localServerTransport);
    await localClient.connect(localClientTransport);
    const started = await startPromise;

    const { tools } = await localClient.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "list_icons",
      "retrieve_icon",
      "search_icons",
    ]);
    expect(started.server).toBeDefined();
    expect(started.transport).toBe(localServerTransport);

    await localClientTransport.close();
  });
});

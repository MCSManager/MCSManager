#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { McsmToolHandlers, toolDefinitions } from "./tools.js";

async function main() {
  const config = loadConfig();
  const handlers = new McsmToolHandlers(config);
  const server = new Server(
    {
      name: "mcsmanager-mcp-server",
      version: "0.1.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions }));
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handlers.callTool(request.params.name, request.params.arguments ?? {})
  );

  await server.connect(new StdioServerTransport());
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

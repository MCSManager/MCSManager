#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { AlertMonitor } from "./alert_monitor.js";
import type { AlertPayload } from "./alert_monitor.js";
import { loadConfig } from "./config.js";
import { McsmToolHandlers, toolDefinitions } from "./tools.js";
import { McsmClient } from "./mcsmClient.js";

async function main() {
  const config = loadConfig();
  const mcsmClient = new McsmClient(config);
  const handlers = new McsmToolHandlers(config, mcsmClient);

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

  if (config.alertEnabled && config.alertPushUrl) {
    const alertMonitor = new AlertMonitor(mcsmClient, async (alert: AlertPayload) => {
      await pushAlert(config.alertPushUrl!, alert);
    }, config.alertPollIntervalMs);
    alertMonitor.start();
  }

  await server.connect(new StdioServerTransport());
}

async function pushAlert(pushUrl: string, alert: AlertPayload): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(pushUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

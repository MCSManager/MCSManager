import net from "net";
import { describe, expect, it } from "vitest";
import PingMinecraftServer from "../mcping";

describe("PingMinecraftServer", () => {
  it(
    "closes a connected socket when the server does not answer",
    async () => {
      const server = net.createServer();
      let client: net.Socket | undefined;

      server.on("connection", (socket) => {
        client = socket;
      });

      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });

      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Expected the test server to have a TCP address");
      }

      try {
        const ping = new PingMinecraftServer(address.port, "127.0.0.1");
        await expect(
          ping.getStatus()
        ).rejects.toThrow("Minecraft server ping timed out");
        expect(ping.client?.destroyed).toBe(true);
      } finally {
        client?.destroy();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    },
    20_000
  );
});

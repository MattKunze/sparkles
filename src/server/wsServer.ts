import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

import { logConfig, sharedConfig } from "@/config";
import { createContext } from "@/server/context";
import { initialize as kernelInitialize } from "@/server/kernel";
import { appRouter } from "@/server/routers/_app";

const port = parseInt(sharedConfig.WSS_ENDPOINT.split(":").pop()!, 10);

const wss = new WebSocketServer({ port });
applyWSSHandler({ wss, createContext, router: appRouter });

kernelInitialize();

logConfig(sharedConfig);
console.log(`✅ WebSocket Server listening on ws://localhost:${port}`);

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});

import dotenv from "dotenv";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";

import { Context, createContext } from "@/server/context";
import { initialize as kernelInitialize } from "@/server/kernel";
import { appRouter } from "@/server/routers/_app";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const port = parseInt(process.env.WSS_PORT ?? "3001", 10);

const wss = new WebSocketServer({ port });
const handler = applyWSSHandler({ wss, createContext, router: appRouter });

kernelInitialize();

console.log(`✅ WebSocket Server listening on ws://localhost:${port}`);

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});

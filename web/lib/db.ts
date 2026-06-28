import { PrismaClient } from "@prisma/client";
import { headers } from "next/headers";

const globalForPrisma = globalThis as unknown as { 
  prismaSimulation?: PrismaClient;
  prismaHardware?: PrismaClient;
};

export const prismaSimulation =
  globalForPrisma.prismaSimulation ??
  new PrismaClient({
    datasourceUrl: process.env.SIMULATION_DATABASE_URL ?? "file:./simulation.db",
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

export const prismaHardware =
  globalForPrisma.prismaHardware ??
  new PrismaClient({
    datasourceUrl: process.env.HARDWARE_DATABASE_URL ?? "file:./hardware.db",
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

export function getDb(fallbackMode?: string) {
  let mode = fallbackMode;
  try {
    mode = mode ?? headers().get("X-Demo-Mode") ?? "SIMULATION";
  } catch (e) {
    // headers() throws if used outside Next.js request context (e.g. scripts)
    mode = mode ?? "SIMULATION";
  }
  return mode === "HARDWARE" ? prismaHardware : prismaSimulation;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaSimulation = prismaSimulation;
  globalForPrisma.prismaHardware = prismaHardware;
}

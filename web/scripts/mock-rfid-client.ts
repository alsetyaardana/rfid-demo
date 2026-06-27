import { activeDemoReturnEpcs, activeDemoSendEpcs } from "@/lib/domain/demo-data";

const preset = process.argv[2] ?? "handheld-send-8";
const baseUrl = process.env.RFID_API_BASE_URL ?? "http://127.0.0.1:3000";
const apiKey = process.env.RFID_API_KEY ?? "local-demo-rfid-key";

const now = new Date().toISOString();

const presets: Record<string, () => unknown> = {
  "handheld-send-8": () => payload({
    clientSessionId: "MOCK-HH-SEND-8",
    readerId: "C5-DEMO-01",
    readerType: "HANDHELD",
    operationMode: "MANUAL",
    transactionType: "SEND_TO_LAUNDRY",
    checkpoint: "LINEN_STORAGE",
    epcs: activeDemoSendEpcs,
    duplicateFirstTwo: true
  }),
  "handheld-return-7": () => payload({
    clientSessionId: "MOCK-HH-RETURN-7",
    readerId: "C5-DEMO-01",
    readerType: "HANDHELD",
    operationMode: "MANUAL",
    transactionType: "RETURN_FROM_LAUNDRY",
    checkpoint: "LAUNDRY_RETURN_DESK",
    epcs: activeDemoReturnEpcs,
    duplicateFirstTwo: true
  }),
  "fixed-send-8": () => payload({
    clientSessionId: "MOCK-FX-SEND-8",
    readerId: "FX-LDY-02",
    readerType: "FIXED_READER_EMULATOR",
    operationMode: "AUTOMATIC",
    transactionType: "SEND_TO_LAUNDRY",
    checkpoint: "LAUNDRY_DISPATCH_GATE",
    epcs: activeDemoSendEpcs,
    duplicateFirstTwo: true
  }),
  "unknown-epc": () => payload({
    clientSessionId: "MOCK-UNKNOWN-EPC",
    readerId: "SIM-WEB-01",
    readerType: "SIMULATOR",
    operationMode: "SIMULATION",
    transactionType: "STOCK_COUNT",
    checkpoint: "LINEN_STORAGE",
    epcs: [activeDemoSendEpcs[0], "UNKNOWN-EPC-9999"],
    duplicateFirstTwo: false
  }),
  "duplicate-retry": () => payload({
    clientSessionId: "MOCK-HH-SEND-8",
    readerId: "C5-DEMO-01",
    readerType: "HANDHELD",
    operationMode: "MANUAL",
    transactionType: "SEND_TO_LAUNDRY",
    checkpoint: "LINEN_STORAGE",
    epcs: activeDemoSendEpcs,
    duplicateFirstTwo: true
  })
};

async function main() {
  const build = presets[preset];
  if (!build) {
    console.error(`Unknown preset "${preset}". Use: ${Object.keys(presets).join(", ")}`);
    process.exit(1);
  }

  const response = await fetch(`${baseUrl}/api/rfid/read-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RFID-API-Key": apiKey
    },
    body: JSON.stringify(build())
  });

  const body = await response.json();
  console.log(JSON.stringify({ status: response.status, body }, null, 2));
  if (!response.ok) process.exit(1);
}

function payload(options: {
  clientSessionId: string;
  readerId: string;
  readerType: string;
  operationMode: string;
  transactionType: string;
  checkpoint: string;
  epcs: string[];
  duplicateFirstTwo: boolean;
}) {
  return {
    clientSessionId: options.clientSessionId,
    readerId: options.readerId,
    readerType: options.readerType,
    operationMode: options.operationMode,
    dataSource: options.readerType === "SIMULATOR" ? "WEBSITE_SIMULATION" : "LIVE_DEVICE",
    checkpoint: options.checkpoint,
    transactionType: options.transactionType,
    laundryBatchCode: options.transactionType.includes("LAUNDRY") ? "LB-DEMO-001" : undefined,
    operatorName: "Mock Device Client",
    startedAt: now,
    completedAt: now,
    tags: options.epcs.map((epc, index) => ({
      epc,
      rssi: -48 - index,
      antenna: options.readerType.includes("FIXED") ? "ANT-1" : null,
      readCount: options.duplicateFirstTwo && index < 2 ? 2 : 1,
      firstSeenAt: now,
      lastSeenAt: now
    }))
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

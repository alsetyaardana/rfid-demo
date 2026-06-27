import { getDb } from "./lib/db";
import { generateSimulationData, clearSimulationData, resetSimulationDatabase } from "./lib/services/simulation";
import { simulateSendToLaundryAction, simulateReturnFromLaundryAction, simulateUnknownReadAction } from "./app/actions";

async function run() {
  const pSim = getDb("SIMULATION");
  const pHardware = getDb("HARDWARE");

  try {
    console.log("=== 1. Starting with empty simulation.db ===");
    await resetSimulationDatabase(pSim);
    
    let linenCount = await pSim.linen.count();
    let batchCount = await pSim.laundryBatch.count();
    console.log(`Initial Linen Count: ${linenCount}, Batches: ${batchCount}`);
    
    console.log("\n=== 2. Generating 20 linen records ===");
    await generateSimulationData(pSim, 20);
    linenCount = await pSim.linen.count();
    console.log(`Linen Count after generation: ${linenCount}`);
    
    if (linenCount !== 20) throw new Error("Linen generation failed to produce 20 records.");

    const sampleLinen = await pSim.linen.findFirst();
    console.log("Sample generated linen:", sampleLinen);
    
    console.log("\n=== 3. Limit validation ===");
    try {
      await generateSimulationData(pSim, 81);
      throw new Error("Failed to enforce 100-limit");
    } catch (e: any) {
      if (e.message.includes("Failed to enforce")) throw e;
      console.log("Limit properly enforced with message:", e.message);
    }
    
    linenCount = await pSim.linen.count();
    if (linenCount !== 20) throw new Error("Partial generation occurred during limit test.");
    console.log("No partial generation occurred. Linen count is still 20.");

    console.log("\n=== 4. Dynamic Scenario execution ===");
    console.log("Running Send To Laundry...");
    const sendResult = await simulateSendToLaundryAction();
    console.log("Send Transaction Code:", sendResult.transactionCode);

    console.log("Running Return From Laundry...");
    const returnResult = await simulateReturnFromLaundryAction();
    console.log("Return Transaction Code:", returnResult.transactionCode);

    console.log("Running Unknown Read...");
    const unknownResult = await simulateUnknownReadAction();
    console.log("Unknown Count:", unknownResult.unknownCount);

    const batches = await pSim.laundryBatch.findMany();
    console.log("Generated Batches:", batches.map(b => b.batchCode));

    if (batches.some(b => b.batchCode === "LB-DEMO-001")) {
      throw new Error("LB-DEMO-001 dependency still exists!");
    }

    console.log("\n=== 5. Clear validation ===");
    await clearSimulationData(pSim);
    linenCount = await pSim.linen.count();
    batchCount = await pSim.laundryBatch.count();
    const locCount = await pSim.location.count();
    console.log(`After Clear: Linen=${linenCount}, Batches=${batchCount}, Locations=${locCount}`);

    if (linenCount !== 0 || batchCount !== 0 || locCount === 0) {
      throw new Error("Clear validation failed.");
    }
    
    console.log("\n=== 6. Hardware Isolation check ===");
    const hwLinenCount = await pHardware.linen.count();
    console.log(`Hardware Linen Count: ${hwLinenCount}`);

    console.log("\nAll tests passed successfully.");

  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();

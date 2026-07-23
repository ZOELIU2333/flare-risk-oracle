const hre = require("hardhat");

// Deployed contract address (M1 deployment result)
const CONTRACT_ADDRESS = "0x29D2567bbD5979426fadAdB8991C10dE267f4304";

async function main() {
  const oracle = await hre.ethers.getContractAt("RiskOracle", CONTRACT_ADDRESS);

  console.log("=== Read before write ===");
  let [score, reason, updatedAt] = await oracle.getRisk();
  console.log(`  score: ${score}, reason: "${reason}", updatedAt: ${updatedAt}`);

  console.log("\n=== Writing risk score (72, high volatility) ===");
  const tx = await oracle.setRisk(72, "high volatility detected");
  console.log("  tx hash:", tx.hash);
  await tx.wait();
  console.log("  Confirmed on-chain");

  console.log("\n=== Read after write ===");
  [score, reason, updatedAt] = await oracle.getRisk();
  console.log(`  score: ${score}, reason: "${reason}", updatedAt: ${updatedAt}`);
  console.log(`  human-readable timestamp: ${new Date(Number(updatedAt) * 1000).toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

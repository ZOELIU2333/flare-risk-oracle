const hre = require("hardhat");

// 部署好的合约地址（M1 部署结果）
const CONTRACT_ADDRESS = "0x29D2567bbD5979426fadAdB8991C10dE267f4304";

async function main() {
  const oracle = await hre.ethers.getContractAt("RiskOracle", CONTRACT_ADDRESS);

  console.log("=== 写入前读取 ===");
  let [score, reason, updatedAt] = await oracle.getRisk();
  console.log(`  score: ${score}, reason: "${reason}", updatedAt: ${updatedAt}`);

  console.log("\n=== 写入风险分 (72, high volatility) ===");
  const tx = await oracle.setRisk(72, "high volatility detected");
  console.log("  tx hash:", tx.hash);
  await tx.wait();
  console.log("  已确认上链");

  console.log("\n=== 写入后读取 ===");
  [score, reason, updatedAt] = await oracle.getRisk();
  console.log(`  score: ${score}, reason: "${reason}", updatedAt: ${updatedAt}`);
  console.log(`  时间戳可读: ${new Date(Number(updatedAt) * 1000).toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

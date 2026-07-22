const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "C2FLR");

  const RiskOracle = await hre.ethers.getContractFactory("RiskOracle");
  const oracle = await RiskOracle.deploy();
  await oracle.waitForDeployment();

  const address = await oracle.getAddress();
  console.log("RiskOracle deployed to:", address);
  console.log("Explorer:", `https://coston2-explorer.flare.network/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import { IWeb2Json } from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";
import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

// RiskData 定义统一在 IRiskOracle.sol；字段(score/reason/timestamp)与
// 脚本里 abiSignature 的 components 顺序/类型完全一致。

contract RiskOracleFdc is IRiskOracle {
    address public owner;
    RiskData public latest;
    RiskData[] public history;

    constructor() {
        owner = msg.sender;
    }

    function addRisk(IWeb2Json.Proof calldata data) public {
        require(isWeb2JsonProofValid(data), "Invalid proof");

        RiskData memory dto = abi.decode(data.data.responseBody.abiEncodedData, (RiskData));

        latest = dto;
        history.push(dto);
    }

    // 仅演示用：路演时快速切换风险值以演示消费方反应；
    // 真实数据始终走 addRisk(FDC proof) 通道。
    function setRiskForDemo(uint256 _score, string calldata _reason) external {
        require(msg.sender == owner, "not owner");
        RiskData memory dto = RiskData({ score: _score, reason: _reason, timestamp: block.timestamp });
        latest = dto;
        history.push(dto);
    }

    function getLatest() public view returns (RiskData memory) {
        return latest;
    }

    function historyLength() public view returns (uint256) {
        return history.length;
    }

    // 让 ABI 里包含 RiskData 结构，脚本可从 artifact 读取其类型
    function abiSignatureHack(RiskData calldata dto) public pure {}

    function isWeb2JsonProofValid(IWeb2Json.Proof calldata _proof) private view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyWeb2Json(_proof);
    }
}

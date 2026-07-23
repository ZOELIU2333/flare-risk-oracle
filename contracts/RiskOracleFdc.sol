// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import { IWeb2Json } from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";
import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

// RiskData is defined centrally in IRiskOracle.sol; its fields (score/reason/timestamp)
// match the order and types of the abiSignature components used in the scripts exactly.

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

    // For demonstration only: lets the presenter quickly toggle the risk value on stage to
    // show how consumers react; real data always flows through the addRisk(FDC proof) path.
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

    // Ensures the ABI includes the RiskData struct so scripts can read its type from the artifact
    function abiSignatureHack(RiskData calldata dto) public pure {}

    function isWeb2JsonProofValid(IWeb2Json.Proof calldata _proof) private view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyWeb2Json(_proof);
    }
}

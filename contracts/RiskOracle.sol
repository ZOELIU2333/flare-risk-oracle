// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RiskOracle - M1 minimal version
/// @notice First deployable contract to verify Coston2 setup.
///         Stores a single risk score; will be extended in M2/M3 to
///         consume FDC-verified AI risk data.
contract RiskOracle {
    address public owner;
    uint256 public riskScore;      // 0-100
    string public riskReason;
    uint256 public lastUpdated;

    event RiskUpdated(uint256 score, string reason, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    function setRisk(uint256 _score, string calldata _reason) external {
        require(msg.sender == owner, "not owner");
        require(_score <= 100, "score out of range");
        riskScore = _score;
        riskReason = _reason;
        lastUpdated = block.timestamp;
        emit RiskUpdated(_score, _reason, block.timestamp);
    }

    function getRisk() external view returns (uint256 score, string memory reason, uint256 updatedAt) {
        return (riskScore, riskReason, lastUpdated);
    }
}

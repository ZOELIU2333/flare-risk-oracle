// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IRiskOracle - Open standard interface for the AI risk oracle
/// @notice Any Flare DeFi protocol can plug in AI risk signals with a single import.
///         This is the standard facade that upgrades risk management from a
///         "standalone application" into shared ecosystem infrastructure.
struct RiskData {
    uint256 score;      // 0-100, AI composite risk score
    string reason;      // Risk rationale provided by the AI
    uint256 timestamp;  // Update time
}

interface IRiskOracle {
    /// @notice Reads the latest AI risk score
    function getLatest() external view returns (RiskData memory);
}

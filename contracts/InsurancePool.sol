// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

/// @title InsurancePool - Example third-party protocol: an AI-risk-driven insurance pool
/// @notice A completely different protocol type from MiniLending, yet it plugs into
///         IRiskOracle just as easily with a single line. This demonstrates that the
///         AI risk oracle is public infrastructure reusable by any protocol.
///         Logic: the higher the risk, the more expensive the premium; underwriting
///         halts entirely when risk is extreme.
contract InsurancePool {
    IRiskOracle public riskOracle;

    uint256 public constant BASE_PREMIUM_BPS = 100;   // Base premium 1% (low risk)
    uint256 public constant MAX_PREMIUM_BPS = 1000;   // Max premium 10% (high risk)
    uint256 public constant RISK_STOP_UNDERWRITING = 90; // Halt underwriting when risk >= 90

    event PolicyQuoted(address indexed user, uint256 coverage, uint256 premium, uint256 riskScore);
    event UnderwritingSuspended(address indexed user, uint256 riskScore, string reason);

    constructor(address _riskOracle) {
        riskOracle = IRiskOracle(_riskOracle);
    }

    /// @notice Returns a premium quote based on the current AI risk score (premium for the given coverage)
    function quotePremium(uint256 coverage) public view returns (uint256 premium, uint256 riskScore) {
        RiskData memory r = riskOracle.getLatest();
        riskScore = r.score;
        // The premium rate rises linearly with risk: BASE + (MAX-BASE)*score/100
        uint256 rateBps = BASE_PREMIUM_BPS + ((MAX_PREMIUM_BPS - BASE_PREMIUM_BPS) * riskScore) / 100;
        premium = (coverage * rateBps) / 10000;
    }

    /// @notice Attempts to buy a policy: coverage is declined when AI risk is extreme
    function buyPolicy(uint256 coverage) external returns (uint256 premium) {
        RiskData memory r = riskOracle.getLatest();
        if (r.score >= RISK_STOP_UNDERWRITING) {
            emit UnderwritingSuspended(msg.sender, r.score, r.reason);
            revert("AI risk too high: underwriting suspended");
        }
        (premium, ) = quotePremium(coverage);
        emit PolicyQuoted(msg.sender, coverage, premium, r.score);
        return premium;
    }
}

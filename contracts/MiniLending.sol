// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

/// @title MiniLending - A minimal demonstration lending protocol
/// @notice Consumes the AI risk signal from RiskOracle: the higher the risk, the higher
///         the required collateral ratio, and lending is refused outright when risk is
///         extreme. Demonstrates "an AI risk oracle being consumed by a DeFi protocol".
contract MiniLending {
    IRiskOracle public riskOracle;

    // Collateral ratio tiers (percentage, 150 = 150% collateral required)
    uint256 public constant BASE_COLLATERAL_RATIO = 150; // Low risk
    uint256 public constant HIGH_COLLATERAL_RATIO = 250; // High risk
    uint256 public constant RISK_THRESHOLD_HIGH = 50;    // Risk score >= 50 treated as high risk
    uint256 public constant RISK_THRESHOLD_REJECT = 80;  // Risk score >= 80 rejects lending

    event Borrowed(address indexed user, uint256 collateral, uint256 borrowed, uint256 riskScore, uint256 ratioUsed);
    event BorrowRejected(address indexed user, uint256 riskScore, string reason);

    constructor(address _riskOracle) {
        riskOracle = IRiskOracle(_riskOracle);
    }

    /// @notice Returns the collateral ratio that should currently apply, based on the current AI risk score
    function currentCollateralRatio() public view returns (uint256 ratio, uint256 riskScore) {
        RiskData memory r = riskOracle.getLatest();
        riskScore = r.score;
        if (riskScore >= RISK_THRESHOLD_HIGH) {
            ratio = HIGH_COLLATERAL_RATIO;
        } else {
            ratio = BASE_COLLATERAL_RATIO;
        }
    }

    /// @notice Attempts to borrow: posts `collateral` (FXRP, units simplified) to borrow `borrowAmount` (stablecoin).
    ///         The contract reads the AI risk score to decide whether to lend and at what collateral ratio.
    function borrow(uint256 collateral, uint256 borrowAmount) external returns (bool) {
        RiskData memory r = riskOracle.getLatest();

        // Risk is extreme -> reject outright (something rule-based liquidation cannot do: the AI warns in advance)
        if (r.score >= RISK_THRESHOLD_REJECT) {
            emit BorrowRejected(msg.sender, r.score, r.reason);
            revert("AI risk too high: borrowing suspended");
        }

        uint256 ratio = r.score >= RISK_THRESHOLD_HIGH ? HIGH_COLLATERAL_RATIO : BASE_COLLATERAL_RATIO;

        // Check the collateral is sufficient: collateral * 100 >= borrowAmount * ratio
        require(collateral * 100 >= borrowAmount * ratio, "Insufficient collateral for current risk level");

        emit Borrowed(msg.sender, collateral, borrowAmount, r.score, ratio);
        return true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

/// @title MiniLending - 演示用迷你借贷协议
/// @notice 消费 RiskOracle 的 AI 风险信号：风险越高，要求的抵押率越高，
///         风险极高时直接拒绝放贷。演示 "AI 风控预言机被 DeFi 协议消费"。
contract MiniLending {
    IRiskOracle public riskOracle;

    // 抵押率档位（百分比，150 = 需要 150% 抵押）
    uint256 public constant BASE_COLLATERAL_RATIO = 150; // 低风险
    uint256 public constant HIGH_COLLATERAL_RATIO = 250; // 高风险
    uint256 public constant RISK_THRESHOLD_HIGH = 50;    // 风险分 >= 50 视为高风险
    uint256 public constant RISK_THRESHOLD_REJECT = 80;  // 风险分 >= 80 拒绝放贷

    event Borrowed(address indexed user, uint256 collateral, uint256 borrowed, uint256 riskScore, uint256 ratioUsed);
    event BorrowRejected(address indexed user, uint256 riskScore, string reason);

    constructor(address _riskOracle) {
        riskOracle = IRiskOracle(_riskOracle);
    }

    /// @notice 根据当前 AI 风险分，返回当前应采用的抵押率
    function currentCollateralRatio() public view returns (uint256 ratio, uint256 riskScore) {
        RiskData memory r = riskOracle.getLatest();
        riskScore = r.score;
        if (riskScore >= RISK_THRESHOLD_HIGH) {
            ratio = HIGH_COLLATERAL_RATIO;
        } else {
            ratio = BASE_COLLATERAL_RATIO;
        }
    }

    /// @notice 尝试借款：抵押 collateral（FXRP，单位简化），想借 borrowAmount（稳定币）
    ///         合约读 AI 风险分决定是否放贷、以什么抵押率放贷
    function borrow(uint256 collateral, uint256 borrowAmount) external returns (bool) {
        RiskData memory r = riskOracle.getLatest();

        // 风险极高 → 直接拒绝（这是规则清算做不到的：AI 提前预警）
        if (r.score >= RISK_THRESHOLD_REJECT) {
            emit BorrowRejected(msg.sender, r.score, r.reason);
            revert("AI risk too high: borrowing suspended");
        }

        uint256 ratio = r.score >= RISK_THRESHOLD_HIGH ? HIGH_COLLATERAL_RATIO : BASE_COLLATERAL_RATIO;

        // 抵押是否足够：collateral * 100 >= borrowAmount * ratio
        require(collateral * 100 >= borrowAmount * ratio, "Insufficient collateral for current risk level");

        emit Borrowed(msg.sender, collateral, borrowAmount, r.score, ratio);
        return true;
    }
}

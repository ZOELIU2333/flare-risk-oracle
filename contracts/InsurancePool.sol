// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IRiskOracle, RiskData } from "./IRiskOracle.sol";

/// @title InsurancePool - 第三方协议示例：AI 风控驱动的保险池
/// @notice 与 MiniLending 完全不同的协议类型，但同样一行接入 IRiskOracle。
///         证明 AI 风控预言机是可被任意协议复用的公共基础设施。
///         逻辑：风险越高，承保保费越贵；风险极高时停止承保。
contract InsurancePool {
    IRiskOracle public riskOracle;

    uint256 public constant BASE_PREMIUM_BPS = 100;   // 基础保费 1%（低风险）
    uint256 public constant MAX_PREMIUM_BPS = 1000;   // 最高保费 10%（高风险）
    uint256 public constant RISK_STOP_UNDERWRITING = 90; // 风险>=90 停止承保

    event PolicyQuoted(address indexed user, uint256 coverage, uint256 premium, uint256 riskScore);
    event UnderwritingSuspended(address indexed user, uint256 riskScore, string reason);

    constructor(address _riskOracle) {
        riskOracle = IRiskOracle(_riskOracle);
    }

    /// @notice 根据当前 AI 风险分给出保费报价（覆盖额 coverage 的保费）
    function quotePremium(uint256 coverage) public view returns (uint256 premium, uint256 riskScore) {
        RiskData memory r = riskOracle.getLatest();
        riskScore = r.score;
        // 保费费率随风险线性上升：BASE + (MAX-BASE)*score/100
        uint256 rateBps = BASE_PREMIUM_BPS + ((MAX_PREMIUM_BPS - BASE_PREMIUM_BPS) * riskScore) / 100;
        premium = (coverage * rateBps) / 10000;
    }

    /// @notice 尝试投保：AI 风险极高时拒保
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

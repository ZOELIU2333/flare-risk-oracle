// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title IRiskOracle - AI 风控预言机开放标准接口
/// @notice 任何 Flare DeFi 协议只需 import 此接口，即可一行接入 AI 风险信号。
///         这是把风控从"单体应用"升级为"生态公共基础设施"的标准门面。
struct RiskData {
    uint256 score;      // 0-100，AI 综合风险评分
    string reason;      // AI 给出的风险理由
    uint256 timestamp;  // 更新时间
}

interface IRiskOracle {
    /// @notice 读取最新 AI 风险评分
    function getLatest() external view returns (RiskData memory);
}

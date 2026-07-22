// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { TestFtsoV2Interface } from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";

/// @title FtsoPriceReader - 用 Flare 原生 FTSO 预言机读 XRP/USD 价格
/// @notice M5 FTSO 深度集成：价格数据源用 Flare 原生预言机，而非外部 API。
///         真实价格 = value / 10^decimals
contract FtsoPriceReader {
    // XRP/USD 的 FTSOv2 feed ID（21字节）
    bytes21 public constant XRP_USD_ID = 0x015852502f55534400000000000000000000000000;

    function getXrpUsd() external view returns (uint256 value, int8 decimals, uint64 timestamp) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedById(XRP_USD_ID);
    }
}

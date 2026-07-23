// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import { TestFtsoV2Interface } from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import { ContractRegistry } from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";

/// @title FtsoPriceReader - Reads the XRP/USD price via Flare's native FTSO oracle
/// @notice M5 deep FTSO integration: the price data source is Flare's native oracle
///         rather than an external API. Actual price = value / 10^decimals
contract FtsoPriceReader {
    // FTSOv2 feed ID for XRP/USD (21 bytes)
    bytes21 public constant XRP_USD_ID = 0x015852502f55534400000000000000000000000000;

    function getXrpUsd() external view returns (uint256 value, int8 decimals, uint64 timestamp) {
        TestFtsoV2Interface ftsoV2 = ContractRegistry.getTestFtsoV2();
        return ftsoV2.getFeedById(XRP_USD_ID);
    }
}

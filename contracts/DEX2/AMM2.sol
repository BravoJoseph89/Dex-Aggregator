// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../BaseAMM.sol";
import "./Zoe.sol";
import "./Maggie.sol";

contract AMM2 is BaseAMM {
    constructor(Zoe _zoe, Maggie _maggie) 
        BaseAMM(IERC20(address(_zoe)), IERC20(address(_maggie)), 5, 1000) 
    {}
}

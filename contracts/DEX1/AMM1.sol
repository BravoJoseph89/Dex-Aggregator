// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../BaseAMM.sol";
import "./Sefi.sol";
import "./Chloe.sol";

contract AMM1 is BaseAMM {
    constructor(Sefi _sefi, Chloe _chloe) 
        BaseAMM(IERC20(address(_sefi)), IERC20(address(_chloe)), 3, 1000) 
    {}
}

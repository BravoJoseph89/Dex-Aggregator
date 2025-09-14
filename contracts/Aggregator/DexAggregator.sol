// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../DEX1/AMM1.sol";
import "../DEX2/AMM2.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract DexAggregator {
    AMM1 public immutable dex1;
    AMM2 public immutable dex2;
    
    // Events
    event BestTrade(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address bestDex
    );

    constructor(AMM1 _dex1, AMM2 _dex2) {
        dex1 = _dex1;
        dex2 = _dex2;
    }

    // Get the best price between the two DEXes
    function getBestPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut, address bestDex) {
        // Get price from DEX1
        uint256 dex1Out = getDex1Price(tokenIn, tokenOut, amountIn);
        
        // Get price from DEX2
        uint256 dex2Out = getDex2Price(tokenIn, tokenOut, amountIn);
        
        // Compare and return the best price
        if (dex1Out > dex2Out) {
            return (dex1Out, address(dex1));
        } else {
            return (dex2Out, address(dex2));
        }
    }
    
    // Execute a trade using the best available price
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        // Get the best price
        (uint256 bestAmountOut, address bestDex) = getBestPrice(tokenIn, tokenOut, amountIn);
        
        require(bestAmountOut >= minAmountOut, "Insufficient output amount");
        
        // Transfer tokens from sender to this contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Approve the DEX to spend the tokens
        IERC20(tokenIn).approve(bestDex, amountIn);
        
        // Execute the swap on the best DEX
        if (bestDex == address(dex1)) {
            dex1.swap(amountIn, bestAmountOut, tokenIn, recipient);
        } else {
            dex2.swap(amountIn, bestAmountOut, tokenIn, recipient);
        }
        
        emit BestTrade(tokenIn, tokenOut, amountIn, bestAmountOut, bestDex);
        return bestAmountOut;
    }
    
    // Helper functions to get prices from each DEX
    function getDex1Price(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        try dex1.getAmountOut(amountIn, tokenIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }
    
    function getDex2Price(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        try dex2.getAmountOut(amountIn, tokenIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
}

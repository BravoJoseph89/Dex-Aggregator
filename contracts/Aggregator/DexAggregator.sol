// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../BaseAMM.sol";
import "../DEX1/AMM1.sol";
import "../DEX2/AMM2.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DexAggregator is ReentrancyGuard {
    BaseAMM public immutable dex1;
    BaseAMM public immutable dex2;
    
    // Events
    event BestTrade(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address bestDex
    );

    constructor(AMM1 _dex1, AMM2 _dex2) {
        require(address(_dex1) != address(0) && address(_dex2) != address(0), "Invalid DEX address");
        require(address(_dex1) != address(_dex2), "Identical DEX addresses");
        dex1 = BaseAMM(address(_dex1));
        dex2 = BaseAMM(address(_dex2));
    }

    // Get the best price between the two DEXes
    function getBestPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut, address bestDex) {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token address");
        require(tokenIn != tokenOut, "Identical token addresses");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Get price from DEX1
        uint256 dex1Out = getDexPrice(dex1, tokenIn, tokenOut, amountIn);
        
        // Get price from DEX2
        uint256 dex2Out = getDexPrice(dex2, tokenIn, tokenOut, amountIn);
        
        // Compare and return the best price
        if (dex1Out >= dex2Out) {
            return (dex1Out, address(dex1));
        } else {
            return (dex2Out, address(dex2));
        }
    }
    
    // Get price from a specific DEX
    function getDexPrice(
        BaseAMM dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        try dex.getAmountOut(amountIn, tokenIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }
    
    // Get price from DEX1
    function getDex1Price(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256) {
        return getDexPrice(dex1, tokenIn, tokenOut, amountIn);
    }
    
    // Get price from DEX2
    function getDex2Price(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256) {
        return getDexPrice(dex2, tokenIn, tokenOut, amountIn);
    }
    
    // Execute a trade using the best available price
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external nonReentrant returns (uint256 amountOut) {
        require(recipient != address(0), "Invalid recipient address");
        require(amountIn > 0, "Amount must be greater than 0");
        
        // Get the best price
        (uint256 bestAmountOut, address bestDex) = getBestPrice(tokenIn, tokenOut, amountIn);
        require(bestAmountOut > 0, "No valid price available");
        require(bestAmountOut >= minAmountOut, "Insufficient output amount");
        
        // Transfer tokens from sender to this contract
        bool transferSuccess = IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        require(transferSuccess, "Token transfer failed");
        
        // Approve the DEX to spend the tokens
        IERC20(tokenIn).approve(bestDex, 0); // Reset allowance to 0 first
        IERC20(tokenIn).approve(bestDex, amountIn);
        
        // Get balance before swap for verification
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(recipient);
        
        // Execute the swap on the best DEX
        BaseAMM(bestDex).swap(amountIn, minAmountOut, tokenIn, recipient);
        
        // Verify the output amount
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(recipient);
        amountOut = balanceAfter - balanceBefore;
        require(amountOut >= minAmountOut, "Insufficient output amount after swap");
        
        emit BestTrade(tokenIn, tokenOut, amountIn, amountOut, bestDex);
        return amountOut;
    }
    
    
    // Allow the contract to receive ETH
    receive() external payable {}
}

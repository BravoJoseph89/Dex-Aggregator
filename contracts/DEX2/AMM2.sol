// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Zoe.sol";
import "./Maggie.sol";

contract AMM2 {
    Zoe public token1;
    Maggie public token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 constant PRECISION = 10**18;
    
    // 0.5% fee (5/1000 = 0.5%)
    uint256 public constant FEE = 5;
    uint256 public constant FEE_BASE = 1000;

    event AddLiquidity(
        address indexed provider,
        uint256 amount1,
        uint256 amount2,
        uint256 shares
    );
    
    event RemoveLiquidity(
        address indexed provider,
        uint256 amount1,
        uint256 amount2,
        uint256 shares
    );
    
    event Swap(
        address indexed from,
        address tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(Zoe _token1, Maggie _token2) {
        token1 = _token1;
        token2 = _token2;
    }

    function addLiquidity(uint256 _amount1, uint256 _amount2) external {
        require(_amount1 > 0 && _amount2 > 0, "Amounts must be greater than 0");

        // Transfer tokens from sender to contract
        token1.transferFrom(msg.sender, address(this), _amount1);
        token2.transferFrom(msg.sender, address(this), _amount2);

        uint256 share;
        if (totalShares == 0) {
            share = sqrt(_amount1 * _amount2);
        } else {
            share = min(
                (_amount1 * totalShares) / token1Balance,
                (_amount2 * totalShares) / token2Balance
            );
        }

        require(share > 0, "Insufficient liquidity added");

        token1Balance += _amount1;
        token2Balance += _amount2;
        K = token1Balance * token2Balance;

        totalShares += share;
        shares[msg.sender] += share;

        emit AddLiquidity(msg.sender, _amount1, _amount2, share);
    }

    function removeLiquidity(uint256 _share) external {
        require(_share > 0, "Share must be greater than 0");
        require(shares[msg.sender] >= _share, "Insufficient shares");

        uint256 amount1 = (_share * token1Balance) / totalShares;
        uint256 amount2 = (_share * token2Balance) / totalShares;

        token1Balance -= amount1;
        token2Balance -= amount2;
        K = token1Balance * token2Balance;

        totalShares -= _share;
        shares[msg.sender] -= _share;

        token1.transfer(msg.sender, amount1);
        token2.transfer(msg.sender, amount2);

        emit RemoveLiquidity(msg.sender, amount1, amount2, _share);
    }

    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256) {
        require(amountIn > 0, "Amount must be greater than 0");
        
        uint256 reserveIn;
        uint256 reserveOut;
        
        if (tokenIn == address(token1)) {
            reserveIn = token1Balance;
            reserveOut = token2Balance;
        } else if (tokenIn == address(token2)) {
            reserveIn = token2Balance;
            reserveOut = token1Balance;
        } else {
            revert("Invalid token");
        }
        
        uint256 amountInWithFee = amountIn * (FEE_BASE - FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_BASE) + amountInWithFee;
        return numerator / denominator;
    }

    function swap(
        uint256 amountIn,
        uint256 minAmountOut,
        address tokenIn,
        address to
    ) external {
        require(amountIn > 0, "Amount must be greater than 0");
        
        uint256 reserveIn;
        uint256 reserveOut;
        bool isToken1 = tokenIn == address(token1);
        
        if (isToken1) {
            reserveIn = token1Balance;
            reserveOut = token2Balance;
            token1.transferFrom(msg.sender, address(this), amountIn);
        } else if (tokenIn == address(token2)) {
            reserveIn = token2Balance;
            reserveOut = token1Balance;
            token2.transferFrom(msg.sender, address(this), amountIn);
        } else {
            revert("Invalid token");
        }
        
        uint256 amountInWithFee = amountIn * (FEE_BASE - FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_BASE) + amountInWithFee;
        uint256 amountOut = numerator / denominator;
        
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        if (isToken1) {
            token2.transfer(to, amountOut);
            token1Balance += amountIn;
            token2Balance -= amountOut;
        } else {
            token1.transfer(to, amountOut);
            token2Balance += amountIn;
            token1Balance -= amountOut;
        }
        
        K = token1Balance * token2Balance;
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }
    
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}

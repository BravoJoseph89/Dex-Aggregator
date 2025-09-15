// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

abstract contract BaseAMM is ReentrancyGuard {
    IERC20 public token1;
    IERC20 public token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    
    uint256 public constant PRECISION = 10**18;
    uint256 public immutable FEE;
    uint256 public immutable FEE_BASE;

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

    constructor(IERC20 _token1, IERC20 _token2, uint256 _fee, uint256 _feeBase) {
        require(address(_token1) != address(0) && address(_token2) != address(0), "Invalid token address");
        require(address(_token1) != address(_token2), "Identical token addresses");
        require(_feeBase > 0, "Fee base must be greater than 0");
        
        token1 = _token1;
        token2 = _token2;
        FEE = _fee;
        FEE_BASE = _feeBase;
    }

    function addLiquidity(uint256 _amount1, uint256 _amount2) external virtual {
        require(_amount1 > 0 && _amount2 > 0, "Amounts must be greater than 0");

        // Transfer tokens from sender to contract
        bool success1 = token1.transferFrom(msg.sender, address(this), _amount1);
        bool success2 = token2.transferFrom(msg.sender, address(this), _amount2);
        require(success1 && success2, "Token transfer failed");

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

    function removeLiquidity(uint256 _share) external virtual nonReentrant {
        require(_share > 0, "Share must be greater than 0");
        require(shares[msg.sender] >= _share, "Insufficient shares");

        uint256 amount1 = (_share * token1Balance) / totalShares;
        uint256 amount2 = (_share * token2Balance) / totalShares;

        token1Balance -= amount1;
        token2Balance -= amount2;
        K = token1Balance * token2Balance;

        totalShares -= _share;
        shares[msg.sender] -= _share;

        bool success1 = token1.transfer(msg.sender, amount1);
        bool success2 = token2.transfer(msg.sender, amount2);
        require(success1 && success2, "Token transfer failed");

        emit RemoveLiquidity(msg.sender, amount1, amount2, _share);
    }

    function getAmountOut(uint256 amountIn, address tokenIn) public view returns (uint256) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == address(token1) || tokenIn == address(token2), "Invalid token address");
        
        uint256 reserveIn = tokenIn == address(token1) ? token1Balance : token2Balance;
        uint256 reserveOut = tokenIn == address(token1) ? token2Balance : token1Balance;
        
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
    ) external virtual nonReentrant returns (uint256) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(to != address(0), "Invalid recipient address");
        require(tokenIn == address(token1) || tokenIn == address(token2), "Invalid token address");
        
        IERC20 tokenInContract = IERC20(tokenIn);
        IERC20 tokenOut = tokenIn == address(token1) ? token2 : token1;
        
        // Transfer tokens from sender to contract
        bool success = tokenInContract.transferFrom(msg.sender, address(this), amountIn);
        require(success, "Token transfer failed");
        
        uint256 amountOut = getAmountOut(amountIn, tokenIn);
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        // Update balances
        if (tokenIn == address(token1)) {
            token1Balance += amountIn;
            token2Balance -= amountOut;
        } else {
            token2Balance += amountIn;
            token1Balance -= amountOut;
        }
        
        // Transfer tokens to recipient
        success = tokenOut.transfer(to, amountOut);
        require(success, "Token transfer failed");
        
        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
        return amountOut;
    }

    // Helper functions
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

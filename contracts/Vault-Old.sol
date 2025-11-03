// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IBTC1USD.sol";
import "./interfaces/IPriceOracle.sol";
import "./libraries/SafeMath.sol";
import "./libraries/FixedPoint8.sol";

contract VaultOld {
    using SafeMath for uint256;
    using FixedPoint8 for uint256;

    // Constants
    uint256 public constant MIN_COLLATERAL_RATIO = 1.10e8; // 110% with 8 decimals
    uint256 public constant STRESS_REDEMPTION_FACTOR = 0.90e8; // 90% with 8 decimals
    uint256 public constant DEV_FEE_MINT = 0.01e8; // 1% with 8 decimals
    uint256 public constant DEV_FEE_REDEEM = 0.001e8; // 0.1% with 8 decimals
    uint256 public constant ENDOWMENT_FEE_MINT = 0.001e8; // 0.1% with 8 decimals
    
    // Additional protocol limits
    // uint256 public constant MIN_MINT_AMOUNT = 0.001e8; // Minimum 0.001 BTC worth - REMOVED
    // uint256 public constant MIN_REDEEM_AMOUNT = 0.001e8; // Minimum 0.001 BTC1USD - REMOVED
    // uint256 public constant MAX_SINGLE_MINT_RATIO = 0.1e8; // Max 10% of total supply per mint - REMOVED
    // uint256 public constant MAX_SINGLE_REDEEM_RATIO = 0.1e8; // Max 10% of total supply per redeem - REMOVED

    // Core contracts
    IBTC1USD public btc1usd;
    IPriceOracle public priceOracle;
    
    // Supported collateral tokens (WBTC, cbBTC, tBTC)
    mapping(address => bool) public supportedCollateral;
    mapping(address => uint256) public collateralBalances;
    address[] public collateralTokens;
    
    // Addresses
    address public admin;
    address public devWallet;
    address public endowmentWallet;
    
    // State
    bool public paused;
    uint256 public totalCollateralValue; // USD value with 8 decimals
    
    // Events
    event Mint(address indexed user, uint256 btcAmount, uint256 tokensIssued, address collateralToken);
    event Redeem(address indexed user, uint256 tokensRedeemed, uint256 btcAmount, address collateralToken);
    event CollateralAdded(address indexed token);
    event CollateralRemoved(address indexed token);
    event EmergencyPause();
    event EmergencyUnpause();
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Vault: caller is not admin");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Vault: contract is paused");
        _;
    }
    
    modifier validCollateral(address token) {
        require(supportedCollateral[token], "Vault: unsupported collateral");
        _;
    }

    constructor(
        address _btc1usd,
        address _priceOracle,
        address _admin,
        address _devWallet,
        address _endowmentWallet
    ) {
        btc1usd = IBTC1USD(_btc1usd);
        priceOracle = IPriceOracle(_priceOracle);
        admin = _admin;
        devWallet = _devWallet;
        endowmentWallet = _endowmentWallet;
    }

    function addCollateral(address token) external onlyAdmin {
        require(!supportedCollateral[token], "Vault: collateral already supported");
        supportedCollateral[token] = true;
        collateralTokens.push(token);
        emit CollateralAdded(token);
    }

    function removeCollateral(address token) external onlyAdmin {
        require(supportedCollateral[token], "Vault: collateral not supported");
        require(collateralBalances[token] == 0, "Vault: collateral has balance");
        
        supportedCollateral[token] = false;
        
        // Remove from array
        for (uint i = 0; i < collateralTokens.length; i++) {
            if (collateralTokens[i] == token) {
                collateralTokens[i] = collateralTokens[collateralTokens.length - 1];
                collateralTokens.pop();
                break;
            }
        }
        
        emit CollateralRemoved(token);
    }

    function mint(address collateralToken, uint256 btcAmount) external whenNotPaused validCollateral(collateralToken) {
        require(btcAmount > 0, "Vault: amount must be positive");
        
        // Transfer collateral from user
        IERC20(collateralToken).transferFrom(msg.sender, address(this), btcAmount);
        
        // Update collateral balance
        collateralBalances[collateralToken] = collateralBalances[collateralToken].add(btcAmount);
        
        // Calculate USD value of deposited BTC
        uint256 btcPrice = priceOracle.getBTCPrice();
        uint256 usdValue = btcAmount.multiply(btcPrice);
        totalCollateralValue = totalCollateralValue.add(usdValue);
        
        // Calculate current collateral ratio and supply
        uint256 currentSupply = btc1usd.totalSupply();
        
        // Protocol Rule 3: Mint price calculation = max(1.10, current_ratio) USD of BTC
        uint256 mintPrice;
        if (currentSupply == 0) {
            // For first mint, use minimum collateral ratio (1.1)
            mintPrice = MIN_COLLATERAL_RATIO;
        } else {
            // For subsequent mints, calculate actual current collateral ratio
            uint256 currentRatio = totalCollateralValue.multiply(1e8).divide(currentSupply);
            // Use max(MIN_COLLATERAL_RATIO, current_ratio) for mint price
            mintPrice = currentRatio > MIN_COLLATERAL_RATIO ? currentRatio : MIN_COLLATERAL_RATIO;
        }
        
        // Calculate tokens to mint (before fees)
        uint256 tokensToMint = usdValue.divide(mintPrice);
        
        // Protocol Rule 4: Calculate and validate fees
        uint256 devFeeTokens = tokensToMint.multiply(DEV_FEE_MINT).divide(1e8);
        uint256 endowmentFeeTokens = tokensToMint.multiply(ENDOWMENT_FEE_MINT).divide(1e8);
        
        // Protocol Rule 5: Validate total mint amount doesn't break protocol
        uint256 totalToMint = tokensToMint.add(devFeeTokens).add(endowmentFeeTokens);
        uint256 newTotalSupply = currentSupply.add(totalToMint);
        
        // For first mint (currentSupply == 0), skip collateral ratio validation
        // as we're establishing the initial ratio of 1.1
        if (currentSupply > 0) {
            uint256 newCollateralRatio = totalCollateralValue.multiply(1e8).divide(newTotalSupply);
            require(newCollateralRatio >= MIN_COLLATERAL_RATIO, "Vault: mint would break minimum collateral ratio");
        }
        
        // Mint tokens
        btc1usd.mint(msg.sender, tokensToMint);
        btc1usd.mint(devWallet, devFeeTokens);
        btc1usd.mint(endowmentWallet, endowmentFeeTokens);
        
        emit Mint(msg.sender, btcAmount, tokensToMint, collateralToken);
    }

    function redeem(uint256 tokenAmount, address collateralToken) external whenNotPaused validCollateral(collateralToken) {
        require(tokenAmount > 0, "Vault: amount must be positive");
        require(btc1usd.balanceOf(msg.sender) >= tokenAmount, "Vault: insufficient balance");
        
        uint256 currentSupply = btc1usd.totalSupply();
        uint256 currentRatio = getCurrentCollateralRatio();
        uint256 btcPrice = priceOracle.getBTCPrice();
        uint256 btcAmount;
        
        // Protocol Rule 3: Different redemption modes based on collateral ratio
        if (currentRatio >= MIN_COLLATERAL_RATIO) {
            // Healthy mode: 1 BTC1USD → $1 of BTC (minus 0.1% dev fee)
            // btcAmount = tokenAmount / btcPrice (with proper scaling)
            btcAmount = tokenAmount.multiply(1e8).divide(btcPrice);
        } else {
            // Stress mode: 1 BTC1USD → 0.90 × R USD of BTC (minus 0.1% fee)
            // Fixed calculation: properly apply stress factor
            uint256 stressValue = currentRatio.multiply(STRESS_REDEMPTION_FACTOR).divide(1e8);
            btcAmount = tokenAmount.multiply(stressValue).divide(btcPrice);
        }
        
        // Protocol Rule 4: Apply dev fee (0.1%)
        uint256 devFee = btcAmount.multiply(DEV_FEE_REDEEM).divide(1e8);
        btcAmount = btcAmount.sub(devFee);
        
        // Protocol Rule 5: Ensure sufficient collateral exists
        require(collateralBalances[collateralToken] >= btcAmount.add(devFee), "Vault: insufficient collateral");
        
        // Protocol Rule 6: Validate redemption doesn't break minimum collateral ratio
        uint256 usdValueRedeemed = btcAmount.add(devFee).multiply(btcPrice).divide(1e8);
        uint256 newTotalSupply = currentSupply.sub(tokenAmount);
        uint256 newCollateralValue = totalCollateralValue.sub(usdValueRedeemed);
        
        // CRITICAL FIX: Only enforce minimum ratio protection in healthy mode
        // In stress mode, allow redemptions even if they further reduce the ratio
        if (newTotalSupply > 0 && currentRatio >= MIN_COLLATERAL_RATIO) {
            uint256 newRatio = newCollateralValue.multiply(1e8).divide(newTotalSupply);
            require(newRatio >= MIN_COLLATERAL_RATIO, "Vault: redemption would break minimum collateral ratio");
        }
        
        // Remove the 105% buffer restriction - this was too restrictive
        // The protocol should allow redemptions as long as minimum ratio is maintained
        
        // Burn tokens
        btc1usd.burn(msg.sender, tokenAmount);
        
        // Update balances
        collateralBalances[collateralToken] = collateralBalances[collateralToken].sub(btcAmount.add(devFee));
        totalCollateralValue = totalCollateralValue.sub(usdValueRedeemed);
        
        // Transfer BTC to user and dev fee
        IERC20(collateralToken).transfer(msg.sender, btcAmount);
        IERC20(collateralToken).transfer(devWallet, devFee);
        
        emit Redeem(msg.sender, tokenAmount, btcAmount, collateralToken);
    }

    function getCurrentCollateralRatio() public view returns (uint256) {
        uint256 totalSupply = btc1usd.totalSupply();
        if (totalSupply == 0) return MIN_COLLATERAL_RATIO; // Return minimum ratio instead of max uint256
        
        // Return ratio with 8 decimal precision: (totalCollateralValue * 1e8) / totalSupply
        return totalCollateralValue.multiply(1e8).divide(totalSupply);
    }

    function getCollateralBalance(address collateralToken) external view returns (uint256) {
        return collateralBalances[collateralToken];
    }

    function getCollateralValue() external view returns (uint256) {
        return totalCollateralValue;
    }

    function isHealthy() external view returns (bool) {
        return getCurrentCollateralRatio() >= MIN_COLLATERAL_RATIO;
    }

    function getSupportedCollateral() external view returns (address[] memory) {
        return collateralTokens;
    }

    function emergencyPause() external onlyAdmin {
        paused = true;
        emit EmergencyPause();
    }

    function emergencyUnpause() external onlyAdmin {
        paused = false;
        emit EmergencyUnpause();
    }

    function setDevWallet(address _devWallet) external onlyAdmin {
        devWallet = _devWallet;
    }

    function setEndowmentWallet(address _endowmentWallet) external onlyAdmin {
        endowmentWallet = _endowmentWallet;
    }
}
"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { DistributionManagement } from "@/components/distribution-management";
import { GovernancePanel } from "@/components/governance-panel";
import { UnifiedGovernanceDashboard } from "@/components/unified-governance-dashboard";
import { EndowmentManager } from "@/components/endowment-manager";
import { SecurityMonitoring } from "@/components/security-monitoring";
import { TreasuryDashboard } from "@/components/treasury-dashboard";
import DistributionAdmin from "@/components/distribution-admin";
import FixedMerkleClaim from "@/components/fixed-merkle-claim";
import EnhancedMerkleClaim from "@/components/enhanced-merkle-claim";

import { ThemeToggle } from "@/components/theme-toggle";
import { useWeb3 } from "@/lib/web3-provider";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  AlertCircle,
  DollarSign,
  Bitcoin,
  Heart,
  Search,
  Home,
  Plus,
  Users,
  BarChart3,
  Shield,
  Calendar,
  Menu,
  Bell,
  User,
  Gift,
  Activity,
  Coins,
} from "lucide-react";
import { ProtocolState } from "@/lib/protocol-math";
import {
  ProtocolMath,
  formatPercentage,
  formatTokens,
} from "@/lib/protocol-math";
import { CONTRACT_ADDRESSES, COLLATERAL_TOKENS } from "@/lib/contracts";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  Vote,
} from "lucide-react";

const formatCurrency = (amount: number, decimals = 2): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

const formatBTC = (amount: number, decimals = 8): string => {
  return `${amount.toFixed(decimals)} BTC`;
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

// Format BTC1USD balance with exactly 2 decimal places and thousands separators
const formatBTC1USD = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function Dashboard() {
  const { isConnected, address, chainId, connectWallet, disconnectWallet } =
    useWeb3();

  // Function to get network name from chainId
  const getNetworkName = (chainId: number | undefined) => {
    if (!chainId) return "Unknown Network";
    
    switch (chainId) {
      case 84532:
        return "Base Sepolia";
      case 8453:
        return "Base";
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 1337:
        return "Localhost";
      default:
        return `Network (${chainId})`;
    }
  };


  const { activities } = useRecentActivity();
  const [account, setAccount] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  const [mintAmount, setMintAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [selectedCollateral, setSelectedCollateral] = useState("WBTC");
  const [selectedRedeemCollateral, setSelectedRedeemCollateral] =
    useState("WBTC");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userWbtcBalance, setUserWbtcBalance] = useState("0");
  const [userCbbtcBalance, setUserCbbtcBalance] = useState("0");
  const [userTbtcBalance, setUserTbtcBalance] = useState("0");
  const [wbtcMintAmount, setWbtcMintAmount] = useState("");
  const [vaultDepositAmount, setVaultDepositAmount] = useState("");
  const [selectedMintCollateral, setSelectedMintCollateral] = useState("WBTC");

  const handleExecuteDistribution = async () => {
    if (!isConnected || !address) {
      setTransactionStatus("Please connect your wallet first");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    console.log("=== DISTRIBUTION EXECUTION DEBUG ===");
    console.log("Can execute distribution:", canExecuteDistribution);
    console.log(
      "Distribution contract:",
      protocolState?.contractAddresses?.weeklyDistribution
    );
    console.log("Current collateral ratio:", collateralRatio);
    console.log(
      "Current reward per token:",
      currentRewardPerToken ? formatUnits(currentRewardPerToken, 18) : "0"
    );
    console.log("=== END DEBUG ===");

    if (!canExecuteDistribution) {
      setTransactionStatus(
        "Distribution cannot be executed at this time. Check: Friday 14:00 UTC, ratio ≥ 112%, 7 days since last distribution"
      );
      setTimeout(() => setTransactionStatus(""), 8000);
      return;
    }

    try {
      setPendingTransactionType("mint");
      setTransactionStatus("Executing weekly distribution...");

      writeContract({
        address: protocolState?.contractAddresses?.weeklyDistribution as any,
        abi: [
          {
            inputs: [],
            name: "executeDistribution",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "executeDistribution",
        args: [],
      });

      console.log("Distribution execution initiated");
    } catch (error) {
      console.error("Error executing distribution:", error);
      setTransactionStatus("Failed to execute distribution");
      setPendingTransactionType(null);
      setTimeout(() => setTransactionStatus(""), 3000);
    }
  };

  // Helper function to format distribution time
  const calculateMintDetails = (btcAmount: number) => {
    const usdValue = btcAmount * protocolState.btcPrice;
    
    // Use the current collateral ratio for mint price calculation, but ensure it's at least 1.1
    // This matches the Vault contract behavior: mintPrice = max(MIN_COLLATERAL_RATIO, totalUSD / totalSupply)
    const mintPrice = Math.max(1.1, collateralRatio || 1.1);

    const tokensToMint = usdValue / mintPrice;
    const devFee = tokensToMint * 0.01; // 1%
    const endowmentFee = tokensToMint * 0.001; // 0.1%
    const totalMinted = tokensToMint + devFee + endowmentFee;

    // Calculate new collateral ratio considering the new deposit
    // This simulates the real Vault contract behavior for display purposes
    const currentCollateralValue = totalCollateralUSD || 0;
    const newCollateralValue = currentCollateralValue + usdValue;
    const newTotalSupply = protocolState.totalSupply + totalMinted;
    const newRatio = newTotalSupply > 0 ? newCollateralValue / newTotalSupply : 1.1;

    return {
      usdValue,
      currentRatio: newRatio,
      mintPrice,
      tokensToMint,
      devFee,
      endowmentFee,
      totalMinted,
      userReceives: tokensToMint,
    };
  };

  // Helper function to calculate redeem details
  const calculateRedeemDetails = (tokenAmount: number) => {
    const currentRatio = collateralRatio;
    const isStressMode = currentRatio < 1.1;

    let effectivePrice: number;
    let redemptionMode: string;

    if (isStressMode) {
      effectivePrice = 0.9 * currentRatio;
      redemptionMode = "Stress Mode";
    } else {
      effectivePrice = 1.0;
      redemptionMode = "Healthy Mode";
    }

    const grossBtcValue =
      (tokenAmount * effectivePrice) / protocolState.btcPrice;
    const devFee = grossBtcValue * 0.001; // 0.1%
    const btcToReceive = grossBtcValue - devFee;
    const usdValue = btcToReceive * protocolState.btcPrice;

    // Calculate new collateral ratio after redemption
    const newTotalSupply = protocolState.totalSupply - tokenAmount;
    const usdValueRedeemed = grossBtcValue * protocolState.btcPrice;
    const newCollateralValue = totalCollateralUSD - usdValueRedeemed;
    const newRatio =
      newTotalSupply > 0 ? newCollateralValue / newTotalSupply : 0;

    return {
      currentRatio,
      isStressMode,
      effectivePrice,
      redemptionMode,
      grossBtcValue,
      devFee,
      btcToReceive,
      usdValue,
      newTotalSupply,
      newCollateralValue,
      newRatio,
    };
  };

  const [protocolState, setProtocolState] = useState<ProtocolState>({
    btcPrice: 100000, // $100,000
    totalSupply: 0,
    collateralBalances: {
      wbtc: 0,
      cbbtc: 0,
      tbtc: 0,
    },
    devWallet: 0,
    endowmentWallet: 0,
    contractAddresses: {
      btc1usd:
        process.env.NEXT_PUBLIC_BTC1USD_CONTRACT ||
        CONTRACT_ADDRESSES.BTC1USD,
      vault:
        process.env.NEXT_PUBLIC_VAULT_CONTRACT ||
        CONTRACT_ADDRESSES.VAULT,
      priceOracle:
        process.env.NEXT_PUBLIC_CHAINLINK_BTC_ORACLE_CONTRACT ||
        CONTRACT_ADDRESSES.CHAINLINK_BTC_ORACLE,
      weeklyDistribution:
        process.env.NEXT_PUBLIC_WEEKLY_DISTRIBUTION_CONTRACT ||
        CONTRACT_ADDRESSES.WEEKLY_DISTRIBUTION,
      merkleDistributor:
        process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_CONTRACT ||
        CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR,
      endowmentManager:
        process.env.NEXT_PUBLIC_ENDOWMENT_MANAGER_CONTRACT ||
        CONTRACT_ADDRESSES.ENDOWMENT_MANAGER,
      protocolGovernance:
        process.env.NEXT_PUBLIC_PROTOCOL_GOVERNANCE_CONTRACT ||
        CONTRACT_ADDRESSES.PROTOCOL_GOVERNANCE,
      wbtc:
        process.env.NEXT_PUBLIC_WBTC_TOKEN ||
        COLLATERAL_TOKENS[0].address,
      cbbtc:
        process.env.NEXT_PUBLIC_CBBTC_TOKEN ||
        COLLATERAL_TOKENS[1].address,
      tbtc:
        process.env.NEXT_PUBLIC_TBTC_TOKEN ||
        COLLATERAL_TOKENS[2].address,
    },
  });

  // BTC1USD balance reading
  const { data: btc1usdBalance, refetch: refetchBtc1usdBalance } =
    useReadContract({
      address: protocolState?.contractAddresses?.btc1usd as any,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address",
            },
          ],
          name: "balanceOf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "balanceOf",
      args: address ? [address as any] : undefined,
      query: {
        enabled: !!address && !!protocolState?.contractAddresses?.btc1usd,
      },
    });

  // BTC1USD total supply reading
  const { data: btc1usdTotalSupply, refetch: refetchTotalSupply } =
    useReadContract({
      address: protocolState?.contractAddresses?.btc1usd as any,
      abi: [
        {
          inputs: [],
          name: "totalSupply",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "totalSupply",
      query: {
        enabled: !!protocolState?.contractAddresses?.btc1usd,
      },
    });

  // BTC Price from Oracle (non-reverting display method)
  const { data: btcPrice, refetch: refetchBtcPrice } = useReadContract({
    address: protocolState?.contractAddresses?.priceOracle as any,
    abi: [
      {
        inputs: [],
        name: "getCurrentPrice",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getCurrentPrice",
    query: {
      enabled: !!protocolState?.contractAddresses?.priceOracle,
    },
  });

  // Collateral Ratio from Vault
  const { data: vaultCollateralRatio, refetch: refetchCollateralRatio } =
    useReadContract({
      address: protocolState?.contractAddresses?.vault as any,
      abi: [
        {
          inputs: [],
          name: "getCurrentCollateralRatio",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "getTotalCollateralValue",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getTotalCollateralValue",
      query: {
        enabled: !!protocolState?.contractAddresses?.vault,
      },
    });

        },
      ],
      functionName: "getCurrentCollateralRatio",
      query: {
        enabled: !!protocolState?.contractAddresses?.vault,
      },
    });

  // Total Collateral Value from Vault
  const { data: totalCollateralValue, refetch: refetchCollateralValue } =
    useReadContract({
      address: protocolState?.contractAddresses?.vault as any,
      abi: [
        {
          inputs: [],
          name: "getCollateralValue",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getCollateralValue",
      query: {
        enabled: !!protocolState?.contractAddresses?.vault,
      },
    });

  // Vault Collateral Balance ABI (reused for all collateral types)
  const VAULT_COLLATERAL_BALANCE_ABI = [
    {
      inputs: [
        {
          internalType: "address",
          name: "collateralToken",
          type: "address",
        },
      ],
      name: "getCollateralBalance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  // WBTC Collateral Balance from Vault
  const { data: vaultWbtcBalance, refetch: refetchVaultWbtcBalance } =
    useReadContract({
      address: protocolState?.contractAddresses?.vault as any,
      abi: VAULT_COLLATERAL_BALANCE_ABI,
      functionName: "getCollateralBalance",
      args: protocolState?.contractAddresses?.wbtc
        ? [protocolState.contractAddresses.wbtc as any]
        : undefined,
      query: {
        enabled:
          !!protocolState?.contractAddresses?.vault &&
          !!protocolState?.contractAddresses?.wbtc,
      },
    });

  // cbBTC Collateral Balance from Vault
  const { data: vaultCbbtcBalance, refetch: refetchVaultCbbtcBalance } =
    useReadContract({
      address: protocolState?.contractAddresses?.vault as any,
      abi: VAULT_COLLATERAL_BALANCE_ABI,
      functionName: "getCollateralBalance",
      args: protocolState?.contractAddresses?.cbbtc
        ? [protocolState.contractAddresses.cbbtc as any]
        : undefined,
      query: {
        enabled:
          !!protocolState?.contractAddresses?.vault &&
          !!protocolState?.contractAddresses?.cbbtc,
      },
    });

  // tBTC Collateral Balance from Vault
  const { data: vaultTbtcBalance, refetch: refetchVaultTbtcBalance } =
    useReadContract({
      address: protocolState?.contractAddresses?.vault as any,
      abi: VAULT_COLLATERAL_BALANCE_ABI,
      functionName: "getCollateralBalance",
      args: protocolState?.contractAddresses?.tbtc
        ? [protocolState.contractAddresses.tbtc as any]
        : undefined,
      query: {
        enabled:
          !!protocolState?.contractAddresses?.vault &&
          !!protocolState?.contractAddresses?.tbtc,
      },
    });

  // Dev Wallet BTC1USD Balance - Updated from deployment config
  const { data: devWalletBalance, refetch: refetchDevWalletBalance } =
    useReadContract({
      address: protocolState?.contractAddresses?.btc1usd as any,
      abi: [
        {
          inputs: [
            {
              internalType: "address",
              name: "account",
              type: "address",
            },
          ],
          name: "balanceOf",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "balanceOf",
      args: [CONTRACT_ADDRESSES.DEV_WALLET as `0x${string}`], // Dev wallet address from deployment config
      query: {
        enabled: !!protocolState?.contractAddresses?.btc1usd,
      },
    });

  // Endowment Wallet BTC1USD Balance - Updated from deployment config
  const {
    data: endowmentWalletBalance,
    refetch: refetchEndowmentWalletBalance,
  } = useReadContract({
    address: protocolState?.contractAddresses?.btc1usd as any,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.ENDOWMENT_WALLET as `0x${string}`], // Endowment wallet address from deployment config
    query: {
      enabled: !!protocolState?.contractAddresses?.btc1usd,
    },
  });

  // Merkle Distributor BTC1USD Balance
  const {
    data: merkleDistributorBalance,
    refetch: refetchMerkleDistributorBalance,
  } = useReadContract({
    address: protocolState?.contractAddresses?.btc1usd as any,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR as `0x${string}`], // Merkle distributor address from deployment config
    query: {
      enabled: !!protocolState?.contractAddresses?.btc1usd,
    },
  });

  // Merkle Fee Collector BTC1USD Balance
  const {
    data: merklFeeCollectorBalance,
    refetch: refetchMerklFeeCollectorBalance,
  } = useReadContract({
    address: protocolState?.contractAddresses?.btc1usd as any,
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.MERKLE_FEE_COLLECTOR as `0x${string}`], // Merkle fee collector address from deployment config
    query: {
      enabled: !!protocolState?.contractAddresses?.btc1usd,
    },
  });

  // Weekly Distribution Contract Calls
  const {
    data: canExecuteDistribution,
    refetch: refetchCanExecuteDistribution,
  } = useReadContract({
    address: protocolState?.contractAddresses?.weeklyDistribution as any,
    abi: [
      {
        inputs: [],
        name: "canDistribute",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "canDistribute",
    query: {
      enabled: !!protocolState?.contractAddresses?.weeklyDistribution,
    },
  });

  const { data: nextDistributionTime, refetch: refetchNextDistributionTime } =
    useReadContract({
      address: protocolState?.contractAddresses?.weeklyDistribution as any,
      abi: [
        {
          inputs: [],
          name: "getNextDistributionTime",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getNextDistributionTime",
      query: {
        enabled: !!protocolState?.contractAddresses?.weeklyDistribution,
      },
    });

  const { data: distributionCount, refetch: refetchDistributionCount } =
    useReadContract({
      address: protocolState?.contractAddresses?.weeklyDistribution as any,
      abi: [
        {
          inputs: [],
          name: "distributionCount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "distributionCount",
      query: {
        enabled: !!protocolState?.contractAddresses?.weeklyDistribution,
      },
    });

  const { data: currentRewardPerToken, refetch: refetchCurrentRewardPerToken } =
    useReadContract({
      address: protocolState?.contractAddresses?.weeklyDistribution as any,
      abi: [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "collateralRatio",
              type: "uint256",
            },
          ],
          name: "getRewardPerToken",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "pure",
          type: "function",
        },
      ],
      functionName: "getRewardPerToken",
      args: vaultCollateralRatio ? [vaultCollateralRatio] : undefined,
      query: {
        enabled:
          !!protocolState?.contractAddresses?.weeklyDistribution &&
          !!vaultCollateralRatio,
      },
    });

  // Collateral balance reading
  const ERC20_BALANCE_ABI = [
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const { data: wbtcBalance, refetch: refetchWbtcBalance } = useReadContract({
    address: protocolState?.contractAddresses?.wbtc as any,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address as any] : undefined,
    query: {
      enabled: !!address && !!protocolState?.contractAddresses?.wbtc,
    },
  });

  const { data: cbbtcBalance, refetch: refetchCbbtcBalance } = useReadContract({
    address: protocolState?.contractAddresses?.cbbtc as any,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address as any] : undefined,
    query: {
      enabled: !!address && !!protocolState?.contractAddresses?.cbbtc,
    },
  });

  const { data: tbtcBalance, refetch: refetchTbtcBalance } = useReadContract({
    address: protocolState?.contractAddresses?.tbtc as any,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address as any] : undefined,
    query: {
      enabled: !!address && !!protocolState?.contractAddresses?.tbtc,
    },
  });

  useEffect(() => {
    if (btc1usdBalance !== undefined) {
      // BTC1USD has 8 decimals
      const formattedBalance = parseFloat(formatUnits(btc1usdBalance, 8));
      console.log("BTC1USD balance updated:", formattedBalance);
      setUserBalance(formattedBalance);
    }
  }, [btc1usdBalance]);

  useEffect(() => {
    if (wbtcBalance !== undefined) {
      const formattedBalance = wbtcBalance ? formatUnits(wbtcBalance as bigint, 8) : "0";
      console.log("WBTC balance updated:", formattedBalance);
      setUserWbtcBalance(formattedBalance);
    }
  }, [wbtcBalance]);

  useEffect(() => {
    if (cbbtcBalance !== undefined) {
      const formattedBalance = cbbtcBalance ? formatUnits(cbbtcBalance as bigint, 8) : "0";
      console.log("cbBTC balance updated:", formattedBalance);
      setUserCbbtcBalance(formattedBalance);
    }
  }, [cbbtcBalance]);

  useEffect(() => {
    if (tbtcBalance !== undefined) {
      const formattedBalance = tbtcBalance ? formatUnits(tbtcBalance as bigint, 8) : "0";
      console.log("tBTC balance updated:", formattedBalance);
      setUserTbtcBalance(formattedBalance);
    }
  }, [tbtcBalance]);

  // Update protocol state with real contract data
  useEffect(() => {
    if (btc1usdTotalSupply !== undefined) {
      const totalSupplyFormatted = parseFloat(
        formatUnits(btc1usdTotalSupply, 8)
      );
      console.log("Total supply updated:", totalSupplyFormatted);
      setProtocolState((prev) => ({
        ...prev,
        totalSupply: totalSupplyFormatted,
      }));
    }
  }, [btc1usdTotalSupply]);

  useEffect(() => {
    if (btcPrice !== undefined) {
      const btcPriceFormatted = parseFloat(formatUnits(btcPrice, 8));
      console.log("BTC price updated:", btcPriceFormatted);
      setProtocolState((prev) => ({
        ...prev,
        btcPrice: btcPriceFormatted,
      }));
    }
  }, [btcPrice]);

  useEffect(() => {
    if (wbtcBalance !== undefined) {
      // WBTC has 8 decimals
      const formattedBalance = wbtcBalance ? formatUnits(wbtcBalance as bigint, 8) : "0";
      console.log("WBTC balance updated:", formattedBalance);
      setUserWbtcBalance(formattedBalance);
    }
  }, [wbtcBalance]);

  useEffect(() => {
    if (isConnected && address) {
      setAccount(address);
      // Fetch the actual user balance from the contract
      // setUserBalance(1000) // Remove placeholder value
    } else {
      setAccount("");
      setUserBalance(0);
    }
  }, [isConnected, address]);

  // Fetch balances when address changes
  useEffect(() => {
    if (address) {
      // Add a small delay to ensure contracts are properly initialized
      const timer = setTimeout(() => {
        refetchBtc1usdBalance();
        refetchWbtcBalance();
        refetchCbbtcBalance();
        refetchTbtcBalance();
        refetchTotalSupply();
        refetchBtcPrice();
        refetchCollateralRatio();
        refetchCollateralValue();
        refetchVaultWbtcBalance();
        refetchVaultCbbtcBalance();
        refetchVaultTbtcBalance();
        refetchDevWalletBalance();
        refetchEndowmentWalletBalance();
        refetchMerkleDistributorBalance(); // Add this line
        refetchCanExecuteDistribution();
        refetchNextDistributionTime();
        refetchDistributionCount();
        refetchCurrentRewardPerToken();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    address,
    refetchBtc1usdBalance,
    refetchWbtcBalance,
    refetchCbbtcBalance,
    refetchTbtcBalance,
    refetchTotalSupply,
    refetchBtcPrice,
    refetchCollateralRatio,
    refetchCollateralValue,
    refetchVaultWbtcBalance,
    refetchVaultCbbtcBalance,
    refetchVaultTbtcBalance,
    refetchDevWalletBalance,
    refetchEndowmentWalletBalance,
    refetchMerkleDistributorBalance, // Add this line
  ]);

  // Fetch protocol data on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      refetchTotalSupply();
      refetchBtcPrice();
      refetchCollateralRatio();
      refetchCollateralValue();
      refetchMerkleDistributorBalance(); // Add this line
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    refetchTotalSupply,
    refetchBtcPrice,
    refetchCollateralRatio,
    refetchCollateralValue,
    refetchMerkleDistributorBalance, // Add this line
  ]);

  // Calculate metrics using real contract data when available, fallback to mock data
  // Note: Contract returns collateral ratio with 8 decimal places (FixedPoint8 precision)
  // and total collateral value with 8 decimal places
  const realCollateralRatio = vaultCollateralRatio
    ? parseFloat(formatUnits(vaultCollateralRatio, 8))
    : null;
  
  // Use real vault collateral value from contract instead of calculating it ourselves
  // This ensures we match exactly what the contract uses for collateral ratio calculations
  const totalCollateralUSD = totalCollateralValue
    ? parseFloat(formatUnits(totalCollateralValue, 8))
    : 0;
  const totalCollateralBTC = protocolState.btcPrice > 0 
    ? totalCollateralUSD / protocolState.btcPrice
    : 0;

  // Use real collateral ratio from contract if available, otherwise calculate from real vault data
  // Handle zero supply case properly
  let collateralRatio: number;
  if (realCollateralRatio !== null) {
    collateralRatio = realCollateralRatio;
  } else {
    // Calculate from real vault data with zero supply handling
    if (protocolState.totalSupply === 0) {
      collateralRatio = 0; // Show 0 when no supply exists
    } else {
      // Use real vault collateral value from contract for consistency
      const totalVaultCollateralUSD = totalCollateralValue
        ? parseFloat(formatUnits(totalCollateralValue, 8))
        : 0;
      collateralRatio = protocolState.totalSupply > 0 ? totalVaultCollateralUSD / protocolState.totalSupply : 0;
    }
  }
  // Use real vault balances for health metrics
  const realVaultBalances = {
    wbtc: vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0,
    cbbtc: vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0,
    tbtc: vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0,
  };
  
  // Use real collateral value from contract for consistency with contract calculations
  const realCollateralValue = totalCollateralValue
    ? parseFloat(formatUnits(totalCollateralValue, 8))
    : 0;
  
  const healthMetrics = ProtocolMath.calculateHealthMetrics(protocolState, undefined, realVaultBalances, realCollateralValue);
  const isHealthy = healthMetrics.isHealthy;
  const protocolCanDistribute = healthMetrics.canDistribute;

  // weeklyReward is in DOLLARS (not cents), matching contract's getRewardPerToken() which returns cents with 8 decimals
  // Contract: 0.01e8 = 1 cent = $0.01, so we divide by 100 to get dollar amount
  let weeklyReward = 0;
  if (collateralRatio > 0) {
    if (collateralRatio >= 2.02) weeklyReward = 0.1;  // 10¢ per token
    else if (collateralRatio >= 1.92) weeklyReward = 0.09;  // 9¢ per token
    else if (collateralRatio >= 1.82) weeklyReward = 0.08;  // 8¢ per token
    else if (collateralRatio >= 1.72) weeklyReward = 0.07;  // 7¢ per token
    else if (collateralRatio >= 1.62) weeklyReward = 0.06;  // 6¢ per token
    else if (collateralRatio >= 1.52) weeklyReward = 0.05;  // 5¢ per token
    else if (collateralRatio >= 1.42) weeklyReward = 0.04;  // 4¢ per token
    else if (collateralRatio >= 1.32) weeklyReward = 0.03;  // 3¢ per token
    else if (collateralRatio >= 1.22) weeklyReward = 0.02;  // 2¢ per token
    else if (collateralRatio >= 1.12) weeklyReward = 0.01;  // 1¢ per token
  }

  const protocolStats = {
    totalCollateralValue: totalCollateralUSD,
    weeklyRewards: weeklyReward,
    endowmentBalance: protocolState.endowmentWallet,
    nextDistribution: "2024-01-05T14:00:00Z",
    totalUsers: 3353,
    totalProposals: 25276,
    votesCast: 523806,
    uniqueVoters: 41433,
    tvl: totalCollateralUSD,
    chains: 15,
  };

  const collateralTokens = [
    {
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      balance: vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0,
      address: protocolState?.contractAddresses?.wbtc,
    },
    {
      symbol: "cbBTC",
      name: "Coinbase Wrapped Bitcoin",
      balance: vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0,
      address: protocolState?.contractAddresses?.cbbtc,
    },
    {
      symbol: "tBTC",
      name: "Threshold Bitcoin",
      balance: vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0,
      address: protocolState?.contractAddresses?.tbtc,
    },
  ];

  // Removed mock price volatility effect - using real contract data instead

  const handleConnectWallet = async () => {
    await connectWallet();
  };

  const handleDisconnectWallet = async () => {
    await disconnectWallet();
    setAccount("");
    setUserBalance(0);
  };

  // WBTC contract interaction
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWriteContract,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: waitError,
  } = useWaitForTransactionReceipt({
    hash,
    timeout: 90000, // Increase timeout to 90 seconds
  });

  // Track the type of transaction we're waiting for
  const [pendingTransactionType, setPendingTransactionType] = useState<
    "approve" | "mint" | "redeem" | null
  >(null);

  // Add state for transaction status messages
  const [transactionStatus, setTransactionStatus] = useState("");

  // Add state for transaction timeout
  const [confirmTimeout, setConfirmTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Add state to track if we're waiting for approval
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [pendingMintAmount, setPendingMintAmount] = useState("");
  const [pendingDepositAmount, setPendingDepositAmount] = useState("");
  const [pendingCollateralType, setPendingCollateralType] =
    useState<string>("WBTC");

  // Add state to track minting progress
  const [mintingStep, setMintingStep] = useState<
    "idle" | "approving" | "minting"
  >("idle");

  // Helper function to get user-friendly error message
  const getSimpleErrorMessage = (error: any): string => {
    const errorString = error?.message || error?.toString() || "";

    // User rejected transaction
    if (
      errorString.includes("User rejected") ||
      errorString.includes("user rejected") ||
      errorString.includes("User denied")
    ) {
      return "Transaction cancelled";
    }

    // Insufficient funds
    if (
      errorString.includes("insufficient funds") ||
      errorString.includes("Insufficient")
    ) {
      return "Insufficient funds";
    }

    // Network/connection issues
    if (
      errorString.includes("network") ||
      errorString.includes("Network") ||
      errorString.includes("timeout")
    ) {
      return "Network error - please try again";
    }

    // Contract-specific errors
    if (errorString.includes("Vault:")) {
      return "Transaction failed - check requirements";
    }

    // Default minimal message
    return "Transaction failed";
  };

  // Add effect to handle transaction errors
  useEffect(() => {
    if (writeError) {
      console.error("Transaction error:", writeError);

      const simpleError = getSimpleErrorMessage(writeError);

      setTransactionStatus(simpleError);
      setMintingStep("idle");
      setPendingTransactionType(null);

      // Reset write contract to clear pending states
      resetWriteContract();

      // Clear timeout if it exists
      if (confirmTimeout) {
        clearTimeout(confirmTimeout);
        setConfirmTimeout(null);
      }
      // Clear status after 3 seconds
      const timer = setTimeout(() => setTransactionStatus(""), 3000);
      return () => clearTimeout(timer);
    }

    if (waitError) {
      console.error("Transaction confirmation error:", waitError);

      const simpleError = getSimpleErrorMessage(waitError);

      setTransactionStatus(simpleError);
      setMintingStep("idle");
      setPendingTransactionType(null);

      // Reset write contract to clear pending states
      resetWriteContract();

      // Clear timeout if it exists
      if (confirmTimeout) {
        clearTimeout(confirmTimeout);
        setConfirmTimeout(null);
      }
      // Clear status after 3 seconds
      const timer = setTimeout(() => setTransactionStatus(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [writeError, waitError, confirmTimeout, resetWriteContract]);

  // Effect to handle transaction confirmation and automatically proceed with minting
  useEffect(() => {
    if (isConfirmed) {
      // Clear timeout when transaction is confirmed
      if (confirmTimeout) {
        clearTimeout(confirmTimeout);
        setConfirmTimeout(null);
      }

      console.log("=== TRANSACTION CONFIRMED ===");
      console.log("Transaction hash:", hash);
      console.log("Transaction type:", pendingTransactionType);
      console.log("Pending amounts:", {
        pendingMintAmount,
        pendingDepositAmount,
      });

      // Check what action we were waiting for
      if (
        pendingTransactionType === "approve" &&
        (pendingMintAmount || pendingDepositAmount)
      ) {
        // Approval confirmed, now proceed with minting
        setMintingStep("minting");
        setPendingTransactionType("mint");
        setTransactionStatus("Approval confirmed. Minting BTC1USD tokens...");

        // Determine the amount and contract address based on which action we're doing
        const amount = pendingMintAmount
          ? parseUnits(pendingMintAmount, 8)
          : parseUnits(pendingDepositAmount, 8);

        // Get the collateral contract address based on pending collateral type
        const collateralContractAddress =
          pendingCollateralType === "WBTC"
            ? protocolState?.contractAddresses?.wbtc
            : pendingCollateralType === "cbBTC"
            ? protocolState?.contractAddresses?.cbbtc
            : pendingCollateralType === "tBTC"
            ? protocolState?.contractAddresses?.tbtc
            : protocolState?.contractAddresses?.wbtc; // fallback to WBTC

        const vaultAddress = protocolState?.contractAddresses?.vault;

        console.log("Proceeding to mint with:", {
          amount: amount.toString(),
          collateralType: pendingCollateralType,
          collateralContractAddress,
          vaultAddress,
          vaultLength: vaultAddress?.length,
          collateralLength: collateralContractAddress?.length,
          amountFormatted: pendingMintAmount || pendingDepositAmount,
        });

        if (!collateralContractAddress || !vaultAddress) {
          console.error("Missing contract addresses for minting");
          setTransactionStatus("Error: Missing contract addresses");
          setMintingStep("idle");
          setPendingTransactionType(null);
          return;
        }

        // Validate address lengths (Ethereum addresses should be 42 characters)
        if (
          collateralContractAddress.length !== 42 ||
          vaultAddress.length !== 42
        ) {
          console.error("Invalid contract address lengths for minting:", {
            collateral: {
              address: collateralContractAddress,
              length: collateralContractAddress.length,
            },
            vault: { address: vaultAddress, length: vaultAddress.length },
          });
          setTransactionStatus(
            "Error: Invalid contract addresses detected during minting."
          );
          setMintingStep("idle");
          setPendingTransactionType(null);
          return;
        }

        writeContract({
          address: vaultAddress as any,
          abi: [
            {
              inputs: [
                {
                  internalType: "address",
                  name: "collateralToken",
                  type: "address",
                },
                { internalType: "uint256", name: "btcAmount", type: "uint256" },
              ],
              name: "mint",
              outputs: [],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "mint",
          args: [collateralContractAddress as any, amount],
        });
      } else if (pendingTransactionType === "mint") {
        // Minting completed (BTC1USD mint or WBTC mint)
        console.log("=== MINTING COMPLETED ===");
        console.log("Refreshing balances...");
        setTransactionStatus("Transaction successful! Refreshing balances...");
        setMintingStep("idle");
        setPendingTransactionType(null);
        setPendingMintAmount("");
        setPendingDepositAmount("");

        // Clear form fields
        setMintAmount("");
        setWbtcMintAmount("");

        // Reset write contract to clear pending states
        resetWriteContract();

        // Refresh ALL data after successful transaction
        setTimeout(async () => {
          console.log("✅ Transaction confirmed! Refreshing all data across all tabs...");

          // Refetch all data in parallel for instant updates across ALL tabs
          await Promise.all([
            // User balances
            refetchBtc1usdBalance(),
            refetchWbtcBalance(),
            refetchCbbtcBalance(),
            refetchTbtcBalance(),

            // Vault balances
            refetchVaultWbtcBalance(),
            refetchVaultCbbtcBalance(),
            refetchVaultTbtcBalance(),

            // Protocol stats
            refetchTotalSupply(),
            refetchCollateralRatio(),
            refetchCollateralValue(),
            refetchBtcPrice(),

            // Distribution stats
            refetchDevWalletBalance(),
            refetchEndowmentWalletBalance(),
            refetchMerkleDistributorBalance(),
            refetchMerklFeeCollectorBalance(),
            refetchCanExecuteDistribution(),
            refetchNextDistributionTime(),
            refetchDistributionCount(),
            refetchCurrentRewardPerToken(),
          ]).then(() => {
            console.log("✅ All data refreshed successfully!");
          }).catch(err => {
            console.error("❌ Error refreshing data:", err);
          });
        }, 2000); // Increased delay to ensure blockchain state is updated

        // Clear status after 5 seconds
        const timer = setTimeout(() => {
          setTransactionStatus("");
          console.log("=== MINTING PROCESS COMPLETE ===");
        }, 5000);
        return () => clearTimeout(timer);
      } else if (pendingTransactionType === "redeem") {
        // Redeem completed
        console.log("=== REDEEM COMPLETED ===");
        console.log("Refreshing balances...");
        setTransactionStatus("Transaction successful! Refreshing balances...");
        setPendingTransactionType(null);

        // Clear form fields
        setRedeemAmount("");

        // Reset write contract to clear pending states
        resetWriteContract();

        // Refresh ALL data after successful transaction
        setTimeout(async () => {
          console.log("✅ Transaction confirmed! Refreshing all data across all tabs...");

          // Refetch all data in parallel for instant updates across ALL tabs
          await Promise.all([
            // User balances
            refetchBtc1usdBalance(),
            refetchWbtcBalance(),
            refetchCbbtcBalance(),
            refetchTbtcBalance(),

            // Vault balances
            refetchVaultWbtcBalance(),
            refetchVaultCbbtcBalance(),
            refetchVaultTbtcBalance(),

            // Protocol stats
            refetchTotalSupply(),
            refetchCollateralRatio(),
            refetchCollateralValue(),
            refetchBtcPrice(),

            // Distribution stats
            refetchDevWalletBalance(),
            refetchEndowmentWalletBalance(),
            refetchMerkleDistributorBalance(),
            refetchMerklFeeCollectorBalance(),
            refetchCanExecuteDistribution(),
            refetchNextDistributionTime(),
            refetchDistributionCount(),
            refetchCurrentRewardPerToken(),
          ]).then(() => {
            console.log("✅ All data refreshed successfully!");
          }).catch(err => {
            console.error("❌ Error refreshing data:", err);
          });
        }, 2000); // Increased delay to ensure blockchain state is updated

        // Clear status after 5 seconds
        const timer = setTimeout(() => {
          setTransactionStatus("");
          console.log("=== REDEEM PROCESS COMPLETE ===");
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    isConfirmed,
    pendingTransactionType,
    pendingMintAmount,
    pendingDepositAmount,
    pendingCollateralType,
    confirmTimeout,
    protocolState,
    writeContract,
    refetchBtc1usdBalance,
    refetchWbtcBalance,
    refetchCbbtcBalance,
    refetchTbtcBalance,
    refetchVaultWbtcBalance,
    refetchVaultCbbtcBalance,
    refetchVaultTbtcBalance,
    refetchTotalSupply,
    refetchCollateralRatio,
    refetchCollateralValue,
    hash,
    resetWriteContract,
  ]);

  const handleMint = async () => {
    console.log("=== BTC1USD MINT DEBUG START ===");

    if (!mintAmount || !address) {
      console.log("Missing mintAmount or address:", { mintAmount, address });
      setTransactionStatus("Please enter an amount and connect your wallet");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    const btcAmount = Number.parseFloat(mintAmount);
    if (isNaN(btcAmount) || btcAmount <= 0) {
      console.log("Invalid btcAmount:", btcAmount);
      setTransactionStatus("Please enter a valid BTC amount");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    // Protocol Rule 1: Check if user has sufficient collateral balance
    const userCollateralBalance = parseFloat(
      selectedCollateral === "WBTC"
        ? userWbtcBalance
        : selectedCollateral === "cbBTC"
        ? userCbbtcBalance
        : userTbtcBalance
    );
    console.log(`${selectedCollateral} Balance Check:`, {
      balance: userCollateralBalance,
      btcAmount,
      hasEnough: btcAmount <= userCollateralBalance,
    });

    if (btcAmount > userCollateralBalance) {
      setTransactionStatus(
        `Insufficient ${selectedCollateral} balance. You have ${userCollateralBalance.toFixed(
          8
        )} ${selectedCollateral}`
      );
      setTimeout(() => setTransactionStatus(""), 5000);
      return;
    }

    // Debug protocol state
    console.log("Protocol State:", {
      btcPrice: protocolState.btcPrice,
      totalSupply: protocolState.totalSupply,
      collateralRatio: collateralRatio,
      contractAddresses: protocolState.contractAddresses,
    });

    // Protocol Rule 2: Validate that mint won't break protocol health
    const currentRatio = collateralRatio;
    
    // Use real vault balances for mint calculation
    const realVaultBalances = {
      wbtc: vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0,
      cbbtc: vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0,
      tbtc: vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0,
    };
    
    // Use real collateral value from contract for consistency with contract calculations
    const realCollateralValue = totalCollateralValue
      ? parseFloat(formatUnits(totalCollateralValue, 8))
      : 0;
      
    const mintResult = ProtocolMath.calculateMint(
      {
        ...protocolState,
        collateralBalances: realVaultBalances
      },
      btcAmount * protocolState.btcPrice,
      undefined, // params
      realCollateralValue
    );

    console.log("Mint Calculation:", {
      btcAmount,
      usdValue: btcAmount * protocolState.btcPrice,
      mintResult,
      currentRatio,
    });

    // Simulate the new state after minting
    const totalToMint =
      mintResult.tokensToMint + mintResult.devFee + mintResult.endowmentFee;
    const newTotalSupply = protocolState.totalSupply + totalToMint;
    const newCollateralValue =
      (totalCollateralUSD ||
        (vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0) * protocolState.btcPrice) +
      btcAmount * protocolState.btcPrice;
    const newRatio = newCollateralValue / newTotalSupply;

    console.log("State Simulation:", {
      totalToMint,
      newTotalSupply,
      newCollateralValue,
      newRatio,
    });

    // Removed collateral ratio restriction checks

    // Protocol Rule 3: Ensure protocol is not paused
    // This would be checked by the smart contract, but we can add frontend warning
    if (currentRatio > 0 && currentRatio < 1.05) {
      const proceed = confirm(
        `Warning: Protocol is in critical state with ${formatPercentage(
          currentRatio,
          1
        )} collateral ratio. Minting may be risky. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    // Get the collateral contract address based on selection
    const collateralContractAddress =
      selectedCollateral === "WBTC"
        ? protocolState?.contractAddresses?.wbtc
        : selectedCollateral === "cbBTC"
        ? protocolState?.contractAddresses?.cbbtc
        : protocolState?.contractAddresses?.tbtc;
    const vaultAddress = protocolState?.contractAddresses?.vault;

    console.log("Contract Addresses:", {
      selectedCollateral,
      collateral: collateralContractAddress,
      vault: vaultAddress,
      vaultLength: vaultAddress?.length,
      collateralLength: collateralContractAddress?.length,
    });

    if (!collateralContractAddress || !vaultAddress) {
      console.error("Missing contract addresses:", {
        collateral: collateralContractAddress,
        vault: vaultAddress,
      });
      setTransactionStatus(
        "Error: Contract addresses not found. Please check deployment."
      );
      setTimeout(() => setTransactionStatus(""), 5000);
      return;
    }

    // Validate address lengths (Ethereum addresses should be 42 characters)
    if (collateralContractAddress.length !== 42 || vaultAddress.length !== 42) {
      console.error("Invalid contract address lengths:", {
        collateral: {
          address: collateralContractAddress,
          length: collateralContractAddress.length,
        },
        vault: { address: vaultAddress, length: vaultAddress.length },
      });
      setTransactionStatus("Error: Invalid contract addresses detected.");
      setTimeout(() => setTransactionStatus(""), 5000);
      return;
    }

    try {
      // First, approve the vault to spend the selected collateral
      const amount = parseUnits(mintAmount, 8); // All BTC tokens have 8 decimals

      console.log(
        `Approving vault ${vaultAddress} to spend ${mintAmount} ${selectedCollateral} (${amount.toString()} wei)`
      );

      // Set pending state
      setMintingStep("approving");
      setPendingTransactionType("approve");
      setPendingMintAmount(mintAmount);
      setPendingCollateralType(selectedCollateral);
      console.log("========================");

      writeContract({
        address: collateralContractAddress as any,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [vaultAddress as any, amount],
      });

      setTransactionStatus(
        "Please confirm the approval transaction in your wallet..."
      );
      console.log("=== BTC1USD MINT DEBUG END ===");
    } catch (error: any) {
      console.error("=== ERROR IN HANDLE_MINT ===");
      console.error("Error approving vault:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=== END ERROR ===");

      // Handle specific error cases
      const decodedError = decodeContractError(error);

      setTransactionStatus("Error approving vault: " + decodedError);
      setMintingStep("idle");
      setPendingTransactionType(null);
      setPendingMintAmount("");

      // Clear status after 5 seconds
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };

  const handleVaultDeposit = async () => {
    if (!vaultDepositAmount || !address) return;

    const depositAmount = Number.parseFloat(vaultDepositAmount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setTransactionStatus("Please enter a valid WBTC amount");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    const userWbtc = parseFloat(userWbtcBalance);

    if (depositAmount > userWbtc) {
      setTransactionStatus("Insufficient WBTC balance for deposit!");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    console.log("[v1] Depositing " + depositAmount + " WBTC to vault");

    try {
      // First, approve the vault to spend the WBTC
      const amount = parseUnits(vaultDepositAmount, 8); // WBTC has 8 decimals

      // Set pending state
      setMintingStep("approving");
      setPendingTransactionType("approve");
      setPendingDepositAmount(vaultDepositAmount);

      // Approve vault to spend WBTC
      writeContract({
        address: protocolState?.contractAddresses?.wbtc as any,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [protocolState?.contractAddresses?.vault as any, amount],
      });

      setTransactionStatus(
        "Please confirm the approval transaction in your wallet..."
      );
    } catch (error) {
      console.error("Error approving vault:", error);
      setTransactionStatus("Failed to approve");
      setTimeout(() => setTransactionStatus(""), 3000);
      setMintingStep("idle");
      setPendingTransactionType(null);
      setPendingDepositAmount("");
    }
  };

  const handleRedeem = async () => {
    console.log("=== REDEEM FUNCTION START ===");

    if (!isConnected || !address) {
      setTransactionStatus("Please connect your wallet first");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    if (!redeemAmount) {
      setTransactionStatus("Please enter an amount to redeem");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    const tokenAmount = parseFloat(redeemAmount);
    if (isNaN(tokenAmount) || tokenAmount <= 0) {
      setTransactionStatus("Please enter a valid amount");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    // Protocol Rule 1: Check user balance
    const userBalance = btc1usdBalance
      ? parseFloat(formatUnits(btc1usdBalance, 8))
      : 0;
    if (tokenAmount > userBalance) {
      setTransactionStatus(
        `Insufficient balance. You have ${userBalance.toFixed(8)} BTC1USD`
      );
      setTimeout(() => setTransactionStatus(""), 5000);
      return;
    }

    // Force refresh vault balance before redemption
    console.log("🔄 Refreshing vault balance before redemption...");
    if (selectedRedeemCollateral === "WBTC") {
      await refetchVaultWbtcBalance();
    } else if (selectedRedeemCollateral === "cbBTC") {
      await refetchVaultCbbtcBalance();
    } else {
      await refetchVaultTbtcBalance();
    }

    // Debug contract addresses being used
    console.log("=== REDEEM DEBUG START ===");
    console.log("Contract addresses being used:");
    console.log("Vault:", protocolState?.contractAddresses?.vault);
    console.log("WBTC:", protocolState?.contractAddresses?.wbtc);
    console.log("BTC1USD:", protocolState?.contractAddresses?.btc1usd);
    console.log("User address:", address);
    console.log("Redeem amount:", tokenAmount);
    console.log("User BTC1USD balance:", userBalance);
    console.log("Current collateral ratio:", collateralRatio);
    console.log("Total collateral USD:", totalCollateralUSD);
    console.log("Vault WBTC balance (BigInt):", vaultWbtcBalance?.toString());
    console.log(
      "Vault WBTC balance (formatted):",
      vaultWbtcBalance ? formatUnits(vaultWbtcBalance as bigint, 8) : "0"
    );
    console.log("=== REDEEM DEBUG END ===");

    // Protocol Rule 2: Check protocol health and determine redemption mode
    const currentRatio = collateralRatio;
    let effectivePrice: number;
    let redemptionMode: string;

    if (currentRatio >= 1.1) {
      // Healthy mode: 1 BTC1USD → $1 of BTC (minus 0.1% dev fee)
      effectivePrice = 1.0;
      redemptionMode = "Healthy";
    } else {
      // Stress mode: 1 BTC1USD → 0.90 × R USD of BTC (minus 0.1% fee)
      // FIXED: Properly calculate stress value as 0.90 × current_ratio
      effectivePrice = 0.9 * currentRatio;
      redemptionMode = "Stress";

      // Show stress mode warning via transaction status
      setTransactionStatus(
        `⚠️ Stress Mode: You will receive ${(effectivePrice * 100).toFixed(
          1
        )}% of face value (${formatPercentage(currentRatio, 1)} ratio)`
      );
      // Note: User can still proceed with the transaction
    }

    // Protocol Rule 3: Calculate and validate redemption amounts
    const grossBtcValue =
      (tokenAmount * effectivePrice) / protocolState.btcPrice;
    const devFee = grossBtcValue * 0.001; // 0.1% dev fee
    const btcToReceive = grossBtcValue - devFee;

    // Protocol Rule 4: Validate redemption won't break minimum collateral ratio
    const newTotalSupply = protocolState.totalSupply - tokenAmount;
    const usdValueRedeemed = grossBtcValue * protocolState.btcPrice;
    const newCollateralValue = totalCollateralUSD - usdValueRedeemed;

    // Protocol Rule 5: Ensure sufficient collateral exists in vault
    const requiredCollateral = grossBtcValue; // Total BTC needed (including fees)
    // Use fresh vault balance from contract for selected collateral
    const vaultBalance =
      selectedRedeemCollateral === "WBTC"
        ? vaultWbtcBalance
        : selectedRedeemCollateral === "cbBTC"
        ? vaultCbbtcBalance
        : vaultTbtcBalance;
    const availableCollateral = vaultBalance
      ? parseFloat(formatUnits(vaultBalance as bigint, 8))
      : 0;

    console.log("=== REDEEM CALCULATION DEBUG ===");
    console.log("Selected collateral:", selectedRedeemCollateral);
    console.log("Effective price:", effectivePrice);
    console.log("Gross BTC value:", grossBtcValue.toFixed(8), "BTC");
    console.log("Dev fee:", devFee.toFixed(8), "BTC");
    console.log("BTC to receive:", btcToReceive.toFixed(8), "BTC");
    console.log(
      "Required collateral:",
      requiredCollateral.toFixed(8),
      selectedRedeemCollateral
    );
    console.log(
      "Available collateral (from contract):",
      availableCollateral.toFixed(8),
      selectedRedeemCollateral
    );
    console.log(
      "Vault has sufficient collateral:",
      availableCollateral >= requiredCollateral
    );
    console.log("=== END CALCULATION DEBUG ===");

    if (requiredCollateral > availableCollateral) {
      // Show detailed error message with correct values
      setTransactionStatus(
        `Insufficient ${selectedRedeemCollateral} in vault. Required: ${requiredCollateral.toFixed(
          8
        )}, Available: ${availableCollateral.toFixed(
          8
        )}. Try selecting a different collateral type.`
      );
      setTimeout(() => setTransactionStatus(""), 8000);
      return;
    }

    // Get the selected collateral contract address
    const collateralContractAddress =
      selectedRedeemCollateral === "WBTC"
        ? protocolState?.contractAddresses?.wbtc
        : selectedRedeemCollateral === "cbBTC"
        ? protocolState?.contractAddresses?.cbbtc
        : protocolState?.contractAddresses?.tbtc;

    console.log("=== REDEMPTION DETAILS ===");
    console.log("Redeeming:", tokenAmount, "BTC1USD tokens");
    console.log("Selected collateral:", selectedRedeemCollateral);
    console.log("Collateral address:", collateralContractAddress);
    console.log("Current ratio:", formatPercentage(currentRatio, 1));
    console.log("Redemption mode:", redemptionMode);
    console.log("Effective price:", effectivePrice);
    console.log("Expected to receive:", btcToReceive.toFixed(8), "BTC");
    console.log("Dev fee:", devFee.toFixed(8), "BTC");
    console.log(
      "New collateral ratio:",
      formatPercentage(
        newTotalSupply > 0 ? newCollateralValue / newTotalSupply : 0,
        1
      )
    );

    try {
      // Use 8 decimals for BTC1USD
      const amount = parseUnits(redeemAmount, 8);

      // Set transaction type and collateral type
      setPendingTransactionType("redeem"); // Set to "redeem" to differentiate from buy/mint
      setPendingCollateralType(selectedRedeemCollateral); // Store selected collateral for balance refresh

      setTransactionStatus(
        "Please confirm the redemption transaction in your wallet..."
      );

      writeContract({
        address: protocolState?.contractAddresses?.vault as any,
        abi: [
          {
            inputs: [
              { internalType: "uint256", name: "tokenAmount", type: "uint256" },
              {
                internalType: "address",
                name: "collateralToken",
                type: "address",
              },
            ],
            name: "redeem",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "redeem",
        args: [amount, collateralContractAddress as any],
      });

      // Note: Don't clear the form or show success here - wait for transaction confirmation
      // The useEffect will handle this when isConfirmed becomes true

      // The balance will be automatically updated when the transaction is confirmed
    } catch (error) {
      console.error("Error redeeming BTC1USD:", error);
      setTransactionStatus(getSimpleErrorMessage(error));
      setTimeout(() => setTransactionStatus(""), 3000);
      setPendingTransactionType(null);
    }
  };

  const getHealthStatus = () => {
    // Handle zero supply case
    if (protocolState.totalSupply === 0) {
      return {
        status: "No Supply",
        color: "bg-gray-500",
        textColor: "text-gray-400",
      };
    }

    const ratio = collateralRatio;
    if (ratio <= 0 || !isFinite(ratio))
      return {
        status: "No Data",
        color: "bg-gray-500",
        textColor: "text-gray-400",
      };
    if (ratio >= 1.2)
      return {
        status: "Excellent",
        color: "bg-green-500",
        textColor: "text-green-400",
      };
    if (ratio >= 1.15)
      return {
        status: "Good",
        color: "bg-blue-500",
        textColor: "text-blue-400",
      };
    if (ratio >= 1.1)
      return {
        status: "Healthy",
        color: "bg-yellow-500",
        textColor: "text-yellow-400",
      };
    return {
      status: "Stressed",
      color: "bg-red-500",
      textColor: "text-red-400",
    };
  };

  const healthStatus = getHealthStatus();

  const handleWbtcMint = async () => {
    console.log(`=== ${selectedMintCollateral} MINT FUNCTION START ===`);

    // Validation
    if (!address) {
      console.log("No wallet connected");
      setTransactionStatus("Please connect your wallet first");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    if (!wbtcMintAmount) {
      console.log("No amount specified");
      setTransactionStatus("Please enter an amount");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    const amountFloat = parseFloat(wbtcMintAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      console.log("Invalid amount");
      setTransactionStatus("Please enter a valid amount");
      setTimeout(() => setTransactionStatus(""), 3000);
      return;
    }

    // Check admin authorization
    const adminAddress = CONTRACT_ADDRESSES.ADMIN; // From deployment config
    const isAdmin =
      address && address.toLowerCase() === adminAddress.toLowerCase();

    if (!isAdmin) {
      console.log("User is not admin");
      setTransactionStatus(
        `Error: Only admin can mint ${selectedMintCollateral} tokens. This is a test-only feature.`
      );
      setTimeout(() => setTransactionStatus(""), 5000);
      return;
    }

    try {
      // Reset and set initial status
      setTransactionStatus("Preparing transaction...");
      console.log(`Starting ${selectedMintCollateral} mint process...`);

      const validAddress = address as any;
      const amount = parseUnits(wbtcMintAmount, 8); // All BTC tokens have 8 decimals

      // Get the contract address based on selected collateral
      let contractAddress: string;
      switch (selectedMintCollateral) {
        case "WBTC":
          contractAddress = protocolState.contractAddresses.wbtc;
          break;
        case "cbBTC":
          contractAddress = protocolState.contractAddresses.cbbtc;
          break;
        case "tBTC":
          contractAddress = protocolState.contractAddresses.tbtc;
          break;
        default:
          throw new Error("Invalid collateral type");
      }

      console.log("Mint parameters:");
      console.log("  Token:", selectedMintCollateral);
      console.log("  Contract:", contractAddress);
      console.log("  To:", validAddress);
      console.log("  Amount (wei):", amount.toString());
      console.log("  Amount:", wbtcMintAmount);

      // Set transaction type
      setPendingTransactionType("mint");
      setTransactionStatus("Please confirm the transaction in your wallet...");

      // Call the contract using writeContract
      console.log("Calling writeContract...");
      writeContract({
        address: contractAddress as any,
        abi: [
          {
            inputs: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "mint",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "mint",
        args: [validAddress, amount],
      });

      console.log("writeContract called successfully");
      console.log(`=== ${selectedMintCollateral} MINT FUNCTION END ===`);
    } catch (error: any) {
      console.error("=== ERROR IN HANDLE_WBTC_MINT ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=== END ERROR ===");

      let errorMessage = error.message || "Unknown error";

      // Handle specific error cases based on script logic
      if (
        errorMessage.includes("caller is not admin") ||
        errorMessage.includes("admin")
      ) {
        errorMessage =
          "Only the admin can mint WBTC tokens. This error occurs because of the authorization check.";
      } else if (errorMessage.includes("user rejected transaction")) {
        errorMessage = "Transaction was rejected by the user";
      }

      setTransactionStatus("Error: " + errorMessage);
      setPendingTransactionType(null);

      // Clear status after 5 seconds
      setTimeout(() => setTransactionStatus(""), 5000);
    }
  };

  // Add detailed mint validation with fee-aware calculation
  const validateMintAmount = (btcAmount: number) => {
    if (!btcAmount || btcAmount <= 0) return null;

    const btcPrice = protocolState.btcPrice;
    const usdValue = btcAmount * btcPrice;
    const currentRatio = collateralRatio;
    const currentSupply = protocolState.totalSupply;
    const currentCollateralValue = totalCollateralUSD || 0;

    // Use minimum collateral ratio for mint price (first mint scenario)
    const mintPrice = Math.max(1.1, currentRatio);

    // Calculate tokens before fees
    const tokensToMint = usdValue / mintPrice;

    // Calculate fees (1% dev + 0.1% endowment = 1.1% total)
    const devFee = tokensToMint * 0.01;
    const endowmentFee = tokensToMint * 0.001;
    const totalToMint = tokensToMint + devFee + endowmentFee;

    // Calculate new state
    const newTotalSupply = currentSupply + totalToMint;
    const newCollateralValue = currentCollateralValue + usdValue;
    const newRatio =
      newTotalSupply > 0 ? newCollateralValue / newTotalSupply : 1.1;

    // Check if it meets minimum collateral ratio
    const minRatio = 1.1;
    const wouldFail = newRatio < minRatio;

    // Calculate maximum viable amount if current amount would fail
    let maxViableAmount = btcAmount;
    if (wouldFail) {
      // Work backwards: newRatio = newCollateralValue / newTotalSupply >= minRatio
      // We want: (currentCollateralValue + maxUsdValue) / (currentSupply + maxTotalToMint) = minRatio
      // Solving for maxUsdValue with fee factor 1.011 (1 + 0.01 + 0.001)
      const feeFactor = 1.011;
      const denominator = feeFactor / mintPrice - 1 / minRatio;

      if (denominator > 0) {
        const maxUsdValue =
          (currentSupply - currentCollateralValue / minRatio) / denominator;
        maxViableAmount = Math.max(0, maxUsdValue / btcPrice);
      } else {
        maxViableAmount = 0;
      }
    }

    return {
      tokensToMint,
      devFee,
      endowmentFee,
      totalToMint,
      newRatio,
      wouldFail,
      maxViableAmount,
      usdValue,
      mintPrice,
    };
  };

  const decodeContractError = (error: any): string => {
    const errorMessage = error.message || error.toString();

    // Check for specific contract error patterns
    if (errorMessage.includes("PriceOracle: price is stale")) {
      return "BTC price is stale. The price oracle needs to be updated. Please contact the administrator.";
    }
    if (errorMessage.includes("Vault: insufficient collateral")) {
      return "Insufficient collateral in the vault for this transaction.";
    }
    if (errorMessage.includes("Vault: collateral ratio too low")) {
      return "Transaction would result in collateral ratio below minimum threshold.";
    }
    if (errorMessage.includes("BTC1USD: caller is not vault")) {
      return "Invalid contract configuration. The BTC1USD contract is not properly connected to the vault.";
    }
    if (errorMessage.includes("user rejected transaction")) {
      return "Transaction was rejected by the user";
    }
    if (errorMessage.includes("insufficient funds")) {
      return "Insufficient funds for gas fees";
    }
    if (errorMessage.includes("Internal JSON-RPC error")) {
      return "Contract execution failed. This could be due to stale price data, insufficient collateral, or contract validation errors. Please check the console for details.";
    }

    return errorMessage;
  };

  // Admin check - Updated from deployment config
  const adminAddress = CONTRACT_ADDRESSES.ADMIN; // From deployment config
  const isAdminUser = !!(
    address && address.toLowerCase() === adminAddress.toLowerCase()
  );

  const testContractFunction = async () => {
    console.log("Testing contract function call...");
    setTransactionStatus("Testing contract function...");

    try {
      // This is just for debugging - we'll see if we can trigger any kind of interaction
      console.log("Attempting to trigger contract interaction...");
      setTransactionStatus("Contract interaction test completed");
      setTimeout(() => setTransactionStatus(""), 3000);
    } catch (error) {
      console.error("Contract interaction test failed:", error);
      setTransactionStatus("Contract interaction test failed");
      setTimeout(() => setTransactionStatus(""), 3000);
    }
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "mint", label: "Buy & Sell", icon: Plus },
    { id: "merkle-claim", label: "Claim Rewards", icon: Gift },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "governance", label: "Vote", icon: Users },
    // Admin-only sections
    ...(isAdminUser
      ? [
          {
            id: "wbtc-mint",
            label: "Collateral Minting",
            icon: Bitcoin,
          },
          {
            id: "distribution-admin",
            label: "Distribution Admin",
            icon: Calendar,
          },
          {
            id: "treasury",
            label: "Treasury",
            icon: DollarSign,
          },
          {
            id: "security",
            label: "Security",
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40 text-foreground">
      {/* Sidebar */}
      <div
        className={
          "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50 " +
          (sidebarOpen ? "w-64" : "w-16")
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div
            className={
              "flex items-center space-x-3 " +
              (!sidebarOpen ? "justify-center" : "")
            }
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              {/* Replaced Bitcoin icon with BTC1USD logo - Increased size */}
              <img 
                src="/BTC1USD-Logo.jpg" 
                alt="BTC1USD Protocol Logo" 
                className="h-6 w-6 rounded-full object-contain"
              />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-foreground">BTC1USD</h1>

              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        {/* Removed search bar as per user request */}

        {/* Navigation */}
        <nav className="px-2 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={
                  activeTab === item.id
                    ? "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-orange-500 text-white hover:bg-orange-600 " +
                      (!sidebarOpen ? "justify-center" : "")
                    : "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-foreground/80 hover:bg-accent hover:text-accent-foreground " +
                      (!sidebarOpen ? "justify-center" : "")
                }
              >
                <Icon className="w-5 h-5" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Base Sepolia Testnet</div>
              <div>Block: 12,345,678</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className={
          "transition-all duration-300 " + (sidebarOpen ? "ml-64" : "ml-16")
        }
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
               Dashboard
              </h1>
             
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Bell className="w-4 h-4" />
              </Button>
              {!isConnected ? (
                <Button
                  onClick={handleConnectWallet}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Connect Wallet
                </Button>
              ) : (
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-500 bg-orange-500/10"
                  >
                    {getNetworkName(chainId)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-orange-500 text-orange-500 bg-orange-500/10"
                  >
                    {address
                      ? address.slice(0, 6) + "..." + address.slice(-4)
                      : "Connected"}
                  </Badge>
                  <Button
                    onClick={handleDisconnectWallet}
                    variant="outline"
                    size="sm"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    Disconnect
                  </Button>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {formatBTC1USD(userBalance)} BTC1USD
                    </span>
                    <Button
                      onClick={() => refetchBtc1usdBalance()}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 p-8">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-2">
                  Overview
                  </h2>
                
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl"></div>
              </div>

              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Protocol Users
                    </CardTitle>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {protocolStats.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Active participants
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Total Value Locked
                    </CardTitle>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {formatCurrency(
                        (
                          (vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0) +
                          (vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0) +
                          (vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0)
                        ) * protocolState.btcPrice,
                        0
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Calculated from current BTC price
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Dev Wallet
                    </CardTitle>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {devWalletBalance
                        ? formatTokens(
                            parseFloat(formatUnits(devWalletBalance, 8))
                          )
                        : "0"}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">BTC1USD earned</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-300">
                      Endowment Wallet
                    </CardTitle>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {endowmentWalletBalance
                        ? formatTokens(
                            parseFloat(formatUnits(endowmentWalletBalance, 8))
                          )
                        : "0"}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      BTC1USD for endowment
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Wallet Details Section - Admin Only */}
              {isAdminUser && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        Protocol Wallets
                        <Button
                          onClick={() => {
                            refetchDevWalletBalance();
                            refetchEndowmentWalletBalance();
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-gray-400 hover:text-white"
                        >
                          Refresh
                        </Button>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Development and community fund balances
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                Development Wallet
                              </div>
                              <div className="text-xs text-gray-400">
                                {CONTRACT_ADDRESSES.DEV_WALLET.slice(0, 6)}...
                                {CONTRACT_ADDRESSES.DEV_WALLET.slice(-4)} (1%
                                mint fee)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">
                              {devWalletBalance
                                ? formatTokens(
                                    parseFloat(formatUnits(devWalletBalance, 8))
                                  )
                                : "0"}{" "}
                              BTC1USD
                            </div>
                            <div className="text-xs text-gray-400">
                              {devWalletBalance
                                ? formatCurrency(
                                    parseFloat(
                                      formatUnits(devWalletBalance, 8)
                                    ),
                                    0
                                  )
                                : "$0"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-pink-500/10 rounded-full flex items-center justify-center">
                              <Heart className="w-4 h-4 text-pink-500" />
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                Endowment Wallet
                              </div>
                              <div className="text-xs text-gray-400">
                                {CONTRACT_ADDRESSES.ENDOWMENT_WALLET.slice(
                                  0,
                                  6
                                )}
                                ...
                                {CONTRACT_ADDRESSES.ENDOWMENT_WALLET.slice(-4)}{" "}
                                (0.1% mint fee)
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">
                              {endowmentWalletBalance
                                ? formatTokens(
                                    parseFloat(
                                      formatUnits(endowmentWalletBalance, 8)
                                    )
                                  )
                                : "0"}{" "}
                              BTC1USD
                            </div>
                            <div className="text-xs text-gray-400">
                              {endowmentWalletBalance
                                ? formatCurrency(
                                    parseFloat(
                                      formatUnits(endowmentWalletBalance, 8)
                                    ),
                                    0
                                  )
                                : "$0"}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              Total Protocol Fees:
                            </span>
                            <span className="text-white font-medium">
                              {formatBTC1USD(
                                (devWalletBalance
                                  ? parseFloat(formatUnits(devWalletBalance, 8))
                                  : 0) +
                                (endowmentWalletBalance
                                  ? parseFloat(
                                      formatUnits(endowmentWalletBalance, 8)
                                    )
                                  : 0)
                              )}{" "}
                              BTC1USD
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Fee Distribution
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        How minting fees are allocated
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-300">
                              Development (1.0%)
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            90.9% of total fees
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                            <span className="text-gray-300">
                              Endowment (0.1%)
                            </span>
                          </div>
                          <span className="text-white font-medium">
                            9.1% of total fees
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>
                              • Development funds support protocol maintenance
                            </div>
                            <div>
                              • Endowment funds support community initiatives
                            </div>
                            <div>
                              • Fees are collected on every mint transaction
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Protocol Health */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Protocol Health Overview Card */}
                <Card className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-white text-xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white" />
                        </div>
                        <span>Protocol Health Overview</span>
                      </div>
                      <Button
                        onClick={() => {
                          refetchTotalSupply();
                          refetchBtcPrice();
                          refetchCollateralRatio();
                          refetchCollateralValue();
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        Refresh Data
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time system metrics and collateral status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Key Metrics Grid with Enhanced Styling */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600 hover:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            BTC Price
                          </span>
                          <Bitcoin className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="text-2xl font-bold text-orange-500">
                          {formatCurrency(protocolState.btcPrice, 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Live oracle feed
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600 hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Collateral Ratio
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${healthStatus.color} shadow-lg`}
                          ></div>
                        </div>
                        <div
                          className={
                            "text-2xl font-bold " + healthStatus.textColor
                          }
                        >
                          {protocolState.totalSupply === 0
                            ? "N/A"
                            : formatPercentage(collateralRatio, 1)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {healthStatus.status}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600 hover:border-green-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Total Supply
                          </span>
                          <DollarSign className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {formatTokens(protocolState.totalSupply)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          BTC1USD tokens
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-4 border border-gray-600 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Mint Price
                          </span>
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {protocolState.totalSupply === 0
                            ? "$1.10"
                            : formatCurrency(Math.max(1.1, collateralRatio), 2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {protocolState.totalSupply === 0
                            ? "First mint"
                            : collateralRatio >= 1.1
                            ? "Dynamic pricing"
                            : "Minimum price"}
                        </div>
                      </div>
                    </div>

                    {/* Collateral Value Details with Enhanced Spacing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-5 border border-gray-600">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-gray-300">
                            Collateral Value
                          </span>
                          <span className="text-2xl font-bold text-green-400">
                            {formatCurrency(totalCollateralUSD, 0)}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              Calculated Value:
                            </span>
                            <span className="text-gray-200 font-medium">
                              {formatCurrency(
                                (
                                  (vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0) +
                                  (vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0) +
                                  (vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0)
                                ) * protocolState.btcPrice,
                                0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Data Source:</span>
                            <span className="text-gray-200 font-medium">
                              Calculated from current BTC price
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-5 border border-gray-600">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-gray-300">
                            Protocol Health
                          </span>
                          <Badge
                            className={
                              healthStatus.textColor +
                              " bg-transparent border-current text-sm py-1"
                            }
                          >
                            {healthStatus.status}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              Minimum Ratio:
                            </span>
                            <span className="text-gray-200 font-medium">110%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              Current Status:
                            </span>
                            <span className={`font-medium ${healthStatus.textColor}`}>
                              {protocolState.totalSupply === 0
                                ? "No Supply"
                                : collateralRatio >= 1.1
                                ? "Healthy"
                                : "Needs Collateral"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Health Progress Bar */}
                    <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-5 border border-gray-600">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-base font-semibold text-gray-300">
                          System Health Status
                        </span>
                        <span className="text-base text-gray-400 font-medium">
                          {protocolState.totalSupply === 0
                            ? "Awaiting First Mint"
                            : `${Math.min(
                                100,
                                Math.round((collateralRatio / 1.1) * 100)
                              )}% of minimum`}
                        </span>
                      </div>
                      <Progress
                        value={
                          protocolState.totalSupply === 0
                            ? 0
                            : Math.min(100, (collateralRatio / 1.1) * 100)
                        }
                        className="w-full h-4 rounded-full"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                        <span className="px-2 py-1 bg-red-500/20 rounded">Critical (&lt; 105%)</span>
                        <span className="px-2 py-1 bg-yellow-500/20 rounded">Minimum (110%)</span>
                        <span className="px-2 py-1 bg-green-500/20 rounded">Healthy (&gt; 120%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Vault Collateral Balances
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Current collateral holdings in vault
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {collateralTokens.map((token) => {
                        // Use real vault balances from contract
                        const actualBalance =
                          token.symbol === "WBTC"
                            ? vaultWbtcBalance
                              ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8))
                              : 0
                            : token.symbol === "cbBTC"
                            ? vaultCbbtcBalance
                              ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8))
                              : 0
                            : token.symbol === "tBTC"
                            ? vaultTbtcBalance
                              ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8))
                              : 0
                            : 0;

                        return (
                          <div
                            key={token.symbol}
                            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <Bitcoin className="w-5 h-5 text-orange-500" />
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {token.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {token.name}
                                </div>
                                <div className="text-xs text-green-400">
                                  Live vault data
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-white">
                                {actualBalance.toFixed(8)} BTC
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatCurrency(
                                  actualBalance * protocolState.btcPrice,
                                  0
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-600">
                      <div className="flex justify-between text-base mb-2">
                        <span className="text-gray-400">
                          Total Vault Holdings:
                        </span>
                        <span className="text-white font-bold">
                          {(
                            (vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0) +
                            (vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0) +
                            (vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0)
                          ).toFixed(8)} BTC
                        </span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-gray-400">USD Value:</span>
                        <span className="text-green-400 font-bold">
                          {formatCurrency(
                            (
                              (vaultWbtcBalance ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8)) : 0) +
                              (vaultCbbtcBalance ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8)) : 0) +
                              (vaultTbtcBalance ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8)) : 0)
                            ) * protocolState.btcPrice,
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Data Source:</span>
                        <span>Calculated from current BTC price</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity and BTC1USD Holders in Same Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Card */}
                <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">
                      Latest protocol events and transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">
                          Your transactions will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {activities.map((activity) => {
                          const iconMap = {
                            plus: <ArrowUpRight className="w-4 h-4" />,
                            minus: <ArrowDownRight className="w-4 h-4" />,
                            gift: <Gift className="w-4 h-4" />,
                            calendar: <CalendarCheck className="w-4 h-4" />,
                            vote: <Vote className="w-4 h-4" />,
                          };

                          const colorMap = {
                            green: "bg-green-500/10 text-green-500",
                            red: "bg-red-500/10 text-red-500",
                            orange: "bg-orange-500/10 text-orange-500",
                            blue: "bg-blue-500/10 text-blue-500",
                            purple: "bg-purple-500/10 text-purple-500",
                          };

                          const timeAgo = (timestamp: number) => {
                            const seconds = Math.floor(
                              (Date.now() - timestamp) / 1000
                            );
                            if (seconds < 60) return "Just now";
                            if (seconds < 3600)
                              return `${Math.floor(seconds / 60)}m ago`;
                            if (seconds < 86400)
                              return `${Math.floor(seconds / 3600)}h ago`;
                            return `${Math.floor(seconds / 86400)}d ago`;
                          };

                          return (
                            <div
                              key={activity.id}
                              className="flex items-center space-x-4 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  colorMap[activity.color]
                                }`}
                              >
                                {iconMap[activity.icon]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white text-sm truncate">
                                  {activity.title}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {timeAgo(activity.timestamp)}
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.amount && (
                                  <div className="font-medium text-white text-sm">
                                    {activity.amount}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400">
                                  {activity.description}
                                </div>
                                {activity.txHash && (
                                  <a
                                    href={`https://sepolia.basescan.org/tx/${activity.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-500 hover:underline"
                                  >
                                    View tx
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced BTC1USD Holders Card - Wider to accommodate information */}
                <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>BTC1USD Holders</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-gray-400 hover:text-white"
                        onClick={() => {
                          // Placeholder for refresh functionality
                          console.log("Refreshing holders data");
                        }}
                      >
                        Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Token holders in the protocol
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Real holder data with horizontal alignment */}
                      {[
                        {
                          rank: 1,
                          address: protocolState.contractAddresses.btc1usd,
                          name: "Total Supply",
                          balance: protocolState.totalSupply,
                          percentage: 100,
                          icon: "💵",
                          color: "bg-blue-500/10 text-blue-500"
                        },
                        {
                          rank: 2,
                          address: CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR,
                          name: "Merkle Distributor",
                          balance: merkleDistributorBalance ? parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) : 0,
                          percentage: protocolState.totalSupply > 0 ?
                                    ((merkleDistributorBalance ? parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) : 0) / protocolState.totalSupply) * 100 :
                                    (merkleDistributorBalance && parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) > 0 ? 100 : 0),
                          icon: "🏦",
                          color: "bg-green-500/10 text-green-500"
                        },
                        {
                          rank: 3,
                          address: CONTRACT_ADDRESSES.MERKLE_FEE_COLLECTOR,
                          name: "Merkle Fee Collector",
                          balance: merklFeeCollectorBalance ? parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) : 0,
                          percentage: protocolState.totalSupply > 0 ?
                                    ((merklFeeCollectorBalance ? parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) : 0) / protocolState.totalSupply) * 100 :
                                    (merklFeeCollectorBalance && parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) > 0 ? 100 : 0),
                          icon: "💰",
                          color: "bg-emerald-500/10 text-emerald-500"
                        },
                        {
                          rank: 4,
                          address: CONTRACT_ADDRESSES.DEV_WALLET,
                          name: "Dev Wallet",
                          balance: devWalletBalance ? parseFloat(formatUnits(devWalletBalance as bigint, 8)) : 0,
                          percentage: protocolState.totalSupply > 0 ?
                                    ((devWalletBalance ? parseFloat(formatUnits(devWalletBalance as bigint, 8)) : 0) / protocolState.totalSupply) * 100 :
                                    (devWalletBalance && parseFloat(formatUnits(devWalletBalance as bigint, 8)) > 0 ? 100 : 0),
                          icon: "💻",
                          color: "bg-purple-500/10 text-purple-500"
                        },
                        {
                          rank: 5,
                          address: CONTRACT_ADDRESSES.ENDOWMENT_WALLET,
                          name: "Endowment Wallet",
                          balance: endowmentWalletBalance ? parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) : 0,
                          percentage: protocolState.totalSupply > 0 ?
                                    ((endowmentWalletBalance ? parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) : 0) / protocolState.totalSupply) * 100 :
                                    (endowmentWalletBalance && parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) > 0 ? 100 : 0),
                          icon: "❤️",
                          color: "bg-pink-500/10 text-pink-500"
                        },
                        {
                          rank: 6,
                          address: address || "0x0000000000000000000000000000000000000000",
                          name: "Your Balance",
                          balance: userBalance,
                          percentage: protocolState.totalSupply > 0 ? (userBalance / protocolState.totalSupply) * 100 :
                                    (userBalance > 0 ? 100 : 0),
                          icon: "👤",
                          color: "bg-orange-500/10 text-orange-500"
                        },
                        {
                          rank: 7,
                          address: "0x0000000000000000000000000000000000000000",
                          name: "Other Holders",
                          balance: Math.max(0, protocolState.totalSupply - (
                            (merkleDistributorBalance ? parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) : 0) +
                            (merklFeeCollectorBalance ? parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) : 0) +
                            (devWalletBalance ? parseFloat(formatUnits(devWalletBalance as bigint, 8)) : 0) +
                            (endowmentWalletBalance ? parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) : 0) +
                            userBalance
                          )),
                          percentage: protocolState.totalSupply > 0 ?
                                    (Math.max(0, protocolState.totalSupply - (
                                      (merkleDistributorBalance ? parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) : 0) +
                                      (merklFeeCollectorBalance ? parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) : 0) +
                                      (devWalletBalance ? parseFloat(formatUnits(devWalletBalance as bigint, 8)) : 0) +
                                      (endowmentWalletBalance ? parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) : 0) +
                                      userBalance
                                    )) / protocolState.totalSupply) * 100 :
                                    (Math.max(0, protocolState.totalSupply - (
                                      (merkleDistributorBalance ? parseFloat(formatUnits(merkleDistributorBalance as bigint, 8)) : 0) +
                                      (merklFeeCollectorBalance ? parseFloat(formatUnits(merklFeeCollectorBalance as bigint, 8)) : 0) +
                                      (devWalletBalance ? parseFloat(formatUnits(devWalletBalance as bigint, 8)) : 0) +
                                      (endowmentWalletBalance ? parseFloat(formatUnits(endowmentWalletBalance as bigint, 8)) : 0) +
                                      userBalance
                                    )) > 0 ? 100 : 0),
                          icon: "👥",
                          color: "bg-gray-500/10 text-gray-500"
                        },
                      ].map((holder) => (
                        <div key={holder.rank} className="flex flex-col items-center p-3 bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-lg hover:from-gray-700/50 hover:to-gray-800/50 transition-all duration-300 border border-gray-600 hover:border-gray-500">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${holder.color} text-xl`}>
                            {holder.icon}
                          </div>
                          <div className="text-center mb-2">
                            <div className="font-bold text-white text-xs">{holder.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                              {holder.address.substring(0, 6)}...{holder.address.substring(holder.address.length - 4)}
                            </div>
                          </div>
                          <div className="text-center w-full">
                            <div className="font-bold text-white text-sm">
                              {formatTokens(holder.balance, 2)}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">BTC1USD</div>
                            <div className="mt-2 w-full bg-gray-600 rounded-full h-1.5">
                              <div
                                className="bg-gradient-to-r from-orange-500 to-yellow-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, holder.percentage)}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">
                              {protocolState.totalSupply === 0 && holder.balance > 0 ? (
                                "100% (of 0 supply)"
                              ) : (
                                `${holder.percentage.toFixed(1)}%`
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-5 border-t border-gray-600 text-center mt-5">
                      {protocolState.totalSupply === 0 ? (
                        <p className="text-xs text-yellow-500">
                          ⚠️ No BTC1USD tokens have been minted yet. Total supply is currently 0.
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Real-time protocol statistics. Last updated: {new Date().toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "distribution" && (
            <div className="space-y-6">
              {/* Distribution Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      Weekly Distribution Status
                      <Button
                        onClick={() => {
                          refetchCanExecuteDistribution();
                          refetchNextDistributionTime();
                          refetchDistributionCount();
                          refetchCurrentRewardPerToken();
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-gray-400 hover:text-white"
                      >
                        Refresh
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Current distribution cycle information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">
                          Can Execute
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            canExecuteDistribution
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {canExecuteDistribution ? "Yes" : "No"}
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">
                          Next Distribution
                        </div>
                        <div className="text-lg font-bold text-white">
                          {nextDistributionTime
                            ? new Date(
                                Number(nextDistributionTime) * 1000
                              ).toLocaleDateString()
                            : "Loading..."}
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">
                          Total Distributions
                        </div>
                        <div className="text-lg font-bold text-white">
                          {distributionCount
                            ? distributionCount.toString()
                            : "0"}
                        </div>
                      </div>

                      <div className="bg-gray-700/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">
                          Current Reward Rate
                        </div>
                        <div className="text-lg font-bold text-orange-400">
                          {currentRewardPerToken
                            ? `$${(
                                parseFloat(
                                  formatUnits(currentRewardPerToken, 18)
                                ) * 100
                              ).toFixed(1)}¢`
                            : "$0.0¢"}
                        </div>
                        <div className="text-xs text-gray-500">
                          per BTC1USD held
                        </div>
                      </div>
                    </div>

                    {/* Execute Distribution Button */}
                    <div className="pt-4 border-t border-gray-600">
                      <Button
                        onClick={handleExecuteDistribution}
                        disabled={
                          !canExecuteDistribution || isPending || isConfirming
                        }
                        className={`w-full ${
                          canExecuteDistribution
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-600 cursor-not-allowed"
                        } text-white`}
                      >
                        {isPending || isConfirming ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Executing Distribution...</span>
                          </div>
                        ) : (
                          "Execute Weekly Distribution"
                        )}
                      </Button>

                      {!canExecuteDistribution && (
                        <div className="mt-2 text-xs text-gray-400 space-y-1">
                          <div>
                            • Distribution must be executed on Friday at 14:00
                            UTC
                          </div>
                          <div>• Collateral ratio must be ≥ 112%</div>
                          <div>• 7 days must pass since last distribution</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Reward Calculation
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      How rewards are calculated based on collateral ratio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { min: 2.02, reward: 10, tier: "Tier 10" },
                        { min: 1.92, reward: 9, tier: "Tier 9" },
                        { min: 1.82, reward: 8, tier: "Tier 8" },
                        { min: 1.72, reward: 7, tier: "Tier 7" },
                        { min: 1.62, reward: 6, tier: "Tier 6" },
                        { min: 1.52, reward: 5, tier: "Tier 5" },
                        { min: 1.42, reward: 4, tier: "Tier 4" },
                        { min: 1.32, reward: 3, tier: "Tier 3" },
                        { min: 1.22, reward: 2, tier: "Tier 2" },
                        { min: 1.12, reward: 1, tier: "Tier 1" },
                      ].map((tier, index) => {
                        const isCurrentTier =
                          collateralRatio >= tier.min &&
                          (index === 0 ||
                            collateralRatio <
                              (index > 0
                                ? [
                                    { min: 2.02 },
                                    { min: 1.92 },
                                    { min: 1.82 },
                                    { min: 1.72 },
                                    { min: 1.62 },
                                    { min: 1.52 },
                                    { min: 1.42 },
                                    { min: 1.32 },
                                    { min: 1.22 },
                                  ][index - 1]?.min
                                : 999));

                        return (
                          <div
                            key={tier.tier}
                            className={`flex items-center justify-between p-2 rounded ${
                              isCurrentTier
                                ? "bg-orange-500/20 border border-orange-500/50"
                                : "bg-gray-700/30"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  isCurrentTier
                                    ? "bg-orange-500"
                                    : "bg-gray-500"
                                }`}
                              ></div>
                              <div>
                                <div
                                  className={`text-sm font-medium ${
                                    isCurrentTier
                                      ? "text-orange-400"
                                      : "text-white"
                                  }`}
                                >
                                  {tier.tier}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Ratio ≥ {(tier.min * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            <div
                              className={`text-right ${
                                isCurrentTier
                                  ? "text-orange-400"
                                  : "text-gray-300"
                              }`}
                            >
                              <div className="font-medium">
                                ${tier.reward}.0¢
                              </div>
                              <div className="text-xs text-gray-400">
                                per token
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>
                          • Current ratio:{" "}
                          {formatPercentage(collateralRatio, 1)}
                        </div>
                        <div>
                          • Your potential weekly reward:{" "}
                          {userBalance > 0
                            ? `$${(userBalance * weeklyReward).toFixed(2)}`
                            : "$0.00"}
                        </div>
                        <div>• Rewards distributed via Merkle proof system</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Reward Claim Preview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Weekly Rewards Available
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Your potential rewards from the Merkle distribution system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userBalance > 0 ? (
                      <>
                        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">
                              Your BTC1USD Balance:
                            </span>
                            <span className="text-white font-medium">
                              {userBalance.toFixed(8)} BTC1USD
                            </span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">
                              Current Reward Rate:
                            </span>
                            <span className="text-green-400 font-medium">
                              {(weeklyReward * 100).toFixed(1)}¢ per token
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">
                              Potential Weekly Reward:
                            </span>
                            <span className="text-green-400 font-bold text-lg">
                              ${(userBalance * weeklyReward).toFixed(4)}
                              {/* Debug info - remove in production */}
                              {process.env.NODE_ENV === 'development' && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({userBalance.toFixed(2)} × ${weeklyReward})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => setActiveTab("merkle-claim")}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Claim Rewards
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              // Open test page in new tab for debugging
                              window.open("/test-claims", "_blank");
                            }}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            Test Claims
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setActiveTab(
                                isAdminUser
                                  ? "distribution-admin"
                                  : "merkle-claim"
                              )
                            }
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {isAdminUser ? "Admin Panel" : "View History"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>You need BTC1USD tokens to earn rewards</p>
                        <p className="text-sm mt-1">
                          Mint some tokens to start earning weekly rewards
                        </p>
                        <Button
                          onClick={() => setActiveTab("mint")}
                          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                          size="sm"
                        >
                          Buy BTC1USD
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Merkle Distribution Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Merkle Distribution System
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    How the decentralized reward distribution works
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="font-medium text-white mb-2">
                        Weekly Snapshot
                      </div>
                      <div className="text-sm text-gray-400">
                        Every Friday at 14:00 UTC, the protocol takes a snapshot
                        of all BTC1USD holders and their balances.
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="font-medium text-white mb-2">
                        Merkle Tree Generation
                      </div>
                      <div className="text-sm text-gray-400">
                        A Merkle tree is generated containing all eligible
                        addresses and their reward amounts based on the
                        collateral ratio.
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-6 h-6 text-purple-500" />
                      </div>
                      <div className="font-medium text-white mb-2">
                        Claim Rewards
                      </div>
                      <div className="text-sm text-gray-400">
                        Users can claim their rewards anytime using their Merkle
                        proof. Unclaimed rewards remain available indefinitely.
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-gray-700/30 rounded-lg p-4">
                    <div className="text-sm text-gray-300 space-y-2">
                      <div className="font-medium">
                        Distribution Fees (added to total supply):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>• Merkle Distributor: 0.03¢ per token</div>
                        <div>• Development Fund: 0.10¢ per token</div>
                        <div>• Endowment Fund: 0.01¢ per token</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "mint" && (
            <div className="space-y-6">
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 p-8">
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Buy & Sell BTC1
                  </h2>
                  <p className="text-orange-100 text-lg">
                    Deposit collateral to buy coins or sell them back for
                    BTC
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mint BTC1USD */}
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                          Buy BTC1
                        </CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          Deposit BTC collateral to buy coins
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Collateral Selection - Moved to top */}
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Select Collateral Token
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {["WBTC", "cbBTC", "tBTC"].map((token) => {
                          const balance = parseFloat(
                            token === "WBTC"
                              ? userWbtcBalance
                              : token === "cbBTC"
                              ? userCbbtcBalance
                              : userTbtcBalance
                          );
                          return (
                            <button
                              key={token}
                              onClick={() => setSelectedCollateral(token)}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                selectedCollateral === token
                                  ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                                  : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                              }`}
                            >
                              <div className="text-center">
                                <div
                                  className={`font-bold text-lg ${
                                    selectedCollateral === token
                                      ? "text-green-400"
                                      : "text-white"
                                  }`}
                                >
                                  {token}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {balance.toFixed(4)}
                                </div>
                              </div>
                              {selectedCollateral === token && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label
                          htmlFor="mint-amount"
                          className="text-gray-300 text-sm font-medium"
                        >
                          Amount to Deposit
                        </Label>
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                          Balance:{" "}
                          {parseFloat(
                            selectedCollateral === "WBTC"
                              ? userWbtcBalance
                              : selectedCollateral === "cbBTC"
                              ? userCbbtcBalance
                              : userTbtcBalance
                          ).toFixed(8)}{" "}
                          {selectedCollateral}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="mint-amount"
                          type="number"
                          placeholder="0.00000000"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          className="bg-gray-700/50 border-2 border-gray-600 focus:border-green-500 text-white text-2xl font-bold placeholder:text-gray-500 pr-24 h-16 rounded-xl"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-400 font-semibold">
                            {selectedCollateral}
                          </span>
                        </div>
                      </div>

                      {/* Quick amount buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {[0.001, 0.01, 0.1, 1].map((amount) => {
                          const userCollateral = parseFloat(
                            selectedCollateral === "WBTC"
                              ? userWbtcBalance
                              : selectedCollateral === "cbBTC"
                              ? userCbbtcBalance
                              : userTbtcBalance
                          );
                          const available = amount <= userCollateral;
                          return (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              className={`text-xs font-semibold rounded-lg h-10 ${
                                available
                                  ? "border-gray-600 text-gray-300 hover:bg-green-500/20 hover:border-green-500 hover:text-green-400 transition-all"
                                  : "border-gray-700 text-gray-600 cursor-not-allowed opacity-50"
                              }`}
                              disabled={!available}
                              onClick={() =>
                                available && setMintAmount(amount.toString())
                              }
                            >
                              {amount}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Real-time Mint Calculations */}
                    {mintAmount &&
                      parseFloat(mintAmount) > 0 &&
                      (() => {
                        const btcAmount = parseFloat(mintAmount);
                        if (isNaN(btcAmount) || btcAmount <= 0) return null;

                        const calc = calculateMintDetails(btcAmount);

                        // Validation checks - check balance based on selected collateral
                        const userCollateralBalance = parseFloat(
                          selectedCollateral === "WBTC"
                            ? userWbtcBalance
                            : selectedCollateral === "cbBTC"
                            ? userCbbtcBalance
                            : userTbtcBalance
                        );
                        const hasValidationErrors = [
                          {
                            condition: btcAmount > userCollateralBalance,
                            message: `Insufficient ${selectedCollateral} balance (${userCollateralBalance.toFixed(
                              8
                            )} available)`,
                          },
                        ].filter((error) => error.condition);

                        return (
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-base font-semibold text-green-400">
                                Preview
                              </div>
                              {hasValidationErrors.length === 0 && (
                                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                                  Ready to Mint
                                </div>
                              )}
                            </div>

                            {/* Validation Errors */}
                            {hasValidationErrors.length > 0 && (
                              <div className="space-y-1">
                                {hasValidationErrors.map((error, index) => (
                                  <div
                                    key={index}
                                    className="bg-red-900/30 border border-red-500/50 rounded-lg p-3"
                                  >
                                    <div className="text-red-400 text-sm font-medium">
                                      ⚠️ {error.message}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs mb-1">
                                    You Will Receive
                                  </div>
                                  <div className="text-3xl font-bold text-green-400">
                                    {calc.userReceives.toFixed(4)}
                                  </div>
                                  <div className="text-gray-400 text-sm mt-1">
                                    BTC1USD
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">
                                    USD Value:
                                  </span>
                                  <span className="text-white font-semibold">
                                    {formatCurrency(calc.usdValue)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">
                                    Mint Price:
                                  </span>
                                  <span className="text-white font-semibold">
                                    {formatCurrency(calc.mintPrice)}
                                  </span>
                                </div>
                                <div className="border-t border-gray-600/50 pt-2">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Dev Fee (1%):</span>
                                    <span>{calc.devFee.toFixed(6)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Endowment (0.1%):</span>
                                    <span>{calc.endowmentFee.toFixed(6)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="pt-2">
                      <Button
                        onClick={handleMint}
                        disabled={
                          !isConnected ||
                          !mintAmount ||
                          (isPending &&
                            (pendingTransactionType === "approve" ||
                              pendingTransactionType === "mint")) ||
                          (isConfirming && pendingTransactionType === "mint")
                        }
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {(isPending &&
                          (pendingTransactionType === "approve" ||
                            pendingTransactionType === "mint")) ||
                        (isConfirming && pendingTransactionType === "mint") ? (
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-semibold">
                              {isPending ? "Confirm in wallet..." : "Buying..."}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Buy BTC1USD</span>
                          </div>
                        )}
                      </Button>
                    </div>

                    {/* Progress indicator */}
                    {mintingStep !== "idle" && (
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">
                            Progress
                          </span>
                          <span className="text-sm text-gray-400">
                            {mintingStep === "approving"
                              ? "Step 1 of 2"
                              : mintingStep === "minting"
                              ? "Step 2 of 2"
                              : ""}
                          </span>
                        </div>
                        <Progress
                          value={
                            mintingStep === "approving"
                              ? 50
                              : mintingStep === "minting"
                              ? 100
                              : 0
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Approve Vault</span>
                          <span>Buy BTC1USD</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Redeem BTC1USD */}
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </div>
                          Sell BTC1
                        </CardTitle>
                        <CardDescription className="text-gray-400 mt-2">
                          Sell coins to receive BTC collateral
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Redeem Collateral Selection - Moved to top */}
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">
                        Receive Collateral
                      </Label>
                      <div className="grid grid-cols-3 gap-3">
                        {["WBTC", "cbBTC", "tBTC"].map((token) => {
                          const vaultBalance =
                            token === "WBTC"
                              ? vaultWbtcBalance
                                ? parseFloat(formatUnits(vaultWbtcBalance as unknown as bigint, 8))
                                : 0
                              : token === "cbBTC"
                              ? vaultCbbtcBalance
                                ? parseFloat(formatUnits(vaultCbbtcBalance as unknown as bigint, 8))
                                : 0
                              : vaultTbtcBalance
                              ? parseFloat(formatUnits(vaultTbtcBalance as unknown as bigint, 8))
                              : 0;

                          return (
                            <button
                              key={token}
                              onClick={() => setSelectedRedeemCollateral(token)}
                              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                                selectedRedeemCollateral === token
                                  ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                                  : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
                              }`}
                            >
                              <div className="text-center">
                                <div
                                  className={`font-bold text-lg ${
                                    selectedRedeemCollateral === token
                                      ? "text-orange-400"
                                      : "text-white"
                                  }`}
                                >
                                  {token}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Available: {vaultBalance.toFixed(4)}
                                </div>
                              </div>
                              {selectedRedeemCollateral === token && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label
                          htmlFor="redeem-amount"
                          className="text-gray-300 text-sm font-medium"
                        >
                          Amount to Sell
                        </Label>
                        <span className="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
                          Balance: {userBalance.toFixed(8)} BTC1USD
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          id="redeem-amount"
                          type="number"
                          placeholder="0.00000000"
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          className="bg-gray-700/50 border-2 border-gray-600 focus:border-orange-500 text-white text-2xl font-bold placeholder:text-gray-500 pr-32 h-16 rounded-xl"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-400 font-semibold">
                            BTC1USD
                          </span>
                        </div>
                      </div>

                      {/* Quick amount buttons */}
                      <div className="grid grid-cols-6 gap-2">
                        {[0.001, 0.01, 0.1, "25%", "50%", "100%"].map(
                          (amount, index) => {
                            let actualAmount: number;
                            let label: string;

                            if (typeof amount === "string") {
                              const percentage = parseFloat(amount) / 100;
                              actualAmount = userBalance * percentage;
                              label = amount;
                            } else {
                              actualAmount = amount;
                              label = `${amount}`;
                            }

                            const available =
                              actualAmount <= userBalance && actualAmount > 0;

                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className={`text-xs font-semibold rounded-lg h-10 ${
                                  available
                                    ? "border-gray-600 text-gray-300 hover:bg-orange-500/20 hover:border-orange-500 hover:text-orange-400 transition-all"
                                    : "border-gray-700 text-gray-600 cursor-not-allowed opacity-50"
                                }`}
                                disabled={!available}
                                onClick={() =>
                                  available &&
                                  setRedeemAmount(actualAmount.toFixed(8))
                                }
                              >
                                {label}
                              </Button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Real-time Redeem Calculations */}
                    {redeemAmount &&
                      parseFloat(redeemAmount) > 0 &&
                      (() => {
                        const tokenAmount = parseFloat(redeemAmount);
                        if (isNaN(tokenAmount) || tokenAmount <= 0) return null;

                        const calc = calculateRedeemDetails(tokenAmount);

                        // Validation checks
                        const hasValidationErrors = [
                          {
                            condition: tokenAmount > userBalance,
                            message: `Insufficient BTC1USD balance (${userBalance.toFixed(
                              8
                            )} available)`,
                          },
                        ].filter((error) => error.condition);

                        return (
                          <div
                            className={`rounded-xl p-5 space-y-4 ${
                              calc.isStressMode
                                ? "bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30"
                                : "bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-base font-semibold text-orange-400">
                                Preview
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  calc.isStressMode
                                    ? "bg-red-500/20 text-red-400"
                                    : hasValidationErrors.length === 0
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {calc.isStressMode
                                  ? "⚠️ Stress Mode"
                                  : calc.redemptionMode}
                              </div>
                            </div>

                            {/* Validation Errors */}
                            {hasValidationErrors.length > 0 && (
                              <div className="space-y-1">
                                {hasValidationErrors.map((error, index) => (
                                  <div
                                    key={index}
                                    className="bg-red-900/30 border border-red-500/50 rounded-lg p-3"
                                  >
                                    <div className="text-red-400 text-sm font-medium">
                                      ⚠️ {error.message}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {calc.isStressMode && (
                              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                                <div className="text-red-400 text-sm font-semibold">
                                  ⚠️ Protocol in Stress Mode
                                </div>
                                <div className="text-red-300 text-xs mt-1">
                                  Receiving{" "}
                                  {(calc.effectivePrice * 100).toFixed(1)}% of
                                  face value
                                </div>
                              </div>
                            )}

                            <div className="space-y-3">
                              <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs mb-1">
                                    You Will Receive
                                  </div>
                                  <div className="text-3xl font-bold text-orange-400">
                                    {calc.btcToReceive.toFixed(4)}
                                  </div>
                                  <div className="text-gray-400 text-sm mt-1">
                                    {selectedRedeemCollateral}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">
                                    USD Value:
                                  </span>
                                  <span className="text-white font-semibold">
                                    {formatCurrency(calc.usdValue)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">
                                    Effective Price:
                                  </span>
                                  <span className="text-white font-semibold">
                                    {formatCurrency(calc.effectivePrice)}
                                  </span>
                                </div>
                                <div className="border-t border-gray-600/50 pt-2">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Dev Fee (0.1%):</span>
                                    <span>{calc.devFee.toFixed(6)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Efficiency:</span>
                                    <span
                                      className={
                                        calc.effectivePrice >= 0.95
                                          ? "text-green-400"
                                          : calc.effectivePrice >= 0.85
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {(calc.effectivePrice * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="pt-2">
                      <Button
                        onClick={handleRedeem}
                        disabled={
                          !isConnected ||
                          !redeemAmount ||
                          (isPending && pendingTransactionType === "redeem") ||
                          (isConfirming && pendingTransactionType === "redeem")
                        }
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {(isPending && pendingTransactionType === "redeem") ||
                        (isConfirming &&
                          pendingTransactionType === "redeem") ? (
                          <div className="flex items-center justify-center space-x-3">
                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-semibold">
                              {isPending
                                ? "Confirm in wallet..."
                                : "Selling..."}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                            <span>Sell BTC1USD</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Single Transaction Status Message - Visible to both Buy and Sell */}
              {transactionStatus && (
                <Alert
                  className={`${
                    transactionStatus.includes("success") ||
                    transactionStatus.includes("Success") ||
                    transactionStatus.includes("completed")
                      ? "bg-green-900/20 border-green-500/30"
                      : transactionStatus.includes("cancelled") ||
                        transactionStatus.includes("Cancelled") ||
                        transactionStatus.includes("failed") ||
                        transactionStatus.includes("Failed") ||
                        transactionStatus.includes("error") ||
                        transactionStatus.includes("Error")
                      ? "bg-red-900/20 border-red-500/30"
                      : "bg-blue-900/20 border-blue-500/30"
                  }`}
                >
                  <AlertCircle
                    className={`h-4 w-4 ${
                      transactionStatus.includes("success") ||
                      transactionStatus.includes("Success") ||
                      transactionStatus.includes("completed")
                        ? "text-green-400"
                        : transactionStatus.includes("cancelled") ||
                          transactionStatus.includes("Cancelled") ||
                          transactionStatus.includes("failed") ||
                          transactionStatus.includes("Failed") ||
                          transactionStatus.includes("error") ||
                          transactionStatus.includes("Error")
                        ? "text-red-400"
                        : "text-blue-400"
                    }`}
                  />
                  <AlertDescription className="text-gray-200 font-medium">
                    {transactionStatus}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {activeTab === "wbtc-mint" && isAdminUser && (
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    Collateral Minting (Admin Only)
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Mint collateral tokens for testing purposes - Admin access
                    required
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-400 text-sm font-medium">
                        Admin Information
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      Current user:{" "}
                      {address
                        ? `${address.slice(0, 6)}...${address.slice(-4)}`
                        : "Not connected"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Expected admin: 0xf39Fd...92266 (from deployment)
                    </p>
                  </div>

                  {/* Collateral Type Selector */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Select Collateral Type
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["WBTC", "cbBTC", "tBTC"].map((token) => (
                        <Button
                          key={token}
                          variant={
                            selectedMintCollateral === token
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedMintCollateral(token)}
                          className={
                            selectedMintCollateral === token
                              ? "bg-orange-500 hover:bg-orange-600"
                              : "border-gray-600 text-gray-300 hover:bg-gray-600"
                          }
                        >
                          {token}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="collateral-mint-amount"
                      className="text-gray-300"
                    >
                      {selectedMintCollateral} Amount to Mint
                    </Label>
                    <div className="relative">
                      <Input
                        id="collateral-mint-amount"
                        type="number"
                        placeholder="10.0"
                        value={wbtcMintAmount}
                        onChange={(e) => setWbtcMintAmount(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 pr-20"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-400 text-sm">
                          {selectedMintCollateral}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Mint {selectedMintCollateral} tokens for testing
                    </p>
                  </div>

                  {/* Quick amount buttons */}
                  <div className="flex gap-2">
                    {[1, 5, 10, 50].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-600"
                        onClick={() => setWbtcMintAmount(amount.toString())}
                      >
                        {amount} {selectedMintCollateral}
                      </Button>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleWbtcMint}
                      disabled={
                        !isConnected ||
                        !wbtcMintAmount ||
                        isPending ||
                        isConfirming
                      }
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isPending || isConfirming ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>
                            {isPending
                              ? "Confirming in wallet..."
                              : "Processing transaction..."}
                          </span>
                        </div>
                      ) : (
                        `Mint ${selectedMintCollateral} (Admin Only)`
                      )}
                    </Button>
                  </div>

                  {/* Status and Progress */}
                  {transactionStatus && (
                    <Alert
                      className={`${
                        transactionStatus.includes("Error")
                          ? "bg-red-900/20 border-red-500/30"
                          : transactionStatus.includes("successful")
                          ? "bg-green-900/20 border-green-500/30"
                          : "bg-gray-700 border-gray-600"
                      }`}
                    >
                      <AlertCircle
                        className={`h-4 w-4 ${
                          transactionStatus.includes("Error")
                            ? "text-red-500"
                            : transactionStatus.includes("successful")
                            ? "text-green-500"
                            : "text-orange-500"
                        }`}
                      />
                      <AlertDescription
                        className={`${
                          transactionStatus.includes("Error")
                            ? "text-red-300"
                            : transactionStatus.includes("successful")
                            ? "text-green-300"
                            : "text-gray-300"
                        }`}
                      >
                        {transactionStatus}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Alternative script method */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="bg-gray-700/50 rounded p-3">
                      <div className="text-sm font-medium text-gray-300 mb-2">
                        Alternative: Use Script
                      </div>
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 block">
                        npx hardhat run scripts/mint-wbtc-for-testing.js
                        --network localhost
                      </code>
                      <p className="text-xs text-gray-500 mt-2">
                        The script will mint 10 WBTC to the second account (user
                        account) for testing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <AnalyticsDashboard
              btcPrice={protocolState.btcPrice}
              collateralRatio={collateralRatio}
              totalSupply={protocolState.totalSupply}
            />
          )}
          {activeTab === "merkle-claim" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Claim Your Rewards
                </h2>
                <p className="text-gray-400">
                  Claim your weekly BTC1USD rewards from multiple distributions
                </p>
              </div>
              <EnhancedMerkleClaim />
            </div>
          )}
          {activeTab === "distribution-admin" && isAdminUser && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Distribution Administration
                </h2>
                <p className="text-gray-400">
                  Manage weekly distributions and merkle tree operations
                </p>
              </div>
              <DistributionAdmin
                collateralRatio={collateralRatio}
                totalSupply={protocolState.totalSupply}
              />
            </div>
          )}
          {activeTab === "governance" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Vote
                </h2>
                <p className="text-gray-400">
                  Comprehensive protocol governance, parameter management, and
                  endowment control
                </p>
              </div>
              <UnifiedGovernanceDashboard
                isAdmin={!!isAdminUser}
                userBalance={userBalance}
              />
            </div>
          )}
          {activeTab === "security" && isAdminUser && (
            <SecurityMonitoring
              isAdmin={!!isAdminUser}
              collateralRatio={collateralRatio}
            />
          )}
          {activeTab === "treasury" && isAdminUser && (
            <TreasuryDashboard isAdmin={!!isAdminUser} />
          )}

        </main>
      </div>
    </div>
  );
}

export default Dashboard;

// This script can be run in the browser console to help users claim their rewards
// It provides a simple interface for claiming rewards

async function claimUserRewards() {
    console.log("🚀 Starting user reward claim process...");
    
    try {
        // Check if wallet is connected
        if (!window.ethereum) {
            console.error("❌ MetaMask or compatible wallet not found!");
            alert("Please install MetaMask or use a compatible wallet browser.");
            return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        console.log(`👤 Connected wallet: ${userAddress}`);
        
        // Fetch distribution data
        console.log("📥 Fetching distribution data...");
        const response = await fetch('/api/merkle-distributions/latest');
        if (!response.ok) {
            throw new Error(`Failed to fetch distribution data: ${response.status}`);
        }
        
        const distributionData = await response.json();
        console.log("✅ Distribution data loaded");
        
        // Check if user has a claim
        const userClaim = distributionData.claims[userAddress];
        if (!userClaim) {
            console.log(`❌ No rewards available for ${userAddress}`);
            alert(`No rewards available for your address in the current distribution.`);
            return;
        }
        
        console.log(`🎉 Found claim for ${userAddress}`);
        console.log(`💰 Amount: ${userClaim.amount} tokens`);
        
        // Check if already claimed
        console.log("🔍 Checking claim status...");
        const contractAddress = process.env.NEXT_PUBLIC_MERKLE_DISTRIBUTOR_CONTRACT;
        if (!contractAddress) {
            throw new Error("Merkle distributor contract address not configured");
        }
        
        // This would normally use wagmi or ethers.js, but for browser console:
        console.log("⚠️  Please use the UI to claim your rewards or connect via the dApp interface.");
        console.log("💡 The claim button should be visible on the 'Claim Rewards' tab if you have pending rewards.");
        
        // Show user their claim details
        alert(`You have ${userClaim.amount} tokens available to claim!\nPlease click the 'Claim Reward' button on the Claim Rewards tab.`);
        
    } catch (error) {
        console.error("❌ Error during claim process:", error);
        alert(`Error: ${error.message}`);
    }
}

// Auto-run when script is loaded in browser
if (typeof window !== 'undefined') {
    console.log("💼 User Reward Claim Helper loaded");
    console.log("💡 Run claimUserRewards() in the console to start the claim process");
    
    // Add to window object for easy access
    window.claimUserRewards = claimUserRewards;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { claimUserRewards };
}
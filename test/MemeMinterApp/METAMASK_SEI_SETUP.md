# SEI Testnet MetaMask Configuration Guide

## ⚠️ Chain ID Mismatch Solution

If you're seeing the error "Chain ID returned by the custom network does not match the submitted chain ID", here's how to fix it:

### 🔧 Manual Network Configuration

Add SEI Testnet manually to MetaMask with these **exact** settings:

```
Network Name: Sei Testnet
New RPC URL: https://evm-rpc-testnet.sei-apis.com
Chain ID: 1328
Currency Symbol: SEI
Block Explorer URL: https://seitrace.com
```

### 🚀 Alternative RPC Endpoints

If the main RPC doesn't work, try these alternatives:

1. **Primary**: `https://evm-rpc-testnet.sei-apis.com`
2. **Alternative 1**: `https://evm-rpc.sei-apis.com`
3. **Alternative 2**: `https://sei-testnet-rpc.polkachu.com`

### 📋 Step-by-Step MetaMask Setup

1. **Open MetaMask** → Click network dropdown
2. **Add Network** → "Add a network manually"
3. **Enter Details**:
   - Network Name: `Sei Testnet`
   - RPC URL: `https://evm-rpc-testnet.sei-apis.com`
   - Chain ID: `1328`
   - Currency Symbol: `SEI`
   - Block Explorer: `https://seitrace.com`
4. **Save** → Switch to the new network

### 🔍 Verification Steps

After adding the network:

1. **Check Chain ID**: Should show `1328` in MetaMask
2. **Test RPC**: Try viewing account balance
3. **Verify Explorer**: Block explorer links should work
4. **Test Transaction**: Try a small test transaction

### 🛠️ Common Issues & Solutions

#### Issue 1: "Token symbol doesn't match"
- **Solution**: This is normal for testnet. The SEI symbol is correct.
- **Action**: Click "Continue" to proceed

#### Issue 2: "Network not recognized"
- **Solution**: This is expected for custom testnets
- **Action**: Verify the details and proceed

#### Issue 3: Chain ID mismatch
- **Solution**: Use Chain ID `1328` exactly
- **Alternative**: Try Chain ID `713715` if 1328 fails

#### Issue 4: RPC endpoint fails
- **Solution**: Try alternative RPC URLs listed above
- **Check**: Network connectivity and firewall settings

### 🎯 App Integration

The PixelMeme app will:
1. **Auto-detect** if you're on wrong network
2. **Prompt switch** to SEI testnet
3. **Auto-add** the network if missing
4. **Fallback** to manual instructions if auto-add fails

### 🔄 Network Switching Process

The app tries these steps in order:
1. Switch to Chain ID `1328` (primary)
2. Switch to Chain ID `713715` (alternative)
3. Switch to Chain ID `504` (legacy)
4. Add network manually with Chain ID `1328`
5. Show manual setup instructions

### 📞 Need Help?

If you still encounter issues:

1. **Clear MetaMask cache**: Settings → Advanced → Reset Account
2. **Try different browser**: Sometimes browser extensions conflict
3. **Check RPC status**: Verify RPC endpoint is online
4. **Use different wallet**: Try Compass or other SEI-compatible wallets

### ✅ Success Indicators

You'll know it's working when:
- MetaMask shows "Sei Testnet" in network dropdown
- Chain ID displays as `1328`
- You can see your SEI balance
- Transactions show on https://seitrace.com
- The PixelMeme app connects without errors

---

**Note**: SEI testnet configurations can vary. The app includes fallback support for multiple chain IDs to ensure compatibility across different SEI testnet setups.

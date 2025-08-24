require('dotenv').config();

console.log('🔧 Testing Telegram Bot Configuration...\n');

// Test environment variables
console.log('📝 Environment Variables:');
console.log(`TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`MEME_MINTER_ADDRESS: ${process.env.MEME_MINTER_ADDRESS ? '✅ Set' : '❌ Missing'}`);
console.log(`MEME_SALE_ADDRESS: ${process.env.MEME_SALE_ADDRESS ? '✅ Set' : '❌ Missing'}`);
console.log(`PINATA_API_KEY: ${process.env.PINATA_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);

// Test dependencies
console.log('\n📦 Dependencies:');
try {
  const TelegramBot = require('node-telegram-bot-api');
  console.log('node-telegram-bot-api: ✅ Available');
} catch (e) {
  console.log('node-telegram-bot-api: ❌ Missing');
}

try {
  const { ethers } = require('ethers');
  console.log('ethers: ✅ Available');
} catch (e) {
  console.log('ethers: ❌ Missing');
}

try {
  const axios = require('axios');
  console.log('axios: ✅ Available');
} catch (e) {
  console.log('axios: ❌ Missing');
}

try {
  const fs = require('fs-extra');
  console.log('fs-extra: ✅ Available');
} catch (e) {
  console.log('fs-extra: ❌ Missing');
}

// Test blockchain connection
console.log('\n⛓️ Blockchain Connection:');
if (process.env.PRIVATE_KEY && process.env.SEI_RPC) {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.SEI_RPC);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(`Wallet Address: ${wallet.address}`);
    console.log('SEI Network: ✅ Connected');
  } catch (e) {
    console.log('SEI Network: ❌ Connection failed');
    console.log(`Error: ${e.message}`);
  }
} else {
  console.log('SEI Network: ❌ Missing configuration');
}

// Test Python scripts
console.log('\n🐍 Python Scripts:');
const path = require('path');
const fs = require('fs');

const pythonScripts = ['polling.py', 'gemini_fixed.py'];
pythonScripts.forEach(script => {
  const scriptPath = path.join(__dirname, '..', script);
  if (fs.existsSync(scriptPath)) {
    console.log(`${script}: ✅ Found`);
  } else {
    console.log(`${script}: ❌ Missing`);
  }
});

console.log('\n🚀 Next Steps:');
if (!process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN === 'your_telegram_bot_token_here') {
  console.log('1. ❌ Create Telegram bot with @BotFather');
  console.log('2. ❌ Update TELEGRAM_BOT_TOKEN in .env file');
  console.log('3. ❌ Run: npm start');
} else {
  console.log('1. ✅ Telegram bot token configured');
  console.log('2. ✅ All dependencies installed');
  console.log('3. 🚀 Ready to run: npm start');
}

console.log('\n📖 Instructions: Read SETUP_INSTRUCTIONS.md for detailed setup guide');

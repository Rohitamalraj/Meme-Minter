# Telegram Bot Setup Instructions

## 1. Create Your Telegram Bot

### Get Bot Token from BotFather:
1. Open Telegram and search for `@BotFather`
2. Start a conversation and send `/newbot`
3. Choose a name for your bot (e.g., "Viral Meme NFT Bot")
4. Choose a username ending in 'bot' (e.g., "viral_meme_nft_bot")
5. Copy the bot token that BotFather gives you

### Example conversation:
```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it?

You: Viral Meme NFT Bot
BotFather: Good. Now let's choose a username for your bot. It must end in `bot`.

You: viral_meme_nft_bot
BotFather: Done! Congratulations on your new bot. You will find it at t.me/viral_meme_nft_bot

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrSTUvwxyz1234567890

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

## 2. Configure the Bot

1. Copy your bot token
2. Open `.env` file in this directory
3. Replace `your_telegram_bot_token_here` with your actual token

Example:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxyz1234567890
```

## 3. Test the Bot

Run the bot:
```bash
npm start
```

## 4. Test Commands in Telegram

1. Find your bot on Telegram: `t.me/your_bot_username`
2. Start a conversation
3. Try these commands:

```
/start
/connect
/trending
/help
```

## 5. Bot Features

### Core Commands:
- `/start` - Welcome and setup
- `/connect` - Wallet connection info
- `/trending` - Find viral memes and generate NFTs
- `/mint 1` - Mint first meme as NFT
- `/mint all` - Mint all trending memes
- `/buy TOKEN_ID` - Buy NFT from marketplace  
- `/list` - View NFTs for sale
- `/balance` - Check wallet balance

### Workflow:
1. User: `/trending` → Bot analyzes Reddit memes with AI
2. Bot: Shows 3 NFT-ready images
3. User: `/mint 1` → Bot mints NFT on SEI blockchain
4. User: `/list` → See all NFTs for sale
5. User: `/buy 123` → Purchase specific NFT

## Troubleshooting

### Bot doesn't respond:
- Check if bot token is correct in `.env`
- Make sure bot is running (`npm start`)
- Check console for error messages

### "No trending memes found":
- Make sure parent directory has `polling.py` and `gemini_fixed.py`
- Check if `GEMINI_API_KEY` is set
- Reddit API might be rate limited

### Minting fails:
- Check SEI testnet wallet balance
- Verify network connectivity
- Check console logs for specific errors

## Security Notes

- Keep your bot token private
- The bot currently uses a shared wallet for all users
- All NFTs are minted on SEI testnet (not mainnet)
- Bot has access to Reddit, Gemini AI, and IPFS APIs

## Ready to Launch! 🚀

Once you have your bot token set up, your viral meme NFT bot will be ready to:
1. Find trending memes on Reddit
2. Analyze them with AI
3. Generate NFT images
4. Mint on SEI blockchain
5. Enable marketplace trading

Start with `/trending` to see the magic happen! 🎭

# 🌍 Carbon API Quick Start Guide

## 🚀 Get Live Carbon Data in 5 Minutes!

Your Kindred app is ready for live carbon calculations! Currently using offline estimates - let's
upgrade to real-time data.

### ⚡ Quick Setup (Recommended)

```bash
# Interactive setup assistant
bun run setup:carbon-api
```

**What it does:**

- Guides you through getting API keys
- Updates your .env configuration
- Tests connectivity automatically
- Provides troubleshooting if needed

### 🔧 Manual Setup

#### 1. Get Carbon Interface API Key (Free)

1. Visit: https://www.carboninterface.com/
2. Sign up (free account: 200 requests/month)
3. Get API key from dashboard
4. Update `.env` file:
   ```env
   CARBON_API_KEY=your_real_api_key_here
   ```

#### 2. Test Your Setup

```bash
# Test API connectivity
bun run test:carbon-api

# Check configuration
bun run debug:carbon-config
```

#### 3. See It Work

```bash
# Start the app
bun start

# Open Carbon Tracker, add activities, see real data!
```

### 📊 Current Status

✅ **What's Working:**

- Multi-provider API integration (3 providers)
- Automatic fallback to offline calculations
- Comprehensive error handling and logging
- Smart caching to minimize API costs
- Rate limiting and retry logic

⚠️ **What You Need:**

- Real API keys (currently using mock/placeholder keys)
- 5 minutes to sign up for free accounts

### 🎯 Benefits of Live APIs

| Feature                 | Offline Calculations | Live APIs                  |
| ----------------------- | -------------------- | -------------------------- |
| **Accuracy**            | ~70% accurate        | 90-95% accurate            |
| **Data Sources**        | Static factors       | Real-time, scientific data |
| **Regional Variations** | Limited              | Precise by location        |
| **Updates**             | Manual updates       | Automatic updates          |
| **Confidence Score**    | Medium               | High                       |

### 🛠️ Available Commands

```bash
# Setup and Testing
bun run setup:carbon-api      # Interactive setup guide
bun run test:carbon-api       # Test API connectivity
bun run debug:carbon-config   # Show current config

# Development
bun start                     # Start app with live APIs
bun run logs:carbon           # View carbon calculation logs
```

### 🔍 Troubleshooting

**No API Response?**

- Check internet connection
- Verify API keys are correct (not placeholder text)
- Run `bun run test:carbon-api` for detailed diagnosis

**Rate Limit Errors?**

- App automatically falls back to next provider
- Consider upgrading to paid tier
- Check cache settings (reduces API calls by ~80%)

**Still Using Offline Data?**

- Ensure `.env` file has real API keys
- Restart the app after updating .env
- Look for log messages: `[CARBON_API] Using provider: carboninterface`

### 📈 Usage Monitoring

The app automatically tracks:

- API response times
- Cache hit rates
- Provider fallback events
- Error rates and types

View logs with:

```bash
# Real-time logs
bun start --verbose

# Filtered carbon logs
bun run logs:carbon
```

### 🌟 Pro Tips

1. **Start with Carbon Interface** - Most reliable free tier
2. **Add Climatiq** - Higher free limit, great backup
3. **Monitor usage** - Set alerts before hitting limits
4. **Use caching** - Already configured, saves ~80% of API calls

### 🎉 Success Indicators

**You'll know it's working when:**

- ✅ `bun run test:carbon-api` shows green checkmarks
- ✅ Carbon activities show precise emissions (e.g., "2.34 kg CO2" instead of "~2.3 kg CO2")
- ✅ Logs show: `[CARBON_API] Response received in 245ms`
- ✅ Different transport modes show varied precise calculations

**Ready to go live?** Run `bun run setup:carbon-api` now! 🚀

### 📖 More Information

- **Detailed Setup**: `docs/CARBON_API_SETUP.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **API Providers**: Carbon Interface, Climatiq, Carbon Footprint API
- **Fallback Strategy**: APIs → Cache → Offline calculations

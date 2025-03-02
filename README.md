# CryptoBot - AI-Powered Crypto Trading App

CryptoBot is a mobile application that uses AI to automate cryptocurrency trading. It integrates with Coinbase for authentication and trading, and uses on-device machine learning for price predictions and trading decisions.

## Features

- **User Authentication**: Secure login via Coinbase OAuth
- **Portfolio Management**: Track your crypto assets and performance
- **AI-Powered Trading**: Automated trading based on price predictions and sentiment analysis
- **News Analysis**: Sentiment analysis of crypto news to inform trading decisions
- **Customizable Settings**: Adjust risk levels and trading preferences

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- React Navigation

### Backend (On-Device)
- Python via Pyodide
- TensorFlow Lite for ML models
- Scikit-learn for data processing

### Storage
- MMKV for fast key-value storage
- EncryptedStorage for secure API keys
- AsyncStorage for general app data

### External APIs
- Coinbase API for authentication and trading
- News API for crypto news

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- pnpm
- Expo CLI
- Python 3.8+ (for model development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-trading-bot.git
cd crypto-trading-bot
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory with your API keys:
```
COINBASE_CLIENT_ID=your_coinbase_client_id
COINBASE_CLIENT_SECRET=your_coinbase_client_secret
NEWS_API_KEY=your_news_api_key
```

4. Start the development server:
```bash
pnpm start
```

5. Run on iOS or Android:
```bash
pnpm ios
# or
pnpm android
```

## Project Structure

```
crypto-trading-bot/
├── app/                  # React Native application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── screens/      # App screens
│   │   ├── services/     # API and business logic
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript type definitions
│   ├── assets/           # Images, fonts, etc.
│   └── python/           # Python code for ML models
│       ├── models/       # ML model definitions
│       ├── services/     # Python services
│       └── utils/        # Python utility functions
├── .env                  # Environment variables (not in git)
└── README.md             # Project documentation
```

## Development

### Adding a New Cryptocurrency

1. Update the `CRYPTO_KEYWORDS` object in `app/src/services/news.ts`
2. Train a model for the new cryptocurrency (optional)
3. Add the cryptocurrency to the default list in `getDefaultSettings()`

### Training ML Models

1. Navigate to the Python scripts directory:
```bash
cd app/python/scripts
```

2. Run the training script:
```bash
python train_model.py --symbol BTC --data_path ../../data/btc_historical.csv
```

3. The trained model will be saved to `app/python/models/saved/`

## License

MIT

## Disclaimer

This application is for educational purposes only. Cryptocurrency trading involves significant risk. Always do your own research before making investment decisions.
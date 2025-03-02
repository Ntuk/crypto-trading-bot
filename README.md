# Crypto Trading Bot

A mobile application built with React Native and Expo that allows users to monitor cryptocurrency prices, execute trades, and set up automated trading strategies with AI-powered price predictions.

## Features

- **Real-time Cryptocurrency Data**: Monitor prices, trends, and market movements for popular cryptocurrencies.
- **Coinbase Integration**: Connect to your Coinbase account to view balances and execute trades.
- **AI-Powered Trading**: Leverage machine learning models for price predictions and trading signals.
- **Automated Trading Bot**: Set up a bot to execute trades automatically based on your risk preferences and AI predictions.
- **News Sentiment Analysis**: Analyze cryptocurrency news sentiment to inform trading decisions.
- **Push Notifications**: Receive alerts for price movements, trading signals, and executed trades.
- **Portfolio Tracking**: Monitor your cryptocurrency holdings and performance over time.
- **Customizable Settings**: Configure risk levels, trading amounts, and notification preferences.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- pnpm (v6 or later)
- Expo CLI
- Coinbase account with API keys

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/crypto-trading-bot.git
   cd crypto-trading-bot
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Set up the Expo structure:
   ```
   pnpm run setup
   ```

4. Start the development server:
   ```
   pnpm start
   ```

5. Open the app on your device using the Expo Go app or run it in a simulator.

### Configuration

1. Create a Coinbase account and generate API keys with trading permissions.
2. In the app, navigate to Settings and enter your API keys.
3. Configure your risk level, trading amount, and other preferences.
4. Select cryptocurrencies to monitor and potentially trade.

## Architecture

The application is built with the following technologies:

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **TypeScript**: Type-safe JavaScript
- **Python Bridge**: Integration for running Python-based ML models
- **Coinbase API**: For account information and trading
- **Encrypted Storage**: For secure storage of API keys and user data

## Project Structure

```
crypto-trading-bot/
├── app.json             # Expo configuration
├── App.tsx              # Main application component
├── babel.config.js      # Babel configuration
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
├── src/
│   ├── components/      # Reusable UI components
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Application screens
│   ├── services/        # Business logic and API services
│   └── utils/           # Utility functions
├── assets/              # Images, fonts, and other static assets
└── python/              # Python scripts for ML models
```

## Security Considerations

- API keys are stored securely using encrypted storage.
- The app does not transmit your API keys to any third-party servers.
- Trading bot operations run locally on your device.

## Disclaimer

This application is for educational and informational purposes only. Cryptocurrency trading involves significant risk. Always do your own research before making investment decisions. The creators of this application are not responsible for any financial losses incurred while using this software.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Coinbase for providing the API
- Expo team for the excellent development platform
- Open source community for various libraries used in this project
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
- Yarn (v1.22 or later) - Install with `npm install -g yarn`
- Expo CLI - Install with `yarn global add expo-cli`

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/crypto-trading-bot.git
   cd crypto-trading-bot
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Start the development server:
   ```
   yarn start
   ```

4. Open the app on your device using the Expo Go app or run it in a simulator:
   - Scan the QR code with the Expo Go app on your phone
   - Press 'a' to open in an Android emulator
   - Press 'i' to open in an iOS simulator

### Running Locally

The app is currently set up with mock data for development purposes. When you run the app, you'll be automatically logged in to the dashboard where you can:

1. View mock cryptocurrency data
2. Navigate to the Trade screen
3. Adjust settings in the Settings screen
4. Test the trading bot functionality

No real trades will be executed as the app is using simulated data.

### Troubleshooting Common Issues

If you encounter the error about missing assets or AppEntry module:

1. Make sure the assets directory exists with required placeholder files:
   ```
   mkdir -p assets
   touch assets/icon.png assets/splash.png assets/adaptive-icon.png assets/favicon.png
   ```

2. If you see React Native version mismatch warnings, update the version in package.json:
   ```
   "react-native": "0.71.14"
   ```

3. Make sure you have an index.js file in the root directory (though this is not needed with Yarn):
   ```
   import { registerRootComponent } from 'expo';
   import App from './App';
   registerRootComponent(App);
   ```

4. If you still have issues, try cleaning the cache:
   ```
   yarn expo start -c
   ```

5. For persistent issues, try reinstalling dependencies:
   ```
   rm -rf node_modules
   yarn install
   ```

### Configuration

1. In a real deployment, you would create a Coinbase account and generate API keys with trading permissions.
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
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # Application screens
│   ├── services/        # Business logic and API services
│   └── types.ts         # TypeScript type definitions
├── assets/              # Images, fonts, and other static assets
```

## Security Considerations

- API keys are stored securely using encrypted storage.
- The app does not transmit your API keys to any third-party servers.
- Trading bot operations run locally on your device.

## Disclaimer

This application is for educational and informational purposes only. Cryptocurrency trading involves significant risk. Always do your own research before making investment decisions. The creators of this application are not responsible for any financial losses incurred while using this software.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

If you encounter any issues running the app:

1. Make sure all dependencies are installed correctly
2. Verify that you have the latest version of Expo CLI
3. Try clearing the Metro bundler cache: `expo start -c`
4. Check the console for any error messages
5. If you encounter issues with pnpm, try running `pnpm install --force` to force reinstallation of dependencies

## Acknowledgments

- Coinbase for providing the API
- Expo team for the excellent development platform
- Open source community for various libraries used in this project
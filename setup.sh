# Create Expo project with TypeScript template
npx create-expo-app@latest crypto-trading-bot --template expo-template-typescript

# Navigate to project directory
cd crypto-trading-bot

# Initialize pnpm
pnpm init

# Install core dependencies
pnpm add nativewind
pnpm add -D tailwindcss@3.3.2
pnpm add @react-navigation/native @react-navigation/native-stack
pnpm add react-native-encrypted-storage
pnpm add @coinbase/wallet-sdk
pnpm add react-native-mmkv
pnpm add @nozbe/watermelondb 
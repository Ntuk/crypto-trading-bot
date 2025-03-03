import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'crypto-trading-bot',
  slug: 'crypto-trading-bot',
  extra: {
    COINBASE_API_KEY: process.env.COINBASE_API_KEY,
    COINBASE_API_SECRET: process.env.COINBASE_API_SECRET,
  },
}); 
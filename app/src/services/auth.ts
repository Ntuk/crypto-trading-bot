import { CoinbaseWallet } from '@coinbase/wallet-sdk';
import { StorageService } from './storage';

const COINBASE_CLIENT_ID = 'YOUR_COINBASE_CLIENT_ID';
const COINBASE_REDIRECT_URI = 'cryptobot://oauth';

export class AuthService {
  private static wallet: CoinbaseWallet;

  static initialize() {
    this.wallet = new CoinbaseWallet({
      appName: 'CryptoBot',
      appLogoUrl: 'YOUR_APP_LOGO_URL',
      darkMode: true,
    });
  }

  static async login() {
    try {
      const authResult = await this.wallet.connect();
      if (authResult.accounts[0]) {
        await StorageService.saveApiKeys(
          authResult.accessToken,
          authResult.accounts[0]
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async logout() {
    try {
      await this.wallet.disconnect();
      await StorageService.clearApiKeys();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const credentials = await StorageService.getApiKeys();
      return !!credentials;
    } catch {
      return false;
    }
  }
} 
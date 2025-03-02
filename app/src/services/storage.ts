import { MMKV } from 'react-native-mmkv';
import EncryptedStorage from 'react-native-encrypted-storage';
import { UserSettings, TradeHistory } from '../types';

const storage = new MMKV();

export const StorageService = {
  // Secure storage for sensitive data
  async saveApiKeys(apiKey: string, apiSecret: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(
        'coinbase_credentials',
        JSON.stringify({
          apiKey,
          apiSecret,
        })
      );
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  },

  async getApiKeys(): Promise<{ apiKey: string; apiSecret: string } | null> {
    try {
      const credentials = await EncryptedStorage.getItem('coinbase_credentials');
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Error getting API keys:', error);
      return null;
    }
  },

  async clearApiKeys(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('coinbase_credentials');
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw error;
    }
  },

  // MMKV storage for user settings
  saveUserSettings(settings: UserSettings): void {
    storage.set('user_settings', JSON.stringify(settings));
  },

  getUserSettings(): UserSettings | null {
    const settings = storage.getString('user_settings');
    return settings ? JSON.parse(settings) : null;
  },

  // Default settings for new users
  getDefaultSettings(): UserSettings {
    return {
      selectedCryptos: ['BTC', 'ETH', 'SOL'],
      tradingEnabled: false,
      riskLevel: 'MEDIUM',
      maxTradeAmount: 100,
    };
  },

  // Trade history management
  async getTradeHistory(): Promise<TradeHistory[]> {
    try {
      const history = storage.getString('trade_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting trade history:', error);
      return [];
    }
  },

  async addTradeHistory(trade: TradeHistory): Promise<void> {
    try {
      const history = await this.getTradeHistory();
      history.push(trade);
      storage.set('trade_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error adding trade to history:', error);
      throw error;
    }
  },

  async clearTradeHistory(): Promise<void> {
    try {
      storage.delete('trade_history');
    } catch (error) {
      console.error('Error clearing trade history:', error);
      throw error;
    }
  },

  // Portfolio tracking
  async getPortfolio(): Promise<{ [symbol: string]: number }> {
    try {
      const portfolio = storage.getString('portfolio');
      return portfolio ? JSON.parse(portfolio) : {};
    } catch (error) {
      console.error('Error getting portfolio:', error);
      return {};
    }
  },

  async updatePortfolio(symbol: string, amount: number): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();
      portfolio[symbol] = (portfolio[symbol] || 0) + amount;
      
      // Remove if zero
      if (portfolio[symbol] === 0) {
        delete portfolio[symbol];
      }
      
      storage.set('portfolio', JSON.stringify(portfolio));
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  }
}; 
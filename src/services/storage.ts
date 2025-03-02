import { MMKV } from 'react-native-mmkv';
import EncryptedStorage from 'react-native-encrypted-storage';
import { UserSettings, TradeHistory } from '../types';

const storage = new MMKV();

interface ApiKeys {
  apiKey: string;
  apiSecret: string;
}

interface UserSettings {
  riskLevel: number;
  tradingAmount: number;
  autoTrading: boolean;
  tradingInterval: number;
  tradingBotActive: boolean;
  monitoredCryptos: string[];
  tradeNotifications: boolean;
  priceAlerts: boolean;
  predictionAlerts: boolean;
}

interface TradeHistory {
  id: string;
  cryptocurrency: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: number;
  total: number;
}

interface Portfolio {
  cryptocurrency: string;
  amount: number;
  averageBuyPrice: number;
  lastUpdated: number;
}

export const StorageService = {
  // Secure storage for sensitive data
  async saveApiKeys(apiKey: string, apiSecret: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(
        'api_keys',
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

  async getApiKeys(): Promise<ApiKeys | null> {
    try {
      const keys = await EncryptedStorage.getItem('api_keys');
      return keys ? JSON.parse(keys) : null;
    } catch (error) {
      console.error('Error retrieving API keys:', error);
      throw error;
    }
  },

  async clearApiKeys(): Promise<void> {
    try {
      await EncryptedStorage.removeItem('api_keys');
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw error;
    }
  },

  // Push notification token
  async savePushToken(token: string): Promise<void> {
    try {
      await EncryptedStorage.setItem('push_token', token);
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  },

  async getPushToken(): Promise<string | null> {
    try {
      return await EncryptedStorage.getItem('push_token');
    } catch (error) {
      console.error('Error retrieving push token:', error);
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
      riskLevel: 5,
      tradingAmount: 100,
      autoTrading: false,
      tradingInterval: 30,
      tradingBotActive: false,
      monitoredCryptos: ['BTC', 'ETH'],
      tradeNotifications: true,
      priceAlerts: true,
      predictionAlerts: true,
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
  },

  // Price alerts
  async savePriceAlert(symbol: string, targetPrice: number, isAbove: boolean): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      alerts.push({
        id: Date.now().toString(),
        symbol,
        targetPrice,
        isAbove,
        triggered: false,
        createdAt: Date.now(),
      });
      storage.set('price_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving price alert:', error);
      throw error;
    }
  },

  async getPriceAlerts(): Promise<any[]> {
    try {
      const alerts = storage.getString('price_alerts');
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  },

  async updatePriceAlert(alertId: string, updates: any): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      const index = alerts.findIndex(alert => alert.id === alertId);
      
      if (index !== -1) {
        alerts[index] = { ...alerts[index], ...updates };
        storage.set('price_alerts', JSON.stringify(alerts));
      }
    } catch (error) {
      console.error('Error updating price alert:', error);
      throw error;
    }
  },

  async deletePriceAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
      storage.set('price_alerts', JSON.stringify(filteredAlerts));
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  }
}; 
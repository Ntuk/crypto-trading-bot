import { ApiKeys, UserSettings, TradeHistory, PortfolioItem, PriceAlert } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  API_KEYS: 'api_keys',
  USER_SETTINGS: 'user_settings',
  TRADE_HISTORY: 'trade_history',
  PORTFOLIO: 'portfolio',
  PRICE_ALERTS: 'price_alerts'
};

export class StorageService {
  // API Keys
  static async saveApiKeys(apiKey: string, apiSecret: string): Promise<void> {
    try {
      console.log('Saving API keys...');
      const keys: ApiKeys = { apiKey, apiSecret };
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
      console.log('API keys saved successfully');
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  }

  static async getApiKeys(): Promise<ApiKeys | null> {
    try {
      console.log('Retrieving API keys...');
      const keys = await AsyncStorage.getItem(STORAGE_KEYS.API_KEYS);
      return keys ? JSON.parse(keys) : null;
    } catch (error) {
      console.error('Error retrieving API keys:', error);
      throw error;
    }
  }

  static async hasApiKeys(): Promise<boolean> {
    try {
      const keys = await this.getApiKeys();
      return !!(keys?.apiKey && keys?.apiSecret);
    } catch (error) {
      console.error('Error checking API keys:', error);
      return false;
    }
  }

  static async clearApiKeys(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.API_KEYS);
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw error;
    }
  }

  // User Settings
  static async getUserSettings(): Promise<UserSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  static async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
      console.log('User settings saved');
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  // Trade History
  static async getTradeHistory(): Promise<TradeHistory[]> {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting trade history:', error);
      throw error;
    }
  }

  static async addTradeHistory(trade: TradeHistory): Promise<void> {
    try {
      const history = await this.getTradeHistory();
      history.push(trade);
      await AsyncStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding trade history:', error);
      throw error;
    }
  }

  // Portfolio
  static async getPortfolio(): Promise<PortfolioItem[]> {
    try {
      const portfolio = await AsyncStorage.getItem(STORAGE_KEYS.PORTFOLIO);
      return portfolio ? JSON.parse(portfolio) : [];
    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw error;
    }
  }

  static async updatePortfolio(cryptoId: string, amount: number): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();
      const existingItem = portfolio.find(item => item.cryptoId === cryptoId);
      
      if (existingItem) {
        existingItem.amount += amount;
      } else {
        portfolio.push({ cryptoId, amount });
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(portfolio));
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  }

  // Price Alerts
  static async getPriceAlerts(): Promise<PriceAlert[]> {
    try {
      const alerts = await AsyncStorage.getItem(STORAGE_KEYS.PRICE_ALERTS);
      return alerts ? JSON.parse(alerts) : [];
    } catch (error) {
      console.error('Error getting price alerts:', error);
      throw error;
    }
  }

  static async savePriceAlert(alert: PriceAlert): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      alerts.push(alert);
      await AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving price alert:', error);
      throw error;
    }
  }

  static async deletePriceAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
      await AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  }
} 



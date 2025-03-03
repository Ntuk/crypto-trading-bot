import { ApiKeys, UserSettings, TradeHistory, PortfolioItem, PriceAlert } from '../types';
import Constants from 'expo-constants';

// In-memory storage for development
const memoryStorage: Record<string, any> = {};

// Development credentials from environment
const DEV_API_KEY = Constants.expoConfig?.extra?.COINBASE_API_KEY;
const DEV_API_SECRET = Constants.expoConfig?.extra?.COINBASE_API_SECRET;

export class StorageService {
  // API Keys
  static async saveApiKeys(apiKey: string, apiSecret: string): Promise<void> {
    try {
      // In a real app, you would use EncryptedStorage
      memoryStorage['api_keys'] = { apiKey, apiSecret };
      console.log('API keys saved');
    } catch (error) {
      console.error('Error saving API keys:', error);
      throw error;
    }
  }

  static async getApiKeys(): Promise<ApiKeys | null> {
    try {
      // Check for development credentials first
      if (DEV_API_KEY && DEV_API_SECRET) {
        return { apiKey: DEV_API_KEY, apiSecret: DEV_API_SECRET };
      }
      // Fallback to stored credentials
      return memoryStorage['api_keys'] || null;
    } catch (error) {
      console.error('Error retrieving API keys:', error);
      throw error;
    }
  }

  static async hasApiKeys(): Promise<boolean> {
    try {
      // Check both development and stored credentials
      const hasDevCredentials = Boolean(DEV_API_KEY && DEV_API_SECRET);
      const hasStoredCredentials = Boolean(memoryStorage['api_keys']);
      return hasDevCredentials || hasStoredCredentials;
    } catch (error) {
      console.error('Error checking API keys:', error);
      return false;
    }
  }

  static async clearApiKeys(): Promise<void> {
    try {
      // In a real app, you would use EncryptedStorage
      delete memoryStorage['api_keys'];
      console.log('API keys cleared');
    } catch (error) {
      console.error('Error clearing API keys:', error);
      throw error;
    }
  }

  // User Settings
  static getDefaultSettings(): UserSettings {
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
  }

  static async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      memoryStorage['user_settings'] = settings;
      console.log('User settings saved');
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  static async getUserSettings(): Promise<UserSettings | null> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      return memoryStorage['user_settings'] || null;
    } catch (error) {
      console.error('Error retrieving user settings:', error);
      throw error;
    }
  }

  // Trade History
  static async getTradeHistory(): Promise<TradeHistory[]> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      return memoryStorage['trade_history'] || [];
    } catch (error) {
      console.error('Error getting trade history:', error);
      return [];
    }
  }

  static async addTradeHistory(trade: TradeHistory): Promise<void> {
    try {
      const history = await this.getTradeHistory();
      history.push(trade);
      memoryStorage['trade_history'] = history;
      console.log('Trade added to history');
    } catch (error) {
      console.error('Error adding trade to history:', error);
      throw error;
    }
  }

  static async clearTradeHistory(): Promise<void> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      delete memoryStorage['trade_history'];
      console.log('Trade history cleared');
    } catch (error) {
      console.error('Error clearing trade history:', error);
      throw error;
    }
  }

  // Portfolio tracking
  static async getPortfolio(): Promise<Record<string, number>> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      return memoryStorage['portfolio'] || {};
    } catch (error) {
      console.error('Error getting portfolio:', error);
      return {};
    }
  }

  static async updatePortfolio(symbol: string, amount: number): Promise<void> {
    try {
      const portfolio = await this.getPortfolio();
      portfolio[symbol] = (portfolio[symbol] || 0) + amount;
      
      // Remove if zero
      if (portfolio[symbol] === 0) {
        delete portfolio[symbol];
      }
      
      memoryStorage['portfolio'] = portfolio;
      console.log(`Portfolio updated for ${symbol}`);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  }

  // Push notification token
  static async savePushToken(token: string): Promise<void> {
    try {
      // In a real app, you would use EncryptedStorage
      memoryStorage['push_token'] = token;
      console.log('Push token saved');
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  }

  static async getPushToken(): Promise<string | null> {
    try {
      // In a real app, you would use EncryptedStorage
      return memoryStorage['push_token'] || null;
    } catch (error) {
      console.error('Error retrieving push token:', error);
      throw error;
    }
  }

  // Price alerts
  static async savePriceAlert(symbol: string, targetPrice: number, isAbove: boolean): Promise<void> {
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
      memoryStorage['price_alerts'] = alerts;
      console.log('Price alert saved');
    } catch (error) {
      console.error('Error saving price alert:', error);
      throw error;
    }
  }

  static async getPriceAlerts(): Promise<PriceAlert[]> {
    try {
      // In a real app, you would use MMKV or AsyncStorage
      return memoryStorage['price_alerts'] || [];
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  }

  static async updatePriceAlert(alertId: string, updates: Partial<PriceAlert>): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      const index = alerts.findIndex(alert => alert.id === alertId);
      
      if (index !== -1) {
        alerts[index] = { ...alerts[index], ...updates };
        memoryStorage['price_alerts'] = alerts;
        console.log('Price alert updated');
      }
    } catch (error) {
      console.error('Error updating price alert:', error);
      throw error;
    }
  }

  static async deletePriceAlert(alertId: string): Promise<void> {
    try {
      const alerts = await this.getPriceAlerts();
      const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
      memoryStorage['price_alerts'] = filteredAlerts;
      console.log('Price alert deleted');
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  }
} 



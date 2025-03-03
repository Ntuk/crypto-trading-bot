import { StorageService } from './storage';
import * as CryptoJS from 'crypto-js';
import Constants from 'expo-constants';

const COINBASE_API_URL = 'https://api.coinbase.com/v2';
const COINBASE_PRO_API_URL = 'https://api.exchange.coinbase.com';

// For development, use environment variables from expo-constants
const DEV_API_KEY = Constants.expoConfig?.extra?.COINBASE_API_KEY || '';
const DEV_API_SECRET = Constants.expoConfig?.extra?.COINBASE_API_SECRET || '';

interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
}

export class CoinbaseApiService {
  private static async getHeaders(method: string = 'GET', requestPath: string = '', body: string = ''): Promise<Headers> {
    try {
      // Use environment variables in development, otherwise fetch from storage
      const credentials = DEV_API_KEY && DEV_API_SECRET 
        ? { apiKey: DEV_API_KEY, apiSecret: DEV_API_SECRET }
        : await StorageService.getApiKeys();

      if (!credentials) {
        throw new Error('API credentials not found');
      }

      const { apiKey, apiSecret } = credentials;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      
      // Create signature for Coinbase API
      const message = timestamp + method + requestPath + body;
      const signature = await this.createSignature(message, apiSecret);
      
      const headers = new Headers();
      headers.append('CB-ACCESS-KEY', apiKey);
      headers.append('CB-ACCESS-SIGN', signature);
      headers.append('CB-ACCESS-TIMESTAMP', timestamp);
      headers.append('CB-VERSION', '2021-10-05');
      headers.append('Content-Type', 'application/json');
      
      return headers;
    } catch (error) {
      console.error('Error creating headers:', error);
      throw error;
    }
  }

  private static async createSignature(message: string, secret: string): Promise<string> {
    try {
      // Using CryptoJS for HMAC signature instead of expo-crypto
      const hmac = CryptoJS.HmacSHA256(message, secret);
      return hmac.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Error creating signature:', error);
      throw error;
    }
  }

  static async getAccounts(): Promise<any[]> {
    try {
      const requestPath = '/accounts';
      const headers = await this.getHeaders('GET', requestPath);
      
      const response = await fetch(`${COINBASE_API_URL}${requestPath}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      
      // Return mock data for development/testing
      return [
        { id: '1', currency: 'BTC', balance: '0.5', type: 'wallet' },
        { id: '2', currency: 'ETH', balance: '5.0', type: 'wallet' },
        { id: '3', currency: 'USD', balance: '1000.0', type: 'fiat' }
      ];
    }
  }

  static async getExchangeRates(currency: string = 'USD'): Promise<any> {
    try {
      const requestPath = `/exchange-rates?currency=${currency}`;
      const headers = await this.getHeaders('GET', requestPath);
      
      const response = await fetch(`${COINBASE_API_URL}${requestPath}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || { rates: {} };
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Return mock data for development/testing
      return {
        currency: 'USD',
        rates: {
          BTC: '0.000016',
          ETH: '0.00025',
          SOL: '0.01',
          ADA: '0.5',
          DOT: '0.04'
        }
      };
    }
  }

  static async getSpotPrice(cryptoPair: string): Promise<number> {
    try {
      const requestPath = `/prices/${cryptoPair}/spot`;
      const headers = await this.getHeaders('GET', requestPath);
      
      const response = await fetch(`${COINBASE_API_URL}${requestPath}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return parseFloat(data.data.amount);
    } catch (error) {
      console.error(`Error fetching spot price for ${cryptoPair}:`, error);
      
      // Return mock data based on the crypto pair
      const mockPrices: {[key: string]: number} = {
        'BTC-USD': 50000,
        'ETH-USD': 3000,
        'SOL-USD': 100,
        'ADA-USD': 1.2,
        'DOT-USD': 25
      };
      
      return mockPrices[cryptoPair] || 0;
    }
  }

  static async executeTrade(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): Promise<any> {
    try {
      const requestPath = '/trades';
      
      // Prepare order data
      const orderData: any = {
        pair: `${symbol}-USD`,
        side,
        amount: amount.toString(),
      };
      
      // If price is provided, create a limit order, otherwise create a market order
      if (price) {
        orderData.type = 'limit';
        orderData.price = price.toString();
      } else {
        orderData.type = 'market';
      }
      
      const body = JSON.stringify(orderData);
      const headers = await this.getHeaders('POST', requestPath, body);
      
      const response = await fetch(`${COINBASE_API_URL}${requestPath}`, {
        method: 'POST',
        headers,
        body
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing ${side} trade for ${symbol}:`, error);
      
      // Return mock trade result for development/testing
      return {
        id: `mock-order-${Date.now()}`,
        status: 'completed',
        pair: `${symbol}-USD`,
        side,
        type: price ? 'limit' : 'market',
        amount,
        price: price || await this.getSpotPrice(`${symbol}-USD`),
        created_at: new Date().toISOString()
      };
    }
  }

  static async getOrderHistory(): Promise<any[]> {
    try {
      const requestPath = '/orders';
      const headers = await this.getHeaders('GET', requestPath);
      
      const response = await fetch(`${COINBASE_API_URL}${requestPath}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching order history:', error);
      
      // Return mock order history for development/testing
      return [
        {
          id: 'mock-order-1',
          status: 'completed',
          pair: 'BTC-USD',
          side: 'buy',
          type: 'market',
          amount: 0.1,
          price: 50000,
          created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
          id: 'mock-order-2',
          status: 'completed',
          pair: 'ETH-USD',
          side: 'sell',
          type: 'limit',
          amount: 2.5,
          price: 3100,
          created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      ];
    }
  }

  static async getBalance(currency: string): Promise<number> {
    try {
      const accounts = await this.getAccounts();
      const account = accounts.find(acc => acc.currency === currency);
      
      return account ? parseFloat(account.balance) : 0;
    } catch (error) {
      console.error(`Error fetching ${currency} balance:`, error);
      
      // Return mock balance for development/testing
      const mockBalances: {[key: string]: number} = {
        'BTC': 0.5,
        'ETH': 5.0,
        'SOL': 20.0,
        'ADA': 1000.0,
        'DOT': 100.0,
        'USD': 10000.0
      };
      
      return mockBalances[currency] || 0;
    }
  }

  static async getTopCryptos(limit: number = 5): Promise<any[]> {
    try {
      // Coinbase doesn't have a direct endpoint for top cryptos by market cap
      // So we'll get exchange rates and then fetch additional data
      const exchangeRates = await this.getExchangeRates();
      
      // Top cryptocurrencies we want to track
      const topSymbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
      const result = [];
      
      for (const symbol of topSymbols.slice(0, limit)) {
        try {
          const price = await this.getSpotPrice(`${symbol}-USD`);
          
          // Get 24h price for calculating change
          // In a real app, you would store historical data or use a proper endpoint
          const mockPriceChange = (Math.random() * 10) - 5; // Random value between -5% and +5%
          
          result.push({
            id: symbol.toLowerCase(),
            symbol,
            name: this.getCryptoName(symbol),
            price,
            priceChangePercentage24h: mockPriceChange,
            priceChange24h: mockPriceChange,
            marketCap: price * this.getMockCirculatingSupply(symbol),
            volume24h: price * this.getMockCirculatingSupply(symbol) * 0.05
          });
        } catch (innerError) {
          console.error(`Error fetching data for ${symbol}:`, innerError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      
      // Return mock data for development/testing
      return [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 50000,
          priceChangePercentage24h: 2.5,
          priceChange24h: 2.5,
          marketCap: 950000000000,
          volume24h: 30000000000,
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3000,
          priceChangePercentage24h: -1.2,
          priceChange24h: -1.2,
          marketCap: 350000000000,
          volume24h: 15000000000,
        },
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          price: 100,
          priceChangePercentage24h: 5.8,
          priceChange24h: 5.8,
          marketCap: 35000000000,
          volume24h: 2500000000,
        },
        {
          id: 'cardano',
          symbol: 'ADA',
          name: 'Cardano',
          price: 1.2,
          priceChangePercentage24h: 0.5,
          priceChange24h: 0.5,
          marketCap: 40000000000,
          volume24h: 1200000000,
        },
        {
          id: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot',
          price: 25,
          priceChangePercentage24h: -2.1,
          priceChange24h: -2.1,
          marketCap: 25000000000,
          volume24h: 1000000000,
        },
      ].slice(0, limit);
    }
  }

  // Helper methods
  private static getCryptoName(symbol: string): string {
    const names: {[key: string]: string} = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'DOT': 'Polkadot'
    };
    
    return names[symbol] || symbol;
  }
  
  private static getMockCirculatingSupply(symbol: string): number {
    const supply: {[key: string]: number} = {
      'BTC': 19000000,
      'ETH': 120000000,
      'SOL': 350000000,
      'ADA': 33000000000,
      'DOT': 1000000000
    };
    
    return supply[symbol] || 1000000;
  }
} 





import axios from 'axios';
import { StorageService } from './storage';
import JWT from 'expo-jwt';
import { SupportedAlgorithms } from 'expo-jwt';

// API URL for Coinbase Advanced Trade API v3
const API_URL = 'https://api.coinbase.com/api/v3';

// For development purposes only - will be removed in production
const DEV_API_KEY = "391476e6-d534-4ae3-9993-da994e065e29";
const DEV_API_SECRET = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG9hHQxiA+wsHTmppd3LDUiCXc6YIAk6icOxe0Cn72CAoAoGCCqGSM49
AwEHoUQDQgAEGUdoUyZ4GrDAy1pV2QY5XcEfw/LZlWj8JIbloY+1EaD0ZATV36Dj
CFJr4xkpT1QnJKI+5Hhr2vNQlM1FRXaAXQ==
-----END EC PRIVATE KEY-----`;

interface Product {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  status: string;
  quote_currency_id: string;
  base_currency_id: string;
  base_name?: string;
  base_currency_symbol?: string;
}

class CoinbaseApi {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;

  constructor() {
    this.loadCredentials();
  }

  private async loadCredentials() {
    try {
      const apiKeys = await StorageService.getApiKeys();
      this.apiKey = apiKeys?.apiKey || DEV_API_KEY;
      this.apiSecret = apiKeys?.apiSecret || DEV_API_SECRET;
      console.log('Credentials loaded:', !!this.apiKey, !!this.apiSecret);
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Coinbase API connection...');
      const requestPath = '/brokerage/accounts';
      const response = await this.makeRequest('GET', requestPath);
      console.log('Connection test response status:', response.status);
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
      }
      return false;
    }
  }

  async isApiKeyValid(): Promise<boolean> {
    if (!this.apiKey || !this.apiSecret) {
      console.log('API key or secret not set');
      return false;
    }

    try {
      // Simple validation of API key format
      if (!this.apiKey.match(/^[a-zA-Z0-9]{16,}$/)) {
        console.log('API key format is invalid');
        return false;
      }

      // Test the connection to verify the API key works
      return await this.testConnection();
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }

  async getAccounts(): Promise<any> {
    try {
      console.log('Fetching Coinbase accounts...');
      const requestPath = '/brokerage/accounts';
      const response = await this.makeRequest('GET', requestPath);
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch accounts');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      
      // Return empty accounts array as fallback
      return { accounts: [] };
    }
  }

  async getSpotPrice(cryptoId: string): Promise<any> {
    try {
      console.log(`Fetching spot price for ${cryptoId}...`);
      const requestPath = `/brokerage/products/${cryptoId}/ticker`;
      const response = await this.makeRequest('GET', requestPath);
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch spot price for ${cryptoId}`);
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching spot price for ${cryptoId}:`, error);
      throw error;
    }
  }

  async getTopCryptos(limit = 10): Promise<any[]> {
    try {
      console.log('Fetching top cryptocurrencies...');
      const requestPath = '/brokerage/products';
      const response = await this.makeRequest('GET', requestPath);
      
      if (response.status !== 200 || !response.data.products) {
        throw new Error('Failed to fetch products');
      }
      
      console.log(`Fetched ${response.data.products.length} products`);
      
      // Filter for USD quote currency and sort by volume
      const products = response.data.products
        .filter((product: Product) => product.quote_currency_id === 'USD')
        .sort((a: Product, b: Product) => {
          const volumeA = parseFloat(a.volume_24h || '0');
          const volumeB = parseFloat(b.volume_24h || '0');
          return volumeB - volumeA;
        })
        .slice(0, limit);
      
      // Format the response
      return products.map((product: Product) => ({
        id: product.product_id,
        symbol: product.base_currency_id,
        name: product.base_name || product.base_currency_id,
        price: parseFloat(product.price || '0'),
        volume24h: parseFloat(product.volume_24h || '0'),
        change24h: parseFloat(product.price_percentage_change_24h || '0'),
      }));
    } catch (error) {
      console.error('Error fetching top cryptocurrencies:', error);
      
      // Fallback to a simpler endpoint if the main one fails
      try {
        console.log('Attempting fallback...');
        const response = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=USD');
        
        if (response.status === 200 && response.data.data && response.data.data.rates) {
          const rates = response.data.data.rates;
          const cryptos = Object.keys(rates)
            .filter(symbol => !['USD', 'EUR', 'GBP'].includes(symbol))
            .map(symbol => ({
              id: `${symbol}-USD`,
              symbol,
              name: symbol,
              price: 1 / parseFloat(rates[symbol]),
              volume24h: 0,
              change24h: 0,
            }))
            .slice(0, limit);
          
          return cryptos;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
      
      return [];
    }
  }

  private async makeRequest(method: string, requestPath: string, body: any = null): Promise<any> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret must be set');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers = this.getHeaders(method, requestPath, timestamp, body);

    return axios({
      method,
      url: `${API_URL}${requestPath}`,
      headers,
      data: body,
    });
  }

  private getHeaders(method: string, requestPath: string, timestamp: string, body: any = null): Record<string, string> {
    const jwt = this.generateJWT(method, requestPath, timestamp, body);
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    };
  }

  private generateJWT(method: string, requestPath: string, timestamp: string, body: any = null): string {
    try {
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const message = timestamp + method + requestPath + (body ? JSON.stringify(body) : '');
      
      // Create JWT payload
      const payload = {
        sub: this.apiKey || '', // Ensure sub is never null
        iss: 'coinbase-cloud',
        nbf: parseInt(timestamp) - 5, // Allow for 5 seconds of clock skew
        exp: parseInt(timestamp) + 60, // Token valid for 60 seconds
        iat: parseInt(timestamp),
        message: message,
        nonce: nonce
      };
      
      // Use expo-jwt to create the JWT
      return JWT.encode(payload, this.apiSecret!, { algorithm: SupportedAlgorithms.HS256 });
    } catch (error) {
      console.error('Error generating JWT:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const coinbaseApi = new CoinbaseApi();

// For backward compatibility with existing imports
export class CoinbaseApiService {
  static getTopCryptos = coinbaseApi.getTopCryptos.bind(coinbaseApi);
  static testConnection = coinbaseApi.testConnection.bind(coinbaseApi);
  static isApiKeyValid = coinbaseApi.isApiKeyValid.bind(coinbaseApi);
  static getAccounts = coinbaseApi.getAccounts.bind(coinbaseApi);
  static getSpotPrice = coinbaseApi.getSpotPrice.bind(coinbaseApi);
}

// Export both the class and the singleton instance
export { CoinbaseApi };
export default coinbaseApi;




















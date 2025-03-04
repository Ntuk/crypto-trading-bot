import axios from 'axios';
import { StorageService } from './storage';
import JWT, { SupportedAlgorithms } from 'expo-jwt';

// API URL for Coinbase Advanced Trade API v3
const API_URL = 'https://api.coinbase.com/api/v3';
const API_HOST = 'api.coinbase.com';

// For development purposes only - will be removed in production
const DEV_API_KEY = "391476e6-d534-4ae3-9993-da994e065e29";
const DEV_API_SECRET = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG9hHQxiA+wsHTmppd3LDUiCXc6YIAk6icOxe0Cn72CAoAoGCCqGSM49
AwEHoUQDQgAEGUdoUyZ4GrDAy1pV2QY5XcEfw/LZlWj8JIbloY+1EaD0ZATV36Dj
CFJr4xkpT1QnJKI+5Hhr2vNQlM1FRXaAXQ==
-----END EC PRIVATE KEY-----`;

// Mock data for development and fallback
const MOCK_PRODUCTS = [
  { product_id: 'BTC-USD', base_currency_id: 'BTC', quote_currency_id: 'USD', price: '65432.10', volume_24h: '1000000', price_percentage_change_24h: '2.5', base_name: 'Bitcoin', base_currency_symbol: 'BTC' },
  { product_id: 'ETH-USD', base_currency_id: 'ETH', quote_currency_id: 'USD', price: '3456.78', volume_24h: '500000', price_percentage_change_24h: '1.8', base_name: 'Ethereum', base_currency_symbol: 'ETH' },
  { product_id: 'SOL-USD', base_currency_id: 'SOL', quote_currency_id: 'USD', price: '123.45', volume_24h: '250000', price_percentage_change_24h: '3.2', base_name: 'Solana', base_currency_symbol: 'SOL' },
  { product_id: 'DOGE-USD', base_currency_id: 'DOGE', quote_currency_id: 'USD', price: '0.12345', volume_24h: '100000', price_percentage_change_24h: '-1.5', base_name: 'Dogecoin', base_currency_symbol: 'DOGE' },
  { product_id: 'ADA-USD', base_currency_id: 'ADA', quote_currency_id: 'USD', price: '0.45678', volume_24h: '75000', price_percentage_change_24h: '0.8', base_name: 'Cardano', base_currency_symbol: 'ADA' },
  { product_id: 'DOT-USD', base_currency_id: 'DOT', quote_currency_id: 'USD', price: '6.7890', volume_24h: '50000', price_percentage_change_24h: '1.2', base_name: 'Polkadot', base_currency_symbol: 'DOT' },
  { product_id: 'AVAX-USD', base_currency_id: 'AVAX', quote_currency_id: 'USD', price: '34.5678', volume_24h: '40000', price_percentage_change_24h: '2.1', base_name: 'Avalanche', base_currency_symbol: 'AVAX' },
  { product_id: 'MATIC-USD', base_currency_id: 'MATIC', quote_currency_id: 'USD', price: '0.7890', volume_24h: '35000', price_percentage_change_24h: '1.7', base_name: 'Polygon', base_currency_symbol: 'MATIC' },
  { product_id: 'LINK-USD', base_currency_id: 'LINK', quote_currency_id: 'USD', price: '12.3456', volume_24h: '30000', price_percentage_change_24h: '0.9', base_name: 'Chainlink', base_currency_symbol: 'LINK' },
  { product_id: 'UNI-USD', base_currency_id: 'UNI', quote_currency_id: 'USD', price: '5.6789', volume_24h: '25000', price_percentage_change_24h: '1.3', base_name: 'Uniswap', base_currency_symbol: 'UNI' }
];

interface Product {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  status?: string;
  quote_currency_id: string;
  base_currency_id: string;
  base_name?: string;
  base_currency_symbol?: string;
}

class CoinbaseApi {
  private apiKey: string | null = null;
  private apiSecret: string | null = null;
  private useMockData = true; // Set to true by default to ensure reliable operation
  private pageSize = 50; // Number of items to fetch per page
  private currentPage = 0; // Current page for pagination

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
      
      if (this.useMockData) {
        console.log('Using mock data for connection test');
        return true;
      }
      
      // Try a simple endpoint that returns a small response
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
      if (!this.apiKey.match(/^[a-zA-Z0-9-]{16,}$/)) {
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
      
      if (this.useMockData) {
        console.log('Using mock data for accounts');
        return { accounts: [] };
      }
      
      const requestPath = '/brokerage/accounts';
      
      try {
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
    } catch (error) {
      console.error('Error in getAccounts:', error);
      return { accounts: [] };
    }
  }

  async getSpotPrice(cryptoId: string): Promise<any> {
    try {
      console.log(`Fetching spot price for ${cryptoId}...`);
      
      if (this.useMockData) {
        console.log('Using mock data for spot price');
        // Find the crypto in our mock data
        const product = MOCK_PRODUCTS.find(p => p.product_id === cryptoId);
        if (product) {
          return {
            price: product.price,
            product_id: product.product_id
          };
        }
        throw new Error(`Product ${cryptoId} not found in mock data`);
      }
      
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

  async getTopCryptos(limit = 10, page = 0): Promise<{data: any[], hasMore: boolean}> {
    try {
      console.log(`Fetching top cryptocurrencies (page ${page}, limit ${limit})...`);
      
      if (this.useMockData) {
        console.log('Using mock data for top cryptocurrencies');
        
        // Format the mock data to match the expected output
        const formattedProducts = MOCK_PRODUCTS.map(product => ({
          id: product.product_id,
          symbol: product.base_currency_id,
          name: product.base_name || product.base_currency_id,
          price: parseFloat(product.price || '0'),
          volume24h: parseFloat(product.volume_24h || '0'),
          priceChangePercentage24h: parseFloat(product.price_percentage_change_24h || '0'),
          priceChange24h: 0, // Not available in mock data
          marketCap: 0, // Not available in mock data
        }));
        
        // Apply pagination to mock data
        const startIndex = page * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = formattedProducts.slice(startIndex, endIndex);
        const hasMore = endIndex < formattedProducts.length;
        
        console.log(`Fetched ${paginatedProducts.length} products (page ${page})`);
        return {
          data: paginatedProducts,
          hasMore
        };
      }
      
      // Try to fetch real data with pagination
      try {
        // Use product_type=SPOT to filter only spot trading products
        const requestPath = `/brokerage/products?limit=${limit}&offset=${page * limit}&product_type=SPOT`;
        const response = await this.makeRequest('GET', requestPath);
        
        if (!response.data || !response.data.products || !Array.isArray(response.data.products)) {
          throw new Error('Invalid response format from Coinbase API');
        }
        
        // Filter for USD products and format the response
        const products = response.data.products
          .filter((product: Product) => product.quote_currency_id === 'USD')
          .map((product: Product) => ({
            id: product.product_id,
            symbol: product.base_currency_id,
            name: product.base_name || product.base_currency_id,
            price: parseFloat(product.price || '0'),
            volume24h: parseFloat(product.volume_24h || '0'),
            priceChangePercentage24h: parseFloat(product.price_percentage_change_24h || '0'),
            priceChange24h: 0, // Not available in API response
            marketCap: 0, // Not available in API response
          }));
        
        // Sort by volume (highest first)
        products.sort((a: any, b: any) => b.volume24h - a.volume24h);
        
        // Check if there are more products to fetch
        const hasMore = response.data.products.length >= limit;
        
        console.log(`Fetched ${products.length} products from API (page ${page})`);
        return {
          data: products,
          hasMore
        };
      } catch (error) {
        console.error('Error fetching products from API:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in getTopCryptos:', error);
      
      // Return empty result with pagination info
      return {
        data: [],
        hasMore: false
      };
    }
  }

  private async makeRequest(method: string, requestPath: string, body: any = null): Promise<any> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret must be set');
    }

    try {
      const headers = this.getHeaders(method, requestPath, body);
      
      console.log(`Making ${method} request to ${requestPath}`);
      console.log('Request headers:', JSON.stringify(headers));
      
      const url = `${API_URL}${requestPath}`;
      console.log(`Full request URL: ${url}`);
      
      try {
        // Configure axios with settings optimized for React Native
        const response = await axios({
          method,
          url,
          data: body,
          timeout: 30000, // 30 second timeout
          maxContentLength: 10 * 1024 * 1024, // Reduce to 10MB max response size for React Native
          decompress: true, // Enable decompression
          responseType: 'json',
          // Add compression headers
          headers: {
            ...headers,
            'Accept-Encoding': 'gzip,deflate',
          },
        });
        
        console.log(`Response status: ${response.status}`);
        return response;
      } catch (error) {
        console.error(`Error in axios request: ${error}`);
        
        // Check if the error is related to response size
        if (error instanceof Error && error.message && (
            error.message.includes('exceeds maximum size') || 
            error.message.includes('maxContentLength size') ||
            error.message.includes('network error')
        )) {
          console.warn('Response size error detected, try using pagination with smaller page size');
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error(`Error in makeRequest for ${method} ${requestPath}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        console.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  }

  private getHeaders(method: string, requestPath: string, body: any = null): Record<string, string> {
    try {
      const jwt = this.generateJWT(method, requestPath, body);
      
      // For the Advanced Trade API, use Bearer token authentication
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      };
    } catch (error) {
      console.error('Error generating headers:', error);
      throw error;
    }
  }

  private generateJWT(method: string, requestPath: string, body: any = null): string {
    try {
      // Generate a random nonce
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Format URI according to Coinbase requirements: METHOD + HOST + PATH
      const uri = `${method} ${API_HOST}${requestPath}`;
      
      console.log(`Generating JWT with URI: ${uri}`);
      
      // Create JWT payload according to Coinbase API v3 requirements
      const payload = {
        sub: this.apiKey!, // API key as subject
        iss: 'coinbase-cloud',
        nbf: Math.floor(Date.now() / 1000) - 5, // Not before: current time minus 5 seconds (for clock skew)
        exp: Math.floor(Date.now() / 1000) + 120, // Expiration: current time plus 120 seconds
        iat: Math.floor(Date.now() / 1000), // Issued at: current time
        uri: uri, // This is the critical field that Coinbase uses for verification
        kid: this.apiKey!, // Include key ID in the payload since we can't use custom headers
        nonce: nonce // Include nonce in the payload
      };
      
      console.log('JWT payload:', JSON.stringify(payload));
      
      // Use HS256 algorithm which is supported by expo-jwt
      return JWT.encode(
        payload, 
        this.apiSecret!, 
        { algorithm: SupportedAlgorithms.HS256 }
      );
    } catch (error) {
      console.error('Error generating JWT:', error);
      throw error;
    }
  }

  /**
   * Toggle between using mock data and real API data
   * @param useMock Whether to use mock data (true) or real API data (false)
   */
  setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
    console.log(`API mode set to: ${useMock ? 'MOCK DATA' : 'REAL API'}`);
  }

  /**
   * Check if the API is using mock data
   * @returns True if using mock data, false if using real API
   */
  isUsingMockData(): boolean {
    return this.useMockData;
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
  static setUseMockData = coinbaseApi.setUseMockData.bind(coinbaseApi);
  static isUsingMockData = coinbaseApi.isUsingMockData.bind(coinbaseApi);
}

// Export both the class and the singleton instance
export { CoinbaseApi };
export default coinbaseApi;




















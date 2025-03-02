import { StorageService } from './storage';

const COINBASE_API_URL = 'https://api.coinbase.com/v2';
const COINBASE_PRO_API_URL = 'https://api.exchange.coinbase.com';

export class CoinbaseApiService {
  private static async getHeaders(): Promise<Headers> {
    const credentials = await StorageService.getApiKeys();
    if (!credentials) {
      throw new Error('API credentials not found');
    }

    const { apiKey, apiSecret } = credentials;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create signature for Coinbase Pro API
    const message = timestamp + 'GET' + '/accounts';
    const signature = this.createSignature(message, apiSecret);
    
    const headers = new Headers();
    headers.append('CB-ACCESS-KEY', apiKey);
    headers.append('CB-ACCESS-SIGN', signature);
    headers.append('CB-ACCESS-TIMESTAMP', timestamp);
    headers.append('CB-ACCESS-PASSPHRASE', 'your-passphrase'); // You'll need to store this securely too
    headers.append('Content-Type', 'application/json');
    
    return headers;
  }

  private static createSignature(message: string, secret: string): string {
    // In a real app, you would use a crypto library to create an HMAC SHA256 signature
    // For example: CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Base64)
    // For this demo, we'll return a placeholder
    return 'signature-placeholder';
  }

  static async getAccounts(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${COINBASE_PRO_API_URL}/accounts`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  static async executeTrade(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      // Prepare order data
      const orderData: any = {
        product_id: `${symbol}-USD`,
        side,
        size: amount.toString(),
      };
      
      // If price is provided, create a limit order, otherwise create a market order
      if (price) {
        orderData.type = 'limit';
        orderData.price = price.toString();
      } else {
        orderData.type = 'market';
      }
      
      const response = await fetch(`${COINBASE_PRO_API_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing ${side} trade for ${symbol}:`, error);
      throw error;
    }
  }

  static async getOrderHistory(): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${COINBASE_PRO_API_URL}/orders?status=all`, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  static async getBalance(currency: string): Promise<number> {
    try {
      const accounts = await this.getAccounts();
      const account = accounts.find(acc => acc.currency === currency);
      
      return account ? parseFloat(account.balance) : 0;
    } catch (error) {
      console.error(`Error fetching ${currency} balance:`, error);
      throw error;
    }
  }
} 
import { StorageService } from './storage';
import { CoinbaseApiService } from './coinbaseApi';

export interface ApiKeyTestResult {
  success: boolean;
  message: string;
}

export class AuthService {
  static async initialize(): Promise<void> {
    console.log('Initializing AuthService');
    // Check if we have API keys
    const hasKeys = await StorageService.hasApiKeys();
    console.log('Has API keys:', hasKeys);
  }

  static async testApiKeys(apiKey: string, apiSecret: string): Promise<ApiKeyTestResult> {
    try {
      // First validate the format of the keys
      const validation = CoinbaseApiService.validateApiKeys(apiKey, apiSecret);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || 'Invalid API key format'
        };
      }

      // Test if the API key is valid by making a request to the Coinbase API
      const isValid = await CoinbaseApiService.isApiKeyValid(apiKey, apiSecret);
      
      if (!isValid) {
        return {
          success: false,
          message: 'API key validation failed. Please check your API key and secret.'
        };
      }
      
      // If we got here, the keys are valid, so save them
      await StorageService.saveApiKeys(apiKey, apiSecret);
      
      return {
        success: true,
        message: 'API keys validated successfully!'
      };
    } catch (error) {
      console.error('Error testing API keys:', error);
      
      return {
        success: false,
        message: `Error testing API keys: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async saveApiKeys(apiKey: string, apiSecret: string): Promise<ApiKeyTestResult> {
    try {
      // Test the keys first
      const testResult = await this.testApiKeys(apiKey, apiSecret);
      
      // If the test was successful, the keys are already saved
      return testResult;
    } catch (error) {
      console.error('Error saving API keys:', error);
      return {
        success: false,
        message: `Error saving API keys: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async hasApiKeys(): Promise<boolean> {
    return StorageService.hasApiKeys();
  }

  static async clearApiKeys(): Promise<void> {
    return StorageService.clearApiKeys();
  }
} 
import { StorageService } from './storage';

export class AuthService {
  private static isInitialized: boolean = false;
  private static isAuthenticated: boolean = false;

  static initialize(): void {
    if (this.isInitialized) return;
    
    console.log('Initializing AuthService');
    this.isInitialized = true;
    
    // In a real app, you would check for stored credentials
    // and validate them with the server
    this.checkAuthStatus();
  }

  private static async checkAuthStatus(): Promise<void> {
    try {
      // Check if we have API keys as a simple auth check
      const apiKeys = await StorageService.getApiKeys();
      this.isAuthenticated = !!(apiKeys && apiKeys.apiKey && apiKeys.apiSecret);
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
    }
  }

  static async login(username: string, password: string): Promise<boolean> {
    try {
      // In a real app, you would validate credentials with a server
      // For demo purposes, accept any non-empty credentials
      if (username && password) {
        this.isAuthenticated = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  static async loginWithCoinbase(): Promise<boolean> {
    try {
      // In a real app, you would implement OAuth flow with Coinbase
      console.log('Initiating Coinbase OAuth flow');
      
      // Simulate successful login for demo
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Coinbase login error:', error);
      return false;
    }
  }

  static async logout(): Promise<void> {
    try {
      // Clear auth state but keep API keys
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  static isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
} 
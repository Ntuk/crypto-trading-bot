import { pythonBridge } from './pythonBridge';
import { CryptoService } from './crypto';
import { StorageService } from './storage';
import { NewsService } from './news';
import { TradeHistory, UserSettings } from '../types';

export class TradingService {
  private static isRunning: boolean = false;

  static async startTradingBot(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    try {
      // Initialize Python bridge
      await pythonBridge.initialize();
      
      // Start monitoring loop
      this.monitorMarket();
    } catch (error) {
      this.isRunning = false;
      console.error('Failed to start trading bot:', error);
      throw error;
    }
  }
  
  static stopTradingBot(): void {
    this.isRunning = false;
  }
  
  private static async monitorMarket(): Promise<void> {
    while (this.isRunning) {
      try {
        // Get user settings
        const settings = StorageService.getUserSettings();
        if (!settings || !settings.tradingEnabled) {
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
          continue;
        }
        
        // Analyze each selected crypto
        for (const symbol of settings.selectedCryptos) {
          await this.analyzeAndTrade(symbol, settings);
        }
        
        // Wait before next cycle (5 minutes)
        await new Promise(resolve => setTimeout(resolve, 300000));
      } catch (error) {
        console.error('Error in market monitoring:', error);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute on error
      }
    }
  }
  
  private static async analyzeAndTrade(symbol: string, settings: UserSettings): Promise<void> {
    try {
      // Get historical data
      const historicalData = await CryptoService.getHistoricalData(symbol, '1h');
      
      // Get price prediction
      const prediction = await pythonBridge.predictPriceMovement(symbol, historicalData);
      
      // Get recent news
      const news = await NewsService.getRecentNews(symbol);
      let sentimentScore = 0;
      
      // Analyze sentiment if news available
      if (news.length > 0) {
        const combinedText = news.map(item => item.title + ' ' + item.description).join(' ');
        const sentiment = await pythonBridge.analyzeSentiment(combinedText);
        sentimentScore = sentiment.score;
      }
      
      // Combine prediction and sentiment for final decision
      const combinedSignal = prediction.prediction * 0.7 + sentimentScore * 0.3;
      
      // Apply risk level adjustment
      let riskMultiplier = 1.0;
      switch (settings.riskLevel) {
        case 'LOW':
          riskMultiplier = 0.5;
          break;
        case 'MEDIUM':
          riskMultiplier = 1.0;
          break;
        case 'HIGH':
          riskMultiplier = 2.0;
          break;
      }
      
      // Make trading decision
      if (combinedSignal > 0.15 * riskMultiplier) {
        await this.executeTrade(symbol, 'BUY', settings.maxTradeAmount * riskMultiplier);
      } else if (combinedSignal < -0.15 * riskMultiplier) {
        await this.executeTrade(symbol, 'SELL', settings.maxTradeAmount * riskMultiplier);
      }
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
    }
  }
  
  private static async executeTrade(
    symbol: string, 
    action: 'BUY' | 'SELL', 
    amount: number
  ): Promise<boolean> {
    try {
      // Get current price
      const cryptoData = await CryptoService.getSelectedCryptos([symbol]);
      const currentPrice = cryptoData[0].currentPrice;
      
      // TODO: Implement actual trading via Coinbase API
      console.log(`EXECUTING ${action} for ${symbol}: ${amount} at $${currentPrice}`);
      
      // For now, just record the trade in history
      const trade: TradeHistory = {
        id: Date.now().toString(),
        cryptoId: symbol,
        type: action,
        amount: amount / currentPrice, // Convert USD to crypto amount
        price: currentPrice,
        timestamp: Date.now()
      };
      
      await StorageService.addTradeHistory(trade);
      return true;
    } catch (error) {
      console.error(`Failed to execute ${action} for ${symbol}:`, error);
      return false;
    }
  }
} 
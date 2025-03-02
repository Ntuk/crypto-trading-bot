// User settings
export interface UserSettings {
  riskLevel: number;
  tradingAmount: number;
  autoTrading: boolean;
  tradingInterval: number;
  tradingBotActive: boolean;
  monitoredCryptos: string[];
  tradeNotifications: boolean;
  priceAlerts: boolean;
  predictionAlerts: boolean;
  selectedCryptos?: string[]; // For backward compatibility
  tradingEnabled?: boolean;   // For backward compatibility
  maxTradeAmount?: number;    // For backward compatibility
}

// API credentials
export interface ApiKeys {
  apiKey: string;
  apiSecret: string;
}

// Trade history
export interface TradeHistory {
  id: string;
  cryptoId: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: number;
  total?: number;
  cryptocurrency?: string; // For backward compatibility
}

// Portfolio item
export interface PortfolioItem {
  cryptocurrency: string;
  amount: number;
  averageBuyPrice: number;
  lastUpdated: number;
}

// Cryptocurrency data
export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChangePercentage24h: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  currentPrice?: number; // For backward compatibility
}

// News item
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  date: string;
  relatedTo: string[];
  sentiment: number;
  content?: string;
}

// Price alert
export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  isAbove: boolean;
  triggered: boolean;
  createdAt: number;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  AuthLoading: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Trade: { symbol?: string; action?: 'BUY' | 'SELL' };
  Settings: undefined;
}; 
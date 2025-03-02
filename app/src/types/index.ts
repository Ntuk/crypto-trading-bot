export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
}

export interface TradeHistory {
  id: string;
  cryptoId: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: number;
}

export interface UserSettings {
  selectedCryptos: string[];
  tradingEnabled: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxTradeAmount: number;
} 
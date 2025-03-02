// Mock data for development
const MOCK_CRYPTO_DATA = [
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
];

// Mock historical data
const generateHistoricalData = (basePrice: number, days: number) => {
  const data = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const timestamp = Date.now() - i * 24 * 60 * 60 * 1000;
    const change = (Math.random() - 0.5) * 0.05 * currentPrice;
    currentPrice += change;
    
    data.push({
      timestamp,
      price: currentPrice,
    });
  }
  
  return data;
};

export class CryptoService {
  static async getTopCryptos(limit: number = 10): Promise<any[]> {
    try {
      // In a real app, you would fetch from an API
      // For development, return mock data
      return MOCK_CRYPTO_DATA.slice(0, limit);
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      return [];
    }
  }
  
  static async getSelectedCryptos(symbols: string[]): Promise<any[]> {
    try {
      // Filter mock data based on provided symbols
      return MOCK_CRYPTO_DATA.filter(crypto => 
        symbols.includes(crypto.symbol)
      );
    } catch (error) {
      console.error('Error fetching selected cryptos:', error);
      return [];
    }
  }
  
  static async getHistoricalData(symbol: string, interval: string, days: number = 30): Promise<any[]> {
    try {
      // Find the crypto in our mock data
      const crypto = MOCK_CRYPTO_DATA.find(c => c.symbol === symbol);
      
      if (!crypto) {
        throw new Error(`Crypto ${symbol} not found`);
      }
      
      // Generate mock historical data
      return generateHistoricalData(crypto.price, days);
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }
  
  static async getCryptoDetails(id: string): Promise<any> {
    try {
      // Find the crypto in our mock data
      const crypto = MOCK_CRYPTO_DATA.find(c => c.id === id || c.symbol === id);
      
      if (!crypto) {
        throw new Error(`Crypto ${id} not found`);
      }
      
      return {
        ...crypto,
        description: `${crypto.name} is a popular cryptocurrency.`,
        website: `https://${crypto.id}.org`,
        twitter: `https://twitter.com/${crypto.id}`,
        reddit: `https://reddit.com/r/${crypto.id}`,
        github: `https://github.com/${crypto.id}`,
      };
    } catch (error) {
      console.error(`Error fetching details for ${id}:`, error);
      return null;
    }
  }
} 
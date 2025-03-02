import { CryptoAsset } from '../types';

const COINBASE_API_URL = 'https://api.coinbase.com/v2';

export class CryptoService {
  static async getSelectedCryptos(symbols: string[]): Promise<CryptoAsset[]> {
    try {
      const promises = symbols.map(symbol =>
        fetch(`${COINBASE_API_URL}/prices/${symbol}-USD/spot`)
      );
      const responses = await Promise.all(promises);
      const data = await Promise.all(
        responses.map(response => response.json())
      );

      return data.map((item, index) => ({
        id: symbols[index],
        symbol: symbols[index],
        name: item.data.base,
        currentPrice: parseFloat(item.data.amount),
        priceChange24h: 0, // We'll need to calculate this from historical data
      }));
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      throw error;
    }
  }

  static async getHistoricalData(
    symbol: string,
    timeframe: '1h' | '1d' | '1w'
  ) {
    try {
      const response = await fetch(
        `${COINBASE_API_URL}/products/${symbol}-USD/candles?granularity=${
          timeframe === '1h' ? 3600 : timeframe === '1d' ? 86400 : 604800
        }`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }
} 
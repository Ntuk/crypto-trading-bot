import { MMKV } from 'react-native-mmkv';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedTo: string[]; // Crypto symbols this news is related to
}

const NEWS_API_KEY = 'YOUR_NEWS_API_KEY'; // Replace with your actual API key
const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const CRYPTO_KEYWORDS = {
  'BTC': ['bitcoin', 'btc'],
  'ETH': ['ethereum', 'eth'],
  'SOL': ['solana', 'sol'],
  'ADA': ['cardano', 'ada'],
  'DOT': ['polkadot', 'dot'],
  'DOGE': ['dogecoin', 'doge'],
  'XRP': ['ripple', 'xrp'],
};

// Storage for caching news
const newsStorage = new MMKV();

export class NewsService {
  static async getRecentNews(symbol: string): Promise<NewsItem[]> {
    try {
      // Check cache first
      const cachedNews = this.getCachedNews(symbol);
      if (cachedNews && this.isCacheValid(symbol)) {
        return cachedNews;
      }
      
      // Fetch fresh news
      const keywords = CRYPTO_KEYWORDS[symbol] || [symbol.toLowerCase()];
      const query = keywords.join(' OR ');
      
      const response = await fetch(
        `${NEWS_API_URL}?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}&language=en&pageSize=10`
      );
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`News API error: ${data.message || 'Unknown error'}`);
      }
      
      const news: NewsItem[] = data.articles.map((article: any) => ({
        id: article.url,
        title: article.title,
        description: article.description || '',
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        relatedTo: [symbol]
      }));
      
      // Cache the results
      this.cacheNews(symbol, news);
      
      return news;
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      
      // Return cached news even if expired in case of error
      const cachedNews = this.getCachedNews(symbol);
      return cachedNews || [];
    }
  }
  
  private static getCachedNews(symbol: string): NewsItem[] | null {
    const cachedData = newsStorage.getString(`news_${symbol}`);
    if (!cachedData) return null;
    
    try {
      return JSON.parse(cachedData);
    } catch {
      return null;
    }
  }
  
  private static cacheNews(symbol: string, news: NewsItem[]): void {
    newsStorage.set(`news_${symbol}`, JSON.stringify(news));
    newsStorage.set(`news_${symbol}_timestamp`, Date.now().toString());
  }
  
  private static isCacheValid(symbol: string): boolean {
    const timestamp = newsStorage.getString(`news_${symbol}_timestamp`);
    if (!timestamp) return false;
    
    // Cache valid for 1 hour (3600000 ms)
    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge < 3600000;
  }
  
  static async getNewsForAllWatchedCryptos(symbols: string[]): Promise<NewsItem[]> {
    try {
      const allNews: NewsItem[] = [];
      const uniqueUrls = new Set<string>();
      
      for (const symbol of symbols) {
        const news = await this.getRecentNews(symbol);
        
        for (const item of news) {
          if (!uniqueUrls.has(item.url)) {
            uniqueUrls.add(item.url);
            allNews.push(item);
          }
        }
      }
      
      // Sort by published date (newest first)
      return allNews.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching news for all cryptos:', error);
      return [];
    }
  }
} 
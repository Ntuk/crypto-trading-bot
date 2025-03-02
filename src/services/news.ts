// Mock news data
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Bitcoin Surges Past $50,000 as Institutional Adoption Grows',
    description: 'Bitcoin has surpassed the $50,000 mark as more institutions add it to their balance sheets.',
    url: 'https://example.com/news/1',
    imageUrl: 'https://example.com/images/bitcoin.jpg',
    source: 'Crypto News',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    relatedTo: ['BTC'],
    sentiment: 0.8,
  },
  {
    id: '2',
    title: 'Ethereum 2.0 Upgrade on Track for Q3 Completion',
    description: 'The Ethereum network upgrade to proof-of-stake is progressing well according to developers.',
    url: 'https://example.com/news/2',
    imageUrl: 'https://example.com/images/ethereum.jpg',
    source: 'DeFi Daily',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    relatedTo: ['ETH'],
    sentiment: 0.6,
  },
  {
    id: '3',
    title: 'Solana Experiences Network Outage, Developers Working on Fix',
    description: 'The Solana blockchain experienced a temporary outage due to high transaction volume.',
    url: 'https://example.com/news/3',
    imageUrl: 'https://example.com/images/solana.jpg',
    source: 'Blockchain Report',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    relatedTo: ['SOL'],
    sentiment: -0.3,
  },
  {
    id: '4',
    title: 'Cardano Launches Smart Contract Functionality',
    description: 'Cardano has successfully implemented smart contract capabilities on its mainnet.',
    url: 'https://example.com/news/4',
    imageUrl: 'https://example.com/images/cardano.jpg',
    source: 'Crypto Insider',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    relatedTo: ['ADA'],
    sentiment: 0.7,
  },
  {
    id: '5',
    title: 'Crypto Market Faces Correction as Regulatory Concerns Mount',
    description: 'The overall cryptocurrency market is experiencing a pullback amid regulatory uncertainty.',
    url: 'https://example.com/news/5',
    imageUrl: 'https://example.com/images/market.jpg',
    source: 'Financial Times',
    date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    relatedTo: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'],
    sentiment: -0.5,
  },
];

export class NewsService {
  static async getRecentNews(symbol?: string, limit: number = 10): Promise<any[]> {
    try {
      // Filter news by symbol if provided
      let filteredNews = MOCK_NEWS;
      
      if (symbol) {
        filteredNews = MOCK_NEWS.filter(news => 
          news.relatedTo.includes(symbol)
        );
      }
      
      // Sort by date (newest first) and limit
      return filteredNews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
  
  static async getNewsDetails(id: string): Promise<any> {
    try {
      const news = MOCK_NEWS.find(item => item.id === id);
      
      if (!news) {
        throw new Error(`News item ${id} not found`);
      }
      
      return {
        ...news,
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl.
        
        Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl.`,
      };
    } catch (error) {
      console.error(`Error fetching news details for ${id}:`, error);
      return null;
    }
  }
  
  static async getMarketSentiment(): Promise<number> {
    try {
      // Calculate average sentiment from recent news
      const recentNews = await this.getRecentNews();
      
      if (recentNews.length === 0) {
        return 0;
      }
      
      const totalSentiment = recentNews.reduce((sum, news) => sum + news.sentiment, 0);
      return totalSentiment / recentNews.length;
    } catch (error) {
      console.error('Error calculating market sentiment:', error);
      return 0;
    }
  }
} 
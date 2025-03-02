import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NewsService } from '../services/news';
import { StorageService } from '../services/storage';
import { pythonBridge } from '../services/pythonBridge';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  relatedTo: string[];
  sentiment?: {
    score: number;
    label: string;
  };
}

export const NewsScreen = () => {
  const navigation = useNavigation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [analyzingSentiment, setAnalyzingSentiment] = useState<boolean>(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      
      // Get user settings to know which cryptos to fetch news for
      const settings = StorageService.getUserSettings();
      if (!settings || settings.selectedCryptos.length === 0) {
        // If no cryptos selected, use default ones
        const defaultSettings = StorageService.getDefaultSettings();
        await fetchNews(defaultSettings.selectedCryptos);
      } else {
        await fetchNews(settings.selectedCryptos);
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async (symbols: string[]) => {
    try {
      const newsItems = await NewsService.getNewsForAllWatchedCryptos(symbols);
      setNews(newsItems);
      
      // Analyze sentiment for news items
      analyzeSentiment(newsItems);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const analyzeSentiment = async (newsItems: NewsItem[]) => {
    try {
      setAnalyzingSentiment(true);
      
      // Initialize Python bridge
      await pythonBridge.initialize();
      
      // Process news in batches to avoid overloading
      const batchSize = 5;
      const updatedNews = [...newsItems];
      
      for (let i = 0; i < updatedNews.length; i += batchSize) {
        const batch = updatedNews.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item, index) => {
            try {
              const text = item.title + ' ' + item.description;
              const sentiment = await pythonBridge.analyzeSentiment(text);
              updatedNews[i + index].sentiment = sentiment;
            } catch (error) {
              console.error(`Error analyzing sentiment for news item ${item.id}:`, error);
            }
          })
        );
        
        // Update state after each batch
        setNews([...updatedNews]);
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const openNewsLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSentimentColor = (sentiment?: { score: number; label: string }) => {
    if (!sentiment) return 'bg-gray-500';
    
    if (sentiment.label === 'positive') return 'bg-green-500';
    if (sentiment.label === 'negative') return 'bg-red-500';
    return 'bg-yellow-500';
  };

  const getSentimentText = (sentiment?: { score: number; label: string }) => {
    if (!sentiment) return 'Analyzing...';
    
    if (sentiment.label === 'positive') return 'Bullish';
    if (sentiment.label === 'negative') return 'Bearish';
    return 'Neutral';
  };

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      className="bg-surface rounded-lg p-4 mb-3"
      onPress={() => openNewsLink(item.url)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-gray-400 text-xs">{item.source}</Text>
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-1 ${getSentimentColor(
              item.sentiment
            )}`}
          />
          <Text
            className={`text-xs ${
              item.sentiment?.label === 'positive'
                ? 'text-green-500'
                : item.sentiment?.label === 'negative'
                ? 'text-red-500'
                : 'text-yellow-500'
            }`}
          >
            {getSentimentText(item.sentiment)}
          </Text>
        </View>
      </View>
      
      <Text className="text-white text-base font-semibold mb-2">
        {item.title}
      </Text>
      
      <Text className="text-gray-400 text-sm mb-3" numberOfLines={3}>
        {item.description}
      </Text>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-gray-500 text-xs">
          {formatDate(item.publishedAt)}
        </Text>
        
        <View className="flex-row">
          {item.relatedTo.map((symbol) => (
            <View
              key={symbol}
              className="bg-primary bg-opacity-20 px-2 py-1 rounded-md mr-1"
            >
              <Text className="text-primary text-xs">{symbol}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-surface p-4 flex-row justify-between items-center">
        <Text className="text-white text-xl font-semibold">Crypto News</Text>
        
        {analyzingSentiment && (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text className="text-gray-400 ml-2 text-sm">
              Analyzing sentiment...
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-400 mt-4">Loading news...</Text>
        </View>
      ) : news.length > 0 ? (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Image
            source={require('../../assets/empty-news.png')}
            className="w-40 h-40 mb-4 opacity-50"
          />
          <Text className="text-white text-lg font-semibold mb-2">
            No News Available
          </Text>
          <Text className="text-gray-400 text-center mb-6">
            We couldn't find any news for your selected cryptocurrencies.
          </Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg"
            onPress={handleRefresh}
          >
            <Text className="text-white font-semibold">Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; 
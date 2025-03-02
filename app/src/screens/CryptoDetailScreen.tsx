import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { CryptoService } from '../services/crypto';
import { pythonBridge } from '../services/pythonBridge';
import { NewsService } from '../services/news';
import { StorageService } from '../services/storage';

const { width } = Dimensions.get('window');

export const CryptoDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol } = route.params as { symbol: string };
  
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1h' | '1d' | '1w'>('1d');
  const [prediction, setPrediction] = useState<{
    prediction: number;
    confidence: number;
  } | null>(null);
  const [sentiment, setSentiment] = useState<{
    score: number;
    label: string;
  } | null>(null);
  const [inPortfolio, setInPortfolio] = useState<boolean>(false);
  const [portfolioAmount, setPortfolioAmount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [symbol, timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get crypto data
      const data = await CryptoService.getSelectedCryptos([symbol]);
      if (data.length > 0) {
        setCryptoData(data[0]);
      }
      
      // Get historical data
      const history = await CryptoService.getHistoricalData(symbol, timeframe);
      setHistoricalData(history);
      
      // Check if in portfolio
      const portfolio = await StorageService.getPortfolio();
      if (portfolio[symbol]) {
        setInPortfolio(true);
        setPortfolioAmount(portfolio[symbol]);
      } else {
        setInPortfolio(false);
        setPortfolioAmount(0);
      }
      
      // Get AI prediction
      await loadPrediction();
      
      // Get sentiment analysis
      await loadSentiment();
    } catch (error) {
      console.error(`Error loading data for ${symbol}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrediction = async () => {
    try {
      // Initialize Python bridge
      await pythonBridge.initialize();
      
      // Get historical data for prediction
      const history = await CryptoService.getHistoricalData(symbol, '1d');
      
      // Get prediction
      const pred = await pythonBridge.predictPriceMovement(symbol, history);
      setPrediction(pred);
    } catch (error) {
      console.error(`Error getting prediction for ${symbol}:`, error);
    }
  };

  const loadSentiment = async () => {
    try {
      // Get recent news
      const news = await NewsService.getRecentNews(symbol);
      
      if (news.length > 0) {
        // Combine news text
        const combinedText = news.map(item => item.title + ' ' + item.description).join(' ');
        
        // Analyze sentiment
        const sentimentResult = await pythonBridge.analyzeSentiment(combinedText);
        setSentiment(sentimentResult);
      }
    } catch (error) {
      console.error(`Error analyzing sentiment for ${symbol}:`, error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getChartData = () => {
    if (!historicalData || historicalData.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [0], color: () => '#2563eb' }],
      };
    }

    // Extract closing prices and timestamps
    const prices = historicalData.map(candle => parseFloat(candle[4]));
    
    // Generate labels based on timeframe
    let labels: string[] = [];
    if (timeframe === '1h') {
      labels = historicalData.map(candle => {
        const date = new Date(candle[0] * 1000);
        return `${date.getHours()}:00`;
      });
    } else if (timeframe === '1d') {
      labels = historicalData.map(candle => {
        const date = new Date(candle[0] * 1000);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
    } else {
      labels = historicalData.map(candle => {
        const date = new Date(candle[0] * 1000);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
    }

    // Take only a subset of labels to avoid overcrowding
    const labelCount = 6;
    const step = Math.ceil(labels.length / labelCount);
    const filteredLabels = labels.filter((_, i) => i % step === 0);

    return {
      labels: filteredLabels,
      datasets: [
        {
          data: prices,
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getPredictionColor = () => {
    if (!prediction) return 'text-gray-400';
    
    if (prediction.prediction > 0.05) return 'text-green-500';
    if (prediction.prediction < -0.05) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getPredictionText = () => {
    if (!prediction) return 'Loading...';
    
    if (prediction.prediction > 0.1) return 'Strong Buy';
    if (prediction.prediction > 0.05) return 'Buy';
    if (prediction.prediction > 0) return 'Weak Buy';
    if (prediction.prediction > -0.05) return 'Weak Sell';
    if (prediction.prediction > -0.1) return 'Sell';
    return 'Strong Sell';
  };

  const getSentimentColor = () => {
    if (!sentiment) return 'text-gray-400';
    
    if (sentiment.label === 'positive') return 'text-green-500';
    if (sentiment.label === 'negative') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentText = () => {
    if (!sentiment) return 'Loading...';
    
    if (sentiment.label === 'positive') return 'Bullish';
    if (sentiment.label === 'negative') return 'Bearish';
    return 'Neutral';
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-surface p-4 flex-row items-center">
        <TouchableOpacity
          className="mr-4"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {cryptoData && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">
                {cryptoData.symbol.charAt(0)}
              </Text>
            </View>
            <View>
              <Text className="text-white text-xl font-semibold">
                {cryptoData.name}
              </Text>
              <Text className="text-gray-400">{cryptoData.symbol}</Text>
            </View>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-400 mt-4">Loading data...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Price Card */}
          {cryptoData && (
            <View className="bg-surface m-4 rounded-xl p-4">
              <Text className="text-gray-400">Current Price</Text>
              <Text className="text-white text-3xl font-bold">
                ${cryptoData.currentPrice.toFixed(2)}
              </Text>
              
              <Text
                className={
                  cryptoData.priceChange24h >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              >
                {cryptoData.priceChange24h >= 0 ? '+' : ''}
                {cryptoData.priceChange24h.toFixed(2)}% (24h)
              </Text>
              
              {inPortfolio && (
                <View className="mt-2 p-2 bg-primary bg-opacity-10 rounded-lg">
                  <Text className="text-primary">
                    You own: {portfolioAmount.toFixed(6)} {symbol}
                  </Text>
                  <Text className="text-gray-400">
                    Value: ${(portfolioAmount * cryptoData.currentPrice).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Chart */}
          <View className="bg-surface mx-4 rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                Price Chart
              </Text>
              
              <View className="flex-row">
                <TouchableOpacity
                  className={`px-3 py-1 rounded-lg mr-2 ${
                    timeframe === '1h' ? 'bg-primary' : 'bg-gray-700'
                  }`}
                  onPress={() => setTimeframe('1h')}
                >
                  <Text
                    className={`${
                      timeframe === '1h' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    1H
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`px-3 py-1 rounded-lg mr-2 ${
                    timeframe === '1d' ? 'bg-primary' : 'bg-gray-700'
                  }`}
                  onPress={() => setTimeframe('1d')}
                >
                  <Text
                    className={`${
                      timeframe === '1d' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    1D
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`px-3 py-1 rounded-lg ${
                    timeframe === '1w' ? 'bg-primary' : 'bg-gray-700'
                  }`}
                  onPress={() => setTimeframe('1w')}
                >
                  <Text
                    className={`${
                      timeframe === '1w' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    1W
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {historicalData.length > 0 ? (
              <LineChart
                data={getChartData()}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#1e293b',
                  backgroundGradientFrom: '#1e293b',
                  backgroundGradientTo: '#1e293b',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#2563eb',
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            ) : (
              <View className="h-[220px] justify-center items-center">
                <Text className="text-gray-400">No chart data available</Text>
              </View>
            )}
          </View>

          {/* AI Predictions */}
          <View className="bg-surface mx-4 rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">
              AI Predictions
            </Text>
            
            <View className="flex-row justify-between mb-4">
              <View className="flex-1 bg-gray-800 rounded-lg p-3 mr-2">
                <Text className="text-gray-400 mb-1">Price Prediction</Text>
                <Text className={`text-lg font-semibold ${getPredictionColor()}`}>
                  {getPredictionText()}
                </Text>
                {prediction && (
                  <Text className="text-gray-400 text-xs mt-1">
                    Confidence: {Math.round(prediction.confidence * 100)}%
                  </Text>
                )}
              </View>
              
              <View className="flex-1 bg-gray-800 rounded-lg p-3 ml-2">
                <Text className="text-gray-400 mb-1">News Sentiment</Text>
                <Text className={`text-lg font-semibold ${getSentimentColor()}`}>
                  {getSentimentText()}
                </Text>
                {sentiment && (
                  <Text className="text-gray-400 text-xs mt-1">
                    Score: {sentiment.score.toFixed(2)}
                  </Text>
                )}
              </View>
            </View>
            
            <Text className="text-gray-400 text-xs">
              Predictions are based on historical data analysis and news sentiment.
              Past performance is not indicative of future results.
            </Text>
          </View>

          {/* Trade Actions */}
          <View className="bg-surface mx-4 rounded-xl p-4 mb-8">
            <Text className="text-white text-lg font-semibold mb-4">
              Trade Actions
            </Text>
            
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 bg-green-600 p-3 rounded-lg mr-2 items-center"
                onPress={() => navigation.navigate('Trade', { symbol, action: 'BUY' })}
              >
                <Text className="text-white font-semibold">Buy {symbol}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-red-600 p-3 rounded-lg ml-2 items-center"
                onPress={() => navigation.navigate('Trade', { symbol, action: 'SELL' })}
              >
                <Text className="text-white font-semibold">Sell {symbol}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}; 
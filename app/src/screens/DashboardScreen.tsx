import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StorageService } from '../services/storage';
import { CryptoService } from '../services/crypto';
import { CryptoAsset, TradeHistory } from '../types';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const [portfolio, setPortfolio] = useState<{ [symbol: string]: number }>({});
  const [cryptoData, setCryptoData] = useState<CryptoAsset[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Load portfolio
      const userPortfolio = await StorageService.getPortfolio();
      setPortfolio(userPortfolio);
      
      // Load crypto data for portfolio assets
      const symbols = Object.keys(userPortfolio);
      if (symbols.length > 0) {
        const data = await CryptoService.getSelectedCryptos(symbols);
        setCryptoData(data);
        
        // Calculate total portfolio value
        let total = 0;
        for (const crypto of data) {
          total += crypto.currentPrice * (userPortfolio[crypto.symbol] || 0);
        }
        setTotalValue(total);
      }
      
      // Load recent trade history
      const history = await StorageService.getTradeHistory();
      setTradeHistory(history.slice(0, 10)); // Show only 10 most recent trades
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getPortfolioChartData = () => {
    // This would ideally use historical portfolio value data
    // For now, we'll just use dummy data
    return {
      labels: ['1d', '7d', '14d', '30d', '60d', '90d'],
      datasets: [
        {
          data: [
            totalValue * 0.95,
            totalValue * 0.9,
            totalValue * 1.05,
            totalValue * 0.85,
            totalValue * 0.8,
            totalValue,
          ],
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadData} />
      }
    >
      {/* Portfolio Value Card */}
      <View className="bg-surface m-4 rounded-xl p-4">
        <Text className="text-gray-400 text-base">Portfolio Value</Text>
        <Text className="text-white text-3xl font-bold">
          ${totalValue.toFixed(2)}
        </Text>
        
        {totalValue > 0 && (
          <View className="mt-4">
            <LineChart
              data={getPortfolioChartData()}
              width={width - 40}
              height={180}
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
                  r: '6',
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
          </View>
        )}
      </View>

      {/* Assets List */}
      <View className="mx-4 mt-2">
        <Text className="text-white text-xl font-semibold mb-2">Assets</Text>
        {cryptoData.length > 0 ? (
          cryptoData.map((crypto) => (
            <TouchableOpacity
              key={crypto.id}
              className="bg-surface rounded-lg p-4 mb-3 flex-row justify-between items-center"
              onPress={() => navigation.navigate('CryptoDetail', { symbol: crypto.symbol })}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">{crypto.symbol.charAt(0)}</Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">{crypto.name}</Text>
                  <Text className="text-gray-400">{crypto.symbol}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white font-semibold">
                  ${crypto.currentPrice.toFixed(2)}
                </Text>
                <Text
                  className={
                    crypto.priceChange24h >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {crypto.priceChange24h >= 0 ? '+' : ''}
                  {crypto.priceChange24h.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="bg-surface rounded-lg p-6 items-center">
            <Text className="text-gray-400 text-center">
              No assets in your portfolio yet. Start trading to see your assets here.
            </Text>
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-lg mt-4"
              onPress={() => navigation.navigate('Trading')}
            >
              <Text className="text-white font-semibold">Start Trading</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Trades */}
      <View className="mx-4 mt-6 mb-8">
        <Text className="text-white text-xl font-semibold mb-2">
          Recent Trades
        </Text>
        {tradeHistory.length > 0 ? (
          tradeHistory.map((trade) => (
            <View
              key={trade.id}
              className="bg-surface rounded-lg p-4 mb-3 flex-row justify-between"
            >
              <View>
                <Text className="text-white font-semibold">
                  {trade.type} {trade.cryptoId}
                </Text>
                <Text className="text-gray-400">
                  {new Date(trade.timestamp).toLocaleString()}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className={
                    trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {trade.type === 'BUY' ? '+' : '-'}
                  {trade.amount.toFixed(6)} {trade.cryptoId}
                </Text>
                <Text className="text-gray-400">
                  ${trade.price.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-surface rounded-lg p-6">
            <Text className="text-gray-400 text-center">
              No trade history yet. Your recent trades will appear here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}; 
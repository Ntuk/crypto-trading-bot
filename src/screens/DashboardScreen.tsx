import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { CryptoService } from '../services/crypto';
import { StorageService } from '../services/storage';
import { TradingService } from '../services/trading';
import { CoinbaseApiService } from '../services/coinbaseApi';
import { NotificationService } from '../services/notification';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { MainTabParamList, CryptoData, UserSettings } from '../types';

type DashboardScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

const screenWidth = Dimensions.get('window').width;

interface PortfolioItem {
  currency: string;
  balance: number;
  value: number;
}

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [botActive, setBotActive] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DashboardScreen mounted');
    const initializeScreen = async () => {
      try {
        console.log('Checking for API keys...');
        const hasKeys = await StorageService.hasApiKeys();
        console.log('Has API keys:', hasKeys);
        
        setHasApiKeys(hasKeys);
        
        if (hasKeys) {
          // Wait for state to update before loading data
          setTimeout(async () => {
            console.log('API keys found, loading data...');
            await loadData(true);
            await checkBotStatus();
          }, 0);
        } else {
          console.log('No API keys found, showing API key setup screen');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        setError('Failed to initialize dashboard. Please try again.');
        setHasApiKeys(false);
        setLoading(false);
      }
    };
    
    initializeScreen();
    
    // Set up refresh interval only if we have API keys
    let interval: NodeJS.Timeout;
    if (hasApiKeys) {
      console.log('Setting up refresh interval');
      interval = setInterval(() => {
        loadData(false);
      }, 60000); // Refresh every minute
    }
    
    return () => {
      if (interval) {
        console.log('Cleaning up refresh interval');
        clearInterval(interval);
      }
    };
  }, []);

  const checkApiKeys = async () => {
    try {
      const hasKeys = await StorageService.hasApiKeys();
      setHasApiKeys(hasKeys);
    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  };

  const checkBotStatus = async () => {
    try {
      const settings = await StorageService.getUserSettings();
      setSettings(settings);
      setBotActive(settings?.tradingBotActive || false);
    } catch (error) {
      console.error('Error checking bot status:', error);
    }
  };

  const loadData = async (showLoading = true) => {
    console.log('loadData called with showLoading:', showLoading);
    
    // Get fresh API keys status
    const hasKeys = await StorageService.hasApiKeys();
    console.log('Current API keys status:', hasKeys);
    
    if (!hasKeys) {
      console.log('No API keys, skipping data load');
      setLoading(false);
      setHasApiKeys(false);
      return;
    }
    
    if (showLoading) {
      console.log('Setting loading state to true');
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('Loading dashboard data...');
      
      // Get crypto data
      console.log('Fetching top cryptos...');
      const cryptos = await CoinbaseApiService.getTopCryptos(5);
      console.log('Fetched top cryptos:', cryptos);
      setCryptoData(cryptos);
      
      // Get portfolio data
      console.log('Fetching Coinbase accounts...');
      const accounts = await CoinbaseApiService.getAccounts();
      console.log('Received accounts:', accounts);
      
      if (accounts && accounts.length > 0) {
        const portfolioData = [];
        let totalPortfolioValue = 0;
        
        for (const account of accounts) {
          console.log('Processing account:', account);
          if (parseFloat(account.balance) > 0) {
            let value = 0;
            
            if (account.currency === 'USD') {
              value = parseFloat(account.balance);
              console.log('USD account value:', value);
            } else {
              try {
                console.log(`Getting spot price for ${account.currency}-USD`);
                const price = await CoinbaseApiService.getSpotPrice(`${account.currency}-USD`);
                value = parseFloat(account.balance) * price;
                console.log(`${account.currency} price: ${price}, value: ${value}`);
              } catch (error) {
                console.error(`Error getting price for ${account.currency}:`, error);
                const cryptoMatch = cryptos.find(c => c.symbol === account.currency);
                if (cryptoMatch) {
                  value = parseFloat(account.balance) * cryptoMatch.price;
                  console.log(`Using crypto data price for ${account.currency}: ${cryptoMatch.price}, value: ${value}`);
                }
              }
            }
            
            portfolioData.push({
              currency: account.currency,
              balance: parseFloat(account.balance),
              value
            });
            
            totalPortfolioValue += value;
            console.log(`Updated total portfolio value: ${totalPortfolioValue}`);
          }
        }
        
        console.log('Setting portfolio data:', portfolioData);
        setPortfolio(portfolioData);
        setTotalValue(totalPortfolioValue);
      } else {
        console.log('No accounts found or empty accounts array');
        setPortfolio([]);
        setTotalValue(0);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and API keys.');
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.log('Unauthorized error detected, setting hasApiKeys to false');
        setHasApiKeys(false);
      }
      setPortfolio([]);
      setTotalValue(0);
      setCryptoData([]);
    } finally {
      console.log('Finishing data load, setting loading and refreshing to false');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const toggleTradingBot = async () => {
    try {
      if (!settings) return;
      
      if (botActive) {
        await TradingService.stopTradingBot();
        NotificationService.sendLocalNotification(
          'Trading Bot Stopped',
          'The automated trading bot has been stopped.'
        );
      } else {
        await TradingService.startTradingBot();
        NotificationService.sendLocalNotification(
          'Trading Bot Started',
          'The automated trading bot is now running and will execute trades based on your settings.'
        );
      }
      
      // Update settings
      const updatedSettings: UserSettings = {
        ...settings,
        tradingBotActive: !botActive
      };
      await StorageService.saveUserSettings(updatedSettings);
      setSettings(updatedSettings);
      setBotActive(!botActive);
      
    } catch (error) {
      console.error('Error toggling trading bot:', error);
      Alert.alert('Error', 'Failed to toggle trading bot. Please try again.');
    }
  };

  const renderPortfolioChart = () => {
    if (portfolio.length === 0) return null;
    
    const chartData = {
      labels: portfolio.map(item => item.currency),
      datasets: [
        {
          data: portfolio.map(item => item.value)
        }
      ]
    };
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Portfolio Distribution</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#1e1e1e',
            backgroundGradientFrom: '#1e1e1e',
            backgroundGradientTo: '#3a3a3a',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726'
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
    );
  };

  const renderNoApiKeysMessage = () => {
    return (
      <View style={styles.noApiKeysContainer}>
        <MaterialIcons name="vpn-key" size={48} color="#666" />
        <Text style={styles.noApiKeysTitle}>API Keys Required</Text>
        <Text style={styles.noApiKeysText}>
          To view your portfolio and execute trades, you need to add your Coinbase API keys.
        </Text>
        <TouchableOpacity 
          style={styles.addKeysButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.addKeysButtonText}>Add API Keys</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadData()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ecdc4" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </View>
    );
  }

  // Render no API keys state
  if (!hasApiKeys) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        {renderNoApiKeysMessage()}
      </View>
    );
  }

  // Main dashboard render
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity 
            style={[styles.botButton, { backgroundColor: botActive ? '#ff6b6b' : '#4ecdc4' }]}
            onPress={toggleTradingBot}
          >
            <Text style={styles.botButtonText}>{botActive ? 'Stop Bot' : 'Start Bot'}</Text>
            <FontAwesome5 name={botActive ? 'robot' : 'robot'} size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.portfolioContainer}>
          <Text style={styles.sectionTitle}>Portfolio Value</Text>
          <Text style={styles.portfolioValue}>${(totalValue || 0).toFixed(2)}</Text>
          
          {renderPortfolioChart()}
          
          <View style={styles.portfolioList}>
            {portfolio.map((item, index) => (
              <View key={index} style={styles.portfolioItem}>
                <Text style={styles.currencyName}>{item.currency}</Text>
                <View style={styles.balanceContainer}>
                  <Text style={styles.balance}>
                    {((item.balance || 0).toFixed(item.currency === 'USD' ? 2 : 6))} {item.currency}
                  </Text>
                  <Text style={styles.value}>${(item.value || 0).toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.marketContainer}>
          <Text style={styles.sectionTitle}>Market Overview</Text>
          {cryptoData.map((crypto, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.cryptoItem}
              onPress={() => (navigation as any).navigate('Trade', { symbol: crypto.symbol })}
            >
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoName}>{crypto.name} ({crypto.symbol})</Text>
                <Text style={styles.cryptoPrice}>${(crypto.price || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.cryptoChange}>
                <MaterialIcons 
                  name={crypto.priceChangePercentage24h >= 0 ? 'trending-up' : 'trending-down'} 
                  size={24} 
                  color={crypto.priceChangePercentage24h >= 0 ? '#4ecdc4' : '#ff6b6b'} 
                />
                <Text 
                  style={[
                    styles.changeText, 
                    {color: crypto.priceChangePercentage24h >= 0 ? '#4ecdc4' : '#ff6b6b'}
                  ]}
                >
                  {((crypto.priceChangePercentage24h || 0).toFixed(2))}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  botButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#4ecdc4',
  },
  botButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  noApiKeysContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    margin: 16,
    padding: 24,
    alignItems: 'center',
  },
  noApiKeysTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noApiKeysText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  addKeysButton: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addKeysButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  portfolioContainer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  chartContainer: {
    marginVertical: 16,
  },
  portfolioList: {
    marginTop: 16,
  },
  portfolioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  currencyName: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 14,
    color: '#ccc',
  },
  value: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  marketContainer: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  cryptoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoName: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  cryptoPrice: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  cryptoChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    width: '45%',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
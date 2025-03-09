import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, FlatList, Switch } from 'react-native';
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreCryptos, setHasMoreCryptos] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5; // Number of cryptos to load per page
  const [useMockData, setUseMockData] = useState(true);
  const [useProxy, setUseProxy] = useState(false);

  useEffect(() => {
    console.log('DashboardScreen mounted');
    const initializeScreen = async () => {
      try {
        console.log('Checking for API keys...');
        const hasKeys = await StorageService.hasApiKeys();
        console.log('Has API keys:', hasKeys);
        
        setHasApiKeys(hasKeys);
        
        // Initialize mock data and proxy settings
        setUseMockData(CoinbaseApiService.isUsingMockData());
        setUseProxy(CoinbaseApiService.isUsingProxy());
        
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
      
      // Reset pagination state when doing a full refresh
      setCurrentPage(0);
      
      // Get crypto data with pagination
      console.log('Fetching top cryptos...');
      const result = await CoinbaseApiService.getTopCryptos(pageSize, 0);
      console.log('Fetched top cryptos:', result.data);
      setCryptoData(result.data);
      setHasMoreCryptos(result.hasMore);
      
      // Get portfolio data
      console.log('Fetching Coinbase accounts...');
      const accountsResponse = await CoinbaseApiService.getAccounts();
      console.log('Received accounts response:', JSON.stringify(accountsResponse));

      // Extract accounts array from the response
      const accounts = accountsResponse?.accounts || [];
      console.log(`Processing ${accounts.length} accounts`);
      
      if (accounts && accounts.length > 0) {
        const portfolioData = [];
        let totalPortfolioValue = 0;
        
        for (const account of accounts) {
          console.log('Processing account:', JSON.stringify(account));
          
          // Check for different possible account balance property names
          let balance = '0';
          if (account.available_balance && account.available_balance.value) {
            balance = account.available_balance.value;
          } else if (account.balance) {
            balance = account.balance;
          } else if (account.available) {
            balance = account.available;
          } else if (account.amount) {
            balance = account.amount;
          }
          
          // Check for different possible currency property names
          let currency = '';
          if (account.currency) {
            currency = account.currency;
          } else if (account.available_balance && account.available_balance.currency) {
            currency = account.available_balance.currency;
          } else if (account.currency_id) {
            currency = account.currency_id;
          } else if (account.currency_code) {
            currency = account.currency_code;
          }
          
          console.log(`Account ${currency} has balance: ${balance}`);
          
          if (parseFloat(balance) > 0 && currency) {
            let value = 0;
            
            if (currency === 'USD') {
              value = parseFloat(balance);
              console.log('USD account value:', value);
            } else {
              try {
                console.log(`Getting spot price for ${currency}-USD`);
                const priceResponse = await CoinbaseApiService.getSpotPrice(`${currency}-USD`);
                // Handle different possible price response formats
                const price = typeof priceResponse === 'object' 
                  ? (priceResponse.price || priceResponse.amount || '0') 
                  : priceResponse;
                
                value = parseFloat(balance) * parseFloat(price);
                console.log(`${currency} price: ${price}, value: ${value}`);
              } catch (error) {
                console.error(`Error getting price for ${currency}:`, error);
                const cryptoMatch = cryptoData.find(c => c.symbol === currency);
                if (cryptoMatch) {
                  value = parseFloat(balance) * cryptoMatch.price;
                  console.log(`Using crypto data price for ${currency}: ${cryptoMatch.price}, value: ${value}`);
                }
              }
            }
            
            portfolioData.push({
              currency,
              balance: parseFloat(balance),
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

  const loadMoreCryptos = async () => {
    if (!hasMoreCryptos || loadingMore) return;
    
    try {
      setLoadingMore(true);
      console.log(`Loading more cryptos, page ${currentPage + 1}`);
      
      const nextPage = currentPage + 1;
      const result = await CoinbaseApiService.getTopCryptos(pageSize, nextPage);
      
      if (result.data.length > 0) {
        console.log(`Loaded ${result.data.length} more cryptos`);
        setCryptoData(prevData => [...prevData, ...result.data]);
        setCurrentPage(nextPage);
        setHasMoreCryptos(result.hasMore);
      } else {
        console.log('No more cryptos to load');
        setHasMoreCryptos(false);
      }
    } catch (error) {
      console.error('Error loading more cryptos:', error);
    } finally {
      setLoadingMore(false);
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

  const toggleMockData = (value: boolean) => {
    CoinbaseApiService.setUseMockData(value);
    setUseMockData(value);
    onRefresh();
  };

  const toggleProxy = (value: boolean) => {
    CoinbaseApiService.setUseProxy(value);
    setUseProxy(value);
    onRefresh();
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

  // Render crypto item for FlatList
  const renderCryptoItem = ({ item }: { item: CryptoData }) => (
    <TouchableOpacity 
      style={styles.cryptoItem}
      onPress={() => (navigation as any).navigate('Trade', { symbol: item.symbol })}
    >
      <View style={styles.cryptoInfo}>
        <Text style={styles.cryptoName}>{item.name} ({item.symbol})</Text>
        <Text style={styles.cryptoPrice}>${(item.price || 0).toFixed(2)}</Text>
      </View>
      <View style={styles.cryptoChange}>
        <MaterialIcons 
          name={item.priceChangePercentage24h >= 0 ? 'trending-up' : 'trending-down'} 
          size={24} 
          color={item.priceChangePercentage24h >= 0 ? '#4ecdc4' : '#ff6b6b'} 
        />
        <Text 
          style={[
            styles.changeText, 
            {color: item.priceChangePercentage24h >= 0 ? '#4ecdc4' : '#ff6b6b'}
          ]}
        >
          {((item.priceChangePercentage24h || 0).toFixed(2))}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render footer for FlatList (loading indicator)
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#4ecdc4" />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      );
    }
    
    if (!hasMoreCryptos && cryptoData.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>No more cryptocurrencies to load</Text>
        </View>
      );
    }
    
    return null;
  };

  // Render empty component for FlatList
  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4ecdc4" />
          <Text style={styles.emptyText}>Loading cryptocurrencies...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="sentiment-dissatisfied" size={48} color="#666" />
        <Text style={styles.emptyText}>No cryptocurrencies found</Text>
      </View>
    );
  };

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
        
        <View style={styles.dataSourceContainer}>
          <Text style={styles.dataSourceText}>Use Mock Data</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#4ecdc4' }}
            thumbColor={useMockData ? '#f4f3f4' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleMockData}
            value={useMockData}
          />
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Use CORS Proxy</Text>
          <Switch
            value={useProxy}
            onValueChange={toggleProxy}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useProxy ? '#f5dd4b' : '#f4f3f4'}
          />
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
          <FlatList
            data={cryptoData}
            renderItem={renderCryptoItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // Disable scrolling since it's inside ScrollView
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmptyComponent}
            onEndReached={loadMoreCryptos}
            onEndReachedThreshold={0.5}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
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
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingMoreText: {
    color: '#4ecdc4',
    marginLeft: 10,
  },
  dataSourceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  dataSourceText: {
    color: 'white',
    fontSize: 16,
  },
  endOfListContainer: {
    padding: 16,
    alignItems: 'center',
  },
  endOfListText: {
    color: '#888',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
  },
}); 
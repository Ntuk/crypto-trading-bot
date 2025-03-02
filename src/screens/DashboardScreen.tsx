import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { CryptoService } from '../services/crypto';
import { StorageService } from '../services/storage';
import { TradingService } from '../services/trading';
import { CoinbaseApiService } from '../services/coinbaseApi';
import { NotificationService } from '../services/notification';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cryptoData, setCryptoData] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [botActive, setBotActive] = useState(false);
  const [settings, setSettings] = useState(null);
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    checkApiKeys();
    loadData();
    checkBotStatus();
    
    // Set up refresh interval
    const interval = setInterval(() => {
      loadData(false);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const checkApiKeys = async () => {
    try {
      const keys = await StorageService.getApiKeys();
      setHasApiKeys(!!keys);
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
    if (showLoading) setLoading(true);
    try {
      // Get crypto data
      const cryptos = await CoinbaseApiService.getTopCryptos(5);
      setCryptoData(cryptos);
      
      // Get portfolio data
      const accounts = await CoinbaseApiService.getAccounts();
      if (accounts && accounts.length > 0) {
        const portfolioData = [];
        let totalPortfolioValue = 0;
        
        for (const account of accounts) {
          if (parseFloat(account.balance) > 0) {
            let value = 0;
            
            if (account.currency === 'USD') {
              value = parseFloat(account.balance);
            } else {
              try {
                const price = await CoinbaseApiService.getSpotPrice(`${account.currency}-USD`);
                value = parseFloat(account.balance) * price;
              } catch (error) {
                console.error(`Error getting price for ${account.currency}:`, error);
                // Use mock price from crypto data if available
                const cryptoMatch = cryptos.find(c => c.symbol === account.currency);
                if (cryptoMatch) {
                  value = parseFloat(account.balance) * cryptoMatch.price;
                }
              }
            }
            
            portfolioData.push({
              currency: account.currency,
              balance: parseFloat(account.balance),
              value
            });
            
            totalPortfolioValue += value;
          }
        }
        
        setPortfolio(portfolioData);
        setTotalValue(totalPortfolioValue);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please check your connection and API keys.');
    } finally {
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
      const updatedSettings = { ...settings, tradingBotActive: !botActive };
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

  return (
    <ScrollView 
      style={styles.container}
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
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ecdc4" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      ) : (
        <>
          {!hasApiKeys ? renderNoApiKeysMessage() : (
            <View style={styles.portfolioContainer}>
              <Text style={styles.sectionTitle}>Portfolio Value</Text>
              <Text style={styles.portfolioValue}>${totalValue.toFixed(2)}</Text>
              
              {renderPortfolioChart()}
              
              <View style={styles.portfolioList}>
                {portfolio.map((item, index) => (
                  <View key={index} style={styles.portfolioItem}>
                    <Text style={styles.currencyName}>{item.currency}</Text>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balance}>{item.balance.toFixed(item.currency === 'USD' ? 2 : 6)} {item.currency}</Text>
                      <Text style={styles.value}>${item.value.toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.marketContainer}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            {cryptoData.map((crypto, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.cryptoItem}
                onPress={() => navigation.navigate('Trade', { crypto })}
              >
                <View style={styles.cryptoInfo}>
                  <Text style={styles.cryptoName}>{crypto.name} ({crypto.symbol})</Text>
                  <Text style={styles.cryptoPrice}>${crypto.price.toFixed(2)}</Text>
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
                    {crypto.priceChangePercentage24h.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Trade')}
            >
              <MaterialIcons name="swap-horiz" size={24} color="white" />
              <Text style={styles.actionText}>Trade</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialIcons name="settings" size={24} color="white" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
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
}); 
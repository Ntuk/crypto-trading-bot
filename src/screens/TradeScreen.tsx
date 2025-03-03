import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { CoinbaseApiService } from '../services/coinbaseApi';
import { StorageService } from '../services/storage';
import { MainTabParamList, CryptoData } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';

type TradeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Trade'>;
type TradeScreenRouteProp = RouteProp<MainTabParamList, 'Trade'>;

export const TradeScreen = () => {
  const route = useRoute<TradeScreenRouteProp>();
  const navigation = useNavigation<TradeScreenNavigationProp>();
  const { symbol, action } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>(
    action?.toLowerCase() as 'buy' | 'sell' || 'buy'
  );
  const [amount, setAmount] = useState('');
  const [usdValue, setUsdValue] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [availableCrypto, setAvailableCrypto] = useState(0);
  const [cryptoOptions, setCryptoOptions] = useState<CryptoData[]>([]);
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const hasKeys = await StorageService.hasApiKeys();
        setHasApiKeys(hasKeys);
        
        if (hasKeys) {
          const cryptos = await CoinbaseApiService.getTopCryptos(5);
          setCryptoOptions(cryptos);
          
          if (cryptos.length > 0) {
            setSelectedCrypto(cryptos[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        setHasApiKeys(false);
        setCryptoOptions([]);
        setSelectedCrypto(null);
      } finally {
        setLoading(false);
      }
    };
    
    initializeScreen();
  }, []);

  useEffect(() => {
    if (selectedCrypto) {
      loadData();
    }
  }, [selectedCrypto]);

  useEffect(() => {
    if (selectedCrypto && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setUsdValue(numAmount * selectedCrypto.price);
      } else {
        setUsdValue(0);
      }
    }
  }, [amount, selectedCrypto]);

  const loadData = async () => {
    if (!hasApiKeys || !selectedCrypto) return;

    try {
      setLoading(true);
      
      // Get USD balance
      const usdBalance = await CoinbaseApiService.getBalance('USD');
      setAvailableBalance(usdBalance);
      
      // Get crypto balance
      const cryptoBalance = await CoinbaseApiService.getBalance(selectedCrypto.symbol);
      setAvailableCrypto(cryptoBalance);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // If we get a 401 error, update hasApiKeys state and clear data
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        setHasApiKeys(false);
        setAvailableBalance(0);
        setAvailableCrypto(0);
        setCryptoOptions([]);
        setSelectedCrypto(null);
      }
      Alert.alert('Error', 'Failed to load account data. Please check your API keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text: string) => {
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(text) || text === '') {
      setAmount(text);
    }
  };

  const setMaxAmount = () => {
    if (tradeAction === 'buy') {
      if (selectedCrypto && selectedCrypto.price > 0) {
        const maxAmount = availableBalance / selectedCrypto.price;
        setAmount(maxAmount.toFixed(6));
      }
    } else {
      setAmount(availableCrypto.toString());
    }
  };

  const validateTrade = (): boolean => {
    if (!selectedCrypto) {
      Alert.alert('Error', 'Please select a cryptocurrency first.');
      return false;
    }

    if (!hasApiKeys) {
      Alert.alert(
        'API Keys Required', 
        'Please add your Coinbase API keys in the Settings screen to execute trades.',
        [
          {
            text: 'Go to Settings',
            onPress: () => navigation.navigate('Settings')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return false;
    }
    
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return false;
    }
    
    if (tradeAction === 'buy' && usdValue > availableBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough USD for this purchase.');
      return false;
    }
    
    if (tradeAction === 'sell' && numAmount > availableCrypto) {
      Alert.alert('Insufficient Crypto', `You do not have enough ${selectedCrypto.symbol} for this sale.`);
      return false;
    }
    
    return true;
  };

  const executeTrade = async () => {
    if (!validateTrade() || !selectedCrypto) return;
    
    try {
      setExecuting(true);
      
      const numAmount = parseFloat(amount);
      
      // Execute trade using the CoinbaseApiService
      const result = await CoinbaseApiService.executeTrade(
        selectedCrypto.symbol,
        tradeAction as 'buy' | 'sell',
        numAmount
      );
      
      if (result) {
        // Show success message
        Alert.alert(
          'Trade Executed',
          `Successfully ${tradeAction === 'buy' ? 'bought' : 'sold'} ${numAmount} ${selectedCrypto.symbol} at $${selectedCrypto.price.toFixed(2)}.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount('');
                loadData(); // Refresh balances
              },
            },
          ]
        );
      } else {
        Alert.alert('Trade Failed', 'There was an error executing your trade. Please try again.');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      Alert.alert('Trade Failed', 'There was an error executing your trade. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  const renderNoApiKeysMessage = () => {
    return (
      <View style={styles.noApiKeysContainer}>
        <MaterialIcons name="vpn-key" size={48} color="#666" />
        <Text style={styles.noApiKeysTitle}>API Keys Required</Text>
        <Text style={styles.noApiKeysText}>
          To execute trades, you need to add your Coinbase API keys.
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trade</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Crypto Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Cryptocurrency</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cryptoSelector}
          >
            {cryptoOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cryptoOption,
                  selectedCrypto?.symbol === option.symbol && styles.selectedCryptoOption
                ]}
                onPress={() => setSelectedCrypto(option)}
              >
                <Text 
                  style={[
                    styles.cryptoOptionText,
                    selectedCrypto?.symbol === option.symbol && styles.selectedCryptoOptionText
                  ]}
                >
                  {option.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ecdc4" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : (
          <>
            {!hasApiKeys ? renderNoApiKeysMessage() : (
              <>
                {/* Current Price */}
                {selectedCrypto && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Current Price</Text>
                    <Text style={styles.priceText}>
                      ${selectedCrypto.price.toFixed(2)}
                    </Text>
                    <Text
                      style={[
                        styles.priceChangeText,
                        selectedCrypto.priceChangePercentage24h >= 0
                          ? styles.positiveChange
                          : styles.negativeChange
                      ]}
                    >
                      {selectedCrypto.priceChangePercentage24h >= 0 ? '+' : ''}
                      {selectedCrypto.priceChangePercentage24h.toFixed(2)}% (24h)
                    </Text>
                  </View>
                )}

                {/* Available Balance */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Balance</Text>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>USD:</Text>
                    <Text style={styles.balanceValue}>${availableBalance.toFixed(2)}</Text>
                  </View>
                  {selectedCrypto && (
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>{selectedCrypto.symbol}:</Text>
                      <Text style={styles.balanceValue}>{availableCrypto.toFixed(6)}</Text>
                    </View>
                  )}
                </View>

                {/* Trade Form */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Execute Trade</Text>
                  
                  {/* Buy/Sell Toggle */}
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        styles.toggleButtonLeft,
                        tradeAction === 'buy' && styles.toggleButtonActive
                      ]}
                      onPress={() => setTradeAction('buy')}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          tradeAction === 'buy' && styles.toggleButtonTextActive
                        ]}
                      >
                        Buy
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        styles.toggleButtonRight,
                        tradeAction === 'sell' && styles.toggleButtonActive
                      ]}
                      onPress={() => setTradeAction('sell')}
                    >
                      <Text
                        style={[
                          styles.toggleButtonText,
                          tradeAction === 'sell' && styles.toggleButtonTextActive
                        ]}
                      >
                        Sell
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Amount Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                      {tradeAction === 'buy' ? 'Buy Amount' : 'Sell Amount'}
                    </Text>
                    <View style={styles.amountInputRow}>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor="#666"
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={handleAmountChange}
                        editable={true}
                      />
                      <Text style={styles.currencyLabel}>
                        {selectedCrypto?.symbol}
                      </Text>
                      <TouchableOpacity
                        style={styles.maxButton}
                        onPress={setMaxAmount}
                      >
                        <Text style={styles.maxButtonText}>MAX</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* USD Value */}
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Estimated Value:</Text>
                    <Text style={styles.valueText}>${usdValue.toFixed(2)}</Text>
                  </View>
                  
                  {/* Execute Button */}
                  <TouchableOpacity
                    style={[
                      styles.executeButton,
                      tradeAction === 'buy' ? styles.buyButton : styles.sellButton,
                      executing && styles.disabledButton
                    ]}
                    onPress={executeTrade}
                    disabled={executing}
                  >
                    {executing ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.executeButtonText}>
                        {tradeAction === 'buy' ? 'Buy' : 'Sell'} {selectedCrypto?.symbol}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
            
            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                Cryptocurrency trading involves significant risk. Always do your own research before making investment decisions.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
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
  cryptoSelector: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  cryptoOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCryptoOption: {
    backgroundColor: '#4ecdc4',
  },
  cryptoOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  selectedCryptoOptionText: {
    color: '#121212',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  positiveChange: {
    color: '#4ecdc4',
  },
  negativeChange: {
    color: '#ff6b6b',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  balanceValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#4ecdc4',
  },
  toggleButtonText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: '#121212',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  currencyLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  maxButton: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  maxButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  valueLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  valueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  executeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buyButton: {
    backgroundColor: '#4ecdc4',
  },
  sellButton: {
    backgroundColor: '#ff6b6b',
  },
  disabledButton: {
    opacity: 0.7,
  },
  executeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerContainer: {
    padding: 16,
    marginBottom: 32,
  },
  disclaimerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
}); 
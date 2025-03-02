import numpy as np
from sklearn.preprocessing import MinMaxScaler
import joblib
import os

# Simple LSTM model for price prediction
def create_lstm_model():
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout
        
        model = Sequential()
        model.add(LSTM(units=50, return_sequences=True, input_shape=(60, 1)))
        model.add(Dropout(0.2))
        model.add(LSTM(units=50, return_sequences=False))
        model.add(Dropout(0.2))
        model.add(Dense(units=25))
        model.add(Dense(units=1))
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    except ImportError:
        print("TensorFlow not available, using fallback model")
        return None

# Fallback model using simple moving averages
def predict_with_moving_averages(data):
    # Calculate short-term and long-term moving averages
    short_window = 5
    long_window = 20
    
    if len(data) < long_window:
        return 0, 0.5  # Not enough data
    
    short_ma = np.mean(data[-short_window:])
    long_ma = np.mean(data[-long_window:])
    
    # Calculate trend direction and strength
    trend = short_ma - long_ma
    last_price = data[-1]
    
    # Normalize trend to get a prediction between -1 and 1
    max_trend = last_price * 0.1  # Assume 10% is a significant move
    normalized_trend = max(-1, min(1, trend / max_trend))
    
    # Calculate confidence based on consistency of recent movements
    recent_changes = np.diff(data[-short_window:])
    consistency = np.sum(np.sign(recent_changes) == np.sign(trend)) / len(recent_changes)
    confidence = 0.5 + (consistency - 0.5) * 0.5  # Scale to 0.5-1.0 range
    
    return normalized_trend, confidence

def predict_price_movement(symbol, historical_data):
    """
    Predict price movement for a given cryptocurrency
    
    Args:
        symbol: Cryptocurrency symbol (e.g., 'BTC')
        historical_data: List of historical price data
        
    Returns:
        Dictionary with prediction and confidence
    """
    try:
        # Extract closing prices
        closing_prices = np.array([float(candle[4]) for candle in historical_data])
        
        # Try to load pre-trained model if available
        model_path = f"models/saved/{symbol.lower()}_model.h5"
        if os.path.exists(model_path):
            try:
                from tensorflow.keras.models import load_model
                model = load_model(model_path)
                
                # Prepare data for LSTM
                scaler = MinMaxScaler(feature_range=(0, 1))
                scaled_data = scaler.fit_transform(closing_prices.reshape(-1, 1))
                
                # Create 60-day sequences
                x_test = []
                if len(scaled_data) >= 60:
                    x_test.append(scaled_data[-60:])
                    x_test = np.array(x_test)
                    
                    # Make prediction
                    pred = model.predict(x_test)
                    pred = scaler.inverse_transform(pred)
                    
                    last_price = closing_prices[-1]
                    predicted_price = pred[0][0]
                    
                    # Calculate prediction as percentage change
                    prediction = (predicted_price - last_price) / last_price
                    
                    # Limit prediction to reasonable range (-0.2 to 0.2 or -20% to 20%)
                    prediction = max(-0.2, min(0.2, prediction))
                    
                    return {
                        "prediction": float(prediction),
                        "confidence": 0.8  # Higher confidence for trained model
                    }
            except Exception as e:
                print(f"Error using trained model: {e}")
                pass
        
        # Fallback to simple model
        prediction, confidence = predict_with_moving_averages(closing_prices)
        
        return {
            "prediction": float(prediction),
            "confidence": float(confidence)
        }
    except Exception as e:
        print(f"Error in price prediction: {e}")
        return {
            "prediction": 0.0,
            "confidence": 0.5
        } 
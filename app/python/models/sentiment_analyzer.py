import re
import numpy as np
from collections import Counter

# Simple sentiment analysis using lexicon-based approach
# In a production app, we would use a more sophisticated model like BERT

# Load sentiment lexicons
POSITIVE_WORDS = {
    'bullish', 'surge', 'soar', 'gain', 'rally', 'rise', 'up', 'high', 'growth',
    'positive', 'profit', 'success', 'breakthrough', 'adoption', 'partnership',
    'launch', 'upgrade', 'improve', 'innovation', 'opportunity', 'potential',
    'strong', 'support', 'confidence', 'momentum', 'outperform', 'beat', 'exceed'
}

NEGATIVE_WORDS = {
    'bearish', 'crash', 'plunge', 'drop', 'fall', 'down', 'low', 'decline',
    'negative', 'loss', 'fail', 'risk', 'threat', 'ban', 'regulation', 'concern',
    'fear', 'uncertainty', 'volatility', 'sell', 'dump', 'weak', 'resistance',
    'underperform', 'miss', 'below', 'warning', 'trouble', 'problem', 'hack', 'scam'
}

# Words that negate sentiment
NEGATION_WORDS = {'not', 'no', 'never', 'none', 'neither', 'nor', 'hardly', 'barely'}

def preprocess_text(text):
    """Clean and tokenize text"""
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and numbers
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # Tokenize
    tokens = text.split()
    
    return tokens

def analyze_sentiment(text):
    """
    Analyze sentiment of crypto news text
    
    Args:
        text: News article text
        
    Returns:
        Dictionary with sentiment score and label
    """
    try:
        tokens = preprocess_text(text)
        
        # Count positive and negative words
        pos_count = 0
        neg_count = 0
        
        # Track negation
        negation = False
        
        for i, token in enumerate(tokens):
            if token in NEGATION_WORDS:
                negation = True
                continue
                
            if token in POSITIVE_WORDS:
                if negation:
                    neg_count += 1
                else:
                    pos_count += 1
                negation = False
            elif token in NEGATIVE_WORDS:
                if negation:
                    pos_count += 1
                else:
                    neg_count += 1
                negation = False
            else:
                # Reset negation after 3 words
                if i > 0 and i % 3 == 0:
                    negation = False
        
        # Calculate sentiment score (-1 to 1)
        total = pos_count + neg_count
        if total == 0:
            score = 0
        else:
            score = (pos_count - neg_count) / total
        
        # Determine sentiment label
        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        else:
            label = "neutral"
        
        return {
            "score": float(score),
            "label": label
        }
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        return {
            "score": 0.0,
            "label": "neutral"
        } 
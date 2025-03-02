import { loadPyodide } from 'pyodide';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

class PythonBridge {
  private pyodide: any = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load Pyodide
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/',
      });

      // Install required packages
      await this.pyodide.loadPackagesFromImports(`
        import numpy
        import pandas
        import scikit-learn
      `);

      // Load our custom Python modules
      await this.loadPythonModules();

      this.isInitialized = true;
      console.log('Python bridge initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Python bridge:', error);
      throw error;
    }
  }

  private async loadPythonModules(): Promise<void> {
    try {
      const pythonModulesPath = Platform.OS === 'ios' 
        ? `${RNFS.MainBundlePath}/python` 
        : `${RNFS.DocumentDirectoryPath}/python`;
      
      // Load model files
      const modelFiles = await RNFS.readDir(`${pythonModulesPath}/models`);
      
      for (const file of modelFiles) {
        if (file.name.endsWith('.py')) {
          const content = await RNFS.readFile(file.path, 'utf8');
          this.pyodide.runPython(content);
        }
      }
    } catch (error) {
      console.error('Failed to load Python modules:', error);
      throw error;
    }
  }

  async runPythonCode(code: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      return this.pyodide.runPython(code);
    } catch (error) {
      console.error('Error running Python code:', error);
      throw error;
    }
  }

  async predictPriceMovement(
    symbol: string, 
    historicalData: any[]
  ): Promise<{ prediction: number; confidence: number }> {
    try {
      // Convert JS array to Python format
      this.pyodide.globals.set('historical_data', historicalData);
      this.pyodide.globals.set('symbol', symbol);
      
      // Run prediction model
      const result = this.pyodide.runPython(`
        from models.price_predictor import predict_price_movement
        predict_price_movement(symbol, historical_data)
      `);
      
      return result.toJs();
    } catch (error) {
      console.error('Error predicting price movement:', error);
      throw error;
    }
  }

  async analyzeSentiment(newsText: string): Promise<{ score: number; label: string }> {
    try {
      this.pyodide.globals.set('news_text', newsText);
      
      const result = this.pyodide.runPython(`
        from models.sentiment_analyzer import analyze_sentiment
        analyze_sentiment(news_text)
      `);
      
      return result.toJs();
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }
}

export const pythonBridge = new PythonBridge(); 
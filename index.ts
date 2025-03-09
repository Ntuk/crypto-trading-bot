import { APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Coinbase Advanced Trade API
const ADVANCED_API_URL = 'https://api.coinbase.com/api/v3';
const API_HOST = 'api.coinbase.com';

// API key and secret from environment variables or hardcoded for testing
const API_KEY_ID = '18594b18-a7fd-4089-819d-75ec57a79b4d';
const ORG_ID = '3d3b5031-a211-4416-882f-5287e08e07b3';
const KEY_NAME = `organizations/${ORG_ID}/apiKeys/${API_KEY_ID}`;
const KEY_SECRET = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEINkUL9Ifx/xyer4fC4BnoF+vZ2KAzdewzegwJn1qoGXYoAoGCCqGSM49
AwEHoUQDQgAEf4F27KHtdGpsbZQwhkw0G+dvfBJ7+6z36Z/xOcOsFeS+9aPTsqoI
taCkX6MwkbwJL61itEERqKPU0lJPIbzerw==
-----END EC PRIVATE KEY-----`;
const ALGORITHM = 'ES256';
const REQUEST_HOST = 'api.coinbase.com';
const API_BASE_URL = `https://${REQUEST_HOST}`;

// Coinbase Exchange API (public endpoints)
const EXCHANGE_API_URL = 'https://api.exchange.coinbase.com';

// Working JWT token for testing
const WORKING_JWT = "eyJhbGciOiJFUzI1NiIsImtpZCI6IjM5MTQ3NmU2LWQ1MzQtNGFlMy05OTkzLWRhOTk0ZTA2NWUyOSIsIm5vbmNlIjoiZTgxOGI0NjQzYjUxNmU1YjllMWJhNjAzOGFkYjEzOGZkZmUwMGM2ZTNlYzE5NmM2YWU3ZjMxZDhlNDZmNzAzOSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTE0NzZlNi1kNTM0LTRhZTMtOTk5My1kYTk5NGUwNjVlMjkiLCJpc3MiOiJjZHAiLCJuYmYiOjE3NDE1MDkzNzEsImV4cCI6MTc0MTUwOTQ5MSwidXJpIjoiR0VUIGFwaS5jb2luYmFzZS5jb20vYXBpL3YzL2Jyb2tlcmFnZS9wcm9kdWN0cyJ9.zl2LzSwn3rEXOKJxpPI0Nz_iQCeH8qUbp4AZxLp5fTWaHBR2E4rp0GxYN2hTGbSjgHCSJG22DBiI2ibSv3Kyqw";

// Supported API endpoints
const ENDPOINTS = {
  PRODUCTS: '/api/v3/brokerage/products',
  PRODUCT_CANDLES: '/api/v3/brokerage/products/{product_id}/candles',
  ACCOUNTS: '/api/v3/brokerage/accounts',
  ACCOUNT_DETAILS: '/api/v3/brokerage/accounts/{account_id}',
  CREATE_ORDER: '/api/v3/brokerage/orders',
  LIST_ORDERS: '/api/v3/brokerage/orders/historical/batch',
  GET_ORDER: '/api/v3/brokerage/orders/historical/{order_id}',
  CANCEL_ORDERS: '/api/v3/brokerage/orders/batch_cancel',
  PREVIEW_ORDER: '/api/v3/brokerage/orders/preview'
};

// Main Lambda handler
export const handler = async (event: any): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event));
  
  try {
    // Extract path, method, and body from the event
    let path, method, body;
    
    if (event.requestContext?.http) {
      // API Gateway HTTP API (v2) format
      path = event.rawPath || '';
      method = event.requestContext.http.method;
      body = event.body ? JSON.parse(event.body) : null;
    } else if (event.requestContext?.resourcePath) {
      // API Gateway REST API (v1) format
      path = event.path || '';
      method = event.httpMethod;
      body = event.body ? JSON.parse(event.body) : null;
    } else {
      // Fallback for direct invocation or other event sources
      path = event.path || '/';
      method = event.method || 'GET';
      body = event.body || null;
    }
    
    console.log('Request details:', { path, method, bodySize: body ? JSON.stringify(body).length : 0 });
    
    // Extract the endpoint, removing the /prod prefix if it exists
    const pathSegments = path.split('/').filter(segment => segment !== '');
    const endpoint = '/' + pathSegments
      .filter(segment => segment !== 'prod')
      .join('/');
    
    console.log('Extracted endpoint:', endpoint);
    
    // Route the request to the appropriate handler based on the endpoint
    let response;
    
    if (endpoint.startsWith('/brokerage/products')) {
      if (endpoint.includes('/candles')) {
        // Handle product candles endpoint
        const productId = extractPathParameter(endpoint, '/brokerage/products/', '/candles');
        response = await handleProductCandles(method, productId, event.queryStringParameters);
      } else if (endpoint === '/brokerage/products') {
        // Handle products list endpoint
        response = await handleProducts(method, event.queryStringParameters);
      } else {
        // Handle specific product endpoint
        const productId = extractPathParameter(endpoint, '/brokerage/products/');
        response = await handleProduct(method, productId);
      }
    } else if (endpoint.startsWith('/brokerage/accounts')) {
      if (endpoint === '/brokerage/accounts') {
        // Handle accounts list endpoint
        response = await handleAccounts(method);
      } else {
        // Handle specific account endpoint
        const accountId = extractPathParameter(endpoint, '/brokerage/accounts/');
        response = await handleAccount(method, accountId);
      }
    } else if (endpoint.startsWith('/brokerage/orders')) {
      if (endpoint === '/brokerage/orders') {
        // Handle create order endpoint
        response = await handleCreateOrder(method, body);
      } else if (endpoint === '/brokerage/orders/historical/batch') {
        // Handle list orders endpoint
        response = await handleListOrders(method, event.queryStringParameters);
      } else if (endpoint.startsWith('/brokerage/orders/historical/')) {
        // Handle get order endpoint
        const orderId = extractPathParameter(endpoint, '/brokerage/orders/historical/');
        response = await handleGetOrder(method, orderId);
      } else if (endpoint === '/brokerage/orders/batch_cancel') {
        // Handle cancel orders endpoint
        response = await handleCancelOrders(method, body);
      } else if (endpoint === '/brokerage/orders/preview') {
        // Handle preview order endpoint
        response = await handlePreviewOrder(method, body);
      }
    } else {
      // Default to forwarding the request to Coinbase API
      response = await makeRequest(method, endpoint, body, event.queryStringParameters);
    }
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        data: response.data,
        debug: {
          requestUrl: response.url,
          requestMethod: method,
          endpoint: endpoint,
          responseStatus: response.status
        }
      })
    };
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        } : null,
        timestamp: new Date().toISOString()
      })
    };
  }
};

/**
 * Extract a parameter from a path
 */
function extractPathParameter(path: string, prefix: string, suffix: string = ''): string {
  const startIndex = path.indexOf(prefix) + prefix.length;
  const endIndex = suffix ? path.indexOf(suffix, startIndex) : path.length;
  return path.substring(startIndex, endIndex);
}

/**
 * Handle products list endpoint
 */
async function handleProducts(method: string, queryParams?: any): Promise<any> {
  const endpoint = ENDPOINTS.PRODUCTS;
  return makeRequest(method, endpoint, null, queryParams);
}

/**
 * Handle specific product endpoint
 */
async function handleProduct(method: string, productId: string): Promise<any> {
  const endpoint = `${ENDPOINTS.PRODUCTS}/${productId}`;
  return makeRequest(method, endpoint);
}

/**
 * Handle product candles endpoint
 */
async function handleProductCandles(method: string, productId: string, queryParams?: any): Promise<any> {
  const endpoint = ENDPOINTS.PRODUCT_CANDLES.replace('{product_id}', productId);
  return makeRequest(method, endpoint, null, queryParams);
}

/**
 * Handle accounts list endpoint
 */
async function handleAccounts(method: string): Promise<any> {
  const endpoint = ENDPOINTS.ACCOUNTS;
  return makeRequest(method, endpoint);
}

/**
 * Handle specific account endpoint
 */
async function handleAccount(method: string, accountId: string): Promise<any> {
  const endpoint = ENDPOINTS.ACCOUNT_DETAILS.replace('{account_id}', accountId);
  return makeRequest(method, endpoint);
}

/**
 * Handle create order endpoint
 */
async function handleCreateOrder(method: string, body: any): Promise<any> {
  const endpoint = ENDPOINTS.CREATE_ORDER;
  return makeRequest(method, endpoint, body);
}

/**
 * Handle list orders endpoint
 */
async function handleListOrders(method: string, queryParams?: any): Promise<any> {
  const endpoint = ENDPOINTS.LIST_ORDERS;
  return makeRequest(method, endpoint, null, queryParams);
}

/**
 * Handle get order endpoint
 */
async function handleGetOrder(method: string, orderId: string): Promise<any> {
  const endpoint = ENDPOINTS.GET_ORDER.replace('{order_id}', orderId);
  return makeRequest(method, endpoint);
}

/**
 * Handle cancel orders endpoint
 */
async function handleCancelOrders(method: string, body: any): Promise<any> {
  const endpoint = ENDPOINTS.CANCEL_ORDERS;
  return makeRequest(method, endpoint, body);
}

/**
 * Handle preview order endpoint
 */
async function handlePreviewOrder(method: string, body: any): Promise<any> {
  const endpoint = ENDPOINTS.PREVIEW_ORDER;
  return makeRequest(method, endpoint, body);
}

/**
 * Make a request to the Coinbase API
 */
async function makeRequest(method: string, endpoint: string, body: any = null, queryParams: any = null): Promise<any> {
  try {
    // Generate JWT token
    const token = generateJWT(method, endpoint);
    console.log('JWT token generated:', token.substring(0, 20) + '...');
    
    // Prepare URL with query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams) {
      const queryString = Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
        .join('&');
      
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Making request to Coinbase API:', url);
    console.log('Request headers:', {
      Authorization: `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': headers['Content-Type']
    });
    
    if (body) {
      console.log('Request body:', JSON.stringify(body));
    }
    
    // Make the request
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      timeout: 30000,
      validateStatus: null
    });
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      dataSize: JSON.stringify(response.data).length
    });
    
    return {
      status: response.status,
      data: response.data,
      url: url
    };
    
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * Generate JWT token exactly as per the official documentation
 */
function generateJWT(requestMethod: string, requestPath: string): string {
  const uri = `${requestMethod} ${REQUEST_HOST}${requestPath}`;
  console.log('JWT URI:', uri);
  
  const payload = {
    iss: 'cdp',
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
    sub: KEY_NAME,
    uri,
  };
  
  const header = {
    alg: ALGORITHM,
    kid: KEY_NAME,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  
  console.log('JWT components:', {
    header,
    payload
  });
  
  return jwt.sign(payload, KEY_SECRET, { algorithm: ALGORITHM, header });
} 
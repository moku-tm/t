import {Handler} from '@netlify/functions';
import axios from 'axios';

interface TelegramRequest {
  method: string;
  params?: Record<string, any>;
  dcId?: number;
  connectionType?: string;
}

const handler: Handler = async(event) => {
  // Only allow POST requests
  if(event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ok: false, error: 'Method not allowed'})
    };
  }

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if(event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const body: TelegramRequest = JSON.parse(event.body || '{}');

    // Log request (for debugging)
    console.log(`[Telegram Proxy] Method: ${body.method}`);

    // Validate method
    if(!body.method) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: false,
          error: 'Missing method parameter'
        })
      };
    }

    // Build Telegram API URLs based on DC ID and connection type
    let telegramUrl: string;
    const dcId = body.dcId || 1;
    const connectionType = body.connectionType || 'client';

    // WebSocket URLs (wss://)
    if(body.method.includes('websocket')) {
      const suffix = connectionType === 'upload' ? '-1' : connectionType === 'download' ? '-1' : '';
      const path = connectionType !== 'client' ? `apiws${suffix}` : 'apiws';
      telegramUrl = `wss://ws${dcId}.web.telegram.org/${path}`;
    } else {
      // HTTP URLs
      const suffix = connectionType === 'upload' ? '-1' : connectionType === 'download' ? '-1' : '';
      const subdomains = ['pluto', 'venus', 'aurora', 'vesta', 'flora'];
      const subdomain = subdomains[dcId - 1] || 'pluto';
      const path = 'apiw1';
      telegramUrl = `https://${subdomain}${suffix}.web.telegram.org/${path}`;
    }

    // For MTProto requests, we need to handle them differently
    // This is a simplified version - real MTProto is more complex
    const response = await axios.post(
      telegramUrl,
      body.params || {},
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      }
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.data || {ok: true})
    };
  } catch(error: any) {
    console.error('[Telegram Proxy] Error:', error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: false,
        error: errorMessage,
        statusCode
      })
    };
  }
};

export {handler};

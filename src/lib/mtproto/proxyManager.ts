/**
 * Proxy Manager for Netlify Functions
 * Handles all requests through a serverless proxy to bypass geo-blocking
 */

import type {MTTransportResult} from '@lib/mtproto/transports/transport';

export interface ProxyConfig {
  enabled: boolean;
  url: string;
}

class ProxyManager {
  private config: ProxyConfig = {
    enabled: false,
    url: ''
  };

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    // Check if proxy is enabled via environment variable
    const proxyUrl = import.meta.env.VITE_TELEGRAM_PROXY_URL;
    const useProxy = import.meta.env.VITE_USE_PROXY === 'true';

    if(proxyUrl && useProxy) {
      this.config = {
        enabled: true,
        url: proxyUrl
      };
      console.log('[ProxyManager] Initialized with URL:', this.config.url);
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public getUrl(): string {
    return this.config.url;
  }

  /**
   * Forward a request through the proxy
   */
  public async forwardRequest(
    method: string,
    params?: Record<string, any>,
    dcId: number = 1,
    connectionType: 'client' | 'upload' | 'download' = 'client'
  ): Promise<any> {
    if(!this.isEnabled()) {
      throw new Error('Proxy is not enabled');
    }

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          method,
          params,
          dcId,
          connectionType
        })
      });

      if(!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch(error) {
      console.error('[ProxyManager] Forward request error:', error);
      throw error;
    }
  }

  /**
   * Make a raw request through the proxy
   */
  public async makeRequest(payload: Uint8Array, dcId: number = 1): Promise<Uint8Array> {
    if(!this.isEnabled()) {
      throw new Error('Proxy is not enabled');
    }

    try {
      // Convert binary payload to base64 for JSON transmission
      const base64Payload = btoa(String.fromCharCode(...payload));

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'mtproto',
          payload: base64Payload,
          dcId
        })
      });

      if(!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }

      const data = await response.json();

      // Convert response back from base64
      if(data.payload) {
        const binaryString = atob(data.payload);
        const bytes = new Uint8Array(binaryString.length);
        for(let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }

      throw new Error('Invalid proxy response');
    } catch(error) {
      console.error('[ProxyManager] Make request error:', error);
      throw error;
    }
  }
}

export default new ProxyManager();

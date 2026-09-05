/**
 * Proxy Configuration for Geo-blocked regions (e.g., Iran)
 * Enable this to bypass Telegram API blocking
 */

export const PROXY_CONFIG = {
  /**
   * Enable proxy for all MTProto requests
   * Set to true when deployed on Netlify
   */
  enabled: import.meta.env.VITE_USE_PROXY === 'true',

  /**
   * Proxy URL (Netlify Functions)
   * Example: /.netlify/functions/telegram-proxy
   */
  proxyUrl: import.meta.env.VITE_TELEGRAM_PROXY_URL || '/.netlify/functions/telegram-proxy',

  /**
   * Timeout for proxy requests (ms)
   */
  timeout: 30000,

  /**
   * Retry attempts for failed requests
   */
  maxRetries: 3,

  /**
   * Regions where proxy should be automatically enabled
   * Example: ['IR', 'SY', 'CN'] for Iran, Syria, China
   */
  autoEnableRegions: [],

  /**
   * Whether to log proxy requests
   */
  debug: import.meta.env.VITE_DEBUG === 'true'
};

export default PROXY_CONFIG;

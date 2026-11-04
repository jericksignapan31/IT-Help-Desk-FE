/**
 * Debug utilities for troubleshooting backend connectivity issues
 * Access in browser console: window.debug or globalThis.debug
 */

export interface DebugInfo {
  environment: string;
  apiUrl: string;
  hasToken: boolean;
  isPWA: boolean;
  serviceWorkerActive: boolean;
  lastApiCall?: {
    url: string;
    method: string;
    timestamp: string;
    status?: number;
    error?: string;
  };
}

export class DebugUtil {
  private static apiCallLog: Array<{
    url: string;
    method: string;
    timestamp: Date;
    status?: number;
    error?: string;
  }> = [];

  /**
   * Get current debug info
   */
  static getDebugInfo(): DebugInfo {
    const token = localStorage.getItem('access_token');
    const isPWA = 'serviceWorker' in navigator;
    
    return {
      environment: (window as any).ngDevMode ? 'development' : 'production',
      apiUrl: localStorage.getItem('apiUrl') || 'http://localhost:3000',
      hasToken: !!token,
      isPWA,
      serviceWorkerActive: isPWA && !!(navigator as any).serviceWorker?.controller,
      lastApiCall: this.apiCallLog.length > 0 
        ? {
            url: this.apiCallLog[this.apiCallLog.length - 1].url,
            method: this.apiCallLog[this.apiCallLog.length - 1].method,
            timestamp: this.apiCallLog[this.apiCallLog.length - 1].timestamp.toISOString(),
            status: this.apiCallLog[this.apiCallLog.length - 1].status,
            error: this.apiCallLog[this.apiCallLog.length - 1].error,
          }
        : undefined,
    };
  }

  /**
   * Log API call for debugging
   */
  static logApiCall(
    url: string,
    method: string,
    status?: number,
    error?: string
  ): void {
    this.apiCallLog.push({
      url,
      method,
      timestamp: new Date(),
      status,
      error,
    });

    // Keep only last 50 calls
    if (this.apiCallLog.length > 50) {
      this.apiCallLog.shift();
    }

    const statusEmoji = status && status < 400 ? '✅' : '❌';
    const message = error ? `${statusEmoji} ${method} ${url} - ${status} - ${error}` 
                          : `${statusEmoji} ${method} ${url} - ${status}`;
    console.log(message);
  }

  /**
   * Get API call history
   */
  static getApiCallHistory() {
    return this.apiCallLog.map(call => ({
      url: call.url,
      method: call.method,
      timestamp: call.timestamp.toISOString(),
      status: call.status,
      error: call.error,
    }));
  }

  /**
   * Test connectivity to backend
   */
  static async testBackendConnectivity(): Promise<{
    reachable: boolean;
    endpoints: Record<string, { reachable: boolean; status?: number; error?: string }>;
  }> {
    const apiUrl = localStorage.getItem('apiUrl') || 'http://localhost:3000';
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoints = [
      '/chat/conversations',
      '/chat/chatbot/stats',
      '/api/employees',
      '/api/assets',
    ];

    const results: Record<string, { reachable: boolean; status?: number; error?: string }> = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET',
          headers,
        });
        results[endpoint] = {
          reachable: response.ok,
          status: response.status,
        };
        this.logApiCall(endpoint, 'GET', response.status);
      } catch (error: any) {
        results[endpoint] = {
          reachable: false,
          error: error.message,
        };
        this.logApiCall(endpoint, 'GET', undefined, error.message);
      }
    }

    const allReachable = Object.values(results).every(r => r.reachable);
    return { reachable: allReachable, endpoints: results };
  }

  /**
   * Clear API call history
   */
  static clearHistory(): void {
    this.apiCallLog = [];
    console.log('✅ API call history cleared');
  }

  /**
   * Test service worker
   */
  static async testServiceWorker(): Promise<{ active: boolean; status: string }> {
    if (!('serviceWorker' in navigator)) {
      return { active: false, status: 'Service Worker not supported' };
    }

    try {
      const registration = await (navigator as any).serviceWorker.ready;
      return {
        active: !!registration.active,
        status: registration.active ? 'Service Worker active' : 'Service Worker inactive',
      };
    } catch (error: any) {
      return { active: false, status: `Error: ${error.message}` };
    }
  }

  /**
   * Show all debug info in console table
   */
  static showDebugInfo(): void {
    const info = this.getDebugInfo();
    console.table(info);
    console.log('Last 10 API calls:', this.apiCallLog.slice(-10));
  }
}

// Expose debug utilities globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).debug = {
    info: () => DebugUtil.getDebugInfo(),
    history: () => DebugUtil.getApiCallHistory(),
    testConnectivity: () => DebugUtil.testBackendConnectivity(),
    testSW: () => DebugUtil.testServiceWorker(),
    clearHistory: () => DebugUtil.clearHistory(),
    showAll: () => DebugUtil.showDebugInfo(),
  };
}

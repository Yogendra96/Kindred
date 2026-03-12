/**
 * HttpService.ts — Axios implementation with logging and exception handling
 */

import axios from 'axios';
import logger from './LoggerService';
import _ErrorHandler, {
  NetworkError,
  ApiError,
  TimeoutError,
  AuthError,
} from '../utils/errorHandler';

const TIMEOUT_MS = 15000; // 15 seconds default timeout

export const httpClient = axios.create({
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor
httpClient.interceptors.request.use(
  config => {
    // Attach standard tracking headers + auth token (if available)
    config.headers['X-Request-Timestamp'] = new Date().toISOString();

    // In a real app we'd retrieve this from SecureStore
    // config.headers.Authorization = `Bearer ${token}`;

    logger.debug(
      'HttpService',
      `⬇️ Request: ${config.method?.toUpperCase()} ${config.url}`,
      {
        params: config.params,
        headers: config.headers,
      },
    );

    // Add performance marker
    (config as any).metadata = { startTime: Date.now() };

    return config;
  },
  error => {
    logger.error('HttpService', 'Request interception failed', error);
    return Promise.reject(error);
  },
);

// Response Interceptor
httpClient.interceptors.response.use(
  response => {
    const startTime = (response.config as any)?.metadata?.startTime;
    const latency = startTime ? Date.now() - startTime : undefined;

    logger.info(
      'HttpService',
      `⬆️ Response: ${response.status} ${response.config.url}`,
      {
        latencyMs: latency,
      },
    );

    return response;
  },
  error => {
    const url = error.config?.url;
    logger.error('HttpService', `⬆️ Failed Request: ${url}`, error);

    // Map axios error to domain error types
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new TimeoutError(
        `Request to ${url} timed out after ${TIMEOUT_MS}ms`,
      );
    }

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401 || status === 403) {
        throw new AuthError('Authentication failed. Please log in again.', {
          status,
          data,
        });
      }

      throw new ApiError(data?.message || `API Error (${status})`, status, {
        data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      throw new NetworkError(
        'No response received from server. Check network connection.',
        undefined,
        { error: error.message },
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new NetworkError(error.message);
    }
  },
);

export default httpClient;

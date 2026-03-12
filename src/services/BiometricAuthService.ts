// @ts-nocheck
/* eslint-disable */
/**
 * BiometricAuthService.ts — DEPRECATED / CONSOLIDATED
 *
 * @deprecated Use BiometricAuthenticationService instead.
 * That service contains multi-engine support (liveness, device attestation, behavioral biometrics).
 *
 * This file is a backward-compatible adapter.
 */
import { BiometricAuthenticationService } from './BiometricAuthenticationService';
import { createSingleton } from '../utils/Singleton';
import logger from './LoggerService';

const log = logger.withTag('BiometricAuthService');

/**
 * @deprecated Use BiometricAuthenticationService directly.
 * Thin adapter over BiometricAuthenticationService for backward compatibility.
 */
export class BiometricAuthService {
  private readonly fullService: BiometricAuthenticationService;

  constructor() {
    this.fullService = new BiometricAuthenticationService();
    log.warn(
      'BiometricAuthService is deprecated — use BiometricAuthenticationService',
    );
  }

  /** @deprecated Use BiometricAuthenticationService.authenticate() */
  async authenticate(): Promise<boolean> {
    return this.fullService.authenticate();
  }

  /** @deprecated */
  async isAvailable(): Promise<boolean> {
    return this.fullService.isAvailable();
  }
}

export const getBiometricAuthService = createSingleton(
  () => new BiometricAuthService(),
);
export default getBiometricAuthService();

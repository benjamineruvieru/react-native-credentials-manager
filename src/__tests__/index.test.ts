// Mock the native module to isolate JavaScript logic testing
jest.mock('../NativeCredentialsManager', () => ({
  __esModule: true,
  default: {
    signUpWithPasskeys: jest.fn(() =>
      Promise.resolve({ type: 'passkey', authenticationResponseJson: '{}' })
    ),
    signUpWithPassword: jest.fn(() =>
      Promise.resolve({ type: 'password', username: 'test', password: 'test' })
    ),
    signIn: jest.fn((_options, _params) =>
      Promise.resolve({
        type: 'passkey',
        authenticationResponseJson: '{}',
      })
    ),
    signUpWithGoogle: jest.fn(() =>
      Promise.resolve({
        type: 'google-signin',
        id: 'test-id',
        idToken: 'test-token',
      })
    ),
    signUpWithApple: jest.fn(() =>
      Promise.resolve({
        type: 'apple-signin',
        id: 'test-id',
        idToken: 'test-token',
      })
    ),
    signOut: jest.fn(() => Promise.resolve(null)),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

import {
  signUpWithPasskeys,
  signUpWithPassword,
  signUpWithGoogle,
  signUpWithApple,
  signIn,
  signOut,
} from '../index';
import CredentialsManager from '../NativeCredentialsManager';

// Get the mocked module for assertions
const mockNativeModule = CredentialsManager as jest.Mocked<
  typeof CredentialsManager
>;

describe('react-native-credentials-manager', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('signUpWithPasskeys', () => {
    it('should call native module with correct parameters', async () => {
      const requestJson = { challenge: 'test-challenge' };
      await signUpWithPasskeys(requestJson, true);

      expect(mockNativeModule.signUpWithPasskeys).toHaveBeenCalledWith(
        requestJson,
        true
      );
      expect(mockNativeModule.signUpWithPasskeys).toHaveBeenCalledTimes(1);
    });

    it('should use default value for preferImmediatelyAvailableCredentials', async () => {
      const requestJson = { challenge: 'test-challenge' };
      await signUpWithPasskeys(requestJson);

      expect(mockNativeModule.signUpWithPasskeys).toHaveBeenCalledWith(
        requestJson,
        false
      );
    });
  });

  describe('signUpWithPassword', () => {
    it('should reject on iOS with appropriate error', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      await expect(
        signUpWithPassword({ username: 'test', password: 'pass' })
      ).rejects.toThrow(
        'Manual password storage is not supported on iOS. Use AutoFill passwords through signIn method instead.'
      );

      expect(mockNativeModule.signUpWithPassword).not.toHaveBeenCalled();
      require('react-native').Platform.OS = originalPlatform;
    });

    it('should call native module on Android', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      await signUpWithPassword({ username: 'testuser', password: 'testpass' });

      expect(mockNativeModule.signUpWithPassword).toHaveBeenCalledWith({
        password: 'testpass',
        username: 'testuser',
      });
      expect(mockNativeModule.signUpWithPassword).toHaveBeenCalledTimes(1);

      require('react-native').Platform.OS = originalPlatform;
    });
  });

  describe('signUpWithGoogle', () => {
    it('should reject on iOS with appropriate error', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      await expect(
        signUpWithGoogle({ serverClientId: 'test-client-id' })
      ).rejects.toThrow(
        'Google Sign In is only available on Android. Use signUpWithApple on iOS.'
      );

      expect(mockNativeModule.signUpWithGoogle).not.toHaveBeenCalled();
      require('react-native').Platform.OS = originalPlatform;
    });

    it('should apply default values correctly on Android', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      await signUpWithGoogle({ serverClientId: 'test-client-id' });

      expect(mockNativeModule.signUpWithGoogle).toHaveBeenCalledWith({
        serverClientId: 'test-client-id',
        nonce: '',
        autoSelectEnabled: true,
        filterByAuthorizedAccounts: false,
      });

      require('react-native').Platform.OS = originalPlatform;
    });

    it('should use provided values when specified', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      await signUpWithGoogle({
        serverClientId: 'test-client-id',
        nonce: 'custom-nonce',
        autoSelectEnabled: false,
        filterByAuthorizedAccounts: true,
      });

      expect(mockNativeModule.signUpWithGoogle).toHaveBeenCalledWith({
        serverClientId: 'test-client-id',
        nonce: 'custom-nonce',
        autoSelectEnabled: false,
        filterByAuthorizedAccounts: true,
      });

      require('react-native').Platform.OS = originalPlatform;
    });
  });

  describe('signUpWithApple', () => {
    it('should reject on non-iOS platforms with appropriate error', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      await expect(signUpWithApple()).rejects.toThrow(
        'Apple Sign In is only available on iOS. Use signUpWithGoogle on Android.'
      );

      expect(mockNativeModule.signUpWithApple).not.toHaveBeenCalled();
      require('react-native').Platform.OS = originalPlatform;
    });

    it('should apply default values correctly on iOS', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      await signUpWithApple();

      expect(mockNativeModule.signUpWithApple).toHaveBeenCalledWith({
        nonce: '',
        requestedScopes: ['fullName', 'email'],
      });

      require('react-native').Platform.OS = originalPlatform;
    });

    it('should use provided values when specified', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      await signUpWithApple({
        nonce: 'custom-nonce',
        requestedScopes: ['email'],
      });

      expect(mockNativeModule.signUpWithApple).toHaveBeenCalledWith({
        nonce: 'custom-nonce',
        requestedScopes: ['email'],
      });

      require('react-native').Platform.OS = originalPlatform;
    });
  });

  describe('signIn', () => {
    it('should apply default values for Google Sign In params', async () => {
      await signIn(['google-signin'], {
        googleSignIn: { serverClientId: 'test-id' },
      });

      expect(mockNativeModule.signIn).toHaveBeenCalledWith(['google-signin'], {
        passkeys: undefined,
        googleSignIn: {
          serverClientId: 'test-id',
          nonce: '',
          autoSelectEnabled: true,
          filterByAuthorizedAccounts: true,
        },
      });
    });

    it('should apply default values for Apple Sign In params on iOS', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      await signIn(['apple-signin'], { appleSignIn: {} });

      expect(mockNativeModule.signIn).toHaveBeenCalledWith(['apple-signin'], {
        passkeys: undefined,
        appleSignIn: {
          nonce: '',
          requestedScopes: ['fullName', 'email'],
        },
      });

      require('react-native').Platform.OS = originalPlatform;
    });

    it('should not add Apple params on non-iOS platforms', async () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      await signIn(['apple-signin'], { appleSignIn: {} });

      expect(mockNativeModule.signIn).toHaveBeenCalledWith(['apple-signin'], {
        passkeys: undefined,
      });

      require('react-native').Platform.OS = originalPlatform;
    });

    it('should pass through passkey params', async () => {
      const passkeyParams = { challenge: 'test-challenge' };
      await signIn(['passkeys'], { passkeys: passkeyParams });

      expect(mockNativeModule.signIn).toHaveBeenCalledWith(['passkeys'], {
        passkeys: passkeyParams,
      });
    });

    it('should handle multiple sign-in options', async () => {
      await signIn(['passkeys', 'password', 'google-signin'], {
        passkeys: { challenge: 'test' },
        googleSignIn: { serverClientId: 'test-id' },
      });

      expect(mockNativeModule.signIn).toHaveBeenCalledWith(
        ['passkeys', 'password', 'google-signin'],
        {
          passkeys: { challenge: 'test' },
          googleSignIn: {
            serverClientId: 'test-id',
            nonce: '',
            autoSelectEnabled: true,
            filterByAuthorizedAccounts: true,
          },
        }
      );
    });
  });

  describe('signOut', () => {
    it('should call native signOut method', async () => {
      await signOut();

      expect(mockNativeModule.signOut).toHaveBeenCalledTimes(1);
    });
  });
});

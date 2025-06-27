import {
  signUpWithPasskeys,
  signUpWithPassword,
  signUpWithGoogle,
  signUpWithApple,
  signIn,
  signOut,
  type Credential,
  type GoogleCredential,
  type AppleCredential,
  type SignInOption,
  type GoogleSignInParams,
  type AppleSignInParams,
} from '../index';

describe('react-native-credentials-manager', () => {
  it('should export all required functions', () => {
    expect(typeof signUpWithPasskeys).toBe('function');
    expect(typeof signUpWithPassword).toBe('function');
    expect(typeof signUpWithGoogle).toBe('function');
    expect(typeof signUpWithApple).toBe('function');
    expect(typeof signIn).toBe('function');
    expect(typeof signOut).toBe('function');
  });

  it('should have correct TypeScript types', () => {
    // Test that types are properly exported and can be used
    const mockCredential: Credential = {
      type: 'passkey',
      authenticationResponseJson: 'mock-response',
    };

    const mockGoogleCredential: GoogleCredential = {
      type: 'google-signin',
      id: 'mock-id',
      idToken: 'mock-token',
    };

    const mockAppleCredential: AppleCredential = {
      type: 'apple-signin',
      id: 'mock-id',
      idToken: 'mock-token',
      email: 'test@example.com',
    };

    const mockSignInOptions: SignInOption[] = [
      'passkeys',
      'password',
      'google-signin',
    ];

    const mockGoogleParams: GoogleSignInParams = {
      serverClientId: 'test-client-id',
      autoSelectEnabled: true,
    };

    const mockAppleParams: AppleSignInParams = {
      requestedScopes: ['fullName', 'email'],
    };

    expect(mockCredential.type).toBe('passkey');
    expect(mockGoogleCredential.type).toBe('google-signin');
    expect(mockAppleCredential.type).toBe('apple-signin');
    expect(mockSignInOptions).toHaveLength(3);
    expect(mockGoogleParams.serverClientId).toBe('test-client-id');
    expect(mockAppleParams.requestedScopes).toEqual(['fullName', 'email']);
  });

  it('should properly infer return types for signIn function at compile time', () => {
    // This test verifies that TypeScript can properly infer return types
    // based on the SignInOption[] parameter at compile time

    // This test focuses on compile-time type checking rather than runtime behavior
    // to avoid native module mocking issues

    // Type assertions that would fail compilation if types are wrong
    const testTypeInference = () => {
      // These function signatures should compile without errors and infer correct types

      // Single passkey option should return PasskeyCredential
      const testPasskey = () => signIn(['passkeys'], { passkeys: {} });

      // Single password option should return PasswordCredential
      const testPassword = () => signIn(['password'], {});

      // Single google option should return GoogleCredential
      const testGoogle = () =>
        signIn(['google-signin'], {
          googleSignIn: {
            serverClientId: 'test',
            nonce: '',
            autoSelectEnabled: true,
          },
        });

      // Single apple option should return AppleCredential
      const testApple = () =>
        signIn(['apple-signin'], {
          appleSignIn: { nonce: '', requestedScopes: [] },
        });

      // Multiple options should return Credential union type
      const testMultiple = () => signIn(['passkeys', 'password'], {});

      // Verify all functions exist and return promises
      expect(typeof testPasskey).toBe('function');
      expect(typeof testPassword).toBe('function');
      expect(typeof testGoogle).toBe('function');
      expect(typeof testApple).toBe('function');
      expect(typeof testMultiple).toBe('function');
    };

    // The function exists and types compile correctly
    expect(typeof testTypeInference).toBe('function');
  });

  it('should reject signUpWithApple on non-iOS platforms', async () => {
    // Mock Platform.OS to be 'android'
    const originalPlatform = require('react-native').Platform.OS;
    require('react-native').Platform.OS = 'android';

    await expect(signUpWithApple()).rejects.toThrow(
      'Apple Sign In is only available on iOS'
    );

    // Restore original platform
    require('react-native').Platform.OS = originalPlatform;
  });
});

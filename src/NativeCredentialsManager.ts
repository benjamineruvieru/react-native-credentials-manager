import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type SignInOption =
  | 'passkeys'
  | 'password'
  | 'google-signin'
  | 'apple-signin';

// Password authentication types
type CredObject = {
  username: string;
  password: string;
};

export type PasswordCredential = {
  type: 'password';
  username: string;
  password: string;
};

// Passkey authentication types
export type PasskeyCredential = {
  type: 'passkey';
  authenticationResponseJson: string;
};

// Google Sign In types
type GoogleSignInParams = {
  nonce: string;
  serverClientId: string;
  autoSelectEnabled: boolean;
};

export type GoogleCredential = {
  type: 'google-signin';
  id: string;
  idToken: string;
  displayName?: string;
  familyName?: string;
  givenName?: string;
  profilePicture?: string;
  phoneNumber?: string;
};

// Apple Sign In types
type AppleSignInParams = {
  nonce: string;
  requestedScopes: string[];
};

export type AppleCredential = {
  type: 'apple-signin';
  id: string;
  idToken: string;
  displayName?: string;
  familyName?: string;
  givenName?: string;
  email?: string;
};

// Combined credential type
export type Credential =
  | PasskeyCredential
  | PasswordCredential
  | GoogleCredential
  | AppleCredential;

// Native module interface
export interface Spec extends TurboModule {
  /**
   * Sign up with passkeys (supported on both Android and iOS)
   * @param requestJson WebAuthn request object
   * @param preferImmediatelyAvailableCredentials Android-specific parameter, ignored on iOS
   */
  signUpWithPasskeys(
    requestJson: Object,
    preferImmediatelyAvailableCredentials: boolean
  ): Promise<Object>;

  /**
   * Sign up with password (Android only - not supported on iOS)
   * iOS will reject with UNSUPPORTED_OPERATION error
   */
  signUpWithPassword(credObject: CredObject): Promise<Object>;

  /**
   * Sign in with various methods
   * - 'passkeys': Supported on both platforms
   * - 'password': Supported on android
   * - 'google-signin': Android only
   * - 'apple-signin': iOS only (not available on Android)
   */
  signIn(
    options: SignInOption[],
    params: {
      passkeys?: Object;
      googleSignIn?: GoogleSignInParams; // Used only on Android
      appleSignIn?: AppleSignInParams; // Used only on iOS
    }
  ): Promise<Credential>;

  /**
   * Sign up with Google (Android-specific implementation)
   */
  signUpWithGoogle(params: GoogleSignInParams): Promise<GoogleCredential>;

  /**
   * Sign up with Apple (iOS-specific implementation)
   * Will reject with UNSUPPORTED_OPERATION on Android
   */
  signUpWithApple(params: AppleSignInParams): Promise<AppleCredential>;

  /**
   * Sign out (behavior varies by platform)
   * On iOS, this is a no-op as AuthenticationServices doesn't provide a sign-out method
   */
  signOut(): Promise<null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CredentialsManager');

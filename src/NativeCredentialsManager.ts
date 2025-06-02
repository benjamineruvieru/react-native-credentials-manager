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

type PasswordCredential = {
  type: 'password';
  username: string;
  password: string;
};

// Passkey authentication types
type PasskeyCredential = {
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
  signUpWithPasskeys(
    requestJson: Object,
    preferImmediatelyAvailableCredentials: boolean
  ): Promise<Object>;
  signUpWithPassword(credObject: CredObject): Promise<Object>;
  signIn(
    options: SignInOption[],
    params: {
      passkeys?: Object;
      googleSignIn?: GoogleSignInParams;
      appleSignIn?: AppleSignInParams;
    }
  ): Promise<Credential>;
  signUpWithGoogle(params: GoogleSignInParams): Promise<GoogleCredential>;
  signUpWithApple(params: AppleSignInParams): Promise<AppleCredential>;
  signOut(): Promise<null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CredentialsManager');

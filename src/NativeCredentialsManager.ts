import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type SignInOption = 'passkeys' | 'password' | 'google-signin';

type CredObject = {
  username: string;
  password: string;
};

type PasskeyCredential = {
  type: 'passkey';
  authenticationResponseJson: string;
};

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

type PasswordCredential = {
  type: 'password';
  username: string;
  password: string;
};

export type Credential =
  | PasskeyCredential
  | PasswordCredential
  | GoogleCredential;

export interface Spec extends TurboModule {
  signUpWithPasskeys(
    requestJson: Object,
    preferImmediatelyAvailableCredentials: boolean
  ): Promise<Object>;
  signUpWithPassword(credObject: CredObject): void;

  signIn(
    options: SignInOption[],
    params: {
      passkeys?: Object;
      googleSignIn?: GoogleSignInParams;
    }
  ): Promise<Credential>;
  signInWithGoogle(params: GoogleSignInParams): Promise<GoogleCredential>;
  signOut(): Promise<null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CredentialsManager');

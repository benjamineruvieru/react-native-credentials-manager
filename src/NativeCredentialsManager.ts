import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

type CredObject = {
  username: string;
  password: string;
};

type PasskeyCredential = {
  type: 'passkey';
  authenticationResponseJson: string;
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

export type Credential = PasskeyCredential | PasswordCredential;

export interface Spec extends TurboModule {
  signUpWithPasskeys(
    requestJson: Object,
    preferImmediatelyAvailableCredentials: boolean
  ): Promise<Object>;
  signUpWithPassword(credObject: CredObject): void;

  signInWithSavedCredentials(requestJson: Object): Promise<Credential>;
  signInWithGoogle(params: {
    nonce: string;
    serverClientId: string;
    autoSelectEnabled: boolean;
  }): Promise<GoogleCredential>;
  signOut(): Promise<null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CredentialsManager');

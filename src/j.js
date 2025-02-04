// @flow
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

type CredObject = {
  username: string,
  password: string,
};

type PasskeyCredential = {
  type: 'passkey',
  authenticationResponseJson: string,
};

type PasswordCredential = {
  type: 'password',
  username: string,
  password: string,
};

export type Credential = PasskeyCredential | PasswordCredential;

export interface Spec extends TurboModule {
  signUpWithPasskeys(
    requestJson: Object,
    preferImmediatelyAvailableCredentials: boolean
  ): Promise<Object>;
  signUpWithPassword(credObject: CredObject): void;

  signInWithSavedCredentials(requestJson: Object): Promise<Credential>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CredentialsManager');

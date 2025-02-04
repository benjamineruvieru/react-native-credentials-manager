import CredentialsManager from './NativeCredentialsManager';
import type { Credential, GoogleCredential } from './NativeCredentialsManager';

export function signUpWithPasskeys(
  requestJson: Object,
  preferImmediatelyAvailableCredentials: boolean = false
): Promise<Object> {
  return CredentialsManager.signUpWithPasskeys(
    requestJson,
    preferImmediatelyAvailableCredentials
  );
}

export function signUpWithPassword({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  CredentialsManager.signUpWithPassword({ password, username });
}

export function signInWithSavedCredentials(
  requestJson: Object
): Promise<Credential> {
  return CredentialsManager.signInWithSavedCredentials(requestJson);
}

export function signInWithGoogle(): Promise<GoogleCredential> {
  return CredentialsManager.signInWithGoogle();
}

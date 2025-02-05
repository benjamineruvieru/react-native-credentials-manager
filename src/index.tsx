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

export function signInWithGoogle(params: {
  nonce?: string;
  serverClientId: string;
  autoSelectEnabled?: boolean;
}): Promise<GoogleCredential> {
  return CredentialsManager.signInWithGoogle({
    ...params,
    nonce: params.nonce ?? '',
    autoSelectEnabled: params.autoSelectEnabled ?? true,
  });
}

export function signOut(): Promise<null> {
  return CredentialsManager.signOut();
}

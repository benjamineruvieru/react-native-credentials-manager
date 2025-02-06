import CredentialsManager from './NativeCredentialsManager';
import type {
  Credential,
  GoogleCredential,
  SignInOption,
} from './NativeCredentialsManager';

type GoogleSignInParams = {
  nonce?: string;
  serverClientId: string;
  autoSelectEnabled?: boolean;
};

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

export function signIn(
  options: SignInOption[],
  params: {
    passkeys?: Object;
    googleSignIn?: GoogleSignInParams;
  }
): Promise<Credential> {
  return CredentialsManager.signIn(options, {
    ...params,
    googleSignIn: {
      serverClientId: params?.googleSignIn?.serverClientId ?? '',
      nonce: params?.googleSignIn?.nonce ?? '',
      autoSelectEnabled: params?.googleSignIn?.autoSelectEnabled ?? true,
    },
  });
}

export function signInWithGoogle(
  params: GoogleSignInParams
): Promise<GoogleCredential> {
  return CredentialsManager.signInWithGoogle({
    ...params,
    nonce: params.nonce ?? '',
    autoSelectEnabled: params.autoSelectEnabled ?? true,
  });
}

export function signOut(): Promise<null> {
  return CredentialsManager.signOut();
}

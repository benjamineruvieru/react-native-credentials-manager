import CredentialsManager from './NativeCredentialsManager';
import type {
  Credential,
  GoogleCredential,
  AppleCredential,
  SignInOption,
  PasskeyCredential,
  PasswordCredential,
} from './NativeCredentialsManager';
import { Platform } from 'react-native';

type GoogleSignInParams = {
  nonce?: string;
  serverClientId: string;
  autoSelectEnabled?: boolean;
};

type AppleSignInParams = {
  nonce?: string;
  requestedScopes?: ('fullName' | 'email')[];
};

type CredentialMap = {
  'passkeys': PasskeyCredential;
  'password': PasswordCredential;
  'google-signin': GoogleCredential;
  'apple-signin': AppleCredential;
};

type SignInResult<T extends readonly SignInOption[]> = CredentialMap[T[number]];

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
}): Promise<Object> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error(
        'Manual password storage is not supported on iOS. Use AutoFill passwords through signIn method instead.'
      )
    );
  }
  return CredentialsManager.signUpWithPassword({ password, username });
}

export function signIn<T extends readonly SignInOption[]>(
  options: T,
  params: {
    passkeys?: Object;
    googleSignIn?: GoogleSignInParams;
    appleSignIn?: AppleSignInParams;
  }
): Promise<SignInResult<T>> {
  const signInParams: {
    passkeys?: Object;
    googleSignIn?: {
      serverClientId: string;
      nonce: string;
      autoSelectEnabled: boolean;
    };
    appleSignIn?: {
      nonce: string;
      requestedScopes: ('fullName' | 'email')[];
    };
  } = {
    passkeys: params.passkeys,
  };

  if (options.includes('google-signin')) {
    signInParams.googleSignIn = {
      serverClientId: params.googleSignIn?.serverClientId ?? '',
      nonce: params.googleSignIn?.nonce ?? '',
      autoSelectEnabled: params.googleSignIn?.autoSelectEnabled ?? true,
    };
  }

  // If we have Apple Sign In option on iOS, add Apple params
  if (Platform.OS === 'ios' && options.includes('apple-signin')) {
    signInParams.appleSignIn = {
      nonce: params.appleSignIn?.nonce ?? '',
      requestedScopes: params.appleSignIn?.requestedScopes ?? [
        'fullName',
        'email',
      ],
    };
  }

  return CredentialsManager.signIn([...options], signInParams) as Promise<
    SignInResult<T>
  >;
}

export function signUpWithGoogle(
  params: GoogleSignInParams
): Promise<GoogleCredential> {
  if (Platform.OS === 'ios') {
    return Promise.reject(
      new Error(
        'Google Sign In is only available on Android. Use signUpWithApple on iOS.'
      )
    );
  }

  return CredentialsManager.signUpWithGoogle({
    ...params,
    nonce: params.nonce ?? '',
    autoSelectEnabled: params.autoSelectEnabled ?? true,
  });
}

export function signUpWithApple(
  params: AppleSignInParams = {}
): Promise<AppleCredential> {
  if (Platform.OS !== 'ios') {
    return Promise.reject(
      new Error(
        'Apple Sign In is only available on iOS. Use signUpWithGoogle on Android.'
      )
    );
  }

  // Call the native signUpWithApple method directly - uses Apple's Authentication Services
  return CredentialsManager.signUpWithApple({
    nonce: params.nonce || '',
    requestedScopes: params.requestedScopes || ['fullName', 'email'],
  });
}

export function signOut(): Promise<null> {
  return CredentialsManager.signOut();
}

// Export types
export type {
  Credential,
  GoogleCredential,
  AppleCredential,
  SignInOption,
  GoogleSignInParams,
  AppleSignInParams,
  PasskeyCredential,
  PasswordCredential,
};

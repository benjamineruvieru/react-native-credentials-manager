import CredentialsManager from './NativeCredentialsManager';
import type {
  Credential,
  GoogleCredential,
  AppleCredential,
  SignInOption,
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
    // iOS only supports AutoFill passwords through Apple's Authentication Services
    // Manual password storage is not supported
    return Promise.reject(
      new Error(
        'Manual password storage is not supported on iOS. Use AutoFill passwords through signIn method instead.'
      )
    );
  }
  return CredentialsManager.signUpWithPassword({ password, username });
}

export function signIn(
  options: SignInOption[],
  params: {
    passkeys?: Object;
    googleSignIn?: GoogleSignInParams;
    appleSignIn?: AppleSignInParams;
  }
): Promise<Credential> {
  // Transform options for iOS compatibility
  const processedOptions = options.map((option) => {
    if (option === 'google-signin' && Platform.OS === 'ios') {
      // Automatically replace google-signin with apple-signin on iOS
      return 'apple-signin';
    }
    return option;
  });

  // Prepare parameters for both platforms
  const signInParams: any = {
    ...params,
    googleSignIn: {
      serverClientId: params?.googleSignIn?.serverClientId ?? '',
      nonce: params?.googleSignIn?.nonce ?? '',
      autoSelectEnabled: params?.googleSignIn?.autoSelectEnabled ?? true,
    },
  };

  // If we have Apple Sign In option on iOS, add Apple params
  if (Platform.OS === 'ios' && processedOptions.includes('apple-signin')) {
    signInParams.appleSignIn = {
      nonce: params?.appleSignIn?.nonce || params?.googleSignIn?.nonce || '',
      requestedScopes: params?.appleSignIn?.requestedScopes || [
        'fullName',
        'email',
      ],
    };
  }

  return CredentialsManager.signIn(processedOptions, signInParams);
}

export function signUpWithGoogle(
  params: GoogleSignInParams
): Promise<GoogleCredential | AppleCredential> {
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
};

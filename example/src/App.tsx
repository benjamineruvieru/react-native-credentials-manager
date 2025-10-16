import { View, StyleSheet, Button, Platform } from 'react-native';
import {
  signUpWithPasskeys,
  signUpWithPassword,
  signUpWithGoogle,
  signUpWithApple,
  signOut,
  signIn,
} from 'react-native-credentials-manager';
import {
  generateTestRegistrationRequest,
  generateTestAuthenticationRequest,
} from './helpers/passkeyTestHelper';

const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID || '';

export default function App() {
  return (
    <View style={styles.container}>
      <Button
        title="Signup With Passkey"
        onPress={async () => {
          try {
            // Use the helper to generate a valid registration request
            const validRequest = generateTestRegistrationRequest();
            const res = await signUpWithPasskeys(validRequest);
            console.log(JSON.stringify(res));
            console.log(res);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      {Platform.OS === 'android' && (
        <Button
          title="Register Password"
          onPress={async () => {
            try {
              const result = await signUpWithPassword({
                username: 'User1',
                password: 'Password123!',
              });
              console.log('Password registration result:', result);
            } catch (e) {
              console.error('Password registration error:', e);
            }
          }}
        />
      )}
      <Button
        title="Signin"
        onPress={async () => {
          try {
            // Use the helper to generate a valid authentication request
            const validAuthRequest = generateTestAuthenticationRequest();
            // Example 1: Using multiple auth options (returns Credential union type)
            const credential = await signIn(
              ['passkeys', 'password', 'google-signin', 'apple-signin'],
              {
                passkeys: validAuthRequest,
                googleSignIn: {
                  serverClientId: WEB_CLIENT_ID,
                  autoSelectEnabled: true,
                  // Show only accounts that have previously authorized the app
                  filterByAuthorizedAccounts: true,
                },
                appleSignIn: {
                  requestedScopes: ['fullName', 'email'],
                },
              }
            );

            if (credential.type === 'passkey') {
              console.log('Passkey:', credential.authenticationResponseJson);
            } else if (credential.type === 'password') {
              console.log('Password credentials:', {
                username: credential.username,
                password: credential.password,
              });
            } else if (credential.type === 'google-signin') {
              console.log('Google credentials:', {
                id: credential.id,
                idToken: credential.idToken,
                displayName: credential.displayName,
                familyName: credential.familyName,
                givenName: credential.givenName,
                profilePicture: credential.profilePicture,
                phoneNumber: credential.phoneNumber,
              });
            } else if (credential.type === 'apple-signin') {
              console.log('Apple credentials:', {
                id: credential.id,
                idToken: credential.idToken,
                displayName: credential.displayName,
                familyName: credential.familyName,
                givenName: credential.givenName,
                email: credential.email,
              });
            }

            // Example 2: Using single auth option (returns specific type)
            // const passkeyCredential = await signIn(['passkeys'], {
            //   passkeys: validAuthRequest,
            // });
            // // TypeScript knows this is PasskeyCredential, so we can access properties directly
            // console.log('Passkey:', passkeyCredential.authenticationResponseJson);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {Platform.OS === 'android' && (
        <Button
          title={'SignUp With Google'}
          onPress={async () => {
            try {
              const credential = await signUpWithGoogle({
                serverClientId: WEB_CLIENT_ID,
                autoSelectEnabled: false,
                // Show all Google accounts on the device, not just authorized ones
                filterByAuthorizedAccounts: false,
              });
              if (credential.type === 'google-signin') {
                console.log('Google credentials:', {
                  id: credential.id,
                  idToken: credential.idToken,
                  displayName: credential.displayName,
                  familyName: credential.familyName,
                  givenName: credential.givenName,
                  profilePicture: credential.profilePicture,
                  phoneNumber: credential.phoneNumber,
                });
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Button
          title="SignUp With Apple"
          onPress={async () => {
            try {
              const credential = await signUpWithApple({
                requestedScopes: ['fullName', 'email'],
              });
              console.log('Apple credentials:', {
                id: credential.id,
                idToken: credential.idToken,
                displayName: credential.displayName,
                familyName: credential.familyName,
                givenName: credential.givenName,
                email: credential.email,
              });
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {Platform.OS === 'android' && (
        <Button
          title="Signout"
          onPress={async () => {
            try {
              await signOut();
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

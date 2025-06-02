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

            const credential = await signIn(['password'], {
              passkeys: validAuthRequest,
              googleSignIn: {
                serverClientId: WEB_CLIENT_ID,
                autoSelectEnabled: true,
              },
            });

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
                autoSelectEnabled: true,
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

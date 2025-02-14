import { View, StyleSheet, Button } from 'react-native';
import {
  signUpWithPasskeys,
  signUpWithPassword,
  signUpWithGoogle,
  signOut,
  signIn,
} from 'react-native-credentials-manager';
const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID || '';

const requestJson = {
  challenge: 'c29tZS1yYW5kb20tY2hhbGxlbmdl',
  rp: {
    name: 'CredentialsManagerExample',
    id: 'www.benjamineruvieru.com',
  },
  user: {
    id: 'dXNlcl9pZF8xMjM0NTY=',
    name: 'johndoe',
    displayName: 'John Doe',
  },
  pubKeyCredParams: [
    {
      type: 'public-key',
      alg: -7,
    },
    {
      type: 'public-key',
      alg: -257,
    },
  ],
  timeout: 1800000,
  attestation: 'none',
  excludeCredentials: [],
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    requireResidentKey: true,
    residentKey: 'required',
    userVerification: 'required',
  },
};

const signinPasskeysRequestJson = {
  challenge: 'HjBbH__fbLuzy95AGR31yEARA0EMtKlY0NrV5oy3NQw',
  timeout: 1800000,
  userVerification: 'required',
  rpId: 'www.benjamineruvieru.com',
};

export default function App() {
  return (
    <View style={styles.container}>
      <Button
        title="Signup With Passkey"
        onPress={async () => {
          try {
            const res = await signUpWithPasskeys(requestJson);
            console.log(JSON.stringify(res));
            console.log(res);
          } catch (e) {
            console.log(e);
          }
        }}
      />
      <Button
        title="Register Password"
        onPress={() =>
          signUpWithPassword({ username: 'User1', password: 'Password123!' })
        }
      />
      <Button
        title="Signin"
        onPress={async () => {
          try {
            const credential = await signIn(
              ['passkeys', 'password', 'google-signin'],
              {
                passkeys: signinPasskeysRequestJson,
                googleSignIn: {
                  serverClientId: WEB_CLIENT_ID,
                  autoSelectEnabled: true,
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
            }
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

      <Button
        title="SignUp With Google"
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

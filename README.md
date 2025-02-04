# react-native-credentials-manager

A React Native library that implements the [Credential Manager API](https://developer.android.com/identity/sign-in/credential-manager) for Android. This library allows you to manage passwords and passkeys in your React Native applications.

> ⚠️ **Note**: This library is actively under development. iOS support using Authentication Services is coming soon. ~~Support for the old React Native architecture is also in progress.~~ Supports old architecture now. Google Sign-In integration with Credential Manager will be added shortly.

## Features

- ✨ Passkey Authentication
- 🔐 Password Credential Management
- 📱 Google Signing (coming soon)
- 🤖 [iOS Authentication Services](https://developer.apple.com/documentation/authenticationservices?language=objc) (coming soon)

## Installation

```bash
npm install react-native-credentials-manager

# or if you prefer yarn

yarn add react-native-credentials-manager
```

## Requirements

- React Native >= 0.71.0
- New Architecture enabled

## Android Setup

For complete setup instructions, see the [official Credential Manager documentation](https://developer.android.com/identity/sign-in/credential-manager#add-support-dal).

1. Add support for Digital Asset Links

To enable passkey support, you need to associate your Android app with your website by creating and hosting a Digital Asset Links JSON file.

Create a file named `assetlinks.json` with the following content:

```json
[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "your.package.name",
      "sha256_cert_fingerprints": [
        "YOUR_APP_SIGNING_CERTIFICATE_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

Host this file at:

```
https://your-domain.com/.well-known/assetlinks.json
```

Important requirements:

- The MIME type must be `application/json`
- If you have a `robots.txt`, ensure it allows access to `/.well-known/assetlinks.json`:
  ```
  User-agent: \*
  Allow: /.well-known/
  ```
- The domain must be fully-qualified
- Don't include trailing slashes or paths in the domain
- Subdomains are not automatically included in the association

### ProGuard Rules

If you're using ProGuard, add these rules to your `android/app/proguard-rules.pro`:

```pro
-if class androidx.credentials.CredentialManager
-keep class androidx.credentials.playservices.** {
  *;
}
```

## Usage

### High-Level Authentication Flow

The library provides three primary functions for managing user authentication:

1. **signUpWithPasskeys**: Registers a new user using passkeys.
2. **signUpWithPassword**: Registers a new user using a traditional username and password.
3. **signInWithSavedCredentials**: Authenticates a user using previously saved credentials.

### 1. Sign Up with Passkeys

**Function**: `signUpWithPasskeys(requestJson)`

**Description**: Registers a new user using passkeys, enhancing security and user experience.

**Backend Requirements**:

- **Challenge Generation**: Your backend must generate a unique, base64-encoded challenge to prevent replay attacks.
- **User Information**: Provide user details such as a unique identifier, username, and display name.

**When to Use**: Opt for passkey registration to offer users a passwordless and secure authentication method.

**Example**:

```typescript
import { signUpWithPasskeys } from 'react-native-credentials-manager';

// From your backend
const requestJson = {
  challenge: 'base64EncodedChallengeFromBackend',
  rp: {
    name: 'Your App Name',
    id: 'your-domain.com',
  },
  user: {
    id: 'base64EncodedUserIdFromBackend',
    name: 'username',
    displayName: 'User Display Name',
  },
  pubKeyCredParams: [
    {
      type: 'public-key',
      alg: -7, // ES256
    },
  ],
  authenticatorSelection: {
    authenticatorAttachment: 'platform',
    requireResidentKey: true,
    residentKey: 'required',
    userVerification: 'required',
  },
};

try {
  const response = await signUpWithPasskeys(requestJson);
  console.log('Passkey registration successful:', response);
} catch (error) {
  console.error('Passkey registration failed:', error);
}
```

**Parameters**:

| Parameter                                        | Type      | Description                                                                                    |
| ------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| `challenge`                                      | `string`  | A base64-encoded challenge provided by your server to prevent replay attacks.                  |
| `rp`                                             | `object`  | Information about your app (Relying Party).                                                    |
| `rp.name`                                        | `string`  | The name of your app.                                                                          |
| `rp.id`                                          | `string`  | The domain of your app.                                                                        |
| `user`                                           | `object`  | Information about the user registering.                                                        |
| `user.id`                                        | `string`  | A base64-encoded unique identifier for the user.                                               |
| `user.name`                                      | `string`  | The username of the user.                                                                      |
| `user.displayName`                               | `string`  | The display name of the user.                                                                  |
| `pubKeyCredParams`                               | `array`   | An array of objects indicating acceptable public key algorithms.                               |
| `authenticatorSelection`                         | `object`  | Criteria for selecting the appropriate authenticator.                                          |
| `authenticatorSelection.authenticatorAttachment` | `string`  | Indicates the desired authenticator attachment modality (`"platform"` or `"cross-platform"`).  |
| `authenticatorSelection.requireResidentKey`      | `boolean` | Indicates whether resident keys are required.                                                  |
| `authenticatorSelection.residentKey`             | `string`  | Specifies the resident key requirement (`"required"`, `"preferred"`, or `"discouraged"`).      |
| `authenticatorSelection.userVerification`        | `string`  | Specifies the user verification requirement (`"required"`, `"preferred"`, or `"discouraged"`). |

**Note**: Parameters such as `challenge`, `user.id`, and other user-specific information should be securely generated and provided by your backend server.

### 2. Sign Up with Password

**Function**: `signUpWithPassword(credentials)`

**Description**: Registers a new user using a traditional username and password combination.

**Backend Requirements**:

- **User Registration**: Your backend should handle the storage and management of user credentials securely.

**When to Use**: Use this method when you want to support traditional password-based authentication.

**Example**:

```typescript
import { signUpWithPassword } from 'react-native-credentials-manager';

const credentials = {
  username: 'user@example.com',
  password: 'securePassword123!',
};

try {
  await signUpWithPassword(credentials);
  console.log('User registered successfully with password.');
} catch (error) {
  console.error('Password registration failed:', error);
}
```

### Sign In with Saved Credentials

```typescript
import { signInWithSavedCredentials } from 'react-native-credentials-manager';

// From your backend
const signinRequestJson = {
  challenge: 'base64EncodedChallenge',
  timeout: 1800000,
  userVerification: 'required',
  rpId: 'your-domain.com',
};

try {
  const credential = await signInWithSavedCredentials(signinRequestJson);

  if (credential.type === 'passkey') {
    console.log('Passkey:', credential.authenticationResponseJson);
  } else if (credential.type === 'password') {
    console.log('Password credentials:', {
      username: credential.username,
      password: credential.password,
    });
  }
} catch (error) {
  console.error('Sign in failed:', error);
}
```

## Documentation

For more detailed information about the underlying APIs, refer to:

- [Android Credential Manager Overview](https://developer.android.com/identity/sign-in/credential-manager)
- [Android Credential Manager API Reference](https://developer.android.com/reference/androidx/credentials/package-summary)
- [WebAuthn Developer Guide](https://webauthn.guide)
- [Passkeys Overview](https://developers.google.com/identity/passkeys)

## Roadmap

- ~~Old Architecture Support~~ ✅
- iOS Support using [Authentication Services](https://developer.apple.com/documentation/authenticationservices?language=objc)
- Additional Authentication Methods
- Comprehensive Documentation

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

```

```

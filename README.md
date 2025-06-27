<h1 align="center">
React Native Credentials Manager 
</h1>

![App Screens](IMG/flow.png)

A React Native library that implements the [Credential Manager](https://developer.android.com/identity/sign-in/credential-manager) API for Android and [AuthenticationServices](https://developer.apple.com/documentation/authenticationservices) for iOS. This library allows you to manage passwords, passkeys and platform-specific sign-in (Google Sign-In on Android, Apple Sign In on iOS) in your React Native applications.

<p align="center">
  <a href="https://www.npmjs.com/package/react-native-credentials-manager">
    <img alt="npm version" src="https://badge.fury.io/js/react-native-credentials-manager.svg"/>
  </a>
  <a title='License' href="https://github.com/benjamineruvieru/react-native-credentials-manager/blob/master/LICENSE" height="18">
    <img src='https://img.shields.io/badge/license-MIT-blue.svg' />
  </a>
  <a title='Tweet' href="https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20React%20Native%20Credentials%20Manager%20Library&url=https://github.com/benjamineruvieru/react-native-credentials-manager&via=benjamin_eru&hashtags=react,reactnative,opensource,github,ux" height="18">
    <img src='https://img.shields.io/twitter/url/http/shields.io.svg?style=social' />
  </a>
</p>

## Platform Support

- ✅ **Android**: Implementation with Credential Manager API (Android 4.4+ / API 19+)
  - **Android 4.4+ (API 19+)**: Username/password storage and federated sign-in (Google Sign-In)
  - **Android 9+ (API 28+)**: Full passkey (FIDO2/WebAuthn) support
- ✅ **iOS**: Full implementation with AuthenticationServices (iOS 16.0+)

### Platform-Specific Features

| Feature                   | Android                   | iOS                               |
| ------------------------- | ------------------------- | --------------------------------- |
| Passkeys                  | ✅ Credential Manager API | ✅ AuthenticationServices         |
| AutoFill Password Support | ✅ Credential Manager API | ✅ AuthenticationServices         |
| Manual Password Storage   | ✅ Credential Manager API | ❌ Not supported (iOS limitation) |
| Third-party Sign In       | ✅ Google Sign In         | ✅ Apple Sign In                  |

> [!IMPORTANT]
> 📚 **Documentation has moved!** The complete documentation is now available at [https://docs.benjamineruvieru.com/docs/react-native-credentials-manager/](https://docs.benjamineruvieru.com/docs/react-native-credentials-manager/)

> [!NOTE] > **iOS Implementation**: This library strictly follows Apple's Authentication Services framework. Manual password storage is not supported on iOS as it's not part of Apple's official Authentication Services APIs. Use AutoFill passwords instead.

> [!NOTE] > **Android Implementation**: Features are available based on Android version:
>
> - **API 19+**: Basic credential storage and Google Sign-In
> - **API 28+**: Passkey support added

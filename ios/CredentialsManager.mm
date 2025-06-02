#import "CredentialsManager.h"
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import <AuthenticationServices/AuthenticationServices.h>

@implementation CredentialsManager

RCT_EXPORT_MODULE()

- (instancetype)init {
    self = [super init];
    if (self) {
        // Default relying party identifier - should be configurable
        self.relyingPartyIdentifier = @"www.benjamineruvieru.com";
        
        // Get the main window as the authentication anchor
        dispatch_async(dispatch_get_main_queue(), ^{
            UIWindow *keyWindow = nil;
            for (UIWindowScene *windowScene in [UIApplication sharedApplication].connectedScenes) {
                if (windowScene.activationState == UISceneActivationStateForegroundActive) {
                    for (UIWindow *window in windowScene.windows) {
                        if (window.isKeyWindow) {
                            keyWindow = window;
                            break;
                        }
                    }
                }
            }
            self.authenticationAnchor = keyWindow;
        });
    }
    return self;
}

#pragma mark - TurboModule

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeCredentialsManagerSpecJSI>(params);
}

#pragma mark - NativeCredentialsManagerSpec

- (void)signUpWithPasskeys:(NSDictionary *)requestJson
preferImmediatelyAvailableCredentials:(BOOL)preferImmediatelyAvailableCredentials
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        self.currentResolve = resolve;
        self.currentReject = reject;
        
        // Extract challenge and user info from requestJson
        NSString *challengeString = requestJson[@"challenge"];
        NSDictionary *userInfo = requestJson[@"user"];
        NSDictionary *rpInfo = requestJson[@"rp"];
        
        if (!challengeString || !userInfo || !rpInfo) {
            reject(@"INVALID_REQUEST", @"Missing required fields in request JSON", nil);
            return;
        }
        
        // Decode base64 challenge
        NSData *challenge = [[NSData alloc] initWithBase64EncodedString:challengeString options:0];
        if (!challenge) {
            reject(@"INVALID_CHALLENGE", @"Invalid base64 challenge", nil);
            return;
        }
        
        // Extract user information
        NSString *userName = userInfo[@"name"];
        NSString *userIdString = userInfo[@"id"];
        
        // Decode user ID
        NSData *userId = [[NSData alloc] initWithBase64EncodedString:userIdString options:0];
        if (!userId) {
            // If not base64, use the string directly
            userId = [userIdString dataUsingEncoding:NSUTF8StringEncoding];
        }
        
        // Update relying party identifier
        NSString *rpId = rpInfo[@"id"];
        if (rpId) {
            self.relyingPartyIdentifier = rpId;
        }
        
        // Create the passkey registration request using Apple's Authentication Services
        ASAuthorizationPlatformPublicKeyCredentialProvider *provider = 
            [[ASAuthorizationPlatformPublicKeyCredentialProvider alloc] initWithRelyingPartyIdentifier:self.relyingPartyIdentifier];
        
        ASAuthorizationPlatformPublicKeyCredentialRegistrationRequest *registrationRequest = 
            [provider createCredentialRegistrationRequestWithChallenge:challenge name:userName userID:userId];
        
        // Configure the request 
        registrationRequest.userVerificationPreference = ASAuthorizationPublicKeyCredentialUserVerificationPreferenceRequired;
        
        // Apply preferImmediatelyAvailableCredentials if supported by the platform
        if (@available(iOS 16.0, *)) {
            registrationRequest.preferImmediatelyAvailableCredentials = preferImmediatelyAvailableCredentials;
        }
        
        // Create and configure the authorization controller
        ASAuthorizationController *authController = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[registrationRequest]];
        authController.delegate = self;
        authController.presentationContextProvider = self;
        
        // Perform the request
        [authController performRequests];
    });
}

- (void)signUpWithPassword:(JS::NativeCredentialsManager::CredObject &)credObject
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject {
    // Apple's Authentication Services only supports AutoFill passwords, not manual credential storage
    // Manual keychain storage is not part of Authentication Services framework
    reject(@"UNSUPPORTED_OPERATION", @"Manual password storage is not supported. Use AutoFill passwords through signIn method instead.", nil);
}

- (void)signIn:(NSArray *)options
        params:(JS::NativeCredentialsManager::SpecSignInParams &)params
       resolve:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        self.currentResolve = resolve;
        self.currentReject = reject;
        
        NSMutableArray<ASAuthorizationRequest *> *authRequests = [[NSMutableArray alloc] init];
        
        for (NSString *option in options) {
            if ([option isEqualToString:@"passkeys"]) {
                // Extract passkeys parameters from the params object
                id passkeyParams = params.passkeys();
                if (!passkeyParams || ![passkeyParams isKindOfClass:[NSDictionary class]]) {
                    RCTLogError(@"Missing or invalid passkeys parameters");
                    continue;
                }
                
                NSDictionary *passkeyDict = (NSDictionary *)passkeyParams;
                NSString *challengeString = passkeyDict[@"challenge"];
                
                if (!challengeString || ![challengeString isKindOfClass:[NSString class]]) {
                    RCTLogError(@"Missing or invalid challenge in passkeys parameters");
                    continue;
                }
                
                NSData *challenge = [[NSData alloc] initWithBase64EncodedString:challengeString options:0];
                
                if (challenge) {
                    // Update relying party identifier if provided
                    NSString *rpId = passkeyDict[@"rpId"];
                    if (rpId && [rpId isKindOfClass:[NSString class]]) {
                        self.relyingPartyIdentifier = rpId;
                    }
                    
                    ASAuthorizationPlatformPublicKeyCredentialProvider *provider = 
                        [[ASAuthorizationPlatformPublicKeyCredentialProvider alloc] initWithRelyingPartyIdentifier:self.relyingPartyIdentifier];
                    
                    ASAuthorizationPlatformPublicKeyCredentialAssertionRequest *assertionRequest = 
                        [provider createCredentialAssertionRequestWithChallenge:challenge];
                    assertionRequest.userVerificationPreference = ASAuthorizationPublicKeyCredentialUserVerificationPreferenceRequired;
                    
                    [authRequests addObject:assertionRequest];
                } else {
                    RCTLogError(@"Failed to decode challenge for passkey authentication");
                }
            } else if ([option isEqualToString:@"password"]) {
                // Use Apple's AutoFill password provider (not manual keychain)
                ASAuthorizationPasswordProvider *passwordProvider = [[ASAuthorizationPasswordProvider alloc] init];
                ASAuthorizationPasswordRequest *passwordRequest = [passwordProvider createRequest];
                [authRequests addObject:passwordRequest];
            } else if ([option isEqualToString:@"apple-signin"]) {
                // Apple Sign In is supported by Authentication Services
                ASAuthorizationAppleIDProvider *appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
                ASAuthorizationAppleIDRequest *appleIDRequest = [appleIDProvider createRequest];
                appleIDRequest.requestedScopes = @[ASAuthorizationScopeFullName, ASAuthorizationScopeEmail];
                [authRequests addObject:appleIDRequest];
            } else if ([option isEqualToString:@"google-signin"]) {
                // Google Sign In is not part of Apple's Authentication Services framework
                RCTLogError(@"Google Sign In is not supported on iOS. Use Apple Sign In instead.");
                continue;
            }
        }
        
        if (authRequests.count == 0) {
            reject(@"NO_AUTH_METHODS", @"No valid authentication methods provided", nil);
            return;
        }
        
        // Create and configure the authorization controller
        ASAuthorizationController *authController = [[ASAuthorizationController alloc] initWithAuthorizationRequests:authRequests];
        authController.delegate = self;
        authController.presentationContextProvider = self;
        
        // Perform the request
        [authController performRequests];
    });
}

- (void)signUpWithGoogle:(JS::NativeCredentialsManager::GoogleSignInParams &)params
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject {
    // Google Sign In is not part of Apple's Authentication Services framework
    // This should be handled at the JavaScript layer for cross-platform compatibility
    reject(@"UNSUPPORTED_OPERATION", @"Google Sign In is not available on iOS. Use Apple Sign In instead.", nil);
}

- (void)signUpWithApple:(JS::NativeCredentialsManager::AppleSignInParams &)params
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        self.currentResolve = resolve;
        self.currentReject = reject;
        
        // Apple Sign In is officially supported by Authentication Services framework
        ASAuthorizationAppleIDProvider *appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
        ASAuthorizationAppleIDRequest *appleIDRequest = [appleIDProvider createRequest];
        
        // Set requested scopes - convert from TurboModule array
        NSMutableArray *scopes = [[NSMutableArray alloc] init];
        
        // Check if requestedScopes exists and is an array
        if (params.requestedScopes().size() > 0) {
            auto requestedScopesVector = params.requestedScopes();
            for (size_t i = 0; i < requestedScopesVector.size(); i++) {
                NSString *scope = requestedScopesVector[i];
                if ([scope isEqualToString:@"fullName"]) {
                    [scopes addObject:ASAuthorizationScopeFullName];
                } else if ([scope isEqualToString:@"email"]) {
                    [scopes addObject:ASAuthorizationScopeEmail];
                }
            }
        }
        
        if (scopes.count > 0) {
            appleIDRequest.requestedScopes = [scopes copy];
        } else {
            // Default scopes
            appleIDRequest.requestedScopes = @[ASAuthorizationScopeFullName, ASAuthorizationScopeEmail];
        }
        
        // Use nonce if provided
        NSString *nonce = params.nonce();
        if (nonce && nonce.length > 0) {
            appleIDRequest.nonce = nonce;
        }
        
        ASAuthorizationController *authController = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[appleIDRequest]];
        authController.delegate = self;
        authController.presentationContextProvider = self;
        
        [authController performRequests];
    });
}

- (void)signOut:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject {
    // Apple's Authentication Services doesn't provide a direct sign-out method
    // Sign-out is typically handled at the application level
    // AutoFill passwords and passkeys are managed by the system
    resolve([NSNull null]);
}

#pragma mark - ASAuthorizationControllerDelegate

- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithAuthorization:(ASAuthorization *)authorization {
    if (!self.currentResolve) {
        return;
    }
    
    RCTPromiseResolveBlock resolve = self.currentResolve;
    self.currentResolve = nil;
    self.currentReject = nil;
    
    if ([authorization.credential isKindOfClass:[ASAuthorizationPlatformPublicKeyCredentialRegistration class]]) {
        // Passkey registration - handled by Apple's Authentication Services
        ASAuthorizationPlatformPublicKeyCredentialRegistration *registration = (ASAuthorizationPlatformPublicKeyCredentialRegistration *)authorization.credential;
        
        NSDictionary *result = @{
            @"id": registration.credentialID ? [registration.credentialID base64EncodedStringWithOptions:0] : @"",
            @"rawId": registration.credentialID ? [registration.credentialID base64EncodedStringWithOptions:0] : @"",
            @"response": @{
                @"attestationObject": registration.rawAttestationObject ? [registration.rawAttestationObject base64EncodedStringWithOptions:0] : @"",
                @"clientDataJSON": registration.rawClientDataJSON ? [registration.rawClientDataJSON base64EncodedStringWithOptions:0] : @""
            },
            @"type": @"public-key"
        };
        
        resolve(result);
        
    } else if ([authorization.credential isKindOfClass:[ASAuthorizationPlatformPublicKeyCredentialAssertion class]]) {
        // Passkey authentication - handled by Apple's Authentication Services
        ASAuthorizationPlatformPublicKeyCredentialAssertion *assertion = (ASAuthorizationPlatformPublicKeyCredentialAssertion *)authorization.credential;
        
        NSDictionary *result = @{
            @"type": @"passkey",
            @"authenticationResponseJson": [self createAuthenticationResponseJSON:assertion]
        };
        
        resolve(result);
        
    } else if ([authorization.credential isKindOfClass:[ASPasswordCredential class]]) {
        // AutoFill password authentication - handled by Apple's Authentication Services
        ASPasswordCredential *passwordCredential = (ASPasswordCredential *)authorization.credential;
        
        NSDictionary *result = @{
            @"type": @"password",
            @"username": passwordCredential.user,
            @"password": passwordCredential.password
        };
        
        resolve(result);
        
    } else if ([authorization.credential isKindOfClass:[ASAuthorizationAppleIDCredential class]]) {
        // Apple Sign In - officially supported by Authentication Services
        ASAuthorizationAppleIDCredential *appleIDCredential = (ASAuthorizationAppleIDCredential *)authorization.credential;
        
        NSMutableDictionary *result = [@{
            @"type": @"apple-signin",
            @"id": appleIDCredential.user,
            @"idToken": appleIDCredential.identityToken ? [[NSString alloc] initWithData:appleIDCredential.identityToken encoding:NSUTF8StringEncoding] : @""
        } mutableCopy];
        
        if (appleIDCredential.fullName) {
            if (appleIDCredential.fullName.givenName) {
                result[@"givenName"] = appleIDCredential.fullName.givenName;
            }
            if (appleIDCredential.fullName.familyName) {
                result[@"familyName"] = appleIDCredential.fullName.familyName;
            }
            if (appleIDCredential.fullName.givenName || appleIDCredential.fullName.familyName) {
                NSString *fullName = [NSString stringWithFormat:@"%@ %@", 
                    appleIDCredential.fullName.givenName ?: @"", 
                    appleIDCredential.fullName.familyName ?: @""];
                result[@"displayName"] = [fullName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
            }
        }
        
        if (appleIDCredential.email) {
            result[@"email"] = appleIDCredential.email;
        }
        
        resolve([result copy]);
    }
}

- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithError:(NSError *)error {
    if (!self.currentReject) {
        return;
    }
    
    RCTPromiseRejectBlock reject = self.currentReject;
    self.currentResolve = nil;
    self.currentReject = nil;
    
    NSString *errorCode = @"UNKNOWN_ERROR";
    NSString *errorMessage = error.localizedDescription;
    
    if ([error.domain isEqualToString:ASAuthorizationErrorDomain]) {
        switch (error.code) {
            case ASAuthorizationErrorCanceled:
                errorCode = @"USER_CANCELED";
                errorMessage = @"User canceled the authorization request";
                break;
            case ASAuthorizationErrorFailed:
                errorCode = @"AUTHORIZATION_FAILED";
                break;
            case ASAuthorizationErrorInvalidResponse:
                errorCode = @"INVALID_RESPONSE";
                break;
            case ASAuthorizationErrorNotHandled:
                errorCode = @"NOT_HANDLED";
                break;
            case ASAuthorizationErrorUnknown:
                errorCode = @"UNKNOWN_ERROR";
                break;
        }
    }
    
    reject(errorCode, errorMessage, error);
}

#pragma mark - ASAuthorizationControllerPresentationContextProviding

- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller {
    if (self.authenticationAnchor) {
        return self.authenticationAnchor;
    }
    
    // Fallback to finding a key window
    UIWindow *keyWindow = nil;
    for (UIWindowScene *windowScene in [UIApplication sharedApplication].connectedScenes) {
        if (windowScene.activationState == UISceneActivationStateForegroundActive) {
            for (UIWindow *window in windowScene.windows) {
                if (window.isKeyWindow) {
                    keyWindow = window;
                    break;
                }
            }
        }
    }
    
    return keyWindow ?: [[UIApplication sharedApplication] windows].firstObject;
}

#pragma mark - Helper Methods

- (NSString *)createAuthenticationResponseJSON:(ASAuthorizationPlatformPublicKeyCredentialAssertion *)assertion {
    NSDictionary *response = @{
        @"id": assertion.credentialID ? [assertion.credentialID base64EncodedStringWithOptions:0] : @"",
        @"rawId": assertion.credentialID ? [assertion.credentialID base64EncodedStringWithOptions:0] : @"",
        @"response": @{
            @"authenticatorData": assertion.rawAuthenticatorData ? [assertion.rawAuthenticatorData base64EncodedStringWithOptions:0] : @"",
            @"clientDataJSON": assertion.rawClientDataJSON ? [assertion.rawClientDataJSON base64EncodedStringWithOptions:0] : @"",
            @"signature": assertion.signature ? [assertion.signature base64EncodedStringWithOptions:0] : @"",
            @"userHandle": assertion.userID ? [assertion.userID base64EncodedStringWithOptions:0] : @""
        },
        @"type": @"public-key"
    };
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:response options:0 error:&error];
    if (error) {
        return @"{}";
    }
    
    return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

@end

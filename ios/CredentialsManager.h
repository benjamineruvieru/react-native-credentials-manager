#import <Foundation/Foundation.h>
#import <AuthenticationServices/AuthenticationServices.h>
#import "generated/RNCredentialsManagerSpec/RNCredentialsManagerSpec.h"

@interface CredentialsManager : NSObject <NativeCredentialsManagerSpec, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>

@property (nonatomic, strong) ASPresentationAnchor authenticationAnchor;
@property (nonatomic, copy) RCTPromiseResolveBlock currentResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock currentReject;
@property (nonatomic, strong) NSString *relyingPartyIdentifier;

@end

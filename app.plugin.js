// set Info.plist values
import configPlugin from '@expo/config-plugins';

const {createRunOncePlugin, withEntitlementsPlist, withInfoPlist} = configPlugin

const withAllowMixedLocalizations = function (config) {
  return withInfoPlist(config, function (config) {
    config.modResults.CFBundleAllowMixedLocalizations =
      config.modResults.CFBundleAllowMixedLocalizations ?? true;

    return config;
  });
};

const withDefaultAppleSignIn = function (config) {
  config = withAllowMixedLocalizations(config);
  return withEntitlementsPlist(config, function (config) {
    config.modResults['com.apple.developer.applesignin'] = ['Default'];
    return config;
  });
};

const withAppleSignin = (config) => {
  config = withDefaultAppleSignIn(config);
  return config;
};

export default createRunOncePlugin(withAppleSignin, 'apple-signin');

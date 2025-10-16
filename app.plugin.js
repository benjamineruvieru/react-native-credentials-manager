// set Info.plist values
import configPlugin from '@expo/config-plugins';

const { createRunOncePlugin, withEntitlementsPlist, withInfoPlist } =
  configPlugin;

const withAllowMixedLocalizations = function (config) {
  return withInfoPlist(config, function (modConfig) {
    modConfig.modResults.CFBundleAllowMixedLocalizations =
      modConfig.modResults.CFBundleAllowMixedLocalizations ?? true;

    return modConfig;
  });
};

const withDefaultAppleSignIn = function (config) {
  config = withAllowMixedLocalizations(config);
  return withEntitlementsPlist(config, function (modConfig) {
    modConfig.modResults['com.apple.developer.applesignin'] = ['Default'];
    return modConfig;
  });
};

const withAppleSignin = (config) => {
  config = withDefaultAppleSignIn(config);
  return config;
};

export default createRunOncePlugin(withAppleSignin, 'apple-signin');

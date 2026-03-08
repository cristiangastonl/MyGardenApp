const { withGradleProperties, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Disable ExtraTranslation lint check that fails because iOS-only
 * locale strings (CFBundleDisplayName, NS*UsageDescription) leak
 * into Android resource files via Expo's locales config.
 */
function withDisableExtraTranslationLint(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'build.gradle'
      );

      let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8');

      // Add lintOptions to disable ExtraTranslation if not already present
      if (!buildGradle.includes('ExtraTranslation')) {
        buildGradle = buildGradle.replace(
          /android\s*\{/,
          `android {
    lint {
        disable += "ExtraTranslation"
    }`
        );
        fs.writeFileSync(buildGradlePath, buildGradle);
      }

      return config;
    },
  ]);
}

module.exports = withDisableExtraTranslationLint;

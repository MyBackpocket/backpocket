// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");
const path = require("node:path");

// Monorepo root and convex folder
const monorepoRoot = path.resolve(__dirname, "../..");
const _convexPath = path.resolve(monorepoRoot, "convex");

const config = getDefaultConfig(__dirname);

// Watch the monorepo root for changes (extend defaults, don't replace)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// Resolve modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Apply NativeWind v5 configuration
// - inlineVariables: false - prevents breaking PlatformColor in CSS variables
// - globalClassNamePolyfill: false - we add className support manually via useCssElement
module.exports = withNativewind(config, {
  inlineVariables: false,
  globalClassNamePolyfill: false,
});

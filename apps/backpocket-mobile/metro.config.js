// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const nativewindMetro = require("nativewind/metro");
const path = require("node:path");

// Monorepo root and convex folder
const monorepoRoot = path.resolve(__dirname, "../..");
const _convexPath = path.resolve(monorepoRoot, "convex");

let config = getDefaultConfig(__dirname);

// Watch the monorepo root for changes (extend defaults, don't replace)
config.watchFolders = [...(config.watchFolders || []), monorepoRoot];

// Resolve modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Apply NativeWind configuration
const withNativeWind = nativewindMetro.withNativeWind;
config = withNativeWind(config, { input: "./global.css" });

module.exports = config;

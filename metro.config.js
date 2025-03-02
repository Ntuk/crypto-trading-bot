// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add additional node_modules folders for pnpm
config.resolver.nodeModulesPaths = [
  `${__dirname}/node_modules`,
  // Add any other node_modules paths if needed
];

// Ensure we can resolve .ts and .tsx files
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = config; 
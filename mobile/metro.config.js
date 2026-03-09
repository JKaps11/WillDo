const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the shared package source
config.watchFolders = [monorepoRoot];

// Resolve modules from both mobile and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Follow symlinks so Metro can resolve deps inside bun's .bun/ linked directories
config.resolver.unstable_enableSymlinks = true;

module.exports = config;

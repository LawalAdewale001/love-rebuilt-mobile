const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const rootNodeModules = path.resolve(projectRoot, 'node_modules');

// Prefer project root node_modules so packages resolve from here.
config.resolver.nodeModulesPaths = [rootNodeModules];

// Enable package.json "exports" field resolution (needed for socket.io-client)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;

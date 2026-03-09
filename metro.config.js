const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const projectRoot = __dirname;
const rootNodeModules = path.resolve(projectRoot, 'node_modules');

// Prefer project root node_modules so packages resolve from here.
config.resolver.nodeModulesPaths = [rootNodeModules];

module.exports = config;

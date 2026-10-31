// Expo detecta el monorepo solo (watchFolders y node_modules de la raíz).
// @cranea/core se resuelve a su código TypeScript por los "exports" de su package.json.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);

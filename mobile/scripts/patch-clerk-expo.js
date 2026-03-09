/**
 * Patches @clerk/clerk-expo useOAuth.js to lazy-load expo-auth-session
 * and expo-web-browser, preventing crashes in Expo Go where these
 * native modules aren't available.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@clerk',
  'clerk-expo',
  'dist',
  'useOAuth.js',
);

if (!fs.existsSync(filePath)) {
  console.log('[patch-clerk-expo] useOAuth.js not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const originalAuthSession = 'var AuthSession = __toESM(require("expo-auth-session"));';
const originalWebBrowser = 'var WebBrowser = __toESM(require("expo-web-browser"));';

const patchedAuthSession =
  'var AuthSession; try { AuthSession = __toESM(require("expo-auth-session")); } catch(e) { AuthSession = null; }';
const patchedWebBrowser =
  'var WebBrowser; try { WebBrowser = __toESM(require("expo-web-browser")); } catch(e) { WebBrowser = null; }';

if (content.includes(originalAuthSession)) {
  content = content.replace(originalAuthSession, patchedAuthSession);
  content = content.replace(originalWebBrowser, patchedWebBrowser);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[patch-clerk-expo] Patched useOAuth.js for Expo Go compatibility');
} else {
  console.log('[patch-clerk-expo] Already patched or unexpected format, skipping');
}

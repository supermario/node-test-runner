const path = require('path');
const os = require('os');

/**
 * @returns { string }
 */
function elmHome() {
  const elmHomeEnv = process.env['ELM_HOME'];
  return elmHomeEnv === undefined ? defaultElmHome() : elmHomeEnv;
}

/**
 * @returns { string }
 */
function defaultElmHome() {
  return process.platform === 'win32'
    ? defaultWindowsElmHome()
    : defaultUnixElmHome();
}

/**
 * @returns { string }
 */
function defaultUnixElmHome() {
  return path.join(os.homedir(), '.elm');
}

/**
 * @returns { string }
 */
function defaultWindowsElmHome() {
  const appData = process.env['APPDATA'];
  const dir =
    appData === undefined
      ? path.join(os.homedir(), 'AppData', 'Roaming')
      : appData;
  return path.join(dir, 'elm');
}

/**
 * The compiler installs packages under a directory named after its own
 * version, so `elmVersion` must be the version of the compiler in use (see
 * `ElmCompiler.getVersion`), not a hard-coded one.
 *
 * @param { string } pkg
 * @param { string } elmVersion
 * @returns { string }
 */
function packagePath(pkg, elmVersion) {
  const parts = splitAuthorPkg(pkg);
  return path.join(elmHome(), elmVersion, 'packages', parts.author, parts.pkg);
}

/**
 * @param { string } pkgIdentifier
 * @returns { {
    author: string,
    pkg: string,
  } }
 */
function splitAuthorPkg(pkgIdentifier) {
  const [author = 'unknown', pkg = 'unknown'] = pkgIdentifier.split('/');
  return { author, pkg };
}

module.exports = {
  elmHome: elmHome,
  packagePath: packagePath,
  splitAuthorPkg: splitAuthorPkg,
};

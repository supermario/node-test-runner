'use strict';

const Spawn = require('./Spawn');

// The Elm version this release of elm-test targets. Used when we can’t figure
// out the version of the compiler we were given (see `getVersion` below).
const DEFAULT_ELM_VERSION = '0.19.3';

/**
 * @typedef { {
    spawn: (
      cmd: string,
      args: Array<string>,
      options: import('child_process').SpawnOptions
    ) => import('child_process').ChildProcess,
    cwd?: string,
    pathToElm: string,
    output?: string,
    reportJson?: boolean,
    processOpts?: import('child_process').SpawnOptions,
  } } Options
 */

/**
 * Converts an object of key/value pairs to an array of arguments suitable
 * to be passed to child_process.spawn for elm-make.
 *
 * @param { Options } options
 * @returns { Array<string> }
 */
function compilerArgsFromOptions(options) {
  var args = [];

  if (options.output != null) {
    args.push('--output', options.output);
  }

  if (options.reportJson === true) {
    args.push('--report', 'json');
  }

  return args;
}

/**
 * @param { Array<string> } sources
 * @param { Options } options
 * @returns { import('child_process').ChildProcess }
 */
function runCompiler(sources, options) {
  var pathToElm = options.pathToElm;
  var processArgs = ['make'].concat(sources, compilerArgsFromOptions(options));

  var processOpts = Object.assign(
    {},
    {
      env: Object.assign({ LANG: 'en_US.UTF-8' }, process.env),
      stdio: 'inherit',
      cwd: options.cwd,
    },
    options.processOpts
  );

  return options.spawn(pathToElm, processArgs, processOpts);
}

/**
 * @param { unknown } err
 * @param { string } pathToElm
 * @returns { string }
 */
function compilerErrorToString(err, pathToElm) {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof err.code === 'string'
  ) {
    switch (err.code) {
      case 'ENOENT':
        return (
          'Could not find Elm compiler "' + pathToElm + '". Is it installed?'
        );

      case 'EACCES':
        return (
          'Elm compiler "' +
          pathToElm +
          '" did not have permission to run. Do you need to give it executable permissions?'
        );

      default:
        return (
          'Error attempting to run Elm compiler "' + pathToElm + '":\n' + err
        );
    }
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    return JSON.stringify(err.message);
  } else {
    return (
      'Exception thrown when attempting to run Elm compiler ' +
      JSON.stringify(pathToElm)
    );
  }
}

/**
 *
 * @param { Array<string> } sources
 * @param { Options } options
 * @returns { import('child_process').ChildProcess }
 */
function compile(sources, options) {
  try {
    return runCompiler(sources, options).on('error', function (err) {
      throw err;
    });
  } catch (err) {
    throw new Error(compilerErrorToString(err, options.pathToElm));
  }
}

/**
 * Parses the output of `elm --version`, which is just the version, like
 * `0.19.3`.
 *
 * @param { string } output
 * @returns { string | undefined }
 */
function parseVersion(output) {
  const trimmed = output.trim();
  return /^\d+\.\d+\.\d+$/.test(trimmed) ? trimmed : undefined;
}

/**
 * Asks the compiler for its version.
 *
 * We need it for two things: The `"elm-version"` field of the generated
 * elm.json, and finding the packages the compiler has installed in ELM_HOME
 * (`$ELM_HOME/<version>/packages/`). Hard-coding the version only works for
 * the exact Elm version this release targets. It breaks when `--compiler`
 * points at a compiler with a different version, such as Lamdera (which
 * reports 0.19.2): elm.json would ask for the wrong version, and dependency
 * solving would look for installed packages in the wrong ELM_HOME directory.
 * That matters for packages which aren’t on package.elm-lang.org, which can
 * only be found in ELM_HOME.
 *
 * If the compiler can’t tell us (it fails to run, or prints something
 * unexpected), we fall back to `DEFAULT_ELM_VERSION`. In the "fails to run"
 * case, compiling will fail with a proper error message later anyway.
 *
 * @param { string } pathToElm
 * @returns { string }
 */
function getVersion(pathToElm) {
  const result = Spawn.spawnSync(pathToElm, ['--version'], {
    env: Object.assign({ LANG: 'en_US.UTF-8' }, process.env),
  });
  const version =
    result.status === 0 && typeof result.stdout === 'string'
      ? parseVersion(result.stdout)
      : undefined;
  return version === undefined ? DEFAULT_ELM_VERSION : version;
}

module.exports = {
  DEFAULT_ELM_VERSION: DEFAULT_ELM_VERSION,
  compile: compile,
  getVersion: getVersion,
  parseVersion: parseVersion,
};

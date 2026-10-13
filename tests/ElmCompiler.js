'use strict';

const assert = require('assert');
const path = require('path');
const ElmCompiler = require('../lib/ElmCompiler');
const ElmHome = require('../lib/ElmHome');

describe('ElmCompiler', () => {
  describe('parseVersion', () => {
    it('parses the output of `elm --version`', () => {
      assert.strictEqual(ElmCompiler.parseVersion('0.19.3\n'), '0.19.3');
    });

    it('parses a different version, like the one Lamdera reports', () => {
      assert.strictEqual(ElmCompiler.parseVersion('0.19.2\n'), '0.19.2');
    });

    it('rejects unexpected output', () => {
      assert.strictEqual(ElmCompiler.parseVersion(''), undefined);
      assert.strictEqual(ElmCompiler.parseVersion('v22.0.0\n'), undefined);
      assert.strictEqual(
        ElmCompiler.parseVersion('elm: command not found\n'),
        undefined
      );
    });
  });

  describe('getVersion', () => {
    it('falls back to the default version if the output is unexpected', () => {
      // `node --version` prints something like `v22.0.0`, which isn’t an Elm version.
      assert.strictEqual(
        ElmCompiler.getVersion(process.execPath),
        ElmCompiler.DEFAULT_ELM_VERSION
      );
    });
  });
});

describe('ElmHome', () => {
  describe('packagePath', () => {
    it('uses the given compiler version, not a hard-coded one', () => {
      assert.strictEqual(
        ElmHome.packagePath('lamdera/codecs', '0.19.2'),
        path.join(ElmHome.elmHome(), '0.19.2', 'packages', 'lamdera', 'codecs')
      );
    });
  });
});

/* eslint-disable @typescript-eslint/no-var-requires */

const gulp = require('gulp');
const dotenv = require('dotenv');
const enviroments = require('./src/core/config/enviroments_gulp');
const { spawn } = require('node:child_process');
const argv = require('yargs').argv;
const os = require('os');

gulp.task('setEnv', function (callback) {
  setEnv();
  let cmd = 'npm';
  if (os.platform() === 'win32') {
    cmd = 'npm.cmd';
  }
  if (!argv.command) {
    callback();
    return;
  }

  let proceso = spawn(cmd, ['run', argv.command]);
  //listeting changes
  proceso.stdout.on('data', function (data) {
    console.log(data.toString());
  });
  proceso.stderr.on('data', err => {
    console.error(err.toString());
    callback(err);
  });

  proceso.on('close', function (code) {
    callback();
  });
});

function setEnv() {
  dotenv.config({
    path: enviroments ? enviroments[process?.env?.NODE_ENV] : '.env',
  });
  console.log(`Enviroment ${process?.env?.NODE_ENV || 'dev'} selected`);
}

gulp.task('default', gulp.series('setEnv'));

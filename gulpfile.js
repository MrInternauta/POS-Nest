/* eslint-disable @typescript-eslint/no-var-requires */

const gulp = require('gulp');
const dotenv = require('dotenv');
const enviroments = require('./src/enviroments');

gulp.task('setEnv', function (callback) {
  dotenv.config({
    path: enviroments[process?.env?.NODE_ENV] || '.env',
  });
  console.log(process?.env?.DATA_BASE);
  callback();
});

gulp.task('default', gulp.series('setEnv'));

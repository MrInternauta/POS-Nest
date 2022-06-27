import gulp from 'gulp';
import { enviroments } from './src/enviroments';
import dotenv from 'dotenv';

gulp.task('setDevEnv', function (callback) {
  dotenv.config({
    path: enviroments[process?.env?.NODE_ENV] || '.env',
  });
  console.log(process?.env?.DATA_BASE);
  callback();
});

gulp.task('default', gulp.series('setDevEnv'));

const { src, dest } = require('gulp');
const zip = require('gulp-zip');
const fs = require('fs');

const manifest = fs.readFileSync('./manifest.json');
var version = JSON.parse(manifest)['version'];
var zipFileName = 'Tracker-Plus-v' + version + '.zip';

exports.default = () =>
  src(['main.js', 'manifest.json', 'styles.css'])
    .pipe(zip(zipFileName))
    .pipe(dest('.'));

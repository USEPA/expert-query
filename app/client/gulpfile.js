const uswds = require('@uswds/compile');

uswds.settings.version = 3;

uswds.paths.dist.css = './public/uswds/css';
uswds.paths.dist.img = './public/uswds/img';
uswds.paths.dist.fonts = './public/uswds/fonts';
uswds.paths.dist.js = './public/uswds/js';
uswds.paths.dist.theme = './public/scss';

exports.init = async () => {
  await uswds.copyAssets();
  uswds.compile();
};
exports.compile = uswds.compile;

import * as uswds from '@uswds/compile';
import { series } from 'gulp';

uswds.settings.version = 3;

uswds.paths.dist.css = './public/uswds/css';
uswds.paths.dist.img = './public/uswds/img';
uswds.paths.dist.fonts = './public/uswds/fonts';
uswds.paths.dist.js = './public/uswds/js';
uswds.paths.dist.theme = './public/scss';

export const init = async () => {
  const task = series(
    uswds.copyFonts,
    uswds.copyImages,
    uswds.copyJS,
    uswds.compile,
  );
  await task();
};

export const compile = uswds.compile;

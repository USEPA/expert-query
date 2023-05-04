import api from './api.js';
import attains from './attains.js';
import health from './health.js';
import route404 from './404.js';

export default function (app, basePath) {
  api(app, basePath);
  attains(app, basePath);
  health(app, basePath);
  route404(app, basePath);
}

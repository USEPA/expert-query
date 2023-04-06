import api from './api.js';
import data from './data.js';
import health from './health.js';
import route404 from './404.js';

export default function (app, basePath) {
  api(app, basePath);
  data(app, basePath);
  health(app, basePath);
  route404(app, basePath);
}

import api from './api.js';
import data from './data.js';
import health from './health.js';
import route404 from './404.js';

export default function (app) {
  api(app);
  data(app);
  health(app);
  route404(app);
}

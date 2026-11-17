// Aborts requests with a TCP RST at varying moments during the server's setup
// (the window between the route checking out a pooled client and the response's
// teardown handlers wiring up), the way a killed process or a monitor that drops
// mid-check does. However the abort races setup, the server must neither crash
// nor leak a pooled client.
import net from 'node:net';
import {
  HOST,
  delay,
  poolQuerySucceeds,
  startApp,
  stopApp,
} from './support.js';

const ITERATIONS = Number(process.env.RST_ITERATIONS) || 500;
const MAX_DELAY_MS = Number(process.env.RST_MAX_DELAY_MS) || 50;

// A small, quick query. The point is racing the abort against setup, not
// holding the pool open.
const body = JSON.stringify({
  filters: { assessmentUnitId: 'AL/06030002-330-01' },
  columns: ['objectId'],
  options: { pageSize: 20 },
});
function request(port) {
  return (
    'POST /api/attains/tmdl HTTP/1.1\r\n' +
    `Host: ${HOST}:${port}\r\n` +
    'Content-Type: application/json\r\n' +
    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
    'Connection: close\r\n' +
    '\r\n' +
    body
  );
}

let server;
let port;
let baseUrl;

beforeAll(async () => {
  ({ server, port, baseUrl } = await startApp());
  if (!(await poolQuerySucceeds(baseUrl, 5000))) {
    throw new Error('App or dev DB not reachable; check the DB env.');
  }
});

afterAll(async () => {
  await stopApp(server);
});

// Send the whole request, then abort with a RST partway through the setup window.
function fireAndReset() {
  return new Promise((resolve) => {
    const socket = net.connect(port, HOST, () => {
      // Delay measured after the send, so the reset lands during setup
      socket.write(request(port), () => {
        setTimeout(() => {
          socket.resetAndDestroy(); // RST, not a graceful FIN
          resolve();
        }, Math.random() * MAX_DELAY_MS);
      });
    });
    socket.on('error', () => {});
  });
}

test(
  'aborting requests mid-setup with a RST never crashes the server or leaks the pool',
  async () => {
    for (let i = 0; i < ITERATIONS; i++) await fireAndReset();
    await delay(1000); // Let any mishandled abort surface

    // A crash takes the server down and a leak drains the pool; either way this
    // probe then fails.
    expect(await poolQuerySucceeds(baseUrl, 10000)).toBe(true);
  },
  60000,
);

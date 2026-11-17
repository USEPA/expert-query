// Shared setup for the resilience tests: boot the app in-process on an ephemeral
// port, then drive it with a raw unread-socket stall and a cheap pool-backed
// probe over plain TCP/HTTP.
import net from 'node:net';
import app from '../../app/app.js';
import { pool } from '../../app/utilities/database.js';

export const HOST = 'localhost';
export const POOL_MAX = Number.parseInt(process.env.DB_POOL_MAX, 10) || 10;
export const IDLE =
  Number.parseInt(process.env.STREAM_IDLE_TIMEOUT, 10) || 10000;

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Start the app on an ephemeral port. Returns { server, port, baseUrl }.
export function startApp() {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port, baseUrl: `http://${HOST}:${port}` });
    });
    server.once('error', reject);
  });
}

// Stop the app and end the DB pool so the process has no open handles left.
// closeAllConnections forces any lingering keep-alive sockets shut so close
// resolves promptly.
export async function stopApp(server) {
  await new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections?.();
  });
  await pool.end();
}

// Three states * all columns is tens of MB, far past the socket buffers, so a
// client that never reads blocks the server mid-stream and the cursor stays
// suspended holding its pooled client. (Only the first few MB are ever sent; the
// rest waits behind the stalled window.) A response small enough to fit those
// buffers would drain, finish, and release the client before the stall mattered.
const stallBody = JSON.stringify({
  filters: { state: ['AZ', 'OH', 'CA'] },
  options: { format: 'csv' },
  columns: [
    'objectId',
    'region',
    'state',
    'organizationType',
    'organizationId',
    'organizationName',
    'waterType',
    'reportingCycle',
    'cycleLastAssessed',
    'cycleStatus',
    'assessmentUnitId',
    'assessmentUnitName',
    'assessmentUnitStatus',
    'overallStatus',
    'epaIrCategory',
    'stateIrCategory',
    'useGroup',
    'useName',
    'useClassName',
    'useSupport',
    'useIrCategory',
    'useStateIrCategory',
    'monitoringStartDate',
    'monitoringEndDate',
    'assessmentDate',
    'assessmentTypes',
    'assessmentMethods',
    'assessmentBasis',
    'assessmentParameterAgency',
    'assessmentUseAgency',
    'parameterGroup',
    'parameterName',
    'parameterStatus',
    'parameterAttainment',
    'parameterIrCategory',
    'parameterStateIrCategory',
    'delisted',
    'delistedReason',
    'pollutantIndicator',
    'cycleFirstListed',
    'alternateListingIdentifier',
    'vision303dPriority',
    'cwa303dPriorityRanking',
    'cycleScheduledForTmdl',
    'cycleExpectedToAttain',
    'consentDecreeCycle',
    'cycleId',
    'seasonStartDate',
    'seasonEndDate',
    'associatedActionId',
    'associatedActionName',
    'associatedActionType',
    'associatedActionStatus',
    'associatedActionAgency',
    'locationDescription',
    'sizeSource',
    'sourceScale',
    'waterSize',
    'waterSizeUnits',
  ],
});

function stallRequest(port) {
  return (
    'POST /api/attains/assessments HTTP/1.1\r\n' +
    `Host: ${HOST}:${port}\r\n` +
    'Content-Type: application/json\r\n' +
    `Content-Length: ${Buffer.byteLength(stallBody)}\r\n` +
    '\r\n' +
    stallBody
  );
}

// A cheap, pool-backed request; blocks (and so returns false) while the pool is
// exhausted, succeeds once a client is freed.
export async function poolQuerySucceeds(baseUrl, timeoutMs) {
  try {
    const res = await fetch(
      `${baseUrl}/api/attains/sources/count?confirmed=Y&format=tsv`,
      { signal: AbortSignal.timeout(timeoutMs) },
    );
    return res.status === 200;
  } catch {
    return false;
  }
}

// Open a connection, send the request, and never read the response: the unread
// socket backs up, the server blocks writing, and its pooled client stays held.
// Returns the socket so the caller can tear it down (destroy, or resetAndDestroy
// for an abrupt RST).
export function startStall(port) {
  const socket = net.connect(port, HOST, () => socket.write(stallRequest(port)));
  socket.on('error', () => {}); // Ignore the reset when the server tears us down
  return socket;
}

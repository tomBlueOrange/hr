// Central config for talking to the HappyRobot server.
//
// The API base URL is resolved in this order:
//   1. REACT_APP_HR_API_BASE — an explicit override, if set at build time.
//   2. Development (`npm start`) — the local server on port 9876, which sends
//      CORS headers for http://localhost:3000 (the Create-React-App dev origin)
//      so the browser can call it directly, no dev proxy needed.
//   3. Production builds — a relative "/api/v1" path, so the dashboard talks to
//      whatever host it is served from (e.g. the Railway-generated URL). This
//      assumes the API is reverse-proxied under the same origin as the app.
//
// The auth token is no longer hard-coded: the user supplies it via the login
// screen and it is read at request time from the cookie store (see
// src/auth/token.ts), so it is not defined here.

const DEV_API_BASE = "http://localhost:9876/api/v1";
const PROD_API_BASE = "/api/v1";

export const API_BASE =
  process.env.REACT_APP_HR_API_BASE ??
  (process.env.NODE_ENV === "development" ? DEV_API_BASE : PROD_API_BASE);

// Central config for talking to the HappyRobot server.
//
// The server runs on port 9876 and already sends CORS headers for
// http://localhost:3000 (the Create-React-App dev origin), so the browser can
// call it directly — no dev proxy needed. Run the dashboard with `npm start`
// (default port 3000).
//
// The auth token is no longer hard-coded: the user supplies it via the login
// screen and it is read at request time from the cookie store (see
// src/auth/token.ts), so it is not defined here.

export const API_BASE = process.env.REACT_APP_HR_API_BASE ?? "http://localhost:9876/api/v1";

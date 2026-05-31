// Central config for talking to the HappyRobot server.
//
// The server runs on port 9876 and already sends CORS headers for
// http://localhost:3000 (the Create-React-App dev origin), so the browser can
// call it directly — no dev proxy needed. Run the dashboard with `npm start`
// (default port 3000).
//
// The auth token can be overridden at build time via REACT_APP_HR_TOKEN
// (e.g. in a .env.local file); it falls back to the known local dev token.

export const API_BASE = process.env.REACT_APP_HR_API_BASE ?? "http://localhost:9876/api/v1";

export const TOKEN =
    process.env.REACT_APP_HR_TOKEN ?? "9ccd158d-9f50-4ea7-8ede-95ffe1746833";

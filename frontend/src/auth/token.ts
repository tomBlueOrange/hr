// Cookie-backed storage for the HappyRobot API token.
//
// The token the dashboard uses to authenticate against the server is no longer
// hard-coded — it is supplied by the user via the login screen and persisted in
// a cookie so it survives page reloads. The login screen is shown only when this
// cookie is empty.

const COOKIE_NAME = "hr_token";
// Keep the token for ~30 days; the user can clear it early via the logout button.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function getToken(): string | null {
    const prefix = `${COOKIE_NAME}=`;
    const match = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(prefix));
    if (!match) {
        return null;
    }
    const value = decodeURIComponent(match.slice(prefix.length));
    return value.length > 0 ? value : null;
}

export function setToken(token: string): void {
    const encoded = encodeURIComponent(token);
    document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Strict`;
}

export function clearToken(): void {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

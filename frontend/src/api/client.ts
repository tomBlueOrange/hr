// Thin fetch wrapper: attaches the bearer token + JSON headers, throws a
// descriptive error on non-2xx responses, and returns parsed JSON.

import {API_BASE} from "./config";
import {getToken} from "../auth/token";

function authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    // Read the user-supplied token from the cookie at request time so it always
    // reflects the current login/logout state.
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} — ${body || "request failed"}`);
    }
    return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: authHeaders(),
    });
    return handle<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    return handle<T>(res);
}

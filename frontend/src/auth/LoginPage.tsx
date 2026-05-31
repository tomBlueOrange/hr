import React, {useState} from "react";

import {useAuth} from "./AuthContext";
import "./login.css";

// Prompts the user for the API token used to talk to the HappyRobot server.
// On submit the token is stored (in a cookie via AuthContext) and the dashboard
// is shown. Rendered only while no token cookie is present.
export const LoginPage: React.FC = () => {
    const {login} = useAuth();
    const [value, setValue] = useState("");

    const trimmed = value.trim();

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trimmed) {
            return;
        }
        login(trimmed);
    };

    return (
        <div className="hr-login">
            <form className="hr-login-card" onSubmit={onSubmit}>
                <div className="hr-login-brand">
                    <i className="ri-truck-line" />
                    <span>HappyRobot · Metrics</span>
                </div>
                <p className="hr-login-subtitle">
                    Enter your API token to access the dashboard.
                </p>
                <label className="hr-login-label" htmlFor="hr-token-input">
                    API token
                </label>
                <input
                    id="hr-token-input"
                    className="hr-login-input"
                    type="password"
                    autoFocus
                    autoComplete="off"
                    placeholder="Paste your token"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button className="hr-login-btn" type="submit" disabled={!trimmed}>
                    Sign in
                </button>
            </form>
        </div>
    );
};

export default LoginPage;

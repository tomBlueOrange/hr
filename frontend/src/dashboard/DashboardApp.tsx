import React, {useState} from "react";

import "./dashboard.css";
// Design tokens for the reused foundations components.
import "../components/metrics/metrics-theme.css";
import "../components/charts/charts-theme.css";
import "../components/table/table-theme.css";
import "../components/search/search-theme.css";

import {OverviewView} from "./OverviewView";
import {InsightsView} from "./InsightsView";
import {CallsView} from "./CallsView";
import {ApiTestView} from "./ApiTestView";
import {useAuth} from "../auth/AuthContext";

type View = "overview" | "insights" | "calls" | "apitest";

export const DashboardApp: React.FC = () => {
    const [view, setView] = useState<View>("overview");
    const {logout} = useAuth();

    return (
        <div className="hr-app">
            <header className="hr-header">
                <div className="hr-header-brand">
                    <i className="ri-truck-line" />
                    <span>HappyRobot · Metrics</span>
                </div>
                <nav className="hr-tabs">
                    <button
                        className={`hr-tab ${view === "overview" ? "hr-tab-active" : ""}`}
                        onClick={() => setView("overview")}
                    >
                        Overview
                    </button>
                    <button
                        className={`hr-tab ${view === "insights" ? "hr-tab-active" : ""}`}
                        onClick={() => setView("insights")}
                    >
                        Insights
                    </button>
                    <button
                        className={`hr-tab ${view === "calls" ? "hr-tab-active" : ""}`}
                        onClick={() => setView("calls")}
                    >
                        Calls
                    </button>
                    <button
                        className={`hr-tab ${view === "apitest" ? "hr-tab-active" : ""}`}
                        onClick={() => setView("apitest")}
                    >
                        API Test
                    </button>
                </nav>
                <button className="hr-logout-btn" onClick={logout}>
                    <i className="ri-logout-circle-line" />
                    Logout
                </button>
            </header>

            <main className="hr-main">
                {view === "overview" ? (
                    <OverviewView />
                ) : view === "insights" ? (
                    <InsightsView />
                ) : view === "calls" ? (
                    <CallsView />
                ) : (
                    <ApiTestView />
                )}
            </main>
        </div>
    );
};

export default DashboardApp;

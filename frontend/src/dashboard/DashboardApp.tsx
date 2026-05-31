import React, {useState} from "react";

import "./dashboard.css";
// Design tokens for the reused foundations components.
import "../components/metrics/metrics-theme.css";
import "../components/charts/charts-theme.css";
import "../components/table/table-theme.css";
import "../components/search/search-theme.css";

import {OverviewView} from "./OverviewView";
import {InsightsView} from "./InsightsView";
import {LoadSearchView} from "./LoadSearchView";

type View = "overview" | "insights" | "search";

export const DashboardApp: React.FC = () => {
    const [view, setView] = useState<View>("overview");

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
                        className={`hr-tab ${view === "search" ? "hr-tab-active" : ""}`}
                        onClick={() => setView("search")}
                    >
                        Load Search
                    </button>
                </nav>
            </header>

            <main className="hr-main">
                {view === "overview" ? (
                    <OverviewView />
                ) : view === "insights" ? (
                    <InsightsView />
                ) : (
                    <LoadSearchView />
                )}
            </main>
        </div>
    );
};

export default DashboardApp;

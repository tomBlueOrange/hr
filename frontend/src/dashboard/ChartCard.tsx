import React from "react";

import {Skeleton} from "../components/loading/skeleton/Skeleton";

// Wraps a chart in a titled card and handles loading/error/empty states.
export const ChartCard: React.FC<{
    title: string;
    loading: boolean;
    error: string | null;
    children: React.ReactNode;
}> = ({title, loading, error, children}) => (
    <section className="hr-card">
        <h2 className="hr-card-title">{title}</h2>
        {error ? (
            <div className="hr-error">{error}</div>
        ) : loading ? (
            <Skeleton style={{height: 320, width: "100%", borderRadius: 8}} />
        ) : (
            <div className="hr-chart-frame">{children}</div>
        )}
    </section>
);

export default ChartCard;

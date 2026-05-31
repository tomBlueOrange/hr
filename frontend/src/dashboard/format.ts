// Small display formatters for KPI values.

export const fmtInt = (n: number | null | undefined): string =>
    n == null ? "—" : Math.round(n).toLocaleString("en-US");

export const fmtCurrency = (n: number | null | undefined): string =>
    n == null ? "—" : n.toLocaleString("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0});

export const fmtWeight = (n: number | null | undefined): string =>
    n == null ? "—" : `${Math.round(n).toLocaleString("en-US")} lbs`;

export const fmtPercent = (ratio: number | null | undefined): string =>
    ratio == null || Number.isNaN(ratio) ? "—" : `${(ratio * 100).toFixed(1)}%`;

export const fmtSentiment = (n: number | null | undefined): string =>
    n == null ? "—" : `${(n * 100).toFixed(0)}%`;

export const fmtDuration = (seconds: number | null | undefined): string => {
    if (seconds == null) return "—";
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
};

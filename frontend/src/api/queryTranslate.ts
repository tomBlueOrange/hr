// Translation layer between the SearchQueryEditorSmall query model and the
// HappyRobot server's load-search payload.
//
// The editor emits leaf conditions wrapped as `fullTextCondition` /
// `numericCondition` / `termCondition` / `dateCondition`, but the server's
// POST /api/v1/loads/search expects the suffix-less keys `fullText` /
// `numeric` / `term` / `date`. This module performs that remap and drops geo/
// knn leaves, which the loads schema does not support.

import {
    BlueOrangeSearchQuery,
    BlueOrangeSearchQueryComponent,
    BlueOrangeSearchQueryCompositeCondition,
} from "../components/search/search-query-editor/SearchQueryEditor";

// Server-side condition shapes (suffix-less keys).
type ServerComponent =
    | { operand: string; components: ServerComponent[] }
    | { fullText: unknown }
    | { numeric: unknown }
    | { term: unknown }
    | { date: unknown };

// A numeric range with string bounds (as the editor stores them) coerced to
// numbers, which the server's numeric range query expects.
function numericBounds(nc: any): Record<string, unknown> {
    const out: Record<string, unknown> = {field: nc.field};
    for (const key of ["gte", "gt", "lte", "lt"] as const) {
        const v = nc[key];
        if (v !== undefined && v !== null && v !== "") out[key] = Number(v);
    }
    return out;
}

function isComposite(c: BlueOrangeSearchQueryComponent): c is BlueOrangeSearchQueryCompositeCondition {
    return "operand" in c && "components" in c;
}

function translateComponent(component: BlueOrangeSearchQueryComponent): ServerComponent | null {
    if (isComposite(component)) {
        return {
            operand: component.operand,
            components: component.components
                .map(translateComponent)
                .filter((c): c is ServerComponent => c !== null),
        };
    }

    const c = component as any;
    if ("fullTextCondition" in c) return {fullText: c.fullTextCondition};
    if ("termCondition" in c) return {term: c.termCondition};
    if ("numericCondition" in c) return {numeric: numericBounds(c.numericCondition)};
    if ("dateCondition" in c) return {date: c.dateCondition};

    // geo / knn leaves are not applicable to the loads index — drop them.
    return null;
}

export interface ServerSearchRequest {
    page: number;
    size: number;
    minimumShouldMatch: number;
    rootCondition: { operand: string; components: ServerComponent[] };
    sortConditions: Array<{ field: string; direction: "ASC" | "DESC" }>;
}

export interface SearchParams {
    query: BlueOrangeSearchQuery | null;
    page: number;
    size: number;
    sortField?: string;
    sortDir?: "ASC" | "DESC";
}

// Builds the server request body. When the editor produced no usable
// conditions, falls back to a match-all (every load has loadboardRate >= 0) so
// an empty search box simply lists all loads.
export function toServerRequest(params: SearchParams): ServerSearchRequest {
    const {query, page, size, sortField = "loadboardRate", sortDir = "DESC"} = params;

    const components = (query?.rootCondition?.components ?? [])
        .map(translateComponent)
        .filter((c): c is ServerComponent => c !== null);

    const rootCondition =
        components.length > 0
            ? {operand: query!.rootCondition.operand as string, components}
            : {operand: "AND", components: [{numeric: {field: "loadboardRate", gte: 0}}]};

    return {
        page,
        size,
        minimumShouldMatch: query?.minimumShouldMatch ?? 1,
        rootCondition,
        sortConditions: [{field: sortField, direction: sortDir}],
    };
}

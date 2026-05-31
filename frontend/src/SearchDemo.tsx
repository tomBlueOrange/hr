import React, {useState} from "react";

import "./Demos.css";
// Pulls in the design tokens for buttons, inputs, dropdowns, datepicker, badges, etc.
import "./components/search/search-theme.css";

import {
    SearchQueryEditor,
    BlueOrangeSearchQuery,
} from "./components/search/search-query-editor/SearchQueryEditor";
import {SearchQueryEditorSmall} from "./components/search/search-query-editor-small/SearchQueryEditorSmall";
import {Index, SchemaPropertyType} from "./components/interfaces/SearchTypes";

// ---- Sample index ----------------------------------------------------------
// The query editor builds its field pickers from an index schema. No search
// service is involved — the editor just emits the query object it constructs.

const sampleIndex: Index = {
    name: "products",
    displayName: "Products",
    description: "Demo product catalogue index",
    schema: {
        properties: [
            {apiName: "title", displayName: "Title", type: SchemaPropertyType.TEXT, title: true},
            {apiName: "description", displayName: "Description", type: SchemaPropertyType.TEXT},
            {apiName: "brand", displayName: "Brand", type: SchemaPropertyType.KEYWORDS},
            {apiName: "price", displayName: "Price", type: SchemaPropertyType.DOUBLE},
            {apiName: "quantity", displayName: "Quantity", type: SchemaPropertyType.INTEGER},
            {apiName: "in_stock", displayName: "In stock", type: SchemaPropertyType.BOOLEAN},
            {apiName: "released", displayName: "Release date", type: SchemaPropertyType.DATE},
            {apiName: "location", displayName: "Warehouse", type: SchemaPropertyType.GEO_POINT},
        ],
    },
};

export const SearchDemo: React.FC = () => {
    const [query, setQuery] = useState<BlueOrangeSearchQuery | null>(null);
    const [smallQuery, setSmallQuery] = useState<BlueOrangeSearchQuery | null>(null);

    return (
        <div className="demo-page">
            <h1 className="demo-title">Search Query Builder</h1>
            <p className="demo-subtitle">
                SearchQueryEditor &amp; SearchQueryEditorSmall, copied from
                @blue-orange-ai/foundations-core. These build a complex, nested
                search query against an index schema. The query object each one
                produces is shown below &mdash; no search service is wired up.
            </p>

            <section className="demo-card">
                <h2>SearchQueryEditor</h2>
                <p className="demo-card-hint">
                    Full builder: add conditions and nested AND/OR groups across typed
                    fields (text, number, date, boolean, geo). The emitted query updates live.
                </p>
                <SearchQueryEditor index={sampleIndex} onChange={(q) => setQuery(q)} />
                <h3 style={{margin: "20px 0 6px", fontSize: "0.95rem"}}>Built query</h3>
                <pre className="demo-json">{JSON.stringify(query, null, 2) || "// build a query above"}</pre>
            </section>

            <section className="demo-card">
                <h2>SearchQueryEditorSmall</h2>
                <p className="demo-card-hint">
                    The compact search-bar variant &mdash; type field conditions inline
                    (e.g. <code>brand:acme price&gt;10</code>) and it parses them into the
                    same query model.
                </p>
                <SearchQueryEditorSmall
                    index={sampleIndex}
                    placeholder="Search products…"
                    onChange={(q) => setSmallQuery(q)}
                />
                <h3 style={{margin: "20px 0 6px", fontSize: "0.95rem"}}>Built query</h3>
                <pre className="demo-json">{JSON.stringify(smallQuery, null, 2) || "// type a query above"}</pre>
            </section>
        </div>
    );
};

export default SearchDemo;

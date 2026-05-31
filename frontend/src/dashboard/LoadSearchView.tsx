import React, {useState} from "react";

import {SearchQueryEditorSmall} from "../components/search/search-query-editor-small/SearchQueryEditorSmall";
import {BlueOrangeSearchQuery} from "../components/search/search-query-editor/SearchQueryEditor";
import {Table, TableTheme} from "../components/table/table/Table";
import {THead} from "../components/table/thead/THead";
import {TBody} from "../components/table/tbody/TBody";
import {Row} from "../components/table/row/Row";
import {HeaderCell} from "../components/table/cells/headercell/HeaderCell";
import {PrimaryCell} from "../components/table/cells/primarycell/PrimaryCell";
import {TextDataCell} from "../components/table/cells/text-data-cell/TextDataCell";
import {CurrencyDataCell} from "../components/table/cells/currency-data-cell/CurrencyDataCell";
import {NumberDataCell} from "../components/table/cells/number-data-cell/NumberDataCell";
import {DateDataCell} from "../components/table/cells/date-data-cell/DateDataCell";
import {LoadingCell} from "../components/table/cells/loading-cell/LoadingCell";
import {CellAlignment} from "../components/interfaces/AppInterfaces";

import {useApi} from "../hooks/useApi";
import {searchLoads} from "../api/loads";
import {loadsIndex} from "./loadsIndex";

const PAGE_SIZE = 25;

// Each column maps its display label to the server field used for sorting.
const COLUMNS: {label: string; field: string}[] = [
    {label: "Load", field: "loadId"},
    {label: "Equipment", field: "equipmentType"},
    {label: "Rate", field: "loadboardRate"},
    {label: "Weight", field: "weight"},
    {label: "Miles", field: "miles"},
    {label: "Pickup", field: "pickupDateTime"},
    {label: "Delivery", field: "deliveryDateTime"},
    {label: "Commodity", field: "commodityType"},
];

type Sort = {field: string; dir: "ASC" | "DESC"};

export const LoadSearchView: React.FC = () => {
    const [query, setQuery] = useState<BlueOrangeSearchQuery | null>(null);
    const [page, setPage] = useState(0);
    // null = unsorted (server default order). Clicking cycles ASC → DESC → null.
    const [sort, setSort] = useState<Sort | null>(null);

    // Stable trigger for the fetch: re-run when the query tree, page, or sort changes.
    const queryKey = JSON.stringify(query?.rootCondition ?? null);

    const {data, loading, error} = useApi(
        () => searchLoads({query, page, size: PAGE_SIZE, sortField: sort?.field, sortDir: sort?.dir}),
        [queryKey, page, sort?.field ?? "", sort?.dir ?? ""]
    );

    const handleQueryChange = (q: BlueOrangeSearchQuery) => {
        setQuery(q);
        setPage(0);
    };

    // Cycle the clicked column through ascending → descending → unsorted.
    const handleSort = (field: string) => {
        setSort((prev) => {
            if (!prev || prev.field !== field) return {field, dir: "ASC"};
            if (prev.dir === "ASC") return {field, dir: "DESC"};
            return null;
        });
        setPage(0);
    };

    const loads = data?.results ?? [];
    const count = data?.count ?? 0;
    const from = count === 0 ? 0 : page * PAGE_SIZE + 1;
    const to = Math.min((page + 1) * PAGE_SIZE, count);
    const hasPrev = page > 0;
    const hasNext = (page + 1) * PAGE_SIZE < count;

    return (
        <div className="hr-search">
            <section className="hr-card">
                <h2 className="hr-card-title">Search loads</h2>
                <p className="hr-card-hint">
                    Build a query with field conditions (e.g. <code>deliveryLocation:Dallas</code>,
                    {" "}<code>loadboardRate&gt;2000</code>) or leave it empty to list everything.
                </p>
                <SearchQueryEditorSmall
                    index={loadsIndex}
                    placeholder="Search loads… e.g. deliveryLocation:Dallas loadboardRate>2000"
                    onChange={handleQueryChange}
                    onSave={handleQueryChange}
                />
            </section>

            <section className="hr-card">
                {error ? (
                    <div className="hr-error">{error}</div>
                ) : (
                    <div className="hr-table-frame">
                        <Table theme={TableTheme.OBJECT_LIST}>
                            <THead>
                                <tr>
                                    {COLUMNS.map((c) => (
                                        <HeaderCell
                                            key={c.field}
                                            sorted={sort?.field === c.field}
                                            sortAsc={sort?.field === c.field && sort.dir === "ASC"}
                                            style={{cursor: "pointer"}}
                                            tdProps={{onClick: () => handleSort(c.field)}}
                                        >
                                            <div className="hr-object-table-header">{c.label}</div>
                                        </HeaderCell>
                                    ))}
                                </tr>
                            </THead>
                            <TBody>
                                {loading
                                    ? Array.from({length: 10}).map((_, r) => (
                                          <Row key={`skeleton-${r}`} hoverEffect={false}>
                                              {COLUMNS.map((c) => (
                                                  <LoadingCell key={c.field} />
                                              ))}
                                          </Row>
                                      ))
                                    : loads.map((load) => (
                                          <Row key={load.loadId}>
                                              <PrimaryCell
                                                  text={load.loadId}
                                                  secondaryText={`${load.startingLocation} → ${load.deliveryLocation}`}
                                              />
                                              <TextDataCell text={load.equipmentType} alignment={CellAlignment.LEFT} />
                                              <CurrencyDataCell
                                                  amount={load.loadboardRate}
                                                  currency="USD"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <NumberDataCell value={load.weight} alignment={CellAlignment.LEFT} />
                                              <NumberDataCell value={load.miles} alignment={CellAlignment.LEFT} />
                                              <DateDataCell
                                                  date={load.pickupDateTime}
                                                  dateformat="HH:mm DD MMM YYYY"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <DateDataCell
                                                  date={load.deliveryDateTime}
                                                  dateformat="HH:mm DD MMM YYYY"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <TextDataCell
                                                  text={load.commodityType}
                                                  multipleValues
                                                  alignment={CellAlignment.LEFT}
                                              />
                                          </Row>
                                      ))}
                                {!loading && loads.length === 0 && (
                                    <Row hoverEffect={false}>
                                        <TextDataCell
                                            text="No loads match this query."
                                            alignment={CellAlignment.LEFT}
                                            tdProps={{colSpan: COLUMNS.length}}
                                        />
                                    </Row>
                                )}
                            </TBody>
                        </Table>
                    </div>
                )}

                <div className="hr-result-bar hr-result-bar-bottom">
                    <span>
                        {error
                            ? "—"
                            : loading
                            ? "Searching…"
                            : `${from.toLocaleString()}–${to.toLocaleString()} of ${count.toLocaleString()} loads`}
                        {data && !loading ? ` · ${data.searchDuration} ms` : ""}
                    </span>
                    <div className="hr-pagination">
                        <button
                            className="hr-page-btn"
                            disabled={!hasPrev || loading}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                            <i className="ri-arrow-left-s-line" /> Prev
                        </button>
                        <span className="hr-page-num">Page {page + 1}</span>
                        <button
                            className="hr-page-btn"
                            disabled={!hasNext || loading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoadSearchView;

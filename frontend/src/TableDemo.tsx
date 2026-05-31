import React from "react";

import "./Demos.css";
import "./components/table/table-theme.css";

import {
    DataTable,
    TableField,
    TableFieldType,
    TableFieldSortState,
    DataTableCellClickPosition,
} from "./components/table/data-table/DataTable";
import {Skeleton} from "./components/loading/skeleton/Skeleton";
import {BaseData, BaseDataType, SearchRecord} from "./components/interfaces/SearchTypes";

// ---- Schema ----------------------------------------------------------------
// One column per supported field type. `apiName` is matched against each
// record property's `key`.

const field = (label: string, apiName: string, type: TableFieldType): TableField => ({
    label,
    apiName,
    type,
    sortState: TableFieldSortState.UNSORTED,
    sortable: true,
    filterable: true,
    statistics: false,
});

const schema: TableField[] = [
    field("Name", "name", TableFieldType.STRING),
    field("Age", "age", TableFieldType.NUMBER),
    field("Salary", "salary", TableFieldType.CURRENCY),
    field("Joined", "joined", TableFieldType.DATE),
    field("Metadata", "meta", TableFieldType.STRUCT),
    field("Bio", "bio", TableFieldType.MARKDOWN),
];

// ---- Data ------------------------------------------------------------------

const prop = (key: string, value: string, type: BaseDataType): BaseData => ({type, key, value});

const people = [
    {
        name: "Ada Lovelace",
        age: 36,
        salary: 95000,
        joined: "2021-03-15",
        meta: {team: "R&D", level: 5, active: true},
        bio: "**Pioneer** of computing. Wrote the *first* algorithm. `note: legend`",
    },
    {
        name: "Alan Turing",
        age: 41,
        salary: 102000,
        joined: "2019-07-01",
        meta: {team: "Cryptography", level: 6, active: true},
        bio: "Father of CS. See [Turing machine] and `Enigma`.",
    },
    {
        name: "Grace Hopper",
        age: 52,
        salary: 110000,
        joined: "2018-01-22",
        meta: {team: "Compilers", level: 7, active: false},
        bio: "Coined *debugging*.\n\n- COBOL\n- Nanoseconds",
    },
    {
        name: "Katherine Johnson",
        age: 45,
        salary: 98000,
        joined: "2020-11-09",
        meta: {team: "Orbital Mechanics", level: 6, active: true},
        bio: "Computed trajectories for **Apollo**.",
    },
    {
        name: "Tim Berners-Lee",
        age: 48,
        salary: 120000,
        joined: "2017-05-30",
        meta: {team: "Web", level: 8, active: true},
        bio: "Invented the `World Wide Web`.",
    },
];

const data: SearchRecord[] = people.map((p, i) => ({
    primaryKey: prop("id", String(i + 1), BaseDataType.INTEGER),
    title: prop("title", p.name, BaseDataType.TEXT),
    properties: [
        prop("name", p.name, BaseDataType.TEXT),
        prop("age", String(p.age), BaseDataType.INTEGER),
        prop("salary", String(p.salary), BaseDataType.DOUBLE),
        prop("joined", p.joined, BaseDataType.DATE),
        prop("meta", JSON.stringify(p.meta), BaseDataType.OBJECT),
        prop("bio", p.bio, BaseDataType.TEXT),
    ],
}));

export const TableDemo: React.FC = () => {
    return (
        <div className="demo-page">
            <h1 className="demo-title">Table &amp; Skeleton</h1>
            <p className="demo-subtitle">
                The object table (DataTable) and Skeleton loader, copied from
                @blue-orange-ai/foundations-core.
            </p>

            <section className="demo-card">
                <h2>DataTable</h2>
                <p className="demo-card-hint">
                    Schema-driven table with one column per field type (string, number,
                    currency, date, JSON struct, markdown). Row numbers on, columns
                    resizable &amp; reorderable, rows selectable. Cell clicks log to console.
                </p>
                <div className="demo-table-frame">
                    <DataTable
                        schema={schema}
                        data={data}
                        showRowNumbers
                        resizableColumns
                        reorderableColumns
                        rowSelectable
                        cellsSelectable
                        onCellClick={(colIdx: number, rowIdx: number, _pos: DataTableCellClickPosition) =>
                            console.log("cell clicked", {colIdx, rowIdx})
                        }
                        onRowSelectable={(rows: number[]) => console.log("rows selected", rows)}
                    />
                </div>
            </section>

            <section className="demo-card">
                <h2>DataTable &mdash; loading</h2>
                <p className="demo-card-hint">
                    With <code>loading</code> set, the table renders skeleton placeholder
                    rows (here, 5).
                </p>
                <div className="demo-table-frame">
                    <DataTable schema={schema} data={[]} loading loadingPlaceholderRows={5} />
                </div>
            </section>

            <section className="demo-card">
                <h2>Skeleton</h2>
                <p className="demo-card-hint">
                    The standalone shimmer block &mdash; size it via <code>style</code>.
                </p>
                <div style={{display: "flex", flexDirection: "column", gap: 12}}>
                    <Skeleton style={{height: 24, width: "60%", borderRadius: 4}} />
                    <Skeleton style={{height: 24, width: "80%", borderRadius: 4}} />
                    <Skeleton style={{height: 24, width: "40%", borderRadius: 4}} />
                    <div className="demo-row" style={{marginTop: 8}}>
                        <Skeleton style={{height: 64, width: 64, borderRadius: "50%"}} />
                        <Skeleton style={{height: 64, flexGrow: 1, borderRadius: 8}} />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TableDemo;

/*
 * Subset of the @blue-orange-ai/foundations-clients search model, inlined here
 * so the DataTable and search query editor render standalone without depending
 * on the (unpublished) foundations-clients workspace package.
 */

// ---- Index / schema model (used by the search query editor) ----------------

export type Index = {
    id?: string;
    name: string;
    displayName: string;
    description: string;
    version?: number;
    schema: Schema;
    analyzers?: Analyzer[];
}

export type Schema = {
    id?: string;
    properties: SchemaProperty[];
}

export type SchemaProperty = {
    id?: string;
    type: SchemaPropertyType;
    apiName: string;

    key?: string;
    displayName?: string;
    allowMultiple?: boolean;
    primaryKey?: boolean;
    title?: boolean;

    analyzer?: string;

    dims?: number;
    similarity?: string;
}

export enum SchemaPropertyType {
    INTEGER = "INTEGER",
    LONG = "LONG",
    TEXT = "TEXT",
    FLOAT = "FLOAT",
    DOUBLE = "DOUBLE",
    GEO_POINT = "GEO_POINT",
    DATE = "DATE",
    KEYWORDS = "KEYWORDS",
    OBJECT = "OBJECT",
    VECTOR = "VECTOR",
    BOOLEAN = "BOOLEAN",
    SEARCH_AS_YOU_TYPE = "SEARCH_AS_YOU_TYPE"
}

export type Analyzer = {
    id?: string;
    name: string;
    type?: string;
    tokenizer: string;
    filter?: string[];
}

// ---- Record model (used by the DataTable) -----------------------------------

export enum BaseDataType {
    INTEGER = "INTEGER",
    LONG = "LONG",
    TEXT = "TEXT",
    FLOAT = "FLOAT",
    DOUBLE = "DOUBLE",
    GEO_POINT = "GEO_POINT",
    DATE = "DATE",
    KEYWORDS = "KEYWORDS",
    OBJECT = "OBJECT",
    VECTOR = "VECTOR",
    BOOLEAN = "BOOLEAN",
    SEARCH_AS_YOU_TYPE = "SEARCH_AS_YOU_TYPE",
    ARRAY = "ARRAY"
}

export type BaseData = {
    type: BaseDataType;
    key: string;
    value?: string;
    lat?: number;
    lon?: number;
    array?: BaseData[];
}

export type SearchRecord = {
    primaryKey: BaseData;
    title: BaseData;
    properties: BaseData[]
}

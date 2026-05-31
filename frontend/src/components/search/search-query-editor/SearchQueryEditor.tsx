import React, {useEffect, useMemo, useState} from "react";

import './SearchQueryEditor.css'
import {ButtonIcon} from "../../buttons/button-icon/ButtonIcon";
import {Description} from "../../text-decorations/description/Description";
import {GeneralHeading} from "../../text-decorations/general-heading/GeneralHeading";
import {SearchQueryGroup} from "../search-query-group/SearchQueryGroup";
import {Index, Schema, SchemaProperty} from "../../interfaces/SearchTypes";

export enum SearchQueryConditionType {
	LEAF="LEAF",
	GROUP="GROUP"
}

export enum SearchQueryLogicalOperand {
	AND="AND",
	OR="OR",
	EMPTY="EMPTY"
}

export enum SearchQueryLeafOperand {
	PHRASE="PHRASE",
	PHRASE_PREFIX="PHRASE_PREFIX",
	FUZZY="FUZZY",
	REGEX="REGEX",
	WILDCARD="WILDCARD",
	FULL_TEXT="FULL_TEXT",
	GEO_DISTANCE="GEO_DISTANCE",
	GEO_BOUNDING_BOX="GEO_BOUNDING_BOX",
	GEO_POLYGON="GEO_POLYGON",
	KNN="KNN",
	EQUALS="EQUALS",
	GREATER_THAN="GREATER_THAN",
	GREATER_THAN_OR_EQUAL_TO="GREATER_THAN_OR_EQUAL_TO",
	LESS_THAN="LESS_THAN",
	LESS_THAN_OR_EQUAL_TO="LESS_THAN_OR_EQUAL_TO",
	TRUE="TRUE",
	FALSE="FALSE"
}

export type IBlueOrangeSearchSchemaProperty = SchemaProperty;
export type IBlueOrangeSearchSchema = Schema;
export type IBlueOrangeSearchIndex = Index;

export type BlueOrangeSearchQueryCondition =
	| { fullTextCondition: BlueOrangeSearchQueryFullTextCondition }
	| { dateCondition: BlueOrangeSearchQueryDateCondition }
	| { geoBoundingBoxCondition: BlueOrangeSearchQueryGeoBoundingBoxCondition }
	| { geoDistanceCondition: BlueOrangeSearchQueryGeoDistanceCondition }
	| { geoPolygonCondition: BlueOrangeSearchQueryGeoPolygonCondition }
	| { knnCondition: BlueOrangeSearchQueryKnnCondition }
	| { numericCondition: BlueOrangeSearchQueryNumericCondition }
	| { termCondition: BlueOrangeSearchQueryTermCondition };

export enum BlueOrangeSearchQueryOperand {
	AND = "AND",
	OR = "OR",
	NOT = "NOT"
}

export type BlueOrangeSearchQueryComponent = BlueOrangeSearchQueryCondition | BlueOrangeSearchQueryCompositeCondition;

export type BlueOrangeSearchQueryCompositeCondition = {
	operand: BlueOrangeSearchQueryOperand;
	components: BlueOrangeSearchQueryComponent[];
}

export type BlueOrangeSearchQueryFullTextCondition = {
	query: string;
	fields: string[];
	fuzziness?: string;
	analyzer?: string;
}

export enum BlueOrangeSearchQueryTermType {
	PHRASE = "PHRASE",
	PHRASE_PREFIX = "PHRASE_PREFIX",
	FUZZY = "FUZZY",
	REGEX = "REGEX",
	WILDCARD = "WILDCARD"
}

export type BlueOrangeSearchQueryTermCondition = {
	field: string;
	query: string;
	type: BlueOrangeSearchQueryTermType;
	caseInsensitive?: boolean;
	fuzziness?: string;
	boost?: number;
	rewrite?: string;
	analyzer?: string;
}

export type BlueOrangeSearchQueryNumericCondition = {
	field: string;
	gte?: string;
	gt?: string;
	lte?: string;
	lt?: string;
}

export type BlueOrangeSearchQueryDateCondition = {
	field: string;
	gte?: string;
	gt?: string;
	lte?: string;
	lt?: string;
}

export type BlueOrangeSearchQueryGeoPoint = {
	lat: number;
	lng: number;
}

export type BlueOrangeSearchQueryGeoBoundingBoxCondition = {
	field: string;
	topLeft: BlueOrangeSearchQueryGeoPoint;
	bottomRight: BlueOrangeSearchQueryGeoPoint;
}

export type BlueOrangeSearchQueryGeoDistanceCondition = {
	field: string;
	distance: string;
	location: BlueOrangeSearchQueryGeoPoint;
}

export type BlueOrangeSearchQueryGeoPolygonCondition = {
	field: string;
	locations: BlueOrangeSearchQueryGeoPoint[];
}

export type BlueOrangeSearchQueryKnnCondition = {
	field: string;
	vector: number[];
	k?: number;
	similarity?: number;
	numCandidates?: number;
}

export type BlueOrangeSearchQuery = {
	index: string;
	filter?: boolean;
	page: number;
	size: number;
	minimumShouldMatch?: number;
	analyzer?: string;
	rootCondition: BlueOrangeSearchQueryCompositeCondition;
	sortConditions?: any[];
	aggregations?: any;
}

export interface ISearchQueryEditorCondition {
	id?: string,
	conditionType: SearchQueryConditionType,
	logic: SearchQueryLogicalOperand,
	operand: SearchQueryLeafOperand,
	ignoreCase: boolean,
	variable: string,
	comparison: any,
	groupConditions: Array<ISearchQueryEditorCondition>
}

interface Props {
	index: Index,
	query?: BlueOrangeSearchQuery,
	page?: number,
	size?: number,
	filter?: boolean,
	minimumShouldMatch?: number,
	analyzer?: string,
	showHeader?: boolean,
	onChange?: (query: BlueOrangeSearchQuery) => void,
	reportChangesOnSaveOnly?: boolean,
	onSave?: (query: BlueOrangeSearchQuery) => void,
}

export const SearchQueryEditor: React.FC<Props> = ({index, query, page=1, size=25, filter=false, minimumShouldMatch=1, analyzer, showHeader=true, onChange, reportChangesOnSaveOnly=false, onSave}) => {

	const initRootGroup = (): ISearchQueryEditorCondition => {
		const firstField = index.schema.properties.length > 0 ? index.schema.properties[0].apiName : "";
		return {
			conditionType: SearchQueryConditionType.GROUP,
			logic: SearchQueryLogicalOperand.AND,
			operand: SearchQueryLeafOperand.PHRASE,
			ignoreCase: false,
			variable: firstField,
			comparison: "",
			groupConditions: []
		}
	}

	const convertQueryToEditorCondition = (queryToConvert: BlueOrangeSearchQuery): ISearchQueryEditorCondition => {
		return convertCompositeToEditorCondition(queryToConvert.rootCondition);
	}

	const convertCompositeToEditorCondition = (composite: BlueOrangeSearchQueryCompositeCondition): ISearchQueryEditorCondition => {
		const firstField = index.schema.properties.length > 0 ? index.schema.properties[0].apiName : "";
		const logic = composite.operand === BlueOrangeSearchQueryOperand.OR ? SearchQueryLogicalOperand.OR : SearchQueryLogicalOperand.AND;
		
		return {
			conditionType: SearchQueryConditionType.GROUP,
			logic: logic,
			operand: SearchQueryLeafOperand.PHRASE,
			ignoreCase: false,
			variable: firstField,
			comparison: "",
			groupConditions: composite.components.map(convertComponentToEditorCondition)
		};
	}

	const convertComponentToEditorCondition = (component: BlueOrangeSearchQueryComponent): ISearchQueryEditorCondition => {
		const firstField = index.schema.properties.length > 0 ? index.schema.properties[0].apiName : "";
		
		if ('operand' in component && 'components' in component) {
			return convertCompositeToEditorCondition(component as BlueOrangeSearchQueryCompositeCondition);
		}

		const condition = component as BlueOrangeSearchQueryCondition;

		if ('fullTextCondition' in condition) {
			const ftc = condition.fullTextCondition;
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.FULL_TEXT,
				ignoreCase: false,
				variable: ftc.fields[0] ?? firstField,
				comparison: ftc.query,
				groupConditions: []
			};
		}

		if ('termCondition' in condition) {
			const tc = condition.termCondition;
			let operand: SearchQueryLeafOperand;
			switch (tc.type) {
				case BlueOrangeSearchQueryTermType.PHRASE_PREFIX:
					operand = SearchQueryLeafOperand.PHRASE_PREFIX;
					break;
				case BlueOrangeSearchQueryTermType.FUZZY:
					operand = SearchQueryLeafOperand.FUZZY;
					break;
				case BlueOrangeSearchQueryTermType.REGEX:
					operand = SearchQueryLeafOperand.REGEX;
					break;
				case BlueOrangeSearchQueryTermType.WILDCARD:
					operand = SearchQueryLeafOperand.WILDCARD;
					break;
				default:
					operand = SearchQueryLeafOperand.PHRASE;
			}
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: operand,
				ignoreCase: tc.caseInsensitive ?? false,
				variable: tc.field,
				comparison: tc.query,
				groupConditions: []
			};
		}

		if ('numericCondition' in condition) {
			const nc = condition.numericCondition;
			let operand = SearchQueryLeafOperand.EQUALS;
			let value = "";
			if (nc.gt !== undefined) {
				operand = SearchQueryLeafOperand.GREATER_THAN;
				value = nc.gt;
			} else if (nc.gte !== undefined && nc.lte !== undefined && nc.gte === nc.lte) {
				operand = SearchQueryLeafOperand.EQUALS;
				value = nc.gte;
			} else if (nc.gte !== undefined) {
				operand = SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO;
				value = nc.gte;
			} else if (nc.lt !== undefined) {
				operand = SearchQueryLeafOperand.LESS_THAN;
				value = nc.lt;
			} else if (nc.lte !== undefined) {
				operand = SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO;
				value = nc.lte;
			}
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: operand,
				ignoreCase: false,
				variable: nc.field,
				comparison: value,
				groupConditions: []
			};
		}

		if ('dateCondition' in condition) {
			const dc = condition.dateCondition;
			let operand = SearchQueryLeafOperand.EQUALS;
			let value = "";
			if (dc.gt !== undefined) {
				operand = SearchQueryLeafOperand.GREATER_THAN;
				value = dc.gt;
			} else if (dc.gte !== undefined && dc.lte !== undefined && dc.gte === dc.lte) {
				operand = SearchQueryLeafOperand.EQUALS;
				value = dc.gte;
			} else if (dc.gte !== undefined) {
				operand = SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO;
				value = dc.gte;
			} else if (dc.lt !== undefined) {
				operand = SearchQueryLeafOperand.LESS_THAN;
				value = dc.lt;
			} else if (dc.lte !== undefined) {
				operand = SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO;
				value = dc.lte;
			}
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: operand,
				ignoreCase: false,
				variable: dc.field,
				comparison: value,
				groupConditions: []
			};
		}

		if ('geoDistanceCondition' in condition) {
			const gdc = condition.geoDistanceCondition;
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.GEO_DISTANCE,
				ignoreCase: false,
				variable: gdc.field,
				comparison: JSON.stringify({ distance: gdc.distance, location: gdc.location }),
				groupConditions: []
			};
		}

		if ('geoBoundingBoxCondition' in condition) {
			const gbbc = condition.geoBoundingBoxCondition;
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.GEO_BOUNDING_BOX,
				ignoreCase: false,
				variable: gbbc.field,
				comparison: JSON.stringify({ topLeft: gbbc.topLeft, bottomRight: gbbc.bottomRight }),
				groupConditions: []
			};
		}

		if ('geoPolygonCondition' in condition) {
			const gpc = condition.geoPolygonCondition;
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.GEO_POLYGON,
				ignoreCase: false,
				variable: gpc.field,
				comparison: JSON.stringify({ locations: gpc.locations }),
				groupConditions: []
			};
		}

		if ('knnCondition' in condition) {
			const kc = condition.knnCondition;
			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.KNN,
				ignoreCase: false,
				variable: kc.field,
				comparison: JSON.stringify({ vector: kc.vector, k: kc.k, similarity: kc.similarity, numCandidates: kc.numCandidates }),
				groupConditions: []
			};
		}

		return {
			conditionType: SearchQueryConditionType.LEAF,
			logic: SearchQueryLogicalOperand.EMPTY,
			operand: SearchQueryLeafOperand.PHRASE,
			ignoreCase: false,
			variable: firstField,
			comparison: "",
			groupConditions: []
		};
	}

	const getInitialRoot = (): ISearchQueryEditorCondition => {
		if (query) {
			return convertQueryToEditorCondition(query);
		}
		return initRootGroup();
	}

	const [internalRoot, setInternalRoot] = useState(getInitialRoot());
	const [initialRootSnapshot, setInitialRootSnapshot] = useState<ISearchQueryEditorCondition>(getInitialRoot());

	const schemaSignature = useMemo(() => {
		return (index.schema?.properties ?? [])
			.map((p) => `${p.apiName}:${p.type}`)
			.join("|");
	}, [index.name, index.schema?.properties]);

	const querySignature = useMemo(() => {
		if (!query) return "";
		try {
			return JSON.stringify(query.rootCondition);
		} catch {
			return "";
		}
	}, [query]);

	const changeReportingMode = reportChangesOnSaveOnly ? "ON_SAVE" : "ON_CHANGE";

	useEffect(() => {
		const next = initRootGroup();
		setInternalRoot(next);
		setInitialRootSnapshot(next);
	}, [index.name, schemaSignature]);

	useEffect(() => {
		if (query && changeReportingMode === "ON_SAVE") {
			const converted = convertQueryToEditorCondition(query);
			setInternalRoot(converted);
			setInitialRootSnapshot(converted);
		}
	}, [querySignature, changeReportingMode]);

	const dispatchChange = (condition: ISearchQueryEditorCondition) => {
		const rootCondition = convertGroup(condition);
		const query: BlueOrangeSearchQuery = {
			index: index.name,
			filter: filter,
			page: page,
			size: size,
			minimumShouldMatch: minimumShouldMatch,
			analyzer: analyzer,
			rootCondition: rootCondition
		}
		if (onChange) {
			onChange(query);
		}
	}

	const buildQuery = (condition: ISearchQueryEditorCondition): BlueOrangeSearchQuery => {
		const rootCondition = convertGroup(condition);
		return {
			index: index.name,
			filter: filter,
			page: page,
			size: size,
			minimumShouldMatch: minimumShouldMatch,
			analyzer: analyzer,
			rootCondition: rootCondition
		}
	}

	const isDirty = useMemo(() => {
		try {
			return JSON.stringify(internalRoot) !== JSON.stringify(initialRootSnapshot);
		} catch (e) {
			return true;
		}
	}, [internalRoot, initialRootSnapshot]);

	const updateRoot = (condition: ISearchQueryEditorCondition) => {
		setInternalRoot(condition);
		if (changeReportingMode === "ON_CHANGE") {
			dispatchChange(condition);
		}
	}

	const handleSave = () => {
		const query = buildQuery(internalRoot);
		if (onSave) {
			onSave(query);
		}
		if (changeReportingMode === "ON_SAVE" && onChange) {
			onChange(query);
		}
		setInitialRootSnapshot(internalRoot);
	}

	const handleCancel = () => {
		setInternalRoot(initialRootSnapshot);
		if (changeReportingMode === "ON_CHANGE" && onChange) {
			dispatchChange(initialRootSnapshot);
		}
	}

	const convertGroup = (condition: ISearchQueryEditorCondition): BlueOrangeSearchQueryCompositeCondition => {
		const operand = condition.logic == SearchQueryLogicalOperand.OR ? BlueOrangeSearchQueryOperand.OR : BlueOrangeSearchQueryOperand.AND;
		return {
			operand: operand,
			components: condition.groupConditions.map(convertCondition)
		}
	}

	const normalizeSchemaType = (schemaType: string): string => {
		const normalized = schemaType.toUpperCase();
		if (normalized == "INTEGER" || normalized == "LONG" || normalized == "FLOAT" || normalized == "DOUBLE") {
			return "NUMBER";
		}
		if (normalized == "DATE") {
			return "DATE";
		}
		if (normalized == "BOOLEAN") {
			return "BOOLEAN";
		}
		if (normalized == "GEO_POINT") {
			return "GEO_POINT";
		}
		if (normalized == "VECTOR") {
			return "VECTOR";
		}
		if (normalized == "OBJECT") {
			return "OBJECT";
		}
		return "STRING";
	}

	const getSchemaProperty = (apiName: string): IBlueOrangeSearchSchemaProperty | undefined => {
		for (var i = 0; i < index.schema.properties.length; i++) {
			if (index.schema.properties[i].apiName == apiName) {
				return index.schema.properties[i];
			}
		}
		return undefined;
	}

	const buildRange = (operand: SearchQueryLeafOperand, value: string) => {
		if (operand == SearchQueryLeafOperand.EQUALS) {
			return {gte: value, lte: value};
		}
		if (operand == SearchQueryLeafOperand.GREATER_THAN) {
			return {gt: value};
		}
		if (operand == SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO) {
			return {gte: value};
		}
		if (operand == SearchQueryLeafOperand.LESS_THAN) {
			return {lt: value};
		}
		if (operand == SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO) {
			return {lte: value};
		}
		return {gte: value, lte: value};
	}

	const parseJsonOrUndefined = (value: any): any | undefined => {
		if (value === undefined || value === null) {
			return undefined;
		}
		if (typeof value === 'object') {
			return value;
		}
		if (typeof value !== 'string') {
			return undefined;
		}
		const trimmed = value.trim();
		if (!trimmed) {
			return undefined;
		}
		try {
			return JSON.parse(trimmed);
		} catch (e) {
			return undefined;
		}
	}

	const convertCondition = (condition: ISearchQueryEditorCondition): BlueOrangeSearchQueryComponent => {
		if (condition.conditionType == SearchQueryConditionType.GROUP) {
			return convertGroup(condition);
		}

		const schemaProperty = getSchemaProperty(condition.variable);
		const normalizedType = normalizeSchemaType(schemaProperty?.type ?? "");

		if (normalizedType == "NUMBER") {
			const range = buildRange(condition.operand, String(condition.comparison ?? ""));
			return { numericCondition: { field: condition.variable, ...range } };
		}

		if (normalizedType == "DATE") {
			const range = buildRange(condition.operand, String(condition.comparison ?? ""));
			return { dateCondition: { field: condition.variable, ...range } };
		}

		if (normalizedType == "BOOLEAN") {
			const value = condition.operand == SearchQueryLeafOperand.TRUE ? "true" : "false";
			return { termCondition: { field: condition.variable, query: value, type: BlueOrangeSearchQueryTermType.PHRASE } };
		}

		if (condition.operand == SearchQueryLeafOperand.GEO_DISTANCE) {
			const parsed = parseJsonOrUndefined(condition.comparison);
			return {
				geoDistanceCondition: {
					field: condition.variable,
					distance: parsed?.distance ?? "",
					location: parsed?.location ?? {lat: 0, lng: 0}
				}
			}
		}

		if (condition.operand == SearchQueryLeafOperand.GEO_BOUNDING_BOX) {
			const parsed = parseJsonOrUndefined(condition.comparison);
			return {
				geoBoundingBoxCondition: {
					field: condition.variable,
					topLeft: parsed?.topLeft ?? {lat: 0, lng: 0},
					bottomRight: parsed?.bottomRight ?? {lat: 0, lng: 0}
				}
			}
		}

		if (condition.operand == SearchQueryLeafOperand.GEO_POLYGON) {
			const parsed = parseJsonOrUndefined(condition.comparison);
			return {
				geoPolygonCondition: {
					field: condition.variable,
					locations: parsed?.locations ?? []
				}
			}
		}

		if (condition.operand == SearchQueryLeafOperand.KNN) {
			const parsed = parseJsonOrUndefined(condition.comparison);
			const vector = Array.isArray(parsed) ? parsed : parsed?.vector;
			return {
				knnCondition: {
					field: condition.variable,
					vector: Array.isArray(vector) ? vector : [],
					k: parsed?.k,
					similarity: parsed?.similarity,
					numCandidates: parsed?.numCandidates
				}
			}
		}

		if (condition.operand == SearchQueryLeafOperand.FULL_TEXT) {
			return { fullTextCondition: { query: String(condition.comparison ?? ""), fields: [condition.variable] } };
		}

		const termType =
			condition.operand == SearchQueryLeafOperand.PHRASE_PREFIX ? BlueOrangeSearchQueryTermType.PHRASE_PREFIX :
			condition.operand == SearchQueryLeafOperand.FUZZY ? BlueOrangeSearchQueryTermType.FUZZY :
			condition.operand == SearchQueryLeafOperand.REGEX ? BlueOrangeSearchQueryTermType.REGEX :
			condition.operand == SearchQueryLeafOperand.WILDCARD ? BlueOrangeSearchQueryTermType.WILDCARD :
			BlueOrangeSearchQueryTermType.PHRASE;

		const caseInsensitive = (termType == BlueOrangeSearchQueryTermType.REGEX || termType == BlueOrangeSearchQueryTermType.WILDCARD) ? condition.ignoreCase : undefined;

		return {
			termCondition: {
				field: condition.variable,
				query: String(condition.comparison ?? ""),
				type: termType,
				caseInsensitive: caseInsensitive
			}
		};
	}

	return (
		<div className="blue-orange-search-query-editor-container">
			{showHeader &&
				<div className="blue-orange-search-query-editor-header">
					<div className="blue-orange-search-query-editor-header-left-cont">
						<GeneralHeading>{index.displayName ?? index.name}</GeneralHeading>
						{index.description && <Description>{index.description}</Description>}
					</div>
					<div className="blue-orange-search-query-editor-header-controls">
						<ButtonIcon icon={"ri-refresh-fill"} label={"Reset"} onClick={() => updateRoot(initRootGroup())}></ButtonIcon>
					</div>
				</div>
			}
			<SearchQueryGroup
				conditions={internalRoot.groupConditions}
				deletable={false}
				logic={internalRoot.logic}
				schema={index.schema.properties}
				onChange={updateRoot}
				showSave={true}
				isDirty={isDirty}
				onSave={handleSave}
				onCancel={handleCancel}
			></SearchQueryGroup>
		</div>
	)
}

import React, {useEffect, useState} from "react";

import './SearchQueryCondition.css'
import {Dropdown} from "../../inputs/dropdown/basic/Dropdown";
import {DropdownItemIcon} from "../../inputs/dropdown/items/DropdownItemIcon/DropdownItemIcon";
import {DropdownItemText} from "../../inputs/dropdown/items/DropdownItemText/DropdownItemText";
import {Input} from "../../inputs/input/Input";
import {Checkbox} from "../../inputs/checkbox/Checkbox";
import {ButtonIcon} from "../../buttons/button-icon/ButtonIcon";
import {Button, ButtonType} from "../../buttons/button/Button";
import {DateInput} from "../../inputs/date/datepicker/inputs/dateinput/DateInput";
import {TimePrecision} from "../../inputs/date/datepicker/items/datecontextwindowsingle/DateContextWindowSingle";
import {
	IBlueOrangeSearchSchemaProperty,
	ISearchQueryEditorCondition,
	SearchQueryLeafOperand
} from "../search-query-editor/SearchQueryEditor";
import {TextArea} from "../../inputs/textarea/TextArea";
import {Modal} from "../../layouts/modal/modal/Modal";
import {ModalHeader} from "../../layouts/modal/modal-header/ModalHeader";
import {ModalBody} from "../../layouts/modal/modal-body/ModalBody";
import {ModalDescription} from "../../layouts/modal/modal-description/ModalDescription";
import {ModalFooter} from "../../layouts/modal/modal-footer/ModalFooter";
import {ModalFooterRight} from "../../layouts/modal/modal-footer-right/ModalFooterRight";

interface Props {
	condition: ISearchQueryEditorCondition,
	schema: Array<IBlueOrangeSearchSchemaProperty>,
	onChange?: (condition: ISearchQueryEditorCondition) => void,
	onDelete?: () => void,
}

export const SearchQueryCondition: React.FC<Props> = ({condition, schema, onChange, onDelete}) => {

	const [internalCondition, setInternalCondition] = useState(condition);
	const [geoJsonImportModalOpen, setGeoJsonImportModalOpen] = useState(false);
	const [geoJsonImportText, setGeoJsonImportText] = useState<string>("");
	const [geoJsonImportError, setGeoJsonImportError] = useState<string | undefined>(undefined);

	useEffect(() => {
		setInternalCondition(condition);
	}, [condition]);

	const variableSelectionStyle: React.CSSProperties = {
		backgroundColor: "#e0e1e2",
		fontSize: "0.8rem"
	}

	const matchSelectionStyle: React.CSSProperties = {
		flexShrink: "0",
		border: "none",
		fontWeight: "600",
		textAlign: "center",
		fontSize: "0.8rem",
        background: "transparent"
	}

	const inputRowStyle: React.CSSProperties = {
		display: "flex",
		gap: "8px",
		flexWrap: "wrap",
		alignItems: "flex-end"
	}

	const parseNumberOrDefault = (value: string, defaultValue: number) => {
		const n = parseFloat(value);
		return isNaN(n) ? defaultValue : n;
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
			return "GEO";
		}
		if (normalized == "VECTOR") {
			return "VECTOR";
		}
		return "STRING";
	}

	const getSchemaPropertyFromVariableName = (variableName: string): IBlueOrangeSearchSchemaProperty | undefined => {
		for (var i=0; i < schema.length; i++) {
			if (schema[i].apiName == variableName) {
				return schema[i];
			}
		}
		return undefined;
	}

	const getIconFromSchemaProperty = (schemaProperty: IBlueOrangeSearchSchemaProperty | undefined): string => {
		if (!schemaProperty) {
			return "ri-braces-fill";
		}
		const normalized = schemaProperty.type.toUpperCase();
		if (normalized == "BOOLEAN") {
			return "ri-toggle-line";
		}
		if (normalized == "DATE") {
			return "ri-calendar-fill";
		}
		if (normalized == "GEO_POINT") {
			return "ri-map-pin-line";
		}
		if (normalized == "VECTOR") {
			return "ri-radar-line";
		}
		if (normalized == "OBJECT") {
			return "ri-braces-fill";
		}
		if (normalized == "KEYWORDS" || normalized == "TEXT" || normalized == "SEARCH_AS_YOU_TYPE") {
			return "ri-paragraph";
		}
		if (normalized == "INTEGER" || normalized == "LONG" || normalized == "FLOAT" || normalized == "DOUBLE") {
			return "ri-hashtag";
		}
		return "ri-paragraph";
	}

	const updateVariable = (variable: string) => {
		const nextVariable = variable != "-1" ? variable : (schema.length > 0 ? schema[0].apiName : "");
		const schemaProperty = getSchemaPropertyFromVariableName(nextVariable);
		const nextType = normalizeSchemaType(schemaProperty?.type ?? "");

		let nextOperand = internalCondition.operand;
		if (nextType == "GEO") {
			nextOperand = SearchQueryLeafOperand.GEO_DISTANCE;
		} else if (nextType == "VECTOR") {
			nextOperand = SearchQueryLeafOperand.KNN;
		} else if (nextType == "NUMBER" || nextType == "DATE") {
			nextOperand = SearchQueryLeafOperand.EQUALS;
		} else if (nextType == "BOOLEAN") {
			nextOperand = SearchQueryLeafOperand.TRUE;
		} else {
			nextOperand = SearchQueryLeafOperand.PHRASE;
		}

		const modCondition: ISearchQueryEditorCondition = {
			...internalCondition,
			variable: nextVariable,
			operand: nextOperand,
			comparison: defaultComparisonForOperand(nextOperand)
		};
		setInternalCondition(modCondition);
		updateCondition(modCondition);
	}

	const updateComparison = (comparison: any) => {
		const modCondition: ISearchQueryEditorCondition = {...internalCondition, comparison: comparison};
		setInternalCondition(modCondition);
		updateCondition(modCondition);
	}

	const updateDateComparison = (comparison: Date) => {
		const modCondition: ISearchQueryEditorCondition = {...internalCondition, comparison: comparison.toISOString()};
		setInternalCondition(modCondition);
		updateCondition(modCondition);
	}

	const updateMatchCase = (state: boolean) => {
		const modCondition: ISearchQueryEditorCondition = {...internalCondition, ignoreCase: !state};
		setInternalCondition(modCondition);
		updateCondition(modCondition);
	}

	const defaultComparisonForOperand = (operand: SearchQueryLeafOperand) => {
		if (operand == SearchQueryLeafOperand.GEO_DISTANCE) {
			return {distance: "", location: {lat: 0, lng: 0}};
		}
		if (operand == SearchQueryLeafOperand.GEO_BOUNDING_BOX) {
			return {topLeft: {lat: 0, lng: 0}, bottomRight: {lat: 0, lng: 0}};
		}
		if (operand == SearchQueryLeafOperand.GEO_POLYGON) {
			return {locations: []};
		}
		if (operand == SearchQueryLeafOperand.KNN) {
			return {vector: [], k: 5, numCandidates: 100};
		}
		return "";
	}

	const updateOperand = (operand: string) => {
		if (operand in SearchQueryLeafOperand) {
			const nextOperand = operand as SearchQueryLeafOperand;
			const modCondition: ISearchQueryEditorCondition = {
				...internalCondition,
				operand: nextOperand,
				comparison: defaultComparisonForOperand(nextOperand)
			};
			setInternalCondition(modCondition);
			updateCondition(modCondition);
		}
	}

	const updateCondition = (updated: ISearchQueryEditorCondition) => {
		if (onChange) {
			onChange(updated)
		}
	}

	const removeCondition = () => {
		if (onDelete) {
			onDelete()
		}
	}

	const parseDateOrDefault = (dateString: string): Date => {
		const parsedDate = new Date(dateString);
		if (isNaN(parsedDate.getTime())) {
			return new Date();
		}
		return parsedDate;
	}

	const determineComparisonInputType = () => {
		const schemaProperty = getSchemaPropertyFromVariableName(internalCondition.variable);
		const normalizedType = normalizeSchemaType(schemaProperty?.type ?? "");
		if (normalizedType == "DATE") {
			return "Date";
		}
		if (normalizedType == "NUMBER") {
			return "Number";
		}
		if (normalizedType == "BOOLEAN") {
			return "Boolean";
		}
		if (normalizedType == "GEO") {
			return "Geo";
		}
		if (normalizedType == "VECTOR") {
			return "Vector";
		}
		return "String";
	}

	const normalizedType = normalizeSchemaType(getSchemaPropertyFromVariableName(internalCondition.variable)?.type ?? "");

	useEffect(() => {
		const operand = internalCondition.operand;
		const shouldCorrectString = normalizedType == "STRING" && !(
			operand == SearchQueryLeafOperand.PHRASE ||
			operand == SearchQueryLeafOperand.PHRASE_PREFIX ||
			operand == SearchQueryLeafOperand.FUZZY ||
			operand == SearchQueryLeafOperand.REGEX ||
			operand == SearchQueryLeafOperand.WILDCARD ||
			operand == SearchQueryLeafOperand.FULL_TEXT
		);
		const shouldCorrectGeo = normalizedType == "GEO" && !(
			operand == SearchQueryLeafOperand.GEO_DISTANCE ||
			operand == SearchQueryLeafOperand.GEO_BOUNDING_BOX ||
			operand == SearchQueryLeafOperand.GEO_POLYGON
		);
		const shouldCorrectVector = normalizedType == "VECTOR" && operand != SearchQueryLeafOperand.KNN;
		const shouldCorrectNumberOrDate = (normalizedType == "NUMBER" || normalizedType == "DATE") && !(
			operand == SearchQueryLeafOperand.EQUALS ||
			operand == SearchQueryLeafOperand.GREATER_THAN ||
			operand == SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO ||
			operand == SearchQueryLeafOperand.LESS_THAN ||
			operand == SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO
		);
		const shouldCorrectBoolean = normalizedType == "BOOLEAN" && !(operand == SearchQueryLeafOperand.TRUE || operand == SearchQueryLeafOperand.FALSE);

		if (shouldCorrectString || shouldCorrectGeo || shouldCorrectVector || shouldCorrectNumberOrDate || shouldCorrectBoolean) {
			const nextOperand =
				normalizedType == "GEO" ? SearchQueryLeafOperand.GEO_DISTANCE :
				normalizedType == "VECTOR" ? SearchQueryLeafOperand.KNN :
				normalizedType == "NUMBER" || normalizedType == "DATE" ? SearchQueryLeafOperand.EQUALS :
				normalizedType == "BOOLEAN" ? SearchQueryLeafOperand.TRUE :
				SearchQueryLeafOperand.PHRASE;

			const updated: ISearchQueryEditorCondition = {
				...internalCondition,
				operand: nextOperand,
				comparison: defaultComparisonForOperand(nextOperand)
			};
			setInternalCondition(updated);
			updateCondition(updated);
		}
	}, [normalizedType]);

	const geoDistanceComparison = (typeof internalCondition.comparison === "object" && internalCondition.comparison) ? internalCondition.comparison : {distance: "", location: {lat: 0, lng: 0}};
	const geoBoundingBoxComparison = (typeof internalCondition.comparison === "object" && internalCondition.comparison) ? internalCondition.comparison : {topLeft: {lat: 0, lng: 0}, bottomRight: {lat: 0, lng: 0}};
	const geoPolygonComparison = (typeof internalCondition.comparison === "object" && internalCondition.comparison) ? internalCondition.comparison : {locations: []};
	const knnComparison = (typeof internalCondition.comparison === "object" && internalCondition.comparison) ? internalCondition.comparison : {vector: [], k: 5, numCandidates: 100};

	const updateGeoDistance = (patch: any) => {
		const next = {
			...geoDistanceComparison,
			...patch,
			location: {
				...(geoDistanceComparison.location ?? {lat: 0, lng: 0}),
				...(patch.location ?? {})
			}
		};
		updateComparison(next);
	}

	const updateGeoBoundingBox = (patch: any) => {
		const next = {
			...geoBoundingBoxComparison,
			...patch,
			topLeft: {
				...(geoBoundingBoxComparison.topLeft ?? {lat: 0, lng: 0}),
				...(patch.topLeft ?? {})
			},
			bottomRight: {
				...(geoBoundingBoxComparison.bottomRight ?? {lat: 0, lng: 0}),
				...(patch.bottomRight ?? {})
			}
		};
		updateComparison(next);
	}

	const addGeoPolygonPoint = () => {
		const locations = Array.isArray(geoPolygonComparison.locations) ? geoPolygonComparison.locations : [];
		updateComparison({...geoPolygonComparison, locations: [...locations, {lat: 0, lng: 0}]});
	}

	const updateGeoPolygonPoint = (index: number, patch: any) => {
		const locations = Array.isArray(geoPolygonComparison.locations) ? geoPolygonComparison.locations : [];
		const nextLocations = locations.map((p: any, i: number) => i === index ? {...p, ...patch} : p);
		updateComparison({...geoPolygonComparison, locations: nextLocations});
	}

	const removeGeoPolygonPoint = (index: number) => {
		const locations = Array.isArray(geoPolygonComparison.locations) ? geoPolygonComparison.locations : [];
		updateComparison({...geoPolygonComparison, locations: locations.filter((_: any, i: number) => i !== index)});
	}

	const importGeoJson = () => {
		try {
			const parsed = JSON.parse(geoJsonImportText);

			const isFiniteNumber = (n: any): n is number => typeof n === "number" && Number.isFinite(n);

			const parseRing = (ring: any): Array<{lat: number, lng: number}> => {
				if (!Array.isArray(ring)) {
					return [];
				}
				const points = ring
					.map((c: any) => {
						if (!Array.isArray(c) || c.length < 2) {
							return undefined;
						}
						const lng = typeof c[0] === "string" ? parseFloat(c[0]) : c[0];
						const lat = typeof c[1] === "string" ? parseFloat(c[1]) : c[1];
						if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
							return undefined;
						}
						return {lat, lng};
					})
					.filter(Boolean) as Array<{lat: number, lng: number}>;

				if (points.length >= 2) {
					const first = points[0];
					const last = points[points.length - 1];
					if (first.lat === last.lat && first.lng === last.lng) {
						return points.slice(0, -1);
					}
				}
				return points;
			}

			const extractFromGeometry = (geom: any): Array<{lat: number, lng: number}> => {
				if (!geom || typeof geom !== "object") {
					return [];
				}
				const t = String(geom.type ?? "");
				if (t === "Polygon") {
					return parseRing(geom.coordinates?.[0]);
				}
				if (t === "MultiPolygon") {
					return parseRing(geom.coordinates?.[0]?.[0]);
				}
				if (t === "GeometryCollection") {
					const geoms = Array.isArray(geom.geometries) ? geom.geometries : [];
					for (const g of geoms) {
						const pts = extractFromGeometry(g);
						if (pts.length > 0) {
							return pts;
						}
					}
				}
				return [];
			}

			const extractPoints = (obj: any): Array<{lat: number, lng: number}> => {
				if (!obj || typeof obj !== "object") {
					return [];
				}
				const t = String(obj.type ?? "");
				if (t === "Feature") {
					return extractFromGeometry(obj.geometry);
				}
				if (t === "FeatureCollection") {
					const features = Array.isArray(obj.features) ? obj.features : [];
					for (const f of features) {
						const pts = extractPoints(f);
						if (pts.length > 0) {
							return pts;
						}
					}
					return [];
				}
				return extractFromGeometry(obj);
			}

			const points = extractPoints(parsed);
			if (points.length < 3) {
				setGeoJsonImportError("GeoJSON must contain a Polygon with at least 3 points");
				return;
			}

			updateComparison({...geoPolygonComparison, locations: points});
			setGeoJsonImportError(undefined);
			setGeoJsonImportModalOpen(false);
		} catch (e: any) {
			setGeoJsonImportError(e?.message ? String(e.message) : "Invalid GeoJSON");
		}
	}

	const updateKnn = (patch: any) => {
		updateComparison({...knnComparison, ...patch});
	}

	return (
		<div className={"blue-orange-search-query-condition-cont"}>
			<div className="blue-orange-search-query-condition-cont-header">
                <div className={"blue-orange-search-query-condition-start-text"}>Value of</div>
                <div className={"blue-orange-search-query-condition-variable-selection"}>
                    <Dropdown filter={true} style={variableSelectionStyle} onSelection={(item) => updateVariable(item.reference)} contextWidth="fit-content">
                        {schema.map((item) => (
                            <DropdownItemIcon
                                key={item.apiName}
                                src={getIconFromSchemaProperty(item)}
                                label={item.displayName ?? item.apiName}
                                value={item.apiName}
                                selected={internalCondition.variable == item.apiName}
                                disabled={false}></DropdownItemIcon>
                        ))}
                    </Dropdown>
                </div>
                <div className={"blue-orange-search-query-condition-match-selection"}>
                    {normalizedType == "STRING" &&
                        <Dropdown style={matchSelectionStyle} onSelection={(item) => updateOperand(item.reference)} contextWidth="fit-content">
                            <DropdownItemText label={"Equals"} value={"PHRASE"} selected={"PHRASE" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Starts With"} value={"PHRASE_PREFIX"} selected={"PHRASE_PREFIX" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Fuzzy"} value={"FUZZY"} selected={"FUZZY" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Regex"} value={"REGEX"} selected={"REGEX" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Wildcard"} value={"WILDCARD"} selected={"WILDCARD" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Full Text"} value={"FULL_TEXT"} selected={"FULL_TEXT" == internalCondition.operand}></DropdownItemText>
                        </Dropdown>
                    }
                    {normalizedType == "GEO" &&
                        <Dropdown style={matchSelectionStyle} onSelection={(item) => updateOperand(item.reference)} contextWidth="fit-content">
                            <DropdownItemText label={"Geo Distance"} value={"GEO_DISTANCE"} selected={"GEO_DISTANCE" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Geo Bounding Box"} value={"GEO_BOUNDING_BOX"} selected={"GEO_BOUNDING_BOX" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"Geo Polygon"} value={"GEO_POLYGON"} selected={"GEO_POLYGON" == internalCondition.operand}></DropdownItemText>
                        </Dropdown>
                    }
                    {normalizedType == "VECTOR" &&
                        <Dropdown style={matchSelectionStyle} onSelection={(item) => updateOperand(item.reference)} contextWidth="fit-content">
                            <DropdownItemText label={"KNN"} value={"KNN"} selected={"KNN" == internalCondition.operand}></DropdownItemText>
                        </Dropdown>
                    }
                    {(normalizedType == "NUMBER" || normalizedType == "DATE") &&
                        <Dropdown style={matchSelectionStyle} onSelection={(item) => updateOperand(item.reference)} contextWidth="fit-content">
                            <DropdownItemText label={"equals"} value={"EQUALS"} selected={"EQUALS" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"is greater than"} value={"GREATER_THAN"} selected={"GREATER_THAN" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"is greater than or equal to"} value={"GREATER_THAN_OR_EQUAL_TO"} selected={"GREATER_THAN_OR_EQUAL_TO" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"is less than"} value={"LESS_THAN"} selected={"LESS_THAN" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"is less than or equal to"} value={"LESS_THAN_OR_EQUAL_TO"} selected={"LESS_THAN_OR_EQUAL_TO" == internalCondition.operand}></DropdownItemText>
                        </Dropdown>
                    }
                    {normalizedType == "BOOLEAN" &&
                        <Dropdown style={matchSelectionStyle} onSelection={(item) => updateOperand(item.reference)} contextWidth="fit-content">
                            <DropdownItemText label={"is true"} value={"TRUE"} selected={"TRUE" == internalCondition.operand}></DropdownItemText>
                            <DropdownItemText label={"is false"} value={"FALSE"} selected={"FALSE" == internalCondition.operand}></DropdownItemText>
                        </Dropdown>
                    }
                </div>
                {normalizedType == "STRING" &&
                    !(internalCondition.operand == SearchQueryLeafOperand.REGEX || internalCondition.operand == SearchQueryLeafOperand.WILDCARD) &&
                    <div className={"blue-orange-search-query-condition-checkbox"}>
                        <Checkbox checked={!internalCondition.ignoreCase} onCheckboxChange={updateMatchCase}></Checkbox>
                        <div className={"blue-orange-search-query-condition-checkbox-label"}>
                            Match Case
                        </div>
                    </div>
                }
                <div className={"blue-orange-search-query-condition-checkbox"}>
                    <ButtonIcon icon="ri-close-line" label={"Delete"} onClick={() => removeCondition()}></ButtonIcon>
                </div>
            </div>
            <div className="blue-orange-search-query-condition-cont-body">
                <div className={"blue-orange-search-query-condition-user-input"}>
                    {
                        determineComparisonInputType() != "Date" &&
                        determineComparisonInputType() != "Boolean" &&
                        determineComparisonInputType() != "Geo" &&
                        determineComparisonInputType() != "Number" &&
                        determineComparisonInputType() != "Vector" &&
                        <TextArea
                            value={String(internalCondition.comparison ?? "")}
                            placeholder={"This is a text input"}
                            onChange={updateComparison}
                        ></TextArea>
                    }
                    {
                        determineComparisonInputType() == "Number" &&
                        <Input
                            value={String(internalCondition.comparison ?? "")}
                            isNumber={true}
                            placeholder={"Enter a number"}
                            onChange={updateComparison}
                        ></Input>
                    }
                    {determineComparisonInputType() == "Geo" && internalCondition.operand == SearchQueryLeafOperand.GEO_DISTANCE &&
                        <div style={inputRowStyle}>
                            <Input label={"Distance"} value={String(geoDistanceComparison.distance ?? "")} placeholder={"10km"} onChange={(v) => updateGeoDistance({distance: v})}></Input>
                            <Input label={"Lat"} value={String(geoDistanceComparison.location?.lat ?? "")} isNumber={true} onChange={(v) => updateGeoDistance({location: {lat: parseNumberOrDefault(v, 0)}})}></Input>
                            <Input label={"Lng"} value={String(geoDistanceComparison.location?.lng ?? "")} isNumber={true} onChange={(v) => updateGeoDistance({location: {lng: parseNumberOrDefault(v, 0)}})}></Input>
                        </div>
                    }
                    {determineComparisonInputType() == "Geo" && internalCondition.operand == SearchQueryLeafOperand.GEO_BOUNDING_BOX &&
                        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                            <div style={inputRowStyle}>
                                <Input label={"Top Left Lat"} value={String(geoBoundingBoxComparison.topLeft?.lat ?? "")} isNumber={true} onChange={(v) => updateGeoBoundingBox({topLeft: {lat: parseNumberOrDefault(v, 0)}})}></Input>
                                <Input label={"Top Left Lng"} value={String(geoBoundingBoxComparison.topLeft?.lng ?? "")} isNumber={true} onChange={(v) => updateGeoBoundingBox({topLeft: {lng: parseNumberOrDefault(v, 0)}})}></Input>
                            </div>
                            <div style={inputRowStyle}>
                                <Input label={"Bottom Right Lat"} value={String(geoBoundingBoxComparison.bottomRight?.lat ?? "")} isNumber={true} onChange={(v) => updateGeoBoundingBox({bottomRight: {lat: parseNumberOrDefault(v, 0)}})}></Input>
                                <Input label={"Bottom Right Lng"} value={String(geoBoundingBoxComparison.bottomRight?.lng ?? "")} isNumber={true} onChange={(v) => updateGeoBoundingBox({bottomRight: {lng: parseNumberOrDefault(v, 0)}})}></Input>
                            </div>
                        </div>
                    }
                    {determineComparisonInputType() == "Geo" && internalCondition.operand == SearchQueryLeafOperand.GEO_POLYGON &&
                        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                            {(Array.isArray(geoPolygonComparison.locations) ? geoPolygonComparison.locations : []).map((p: any, index: number) => (
                                <div key={index} style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                                    <div className={"blue-orange-search-query-condition-geo-point-header"}>
                                        <div>
                                            {`Point ${index + 1}`}
                                        </div>
                                        <ButtonIcon icon={"ri-close-line"} label={"Remove"} onClick={() => removeGeoPolygonPoint(index)}></ButtonIcon>
                                    </div>
                                    <div style={inputRowStyle}>
                                        <Input label={`Lat ${index + 1}`} value={String(p?.lat ?? "")} isNumber={true} onChange={(v) => updateGeoPolygonPoint(index, {lat: parseNumberOrDefault(v, 0)})}></Input>
                                        <Input label={`Lng ${index + 1}`} value={String(p?.lng ?? "")} isNumber={true} onChange={(v) => updateGeoPolygonPoint(index, {lng: parseNumberOrDefault(v, 0)})}></Input>
                                    </div>
                                </div>
                            ))}
                            <div style={inputRowStyle}>
                                <Button text={"Import GeoJSON"} buttonType={ButtonType.PRIMARY} onClick={() => {setGeoJsonImportModalOpen(true); setGeoJsonImportText(""); setGeoJsonImportError(undefined);}}></Button>
                                <Button text={"Add Point"} buttonType={ButtonType.PRIMARY} onClick={() => addGeoPolygonPoint()}></Button>
                            </div>
                        </div>
                    }
                    {determineComparisonInputType() == "Vector" && internalCondition.operand == SearchQueryLeafOperand.KNN &&
                        <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                            <div style={inputRowStyle}>
                                <Input
                                    label={"Vector"}
                                    value={Array.isArray(knnComparison.vector) ? knnComparison.vector.join(",") : ""}
                                    placeholder={"0.1,0.2,0.3"}
                                    onChange={(v) => {
                                        const vec = v.split(",").map((s) => s.trim()).filter(Boolean).map((s) => parseFloat(s)).filter((n) => !isNaN(n));
                                        updateKnn({vector: vec});
                                    }}
                                ></Input>
                            </div>
                            <div style={inputRowStyle}>
                                <Input label={"k"} value={String(knnComparison.k ?? "")} isNumber={true} onChange={(v) => updateKnn({k: parseNumberOrDefault(v, 5)})}></Input>
                                <Input label={"numCandidates"} value={String(knnComparison.numCandidates ?? "")} isNumber={true} onChange={(v) => updateKnn({numCandidates: parseNumberOrDefault(v, 100)})}></Input>
                                <Input label={"similarity"} value={knnComparison.similarity === undefined || knnComparison.similarity === null ? "" : String(knnComparison.similarity)} isNumber={true} onChange={(v) => updateKnn({similarity: v === "" ? undefined : parseNumberOrDefault(v, 0)})}></Input>
                            </div>
                        </div>
                    }
                    {determineComparisonInputType() == "Date" &&
                        <DateInput
                            value={parseDateOrDefault(String(internalCondition.comparison ?? ""))}
                            displayFormat={"yyyy-MM-DD HH:mm:ss"}
                            showTime={true}
                            timePrecision={TimePrecision.MILLISECOND}
                            onChange={(value) => updateDateComparison(value)}></DateInput>
                    }
                </div>
            </div>
			{geoJsonImportModalOpen &&
				<Modal width={800} minWidth={800} minHeight={520} onClose={() => setGeoJsonImportModalOpen(false)}>
					<ModalHeader label={"Import GeoJSON"} onClose={() => setGeoJsonImportModalOpen(false)}></ModalHeader>
					<ModalDescription description={"Paste a GeoJSON Polygon (or Feature / FeatureCollection) to populate the polygon points"}></ModalDescription>
					<ModalBody>
						<TextArea
							label={"GeoJSON"}
							value={geoJsonImportText}
							placeholder={'{\n  "type": "Polygon",\n  "coordinates": [[[144.9631, -37.8136], [144.97, -37.81], [144.98, -37.82], [144.9631, -37.8136]]]\n}'}
							onChange={setGeoJsonImportText}
						></TextArea>
						{geoJsonImportError &&
							<div style={{marginTop: "10px", color: "#d9534f", fontSize: "0.8rem", fontWeight: 600}}>{geoJsonImportError}</div>
						}
					</ModalBody>
					<ModalFooter>
						<ModalFooterRight>
							<div style={{display: "flex", gap: "8px"}}>
								<Button text={"Cancel"} buttonType={ButtonType.SECONDARY} onClick={() => setGeoJsonImportModalOpen(false)}></Button>
								<Button text={"Import"} buttonType={ButtonType.PRIMARY} onClick={() => importGeoJson()}></Button>
							</div>
						</ModalFooterRight>
					</ModalFooter>
				</Modal>
			}
		</div>
	)
}

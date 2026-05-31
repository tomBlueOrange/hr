import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import './SearchQueryEditorSmall.css'
import {
	BlueOrangeSearchQuery,
	IBlueOrangeSearchIndex,
	ISearchQueryEditorCondition,
	SearchQueryConditionType,
	SearchQueryLeafOperand,
	SearchQueryLogicalOperand,
	SearchQueryEditor
} from "../search-query-editor/SearchQueryEditor";

interface Props {
	index: IBlueOrangeSearchIndex,
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
	placeholder?: string,
	style?: React.CSSProperties,
	popupMaxHeight?: number,
}

const getOperandSymbol = (operand: SearchQueryLeafOperand): string => {
	switch (operand) {
		case SearchQueryLeafOperand.EQUALS:
			return "=";
		case SearchQueryLeafOperand.GREATER_THAN:
			return ">";
		case SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO:
			return ">=";
		case SearchQueryLeafOperand.LESS_THAN:
			return "<";
		case SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO:
			return "<=";
		case SearchQueryLeafOperand.PHRASE:
		case SearchQueryLeafOperand.PHRASE_PREFIX:
		case SearchQueryLeafOperand.FULL_TEXT:
			return ":";
		case SearchQueryLeafOperand.FUZZY:
			return "~";
		case SearchQueryLeafOperand.REGEX:
			return ":/";
		case SearchQueryLeafOperand.WILDCARD:
			return ":*";
		case SearchQueryLeafOperand.GEO_DISTANCE:
			return ":near";
		case SearchQueryLeafOperand.GEO_BOUNDING_BOX:
			return ":bbox";
		case SearchQueryLeafOperand.GEO_POLYGON:
			return ":poly";
		case SearchQueryLeafOperand.KNN:
			return ":knn";
		case SearchQueryLeafOperand.TRUE:
			return ":true";
		case SearchQueryLeafOperand.FALSE:
			return ":false";
		default:
			return ":";
	}
};

const formatComparison = (comparison: any, operand: SearchQueryLeafOperand): string => {
	if (operand === SearchQueryLeafOperand.TRUE) return "";
	if (operand === SearchQueryLeafOperand.FALSE) return "";
	
	if (comparison === null || comparison === undefined || comparison === "") {
		return "";
	}
	
	if (typeof comparison === "object") {
		if (operand === SearchQueryLeafOperand.GEO_DISTANCE && comparison.location) {
			return `${comparison.distance}@${comparison.location.lat},${comparison.location.lng}`;
		}
		if (operand === SearchQueryLeafOperand.GEO_BOUNDING_BOX && comparison.topLeft && comparison.bottomRight) {
			return `[${comparison.topLeft.lat},${comparison.topLeft.lng} TO ${comparison.bottomRight.lat},${comparison.bottomRight.lng}]`;
		}
		if (operand === SearchQueryLeafOperand.GEO_POLYGON && comparison.locations) {
			return `polygon(${comparison.locations.length} points)`;
		}
		if (operand === SearchQueryLeafOperand.KNN && comparison.vector) {
			return `[${comparison.vector.length}d] k=${comparison.k || 5}`;
		}
		return JSON.stringify(comparison);
	}
	
	const str = String(comparison);
	if (str.includes(" ")) {
		return `"${str}"`;
	}
	return str;
};

const conditionToQueryPart = (condition: ISearchQueryEditorCondition): React.ReactNode[] => {
	if (condition.conditionType === SearchQueryConditionType.LEAF) {
		const operandSymbol = getOperandSymbol(condition.operand);
		const comparisonStr = formatComparison(condition.comparison, condition.operand);
		
		return [
			<span key="field" className="sqes-token sqes-token-field">{condition.variable}</span>,
			<span key="op" className="sqes-token sqes-token-operator">{operandSymbol}</span>,
			comparisonStr && <span key="value" className="sqes-token sqes-token-value">{comparisonStr}</span>
		].filter(Boolean) as React.ReactNode[];
	}
	
	if (condition.conditionType === SearchQueryConditionType.GROUP) {
		const parts: React.ReactNode[] = [];
		const logicOp = condition.logic === SearchQueryLogicalOperand.OR ? " OR " : " AND ";
		
		condition.groupConditions.forEach((child, idx) => {
			if (idx > 0) {
				parts.push(
					<span key={`logic-${idx}`} className="sqes-token sqes-token-logic">{logicOp}</span>
				);
			}
			
			const childParts = conditionToQueryPart(child);
			if (child.conditionType === SearchQueryConditionType.GROUP && child.groupConditions.length > 1) {
				parts.push(
					<span key={`group-${idx}`} className="sqes-token-group">
						<span className="sqes-token sqes-token-paren">(</span>
						{childParts}
						<span className="sqes-token sqes-token-paren">)</span>
					</span>
				);
			} else {
				parts.push(...childParts.map((p, i) => 
					React.cloneElement(p as React.ReactElement, { key: `${idx}-${i}` })
				));
			}
		});
		
		return parts;
	}
	
	return [];
};

export const SearchQueryEditorSmall: React.FC<Props> = ({
	index,
	query,
	page = 1,
	size = 25,
	filter = false,
	minimumShouldMatch = 1,
	analyzer,
	showHeader = false,
	onChange,
	reportChangesOnSaveOnly = true,
	onSave,
	placeholder = "Click to edit search query...",
	style = {},
	popupMaxHeight = 400,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [showAbove, setShowAbove] = useState(false);
	const [internalQuery, setInternalQuery] = useState<BlueOrangeSearchQuery | undefined>(query);
	const containerRef = useRef<HTMLDivElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setInternalQuery(query);
	}, [query]);

	const updatePopupPosition = useCallback(() => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			const spaceBelow = window.innerHeight - rect.bottom;
			const spaceAbove = rect.top;
			setShowAbove(spaceBelow < popupMaxHeight && spaceAbove > spaceBelow);
		}
	}, [popupMaxHeight]);

	const handleClick = () => {
		if (!isOpen) {
			updatePopupPosition();
			setIsOpen(true);
		}
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleQueryChange = (newQuery: BlueOrangeSearchQuery) => {
		setInternalQuery(newQuery);
		if (onChange) {
			onChange(newQuery);
		}
	};

	const handleQuerySave = (newQuery: BlueOrangeSearchQuery) => {
		setInternalQuery(newQuery);
		if (onSave) {
			onSave(newQuery);
		}
		setIsOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isOpen &&
				containerRef.current &&
				popupRef.current &&
				!containerRef.current.contains(event.target as Node) &&
				!popupRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	const convertQueryToEditorCondition = useCallback((queryToConvert: BlueOrangeSearchQuery): ISearchQueryEditorCondition => {
		const convertComposite = (composite: any): ISearchQueryEditorCondition => {
			const firstField = index.schema.properties.length > 0 ? index.schema.properties[0].apiName : "";
			const logic = composite.operand === "OR" ? SearchQueryLogicalOperand.OR : SearchQueryLogicalOperand.AND;
			
			return {
				conditionType: SearchQueryConditionType.GROUP,
				logic: logic,
				operand: SearchQueryLeafOperand.PHRASE,
				ignoreCase: false,
				variable: firstField,
				comparison: "",
				groupConditions: (composite.components || []).map((c: any) => convertComponent(c))
			};
		};

		const convertComponent = (component: any): ISearchQueryEditorCondition => {
			const firstField = index.schema.properties.length > 0 ? index.schema.properties[0].apiName : "";
			
			if ('operand' in component && 'components' in component) {
				return convertComposite(component);
			}

			if ('termCondition' in component) {
				const tc = component.termCondition;
				let operand: SearchQueryLeafOperand = SearchQueryLeafOperand.PHRASE;
				switch (tc.type) {
					case "PHRASE_PREFIX": operand = SearchQueryLeafOperand.PHRASE_PREFIX; break;
					case "FUZZY": operand = SearchQueryLeafOperand.FUZZY; break;
					case "REGEX": operand = SearchQueryLeafOperand.REGEX; break;
					case "WILDCARD": operand = SearchQueryLeafOperand.WILDCARD; break;
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

			if ('numericCondition' in component) {
				const nc = component.numericCondition;
				let operand = SearchQueryLeafOperand.EQUALS;
				let value = "";
				if (nc.gt !== undefined) { operand = SearchQueryLeafOperand.GREATER_THAN; value = nc.gt; }
				else if (nc.gte !== undefined && nc.lte !== undefined && nc.gte === nc.lte) { operand = SearchQueryLeafOperand.EQUALS; value = nc.gte; }
				else if (nc.gte !== undefined) { operand = SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO; value = nc.gte; }
				else if (nc.lt !== undefined) { operand = SearchQueryLeafOperand.LESS_THAN; value = nc.lt; }
				else if (nc.lte !== undefined) { operand = SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO; value = nc.lte; }
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

			if ('dateCondition' in component) {
				const dc = component.dateCondition;
				let operand = SearchQueryLeafOperand.EQUALS;
				let value = "";
				if (dc.gt !== undefined) { operand = SearchQueryLeafOperand.GREATER_THAN; value = dc.gt; }
				else if (dc.gte !== undefined && dc.lte !== undefined && dc.gte === dc.lte) { operand = SearchQueryLeafOperand.EQUALS; value = dc.gte; }
				else if (dc.gte !== undefined) { operand = SearchQueryLeafOperand.GREATER_THAN_OR_EQUAL_TO; value = dc.gte; }
				else if (dc.lt !== undefined) { operand = SearchQueryLeafOperand.LESS_THAN; value = dc.lt; }
				else if (dc.lte !== undefined) { operand = SearchQueryLeafOperand.LESS_THAN_OR_EQUAL_TO; value = dc.lte; }
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

			if ('geoDistanceCondition' in component) {
				const gdc = component.geoDistanceCondition;
				return {
					conditionType: SearchQueryConditionType.LEAF,
					logic: SearchQueryLogicalOperand.EMPTY,
					operand: SearchQueryLeafOperand.GEO_DISTANCE,
					ignoreCase: false,
					variable: gdc.field,
					comparison: { distance: gdc.distance, location: gdc.location },
					groupConditions: []
				};
			}

			if ('geoBoundingBoxCondition' in component) {
				const gbbc = component.geoBoundingBoxCondition;
				return {
					conditionType: SearchQueryConditionType.LEAF,
					logic: SearchQueryLogicalOperand.EMPTY,
					operand: SearchQueryLeafOperand.GEO_BOUNDING_BOX,
					ignoreCase: false,
					variable: gbbc.field,
					comparison: { topLeft: gbbc.topLeft, bottomRight: gbbc.bottomRight },
					groupConditions: []
				};
			}

			if ('geoPolygonCondition' in component) {
				const gpc = component.geoPolygonCondition;
				return {
					conditionType: SearchQueryConditionType.LEAF,
					logic: SearchQueryLogicalOperand.EMPTY,
					operand: SearchQueryLeafOperand.GEO_POLYGON,
					ignoreCase: false,
					variable: gpc.field,
					comparison: { locations: gpc.locations },
					groupConditions: []
				};
			}

			if ('knnCondition' in component) {
				const kc = component.knnCondition;
				return {
					conditionType: SearchQueryConditionType.LEAF,
					logic: SearchQueryLogicalOperand.EMPTY,
					operand: SearchQueryLeafOperand.KNN,
					ignoreCase: false,
					variable: kc.field,
					comparison: { vector: kc.vector, k: kc.k, numCandidates: kc.numCandidates },
					groupConditions: []
				};
			}

			if ('fullTextCondition' in component) {
				const ftc = component.fullTextCondition;
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

			return {
				conditionType: SearchQueryConditionType.LEAF,
				logic: SearchQueryLogicalOperand.EMPTY,
				operand: SearchQueryLeafOperand.PHRASE,
				ignoreCase: false,
				variable: firstField,
				comparison: "",
				groupConditions: []
			};
		};

		return convertComposite(queryToConvert.rootCondition);
	}, [index.schema.properties]);

	const queryDisplayParts = useMemo(() => {
		if (!internalQuery) return null;
		
		const editorCondition = convertQueryToEditorCondition(internalQuery);
		if (editorCondition.groupConditions.length === 0) {
			return null;
		}
		
		return conditionToQueryPart(editorCondition);
	}, [internalQuery, convertQueryToEditorCondition]);

	const hasQuery = queryDisplayParts && queryDisplayParts.length > 0;

	return (
		<div 
			ref={containerRef}
			className="sqes-container" 
			style={style}
		>
			<div 
				className={`sqes-input ${isOpen ? 'sqes-input-focused' : ''}`}
				onClick={handleClick}
			>
				<div className="sqes-input-icon">
					<i className="ri-search-line"></i>
				</div>
				<div className="sqes-input-content">
					{hasQuery ? (
						<div className="sqes-query-display">
							{queryDisplayParts}
						</div>
					) : (
						<span className="sqes-placeholder">{placeholder}</span>
					)}
				</div>
				<div className="sqes-input-chevron">
					<i className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
				</div>
			</div>

			{isOpen && (
				<div 
					ref={popupRef}
					className={`sqes-popup ${showAbove ? 'sqes-popup-above' : ''}`}
					style={{ maxHeight: popupMaxHeight }}
				>
					<div className="sqes-popup-header">
						<span className="sqes-popup-title">Edit Search Query</span>
						<button className="sqes-popup-close" onClick={handleClose}>
							<i className="ri-close-line"></i>
						</button>
					</div>
					<div className="sqes-popup-content">
						<SearchQueryEditor
							index={index}
							query={internalQuery}
							page={page}
							size={size}
							filter={filter}
							minimumShouldMatch={minimumShouldMatch}
							analyzer={analyzer}
							showHeader={showHeader}
							onChange={handleQueryChange}
							reportChangesOnSaveOnly={reportChangesOnSaveOnly}
							onSave={handleQuerySave}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

import React from "react";

import './SearchQueryContainer.css'
import {Badge} from "../../text-decorations/badge/Badge";
import {
	IBlueOrangeSearchSchemaProperty,
	ISearchQueryEditorCondition,
	SearchQueryConditionType,
	SearchQueryLogicalOperand
} from "../search-query-editor/SearchQueryEditor";
import {SearchQueryCondition} from "../search-query-condition/SearchQueryCondition";
import {SearchQueryGroup} from "../search-query-group/SearchQueryGroup";

interface Props {
	condition: ISearchQueryEditorCondition,
	schema: Array<IBlueOrangeSearchSchemaProperty>,
	logicalOperand: SearchQueryLogicalOperand,
	onChange?: (condition: ISearchQueryEditorCondition) => void,
	onDelete?: () => void,
}

export const SearchQueryContainer: React.FC<Props> = ({condition, schema, logicalOperand, onChange, onDelete}) => {

	const handleDelete = () => {
		if (onDelete) {
			onDelete();
		}
	}

	const updateCondition = (c: ISearchQueryEditorCondition) => {
		if (onChange) {
			onChange(c);
		}
	}

	return (
		<div className="blue-orange-search-query-container-cont">
			<div className="blue-orange-search-query-container-block">
				{ condition.conditionType == SearchQueryConditionType.LEAF && <SearchQueryCondition condition={condition} schema={schema} onChange={updateCondition} onDelete={handleDelete}></SearchQueryCondition>}
				{ condition.conditionType == SearchQueryConditionType.GROUP && <SearchQueryGroup condition={condition} schema={schema} onChange={updateCondition} onDelete={handleDelete}></SearchQueryGroup>}
			</div>
		</div>
	)
}

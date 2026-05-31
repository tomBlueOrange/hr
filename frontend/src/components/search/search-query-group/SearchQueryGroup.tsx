import React, {useEffect, useState} from "react";

import './SearchQueryGroup.css'
import {Dropdown} from "../../inputs/dropdown/basic/Dropdown";
import {DropdownItemText} from "../../inputs/dropdown/items/DropdownItemText/DropdownItemText";
import {Button, ButtonType} from "../../buttons/button/Button";
import {DropdownItemObj} from "../../interfaces/AppInterfaces";
import {ButtonIcon} from "../../buttons/button-icon/ButtonIcon";
import {
	IBlueOrangeSearchSchemaProperty,
	ISearchQueryEditorCondition,
	SearchQueryConditionType,
	SearchQueryLeafOperand,
	SearchQueryLogicalOperand
} from "../search-query-editor/SearchQueryEditor";
import {SearchQueryContainer} from "../search-query-container/SearchQueryContainer";
import {Badge} from "../../text-decorations/badge/Badge";

interface Props {
	condition?: ISearchQueryEditorCondition,
	deletable?: boolean,
	conditions?: Array<ISearchQueryEditorCondition>,
	schema: Array<IBlueOrangeSearchSchemaProperty>,
	logic?: SearchQueryLogicalOperand,
	onChange: (condition: ISearchQueryEditorCondition) => void,
	onDelete?: () => void,
	showSave?: boolean,
	isDirty?: boolean,
	onSave?: () => void,
	onCancel?: () => void,
}

export const SearchQueryGroup: React.FC<Props> = ({condition, deletable=true, conditions, schema, logic, onChange, onDelete, showSave=false, isDirty=false, onSave, onCancel}) => {

	const initParentGroup = () : ISearchQueryEditorCondition => {
		if (condition) {
			return condition;
		}
		const firstField = schema.length > 0 ? schema[0].apiName : "";
		return {
			comparison: "",
			conditionType: SearchQueryConditionType.GROUP,
			groupConditions: conditions ?? [],
			ignoreCase: false,
			logic: logic ?? SearchQueryLogicalOperand.AND,
			operand: SearchQueryLeafOperand.PHRASE,
			variable: firstField
		}
	}

	const [internalCondition, setInternalCondition] = useState(initParentGroup());

	useEffect(() => {
		setInternalCondition(initParentGroup());
	}, [condition, conditions, logic, schema]);

	const newCondition: ISearchQueryEditorCondition = {
		comparison: "",
		conditionType: SearchQueryConditionType.LEAF,
		groupConditions: [],
		ignoreCase: false,
		logic: SearchQueryLogicalOperand.AND,
		operand: SearchQueryLeafOperand.PHRASE,
		variable: schema.length > 0 ? schema[0].apiName : ""
	}

	const newGroup: ISearchQueryEditorCondition = {
		comparison: "",
		conditionType: SearchQueryConditionType.GROUP,
		groupConditions: [],
		ignoreCase: false,
		logic: SearchQueryLogicalOperand.AND,
		operand: SearchQueryLeafOperand.PHRASE,
		variable: schema.length > 0 ? schema[0].apiName : ""
	}

	const dispatchChange = (updated: ISearchQueryEditorCondition) => {
		if (onChange) {
			onChange(updated);
		}
	}

	const addCondition = () => {
		const modCondition: ISearchQueryEditorCondition = {
			...internalCondition,
			groupConditions: [...internalCondition.groupConditions, newCondition]
		};
		setInternalCondition(modCondition);
		dispatchChange(modCondition);
	}

	const addGroup = () => {
		const modCondition: ISearchQueryEditorCondition = {
			...internalCondition,
			groupConditions: [...internalCondition.groupConditions, newGroup]
		};
		setInternalCondition(modCondition);
		dispatchChange(modCondition);
	}

	const logicalChange = (value: string) => {
		if (internalCondition.logic == SearchQueryLogicalOperand.AND && value == "OR") {
			const updated: ISearchQueryEditorCondition = {...internalCondition, logic: SearchQueryLogicalOperand.OR};
			dispatchChange(updated);
			setInternalCondition(updated);
		} else if (internalCondition.logic == SearchQueryLogicalOperand.OR && value == "AND") {
			const updated: ISearchQueryEditorCondition = {...internalCondition, logic: SearchQueryLogicalOperand.AND};
			dispatchChange(updated);
			setInternalCondition(updated);
		}
	}

	const updateChildCondition = (index: number, c: ISearchQueryEditorCondition) => {
		const groupConditions = internalCondition.groupConditions.map((item, i) => i === index ? c : item);
		const modCondition: ISearchQueryEditorCondition = {...internalCondition, groupConditions: groupConditions};
		updateCondition(modCondition);
	}

	const updateCondition = (updated: ISearchQueryEditorCondition) => {
		setInternalCondition(updated);
		dispatchChange(updated);
	}

	const handleDelete = (index: number) => {
		const groupConditions = internalCondition.groupConditions.filter((_, i) => i !== index);
		const modCondition: ISearchQueryEditorCondition = {...internalCondition, groupConditions: groupConditions};
		updateCondition(modCondition);
	}

	const removeCondition = () => {
		if (onDelete) {
			onDelete()
		}
	}

	return (
		<div className="blue-orange-search-query-group-cont">
			<div className="blue-orange-search-query-group-header">
				<div className="blue-orange-search-query-group-operand-selection">
					<Dropdown style={{
                        backgroundColor: "transparent",
                        fontSize: "14px",
                        border: "none",
                        color: "#000000",
                        paddingLeft: "10px"}} onSelection={(item: DropdownItemObj) => logicalChange(item.reference)}>
						<DropdownItemText label={"All of the following are true"} value={"AND"}
									  selected={internalCondition.logic == SearchQueryLogicalOperand.AND}></DropdownItemText>
						<DropdownItemText label={"Any of the following are true"} value={"OR"}
									  selected={internalCondition.logic == SearchQueryLogicalOperand.OR}></DropdownItemText>
					</Dropdown>
				</div>
                <div className="blue-orange-search-query-group-header-controls">
                    <Badge style={{paddingTop: "6px", paddingBottom: "6px"}}>
                        <div className="blue-orange-search-query-container-operand-cont">
                            <i className="ri-circle-fill"></i>
                            { internalCondition.logic == SearchQueryLogicalOperand.AND &&
                                <div className="blue-orange-search-query-container-operand-text">AND</div>}
                            { internalCondition.logic == SearchQueryLogicalOperand.OR &&
                                <div className="blue-orange-search-query-container-operand-text">OR</div>}
                        </div>
                    </Badge>
                    <div className="blue-orange-search-query-group-header-controls-delete">
                        {deletable && <ButtonIcon icon="ri-close-line" label={"Delete"} onClick={() => removeCondition()}></ButtonIcon>}
                    </div>
                </div>

			</div>
			{internalCondition.groupConditions.map((item, index) => (
				<SearchQueryContainer
					key={index + "-" + item.id}
					condition={item}
					schema={schema}
					logicalOperand={internalCondition.logic}
					onChange={(c) => updateChildCondition(index, c)}
					onDelete={() => handleDelete(index)}
				></SearchQueryContainer>
			))}
			<div className="blue-orange-search-query-group-add-controls">
				<div className="blue-orange-search-query-group-add-btns-cont">
					<Button text={"Add Condition"} buttonType={ButtonType.PRIMARY} onClick={() => addCondition()}></Button>
					<Button text={"Add Group"} buttonType={ButtonType.PRIMARY} onClick={() => addGroup()}></Button>
				</div>
				<div className="blue-orange-search-query-group-save-btn-cont">
					{showSave && isDirty &&
						<div style={{display: "flex", gap: "8px"}}>
							<Button text={"Cancel"} buttonType={ButtonType.SECONDARY} onClick={() => onCancel && onCancel()}></Button>
							<Button text={"Save"} buttonType={ButtonType.PRIMARY} onClick={() => onSave && onSave()}></Button>
						</div>
					}
				</div>
			</div>
		</div>
	)
}

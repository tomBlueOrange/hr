import React from "react";

import './NumberDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {NumberText} from "../../../text-decorations/number-text/NumberText";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	value: any,
	multipleValues?: boolean,
	decimalPlaces?: number,
	alignment?: CellAlignment,
	onClick?: () => void,
    dropdownItems?: Array<IContextMenuItem>,
    onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>
}
export const NumberDataCell: React.FC<Props> = ({
								  value,
								  multipleValues=false,
								  decimalPlaces,
								  alignment=CellAlignment.CENTER,
                                          dropdownItems,
                                          onDropdownSelected,
								  style= {},
								  tdProps,
								  onClick}) => {

	const getDisplayValue = () => {
		if (multipleValues && Array.isArray(value)) {
			return value
				.map((v) => (typeof v === "number" ? v : Number(v)))
				.filter((v) => !Number.isNaN(v))
				.map((v) => {
					if (typeof decimalPlaces === "number") {
						return v.toFixed(decimalPlaces);
					}
					return v.toString();
				})
				.join(", ");
		}
		if (value === null || value === undefined) {
			return "";
		}
		if (typeof value === "number") {
			return value;
		}
		const asNumber = Number(value);
		if (Number.isNaN(asNumber)) {
			return "";
		}
		return asNumber;
	}

	const getTextAlignment = () => {
		try{
			if (alignment == CellAlignment.RIGHT) {
				return "right";
			} else if (alignment == CellAlignment.CENTER) {
				return "center";
			}
			return "left";
		} catch (e) {
			return "left";
		}

	}

	const cellAlignment: React.CSSProperties = {
		textAlign: getTextAlignment()
	}

	const cellClicked = () => {
		if (onClick) {
			onClick();
		}
	}

	const {className: tdClassNameProp, onClick: _tdOnClickIgnored, style: _tdStyleIgnored, ...restTdProps} = tdProps ?? {};
	const tdClassName = ["blue-orange-data-table-text-cell", tdClassNameProp].filter(Boolean).join(" ");

	return (
        <>
            {dropdownItems && dropdownItems.length > 0 &&
                <td
                    {...restTdProps}
                    className={tdClassName}
                    onClick={cellClicked}
                    style={{...cellAlignment, ...style}}>
                    {alignment == CellAlignment.CENTER &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <CenteredDiv>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                            </CenteredDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.RIGHT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <RightAlignedDiv>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                            </RightAlignedDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                            </>
                        </ContextMenu>
                    }
                </td>
            }
            {(!dropdownItems || dropdownItems.length <= 0) &&
                <td
                    {...restTdProps}
                    className={tdClassName}
                    onClick={cellClicked}
                    style={{...cellAlignment, ...style}}>
                    {alignment == CellAlignment.CENTER &&
                        <CenteredDiv>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                        </CenteredDiv>
                    }
                    {alignment == CellAlignment.RIGHT &&
                        <RightAlignedDiv>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                        </RightAlignedDiv>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <>
															{typeof getDisplayValue() === "string" ? getDisplayValue() : <NumberText value={getDisplayValue() as number} decimalPlaces={decimalPlaces}></NumberText>}
                        </>
                    }
                </td>
            }
        </>


	)
}
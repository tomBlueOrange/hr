import React, {ReactNode} from "react";

import './JsonObjDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {JsonObjectText} from "../../../text-decorations/json-object-text/JsonObjectText";
import {TruncatedTextWrapper} from "../../../text-decorations/truncated-text-wrapper/TruncatedTextWrapper";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	obj: any,
	multipleValues?: boolean,
	alignment?: CellAlignment,
	onClick?: () => void,
    dropdownItems?: Array<IContextMenuItem>,
    onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>
}
export const JsonObjDataCell: React.FC<Props> = ({
								  obj,
								  multipleValues=false,
								  alignment=CellAlignment.LEFT,
                                         dropdownItems,
                                         onDropdownSelected,
								  style= {},
								  tdProps,
								  onClick}) => {

	const getDisplayText = () => {
		if (multipleValues && Array.isArray(obj)) {
			return obj
				.map((o) => {
					try {
						if (typeof o === "string") {
							return o;
						}
						return JSON.stringify(o);
					} catch (e) {
						return "";
					}
				})
				.filter((t) => t.length > 0)
				.join(", ");
		}
		return null;
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
                                <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                                </TruncatedTextWrapper>
                            </CenteredDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.RIGHT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <RightAlignedDiv>
                                <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                                </TruncatedTextWrapper>
                            </RightAlignedDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <>
                                <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                                </TruncatedTextWrapper>
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
                            <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                            </TruncatedTextWrapper>
                        </CenteredDiv>
                    }
                    {alignment == CellAlignment.RIGHT &&
                        <RightAlignedDiv>
                            <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                            </TruncatedTextWrapper>
                        </RightAlignedDiv>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <>
                            <TruncatedTextWrapper maxLines={1}>
															{getDisplayText() ? getDisplayText() : <JsonObjectText obj={obj}></JsonObjectText>}
                            </TruncatedTextWrapper>
                        </>
                    }
                </td>
            }
        </>

	)
}
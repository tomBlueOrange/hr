import React, {ReactNode} from "react";

import './TextDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {TruncatedText} from "../../../text-decorations/truncated-text/TruncatedText";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	text: any,
	multipleValues?: boolean,
	alignment?: CellAlignment,
	onClick?: () => void,
    dropdownItems?: Array<IContextMenuItem>,
    onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>
}
export const TextDataCell: React.FC<Props> = ({
								  text,
								  multipleValues=false,
								  alignment=CellAlignment.LEFT,
                                          dropdownItems,
                                          onDropdownSelected,
								  style= {},
								  tdProps,
								  onClick}) => {

	const getDisplayText = () => {
		if (multipleValues && Array.isArray(text)) {
			return text
				.map((t) => (t === null || t === undefined ? "" : String(t)))
				.filter((t) => t.length > 0)
				.join(", ");
		}
		if (text === null || text === undefined) {
			return "";
		}
		return String(text);
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
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
                            </CenteredDiv>
                        </ContextMenu>

                    }
                    {alignment == CellAlignment.RIGHT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                            <RightAlignedDiv>
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
                            </RightAlignedDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
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
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
                        </CenteredDiv>
                    }
                    {alignment == CellAlignment.RIGHT &&
                        <RightAlignedDiv>
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
                        </RightAlignedDiv>
                    }
                    {alignment == CellAlignment.LEFT &&
                        <>
                                <TruncatedText text={getDisplayText()} maxLines={1}></TruncatedText>
                        </>
                    }
                </td>
            }

        </>

	)
}
import React from "react";

import './DateDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {DateDisplay} from "../../../text-decorations/dates/date-display/DateDisplay";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	date: any,
	multipleValues?: boolean,
	dateformat?: string,
	alignment?: CellAlignment,
	onClick?: () => void,
    dropdownItems?: Array<IContextMenuItem>,
    onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>
}
export const DateDataCell: React.FC<Props> = ({
								  date,
								  multipleValues=false,
								  dateformat,
                                          dropdownItems,
                                          onDropdownSelected,
								  alignment=CellAlignment.CENTER,
								  style= {},
								  tdProps,
								  onClick}) => {

	const toDate = (d: any) => {
		if (d instanceof Date) {
			return d;
		}
		const parsed = new Date(d);
		if (Number.isNaN(parsed.getTime())) {
			return null;
		}
		return parsed;
	}

	const getDisplayText = () => {
		if (multipleValues && Array.isArray(date)) {
			return date
				.map((d) => toDate(d))
				.filter((d) => d)
				.map((d) => (d as Date).toLocaleDateString())
				.join(", ");
		}
		return null;
	}

	const getSingleDate = () => {
		const d = toDate(date);
		return d;
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

	const renderValue = () => {
		const multi = getDisplayText();
		if (multi) {
			return multi;
		}
		const single = getSingleDate();
		if (single) {
			return <DateDisplay targetDate={single as Date} dateFormat={dateformat}></DateDisplay>;
		}
		return "";
	}

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
															{renderValue()}
                            </CenteredDiv>
                        </ContextMenu>
                    }
                    {alignment == CellAlignment.RIGHT &&
															<ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
																<RightAlignedDiv>
																	{renderValue()}
																</RightAlignedDiv>
															</ContextMenu>
													}
													{alignment == CellAlignment.LEFT &&
														<ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
															<>
																{renderValue()}
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
														{renderValue()}
													</CenteredDiv>
												}
												{alignment == CellAlignment.RIGHT &&
													<RightAlignedDiv>
														{renderValue()}
													</RightAlignedDiv>
												}
												{alignment == CellAlignment.LEFT &&
													<>
														{renderValue()}
													</>
												}
                </td>
            }
        </>

	)
}
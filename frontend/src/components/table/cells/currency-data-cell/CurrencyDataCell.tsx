import React from "react";

import './CurrencyDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {Currency} from "../../../text-decorations/currency/Currency";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	amount: any,
	multipleValues?: boolean,
	currency?: string,
	alignment?: CellAlignment,
	onClick?: () => void,
    dropdownItems?: Array<IContextMenuItem>,
    onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>
}
export const CurrencyDataCell: React.FC<Props> = ({
								  amount,
								  multipleValues=false,
								  currency="AUD",
                                          dropdownItems,
                                          onDropdownSelected,
								  alignment=CellAlignment.CENTER,
								  style= {},
								  tdProps,
								  onClick}) => {

	const formatCurrency = (value: any) => {
		if (value === null || value === undefined) {
			return "";
		}
		const asNumber = typeof value === "number" ? value : Number(value);
		if (Number.isNaN(asNumber)) {
			return "";
		}
		try {
			return new Intl.NumberFormat(undefined, {style: "currency", currency}).format(asNumber);
		} catch (e) {
			return asNumber.toString();
		}
	}

	const getDisplayText = () => {
		if (multipleValues && Array.isArray(amount)) {
			return amount
				.map((a) => formatCurrency(a))
				.filter((t) => t.length > 0)
				.join(", ");
		}
		return null;
	}

	const getSingleAmount = () => {
		if (amount === null || amount === undefined) {
			return null;
		}
		const asNumber = typeof amount === "number" ? amount : Number(amount);
		if (Number.isNaN(asNumber)) {
			return null;
		}
		return asNumber;
	}

	const renderValue = () => {
		const multi = getDisplayText();
		if (multi) {
			return multi;
		}
		const single = getSingleAmount();
		if (single !== null) {
			return <Currency amount={single as number} currency={currency}></Currency>;
		}
		return "";
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
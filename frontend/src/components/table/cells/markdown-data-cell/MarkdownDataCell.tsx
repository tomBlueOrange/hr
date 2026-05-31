import React from "react";

import './MarkdownDataCell.css'
import {CellAlignment} from "../../../interfaces/AppInterfaces";
import {CenteredDiv} from "../../../layouts/centered-div/CenteredDiv";
import {RightAlignedDiv} from "../../../layouts/right-aligned-div/RightAlignedDiv";
import {MarkdownText} from "../../../text-decorations/markdown-text/MarkdownText";
import {ContextMenu, IContextMenuItem} from "../../../contextmenu/contextmenu/ContextMenu";

interface Props {
	text: any,
	multipleValues?: boolean,
	alignment?: CellAlignment,
	onClick?: () => void,
	dropdownItems?: Array<IContextMenuItem>,
	onDropdownSelected?: (arg0: IContextMenuItem) => void,
	style?: React.CSSProperties,
	tdProps?: React.TdHTMLAttributes<HTMLTableCellElement>,
	enableMath?: boolean,
	enableGfm?: boolean,
	enableCodeHighlighting?: boolean
}
export const MarkdownDataCell: React.FC<Props> = ({
								  text,
								  multipleValues=false,
								  alignment=CellAlignment.LEFT,
								  dropdownItems,
								  onDropdownSelected,
								  style= {},
								  tdProps,
								  onClick,
								  enableMath = false,
								  enableGfm = true,
								  enableCodeHighlighting = false}) => {

	const getDisplayText = () => {
		if (multipleValues && Array.isArray(text)) {
			return text
				.map((t) => (t === null || t === undefined ? "" : String(t)))
				.filter((t) => t.length > 0)
				.join("\n\n");
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
	const tdClassName = ["blue-orange-data-table-markdown-cell", tdClassNameProp].filter(Boolean).join(" ");

	const renderMarkdown = () => {
		const content = getDisplayText();
		if (!content) {
			return null;
		}
		return (
			<MarkdownText
				enableMath={enableMath}
				enableGfm={enableGfm}
				enableCodeHighlighting={enableCodeHighlighting}
			>
				{content}
			</MarkdownText>
		);
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
								{renderMarkdown()}
							</CenteredDiv>
						</ContextMenu>

					}
					{alignment == CellAlignment.RIGHT &&
						<ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
							<RightAlignedDiv>
								{renderMarkdown()}
							</RightAlignedDiv>
						</ContextMenu>
					}
					{alignment == CellAlignment.LEFT &&
						<ContextMenu maxHeight={200} items={dropdownItems} onClick={onDropdownSelected} rightClick={true}>
							<>
								{renderMarkdown()}
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
							{renderMarkdown()}
						</CenteredDiv>
					}
					{alignment == CellAlignment.RIGHT &&
						<RightAlignedDiv>
							{renderMarkdown()}
						</RightAlignedDiv>
					}
					{alignment == CellAlignment.LEFT &&
						<>
							{renderMarkdown()}
						</>
					}
				</td>
			}

		</>

	)
}

import React, {ReactNode} from "react";

import './Table.css'


export enum TableTheme {
	DATASET,
	OBJECT_LIST
}

interface Props {
	children: ReactNode;
	containerRef?: React.Ref<HTMLDivElement>,
	overlay?: ReactNode,
	tableStyle?: React.CSSProperties,
	theme?: TableTheme
}
export const Table: React.FC<Props> = ({children, containerRef, overlay, tableStyle, theme=TableTheme.DATASET}) => {

	const getClassName = () => {
		if (theme == TableTheme.OBJECT_LIST) {
			return "blue-orange-data-table-cont blue-orange-data-table-theme-object-list"
		}
		return "blue-orange-data-table-cont"
	}


	return (
		<div className={getClassName()} ref={containerRef}>
			<table className="blue-orange-data-table" style={tableStyle}>
				{children}
			</table>
			{overlay}
		</div>

	)
}
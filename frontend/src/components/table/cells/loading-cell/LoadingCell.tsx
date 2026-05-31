import React, {ReactNode} from "react";

import './LoadingCell.css'
import {Skeleton} from "../../../loading/skeleton/Skeleton";

interface Props {
	headerCell?: boolean,
	style?: React.CSSProperties
}
export const LoadingCell: React.FC<Props> = ({headerCell=false, style={}}) => {

	const getSkeletonRandomWidth = (): string => {
		const min = 80; // Minimum width percentage
		const max = 100; // Maximum width percentage
		const randomWidth = Math.random() * (max - min) + min;
		return `${randomWidth.toFixed(2)}%`; // Convert to string with 2 decimal places
	}

	return (
		<td
			className={headerCell ? "blue-orange-header-data-table-cell" : "blue-orange-default-data-table-cell"}
			style={style}>
			<div className="blue-orange-default-data-table-skeleton">
				<Skeleton style={{width: getSkeletonRandomWidth()}}></Skeleton>
			</div>

		</td>
	)
}
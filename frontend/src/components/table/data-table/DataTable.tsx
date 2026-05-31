import React, {useCallback, useEffect, useRef, useState} from "react";

import {Table, TableTheme} from "../table/Table";
import {THead} from "../thead/THead";
import {Row} from "../row/Row";
import {HeaderCell} from "../cells/headercell/HeaderCell";
import {IContextMenuItem, IContextMenuType, ContextMenu} from "../../contextmenu/contextmenu/ContextMenu";

import './DataTable.css'
import {TBody} from "../tbody/TBody";
import {TextDataCell} from "../cells/text-data-cell/TextDataCell";
import {LoadingCell} from "../cells/loading-cell/LoadingCell";
import {DateDataCell} from "../cells/date-data-cell/DateDataCell";
import {CurrencyDataCell} from "../cells/currency-data-cell/CurrencyDataCell";
import {NumberDataCell} from "../cells/number-data-cell/NumberDataCell";
import {JsonObjDataCell} from "../cells/json-obj-data-cell/JsonObjDataCell";
import {MarkdownDataCell} from "../cells/markdown-data-cell/MarkdownDataCell";
import {BaseDataType, SearchRecord} from "../../interfaces/SearchTypes";

interface SimpleCellRef {
    rowIndex: number,
    colIndex: number
}

export enum TableFieldType {
	STRING="STRING",
	NUMBER="NUMBER",
	DATE="DATE",
	CURRENCY="CURRENCY",
	STRUCT="STRUCT",
	GEO_POINT="GEO POINT",
	MARKDOWN="MARKDOWN",
}

export enum TableFieldSortState {
	SORTED_ASC="SORTED_ASC",
	SORTED_DESC="SORTED_DESC",
	UNSORTED="UNSORTED",
}

export interface TableField {
	label: string,
    apiName: string,
	type: TableFieldType,
	sortState: TableFieldSortState,
	sortable: boolean,
	filterable: boolean,
	statistics: boolean,
	multipleValues?: boolean,
    dropDownItems?: IContextMenuItem[]
}

export type DataTableCellClickPosition = {
	clientX: number;
	clientY: number;
	cellRect: DOMRect;
}

interface Props {
	schema: Array<TableField>,
    data: Array<SearchRecord>,
    loading?: boolean,
	loadingPlaceholderRows?: number,
	showRowNumbers?: boolean,
	persistKey?: string,
	enableInfiniteScroll?: boolean,
	onEndReached?: () => void,
	showLoadingRow?: boolean,
	resizableColumns?: boolean,
	reorderableColumns?: boolean,
	cellsSelectable?: boolean,
	rowSelectable?: boolean,
	minColumnWidth?: number,
	maxColumnWidth?: number,
	onColumnOrderChange?: (previousIndex: number, newIndex: number, updatedSchema: Array<TableField>) => void,
	onCellSelection?: (selection: Array<{rowIndex: number; colIndex: number}>) => void,
	onRowSelectable?: (selection: Array<number>) => void,
	onCellClick?: (colIdx: number, rowIdx: number, position: DataTableCellClickPosition) => void,
	onCellRightClick?: (colIdx: number, rowIdx: number, position: DataTableCellClickPosition) => void,
	onHeaderDropdownSelected?: (item: IContextMenuItem) => void,
	onAddAsFilter?: (field: TableField, values: string[], fieldType: TableFieldType) => void
}

export const DataTable: React.FC<Props> = ({
                                               schema,
                                               data,
                                               loading=false,
                                               loadingPlaceholderRows=10,
											   showRowNumbers=false,
											   persistKey,
											   enableInfiniteScroll=false,
											   onEndReached,
											   showLoadingRow=false,
												resizableColumns=false,
												reorderableColumns=false,
												cellsSelectable=false,
												rowSelectable=false,
												minColumnWidth=50,
												maxColumnWidth,
												onColumnOrderChange,
												onCellSelection,
												onRowSelectable,
												onCellClick,
												onCellRightClick,
												onHeaderDropdownSelected,
												onAddAsFilter}) => {

	const clampWidth = (width: number): number => {
		const next = Math.max(minColumnWidth, width);
		if (typeof maxColumnWidth === "number") {
			return Math.min(maxColumnWidth, next);
		}
		return next;
	}

	const [orderedSchema, setOrderedSchema] = useState<Array<TableField>>(schema);
	useEffect(() => {
		setOrderedSchema(schema);

		if (!persistKey) {
			setColumnWidths({});
			return;
		}

		try {
			if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
				setColumnWidths({});
				return;
			}
			const stored = window.localStorage.getItem(`blue-orange-datatable:${persistKey}:column-widths-by-label`);
			if (!stored) {
				setColumnWidths({});
				return;
			}
			const parsed = JSON.parse(stored) as Record<string, unknown>;
			const next: Record<number, number> = {};
			for (let i = 0; i < schema.length; i++) {
				const label = schema[i]?.label;
				const w = label ? parsed[label] : undefined;
				if (typeof w === "number" && Number.isFinite(w)) {
					next[i] = w;
				}
			}
			setColumnWidths(next);
		} catch (err) {
			setColumnWidths({});
		}
	}, [schema, persistKey]);

	const getSearchRecordField = (row: SearchRecord, field: TableField)=> {
        return row.properties.find((p) => p.key === field.apiName);
    }

    const getCellValue = (row: SearchRecord, field: TableField, colIdx: number): string => {
		const searchRecordProperty = getSearchRecordField(row, field);
        if (searchRecordProperty?.type == BaseDataType.GEO_POINT) {
            return JSON.stringify({
                lat: searchRecordProperty.lat,
                lon: searchRecordProperty.lon
            })
        } else if (searchRecordProperty?.type == BaseDataType.DATE) {
            return new Date(searchRecordProperty.value as string).toISOString();
        } else if (searchRecordProperty?.type == BaseDataType.ARRAY && field.type == TableFieldType.GEO_POINT) {
            const geoPoints = [];
            for (var i=0; i < (searchRecordProperty.array ?? []).length; i ++) {
                geoPoints.push({
                    lat: (searchRecordProperty.array ?? [])[i].lat,
                    lon: (searchRecordProperty.array ?? [])[i].lon
                })
            }
            return JSON.stringify(geoPoints);
        } else if (searchRecordProperty?.type == BaseDataType.ARRAY && field.type == TableFieldType.DATE) {
            const arrayValues = [];
            for (var i=0; i < (searchRecordProperty.array ?? []).length; i ++) {
                arrayValues.push(new Date((searchRecordProperty.array ?? [])[i].value as string).toISOString());
            }
            return JSON.stringify(arrayValues);
        } else if (searchRecordProperty?.type == BaseDataType.ARRAY) {
            const arrayValues = [];
            for (var i=0; i < (searchRecordProperty.array ?? []).length; i ++) {
                arrayValues.push((searchRecordProperty.array ?? [])[i].value);
            }
            return JSON.stringify(arrayValues);
        } else if (searchRecordProperty) {
            return searchRecordProperty.value as string;
        }
		return "Not Found";
	}

	const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
	const [resizeGuideLeft, setResizeGuideLeft] = useState<number | null>(null);
	const [reorderGuideLeft, setReorderGuideLeft] = useState<number | null>(null);
	const [isReordering, setIsReordering] = useState<boolean>(false);
	const rowNumberColumnWidth = 56;
	const resizingRef = useRef<{
		colIdx: number;
		startX: number;
		startWidth: number;
		currentWidth: number;
		startLeft: number;
	} | null>(null);
	const tableContainerRef = useRef<HTMLDivElement | null>(null);
	const headerCellRefs = useRef<Record<number, HTMLTableCellElement | null>>({});
	const reorderRef = useRef<{
		fromIndex: number;
		startX: number;
		active: boolean;
		insertIndex: number | null;
	} | null>(null);

	type CellCoord = {rowIdx: number; colIdx: number};
	const cellKey = (rowIdx: number, colIdx: number) => `${rowIdx}:${colIdx}`;
	const effectiveRowSelectable = rowSelectable && !cellsSelectable;

	const selectingCellsRef = useRef<boolean>(false);
	const lastClickedCellRef = useRef<CellCoord | null>(null);
	const selectionStartRef = useRef<CellCoord | null>(null);
	const selectionEndRef = useRef<CellCoord | null>(null);
	const selectedCellsRef = useRef<Set<string>>(new Set());
	const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

	const lastClickedRowRef = useRef<number | null>(null);
	const selectedRowsRef = useRef<Set<number>>(new Set());
	const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		rowIdx: number;
		colIdx: number;
	} | null>(null);

	const [infiniteScrollObservedRow, setInfiniteScrollObservedRow] = useState<HTMLTableRowElement | null>(null);
	const lastEndReachedDataLengthRef = useRef<number | null>(null);
	const infiniteScrollRowRef = useCallback((el: HTMLTableRowElement | null) => {
		setInfiniteScrollObservedRow(el);
	}, []);

	useEffect(() => {
		if (!enableInfiniteScroll) {
			return;
		}
		if (!onEndReached) {
			return;
		}
		if (loading) {
			return;
		}
		if (showLoadingRow) {
			return;
		}
		if (!infiniteScrollObservedRow) {
			return;
		}
		if (typeof IntersectionObserver === "undefined") {
			return;
		}

		const containerEl = tableContainerRef.current;
		const root = (containerEl && containerEl.scrollHeight > containerEl.clientHeight + 1) ? containerEl : null;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}
					if (lastEndReachedDataLengthRef.current === data.length) {
						return;
					}
					lastEndReachedDataLengthRef.current = data.length;
					onEndReached();
				}
			},
			{threshold: 0.1, root}
		);

		observer.observe(infiniteScrollObservedRow);
		return () => {
			observer.disconnect();
		};
	}, [enableInfiniteScroll, onEndReached, loading, showLoadingRow, infiniteScrollObservedRow, data.length]);

	const computeSelectionKeys = (start: CellCoord, end: CellCoord) => {
		const rowStart = Math.min(start.rowIdx, end.rowIdx);
		const rowEnd = Math.max(start.rowIdx, end.rowIdx);
		const colStart = Math.min(start.colIdx, end.colIdx);
		const colEnd = Math.max(start.colIdx, end.colIdx);
		const next = new Set<string>();
		for (let r = rowStart; r <= rowEnd; r++) {
			for (let c = colStart; c <= colEnd; c++) {
				next.add(cellKey(r, c));
			}
		}
		return next;
	}

	const clearCellSelection = () => {
		selectedCellsRef.current = new Set();
		setSelectedCells(new Set());
	}

	const getSelectedCells = (): SimpleCellRef[] => {
        return Array.from(selectedCellsRef.current)
            .map((key) => {
                const [rowIndex, colIndex] = key.split(":");
                return {rowIndex: Number(rowIndex), colIndex: Number(colIndex)};
            })
            .sort((a, b) => (a.rowIndex - b.rowIndex) || (a.colIndex - b.colIndex));
    }

    const finalizeCellSelection = () => {
		if (!selectingCellsRef.current) {
			return;
		}
		selectingCellsRef.current = false;
		selectionStartRef.current = null;
		selectionEndRef.current = null;
		document.body.style.userSelect = "";

		const selection = getSelectedCells();

		onCellSelection?.(selection);
	}

	const clearRowSelection = () => {
		selectedRowsRef.current = new Set();
		setSelectedRows(new Set());
	}

	const getSelectedRows = (): Array<number> => {
		return Array.from(selectedRowsRef.current).sort((a, b) => a - b);
	}

	const computeRowRange = (startRowIdx: number, endRowIdx: number) => {
		const rowStart = Math.min(startRowIdx, endRowIdx);
		const rowEnd = Math.max(startRowIdx, endRowIdx);
		const next = new Set<number>();
		for (let r = rowStart; r <= rowEnd; r++) {
			next.add(r);
		}
		return next;
	}

	const beginRowSelection = (rowIdx: number) => (e: React.MouseEvent) => {
		if (!effectiveRowSelectable) {
			return;
		}
		if (loading) {
			return;
		}
		if (e.button !== 0) {
			return;
		}
		if (resizingRef.current || reorderRef.current?.active || isReordering) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		if (e.metaKey || e.ctrlKey) {
			const next = new Set(selectedRowsRef.current);
			if (next.has(rowIdx)) {
				next.delete(rowIdx);
			} else {
				next.add(rowIdx);
			}
			selectedRowsRef.current = next;
			setSelectedRows(next);
			lastClickedRowRef.current = rowIdx;
			onRowSelectable?.(getSelectedRows());
			return;
		}

		const start = (e.shiftKey && typeof lastClickedRowRef.current === "number")
			? lastClickedRowRef.current
			: rowIdx;
		const next = computeRowRange(start, rowIdx);
		selectedRowsRef.current = next;
		setSelectedRows(next);
		lastClickedRowRef.current = rowIdx;
		onRowSelectable?.(getSelectedRows());
	}

	useEffect(() => {
		if (!cellsSelectable) {
			return;
		}
		const onMouseUp = () => {
			finalizeCellSelection();
		};
		window.addEventListener("mouseup", onMouseUp);
		return () => {
			window.removeEventListener("mouseup", onMouseUp);
		};
	}, [cellsSelectable, onCellSelection]);

	useEffect(() => {
		if (!cellsSelectable) {
			selectingCellsRef.current = false;
			lastClickedCellRef.current = null;
			selectionStartRef.current = null;
			selectionEndRef.current = null;
			document.body.style.userSelect = "";
			clearCellSelection();
		}
	}, [cellsSelectable]);

	useEffect(() => {
		if (!effectiveRowSelectable) {
			lastClickedRowRef.current = null;
			clearRowSelection();
		}
	}, [effectiveRowSelectable]);

	const copyToClipboard = (text: string) => {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).catch(err => {
				console.error('Failed to copy to clipboard:', err);
			});
		}
	};

	const copyCellValue = (rowIdx: number, colIdx: number) => {
		if (rowIdx < 0 || rowIdx >= data.length || colIdx < 0 || colIdx >= orderedSchema.length) {
			return;
		}
		const row = data[rowIdx];
		const field = orderedSchema[colIdx];
		const cellValue = getCellValue(row, field, colIdx);
		copyToClipboard(cellValue);
	};

	const copyRowData = (rowIdx: number) => {
		if (rowIdx < 0 || rowIdx >= data.length) {
			return;
		}
		const row = data[rowIdx];
		const rowValues = orderedSchema.map((field, colIdx) => getCellValue(row, field, colIdx));
		const rowText = rowValues.join('\t');
		copyToClipboard(rowText);
	};

	const copyColumnValues = (colIdx: number) => {
		if (colIdx < 0 || colIdx >= orderedSchema.length) {
			return;
		}
		const field = orderedSchema[colIdx];
		const selectedRowIndices = getSelectedRows();
		if (selectedRowIndices.length === 0) {
			return;
		}
		const columnValues = selectedRowIndices.map(rowIdx => {
			if (rowIdx < data.length) {
				return getCellValue(data[rowIdx], field, colIdx);
			}
			return '';
		});
		const columnText = columnValues.join('\n');
		copyToClipboard(columnText);
	};

	const copyAllSelectedData = () => {
		const selectedRowIndices = getSelectedRows();
		if (selectedRowIndices.length === 0) {
			return;
		}
		const rows = selectedRowIndices.map(rowIdx => {
			if (rowIdx < data.length) {
				const row = data[rowIdx];
				return orderedSchema.map((field, colIdx) => getCellValue(row, field, colIdx)).join('\t');
			}
			return '';
		});
		const allText = rows.join('\n');
		copyToClipboard(allText);
	};

	const addAsFilter = (rowIdx: number, colIdx: number) => {
		if (!onAddAsFilter || colIdx < 0 || colIdx >= orderedSchema.length) {
			return;
		}

		const field = orderedSchema[colIdx];
		const selectedRowIndices = getSelectedRows();
		const rowsToUse = selectedRowIndices.length > 0 ? selectedRowIndices : [rowIdx];

		const values: string[] = [];
		for (const rIdx of rowsToUse) {
			if (rIdx < data.length) {
				const cellValue = getCellValue(data[rIdx], field, colIdx);
				if (cellValue && !values.includes(cellValue)) {
					values.push(cellValue);
				}
			}
		}

		if (values.length > 0) {
			onAddAsFilter(field, values, field.type);
		}
	};

	const getContextMenuItems = (rowIdx: number, colIdx: number): IContextMenuItem[] => {
		const items: IContextMenuItem[] = [];
		const selectedRowIndices = getSelectedRows();
		const hasMultipleRowsSelected = selectedRowIndices.length > 1;

		items.push({
			label: 'Copy Cell Value',
			type: IContextMenuType.CONTENT,
			value: { action: 'copyCellValue', rowIdx, colIdx }
		});

		items.push({
			label: 'Copy Row Data',
			type: IContextMenuType.CONTENT,
			value: { action: 'copyRowData', rowIdx }
		});

		if (hasMultipleRowsSelected) {
			items.push({
				label: 'Copy Column Values (Selected Rows)',
				type: IContextMenuType.CONTENT,
				value: { action: 'copyColumnValues', colIdx }
			});

			items.push({
				label: 'Copy All Selected Data',
				type: IContextMenuType.CONTENT,
				value: { action: 'copyAllSelectedData' }
			});
		}

		if (onAddAsFilter) {
			items.push({
				label: 'Add as Filter',
				type: IContextMenuType.CONTENT,
				value: { action: 'addAsFilter', rowIdx, colIdx }
			});
		}

		return items;
	};

	const handleContextMenuItemClick = (item: IContextMenuItem) => {
		if (!item.value || !item.value.action) {
			return;
		}

		switch (item.value.action) {
			case 'copyCellValue':
				copyCellValue(item.value.rowIdx, item.value.colIdx);
				break;
			case 'copyRowData':
				copyRowData(item.value.rowIdx);
				break;
			case 'copyColumnValues':
				copyColumnValues(item.value.colIdx);
				break;
			case 'copyAllSelectedData':
				copyAllSelectedData();
				break;
			case 'addAsFilter':
				addAsFilter(item.value.rowIdx, item.value.colIdx);
				break;
		}
		setContextMenu(null);
	};

	const beginCellSelection = (rowIdx: number, colIdx: number) => (e: React.MouseEvent) => {
		if (!cellsSelectable) {
			return;
		}
		if (loading) {
			return;
		}
		if (e.button !== 0) {
			return;
		}
		if (resizingRef.current || reorderRef.current?.active || isReordering) {
			return;
		}
		if (onCellClick) {
			try {
				const cellRect = (e.currentTarget as HTMLTableCellElement).getBoundingClientRect();
				onCellClick(colIdx, rowIdx, {clientX: e.clientX, clientY: e.clientY, cellRect});
			} catch (err) {
				// ignore
			}
		}
		e.preventDefault();
		e.stopPropagation();

		if (e.metaKey || e.ctrlKey) {
			const current = {rowIdx, colIdx};
			const key = cellKey(rowIdx, colIdx);
			const next = new Set(selectedCellsRef.current);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			selectedCellsRef.current = next;
			setSelectedCells(next);
			lastClickedCellRef.current = current;
			onCellSelection?.(getSelectedCells());
			return;
		}

		clearCellSelection();
		document.body.style.userSelect = "none";

		selectingCellsRef.current = true;
		const current = {rowIdx, colIdx};
		const start = (e.shiftKey && lastClickedCellRef.current)
			? lastClickedCellRef.current
			: current;
		selectionStartRef.current = start;
		selectionEndRef.current = current;
		const next = computeSelectionKeys(start, current);
		selectedCellsRef.current = next;
		setSelectedCells(next);

		lastClickedCellRef.current = current;
	}

	const canFireCellCallbacks = () => {
		if (loading) {
			return false;
		}
		if (resizingRef.current || reorderRef.current?.active || isReordering) {
			return false;
		}
		return true;
	}

	const getEventPosition = (e: React.MouseEvent<HTMLTableCellElement>) => {
		const cellRect = (e.currentTarget as HTMLTableCellElement).getBoundingClientRect();
		return {clientX: e.clientX, clientY: e.clientY, cellRect};
	}

	const handleCellClick = (colIdx: number, rowIdx: number) => (e: React.MouseEvent<HTMLTableCellElement>) => {
		if (!onCellClick) {
			return;
		}
		if (!canFireCellCallbacks()) {
			return;
		}
		onCellClick(colIdx, rowIdx, getEventPosition(e));
	}

	const handleCellRightClick = (colIdx: number, rowIdx: number) => (e: React.MouseEvent<HTMLTableCellElement>) => {
		if (!canFireCellCallbacks()) {
			return;
		}
		e.preventDefault();
		
		setContextMenu({
			visible: true,
			x: e.clientX,
			y: e.clientY,
			rowIdx,
			colIdx
		});

		if (onCellRightClick) {
			onCellRightClick(colIdx, rowIdx, getEventPosition(e));
		}
	}

	const extendCellSelectionTo = (rowIdx: number, colIdx: number) => {
		if (!cellsSelectable) {
			return;
		}
		if (!selectingCellsRef.current) {
			return;
		}
		const start = selectionStartRef.current;
		if (!start) {
			return;
		}
		const end = {rowIdx, colIdx};
		selectionEndRef.current = end;
		const next = computeSelectionKeys(start, end);
		selectedCellsRef.current = next;
		setSelectedCells(next);
	}

	useEffect(() => {
		const el = tableContainerRef.current;
		if (!el) {
			return;
		}
		const onScroll = () => {
			const r = resizingRef.current;
			if (!r) {
				return;
			}
			const cellEl = headerCellRefs.current[r.colIdx];
			const containerEl = tableContainerRef.current;
			if (!cellEl || !containerEl) {
				return;
			}
			const rect = cellEl.getBoundingClientRect();
			const containerRect = containerEl.getBoundingClientRect();
			const left = rect.left - containerRect.left + containerEl.scrollLeft;
			resizingRef.current = {...r, startLeft: left};
			setResizeGuideLeft(left + r.currentWidth);
		};
		el.addEventListener("scroll", onScroll, {passive: true});
		return () => {
			el.removeEventListener("scroll", onScroll as any);
		};
	}, [resizableColumns]);

	useEffect(() => {
		return () => {
			document.body.style.userSelect = "";
		};
	}, []);

	useEffect(() => {
		if (!resizableColumns) {
			setResizeGuideLeft(null);
			resizingRef.current = null;
		}
	}, [resizableColumns]);

	useEffect(() => {
		if (!persistKey) {
			return;
		}
		try {
			if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
				return;
			}
			const widthsByLabel: Record<string, number> = {};
			for (let i = 0; i < orderedSchema.length; i++) {
				const label = orderedSchema[i]?.label;
				const w = columnWidths[i];
				if (label && typeof w === "number" && Number.isFinite(w)) {
					widthsByLabel[label] = w;
				}
			}
			window.localStorage.setItem(
				`blue-orange-datatable:${persistKey}:column-widths-by-label`,
				JSON.stringify(widthsByLabel)
			);
		} catch (err) {
			// ignore
		}
	}, [persistKey, columnWidths, orderedSchema]);

	useEffect(() => {
		if (!persistKey) {
			return;
		}
		const raf = window.requestAnimationFrame(() => {
			try {
				if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
					return;
				}
				const c = tableContainerRef.current;
				if (!c) {
					return;
				}
				const stored = window.localStorage.getItem(`blue-orange-datatable:${persistKey}:scroll-left`);
				if (!stored) {
					return;
				}
				const next = Number(stored);
				if (Number.isFinite(next)) {
					c.scrollLeft = next;
				}
			} catch (err) {
				// ignore
			}
		});
		return () => {
			window.cancelAnimationFrame(raf);
		};
	}, [persistKey]);

	useEffect(() => {
		if (!persistKey) {
			return;
		}
		try {
			if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
				return;
			}
			const c = tableContainerRef.current;
			if (!c) {
				return;
			}
			let t: number | null = null;
			const onScroll = () => {
				if (t !== null) {
					window.clearTimeout(t);
				}
				t = window.setTimeout(() => {
					try {
						window.localStorage.setItem(`blue-orange-datatable:${persistKey}:scroll-left`, String(c.scrollLeft));
					} catch (err) {
						// ignore
					}
				}, 50);
			};
			c.addEventListener("scroll", onScroll, {passive: true});
			return () => {
				c.removeEventListener("scroll", onScroll as any);
				if (t !== null) {
					window.clearTimeout(t);
				}
			};
		} catch (err) {
			return;
		}
	}, [persistKey]);

	useEffect(() => {
		if (!resizableColumns) {
			return;
		}
		const raf = window.requestAnimationFrame(() => {
			setColumnWidths((prev) => {
				let changed = false;
				const next: Record<number, number> = {...prev};
				for (let colIdx = 0; colIdx < orderedSchema.length; colIdx++) {
					const existing = next[colIdx];
					if (typeof existing === "number") {
						const clamped = clampWidth(existing);
						if (clamped !== existing) {
							next[colIdx] = clamped;
							changed = true;
						}
						continue;
					}

					const cellEl = headerCellRefs.current[colIdx];
					if (!cellEl) {
						continue;
					}
					const measured = cellEl.getBoundingClientRect().width;
					next[colIdx] = clampWidth(measured);
					changed = true;
				}
				return changed ? next : prev;
			});
		});
		return () => {
			window.cancelAnimationFrame(raf);
		};
	}, [resizableColumns, orderedSchema.length, minColumnWidth, maxColumnWidth]);

	useEffect(() => {
		if (!reorderableColumns) {
			setReorderGuideLeft(null);
			reorderRef.current = null;
			setIsReordering(false);
		}
	}, [reorderableColumns]);

	const setHeaderCellRef = (colIdx: number) => (el: HTMLTableCellElement | null) => {
		headerCellRefs.current[colIdx] = el;
	}

	const moveInArray = <T,>(arr: Array<T>, from: number, to: number): Array<T> => {
		if (from === to) {
			return arr;
		}
		const next = [...arr];
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		return next;
	}

	const reorderColumnWidths = (prev: Record<number, number>, from: number, to: number, size: number) => {
		const widths: Array<number | undefined> = [];
		for (let i = 0; i < size; i++) {
			widths.push(prev[i]);
		}
		const moved = moveInArray(widths, from, to);
		const next: Record<number, number> = {};
		for (let i = 0; i < moved.length; i++) {
			const w = moved[i];
			if (typeof w === "number") {
				next[i] = w;
			}
		}
		return next;
	}

	const beginReorder = (fromIndex: number) => (e: React.MouseEvent) => {
		if (!reorderableColumns) {
			return;
		}
		if (e.button !== 0) {
			return;
		}
		if (resizingRef.current) {
			return;
		}

		reorderRef.current = {
			fromIndex,
			startX: e.clientX,
			active: false,
			insertIndex: null,
		};
		setIsReordering(false);

		const containerEl = tableContainerRef.current;
		if (!containerEl) {
			reorderRef.current = null;
			return;
		}

		const updateGuide = (clientX: number) => {
			const r = reorderRef.current;
			const c = tableContainerRef.current;
			if (!r || !c) {
				return;
			}
			const containerRect = c.getBoundingClientRect();
			const x = clientX - containerRect.left + c.scrollLeft;

			let insertIndex = orderedSchema.length;
			for (let i = 0; i < orderedSchema.length; i++) {
				const cellEl = headerCellRefs.current[i];
				if (!cellEl) {
					continue;
				}
				const rect = cellEl.getBoundingClientRect();
				const left = rect.left - containerRect.left + c.scrollLeft;
				const mid = left + rect.width / 2;
				if (x < mid) {
					insertIndex = i;
					break;
				}
			}

			r.insertIndex = insertIndex;
			const guideLeft = (() => {
				if (insertIndex >= orderedSchema.length) {
					const lastEl = headerCellRefs.current[orderedSchema.length - 1];
					if (!lastEl) {
						return null;
					}
					const rect = lastEl.getBoundingClientRect();
					return rect.right - containerRect.left + c.scrollLeft;
				}
				const el = headerCellRefs.current[insertIndex];
				if (!el) {
					return null;
				}
				const rect = el.getBoundingClientRect();
				return rect.left - containerRect.left + c.scrollLeft;
			})();
			if (guideLeft !== null) {
				setReorderGuideLeft(guideLeft);
			}
		};

		const onMouseMove = (ev: MouseEvent) => {
			const r = reorderRef.current;
			if (!r) {
				return;
			}
			const delta = ev.clientX - r.startX;
			if (!r.active) {
				if (Math.abs(delta) < 5) {
					return;
				}
				r.active = true;
				setResizeGuideLeft(null);
				setIsReordering(true);
				document.body.style.userSelect = "none";
			}
			updateGuide(ev.clientX);
		};

		const onMouseUp = () => {
			const r = reorderRef.current;
			const wasActive = r?.active;
			const insertIndex = r?.insertIndex;
			const from = r?.fromIndex;
			reorderRef.current = null;
			setReorderGuideLeft(null);
			setIsReordering(false);
			document.body.style.userSelect = "";
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);

			if (!wasActive || insertIndex === null || !insertIndex || typeof from !== "number") {
				return;
			}
			const to = insertIndex > from ? insertIndex - 1 : insertIndex;
			if (to === from) {
				return;
			}
			setOrderedSchema((prevSchema) => {
				if (!to) {
                    return prevSchema;
                }
                setColumnWidths((prev) => reorderColumnWidths(prev, from, to, prevSchema.length));
				const updated = moveInArray(prevSchema, from, to);
				onColumnOrderChange?.(from, to, updated);
				return updated;
			});
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}

	const beginResize = (colIdx: number) => (e: React.MouseEvent) => {
		if (!resizableColumns) {
			return;
		}
		if (isReordering || reorderRef.current?.active) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		const cellEl = headerCellRefs.current[colIdx];
		const containerEl = tableContainerRef.current;
		if (!cellEl || !containerEl) {
			return;
		}

		const rect = cellEl.getBoundingClientRect();
		const containerRect = containerEl.getBoundingClientRect();
		const currentWidth = clampWidth(columnWidths[colIdx] ?? rect.width);

		const startLeft = rect.left - containerRect.left + containerEl.scrollLeft;
		resizingRef.current = {
			colIdx,
			startX: e.clientX,
			startWidth: currentWidth,
			currentWidth,
			startLeft,
		};
		setResizeGuideLeft(startLeft + currentWidth);
		document.body.style.userSelect = "none";

		const onMouseMove = (ev: MouseEvent) => {
			const r = resizingRef.current;
			if (!r) {
				return;
			}
			const delta = ev.clientX - r.startX;
			const nextWidth = clampWidth(r.startWidth + delta);
			resizingRef.current = {...r, currentWidth: nextWidth};
			setResizeGuideLeft(r.startLeft + nextWidth);
		};

		const onMouseUp = (ev: MouseEvent) => {
			const r = resizingRef.current;
			if (r) {
				setColumnWidths((prev) => ({...prev, [r.colIdx]: r.currentWidth}));
			}
			setResizeGuideLeft(null);
			resizingRef.current = null;
			document.body.style.userSelect = "";
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}

	const getColumnStyle = (colIdx: number): React.CSSProperties => {
		const w = columnWidths[colIdx];
		const style: React.CSSProperties = {
			minWidth: minColumnWidth,
		};
		if (typeof maxColumnWidth === "number") {
			style.maxWidth = maxColumnWidth;
		}
		if (typeof w === "number") {
			style.width = clampWidth(w);
		}
		return style;
	}

	return (
		<>
			<div className="blue-orange-tables-data-table">
                <Table
					containerRef={tableContainerRef}
					theme={TableTheme.DATASET}
					tableStyle={resizableColumns ? ({tableLayout: "fixed"} as React.CSSProperties) : undefined}
					overlay={
					(reorderGuideLeft !== null || resizeGuideLeft !== null)
						? (
							<>
								{resizeGuideLeft !== null && <div className="blue-orange-data-table-resize-guide" style={{left: resizeGuideLeft}}></div>}
								{reorderGuideLeft !== null && <div className="blue-orange-data-table-resize-guide" style={{left: reorderGuideLeft}}></div>}
							</>
						)
						: null
					}>
					<THead>
						<Row>
							{showRowNumbers && (
								<th
									className="blue-orange-data-table-row-number-header"
									style={{
										width: rowNumberColumnWidth,
										minWidth: rowNumberColumnWidth,
										maxWidth: rowNumberColumnWidth,
									}}
								>
									<div className="blue-orange-header-data-table-cell">
										<span className="blue-orange-data-table-header-cell-primary-text">#</span>
									</div>
								</th>
							)}
							{orderedSchema.map((item, index) => (
								<React.Fragment key={item.label + "-" + index}>
									{loading &&
										<LoadingCell
											key={item.label + "-" + index}
											style={getColumnStyle(index)}
											headerCell={true}></LoadingCell>
									}
									{!loading &&
										<HeaderCell
											dropdownItems={item.dropDownItems}
											style={getColumnStyle(index)}
											tdProps={{
												onClick: handleCellClick(index, -1),
												onContextMenu: onCellRightClick ? handleCellRightClick(index, -1) : undefined,
											}}
											cellRef={setHeaderCellRef(index)}
											onMouseDown={beginReorder(index)}
											resizable={resizableColumns && !isReordering}
											onResizeMouseDown={beginResize(index)}
											sorted={item.sortState === TableFieldSortState.SORTED_ASC || item.sortState === TableFieldSortState.SORTED_DESC}
											sortAsc={item.sortState === TableFieldSortState.SORTED_ASC}
											onDropdownSelected={(item: IContextMenuItem) => {
												if (onHeaderDropdownSelected) {
													onHeaderDropdownSelected(item);
												}
											}}>
											<div className="blue-orange-data-table-header-cell-group">
									        <span className="blue-orange-data-table-header-cell-primary-text">{item.label}</span>
											<span
												className="blue-orange-data-table-header-cell-column-type">{item.type.toString()}</span>
										</div>
										</HeaderCell>
									}
								</React.Fragment>
							))}
						</Row>
					</THead>
					<TBody>
						{loading &&
							Array.from({ length: loadingPlaceholderRows }).map((_, index) => (
								<Row key={"loading-row-" + index} hoverEffect={false}>
									{showRowNumbers && (
										<td
											className="blue-orange-data-table-row-number-cell"
											style={{
												width: rowNumberColumnWidth,
												minWidth: rowNumberColumnWidth,
												maxWidth: rowNumberColumnWidth,
											}}
										></td>
									)}
									{orderedSchema.map((item, colIdx) => (
										<LoadingCell key={"loading-cell-" + index + "-" + colIdx} style={getColumnStyle(colIdx)}></LoadingCell>
									))}
								</Row>
							))
						}
						{!loading &&
							<>
								{data.map((d, rowIdx) => (
									<Row
										key={"row-" + rowIdx}
										hoverEffect={false}
										rowRef={(!showLoadingRow && enableInfiniteScroll && rowIdx === data.length - 1) ? infiniteScrollRowRef : undefined}>
										{showRowNumbers && (
											<td
												className="blue-orange-data-table-row-number-cell"
												style={{
													width: rowNumberColumnWidth,
													minWidth: rowNumberColumnWidth,
													maxWidth: rowNumberColumnWidth,
												}}
											>
												<div className="blue-orange-header-data-table-cell">
													{rowIdx + 1}
												</div>
											</td>
										)}
														{orderedSchema.map((item, colIdx) => (
														<React.Fragment key={"cell-" + rowIdx + "-" + colIdx}>
															{(() => {
																const cellValue = getCellValue(d, item, colIdx);
																const cellStyle = getColumnStyle(colIdx);
																	const isSelected = selectedCells.has(cellKey(rowIdx, colIdx));
																	const isRowSelected = selectedRows.has(rowIdx);

																		const tdPropsBase = cellsSelectable
																			? {
																				onMouseDown: beginCellSelection(rowIdx, colIdx),
																				onMouseEnter: () => extendCellSelectionTo(rowIdx, colIdx),
																				className: isSelected ? "blue-orange-data-table-cell-selected" : undefined,
																			}
																			: (effectiveRowSelectable
																				? {
																					onMouseDown: beginRowSelection(rowIdx),
																					className: isRowSelected ? "blue-orange-data-table-row-selected" : undefined,
																				}
																				: undefined);

																		const tdProps = {
																			...(tdPropsBase ?? {}),
																			onContextMenu: handleCellRightClick(colIdx, rowIdx),
																			...(!!onCellClick && !cellsSelectable ? {onClick: handleCellClick(colIdx, rowIdx)} : {}),
																		};

																		return (
																			<>
																						{item.type == TableFieldType.STRING &&
																						<TextDataCell style={{...cellStyle}}
																								  text={cellValue}
																								  multipleValues={item.multipleValues}
																								  tdProps={tdProps}></TextDataCell>
																								}
																						{item.type == TableFieldType.NUMBER &&
																						<NumberDataCell style={{...cellStyle}}
																						  value={cellValue}
																						  multipleValues={item.multipleValues}
																						  tdProps={tdProps}></NumberDataCell>
																						}
																						{item.type == TableFieldType.DATE &&
																						<DateDataCell style={{...cellStyle}}
																							date={cellValue}
																							multipleValues={item.multipleValues}
																							tdProps={tdProps}></DateDataCell>
																						}
																						{item.type == TableFieldType.CURRENCY &&
																						<CurrencyDataCell style={{...cellStyle}}
																						  amount={cellValue} currency={"AUD"}
																						  multipleValues={item.multipleValues}
																						  tdProps={tdProps}></CurrencyDataCell>
																						}
																						{item.type == TableFieldType.STRUCT &&
																						<JsonObjDataCell style={{...cellStyle}}
																								  obj={cellValue}
																								  multipleValues={item.multipleValues}
																								  tdProps={tdProps}></JsonObjDataCell>
																								}
																						{item.type == TableFieldType.MARKDOWN &&
																						<MarkdownDataCell style={{...cellStyle}}
																								  text={cellValue}
																								  multipleValues={item.multipleValues}
																								  tdProps={tdProps}></MarkdownDataCell>
																								}
																											</>
																								);
																			})()}
																	</React.Fragment>
                                            ))}

                                        </Row>
                                    ))}
								{showLoadingRow &&
									<Row
										key={"infinite-loading-row"}
										hoverEffect={false}
										rowRef={(enableInfiniteScroll) ? infiniteScrollRowRef : undefined}>
										{showRowNumbers && (
											<td
												className="blue-orange-data-table-row-number-cell"
												style={{
													width: rowNumberColumnWidth,
													minWidth: rowNumberColumnWidth,
													maxWidth: rowNumberColumnWidth,
												}}
										></td>
										)}
										{orderedSchema.map((item, colIdx) => (
											<LoadingCell key={"infinite-loading-cell-" + colIdx} style={getColumnStyle(colIdx)}></LoadingCell>
										))}
									</Row>
								}
							</>
						}
					</TBody>
				</Table>
			</div>
			{contextMenu && contextMenu.visible && (
				<ContextMenu
					items={getContextMenuItems(contextMenu.rowIdx, contextMenu.colIdx)}
					onClick={handleContextMenuItemClick}
					open={true}
					startingX={contextMenu.x}
					startingY={contextMenu.y}
					rightClick={false}
				>
					<div style={{ display: 'none' }} />
				</ContextMenu>
			)}
		</>
	)
}
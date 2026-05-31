import React, {useState, useRef, useEffect, ReactNode, useLayoutEffect} from 'react';

import './ContextMenu.css'
import {ContextMenuHeading} from "../context-menu-heading/ContextMenuHeading";
import {ContextMenuItem} from "../context-menu-item/ContextMenuItem";
import {ContextMenuSeparator} from "../context-menu-separator/ContextMenuSeparator";

export enum IContextMenuType {
	CONTENT=0,
	SEPARATOR=1,
	HEADING=2,
	GROUP=3
}

export interface IContextMenuItem {
	label: string,
	type: IContextMenuType,
	icon?: string,
	checked?: boolean,
	rightIcon?: string,
	children?: Array<IContextMenuItem>,
	value?: any
}

interface Props {
	children: ReactNode;
	width?: number;
	maxHeight?: number;
	items: Array<IContextMenuItem>;
	onClick?: (arg0: IContextMenuItem) => void;
	disabled?: boolean;
	rightClick?: boolean;
	contextFixedToClick?: boolean;
	open?: boolean;
	startingX?: number;
	startingY?: number;
	blockingDelayMs?: number;
}

type ForwardingRefWrapperProps = {
	children?: React.ReactNode;
};

export const ContextMenu: React.FC<Props> = ({
												 children,
												 items,
												 width,
												 maxHeight=325,
												 onClick,
												 disabled = false,
												 rightClick=false,
												 contextFixedToClick=true,
												 open=false,
												 startingX=0,
												 startingY=0,
												 blockingDelayMs=500,
											 }) => {

	const lastChanged = useRef<Date>(new Date())

	const [visible, setVisible] = useState(false);

	const [style, setStyle] = useState<React.CSSProperties>({});
	const [openSubmenus, setOpenSubmenus] = useState<Array<{anchorRect: DOMRect, items: Array<IContextMenuItem>}>>([]);
	const [activeGroupIndexes, setActiveGroupIndexes] = useState<Array<number>>([]);
	const [pinned, setPinned] = useState<{panelLevel: number, itemIndex: number} | null>(null);
	const closeSubmenuTimerRef = useRef<number | null>(null);
	const [panelSizes, setPanelSizes] = useState<Record<number, {width: number, height: number}>>({});

	const childRef = useRef<any | null>(null);

	const contextMenuRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const visibleRef = useRef(visible);

	const isDifferenceBelowThreshold = (date1: Date, date2: Date, thresholdMs: number): boolean => {
		return Math.abs(date1.getTime() - date2.getTime()) < thresholdMs;
	}

	useEffect(() => {
		document.addEventListener('click', handleClick);
		document.addEventListener('contextmenu', handleRightClick);
		if (open) {
			setContextMenuStyleClickPos(startingX, startingY);
			setVisible(true);
		}
		return () => {
			document.removeEventListener('click', handleClick);
			document.removeEventListener('contextmenu', handleRightClick);
		}
	}, []);

	useLayoutEffect(() => {
		if (!visible) {
			setPanelSizes({});
		}
	}, [visible]);

	useLayoutEffect(() => {
		if (!visible) return;
		const measured = panelSizes[0];
		if (!measured) return;
		setStyle((prev) => {
			if (prev.left == null) return prev;
			const leftPx = parseFloat(prev.left as string);
			if (isNaN(leftPx)) return prev;
			if (leftPx + measured.width <= window.innerWidth - 15) return prev;
			const next = {...prev};
			delete next.left;
			next.right = "15px";
			return next;
		});
	}, [visible, panelSizes]);

	useEffect(() => {
		visibleRef.current = visible;
	}, [visible]);

	useEffect(() => {
		if (open) {
			setContextMenuStyleClickPos(startingX, startingY);
			setVisible(true);
		}
	}, [open, startingX, startingY]);

	const handleClick = (e:MouseEvent) => {
		if (!isDifferenceBelowThreshold(new Date(), lastChanged.current, blockingDelayMs)) {
			lastChanged.current = new Date();
			const target = e.target as HTMLElement;
			if (!disabled && !rightClick) {
				if (contextMenuRef && isDescendantOf(contextMenuRef.current, target)) {
					handleContextMenu(e)
				} else if (visibleRef.current) {
					setVisible(false);
					setOpenSubmenus([]);
					setActiveGroupIndexes([]);
					setPinned(null);
				}
			} else if (rightClick && visibleRef.current && !isDescendantOf(contextMenuRef.current, target)) {
				setVisible(false);
				setOpenSubmenus([]);
				setActiveGroupIndexes([]);
				setPinned(null);
			}
		}
	};

	const handleRightClick = (e:MouseEvent) => {
		if (!disabled && rightClick) {
			e.preventDefault();
			const target = e.target as HTMLElement;
			if (contextMenuRef && isDescendantOf(contextMenuRef.current, target)) {
				handleContextMenu(e)
			} else if (visibleRef.current) {
				setVisible(false);
				setOpenSubmenus([]);
				setActiveGroupIndexes([]);
				setPinned(null);
			}
		}
	};

	const isDescendantOf = (parent:HTMLElement | null, child:HTMLElement | null) =>{
		if (parent && child) {
			if (parent === child) {
				return child
			}
			try{
				var node = child.parentElement;
				while (node != null){
					if (node === parent){
						return node;
					}
					node = node.parentElement;
				}
				return null;
			} catch (e) {
				return null;
			}
		}
		return null;
	}


	const setContextMenuStyle = (button: HTMLElement) => {
		const rect = button.getBoundingClientRect();
		const innerHeight = window.innerHeight;
		const innerWidth = window.innerWidth;
		const buttonCenterHeight = rect.top + (rect.height / 2);
		const buttonCenterWidth = rect.left + (rect.width / 2);
		var style: React.CSSProperties = {}
		style.width = width == undefined ? "fit-content" : width + "px";
		style.maxHeight = maxHeight + "px";
		if (buttonCenterHeight > innerHeight / 2) {
			style.bottom = innerHeight - (rect.top - 10) + "px";
		} else {
			style.top = (rect.bottom + 10) + "px";
		}
		if (buttonCenterWidth + (width ?? 0) / 2 > innerWidth - 15) {
			style.right = "15px";
		} else {
			style.left = Math.max(buttonCenterWidth - (width ?? 0) / 2, 15) + "px"
		}
		setStyle(style);
	}

	const setContextMenuStyleClickPos = (x: number, y: number) => {
		const innerHeight = window.innerHeight;
		const innerWidth = window.innerWidth;
		var style: React.CSSProperties = {}
		style.width = width == undefined ? "fit-content" : width + "px";
		style.maxHeight = maxHeight + "px";
		if (y > innerHeight / 2) {
			style.bottom = innerHeight - (y - 10) + "px";
		} else {
			style.top = (y + 10) + "px";
		}
		if ((x - ((width ?? 0) / 2)) > innerWidth - 15) {
			style.right = "15px";
		} else {
			style.left = Math.max((x - ((width ?? 0) / 2)), 15) + "px"
		}
		setStyle(style);
	}

	const handleContextMenu = (e:MouseEvent) => {
		const target = e.target as HTMLElement;
		if (visibleRef.current && isDescendantOf(menuRef.current, target) == null) {
			setVisible(false);
			setOpenSubmenus([]);
			setActiveGroupIndexes([]);
			setPinned(null);
		} else if (!visibleRef.current) {
			e.preventDefault();
			var button = childRef.current as HTMLElement;
			if (button.children.length > 0) {
				button = button.children[0] as HTMLElement;
			}
			if (contextFixedToClick) {
				setContextMenuStyleClickPos(e.x, e.y);
			} else {
				setContextMenuStyle(button);
			}
			setOpenSubmenus([]);
			setActiveGroupIndexes([]);
			setPinned(null);
			setVisible(true);
		}
	};

	const ForwardingRefWrapper = React.forwardRef<HTMLDivElement, ForwardingRefWrapperProps>(
		(props, ref) => {
			return <div ref={ref}>{props.children}</div>;
		}
	);

	const close = () => {
		setVisible(false);
		setOpenSubmenus([]);
		setActiveGroupIndexes([]);
		setPinned(null);
	}

	const getMenuWidthPx = () => {
		return width ?? 200;
	}

	const updatePanelSize = (level: number, el: HTMLDivElement | null) => {
		if (!el) {
			return;
		}
		const rect = el.getBoundingClientRect();
		setPanelSizes((prev) => {
			const existing = prev[level];
			const nextWidth = Math.round(rect.width);
			const nextHeight = Math.round(rect.height);
			if (existing && existing.width === nextWidth && existing.height === nextHeight) {
				return prev;
			}
			return {
				...prev,
				[level]: {width: nextWidth, height: nextHeight}
			};
		});
	}

	const getSubmenuStyle = (anchorRect: DOMRect, level: number): React.CSSProperties => {
		const innerHeight = window.innerHeight;
		const innerWidth = window.innerWidth;
		const margin = 8;
		const overlap = 6;
		const alignTopOffset = 4;
		const measured = panelSizes[level];
		const expectedWidth = width ?? measured?.width ?? 200;

		const maxHeightPx = Math.min(maxHeight, innerHeight - margin * 2);
		const panelHeightPx = Math.min(measured?.height ?? maxHeightPx, maxHeightPx);
		let left = anchorRect.right - overlap;
		if (left + expectedWidth > innerWidth - margin) {
			left = anchorRect.left - expectedWidth + overlap;
		}
		left = Math.max(margin, Math.min(left, innerWidth - margin - expectedWidth));

		let top = anchorRect.top - alignTopOffset;
		top = Math.max(margin, Math.min(top, innerHeight - margin - panelHeightPx));

		return {
			position: 'fixed',
			left: left + 'px',
			top: top + 'px',
			width: width == undefined ? 'fit-content' : expectedWidth + 'px',
			maxHeight: maxHeightPx + 'px',
			zIndex: 10 + level,
		};
	}

	const closeSubmenusFromLevel = (panelLevel: number) => {
		setOpenSubmenus((prev) => prev.slice(0, panelLevel));
		setActiveGroupIndexes((prev) => prev.slice(0, panelLevel));
	}

	const clearSubmenuCloseTimer = () => {
		if (closeSubmenuTimerRef.current != null) {
			window.clearTimeout(closeSubmenuTimerRef.current);
			closeSubmenuTimerRef.current = null;
		}
	}

	const scheduleSubmenuCloseFromLevel = (panelLevel: number) => {
		if (pinned != null) {
			return;
		}
		clearSubmenuCloseTimer();
		closeSubmenuTimerRef.current = window.setTimeout(() => {
			closeSubmenusFromLevel(panelLevel);
		}, 150);
	}

	const openGroup = (panelLevel: number, itemIndex: number, anchorRect: DOMRect, groupItems: Array<IContextMenuItem>) => {
		clearSubmenuCloseTimer();
		setOpenSubmenus((prev) => {
			const next = prev.slice(0, panelLevel);
			next[panelLevel] = {anchorRect, items: groupItems};
			return next;
		});
		setActiveGroupIndexes((prev) => {
			const next = prev.slice(0, panelLevel);
			next[panelLevel] = itemIndex;
			return next;
		});
	}

	const handleItemClick = (item: IContextMenuItem) => {
		if (onClick) {
			onClick(item);
		}
		close();
	};

	const renderPanel = (panelItems: Array<IContextMenuItem>, panelLevel: number, panelStyle: React.CSSProperties) => {
		return (
			<div
				className="blue-orange-default-context-menu shadow"
				style={{...panelStyle, zIndex: 10 + panelLevel}}
				ref={(el) => updatePanelSize(panelLevel, el)}
				onMouseEnter={() => clearSubmenuCloseTimer()}
				onMouseLeave={() => scheduleSubmenuCloseFromLevel(panelLevel)}
			>
				{panelItems.map((item, index) => (
					<div
						key={index}
						onMouseEnter={() => {
							if (pinned != null && pinned.panelLevel === panelLevel && pinned.itemIndex !== index) {
								setPinned(null);
								closeSubmenusFromLevel(panelLevel);
							}
							if (item.type !== IContextMenuType.GROUP) {
								closeSubmenusFromLevel(panelLevel);
							}
						}}
					>
						{item.type == IContextMenuType.HEADING && (
							<ContextMenuHeading item={item} onClick={handleItemClick}></ContextMenuHeading>
						)}
						{item.type == IContextMenuType.CONTENT && (
							<ContextMenuItem item={item} onClick={handleItemClick}></ContextMenuItem>
						)}
						{item.type == IContextMenuType.SEPARATOR && (
							<ContextMenuSeparator item={item} onClick={handleItemClick}></ContextMenuSeparator>
						)}
						{item.type == IContextMenuType.GROUP && (
							<div
								className={
									activeGroupIndexes[panelLevel] === index
										? "blue-orange-context-menu-general-row blue-orange-context-menu-item blue-orange-context-menu-group blue-orange-context-menu-group-active"
										: "blue-orange-context-menu-general-row blue-orange-context-menu-item blue-orange-context-menu-group"
								}
								onMouseEnter={(ev) => {
									const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
									openGroup(panelLevel, index, rect, item.children ?? []);
								}}
								onClick={(ev) => {
									ev.stopPropagation();
								const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
								const isAlreadyPinned = pinned != null && pinned.panelLevel === panelLevel && pinned.itemIndex === index;
								if (isAlreadyPinned) {
									setPinned(null);
								} else {
									setPinned({panelLevel, itemIndex: index});
								}
								openGroup(panelLevel, index, rect, item.children ?? []);
							}}
								onMouseLeave={() => scheduleSubmenuCloseFromLevel(panelLevel)}
							>
								<div className="blue-orange-context-menu-item-left-cont">
									{item.icon && (
										<div className="blue-orange-default-context-menu-row-icon"><i className={item.icon}></i></div>
									)}
									<div>{item.label}</div>
								</div>
								<div className="blue-orange-context-menu-group-arrow">
									<i className={item.rightIcon ?? "ri-arrow-right-s-line"}></i>
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		);
	}

	return (
		<div ref={contextMenuRef}>
			<ForwardingRefWrapper ref={childRef}>
				{children}
			</ForwardingRefWrapper>
			{visible && (
				<div
					ref={menuRef}
				>
					{renderPanel(items, 0, style)}
					{openSubmenus.map((submenu, idx) => {
						return (
							<div key={idx}>
								{renderPanel(submenu.items, idx + 1, getSubmenuStyle(submenu.anchorRect, idx + 1))}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
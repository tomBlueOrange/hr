import React, {useEffect, useRef, useState} from "react";
import './Dropdown.css'
import {DropdownItemObj, DropdownItemType} from "../../../interfaces/AppInterfaces";
import {DropdownItem} from "../items/DropdownItem/DropdownItem";
import {Input} from "../../input/Input";
import Fuse from "fuse.js";
import {Checkbox} from "../../checkbox/Checkbox";
import {DropdownItemStyle} from "../items/DropdownItemStyle/DropdownItemStyle";
import {HelpIcon} from "../../help/HelpIcon";
import {RequiredIcon} from "../../required-icon/RequiredIcon";
import {DropdownItemHeading} from "../items/DropdownItemHeading/DropdownItemHeading";
import {DropdownItemIcon} from "../items/DropdownItemIcon/DropdownItemIcon";
import {DropdownItemImage} from "../items/DropdownItemImage/DropdownItemImage";
import {DropdownItemText} from "../items/DropdownItemText/DropdownItemText";

interface Props {
	children: React.ReactNode,
	placeholder?: string,
	disabled?: boolean,
	contextWidth?: number | string,
	contextMaxHeight?: number,
	closeOnClick?: boolean,
	allowMultipleSelection?: boolean,
	onSelection?: (item: DropdownItemObj) => void,
	onItemsSelected?: (items: Array<DropdownItemObj>) => void,
	onUpdate?: (items: Array<DropdownItemObj>) => void,
	filter?: boolean,
	label?:string,
	required?: boolean,
	help?: string,
	style?: React.CSSProperties,
	labelStyle?: React.CSSProperties
}

export const Dropdown: React.FC<Props> = ({
												   children,
												   disabled,
												   placeholder="No items selected...",
												   contextWidth,
												   contextMaxHeight,
												   closeOnClick = true,
													allowMultipleSelection = false,
													onSelection,
													onItemsSelected,
													onUpdate,
													filter=false,
												    label,
												    required=false,
												    help,
												    style = {},
												    labelStyle={}
											   }) => {

	const items:Array<DropdownItemObj> = []

	React.Children.forEach(children, child => {
		if (React.isValidElement<{ label: string; value: string; selected: boolean; disabled?: boolean; src?: string }>(child)) {
			if (child.type === DropdownItemHeading) {
				items.push({
					label: child.props.label,
					reference: child.props.value,
					selected: child.props.selected,
					type: DropdownItemType.HEADING,
					disabled: child.props.disabled,
					heading: true
				})
			} else if (child.type === DropdownItemIcon) {
				items.push({
					label: child.props.label,
					reference: child.props.value,
					selected: child.props.selected,
					type: DropdownItemType.ICON,
					disabled: child.props.disabled,
					icon: true,
					src: child.props.src
				})
			} else if (child.type === DropdownItemImage) {
				items.push({
					label: child.props.label,
					reference: child.props.value,
					selected: child.props.selected,
					type: DropdownItemType.IMAGE,
					disabled: child.props.disabled,
					image: true,
					src: child.props.src
				})
			} else if (child.type === DropdownItemText) {
				items.push({
					label: child.props.label,
					reference: child.props.value,
					selected: child.props.selected,
					type: DropdownItemType.TEXT,
					disabled: child.props.disabled,
				})
			}
		}
	});

	const [visible, setVisible] = useState(false);

	const [blockMouseClick, setBlockMouseClick] = useState(false);

	const [lastUpdated, setLastUpdated] = useState(new Date());

	const inputRef = useRef<HTMLDivElement | null>(null);

	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const visibleRef = useRef(visible);

	const blockMouseClickRef = useRef(blockMouseClick);

	useEffect(() => {
		visibleRef.current = visible;
	}, [visible]);

	useEffect(() => {
		blockMouseClickRef.current = blockMouseClick;
	}, [blockMouseClick]);

	const fuseOptions = {
		keys: [
			"label",
		],
		threshold: 0.2, // Lower threshold for stricter matches
		caseSensitive: false, // Case-insensitive matches
		distance: 100, // Short distance for stricter matches
		minMatchCharLength: 1, // Minimum 3 characters must match
	};

	const getInitialSelectedValue = () => {
		var selectedVal = undefined
		items.forEach(item => {
			if (item.selected) {
				selectedVal = item
			}
		})
		if (selectedVal !== undefined) {
			return selectedVal;
		}
		return {
			label: "Select a Value....",
			reference: "-1",
			selected: false,
			type: DropdownItemType.TEXT
		}
	}

	const [selectedValue, setSelectedValue] = useState<DropdownItemObj>(getInitialSelectedValue())

	const [selectedItems, setSelectedItems] = useState<Array<DropdownItemObj>>(items.filter(item => item.selected))

	const [modifiedItems, setModifiedItems] = useState<Array<DropdownItemObj>>(items)

	const [queryItems, setQueryItems] = useState<Array<DropdownItemObj>>(items)

	const queryItemsRef = useRef<Array<DropdownItemObj>>(items);

	useEffect(() => {
		if (onSelection) {
			onSelection(selectedValue);
		}
	}, [selectedValue]);

	useEffect(() => {
		if (onItemsSelected) {
			onItemsSelected(selectedItems);
		}
	}, [selectedItems]);

	useEffect(() => {
		if (onUpdate) {
			onUpdate(modifiedItems);
		}
	}, [modifiedItems]);

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

	const isDescendantOfClassName = (className:string, child:HTMLElement) =>{
		try{
			if (child.classList.contains(className)) {
				return true
			}
			var node = child.parentElement;
			while (node != null){
				if (node.classList.contains(className)){
					return true;
				}
				node = node.parentElement;
			}
			return false;
		} catch (e) {
			return false;
		}
	}


	const calculateLeftPosition = () => {
		try{
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			const clientWidth = rect.width;
			const clientLeft = rect.left;
			const width = contextWidth != undefined && typeof contextWidth != "string" ? contextWidth : clientWidth;
			const offset = (width - clientWidth) / 2;
			return Math.max(0, clientLeft - offset);
		} catch (e) {
			return 0;
		}
	}

	const generateFullWidth = () => {
		try{
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			const clientWidth = rect.width;
			return clientWidth.toString() + "px"
		} catch (e) {
			return "fit-content";
		}
	}

	const isPosAbove = () => {
		if (getClientTop() > window.innerHeight / 2) {
			return true;
		}
		return false;
	}

	const getClientTop = () => {
		try {
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return rect.top;
		} catch (e) {
			return 0;
		}

	}

	const getClientBottom = () => {
		try {
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return window.innerHeight - rect.bottom;
		} catch (e) {
			return 0;
		}

	}

	const getClientHeight = () => {
		try{
			const rect = inputRef.current?.getBoundingClientRect() as DOMRect;
			return rect.height;
		} catch (e) {
			return 0;
		}

	}

	var dropdownWindowStyle: React.CSSProperties = {
		display: visibleRef ? "flex" : "none",
		flexDirection: "column",
		width: contextWidth == undefined ? generateFullWidth() : contextWidth,
		maxHeight: contextMaxHeight == undefined ? "200px" : contextMaxHeight,
		left: calculateLeftPosition(),
		bottom: isPosAbove() ? getClientBottom() + getClientHeight() + 10 + "px" : "unset",
		top: !isPosAbove() ? getClientTop() + getClientHeight() + 10 + "px" : "unset",
	}

	var dropdownItemStyle: React.CSSProperties = {
		marginTop: filter ? "54px" : "unset",
		width: "100%",
		height: "100%",
		overflow: "auto"
	}

	const handleClick = (e:MouseEvent) => {
		const target = e.target as HTMLElement;
		if (dropdownRef && isDescendantOf(dropdownRef.current, target)) {
		} else if (visibleRef.current && !blockMouseClickRef.current) {
			setVisible(false);
		}
	};

	const getFocusedItemIdx = () => {
		for (var i=0; i < queryItemsRef.current.length; i++) {
			if (queryItemsRef.current[i].focused) {
				return i;
			}
		}
		return -1;
	}

	const getNextSelectableItem = () => {
		var focusedItem = getFocusedItemIdx();
		for (var i= focusedItem + 1; i < queryItemsRef.current.length; i++) {
			if (queryItemsRef.current[i].type != DropdownItemType.HEADING && !queryItemsRef.current[i].disabled) {
				return i;
			}
		}
		return -1;
	}

	const getPreviousSelectableItem = () => {
		var focusedItem = getFocusedItemIdx() == -1 ? queryItems.length : getFocusedItemIdx();
		for (var i= focusedItem -1; i >= 0; i--) {
			if (queryItems[i].type != DropdownItemType.HEADING && !queryItems[i].disabled) {
				return i;
			}
		}
		return queryItems.length;
	}

	const handleKeyDownEvent = (e:KeyboardEvent) => {
		try{
			var modQueryItems = queryItemsRef.current;
			if (e.key == "ArrowDown" && visibleRef.current) {
				e.preventDefault();
				var nextFocusedItem = getNextSelectableItem();
				modQueryItems.forEach(item => item.focused = false);
				if (nextFocusedItem > -1) {
					modQueryItems[nextFocusedItem].focused = true;
				}
				setQueryItems(modQueryItems);
				queryItemsRef.current = modQueryItems;
				setLastUpdated(new Date())
			} else if (e.key == "ArrowUp" && visibleRef.current) {
				e.preventDefault();
				var prevFocusedItem = getPreviousSelectableItem();
				modQueryItems.forEach(item => item.focused = false);
				if (prevFocusedItem < queryItems.length) {
					modQueryItems[prevFocusedItem].focused = true;
				}
				setQueryItems(modQueryItems);
				queryItemsRef.current = modQueryItems;
				setLastUpdated(new Date())
			} else if (e.key == "Enter" && visibleRef.current) {
				e.preventDefault();
				var focusedItemIdx = getFocusedItemIdx();
				if (focusedItemIdx > -1) {
					handleItemClick(queryItemsRef.current[focusedItemIdx]);
				}
			}
		} catch (e) {
			console.error(e);
		}

	};

	useEffect(() => {
		document.addEventListener('click', handleClick);
		document.addEventListener('keydown', handleKeyDownEvent)
		return () => {
			document.removeEventListener('click', handleClick);
			document.removeEventListener('keydown', handleKeyDownEvent);
		}
	}, []);

	const toggleVisibleState = (ev: React.MouseEvent) => {
		if (!disabled) {
			if (!isDescendantOfClassName("blue-orange-dropdown-remove-selection", ev.target as HTMLElement)) {
				if (visibleRef.current) {
					setVisible(false);
				} else {
					setBlockMouseClick(true);
					setTimeout(() => {
						setBlockMouseClick(false);
					}, 500)
					setVisible(true);
					handleFilterChange("");
				}
			}
		} else {
			setVisible(false);
		}

	}

	const updateModifiedItems = (item: DropdownItemObj, modItems: Array<DropdownItemObj>) => {
		setModifiedItems(modItems.map(obj => {
			if (obj.reference === item.reference) {
				return item;
			}
			return obj;
		}));
	}

	const updateSelectedItems = (item: DropdownItemObj, modSelectedItems: Array<DropdownItemObj>) => {
		if (selectedItems.indexOf(item) < 0 && item.selected) {
			selectedItems.push(item);
			setSelectedItems(selectedItems);
		} else if (selectedItems.indexOf(item) >= 0 && !item.selected) {
			selectedItems.splice(selectedItems.indexOf(item), 1);
		}
		if (onItemsSelected) {
			onItemsSelected(selectedItems);
		}
	}

	const removeSelectedItems = (item: DropdownItemObj) => {
		if (selectedItems.indexOf(item) >= 0) {
			selectedItems.splice(selectedItems.indexOf(item), 1);
		}
	}

	const handleItemClick = (item: DropdownItemObj) => {
		if (!item.disabled) {
			var modSelectedItems = selectedItems;
			var modItems = modifiedItems;
			if (!allowMultipleSelection) {
				modSelectedItems = [];
				modItems.forEach(item => {
					item.selected = false;
				})
				setSelectedValue(item)
				item.selected = true;
			} else {
				item.selected = !item.selected
			}
			updateModifiedItems(item, modItems);
			updateSelectedItems(item, modSelectedItems);
			setLastUpdated(new Date())
			if (closeOnClick && !allowMultipleSelection) {
				setVisible(false);
			}
		}
	}

	const handleFilterChange = (query: string) => {
		if (query == "" || query == undefined) {
			var queryItems = modifiedItems;
			queryItems.forEach(item => item.focused = false);
			for (let item of queryItems) {
				if (item.type !== DropdownItemType.HEADING && !item.disabled) {
					item.focused = true
					break;
				}
			}
			setQueryItems(queryItems);
			queryItemsRef.current = queryItems;
		} else {
			const fuse = new Fuse(modifiedItems.filter(item =>
				item.type != DropdownItemType.HEADING), fuseOptions);
			const queryItems = fuse.search(query).map(fuseItem => fuseItem.item);
			if (queryItems.length <= 0) {
				setQueryItems([{
					label: "No items found..",
					reference: "-1",
					selected: false,
					disabled: true,
					type: DropdownItemType.TEXT
				}])
				queryItemsRef.current = [{
					label: "No items found..",
					reference: "-1",
					selected: false,
					disabled: true,
					type: DropdownItemType.TEXT
				}];
			} else {
				queryItems.forEach(item => item.focused = false);
				queryItems[0].focused = true;
				setQueryItems(queryItems);
				queryItemsRef.current = queryItems;
			}
		}
	}

	const removeSelectedItem = (ev: any, selectedItem: DropdownItemObj) => {
		ev.preventDefault();
		handleItemClick(selectedItem);
	}

	return (
		<div className="blue-orange-dropdown-cont">
			{label &&
				<div className={"blue-orange-default-input-label-cont"} style={labelStyle}>
					{label}
					{help && <HelpIcon label={help}></HelpIcon>}
					{required && <RequiredIcon></RequiredIcon>}
				</div>
			}
			<div ref={inputRef} className="blue-orange-dropdown" style={style} onClick={(ev) => toggleVisibleState(ev)}>
				{!allowMultipleSelection &&
					<>
						<div className="blue-orange-dropdown-selection">
							<DropdownItem item={selectedValue} displayedValue={true}></DropdownItem>
						</div>
						<div className="blue-orange-dropdown-icon">
							<i className="ri-arrow-down-s-line"></i>
						</div>
					</>
				}
				{allowMultipleSelection && selectedItems.length > 0 &&
					<>
						<div className="blue-orange-dropdown-selection-multiple-selection">
							{selectedItems.map((item, index) => (
								<div key={index + "-" + item.label} className="blue-orange-dropdown-selection-multiple-selection-tag">
									<DropdownItem item={item} displayedValue={true}></DropdownItem>
									<div className="blue-orange-dropdown-remove-selection" onClick={(ev) => {removeSelectedItem(ev, item)}}>
										<i className="ri-close-line"></i>
									</div>
								</div>
							))}
						</div>
						<div className="blue-orange-dropdown-icon">
							<i className="ri-arrow-down-s-line"></i>
						</div>
					</>
				}
				{allowMultipleSelection && selectedItems.length <= 0 &&
					<Input placeholder={placeholder} disabled={disabled} style={{border: "transparent", height: "40px",pointerEvents: "none"}}></Input>
				}
			</div>
			{visible &&
				<div ref={dropdownRef} className="blue-orange-dropdown-window shadow" style={dropdownWindowStyle}>
					{filter &&
						<div className="blue-orange-dropdown-window-filter-cont">
							<Input placeholder={"Filter..."} style={{height: "32px", fontSize: "14px"}} disabled={disabled} onChange={handleFilterChange} focus={true}></Input>
						</div>
					}
					<div style={dropdownItemStyle}>
						{queryItems.map((item, index) => (
							<DropdownItemStyle key={index} item={item} update={lastUpdated}>
								{allowMultipleSelection && item.type != DropdownItemType.HEADING &&
									<div className="blue-orange-dropdown-item-check-cont" onClick={() => handleItemClick(item)}>
										<Checkbox checked={item.selected} readonly={true} update={lastUpdated}></Checkbox>
									</div>
								}
								<div className="blue-orange-dropdown-item-el-cont">
									<DropdownItem item={item} onClick={handleItemClick}></DropdownItem>
								</div>
								{item.selected &&
									<div className="blue-orange-dropdown-item-selected-cont">
										<i className="ri-check-line"></i>
									</div>
								}
							</DropdownItemStyle>
						))}
					</div>
				</div>
			}
		</div>


	)
}
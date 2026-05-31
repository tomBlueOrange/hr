import { Instance } from 'tippy.js';
import {ReactNode} from "react";
import {IContextMenuItem} from "../contextmenu/contextmenu/ContextMenu";

export interface TippyInstance extends Instance {
    _tippy?: TippyInstance;
}

export interface TippyHTMLElement extends HTMLElement {
    _tippy?: TippyInstance;
}

export enum CellAlignment {
    LEFT,
    CENTER,
    RIGHT
}

export enum DropdownItemType {
    TEXT,
    HEADING,
    ICON,
    IMAGE
}

export interface DropdownItemObj {
    label: string,
    reference: string,
    selected: boolean,
    type: DropdownItemType,
    disabled?: boolean,
    icon?: boolean,
    image?: boolean,
    heading?: boolean,
    src?: string,
    focused?: boolean
}

export interface IComment {

}

export enum DatePickerMonth {
    JAN,
    FEB,
    MAR,
    APR,
    MAY,
    JUN,
    JUL,
    AUG,
    SEP,
    OCT,
    NOV,
    DEC
}

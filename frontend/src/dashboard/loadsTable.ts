// Curated DataTable schema for load search results + the mapping from a Load
// into the SearchRecord shape the DataTable consumes (one property per column,
// keyed by the column's apiName — see TableDemo for the pattern).

import {
    TableField,
    TableFieldSortState,
    TableFieldType,
} from "../components/table/data-table/DataTable";
import {BaseData, BaseDataType, SearchRecord} from "../components/interfaces/SearchTypes";
import {Load} from "../api/types";

const field = (label: string, apiName: string, type: TableFieldType): TableField => ({
    label,
    apiName,
    type,
    sortState: TableFieldSortState.UNSORTED,
    sortable: true,
    filterable: false,
    statistics: false,
});

export const loadsTableSchema: TableField[] = [
    field("Load ID", "loadId", TableFieldType.STRING),
    field("Route", "route", TableFieldType.STRING),
    field("Equipment", "equipmentType", TableFieldType.STRING),
    field("Rate", "loadboardRate", TableFieldType.CURRENCY),
    field("Weight", "weight", TableFieldType.NUMBER),
    field("Miles", "miles", TableFieldType.NUMBER),
    field("Pickup", "pickupDateTime", TableFieldType.DATE),
    field("Delivery", "deliveryDateTime", TableFieldType.DATE),
    field("Commodity", "commodityType", TableFieldType.STRING),
];

const prop = (key: string, value: string, type: BaseDataType): BaseData => ({type, key, value});

export function loadToRecord(load: Load): SearchRecord {
    return {
        primaryKey: prop("loadId", load.loadId, BaseDataType.TEXT),
        title: prop("title", load.loadId, BaseDataType.TEXT),
        properties: [
            prop("loadId", load.loadId, BaseDataType.TEXT),
            prop("route", `${load.startingLocation} → ${load.deliveryLocation}`, BaseDataType.TEXT),
            prop("equipmentType", load.equipmentType, BaseDataType.TEXT),
            prop("loadboardRate", String(load.loadboardRate), BaseDataType.DOUBLE),
            prop("weight", String(load.weight), BaseDataType.DOUBLE),
            prop("miles", String(load.miles), BaseDataType.DOUBLE),
            prop("pickupDateTime", load.pickupDateTime, BaseDataType.DATE),
            prop("deliveryDateTime", load.deliveryDateTime, BaseDataType.DATE),
            prop("commodityType", (load.commodityType ?? []).join(", "), BaseDataType.TEXT),
        ],
    };
}

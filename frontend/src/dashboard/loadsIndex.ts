// Index schema describing the searchable load fields. The SearchQueryEditor(Small)
// builds its field pickers and operator menus from this — it mirrors the
// server's load search schema (TEXT, DOUBLE/INTEGER numeric, DATE).

import {Index, SchemaPropertyType} from "../components/interfaces/SearchTypes";

export const loadsIndex: Index = {
    name: "loads",
    displayName: "Loads",
    description: "Available freight loads",
    schema: {
        properties: [
            {apiName: "loadId", displayName: "Load ID", type: SchemaPropertyType.KEYWORDS, title: true},
            {apiName: "startingLocation", displayName: "Origin", type: SchemaPropertyType.TEXT},
            {apiName: "deliveryLocation", displayName: "Destination", type: SchemaPropertyType.TEXT},
            {apiName: "equipmentType", displayName: "Equipment", type: SchemaPropertyType.TEXT},
            {apiName: "commodityType", displayName: "Commodity", type: SchemaPropertyType.TEXT, allowMultiple: true},
            {apiName: "notes", displayName: "Notes", type: SchemaPropertyType.TEXT},
            {apiName: "loadboardRate", displayName: "Rate", type: SchemaPropertyType.DOUBLE},
            {apiName: "weight", displayName: "Weight", type: SchemaPropertyType.DOUBLE},
            {apiName: "miles", displayName: "Miles", type: SchemaPropertyType.DOUBLE},
            {apiName: "numOfPieces", displayName: "Pieces", type: SchemaPropertyType.INTEGER},
            {apiName: "pickupDateTime", displayName: "Pickup", type: SchemaPropertyType.DATE},
            {apiName: "deliveryDateTime", displayName: "Delivery", type: SchemaPropertyType.DATE},
        ],
    },
};


export interface ChartDataset {
    label: string,
    data: Array<any>,
    borderColor?: string,
    backgroundColor?: string,
    borderWidth?: number,
    fill?: boolean | string,
    axis?: string,
    borderRadius?: number,
    borderSkipped?: false,
    yAxisID?: string,
}

export enum LegendPosition {
    TOP,
    BOTTOM,
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT
}



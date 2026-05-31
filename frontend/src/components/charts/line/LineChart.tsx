import React, {useEffect, useRef, useState} from "react";

import './LineChart.css'

import Chart from 'chart.js/auto';
import {ChartDataset, LegendPosition} from "../types/ChartTypes";
import {v4 as uuidv4} from "uuid";
import 'chartjs-adapter-moment';

interface Props {
	dataset: Array<ChartDataset>,
	labels?: Array<string>,
	gridLines?: boolean,
	xLabel?: string,
	xScale?: string,
	xScaleTimeUnit?: string,
	yLabel?: string,
	yScale?: string,
	height?: string,
	width?: string,
	fill?: any, // 'start', 'end', 'origin' or boolean
	tension?: number,
	interactionType?: string  // 'index' | 'nearest'
	animationTimeout?: number,
	legend?: boolean,
	legendPosition?: LegendPosition,
	rangeSelect?: boolean,
	onRangeSelected?: (startValue: any, endValue: any) => void,
}

export const LineChart: React.FC<Props> = ({
											   dataset,
											   labels,
											   gridLines = true,
											   xLabel,
											   xScale,
											   xScaleTimeUnit = "minute",
											   yLabel,
											   yScale,
											   height = "100%",
											   width = "100%",
											   fill = false,
											   tension = 0.2,
											   interactionType = "index",
											   animationTimeout = 2000,
											   legend = true,
											   legendPosition = LegendPosition.BOTTOM,
											   rangeSelect = false,
											   onRangeSelected,
										   }) => {

	const chartRef = useRef<HTMLCanvasElement>(null);
	const chartInstanceRef = useRef<Chart | null>(null);

	const datasetVisibility = useRef<boolean[]>([]);
	const initRef = useRef<boolean>(false);
	const uuid = uuidv4();

	// ---- Selection state (NEW) ----
	const dragRef = useRef<{
		active: boolean,
		startX: number | null,
		endX: number | null
	}>({ active: false, startX: null, endX: null });

	const clearSelection = () => {
		dragRef.current = { active: false, startX: null, endX: null };
		chartInstanceRef.current?.draw();
	};

	const getPixelFromEvent = (e: PointerEvent | MouseEvent | TouchEvent) => {
		const chart = chartInstanceRef.current as any;
		if (!chart) return null;
		// Normalize to device pixel ratio
		const rect = chart.canvas.getBoundingClientRect();
		let clientX: number, clientY: number;
		if ('clientX' in e) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else {
			return null;
		}
		const x = (clientX - rect.left) * (chart.width / rect.width);
		const y = (clientY - rect.top) * (chart.height / rect.height);
		return { x, y };
	};

	const clampToChartAreaX = (px: number) => {
		const chart = chartInstanceRef.current as any;
		const ca = chart?.chartArea;
		if (!ca) return px;
		return Math.min(Math.max(px, ca.left), ca.right);
	};

	const isInsideChartArea = (x: number, y: number) => {
		const chart = chartInstanceRef.current as any;
		const ca = chart?.chartArea;
		if (!ca) return false;
		return x >= ca.left && x <= ca.right && y >= ca.top && y <= ca.bottom;
	};

	// Canvas event handlers (NEW)
	const onPointerDown = (e: PointerEvent) => {
		if (!rangeSelect) return;
		const coords = getPixelFromEvent(e);
		if (!coords) return;
		const { x, y } = coords;
		if (!isInsideChartArea(x, y)) return;
		dragRef.current.active = true;
		dragRef.current.startX = clampToChartAreaX(x);
		dragRef.current.endX = clampToChartAreaX(x);
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
		chartInstanceRef.current?.draw();
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!rangeSelect) return;
		if (!dragRef.current.active) return;
		const coords = getPixelFromEvent(e);
		if (!coords) return;
		dragRef.current.endX = clampToChartAreaX(coords.x);
		chartInstanceRef.current?.draw(); // cheap re-draw without re-layout
	};

	const finalizeSelection = () => {
		const chart = chartInstanceRef.current as any;
		if (!chart || !dragRef.current.startX || !dragRef.current.endX) return;

		const xMinPx = Math.min(dragRef.current.startX, dragRef.current.endX);
		const xMaxPx = Math.max(dragRef.current.startX, dragRef.current.endX);
		// Ignore tiny drags
		if (xMaxPx - xMinPx < 2) {
			clearSelection();
			return;
		}

		const xScale = chart.scales?.x;
		if (!xScale) {
			clearSelection();
			return;
		}

		const vMin = xScale.getValueForPixel(xMinPx);
		const vMax = xScale.getValueForPixel(xMaxPx);

		// Fire the callback with scale-native values
		onRangeSelected?.(vMin, vMax);

		// Keep the visual band for a brief moment? For simplicity, clear immediately:
		clearSelection();
	};

	const onPointerUp = (e: PointerEvent) => {
		if (!rangeSelect) return;
		if (!dragRef.current.active) return;
		finalizeSelection();
	};

	const onPointerCancel = (e: PointerEvent) => {
		if (!rangeSelect) return;
		clearSelection();
	};

	const onDblClick = (e: MouseEvent) => {
		if (!rangeSelect) return;
		clearSelection();
	};

	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') clearSelection();
	};

	// ---- Legend positioning (existing code) ----
	const floatingLegendTopLeft: React.CSSProperties = { top: "20px", left: "20px" };
	const floatingLegendTopRight: React.CSSProperties = { top: "20px", right: "20px" };
	const floatingLegendBottomLeft: React.CSSProperties = { bottom: "20px", left: "20px" };
	const floatingLegendBottomRight: React.CSSProperties = { bottom: "20px", right: "20px" };

	const setLegendStyleValue = (): React.CSSProperties => {
		if (legendPosition == LegendPosition.TOP || legendPosition == LegendPosition.BOTTOM) return {};
		if (legendPosition == LegendPosition.TOP_RIGHT) return floatingLegendTopRight;
		if (legendPosition == LegendPosition.TOP_LEFT) return floatingLegendTopLeft;
		if (legendPosition == LegendPosition.BOTTOM_RIGHT) return floatingLegendBottomRight;
		return floatingLegendBottomLeft;
	};
	const [legendStyle] = useState<React.CSSProperties>(setLegendStyleValue());

	const getOrCreateLegendList = (chart: any, id: any) => {
		const legendContainer = document.getElementById(id);
		if (!legendContainer) return null;
		let listContainer = legendContainer.querySelector('ul');
		if (!listContainer) {
			listContainer = document.createElement('ul');
			listContainer.style.display = 'flex';
			listContainer.style.flexDirection = (legendPosition == LegendPosition.TOP || legendPosition == LegendPosition.BOTTOM) ? 'row' : 'column';
			listContainer.style.margin = "0";
			listContainer.style.padding = "0";
			// @ts-ignore
			legendContainer.appendChild(listContainer);
		}
		return listContainer;
	};

	const htmlLegendPlugin = {
		id: 'htmlLegend',
		afterUpdate(chart: any, args: any, options: any) {
			const ul = getOrCreateLegendList(chart, options.containerID);
			if (ul) {
				while (ul.firstChild) ul.firstChild.remove();
				const items = chart.options.plugins.legend.labels.generateLabels(chart);
				// @ts-ignore
				items.forEach((item: any) => {
					const li = document.createElement('li');
					li.className = "blue-orange-line-chart-legend-item"
					li.style.alignItems = 'center';
					li.style.cursor = 'pointer';
					li.style.display = 'flex';
					li.style.flexDirection = 'row';
					li.style.marginLeft = '10px';

					li.onclick = () => {
						const { type } = chart.config;
						if (type === 'pie' || type === 'doughnut') {
							chart.toggleDataVisibility(item.index);
						} else {
							chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
						}
						var visibility = datasetVisibility.current;
						visibility[item.datasetIndex] = !visibility[item.datasetIndex]
						datasetVisibility.current = visibility;
						// @ts-ignore
						(li.children[1] as HTMLElement).style.textDecoration = visibility[item.datasetIndex] ? '' : 'line-through';
						chart.update();
					};

					// Color box
					const boxSpan = document.createElement('span');
					boxSpan.className = "blue-orange-line-chart-legend-item-color-span"
					boxSpan.style.background = item.fillStyle;
					boxSpan.style.borderColor = item.strokeStyle;
					boxSpan.style.borderWidth = item.lineWidth + 'px';
					boxSpan.style.display = 'inline-block';
					boxSpan.style.flexShrink = "0";

					// Text
					const textContainer = document.createElement('p');
					textContainer.className = "blue-orange-line-chart-legend-item-text"
					textContainer.style.margin = "0";
					textContainer.style.padding = "0";
					textContainer.style.textDecoration = item.hidden ? 'line-through' : '';
					const text = document.createTextNode(item.text);
					textContainer.appendChild(text);

					li.appendChild(boxSpan);
					li.appendChild(textContainer);
					ul.appendChild(li);
				});
			}
		}
	};

	// ---- Selection overlay plugin (NEW) ----
	const selectionOverlayPlugin = {
		id: 'xRangeSelectionOverlay',
		// Prevent hover/tooltip while dragging a range
		beforeEvent: (chart: any) => {
			if (dragRef.current.active) {
				chart.setActiveElements([]);
				if (chart.tooltip && chart.tooltip.setActiveElements) {
					chart.tooltip.setActiveElements([], {x: 0, y: 0});
				}
			}
		},
		afterDraw: (chart: any) => {
			const { active, startX, endX } = dragRef.current;
			if (!active || startX == null || endX == null) return;
			const { ctx, chartArea } = chart;
			const x1 = Math.max(Math.min(startX, endX), chartArea.left);
			const x2 = Math.min(Math.max(startX, endX), chartArea.right);
			const w = Math.max(0, x2 - x1);
			if (w <= 0) return;

			ctx.save();
			ctx.fillStyle = 'rgba(45, 136, 255, 0.15)';
			ctx.fillRect(x1, chartArea.top, w, chartArea.bottom - chartArea.top);
			ctx.strokeStyle = 'rgba(45, 136, 255, 0.8)';
			ctx.lineWidth = 1;
			ctx.strokeRect(x1, chartArea.top, w, chartArea.bottom - chartArea.top);
			ctx.restore();
		}
	};

	const updateChartData = () => {
		if (chartInstanceRef.current != null && initRef.current) {
			dataset.forEach((ds, index) => {
				ds.fill = fill;
				if (typeof datasetVisibility.current[index] !== "undefined") {
					// @ts-ignore
					ds.hidden = !datasetVisibility.current[index];
				}
			});
			const data = { labels, datasets: dataset };
			if (chartInstanceRef.current.data !== data) {
				chartInstanceRef.current.data = data as any;
				chartInstanceRef.current.options.animation = false;
				chartInstanceRef.current.update();
			}
			// Refresh legend
			// @ts-ignore
			if (chartInstanceRef.current.options.plugins?.htmlLegend?.afterUpdate) {
				// @ts-ignore
				chartInstanceRef.current.options.plugins.htmlLegend.afterUpdate(chartInstanceRef.current, {}, { containerID: uuid });
			}
		}
	};

	useEffect(() => {
		let initTimeout: ReturnType<typeof setTimeout>;
		if (chartRef.current) {
			const ctx = chartRef.current.getContext('2d');
			if (datasetVisibility.current.length !== dataset.length) {
				datasetVisibility.current = dataset.map(() => true);
			}
			dataset.forEach(ds => (ds.fill = fill));
			const data = { labels, datasets: dataset };
			const config: any = {
				type: "line",
				data,
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						htmlLegend: { containerID: uuid },
						legend: { display: false },
						tooltip: {
							enabled: false,
							intersect: false,
							mode: interactionType,
							external: (context: any) => {
								// Hide completely while selecting a range
								if (dragRef.current.active) {
									const id = 'blue-orange-chart-line-js-tooltip-' + uuid;
									const el = document.getElementById(id);
									if (el) el.style.opacity = '0';
									return;
								}

								let tooltipEl = document.getElementById('blue-orange-chart-line-js-tooltip-' + uuid);
								if (!tooltipEl) {
									tooltipEl = document.createElement('div');
									tooltipEl.id = 'blue-orange-chart-line-js-tooltip-' + uuid;
									tooltipEl.className = 'blue-orange-chart-line-tooltip';
									const tooltipBody = document.createElement('div');
									tooltipBody.id = 'blue-orange-chart-line-js-tooltip-body-' + uuid;
									tooltipBody.className = 'blue-orange-chart-line-tooltip-body';
									tooltipEl.appendChild(tooltipBody);
									document.body.appendChild(tooltipEl);
								}

								const tooltipModel = context.tooltip;

								// Hide if Chart.js says hidden
								if (tooltipModel.opacity === 0) {
									tooltipEl.style.opacity = '0';
									return;
								}

								// Build content
								const getBody = (b: any) => b.lines;
								if (tooltipModel.body) {
									const bodyLines = tooltipModel.body.map(getBody);
									const selectedDataPoints = tooltipModel.dataPoints;

									const toolTipDatasets = document.createElement("div");
									toolTipDatasets.className = "blue-orange-charts-line-dataset-container";

									for (let dataPoint of selectedDataPoints) {
										const dataset = dataPoint.dataset;
										const borderColor = dataset.borderColor;
										const backgroundColor = dataset.backgroundColor;
										const formattedValue = dataPoint.formattedValue;
										const datasetLabel = dataset.label;

										const row = document.createElement("div");
										row.className = "blue-orange-charts-line-dataset-row";

										const dot = document.createElement('div');
										dot.style.height = "10px";
										dot.style.width = "10px";
										dot.style.borderRadius = "50%";
										dot.style.border = "2px solid " + borderColor;
										dot.style.backgroundColor = backgroundColor;
										dot.style.marginRight = "15px";

										const val = document.createElement('div');
										val.className = "blue-orange-chart-line-tooltip-value";
										val.innerHTML = "<span class='blue-orange-chart-line-tooltip-dataset-label'>" + datasetLabel + ":</span>" + formattedValue;

										row.appendChild(dot);
										row.appendChild(val);
										toolTipDatasets.appendChild(row);
									}

									const chartTooltipBody = document.getElementById('blue-orange-chart-line-js-tooltip-body-' + uuid) as HTMLElement;
									chartTooltipBody.innerHTML = "";
									chartTooltipBody.appendChild(toolTipDatasets);
								}

								// Positioning (viewport-clamped, near the point)
								const position = context.chart.canvas.getBoundingClientRect();
								const ptX = position.left + window.scrollX + tooltipModel.caretX;
								const ptY = position.top + window.scrollY + tooltipModel.caretY;

								// make visible to measure
								tooltipEl.style.opacity = '1';
								tooltipEl.style.position = 'absolute';
								tooltipEl.style.left = '0px';
								tooltipEl.style.top = '0px';

								// Measure
								const bounds = tooltipEl.getBoundingClientRect();
								const tw = bounds.width;
								const th = bounds.height;

								const vw = document.documentElement.clientWidth;
								const vh = document.documentElement.clientHeight;
								const sx = window.scrollX;
								const sy = window.scrollY;

								const PAD = 8;     // keep a small padding from viewport edges
								const OFFSET = 12; // gap from the anchor point

								// Horizontal: prefer right of the point, fall back to left, then clamp
								let left = ptX + OFFSET;
								if (left + tw > sx + vw - PAD) {
									// try left side of the point
									const leftAlt = ptX - tw - OFFSET;
									left = (leftAlt >= sx + PAD) ? leftAlt : Math.max(sx + PAD, Math.min(ptX - tw / 2, sx + vw - tw - PAD));
								}
								// Vertical: below if in top half; above if in bottom half—then clamp
								const inBottomHalf = (ptY - sy) > (vh / 2);
								let top = inBottomHalf ? (ptY - th - OFFSET) : (ptY + OFFSET);
								// clamp vertically
								if (top < sy + PAD) top = sy + PAD;
								if (top + th > sy + vh - PAD) top = sy + vh - th - PAD;

								tooltipEl.style.left = `${left}px`;
								tooltipEl.style.top  = `${top}px`;
								tooltipEl.style.pointerEvents = 'none';
							}
						}
					},
					elements: {
						line: { tension: tension },
						point: { radius: 0 }
					},
					scales: {
						y: {
							type: yScale,
							title: { display: yLabel != undefined, text: yLabel },
							grid: { display: gridLines },
							ticks: { display: true }
						},
						x: {
							title: { display: xLabel != undefined, text: xLabel },
							// Default to a category axis so string labels (e.g. dates) render
							// on the x-axis. Only a real time scale needs the `time` option.
							type: xScale ? xScale : "category",
							...((xScale === "time" || xScale === "timeseries") ? { time: { unit: xScaleTimeUnit } } : {}),
							grid: { display: gridLines },
							ticks: { display: true }
						}
					},
					interaction: {
						intersect: false,
						mode: interactionType,
					}
				},
				plugins: [htmlLegendPlugin, selectionOverlayPlugin] // <-- added
			};

			chartInstanceRef.current = new Chart((ctx as CanvasRenderingContext2D), config);

			// Attach pointer listeners (NEW)
			const canvas = chartInstanceRef.current.canvas as HTMLCanvasElement;
			canvas.addEventListener('pointerdown', onPointerDown);
			canvas.addEventListener('pointermove', onPointerMove);
			canvas.addEventListener('pointerup', onPointerUp);
			canvas.addEventListener('pointercancel', onPointerCancel);
			canvas.addEventListener('dblclick', onDblClick);
			window.addEventListener('keydown', onKeyDown);

			initTimeout = setTimeout(() => {
				initRef.current = true;
				updateChartData();
			}, animationTimeout)

			// Cleanup
			return () => {
				clearTimeout(initTimeout);
				if (chartInstanceRef.current) {
					const c = chartInstanceRef.current.canvas as HTMLCanvasElement;
					c.removeEventListener('pointerdown', onPointerDown);
					c.removeEventListener('pointermove', onPointerMove);
					c.removeEventListener('pointerup', onPointerUp);
					c.removeEventListener('pointercancel', onPointerCancel);
					c.removeEventListener('dblclick', onDblClick);
					window.removeEventListener('keydown', onKeyDown);
					chartInstanceRef.current.destroy();
					chartInstanceRef.current = null;
				}
			};
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		updateChartData();
	}, [dataset, labels]);

	return (
		<div className="blue-orange-line-chart-cont" style={{ height: height, width: width }}>
			{legend && legendPosition == LegendPosition.TOP && <div id={uuid} className="blue-orange-line-chart-legend-cont"></div>}
			<canvas ref={chartRef} />
			{legend && legendPosition == LegendPosition.BOTTOM && <div id={uuid} className="blue-orange-line-chart-legend-cont"></div>}
			{legend && legendPosition != LegendPosition.BOTTOM && legendPosition != LegendPosition.TOP && <div id={uuid} style={legendStyle} className="blue-orange-line-chart-floating-legend-cont"></div>}
		</div>
	)
}

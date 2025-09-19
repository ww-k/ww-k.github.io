import "https://s4.zstatic.net/npm/echarts@5.3.3/dist/echarts.min.js";
import simpleQueueRun from "https://s4.zstatic.net/npm/simple-queue-run@1.0.1/simple_queue_run.js";

import { generateDataApi } from "./generate_data_api.js";
import { indicatorConfigRecord } from "./indicator_config_records.js";
import { simplify } from "./simplify.js";

function mockRequest(start, end) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(generateDataApi(start, end));
        }, 500);
    });
}

async function requestData(startTime, endTime) {
    const stepTime = 3000;
    /**
     * 每个请求的时间跨度的毫秒值。
     * 由于Prometheus每次只能请求大概10000条数据，step的时间单位为s, sliceTime最大值公式如下：
     * pageTime = (一次请求的数据条数 - 1) * stepTime;
     * 一次请求的数据条数 < 10000
     */
    const pageTime = 9999 * stepTime;
    const pageNum = Math.max(
        1,
        Math.ceil((endTime - startTime) / (pageTime + 0.5 * stepTime)),
    );
    const responses = [];
    const requestTasks = Array.from({ length: pageNum }, (_, i) => {
        const start = startTime + i * pageTime + +i * stepTime;
        const end = Math.min(start + pageTime, endTime);
        return async () => {
            const response = await mockRequest(start, end);
            responses.push(response);
        };
    });

    await simpleQueueRun(requestTasks);

    return responses;
}

function tooltipValueFormatter(value) {
    if (typeof value === "number") {
        return Math.abs(value).toFixed(2);
    }
    return "";
}

function processData(response, nodesSet, tempMap, yAxisMax, sampling) {
    response.forEach((item) => {
        const nodename = item.metric.instance;
        const indicatorKey = item.metric.type;
        if (!nodesSet.has(nodename)) {
            nodesSet.add(nodename);
            if (!tempMap[nodename]) {
                tempMap[nodename] = {};
            }
        }

        const nodeSerieMap = tempMap[nodename];
        const config = indicatorConfigRecord[indicatorKey];

        const max = Math.ceil(item.values.reduce(config.valueProcessor, 0));

        yAxisMax = Math.max(max, yAxisMax);

        let values = item.values;
        if (sampling) {
            values = simplify(values, 0.5);
        }

        let serieItem = nodeSerieMap[indicatorKey];
        if (!serieItem) {
            serieItem = {
                name: config.title,
                data: values,
            };
            nodeSerieMap[indicatorKey] = serieItem;
        } else {
            serieItem.data = serieItem.data.concat(values);
        }
    });

    return yAxisMax;
}

function processDatas(responses, nodesSet, tempMap, yAxisMax, sampling) {
    responses.forEach((response) => {
        yAxisMax = processData(response, nodesSet, tempMap, yAxisMax, sampling);
    });

    return {
        nodes: Array.from(nodesSet),
        tempMap,
        yAxisMax,
    };
}

async function generateEchartsOption(nodes, tempMap, yAxisMax) {
    const option = {
        aria: {
            enabled: false,
        },
        legend: {
            animation: false,
            type: "scroll",
            show: true,
            bottom: 55,
            itemStyle: {
                opacity: 0,
            },
        },
        grid: [],
        xAxis: [],
        yAxis: [],
        series: [],
        tooltip: {
            trigger: "axis",
            valueFormatter: tooltipValueFormatter,
        },
        dataZoom: [
            {
                type: "slider",
                xAxisIndex: [],
                start: 0,
                end: 100,
            },
        ],
    };

    const grid = option.grid;
    const xAxis = option.xAxis;
    const yAxis = option.yAxis;
    const series = option.series;
    const dataZoom = option.dataZoom[0];

    const itemPercent = 1 / nodes.length;
    const top = 10;
    const bottom = 100;
    const padding = 40;
    const gridHeight = 600 - top - bottom;
    const itemHeight = Math.ceil(gridHeight * itemPercent);

    nodes.forEach((nodename, nodeIndex) => {
        grid.push({
            left: 50,
            right: 40,
            top: nodeIndex * itemHeight + top,
            height: itemHeight - padding,
        });

        xAxis.push({
            gridIndex: nodeIndex,
            type: "time",
            position: "bottom",
            axisLine: { show: true, onZero: false },
            axisTick: { show: true },
            axisLabel: { show: true },
        });
        dataZoom.xAxisIndex.push(nodeIndex);

        yAxis.push({
            gridIndex: nodeIndex,
            min: 0,
            max: yAxisMax,
            axisLine: { show: true },
            axisTick: { show: true },
            axisLabel: { show: true },
        });

        const nodeSerieMap = tempMap[nodename];

        Object.keys(indicatorConfigRecord).forEach((indicatorKey) => {
            const serieItem = nodeSerieMap[indicatorKey];
            if (!serieItem) return;

            series.push({
                name: serieItem.name,
                data: serieItem.data || [],
                type: "line",
                showSymbol: false,
                xAxisIndex: nodeIndex,
                yAxisIndex: nodeIndex,
            });
        });
    });

    return option;
}

export async function render(chart, sampling = false) {
    if (!chart) return;

    let option;
    let nodes;
    const nodesSet = new Set();
    const tempMap = {};
    let yAxisMax = 100;
    const endTime = Date.now();
    const startTime = endTime - 3600 * 1000 * 24 * 3; //过去3天
    let lastEndTime = endTime;

    async function renderChart() {
        console.time("total render");
        console.time("requestData");
        const responses = await requestData(startTime, lastEndTime);
        console.timeEnd("requestData");

        console.time("processData");
        const data = processDatas(
            responses,
            nodesSet,
            tempMap,
            yAxisMax,
            sampling,
        );
        nodes = data.nodes;
        yAxisMax = data.yAxisMax;
        console.timeEnd("processData");

        console.time("generateEchartsOption");
        option = await generateEchartsOption(nodes, tempMap, yAxisMax);
        console.timeEnd("generateEchartsOption");

        console.time("setOption");
        chart.setOption(option);
        console.timeEnd("setOption");
        console.timeEnd("total render");
    }

    async function updateChart() {
        console.time("total render");
        console.time("requestData");
        lastEndTime = lastEndTime + 3000;
        const response = await mockRequest(lastEndTime, lastEndTime);
        console.timeEnd("requestData");

        console.time("processData");
        yAxisMax = processData(response, nodesSet, tempMap, yAxisMax, sampling);
        console.timeEnd("processData");

        console.time("generateEchartsOption");
        option = await generateEchartsOption(nodes, tempMap, yAxisMax);
        console.timeEnd("generateEchartsOption");

        console.time("setOption");
        chart.setOption(option, true);
        console.timeEnd("setOption");
        console.timeEnd("total render");
    }

    function loopTimeoutUpdate() {
        setTimeout(async () => {
            await updateChart();
            loopTimeoutUpdate();
        }, 3000);
    }

    await renderChart();
    loopTimeoutUpdate();
}

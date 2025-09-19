// 为Web Worker环境提供必要的全局对象
if (typeof global === "undefined") {
    self.global = self;
}
if (typeof window === "undefined") {
    self.window = self;
}

import "https://s4.zstatic.net/npm/echarts@5.3.3/dist/echarts.min.js";

import { render } from "./render.js";

(async function main() {
    let chart;

    function intervalUpdateMonitor() {
        setInterval(() => {
            postMessage({
                type: "updateMonitor",
                data: Math.random().toString().slice(-5),
            });
        }, 300);
    }

    async function init(config) {
        const sampling = new URL(import.meta.url).searchParams.has("sampling");
        intervalUpdateMonitor();
        chart = echarts.init(config.canvas, null, {
            width: config.width,
            height: config.height,
            renderer: "canvas",
        });
        await render(chart, sampling);
        postMessage({ type: "initSuccess" });
    }

    // biome-ignore lint/complexity/useArrowFunction: false
    self.onmessage = function (e) {
        const { type, data } = e.data;

        switch (type) {
            case "setCanvas":
                init(data);
                break;
            case "event": // Generic event proxy
                if (chart) {
                    // Mock a DOM event object that ECharts' ZRender can understand
                    const event = {
                        zrX: data.x,
                        zrY: data.y,
                        preventDefault: () => {},
                        stopImmediatePropagation: () => {},
                        stopPropagation: () => {},
                        ...data,
                    };
                    const zr = chart.getZr();
                    if (zr) {
                        zr.handler.dispatch(data.type, event);
                    }
                }
                break;
        }
    };
})();

import { render } from "./render.js";

// biome-ignore lint/complexity/useArrowFunction: false
document.addEventListener("DOMContentLoaded", async function () {
    const chart = echarts.init(document.getElementById("chart"));
    const loadingEl = document.getElementById("loading");

    function intervalUpdateMonitor() {
        const monitorEl = document.getElementById("monitor");
        setInterval(() => {
            const memory = performance.memory;

            monitorEl.innerText = `JSHeapSize: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB. \n Main thread lag check: ${Math.random().toString().slice(-5)}`;
        }, 300);
    }

    intervalUpdateMonitor();

    await render(chart);
    loadingEl.style.display = "none";
});

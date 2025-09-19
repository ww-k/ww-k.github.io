/** biome-ignore-all lint/complexity/useArrowFunction: false */
document.addEventListener("DOMContentLoaded", async function () {
    const loadingEl = document.getElementById("loading");

    let workerLagNumber = "";
    const monitorEl = document.getElementById("monitor");
    const workerMonitorEl = document.getElementById("workerMonitor");
    function intervalUpdateMonitor() {
        setInterval(() => {
            const memory = performance.memory;

            monitorEl.innerText = `M a i n thread JSHeapSize: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB. \n M a i n thread lag check: ${Math.random().toString().slice(-5)}`;
            workerMonitorEl.innerText = `Worker thread lag check: ${workerLagNumber}`;
        }, 300);
    }

    let worker = null;

    function initWorker() {
        const url = new URL(import.meta.url);
        worker = new Worker(`./offscreen.worker.js${url.search}`, {
            type: "module",
        });

        worker.onmessage = function (e) {
            const { type, data } = e.data;
            switch (type) {
                case "initSuccess":
                    loadingEl.style.display = "none";
                    setupEventHandlers();
                    break;
                case "updateMonitor":
                    workerLagNumber = data;
                    //updateWorkerMonitor(data);
                    break;
            }
        };

        const canvasEl = document
            .getElementById("chart")
            .querySelector("canvas");
        const offscreenCanvas = canvasEl.transferControlToOffscreen();
        worker.postMessage(
            {
                type: "setCanvas",
                data: {
                    canvas: offscreenCanvas,
                    width: canvasEl.clientWidth,
                    height: canvasEl.clientHeight,
                },
            },
            [offscreenCanvas],
        );
    }

    function setupEventHandlers() {
        const canvasEl = document
            .getElementById("chart")
            .querySelector("canvas");

        const eventsToProxy = [
            "click",
            "mousemove",
            "mousedown",
            "mouseup",
            "mouseout",
            "wheel",
        ];

        eventsToProxy.forEach((eventType) => {
            canvasEl.addEventListener(
                eventType,
                (e) => {
                    if (!worker) return;
                    if (eventType === "wheel") e.preventDefault();

                    const x = e.offsetX;
                    const y = e.offsetY;

                    worker.postMessage({
                        type: "event",
                        data: {
                            type: eventType,
                            x: x,
                            y: y,
                            deltaX: e.deltaX,
                            deltaY: e.deltaY,
                            button: e.button,
                        },
                    });
                },
                { passive: eventType !== "wheel" },
            );
        });
    }

    intervalUpdateMonitor();
    initWorker();
});

# 大量数据折线图的性能优化

发布于 2026-09-19 17:33

## 背景

在公司项目中，echarts二个折线图，需要渲染20个图例，每个图例86400条数据，后续每3秒新增一条数据。界面渲染慢，卡顿明显。

- 测试机: macbook m1 pro 16G
- echarts版本：5.3.3
- 第一次界面渲染时间约 2000 ms
- 内存占用：2GB，通过浏览器任务管理器查看
- CPU：每3s达130%，通过浏览器任务管理器查看
- 每隔3秒，界面卡顿明显

### Demo 展示
- <a href="./slow.html" target="_blank" rel="noopener noreferrer">Slow Echarts</a>

### 原因分析

1. 初始数据量大，请求耗时叠加渲染数据耗时，导致首次界面渲染时间过长
2. 后续的更新渲染，`echart.setOption()` 方法都需要耗时1.5s，导致每3秒界面卡顿明显
3. 渲染数据过大，导致echarts内存占用高，CPU占用高

### 优化思路

1. 离屏渲染: 在Worker中渲染，释放主线程压力
2. 数据采样: 对数据进行采样处理, 减少渲染数据量，减少渲染压力，减少内存占用
3. 流式更新: 小量多次的更新渲染，减少首次界面渲染时间

## 离屏渲染

### 技术要点

- 通过 <a href="https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen" target="_blank" rel="noopener noreferrer">HTMLCanvasElement.transferControlToOffscreen()</a> 将 <a href="https://developer.mozilla.org/zh-CN/docs/Web/API/OffscreenCanvas" target="_blank" rel="noopener noreferrer">OffscreenCanvas</a> 对象传递给Worker线程
- echarts使用`OffscreenCanvas`初始化
```
echarts.init(offscreenCanvas, null, {
    width: "800",
    height: "600",
    renderer: "canvas",
});
```

### 测试结果

- 主线程不卡顿了，但是Worker线程依然卡顿
- 内存占用和CPU占用都没有改善
- 如果不和chart交互，那么也算满足需求了，但是我需要与chart交互，那么继续优化

### Demo 展示
- <a href="./offscreen.html" target="_blank" rel="noopener noreferrer">OffscreenCanvas</a>

## 数据采样

数据采样的算法很多，经过一番研究，结合我的需求，最后我选择了[simplify](https://www.npmjs.com/package/simplify)这个库。
这个库的结合了[Douglas-Peucker](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)和 Radial Distance 算法。
能尽量保持图形的轮廓。

### 测试结果
- 第一次界面渲染时间约 1486 ms
- 内存占用：100MB，通过浏览器任务管理器查看
- CPU：每3s达12%，通过浏览器任务管理器查看
- 无卡顿

### Demo 展示
- <a href="./offscreen_sampling.html" target="_blank" rel="noopener noreferrer">OffscreenCanvas and Sampling</a>

## 流式更新

每次请求回一段数据，就立即更新echarts，这样就能大幅降低首次渲染的时间，但是渲染完所有数据的时间基本不变。
这里就没有什么技术难点了，只是有些复杂，就不提供测试结果和demo展示了。
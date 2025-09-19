function mbValuesProcess(curMax, item) {
    // 秒数到时间值转为毫秒
    item[0] *= 1000;
    // 单位由Byte转换为MB
    item[1] = parseInt(item[1], 10) / 1048576;
    return Math.max(curMax, item[1]);
}

export const indicatorConfigRecord = {
    indicator1: {
        title: "serie-1",
        valueProcessor: mbValuesProcess,
    },
    indicator2: {
        title: "serie-2",
        valueProcessor: mbValuesProcess,
    },
    indicator3: {
        title: "serie-3",
        valueProcessor: mbValuesProcess,
    },
    indicator4: {
        title: "serie-4",
        valueProcessor: mbValuesProcess,
    },
    indicator5: {
        title: "serie-5",
        valueProcessor: mbValuesProcess,
    },
    indicator6: {
        title: "serie-6",
        valueProcessor: mbValuesProcess,
    },
    indicator7: {
        title: "serie-7",
        valueProcessor: mbValuesProcess,
    },
    indicator8: {
        title: "serie-8",
        valueProcessor: mbValuesProcess,
    },
    indicator9: {
        title: "serie-9",
        valueProcessor: mbValuesProcess,
    },
    indicator10: {
        title: "serie-10",
        valueProcessor: mbValuesProcess,
    },
};

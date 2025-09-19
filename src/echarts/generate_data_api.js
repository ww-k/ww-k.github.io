/** biome-ignore-all lint/complexity/useArrowFunction: ignore */
/// 100MB 常量
const mb100 = 100 * 1024 * 1024;

// 优化的生成器（预计算系数）
class OptimizedHexagonWaveGenerator {
    constructor(N, options = {}) {
        this.N = N;
        this.options = {
            amplitude: options.amplitude || 1,
            frequency: options.frequency || 1,
            nTerms: options.nTerms || 20,
            phase: options.phase || 0,
            symmetry: options.symmetry || 6,
        };

        // 预计算傅里叶系数
        this.coefficients = this.precomputeCoefficients();
    }

    precomputeCoefficients() {
        const coefficients = [];
        for (let n = 1; n <= this.options.nTerms; n++) {
            if (n % 2 === 1) {
                const coeff =
                    (12 / (Math.PI * Math.PI * n * n)) *
                    Math.sin((n * Math.PI) / 3);
                coefficients.push({ n, coeff });
            }
        }
        return coefficients;
    }

    generateSample(I) {
        const t = I / this.N;
        const actualTime =
            (t * this.options.frequency * this.options.symmetry +
                this.options.phase) %
            this.options.symmetry;

        let result = 0;
        for (const { n, coeff } of this.coefficients) {
            result +=
                coeff *
                Math.sin(
                    (2 * Math.PI * n * actualTime) / this.options.symmetry,
                );
        }

        return this.options.amplitude * result;
    }

    generateAllSamples() {
        const samples = [];
        for (let I = 0; I < this.N; I++) {
            samples.push(this.generateSample(I));
        }
        return samples;
    }
}

export function generateDataApi(start, end) {
    const step = 3; //seconds
    const startTime = Math.floor(new Date(start).valueOf() / 1000);
    const endTime = Math.floor(new Date(end).valueOf() / 1000);
    const step2 = parseInt(step, 10);

    const nodes = ["node1", "node2"];
    const indicators = [
        [
            "indicator1",
            function (val) {
                return (val * mb100 * 0.4 + mb100).toString();
            },
        ],
        [
            "indicator2",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 2).toString();
            },
        ],
        [
            "indicator3",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 3).toString();
            },
        ],
        [
            "indicator4",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 4).toString();
            },
        ],
        [
            "indicator5",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 5).toString();
            },
        ],
        [
            "indicator6",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 6).toString();
            },
        ],
        [
            "indicator7",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 7).toString();
            },
        ],
        [
            "indicator8",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 8).toString();
            },
        ],
        [
            "indicator9",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 9).toString();
            },
        ],
        [
            "indicator10",
            function (val) {
                return (val * mb100 * 0.4 + mb100 * 10).toString();
            },
        ],
    ];

    const valuesLen = Math.floor((endTime - startTime) / step2) + 1;
    // 使用优化生成器（适合大量样本）
    const generator = new OptimizedHexagonWaveGenerator(valuesLen, {
        // 波形振幅（默认：1）
        amplitude: 1,
        // 频率，表示在N个样本中包含的完整周期数（默认：1）
        frequency: Math.min(3, Math.ceil(valuesLen / 6)),
        // 傅里叶级数项数，越多越精确但计算越慢（默认：20）
        nTerms: 20,
        // 相位偏移（0-1）
        phase: 0,
        // 对称性，6为六边形波（默认：6）
        symmetry: 6,
    });

    const list = [];
    indicators.forEach((indicator) => {
        nodes.forEach((node) => {
            const values = [];
            list.push({
                metric: {
                    type: indicator[0],
                    instance: node,
                },
                values,
            });
            for (
                let curTime = startTime, i = 0;
                curTime <= endTime;
                curTime += step2, i++
            ) {
                values.push([
                    curTime,
                    indicator[1](generator.generateSample(i)),
                ]);
            }
        });
    });
    return list;
}

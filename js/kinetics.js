/**
 * kinetics.js
 * Modelo físico-químico riguroso de la hidrólisis ácida de la sacarosa
 * seguida por polarimetría (Arreglo de Laurent).
 * Basado en la Guía de TP: Cinética Química por Polarimetría (CP_20181112).
 */

window.Kinetics = (function () {
  // Parámetros constantes del TP
  const PARAMS = {
    polarimeterName: 'Polarímetro de Media Sombra de Laurent (LED Na 589.3 nm)',
    temperatureC: 20.0,
    cellLengthDm: 1.0, // 10 cm = 1.0 dm
    sucroseStockPercent: 40.0, // 40 % p/v
    sucroseMixPercent: 20.0,   // 20 % p/v en mezcla 1:1 (0.20 g/mL = 0.584 M)
    sucroseMixMolar: 0.584,
    specificRotation: {
      sucrose: +66.37,  // grado · dm^-1 · cm^3 · g^-1
      glucose: +52.70,
      fructose: -92.00
    },
    alpha0Theoretical: +13.28, // +66.37 * 1.0 dm * 0.20 g/cm3 = +13.274°
    alphaInfTheoretical: -3.85 // Valor asintótico de inversión completa
  };

  // Configuraciones según la concentración de HCl elegida al inicio
  const ACID_CONFIGS = {
    '3M': {
      id: '3M',
      label: 'HCl 3.0 M',
      stockMolar: 3.0,
      mixMolar: 1.5, // diluido 1:1 (25 mL sacarosa + 25 mL HCl 3M)
      kReal: 5.15e-4, // s^-1 (t_1/2 ≈ 22.4 min, cruce por cero ≈ 48 min)
      // 20 puntos experimentales (en segundos de cronómetro) hasta 100 minutos
      timePointsSec: [
        120, 240, 360, 480, 600,
        780, 960, 1140, 1380, 1620,
        1920, 2220, 2520, 2880, 3300,
        3720, 4200, 4740, 5340, 6000
      ]
    },
    '6M': {
      id: '6M',
      label: 'HCl 6.0 M',
      stockMolar: 6.0,
      mixMolar: 3.0, // diluido 1:1 (25 mL sacarosa + 25 mL HCl 6M)
      kReal: 1.06e-3, // s^-1 (t_1/2 ≈ 10.9 min, cruce por cero ≈ 23.5 min)
      // 20 puntos experimentales a intervalos más cortos (hasta 50 minutos)
      timePointsSec: [
        60, 120, 180, 240, 330,
        420, 510, 600, 720, 840,
        960, 1140, 1320, 1500, 1680,
        1920, 2160, 2400, 2700, 3000
      ]
    }
  };

  // Generador gaussiano Box-Muller acotado
  function gaussianNoise(sigma = 0.025, maxAbs = 0.05) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const val = z * sigma;
    return Math.max(-maxAbs, Math.min(maxAbs, val));
  }

  return {
    getParams: function () {
      return PARAMS;
    },

    getAcidConfig: function (acidId) {
      return ACID_CONFIGS[acidId] || ACID_CONFIGS['3M'];
    },

    /**
     * Calcula el ángulo alpha_t dado un tiempo corregido de reacción tCorrSec
     */
    computeAlphaAtTime: function (acidId, tCorrSec, alpha0Used, alphaInfUsed, withNoise = true) {
      const cfg = this.getAcidConfig(acidId);
      const a0 = alpha0Used !== undefined ? alpha0Used : PARAMS.alpha0Theoretical;
      const aInf = alphaInfUsed !== undefined ? alphaInfUsed : PARAMS.alphaInfTheoretical;

      const expTerm = Math.exp(-cfg.kReal * Math.max(0, tCorrSec));
      const exactAlpha = aInf + (a0 - aInf) * expTerm;

      if (!withNoise) {
        return Number(exactAlpha.toFixed(2));
      }

      // Ruido instrumental realista (~1-2 divisiones del Vernier)
      const scale = Math.max(0.30, expTerm);
      const noise = gaussianNoise(0.09 * scale, 0.16 * scale);
      let noisyAlpha = exactAlpha + noise;

      // Garantizar que alpha_t > alpha_inf + 0.12 para evitar argumentos negativos en ln()
      if (noisyAlpha <= aInf + 0.12) {
        noisyAlpha = aInf + 0.12 + Math.abs(gaussianNoise(0.01, 0.02));
      }

      return Number(noisyAlpha.toFixed(2));
    },

    /**
     * Calcula las magnitudes derivadas de la tabla de la guía (pág. 6):
     * - (1 - x) = (alpha_inf - alpha_t) / (alpha_inf - alpha_0)
     * - x = 1 - (1 - x)
     * - ln((alpha_inf - alpha_t) / (alpha_inf - alpha_0))
     */
    computeRowMetrics: function (tCronSec, deltaTmSec, alphaT, alpha0, alphaInf) {
      const t0Correction = deltaTmSec / 2.0;
      const tCorrSec = Math.max(1, tCronSec - t0Correction);

      const ratio = (alphaInf - alphaT) / (alphaInf - alpha0);
      const safeRatio = Math.max(1e-4, Math.min(0.9999, ratio));
      const oneMinusX = safeRatio;
      const x = 1.0 - oneMinusX;
      const lnTerm = Math.log(safeRatio);

      return {
        tCronSec: Number(tCronSec.toFixed(1)),
        tCorrSec: Number(tCorrSec.toFixed(2)),
        alphaT: Number(alphaT.toFixed(2)),
        lnTerm: Number(lnTerm.toFixed(4)),
        x: Number(x.toFixed(4)),
        oneMinusX: Number(oneMinusX.toFixed(4))
      };
    },

    /**
     * Regresión lineal por cuadrados mínimos de y = ln((a_inf - a_t)/(a_inf - a_0)) vs x = t_corr
     * Pendiente m = -k
     */
    computeLinearRegression: function (dataRows) {
      const n = dataRows.length;
      if (n < 2) {
        return { k: 0, slope: 0, intercept: 0, r2: 1, tHalfSec: 0, tHalfMin: 0 };
      }

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
      for (let i = 0; i < n; i++) {
        const x = dataRows[i].tCorrSec;
        const y = dataRows[i].lnTerm;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
        sumYY += y * y;
      }

      const denom = n * sumXX - sumX * sumX;
      const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
      const intercept = (sumY - slope * sumX) / n;

      // Coeficiente de determinación R^2
      const ssTot = sumYY - (sumY * sumY) / n;
      let ssRes = 0;
      for (let i = 0; i < n; i++) {
        const yPred = slope * dataRows[i].tCorrSec + intercept;
        const diff = dataRows[i].lnTerm - yPred;
        ssRes += diff * diff;
      }
      const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

      const k = Math.abs(slope);
      const tHalfSec = k > 0 ? Math.LN2 / k : 0;

      return {
        k: k,
        slope: slope,
        intercept: intercept,
        r2: r2,
        tHalfSec: tHalfSec,
        tHalfMin: tHalfSec / 60.0
      };
    }
  };
})();

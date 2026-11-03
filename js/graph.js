/**
 * graph.js
 * Dibuja en el Canvas del juego los dos gráficos de visualización previa
 * descriptos en la página 6 de la guía del TP (CP_20181112):
 *
 * - Modo 'x_curves' (Gráfico II): x y (1 - x) en función del tiempo t (s),
 *   destacando el cruce en 0.50 para visualizar el tiempo de vida media (t_1/2).
 * - Modo 'ln_linear' (Gráfico I): ln((alpha_inf - alpha_t) / (alpha_inf - alpha_0))
 *   en función del tiempo t (s), con la recta de regresión lineal y pendiente -k.
 *
 * (Solo visualización in-game; no se exporta imagen).
 */

window.GraphRenderer = (function () {
  function drawSummaryBox(ctx, w, padL, padT, plotW, plotH, state, reg, acidCfg) {
    const boxX = padL + plotW + 18;
    const boxW = w - boxX - 16;

    ctx.fillStyle = '#181e2c';
    ctx.fillRect(boxX, padT, boxW, plotH);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, padT, boxW, plotH);

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RESUMEN EXPERIMENTAL:', boxX + 12, padT + 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText(`• Ácido:    ${acidCfg.label}`, boxX + 12, padT + 42);
    ctx.fillText(`• [HCl]ef:  ${acidCfg.mixMolar.toFixed(2)} M`, boxX + 12, padT + 59);
    ctx.fillText(`• Δt_m:     ${state.deltaTmSec.toFixed(2)} s`, boxX + 12, padT + 76);
    ctx.fillText(`• α₀:       +${state.alpha0Measured.toFixed(2)}°`, boxX + 12, padT + 93);
    ctx.fillText(`• α_∞:      ${state.alphaInfMeasured.toFixed(2)}°`, boxX + 12, padT + 110);

    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`• k ≈ ${reg.k.toExponential(3)} s⁻¹`, boxX + 12, padT + 134);
    ctx.fillText(`• t₁/₂ ≈ ${reg.tHalfMin.toFixed(1)} min (${Math.round(reg.tHalfSec)}s)`, boxX + 12, padT + 151);

    if (state.graphMode === 'x_curves') {
      // Leyenda de colores para x y (1-x)
      ctx.fillStyle = '#06d6a0';
      ctx.fillText('■ x (frac. descomp.)', boxX + 12, padT + 172);
      ctx.fillStyle = '#7bdff2';
      ctx.fillText('■ 1-x (sacarosa rem.)', boxX + 12, padT + 188);
    } else {
      ctx.fillStyle = '#7bdff2';
      ctx.fillText(`• R² = ${reg.r2.toFixed(4)}`, boxX + 12, padT + 172);
      ctx.fillStyle = '#ff5964';
      ctx.fillText('― Ajuste lineal (-k·t)', boxX + 12, padT + 188);
    }
  }

  /**
   * GRÁFICO II: x y (1-x) en función del tiempo t (s)
   */
  function renderXCurvesPlot(ctx, w, h, state, rows, reg, acidCfg) {
    // Título superior
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(16, 10, w - 32, 30);
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 10, w - 32, 30);

    ctx.fillStyle = '#7bdff2';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `GRÁFICO II (VISTA PREVIA): x y (1 - x) vs t  [${acidCfg.label}]`,
      w / 2,
      29
    );

    const padL = 68;
    const padT = 54;
    const plotW = 415;
    const plotH = 195;

    ctx.fillStyle = '#0c101a';
    ctx.fillRect(padL, padT, plotW, plotH);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(padL, padT, plotW, plotH);

    if (rows.length === 0) return;

    const maxT = Math.max(...rows.map(r => r.tCorrSec), 100) * 1.04;

    function toX(t) {
      return padL + (t / maxT) * plotW;
    }
    function toY(val) {
      // val entre 0.0 y 1.0
      return padT + (1.0 - val) * plotH;
    }

    // Grilla horizontal (0.0 a 1.0) y vertical
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px monospace';

    for (let i = 0; i <= 4; i++) {
      const yVal = 1.0 - i * 0.25;
      const py = toY(yVal);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(2), padL - 6, py + 3);
    }

    for (let j = 0; j <= 4; j++) {
      const tVal = (j / 4) * maxT;
      const px = toX(tVal);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(tVal)}s`, px, padT + plotH + 15);
    }

    // Línea punteada en y = 0.50 e intersección de t_1/2
    if (reg.tHalfSec > 0 && reg.tHalfSec <= maxT) {
      const pxHalf = toX(reg.tHalfSec);
      const pyHalf = toY(0.5);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.65)';
      ctx.lineWidth = 1.5;

      // Horizontal en 0.5
      ctx.beginPath();
      ctx.moveTo(padL, pyHalf);
      ctx.lineTo(pxHalf, pyHalf);
      ctx.stroke();

      // Vertical hacia t_1/2
      ctx.beginPath();
      ctx.moveTo(pxHalf, pyHalf);
      ctx.lineTo(pxHalf, padT + plotH);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`t₁/₂ ≈ ${Math.round(reg.tHalfSec)}s`, pxHalf + 5, pyHalf - 6);
    }

    // Títulos de ejes
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tiempo corregido t (s)', padL + plotW / 2, padT + plotH + 32);

    ctx.save();
    ctx.translate(18, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Fracción x  y  (1 - x)', 0, 0);
    ctx.restore();

    // Construir lista de puntos incluyendo t = 0
    const allPts = [{ tCorrSec: 0, x: 0, oneMinusX: 1 }].concat(rows);

    // Curva de x (creciente de 0 a 1) en verde esmeralda
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    allPts.forEach((pt, idx) => {
      const px = toX(pt.tCorrSec);
      const py = toY(pt.x);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Curva de (1 - x) (decreciente de 1 a 0) en cian
    ctx.strokeStyle = '#7bdff2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    allPts.forEach((pt, idx) => {
      const px = toX(pt.tCorrSec);
      const py = toY(pt.oneMinusX);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Puntos experimentales sobre ambas curvas
    allPts.forEach(pt => {
      const px = toX(pt.tCorrSec);

      // Punto x
      ctx.fillStyle = '#06d6a0';
      ctx.beginPath();
      ctx.arc(px, toY(pt.x), 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Punto 1-x
      ctx.fillStyle = '#7bdff2';
      ctx.beginPath();
      ctx.arc(px, toY(pt.oneMinusX), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    drawSummaryBox(ctx, w, padL, padT, plotW, plotH, state, reg, acidCfg);
  }

  /**
   * GRÁFICO I: ln((alpha_inf - alpha_t)/(alpha_inf - alpha_0)) vs t (s)
   */
  function renderLnLinearPlot(ctx, w, h, state, rows, reg, acidCfg) {
    // Título superior
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(16, 10, w - 32, 30);
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 10, w - 32, 30);

    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `GRÁFICO I (VISTA PREVIA): ln((α_∞ - α_t)/(α_∞ - α_0)) vs t  [${acidCfg.label}]`,
      w / 2,
      29
    );

    const padL = 68;
    const padT = 54;
    const plotW = 415;
    const plotH = 195;

    ctx.fillStyle = '#0c101a';
    ctx.fillRect(padL, padT, plotW, plotH);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.strokeRect(padL, padT, plotW, plotH);

    if (rows.length === 0) return;

    const maxT = Math.max(...rows.map(r => r.tCorrSec), 100) * 1.05;
    const minY = Math.min(...rows.map(r => r.lnTerm), -2.5) * 1.08;
    const maxY = 0.05;

    function toX(t) {
      return padL + (t / maxT) * plotW;
    }
    function toY(yVal) {
      return padT + ((maxY - yVal) / (maxY - minY)) * plotH;
    }

    // Grilla horizontal y vertical
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px monospace';

    for (let i = 0; i <= 4; i++) {
      const yVal = maxY - (i / 4) * (maxY - minY);
      const py = toY(yVal);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), padL - 6, py + 3);
    }

    for (let j = 0; j <= 4; j++) {
      const tVal = (j / 4) * maxT;
      const px = toX(tVal);
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(tVal)}s`, px, padT + plotH + 15);
    }

    // Títulos de ejes
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Tiempo corregido t (s)', padL + plotW / 2, padT + plotH + 32);

    ctx.save();
    ctx.translate(18, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ln((α_∞ - α_t)/(α_∞ - α_0))', 0, 0);
    ctx.restore();

    // Recta de regresión lineal
    ctx.strokeStyle = '#ff5964';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const yStart = reg.slope * 0 + reg.intercept;
    const yEnd = reg.slope * maxT + reg.intercept;
    ctx.moveTo(toX(0), toY(yStart));
    ctx.lineTo(toX(maxT), toY(yEnd));
    ctx.stroke();

    // Puntos experimentales del estudiante
    for (let i = 0; i < rows.length; i++) {
      const px = toX(rows[i].tCorrSec);
      const py = toY(rows[i].lnTerm);
      ctx.fillStyle = '#7bdff2';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#111622';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawSummaryBox(ctx, w, padL, padT, plotW, plotH, state, reg, acidCfg);
  }

  return {
    renderLinearPlot: function (ctx, w, h, state) {
      const rows = state.dataRows || [];
      const reg = window.Kinetics.computeLinearRegression(rows);
      const acidCfg = window.Kinetics.getAcidConfig(state.acidId);

      // Fondo oscuro estilo monitor de laboratorio
      ctx.fillStyle = '#111622';
      ctx.fillRect(0, 0, w, h);

      if (state.graphMode === 'ln_linear') {
        renderLnLinearPlot(ctx, w, h, state, rows, reg, acidCfg);
      } else {
        renderXCurvesPlot(ctx, w, h, state, rows, reg, acidCfg);
      }
    }
  };
})();

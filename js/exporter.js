/**
 * exporter.js
 * Generador y descargador del archivo de datos experimentales (.txt)
 * siguiendo el formato de la guía del TP (CP_20181112, pág. 6).
 */

window.Exporter = (function () {
  function padRight(str, len) {
    const s = String(str);
    return s.length >= len ? s : s + ' '.repeat(len - s.length);
  }

  return {
    generateTxtContent: function (state) {
      const params = window.Kinetics.getParams();
      const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
      const t0Corr = state.deltaTmSec / 2.0;
      const nowStr = new Date().toLocaleString('es-AR');

      const lines = [];
      lines.push('================================================================================');
      lines.push('LABORATORIO DE FISICOQUÍMICA - CINÉTICA QUÍMICA POR POLARIMETRÍA');
      lines.push('Trabajo Práctico: Hidrólisis ácida de la Sacarosa (Inversión)');
      lines.push('================================================================================');
      lines.push(`Fecha de registro:                                 ${nowStr}`);
      lines.push(`Polarímetro empleado:                              ${params.polarimeterName}`);
      lines.push(`Celda empleada (camino óptico l):                  ${params.cellLengthDm.toFixed(1)} dm (10.0 cm)`);
      lines.push(`Temperatura de trabajo:                            ${params.temperatureC.toFixed(1)} °C`);
      lines.push(`Concentración inicial de Sacarosa (sol. madre):    ${params.sucroseStockPercent.toFixed(1)} % p/v`);
      lines.push(`Concentración inicial de Sacarosa en mezcla:       ${params.sucroseMixPercent.toFixed(1)} % p/v (${params.sucroseMixMolar.toFixed(3)} M)`);
      lines.push(`Ácido catalizador (solución empleada):             HCl ${acidCfg.stockMolar.toFixed(1)} M`);
      lines.push(`Concentración de HCl en la mezcla de reacción:     ${acidCfg.mixMolar.toFixed(2)} M`);
      lines.push(`Tiempo de mezclado medido (Delta t_m):             ${state.deltaTmSec.toFixed(2)} s`);
      lines.push(`Corrección de tiempo cero (t_0 = Delta t_m / 2):   ${t0Corr.toFixed(2)} s`);
      lines.push(`Ángulo de rotación inicial (alpha_0):              +${state.alpha0Measured.toFixed(2)} deg`);
      lines.push(`Ángulo a tiempo infinito 24h (alpha_inf):          ${state.alphaInfMeasured.toFixed(2)} deg`);
      lines.push('================================================================================');
      lines.push(
        padRight('t_cron/s', 12) +
        padRight('t_corr/s', 12) +
        padRight('alpha_t/deg', 14) +
        padRight('ln((a_inf-at)/(a_inf-a0))', 28) +
        padRight('x', 12) +
        '1-x'
      );
      lines.push('--------------------------------------------------------------------------------');

      // Punto inicial t = 0
      lines.push(
        padRight('0.0', 12) +
        padRight('0.00', 12) +
        padRight(`+${state.alpha0Measured.toFixed(2)}`, 14) +
        padRight('0.0000', 28) +
        padRight('0.0000', 12) +
        '1.0000'
      );

      // Los 20 puntos cinéticos
      state.dataRows.forEach(row => {
        const alphaStr = (row.alphaT >= 0 ? '+' : '') + row.alphaT.toFixed(2);
        lines.push(
          padRight(row.tCronSec.toFixed(1), 12) +
          padRight(row.tCorrSec.toFixed(2), 12) +
          padRight(alphaStr, 14) +
          padRight(row.lnTerm.toFixed(4), 28) +
          padRight(row.x.toFixed(4), 12) +
          row.oneMinusX.toFixed(4)
        );
      });

      // Tiempo infinito (24 hs)
      lines.push('--------------------------------------------------------------------------------');
      lines.push(
        padRight('86400 (inf)', 12) +
        padRight('inf', 12) +
        padRight(state.alphaInfMeasured.toFixed(2), 14) +
        padRight('-', 28) +
        padRight('1.0000', 12) +
        '0.0000'
      );
      lines.push('================================================================================');

      return lines.join('\r\n');
    },

    downloadTxtFile: function (state) {
      const content = this.generateTxtContent(state);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const acidTag = state.acidId || '3M';
      link.href = url;
      link.download = `datos_polarimetria_HCl_${acidTag}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }
  };
})();

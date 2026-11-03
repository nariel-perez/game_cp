/**
 * polarimeter.js
 * Renderizador gráfico 2D retro / pixel-art en HTML5 Canvas.
 * Incluye:
 * - Retratos de personajes (El JTP con mate, Ayudante, Alerta)
 * - Escena 0: Mesada de laboratorio inicial
 * - Escena 1: Cinemática de preparación de soluciones
 * - Escena 2: Ocular bipartito de Laurent (Ley de Malus real) y dial con Vernier
 * - Escena 3: Minijuego de mezcla cronometrada (Delta t_m)
 * - Escena 4: Celda polarimétrica de 1.0 dm con trampa de burbuja
 * - Escena 5: Estación de barrido cinético automático
 */

window.Polarimeter = (function () {
  let animTick = 0;

  // Utilidad para dibujar rectángulos redondeados o pixelados
  function drawPixelBox(ctx, x, y, w, h, fill, border = '#ffffff', borderW = 2) {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    if (border && borderW > 0) {
      ctx.strokeStyle = border;
      ctx.lineWidth = borderW;
      ctx.strokeRect(Math.floor(x) + 1, Math.floor(y) + 1, Math.floor(w) - 2, Math.floor(h) - 2);
    }
  }

  /**
   * Calcula las intensidades de los dos campos del polarímetro de Laurent
   * aplicando la Ley de Malus con ángulo de media sombra delta.
   */
  function computeLaurentFields(dialAngle, targetAngle) {
    const deltaHalfDeg = 7.0; // semidiferencia del polarizador de Laurent
    const diff = dialAngle - targetAngle;

    const radL = ((diff - deltaHalfDeg) * Math.PI) / 180.0;
    const radR = ((diff + deltaHalfDeg) * Math.PI) / 180.0;

    // Intensidad base en penumbra oscura + componente de Malus sin^2(theta)
    const iMin = 0.14;
    const iLeft = iMin + (1 - iMin) * Math.pow(Math.sin(radL), 2);
    const iRight = iMin + (1 - iMin) * Math.pow(Math.sin(radR), 2);

    const absDiff = Math.abs(diff);
    const isPenumbraMatch = absDiff <= 0.12;
    const isClose = absDiff > 0.12 && absDiff <= 1.0;
    const isBrightField = Math.abs(Math.abs(diff) - 90) < 20 || Math.abs(Math.abs(diff) - 180) < 12;

    return {
      iLeft: Math.min(1, Math.max(0.08, iLeft)),
      iRight: Math.min(1, Math.max(0.08, iRight)),
      diff: diff,
      absDiff: absDiff,
      isPenumbraMatch: isPenumbraMatch,
      isClose: isClose,
      isBrightField: isBrightField
    };
  }

  function intensityToSodiumColor(intensity) {
    // Luz monocromática de sodio (589.3 nm): ámbar/dorado intenso a negro amarronado
    const r = Math.round(28 + 227 * Math.pow(intensity, 0.88));
    const g = Math.round(18 + 168 * Math.pow(intensity, 0.94));
    const b = Math.round(4 + 28 * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Dibuja el ocular de Laurent y el dial rotatorio
   */
  function renderLaurentOcular(ctx, cx, cy, radius, dialAngle, targetAngle, showHints = true) {
    const fields = computeLaurentFields(dialAngle, targetAngle);

    // Carcasa de bronce/negro del ocular
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2);
    ctx.fillStyle = '#1b1f2a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#c89d54';
    ctx.stroke();

    // Tornillos decorativos en el anillo de bronce
    for (let a = 0; a < 4; a++) {
      const ang = (a * Math.PI) / 2 + Math.PI / 4;
      const sx = cx + Math.cos(ang) * (radius + 8);
      const sy = cy + Math.sin(ang) * (radius + 8);
      ctx.fillStyle = '#e5c178';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Semicírculo Izquierdo
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.closePath();
    ctx.fillStyle = intensityToSodiumColor(fields.iLeft);
    ctx.fill();

    // Semicírculo Derecho
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, Math.PI / 2);
    ctx.closePath();
    ctx.fillStyle = intensityToSodiumColor(fields.iRight);
    ctx.fill();

    // Línea divisoria central del prisma de Laurent
    ctx.strokeStyle = 'rgba(20, 12, 4, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // Retícula interna suave
    ctx.strokeStyle = 'rgba(255, 210, 90, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.stroke();

    // Borde interno de la lente
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = fields.isPenumbraMatch ? '#06d6a0' : '#4a5568';
    ctx.stroke();

    if (showHints) {
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      let statusText = 'DESBALANCEADO';
      let statusColor = '#ff6b6b';
      if (fields.isPenumbraMatch) {
        statusText = '★ IGUALDAD DE PENUMBRA ★';
        statusColor = '#06d6a0';
      } else if (fields.isClose) {
        statusText = 'CASI IGUALADO (Ajuste fino ±0.1°)';
        statusColor = '#ffd166';
      } else if (fields.isBrightField) {
        statusText = 'CAMPO CLARO (Buscá la penumbra oscura)';
        statusColor = '#ff9f1c';
      }
      ctx.fillStyle = statusColor;
      ctx.fillText(statusText, cx, cy + radius + 30);
    }

    ctx.restore();
    return fields;
  }

  /**
   * Dibuja el Dial Graduado con Vernier
   */
  function renderGraduatedDial(ctx, cx, cy, radius, dialAngle, labelTitle = 'ANALIZADOR (Vernier)') {
    ctx.save();

    // Disco exterior
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#23293a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#9aa5b1';
    ctx.stroke();

    // Marcas de graduación que rotan con dialAngle
    const rotRad = (dialAngle * Math.PI) / 180.0;
    for (let deg = 0; deg < 360; deg += 10) {
      const a = ((deg - 90) * Math.PI) / 180.0 + rotRad;
      const isMajor = deg % 30 === 0;
      const rIn = isMajor ? radius - 14 : radius - 8;
      const x1 = cx + Math.cos(a) * rIn;
      const y1 = cy + Math.sin(a) * rIn;
      const x2 = cx + Math.cos(a) * (radius - 2);
      const y2 = cy + Math.sin(a) * (radius - 2);

      ctx.strokeStyle = isMajor ? '#ffd166' : '#cbd5e0';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Perilla central moleteada
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#141824';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e5c178';
    ctx.stroke();

    // Aguja indicadora fija arriba
    ctx.fillStyle = '#ff5964';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius + 2);
    ctx.lineTo(cx - 6, cy - radius - 9);
    ctx.lineTo(cx + 6, cy - radius - 9);
    ctx.closePath();
    ctx.fill();

    // Lectura digital estilo Vernier en el centro
    ctx.fillStyle = '#06d6a0';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sign = dialAngle >= 0 ? '+' : '';
    ctx.fillText(`${sign}${dialAngle.toFixed(2)}°`, cx, cy);

    // Etiqueta inferior
    ctx.fillStyle = '#cbd5e0';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(labelTitle, cx, cy + radius + 24);

    ctx.restore();
  }

  /**
   * Dibuja un matraz Erlenmeyer o frasco pixel-art en la mesada
   */
  function drawFlask(ctx, x, y, label, sublabel, liquidColor, fillLevel = 0.65) {
    ctx.save();

    // Cuello del Erlenmeyer
    ctx.fillStyle = 'rgba(200, 235, 255, 0.22)';
    ctx.fillRect(x - 10, y - 62, 20, 22);

    // Cuerpo cónico
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 40);
    ctx.lineTo(x - 32, y + 10);
    ctx.lineTo(x + 32, y + 10);
    ctx.lineTo(x + 10, y - 40);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200, 235, 255, 0.16)';
    ctx.fill();

    // Líquido interior
    const liqTopY = y + 10 - 46 * fillLevel;
    const halfWTop = 10 + 22 * (1 - fillLevel);
    ctx.beginPath();
    ctx.moveTo(x - halfWTop, liqTopY);
    ctx.lineTo(x - 30, y + 8);
    ctx.lineTo(x + 30, y + 8);
    ctx.lineTo(x + halfWTop, liqTopY);
    ctx.closePath();
    ctx.fillStyle = liquidColor;
    ctx.fill();

    // Contorno de vidrio
    ctx.strokeStyle = '#d8f3dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 62);
    ctx.lineTo(x + 12, y - 62);
    ctx.moveTo(x - 10, y - 62);
    ctx.lineTo(x - 10, y - 40);
    ctx.lineTo(x - 32, y + 10);
    ctx.lineTo(x + 32, y + 10);
    ctx.lineTo(x + 10, y - 40);
    ctx.lineTo(x + 10, y - 62);
    ctx.stroke();

    // Rótulo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 25);
    if (sublabel) {
      ctx.fillStyle = '#ffd166';
      ctx.font = '10px monospace';
      ctx.fillText(sublabel, x, y + 38);
    }
    ctx.restore();
  }

  return {
    computeLaurentFields: computeLaurentFields,

    /**
     * Dibuja el retrato pixel-art en el canvas de avatar (64x64)
     */
    drawPortrait: function (canvas, speaker, mood) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Fondo según personaje
      const bgColors = {
        jtp: '#2b2d42',
        ayudante: '#1d3557',
        alerta: '#4a1525'
      };
      ctx.fillStyle = bgColors[speaker] || '#2b2d42';
      ctx.fillRect(0, 0, w, h);

      if (speaker === 'alerta') {
        // Icono de burbuja / peligro
        ctx.fillStyle = '#ff5964';
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 32, 33);
        return;
      }

      // Guardapolvo blanco
      ctx.fillStyle = '#f1faee';
      ctx.fillRect(10, 44, 44, 20);
      // Solapa
      ctx.fillStyle = '#a8dadc';
      ctx.fillRect(26, 44, 12, 20);

      // Rostro pixel-art
      ctx.fillStyle = '#f4a261';
      ctx.fillRect(18, 16, 28, 26);

      if (speaker === 'jtp') {
        // Pelo y barba canosa/castaña de JTP experimentado
        ctx.fillStyle = '#4a4e69';
        ctx.fillRect(16, 10, 32, 8);
        ctx.fillRect(18, 34, 28, 8); // barba
        ctx.fillStyle = '#f4a261';
        ctx.fillRect(26, 36, 12, 3); // boca

        // Anteojos de laboratorio
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 21, 10, 8);
        ctx.strokeRect(34, 21, 10, 8);
        ctx.beginPath();
        ctx.moveTo(30, 25);
        ctx.lineTo(34, 25);
        ctx.stroke();

        // Ojos
        ctx.fillStyle = '#111';
        ctx.fillRect(24, 24, 3, 3);
        ctx.fillRect(38, 24, 3, 3);

        // Mate con bombilla en la esquina derecha
        ctx.fillStyle = '#6f4e37';
        ctx.fillRect(46, 42, 12, 14);
        ctx.strokeStyle = '#d9d9d9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(52, 42);
        ctx.lineTo(56, 32);
        ctx.stroke();
      } else {
        // Ayudante de Primera
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(16, 10, 32, 8); // gorra/antiparras en la frente
        ctx.fillStyle = '#111';
        ctx.fillRect(23, 24, 4, 4);
        ctx.fillRect(37, 24, 4, 4);
        ctx.fillStyle = '#e76f51';
        ctx.fillRect(27, 34, 10, 3);
      }
    },

    /**
     * Renderizador principal de la escena activa en el Canvas de 760x300
     */
    renderScene: function (canvas, state) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      animTick++;

      // Fondo general de laboratorio retro
      ctx.fillStyle = '#131722';
      ctx.fillRect(0, 0, w, h);

      // Azulejos de pared de laboratorio sutiles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 38) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h - 70);
        ctx.stroke();
      }
      for (let gy = 0; gy < h - 70; gy += 38) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Mesada de granito oscuro en la parte inferior
      ctx.fillStyle = '#252b3d';
      ctx.fillRect(0, h - 70, w, 70);
      ctx.fillStyle = '#3b4254';
      ctx.fillRect(0, h - 70, w, 5);

      const phase = state.phase;

      // =========================================================================
      // ESCENA 0: MESADA DE INICIO Y SELECCIÓN DE HCl
      // =========================================================================
      if (phase === 'intro') {
        drawPixelBox(ctx, 20, 14, w - 40, 34, '#1e2436', '#ffd166', 2);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★ CÁTEDRA DE FISICOQUÍMICA - TP: CINÉTICA POR POLARIMETRÍA ★', w / 2, 36);

        // Frascos sobre la mesada
        drawFlask(ctx, 130, h - 80, 'SACAROSA 40%', 'Solución Madre', 'rgba(255, 235, 150, 0.55)', 0.75, false);
        drawFlask(ctx, 270, h - 80, 'HCl 3.0 M', 'Ruta Estándar', 'rgba(114, 239, 221, 0.55)', 0.65, state.acidId === '3M');
        drawFlask(ctx, 400, h - 80, 'HCl 6.0 M', 'Ruta Furiosa', 'rgba(255, 89, 100, 0.65)', 0.65, state.acidId === '6M');

        // Silueta del Polarímetro de Laurent a la derecha
        drawPixelBox(ctx, 515, h - 165, 205, 95, '#1b1f2a', '#c89d54', 3);
        ctx.fillStyle = '#e5c178';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('POLARÍMETRO DE LAURENT', 617, h - 142);
        ctx.fillStyle = '#ffd166';
        ctx.font = '11px monospace';
        ctx.fillText('Lámpara Na (λ = 589.3 nm)', 617, h - 122);
        ctx.fillStyle = '#06d6a0';
        ctx.fillText('Celda l = 1.0 dm (10 cm)', 617, h - 102);
        ctx.fillStyle = '#a0aec0';
        ctx.fillText('Temp = 20.0 °C', 617, h - 84);
      }

      // =========================================================================
      // ESCENA 1: CINEMÁTICA DE PREPARACIÓN DE SOLUCIONES
      // =========================================================================
      else if (phase === 'prep') {
        drawPixelBox(ctx, 20, 14, w - 40, 34, '#1e2436', '#7bdff2', 2);
        ctx.fillStyle = '#7bdff2';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PASO 1: PREPARACIÓN DE SOLUCIONES Y BLANCO PARA α₀', w / 2, 36);

        const pulse = 0.65 + 0.08 * Math.sin(animTick * 0.08);
        drawFlask(ctx, 140, h - 80, 'Matraz 50 mL', 'Sacarosa 40% p/v', 'rgba(255, 225, 130, 0.6)', 0.85, false);

        // Flechas de alícuotas
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('── 25 mL ──►', 240, h - 115);

        drawFlask(ctx, 355, h - 80, 'BLANCO (α₀)', '25mL Sac + 25mL H₂O', 'rgba(123, 223, 242, 0.55)', pulse, true);

        ctx.fillStyle = '#ff9f1c';
        ctx.fillText('── 25 mL ──►', 475, h - 115);

        const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
        drawFlask(ctx, 600, h - 80, 'PARA CINÉTICA', `25mL Sac + ${acidCfg.label}`, 'rgba(255, 159, 28, 0.55)', 0.55, false);
      }

      // =========================================================================
      // ESCENA 2: CALIBRACIÓN MANUAL DE ALPHA_0 (OCULAR DE LAURENT)
      // =========================================================================
      else if (phase === 'calibration') {
        drawPixelBox(ctx, 20, 10, w - 40, 30, '#1e2436', '#ffd166', 2);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CALIBRACIÓN MANUAL DEL BLANCO (α₀): IGUALÁ LA PENUMBRA OSCURA', w / 2, 29);

        // Ocular a la izquierda
        renderLaurentOcular(
          ctx,
          205,
          152,
          76,
          state.dialAngle,
          state.alpha0Target,
          true
        );

        // Dial graduado a la derecha
        renderGraduatedDial(
          ctx,
          535,
          145,
          68,
          state.dialAngle,
          'VERNIER DEL ANALIZADOR'
        );

        // Leyenda de ayuda en el centro
        drawPixelBox(ctx, 330, 75, 110, 125, '#192030', '#4a5568', 1);
        ctx.fillStyle = '#cbd5e0';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GUÍA RÁPIDA', 385, 95);
        ctx.fillStyle = '#ffd166';
        ctx.fillText('Sacarosa 20%', 385, 118);
        ctx.fillText('l = 1.0 dm', 385, 136);
        ctx.fillStyle = '#a0aec0';
        ctx.fillText('Usá ← / →', 385, 162);
        ctx.fillText('o Ruedita', 385, 178);
      }

      // =========================================================================
      // ESCENA 3: MEZCLA CON HCl Y CRONÓMETRO DE TIEMPO DE MEZCLA (Delta t_m)
      // =========================================================================
      else if (phase === 'mixing') {
        const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
        drawPixelBox(ctx, 20, 10, w - 40, 30, '#1e2436', '#ff9f1c', 2);
        ctx.fillStyle = '#ff9f1c';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(` CONTACTO INICIAL: 25 mL SACAROSA 40% + 25 mL ${acidCfg.label}`, w / 2, 29);

        // Erlenmeyer recibiendo el ácido
        const mixFrac = Math.min(1, state.mixProgress / 100);
        drawFlask(
          ctx,
          220,
          h - 75,
          'MEZCLA REACCIÓN',
          `[HCl]ef = ${acidCfg.mixMolar.toFixed(1)} M`,
          mixFrac > 0.5 ? 'rgba(255, 159, 28, 0.7)' : 'rgba(255, 235, 150, 0.6)',
          0.45 + 0.4 * mixFrac,
          true
        );

        // Chorro de ácido cayendo si está vertiendo
        if (state.isPouring && state.mixProgress < 100) {
          ctx.strokeStyle = '#72efdd';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(220, 62);
          ctx.lineTo(220, h - 90);
          ctx.stroke();
        }

        // Probeta inclinada arriba
        ctx.save();
        ctx.translate(185, 65);
        ctx.rotate(state.isPouring ? 0.65 : 0.25);
        drawPixelBox(ctx, -12, -30, 24, 60, 'rgba(114, 239, 221, 0.35)', '#d8f3dc', 2);
        ctx.restore();

        // Cronómetro digital grande a la derecha
        drawPixelBox(ctx, 390, 65, 320, 155, '#181e2c', '#ffd166', 3);
        ctx.fillStyle = '#a0aec0';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CRONÓMETRO DE MEZCLADO (Δt_m)', 550, 92);

        ctx.fillStyle = '#06d6a0';
        ctx.font = 'bold 34px monospace';
        ctx.fillText(`${state.deltaTmSec.toFixed(2)} s`, 550, 135);

        // Barra de progreso de homogeneización
        drawPixelBox(ctx, 425, 158, 250, 22, '#0f131d', '#4a5568', 2);
        ctx.fillStyle = state.mixProgress >= 100 ? '#06d6a0' : '#ff9f1c';
        ctx.fillRect(427, 160, Math.floor(2.46 * Math.min(100, state.mixProgress)), 18);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Homogeneizado: ${Math.floor(state.mixProgress)}%`, 550, 173);

        ctx.fillStyle = '#ffd166';
        ctx.font = '12px monospace';
        ctx.fillText(`Corrección t₀ = Δt_m / 2 = ${(state.deltaTmSec / 2).toFixed(2)} s`, 550, 204);
      }

      // =========================================================================
      // ESCENA 4: CELDA POLARIMÉTRICA DE 10 cm (1.0 dm) Y LA BURBUJA
      // =========================================================================
      else if (phase === 'bubble') {
        drawPixelBox(ctx, 20, 10, w - 40, 30, '#1e2436', '#7bdff2', 2);
        ctx.fillStyle = '#7bdff2';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('INSPECCIÓN DEL TUBO POLARIMÉTRICO (Camino óptico l = 1.0 dm)', w / 2, 29);

        const cx = w / 2;
        const cy = 155;
        const tiltRad = state.bubbleState === 'cleared' ? -0.08 : 0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tiltRad);

        // Haz de luz de sodio atravesando la celda
        ctx.fillStyle = state.bubbleState === 'cleared'
          ? 'rgba(255, 209, 102, 0.35)'
          : 'rgba(255, 89, 100, 0.22)';
        ctx.fillRect(-260, -18, 520, 36);

        // Tubo principal de vidrio (10 cm = 1.0 dm)
        drawPixelBox(ctx, -190, -26, 380, 52, 'rgba(180, 230, 255, 0.18)', '#d8f3dc', 3);

        // Ampolla reservorio (joroba trampa de burbujas arriba a la derecha)
        drawPixelBox(ctx, 40, -68, 70, 44, 'rgba(180, 230, 255, 0.22)', '#d8f3dc', 3);
        ctx.fillStyle = '#ffd166';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Ampolla Trampa', 75, -75);

        // Tapas a rosca en los extremos
        drawPixelBox(ctx, -212, -32, 24, 64, '#3b4254', '#c89d54', 2);
        drawPixelBox(ctx, 188, -32, 24, 64, '#3b4254', '#c89d54', 2);

        // Dibujar la burbuja según el estado
        if (state.bubbleState === 'trapped') {
          // Burbuja gigante bloqueando el centro del eje óptico
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ff5964';
          ctx.stroke();

          // Ojos retro de "Enemigo Burbuja"
          ctx.fillStyle = '#111';
          ctx.fillRect(-7, -5, 4, 6);
          ctx.fillRect(3, -5, 4, 6);

          ctx.fillStyle = '#ff5964';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('¡BURBUJA EN EL CAMINO ÓPTICO!', 0, 48);
        } else if (state.bubbleState === 'foamy') {
          // Microburbujas por agitar como pomo de mayonesa
          for (let i = 0; i < 28; i++) {
            const bx = -150 + ((i * 37) % 300);
            const by = -16 + ((i * 19) % 32);
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fill();
          }
          ctx.fillStyle = '#ff9f1c';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('¡ESPUMA DE MICROBURBUJAS! REINTENTÁ CON CUIDADO', 0, 48);
        } else if (state.bubbleState === 'cleared') {
          // Burbuja alojada felizmente en la ampolla superior
          ctx.beginPath();
          ctx.arc(75, -48, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#06d6a0';
          ctx.stroke();

          ctx.fillStyle = '#06d6a0';
          ctx.font = 'bold 13px monospace';
          ctx.fillText('✓ CAMINO ÓPTICO DE 1.0 dm 100% DESPEJADO', 0, 48);
        }

        ctx.restore();
      }

      // =========================================================================
      // ESCENA 5: BARRIDO CINÉTICO AUTOMÁTICO (20 PUNTOS + ALPHA_INF)
      // =========================================================================
      else if (phase === 'kinetics') {
        const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
        drawPixelBox(ctx, 20, 10, w - 40, 30, '#1e2436', '#06d6a0', 2);
        ctx.fillStyle = '#06d6a0';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `SEGUIMIENTO CINÉTICO (${acidCfg.label}) — PUNTOS REGISTRADOS: ${state.dataRows.length} / 20`,
          w / 2,
          29
        );

        // Ocular mostrando la igualación automática
        renderLaurentOcular(ctx, 130, 148, 62, state.currentAlpha, state.currentAlpha, false);

        // Dial mostrando el ángulo actual
        renderGraduatedDial(ctx, 315, 148, 58, state.currentAlpha, 'ÁNGULO α_t');

        // Panel de Estado Cinético a la derecha
        drawPixelBox(ctx, 425, 55, 315, 195, '#181e2c', '#4a5568', 2);

        const lastRow = state.dataRows.length > 0
          ? state.dataRows[state.dataRows.length - 1]
          : null;

        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('ESTADO EN TIEMPO REAL:', 445, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        const tCronDisp = state.infinityReached
          ? '86400 s (24 hs)'
          : lastRow ? `${lastRow.tCronSec} s (${(lastRow.tCronSec / 60).toFixed(1)} min)` : '0.0 s';
        const tCorrDisp = state.infinityReached
          ? '∞ (Reacción Completa)'
          : lastRow ? `${lastRow.tCorrSec.toFixed(1)} s` : '0.0 s';
        const xPercent = state.infinityReached
          ? '100.0 %'
          : lastRow ? `${(lastRow.x * 100).toFixed(1)} %` : '0.0 %';

        ctx.fillText(`• Reloj (t):     ${tCronDisp}`, 445, 106);
        ctx.fillText(`• t corregido:   ${tCorrDisp}`, 445, 128);
        ctx.fillText(`• α₀ (blanco):   +${state.alpha0Measured.toFixed(2)}°`, 445, 150);
        ctx.fillText(`• Conversión x:  ${xPercent}`, 445, 172);

        // Indicador de carácter óptico (Dextrógiro vs Levógiro)
        const isLevo = state.currentAlpha < 0;
        drawPixelBox(
          ctx,
          445,
          190,
          275,
          42,
          isLevo ? '#2d1b38' : '#1b332b',
          isLevo ? '#ff5964' : '#06d6a0',
          2
        );
        ctx.fillStyle = isLevo ? '#ff5964' : '#06d6a0';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          isLevo
            ? '↺ MEZCLA LEVÓGIRA (α < 0° · Invertida)'
            : '↻ MEZCLA DEXTRÓGIRA (α > 0°)',
          582,
          215
        );
      }

      // =========================================================================
      // ESCENA 6: BITÁCORA FINAL Y MINI-GRÁFICO PREVIEW
      // =========================================================================
      else if (phase === 'final') {
        if (window.GraphRenderer) {
          window.GraphRenderer.renderLinearPlot(ctx, w, h, state);
        }
      }
    }
  };
})();

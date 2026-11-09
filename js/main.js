/**
 * main.js
 * Máquina de estados principal, controlador de diálogos estilo RPG retro,
 * eventos de teclado/mouse y gestión de la bitácora experimental.
 */

window.Game = (function () {
  const state = {
    phase: 'intro', // 'intro' | 'prep' | 'calibration' | 'mixing' | 'bubble' | 'kinetics' | 'final'
    acidId: '3M',
    dialAngle: 4.50,
    alpha0Target: 13.28,
    alpha0Measured: 13.28,
    alphaInfMeasured: -3.85,
    calibDone: false,

    // Mezcla y tiempo cero
    isPouring: false,
    mixDone: false,
    mixProgress: 0,
    deltaTmSec: 0.0,
    mixTimerId: null,

    // Celda y burbuja
    bubbleState: 'hidden', // 'hidden' | 'trapped' | 'foamy' | 'cleared'

    // Cinética (20 puntos + infinito)
    dataRows: [],
    currentAlpha: 13.28,
    zeroCrossAnnounced: false,
    infinityReached: false,
    autoSweepId: null,

    // UI y Diálogo
    speaker: 'jtp',
    mood: 'mate',
    fullText: '',
    displayedText: '',
    typewriterId: null,
    showLogModal: false
  };

  // Referencias del DOM
  let dom = {};

  function cacheDom() {
    dom = {
      sceneCanvas: document.getElementById('scene-canvas'),
      portraitCanvas: document.getElementById('portrait-canvas'),
      speakerName: document.getElementById('speaker-name'),
      speakerRole: document.getElementById('speaker-role'),
      dialogText: document.getElementById('dialog-text'),
      optionsContainer: document.getElementById('options-container'),
      hudAcid: document.getElementById('hud-acid'),
      hudAlpha0: document.getElementById('hud-alpha0'),
      hudDeltaTm: document.getElementById('hud-deltatm'),
      hudPoints: document.getElementById('hud-points'),
      btnMute: document.getElementById('btn-mute'),
      btnLogbook: document.getElementById('btn-logbook'),
      logbookPanel: document.getElementById('logbook-panel'),
      logbookBody: document.getElementById('logbook-tbody'),
      logbookSummary: document.getElementById('logbook-summary'),
      btnCloseLog: document.getElementById('btn-close-log')
    };
  }

  /**
   * Actualiza los indicadores superiores del HUD
   */
  function updateHud() {
    const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
    dom.hudAcid.textContent = acidCfg.label;
    dom.hudAlpha0.textContent = state.calibDone ? `+${state.alpha0Measured.toFixed(2)}°` : 'Pendiente';
    dom.hudDeltaTm.textContent = state.mixDone ? `${state.deltaTmSec.toFixed(2)} s` : 'Pendiente';
    dom.hudPoints.textContent = `${state.dataRows.length} / 20`;
  }

  /**
   * Muestra un diálogo con efecto máquina de escribir y dibuja el retrato
   */
  function setDialog(speaker, mood, text, options = []) {
    state.speaker = speaker;
    state.mood = mood || 'normal';
    state.fullText = text;
    state.displayedText = '';

    const charInfo = window.Dialogs.characters[speaker] || window.Dialogs.characters.jtp;
    dom.speakerName.textContent = charInfo.name;
    dom.speakerName.style.color = charInfo.color;
    dom.speakerRole.textContent = charInfo.role;

    window.Polarimeter.drawPortrait(dom.portraitCanvas, speaker, state.mood);

    if (state.typewriterId) {
      clearInterval(state.typewriterId);
    }

    let idx = 0;
    dom.dialogText.textContent = '';
    state.typewriterId = setInterval(() => {
      if (idx < state.fullText.length) {
        // Avanzar de a 2 caracteres para que sea ágil de leer
        const chunk = state.fullText.slice(idx, idx + 2);
        state.displayedText += chunk;
        dom.dialogText.textContent = state.displayedText;
        if (idx % 6 === 0) {
          window.AudioEngine.playTextBlip(speaker);
        }
        idx += 2;
      } else {
        clearInterval(state.typewriterId);
        state.typewriterId = null;
      }
    }, 18);

    renderOptions(options);
  }

  /**
   * Renderiza los botones de acción/opción en el panel inferior
   */
  function renderOptions(options) {
    dom.optionsContainer.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'rpg-btn ' + (opt.className || '');
      btn.textContent = opt.label;
      if (opt.disabled) {
        btn.disabled = true;
      }
      btn.addEventListener('click', () => {
        window.AudioEngine.playSelect();
        if (typeof opt.onClick === 'function') {
          opt.onClick();
        } else if (typeof opt.action === 'string') {
          handleNamedAction(opt.action);
        }
      });
      dom.optionsContainer.appendChild(btn);
    });
  }

  /**
   * Manejador de acciones nombradas desde dialogs.js
   */
  function handleNamedAction(actionName) {
    switch (actionName) {
      case 'explainInversion': {
        const sc = window.Dialogs.scenes.scene0_explain_inversion;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'selectAcid3M': {
        state.acidId = '3M';
        updateHud();
        const sc = window.Dialogs.scenes.scene0_selected_3M;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'selectAcid6M': {
        state.acidId = '6M';
        updateHud();
        const sc = window.Dialogs.scenes.scene0_selected_6M;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'startScene1Prep': {
        state.phase = 'prep';
        const sc = window.Dialogs.scenes.scene1_prep_step1;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'scene1JtpAdvice': {
        const sc = window.Dialogs.scenes.scene1_prep_step2;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'startScene2Calibration': {
        startCalibrationPhase();
        break;
      }
      case 'triggerBubbleAlert': {
        state.bubbleState = 'trapped';
        window.AudioEngine.playBubbleAlert();
        const sc = window.Dialogs.scenes.scene4_bubble_alert;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'bubbleChoiceIgnore': {
        window.AudioEngine.playError();
        const sc = window.Dialogs.scenes.scene4_bubble_ignore;
        const alertOpts = window.Dialogs.scenes.scene4_bubble_alert.options;
        setDialog(sc.speaker, sc.mood, sc.text, alertOpts);
        break;
      }
      case 'bubbleChoiceShake': {
        window.AudioEngine.playError();
        state.bubbleState = 'foamy';
        const sc = window.Dialogs.scenes.scene4_bubble_shake;
        const alertOpts = window.Dialogs.scenes.scene4_bubble_alert.options;
        setDialog(sc.speaker, sc.mood, sc.text, alertOpts);
        break;
      }
      case 'bubbleChoiceTilt': {
        state.bubbleState = 'cleared';
        window.AudioEngine.playFanfare();
        const sc = window.Dialogs.scenes.scene4_bubble_success;
        setDialog(sc.speaker, sc.mood, sc.text, sc.options);
        break;
      }
      case 'startScene5Kinetics': {
        startKineticsPhase();
        break;
      }
      default:
        break;
    }
  }

  // ===========================================================================
  // FASE 2: CALIBRACIÓN MANUAL DE ALPHA_0
  // ===========================================================================
  function startCalibrationPhase() {
    state.phase = 'calibration';
    state.dialAngle = 5.20; // desbalanceado al inicio para que el usuario lo ajuste
    state.alpha0Target = window.Kinetics.getParams().alpha0Theoretical; // +13.28°
    state.calibDone = false;

    const sc = window.Dialogs.scenes.scene2_calib_intro;
    setDialog(sc.speaker, sc.mood, sc.text, getCalibrationButtons());
  }

  function rotateDial(deltaDeg) {
    if (state.phase !== 'calibration' || state.calibDone) return;
    state.dialAngle = Number((state.dialAngle + deltaDeg).toFixed(2));
    if (state.dialAngle > 180) state.dialAngle -= 360;
    if (state.dialAngle < -180) state.dialAngle += 360;
    window.AudioEngine.playDialTick(Math.abs(deltaDeg) < 0.5);
  }

  function getCalibrationButtons() {
    return [
      { label: '◀◀ -1.0°', onClick: () => rotateDial(-1.0) },
      { label: '◀ -0.1°', onClick: () => rotateDial(-0.1) },
      { label: '▶ +0.1°', onClick: () => rotateDial(0.1) },
      { label: '▶▶ +1.0°', onClick: () => rotateDial(1.0) },
      {
        label: '🎯 Clavar Lectura de α₀',
        className: 'rpg-btn-accent',
        onClick: checkCalibrationMatch
      }
    ];
  }

  function checkCalibrationMatch() {
    const fields = window.Polarimeter.computeLaurentFields(state.dialAngle, state.alpha0Target);
    const sc = window.Dialogs.scenes.scene2_calib_intro;

    if (fields.isPenumbraMatch) {
      state.calibDone = true;
      state.alpha0Measured = Number(state.dialAngle.toFixed(2));
      state.currentAlpha = state.alpha0Measured;
      updateHud();
      window.AudioEngine.playFanfare();

      setDialog('ayudante', 'feliz', sc.successAyudante(state.alpha0Measured), [
        {
          label: '💬 Escuchar al JTP',
          onClick: () => {
            setDialog('jtp', 'feliz', sc.successJtp, [
              {
                label: '🧪 Pasar a la Mesa de Reacción (Mezclar HCl)',
                className: 'rpg-btn-accent',
                onClick: startMixingPhase
              }
            ]);
          }
        }
      ]);
    } else if (fields.isBrightField) {
      window.AudioEngine.playError();
      setDialog('jtp', 'alerta', sc.brightError, getCalibrationButtons());
    } else if (fields.isClose) {
      window.AudioEngine.playError();
      setDialog('jtp', 'explicando', sc.closeError, getCalibrationButtons());
    } else {
      window.AudioEngine.playError();
      setDialog('jtp', 'sorpresa', sc.farError, getCalibrationButtons());
    }
  }

  // ===========================================================================
  // FASE 3: MEZCLA CON HCl Y MEDICIÓN DE DELTA t_m
  // ===========================================================================
  function startMixingPhase() {
    state.phase = 'mixing';
    state.isPouring = false;
    state.mixDone = false;
    state.mixProgress = 0;
    state.deltaTmSec = 0.0;

    const sc = window.Dialogs.scenes.scene3_mix_intro;
    setDialog(sc.speaker, sc.mood, sc.text, getMixingButtons());
  }

  function getMixingButtons() {
    if (!state.isPouring && state.mixProgress === 0) {
      return [
        {
          label: '🔴 ¡Iniciar Vertido y Cronómetro!',
          className: 'rpg-btn-accent',
          onClick: startPouringTimer
        }
      ];
    } else if (state.isPouring) {
      const canStop = state.mixProgress >= 100;
      return [
        {
          label: canStop
            ? '⏹️ ¡Mezcla Homogénea! Registrar Cronómetro (Δt_m)'
            : '⏳ Volcando y homogeneizando... esperá al 100%',
          className: canStop ? 'rpg-btn-accent' : '',
          onClick: stopPouringTimer
        }
      ];
    }
    return [];
  }

  function startPouringTimer() {
    if (state.isPouring || state.mixDone) return;
    state.isPouring = true;
    state.deltaTmSec = 0.0;
    state.mixProgress = 0;
    let readyButtonRendered = false;

    renderOptions(getMixingButtons());

    state.mixTimerId = setInterval(() => {
      state.deltaTmSec = Number((state.deltaTmSec + 0.1).toFixed(2));
      // Llega al 100% en ~4.2 segundos
      state.mixProgress = Math.min(100, (state.deltaTmSec / 4.2) * 100);

      if (Math.round(state.deltaTmSec * 10) % 3 === 0) {
        window.AudioEngine.playPourTick(state.mixProgress);
      }

      // Renderizar una única vez al alcanzar el 100% para no recrear el botón en cada tick
      if (state.mixProgress >= 100 && !readyButtonRendered) {
        readyButtonRendered = true;
        renderOptions(getMixingButtons());
      }
    }, 100);
  }

  function stopPouringTimer() {
    const sc = window.Dialogs.scenes.scene3_mix_intro;
    if (state.mixProgress < 100) {
      window.AudioEngine.playError();
      setDialog('jtp', 'alerta', sc.TooShort, getMixingButtons());
      return;
    }

    if (state.mixTimerId) {
      clearInterval(state.mixTimerId);
      state.mixTimerId = null;
    }
    state.isPouring = false;
    state.mixDone = true;
    updateHud();
    window.AudioEngine.playFanfare();

    const t0Corr = state.deltaTmSec / 2.0;
    setDialog('jtp', 'feliz', sc.success(state.deltaTmSec, t0Corr), [
      {
        label: '🧪 Enjuagar y Llenar el Tubo Polarimétrico (10 cm)',
        className: 'rpg-btn-accent',
        onClick: startBubblePhase
      }
    ]);
  }

  // ===========================================================================
  // FASE 4: CELDA POLARIMÉTRICA Y CONTROL DE BURBUJA
  // ===========================================================================
  function startBubblePhase() {
    state.phase = 'bubble';
    state.bubbleState = 'hidden';
    const sc = window.Dialogs.scenes.scene4_cell_intro;
    setDialog(sc.speaker, sc.mood, sc.text, sc.options);
  }

  // ===========================================================================
  // FASE 5: SEGUIMIENTO CINÉTICO (20 PUNTOS + ALPHA INFINITO)
  // ===========================================================================
  function startKineticsPhase() {
    state.phase = 'kinetics';
    state.dataRows = [];
    state.currentAlpha = state.alpha0Measured;
    state.zeroCrossAnnounced = false;
    state.infinityReached = false;
    updateHud();
    renderLogbookTable();

    const sc = window.Dialogs.scenes.scene5_kinetics_intro;
    setDialog(sc.speaker, sc.mood, sc.text, getKineticsButtons());
  }

  function getKineticsButtons() {
    const count = state.dataRows.length;
    const acidCfg = window.Kinetics.getAcidConfig(state.acidId);

    if (count < 20) {
      const nextTimeSec = acidCfg.timePointsSec[count];
      const nextMin = (nextTimeSec / 60).toFixed(1);
      return [
        {
          label: `⏱️ Medir Punto ${count + 1}/20 (t = ${nextMin} min)`,
          className: 'rpg-btn-accent',
          onClick: recordNextKineticPoint
        },
        {
          label: state.autoSweepId ? '⏸️ Pausar Auto-Avance' : '⚡ Completar Ráfaga Automática',
          onClick: toggleAutoSweep
        },
        {
          label: `📖 Ver Tabla de Datos (${count}/20)`,
          onClick: toggleLogbookModal
        }
      ];
    } else if (!state.infinityReached) {
      return [
        {
          label: '⏩ Esperar al Día Siguiente (24 hs · Medir α_∞)',
          className: 'rpg-btn-accent',
          onClick: measureInfinityPoint
        },
        {
          label: '📖 Ver Tabla de Datos (20/20)',
          onClick: toggleLogbookModal
        }
      ];
    } else {
      return [
        {
          label: '📊 Ver Gráfico Lineal y Exportar Archivo (.txt)',
          className: 'rpg-btn-accent',
          onClick: startFinalPhase
        },
        {
          label: '📖 Ver Tabla Completa',
          onClick: toggleLogbookModal
        }
      ];
    }
  }

  function toggleAutoSweep() {
    if (state.autoSweepId) {
      clearInterval(state.autoSweepId);
      state.autoSweepId = null;
      renderOptions(getKineticsButtons());
      return;
    }

    state.autoSweepId = setInterval(() => {
      if (state.dataRows.length < 20) {
        recordNextKineticPoint();
      } else {
        clearInterval(state.autoSweepId);
        state.autoSweepId = null;
        renderOptions(getKineticsButtons());
      }
    }, 280);
    renderOptions(getKineticsButtons());
  }

  function recordNextKineticPoint() {
    const idx = state.dataRows.length;
    if (idx >= 20) return;

    const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
    const tCronSec = acidCfg.timePointsSec[idx];
    const tCorrSec = Math.max(1, tCronSec - state.deltaTmSec / 2.0);

    const alphaT = window.Kinetics.computeAlphaAtTime(
      state.acidId,
      tCorrSec,
      state.alpha0Measured,
      state.alphaInfMeasured,
      true
    );

    const row = window.Kinetics.computeRowMetrics(
      tCronSec,
      state.deltaTmSec,
      alphaT,
      state.alpha0Measured,
      state.alphaInfMeasured
    );

    const prevAlpha = state.currentAlpha;
    state.currentAlpha = row.alphaT;
    state.dataRows.push(row);
    updateHud();
    renderLogbookTable();

    const ptNum = state.dataRows.length;
    const crossedZeroNow = prevAlpha >= 0 && row.alphaT < 0 && !state.zeroCrossAnnounced;
    if (crossedZeroNow) {
      state.zeroCrossAnnounced = true;
    }

    window.AudioEngine.playMeasureServo(crossedZeroNow);

    const comments = window.Dialogs.scenes.scene5_kinetics_intro.comments;
    let msg = '';
    let mood = 'normal';

    if (ptNum === 20) {
      if (state.autoSweepId) {
        clearInterval(state.autoSweepId);
        state.autoSweepId = null;
      }
      msg = comments.completed20(row.alphaT);
      mood = 'feliz';
    } else if (crossedZeroNow) {
      msg = comments.zeroCross(ptNum, row.alphaT);
      mood = 'sorpresa';
    } else if (ptNum === 1) {
      msg = comments.first(row.alphaT, (tCronSec / 60).toFixed(1));
      mood = 'mate';
    } else if (ptNum <= 6) {
      msg = comments.early(ptNum, row.alphaT);
      mood = 'explicando';
    } else if (ptNum <= 14) {
      msg = comments.mid(ptNum, row.alphaT, row.x);
      mood = 'mate';
    } else {
      msg = comments.late(ptNum, row.alphaT, row.x);
      mood = 'normal';
    }

    setDialog('jtp', mood, msg, getKineticsButtons());
  }

  function measureInfinityPoint() {
    state.infinityReached = true;
    // Pequeña variación realista sobre el teórico -3.85°
    state.alphaInfMeasured = -3.85;
    state.currentAlpha = state.alphaInfMeasured;
    window.AudioEngine.playFanfare();
    renderLogbookTable();

    const comments = window.Dialogs.scenes.scene5_kinetics_intro.comments;
    setDialog(
      'jtp',
      'feliz',
      comments.infinityDone(state.alphaInfMeasured),
      getKineticsButtons()
    );
  }

  // ===========================================================================
  // FASE 6: BITÁCORA FINAL, MINI-GRÁFICOS (I y II) Y EXPORTACIÓN .TXT
  // ===========================================================================
  function getFinalButtons() {
    const isXMode = state.graphMode !== 'ln_linear';
    return [
      {
        label: `💾 Descargar Datos Experimentales (${state.acidId}.txt)`,
        className: 'rpg-btn-accent',
        onClick: () => {
          window.Exporter.downloadTxtFile(state);
        }
      },
      {
        label: isXMode
          ? '📈 Cambiar a Gráfico I: Lineal ln((α_∞ - α_t)/(α_∞ - α_0)) vs t'
          : '📉 Cambiar a Gráfico II: Curvas de x y (1 - x) vs t',
        onClick: () => {
          state.graphMode = isXMode ? 'ln_linear' : 'x_curves';
          renderOptions(getFinalButtons());
        }
      },
      {
        label: '📖 Ver Tabla Completa en Pantalla',
        onClick: toggleLogbookModal
      },
      {
        label: '🔄 Iniciar Nueva Misión (Probar la otra concentración de HCl)',
        onClick: resetGameToIntro
      }
    ];
  }

  function startFinalPhase() {
    state.phase = 'final';
    state.graphMode = 'x_curves'; // Mostrar primero el gráfico visual de x y (1-x)
    const sc = window.Dialogs.scenes.scene6_final;
    setDialog(sc.speaker, sc.mood, sc.text, getFinalButtons());
  }

  function resetGameToIntro() {
    if (state.autoSweepId) {
      clearInterval(state.autoSweepId);
      state.autoSweepId = null;
    }
    state.phase = 'intro';
    state.calibDone = false;
    state.mixDone = false;
    state.mixProgress = 0;
    state.deltaTmSec = 0;
    state.dataRows = [];
    state.infinityReached = false;
    updateHud();
    renderLogbookTable();

    const sc = window.Dialogs.scenes.scene0_intro;
    setDialog(sc.speaker, sc.mood, sc.text, sc.options);
  }

  // ===========================================================================
  // BITÁCORA DE DATOS EN PANTALLA (MODAL / TABLA)
  // ===========================================================================
  function toggleLogbookModal() {
    state.showLogModal = !state.showLogModal;
    dom.logbookPanel.classList.toggle('hidden', !state.showLogModal);
    if (state.showLogModal) {
      renderLogbookTable();
    }
  }

  function renderLogbookTable() {
    if (!dom.logbookBody) return;
    dom.logbookBody.innerHTML = '';

    const acidCfg = window.Kinetics.getAcidConfig(state.acidId);
    dom.logbookSummary.textContent =
      `Ácido: ${acidCfg.label} ([HCl]mezcla = ${acidCfg.mixMolar.toFixed(2)} M) | ` +
      `l = 1.0 dm | T = 20.0 °C | Δt_m = ${state.deltaTmSec.toFixed(2)} s | ` +
      `α₀ = +${state.alpha0Measured.toFixed(2)}° | α_∞ = ${state.alphaInfMeasured.toFixed(2)}°`;

    // Fila t = 0
    const tr0 = document.createElement('tr');
    tr0.innerHTML = `
      <td>0 (Blanco)</td>
      <td>0.0</td>
      <td>0.00</td>
      <td>+${state.alpha0Measured.toFixed(2)}°</td>
      <td>0.0000</td>
      <td>0.0000</td>
      <td>1.0000</td>
    `;
    dom.logbookBody.appendChild(tr0);

    state.dataRows.forEach((r, i) => {
      const tr = document.createElement('tr');
      const aStr = (r.alphaT >= 0 ? '+' : '') + r.alphaT.toFixed(2) + '°';
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.tCronSec.toFixed(1)}</td>
        <td>${r.tCorrSec.toFixed(2)}</td>
        <td class="${r.alphaT < 0 ? 'levo-cell' : 'dextro-cell'}">${aStr}</td>
        <td>${r.lnTerm.toFixed(4)}</td>
        <td>${r.x.toFixed(4)}</td>
        <td>${r.oneMinusX.toFixed(4)}</td>
      `;
      dom.logbookBody.appendChild(tr);
    });

    if (state.infinityReached) {
      const trInf = document.createElement('tr');
      trInf.innerHTML = `
        <td>∞ (24 hs)</td>
        <td>86400</td>
        <td>∞</td>
        <td class="levo-cell">${state.alphaInfMeasured.toFixed(2)}°</td>
        <td>—</td>
        <td>1.0000</td>
        <td>0.0000</td>
      `;
      dom.logbookBody.appendChild(trInf);
    }
  }

  // ===========================================================================
  // EVENTOS DE TECLADO, RUEDA DEL MOUSE Y BUCLE DE ANIMACIÓN
  // ===========================================================================
  function bindEvents() {
    window.addEventListener('keydown', e => {
      if (state.phase === 'calibration' && !state.calibDone) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          rotateDial(e.shiftKey ? -1.0 : -0.1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          rotateDial(e.shiftKey ? 1.0 : 0.1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          checkCalibrationMatch();
        }
      }
    });

    dom.sceneCanvas.addEventListener(
      'wheel',
      e => {
        if (state.phase === 'calibration' && !state.calibDone) {
          e.preventDefault();
          const step = e.deltaY < 0 ? 0.1 : -0.1;
          rotateDial(step);
        }
      },
      { passive: false }
    );

    dom.btnMute.addEventListener('click', () => {
      const isMuted = window.AudioEngine.toggleMute();
      dom.btnMute.textContent = isMuted ? '🔇 Audio OFF' : '🔊 Audio ON';
      dom.btnMute.classList.toggle('muted', isMuted);
    });

    dom.btnLogbook.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      toggleLogbookModal();
    });

    dom.btnCloseLog.addEventListener('click', () => {
      window.AudioEngine.playSelect();
      toggleLogbookModal();
    });
  }

  function startRenderLoop() {
    function frame() {
      window.Polarimeter.renderScene(dom.sceneCanvas, state);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  return {
    init: function () {
      cacheDom();
      bindEvents();
      updateHud();
      renderLogbookTable();

      const sc = window.Dialogs.scenes.scene0_intro;
      setDialog(sc.speaker, sc.mood, sc.text, sc.options);
      startRenderLoop();
    }
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  window.Game.init();
});

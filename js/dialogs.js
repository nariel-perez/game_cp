/**
 * dialogs.js
 * Guion completo de diálogos con modismos argentinos de laboratorio de Exactas,
 * opciones de jugador y mensajes reactivos (basado en DIALOGOS_Y_EVENTOS.md).
 */

window.Dialogs = {
  characters: {
    jtp: {
      name: 'El JTP (Profe de TP)',
      role: 'Jefe de Trabajos Prácticos · Mate en mano',
      color: '#ffd166'
    },
    ayudante: {
      name: 'Ayudante de Primera',
      role: 'Narrador · Sobreviviente de la Cátedra',
      color: '#7bdff2'
    },
    alerta: {
      name: '¡ALERTA DE LABORATORIO!',
      role: 'Evento Crítico',
      color: '#ff5964'
    }
  },

  scenes: {
    // ESCENA 0: Entrada al Laboratorio y Elección de la Misión
    scene0_intro: {
      speaker: 'jtp',
      mood: 'mate',
      text: '«¡Te damos la bienvenida al laboratorio de cinética química! ¡Por las barbas de Faraday, qué alegría tenerte por acá! Ajustate el guardapolvo y las gafas de seguridad antes de empezar. Hoy nos toca una de las experiencias fundamentales: Cinética de Inversión de la Sacarosa por Polarimetría. Vamos a seguir la catálisis ácida paso a paso. Antes de tomar las pipetas, decime: ¿con qué concentración de ácido querés realizar la experiencia hoy?»',
      options: [
        {
          id: 'choose_3M',
          label: '🧪 Elijo HCl 3 M (Tranqui, cinética a ritmo humano)',
          action: 'selectAcid3M'
        },
        {
          id: 'choose_6M',
          label: '⚡ Elijo HCl 6 M (Modo activo, cinética el doble de rápida)',
          action: 'selectAcid6M'
        },
        {
          id: 'ask_inversion',
          label: '🤔 ¿Por qué se denomina "inversión" a esta reacción?',
          action: 'explainInversion'
        }
      ]
    },

    scene0_explain_inversion: {
      speaker: 'jtp',
      mood: 'explicando',
      text: '«¡Una pregunta clásica y fundamental! La sacarosa inicial es marcadamente dextrógira (+66.4°). A medida que el ácido cataliza la hidrólisis, se generan cantidades equimolares de glucosa (+52.7°) y fructosa (con un poder rotatorio fuertemente levógiro de -92.0°). Como la fructosa tiene mayor magnitud rotatoria negativa que el aporte positivo de la glucosa, el ángulo óptico neto cambia de signo y pasa a ser negativo. ¡Por la ley de Biot, el sentido de rotación se invirtió! Ahora sí, elijamos la concentración de ácido.»',
      options: [
        {
          id: 'choose_3M',
          label: '🧪 Elijo HCl 3 M (Tranqui, cinética a ritmo humano)',
          action: 'selectAcid3M'
        },
        {
          id: 'choose_6M',
          label: '⚡ Elijo HCl 6 M (Modo activo, cinética el doble de rápida)',
          action: 'selectAcid6M'
        }
      ]
    },

    scene0_selected_3M: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«Una elección muy prudente. Con HCl 3 M (1.5 M efectivo en la mezcla), la cinética transcurre a un ritmo pausado y permite registrar las lecturas con tranquilidad. ¡Comencemos con la preparación de las soluciones!»',
      options: [
        {
          id: 'go_prep',
          label: '⚗️ Ir a la Mesada a Preparar las Soluciones',
          action: 'startScene1Prep'
        }
      ]
    },

    scene0_selected_6M: {
      speaker: 'jtp',
      mood: 'sorpresa',
      text: '«¡Una opción con mucha energía! Al duplicar los protones, la velocidad se duplica y el tiempo de vida media desciende a unos 10 minutos. Habrá que tomar las lecturas con agilidad. ¡Vamos a preparar las soluciones!»',
      options: [
        {
          id: 'go_prep',
          label: '⚗️ Ir a la Mesada a Preparar las Soluciones',
          action: 'startScene1Prep'
        }
      ]
    },

    // ESCENA 1: Preparación del Elixir (Sacarosa 40% y el Blanco)
    scene1_prep_step1: {
      speaker: 'ayudante',
      mood: 'normal',
      text: '«Disolviste 20.0 g de sacarosa pura en la balanza analítica hasta completar 50 mL de solución madre al 40% p/v. Ahora tomás 25 mL de esa solución y la mezclás en un Erlenmeyer con 25 mL de agua destilada: tenés tu blanco listo con sacarosa al 20% p/v para medir α₀.»',
      options: [
        {
          id: 'prep_next',
          label: '👌 Solución Blanco Lista · Escuchar al JTP',
          action: 'scene1JtpAdvice'
        }
      ]
    },

    scene1_prep_step2: {
      speaker: 'jtp',
      mood: 'serio',
      text: '«Un momento antes de avanzar. Antes de incorporar el ácido, debemos medir α₀ (el ángulo a tiempo cero con el blanco acuoso). Si este valor inicial tiene error, afectará el cálculo de toda la serie cinética posterior. Acerquémonos al polarímetro.»',
      options: [
        {
          id: 'go_polarimeter_calib',
          label: '🔭 Acercarse al Polarímetro de Laurent',
          action: 'startScene2Calibration'
        }
      ]
    },

    // ESCENA 2: El Ocular de Laurent (Calibración Manual de alpha_0)
    scene2_calib_intro: {
      speaker: 'jtp',
      mood: 'explicando',
      text: '«Asomate al ocular. Ese círculo dividido es el campo bipartito de Laurent. Usá los botones, las flechas del teclado (←/→) o la ruedita del mouse para rotar el analizador. El objetivo es igualar ambas mitades en la misma penumbra oscura, donde el ojo humano es mucho más sensible al contraste.»',
      farError: '«¡Por las barbas de Faraday! La asimetría entre ambos campos es muy marcada; un semicírculo está totalmente brillante y el otro en sombras. Rotá el dial hacia los ángulos positivos cercanos a +13°.»',
      brightError: '«¡Cuidado con la vista! Ambos campos están en brillo total. La guía indica claramente que el ojo humano es mucho más sensible a las diferencias de intensidad en la penumbra oscura, cuando la iluminación es tenue. Busquemos el ajuste fino cerca de +13.3°.»',
      closeError: '«Muy cerca. Si observás con atención, una de las mitades conserva una leve sombra. Aplicá el ajuste fino de 0.1° hasta lograr la penumbra simétrica.»',
      successAyudante: function (alpha0) {
        return `«¡CLAC! Ambos campos quedaron fundidos en una penumbra perfecta. Lectura registrada en la libreta: α₀ = +${alpha0.toFixed(2)}°. ¡Subiste de nivel! Tu agudeza óptica sumó +10 de respeto en la cátedra.»`;
      },
      successJtp: '«¡Excelente calibración! Muy buen ajuste óptico. Registremos ese valor con precisión porque ahora llega el momento clave: el contacto con el ácido catalizador.»'
    },

    // ESCENA 3: El Desafío del Tiempo Cero (Mezcla y Delta t_m)
    scene3_mix_intro: {
      speaker: 'jtp',
      mood: 'serio',
      text: '«Llegó el instante del tiempo cero. En el momento exacto en que la solución ácida entre en contacto con los 25 mL de sacarosa, comienza la reacción. Presioná el botón para iniciar el vertido y el cronómetro, y esperá al 100% de mezcla para registrar el tiempo de mezcla Δt_m.»',
      TooShort: '«¡Un momento! Todavía no se completó el vertido ni la homogeneización del ácido. Esperá hasta que el indicador de mezcla llegue al 100%.»',
      success: function (deltaTm, t0Corr) {
        return `«¡Impecable! Registro cronometrado en Δt_m = ${deltaTm.toFixed(2)} s. Aplicamos el criterio cinético de la guía para el tiempo cero (t₀ = Δt_m / 2 = ${t0Corr.toFixed(2)} s). A cada tiempo registrado en el cronómetro se le descontará esta corrección.»`;
      }
    },

    // ESCENA 4: El Rito de la Celda (La Burbuja Traicionera)
    scene4_cell_intro: {
      speaker: 'ayudante',
      mood: 'normal',
      text: '«Enjuagaste la celda de 10 cm (1.0 dm) dos veces con una pequeña porción de la mezcla reactiva para evitar dilución residual, la llenaste al ras y colocaste la tapa a rosca... Pero mirá a trasluz.»',
      options: [
        {
          id: 'inspect_cell',
          label: '👀 Mirar el Tubo Polarimétrico a Contraluz',
          action: 'triggerBubbleAlert'
        }
      ]
    },

    scene4_bubble_alert: {
      speaker: 'jtp',
      mood: 'alerta',
      text: '«¡Por el fantasma de Arrhenius! Quedó una burbuja de aire justo en el centro del tubo. Si el haz de luz incide ahí, la dispersión óptica va a arruinar las lecturas. ¿Cómo procedemos?»',
      options: [
        {
          id: 'bubble_ignore',
          label: '🤷 Dejarla ahí, la luz pasa por los costados',
          action: 'bubbleChoiceIgnore'
        },
        {
          id: 'bubble_shake',
          label: '🌪️ Agitar la celda con fuerza para desarmarla',
          action: 'bubbleChoiceShake'
        },
        {
          id: 'bubble_tilt',
          label: '👌 Inclinar el tubo suavemente hacia la ampolla reservorio',
          action: 'bubbleChoiceTilt'
        }
      ]
    },

    scene4_bubble_ignore: {
      speaker: 'jtp',
      mood: 'enojado',
      text: '«¡Cuidado! Si dejamos esa burbuja en el camino óptico, la refracción distorsionará por completo la ley de Malus y las medidas rotatorias. Pensemos en la geometría del tubo polarimétrico.»'
    },

    scene4_bubble_shake: {
      speaker: 'ayudante',
      mood: 'alerta',
      text: '«Al agitar con fuerza, la burbuja grande se dividió en numerosas microburbujas espumosas que enturbian el líquido. Hubo que vaciar y volver a enrasar el tubo... y la burbuja volvió a aparecer. Probemos con una maniobra más suave.»'
    },

    scene4_bubble_success: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«¡Exacto! Para eso está diseñada la ampolla ensanchada del tubo polarimétrico. La burbuja quedó alojada en la parte superior y el camino óptico de 1.0 dm quedó totalmente despejado. ¡Vamos al polarímetro!»',
      options: [
        {
          id: 'start_kinetics',
          label: '🔬 Colocar Celda en la Cuna e Iniciar Toma de 20 Puntos',
          action: 'startScene5Kinetics'
        }
      ]
    },

    // ESCENA 5: El Barrido Cinético (Toma de Datos Rápida - 20 puntos + alpha_inf)
    scene5_kinetics_intro: {
      speaker: 'jtp',
      mood: 'mate',
      text: '«Habiendo verificado el manejo manual del ocular de Laurent, habilitamos el modo ágil del analizador para registrar sistemáticamente los 20 puntos cinéticos de la reacción. Pulsá el botón de avance para ir registrando las lecturas.»',
      comments: {
        first: function (alpha, tMin) {
          return `«Punto 1 (t = ${tMin} min): α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. Comienza el seguimiento cinético: la sacarosa predomina en la mezcla, pero su concentración ya comienza a descender.»`;
        },
        early: function (pt, alpha) {
          return `«Punto ${pt}/20 registrado: α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. La rotación desciende sostenidamente a medida que los protones catalizan la hidrólisis de los enlaces glucosídicos.»`;
        },
        mid: function (pt, alpha, xFrac) {
          return `«Punto ${pt}/20: α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. Ya se hidrolizó el ${(xFrac * 100).toFixed(1)}% de la sacarosa inicial. ¡Continuemos registrando!»`;
        },
        zeroCross: function (pt, alpha) {
          return `«¡Atención al dial en el punto ${pt}: α_t = ${alpha.toFixed(2)}°! ¡Acaba de cruzar el cero óptico! La solución pasa a ser nítidamente LEVÓGIRA. El aporte rotatorio negativo de la fructosa liberada (-92°) supera a la sacarosa remanente y a la glucosa.»`;
        },
        late: function (pt, alpha, xFrac) {
          return `«Punto ${pt}/20: α_t = ${alpha.toFixed(2)}° (conversión ${(xFrac * 100).toFixed(1)}%). La velocidad de cambio disminuye al aproximarse al equilibrio de la hidrólisis completa.»`;
        },
        completed20: function (alpha) {
          return `«¡Punto 20/20 registrado (α_t = ${alpha.toFixed(2)}°)! Ya tenemos toda la curva cinética. Ahora habilitamos el salto temporal de 24 horas para medir el ángulo a tiempo infinito (α_∞).»`;
        },
        infinityDone: function (alphaInf) {
          return `«¡Al día siguiente en el laboratorio! Llegamos a t = ∞ (24 hs). La hidrólisis de la sacarosa es completa (x ≈ 1.0). Registramos la lectura final: α_∞ = ${alphaInf.toFixed(2)}°. ¡Por la constante de Arrhenius y la ley de Biot, tenemos la serie completa!»`;
        }
      }
    },

    // ESCENA 6: El Cuaderno de Campo, Mini-Gráfico y Exportación .txt
    scene6_final: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«¡Excelente labor experimental! Mirá los gráficos en pantalla: el ajuste lineal de ln((α_∞ - α_t)/(α_∞ - α_0)) contra el tiempo refleja con claridad la cinética de pseudo-primer orden. Descargá el archivo .txt con todos los datos tabulados para calcular la constante k y armar tu informe.»'
    }
  }
};

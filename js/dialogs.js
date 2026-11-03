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
      text: '«¡Qué hacés, fiera! ¿Todo en orden? Ponete el guardapolvo y las gafas de seguridad antes de que pise el decano. Hoy nos toca el clásico de clásicos: Cinética de Inversión de la Sacarosa por Polarimetría. Vamos a cazar protones en acción. Pero antes de agarrar las pipetas, decime: ¿con qué concentración de ácido querés batirte a duelo hoy?»',
      options: [
        {
          id: 'choose_3M',
          label: '🧪 Elijo HCl 3 M (Tranqui, cinética a ritmo humano)',
          action: 'selectAcid3M'
        },
        {
          id: 'choose_6M',
          label: '⚡ Elijo HCl 6 M (Modo furioso, cinética el doble de rápida)',
          action: 'selectAcid6M'
        },
        {
          id: 'ask_inversion',
          label: '🤔 Che, ¿por qué se le dice "inversión" si no estamos dando vuelta el frasco?',
          action: 'explainInversion'
        }
      ]
    },

    scene0_explain_inversion: {
      speaker: 'jtp',
      mood: 'explicando',
      text: '«¡Linda pregunta de coloquio, che! Escuchá: la sacarosa original es recontra dextrógira (+66.4°). Pero a medida que el ácido la parte al medio, te genera glucosa (+52.7°) y fructosa (que es una bestia levógira de -92.0°). Al final del día, la fructosa le gana la pulseada a la glucosa y el ángulo neto te queda negativo. El signo de rotación SE INVIRTIÓ. De ahí el nombre, papá. Bueno, basta de charla, elegí el ácido.»',
      options: [
        {
          id: 'choose_3M',
          label: '🧪 Elijo HCl 3 M (Tranqui, cinética a ritmo humano)',
          action: 'selectAcid3M'
        },
        {
          id: 'choose_6M',
          label: '⚡ Elijo HCl 6 M (Modo furioso, cinética el doble de rápida)',
          action: 'selectAcid6M'
        }
      ]
    },

    scene0_selected_3M: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«Bien ahí, una persona sensata. Con HCl 3 M (1.5 M en la mezcla) nos da tiempo a tomar un matecito entre lecturas sin quemarnos las pestañas. ¡Arrancamos con la preparación de las soluciones!»',
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
      text: '«¡Epa, qué picante venimos hoy! Duplicás los protones, duplicás la velocidad. La vida media se va a caer en picada a casi 10 minutos. ¡Vas a tener que estar re afilado porque esto vuela! ¡Vamos a preparar las soluciones!»',
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
      text: '«Pesaste 20.0 g de sacarosa pura en la balanza analítica y enrasaste con agua destilada en un matraz de 50 mL para obtener tu solución madre al 40% p/v. Ahora pipeteás 25 mL de sacarosa + 25 mL de agua destilada en un Erlenmeyer: ¡listo tu blanco al 20% p/v para medir α₀!»',
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
      text: '«Pará la mano un toque. Antes de meterle ácido a nada, tenemos que medir α₀ (el ángulo a tiempo cero con el blanco acuoso). Si medís para el diablo este blanco, toda la cinética te va a dar una curva que parece una montaña rusa de la costa. Vamos al polarímetro.»',
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
      text: '«Asomate al ocular, che. ¿Ves ese círculo partido al medio? Es el campo bipartito de Laurent. Usá los botones, las flechas del teclado (←/→) o la ruedita del mouse para girar el analizador. Tenés que dejar las dos mitades EN LA MISMÍSIMA PENUMBRA OSCURA.»',
       farError: '«¡Pero por las barbas de Faraday, che! De un lado parece la cancha de Boca iluminada y del otro una boca de lobo. Metele mano a la perilla que estamos lejísimos.»',
      brightError: '«Pará, pará. Los dos lados están blancos como papel, te vas a encandilar la retina. La guía dice clarito que el ojo humano detecta el cambio mucho mejor en la penumbra oscura, cuando la luz casi se apaga. Seguí buscando cerca de +13.3°.»',
      closeError: '«Tibio, tibio... Está casi igualado, pero si afinás el ojo se nota que un lado todavía tira más sombra. Dale con el ajuste fino de 0.1° hasta clavar la igualdad.»',
      successAyudante: function (alpha0) {
        return `«¡CLAC! Ambos campos quedaron fundidos en una penumbra perfecta. Lectura registrada en la libreta: α₀ = +${alpha0.toFixed(2)}°. ¡Subiste de nivel! Tu agudeza óptica sumó +10 de respeto en la cátedra.»`;
      },
      successJtp: '«¡Una pinturita! Qué mano tenés, che. Guardate ese número bajo siete llaves que ahora se viene lo picante: la mezcla con el ácido.»'
    },

    // ESCENA 3: El Desafío del Tiempo Cero (Mezcla y Delta t_m)
    scene3_mix_intro: {
      speaker: 'jtp',
      mood: 'serio',
      text: '«Llegó la hora de la verdad. Al momento exacto en que la primera gota de HCl toque los 25 mL de sacarosa, arranca la reacción. El tiempo no perdona. Mantené apretado el botón de vertido hasta vaciar la probeta y agitar para registrar el tiempo de mezcla Δt_m.»',
      TooShort: '«¡Pará un cachito! Soltaste antes de terminar de volcar el ácido. Mantené apretado hasta que el medidor de mezcla llegue al 100%.»',
      success: function (deltaTm, t0Corr) {
        return `«¡Impecable! Cronómetro clavado en Δt_m = ${deltaTm.toFixed(2)} s. Y como somos gente de ciencia rigurosa, no nos comemos los mocos: aplicamos la corrección de tiempo de la guía (t₀ = Δt_m / 2 = ${t0Corr.toFixed(2)} s). A cada lectura del reloj le descontamos esos ${t0Corr.toFixed(2)} segundos.»`;
      }
    },

    // ESCENA 4: El Rito de la Celda (La Burbuja Traicionera)
    scene4_cell_intro: {
      speaker: 'ayudante',
      mood: 'normal',
      text: '«Enjuagaste la celda de 10 cm (1.0 dm) dos veces con una pequeña porción de la mezcla reactiva para evitar dilución residual, la llenaste al ras y le clavaste la tapa a rosca... Pero mirá a trasluz.»',
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
      text: '«¡Por el fantasma de Arrhenius! Te quedó una burbuja gigante plantada justo en el medio del tubo. Si el haz de luz pega ahí, la dispersión óptica nos va a mandar directo a marzo. ¿Qué hacés?»',
      options: [
        {
          id: 'bubble_ignore',
          label: '🤷 Dejala ahí, total la luz pasa por los costados',
          action: 'bubbleChoiceIgnore'
        },
        {
          id: 'bubble_shake',
          label: '🌪️ Sacudir la celda como si fuera un pomo de mayonesa',
          action: 'bubbleChoiceShake'
        },
        {
          id: 'bubble_tilt',
          label: '👌 Inclinar el tubo con cariño hacia la ampolla reservorio',
          action: 'bubbleChoiceTilt'
        }
      ]
    },

    scene4_bubble_ignore: {
      speaker: 'jtp',
      mood: 'enojado',
      text: '«¿Vos me estás cargando? Si metés esa burbuja al polarímetro, la refracción te va a tirar valores del planeta Marte y la ley de Malus se va al tacho. Pensá un segundo, che.»'
    },

    scene4_bubble_shake: {
      speaker: 'ayudante',
      mood: 'alerta',
      text: '«¡Desastre total! La burbuja grande se desarmó en cincuenta microburbujas espumosas. El tubo parece una soda. Tuviste que vaciar y volver a llenar... y la burbuja grande volvió a aparecer. Probá con más sutileza.»'
    },

    scene4_bubble_success: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«¡Claro que sí, pibe! Para eso tiene esa jorobita ensanchada el tubo polarimétrico. La burbuja quedó atrapada arriba y el camino óptico de 1.0 dm está más limpio que quirófano. ¡Al polarímetro!»',
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
      text: '«Bueno, fiera, como ya demostraste que sabés alinear el polarímetro a mano como los dioses, ahora dejamos que el analizador trabaje en modo rápido para no estar acá hasta la noche. Andá dándole al botón de avance para capturar los 20 puntos de la reacción.»',
      comments: {
        first: function (alpha, tMin) {
          return `«Punto 1 (t = ${tMin} min): α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. Recién arranca el baile. La sacarosa todavía manda, pero ya empezó a caer.»`;
        },
        early: function (pt, alpha) {
          return `«Punto ${pt}/20 registrado: α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. Mirá cómo baja esa rotación, papá. El HCl no tiene piedad con los enlaces glucosídicos.»`;
        },
        mid: function (pt, alpha, xFrac) {
          return `«Punto ${pt}/20: α_t = ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}°. Ya se hidrolizó el ${(xFrac * 100).toFixed(1)}% de la sacarosa inicial. ¡Seguí dándole!»`;
        },
        zeroCross: function (pt, alpha) {
          return `«¡PARÁ TODO! Mirá el dial en el punto ${pt}: α_t = ${alpha.toFixed(2)}°. ¡Acaba de cruzar el cero! La solución se volvió oficialmente LEVÓGIRA. La fructosa liberada (-92°) ya pesa más que la sacarosa y la glucosa juntas. ¡Hermosa la fisicoquímica cuando sale bien!»`;
        },
        late: function (pt, alpha, xFrac) {
          return `«Punto ${pt}/20: α_t = ${alpha.toFixed(2)}° (conversión ${(xFrac * 100).toFixed(1)}%). La curva ya va planchando asintóticamente. La sacarosa está en las últimas.»`;
        },
        completed20: function (alpha) {
          return `«¡Punto 20/20 clavado (α_t = ${alpha.toFixed(2)}°)! Ya tenés toda la curva cinética. Ahora habilitamos el salto temporal de 24 horas para medir el ángulo a tiempo infinito (α_∞).»`;
        },
        infinityDone: function (alphaInf) {
          return `«¡Al día siguiente en el laboratorio! Llegamos a t = ∞ (24 hs). La sacarosa murió por la patria, se hidrolizó toda (x ≈ 1.0). Clavamos la lectura final: α_∞ = ${alphaInf.toFixed(2)}°. ¡Tenemos la serie completa, maestro!»`;
        }
      }
    },

    // ESCENA 6: El Cuaderno de Campo, Mini-Gráfico y Exportación .txt
    scene6_final: {
      speaker: 'jtp',
      mood: 'feliz',
      text: '«Che, posta, impecable laburo. Mirá lo que es ese gráfico preliminar de ln((α_∞ - α_t)/(α_∞ - α_0)) contra el tiempo: te quedó una recta tan derecha que podés tirar un tiro al blanco. Descargate el archivo .txt con todos los encabezados y la tabla para armar tu informe.»'
    }
  }
};

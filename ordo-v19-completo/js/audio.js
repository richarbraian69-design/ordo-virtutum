/* Ordo Virtutum — áudio: a música de cada lugar (canto, flauta, alaúde, harpa, órgão, charamela e tambor,
   sobre um bordão e um fundo de vento, água, mar ou gotas), trocada com calma quando se muda de área; e os efeitos. */
(function (OV) {
  'use strict';
  const A = { ctx: null, on: true, temaAtual: null };
  let master, musicGain, revIn, noiseBuf, fxGain, fxRev;
  A.volMusica = 0.7; A.volEfeitos = 0.85;
  const nivelMusica = () => (A.on ? 0.5 : 0) * A.volMusica / 0.7;

  /* ---- os temas ----
     raiz: a nota-base (Hz) · modo: os intervalos da escala · bordao: múltiplos da raiz · voz: o instrumento da melodia
     acomp: o acompanhamento · passo: a duração do tempo (s) · pausa: o silêncio entre as frases · leito: o som de fundo */
  const MODOS = { dorico: [0, 2, 3, 5, 7, 9, 10], frigio: [0, 1, 3, 5, 7, 8, 10], lidio: [0, 2, 4, 6, 7, 9, 11], mixolidio: [0, 2, 4, 5, 7, 9, 10], eolio: [0, 2, 3, 5, 7, 8, 10], jonio: [0, 2, 4, 5, 7, 9, 11] };
  const TEMAS = {
    vale: { raiz: 146.83, modo: 'dorico', bordao: [0.5, 0.75], bordaoTipo: 'serra', voz: 'canto', acomp: null, passo: 0.62, pausa: [3, 6], leito: 'vento', vol: 0.9 },
    mosteiro: { raiz: 146.83, modo: 'dorico', bordao: [0.5, 0.75, 1], bordaoTipo: 'orgao', voz: 'coro', acomp: null, passo: 0.75, pausa: [2.5, 4], leito: null, vol: 1 },
    vila: { raiz: 196, modo: 'mixolidio', bordao: [0.5, 0.75], bordaoTipo: 'serra', voz: 'flauta', acomp: 'alaude', passo: 0.32, pausa: [1.2, 2.5], leito: null, vol: 0.85, danca: true },
    floresta: { raiz: 110, modo: 'eolio', bordao: [0.5], bordaoTipo: 'seno', voz: 'flautaGrave', acomp: null, passo: 0.7, pausa: [4, 8], leito: 'vento', extra: 'passaros', vol: 0.8 },
    ermida: { raiz: 164.81, modo: 'frigio', bordao: [0.5, 0.75], bordaoTipo: 'seno', voz: 'canto', acomp: null, passo: 0.9, pausa: [5, 9], leito: 'ventoForte', vol: 0.85, solo: true },
    moinho: { raiz: 174.61, modo: 'lidio', bordao: [0.5], bordaoTipo: 'seno', voz: 'harpa', acomp: 'harpa', passo: 0.36, pausa: [2, 4], leito: 'agua', vol: 0.8 },
    capela: { raiz: 130.81, modo: 'jonio', bordao: [0.5, 0.75, 1], bordaoTipo: 'orgao', voz: 'orgao', acomp: null, passo: 0.9, pausa: [2, 4], leito: null, vol: 0.9 },
    sombrio: { raiz: 98, modo: 'frigio', bordao: [0.5, 0.707], bordaoTipo: 'serra', voz: 'flautaGrave', acomp: null, passo: 0.95, pausa: [5, 10], leito: 'gotas', vol: 0.75 },
    cripta: { raiz: 87.31, modo: 'frigio', bordao: [0.5, 0.75], bordaoTipo: 'orgao', voz: 'coroGrave', acomp: null, passo: 1.0, pausa: [4, 7], leito: 'gotas', vol: 0.9 },
    porto: { raiz: 146.83, modo: 'dorico', bordao: [0.5], bordaoTipo: 'serra', voz: 'charamela', acomp: 'alaude', passo: 0.3, pausa: [1.5, 3], leito: 'mar', vol: 0.8, danca: true },
    valdouro: { raiz: 110, modo: 'eolio', bordao: [0.5, 0.75], bordaoTipo: 'serra', voz: 'charamela', acomp: 'tambor', passo: 0.48, pausa: [2.5, 4.5], leito: 'vento', vol: 0.75 },
    corte: { raiz: 220, modo: 'jonio', bordao: [0.5], bordaoTipo: 'seno', voz: 'flauta', acomp: 'harpa', passo: 0.34, pausa: [1.5, 3], leito: null, vol: 0.8, danca: true },
    palacio: { raiz: 207.65, modo: 'eolio', bordao: [0.5, 0.71], bordaoTipo: 'orgao', voz: 'harpa', acomp: 'valsa', passo: 0.4, pausa: [1, 2], leito: null, vol: 0.8 },
    jardim: { raiz: 196, modo: 'lidio', bordao: [0.5], bordaoTipo: 'seno', voz: 'flauta', acomp: 'harpa', passo: 0.55, pausa: [3, 6], leito: 'agua', extra: 'passaros', vol: 0.75 },
    chefe: { raiz: 73.42, modo: 'frigio', bordao: [1, 1.414], bordaoTipo: 'serra', voz: 'coroGrave', acomp: 'tamborGuerra', passo: 0.5, pausa: [0.6, 1.4], leito: null, vol: 1 }
  };
  A.TEMAS = TEMAS;
  // de qual tema é cada lugar
  const LUGAR = {
    claustro: 'mosteiro', mosteiro: 'mosteiro', vila: 'vila', floresta: 'floresta', covil: 'sombrio', capela: 'capela', moinho: 'moinho', ermida: 'ermida',
    mina: 'sombrio', acampamento: 'sombrio', cripta: 'mosteiro', ossuario: 'cripta', sala: 'cripta', camara: 'cripta', vale: 'vale',
    nicolau: 'mosteiro', farol: 'ermida', praca: 'porto', mercado: 'porto', celeiros: 'porto', barao: 'porto', pobres: 'sombrio', cais: 'porto', porto: 'porto',
    valdouro: 'valdouro', contas: 'valdouro', boca: 'sombrio', galeria: 'sombrio', acamp_min: 'valdouro', barbara: 'capela', cava: 'sombrio', minas: 'valdouro',
    belmonte: 'corte', palacio: 'palacio', espelhos: 'jardim', lago: 'jardim', figueira: 'jardim', corte: 'corte'
  };
  A.LUGAR = LUGAR;
  A.temaDoLugar = z => LUGAR[z] || 'vale';

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try { A.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { A.ctx = null; return; }
    const AC = A.ctx;
    master = AC.createGain(); master.gain.value = 0.8; master.connect(AC.destination);
    const conv = AC.createConvolver(); const len = Math.floor(AC.sampleRate * 3.6);
    const ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    conv.buffer = ir; const rg = AC.createGain(); rg.gain.value = 0.55; conv.connect(rg); rg.connect(master); revIn = conv;
    musicGain = AC.createGain(); musicGain.gain.value = nivelMusica(); musicGain.connect(master); musicGain.connect(revIn);
    fxGain = AC.createGain(); fxGain.gain.value = A.volEfeitos; fxGain.connect(master);
    fxRev = AC.createGain(); fxRev.gain.value = A.volEfeitos; fxRev.connect(revIn);
    noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * 2), AC.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    A.tema(A.temaPedido || 'vale');
  };

  /* ---- instrumentos (cada nota vai para o barramento do tema) ---- */
  function env(g, t, a, d, vol, sol) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); if (sol) { g.gain.setValueAtTime(vol, t + d - 0.08); g.gain.linearRampToValueAtTime(0, t + d + 0.08); } else g.gain.exponentialRampToValueAtTime(0.0008, t + d); }
  function osc(tipo, f, t, d, bus) { const o = A.ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + d + 0.2); return o; }
  const INST = {
    canto(f, t, d, v, bus, grave) {
      const AC = A.ctx, o = osc('sawtooth', f, t, d);
      const vib = AC.createOscillator(); vib.frequency.value = 4.8; const vg = AC.createGain(); vg.gain.value = f * 0.006; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + d + 0.2);
      const f1 = AC.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = grave ? 450 : 650; f1.Q.value = 4;
      const f2 = AC.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = grave ? 820 : 1080; f2.Q.value = 6;
      const g = AC.createGain(); env(g, t, 0.14, d, v, true); o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(bus);
    },
    coro(f, t, d, v, bus) { INST.canto(f, t, d, v, bus); INST.canto(f * 0.75, t, d, v * 0.55, bus); INST.canto(f * 0.5, t, d, v * 0.35, bus, true); },
    coroGrave(f, t, d, v, bus) { INST.canto(f * 0.5, t, d, v, bus, true); INST.canto(f * 0.375, t, d, v * 0.6, bus, true); },
    flauta(f, t, d, v, bus, grave) {
      const AC = A.ctx, o = osc(grave ? 'sine' : 'triangle', f * (grave ? 1 : 2), t, d);
      const vib = AC.createOscillator(); vib.frequency.value = 5.2; const vg = AC.createGain(); vg.gain.value = f * 0.008; vib.connect(vg); vg.connect(o.frequency); vib.start(t + 0.15); vib.stop(t + d + 0.2);
      const g = AC.createGain(); env(g, t, 0.06, d, v * 0.9, true); o.connect(g); g.connect(bus);
      // o sopro
      const s = AC.createBufferSource(); s.buffer = noiseBuf; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 4; bp.Q.value = 2;
      const gs = AC.createGain(); env(gs, t, 0.03, Math.min(0.25, d), v * 0.12); s.connect(bp); bp.connect(gs); gs.connect(bus); s.start(t); s.stop(t + 0.3);
    },
    flautaGrave(f, t, d, v, bus) { INST.flauta(f, t, d, v, bus, true); },
    alaude(f, t, d, v, bus) {
      const AC = A.ctx, o = osc('sawtooth', f, t, 1.4), lp = AC.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(f * 7, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.5);
      const g = AC.createGain(); env(g, t, 0.005, 1.2, v * 0.55); o.connect(lp); lp.connect(g); g.connect(bus);
    },
    harpa(f, t, d, v, bus) {
      const AC = A.ctx;
      [[1, 1], [2, 0.35], [3, 0.12]].forEach(([m, a]) => { const o = osc('sine', f * m, t, 2.4); const g = AC.createGain(); env(g, t, 0.004, 2.2 / m, v * a * 0.8); o.connect(g); g.connect(bus); });
    },
    orgao(f, t, d, v, bus) {
      const AC = A.ctx;
      [[1, 1], [2, 0.5], [3, 0.25], [4, 0.15]].forEach(([m, a]) => { const o = osc('sine', f * m, t, d); const g = AC.createGain(); env(g, t, 0.18, d, v * a * 0.5, true); o.connect(g); g.connect(bus); });
    },
    charamela(f, t, d, v, bus) {
      const AC = A.ctx, o = osc('square', f * 2, t, d);
      const vib = AC.createOscillator(); vib.frequency.value = 5.6; const vg = AC.createGain(); vg.gain.value = f * 0.012; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + d + 0.2);
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.6;
      const g = AC.createGain(); env(g, t, 0.04, d, v * 0.45, true); o.connect(bp); bp.connect(g); g.connect(bus);
    },
    tambor(t, v, bus, grave) {
      const AC = A.ctx, o = osc('sine', grave ? 70 : 140, t, 0.4); o.frequency.exponentialRampToValueAtTime(grave ? 38 : 70, t + 0.25);
      const g = AC.createGain(); env(g, t, 0.004, 0.35, v); o.connect(g); g.connect(bus);
      const s = AC.createBufferSource(); s.buffer = noiseBuf; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = grave ? 300 : 900;
      const gs = AC.createGain(); env(gs, t, 0.002, 0.12, v * 0.4); s.connect(bp); bp.connect(gs); gs.connect(bus); s.start(t); s.stop(t + 0.2);
    }
  };

  /* ---- um tema tocando: bordão, leito, frases e acompanhamento ---- */
  function iniciarTema(nome) {
    const T = TEMAS[nome] || TEMAS.vale, AC = A.ctx;
    const bus = AC.createGain(); bus.gain.value = 0; bus.connect(musicGain);
    bus.gain.setTargetAtTime(T.vol || 1, AC.currentTime, 1.2);
    const tema = { nome, bus, T, vivo: true, nos: [] };
    // bordão
    T.bordao.forEach((m, i) => {
      const f = T.raiz * m, tipo = T.bordaoTipo;
      if (tipo === 'orgao') [[1, 1], [2, 0.4], [3, 0.2]].forEach(([h, a]) => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f * h; const g = AC.createGain(); g.gain.value = 0.03 * a; o.connect(g); g.connect(bus); o.start(); tema.nos.push(o); });
      else {
        const o = AC.createOscillator(); o.type = tipo === 'seno' ? 'sine' : 'sawtooth'; o.frequency.value = f;
        const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = tipo === 'seno' ? 2000 : 320;
        const g = AC.createGain(); g.gain.value = tipo === 'seno' ? 0.05 : 0.035;
        const l = AC.createOscillator(); l.frequency.value = 0.06 + i * 0.03; const lg = AC.createGain(); lg.gain.value = 0.01; l.connect(lg); lg.connect(g.gain);
        o.connect(lp); lp.connect(g); g.connect(bus); o.start(); l.start(); tema.nos.push(o, l);
      }
    });
    // leito: vento, água, mar, gotas
    if (T.leito) {
      const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = AC.createBiquadFilter(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain();
      const cfg = { vento: ['bandpass', 420, 0.8, 0.035, 0.09], ventoForte: ['bandpass', 600, 0.7, 0.06, 0.07], agua: ['bandpass', 1500, 0.6, 0.03, 0.6], mar: ['lowpass', 520, 0.7, 0.07, 0.11], gotas: ['lowpass', 260, 0.7, 0.015, 0.05] }[T.leito];
      f.type = cfg[0]; f.frequency.value = cfg[1]; f.Q.value = cfg[2]; g.gain.value = cfg[3];
      l.frequency.value = cfg[4]; lg.gain.value = cfg[3] * 0.8; l.connect(lg); lg.connect(g.gain);
      s.connect(f); f.connect(g); g.connect(bus); s.start(); l.start(); tema.nos.push(s, l);
    }
    // frases da melodia (geradas na escala do modo, terminando na nota-base) e o acompanhamento
    const esc = MODOS[T.modo], nota = g => T.raiz * Math.pow(2, (esc[((g % 7) + 7) % 7] + 12 * Math.floor(g / 7)) / 12);
    function frase() {
      if (!tema.vivo || !A.ctx) return;
      let t = AC.currentTime + 0.15, g = Math.random() < 0.5 ? 0 : 4; const n = T.danca ? 10 + ((Math.random() * 6) | 0) : 6 + ((Math.random() * 6) | 0);
      const durs = T.danca ? [1, 1, 0.5, 0.5, 1, 2] : [1, 1, 1.5, 2, 1];
      for (let i = 0; i < n; i++) {
        const fim = i === n - 1;
        if (fim) g = Math.round(g / 7) * 7; else { const r = Math.random(); g += r < 0.4 ? 1 : r < 0.8 ? -1 : r < 0.9 ? 2 : -2; g = Math.max(-2, Math.min(9, g)); }
        const d = T.passo * (fim ? 3 : durs[(Math.random() * durs.length) | 0]);
        INST[T.voz](nota(g), t, d, 0.11, bus);
        if (T.voz === 'canto' && !T.solo) INST.canto(nota(g) * 0.75, t, d, 0.05, bus);
        t += d;
      }
      // o acompanhamento segue a frase
      const tot = t - AC.currentTime;
      if (T.acomp) acompanhar(T, tot, nota);
      tema.timer = setTimeout(frase, (tot + T.pausa[0] + Math.random() * (T.pausa[1] - T.pausa[0])) * 1000);
    }
    function acompanhar(T, dur, nota) {
      let t = AC.currentTime + 0.15; const fim = t + dur;
      const b = T.passo * 2;
      while (t < fim) {
        if (T.acomp === 'alaude') { INST.alaude(nota(0) * 0.5, t, b, 0.12, bus); INST.alaude(nota(4) * 0.5, t + b / 2, b, 0.08, bus); }
        else if (T.acomp === 'harpa') { [0, 2, 4, 7].forEach((g, i) => INST.harpa(nota(g) * 0.5, t + i * b / 4, b, 0.06, bus)); }
        else if (T.acomp === 'valsa') { INST.harpa(nota(0) * 0.25, t, b, 0.1, bus); INST.harpa(nota(2) * 0.5, t + b / 3, b, 0.05, bus); INST.harpa(nota(4) * 0.5, t + 2 * b / 3, b, 0.05, bus); }
        else if (T.acomp === 'tambor') { INST.tambor(t, 0.1, bus, true); INST.tambor(t + b * 0.75, 0.05, bus); }
        else if (T.acomp === 'tamborGuerra') { INST.tambor(t, 0.18, bus, true); INST.tambor(t + b / 4, 0.08, bus); INST.tambor(t + b / 2, 0.14, bus, true); INST.tambor(t + 3 * b / 4, 0.08, bus); }
        t += b;
      }
    }
    // pássaros na floresta e no jardim
    function passaros() {
      if (!tema.vivo || !A.ctx) return;
      const t = AC.currentTime + 0.05, f0 = 2200 + Math.random() * 1600;
      for (let i = 0; i < 2 + ((Math.random() * 3) | 0); i++) { const o = AC.createOscillator(); o.type = 'sine'; const ti = t + i * 0.13; o.frequency.setValueAtTime(f0, ti); o.frequency.exponentialRampToValueAtTime(f0 * 1.35, ti + 0.08); const g = AC.createGain(); env(g, ti, 0.01, 0.1, 0.025); o.connect(g); g.connect(bus); o.start(ti); o.stop(ti + 0.15); }
      tema.pass = setTimeout(passaros, 1500 + Math.random() * 5000);
    }
    tema.timer = setTimeout(frase, 600);
    if (T.extra === 'passaros') tema.pass = setTimeout(passaros, 2000);
    tema.parar = function () {
      tema.vivo = false; clearTimeout(tema.timer); clearTimeout(tema.pass);
      bus.gain.setTargetAtTime(0, AC.currentTime, 0.9);
      setTimeout(() => { tema.nos.forEach(n => { try { n.stop(); } catch (e) { } }); bus.disconnect(); }, 4500);
    };
    return tema;
  }
  // troca de tema com uma passagem suave
  A.tema = function (nome) {
    A.temaPedido = nome;
    if (!A.ctx || !musicGain) return;
    if (A.temaAtual && A.temaAtual.nome === nome) return;
    if (A.temaAtual) A.temaAtual.parar();
    A.temaAtual = iniciarTema(nome);
  };

  /* ---- efeitos ---- */
  function noise(dur, f0, f1, vol, q) {
    if (!A.ctx) return; const AC = A.ctx, t = AC.currentTime;
    const s = AC.createBufferSource(); s.buffer = noiseBuf;
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 1.2;
    bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(fxGain); s.start(t); s.stop(t + dur + 0.02);
  }
  function thump(f0, f1, dur, vol) {
    if (!A.ctx) return; const AC = A.ctx, t = AC.currentTime;
    const o = AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(fxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  A.bell = function (base, vol) {
    if (!A.ctx) return; const AC = A.ctx, t = AC.currentTime; base = base || 392; vol = vol || 0.25;
    [1, 2.4, 3, 4.2, 5.4].forEach((m, i) => {
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
      const g = AC.createGain(); g.gain.setValueAtTime(vol / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.001, t + 2.6 / (1 + i * 0.4));
      o.connect(g); g.connect(fxGain); g.connect(fxRev); o.start(t); o.stop(t + 3);
    });
  };
  A.swish = () => noise(0.18, 2400, 500, 0.22, 0.9);
  A.heavy = () => { noise(0.32, 1600, 260, 0.3, 0.8); };
  A.hit = () => { thump(140, 45, 0.16, 0.45); noise(0.08, 1800, 900, 0.2, 2); };
  A.hurt = () => { thump(90, 35, 0.3, 0.55); noise(0.2, 600, 200, 0.25, 1); };
  A.dodge = () => noise(0.22, 900, 300, 0.12, 0.7);
  A.cast = () => noise(0.3, 500, 2600, 0.12, 1.5);
  A.parry = () => { A.bell(784, 0.22); noise(0.1, 4000, 2000, 0.15, 3); };
  A.heal = () => A.bell(659, 0.14);
  A.level = () => { A.bell(523, 0.2); setTimeout(() => A.bell(659, 0.18), 180); setTimeout(() => A.bell(784, 0.18), 360); };
  A.toggle = function () {
    A.on = !A.on;
    if (A.ctx && musicGain) musicGain.gain.setTargetAtTime(nivelMusica(), A.ctx.currentTime, 0.2);
    return A.on;
  };
  // volumes separados (0 a 1): a música e os efeitos
  A.volumes = function (musica, efeitos) {
    A.volMusica = Math.max(0, Math.min(1, musica)); A.volEfeitos = Math.max(0, Math.min(1, efeitos));
    if (!A.ctx) return;
    const t = A.ctx.currentTime;
    if (musicGain) musicGain.gain.setTargetAtTime(nivelMusica(), t, 0.15);
    if (fxGain) { fxGain.gain.setTargetAtTime(A.volEfeitos, t, 0.05); fxRev.gain.setTargetAtTime(A.volEfeitos, t, 0.05); }
  };
  OV.audio = A;
})(window.OV);

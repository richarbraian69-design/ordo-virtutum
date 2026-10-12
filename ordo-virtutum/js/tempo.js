/* Ordo Virtutum — o ciclo do dia: relógio, sol e lua, céu, névoa e as Horas canônicas */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { clamp } = OV.util;

  const T = { hora: 22, SEG_HORA: 30 }; // 1 hora do jogo = 30 s reais (um dia inteiro ≈ 12 min)
  OV.tempo = T;

  // quadros-chave do céu ao longo do dia
  const NOITE = { topo: 0x0c0c22, ceu: 0x181018, n: 28, f: 100, amb: 0x4a3644, ai: 0.72, hs: 0x5a6488, hg: 0x22140e, hi: 0.48, luz: 0x9aa6d4, li: 0.62, est: 1, vela: 1, bras: 0.85, casa: 1 };
  const AURORA = { topo: 0x34407a, ceu: 0x5a3442, n: 26, f: 96, amb: 0x523436, ai: 0.62, hs: 0x8a7084, hg: 0x2a1812, hi: 0.45, luz: 0xff9466, li: 0.7, est: 0.3, vela: 0.85, bras: 0.6, casa: 0.45 };
  const MANHA = { topo: 0x5d8cc8, ceu: 0x9c8e8a, n: 34, f: 125, amb: 0x6a5850, ai: 0.66, hs: 0xb4b6c2, hg: 0x3a2c20, hi: 0.6, luz: 0xffd6ae, li: 1.0, est: 0, vela: 0.45, bras: 0.25, casa: 0 };
  const DIA = { topo: 0x4a8ad8, ceu: 0xb6c4ce, n: 42, f: 150, amb: 0x6e6258, ai: 0.7, hs: 0xc4ccd6, hg: 0x3a3024, hi: 0.72, luz: 0xfff0d6, li: 1.25, est: 0, vela: 0.35, bras: 0.15, casa: 0 };
  const TARDE = { topo: 0x587cb8, ceu: 0xb08660, n: 36, f: 130, amb: 0x6a4c3c, ai: 0.66, hs: 0xc4a07e, hg: 0x3a2418, hi: 0.6, luz: 0xffae6a, li: 1.0, est: 0, vela: 0.5, bras: 0.3, casa: 0 };
  const OCASO = { topo: 0x2c2c5a, ceu: 0x5e2e30, n: 28, f: 100, amb: 0x4e2c32, ai: 0.62, hs: 0x7a5066, hg: 0x22100e, hi: 0.45, luz: 0xff7044, li: 0.7, est: 0.35, vela: 0.9, bras: 0.6, casa: 0.7 };
  const K = [[0, NOITE], [4.5, NOITE], [5.8, AURORA], [7.2, MANHA], [9, DIA], [16, DIA], [17.6, TARDE], [19, OCASO], [20.4, NOITE], [24, NOITE]];
  const CORES = ['topo', 'ceu', 'amb', 'hs', 'hg', 'luz'];

  const ca = new THREE.Color(), cb = new THREE.Color();
  const atual = {};
  function amostrar(h) {
    let i = 0; while (i < K.length - 2 && h >= K[i + 1][0]) i++;
    const [h0, a] = K[i], [h1, b] = K[i + 1];
    const t = h1 > h0 ? clamp((h - h0) / (h1 - h0), 0, 1) : 0;
    const s = t * t * (3 - 2 * t);
    for (const k in a) {
      if (CORES.includes(k)) { ca.setHex(a[k]); cb.setHex(b[k]); atual[k] = ca.lerp(cb, s).getHex(); }
      else atual[k] = a[k] + (b[k] - a[k]) * s;
    }
    return atual;
  }

  /* ---- Horas canônicas ---- */
  const HORAS = [[0, 'Matinas'], [5, 'Laudes'], [7, 'Prima'], [9, 'Terça'], [12, 'Sexta'], [15, 'Noa'], [18, 'Vésperas'], [20.5, 'Completas']];
  T.horaCanonica = function (h) { h = h === undefined ? T.hora : h; let n = HORAS[0][1]; for (const [k, nm] of HORAS) if (h >= k) n = nm; return n; };
  T.ehDia = h => { h = h === undefined ? T.hora : h; return h >= 6 && h < 19; };
  T.ehNoite = h => { h = h === undefined ? T.hora : h; return h >= 19 || h < 5; };
  T.rotulo = function () {
    const h = Math.floor(T.hora) % 24;
    return `${T.ehDia() ? '☀' : '☾'} ${T.horaCanonica()} · ${String(h).padStart(2, '0')}h`;
  };
  T.definir = function (h) { T.hora = ((h % 24) + 24) % 24; ultimaCanonica = T.horaCanonica(); };

  const SOL_NASCE = 5.5, SOL_POE = 19.75;
  let ultimaCanonica = null;
  M.estrelas.material.transparent = true;

  function anunciar(nome) {
    const A = OV.audio, ui = OV.ui;
    if (A && A.bell) { A.bell(nome === 'Completas' || nome === 'Matinas' ? 165 : 220, 0.16); setTimeout(() => A.bell(330, 0.1), 700); }
    const frases = {
      Laudes: 'Os sinos tocam as Laudes. Amanhece.',
      Sexta: 'Sexta: o sol a pino. O demônio do meio-dia espreita os ociosos.',
      'Vésperas': 'Os sinos tocam as Vésperas. O sol se põe.',
      Completas: 'Completas. A noite cai — os vícios ficam mais ousados.'
    };
    if (ui && frases[nome]) ui.toast(frases[nome]);
  }

  /* v26: a abóbada do céu. Em cima, o azul da hora; no horizonte, a mesma cor da névoa, para o longe se fundir com o céu.
     Antes o fundo era só a cor da névoa, e o céu ficava cinza. */
  const ceuMat = new THREE.ShaderMaterial({
    uniforms: { topo: { value: new THREE.Color(0x4a8ad8) }, horiz: { value: new THREE.Color(0xb6c4ce) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 topo; uniform vec3 horiz; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); float k = pow(smoothstep(0.0, 0.55, h), 0.8); gl_FragColor = vec4(mix(horiz, topo, k), 1.0); }',
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false
  });
  const abobada = new THREE.Mesh(new THREE.SphereGeometry(170, 24, 14), ceuMat); abobada.renderOrder = -10; abobada.frustumCulled = false;
  M.scene.add(abobada); M.abobada = abobada;

  /* chamado por M.ambient a cada quadro */
  T.aplicar = function (dt, fx, fz) {
    const J = OV.jogo, P = OV.P;
    const jogando = J && J.modo === 'jogo';
    if (jogando && J.ativo()) {
      T.hora += dt / T.SEG_HORA; if (T.hora >= 24) T.hora -= 24;
      const c = T.horaCanonica();
      if (ultimaCanonica && c !== ultimaCanonica) anunciar(c);
      ultimaCanonica = c;
    }
    const h = jogando ? T.hora : 22;
    const subterraneo = jogando && P && P.pos.x > 200;
    const k = subterraneo ? NOITE : amostrar(h);

    M.scene.background.setHex(k.ceu); M.scene.fog.color.setHex(k.ceu);
    ceuMat.uniforms.topo.value.setHex(k.topo); ceuMat.uniforms.horiz.value.setHex(k.ceu);
    abobada.visible = !subterraneo && !(M.interiorAtual && M.veuInterior && M.veuInterior(M.interiorAtual) && M.veuInterior(M.interiorAtual).visible);
    if (M.camera) abobada.position.copy(M.camera.position);
    M.scene.fog.near = k.n; M.scene.fog.far = k.f;
    M.amb.color.setHex(k.amb); M.amb.intensity = k.ai;
    M.hemi.color.setHex(k.hs); M.hemi.groundColor.setHex(k.hg); M.hemi.intensity = k.hi;
    M.luzFator = k.vela; M.brasas.opacity = k.bras;
    // a luz das casas (portas e janelas acesas) só existe do entardecer ao amanhecer
    M.casaFator = k.casa === undefined ? 1 : k.casa;
    if (M.MAT && M.MAT.winLit) { if (!M.MAT.winLit._noite) { M.MAT.winLit._noite = M.MAT.winLit.color.clone(); M.MAT.winLit._dia = new THREE.Color(0x2a1e16); } M.MAT.winLit.color.copy(M.MAT.winLit._dia).lerp(M.MAT.winLit._noite, M.casaFator); }

    // o astro que ilumina: o sol de dia, a lua à noite (com uma pequena penumbra na troca)
    const diaSol = h >= SOL_NASCE && h < SOL_POE;
    let x, y, z;
    if (diaSol && !subterraneo) {
      const s = (h - SOL_NASCE) / (SOL_POE - SOL_NASCE) * Math.PI;
      const el = Math.sin(s);
      x = Math.cos(s) * 34; y = Math.max(0.3, el) * 32; z = 12;
      M.solOff.set(Math.cos(s) * 130, Math.max(-10, el * 120) + 4, 55);
      M.sol.visible = el > -0.05;
    } else {
      const hh = h < SOL_POE ? h + 24 : h;
      const s = (hh - SOL_POE) / (24 + SOL_NASCE - SOL_POE) * Math.PI;
      const el = Math.sin(s);
      x = Math.cos(s) * 30; y = Math.max(0.45, el) * 30; z = -10;
      M.luaOff.set(Math.cos(s) * 100, 30 + el * 50, -100);
      M.sol.visible = false;
    }
    M.luzOff.set(x, y, z);
    const troca = Math.min(Math.abs(h - SOL_NASCE), Math.abs(h - SOL_POE));
    M.astro.color.setHex(k.luz);
    M.astro.intensity = k.li * clamp(troca / 0.6, 0.2, 1);

    M.estrelas.material.opacity = subterraneo ? 0 : k.est;
    M.estrelas.visible = !subterraneo && k.est > 0.02;
    M.lua.material.opacity = clamp(k.est * 1.4, 0, 1);
    M.lua.visible = !subterraneo && k.est > 0.02;
    if (subterraneo) M.sol.visible = false;
  };

  /* descansar num Oratório até a próxima aurora ou o próximo crepúsculo */
  T.descansar = function (ate) {
    const alvo = ate === 'noite' ? 20 : 6.5;
    T.definir(alvo);
  };
})(window.OV);

/* Ordo Virtutum — o rumo: para onde ir.
   · a missão rastreada (uma de cada vez) e o lugar de cada etapa de cada missão;
   · a névoa: o que o peregrino já explorou de cada região (guardado com o progresso);
   · o minimapa no canto, a bússola embaixo e o quadro da missão rastreada;
   · a tela de Missões (L), dividida entre principais e secundárias. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes, MP = OV.mapa; if (!M || M.falhou || !MS || !MP) return;
  const R = {}; OV.rumo = R;
  const P = OV.P, ui = OV.ui, esc = s => ui.esc(s);
  const $ = id => document.getElementById(id);
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const MIS = () => MS.MIS;

  /* ================= ONDE FICA CADA ETAPA ================= */
  const xz = (x, z) => ({ x, z });
  const fig = id => { const f = M.figuras[id]; return f ? { x: f.g.position.x, z: f.g.position.z } : null; };
  const loc = k => { const l = M.LOCAIS[k]; return l && l.x !== undefined ? { x: l.x, z: l.z } : null; };
  const ora = k => { const o = M.oratorios[k]; return o ? { x: o.x, z: o.z } : null; };
  const inter = txt => {
    const t0 = txt.toLowerCase(); let best = null, bd = 1e9;
    for (const i of M.interativos) {
      let t = null; try { t = i.texto(); } catch (e) { t = null; }
      if (!t || !t.toLowerCase().includes(t0)) continue;
      const d = Math.hypot(i.x - P.pos.x, i.z - P.pos.z); if (d < bd) { bd = d; best = { x: i.x, z: i.z }; }
    }
    return best;
  };
  const tag = t => {
    const v = OV.inimigos.porTag(t).filter(e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed); if (!v.length) return null;
    let x = 0, z = 0; v.forEach(e => { x += e.g.position.x; z += e.g.position.z; }); return { x: x / v.length, z: z / v.length };
  };
  const ou = (...fs) => () => { for (const f of fs) { const r = typeof f === 'function' ? f() : f; if (r) return r; } return null; };
  const temBadalo = id => ((prog() && prog().inv && prog().inv.badalos) || []).includes(id);
  const maisPerto = lista => { let best = null, bd = 1e9; lista.forEach(p => { if (!p) return; const d = Math.hypot(p.x - P.pos.x, p.z - P.pos.z); if (d < bd) { bd = d; best = p; } }); return best; };
  const PLACAS = { vale: xz(2, 187), porto: xz(2, 573), minas: xz(-897, 148), corte: xz(3, -752), muros: xz(3, -1652), marca: xz(-897, -752), monte: xz(-1797, 148) };
  const SAIDA_CRIPTA = xz(300, 59), ENTRADA_CRIPTA = xz(25, -12);
  const qtd = id => OV.itens ? OV.itens.qtd(id) : 0;

  const A = {
    m1: [() => fig('tome'), () => ora('vila')],
    m2: [() => xz(0, 2), ou(() => tag('afonso'), () => xz(0, 0))],
    m3: [() => maisPerto([!temBadalo('dormitorio') && xz(-23, -6), !temBadalo('ruinas') && xz(-104, 48), !temBadalo('moinho') && ou(() => inter('trava'), () => xz(114, 118))()]), () => xz(15, -20)],
    m4: [() => xz(137, -104), () => xz(137, -104)],
    m5: [() => ENTRADA_CRIPTA, () => xz(300, -24), () => ou(() => tag('meiodia'), () => tag('abade'), () => xz(300, -40))(), ou(() => inter('Missa'), () => xz(9, -31))],
    s1: [() => fig('bartolomeu'), ou(() => inter('trava'), () => xz(114, 118))],
    s2: [() => fig('joaquim')],
    s3: [() => loc('covil'), () => fig('aldeao')],
    s4: [ou(() => inter('baú'), () => xz(72, 162)), ou(() => inter('relíquia'), () => xz(0, 3))],
    s5: [() => xz(-64, 171), () => fig('lia')],
    s6: [() => fig('tome'), () => fig('matias')],
    a2m1: [() => PLACAS.vale, () => fig('gaspar'), () => ora('nicolau')],
    a2m2: [ou(() => tag('glutao'), () => loc('praca')), () => fig('gaspar')],
    a2m3: [ou(() => inter('celeiro'), () => xz(71, 688)), () => fig('barao'), () => fig('gaspar')],
    a2m4: [ou(() => inter('farol'), () => xz(-92, 760)), ou(() => inter('farol'), () => xz(-92, 760))],
    a2m5: [() => xz(0, 719), ou(() => tag('senhor'), () => xz(0, 719)), ou(() => inter('Igreja de São Nicolau'), () => xz(0, 653))],
    a2s1: [ou(() => tag('redes'), () => xz(21, 769)), () => fig('pedro')],
    a2s2: [() => fig('rufino'), () => fig('lucia')],
    a2s3: [() => fig('tiago')],
    a2s4: [ou(() => inter('cofre'), () => fig('barao')), () => fig('ana')],
    a3m1: [() => null, () => fig('elias'), () => ora('valdouro')],
    a3m2: [ou(() => loc('boca')), () => fig('elias')],
    a3m3: [() => xz(-966, -26), () => fig('fulvio'), () => fig('elias')],
    a3m4: [() => xz(-791, -54), () => xz(-791, -54)],
    a3m5: [ou(() => inter('Cofre Grande'), () => xz(-886, -61)), () => loc('cava'), ou(() => tag('mamom'), () => loc('cava')), ou(() => inter('Igreja de São Lourenço'), () => xz(-907, 44))],
    a3s1: [() => xz(-1023, -58), () => fig('rosa')],
    a3s2: [() => qtd('pao') >= 3 ? fig('bras') : fig('joana')],
    a3s3: [() => fig('elias')],
    a4m1: [() => null, () => fig('bernardo'), () => ora('belmonte')],
    a4m2: [() => loc('palacio'), () => fig('bernardo')],
    a4m3: [() => fig('valeria'), ou(() => inter('espelho'), () => fig('henrique')), () => fig('henrique'), () => fig('valeria')],
    a4m4: [ou(() => inter('figueira'), () => xz(91, -947)), ou(() => inter('figueira'), () => xz(91, -947))],
    a4m5: [() => loc('palacio'), ou(() => tag('asmodeu'), () => loc('palacio')), ou(() => inter('Igreja de Santo Agostinho'), () => xz(-14, -845))],
    a4s1: [() => loc('palacio'), () => fig('clara')],
    a4s2: [ou(() => inter('terço'), () => loc('espelhos')), () => fig('mateus')],
    a4s3: [() => fig('sebastiao'), () => fig('ines')]
  };
  R.ALVOS = A;
  const regiaoDe = (x, z) => x > 200 && z < 400 && !M.regiaoEm(x, z) ? 'cripta' : M.regiao(x, z);
  // onde a etapa acontece, sem levar em conta onde o peregrino está
  R.alvoBruto = function (id) {
    const lista = A[id] || (MIS()[id] && MIS()[id].alvos), st = prog() && prog().missoes[id]; if (!lista || !st || st.fim) return null;
    const fn = lista[Math.min(st.e, lista.length - 1)];
    let p = null; try { p = fn ? fn() : null; } catch (e) { p = null; }
    // a etapa de "ir até outra região": o alvo é a própria região
    const REG1 = { a3m1: 'minas', a4m1: 'corte', a5m1: 'muros', a6m1: 'marca', a7m1: 'monte' };
    if (!p && REG1[id] && st.e === 0) { const RG = OV.regioes[REG1[id]]; p = RG ? RG.ENTRADA : null; }
    return p ? { x: p.x, z: p.z } : null;
  };
  // para onde andar agora: se a etapa é em outra região, a placa da estrada; se é na cripta, a porta dela
  R.alvo = function (id) {
    const p = R.alvoBruto(id); if (!p) return null;
    const rp = regiaoDe(p.x, p.z), rj = regiaoDe(P.pos.x, P.pos.z);
    if (rp === rj) return { x: p.x, z: p.z, via: null };
    if (rj === 'cripta') return { x: SAIDA_CRIPTA.x, z: SAIDA_CRIPTA.z, via: 'saida' };
    if (rp === 'cripta' && rj === 'vale') return { x: ENTRADA_CRIPTA.x, z: ENTRADA_CRIPTA.z, via: 'cripta' };
    const pl = PLACAS[rj]; if (!pl) return null;
    return { x: pl.x, z: pl.z, via: rp === 'cripta' ? 'vale' : rp };
  };
  const NOME_REG = { vale: 'Vale de Santa Sabina', porto: 'Portos do Festim', minas: 'Minas de Mamom', corte: 'Corte das Máscaras', muros: 'Vila dos Muros', marca: 'Marca Ardente', monte: 'Monte Santo', cripta: 'cripta' };
  R.textoVia = a => !a || !a.via ? '' : a.via === 'saida' ? 'O objetivo fica lá fora: saia da cripta pela escada do ossuário.' : a.via === 'cripta' ? 'Desça pela porta da cripta, a leste do claustro.' : `Siga até a placa da estrada e viaje para ${NOME_REG[a.via] === 'Vale de Santa Sabina' ? 'o ' : 'os '}${NOME_REG[a.via]}.`.replace('os Minas', 'as Minas').replace('os Corte', 'a Corte');

  /* ================= A MISSÃO RASTREADA ================= */
  R.ativas = () => { const p = prog(); if (!p || !p.missoes) return []; return Object.keys(MIS()).filter(id => MS.ativa(id)); };
  R.textoEtapa = id => { const m = MIS()[id], e = m.etapas[Math.min(MS.etapa(id), m.etapas.length - 1)]; return typeof e === 'function' ? e() : e; };
  function escolher() {
    const at = R.ativas(); if (!at.length) return null;
    const aqui = M.atoDaRegiao(M.regiao(P.pos.x, P.pos.z));
    const ato = id => MIS()[id].ato || 1;
    return at.find(id => MIS()[id].tipo === 'p' && ato(id) === aqui) || at.find(id => MIS()[id].tipo === 'p') || at.find(id => ato(id) === aqui) || at[0];
  }
  R.rastreada = function () {
    const p = prog(); if (!p || !p.missoes) return null;
    if (!p.rastreada || !MS.ativa(p.rastreada)) p.rastreada = escolher();
    return p.rastreada || null;
  };
  R.rastrear = function (id) {
    const p = prog(); if (!p || !MS.ativa(id)) return;
    p.rastreada = id; ultimoTracker = ''; R.tracker(true);
    ui.toast(`Rastreando: ${MIS()[id].nome}`);
    if (MP.aberto()) MP.legenda();
  };
  // quando uma missão principal nova começa e a rastreada é secundária, a principal nova passa a ser rastreada
  const iniciar0 = MS.iniciar;
  MS.iniciar = function (id) {
    const novo = !(prog().missoes[id]);
    iniciar0(id);
    if (novo && MIS()[id] && MIS()[id].tipo === 'p') { const r = prog().rastreada; if (!r || !MS.ativa(r) || MIS()[r].tipo !== 'p') prog().rastreada = id; }
  };

  /* ================= A NÉVOA ================= */
  const CEL = 5, RAIO = 30;
  const nev = {}; let progRef = null, sujoSalvar = false, verGlobal = 1;
  function malha(k) {
    let n = nev[k]; if (n) return n;
    const f = MP.fonte(k); if (!f) return null;
    const N = Math.ceil(f.tam / CEL);
    const c = document.createElement('canvas'); c.width = c.height = N;
    n = nev[k] = { N, f, d: new Uint8Array(N * N), c, img: c.getContext('2d').createImageData(N, N), versao: ++verGlobal, sujo: true };
    return n;
  }
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  const deb64 = s => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
  function serializar() {
    const p = prog(); if (!p || p !== progRef) return;
    p.nevoa = p.nevoa || {};
    for (const k in nev) {
      const n = nev[k], bits = new Uint8Array(Math.ceil(n.d.length / 8));
      for (let i = 0; i < n.d.length; i++) if (n.d[i]) bits[i >> 3] |= 1 << (i & 7);
      p.nevoa[k] = n.N + ':' + b64(bits);
    }
    sujoSalvar = false;
  }
  function carregar() {
    progRef = prog(); for (const k in nev) delete nev[k];
    const p = progRef; if (!p) return;
    const salvo = p.nevoa || {};
    let algum = false;
    for (const k in salvo) {
      const n = malha(k); if (!n) continue;
      const [nn, s] = String(salvo[k]).split(':'); if (+nn !== n.N || !s) continue;
      try { const bits = deb64(s); for (let i = 0; i < n.d.length; i++) n.d[i] = (bits[i >> 3] >> (i & 7)) & 1; n.versao = ++verGlobal; n.sujo = true; algum = true; } catch (e) { /* save antigo ou corrompido */ }
    }
    if (!algum && p.visitados && (p.visitados.length || Object.keys(p.oratorios || {}).length)) {
      // um progresso de antes da névoa: o que já foi visitado aparece descoberto
      p.visitados.concat(['vila']).forEach(k => { const l = M.LOCAIS[k]; if (l && l.x !== undefined) revelar(l.x, l.z, Math.max(30, (l.r || 20) + 18)); });
      for (const id in (p.oratorios || {})) { const o = M.oratorios[id]; if (o && p.oratorios[id]) revelar(o.x, o.z, 40); }
      (M.ESTRADAS || []).forEach(L => L.forEach(([x, z]) => revelar(x, z, 18)));
      serializar();
    }
  }
  function revelar(x, z, raio) {
    const k = regiaoDe(x, z); if (k === 'cripta') return false;
    const n = malha(k); if (!n) return false;
    const f = n.f, i0 = (x - f.cx + f.tam / 2) / CEL, j0 = (z - f.cz + f.tam / 2) / CEL, rc = raio / CEL;
    let mudou = false;
    for (let j = Math.max(0, Math.floor(j0 - rc)); j <= Math.min(n.N - 1, Math.ceil(j0 + rc)); j++)
      for (let i = Math.max(0, Math.floor(i0 - rc)); i <= Math.min(n.N - 1, Math.ceil(i0 + rc)); i++) {
        const q = j * n.N + i; if (n.d[q]) continue;
        if (Math.hypot(i + 0.5 - i0, j + 0.5 - j0) <= rc) { n.d[q] = 1; mudou = true; }
      }
    if (mudou) { n.versao = ++verGlobal; n.sujo = true; sujoSalvar = true; }
    return mudou;
  }
  R.revelar = revelar;
  R.explorado = function (x, z) {
    const k = regiaoDe(x, z); if (k === 'cripta') return true;
    const n = malha(k); if (!n) return true;
    const f = n.f, i = Math.floor((x - f.cx + f.tam / 2) / CEL), j = Math.floor((z - f.cz + f.tam / 2) / CEL);
    if (i < 0 || j < 0 || i >= n.N || j >= n.N) return false;
    // um pouco de folga: o que está na borda do explorado também conta
    for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < n.N && jj < n.N && n.d[jj * n.N + ii]) return true; }
    return false;
  };
  R.versaoNevoa = k => { const n = malha(k); return n ? n.versao : 0; };
  R.mascara = function (k) {
    const n = malha(k); if (!n) return null;
    if (n.sujo) {
      const d = n.img.data;
      for (let i = 0; i < n.d.length; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0; d[i * 4 + 3] = n.d[i] ? 255 : 0; }
      n.c.getContext('2d').putImageData(n.img, 0, 0); n.sujo = false;
    }
    return n.c;
  };

  /* ================= A CADA QUADRO ================= */
  let tNevoa = 0, tSalvar = 0, tTracker = 0, quadro = 0;
  R.update = function (dt) {
    if (!OV.jogo || OV.jogo.modo !== 'jogo') return;
    if (prog() !== progRef) carregar();
    tNevoa -= dt; if (tNevoa <= 0) { tNevoa = 0.35; revelar(P.pos.x, P.pos.z, RAIO); }
    tSalvar -= dt; if (tSalvar <= 0) { tSalvar = 2; if (sujoSalvar) serializar(); }
  };
  R.desenharHud = function (dt) {
    if (!OV.jogo || OV.jogo.modo !== 'jogo') return;
    if (prog() !== progRef) carregar();
    quadro++;
    if (quadro % 2 === 0) minimapa();
    bussola();
    tTracker -= dt; if (tTracker <= 0) { tTracker = 0.4; R.tracker(); }
  };
  R.salvarAgora = serializar;
  // ao começar ou continuar uma partida, a névoa dela é carregada logo (antes do primeiro quadro)
  MS.ganchos.aplicar.push(() => { if (prog() !== progRef) carregar(); });

  /* ================= O MINIMAPA ================= */
  const mm = $('miniCanvas'), mg = mm.getContext('2d'), mmBox = $('minimapa');
  const tmp = document.createElement('canvas');
  const VIS = 62; // metros do centro à borda
  R.opcoes = { minimapa: true };
  function cameraDir() { const y = OV.cam ? OV.cam.yaw : 0; return Math.atan2(-Math.sin(y), Math.cos(y)); } // rumo do olhar (0 = norte)
  function minimapa() {
    if (mmBox.hidden) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = mm.clientWidth || 180, H = mm.clientHeight || 180;
    if (mm.width !== Math.round(W * dpr)) { mm.width = Math.round(W * dpr); mm.height = Math.round(H * dpr); }
    const g = mg; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const k = regiaoDe(P.pos.x, P.pos.z);
    if (k === 'cripta') {
      g.fillStyle = '#2a2018'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c9b48a'; g.font = '15px "IM Fell English SC", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('✠ Sob a terra', W / 2, H / 2 - 8); g.font = 'italic 13px "IM Fell English", Georgia, serif'; g.fillText('o mapa não alcança', W / 2, H / 2 + 12);
      return;
    }
    const f = MP.fonte(k), base = MP.base(k); if (!f || !base) return;
    const [px, py] = MP.bp(k, P.pos.x, P.pos.z), E = f.E, half = VIS * E;
    const esc = W / (half * 2);
    g.fillStyle = '#e8d7aa'; g.fillRect(0, 0, W, H);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(base, px - half, py - half, half * 2, half * 2, 0, 0, W, H);
    // névoa: papel por cima de tudo o que não foi visto
    const n = malha(k), m = R.mascara(k);
    if (n && m) {
      if (tmp.width !== mm.width) { tmp.width = mm.width; tmp.height = mm.height; }
      const t = tmp.getContext('2d'); t.setTransform(dpr, 0, 0, dpr, 0, 0);
      t.globalCompositeOperation = 'source-over'; t.fillStyle = '#e9dbb6'; t.fillRect(0, 0, W, H);
      t.fillStyle = 'rgba(170,140,90,.18)'; for (let i = 0; i < 6; i++) { t.beginPath(); t.arc((i * 53) % W, (i * 71) % H, 30 + i * 6, 0, Math.PI * 2); t.fill(); }
      t.globalCompositeOperation = 'destination-out'; t.imageSmoothingEnabled = true;
      const cpx = (P.pos.x - f.cx + f.tam / 2) / CEL, cpz = (P.pos.z - f.cz + f.tam / 2) / CEL, hc = VIS / CEL;
      t.drawImage(m, cpx - hc, cpz - hc, hc * 2, hc * 2, 0, 0, W, H); t.drawImage(m, cpx - hc, cpz - hc, hc * 2, hc * 2, 0, 0, W, H);
      t.globalCompositeOperation = 'source-over';
      g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const tela = (x, z) => { const [a, b] = MP.bp(k, x, z); return [(a - (px - half)) * esc, (b - (py - half)) * esc]; };
    // oratórios acesos
    for (const id in M.oratorios) {
      const o = M.oratorios[id]; if (!o.aceso || regiaoDe(o.x, o.z) !== k) continue;
      const [x, y] = tela(o.x, o.z); if (x < -6 || y < -6 || x > W + 6 || y > H + 6) continue;
      g.fillStyle = '#d4a23e'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#6b4513'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#7a140d'; g.fillRect(x - 0.8, y - 3.4, 1.6, 6.8); g.fillRect(x - 2.6, y - 1.6, 5.2, 1.6);
    }
    // baús, masmorras e confrarias já vistos
    if (OV.aventura) OV.aventura.marcas(k).forEach(m => {
      if (!R.explorado(m.x, m.z)) return;
      const [x, y] = tela(m.x, m.z); if (x < -8 || y < -8 || x > W + 8 || y > H + 8) return;
      MP.marca(g, m.tipo, x, y, m.tipo === 'bau' ? 4.2 : 5.4, m.tipo === 'bau' ? m.aberto : m.tipo === 'masmorra' ? m.feita : false);
    });
    // missões: as outras, pequenas; a rastreada, maior e presa à borda quando está longe
    const rast = R.rastreada();
    R.ativas().forEach(id => {
      if (id === rast) return;
      const a = R.alvo(id); if (!a) return; const [x, y] = tela(a.x, a.z);
      if (x < 4 || y < 4 || x > W - 4 || y > H - 4) return;
      MP.losango(g, x, y, 4.5, MIS()[id].tipo === 'p' ? MP.COR.principal : MP.COR.secundaria, false);
    });
    if (rast) {
      const a = R.alvo(rast);
      if (a) {
        let [x, y] = tela(a.x, a.z); const cor = MIS()[rast].tipo === 'p' ? MP.COR.principal : MP.COR.secundaria;
        const dentro = x > 9 && y > 9 && x < W - 9 && y < H - 9;
        if (!dentro) {
          const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy, s = Math.min((W / 2 - 11) / Math.abs(dx || 1e-6), (H / 2 - 11) / Math.abs(dy || 1e-6));
          x = cx + dx * s; y = cy + dy * s;
          const an = Math.atan2(dy, dx);
          g.save(); g.translate(x, y); g.rotate(an); g.fillStyle = cor; g.beginPath(); g.moveTo(10, 0); g.lineTo(2, -5); g.lineTo(2, 5); g.closePath(); g.fill(); g.restore();
        }
        MP.losango(g, x, y, dentro ? 7 : 5.5, cor, dentro);
      }
    }
    // o cone do olhar e o peregrino
    const cxp = W / 2, cyp = H / 2, olhar = cameraDir();
    g.save(); g.translate(cxp, cyp);
    const cone = g.createRadialGradient(0, 0, 2, 0, 0, 42); cone.addColorStop(0, 'rgba(255,248,226,.55)'); cone.addColorStop(1, 'rgba(255,248,226,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 42, olhar - Math.PI / 2 - 0.55, olhar - Math.PI / 2 + 0.55); g.closePath(); g.fill();
    g.rotate(-P.facing + Math.PI);
    g.fillStyle = '#b8261b'; g.strokeStyle = '#f5e8c6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -8); g.lineTo(5.5, 6.5); g.lineTo(0, 3.2); g.lineTo(-5.5, 6.5); g.closePath(); g.stroke(); g.fill();
    g.restore();
  }

  /* ================= A BÚSSOLA ================= */
  const bc = $('bussolaCanvas'), bg = bc.getContext('2d');
  const PONTOS = [['N', 0], ['NE', 45], ['L', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]];
  const wrap = a => { if (!isFinite(a)) return 0; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const rumoDe = (x, z) => Math.atan2(x - P.pos.x, -(z - P.pos.z)); // 0 = norte (−z), π/2 = leste (+x)
  function bussola() {
    if (bc.parentElement.hidden) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = bc.clientWidth || 420, H = bc.clientHeight || 40;
    if (bc.width !== Math.round(W * dpr)) { bc.width = Math.round(W * dpr); bc.height = Math.round(H * dpr); }
    const g = bg; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const olhar = cameraDir(), FOV = Math.PI * 0.85, meio = W / 2, larg = W / 2 - 18;
    const xDe = a => meio + wrap(a - olhar) / (FOV / 2) * larg;
    // traços a cada 15 graus
    for (let d = 0; d < 360; d += 15) {
      const a = d * Math.PI / 180, dd = wrap(a - olhar); if (Math.abs(dd) > FOV / 2) continue;
      const x = xDe(a), forte = d % 45 === 0, alfa = 1 - Math.abs(dd) / (FOV / 2) * 0.7;
      // sem o pergaminho de fundo: traços claros com contorno escuro, legíveis sobre qualquer cena
      g.lineCap = 'round';
      g.strokeStyle = `rgba(10,6,4,${0.6 * alfa})`; g.lineWidth = forte ? 3.2 : 2.6; g.beginPath(); g.moveTo(x, H - 2); g.lineTo(x, H - (forte ? 8 : 5)); g.stroke();
      g.strokeStyle = `rgba(244,230,192,${(forte ? 0.95 : 0.6) * alfa})`; g.lineWidth = forte ? 1.4 : 1;
      g.beginPath(); g.moveTo(x, H - 2); g.lineTo(x, H - (forte ? 8 : 5)); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    PONTOS.forEach(([t, d]) => {
      const a = d * Math.PI / 180, dd = wrap(a - olhar); if (Math.abs(dd) > FOV / 2) return;
      const x = xDe(a), alfa = 1 - Math.abs(dd) / (FOV / 2) * 0.75;
      g.globalAlpha = alfa;
      if (t === 'N') { g.font = '600 21px "Grenze Gotisch", "UnifrakturMaguntia", Georgia, serif'; g.fillStyle = '#ff6a50'; }
      else { g.font = `${t.length > 1 ? 13 : 16}px "IM Fell English SC", Georgia, serif`; g.fillStyle = '#f4e6c0'; }
      g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,6,4,.85)'; g.lineWidth = 3.5; g.strokeText(t, x, 14);
      g.fillText(t, x, 14);
      g.globalAlpha = 1;
    });
    // as missões: a rastreada com a distância; as outras, só um sinal pequeno
    const rast = R.rastreada();
    R.ativas().forEach(id => {
      const a = R.alvo(id); if (!a) return;
      const cor = MIS()[id].tipo === 'p' ? MP.COR.principal : MP.COR.secundaria;
      const rb = rumoDe(a.x, a.z), dd = wrap(rb - olhar), sel = id === rast;
      if (!sel && Math.abs(dd) > FOV / 2) return;
      let x = Math.abs(dd) > FOV / 2 ? meio + Math.sign(dd) * larg : xDe(rb);
      MP.losango(g, x, 15, sel ? 7 : 4.5, cor, false);
      if (sel) {
        const dist = Math.hypot(a.x - P.pos.x, a.z - P.pos.z);
        g.font = '12px "IM Fell English SC", Georgia, serif'; g.fillStyle = '#f4e6c0'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,6,4,.85)'; g.lineWidth = 3;
        const esc = (s, xx, yy) => { g.strokeText(s, xx, yy); g.fillText(s, xx, yy); };
        if (Math.abs(dd) > FOV / 2) { esc(dd > 0 ? '»' : '«', x - Math.sign(dd) * 14, 15); }
        else if (dist > 6) esc(`${Math.round(dist)} passos`, Math.max(40, Math.min(W - 40, x)), 32);
      }
    });
    // o marcador do centro
    g.fillStyle = '#ff6a50'; g.strokeStyle = 'rgba(10,6,4,.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(meio, H - 9); g.lineTo(meio - 5, H - 1); g.lineTo(meio + 5, H - 1); g.closePath(); g.stroke(); g.fill();
  }
  R.rumoTexto = function (x, z) {
    const d = Math.hypot(x - P.pos.x, z - P.pos.z);
    const nomes = ['norte', 'nordeste', 'leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste'];
    let a = rumoDe(x, z); if (a < 0) a += Math.PI * 2;
    const k = Math.round(a / (Math.PI / 4)) % 8;
    return d < 8 ? 'aqui perto' : `a ${Math.round(d)} passos, a ${nomes[k]}`;
  };

  /* ================= O QUADRO DA MISSÃO RASTREADA ================= */
  let ultimoTracker = '';
  R.tracker = function (forcar) {
    const el = $('tracker'); if (!el) return;
    const id = R.rastreada();
    let h = '';
    if (id) {
      const m = MIS()[id], a = R.alvo(id), via = R.textoVia(a);
      h = `<div class="tr-cab"><span class="tr-tipo ${m.tipo === 'p' ? 'p' : 's'}">${m.tipo === 'p' ? 'Missão principal' : 'Missão secundária'}</span><span class="tr-tecla"><kbd>L</kbd> missões</span></div>
        <b class="tr-nome">${esc(m.nome)}</b><p class="tr-txt">${esc(R.textoEtapa(id))}</p>${via ? `<p class="tr-via">${esc(via)}</p>` : ''}`;
      const outras = R.ativas().length - 1; if (outras > 0) h += `<p class="tr-mais">+ ${outras} outra${outras > 1 ? 's' : ''} missõ${outras > 1 ? 'es' : 'ão'} em andamento</p>`;
    }
    if (h !== ultimoTracker || forcar) { el.innerHTML = h; ultimoTracker = h; el.classList.toggle('vazio', !h); }
  };

  /* ================= A TELA DE MISSÕES (L) ================= */
  let selecionada = null, aba = 'missoes';
  const ATOS = { 1: 'Ato I', 2: 'Ato II', 3: 'Ato III', 4: 'Ato IV' };
  R.telaMissoes = function () {
    const p = prog(); if (!p) return '';
    const ids = Object.keys(MIS()).filter(id => p.missoes[id]);
    const rast = R.rastreada();
    if (!selecionada || !p.missoes[selecionada]) selecionada = rast || ids.find(id => MS.ativa(id)) || ids[0] || null;
    const ord = (a, b) => (MIS()[b].ato || 1) - (MIS()[a].ato || 1);
    const item = id => {
      const m = MIS()[id], feita = MS.feita(id);
      return `<li><button type="button" data-mi="${id}" class="${id === selecionada ? 'sel' : ''}${feita ? ' feita' : ''}" aria-pressed="${id === selecionada}">
        <i class="mk ${m.tipo === 'p' ? 'p' : 's'}${feita ? ' ok' : ''}"></i><b>${esc(m.nome)}</b>${id === rast ? '<em>rastreando</em>' : ''}<small>${ATOS[m.ato || 1]}</small></button></li>`;
    };
    const ativasP = ids.filter(id => !MS.feita(id) && MIS()[id].tipo === 'p').sort(ord), ativasS = ids.filter(id => !MS.feita(id) && MIS()[id].tipo === 's').sort(ord);
    const feitas = ids.filter(id => MS.feita(id)).sort(ord);
    const lista = `<div class="mi-lista">
        <h3><i class="mk p"></i>Missões principais</h3><ul>${ativasP.map(item).join('') || '<li class="vazio">Nenhuma em andamento.</li>'}</ul>
        <h3><i class="mk s"></i>Missões secundárias</h3><ul>${ativasS.map(item).join('') || '<li class="vazio">Nenhuma em andamento. Converse com o povo das vilas.</li>'}</ul>
        ${feitas.length ? `<details class="mi-feitas"><summary>Concluídas (${feitas.length})</summary><ul>${feitas.map(item).join('')}</ul></details>` : ''}
      </div>`;
    let det = '<div class="mi-det"><p class="vazio">Escolha uma missão à esquerda.</p></div>';
    if (selecionada) {
      const id = selecionada, m = MIS()[id], st = p.missoes[id], feita = st.fim;
      const passadas = m.etapas.slice(0, feita ? m.etapas.length : st.e).map(e => typeof e === 'function' ? e() : e);
      const a = feita ? null : R.alvo(id), b = feita ? null : R.alvoBruto(id);
      const onde = b ? `${regiaoDe(b.x, b.z) === regiaoDe(P.pos.x, P.pos.z) && regiaoDe(b.x, b.z) !== 'cripta' ? esc(R.rumoTexto(b.x, b.z)) : 'em ' + esc(NOME_REG[regiaoDe(b.x, b.z)] || '')}` : '';
      det = `<div class="mi-det">
        <p class="eyebrow ${m.tipo === 'p' ? 'p' : 's'}">${m.tipo === 'p' ? 'Missão principal' : 'Missão secundária'} · ${ATOS[m.ato || 1]}</p>
        <h3 class="mi-nome">${esc(m.nome)}</h3>
        ${feita ? '<p class="mi-agora feita">✓ Missão concluída.</p>' : `<p class="mi-agora">${esc(R.textoEtapa(id))}</p>`}
        ${onde ? `<p class="mi-onde">✠ ${onde.charAt(0).toUpperCase() + onde.slice(1)}${a && a.via ? '. ' + esc(R.textoVia(a)) : '.'}</p>` : ''}
        ${OV.historia ? OV.historia.cartaHtml(id) : ''}
        ${passadas.length ? `<ol class="mi-passos">${passadas.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : ''}
        ${feita ? '' : id === rast ? '<p class="mi-rastreando">✠ Esta é a missão rastreada: ela aparece no canto da tela, no minimapa e na bússola.</p>' : `<button type="button" class="btn" data-mi-rastrear="${id}">Rastrear esta missão</button>`}
      </div>`;
    }
    const corpo = aba === 'consigo' ? `<div class="mi-consigo">${MS.consigo ? MS.consigo() : ''}</div>` : aba === 'lampadas' && OV.historia ? `<div class="mi-lampadas">${OV.historia.telaLampadas()}</div>` : `<div class="mi-corpo">${lista}${det}</div>`;
    return `<div class="mi-top"><h2>Missões</h2>
        <div class="mi-abas" role="tablist"><button type="button" data-mi-aba="missoes" aria-pressed="${aba === 'missoes'}">Missões</button><button type="button" data-mi-aba="consigo" aria-pressed="${aba === 'consigo'}">Consigo e hábitos</button>${OV.historia ? `<button type="button" data-mi-aba="lampadas" aria-pressed="${aba === 'lampadas'}">As Sete Lâmpadas</button>` : ''}</div>
        <button type="button" class="btn ghost" data-mi-fechar>Fechar</button></div>
      ${corpo}
      <p class="foot">Clique numa missão para ver os detalhes e rastreá-la. <kbd>L</kbd> ou <kbd>Esc</kbd> fecha.</p>`;
  };
  R.abrirTela = function (id) { if (id) { selecionada = id; aba = 'missoes'; } };
  const dia = $('diario');
  dia.addEventListener('click', ev => {
    const b = ev.target.closest('[data-mi]'), r = ev.target.closest('[data-mi-rastrear]'), t = ev.target.closest('[data-mi-aba]');
    if (ev.target.closest('[data-mi-fechar]')) { OV.jogo.toggleDiario(); return; }
    if (b) selecionada = b.dataset.mi;
    else if (r) R.rastrear(r.dataset.miRastrear);
    else if (t) aba = t.dataset.miAba;
    else return;
    const sc = dia.querySelector('.mi-lista'), y = sc ? sc.scrollTop : 0;
    dia.innerHTML = R.telaMissoes();
    const sc2 = dia.querySelector('.mi-lista'); if (sc2) sc2.scrollTop = y;
  });
})(window.OV);

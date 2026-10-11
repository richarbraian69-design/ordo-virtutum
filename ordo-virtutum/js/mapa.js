/* Ordo Virtutum — o mapa ilustrado (tecla M).
   Cada região vira uma carta desenhada à mão sobre pergaminho, como numa cartilha: relevo em aguada e curvas de nível,
   montes, árvores (cada uma no lugar onde está no mundo), casas com telhado, rios, mar e estradas em tinta.
   A névoa cobre o que ainda não foi explorado e se desfaz conforme o peregrino anda.
   Abre em tela cheia: arrastar move a carta, a roda do mouse aproxima, e um clique num Oratório aceso leva até ele. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const MP = {}; OV.mapa = MP;
  const $ = id => document.getElementById(id);
  const el = $('mapa'), cv = $('mapaCanvas'), ctx = cv.getContext('2d');
  const abas = $('mapaAbas'), tit = $('mapaTit'), tip = $('mapaTip'), leg = $('mapaLeg');
  const FD = '"IM Fell English SC", "Iowan Old Style", Georgia, serif';
  const FB = '"IM Fell English", "Iowan Old Style", Georgia, serif';
  const FG = '"Grenze Gotisch", "UnifrakturMaguntia", Georgia, serif';
  const S = 1600;     // lado da carta, em pixels
  const G = 200;      // malha do relevo
  const TINTA = '#3a2814', TINTA2 = '#5d4631', RUBRO = '#7a140d', OURO = '#a87722', AZUL = '#34587a';
  MP.COR = { principal: '#6a2c8c', secundaria: '#2c7a3a' };

  /* ================= AS REGIÕES COMO FONTE DE DESENHO ================= */
  const FONTES = {};
  function fonte(k) {
    if (FONTES[k]) return FONTES[k];
    let f = null;
    if (k === 'vale') {
      f = {
        id: 'vale', nome: 'Vale de Santa Sabina', cx: 0, cz: 0, tam: 400, telha: '#a4553a',
        h: (x, z) => M.relevo(x, z),
        dentro: (x, z) => Math.hypot(x * 0.95, z) < M.LIM,
        agua: (x, z) => Math.abs(z) < 232 && Math.abs(x - M.rioX(z)) < 3.7,
        estradas: M.ESTRADAS,
        rects: (M.RECTS || []).filter(([x, z]) => z < 400 && x < 200 && !M.regiaoEm(x, z)).map(r => r.slice()),
        saidas: [{ x: 0, z: 196, txt: 'Portos do Festim', seta: '↓' }]
      };
    } else if (k === 'porto' && OV.porto) {
      const PT = OV.porto, K = PT.K || 1, OZ = PT.OZ, L = (x, z) => [x / K, (z - OZ) / K];
      f = {
        id: 'porto', nome: 'Portos do Festim', cx: 0, cz: OZ, tam: 300, telha: '#b0603e',
        h: (x, z) => { const [a, b] = L(x, z); return PT.relevo(a, b); },
        dentro: (x, z) => { const [a, b] = L(x, z); return Math.abs(a) < 92 && b > -98; },
        agua: (x, z) => { const [a, b] = L(x, z); if (PT.PIERS.some(p => Math.abs(a - p.x) * K < p.w / 2 && b > p.z0 && b < p.z1)) return false; return b - PT.costa(a) > 0.2; },
        mar: true,
        estradas: PT.ESTRADAS.map(Ln => Ln.map(([a, b]) => [a * K, OZ + b * K])),
        rects: PT.RECTS.map(([a, b, w, d, r]) => [a * K, OZ + b * K, w, d, r]),
        piers: PT.PIERS.map(p => ({ x: p.x * K, z0: OZ + p.z0 * K, z1: OZ + p.z1 * K, w: p.w })),
        saidas: [{ x: 0, z: OZ - 146, txt: 'Vale de Santa Sabina', seta: '↑' }]
      };
    } else if (OV.regioes && OV.regioes[k]) {
      const R = OV.regioes[k], X = a => a + R.OX, Z = b => b + R.OZ;
      f = {
        id: k, nome: R.nome, cx: R.OX, cz: R.OZ, tam: R.MEIO * 2, telha: R.TELHA || (k === 'corte' ? '#4f5f82' : '#6e6258'),
        h: (x, z) => R.relevo(x - R.OX, z - R.OZ),
        dentro: (x, z) => Math.abs(x - R.OX) < R.MEIO - 6 && Math.abs(z - R.OZ) < R.MEIO - 6,
        agua: R.agua ? (x, z) => R.agua(x - R.OX, z - R.OZ) : k === 'corte' && R.LAGO ? (x, z) => Math.hypot(x - R.OX - R.LAGO.x, z - R.OZ - R.LAGO.z) < R.LAGO.r - 2 : () => false,
        estradas: R.ESTRADAS.map(Ln => Ln.map(([a, b]) => [X(a), Z(b)])),
        rects: R.RECTS.map(([a, b, w, d, r]) => [X(a), Z(b), w, d, r]),
        R
      };
    }
    if (f) {
      f.E = S / f.tam;
      f.arvores = (M.arvoresMapa || []).filter(t => M.regiao(t.x, t.z) === k);
      FONTES[k] = f;
    }
    return f;
  }
  MP.fonte = fonte;
  MP.regiaoDe = (x, z) => { const r = M.regiao(x, z); return r === 'cripta' ? 'vale' : r; };
  // mundo → pixel da carta
  const bp = (f, x, z) => [(x - f.cx + f.tam / 2) * f.E, (z - f.cz + f.tam / 2) * f.E];
  MP.bp = (k, x, z) => bp(fonte(k), x, z);

  /* sorte determinística: a mesma carta sai sempre igual */
  function sorte(sem) { let s = 0; for (const c of sem) s = (s * 31 + c.charCodeAt(0)) >>> 0; s = s || 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

  /* ================= O PAPEL ================= */
  let texPapel = null;
  function papel() {
    if (texPapel) return texPapel;
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const im = g.createImageData(256, 256), d = im.data, r = sorte('papel');
    for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * 18; d[i] = 120 + v; d[i + 1] = 90 + v; d[i + 2] = 50 + v; d[i + 3] = 14 + r() * 14; }
    g.putImageData(im, 0, 0);
    // fibras do papel
    g.strokeStyle = 'rgba(110,80,40,.07)'; g.lineWidth = 0.6;
    for (let i = 0; i < 160; i++) { const x = r() * 256, y = r() * 256, a = r() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (4 + r() * 10), y + Math.sin(a) * (4 + r() * 10)); g.stroke(); }
    texPapel = c; return c;
  }
  function fundoPapel(g, w, h, sem) {
    const gr = g.createLinearGradient(0, 0, w * 0.3, h);
    gr.addColorStop(0, '#efe2bf'); gr.addColorStop(0.5, '#e8d7aa'); gr.addColorStop(1, '#dfc895');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // manchas de idade
    const r = sorte(sem || 'manchas');
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h, rr = (0.05 + r() * 0.16) * w;
      const m = g.createRadialGradient(x, y, 0, x, y, rr);
      m.addColorStop(0, `rgba(150,105,45,${(0.04 + r() * 0.06).toFixed(3)})`); m.addColorStop(1, 'rgba(150,105,45,0)');
      g.fillStyle = m; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    g.fillStyle = g.createPattern(papel(), 'repeat'); g.fillRect(0, 0, w, h);
    // a beira do papel escurece
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.max(w, h) * 0.74);
    v.addColorStop(0, 'rgba(110,70,25,0)'); v.addColorStop(1, 'rgba(110,70,25,.32)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  }

  /* ================= A CARTA DE CADA REGIÃO ================= */
  const bases = {};
  MP.base = function (k) {
    if (bases[k]) return bases[k];
    const f = fonte(k); if (!f) return null;
    const c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    desenharCarta(g, f);
    bases[k] = c; return c;
  };

  function desenharCarta(g, f) {
    const r = sorte('carta-' + f.id), E = f.E, cel = f.tam / G;
    fundoPapel(g, S, S, 'carta-' + f.id);
    const W0 = (i) => f.cx - f.tam / 2 + (i + 0.5) * cel, Z0 = (j) => f.cz - f.tam / 2 + (j + 0.5) * cel;
    // amostras do relevo, da água e de quanto a célula fica dentro da região
    const H = new Float32Array(G * G), AG = new Uint8Array(G * G), DT = new Float32Array(G * G);
    let hmin = 1e9, hmax = -1e9; const hs = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const x = W0(i), z = Z0(j), h = f.h(x, z), k = j * G + i;
      H[k] = h; AG[k] = f.agua(x, z) ? 1 : 0;
      DT[k] = f.dentro(x, z) ? 1 : 0;
      if (DT[k]) { hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); hs.push(h); }
    }
    hs.sort((a, b) => a - b);
    const pct = q => hs.length ? hs[Math.min(hs.length - 1, Math.floor(hs.length * q))] : 0;
    const hBaixo = pct(0.3), hAlto = pct(0.9);
    // densidade do arvoredo (para escurecer a aguada nos bosques)
    const DEN = new Float32Array(G * G);
    f.arvores.forEach(t => { const i = Math.floor((t.x - f.cx + f.tam / 2) / cel), j = Math.floor((t.z - f.cz + f.tam / 2) / cel); for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < G && jj < G) DEN[jj * G + ii] += 0.12 / (1 + a * a + b * b); } });

    /* 1. aguada: verde nos baixios, ocre nas encostas, sépia nos altos; sombra do relevo vinda do noroeste */
    const lw = document.createElement('canvas'); lw.width = lw.height = G;
    const lg = lw.getContext('2d'), im = lg.createImageData(G, G), d = im.data;
    // distância (em células) até o limite da região, para a aguada se desfazer na borda
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const k = j * G + i, h = H[k];
      const hx = H[j * G + Math.min(G - 1, i + 1)] - H[j * G + Math.max(0, i - 1)], hz = H[Math.min(G - 1, j + 1) * G + i] - H[Math.max(0, j - 1) * G + i];
      const luz = Math.max(-1, Math.min(1, (hx + hz) / (cel * 2) * 1.6)); // >0: encosta virada para o sudeste (sombra)
      let R, Gc, B, a;
      if (AG[k]) { R = 72; Gc = 116; B = 158; a = 0.52; }
      else {
        const t = Math.max(0, Math.min(1, (h - hBaixo) / Math.max(1, hAlto - hBaixo)));
        R = 118 + t * 40; Gc = 138 - t * 30; B = 74 - t * 12; a = 0.16 + t * 0.1;
        const den = Math.min(1, DEN[k]); R -= den * 40; Gc -= den * 18; B -= den * 26; a += den * 0.16;
        if (h > hAlto) { const u = Math.min(1, (h - hAlto) / 14); R = R * (1 - u) + 120 * u; Gc = Gc * (1 - u) + 92 * u; B = B * (1 - u) + 66 * u; a += u * 0.12; }
        if (luz > 0) { R -= luz * 30; Gc -= luz * 34; B -= luz * 30; a += luz * 0.16; } else a += luz * 0.06;
      }
      if (!DT[k]) a *= 0.45;
      d[k * 4] = R; d[k * 4 + 1] = Gc; d[k * 4 + 2] = B; d[k * 4 + 3] = Math.max(0, Math.min(255, a * 255));
    }
    lg.putImageData(im, 0, 0);
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.globalCompositeOperation = 'multiply'; g.drawImage(lw, 0, 0, S, S); g.restore();

    /* 2. curvas de nível (marching squares), finas, em sépia */
    const passoN = f.id === 'vale' ? 3 : f.id === 'porto' ? 2 : 3;
    g.lineCap = 'round';
    for (let lv = Math.ceil(hmin / passoN) * passoN; lv <= hmax + 20; lv += passoN) {
      const mestra = Math.round(lv / passoN) % 5 === 0;
      g.strokeStyle = mestra ? 'rgba(110,76,42,.34)' : 'rgba(110,76,42,.17)'; g.lineWidth = mestra ? 1.25 : 0.85;
      g.beginPath();
      for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
        const k = j * G + i; if (AG[k]) continue;
        const a = H[k], b = H[k + 1], c2 = H[k + G + 1], e = H[k + G];
        const caso = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c2 > lv ? 2 : 0) | (e > lv ? 1 : 0);
        if (caso === 0 || caso === 15) continue;
        const px0 = (i + 0.5) * cel * E, py0 = (j + 0.5) * cel * E, s = cel * E;
        const it = (p, q) => (lv - p) / ((q - p) || 1e-6);
        const T = [px0 + s * it(a, b), py0], Rr = [px0 + s, py0 + s * it(b, c2)], Bt = [px0 + s * it(e, c2), py0 + s], Lf = [px0, py0 + s * it(a, e)];
        const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
        switch (caso) {
          case 1: case 14: seg(Lf, Bt); break; case 2: case 13: seg(Bt, Rr); break; case 3: case 12: seg(Lf, Rr); break;
          case 4: case 11: seg(T, Rr); break; case 6: case 9: seg(T, Bt); break; case 7: case 8: seg(Lf, T); break;
          case 5: seg(Lf, T); seg(Bt, Rr); break; case 10: seg(T, Rr); seg(Lf, Bt); break;
        }
      }
      g.stroke();
    }

    /* 3. água: margens em tinta azul, ondinhas no mar e no lago */
    g.strokeStyle = AZUL; g.lineWidth = 1.7; g.beginPath();
    for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) {
      const k = j * G + i, a = AG[k], b = AG[k + 1], c2 = AG[k + G + 1], e = AG[k + G];
      const caso = a * 8 | b * 4 | c2 * 2 | e; if (caso === 0 || caso === 15) continue;
      const px0 = (i + 0.5) * cel * E, py0 = (j + 0.5) * cel * E, s = cel * E, h2 = s / 2;
      const T = [px0 + h2, py0], Rr = [px0 + s, py0 + h2], Bt = [px0 + h2, py0 + s], Lf = [px0, py0 + h2];
      const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
      switch (caso) {
        case 1: case 14: seg(Lf, Bt); break; case 2: case 13: seg(Bt, Rr); break; case 3: case 12: seg(Lf, Rr); break;
        case 4: case 11: seg(T, Rr); break; case 6: case 9: seg(T, Bt); break; case 7: case 8: seg(Lf, T); break;
        case 5: seg(Lf, T); seg(Bt, Rr); break; case 10: seg(T, Rr); seg(Lf, Bt); break;
      }
    }
    g.stroke();
    // ondinhas
    g.strokeStyle = 'rgba(52,88,122,.55)'; g.lineWidth = 1.1;
    const ond = Math.max(10, Math.round(9 * E));
    for (let y = ond / 2; y < S; y += ond) for (let x = ((y / ond) % 2) * ond / 2; x < S; x += ond * 1.6) {
      const i = Math.floor(x / (cel * E)), j = Math.floor(y / (cel * E)); if (i < 2 || j < 2 || i >= G - 2 || j >= G - 2) continue;
      // só longe da margem
      let ok = true; for (let b = -2; b <= 2 && ok; b++) for (let a = -2; a <= 2; a++) if (!AG[(j + b) * G + i + a]) { ok = false; break; }
      if (!ok) continue;
      const w = 5 + r() * 4;
      g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - w / 2, y - 3, x, y); g.quadraticCurveTo(x + w / 2, y + 3, x + w, y); g.stroke();
    }
    if (f.piers) f.piers.forEach(p => {
      const [a, b] = bp(f, p.x - p.w / 2, p.z0), [c2, e] = bp(f, p.x + p.w / 2, p.z1);
      g.fillStyle = '#9a7048'; g.fillRect(a, b, c2 - a, e - b); g.strokeStyle = TINTA; g.lineWidth = 1.2; g.strokeRect(a, b, c2 - a, e - b);
      g.strokeStyle = 'rgba(58,40,20,.5)'; g.lineWidth = 0.7; for (let y = b + 4; y < e; y += 4) { g.beginPath(); g.moveTo(a, y); g.lineTo(c2, y); g.stroke(); }
    });

    /* 4. estradas: caminho de terra batida com borda em tinta */
    const larg = Math.max(5, 3.4 * E);
    const tracar = () => f.estradas.forEach(L => { g.beginPath(); L.forEach(([x, z], i) => { const [a, b] = bp(f, x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); });
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(92,64,34,.62)'; g.lineWidth = larg + 2.4; tracar();
    g.strokeStyle = '#dcc394'; g.lineWidth = larg; tracar();
    g.strokeStyle = 'rgba(120,86,46,.35)'; g.lineWidth = 1; g.setLineDash([3, 6]); tracar(); g.setLineDash([]);
    if (f.id === 'vale') M.PONTES.forEach(p => {
      const [a, b] = bp(f, p.x, p.z), w = 12.4 * E, h = 4 * E;
      g.fillStyle = '#9a7048'; g.fillRect(a - w / 2, b - h / 2, w, h); g.strokeStyle = TINTA; g.lineWidth = 1.3; g.strokeRect(a - w / 2, b - h / 2, w, h);
      g.strokeStyle = 'rgba(58,40,20,.55)'; g.lineWidth = 0.8; for (let x = a - w / 2 + 4; x < a + w / 2; x += 4) { g.beginPath(); g.moveTo(x, b - h / 2); g.lineTo(x, b + h / 2); g.stroke(); }
    });

    /* 5. o que é próprio de cada região */
    extras(g, f, r);

    /* 6. montes: picos desenhados onde a terra é alta (e na serra que cerca a região) */
    const montes = [];
    const passoM = 13;
    for (let z = f.cz - f.tam / 2 + passoM / 2; z < f.cz + f.tam / 2; z += passoM) for (let x = f.cx - f.tam / 2 + passoM / 2; x < f.cx + f.tam / 2; x += passoM) {
      const jx = x + (r() - 0.5) * passoM * 0.8, jz = z + (r() - 0.5) * passoM * 0.8;
      const h = f.h(jx, jz), fora = !f.dentro(jx, jz);
      const lim = fora ? hAlto - 4 : hAlto + 2;
      if (h < lim || f.agua(jx, jz)) continue;
      if (!fora && (perto(f, jx, jz, 9) || pertoEstrada(f, jx, jz, 6))) continue;
      montes.push({ x: jx, z: jz, h, fora });
    }
    montes.sort((a, b) => a.z - b.z).forEach(m => {
      const [x, y] = bp(f, m.x, m.z), sz = Math.min(40, 13 + (m.h - hAlto) * 0.9) * (0.85 + r() * 0.3) * Math.min(1.4, E / 4);
      monte(g, x, y, sz, r, m.fora);
    });

    /* 7. árvores, de trás para a frente */
    f.arvores.slice().sort((a, b) => a.z - b.z).forEach(t => { const [x, y] = bp(f, t.x, t.z); arvore(g, x, y, t, E, r); });

    /* 8. casas: telhado visto do alto, cumeeira e beiral em tinta */
    f.rects.forEach(([x, z, w, dd, rot]) => casa(g, f, x, z, w, dd, rot || 0));

    /* 9. moldura, rosa dos ventos e escala */
    moldura(g, f);
  }
  function perto(f, x, z, m) { return f.rects.some(([a, b, w, d]) => Math.abs(x - a) < w / 2 + m && Math.abs(z - b) < d / 2 + m); }
  function pertoEstrada(f, x, z, m) {
    for (const L of f.estradas) for (let i = 0; i < L.length - 1; i++) {
      const [ax, az] = L[i], [bx, bz] = L[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
      if (Math.hypot(x - ax - t * dx, z - az - t * dz) < m) return true;
    }
    return false;
  }

  function monte(g, x, y, sz, r, fora) {
    const a = 0.7 + r() * 0.25, topo = [x + (r() - 0.5) * sz * 0.18, y - sz];
    g.save();
    g.globalAlpha = fora ? 0.7 : 1;
    // sombra no chão
    g.fillStyle = 'rgba(90,60,28,.16)'; g.beginPath(); g.ellipse(x + sz * 0.2, y + 1, sz * a, sz * 0.18, 0, 0, Math.PI * 2); g.fill();
    // lado iluminado
    g.fillStyle = '#e5d2a2'; g.beginPath(); g.moveTo(x - sz * a, y); g.lineTo(topo[0], topo[1]); g.lineTo(x + sz * a, y); g.closePath(); g.fill();
    // lado na sombra, com hachuras
    g.fillStyle = 'rgba(122,88,52,.42)'; g.beginPath(); g.moveTo(topo[0], topo[1]); g.lineTo(x + sz * a, y); g.lineTo(x + sz * 0.08, y); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,46,22,.5)'; g.lineWidth = 0.8;
    for (let k = 1; k < 5; k++) { const t = k / 5; g.beginPath(); g.moveTo(topo[0] + (x + sz * a - topo[0]) * t, topo[1] + (y - topo[1]) * t); g.lineTo(topo[0] + (x + sz * 0.08 - topo[0]) * t * 0.9 + 2, y - 1); g.stroke(); }
    // contorno
    g.strokeStyle = TINTA; g.lineWidth = 1.4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - sz * a, y); g.lineTo(topo[0], topo[1]); g.lineTo(x + sz * a, y); g.stroke();
    // neve ou rocha no cume dos mais altos
    if (sz > 26) { g.fillStyle = 'rgba(250,244,228,.85)'; g.beginPath(); g.moveTo(topo[0], topo[1]); g.lineTo(topo[0] - sz * 0.16, topo[1] + sz * 0.22); g.lineTo(topo[0] + sz * 0.02, topo[1] + sz * 0.17); g.lineTo(topo[0] + sz * 0.15, topo[1] + sz * 0.21); g.closePath(); g.fill(); }
    g.restore();
  }

  const CONIFERAS = { pinheiro: 1, abeto: 1, cipreste: 1 };
  const FRUTO = { macieira: '#b8241a', laranjeira: '#e0801a', limoeiro: '#dcc430', pereira: '#b4a838' };
  function hexA(c, mis, a) {
    const r = ((c >> 16) & 255) * (1 - mis) + 232 * mis, gg = ((c >> 8) & 255) * (1 - mis) + 214 * mis, b = (c & 255) * (1 - mis) + 168 * mis;
    return `rgba(${r | 0},${gg | 0},${b | 0},${a})`;
  }
  function arvore(g, x, y, t, E, r) {
    const s = Math.max(0.6, t.s || 1), esc = Math.min(1.5, E / 4);
    const cor = t.cor || 0x34502a;
    g.save();
    if (t.esp === 'seca') {
      g.strokeStyle = 'rgba(70,50,30,.85)'; g.lineWidth = 1.2;
      const h = 9 * s * esc; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.moveTo(x, y - h * 0.6); g.lineTo(x + h * 0.3, y - h * 0.9); g.moveTo(x, y - h * 0.45); g.lineTo(x - h * 0.28, y - h * 0.75); g.stroke();
      g.restore(); return;
    }
    if (CONIFERAS[t.esp]) {
      const w = (t.esp === 'cipreste' ? 2.6 : 4.6) * s * esc, h = (t.esp === 'cipreste' ? 15 : 13) * s * esc;
      g.fillStyle = 'rgba(80,55,25,.22)'; g.beginPath(); g.ellipse(x + w * 0.5, y + 1, w * 1.1, w * 0.35, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = hexA(cor, 0.28, 0.95);
      g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y - h * 0.12); g.lineTo(x - w, y - h * 0.12); g.closePath(); g.fill();
      g.fillStyle = 'rgba(20,36,18,.28)'; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y - h * 0.12); g.lineTo(x + w * 0.1, y - h * 0.12); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,40,22,.9)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y - h * 0.12); g.lineTo(x - w, y - h * 0.12); g.closePath(); g.stroke();
      g.strokeStyle = 'rgba(70,46,24,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y - h * 0.12); g.lineTo(x, y); g.stroke();
      g.restore(); return;
    }
    const rr = (t.esp === 'pinheiroManso' ? 5.4 : t.esp === 'oliveira' ? 3.8 : 4.4) * s * esc;
    const cy = y - rr * 0.9;
    g.fillStyle = 'rgba(80,55,25,.22)'; g.beginPath(); g.ellipse(x + rr * 0.45, y + 1, rr * 1.05, rr * 0.36, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(70,46,24,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, cy); g.lineTo(x, y); g.stroke();
    // copa em três ou quatro bolos, como se desenha nos mapas antigos
    const bolos = [[0, 0, 1], [-0.45, 0.2, 0.7], [0.45, 0.22, 0.7], [0.05, -0.38, 0.62]];
    g.fillStyle = hexA(cor, 0.3, 0.96);
    g.beginPath(); bolos.forEach(([a, b, k]) => { g.moveTo(x + a * rr + k * rr * 0.75, cy + b * rr); g.arc(x + a * rr, cy + b * rr, k * rr * 0.75, 0, Math.PI * 2); }); g.fill();
    g.fillStyle = 'rgba(20,30,14,.22)'; g.beginPath(); g.arc(x + rr * 0.3, cy + rr * 0.25, rr * 0.55, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(30,38,20,.85)'; g.lineWidth = 0.9;
    g.beginPath(); bolos.forEach(([a, b, k]) => { g.moveTo(x + a * rr + k * rr * 0.75, cy + b * rr); g.arc(x + a * rr, cy + b * rr, k * rr * 0.75, 0, Math.PI * 2); }); g.stroke();
    const fr = FRUTO[t.esp];
    if (fr) { g.fillStyle = fr; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + (r() - 0.5) * rr * 1.2, cy + (r() - 0.5) * rr, Math.max(1, rr * 0.16), 0, Math.PI * 2); g.fill(); } }
    g.restore();
  }

  function casa(g, f, x, z, w, d, rot) {
    const [a, b] = bp(f, x, z), E = f.E;
    const grande = Math.min(w, d) > 9 || w * d > 160;
    g.save(); g.translate(a, b); g.rotate(-rot);
    const W = Math.max(3, w * E), D = Math.max(3, d * E);
    // sombra projetada
    g.fillStyle = 'rgba(70,45,18,.28)'; g.fillRect(-W / 2 + 2.5, -D / 2 + 2.5, W, D);
    const tel = grande ? '#a89a80' : f.telha;
    g.fillStyle = tel; g.fillRect(-W / 2, -D / 2, W, D);
    // metade em sombra (o telhado tem duas águas)
    g.fillStyle = 'rgba(40,20,8,.26)';
    if (W >= D) g.fillRect(-W / 2, 0, W, D / 2); else g.fillRect(0, -D / 2, W / 2, D);
    // fiadas de telha
    g.strokeStyle = 'rgba(40,22,10,.22)'; g.lineWidth = 0.6;
    if (W >= D) for (let k = -W / 2 + 3; k < W / 2; k += 3) { g.beginPath(); g.moveTo(k, -D / 2); g.lineTo(k, D / 2); g.stroke(); }
    else for (let k = -D / 2 + 3; k < D / 2; k += 3) { g.beginPath(); g.moveTo(-W / 2, k); g.lineTo(W / 2, k); g.stroke(); }
    g.strokeStyle = TINTA; g.lineWidth = grande ? 1.6 : 1.2; g.strokeRect(-W / 2, -D / 2, W, D);
    g.beginPath(); if (W >= D) { g.moveTo(-W / 2, 0); g.lineTo(W / 2, 0); } else { g.moveTo(0, -D / 2); g.lineTo(0, D / 2); } g.stroke();
    g.restore();
  }

  function extras(g, f, r) {
    const E = f.E;
    if (f.id === 'vale') {
      // o claustro: galerias de pedra em volta de um jardim, a cruz no meio
      const [a, b] = bp(f, 0, 0), L = 32 * E, l = 22 * E;
      g.fillStyle = 'rgba(70,45,18,.28)'; g.fillRect(a - L / 2 + 3, b - L / 2 + 3, L, L);
      g.fillStyle = '#b4a68a'; g.fillRect(a - L / 2, b - L / 2, L, L);
      g.fillStyle = '#8fa266'; g.fillRect(a - l / 2, b - l / 2, l, l);
      g.strokeStyle = TINTA; g.lineWidth = 1.6; g.strokeRect(a - L / 2, b - L / 2, L, L); g.lineWidth = 1.1; g.strokeRect(a - l / 2, b - l / 2, l, l);
      g.strokeStyle = 'rgba(58,40,20,.5)'; g.lineWidth = 0.7;
      for (let k = -l / 2; k <= l / 2; k += l / 6) { g.beginPath(); g.moveTo(a + k, b - L / 2); g.lineTo(a + k, b - l / 2); g.moveTo(a + k, b + l / 2); g.lineTo(a + k, b + L / 2); g.moveTo(a - L / 2, b + k); g.lineTo(a - l / 2, b + k); g.moveTo(a + l / 2, b + k); g.lineTo(a + L / 2, b + k); g.stroke(); }
      g.fillStyle = RUBRO; g.fillRect(a - 1.5, b - 7, 3, 14); g.fillRect(a - 5, b - 3, 10, 3);
      // a entrada da cripta
      const [c, e] = bp(f, M.LOCAIS.cripta.x, M.LOCAIS.cripta.z);
      g.fillStyle = '#4a3a2c'; g.beginPath(); g.arc(c, e, 2.6 * E, Math.PI, 0); g.lineTo(c + 2.6 * E, e + 1.5 * E); g.lineTo(c - 2.6 * E, e + 1.5 * E); g.closePath(); g.fill();
      g.strokeStyle = TINTA; g.lineWidth = 1.2; g.stroke();
    }
    if (f.id === 'minas' && f.R && f.R.CAVA) {
      // a Grande Cava: degraus de terra descendo em anéis, hachurados
      const CV = f.R.CAVA, [a, b] = bp(f, CV.x + f.R.OX, CV.z + f.R.OZ), R0 = CV.r * E;
      for (let k = 0; k < 6; k++) {
        const rr = R0 * (1 - k * 0.15);
        g.fillStyle = `rgba(${110 - k * 12},${84 - k * 10},${56 - k * 7},${0.2 + k * 0.07})`; g.beginPath(); g.arc(a, b, rr, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(58,40,20,.55)'; g.lineWidth = 1; g.stroke();
      }
      g.strokeStyle = 'rgba(58,40,20,.35)'; g.lineWidth = 0.8;
      for (let k = 0; k < 48; k++) { const an = k / 48 * Math.PI * 2; g.beginPath(); g.moveTo(a + Math.cos(an) * R0, b + Math.sin(an) * R0); g.lineTo(a + Math.cos(an) * R0 * 0.82, b + Math.sin(an) * R0 * 0.82); g.stroke(); }
      g.strokeStyle = OURO; g.lineWidth = 2; g.beginPath(); g.arc(a, b, R0, 0, Math.PI * 2); g.stroke();
    }
    if (f.id === 'corte' && f.R && f.R.LAB) {
      // o labirinto de sebes do Jardim dos Espelhos
      const LB = f.R.LAB, [a, b] = bp(f, LB.x + f.R.OX, LB.z + f.R.OZ), m = LB.meio * E;
      g.fillStyle = 'rgba(62,98,52,.32)'; g.fillRect(a - m, b - m, m * 2, m * 2);
      g.strokeStyle = 'rgba(38,66,30,.85)'; g.lineWidth = 2.4; g.strokeRect(a - m, b - m, m * 2, m * 2);
      g.lineWidth = 1.6;
      for (let k = 1; k < 4; k++) { const q = m * (1 - k * 0.24); g.beginPath(); g.rect(a - q, b - q, q * 2, q * 2); g.stroke(); }
      g.strokeStyle = '#e8d8ae'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { const q = m * (1 - k * 0.24), an = k * 1.7; g.beginPath(); g.moveTo(a + Math.cos(an) * q - 4, b + Math.sin(an) * q); g.lineTo(a + Math.cos(an) * q + 4, b + Math.sin(an) * q); g.stroke(); }
    }
  }

  function moldura(g, f) {
    // filetes de ouro e vermelho, como nas páginas iluminadas
    g.save();
    g.strokeStyle = TINTA; g.lineWidth = 3; g.strokeRect(6, 6, S - 12, S - 12);
    g.strokeStyle = OURO; g.lineWidth = 2.5; g.strokeRect(14, 14, S - 28, S - 28);
    g.strokeStyle = RUBRO; g.lineWidth = 1.2; g.strokeRect(20, 20, S - 40, S - 40);
    [[24, 24], [S - 24, 24], [24, S - 24], [S - 24, S - 24]].forEach(([x, y]) => {
      g.fillStyle = '#e8d29a'; g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.fill(); g.strokeStyle = OURO; g.lineWidth = 2; g.stroke();
      g.fillStyle = RUBRO; g.fillRect(x - 1.8, y - 8, 3.6, 16); g.fillRect(x - 8, y - 1.8, 16, 3.6);
    });
    // rosa dos ventos
    const cx = S - 150, cy = 150, R = 92;
    g.globalAlpha = 0.95;
    g.strokeStyle = 'rgba(58,40,20,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R * 0.82, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(cx, cy, R * 0.74, 0, Math.PI * 2); g.stroke();
    for (let k = 0; k < 32; k++) { const an = k / 32 * Math.PI * 2, r1 = R * 0.74, r2 = R * (k % 4 === 0 ? 0.88 : 0.8); g.beginPath(); g.moveTo(cx + Math.sin(an) * r1, cy - Math.cos(an) * r1); g.lineTo(cx + Math.sin(an) * r2, cy - Math.cos(an) * r2); g.stroke(); }
    const ponta = (an, len, w, c1, c2) => {
      const tx = cx + Math.sin(an) * len, ty = cy - Math.cos(an) * len, lx = cx + Math.sin(an - Math.PI / 2) * w, ly = cy - Math.cos(an - Math.PI / 2) * w, rx = cx + Math.sin(an + Math.PI / 2) * w, ry = cy - Math.cos(an + Math.PI / 2) * w;
      g.fillStyle = c1; g.beginPath(); g.moveTo(tx, ty); g.lineTo(lx, ly); g.lineTo(cx, cy); g.closePath(); g.fill();
      g.fillStyle = c2; g.beginPath(); g.moveTo(tx, ty); g.lineTo(rx, ry); g.lineTo(cx, cy); g.closePath(); g.fill();
      g.strokeStyle = TINTA; g.lineWidth = 1; g.beginPath(); g.moveTo(tx, ty); g.lineTo(lx, ly); g.lineTo(cx, cy); g.lineTo(rx, ry); g.closePath(); g.stroke();
    };
    for (let k = 0; k < 4; k++) ponta(Math.PI / 4 + k * Math.PI / 2, R * 0.5, R * 0.1, '#e9d6a4', '#b8955a');
    for (let k = 0; k < 4; k++) ponta(k * Math.PI / 2, R * 0.86, R * 0.15, k === 0 ? '#c0281c' : '#efdcae', k === 0 ? '#7a140d' : '#a88a50');
    g.fillStyle = OURO; g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = TINTA; g.stroke();
    g.font = `34px ${FG}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = RUBRO; g.fillText('N', cx, cy - R - 16);
    g.font = `20px ${FD}`; g.fillStyle = TINTA2; g.fillText('S', cx, cy + R + 14); g.fillText('L', cx + R + 14, cy); g.fillText('O', cx - R - 14, cy);
    g.globalAlpha = 1;
    // escala
    const m50 = 50 * f.E, x0 = 70, y0 = S - 70;
    g.fillStyle = 'rgba(239,226,191,.8)'; g.fillRect(x0 - 12, y0 - 30, m50 * 2 + 24, 50);
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#efe2bf' : TINTA; g.fillRect(x0 + k * m50 / 2, y0, m50 / 2, 7); }
    g.strokeStyle = TINTA; g.lineWidth = 1.2; g.strokeRect(x0, y0, m50 * 2, 7);
    g.font = `16px ${FD}`; g.fillStyle = TINTA; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('0', x0, y0 - 6); g.fillText('50', x0 + m50, y0 - 6); g.fillText('100 passos', x0 + m50 * 2, y0 - 6);
    // saídas da região
    (f.saidas || []).forEach(s => {
      const [a, b] = bp(f, s.x, s.z); g.font = `italic 22px ${FB}`; g.fillStyle = RUBRO; g.textAlign = 'center';
      g.fillText(`${s.seta} ${s.txt}`, a, b);
    });
    g.restore();
  }

  /* ================= A NÉVOA ================= */
  const nevoas = {};
  function cobertura(k) {
    // a névoa é desenhada uma vez (nuvens de papel) e recortada pela máscara do que foi explorado
    let n = nevoas[k];
    if (!n) {
      const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
      fundoPapel(g, S, S, 'nevoa-' + k);
      const r = sorte('nuvens-' + k);
      for (let i = 0; i < 220; i++) {
        const x = r() * S, y = r() * S, rr = 30 + r() * 110;
        const m = g.createRadialGradient(x, y - rr * 0.2, rr * 0.1, x, y, rr);
        m.addColorStop(0, 'rgba(250,242,220,.55)'); m.addColorStop(0.7, 'rgba(232,216,178,.25)'); m.addColorStop(1, 'rgba(200,175,130,0)');
        g.fillStyle = m; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(120,90,50,.12)'; g.lineWidth = 1.2;
      for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, w = 30 + r() * 70; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + w * 0.3, y - 10, x + w * 0.6, y + 10, x + w, y); g.stroke(); }
      const final = document.createElement('canvas'); final.width = final.height = S;
      n = nevoas[k] = { nuvem: c, final, versao: -1 };
    }
    const R = OV.rumo; if (!R) return null;
    const v = R.versaoNevoa(k);
    if (n.versao !== v) {
      n.versao = v;
      const g = n.final.getContext('2d');
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, S, S); g.drawImage(n.nuvem, 0, 0);
      g.globalCompositeOperation = 'destination-out'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      const m = R.mascara(k); if (m) { g.drawImage(m, 0, 0, S, S); g.drawImage(m, 0, 0, S, S); }
      g.globalCompositeOperation = 'source-over';
    }
    return n.final;
  }
  MP.cobertura = cobertura;

  /* ================= A JANELA DO MAPA ================= */
  let atual = 'vale';
  const vista = { v: 1, ox: 0, oy: 0, W: 0, H: 0, dpr: 1 };
  let alvosClique = [], hover = null, sujo = true;
  function conhecidas() {
    const prog = OV.jogo.prog || { visitados: [], flags: {} };
    const r = ['vale'];
    if ((prog.flags && prog.flags.ato1_fim) || (prog.visitados || []).some(k => (OV.porto && OV.porto.LOCAIS.includes(k)) || k === 'porto')) r.push('porto');
    const fl = prog.flags || {}, vis = prog.visitados || [];
    [['minas', 'ato2_fim'], ['corte', 'ato3_fim'], ['muros', 'ato4_fim'], ['marca', 'ato5_fim'], ['monte', 'ato6_fim']].forEach(([k, f]) => { const R = OV.regioes && OV.regioes[k]; if (R && (fl[f] || vis.includes(k) || vis.some(v => R.LOCAIS.includes(v)))) r.push(k); });
    return r;
  }
  MP.conhecidas = conhecidas;
  function montarAbas() {
    const rs = conhecidas();
    if (rs.length < 2) { abas.innerHTML = ''; return; }
    abas.innerHTML = rs.map(k => `<button type="button" data-regiao="${k}" aria-pressed="${k === atual}">${({ vale: 'Vale', porto: 'Portos', minas: 'Minas', corte: 'Corte', muros: 'Muros', marca: 'Marca', monte: 'Monte' })[k] || fonte(k).nome}</button>`).join('');
  }
  abas.addEventListener('click', ev => { const b = ev.target.closest('[data-regiao]'); if (!b) return; trocar(b.dataset.regiao, false); });

  function medir() {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = el.clientWidth || innerWidth, H = el.clientHeight || innerHeight;
    if (vista.W !== W || vista.H !== H || vista.dpr !== dpr) { vista.W = W; vista.H = H; vista.dpr = dpr; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  }
  const vMin = () => Math.min(vista.W / S, vista.H / S) * 0.94;
  const vMax = () => 2.2;
  function limitar() {
    vista.v = Math.max(vMin(), Math.min(vMax(), vista.v));
    const w = S * vista.v, h = S * vista.v, mx = vista.W * 0.3, my = vista.H * 0.3;
    if (w <= vista.W) vista.ox = (vista.W - w) / 2; else vista.ox = Math.min(mx, Math.max(vista.W - w - mx, vista.ox));
    if (h <= vista.H) vista.oy = (vista.H - h) / 2; else vista.oy = Math.min(my, Math.max(vista.H - h - my, vista.oy));
  }
  function centrarEm(x, z, v) {
    const f = fonte(atual); if (!f) return;
    if (v) vista.v = v;
    const [a, b] = bp(f, x, z); vista.ox = vista.W / 2 - a * vista.v; vista.oy = vista.H / 2 - b * vista.v; limitar(); sujo = true;
  }
  function trocar(k, noJogador) {
    atual = k; montarAbas(); medir();
    const P = OV.P, f = fonte(k);
    tit.textContent = f.nome;
    if (noJogador && MP.regiaoDe(P.pos.x, P.pos.z) === k && P.pos.x < 200) centrarEm(P.pos.x, P.pos.z, Math.max(vMin(), Math.min(vMax(), Math.min(vista.W, vista.H * 1.4) / (260 * f.E))));
    else { vista.v = vMin(); limitar(); }
    MP.legenda(); sujo = true;
  }
  function zoom(fator, sx, sy) {
    const v0 = vista.v, v1 = Math.max(vMin(), Math.min(vMax(), v0 * fator));
    if (sx === undefined) { sx = vista.W / 2; sy = vista.H / 2; }
    vista.ox = sx - (sx - vista.ox) * (v1 / v0); vista.oy = sy - (sy - vista.oy) * (v1 / v0); vista.v = v1; limitar(); sujo = true;
  }
  MP.zoom = zoom;
  MP.trocar = k => trocar(k, false);
  MP._dbg = () => ({ alvos: alvosClique.map(a => a.tipo + ":" + (a.nome || a.id)), v: vista.v, ox: vista.ox, oy: vista.oy, atual });

  // cada lugar com nome: o tamanho e a letra mostram a importância
  const MAIOR = { vila: 1, mosteiro: 1, praca: 1, valdouro: 1, belmonte: 1, palacio: 1, montalto: 1, valbaixo: 1, saomartinho: 1, sarca: 1, torre: 1 };
  const NATURAL = { floresta: 'bosque', lago: 'agua', farol: null, ermida: null };
  const OY = { claustro: 34, mosteiro: -46, cripta: 26, floresta: -10, vila: -78 };
  function rotulo(t, x, y, tipo, alfa) {
    ctx.save(); ctx.globalAlpha = alfa; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (tipo === 'maior') { ctx.font = `600 ${Math.round(23 + 4 * Math.min(1, vista.v))}px ${FG}`; ctx.fillStyle = RUBRO; }
    else if (tipo === 'bosque') { ctx.font = `italic 17px ${FB}`; ctx.fillStyle = '#2f5b33'; }
    else if (tipo === 'agua') { ctx.font = `italic 16px ${FB}`; ctx.fillStyle = AZUL; }
    else { ctx.font = `14px ${FD}`; ctx.fillStyle = TINTA; }
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(240,228,196,.92)'; ctx.strokeText(t, x, y); ctx.fillText(t, x, y);
    ctx.restore();
  }
  function losango(x, y, r, cor, rastreada) {
    ctx.save();
    if (rastreada) {
      const pul = 1 + 0.18 * Math.sin(performance.now() / 260);
      ctx.strokeStyle = 'rgba(226,184,90,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r * 1.75 * pul, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,18,8,.35)'; ctx.beginPath(); ctx.moveTo(x + 2, y - r + 2); ctx.lineTo(x + r + 2, y + 2); ctx.lineTo(x + 2, y + r + 2); ctx.lineTo(x - r + 2, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = cor; ctx.strokeStyle = '#f5e8c6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f5e8c6'; ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  MP.losango = (g, x, y, r, cor, rastreada) => desenharLosango(g, x, y, r, cor, rastreada);
  function desenharLosango(g, x, y, r, cor, rastreada) {
    g.save();
    if (rastreada) { g.strokeStyle = 'rgba(226,184,90,.95)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r * 1.6, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = cor; g.strokeStyle = '#f5e8c6'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  // baús, masmorras e confrarias (usado também pelo minimapa)
  MP.marca = function (g, tipo, x, y, r, gasto) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(30,18,8,.3)'; g.beginPath(); g.ellipse(1.5, r * 0.75, r * 0.95, r * 0.3, 0, 0, Math.PI * 2); g.fill();
    g.lineWidth = Math.max(1.2, r * 0.14); g.strokeStyle = '#2a1a0c';
    if (tipo === 'bau') {
      g.fillStyle = gasto ? '#9a8e7a' : '#7a4a22';
      g.beginPath(); g.rect(-r, -r * 0.35, r * 2, r * 1.05); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-r, -r * 0.35); g.quadraticCurveTo(0, gasto ? -r * 1.5 : -r * 1.15, r, -r * 0.35); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = gasto ? '#c8beaa' : '#e0b448'; g.fillRect(-r * 0.12, -r * 0.75, r * 0.24, r * 1.45); g.fillRect(-r * 0.2, -r * 0.1, r * 0.4, r * 0.32);
    } else if (tipo === 'masmorra') {
      g.fillStyle = gasto ? '#b4ab98' : '#6a6258';
      g.beginPath(); g.moveTo(-r, r * 0.7); g.lineTo(-r, -r * 0.2); g.arc(0, -r * 0.2, r, Math.PI, 0); g.lineTo(r, r * 0.7); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = gasto ? '#e8dcbc' : '#140c08';
      g.beginPath(); g.moveTo(-r * 0.48, r * 0.7); g.lineTo(-r * 0.48, -r * 0.1); g.arc(0, -r * 0.1, r * 0.48, Math.PI, 0); g.lineTo(r * 0.48, r * 0.7); g.closePath(); g.fill();
      if (gasto) { g.fillStyle = '#b8261b'; g.fillRect(-r * 0.07, -r * 0.45, r * 0.14, r * 0.85); g.fillRect(-r * 0.28, -r * 0.2, r * 0.56, r * 0.14); }
    } else if (tipo === 'guilda') {
      g.fillStyle = '#5a3a1a'; g.fillRect(-r * 0.75, -r * 1.1, r * 0.16, r * 1.85);
      g.fillStyle = '#9a1a14'; g.beginPath(); g.moveTo(-r * 0.6, -r * 1.05); g.lineTo(r * 0.85, -r * 1.05); g.lineTo(r * 0.85, r * 0.45); g.lineTo(r * 0.12, r * 0.05); g.lineTo(-r * 0.6, r * 0.45); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#e0b448'; g.fillRect(r * 0.07, -r * 0.85, r * 0.12, r * 0.7); g.fillRect(-r * 0.12, -r * 0.62, r * 0.5, r * 0.12);
    }
    g.restore();
  };
  function oratorioIcone(x, y, aceso, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (aceso) {
      ctx.fillStyle = '#d4a23e'; ctx.fill(); ctx.strokeStyle = '#6b4513'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = RUBRO; ctx.fillRect(x - r * 0.17, y - r * 0.68, r * 0.34, r * 1.36); ctx.fillRect(x - r * 0.55, y - r * 0.33, r * 1.1, r * 0.32);
    } else { ctx.fillStyle = 'rgba(239,226,191,.8)'; ctx.fill(); ctx.strokeStyle = '#8a7254'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#8a7254'; ctx.fillRect(x - 1, y - r * 0.5, 2, r); ctx.fillRect(x - r * 0.35, y - r * 0.2, r * 0.7, 2); }
    ctx.restore();
  }

  MP.desenhar = function () {
    if (el.hidden) return;
    medir();
    const f = fonte(atual); if (!f) return;
    const dpr = vista.dpr, v = vista.v;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#16100c'; ctx.fillRect(0, 0, vista.W, vista.H);
    const base = MP.base(atual), nev = cobertura(atual);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 30; ctx.fillStyle = '#e8d7aa'; ctx.fillRect(vista.ox, vista.oy, S * v, S * v);
    ctx.restore();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(base, vista.ox, vista.oy, S * v, S * v);
    if (nev) ctx.drawImage(nev, vista.ox, vista.oy, S * v, S * v);
    const sc = (x, z) => { const [a, b] = bp(f, x, z); return [vista.ox + a * v, vista.oy + b * v]; };
    const R = OV.rumo, visto = (x, z) => !R || R.explorado(x, z);
    const prog = OV.jogo.prog || { visitados: [] };
    alvosClique = [];
    // nomes dos lugares (só do que já foi explorado)
    for (const k in M.LOCAIS) {
      const l = M.LOCAIS[k]; if (l.x === undefined || MP.regiaoDe(l.x, l.z) !== atual || l.x > 200) continue;
      if (!visto(l.x, l.z) && !prog.visitados.includes(k)) continue;
      const [x, y] = sc(l.x, l.z);
      const oy = (l.oy !== undefined ? l.oy : OY[k] !== undefined ? OY[k] : -18) * Math.min(1.6, Math.max(0.7, v * 2.2));
      const tipo = MAIOR[k] ? 'maior' : NATURAL[k] || 'menor';
      rotulo(l.nome, x, y + oy, tipo, 1);
      alvosClique.push({ tipo: 'lugar', x, y: y + oy, r: 20, nome: l.nome });
    }
    if (atual === 'vale' && visto(M.rioX(30), 30)) { const [x, y] = sc(M.rioX(30) + 10, 30); rotulo('Rio Lento', x, y, 'agua', 0.95); }
    // Oratórios
    const ro = Math.max(8, Math.min(13, 9 * Math.sqrt(v * 2)));
    for (const id in M.oratorios) {
      const o = M.oratorios[id]; if (MP.regiaoDe(o.x, o.z) !== atual || o.x > 200) continue;
      if (!o.aceso && !visto(o.x, o.z)) continue;
      const [x, y] = sc(o.x, o.z);
      oratorioIcone(x, y, o.aceso, ro);
      alvosClique.push({ tipo: 'oratorio', id, x, y, r: ro + 6, nome: o.nome, aceso: o.aceso });
    }
    // baús, masmorras e confrarias (só o que já foi visto)
    if (OV.aventura) {
      const rm = Math.max(7, Math.min(12, 8 * Math.sqrt(v * 2)));
      OV.aventura.marcas(atual).forEach(m => {
        if (!visto(m.x, m.z)) return;
        const [x, y] = sc(m.x, m.z), gasto = m.tipo === 'bau' ? m.aberto : m.tipo === 'masmorra' ? m.feita : false;
        MP.marca(ctx, m.tipo, x, y, m.tipo === 'bau' ? rm * 0.8 : rm, gasto);
        alvosClique.push({ tipo: 'lugar', x, y, r: rm + 4, nome: m.nome || (m.aberto ? 'Baú (já aberto)' : 'Baú fechado') });
      });
    }
    // missões
    if (R) {
      const rast = R.rastreada();
      R.ativas().forEach(id => {
        const p = R.alvoBruto(id); if (!p || MP.regiaoDe(p.x, p.z) !== atual || p.x > 200) return;
        const [x, y] = sc(p.x, p.z), MIS = OV.missoes.MIS[id], prin = MIS.tipo === 'p';
        losango(x, y, id === rast ? 12 : 8, prin ? MP.COR.principal : MP.COR.secundaria, id === rast);
        alvosClique.push({ tipo: 'missao', id, x, y, r: 16, nome: MIS.nome, prin, txt: R.textoEtapa(id) });
      });
    }
    // o peregrino
    const P = OV.P;
    if (MP.regiaoDe(P.pos.x, P.pos.z) === atual && P.pos.x < 200) {
      const [x, y] = sc(P.pos.x, P.pos.z);
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(184,38,27,.18)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(-P.facing + Math.PI);
      ctx.fillStyle = '#b8261b'; ctx.strokeStyle = '#f5e8c6'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(8.5, 10); ctx.lineTo(0, 5); ctx.lineTo(-8.5, 10); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.strokeStyle = TINTA; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    sujo = false;
  };

  /* legenda: o que cada sinal quer dizer, e a missão rastreada */
  const ICO = {
    voce: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 L16 17 L10 13 L4 17 Z" fill="#b8261b" stroke="#3a2814" stroke-width="1"/></svg>',
    principal: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2 L18 10 L10 18 L2 10 Z" fill="${MP.COR.principal}" stroke="#f5e8c6" stroke-width="1.6"/></svg>`,
    secundaria: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 L17 10 L10 17 L3 10 Z" fill="${MP.COR.secundaria}" stroke="#f5e8c6" stroke-width="1.6"/></svg>`,
    aceso: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#d4a23e" stroke="#6b4513" stroke-width="1.5"/><rect x="8.6" y="4.5" width="2.8" height="11" fill="#7a140d"/><rect x="5.6" y="7.6" width="8.8" height="2.6" fill="#7a140d"/></svg>',
    apagado: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#efe2bf" stroke="#8a7254" stroke-width="1.5"/></svg>',
    casa: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="5" width="14" height="10" fill="#a4553a" stroke="#3a2814" stroke-width="1.2"/><path d="M3 10 H17" stroke="#3a2814" stroke-width="1.2"/><rect x="3" y="10" width="14" height="5" fill="rgba(40,20,8,.26)"/></svg>',
    estrada: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 14 C7 6 13 14 18 6" stroke="rgba(92,64,34,.7)" stroke-width="6" fill="none"/><path d="M2 14 C7 6 13 14 18 6" stroke="#dcc394" stroke-width="4" fill="none"/></svg>',
    monte: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 17 L10 3 L18 17 Z" fill="#e5d2a2"/><path d="M10 3 L18 17 L11 17 Z" fill="rgba(122,88,52,.5)"/><path d="M2 17 L10 3 L18 17" fill="none" stroke="#3a2814" stroke-width="1.3"/></svg>',
    nevoa: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7" cy="11" r="5" fill="#f1e4c4" stroke="#b49a6a"/><circle cx="13" cy="9" r="6" fill="#f1e4c4" stroke="#b49a6a"/></svg>'
  };
  ICO.bau = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 9 Q10 2 17 9 Z" fill="#7a4a22" stroke="#2a1a0c"/><rect x="3" y="9" width="14" height="8" fill="#7a4a22" stroke="#2a1a0c"/><rect x="9" y="6" width="2" height="11" fill="#e0b448"/></svg>';
  ICO.masmorra = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 18 V9 A7 7 0 0 1 17 9 V18 Z" fill="#6a6258" stroke="#2a1a0c"/><path d="M7 18 V10 A3 3 0 0 1 13 10 V18 Z" fill="#140c08"/></svg>';
  ICO.guilda = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2" width="1.8" height="16" fill="#5a3a1a"/><path d="M6 3 H17 V14 L11.5 11 L6 14 Z" fill="#9a1a14" stroke="#2a1a0c"/><rect x="11" y="5" width="1.4" height="6" fill="#e0b448"/><rect x="9.4" y="6.8" width="4.6" height="1.4" fill="#e0b448"/></svg>';
  MP.ICO = ICO;
  MP.legenda = function () {
    const R = OV.rumo, MS = OV.missoes, esc = OV.ui.esc;
    const id = R ? R.rastreada() : null;
    let rast = '<p class="leg-vazio">Nenhuma missão rastreada. Escolha uma na tela de Missões (L).</p>';
    if (id) {
      const m = MS.MIS[id], p = R.alvoBruto(id), aqui = p && MP.regiaoDe(p.x, p.z) === atual;
      rast = `<p class="leg-tipo ${m.tipo === 'p' ? 'p' : 's'}">${m.tipo === 'p' ? 'Missão principal' : 'Missão secundária'}</p><p class="leg-nome">${esc(m.nome)}</p><p class="leg-txt">${esc(R.textoEtapa(id))}</p>${p && !aqui ? `<p class="leg-onde">Em: ${esc((fonte(MP.regiaoDe(p.x, p.z)) || {}).nome || '')}</p>` : ''}`;
    }
    leg.innerHTML = `<h3>Rastreando</h3>${rast}
      <h3>Legenda</h3>
      <ul>
        <li>${ICO.voce}<span>Você</span></li>
        <li>${ICO.principal}<span>Missão principal</span></li>
        <li>${ICO.secundaria}<span>Missão secundária</span></li>
        <li>${ICO.aceso}<span>Oratório aceso <em>(clique para viajar)</em></span></li>
        <li>${ICO.apagado}<span>Oratório ainda apagado</span></li>
        <li>${ICO.bau}<span>Baú <em>(cinza: já aberto)</em></span></li>
        <li>${ICO.masmorra}<span>Masmorra <em>(com cruz: purificada)</em></span></li>
        <li>${ICO.guilda}<span>Guilda ou confraria</span></li>
        <li>${ICO.casa}<span>Casa ou edifício</span></li>
        <li>${ICO.estrada}<span>Estrada</span></li>
        <li>${ICO.monte}<span>Monte e serra</span></li>
        <li>${ICO.nevoa}<span>Terra não explorada</span></li>
      </ul>`;
  };

  /* ---- abrir, fechar, interação ---- */
  MP.abrir = function () {
    el.hidden = false;
    const P = OV.P; trocar(MP.regiaoDe(P.pos.x, P.pos.z), true);
    MP.desenhar();
  };
  MP.fechar = function () { el.hidden = true; tip.hidden = true; arrasto = null; };
  MP.aberto = () => !el.hidden;
  MP.regiaoAtual = () => atual;

  function pos(ev) { const r = cv.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
  function alvoEm(x, y) { let best = null, bd = 1e9; for (const a of alvosClique) { const d = Math.hypot(a.x - x, a.y - y); if (d < a.r && d < bd) { bd = d; best = a; } } return best; }
  let arrasto = null;
  cv.addEventListener('pointerdown', ev => { const [x, y] = pos(ev); arrasto = { x, y, ox: vista.ox, oy: vista.oy, mov: 0 }; cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', ev => {
    const [x, y] = pos(ev);
    if (arrasto) {
      arrasto.mov = Math.max(arrasto.mov, Math.hypot(x - arrasto.x, y - arrasto.y));
      vista.ox = arrasto.ox + (x - arrasto.x); vista.oy = arrasto.oy + (y - arrasto.y); limitar(); sujo = true;
      cv.style.cursor = 'grabbing'; tip.hidden = true; return;
    }
    const a = alvoEm(x, y); hover = a;
    cv.style.cursor = a && a.tipo === 'oratorio' && a.aceso ? 'pointer' : 'grab';
    if (a) {
      const esc = OV.ui.esc;
      tip.innerHTML = a.tipo === 'oratorio' ? `<b>${esc(a.nome)}</b><span>${a.aceso ? 'Clique para viajar até aqui' : 'Ainda apagado: reze nele para acender a vela'}</span>`
        : a.tipo === 'missao' ? `<b class="${a.prin ? 'p' : 's'}">${esc(a.nome)}</b><span>${esc(a.txt)}</span>` : `<b>${esc(a.nome)}</b>`;
      tip.style.transform = `translate(${Math.min(vista.W - 280, x + 16)}px,${Math.min(vista.H - 90, y + 14)}px)`; tip.hidden = false;
    } else tip.hidden = true;
  });
  cv.addEventListener('pointerup', ev => {
    const a0 = arrasto; arrasto = null; cv.style.cursor = 'grab';
    if (a0 && a0.mov < 5) { const [x, y] = pos(ev); const a = alvoEm(x, y); if (a && a.tipo === 'oratorio' && a.aceso) OV.jogo.viajar(a.id); }
  });
  cv.addEventListener('wheel', ev => { ev.preventDefault(); const [x, y] = pos(ev); zoom(ev.deltaY < 0 ? 1.18 : 1 / 1.18, x, y); }, { passive: false });
  el.addEventListener('click', ev => {
    if (ev.target.closest('[data-fechar-mapa]')) { OV.jogo.toggleMapa(); return; }
    const z = ev.target.closest('[data-zoom]'); if (z) { zoom(z.dataset.zoom === '+' ? 1.35 : 1 / 1.35); return; }
    if (ev.target.closest('[data-centro]')) { const P = OV.P; if (MP.regiaoDe(P.pos.x, P.pos.z) !== atual) trocar(MP.regiaoDe(P.pos.x, P.pos.z), true); else centrarEm(P.pos.x, P.pos.z); }
  });
  // teclado dentro do mapa: setas e WASD movem, + e − aproximam
  MP.tecla = function (code) {
    const p = 80;
    if (code === 'ArrowLeft' || code === 'KeyA') vista.ox += p; else if (code === 'ArrowRight' || code === 'KeyD') vista.ox -= p;
    else if (code === 'ArrowUp' || code === 'KeyW') vista.oy += p; else if (code === 'ArrowDown' || code === 'KeyS') vista.oy -= p;
    else if (code === 'Equal' || code === 'NumpadAdd') { zoom(1.25); return true; } else if (code === 'Minus' || code === 'NumpadSubtract') { zoom(0.8); return true; }
    else return false;
    limitar(); sujo = true; return true;
  };
  addEventListener('resize', () => { if (!el.hidden) { medir(); limitar(); } });
})(window.OV);

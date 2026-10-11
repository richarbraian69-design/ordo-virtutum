/* Ordo Virtutum — Ato VI: a Marca Ardente. Região a noroeste (centro em −900, −900).
   Duas fortalezas, Rocaforte (oeste, do Conde Rodrigo) e Valverde (leste, do Barão Fernão), brigam há três gerações
   por um marco de fronteira. Entre elas, o Campo das Cinzas, onde o marco ficou sozinho; ao sul, o Rio Rubro e a
   Ponte Queimada; do outro lado do rio, a Vila de São Martinho, com o hospital onde se tratam os feridos dos dois lados. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.criarRegiao) return;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const A6 = () => OV.ato6;
  const VILA = { x: 0, z: 92 };
  const IGREJA = { x: -34, z: 90 }, HOSP = { x: 32, z: 92 };
  const MARCO = { x: 0, z: -40, r: 28 };          // o marco de fronteira, no meio do Campo das Cinzas: a arena de Abadon
  const ROCA = { x: -110, z: -60 }, VALV = { x: 110, z: -60 };
  const CAPM = { x: 36, z: -80 };                 // a Capela do Marco, em ruínas
  const LANT = { x: 0, z: -74 };                  // a Lanterna dos Mortos: a Lâmpada da Paciência
  const rioZ = lx => 30 + 5 * Math.sin(lx * 0.025 + 0.5);
  const PONTE = { x: 0, z: rioZ(0), meia: 10.5 };
  const naPonte = (lx, lz) => Math.abs(lx - PONTE.x) < 2.3 && Math.abs(lz - PONTE.z) < PONTE.meia;
  const noRio = (lx, lz) => Math.abs(lz - rioZ(lx)) < 5.6 && !naPonte(lx, lz);
  const noCampo = (lx, lz) => lz < rioZ(lx) - 8 && Math.abs(lx) < 92 && lz > -128;

  const R = OV.criarRegiao({
    id: 'marca', nome: 'Marca Ardente', OX: -900, OZ: -900, meio: 170,
    dentro: (x, z) => x < -500 && x > -1350 && z <= -450,
    relevo(lx, lz) {
      let h = 2.4 + 1.4 * Math.sin(lx * 0.027 + 0.4) * Math.cos(lz * 0.031) + 0.6 * Math.sin(lx * 0.07 + lz * 0.05);
      h += smooth(-20, -130, lz) * 3;                              // o campo sobe devagar para o norte, até as fortalezas
      const bord = Math.max(Math.abs(lx), Math.abs(lz));
      h += smooth(124, 166, bord) * 30;
      return h;
    },
    depois(lx, lz, h) {
      // o Rio Rubro: raso, de água barrenta e vermelha; os exércitos o atravessam a pé
      const dr = Math.abs(lz - rioZ(lx));
      if (dr < 8.5) h -= 1.5 * (1 - smooth(4.5, 8.5, dr));
      // a Ponte Queimada fica na altura das margens
      if (Math.abs(lx - PONTE.x) < 2.7 && Math.abs(lz - PONTE.z) < PONTE.meia + 1.5) h = Math.max(h, 2.9);
      return h;
    },
    // na luta contra Abadon, um círculo de brasas fecha o Campo: quem está dentro não sai, quem chega de fora entra
    limitar(lx, lz) {
      const a6 = A6(); if (!a6 || !a6.chefe || !a6.chefe.ativo) return null;
      const d = Math.hypot(lx - MARCO.x, lz - MARCO.z), R0 = MARCO.r - 0.6;
      if (d <= R0 || d > R0 + 3.2) return null;
      const k = R0 / (d || 1); return [MARCO.x + (lx - MARCO.x) * k, MARCO.z + (lz - MARCO.z) * k];
    },
    planos: [
      { x: VILA.x, z: VILA.z, r: 44, h: 3.4 }, { x: MARCO.x, z: MARCO.z, r: 34, h: 3.2 }, { x: ROCA.x, z: ROCA.z, r: 31, h: 6.2 }, { x: VALV.x, z: VALV.z, r: 31, h: 6.2 },
      { x: CAPM.x, z: CAPM.z, r: 10, h: 4.6 }, { x: 0, z: 140, r: 14, h: 3.2 }, { x: 120, z: 100, r: 10, h: 3.4 }
    ],
    estradas: [
      [[0, 158], [0, 104]],
      [[0, 78], [0, 44]],
      [[0, 19], [0, -12]],
      [[-6, -46], [-40, -54], [-86, -60]],
      [[6, -46], [40, -54], [86, -60]],
      [[14, 100], [60, 104], [116, 102]],
      [[-14, 82], [-30, 76], [-44, 72]],
      [[12, -60], [22, -68], [24, -76]]
    ],
    zonas: [['hospital', HOSP.x, HOSP.z, 10], ['igreja_martinho', IGREJA.x, IGREJA.z, 11], ['saomartinho', VILA.x, VILA.z, 46], ['ponte', PONTE.x, PONTE.z, 14],
      ['capela_marco', CAPM.x, CAPM.z, 9], ['rocaforte', ROCA.x, ROCA.z, 28], ['valverde', VALV.x, VALV.z, 28], ['cinzas', MARCO.x, MARCO.z, 46]],
    locais: {
      saomartinho: { nome: 'Vila de São Martinho', x: VILA.x, z: VILA.z, oy: -50 },
      hospital: { nome: 'Hospital de São Martinho', x: HOSP.x, z: HOSP.z, oy: -20 },
      ponte: { nome: 'Ponte Queimada', x: PONTE.x, z: PONTE.z, oy: -18 },
      cinzas: { nome: 'Campo das Cinzas', x: MARCO.x, z: MARCO.z, oy: -36 },
      rocaforte: { nome: 'Rocaforte', x: ROCA.x, z: ROCA.z, oy: -36 },
      valverde: { nome: 'Valverde', x: VALV.x, z: VALV.z, oy: -36 },
      capela_marco: { nome: 'Capela do Marco', x: CAPM.x, z: CAPM.z, oy: -16 }
    },
    entrada: { x: 0, z: 150, facing: Math.PI },
    paleta: { h: 0.11, s: 0.2, l: 0.19, rocha: 0x5a524a, rochaDe: 14, estrada: 0x7a6a56, mapaH: 34, mapaS: 14 },
    corExtra(lx, lz, h, c) {
      if (noCampo(lx, lz)) { const k = 1 - smooth(70, 92, Math.abs(lx)); c.lerp(new THREE.Color(0x4a4640), 0.62 * k); }
      if (Math.abs(lz - rioZ(lx)) < 6.5) c.lerp(new THREE.Color(0x5a2a1e), 0.55);
      if (naPonte(lx, lz)) c.lerp(new THREE.Color(0x2a221c), 0.85);
      if (Math.hypot(lx - MARCO.x, lz - MARCO.z) < 6) c.lerp(new THREE.Color(0x6a6258), 0.4);
    },
    mapaExtra(g, Q, ESC) {
      // o rio, vermelho
      g.strokeStyle = 'rgba(120,40,30,.85)'; g.lineWidth = Math.max(3, 10 * ESC); g.beginPath();
      for (let x = -168; x <= 168; x += 8) { const [a, b] = Q(x, rioZ(x)); if (x === -168) g.moveTo(a, b); else g.lineTo(a, b); } g.stroke();
      // o Campo das Cinzas
      const [ma, mb] = Q(MARCO.x, MARCO.z); g.fillStyle = 'rgba(70,66,60,.55)'; g.beginPath(); g.arc(ma, mb, 44 * ESC, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(200,190,170,.95)'; g.beginPath(); g.arc(ma, mb, Math.max(2, 2.2 * ESC), 0, Math.PI * 2); g.fill();
      // as duas fortalezas
      [[ROCA, 'rgba(120,30,24,.9)'], [VALV, 'rgba(40,90,40,.9)']].forEach(([f, cor]) => { const [a, b] = Q(f.x - 21, f.z - 21); g.strokeStyle = cor; g.lineWidth = 3; g.strokeRect(a, b, 42 * ESC, 42 * ESC); });
    }
  });
  OV.marca = R;
  Object.assign(R, { VILA, IGREJA, HOSP, MARCO, ROCA, VALV, CAPM, LANT, PONTE, rioZ, TELHA: '#5a3a2a' });
  R.agua = (lx, lz) => noRio(lx, lz);
  R.noCampo = noCampo;
  if (OV.inimigos && OV.inimigos.CENTROS) OV.inimigos.CENTROS.push({ x: VILA.x + R.OX, z: VILA.z + R.OZ }, { x: 0 + R.OX, z: 140 + R.OZ });
  const H = R.H;
  const X = lx => lx + R.OX, Z = lz => lz + R.OZ;
  const loc = p => ({ x: p.x - R.OX, z: p.z - R.OZ });
  const virarPara = (q, c) => Math.atan2(c.x - q.x, c.z - q.z);
  const MATK = {
    pedra: sm(0x6a625a, { roughness: 1 }), pedraE: sm(0x4a443e, { roughness: 1 }), queimado: sm(0x1e1a16, { roughness: 1 }), cal: sm(0xd8cdb8), telha: sm(0x5a2e22),
    rubro: sm(0x8a1e18, { side: THREE.DoubleSide }), verde: sm(0x2a5a2a, { side: THREE.DoubleSide }), lona: sm(0xb8aa8a, { side: THREE.DoubleSide }),
    agua: new THREE.MeshStandardMaterial({ color: 0x5a2a20, roughness: 0.25, metalness: 0.25, transparent: true, opacity: 0.88 }), ferro: sm(0x2a2a2e, { metalness: 0.6, roughness: 0.5 })
  };
  R.MAT = MATK;

  /* ================= O RIO RUBRO E A PONTE QUEIMADA ================= */
  (function () {
    for (let x = -170; x < 170; x += 6) {
      const xm = x + 3, zm = rioZ(xm), a = Math.atan2(rioZ(x + 6) - rioZ(x), 6);
      if (Math.abs(xm - PONTE.x) < 3.5) continue;
      const yb = Math.min(H(xm, zm - 7.5), H(xm, zm + 7.5)) - 0.55;
      const ag = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 11.6), MATK.agua); ag.rotation.x = -Math.PI / 2; ag.rotation.z = a; ag.position.set(X(xm), yb, Z(zm)); scene.add(ag);
    }
    // debaixo da ponte também corre água (vista pelos lados)
    [-1, 1].forEach(s => { const zm = PONTE.z, yb = H(s * 6, zm - 7.5) - 0.55; const ag = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 11.6), MATK.agua); ag.rotation.x = -Math.PI / 2; ag.position.set(X(s * 3.1), yb, Z(zm)); scene.add(ag); });
    // a ponte: tabuado escuro, pilares queimados, parapeito partido
    const y = 2.9, L = PONTE.meia * 2;
    const p = R.grupo(PONTE.x, PONTE.z, 0, y);
    p.add(mesh(new THREE.BoxGeometry(4.6, 0.3, L), MATK.queimado, 0, 0.02, 0));
    for (let k = 0; k < 14; k++) { const z = -L / 2 + 0.8 + k * 1.5; if (k === 6 || k === 7) continue; p.add(mesh(new THREE.BoxGeometry(4.4, 0.08, 1.2), sm(k % 3 ? 0x3a2a1e : 0x2a1e16), 0, 0.2, z)); }
    [-1, 1].forEach(s => {
      for (let k = 0; k < 6; k++) { const z = -L / 2 + 1.5 + k * 3.6, hh = (k === 2 || k === 3) ? 0.5 : 1.2; p.add(mesh(new THREE.BoxGeometry(0.24, hh, 0.24), MATK.queimado, s * 2.2, hh / 2, z)); }
      p.add(mesh(new THREE.BoxGeometry(0.18, 0.16, 6.4), MATK.queimado, s * 2.2, 1.15, -L / 2 + 4)); p.add(mesh(new THREE.BoxGeometry(0.18, 0.16, 6.4), MATK.queimado, s * 2.2, 1.15, L / 2 - 4));
      [-6, 0, 6].forEach(z => p.add(mesh(new THREE.BoxGeometry(0.6, 3.4, 0.6), MATK.pedraE, s * 1.6, -1.8, z)));
    });
    if (OV.cenario) OV.cenario.fundir(p);
    // a ponte ainda fumega (até a paz)
    const fm = []; for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), new THREE.MeshBasicMaterial({ color: 0x5a5450, transparent: true, opacity: 0.25, depthWrite: false })); f.position.set(X(-1 + i), y + 1, Z(PONTE.z - 1 + i)); scene.add(f); fm.push(f); }
    M.animados.push((dt, t) => fm.forEach((f, i) => { const k = (t * 0.3 + i / 3) % 1; f.position.y = y + 0.6 + k * 5; f.material.opacity = 0.3 * (1 - k); f.scale.setScalar(0.6 + k * 1.6); f.visible = !(OV.jogo && OV.jogo.prog && OV.jogo.prog.flags && OV.jogo.prog.flags.ato6_fim); }));
    R.VISAO = { x: -1.2, z: PONTE.z + 3.5 };
    R.inter(R.VISAO.x, R.VISAO.z, 2.4, () => A6() ? A6().textoPonte() : null, () => A6().ponte());
    R.oratorio('ponte', 'Oratório da Ponte', 12, PONTE.z - 14, -Math.PI * 0.6);
  })();

  /* ================= A VILA DE SÃO MARTINHO ================= */
  const posV = (a, r) => ({ x: VILA.x + Math.cos(a * Math.PI / 180) * r, z: VILA.z + Math.sin(a * Math.PI / 180) * r });
  (function () {
    R.praca(VILA.x, VILA.z, 12);
    // o cruzeiro da praça
    const cz = R.grupo(VILA.x, VILA.z, 0);
    cz.add(mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.7, 8), MATK.pedra, 0, 0.35, 0)); cz.add(mesh(new THREE.BoxGeometry(0.34, 4.2, 0.34), MATK.pedra, 0, 2.6, 0)); cz.add(mesh(new THREE.BoxGeometry(1.6, 0.3, 0.3), MATK.pedra, 0, 3.9, 0));
    if (OV.cenario) OV.cenario.fundir(cz); R.obst(VILA.x, VILA.z, 1.5);
    const oq = posV(300, 11); R.oratorio('saomartinho', 'Oratório de São Martinho', oq.x, oq.z, virarPara(oq, VILA));
    // a Igreja de São Martinho: a porta dá para a praça (leste)
    const ig = R.casaInt(IGREJA.x, IGREJA.z, Math.PI / 2, 12, 20, 9, { mat: MATK.cal, roof: MATK.telha, rh: 4.4, piso: MAT.stone, nome: 'Igreja de São Martinho' });
    R.IGREJA_INT = ig;
    M.mobilia(ig, 'altar', 0, -20 / 2 + 2.4, 0);
    for (let k = 0; k < 3; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.5, 0 + k * 2.4, 0));
    const porta = ig.W(0, 20 / 2 + 1.0);
    M.interativo(porta.x, porta.z, 2.6, () => A6() ? A6().textoIgreja() : null, () => A6().igreja());
    R.GREGORIO = loc(ig.W(0.8, -5.2)); R.GREGORIO_ROT = Math.PI / 2;
    // o campanário, ao lado da igreja
    const cp = R.grupo(IGREJA.x - 3, IGREJA.z - 8.8, 0);
    cp.add(mesh(new THREE.BoxGeometry(3.4, 14, 3.4), MATK.cal, 0, 7, 0)); const co = mesh(new THREE.ConeGeometry(2.8, 3.6, 4), MATK.telha, 0, 15.8, 0); co.rotation.y = Math.PI / 4; cp.add(co);
    if (OV.cenario) OV.cenario.fundir(cp); R.caixa(IGREJA.x - 3, IGREJA.z - 8.8, 1.8, 1.8, 0);
    // o Hospital de São Martinho: duas fileiras de camas, e ninguém pergunta de que lado é o ferido
    const ho = R.casaInt(HOSP.x, HOSP.z, -Math.PI / 2, 12, 18, 6, { mat: MATK.cal, roof: MATK.telha, rh: 3, nome: 'Hospital de São Martinho' });
    R.HOSP_INT = ho;
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => M.mobilia(ho, 'cama', s * 4.3, -6.6 + k * 3.2, 0));
    M.mobilia(ho, 'prateleira', 0, -8.4, 0);
    R.CALDEIRAO = loc(ho.W(-2.6, 5.8));
    R.FIRMINA = loc(ho.W(-0.8, 3.0)); R.FIRMINA_ROT = Math.PI / 2;
    R.FAUSTO = loc(ho.W(2.6, -3.4)); R.FAUSTO_ROT = Math.PI;
    R.DOROTEIA = loc(ho.W(-3.8, 4.4)); R.DOROTEIA_ROT = Math.PI / 2;
    // a casa da Viúva Leonor
    const lq = posV(140, 26), lr = virarPara(lq, VILA);
    const lc = R.casaInt(lq.x, lq.z, lr, 8, 7, 4.6, { mat: MATK.cal, roof: MATK.telha, rh: 2.6, nome: 'Casa da Viúva Leonor' });
    M.mobilia(lc, 'mesa', 1.4, -1.2); M.mobilia(lc, 'cama', -2.4, -1.2);
    R.LEONOR = loc(lc.W(0.3, 0.6)); R.LEONOR_ROT = lr;
    // as outras casas
    [[60, 8], [215, 8], [240, 9], [325, 8]].forEach(([a, w], i) => { const q = posV(a, 25); R.casa(q.x, q.z, virarPara(q, VILA), w, 7, 4.8 + (i % 2) * 0.5, { rh: 2.6, luz: true, roof: MATK.telha }); });
    [[20, 9], [75, 9], [110, 8], [160, 9], [205, 8], [230, 9], [250, 8], [320, 9], [340, 8]].forEach(([a, w], i) => { const q = posV(a, 38); R.casa(q.x, q.z, virarPara(q, VILA), w, 7.5, 5 + (i % 3) * 0.4, { rh: 2.7, luz: true, roof: i % 2 ? MATK.telha : MAT.roofTile }); });
    for (let a = 0; a < 360; a += 45) { const q = posV(a + 22, 13.5); R.lanterna(q.x, q.z, 0xffb060); }
  })();

  /* ================= O CAMPO DAS CINZAS, O MARCO E A LANTERNA DOS MORTOS ================= */
  (function () {
    // o marco: uma pedra alta com dois brasões, um de cada lado, e uma cruz em cima
    const m = R.grupo(MARCO.x, MARCO.z, 0);
    m.add(mesh(new THREE.BoxGeometry(1.1, 3.4, 0.7), MATK.pedra, 0, 1.6, 0));
    m.add(mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), MATK.pedra, 0, 3.7, 0)); m.add(mesh(new THREE.BoxGeometry(0.6, 0.16, 0.16), MATK.pedra, 0, 3.8, 0));
    m.add(mesh(new THREE.BoxGeometry(0.06, 0.7, 0.5), MATK.rubro, -0.58, 2.2, 0)); m.add(mesh(new THREE.BoxGeometry(0.06, 0.7, 0.5), MATK.verde, 0.58, 2.2, 0));
    if (OV.cenario) OV.cenario.fundir(m); R.obst(MARCO.x, MARCO.z, 0.9);
    R.inter(MARCO.x, MARCO.z + 1.6, 2.2, () => A6() ? A6().textoMarco() : null, () => A6().marco());
    // a Lanterna dos Mortos: a torrinha de pedra que os antigos erguiam nos campos de batalha, com uma luz para os que caíram
    const lt = R.grupo(LANT.x, LANT.z, 0);
    lt.add(mesh(new THREE.CylinderGeometry(1.1, 1.4, 8, 8), MATK.pedra, 0, 4, 0));
    const cam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.5), new THREE.MeshBasicMaterial({ color: 0x241c16 })); cam.position.y = 8.8; lt.add(cam);
    [[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.8]].forEach(([a, b]) => lt.add(mesh(new THREE.BoxGeometry(0.22, 1.7, 0.22), MATK.pedraE, a, 8.8, b)));
    lt.add(mesh(new THREE.ConeGeometry(1.3, 2, 8), MATK.pedraE, 0, 10.6, 0));
    lt.add(mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), MATK.pedra, 0, 12, 0)); lt.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.12), MATK.pedra, 0, 12.1, 0));
    R.obst(LANT.x, LANT.z, 1.5);
    const luz = R.emissor(LANT.x, H(LANT.x, LANT.z) + 9, LANT.z, 0, 44, 0xffd8a0, false);
    R.acenderLampada = b => { cam.material.color.setHex(b ? 0xfff0c8 : 0x241c16); luz.int = b ? 3 : 0; };
    // carroças quebradas, estandartes rasgados e árvores queimadas
    const rnd = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i < 12; i++) {
      const a = rnd(i, 1) * Math.PI * 2, r = 34 + rnd(i, 2) * 40, x = MARCO.x + Math.cos(a) * r, z = MARCO.z + Math.sin(a) * r * 0.8;
      if (!noCampo(x, z) || Math.abs(x) < 6 || !R.livre(x, z, 3)) continue;
      const c = R.grupo(x, z, rnd(i, 3) * 6);
      const cx = mesh(new THREE.BoxGeometry(1.8, 0.5, 3.0), MATK.queimado, 0, 0.7, 0); cx.rotation.z = (rnd(i, 4) - 0.5) * 0.5; c.add(cx);
      [-1, 1].forEach(s => { const w = mesh(new THREE.TorusGeometry(0.5, 0.08, 5, 10), MATK.queimado, s * 0.95, 0.5, 0.7); w.rotation.y = Math.PI / 2; c.add(w); });
      if (OV.cenario) OV.cenario.fundir(c); R.obst(x, z, 1.4);
    }
    for (let i = 0; i < 20; i++) {
      const a = rnd(i, 5) * Math.PI * 2, r = 30 + rnd(i, 6) * 50, x = MARCO.x + Math.cos(a) * r, z = MARCO.z + Math.sin(a) * r * 0.8;
      if (!noCampo(x, z) || Math.abs(x) < 4 || !R.livre(x, z, 1)) continue;
      const g = R.grupo(x, z, rnd(i, 7) * 6), lado = rnd(i, 8) < 0.5, inc = (rnd(i, 9) - 0.5) * 0.6;
      const haste = mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 5), MAT.wood, 0, 1.4, 0); haste.rotation.z = inc; g.add(haste);
      const b = mesh(new THREE.PlaneGeometry(0.9, 1.1), lado ? MATK.rubro : MATK.verde, 0.45, 2.4, 0); b.rotation.z = inc; g.add(b);
    }
    for (let i = 0; i < 44; i++) {
      const x = -90 + rnd(i, 10) * 180, z = -125 + rnd(i, 11) * 140;
      if (!noCampo(x, z) || Math.hypot(x - MARCO.x, z - MARCO.z) < MARCO.r + 6 || Math.abs(x) < 6 || !R.livre(x, z, 2)) continue;
      const hh = 3 + rnd(i, 12) * 4, g = R.grupo(x, z, rnd(i, 13) * 6);
      g.add(mesh(new THREE.CylinderGeometry(0.16, 0.32, hh, 6), MATK.queimado, 0, hh / 2, 0));
      for (let k = 0; k < 3; k++) { const gl = mesh(new THREE.CylinderGeometry(0.05, 0.1, 1.6, 4), MATK.queimado, 0, hh * (0.55 + k * 0.14), 0); gl.rotation.z = 0.9 * (k % 2 ? 1 : -1); gl.rotation.y = k * 2; g.add(gl); }
      if (OV.cenario) OV.cenario.fundir(g); R.obst(x, z, 0.4);
    }
  })();

  /* ================= AS DUAS FORTALEZAS ================= */
  // porta: +1 abre para leste, −1 para oeste (sempre virada para o Marco)
  function fortaleza(c, porta, matBand, nome) {
    const S = 21, alto = 7.5, t = 1.6, vao = 7;
    const parede = (lx0, lz0, lx1, lz1) => {
      const cx = (lx0 + lx1) / 2, cz = (lz0 + lz1) / 2, lw = Math.abs(lx1 - lx0) || t, ld = Math.abs(lz1 - lz0) || t, comp = Math.max(lw, ld), aoX = lw > ld;
      const g = R.grupo(cx, cz, 0); g.add(mesh(new THREE.BoxGeometry(lw, alto, ld), MATK.pedra, 0, alto / 2 - 0.8, 0));
      const n = Math.floor(comp / 2.2); for (let k = 0; k < n; k++) { const o = -comp / 2 + 1.1 + k * 2.2; g.add(mesh(new THREE.BoxGeometry(aoX ? 1.1 : t + 0.1, 0.7, aoX ? t + 0.1 : 1.1), MATK.pedraE, aoX ? o : 0, alto - 0.45, aoX ? 0 : o)); }
      g.add(mesh(new THREE.BoxGeometry(aoX ? comp * 0.3 : t + 0.04, 2.4, aoX ? t + 0.04 : comp * 0.3), MATK.queimado, 0, 1.6, 0)); // marcas de fogo antigo
      if (OV.cenario) OV.cenario.fundir(g); R.caixa(cx, cz, lw / 2, ld / 2, 0);
    };
    const xF = c.x + porta * S, xT = c.x - porta * S;
    parede(c.x - S, c.z - S, c.x + S, c.z - S); parede(c.x - S, c.z + S, c.x + S, c.z + S);
    parede(xT, c.z - S, xT, c.z + S);
    parede(xF, c.z - S, xF, c.z - vao / 2); parede(xF, c.z + vao / 2, xF, c.z + S);
    // torres nos cantos, com o estandarte da casa
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      const g = R.grupo(c.x + a * S, c.z + b * S, 0); g.add(mesh(new THREE.CylinderGeometry(3, 3.3, 11, 10), MATK.pedra, 0, 5, 0)); g.add(mesh(new THREE.ConeGeometry(3.6, 3.4, 10), MATK.telha, 0, 12.2, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 5), MAT.wood, 0, 15.2, 0)); g.add(mesh(new THREE.PlaneGeometry(1.6, 1), matBand, 0.8, 16, 0));
      if (OV.cenario) OV.cenario.fundir(g); R.obst(c.x + a * S, c.z + b * S, 3.4);
    });
    // o portão: duas torrinhas e o arco, com o brasão
    [-1, 1].forEach(s => { const g = R.grupo(xF, c.z + s * (vao / 2 + 1.2), 0); g.add(mesh(new THREE.BoxGeometry(3.2, 10, 3.2), MATK.pedra, 0, 4.4, 0)); if (OV.cenario) OV.cenario.fundir(g); R.caixa(xF, c.z + s * (vao / 2 + 1.2), 1.6, 1.6, 0); });
    { const g = R.grupo(xF, c.z, 0); g.add(mesh(new THREE.BoxGeometry(t + 0.4, 1.6, vao + 2), MATK.pedraE, 0, 7.6, 0)); const br = mesh(new THREE.PlaneGeometry(2.2, 3.2), matBand, porta * 1.05, 5.2, 0); br.rotation.y = porta * Math.PI / 2; g.add(br); }
    // a torre de menagem, com o salão do senhor (a porta virada para o portão)
    const kx = c.x - porta * 7, rot = porta > 0 ? Math.PI / 2 : -Math.PI / 2;
    const k = R.casaInt(kx, c.z, rot, 12, 14, 8, { mat: MATK.pedra, roof: MATK.telha, rh: 3.6, piso: MAT.stone, nome, luz: true });
    M.mobilia(k, 'mesa', 0, -3.4, 0); M.mobilia(k, 'lareira', -4.2, -5.9, 0); M.mobilia(k, 'prateleira', 4.9, -2, -Math.PI / 2);
    const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3), matBand); bd.position.set(0, 3.4, -6.7); k.g.add(bd);
    // tendas e braseiros no pátio
    [[-1, 0.55], [1, 0.55], [-1, -0.55], [1, -0.6]].forEach(([a, b], i) => {
      const tx = c.x + porta * 11 + a * 3.4, tz = c.z + b * 14; const g = R.grupo(tx, tz, i);
      const tn = mesh(new THREE.ConeGeometry(2.2, 2.6, 4), MATK.lona, 0, 1.3, 0); tn.rotation.y = Math.PI / 4; g.add(tn); R.obst(tx, tz, 1.8);
    });
    [-1, 1].forEach(b => { const bx = c.x + porta * 15, bz = c.z + b * 5.5; const g = R.grupo(bx, bz, 0); g.add(mesh(new THREE.CylinderGeometry(0.5, 0.3, 1.1, 8), MATK.ferro, 0, 0.55, 0)); const f = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 6), MAT.flame || MATK.rubro); f.position.y = 1.4; g.add(f); if (M.flames) M.flames.push(f); R.emissor(bx, H(bx, bz) + 1.6, bz, 1.1, 9, 0xff7a2a); R.obst(bx, bz, 0.6); });
    return { lorde: loc(k.W(0, -1.6)), rot: rot + Math.PI, porta: { x: xF + porta * 2.5, z: c.z } };
  }
  const roca = fortaleza(ROCA, 1, MATK.rubro, 'Salão de Rocaforte');
  const valv = fortaleza(VALV, -1, MATK.verde, 'Salão de Valverde');
  R.RODRIGO = roca.lorde; R.RODRIGO_ROT = roca.rot - Math.PI; R.PORTA_ROCA = roca.porta;
  R.FERNAO = valv.lorde; R.FERNAO_ROT = valv.rot - Math.PI; R.PORTA_VALV = valv.porta;

  /* ================= A CAPELA DO MARCO ================= */
  (function () {
    const cp = R.casaInt(CAPM.x, CAPM.z, -Math.PI / 2, 8, 10, 5.4, { mat: MATK.pedra, roof: MATK.pedraE, rh: 2.6, piso: MAT.stone, nome: 'Capela do Marco' });
    M.mobilia(cp, 'altar', 0, -10 / 2 + 1.8, 0); M.mobilia(cp, 'banco', 1.8, 1.4, 0);
    // a arca da sacristia, onde o capelão escondeu a crônica antes de fugir
    const ap = cp.W(-2.4, -1.6);
    const ar = new THREE.Group(); ar.position.set(-2.4, 0.2, -1.6); cp.g.add(ar);
    ar.add(mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), MAT.wood, 0, 0.35, 0)); ar.add(mesh(new THREE.BoxGeometry(1.24, 0.12, 0.74), MATK.ferro, 0, 0.72, 0));
    M.obstacles.push({ x: ap.x, z: ap.z, r: 0.7 });
    M.interativo(ap.x, ap.z, 2.0, () => A6() ? A6().textoArca() : null, () => A6().arca());
    R.ARCA = loc(ap);
    R.oratorio('capela_marco', 'Oratório da Capela do Marco', CAPM.x - 13, CAPM.z + 9, -Math.PI / 2);
  })();

  /* ================= A FORJA DE MESTRE TEOBALDO (as espadas que viram arados) ================= */
  (function () {
    const fx = -45, fz = 70, rot = Math.PI * 0.3, g = R.grupo(fx, fz, rot), mad = MAT.wood;
    [[-2.4, -1.8], [2.4, -1.8], [-2.4, 1.8], [2.4, 1.8]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(0.22, 3.1, 0.22), mad, a, 1.55, b)));
    const tl = mesh(new THREE.BoxGeometry(5.6, 0.16, 4.6), MATK.telha, 0, 3.2, 0); tl.rotation.x = 0.12; g.add(tl);
    g.add(mesh(new THREE.BoxGeometry(1.8, 1.0, 1.3), MAT.rock, -1.0, 0.5, -1.2));
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), new THREE.MeshBasicMaterial({ color: 0xff6a1a }), -1.0, 1.02, -1.2));
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.6, 2.4, 6), MAT.rock, -1.0, 2.2, -1.6));
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), mad, 1.0, 0.3, 0.2)); g.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.32), MATK.ferro, 1.0, 0.7, 0.2));
    // arados novos encostados num lado, espadas velhas no outro
    for (let i = 0; i < 3; i++) { const a = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.5), MATK.ferro, 2.0, 0.5, -1.2 + i * 0.6); a.rotation.z = 0.3; g.add(a); }
    if (OV.cenario) OV.cenario.fundir(g);
    const cs = Math.cos(rot), sn = Math.sin(rot), Wf = (lx, lz) => ({ x: fx + lx * cs + lz * sn, z: fz - lx * sn + lz * cs });
    const f = Wf(-1.0, -1.2); R.emissor(f.x, H(fx, fz) + 1.5, f.z, 1.6, 9, 0xff5a1a);
    [[-1.0, -1.2, 0.9], [1.0, 0.2, 0.45]].forEach(([a, b, r]) => { const q = Wf(a, b); R.obst(q.x, q.z, r); });
    R.FORJA_TEO = () => ({ x: X(f.x), y: H(fx, fz) + 1.25, z: Z(f.z) });
    const tp = Wf(0.4, 1.8); M.criarFigura(X(tp.x), Z(tp.z), rot, { id: 'teobaldo', nome: 'Mestre Teobaldo, o ferreiro', cor: 0x3a2a1e, cabelo: 0x6a5a4a });
    if (M.LOCAIS) M.LOCAIS.of_teobaldo = { nome: 'Forja de Mestre Teobaldo', x: X(fx), z: Z(fz), oy: -20 };
  })();

  /* ---- a placa da estrada, na chegada, e a Capela do Peregrino ---- */
  R.placa(4, 146, -Math.PI / 2);
  R.inter(3, 147.5, 2.4, () => OV.viagem ? OV.viagem.textoPlaca('marca') : null, () => OV.viagem && OV.viagem.usarPlaca('marca'));
  R.CAPELA = { x: 26, z: 126 };

  /* ---- árvores: bosques ao sul e nas encostas; no campo, só troncos queimados ---- */
  R.vegetacao({
    arvores: 340, espaco: 5.6, esc: [0.9, 1.5], alto: 1.3, copaAlta: 1.3, yCopa: 3.4, corCopa: 0x34402a, corTronco: 0x3a2a1c,
    densidade: (lx, lz) => {
      if (noCampo(lx, lz)) return 0;
      if (Math.abs(lz - rioZ(lx)) < 9) return 0;
      if (Math.hypot(lx - VILA.x, lz - VILA.z) < 48) return 0;
      if (Math.abs(lx) < 8 && lz > 40) return 0;
      return Math.max(Math.abs(lx), Math.abs(lz)) > 100 ? 0.8 : 0.32;
    },
    pedras: 80, capim: 3000, corCapim: 0x5a5a2a,
    especies: [['carvalho', 3], ['oliveira', 2], ['pinheiro', 1.6], ['cipreste', 1.2], ['seca', 0.8], ['abeto', 0.6]],
    chao: { n: { flores: 400, arbustos: 400 },
      paleta: { capim: [0x5a5a2a, 0x64602e, 0x4e522a, 0x6a6432], flores: [0xd8283a, 0xe8c83a, 0xf2f0e8, 0xd86a1a], arbusto: [0x34401e, 0x3a4622, 0x2e3a1e], bagas: [0xd8283a] } },
    semCapim: (lx, lz) => (noCampo(lx, lz) && Math.abs(lx) < 80) || Math.hypot(lx - VILA.x, lz - VILA.z) < 13 || Math.abs(lz - rioZ(lx)) < 6
  });

  /* ---- gente dos dois lados (e os que não têm lado) ---- */
  const at = (q, rot, op) => M.criarFigura(X(q.x), Z(q.z), rot, op);
  at(R.FIRMINA, R.FIRMINA_ROT, { id: 'firmina', nome: 'Irmã Firmina, a enfermeira', cor: 0xe8e2d4, veu: 0x1a1a2a });
  at(R.DOROTEIA, R.DOROTEIA_ROT, { id: 'doroteia', nome: 'Irmã Doroteia, a boticária', cor: 0xd8d2c4, veu: 0x2a2a3a });
  at(R.FAUSTO, R.FAUSTO_ROT, { id: 'fausto', nome: 'Fausto, soldado de Valverde', cor: 0x2a4a2a, cabelo: 0x3a2a1a });
  at(R.GREGORIO, R.GREGORIO_ROT, { id: 'padreGregorio', nome: 'Padre Gregório', cor: 0x1a1614, cabelo: 0x9a9a92 });
  at(R.RODRIGO, R.RODRIGO_ROT, { id: 'rodrigo', nome: 'Conde Rodrigo de Rocaforte', cor: 0x7a1a14, cabelo: 0x5a4a3a });
  at(R.FERNAO, R.FERNAO_ROT, { id: 'fernao', nome: 'Barão Fernão de Valverde', cor: 0x2a5a2a, cabelo: 0x2a1e14 });
  at(R.LEONOR, R.LEONOR_ROT, { id: 'leonor', nome: 'Viúva Leonor', cor: 0x2a2a2a, veu: 0x1a1a1a });
  at({ x: R.VISAO.x + 1.6, z: R.VISAO.z - 1.4 }, Math.PI, { id: 'martinho', nome: 'São Martinho de Tours', santo: true, oculto: true });
  R.MORADORES = [
    [ROCA.x + 25, ROCA.z - 6, Math.PI / 2, { id: 'mor_marca1', nome: 'Sentinela de Rocaforte', cor: 0x6a1a14, cabelo: 0x3a2a1a }, 'O marco era nosso. O meu avô dizia, e o avô dele também. Se Valverde quer o campo, que venha buscar.', 'Já não sei quantos verões passei de guarda neste portão. Nunca vi o campo verde.'],
    [VALV.x - 25, VALV.z + 6, -Math.PI / 2, { id: 'mor_marca2', nome: 'Sentinela de Valverde', cor: 0x2a4a2a, cabelo: 0x2a1e14 }, 'Rocaforte mudou o marco de lugar numa noite de lua nova. Todo mundo sabe. Ninguém viu, mas todo mundo sabe.', 'O meu irmão está no hospital do outro lado do rio. Dizem que a freira cuida dele junto com os de Rocaforte.'],
    [VILA.x - 7, VILA.z + 7, 0.6, { id: 'mor_marca3', nome: 'Lavrador de São Martinho', cor: 0x5a4a2a, cabelo: 0x4a3a2a }, 'Todo ano é a mesma coisa: plantamos, e na colheita as duas fortalezas queimam o campo para o outro não comer.', 'Aqui na vila ninguém é de Rocaforte nem de Valverde. Somos de São Martinho, que dividiu o manto.'],
    [VILA.x + 8, VILA.z - 6, 2.4, { id: 'mor_marca4', nome: 'Mãe de soldado', cor: 0x4a3a3a, veu: 0x3a2a2a }, 'Os meus dois filhos foram para a guerra, um para cada lado: casaram em Rocaforte e em Valverde. Rezo para nunca se encontrarem no campo.', 'A Irmã Firmina não pergunta de que lado o ferido é. Pergunta onde dói.']
  ];

  /* ---- vícios pelos caminhos (nível 19 a 23) ---- */
  R.spawnsMundo = [
    ['cao', -16, 120, 19], ['cao', 16, 124, 19], ['brasa', -60, 70, 19], ['brasa', 70, 66, 19, 'forte'],
    ['irado', -40, 8, 20], ['irado', 40, 4, 20], ['cao', -20, -6, 20, 'forte'], ['brasa', 22, -14, 20],
    ['gafanhoto', -60, -30, 21], ['gafanhoto', 64, -34, 21], ['cao', -70, -96, 21, 'forte'], ['cao', 70, -100, 21],
    ['irado', -60, -80, 21, 'forte'], ['irado', 60, -84, 21], ['brasa', -30, -110, 22], ['brasa', 30, -112, 22, 'forte'],
    ['gafanhoto', -140, 0, 22], ['gafanhoto', 140, 10, 22, 'forte'], ['cao', -130, 70, 22], ['brasa', 130, 60, 22],
    ['irado', -150, -150, 23, 'elite'], ['cao', 150, -150, 23, 'elite'], ['murmurador', -100, 120, 20], ['murmurador', 100, 130, 20]
  ].map(([t, x, z, n, v]) => [t, X(x), Z(z), n, v]);
})(window.OV);

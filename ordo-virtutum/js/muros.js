/* Ordo Virtutum — Ato V: a Vila dos Muros. Região ao norte da Corte (z ≈ −1800).
   Duas aldeias, Montalto (oeste, no alto) e Valbaixo (leste, à beira d'água), ergueram um muro que corta a terra,
   a igreja de São João e até o lago. A igreja ficou partida: Montalto com o altar, Valbaixo com a porta.
   No meio do Lago Partido, a Pedra do Meio, onde mora Leviatã. A leste, o Vau do Precursor. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.criarRegiao) return;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const A5 = () => OV.ato5;
  const LAGO = { x: 0, z: -70, r: 42 };          // o Lago Partido
  const PEDRA = { x: 0, z: -80, r: 22 };         // a Pedra do Meio, arena de Leviatã
  const DIQUE = { x0: -2.8, x1: 2.8, z0: -60, z1: -27 }; // o caminho de pedra sobre a água, da Porta do Meio até a Pedra
  const MONT = { x: -80, z: 40 }, VALB = { x: 80, z: 40 };
  const VAU = { x: 100, z: -98 };
  const IGREJA = { x: 0, z: 20 };
  const noDique = (lx, lz) => lx > DIQUE.x0 && lx < DIQUE.x1 && lz > DIQUE.z0 && lz < DIQUE.z1;
  const naPedra = (lx, lz) => Math.hypot(lx - PEDRA.x, lz - PEDRA.z) < PEDRA.r - 0.5;

  const R = OV.criarRegiao({
    id: 'muros', nome: 'Vila dos Muros', OX: 0, OZ: -1800, meio: 170,
    dentro: (x, z) => z <= -1350 && x > -500,
    relevo(lx, lz) {
      let h = 2 + 1.6 * Math.sin(lx * 0.03 + 1) * Math.cos(lz * 0.027) + 0.7 * Math.sin(lx * 0.08 - lz * 0.06);
      h += smooth(0, 120, -lx) * 5;                               // Montalto fica no alto, a oeste
      const bord = Math.max(Math.abs(lx), Math.abs(lz));
      h += smooth(122, 166, bord) * 28;
      return h;
    },
    depois(lx, lz, h) {
      // o lago: uma bacia funda; a Pedra do Meio e o dique, de pedra, acima da água
      const d = Math.hypot(lx - LAGO.x, lz - LAGO.z);
      if (d < LAGO.r + 8) h = h * smooth(LAGO.r - 6, LAGO.r + 8, d) + (-3.2) * (1 - smooth(LAGO.r - 6, LAGO.r + 8, d));
      if (Math.hypot(lx - PEDRA.x, lz - PEDRA.z) < PEDRA.r + 0.6) h = 1.2;
      if (lx > DIQUE.x0 - 0.4 && lx < DIQUE.x1 + 0.4 && lz > DIQUE.z0 - 1 && lz < DIQUE.z1 + 2) h = Math.max(h, 1.2);
      // o regato que desce do Vau até o lago
      const rg = distSeg(lx, lz, 150, -150, VAU.x, VAU.z) < distSeg(lx, lz, VAU.x, VAU.z, 40, -84) ? distSeg(lx, lz, 150, -150, VAU.x, VAU.z) : distSeg(lx, lz, VAU.x, VAU.z, 40, -84);
      if (rg < 5) h -= 1.4 * (1 - smooth(1.5, 5, rg));
      return h;
    },
    // ninguém anda sobre a água do lago: só pelo dique e pela Pedra do Meio
    limitar(lx, lz) {
      const d = Math.hypot(lx - LAGO.x, lz - LAGO.z);
      if (d >= LAGO.r - 0.6 || naPedra(lx, lz) || noDique(lx, lz)) return null;
      const cand = [];
      const k = (LAGO.r - 0.6) / (d || 1); cand.push([LAGO.x + (lx - LAGO.x) * k, LAGO.z + (lz - LAGO.z) * k]);
      const dp = Math.hypot(lx - PEDRA.x, lz - PEDRA.z) || 1, kp = (PEDRA.r - 0.6) / dp; cand.push([PEDRA.x + (lx - PEDRA.x) * kp, PEDRA.z + (lz - PEDRA.z) * kp]);
      cand.push([Math.max(DIQUE.x0 + 0.05, Math.min(DIQUE.x1 - 0.05, lx)), Math.max(DIQUE.z0 + 0.05, Math.min(DIQUE.z1 - 0.05, lz))]);
      let best = cand[0], bd = 1e9; cand.forEach(c => { const dd = Math.hypot(c[0] - lx, c[1] - lz); if (dd < bd) { bd = dd; best = c; } });
      return best;
    },
    planos: [
      { x: MONT.x, z: MONT.z, r: 40, h: 7 }, { x: VALB.x, z: VALB.z, r: 40, h: 2.4 }, { x: IGREJA.x, z: IGREJA.z, r: 18, h: 3.2 },
      { x: 0, z: 140, r: 14, h: 3 }, { x: -125, z: -5, r: 12, h: 9 }, { x: VAU.x + 12, z: VAU.z + 12, r: 10, h: 1.6 }, { x: 0, z: -22, r: 9, h: 1.4 }
    ],
    estradas: [
      [[0, 158], [0, 128]],
      [[0, 128], [-30, 110], [-60, 74], [-78, 60]],
      [[0, 128], [30, 110], [60, 74], [78, 60]],
      [[-80, 18], [-62, -2], [-30, -18], [-6, -22]],
      [[80, 18], [62, -2], [30, -18], [6, -22]],
      [[96, 18], [104, -30], [108, -78]],
      [[-98, 30], [-112, 10], [-122, -2]],
      [[-122, -10], [-112, -48], [-110, -74]],
      [[60, 30], [36, 22], [14, 20]]
    ],
    zonas: [['igreja_joao', IGREJA.x, IGREJA.z, 13], ['montalto', MONT.x, MONT.z, 42], ['valbaixo', VALB.x, VALB.z, 42], ['lago_partido', LAGO.x, LAGO.z, LAGO.r + 4], ['vau', VAU.x + 6, VAU.z + 4, 18], ['moinho_muros', -125, -5, 14]],
    locais: {
      montalto: { nome: 'Montalto', x: MONT.x, z: MONT.z, oy: -50 },
      valbaixo: { nome: 'Valbaixo', x: VALB.x, z: VALB.z, oy: -50 },
      igreja_joao: { nome: 'Igreja de São João', x: IGREJA.x, z: IGREJA.z, oy: -22 },
      lago_partido: { nome: 'Lago Partido', x: LAGO.x, z: LAGO.z, oy: -30 },
      vau: { nome: 'Vau do Precursor', x: VAU.x, z: VAU.z, oy: -18 },
      moinho_muros: { nome: 'Moinho de Montalto', x: -125, z: -5, oy: -16 }
    },
    entrada: { x: 0, z: 150, facing: Math.PI },
    paleta: { h: 0.22, s: 0.24, l: 0.18, rocha: 0x5a5a52, rochaDe: 14, estrada: 0x8a7a5a, mapaH: 80, mapaS: 14 },
    corExtra(lx, lz, h, c) {
      const d = Math.hypot(lx - LAGO.x, lz - LAGO.z);
      if (d < LAGO.r + 2) c.lerp(new THREE.Color(0x3a4a42), 0.65);
      if (naPedra(lx, lz) || noDique(lx, lz)) c.lerp(new THREE.Color(0x7a766a), 0.8);
    },
    mapaExtra(g, Q, ESC) {
      const [a, b] = Q(LAGO.x, LAGO.z); g.fillStyle = 'rgba(40,70,90,.8)'; g.beginPath(); g.arc(a, b, LAGO.r * ESC, 0, Math.PI * 2); g.fill();
      const [pa, pb] = Q(PEDRA.x, PEDRA.z); g.fillStyle = 'rgba(150,140,120,.95)'; g.beginPath(); g.arc(pa, pb, PEDRA.r * ESC, 0, Math.PI * 2); g.fill();
      // o muro, como um traço grosso que corta a terra
      g.strokeStyle = 'rgba(60,40,24,.95)'; g.lineWidth = 4; g.beginPath(); const [m0, n0] = Q(0, DIQUE.z0); const [m1, n1] = Q(0, 118); g.moveTo(m0, n0); g.lineTo(m1, n1); g.stroke();
    }
  });
  function distSeg(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz; const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0; return Math.hypot(px - (ax + t * dx), pz - (az + t * dz)); }
  OV.muros = R;
  Object.assign(R, { LAGO, PEDRA, DIQUE, MONT, VALB, VAU, IGREJA, TELHA: '#6a4a3a' });
  R.agua = (lx, lz) => Math.hypot(lx - LAGO.x, lz - LAGO.z) < LAGO.r - 1 && !naPedra(lx, lz) && !noDique(lx, lz);
  if (OV.inimigos && OV.inimigos.CENTROS) OV.inimigos.CENTROS.push({ x: MONT.x, z: MONT.z + R.OZ }, { x: VALB.x, z: VALB.z + R.OZ }, { x: 0, z: 128 + R.OZ });
  const H = R.H, W = R.W;
  const X = lx => lx + R.OX, Z = lz => lz + R.OZ;
  const loc = p => ({ x: p.x - R.OX, z: p.z - R.OZ });
  const MATM = {
    muro: sm(0x6e665a, { roughness: 1 }), muroE: sm(0x4e483e, { roughness: 1 }), cal: sm(0xd8d0bc), telha: sm(0x6a3a2a), telhaV: sm(0x3a4a3a),
    agua: new THREE.MeshStandardMaterial({ color: 0x23404a, roughness: 0.2, metalness: 0.35, transparent: true, opacity: 0.9 }),
    pedra: sm(0x8a8678, { roughness: 0.9 }), ferro: sm(0x2a2a2e, { metalness: 0.6, roughness: 0.5 }), linho: sm(0xe8e0cc), tear: sm(0x6a4a2a)
  };
  R.MAT = MATM;

  /* ================= O LAGO PARTIDO, A PEDRA DO MEIO E O DIQUE ================= */
  (function () {
    const ag = new THREE.Mesh(new THREE.CircleGeometry(LAGO.r + 2, 48), MATM.agua); ag.rotation.x = -Math.PI / 2; ag.position.set(X(LAGO.x), 0.25, Z(LAGO.z)); scene.add(ag);
    M.animados.push((dt, t) => { ag.position.y = 0.25 + Math.sin(t * 0.6) * 0.06; });
    R.AGUA = ag;
    // a Pedra do Meio: um disco de lajes, com uma borda gasta
    const pd = R.grupo(PEDRA.x, PEDRA.z, 0, 0);
    pd.add(mesh(new THREE.CylinderGeometry(PEDRA.r, PEDRA.r + 1.2, 2.2, 40), MATM.pedra, 0, 0.1, 0));
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const b = mesh(new THREE.BoxGeometry(1.4, 0.5, 0.8), MATM.muroE, Math.cos(a) * (PEDRA.r - 0.3), 1.45, Math.sin(a) * (PEDRA.r - 0.3)); b.rotation.y = -a; pd.add(b); }
    // quatro velhos pilares quebrados, onde antes havia uma capela no lago
    [[0.6, 9], [2.2, 11], [3.8, 8.5], [5.3, 10.5]].forEach(([a, r], i) => { const x = Math.cos(a) * r, z = Math.sin(a) * r, hh = 2.5 + i * 0.8; pd.add(mesh(new THREE.CylinderGeometry(0.6, 0.7, hh, 8), MATM.pedra, x, 1.2 + hh / 2, z)); M.obstacles.push({ x: X(PEDRA.x + x), z: Z(PEDRA.z + z), r: 0.8 }); });
    if (OV.cenario) OV.cenario.fundir(pd);
    // o dique, com parapeitos dos dois lados
    const dq = R.grupo(0, (DIQUE.z0 + DIQUE.z1) / 2, 0, 0); const L = DIQUE.z1 - DIQUE.z0 + 2;
    dq.add(mesh(new THREE.BoxGeometry(DIQUE.x1 - DIQUE.x0 + 0.8, 2.2, L), MATM.pedra, 0, 0.1, 0));
    [-1, 1].forEach(s => { dq.add(mesh(new THREE.BoxGeometry(0.5, 0.9, L), MATM.muroE, s * (DIQUE.x1 + 0.15), 1.6, 0)); });
    if (OV.cenario) OV.cenario.fundir(dq);
  })();

  /* ================= O GRANDE MURO ================= */
  // ao longo de x = 0, da Porta do Meio (junto ao lago) até perto da estrada do sul; a igreja fica no meio dele
  const trechos = [];
  function trechoMuro(z0, z1, alto, porta) {
    const meio = (z0 + z1) / 2, len = Math.abs(z1 - z0), y = Math.max(H(0, z0), H(0, z1), H(0, meio));
    const g = R.grupo(0, meio, 0, y);
    const m = mesh(new THREE.BoxGeometry(2, alto, len), MATM.muro, 0, alto / 2 - 0.8, 0); g.add(m);
    // ameias no alto
    for (let k = 0; k < Math.floor(len / 2.2); k++) g.add(mesh(new THREE.BoxGeometry(2.1, 0.7, 1.1), MATM.muroE, 0, alto - 0.45, -len / 2 + 1.1 + k * 2.2));
    if (OV.cenario) OV.cenario.fundir(g);
    const cx = R.caixa(0, meio, 1.05, len / 2, 0);
    const t = { z0, z1, g, cx, porta: !!porta }; trechos.push(t); return t;
  }
  function torreMuro(z, alt) {
    const g = R.grupo(0, z); g.add(mesh(new THREE.BoxGeometry(4.4, alt, 4.4), MATM.muro, 0, alt / 2 - 0.5, 0));
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.add(mesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), MATM.muroE, Math.sin(a) * 2, alt + 0.1, Math.cos(a) * 2)); }
    if (OV.cenario) OV.cenario.fundir(g); R.caixa(0, z, 2.25, 2.25, 0);
  }
  (function () {
    // ao norte da igreja: da Porta do Meio até a parede norte da igreja
    trechoMuro(-26, -4, 6.5); trechoMuro(-4, 13.6, 6.5);
    // ao sul da igreja (o campanário fica logo ao sul); dois trechos podem virar portas quando os muros caírem
    trechoMuro(25.8, 28.4, 6.5); trechoMuro(32.4, 47, 6); trechoMuro(53, 69, 6, true); trechoMuro(69, 82, 6); trechoMuro(88, 104, 6, true); trechoMuro(104, 118, 6);
    [-6, 50, 85, 118].forEach(z => torreMuro(z, z === 118 ? 7 : 8.5));
    // pedaços de muro que avançam para dentro do lago, dos dois lados do dique
    [-1, 1].forEach(s => { const g = R.grupo(s * 4.8, -36, 0, 0); g.add(mesh(new THREE.BoxGeometry(2, 5, 16), MATM.muroE, 0, 1.5, 0)); if (OV.cenario) OV.cenario.fundir(g); });
  })();
  // os muros caem (fim do Ato V): os trechos-porta somem, e a igreja volta a ser uma só
  R.abrirMuro = function (b) {
    trechos.filter(t => t.porta).forEach(t => { t.g.visible = !b; t.cx.ativa = !b; });
    if (R.paredeIgreja) { R.paredeIgreja.mesh.visible = !b; R.paredeIgreja.caixa.ativa = !b; }
  };

  /* ---- a Porta do Meio: o portão de ferro no fim do muro, com duas fechaduras (uma de cada aldeia) ---- */
  (function () {
    const z = -28.4;
    [-1, 1].forEach(s => { const g = R.grupo(s * 4.4, z - 0.4); g.add(mesh(new THREE.BoxGeometry(3, 9, 3), MATM.muro, 0, 3.8, 0)); g.add(mesh(new THREE.ConeGeometry(2.2, 2.4, 4), MATM.telha, 0, 9.4, 0)); if (OV.cenario) OV.cenario.fundir(g); R.caixa(s * 4.4, z - 0.4, 1.55, 1.55, 0); });
    const arco = R.grupo(0, z - 0.4); arco.add(mesh(new THREE.BoxGeometry(8.6, 1.4, 2.6), MATM.muroE, 0, 6.8, 0));
    // a grade, que sobe quando as duas chaves giram
    const grade = new THREE.Group(); grade.position.set(X(0), H(0, z) - 0.2, Z(z)); scene.add(grade);
    for (let i = -3; i <= 3; i++) grade.add(mesh(new THREE.BoxGeometry(0.12, 5.6, 0.12), MATM.ferro, i * 0.8, 2.8, 0));
    [1, 2.6, 4.2].forEach(y => grade.add(mesh(new THREE.BoxGeometry(5.8, 0.14, 0.14), MATM.ferro, 0, y, 0)));
    const cx = R.caixa(0, z, 3.0, 0.45, 0);
    R.PORTA_MEIO = { x: 0, z };
    R.portaMeio = function (aberta) { cx.ativa = !aberta; grade.position.y = H(0, z) - 0.2 + (aberta ? 5.2 : 0); };
    // duas fechaduras: a de Montalto (oeste) e a de Valbaixo (leste)
    R.inter(-2.6, z + 1.5, 2.0, () => A5() ? A5().textoPorta('montalto') : null, () => A5().porta('montalto'));
    R.inter(2.6, z + 1.5, 2.0, () => A5() ? A5().textoPorta('valbaixo') : null, () => A5().porta('valbaixo'));
  })();

  /* ================= A IGREJA DE SÃO JOÃO, PARTIDA AO MEIO ================= */
  (function () {
    // a nave corre de leste a oeste: a porta dá para Valbaixo (leste), o altar ficou do lado de Montalto (oeste)
    const rot = Math.PI / 2, w = 12, d = 20;
    const ig = R.casaInt(IGREJA.x, IGREJA.z, rot, w, d, 9, { mat: MATM.cal, roof: MATM.telha, rh: 4.4, piso: MAT.stone, nome: 'Igreja de São João' });
    R.IGREJA_INT = ig;
    M.mobilia(ig, 'altar', 0, -d / 2 + 2.4, 0);
    for (let k = 0; k < 3; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.5, 2.2 + k * 2.4, 0));
    // a pia batismal, do lado de Valbaixo: a mesma onde as duas aldeias foram batizadas
    const pia = new THREE.Group(); pia.position.set(-3.6, 0.2, 6.6); ig.g.add(pia);
    pia.add(mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.9, 10), MATM.pedra, 0, 0.45, 0)); pia.add(mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.25, 12), MATM.pedra, 0, 1.0, 0));
    { const p = ig.W(-3.6, 6.6); M.obstacles.push({ x: p.x, z: p.z, r: 0.7 }); }
    // a parede que o muro meteu dentro da igreja, de lado a lado
    const pm = mesh(new THREE.BoxGeometry(w - 0.6, 7.2, 0.7), MATM.muro, 0, 3.6, 0); ig.g.add(pm);
    const pc = R.caixa(IGREJA.x, IGREJA.z, 0.4, w / 2, 0);
    R.paredeIgreja = { mesh: pm, caixa: pc };
    const porta = ig.W(0, d / 2 + 1.0);
    M.interativo(porta.x, porta.z, 2.6, () => A5() ? A5().textoIgreja() : null, () => A5().igreja());
    R.ZACARIAS = loc(ig.W(0.6, 3.2)); R.ZACARIAS_ROT = rot + Math.PI;
    // o campanário, em cima do muro, logo ao sul da igreja: a Lâmpada da Benevolência fica no alto
    const tz = 30.4, t = R.grupo(0, tz);
    t.add(mesh(new THREE.BoxGeometry(4.2, 18, 4.2), MATM.cal, 0, 9, 0));
    t.add(mesh(new THREE.BoxGeometry(4.6, 0.4, 4.6), MATM.muroE, 0, 14, 0));
    const cone = mesh(new THREE.ConeGeometry(3.3, 4.4, 4), MATM.telha, 0, 20.2, 0); cone.rotation.y = Math.PI / 4; t.add(cone);
    t.add(mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), MAT.gold, 0, 23.1, 0)); t.add(mesh(new THREE.BoxGeometry(0.7, 0.16, 0.16), MAT.gold, 0, 23.3, 0));
    const sino = mesh(new THREE.CylinderGeometry(0.4, 0.75, 1.1, 10, 1, true), sm(0x8a6a2a, { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }), 0, 16, 0); t.add(sino); R.SINO = sino;
    const lan = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), new THREE.MeshBasicMaterial({ color: 0x2a2018 })); lan.position.set(0, 17.8, 0); t.add(lan);
    const luz = R.emissor(0, H(0, tz) + 18, tz, 0, 46, 0xd8ffe0, false);
    R.acenderLampada = b => { lan.material.color.setHex(b ? 0xeaffea : 0x2a2018); luz.int = b ? 3 : 0; };
    R.caixa(0, tz, 2.2, 2.2, 0);
    R.CAMPANARIO = { x: 0, z: tz };
    // as cordas do sino, uma de cada lado do muro
    [-1, 1].forEach(s => { const q = R.grupo(s * 2.6, tz + 1.2); q.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 5), sm(0xb89a6a), 0, 2, 0)); R.inter(s * 3.0, tz + 1.6, 2.2, () => A5() ? A5().textoSino() : null, () => A5().sino()); });
  })();

  /* ================= MONTALTO (oeste, no alto) ================= */
  const posM = (a, r) => ({ x: MONT.x + Math.cos(a * Math.PI / 180) * r, z: MONT.z + Math.sin(a * Math.PI / 180) * r });
  const posV = (a, r) => ({ x: VALB.x + Math.cos(a * Math.PI / 180) * r, z: VALB.z + Math.sin(a * Math.PI / 180) * r });
  const virarPara = (q, c) => Math.atan2(c.x - q.x, c.z - q.z);
  (function () {
    R.praca(MONT.x, MONT.z, 12);
    // o poço de Montalto, com um telhadinho (e um cadeado: a água é só para quem é de cima)
    const p = R.grupo(MONT.x, MONT.z, 0);
    p.add(mesh(new THREE.CylinderGeometry(1.3, 1.4, 1.0, 14), MATM.pedra, 0, 0.5, 0));
    [-1, 1].forEach(s => p.add(mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), MAT.wood, s * 1.1, 1.2, 0)));
    const tp = mesh(new THREE.ConeGeometry(1.8, 1.0, 4), MATM.telha, 0, 2.8, 0); tp.rotation.y = Math.PI / 4; p.add(tp);
    R.obst(MONT.x, MONT.z, 1.6);
    // a casa do alcaide Lisandro, o moleiro rico (com interior)
    const lq = posM(110, 24), lr = virarPara(lq, MONT);
    const lc = M.casaInterior(X(lq.x), Z(lq.z), lr, 10, 8, 5.2, { mat: MATM.cal, roof: MATM.telha, rh: 2.8, nome: 'Casa do Alcaide Lisandro' });
    R.RECTS.push([lq.x, lq.z, 10, 8, lr]);
    M.mobilia(lc, 'mesa', 1.6, -1.6); M.mobilia(lc, 'lareira', -2.6, -3.4); M.mobilia(lc, 'prateleira', 4.4, 0.6, -Math.PI / 2); M.mobilia(lc, 'barris', -3.8, 1.6);
    R.LISANDRO = loc(lc.W(0.4, -0.4)); R.LISANDRO_ROT = lr;
    // a casa de Bruno, o irmão mais velho
    const bq = posM(200, 24), br = virarPara(bq, MONT);
    const bc = M.casaInterior(X(bq.x), Z(bq.z), br, 8, 7, 4.6, { mat: MATM.cal, roof: MATM.telhaV, rh: 2.6, nome: 'Casa de Bruno' });
    R.RECTS.push([bq.x, bq.z, 8, 7, br]);
    M.mobilia(bc, 'mesa', 1.4, -1.2); M.mobilia(bc, 'cama', -2.4, -1.2);
    R.BRUNO = loc(bc.W(0.3, 0.6)); R.BRUNO_ROT = br;
    // as outras casas, em dois anéis, todas de costas para o muro
    [[20, 9], [60, 8], [150, 8], [250, 9], [290, 8], [330, 8]].forEach(([a, w], i) => { const q = posM(a, 24); R.casa(q.x, q.z, virarPara(q, MONT), w, 7, 5 + (i % 2) * 0.5, { rh: 2.6, luz: true, roof: i % 2 ? MATM.telha : MATM.telhaV }); });
    [[0, 9], [40, 8], [130, 9], [175, 8], [220, 9], [265, 8], [310, 9]].forEach(([a, w], i) => { const q = posM(a, 36); R.casa(q.x, q.z, virarPara(q, MONT), w, 7.5, 5.2 + (i % 3) * 0.4, { rh: 2.8, luz: true, roof: i % 2 ? MATM.telhaV : MATM.telha }); });
    for (let a = 0; a < 360; a += 45) { const q = posM(a + 20, 13.5); R.lanterna(q.x, q.z, 0xffb060); }
    const oq = posM(60, 11); R.oratorio('montalto', 'Oratório de Montalto', oq.x, oq.z, virarPara(oq, MONT));
    // o moinho de vento de Montalto, no alto do morro
    const mx = -125, mz = -5, mo = R.grupo(mx, mz, 0.4);
    mo.add(mesh(new THREE.CylinderGeometry(2.4, 3.2, 8, 10), MATM.cal, 0, 4, 0));
    const capa = mesh(new THREE.ConeGeometry(3, 2.6, 10), MATM.telha, 0, 9.3, 0); mo.add(capa);
    const pas = new THREE.Group(); pas.position.set(0, 7.2, 3.3); mo.add(pas);
    for (let k = 0; k < 4; k++) { const b = mesh(new THREE.BoxGeometry(0.5, 5.4, 0.08), MATM.linho, 0, 2.7, 0); const piv = new THREE.Group(); piv.rotation.z = k * Math.PI / 2; piv.add(b); pas.add(piv); }
    R.PAS_MOINHO = pas; M.animados.push(dt => { pas.rotation.z += dt * (OV.jogo && OV.jogo.prog && OV.jogo.prog.flags && OV.jogo.prog.flags.ato5_fim ? 0.8 : 0.25); });
    R.obst(mx, mz, 3.4);
  })();

  /* ================= VALBAIXO (leste, à beira d'água) ================= */
  (function () {
    R.praca(VALB.x, VALB.z, 12);
    // o tear grande da praça, coberto: as tecelãs de Valbaixo são a inveja de Montalto
    const t = R.grupo(VALB.x, VALB.z, 0);
    [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]].forEach(([a, b]) => t.add(mesh(new THREE.BoxGeometry(0.18, 3, 0.18), MAT.wood, a, 1.5, b)));
    t.add(mesh(new THREE.BoxGeometry(3.8, 0.14, 2.6), MATM.telhaV, 0, 3.1, 0));
    t.add(mesh(new THREE.BoxGeometry(2.4, 1.4, 0.1), MATM.linho, 0, 1.3, 0)); t.add(mesh(new THREE.BoxGeometry(2.6, 0.14, 0.3), MATM.tear, 0, 2.0, 0)); t.add(mesh(new THREE.BoxGeometry(2.6, 0.14, 0.3), MATM.tear, 0, 0.6, 0));
    if (OV.cenario) OV.cenario.fundir(t); R.obst(VALB.x, VALB.z, 2.2);
    // a casa da tecelã Úrsula, a alcaidessa (com interior)
    const uq = posV(70, 24), ur = virarPara(uq, VALB);
    const uc = M.casaInterior(X(uq.x), Z(uq.z), ur, 10, 8, 5, { mat: MATM.cal, roof: MATM.telhaV, rh: 2.7, nome: 'Casa da Tecelã Úrsula' });
    R.RECTS.push([uq.x, uq.z, 10, 8, ur]);
    M.mobilia(uc, 'mesa', -1.6, -1.6); M.mobilia(uc, 'lareira', 2.8, -3.4); M.mobilia(uc, 'prateleira', -4.4, 0.6, Math.PI / 2);
    { const g = new THREE.Group(); g.position.set(2.6, 0.2, 1.0); uc.g.add(g); g.add(mesh(new THREE.BoxGeometry(1.6, 1.3, 0.9), MATM.tear, 0, 0.65, 0)); g.add(mesh(new THREE.BoxGeometry(1.4, 0.8, 0.05), MATM.linho, 0, 1.0, 0.46)); const p = uc.W(2.6, 1.0); M.obstacles.push({ x: p.x, z: p.z, r: 0.9 }); }
    R.URSULA = loc(uc.W(-0.4, -0.2)); R.URSULA_ROT = ur;
    // a casa de Lívia, a tecelã moça, e a de Davi, o irmão mais novo
    const lq = posV(340, 24), lr = virarPara(lq, VALB);
    const lc = M.casaInterior(X(lq.x), Z(lq.z), lr, 8, 7, 4.6, { mat: MATM.cal, roof: MATM.telha, rh: 2.6, nome: 'Casa de Lívia' });
    R.RECTS.push([lq.x, lq.z, 8, 7, lr]); M.mobilia(lc, 'mesa', 1.4, -1.2); M.mobilia(lc, 'cama', -2.4, -1.2);
    R.LIVIA = loc(lc.W(0.4, 0.4)); R.LIVIA_ROT = lr;
    const dq = posV(250, 24), dr = virarPara(dq, VALB);
    const dc = M.casaInterior(X(dq.x), Z(dq.z), dr, 8, 7, 4.6, { mat: MATM.cal, roof: MATM.telhaV, rh: 2.6, nome: 'Casa de Davi' });
    R.RECTS.push([dq.x, dq.z, 8, 7, dr]); M.mobilia(dc, 'mesa', 1.4, -1.2); M.mobilia(dc, 'banco', -1.8, 1.4);
    R.DAVI = loc(dc.W(0.3, 0.6)); R.DAVI_ROT = dr;
    [[20, 9], [110, 8], [160, 9], [200, 8], [290, 9]].forEach(([a, w], i) => { const q = posV(a, 24); R.casa(q.x, q.z, virarPara(q, VALB), w, 7, 4.8 + (i % 2) * 0.5, { rh: 2.6, luz: true, roof: i % 2 ? MATM.telhaV : MATM.telha }); });
    [[10, 9], [50, 8], [95, 9], [140, 8], [230, 9], [275, 8], [320, 9]].forEach(([a, w], i) => { const q = posV(a, 36); R.casa(q.x, q.z, virarPara(q, VALB), w, 7.5, 5 + (i % 3) * 0.4, { rh: 2.7, luz: true, roof: i % 2 ? MATM.telha : MATM.telhaV }); });
    for (let a = 0; a < 360; a += 45) { const q = posV(a + 20, 13.5); R.lanterna(q.x, q.z, 0xffb060); }
    const oq = posV(120, 11); R.oratorio('valbaixo', 'Oratório de Valbaixo', oq.x, oq.z, virarPara(oq, VALB));
  })();

  /* ================= O VAU DO PRECURSOR ================= */
  (function () {
    const y = H(VAU.x, VAU.z);
    const poca = new THREE.Mesh(new THREE.CircleGeometry(6, 24), MATM.agua); poca.rotation.x = -Math.PI / 2; poca.position.set(X(VAU.x), y + 0.35, Z(VAU.z)); scene.add(poca);
    // o regato, em placas de água, descendo até o lago
    const pontos = [[150, -150], [VAU.x, VAU.z], [40, -84]];
    for (let i = 0; i < pontos.length - 1; i++) {
      const [ax, az] = pontos[i], [bx, bz] = pontos[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 4);
      for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; const a = new THREE.Mesh(new THREE.CircleGeometry(2.6, 10), MATM.agua); a.rotation.x = -Math.PI / 2; a.position.set(X(x), H(x, z) + 0.45, Z(z)); scene.add(a); }
    }
    // pedras de passagem
    [[-3, 0], [-1, 1.2], [1, 0.4], [3, 1.4]].forEach(([dx, dz]) => scene.add(mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.4, 8), MATM.pedra, X(VAU.x + dx), y + 0.4, Z(VAU.z + dz))));
    // a cruz de cana fincada na margem
    const c = R.grupo(VAU.x - 7, VAU.z - 2, 0); c.add(mesh(new THREE.BoxGeometry(0.12, 3.4, 0.12), sm(0x9a8a5a), 0, 1.7, 0)); c.add(mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), sm(0x9a8a5a), 0, 2.8, 0));
    R.obst(VAU.x - 7, VAU.z - 2, 0.4);
    R.VISAO = { x: VAU.x - 5, z: VAU.z + 3 };
    R.inter(R.VISAO.x, R.VISAO.z, 2.6, () => A5() ? A5().textoVau() : null, () => A5().vau());
    R.oratorio('vau', 'Oratório do Vau', VAU.x + 12, VAU.z + 12, -Math.PI * 0.75);
  })();

  /* ---- a placa da estrada, na chegada, e a Capela do Peregrino ---- */
  R.placa(4, 146, -Math.PI / 2);
  R.inter(3, 147.5, 2.4, () => OV.viagem ? OV.viagem.textoPlaca('muros') : null, () => OV.viagem && OV.viagem.usarPlaca('muros'));
  R.CAPELA = { x: -26, z: 126 };

  /* ---- árvores do norte, pedras e grama ---- */
  R.vegetacao({
    arvores: 380, espaco: 5.4, esc: [0.9, 1.5], alto: 1.4, copaAlta: 1.4, yCopa: 3.6, corCopa: 0x24402a, corTronco: 0x3a2a1c,
    densidade: (lx, lz) => {
      if (Math.hypot(lx - LAGO.x, lz - LAGO.z) < LAGO.r + 6) return 0;
      if (Math.abs(lx) < 8 && lz > -30 && lz < 122) return 0; // junto ao muro
      if (Math.hypot(lx - VAU.x, lz - VAU.z) < 14) return 0;
      return Math.max(Math.abs(lx), Math.abs(lz)) > 100 ? 0.85 : 0.3;
    },
    pedras: 70, capim: 3400, corCapim: 0x3e5a2a,
    especies: [['carvalho', 3], ['betula', 2.4], ['abeto', 1.6], ['pinheiro', 1.2], ['macieira', 1], ['pereira', 0.6]],
    chao: { n: { flores: 700, arbustos: 400 },
      paleta: { capim: [0x3e5a2a, 0x48642e, 0x36522a, 0x4a6a32], flores: [0xf2f0e8, 0xe8c83a, 0x7a4ac8, 0xd8283a, 0xf0a0b8], arbusto: [0x24401e, 0x2a4a22, 0x30502a], bagas: [0xd8283a, 0x7a4ac8] } },
    semCapim: (lx, lz) => Math.hypot(lx - MONT.x, lz - MONT.z) < 13 || Math.hypot(lx - VALB.x, lz - VALB.z) < 13 || Math.hypot(lx - LAGO.x, lz - LAGO.z) < LAGO.r + 1
  });

  /* ---- gente dos dois lados do muro ---- */
  const at = (q, rot, op) => M.criarFigura(X(q.x), Z(q.z), rot, op);
  at(R.ZACARIAS, R.ZACARIAS_ROT, { id: 'padreZacarias', nome: 'Padre Zacarias', cor: 0x1a1614, cabelo: 0xd8d4cc });
  at(R.LISANDRO, R.LISANDRO_ROT, { id: 'lisandro', nome: 'Lisandro, o alcaide de Montalto', cor: 0x5a3a1e, cabelo: 0x5a4a3a });
  at(R.URSULA, R.URSULA_ROT, { id: 'ursula', nome: 'Úrsula, a alcaidessa de Valbaixo', cor: 0x3a4a6a, veu: 0xd8d0bc });
  at(R.BRUNO, R.BRUNO_ROT, { id: 'bruno', nome: 'Bruno, o irmão mais velho', cor: 0x4a3a2a, cabelo: 0x3a2a1a });
  at(R.DAVI, R.DAVI_ROT, { id: 'davi', nome: 'Davi, o irmão mais novo', cor: 0x3a4a3a, cabelo: 0x3a2a1a });
  at(R.LIVIA, R.LIVIA_ROT, { id: 'livia', nome: 'Lívia, a tecelã', cor: 0x6a3a4a, cabelo: 0x6a3a1a });
  at({ x: 52, z: 18 }, -Math.PI / 2, { id: 'rute', nome: 'Rute, a sacristã', cor: 0x3a3a3a, veu: 0xe8e0d0 });
  at({ x: R.VISAO.x + 1.4, z: R.VISAO.z - 1.6 }, -2.2, { id: 'joaoBatista', nome: 'São João Batista', santo: true, oculto: true });
  R.MORADORES = [
    [MONT.x + 6, MONT.z + 8, 0.4, { id: 'mor_muros1', nome: 'Moleiro de Montalto', cor: 0x6a5a3a, cabelo: 0x4a3a2a }, 'Lá embaixo eles vendem pano a peso de ouro. E nós, que moemos o trigo deles? Nada. Por isso o muro.', 'Dizem que em Valbaixo ninguém trabalha: as tecelãs só fazem fofoca no tear.'],
    [MONT.x - 8, MONT.z - 6, 2.0, { id: 'mor_muros2', nome: 'Avó de Montalto', cor: 0x3a3a3a, veu: 0x2a2a2a }, 'Eu fui batizada naquela igreja, no tempo em que ela tinha uma porta só. Agora o altar ficou do nosso lado e a porta do lado deles.', 'A minha neta casou com um rapaz de Valbaixo. Não a vejo há dois anos.'],
    [VALB.x - 6, VALB.z + 8, -0.6, { id: 'mor_muros3', nome: 'Pescador de Valbaixo', cor: 0x2a4a5a, cabelo: 0x3a2a1a }, 'O lago era de todos. Agora o muro entra na água, e ninguém pesca mais no meio: dizem que lá mora uma serpente.', 'Em Montalto eles têm o poço e o moinho. Nós temos o lago, e o lago virou maldição.'],
    [VALB.x + 8, VALB.z - 6, 2.4, { id: 'mor_muros4', nome: 'Tecelã de Valbaixo', cor: 0x5a3a4a, veu: 0xd8c8b8 }, 'Se o pano de Lívia ficar mais bonito que o meu, eu... não, Deus me perdoe. É que aqui a gente se mede uma pela outra.', 'Lá em cima eles comem pão branco todo dia. Aqui é pão de centeio, e olhe lá.']
  ];

  /* ---- vícios pelos caminhos (nível 16 a 20) ---- */
  R.spawnsMundo = [
    ['olho', 2, 120, 16], ['invejoso', -18, 112, 16], ['invejoso', 18, 112, 16],
    ['serpe', -30, -30, 17], ['serpe', 30, -34, 17], ['serpe', -40, -46, 18, 'forte'], ['serpe', 42, -50, 18],
    ['olho', -50, 80, 17], ['olho', 50, 84, 17, 'forte'], ['muralha', -14, 70, 18], ['muralha', 14, 58, 18, 'forte'],
    ['olho', -140, 60, 18], ['invejoso', -120, 90, 18, 'forte'], ['olho', 140, 60, 18], ['serpe', 120, -40, 19],
    ['muralha', -100, -40, 19], ['serpe', 70, -110, 19, 'forte'], ['olho', -60, -120, 19], ['invejoso', -150, -100, 20, 'elite'], ['muralha', 150, -120, 20, 'elite'],
    ['murmurador', -40, 140, 17], ['murmurador', 40, 140, 17], ['murmurador', 120, 120, 18]
  ].map(([t, x, z, n, v]) => [t, X(x), Z(z), n, v]);
})(window.OV);

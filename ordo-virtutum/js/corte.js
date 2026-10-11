/* Ordo Virtutum — Ato IV: a Corte das Máscaras. Região de jardins e palácios ao norte (z ≈ −900):
   a cidade de Belmonte com a Praça das Fontes, o Palácio dos Bailes, o Jardim dos Espelhos,
   a Casa do Lago e o Jardim da Figueira. Tratada com sobriedade: o vício aqui é o olhar que se perde. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.criarRegiao) return;
  const { rnd } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const A4 = () => OV.ato4;
  const LAGO = { x: 70, z: 44, r: 15 };
  const LAB = { x: -88, z: -24, meio: 20 }; // o labirinto do Jardim dos Espelhos

  const R = OV.criarRegiao({
    id: 'corte', nome: 'Corte das Máscaras', OX: 0, OZ: -900, meio: 170,
    dentro: (x, z) => z < -500 && z > -1350 && x > -500, // v23: ao norte, depois de z = -1350, começa a Vila dos Muros
    relevo(lx, lz) {
      let h = 2 + 1.4 * Math.sin(lx * 0.035) * Math.cos(lz * 0.03) + 0.6 * Math.sin(lx * 0.09 + lz * 0.07);
      const bord = Math.max(Math.abs(lx), Math.abs(lz));
      h += smooth(120, 166, bord) * 30;
      return h;
    },
    depois(lx, lz, h) {
      const d = Math.hypot(lx - LAGO.x, lz - LAGO.z);
      if (d < LAGO.r + 4) h -= 3.2 * (1 - smooth(LAGO.r - 5, LAGO.r + 4, d));
      return h;
    },
    planos: [
      { x: 0, z: 60, r: 36, h: 2 }, { x: 0, z: -50, r: 36, h: 4 }, { x: -88, z: -24, r: 30, h: 2.5 }, { x: 96, z: -46, r: 17, h: 5 },
      { x: 70, z: 20, r: 10, h: 2.4 }, { x: 0, z: 150, r: 10, h: 2 }
    ],
    estradas: [
      [[0, 158], [0, 120], [0, 74]],
      [[0, 46], [0, 12], [0, -25]],
      [[-14, 60], [-40, 50], [-60, 10], [-64, -2]],
      [[14, 56], [45, 40], [64, 28]],
      [[4, 6], [40, -12], [70, -34], [86, -42]]
    ],
    zonas: [['belmonte', 0, 60, 46], ['palacio', 0, -50, 28], ['espelhos', -88, -24, 26], ['lago', 70, 30, 18], ['figueira', 96, -46, 16]],
    locais: {
      belmonte: { nome: 'Belmonte', x: 0, z: 60, oy: -60 },
      palacio: { nome: 'Palácio dos Bailes', x: 0, z: -50, oy: -36 },
      espelhos: { nome: 'Jardim dos Espelhos', x: -88, z: -24, oy: -34 },
      lago: { nome: 'Casa do Lago', x: 70, z: 22, oy: -18 },
      figueira: { nome: 'Jardim da Figueira', x: 96, z: -46, oy: -22 }
    },
    entrada: { x: 0, z: 150, facing: Math.PI },
    paleta: { h: 0.24, s: 0.26, l: 0.17, rocha: 0x5a5a50, rochaDe: 14, estrada: 0x8a7a62, mapaH: 90, mapaS: 12 },
    corExtra(lx, lz, h, c) {
      const d = Math.hypot(lx - LAGO.x, lz - LAGO.z); if (d < LAGO.r + 1) c.lerp(new THREE.Color(0x4a5a3a), 0.6);
      if (Math.abs(lx - LAB.x) < LAB.meio + 2 && Math.abs(lz - LAB.z) < LAB.meio + 2) c.lerp(new THREE.Color(0x7a6e56), 0.55);
    },
    mapaExtra(g, Q, ESC) {
      const [a, b] = Q(LAGO.x, LAGO.z); g.fillStyle = 'rgba(40,70,90,.8)'; g.beginPath(); g.arc(a, b, (LAGO.r - 2) * ESC, 0, Math.PI * 2); g.fill();
      const [x0, y0] = Q(LAB.x - LAB.meio, LAB.z - LAB.meio); g.strokeStyle = 'rgba(70,110,60,.9)'; g.lineWidth = 3; g.strokeRect(x0, y0, LAB.meio * 2 * ESC, LAB.meio * 2 * ESC);
    }
  });
  OV.corte = R;
  R.LAGO = LAGO; R.LAB = LAB;
  const H = R.H, W = R.W;
  const loc = p => ({ x: p.x - R.OX, z: p.z - R.OZ });
  const MATC = {
    marmore: sm(0xd8d2c4, { roughness: 0.6 }), marmoreE: sm(0xb8b0a0, { roughness: 0.7 }), rosa: sm(0xc8a89a), azul: sm(0x8a9ab0), creme: sm(0xd0c4a0),
    telhaAzul: sm(0x2a3a5a), telhaV: sm(0x6a2a2a), sebe: sm(0x2a4a24, { roughness: 1 }), espelho: sm(0xd4dde8, { metalness: 0.35, roughness: 0.12, emissive: 0x3a4454 }), ouro: sm(0xd8b048, { metalness: 0.85, roughness: 0.3 }),
    veludo: sm(0x4a1040), agua: new THREE.MeshStandardMaterial({ color: 0x2a4a5a, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.88 }), mascara: sm(0xf0ece4, { roughness: 0.4 })
  };
  R.MAT = MATC;

  /* ================= BELMONTE E A PRAÇA DAS FONTES ================= */
  const VC = { x: 0, z: 60 };
  const pos = (a, r) => ({ x: VC.x + Math.cos(a * Math.PI / 180) * r, z: VC.z + Math.sin(a * Math.PI / 180) * r });
  const rotC = q => Math.atan2(VC.x - q.x, VC.z - q.z);
  (function () {
    R.praca(VC.x, VC.z, 14);
    // a fonte: três taças de mármore
    const f = R.grupo(VC.x, VC.z, 0);
    f.add(mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.7, 20), MATC.marmore, 0, 0.35, 0));
    const ag = new THREE.Mesh(new THREE.CircleGeometry(3.1, 20), MATC.agua); ag.rotation.x = -Math.PI / 2; ag.position.y = 0.62; f.add(ag);
    f.add(mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.4, 10), MATC.marmore, 0, 1.6, 0));
    f.add(mesh(new THREE.CylinderGeometry(1.6, 0.6, 0.4, 16), MATC.marmore, 0, 2.6, 0));
    f.add(mesh(new THREE.CylinderGeometry(0.8, 0.35, 0.3, 12), MATC.marmore, 0, 3.6, 0)); f.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.2, 8), MATC.marmore, 0, 3.4, 0));
    R.obst(VC.x, VC.z, 3.7);
    R.inter(VC.x, VC.z + 4.6, 2.4, () => A4() ? A4().textoFonte() : null, () => A4().fonte());

    // Igreja de Santo Agostinho (com interior)
    const iq = pos(200, 26), ir = rotC(iq);
    const ig = M.casaInterior(iq.x + R.OX, iq.z + R.OZ, ir, 12, 19, 8.5, { mat: MATC.creme, roof: MATC.telhaV, rh: 4.2, piso: MAT.stone, nome: 'Igreja de Santo Agostinho' });
    R.RECTS.push([iq.x, iq.z, 12, 19, ir]);
    M.mobilia(ig, 'altar', 0, -7.4, 0);
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.5, -3.4 + k * 2.4, 0));
    // o coração em chamas de Santo Agostinho, sobre o altar
    const co = new THREE.Group(); co.position.set(0, 3.8, -9.2); ig.g.add(co);
    co.add(mesh(new THREE.SphereGeometry(0.42, 10, 8), sm(0x9a1a1a, { emissive: 0x2a0404 }), 0, 0, 0));
    const ch = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), MAT.flame); ch.position.y = 0.55; co.add(ch); M.flames.push(ch);
    co.add(mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), MATC.ouro, 0, 0, 0.3));
    const tw = ig.W(-7.4, 6.5); const torre = M.grupo(tw.x, tw.z, ir);
    torre.add(mesh(new THREE.BoxGeometry(3.4, 15, 3.4), MATC.creme, 0, 7.5, 0));
    const tc = mesh(new THREE.ConeGeometry(2.7, 4.4, 4), MATC.telhaV, 0, 17.2, 0); tc.rotation.y = Math.PI / 4; torre.add(tc);
    torre.add(mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), MAT.gold, 0, 20, 0)); torre.add(mesh(new THREE.BoxGeometry(0.6, 0.16, 0.16), MAT.gold, 0, 20.2, 0));
    M.caixa(tw.x, tw.z, 1.8, 1.8, ir);
    const porta = ig.W(0, 11.4);
    M.interativo(porta.x, porta.z, 2.6, () => A4() ? A4().textoIgreja() : null, () => A4().igreja());
    R.BERNARDO = loc(ig.W(0, -4.6)); R.IGREJA_ROT = ir;

    // Casa de Clara, a costureira de máscaras
    const cq = pos(322, 25), cr = rotC(cq);
    const cc = M.casaInterior(cq.x + R.OX, cq.z + R.OZ, cr, 9, 7, 4.8, { mat: MATC.rosa, roof: MATC.telhaAzul, nome: 'Ateliê de Clara', rh: 2.6 });
    R.RECTS.push([cq.x, cq.z, 9, 7, cr]);
    M.mobilia(cc, 'mesa', -1.6, -1.6); M.mobilia(cc, 'lareira', 2.4, -3); M.mobilia(cc, 'prateleira', -4, 0.8, Math.PI / 2);
    for (let i = 0; i < 5; i++) { const m = mesh(new THREE.BoxGeometry(0.3, 0.38, 0.06), MATC.mascara, -2.6 + i * 0.6, 2.4, -3.3); cc.g.add(m); }
    R.CLARA = loc(cc.W(0.6, -0.6)); R.CLARA_ROT = cr;
    // Casa de Inês
    const nq = pos(42, 24), nr = rotC(nq);
    const nc = M.casaInterior(nq.x + R.OX, nq.z + R.OZ, nr, 8, 7, 4.6, { mat: MATC.azul, roof: MATC.telhaV, nome: 'Casa de Inês', rh: 2.6 });
    R.RECTS.push([nq.x, nq.z, 8, 7, nr]);
    M.mobilia(nc, 'mesa', 1.6, -1.2); M.mobilia(nc, 'cama', -2.6, -1.2); M.mobilia(nc, 'banco', 1.6, 0.4);
    R.INES = loc(nc.W(0.2, 0.2)); R.INES_ROT = nr;

    // casas elegantes, todas com lanternas acesas: aqui a noite nunca termina
    const cores = [MATC.rosa, MATC.azul, MATC.creme, MATC.marmoreE];
    [[10, 9], [70, 8], [130, 9], [160, 8], [240, 9], [290, 8]].forEach(([a, w], i) => { const q = pos(a, 25); R.casa(q.x, q.z, rotC(q), w, 7, 5 + (i % 2) * 0.6, { mat: cores[i % 4], roof: i % 2 ? MATC.telhaAzul : MATC.telhaV, rh: 2.6, luz: true }); });
    [[15, 9], [50, 9], [110, 10], [160, 9], [190, 9], [235, 8], [300, 9], [335, 8]].forEach(([a, w], i) => { const q = pos(a, 43); R.casa(q.x, q.z, rotC(q), w, 7.5, 5.4 + (i % 3) * 0.5, { mat: cores[(i + 1) % 4], roof: i % 2 ? MATC.telhaV : MATC.telhaAzul, rh: 2.8, luz: true }); });
    for (let a = 0; a < 360; a += 30) { const q = pos(a + 15, 15.5); R.lanterna(q.x, q.z, 0xffc07a); }
    const oq = pos(115, 11.5); R.oratorio('belmonte', 'Oratório de Belmonte', oq.x, oq.z, rotC(oq));
    R.CAPELA = pos(270, 44);
  })();

  /* ================= O PALÁCIO DOS BAILES ================= */
  (function () {
    // v21: o salão do baile ficou bem mais amplo (36 x 44 m), para a luta contra Asmodeu ter espaço
    const px = 0, pz = -50, w = 36, d = 44, h = 11;
    const pal = R.casaInt(px, pz, 0, w, d, h, { mat: MATC.marmore, roof: MATC.telhaAzul, rh: 5, piso: MAT.stone, nome: 'Palácio dos Bailes' });
    R.PALACIO = pal; pal.w = w; pal.d = d;
    // colunas, lustres e espelhos
    for (let k = 0; k < 5; k++) [-1, 1].forEach(s => {
      const lx = s * 13, lz = -16 + k * 8;
      pal.g.add(mesh(new THREE.CylinderGeometry(0.45, 0.5, h - 0.4, 10), MATC.marmoreE, lx, 0.2 + (h - 0.4) / 2, lz));
      const q = pal.W(lx, lz); M.obstacles.push({ x: q.x, z: q.z, r: 0.6 });
    });
    [[-6, -10], [6, -10], [-6, 6], [6, 6]].forEach(([lx, lz]) => {
      const lu = new THREE.Group(); lu.position.set(lx, 7.8, lz); pal.g.add(lu);
      const aro = mesh(new THREE.TorusGeometry(1.0, 0.06, 6, 20), MATC.ouro, 0, 0, 0); aro.rotation.x = Math.PI / 2; lu.add(aro);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; lu.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), MAT.wax, Math.cos(a), 0.12, Math.sin(a))); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), MAT.flame); fl.position.set(Math.cos(a), 0.3, Math.sin(a)); lu.add(fl); M.flames.push(fl); }
      lu.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 4), MATC.ouro, 0, 1.6, 0));
      const q = pal.W(lx, lz); M.emissor(q.x, H(px, pz) + 7.6, q.z, 1.3, 14, 0xffd090);
    });
    // (os espelhos das paredes laterais, de moldura dourada, ficam em arenas.js)
    // o estrado do fundo, com o trono vazio do anfitrião
    const ZE = -d / 2 + 2.8; // o estrado encostado na parede do fundo
    pal.g.add(mesh(new THREE.BoxGeometry(12, 0.5, 5), MATC.marmoreE, 0, 0.45, ZE));
    const tr = new THREE.Group(); tr.position.set(0, 0.7, ZE - 1.2); pal.g.add(tr);
    tr.add(mesh(new THREE.BoxGeometry(1.8, 1, 1.4), MATC.veludo, 0, 0.5, 0)); tr.add(mesh(new THREE.BoxGeometry(2, 4, 0.3), MATC.veludo, 0, 2.2, -0.6)); tr.add(mesh(new THREE.BoxGeometry(2.2, 0.2, 0.4), MATC.ouro, 0, 4.2, -0.6));
    for (let i = 0; i < 7; i++) { const m = mesh(new THREE.BoxGeometry(0.34, 0.42, 0.06), MATC.mascara, -1.8 + i * 0.6, 5.2 + (i % 2) * 0.3, ZE - 2.5); pal.g.add(m); }
    { const q = pal.W(0, ZE); M.caixa(q.x, q.z, 6, 2.5, 0); }
    // torres e fachada
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const tx = px + sx * (w / 2 + 2), tz = pz + sz * (d / 2 + 1);
      const t = R.grupo(tx, tz, 0); t.add(mesh(new THREE.CylinderGeometry(2.4, 2.6, 16, 10), MATC.marmore, 0, 8, 0));
      t.add(mesh(new THREE.ConeGeometry(2.9, 5, 10), MATC.telhaAzul, 0, 18.5, 0));
      R.obst(tx, tz, 2.7);
      if (i === 2) {
        const lan = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.5), new THREE.MeshBasicMaterial({ color: 0x2a2018 })); lan.position.set(0, 16.9, 0); t.add(lan);
        const luz = R.emissor(tx, H(tx, tz) + 17, tz, 0, 44, 0xf0f4ff, false);
        R.acenderLampada = b => { lan.material.color.setHex(b ? 0xf4f6ff : 0x2a2018); luz.int = b ? 3 : 0; };
      }
    });
    R.PORTAO = loc(pal.W(3.2, d / 2 + 1.8));
    R.lanterna(-4, pz + d / 2 + 4, 0xffc07a); R.lanterna(4, pz + d / 2 + 4, 0xffc07a);
    R.oratorio('palacio', 'Oratório do Palácio', 9, pz + d / 2 + 8, Math.PI * 0.85);
    R.ARENA = { x: 0, z: pz - 2 };
    R.dentroPalacio = () => { const c = pal, p = OV.P.pos, dx = p.x - c.x, dz = p.z - c.z, lx = dx * c.cs - dz * c.sn, lz = dx * c.sn + dz * c.cs; return Math.abs(lx) < c.hw && Math.abs(lz) < c.hd; };
  })();

  /* ================= O JARDIM DOS ESPELHOS ================= */
  (function () {
    const S = LAB.meio, cx = LAB.x, cz = LAB.z;
    if (M.patamar) M.patamar(cx + R.OX, cz + R.OZ, 0, S + 2, S + 2, R.altura(cx + R.OX, cz + R.OZ), 7); // o labirinto num terreno plano
    const sebe = (x0, z0, x1, z1) => {
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, lx = Math.abs(x1 - x0) || 1.2, lz = Math.abs(z1 - z0) || 1.2;
      scene.add(mesh(new THREE.BoxGeometry(lx, 2.6, lz), MATC.sebe, mx + R.OX, H(mx, mz) + 1.3, mz + R.OZ));
      R.caixa(mx, mz, lx / 2, lz / 2, 0);
    };
    // muro externo com entrada a leste e corredores internos
    sebe(cx - S, cz - S, cx + S, cz - S); sebe(cx - S, cz + S, cx + S, cz + S); sebe(cx - S, cz - S, cx - S, cz + S);
    sebe(cx + S, cz - S, cx + S, cz - 3); sebe(cx + S, cz + 3, cx + S, cz + S);
    sebe(cx + 12, cz - 12, cx + 12, cz + 8); sebe(cx - 12, cz - 12, cx + 6, cz - 12); sebe(cx - 12, cz - 12, cx - 12, cz + 12);
    sebe(cx - 6, cz + 12, cx + 12, cz + 12); sebe(cx + 4, cz - 4, cx + 4, cz + 6); sebe(cx - 4, cz + 4, cx + 4, cz + 4);
    // painéis de espelho nas sebes
    [[cx + 12.7, cz - 4, Math.PI / 2], [cx - 11.3, cz + 2, Math.PI / 2], [cx - 2, cz - 11.3, 0], [cx + 2, cz + 12.7, 0]].forEach(([x, z, r]) => { const m = mesh(new THREE.BoxGeometry(1.6, 2.2, 0.06), MATC.espelho, x + R.OX, H(x, z) + 1.3, z + R.OZ); m.rotation.y = r; scene.add(m); });
    // o Grande Espelho, no centro, e o lugar onde o Duque se perdeu
    R.ESPELHO = { x: cx - 4, z: cz - 6 };
    R.HENRIQUE = { x: cx - 4, z: cz - 2.6 };
    R.TERCO = { x: cx - 16, z: cz + 16 };
    scene.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8), sm(0x5a3a1a), R.TERCO.x + R.OX, H(R.TERCO.x, R.TERCO.z) + 0.06, R.TERCO.z + R.OZ));
    R.inter(R.TERCO.x, R.TERCO.z, 2.2, () => A4() ? A4().textoTerco() : null, () => A4().terco());
    R.MATEUS = { x: cx + S + 4, z: cz + 5 };
  })();

  /* ================= A CASA DO LAGO ================= */
  (function () {
    const ag = new THREE.Mesh(new THREE.CircleGeometry(LAGO.r - 1, 28), MATC.agua); ag.rotation.x = -Math.PI / 2; ag.position.set(LAGO.x + R.OX, 0.6, LAGO.z + R.OZ); scene.add(ag);
    M.animados.push((dt, t) => { ag.position.y = 0.6 + Math.sin(t * 0.8) * 0.04; });
    const lc = R.casaInt(70, 20, Math.atan2(VC.x - 70, VC.z - 20), 10, 8, 5.2, { mat: MATC.marmore, roof: MATC.telhaAzul, rh: 2.8, nome: 'Casa do Lago' });
    M.mobilia(lc, 'mesa', 1.8, -1.4); M.mobilia(lc, 'lareira', -2, -3.4); M.mobilia(lc, 'banco', 1.8, 0.4); M.mobilia(lc, 'prateleira', 4.4, 1.2, -Math.PI / 2);
    R.VALERIA = loc(lc.W(-0.8, -0.6)); R.VALERIA_ROT = Math.atan2(VC.x - 70, VC.z - 20);
    R.HENRIQUE_CASA = loc(lc.W(-2.4, 0.4));
    // um barquinho e um pequeno cais
    scene.add(mesh(new THREE.BoxGeometry(1.6, 0.18, 6), MAT.woodL, LAGO.x - 10 + R.OX, 0.75, LAGO.z - 4 + R.OZ));
  })();

  /* ================= O JARDIM DA FIGUEIRA ================= */
  (function () {
    const fx = 96, fz = -46;
    if (M.patamar) M.patamar(fx + R.OX, fz + R.OZ, 0, 13, 13, R.altura(fx + R.OX, fz + R.OZ), 6);
    // muretas de pedra em volta, abertas a oeste
    const mureta = (x0, z0, x1, z1) => { const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, lx = Math.abs(x1 - x0) || 0.6, lz = Math.abs(z1 - z0) || 0.6; scene.add(mesh(new THREE.BoxGeometry(lx, 1.2, lz), MATC.marmoreE, mx + R.OX, H(mx, mz) + 0.6, mz + R.OZ)); R.caixa(mx, mz, lx / 2, lz / 2, 0); };
    mureta(fx - 12, fz - 12, fx + 12, fz - 12); mureta(fx - 12, fz + 12, fx + 12, fz + 12); mureta(fx + 12, fz - 12, fx + 12, fz + 12);
    mureta(fx - 12, fz - 12, fx - 12, fz - 3); mureta(fx - 12, fz + 3, fx - 12, fz + 12);
    // a figueira
    const y = H(fx, fz);
    const tronco = mesh(new THREE.CylinderGeometry(0.4, 0.7, 4, 7), sm(0x5a4a3a), fx + R.OX, y + 2, fz + R.OZ); scene.add(tronco);
    [[0, 0, 0, 3.4], [2, 0.6, 1, 2.4], [-2, 0.4, -1, 2.6], [0.6, 1.2, -2, 2.2], [-1, 1, 2, 2.2]].forEach(([dx, dy, dz, r]) => { const c = mesh(new THREE.DodecahedronGeometry(r, 0), sm(0x3a5a2a), fx + dx + R.OX, y + 5 + dy, fz + dz + R.OZ); c.scale.y = 0.65; scene.add(c); });
    R.obst(fx, fz, 0.9); M.copas.push({ x: fx + R.OX, z: fz + R.OZ, r: 4.5, y0: y + 3.2, y1: y + 7.5 });
    // o banco de pedra, com um livro aberto
    const b = R.grupo(fx - 3.4, fz + 1.2, -Math.PI / 2);
    b.add(mesh(new THREE.BoxGeometry(2.2, 0.15, 0.7), MATC.marmoreE, 0, 0.5, 0)); [-0.8, 0.8].forEach(x => b.add(mesh(new THREE.BoxGeometry(0.2, 0.5, 0.6), MATC.marmoreE, x, 0.25, 0)));
    b.add(mesh(new THREE.BoxGeometry(0.5, 0.06, 0.36), sm(0xe8e0cc), 0.4, 0.62, 0));
    R.obst(fx - 3.4, fz + 1.2, 1.1);
    R.VISAO = { x: fx - 5.2, z: fz - 1.5 };
    R.inter(R.VISAO.x, R.VISAO.z, 2.6, () => A4() ? A4().textoFigueira() : null, () => A4().figueira());
    R.oratorio('figueira', 'Oratório da Figueira', fx + 6, fz - 8, -Math.PI * 0.75);
    R.FIGUEIRA = { x: fx, z: fz };
  })();

  /* ---- a placa da estrada, na chegada ---- */
  R.placa(4, 146, -Math.PI / 2);
  R.inter(3, 147.5, 2.4, () => OV.viagem ? OV.viagem.textoPlaca('corte') : null, () => OV.viagem && OV.viagem.usarPlaca('corte'));

  /* ---- ciprestes e árvores de jardim, pedras e grama ---- */
  R.vegetacao({
    arvores: 420, espaco: 5.2, esc: [0.9, 1.4], alto: 1.6, copaAlta: 1.5, yCopa: 3.6, corCopa: 0x1e3a24, corTronco: 0x3a2a1c,
    densidade: (lx, lz) => { if (Math.abs(lx - LAB.x) < LAB.meio + 6 && Math.abs(lz - LAB.z) < LAB.meio + 6) return 0; if (Math.hypot(lx - LAGO.x, lz - LAGO.z) < LAGO.r + 3) return 0; if (Math.hypot(lx - 96, lz + 46) < 16) return 0; return Math.max(Math.abs(lx), Math.abs(lz)) > 100 ? 0.9 : 0.35; },
    pedras: 60, capim: 3600, corCapim: 0x3a5a26,
    especies: [['cipreste', 3], ['cerejeira', 2], ['olaia', 1.2], ['amendoeira', 1.2], ['laranjeira', 1.2], ['carvalho', 1.5], ['acacia', 0.8], ['pereira', 0.6]],
    chao: { n: { flores: 1000, arbustos: 420 },
      paleta: { capim: [0x3a5a26, 0x46662c, 0x34522a, 0x4a6a30], flores: [0xd8283a, 0xf0a0b8, 0xf2f0e8, 0xc8509a, 0xe8c83a, 0x7a4ac8, 0xf0a0b8], arbusto: [0x24401e, 0x2a4a22, 0x30502a], bagas: [0xd8283a, 0xf0a0b8, 0xf2f0e8, 0xe8c83a] } },
    semCapim: (lx, lz) => Math.hypot(lx - VC.x, lz - VC.z) < 15 || Math.hypot(lx - LAGO.x, lz - LAGO.z) < LAGO.r || (Math.abs(lx) < 14 && Math.abs(lz + 50) < 18)
  });

  /* ---- gente de Belmonte ---- */
  const at = (q, rot, op) => M.criarFigura(q.x + R.OX, q.z + R.OZ, rot, op);
  at(R.BERNARDO, R.IGREJA_ROT, { id: 'bernardo', nome: 'Frei Bernardo', cor: 0x0e0c0c, capuz: true });
  at(R.CLARA, R.CLARA_ROT, { id: 'clara', nome: 'Clara, a costureira', cor: 0x6a3a4a, veu: 0xc8b8a8 });
  at(R.INES, R.INES_ROT, { id: 'ines', nome: 'Inês', cor: 0x5a6a8a, cabelo: 0x5a3a1a });
  at(R.VALERIA, R.VALERIA_ROT, { id: 'valeria', nome: 'Duquesa Valéria', cor: 0x4a1a4a, veu: 0x2a1028 });
  at(R.HENRIQUE, Math.PI, { id: 'henrique', nome: 'Duque Henrique', cor: 0x5a1a1a, cabelo: 0x3a2a1a });
  at(R.PORTAO, -0.6, { id: 'sebastiao', nome: 'Sebastião, o guarda', cor: 0x3a4a6a, cabelo: 0x2a1a10 });
  at(R.MATEUS, -Math.PI / 2, { id: 'mateus', nome: 'Mateus, o jardineiro', cor: 0x3a4a2a, cabelo: 0x8a8070 });
  at({ x: R.VISAO.x + 1.6, z: R.VISAO.z - 1.4 }, -1.1, { id: 'agostinho', nome: 'Santo Agostinho', santo: true, oculto: true });
  // a máscara do Duque e a do guarda: tiram-nas quando acordam
  R.mascaraEm = function (id) {
    const f = M.figuras[id]; if (!f) return null;
    const m = mesh(new THREE.BoxGeometry(0.34, 0.2, 0.08), MATC.mascara, 0, 1.98, 0.2); (f.corpo || f.g).add(m);
    return m;
  };
  R.mascaraHenrique = R.mascaraEm('henrique'); R.mascaraSebastiao = R.mascaraEm('sebastiao');
  R.MORADORES = [
    [VC.x + 6, VC.z + 8, 0.4, { id: 'mor_corte1', nome: 'Dama mascarada', cor: 0x6a2a4a, veu: 0x8a5a7a }, 'Tire a máscara? Para quê? Aqui ninguém quer ver o rosto de ninguém.', 'Dançamos há tanto tempo que já não sei se é dia ou noite.'],
    [VC.x - 8, VC.z - 7, 2.1, { id: 'mor_corte2', nome: 'Músico cansado', cor: 0x2a3a5a, cabelo: 0x3a2a1a }, 'Toco a mesma música há semanas. Se paro, olham para mim como se eu tivesse quebrado um encanto.', 'O Duque não aparece no baile desde que entrou no Jardim dos Espelhos.'],
    [VC.x + 10, VC.z - 6, -1.2, { id: 'mor_corte3', nome: 'Criada do palácio', cor: 0x4a4a4a, veu: 0xe0dccc }, 'Limpo os espelhos do palácio todo dia. Às vezes acho que eles olham de volta.', 'A Duquesa Valéria mora sozinha na Casa do Lago. Coitada.']
  ];

  /* ---- vícios pelos caminhos (nível 12 a 16) ---- */
  R.spawnsMundo = [
    ['mariposa', 3, 120, 12], ['mariposa', -4, 110, 12], ['mariposa', 2, 96, 13, 'forte'],
    ['mascarado', -30, 46, 13], ['mariposa', -48, 30, 13], ['reflexo', -58, 14, 14, 'forte'],
    ['mariposa', 30, 46, 13], ['mascarado', 50, 36, 13, 'forte'],
    ['mariposa', 30, -6, 14], ['reflexo', 52, -22, 14], ['mascarado', 66, -32, 15, 'elite'],
    ['mariposa', -4, 20, 13], ['reflexo', 6, 0, 14], ['mariposa', -70, -48, 14, 'forte'], ['reflexo', -100, 4, 15, 'elite']
  ].map(([t, x, z, n, v]) => [t, x + R.OX, z + R.OZ, n, v]);
})(window.OV);

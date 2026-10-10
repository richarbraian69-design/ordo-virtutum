/* Ordo Virtutum — Ato II: os Portos do Festim. Região costeira ao sul do vale (coordenadas locais + 700 em z).
   Igreja de São Nicolau, Praça do Banquete, mercado, celeiros, casa do Barão, Bairro dos Pobres, cais e farol. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { rnd, clamp } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const OZ = 700, K = 1.5; // o porto foi ampliado: as distâncias do desenho valem 1,5 vez no mundo
  const PT = { OZ, K }; OV.porto = PT;
  const X = lx => lx * K, Z = lz => OZ + lz * K;
  PT.W = (lx, lz) => ({ x: X(lx), z: Z(lz) });

  /* ---- geografia ---- */
  const costa = lx => 30 + 4 * Math.sin(lx / 15) + 20 * Math.exp(-(((lx + 66) / 11) ** 2));
  PT.costa = costa;
  const PIERS = [{ x: 14, z0: 28, z1: 52, w: 3.2 }, { x: 34, z0: 28, z1: 46, w: 3.2 }];
  const DECK = 0.65;
  PT.PIERS = PIERS;
  const noPier = (lx, lz) => PIERS.find(p => Math.abs(lx - p.x) * K < p.w / 2 && lz > p.z0 && lz < p.z1);
  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
    const t = L ? clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1) : 0;
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
  }
  const ESTR = [
    [[0, -98], [0, -62], [7, -52], [9.5, -42], [7, -32], [0, -27], [0, -15]],
    [[5, -20], [16, -18], [26, -15], [40, -10], [48, -6]],
    [[30, -17], [38, -28], [44, -38]],
    [[-5, -21], [-18, -26], [-32, -30], [-42, -33]],
    [[2, 13], [5, 22], [12, 28], [32, 29]],
    [[-2, 14], [-8, 24], [-28, 30], [-46, 33], [-58, 37]]
  ];
  PT.ESTRADAS = ESTR;
  const distEstrada = (lx, lz) => { let d = 1e9; for (const L of ESTR) for (let i = 0; i < L.length - 1; i++) d = Math.min(d, distSeg(lx, lz, L[i][0], L[i][1], L[i + 1][0], L[i + 1][1])); return d; };
  const PLANOS = [
    { x: 0, z: -2, r: 22, h: 0.45 }, { x: 0, z: -38, r: 15, h: 1.4 }, { x: 26, z: -12, r: 10, h: 0.8 },
    { x: 58, z: -5, r: 15, h: 0.9 }, { x: 46, z: -46, r: 14, h: 2.2 }, { x: -44, z: -36, r: 18, h: 1.0 },
    { x: 10, z: 24, r: 12, h: 0.4 }, { x: -6, z: 24, r: 7, h: 0.4 }, { x: -66, z: 38, r: 9, h: 3.6 }
  ];
  function relevo(lx, lz) {
    let h = 0.7 + 0.7 * Math.sin(lx * 0.06) * Math.cos(lz * 0.05) + 0.35 * Math.sin(lx * 0.17 + lz * 0.13 + 1);
    const corr = 1 - smooth(5, 16, Math.abs(lx));
    h += smooth(-42, -92, lz) * 17 * (1 - 0.78 * corr);
    h += smooth(66, 96, Math.abs(lx)) * 20;
    h += 3.4 * Math.exp(-((lx + 66) ** 2 + (lz - 38) ** 2) / (2 * 10 * 10));
    for (const p of PLANOS) { const w = 1 - smooth(p.r * 0.6, p.r, Math.hypot(lx - p.x, lz - p.z)); h = h * (1 - w) + p.h * w; }
    const d = lz - costa(lx);
    const b = smooth(-9, 0, d); h = h * (1 - b) + 0.12 * b;
    h -= smooth(0, 9, d) * 3.4;
    return h;
  }
  PT.relevo = relevo;
  PT.altura = function (x, z) {
    const lx = x / K, lz = (z - OZ) / K, h = M.nivelar ? M.nivelar(x, z, relevo(lx, lz)) : relevo(lx, lz);
    return noPier(lx, lz) ? Math.max(h, DECK) : h;
  };
  const H = (lx, lz) => PT.altura(X(lx), Z(lz));
  PT.limitar = function (p) {
    let lx = clamp(p.x / K, -90, 90), lz = Math.max((p.z - OZ) / K, -96);
    const lim = costa(lx) - 0.4 / K;
    if (lz > lim && !noPier(lx, lz)) {
      let bx = lx, bz = lim, bd = lz - lim;
      for (const pr of PIERS) {
        const cx = clamp(lx, pr.x - (pr.w / 2 - 0.3) / K, pr.x + (pr.w / 2 - 0.3) / K), cz = clamp(lz, pr.z0, pr.z1 - 0.3 / K);
        const d = Math.hypot(lx - cx, lz - cz); if (d < bd) { bd = d; bx = cx; bz = cz; }
      }
      lx = bx; lz = bz;
    }
    p.x = X(lx); p.z = Z(lz);
  };

  /* ---- lugares ---- */
  const ZONAS = [['farol', -66, 40, 12], ['nicolau', 0, -38, 13], ['praca', 0, -2, 17], ['mercado', 26, -12, 9], ['celeiros', 58, -5, 13], ['barao', 46, -46, 12], ['pobres', -44, -36, 16], ['cais', 14, 33, 22]];
  PT.zona = function (x, z) { const lx = x / K, lz = (z - OZ) / K; for (const [k, cx, cz, r] of ZONAS) if (Math.hypot(lx - cx, lz - cz) < r) return k; return 'porto'; };
  Object.assign(M.LOCAIS, {
    porto: { nome: 'Portos do Festim' },
    nicolau: { nome: 'Igreja de São Nicolau', x: X(0), z: Z(-38), oy: -40 },
    praca: { nome: 'Praça do Banquete', x: X(0), z: Z(-2), oy: 2 },
    mercado: { nome: 'Mercado', x: X(26), z: Z(-12), oy: -22 },
    celeiros: { nome: 'Celeiros do Barão', x: X(58), z: Z(-5), oy: 40 },
    barao: { nome: 'Casa do Barão', x: X(46), z: Z(-46), oy: -30 },
    pobres: { nome: 'Bairro dos Pobres', x: X(-44), z: Z(-36), oy: 46 },
    cais: { nome: 'Cais dos Pescadores', x: X(14), z: Z(33), oy: 50 },
    farol: { nome: 'Farol de São Nicolau', x: X(-66), z: Z(40), oy: -34 }
  });
  PT.LOCAIS = ['nicolau', 'praca', 'mercado', 'celeiros', 'barao', 'pobres', 'cais', 'farol'];
  PT.RECTS = [];
  PT.ENTRADA = { x: 0, z: Z(-82), facing: 0 };
  PT.ehPorto = (x, z) => z > 400;

  /* ---- terreno ---- */
  (function () {
    const S = 200 * K, N = 160;
    const geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
    const AREIA = new THREE.Color(0x8a7656), FUNDO = new THREE.Color(0x2e3a3a), ROCHA = new THREE.Color(0x5a5048), CHAO = new THREE.Color(0x56442e), PEDRA = new THREE.Color(0x4a4036);
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i) / K, lz = pos.getZ(i) / K, h = relevo(lx, lz); pos.setY(i, h);
      const g = 0.5 + 0.5 * Math.sin(lx * 0.19) * Math.cos(lz * 0.15);
      c.setHSL(0.16 + g * 0.05, 0.3, 0.15 + g * 0.05);
      if (h > 6) c.lerp(ROCHA, smooth(6, 14, h));
      const d = lz - costa(lx);
      if (d > -11) c.lerp(AREIA, smooth(-11, -4, d));
      if (d > 0) c.lerp(FUNDO, smooth(0, 5, d));
      const est = distEstrada(lx, lz); if (est < 2.8 && d < -1) c.lerp(CHAO, 1 - smooth(1.2, 2.8, est));
      const pr = Math.hypot(lx, lz + 2); if (pr < 15) c.lerp(PEDRA, 1 - smooth(12, 15, pr));
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    t.position.z = OZ; t.receiveShadow = true; scene.add(t); PT.terreno = t; if (M.terrenos) M.terrenos.push(t);
    if (OV.cenario) OV.cenario.manchar(t, { secura: 1.5, seco: 0x7a7034 });
    // o mar
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(260 * K, 150 * K), new THREE.MeshStandardMaterial({ color: 0x1d3846, roughness: 0.22, metalness: 0.35, emissive: 0x050d14, transparent: true, opacity: 0.93 }));
    mar.rotation.x = -Math.PI / 2; mar.position.set(0, -0.45, Z(88)); scene.add(mar); PT.mar = mar;
    M.animados.push((dt, t) => { mar.position.y = -0.45 + Math.sin(t * 0.7) * 0.07; });
  })();

  /* ---- ajudantes ---- */
  const grupo = (lx, lz, rot, y) => M.grupo(X(lx), Z(lz), rot, y);
  const caixa = (lx, lz, hw, hd, rot) => M.caixa(X(lx), Z(lz), hw, hd, rot);
  const CE = 1.25; // casas maiores
  const casa = (lx, lz, rot, w, d, h, op) => { PT.RECTS.push([lx, lz, w * CE, d * CE, rot]); return M.casa(X(lx), Z(lz), rot, w * CE, d * CE, h * 1.15, op); };
  const casaInt = (lx, lz, rot, w, d, h, op) => { PT.RECTS.push([lx, lz, w, d, rot]); return M.casaInterior(X(lx), Z(lz), rot, w, d, h, op); };
  const emissor = (lx, y, lz, i, dist, cor, fl) => M.emissor(X(lx), y, Z(lz), i, dist, cor, fl);
  const obst = (lx, lz, r) => M.obstacles.push({ x: X(lx), z: Z(lz), r });
  const inter = (lx, lz, r, txt, acao) => M.interativo(X(lx), Z(lz), r, txt, acao);
  const A2 = () => OV.ato2;
  const MATP = {
    ocre: sm(0x9a7a50), ocreE: sm(0x8a6a44), cal: sm(0xb4a890), calE: sm(0x9c9280), barro: sm(0x5e4a3a),
    telha: sm(0x7a3a22), palha: sm(0x4a3c26), veludo: sm(0x5a0f14), toalha: sm(0xc8b89a), pano: [sm(0x8a2a22), sm(0x2a4a7a), sm(0xa07a2a), sm(0x3e5a2e)],
    pao: sm(0x9a6a32), assado: sm(0x7a3a1a), fruta: sm(0x8a1a1a), uva: sm(0x4a1a4a), mofo: sm(0x5a6040), farol: sm(0xcfc6b0), faixa: sm(0x7a2018)
  };
  PT.MAT = MATP;
  function braseiro(lx, lz) {
    const y = H(lx, lz), g = new THREE.Group(); g.position.set(X(lx), y, Z(lz)); scene.add(g);
    [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; const p = mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), MAT.iron, Math.cos(a) * 0.32, 0.55, Math.sin(a) * 0.32); p.rotation.z = Math.cos(a) * 0.2; p.rotation.x = -Math.sin(a) * 0.2; g.add(p); });
    g.add(mesh(new THREE.CylinderGeometry(0.55, 0.3, 0.35, 8), MAT.iron, 0, 1.2, 0));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 6), MAT.flame); f.position.set(0, 1.75, 0); g.add(f); M.flames.push(f);
    emissor(lx, y + 2.2, lz, 1.5, 11, 0xff8a3a);
    obst(lx, lz, 0.6);
  }
  function lanterna(lx, lz, y) {
    const h = y === undefined ? H(lx, lz) : y;
    scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 5), MAT.wood, X(lx), h + 1.3, Z(lz)));
    scene.add(mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), MAT.winLit, X(lx), h + 2.75, Z(lz)));
    emissor(lx, h + 2.8, lz, 0.9, 8, 0xe0902e); obst(lx, lz, 0.25);
  }
  function placa(lx, lz, rot, texto) {
    const g = grupo(lx, lz, rot);
    g.add(mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), MAT.wood, 0, 1.15, 0));
    const t = mesh(new THREE.BoxGeometry(1.7, 0.42, 0.08), MAT.woodL, 0.55, 1.9, 0); g.add(t);
    const p = mesh(new THREE.ConeGeometry(0.24, 0.4, 3), MAT.woodL, 1.5, 1.9, 0); p.rotation.z = -Math.PI / 2; g.add(p);
    obst(lx, lz, 0.25);
    return g;
  }

  /* ================= IGREJA DE SÃO NICOLAU (com interior) ================= */
  (function () {
    const lx = 0, lz = -40;
    const ig = casaInt(lx, lz, 0, 12, 20, 8.5, { mat: MAT.wall, roof: MATP.telha, rh: 4.4, piso: MAT.stone, nome: 'Igreja de São Nicolau' });
    M.mobilia(ig, 'altar', 0, -7.8, 0);
    for (let k = 0; k < 5; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.6, -4 + k * 2.4, 0));
    const icone = new THREE.Group(); icone.position.set(0, 3.6, -9.6); ig.g.add(icone);
    icone.add(mesh(new THREE.BoxGeometry(1.6, 2.2, 0.1), MAT.gold, 0, 0, 0));
    icone.add(mesh(new THREE.BoxGeometry(1.3, 1.9, 0.12), MATP.veludo, 0, 0, 0.02));
    [-0.3, 0, 0.3].forEach(x => icone.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), MAT.gold, x, -0.6, 0.1)));
    const g = ig.g;
    const rosa = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), MAT.winLit); rosa.position.set(0, 6.4, 10.08); g.add(rosa);
    g.add(mesh(new THREE.BoxGeometry(6, 0.4, 2.2), MAT.col, 0, 0.2, 11.1));
    // torre
    g.add(mesh(new THREE.BoxGeometry(4, 15, 4), MAT.wall, -8.2, 7.5, 6));
    const tc = mesh(new THREE.ConeGeometry(3.1, 4.4, 4), MATP.telha, -8.2, 17.2, 6); tc.rotation.y = Math.PI / 4; g.add(tc);
    g.add(mesh(new THREE.BoxGeometry(1.6, 2.2, 0.2), MAT.dark, -8.2, 12, 8.05));
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.9, 8), MAT.gold, -8.2, 11.8, 6));
    g.add(mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), MAT.gold, 0, 13.6, 9.4));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.16, 0.18), MAT.gold, 0, 13.9, 9.4));
    const tw = ig.W(-8.2, 6); M.caixa(tw.x, tw.z, 2.1, 2.1, 0); PT.RECTS.push([-8.2 / K, lz + 6 / K, 4, 4, 0]);
    const pt = ig.W(0, 12.6);
    [-3.6, 3.6].forEach(dx => lanterna((pt.x + dx) / K, (pt.z - OZ) / K));
    M.interativo(pt.x, pt.z, 2.6, () => A2() ? A2().textoIgreja() : null, () => A2().igreja());
    M.criarOratorio('nicolau', 'Oratório de São Nicolau', pt.x + 7, pt.z + 1, 0);
    PT.GASPAR = ig.W(0, -5);
  })();

  /* ================= PRAÇA DO BANQUETE ================= */
  (function () {
    const y0 = H(0, -2);
    const piso = new THREE.Mesh(new THREE.CircleGeometry(13.5 * K, 32), MAT.stone); piso.rotation.x = -Math.PI / 2; piso.position.set(0, y0 + 0.04, Z(-2)); piso.receiveShadow = true; scene.add(piso);
    const geoPao = new THREE.BoxGeometry(0.42, 0.2, 0.26), geoAssado = new THREE.SphereGeometry(0.3, 7, 5), geoCalice = new THREE.CylinderGeometry(0.08, 0.05, 0.3, 6), geoFruta = new THREE.SphereGeometry(0.09, 5, 4), geoJarro = new THREE.CylinderGeometry(0.12, 0.16, 0.42, 7);
    PT.comida = [];
    [-7, 0, 7].forEach((lx, ti) => {
      const g = grupo(lx, -3, 0, y0);
      g.add(mesh(new THREE.BoxGeometry(1.8, 0.14, 14), MAT.woodL, 0, 0.95, 0));
      g.add(mesh(new THREE.BoxGeometry(1.92, 0.03, 14.1), MATP.toalha, 0, 1.03, 0));
      [-6.4, 0, 6.4].forEach(z => [-0.7, 0.7].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), MAT.wood, x, 0.45, z))));
      [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.45, 0.45, 13.6), MAT.wood, s * 1.4, 0.22, 0)));
      for (let k = 0; k < 11; k++) {
        const z = -6.2 + k * 1.24 + rnd(-0.2, 0.2), x = rnd(-0.45, 0.45), r = (k + ti) % 4;
        let m;
        if (r === 0) m = new THREE.Mesh(geoPao, MATP.pao);
        else if (r === 1) { m = new THREE.Mesh(geoAssado, MATP.assado); m.scale.set(1.3, 0.7, 1); }
        else if (r === 2) m = new THREE.Mesh(geoCalice, MAT.gold);
        else m = new THREE.Mesh(geoJarro, MAT.colDark);
        m.position.set(x, 1.12 + (r === 1 ? 0.08 : r === 3 ? 0.18 : 0.08), z); g.add(m); PT.comida.push(m);
        for (let f = 0; f < 3; f++) { const fr = new THREE.Mesh(geoFruta, f % 2 ? MATP.fruta : MATP.uva); fr.position.set(-x * 0.6 + rnd(-0.1, 0.1), 1.12, z + 0.5 + rnd(-0.1, 0.1)); g.add(fr); PT.comida.push(fr); }
      }
      caixa(lx, -3, 1.65, 7.1, 0); PT.RECTS.push([lx, -3, 3.3, 14, 0]);
    });
    // o trono da cabeceira, voltado para as mesas
    const tr = grupo(0, 14, Math.PI, y0);
    tr.add(mesh(new THREE.BoxGeometry(4.2, 0.4, 3.2), MAT.col, 0, 0.2, 0));
    tr.add(mesh(new THREE.BoxGeometry(1.7, 0.9, 1.4), MATP.veludo, 0, 0.85, 0));
    tr.add(mesh(new THREE.BoxGeometry(1.9, 3.6, 0.3), MATP.veludo, 0, 2.1, -0.65));
    tr.add(mesh(new THREE.BoxGeometry(2.1, 0.2, 0.4), MAT.gold, 0, 3.95, -0.65));
    [-1, 1].forEach(s => { tr.add(mesh(new THREE.BoxGeometry(0.2, 0.7, 1.3), MAT.gold, s * 0.9, 1.4, 0)); tr.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.6, 6), MAT.gold, s * 1.6, 2.5, -1.1)); });
    tr.add(mesh(new THREE.BoxGeometry(3.6, 0.15, 1.6), MATP.veludo, 0, 4.8, -0.5));
    M.caixa(0, Z(14) + 0.2, 2.1, 1.6, 0); PT.RECTS.push([0, 14.2, 4.2, 3.2, 0]);
    // o convidado do trono (só uma sombra, à noite)
    const sombra = new THREE.Group(); sombra.position.set(0, y0 + 0.4, Z(14) + 0.2); sombra.rotation.y = Math.PI;
    const negro = new THREE.MeshBasicMaterial({ color: 0x050304, transparent: true, opacity: 0.82 });
    const corpo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), negro); corpo.position.y = 1.6; corpo.scale.set(1.2, 1.1, 1); sombra.add(corpo);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), negro); cab.position.y = 3.0; sombra.add(cab);
    const olho = new THREE.MeshBasicMaterial({ color: 0xffb02a });
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), olho); e.position.set(0.17 * s, 3.05, 0.45); sombra.add(e); });
    const coroa = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.3, 8, 1, true), MAT.gold); coroa.position.y = 3.45; sombra.add(coroa);
    sombra.visible = false; scene.add(sombra);
    PT.sombraTrono = b => { sombra.visible = b; };
    M.animados.push((dt, t) => { if (sombra.visible) { corpo.scale.y = 1.1 + Math.sin(t * 1.4) * 0.04; } });
    [[-12, -13], [12, -13], [-12, 9], [12, 9]].forEach(([x, z]) => braseiro(x, z));
    PT.TRONO = { x: 0, z: Z(14) };
    M.interativo(0, Z(14) - 2.4, 2.4, () => A2() ? A2().textoTrono() : null, () => A2().trono());
  })();

  /* ================= MERCADO ================= */
  (function () {
    [[-5, -3, 0.2], [0.5, -6, -0.1], [5.5, -2, -0.3], [1.5, 3.4, 0.1]].forEach(([dx, dz, r], i) => {
      const lx = 26 + dx, lz = -12 + dz, g = grupo(lx, lz, r);
      [[-1.2, -0.9], [1.2, -0.9], [-1.2, 0.9], [1.2, 0.9]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), MAT.wood, x, 1.2, z)));
      const tol = mesh(new THREE.BoxGeometry(2.8, 0.08, 2.2), MATP.pano[i % 4], 0, 2.42, 0); tol.rotation.x = 0.12; g.add(tol);
      g.add(mesh(new THREE.BoxGeometry(2.4, 0.9, 0.8), MAT.woodL, 0, 0.45, 0.55));
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.SphereGeometry(0.16, 5, 4), [MATP.pao, MATP.fruta, MATP.mofo, MATP.uva][(k + i) % 4], -0.8 + k * 0.53, 1.02, 0.55));
      caixa(lx, lz, 1.4, 1.2, r); PT.RECTS.push([lx, lz, 2.6, 2.2, r]);
    });
  })();

  /* ================= CELEIROS DO BARÃO ================= */
  (function () {
    casa(52, -8, -Math.PI / 2, 9, 7, 5.5, { mat: MATP.calE, rh: 3, roof: MATP.telha });
    casa(64, -1, -Math.PI / 2, 9, 7, 5.5, { mat: MATP.calE, rh: 3, roof: MATP.telha });
    for (let i = 0; i < 9; i++) { const x = 46.5 + rnd(-1, 1), z = -3 + i * 0.7 - (i > 4 ? 3 : 0), s = mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.8, 6), MATP.mofo, X(x) + (i > 4 ? 1 : 0), H(x, z) + 0.4 + (i > 6 ? 0.7 : 0), Z(z)); scene.add(s); }
    obst(47, -2, 1.3);
    const y = H(47.4, -12);
    scene.add(mesh(new THREE.BoxGeometry(1.1, 0.8, 0.8), MAT.woodL, X(47.4), y + 0.4, Z(-12)));
    scene.add(mesh(new THREE.BoxGeometry(0.55, 0.09, 0.4), MATP.faixa, X(47.4), y + 0.85, Z(-12)));
    obst(47.4, -12, 0.65);
    lanterna(47.2, -14.2);
    inter(46.0, -12, 2.2, () => A2() ? A2().textoLivro() : null, () => A2().livro());
    inter(47.6, -8, 2.2, () => A2() ? A2().textoFarinha() : null, () => A2().farinha());
  })();

  /* ================= CASA DO BARÃO ================= */
  (function () {
    const man = casaInt(46, -49, 0, 14, 11, 6.8, { mat: MATP.ocre, rh: 3.2, roof: MATP.telha, nome: 'Casa do Barão Otávio' });
    M.mobilia(man, 'mesa', -2.6, -1.6); M.mobilia(man, 'mesa', 2.6, -1.6); M.mobilia(man, 'lareira', 0, -4.9); M.mobilia(man, 'prateleira', -6, 1, Math.PI / 2); M.mobilia(man, 'barris', 5.6, 3.4);
    PT.BARAO = man.W(0, 0.6);
    casa(54.5, -50, 0, 4.6, 4.6, 9.5, { mat: MATP.ocreE, rh: 2.6, roof: MATP.telha });
    lanterna(42.6, -43.6); lanterna(49.4, -43.6);
    const y = H(40.4, -41.6);
    const cofre = grupo(40.4, -41.6, 0.3);
    cofre.add(mesh(new THREE.BoxGeometry(1.1, 0.7, 0.75), sm(0x2a1a10), 0, 0.35, 0));
    cofre.add(mesh(new THREE.BoxGeometry(1.16, 0.12, 0.8), MAT.gold, 0, 0.72, 0));
    cofre.add(mesh(new THREE.BoxGeometry(0.2, 0.22, 0.05), MAT.iron, 0, 0.45, 0.39));
    obst(40.4, -41.6, 0.7);
    inter(40.0, -40.2, 2.2, () => A2() ? A2().textoCofre() : null, () => A2().cofre());
  })();

  /* ================= BAIRRO DOS POBRES ================= */
  (function () {
    [[-52, -44, 0.3], [-46, -48, -0.2], [-38, -45, 0.5], [-55, -35, 1.4], [-52, -27, 1.8], [-36, -38, -0.6], [-47, -24, 2.9], [-58, -43, 0.9]].forEach(([lx, lz, r]) =>
      casa(lx, lz, r, 4.2, 3.6, 2.6, { mat: MATP.barro, rh: 1.4, roof: MATP.palha }));
    // a cozinha de Lúcia
    const y = H(-33, -25);
    scene.add(mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.6, 8), MAT.iron, X(-33), y + 0.55, Z(-25)));
    [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; scene.add(mesh(new THREE.BoxGeometry(0.07, 0.6, 0.07), MAT.iron, X(-33) + Math.cos(a) * 0.45, y + 0.3, Z(-25) + Math.sin(a) * 0.45)); });
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), MAT.flame); f.position.set(X(-33), y + 0.2, Z(-25)); scene.add(f); M.flames.push(f);
    PT.fogoLucia = f; f.visible = false;
    PT.luzLucia = emissor(-33, y + 1, -25, 0, 8, 0xff8a3a);
    obst(-33, -25, 0.7);
    lanterna(-41, -29);
  })();

  /* ================= CAIS DOS PESCADORES ================= */
  (function () {
    PIERS.forEach(p => {
      const len = p.z1 - p.z0, mid = (p.z0 + p.z1) / 2;
      scene.add(mesh(new THREE.BoxGeometry(p.w, 0.25, len * K), MAT.woodL, X(p.x), DECK - 0.12, Z(mid)));
      for (let z = p.z0 + 4 / K; z < p.z1; z += 3.5 / K) [-1, 1].forEach(s => scene.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 5), MAT.wood, X(p.x) + s * (p.w / 2 - 0.1), DECK - 1.6, Z(z))));
      lanterna(p.x + (p.w / 2 - 0.25) / K, p.z1 - 1 / K, DECK);
      PT.RECTS.push([p.x, mid, p.w, len * K, 0]);
    });
    // barcos
    function barco(lx, lz, rot, esc) {
      const g = new THREE.Group(); g.position.set(X(lx), -0.3, Z(lz)); g.rotation.y = rot; g.scale.setScalar(esc || 1); scene.add(g);
      g.add(mesh(new THREE.BoxGeometry(1.8, 0.8, 5.2), MAT.wood, 0, 0, 0));
      const proa = mesh(new THREE.ConeGeometry(0.9, 1.4, 4), MAT.wood, 0, 0, 3.2); proa.rotation.x = Math.PI / 2; proa.rotation.y = Math.PI / 4; proa.scale.set(1, 1, 0.55); g.add(proa);
      g.add(mesh(new THREE.BoxGeometry(1.5, 0.08, 4.6), MAT.woodL, 0, 0.38, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.6, 5), MAT.wood, 0, 2.6, 0.4));
      const vela = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6), sm(0xb8a888, { side: THREE.DoubleSide })); vela.position.set(0, 2.9, 0.5); vela.rotation.y = Math.PI / 2; g.add(vela);
      const ph = Math.random() * 6;
      M.animados.push((dt, t) => { g.position.y = -0.3 + Math.sin(t * 0.9 + ph) * 0.08; g.rotation.z = Math.sin(t * 0.7 + ph) * 0.04; });
    }
    barco(17.6, 44, 0.04); barco(30.4, 39, -0.06); barco(41, 52, 0.5); barco(-6, 78, 1.2, 2.4);
    // armazéns da beira-mar
    casa(-22, 19, Math.PI, 9, 6, 4.5, { mat: MATP.cal, rh: 2.2, roof: MATP.telha, luz: true });
    casa(46, 20, Math.PI, 8, 6, 4.5, { mat: MATP.ocreE, rh: 2.2, roof: MATP.telha });
    // redes
    const rede = sm(0x6a5a44, { side: THREE.DoubleSide });
    [[12.8, 41], [15.2, 46]].forEach(([x, z], i) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3, 4, 3), rede); r.position.set(X(x), DECK + 0.7, Z(z)); r.rotation.y = i ? 0.4 : -0.3; scene.add(r); });
    M.criarOratorio('cais', 'Oratório do Cais', X(-6), Z(27), Math.PI);
  })();

  /* ================= FAROL DE SÃO NICOLAU ================= */
  (function () {
    const lx = -66, lz = 40, g = grupo(lx, lz, Math.PI / 2);
    g.add(mesh(new THREE.CylinderGeometry(3.4, 3.8, 2.5, 10), MAT.col, 0, 1.25, 0));
    g.add(mesh(new THREE.CylinderGeometry(2.0, 2.7, 15, 10), MATP.farol, 0, 10, 0));
    [6, 11].forEach(y => g.add(mesh(new THREE.CylinderGeometry(2.5 - y * 0.035, 2.55 - y * 0.035, 0.8, 10), MATP.faixa, 0, y, 0)));
    g.add(mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 12), MAT.iron, 0, 17.6, 0));
    const vidro = new THREE.MeshBasicMaterial({ color: 0x2a2418 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 2.2, 10), vidro).translateY(18.9));
    g.add(mesh(new THREE.ConeGeometry(2.2, 2.2, 10), MAT.roof, 0, 21.1, 0));
    g.add(mesh(new THREE.BoxGeometry(1.3, 2.3, 0.2), MAT.wood, 0, 1.15 + 0.6, 3.5));
    obst(lx, lz, 3.9); PT.RECTS.push([lx, lz, 7, 7, 0]);
    const y = H(lx, lz);
    const luz = emissor(lx, y + 19, lz, 0, 50, 0xffe2a0, false);
    const facho = new THREE.MeshBasicMaterial({ color: 0xffe9b8, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const feixe = new THREE.Group(); feixe.position.set(X(lx), y + 19, Z(lz)); scene.add(feixe);
    [0, Math.PI].forEach(a => { const c = new THREE.Mesh(new THREE.ConeGeometry(4, 46, 12, 1, true), facho); c.rotation.z = Math.PI / 2; c.position.x = 23; const w = new THREE.Group(); w.rotation.y = a; w.add(c); feixe.add(w); });
    feixe.visible = false;
    M.animados.push(dt => { if (feixe.visible) feixe.rotation.y += dt * 0.5; });
    PT.acenderFarol = b => { feixe.visible = b; luz.int = b ? 3.2 : 0; vidro.color.setHex(b ? 0xffe2a0 : 0x2a2418); };
    inter(-61.6, 40, 2.6, () => A2() ? A2().textoFarol() : null, () => A2().farol());
  })();

  /* ---- casas da cidade ---- */
  (function () {
    const cand = [[-15, -10, 0.25], [-19, 2, 1.6], [-17, 12, 1.4], [14, -31, -0.1], [-13, -47, 0.1], [17, -50, 0.2], [30, 5, -1.5], [40, 9, -1.6], [-28, -12, 0.4],
      [-27, 6, 1.3], [26, -32, 0.6], [-25, -44, -0.3], [55, 12, -1.7], [-13, -62, 0.2], [14, -64, -0.2], [62, -26, -1.2], [-62, -16, 1.0], [-38, 10, 1.5]];
    const cores = [MATP.cal, MATP.calE, MATP.ocre, MATP.ocreE];
    cand.forEach(([lx, lz, r], i) => {
      if (distEstrada(lx, lz) < 6) return;
      casa(lx, lz, r, rnd(5, 7), rnd(4.5, 6), rnd(3.6, 5), { mat: cores[i % 4], rh: 2.2, roof: MATP.telha, luz: i % 3 === 0 });
    });
  })();

  /* ---- placas da estrada ---- */
  placa(2.6, -86, Math.PI / 2);
  inter(1.2, -85, 2.6, () => OV.viagem ? OV.viagem.textoPlaca('porto') : 'Voltar ao Vale de Santa Sabina', () => OV.viagem ? OV.viagem.usarPlaca('porto') : (A2() && A2().viajarRegiao('vale')));
  // no vale: a placa da estrada do sul
  (function () {
    const g = M.grupo(3.2, 186, -Math.PI / 2);
    g.add(mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), MAT.wood, 0, 1.15, 0));
    g.add(mesh(new THREE.BoxGeometry(1.7, 0.42, 0.08), MAT.woodL, 0.55, 1.9, 0));
    const p = mesh(new THREE.ConeGeometry(0.24, 0.4, 3), MAT.woodL, 1.5, 1.9, 0); p.rotation.z = -Math.PI / 2; g.add(p);
    M.obstacles.push({ x: 3.2, z: 186, r: 0.25 });
    M.interativo(2.0, 186.6, 2.4, () => A2() ? A2().textoEstradaSul() : null, () => A2().estradaSul());
  })();

  /* ---- vegetação: ciprestes, oliveiras e pedras ---- */
  (function () {
    const dummy = new THREE.Object3D();
    const livre = (lx, lz, m) => {
      if (Math.abs(lx) > 92 || lz < -96 || lz > costa(lx) - 6) return false;
      if (M.reservado && M.reservado(X(lx), Z(lz), m)) return false;
      if (distEstrada(lx, lz) < 3.5 + m) return false;
      for (const p of PLANOS) if (Math.hypot(lx - p.x, lz - p.z) < p.r * 0.8 + m) return false;
      for (const [x, z, w, d] of PT.RECTS) if (Math.abs(lx - x) < w / 2 + 2 + m && Math.abs(lz - z) < d / 2 + 2 + m) return false;
      return true;
    };
    const cip = [], oli = [];
    for (let t = 0; t < 4000 && cip.length + oli.length < 230; t++) {
      const lx = rnd(-92, 92), lz = rnd(-96, 30);
      if (!livre(lx, lz, 0.5)) continue;
      if (lz > -40 && Math.abs(lx) < 60 && Math.random() < 0.7) continue;
      (Math.random() < 0.6 ? cip : oli).push({ x: lx, z: lz, s: rnd(0.8, 1.4), r: rnd(0, 6) });
    }
    if (OV.cenario) {
      // ciprestes, oliveiras, laranjeiras e limoeiros, pinheiros-mansos e amendoeiras em flor
      const lista = cip.concat(oli).map(t => ({ x: X(t.x), z: Z(t.z), s: t.s, r: t.r }));
      OV.cenario.arvoredo(lista, [['cipreste', 4], ['oliveira', 3], ['laranjeira', 2], ['limoeiro', 1.2], ['pinheiroManso', 1.5], ['amendoeira', 1], ['olaia', 0.5]], { H: (x, z) => PT.altura(x, z), semente: 'porto' });
    } else {
    const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.22, 2, 5), sm(0x2a1d14), cip.length + oli.length);
    const cipM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 5.6, 6), sm(0x1a2a1c), cip.length);
    const oliM = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.5, 0), sm(0x4a5a3e), oli.length);
    tronco.castShadow = cipM.castShadow = oliM.castShadow = true;
    let k = 0;
    cip.forEach((t, i) => {
      const y = H(t.x, t.z);
      dummy.position.set(X(t.x), y + 1 * t.s, Z(t.z)); dummy.rotation.set(0, t.r, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix(); tronco.setMatrixAt(k++, dummy.matrix);
      dummy.position.set(X(t.x), y + 4.3 * t.s, Z(t.z)); dummy.updateMatrix(); cipM.setMatrixAt(i, dummy.matrix);
      M.obstacles.push({ x: X(t.x), z: Z(t.z), r: 0.4 * t.s });
      M.copas.push({ x: X(t.x), z: Z(t.z), r: 1.0 * t.s, y0: y + 1.6 * t.s, y1: y + 7 * t.s });
    });
    oli.forEach((t, i) => {
      const y = H(t.x, t.z);
      dummy.position.set(X(t.x), y + 1 * t.s, Z(t.z)); dummy.rotation.set(0, t.r, 0); dummy.scale.setScalar(t.s); dummy.updateMatrix(); tronco.setMatrixAt(k++, dummy.matrix);
      dummy.position.set(X(t.x), y + 2.6 * t.s, Z(t.z)); dummy.scale.set(t.s * 1.2, t.s * 0.8, t.s * 1.2); dummy.updateMatrix(); oliM.setMatrixAt(i, dummy.matrix);
      M.obstacles.push({ x: X(t.x), z: Z(t.z), r: 0.4 * t.s });
      M.copas.push({ x: X(t.x), z: Z(t.z), r: 1.8 * t.s, y0: y + 1.6 * t.s, y1: y + 3.8 * t.s });
    });
    scene.add(tronco); scene.add(cipM); scene.add(oliM);
    }
    // pedras da costa
    const pedras = [];
    for (let i = 0; i < 600 && pedras.length < 90; i++) {
      const lx = rnd(-90, 90), lz = costa(lx) + rnd(-5, 2);
      if (Math.abs(lx - 14) < 4 || Math.abs(lx - 34) < 4 || Math.abs(lx + 6) < 4) continue;
      pedras.push({ x: lx, z: lz, s: rnd(0.4, 1.4) });
    }
    const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MAT.rock, pedras.length); rk.castShadow = true; rk.receiveShadow = true;
    pedras.forEach((p, i) => { dummy.position.set(X(p.x), H(p.x, p.z) + p.s * 0.2, Z(p.z)); dummy.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); dummy.scale.set(p.s, p.s * 0.7, p.s); dummy.updateMatrix(); rk.setMatrixAt(i, dummy.matrix); });
    scene.add(rk);
    // capim seco
    if (OV.cenario) {
      const Cn = OV.cenario;
      Cn.chao({
        area: [X(-90), X(90), Z(-94), Z(26)], casas: M.RECTS, H: (x, z) => PT.altura(x, z), semente: 'chao-porto',
        livre: (x, z, m) => { const lx = x / K, lz = (z - OZ) / K; return lz < costa(lx) - 4 && distEstrada(lx, lz) > 1.8 + m && Math.hypot(lx, lz + 2) > 15; },
        n: { capim: 7000, flores: 1100, arbustos: 360, pedrinhas: 600 },
        paleta: { capim: [0x6a6a2e, 0x7a7234, 0x5a5a28, 0x6a6230, 0x7a6a34], flores: [0xd8283a, 0xd8283a, 0xe8c83a, 0xf2f0e8, 0x7a4ac8, 0xe8743a], arbusto: [0x4a5a3a, 0x3a4a2e, 0x5a6a42], bagas: [0x7a4ac8, 0x9a6ad8, 0xf2f0e8] }
      });
      Cn.calcamento(X(0), Z(-2), 14 * K, { H: (x, z) => PT.altura(x, z), cores: [0x6a6258, 0x5e574e, 0x746c60, 0x625a50, 0x7a7266], tam: 0.85 });
    } else {
    const G = 2600, gr = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.42, 3), sm(0x5a5226), G);
    let n = 0;
    for (let i = 0; i < G * 3 && n < G; i++) {
      const lx = rnd(-90, 90), lz = rnd(-94, 26);
      if (lz > costa(lx) - 4 || distEstrada(lx, lz) < 1.8 || Math.hypot(lx, lz + 2) < 15) continue;
      dummy.position.set(X(lx), H(lx, lz) + 0.15, Z(lz)); dummy.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); dummy.scale.setScalar(rnd(0.7, 1.4)); dummy.updateMatrix();
      gr.setMatrixAt(n++, dummy.matrix);
    }
    gr.count = n; scene.add(gr);
    }
  })();

  /* ---- gente do porto ---- */
  const fig = (lx, lz, rot, op) => M.criarFigura(X(lx), Z(lz), rot, op);
  M.criarFigura(PT.GASPAR.x, PT.GASPAR.z, 0, { id: 'gaspar', nome: 'Frei Gaspar', cor: 0xd8d0c0, capuz: true });
  M.criarFigura(PT.BARAO.x, PT.BARAO.z, 0, { id: 'barao', nome: 'Barão Otávio', cor: 0x5a1420, cabelo: 0x6a5a4a });
  fig(-33, -22.4, Math.PI, { id: 'lucia', nome: 'Lúcia, a cozinheira', cor: 0x6a5a3a, veu: 0xb8a888 });
  fig(-43.5, -30.5, 0.3, { id: 'ana', nome: 'Velha Ana', cor: 0x3a3430, veu: 0x5a5048, sentado: true });
  fig(-38, -34.5, -0.6, { id: 'tiago', nome: 'Tiago', cor: 0x4a5a6a, cabelo: 0x5a3a1a });
  fig(11.6, 29.5, 0.4, { id: 'pedro', nome: 'Mestre Pedro', cor: 0x2a3a4a, cabelo: 0x8a8a80 });
  fig(24.5, -6.6, 0, { id: 'rufino', nome: 'Rufino, o padeiro', cor: 0xa8946a });
  fig(31.5, 31, -0.3, { id: 'marinheiro', nome: 'Marinheiro', cor: 0x3a4a5a, cabelo: 0x1a1210 });
  fig(-62, 44.2, Math.PI, { id: 'nicolau', nome: 'São Nicolau', santo: true, oculto: true });
  M.figuras.tiago.g.scale.setScalar(0.74);

  /* ---- vícios que rondam o porto ---- */
  PT.spawnsMundo = [
    ['corvo', -6, -64, 6], ['corvo', 7, -70, 7, 'forte'], ['corvo', -2, -52, 6], ['corvo', 12, -58, 9, 'elite'], ['corvo', -40, 29, 7], ['corvo', -50, 27, 7, 'forte'],
    ['corvo', 62, -18, 7], ['larva_gula', 52, 24, 6], ['larva_gula', -30, 25, 6], ['larva_gula', 58, 26, 7, 'forte']
  ].map(([t, x, z, n, v]) => [t, X(x), Z(z), n, v]);
})(window.OV);

/* Ordo Virtutum — Ato III: as Minas de Mamom. Região de montanha a oeste (x ≈ −900):
   a cidade mineira de Valdouro, a Boca da Mina, a Galeria Velha, o Acampamento dos Mineiros,
   a Capela de Santa Bárbara no pico e a Grande Cava, onde o ouro é adorado. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.criarRegiao) return;
  const { rnd } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const A3 = () => OV.ato3;
  const gauss = (lx, lz, cx, cz, sx, sz) => Math.exp(-(((lx - cx) ** 2) / (2 * sx * sx) + ((lz - cz) ** 2) / (2 * sz * sz)));
  const CAVA = { x: 0, z: -102, r: 34, fundo: 15 };

  const R = OV.criarRegiao({
    id: 'minas', nome: 'Minas de Mamom', OX: -900, OZ: 0, meio: 170,
    dentro: (x, z) => x < -500 && x > -1350 && z > -450, // v23: ao norte fica a Marca Ardente; a oeste, o Monte Santo
    relevo(lx, lz) {
      let h = 3 + 2.2 * Math.sin(lx * 0.045) * Math.cos(lz * 0.04) + 1.0 * Math.sin(lx * 0.11 + lz * 0.09);
      const bord = Math.max(Math.abs(lx), Math.abs(lz));
      h += smooth(118, 166, bord) * 46;
      h += 22 * gauss(lx, lz, -105, -30, 22, 30);   // o morro da mina
      h += 24 * gauss(lx, lz, 115, -62, 20, 20);    // o pico de Santa Bárbara
      h += 8 * gauss(lx, lz, -128, -58, 14, 14);    // a encosta da Galeria Velha
      return h;
    },
    depois(lx, lz, h) {
      // a Grande Cava: uma cratera de mineração a céu aberto, com o fundo plano
      const d = Math.hypot(lx - CAVA.x, lz - CAVA.z);
      if (d < CAVA.r) h -= CAVA.fundo * (1 - smooth(16, CAVA.r, d));
      // v24: a estrada da serra entra por um desfiladeiro em rampa suave (antes, a chegada ficava num buraco cercado de encosta)
      if (lz > 104) {
        const w = (1 - smooth(9, 20, Math.abs(lx))) * smooth(104, 120, lz);
        if (w > 0) { const rampa = 2.6 + 1.6 * smooth(118, 158, lz); h = h * (1 - w) + rampa * w; }
      }
      return h;
    },
    planos: [
      { x: 0, z: 58, r: 36, h: 3 }, { x: 25, z: 22, r: 12, h: 4.5 }, { x: -78, z: -18, r: 13, h: 9 }, { x: -92, z: 72, r: 17, h: 3.5 },
      { x: 112, z: -60, r: 9, h: 24 }, { x: 0, z: -62, r: 11, h: 5 }, { x: 0, z: 150, r: 10, h: 4 }, { x: -122, z: -56, r: 9, h: 13 }
    ],
    estradas: [
      [[0, 158], [0, 130], [2, 100], [0, 72]],
      [[0, 44], [5, 20], [4, -18], [0, -52]],
      [[-14, 58], [-40, 44], [-62, 22], [-76, -8]],
      [[-80, -24], [-100, -44], [-118, -52]],
      [[-12, 68], [-50, 74], [-82, 72]],
      [[14, 52], [40, 40], [70, 6], [96, -34], [108, -52]],
      [[6, 30], [18, 26]]
    ],
    zonas: [['valdouro', 0, 58, 46], ['contas', 25, 22, 12], ['boca', -78, -18, 18], ['galeria', -122, -56, 12], ['acamp_min', -92, 72, 20], ['barbara', 112, -60, 14], ['cava', 0, -100, 36]],
    locais: {
      valdouro: { nome: 'Valdouro', x: 0, z: 58, oy: -58 },
      contas: { nome: 'Casa de Contas', x: 25, z: 22, oy: -20 },
      boca: { nome: 'Boca da Mina', x: -78, z: -18, oy: -24 },
      galeria: { nome: 'Galeria Velha', x: -122, z: -56, oy: -18 },
      acamp_min: { nome: 'Acampamento dos Mineiros', x: -92, z: 72, oy: 30 },
      barbara: { nome: 'Capela de Santa Bárbara', x: 112, z: -60, oy: -20 },
      cava: { nome: 'A Grande Cava', x: 0, z: -100, oy: 4 }
    },
    entrada: { x: 0, z: 150, facing: Math.PI },
    paleta: { h: 0.09, s: 0.22, l: 0.16, rocha: 0x5e5246, rochaDe: 12, alto: 0x7a7266, altoDe: 30, estrada: 0x5a4632, mapaH: 30, mapaS: 16 },
    corExtra(lx, lz, h, c) {
      const d = Math.hypot(lx - CAVA.x, lz - CAVA.z);
      if (d < CAVA.r + 2) c.lerp(new THREE.Color(0x6a5232), 0.75 * (1 - smooth(CAVA.r - 6, CAVA.r + 2, d)));
      if (d < 17) c.lerp(new THREE.Color(0x4a3a24), 0.6);
    },
    mapaExtra(g, Q, ESC) {
      const [a, b] = Q(CAVA.x, CAVA.z);
      g.fillStyle = 'rgba(20,12,6,.55)'; g.beginPath(); g.arc(a, b, 26 * ESC, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(201,162,74,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(a, b, CAVA.r * ESC, 0, Math.PI * 2); g.stroke();
    }
  });
  OV.minas = R;
  R.CAVA = CAVA;
  const H = R.H, W = R.W;
  const loc = p => ({ x: p.x - R.OX, z: p.z - R.OZ }); // de coordenadas do mundo para locais
  const MATM = {
    pinho: sm(0x5a4028), pedraEscura: sm(0x3e3630), ouro: sm(0xc9a24a, { metalness: 0.85, roughness: 0.3, emissive: 0x2a1a00 }),
    lona: sm(0x8a7a5a, { side: THREE.DoubleSide }), lonaE: sm(0x6a5a40, { side: THREE.DoubleSide }), carvao: sm(0x1a1614), trilho: sm(0x3a3a3e, { metalness: 0.5, roughness: 0.5 }),
    telhaA: sm(0x4a2a22), cal: sm(0x8a8070), calE: sm(0x726a5c), cadeado: sm(0x8a7a3a, { metalness: 0.7, roughness: 0.4 })
  };
  R.MAT = MATM;

  /* ================= VALDOURO ================= */
  const VC = { x: 0, z: 58 };
  const pos = (a, r) => ({ x: VC.x + Math.cos(a * Math.PI / 180) * r, z: VC.z + Math.sin(a * Math.PI / 180) * r });
  const rotC = q => Math.atan2(VC.x - q.x, VC.z - q.z);
  (function () {
    const y0 = R.praca(VC.x, VC.z, 14);
    // o poço trancado: Fúlvio cobra até pela água
    const pg = R.grupo(VC.x, VC.z, 0);
    pg.add(mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.9, 12), MAT.col, 0, 0.45, 0));
    pg.add(mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 12), MAT.dark, 0, 0.92, 0));
    [-1, 1].forEach(s => pg.add(mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), MAT.wood, s * 1.25, 1.1, 0)));
    pg.add(mesh(new THREE.BoxGeometry(2.7, 0.16, 0.16), MAT.wood, 0, 2.2, 0));
    const tampa = mesh(new THREE.BoxGeometry(2.3, 0.1, 2.3), MAT.woodL, 0, 0.98, 0); pg.add(tampa);
    const cad = mesh(new THREE.BoxGeometry(0.3, 0.36, 0.14), MATM.cadeado, 0, 1.12, 1.18); pg.add(cad);
    const corrente = mesh(new THREE.TorusGeometry(0.9, 0.04, 4, 18), MAT.iron, 0, 1.02, 0); corrente.rotation.x = Math.PI / 2; pg.add(corrente);
    R.obst(VC.x, VC.z, 1.7);
    R.poco = { abrir() { tampa.visible = false; cad.visible = false; corrente.visible = false; }, fechar() { tampa.visible = true; cad.visible = true; corrente.visible = true; } };
    R.inter(VC.x, VC.z + 2.4, 2.4, () => A3() ? A3().textoPoco() : null, () => A3().poco());

    // Igreja de São Lourenço (com interior)
    const iq = pos(245, 27), ir = rotC(iq);
    const ig = M.casaInterior(iq.x + R.OX, iq.z + R.OZ, ir, 12, 19, 8, { mat: MATM.cal, roof: MATM.telhaA, rh: 4, piso: MAT.stone, nome: 'Igreja de São Lourenço' });
    R.RECTS.push([iq.x, iq.z, 12, 19, ir]);
    M.mobilia(ig, 'altar', 0, -7.4, 0);
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.5, -3.4 + k * 2.4, 0));
    // a grelha de São Lourenço, pendurada atrás do altar
    const gr = new THREE.Group(); gr.position.set(0, 3.4, -9.2); ig.g.add(gr);
    gr.add(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), MAT.iron, 0, 0.6, 0)); gr.add(mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), MAT.iron, 0, -0.6, 0));
    for (let i = 0; i < 6; i++) gr.add(mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), MAT.iron, -0.6 + i * 0.24, 0, 0));
    gr.add(mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), MAT.iron, 0, 0.9, 0));
    const tw = ig.W(-7.2, 6.5); const torre = M.grupo(tw.x, tw.z, ir);
    torre.add(mesh(new THREE.BoxGeometry(3.4, 14, 3.4), MATM.cal, 0, 7, 0));
    const tc = mesh(new THREE.ConeGeometry(2.7, 4, 4), MATM.telhaA, 0, 16, 0); tc.rotation.y = Math.PI / 4; torre.add(tc);
    torre.add(mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), MAT.gold, 0, 18.6, 0)); torre.add(mesh(new THREE.BoxGeometry(0.6, 0.16, 0.16), MAT.gold, 0, 18.8, 0));
    // a lanterna da torre: aqui vai arder a Lâmpada da Generosidade
    const lanterna = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.4), new THREE.MeshBasicMaterial({ color: 0x2a2018 })); lanterna.position.set(0, 12.2, 0); torre.add(lanterna);
    const luzTorre = M.emissor(tw.x, H(iq.x, iq.z) + 12.5, tw.z, 0, 40, 0xffd890, false);
    R.acenderLampada = b => { lanterna.material.color.setHex(b ? 0xffe2a0 : 0x2a2018); luzTorre.int = b ? 3 : 0; };
    M.caixa(tw.x, tw.z, 1.8, 1.8, ir);
    const porta = ig.W(0, 11.4);
    M.interativo(porta.x, porta.z, 2.6, () => A3() ? A3().textoIgreja() : null, () => A3().igreja());
    R.ELIAS = loc(ig.W(0, -4.6)); R.IGREJA_ROT = ir;

    // Casa da Viúva Rosa
    const rq = pos(300, 25), rr = rotC(rq);
    const rc = M.casaInterior(rq.x + R.OX, rq.z + R.OZ, rr, 8, 7, 4.6, { mat: MATM.calE, roof: MATM.telhaA, nome: 'Casa da Viúva Rosa', rh: 2.6 });
    R.RECTS.push([rq.x, rq.z, 8, 7, rr]);
    M.mobilia(rc, 'lareira', 0, -3, 0); M.mobilia(rc, 'cama', -2.6, -1, 0); M.mobilia(rc, 'mesa', 2.2, 0.6);
    R.ROSA = loc(rc.W(0.8, -1.2)); R.ROSA_ROT = rr;
    // Padaria de Joana
    const pq = pos(40, 24), pr = rotC(pq);
    const pc = M.casaInterior(pq.x + R.OX, pq.z + R.OZ, pr, 8, 7, 4.6, { mat: MATM.cal, roof: MATM.telhaA, nome: 'Padaria de Joana', rh: 2.6 });
    R.RECTS.push([pq.x, pq.z, 8, 7, pr]);
    M.mobilia(pc, 'lareira', -2, -3, 0); M.mobilia(pc, 'mesa', 1.2, -0.6); M.mobilia(pc, 'prateleira', 3.3, 0.8, -Math.PI / 2);
    R.JOANA = loc(pc.W(-0.6, 0.4)); R.JOANA_ROT = pr;

    // casas trancadas: cada porta com o seu cadeado
    const cadeado = (x, z, rot, d) => { const p = M.frente(x + R.OX, z + R.OZ, rot, d / 2 + 0.12); scene.add(mesh(new THREE.BoxGeometry(0.22, 0.28, 0.1), MATM.cadeado, p.x, H(x, z) + 1.0, p.z)); };
    [[15, 9], [65, 8], [115, 8], [160, 9], [222, 8]].forEach(([a, w], i) => {
      const q = pos(a, 25), r = rotC(q), d = 6.5 + (i % 2);
      R.casa(q.x, q.z, r, w, d, 4.4 + (i % 3) * 0.5, { mat: [MATM.cal, MATM.calE][i % 2], roof: MATM.telhaA, rh: 2.4, luz: i % 2 === 0 }); cadeado(q.x, q.z, r, d);
    });
    [[20, 9], [55, 9], [110, 10], [160, 9], [200, 9], [228, 8]].forEach(([a, w], i) => {
      const q = pos(a, 43), r = rotC(q), d = 7;
      R.casa(q.x, q.z, r, w, d, 4.8 + (i % 2) * 0.6, { mat: [MATM.calE, MATM.cal][i % 2], roof: MATM.telhaA, rh: 2.6, luz: i % 3 === 0 }); cadeado(q.x, q.z, r, d);
    });
    [30, 90, 150, 210, 270, 330].forEach(a => { const q = pos(a + 15, 15.5); R.lanterna(q.x, q.z); });
    const oq = pos(120, 11.5); R.oratorio('valdouro', 'Oratório de Valdouro', oq.x, oq.z, rotC(oq));
    R.CAPELA = pos(255, 45);
  })();

  /* ================= CASA DE CONTAS DE FÚLVIO ================= */
  (function () {
    const crot = Math.atan2(VC.x - 25, VC.z - 22);
    const cc = R.casaInt(25, 22, crot, 14, 11, 6.6, { mat: MATM.calE, roof: MATM.telhaA, rh: 3.2, nome: 'Casa de Contas de Mestre Fúlvio' });
    M.mobilia(cc, 'mesa', -2.4, -2); M.mobilia(cc, 'mesa', 2.4, -2); M.mobilia(cc, 'prateleira', -6.1, 0, Math.PI / 2); M.mobilia(cc, 'prateleira', 6.1, 0, -Math.PI / 2); M.mobilia(cc, 'lareira', 0, -4.8);
    // pilhas de moedas e uma balança sobre as mesas
    [[-2.4, -2], [2.4, -2]].forEach(([x, z]) => { for (let i = 0; i < 5; i++) { const m = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05 + i * 0.03, 8), MATM.ouro, x - 0.5 + i * 0.25, 1.05 + i * 0.015, z); cc.g.add(m); } });
    const bal = new THREE.Group(); bal.position.set(0, 0.2, 2.6); cc.g.add(bal);
    bal.add(mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.6, 6), MATM.ouro, 0, 0.8, 0)); bal.add(mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), MATM.ouro, 0, 1.6, 0));
    [-0.65, 0.65].forEach(x => bal.add(mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.06, 10), MATM.ouro, x, 1.2, 0)));
    R.FULVIO = { x: cc.W(0, -3.2).x - R.OX, z: cc.W(0, -3.2).z - R.OZ }; R.FULVIO_ROT = crot;
    R.lanterna(18, 30); R.lanterna(31, 31);
  })();

  /* ================= A BOCA DA MINA ================= */
  (function () {
    const bx = -84, bz = -24, rot = 0.78; // a entrada escavada no morro, virada para a cidade
    const g = R.grupo(bx, bz, rot);
    g.add(mesh(new THREE.BoxGeometry(5.4, 5.2, 4), MATM.pedraEscura, 0, 2.6, -1.6));
    g.add(mesh(new THREE.BoxGeometry(3.4, 3.4, 0.4), MAT.dark, 0, 1.7, 0.45));
    [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.4, 3.8, 0.4), MATM.pinho, s * 1.9, 1.9, 0.7)));
    g.add(mesh(new THREE.BoxGeometry(4.6, 0.45, 0.5), MATM.pinho, 0, 3.9, 0.7));
    const tab = mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08), MAT.woodL, 0, 4.5, 0.75); g.add(tab);
    // trilhos e vagonetes
    for (let k = 0; k < 7; k++) { const z = 1.4 + k * 1.3; [-0.55, 0.55].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 1.3), MATM.trilho, x, 0.05, z))); g.add(mesh(new THREE.BoxGeometry(1.5, 0.06, 0.18), MATM.pinho, 0, 0.02, z)); }
    const vag = (x, z, r) => { const v = R.grupo(x, z, r); v.add(mesh(new THREE.BoxGeometry(1.2, 0.8, 1.6), MAT.iron, 0, 0.7, 0)); v.add(mesh(new THREE.BoxGeometry(1.0, 0.3, 1.4), MATM.carvao, 0, 1.05, 0)); [-0.6, 0.6].forEach(zz => [-0.62, 0.62].forEach(xx => v.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8), MAT.iron, xx, 0.25, zz)).children)); R.obst(x, z, 0.9); };
    vag(-79.5, -17.5, rot); vag(-74, -22, rot + 1.2);
    const p = M.frente(bx, bz, rot, 1); R.caixa(bx, bz, 2.8, 2.6, rot);
    R.RECTS.push([bx, bz, 5.4, 5, rot]);
    // o escritório da mina, com o livro-razão
    const of = R.casaInt(-66, -26, rot + 0.3, 6, 5, 3.8, { mat: MATM.calE, roof: MATM.telhaA, rh: 2, nome: 'Escritório da Mina' });
    M.mobilia(of, 'mesa', 0, -1.2); M.mobilia(of, 'barris', 2, 1.2);
    const lv = of.W(0, -1.2); scene.add(mesh(new THREE.BoxGeometry(0.4, 0.08, 0.3), sm(0x5a1a14), lv.x, H(-66, -26) + 1.1, lv.z));
    const li = of.W(0, 0.2); M.interativo(li.x, li.z, 1.6, () => A3() ? A3().textoLivro() : null, () => A3().livro());
    R.braseiro = (lx, lz) => {
      const y = H(lx, lz), gg = R.grupo(lx, lz, 0);
      [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; const pe = mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), MAT.iron, Math.cos(a) * 0.32, 0.55, Math.sin(a) * 0.32); gg.add(pe); });
      gg.add(mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.32, 8), MAT.iron, 0, 1.2, 0));
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 6), MAT.flame); f.position.set(0, 1.7, 0); gg.add(f); M.flames.push(f);
      R.emissor(lx, y + 2.2, lz, 1.4, 11, 0xff8a3a); R.obst(lx, lz, 0.6);
    };
    R.braseiro(-72, -12); R.braseiro(-86, -12);
    R.oratorio('boca', 'Oratório da Boca da Mina', -70, -4, Math.PI * 0.85);
    R.BOCA = { x: -78, z: -14 };
  })();

  /* ================= A GALERIA VELHA ================= */
  (function () {
    const g = R.grupo(-126, -60, 0.9);
    g.add(mesh(new THREE.BoxGeometry(4.6, 4.2, 3), MATM.pedraEscura, 0, 2.1, -1));
    g.add(mesh(new THREE.BoxGeometry(2.8, 2.6, 0.4), MAT.dark, 0, 1.3, 0.55));
    const tr = mesh(new THREE.BoxGeometry(3.6, 0.35, 0.4), MATM.pinho, 0, 2.9, 0.75); tr.rotation.z = 0.35; g.add(tr);
    [[-0.8, 0.4, 1.4, 0.9], [0.6, 0.3, 1.8, 0.7], [0.1, 0.9, 1.2, 0.6], [1.3, 0.25, 1.1, 0.5]].forEach(([x, y, z, s]) => { const p = mesh(new THREE.DodecahedronGeometry(s, 0), MAT.rock, x, y, z); p.rotation.set(rnd(0, 3), rnd(0, 3), 0); g.add(p); });
    R.caixa(-126, -60, 2.4, 2, 0.9); R.RECTS.push([-126, -60, 4.6, 4, 0.9]);
    const q = M.frente(-126 + R.OX, -60 + R.OZ, 0.9, 3.3);
    M.interativo(q.x, q.z, 2.2, () => A3() ? A3().textoGaleria() : null, () => A3().galeria());
    R.GALERIA = { x: q.x - R.OX, z: q.z - R.OZ };
  })();

  /* ================= O ACAMPAMENTO DOS MINEIROS ================= */
  (function () {
    const cx = -92, cz = 72;
    [[-8, -6, 0.3], [6, -8, -0.5], [10, 4, 1.4], [-10, 6, 2.2], [0, 10, 3.0], [-3, -11, 0.1]].forEach(([dx, dz, r], i) => {
      const x = cx + dx, z = cz + dz;
      const t = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.8, 4, 1, true), i % 2 ? MATM.lona : MATM.lonaE); t.position.set(x + R.OX, H(x, z) + 1.4, z + R.OZ); t.rotation.y = r; scene.add(t);
      R.obst(x, z, 1.7);
    });
    const y = H(cx, cz);
    scene.add(mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.25, 10), MAT.rock, cx + R.OX, y + 0.12, cz + R.OZ));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.0, 6), MAT.flame); f.position.set(cx + R.OX, y + 0.6, cz + R.OZ); scene.add(f); M.flames.push(f);
    R.emissor(cx, y + 1.4, cz, 1.6, 12, 0xff8a3a); R.obst(cx, cz, 1.1);
    // uma panela vazia sobre o fogo
    scene.add(mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.5, 10), MAT.iron, cx + 1.8 + R.OX, y + 0.25, cz + 1 + R.OZ)); R.obst(cx + 1.8, cz + 1, 0.6);
    R.BRAS = { x: cx + 2.5, z: cz - 2.5 };
  })();

  /* ================= A CAPELA DE SANTA BÁRBARA ================= */
  (function () {
    const cx = 112, cz = -60, rot = -0.5;
    const c = R.casa(cx, cz, rot, 6, 8, 5, { mat: MATM.cal, roof: MATM.telhaA, rh: 2.8, luz: true });
    const tl = { x: cx + (-4.4) * Math.cos(rot) + (-2) * Math.sin(rot), z: cz - (-4.4) * Math.sin(rot) + (-2) * Math.cos(rot) };
    const t = R.grupo(tl.x, tl.z, rot); t.add(mesh(new THREE.BoxGeometry(2.4, 9, 2.4), MATM.cal, 0, 4.5, 0));
    const tc = mesh(new THREE.ConeGeometry(2, 3, 4), MATM.telhaA, 0, 10.5, 0); tc.rotation.y = Math.PI / 4; t.add(tc);
    t.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.8, 8), MAT.gold, 0, 7.6, 0));
    R.obst(tl.x, tl.z, 1.6);
    const fr = M.frente(cx, cz, rot, 6.4);
    R.VISAO = { x: fr.x, z: fr.z };
    R.inter(fr.x, fr.z, 2.6, () => A3() ? A3().textoCapela() : null, () => A3().capelaBarbara());
    const oq = M.frente(cx, cz, rot + 0.8, 7.5); R.oratorio('barbara', 'Oratório de Santa Bárbara', oq.x, oq.z, rot + 0.5);
  })();

  /* ================= A GRANDE CAVA ================= */
  (function () {
    // o Cofre Grande, à beira da cratera
    const vx = 16, vz = -66;
    const v = R.casa(vx, vz, -0.4, 7, 7, 6, { mat: MATM.pedraEscura, roof: MATM.telhaA, rh: 1.6, semOrnato: true });
    const pf = M.frente(vx + R.OX, vz + R.OZ, -0.4, 3.62);
    const portaCofre = mesh(new THREE.BoxGeometry(2, 2.6, 0.2), MAT.iron, pf.x, H(vx, vz) + 1.3, pf.z); portaCofre.rotation.y = -0.4; scene.add(portaCofre);
    R.portaCofre = b => { portaCofre.visible = !b; };
    const pi = M.frente(vx + R.OX, vz + R.OZ, -0.4, 5.2);
    M.interativo(pi.x, pi.z, 2.4, () => A3() ? A3().textoCofre() : null, () => A3().cofreGrande());
    // o pedestal do ídolo, no fundo da cava
    const fy = H(CAVA.x, CAVA.z);
    const ped = R.grupo(CAVA.x, CAVA.z - 6, 0, fy);
    ped.add(mesh(new THREE.CylinderGeometry(2.8, 3.4, 1.2, 10), MATM.pedraEscura, 0, 0.6, 0));
    ped.add(mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 10), MATM.ouro, 0, 1.3, 0));
    // um bezerro de ouro sobre o pedestal: o ídolo de Mamom
    const idolo = new THREE.Group(); idolo.position.set(0, 1.45, 0); ped.add(idolo);
    const corpo = mesh(new THREE.BoxGeometry(1.0, 1.0, 2.0), MATM.ouro, 0, 1.2, 0); idolo.add(corpo);
    idolo.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.8), MATM.ouro, 0, 1.6, 1.3));
    [-1, 1].forEach(s => { const c2 = mesh(new THREE.ConeGeometry(0.1, 0.6, 5), MATM.ouro, 0.32 * s, 2.15, 1.3); c2.rotation.z = -0.6 * s; idolo.add(c2); });
    [[-0.35, -0.7], [0.35, -0.7], [-0.35, 0.7], [0.35, 0.7]].forEach(([x, z]) => idolo.add(mesh(new THREE.BoxGeometry(0.22, 0.75, 0.22), MATM.ouro, x, 0.38, z)));
    R.idolo = b => { idolo.visible = b; };
    R.obst(CAVA.x, CAVA.z - 6, 3.4);
    R.ARENA = { x: CAVA.x, z: CAVA.z + 3 };
    // tochas na rampa e montes de ouro no fundo
    [[-6, -70], [6, -72], [-10, -82], [10, -84]].forEach(([x, z]) => R.lanterna(x, z, 0xffb050));
    for (let i = 0; i < 14; i++) { const a = rnd(0, 6.28), r = rnd(9, 15), x = CAVA.x + Math.cos(a) * r, z = CAVA.z + Math.sin(a) * r; const m = mesh(new THREE.ConeGeometry(rnd(0.4, 0.9), rnd(0.3, 0.7), 6), MATM.ouro, x + R.OX, H(x, z) + 0.15, z + R.OZ); scene.add(m); }
    R.oratorio('cava', 'Oratório da Grande Cava', -8, -60, Math.PI);
  })();

  /* ---- a placa da estrada, na chegada ---- */
  R.placa(4, 146, -Math.PI / 2);
  R.inter(3, 147.5, 2.4, () => OV.viagem ? OV.viagem.textoPlaca('minas') : null, () => OV.viagem && OV.viagem.usarPlaca('minas'));

  /* ---- pinheiros nas encostas, pedras e capim seco ---- */
  R.vegetacao({
    arvores: 520, espaco: 4.6, esc: [0.9, 1.5], alto: 1.5, copaAlta: 1.2, yCopa: 3.4, corCopa: 0x1a2a1e, corTronco: 0x2a1d14,
    densidade: (lx, lz) => { const h = R.relevo(lx, lz); return Math.hypot(lx - CAVA.x, lz - CAVA.z) < CAVA.r + 4 ? 0 : h > 40 ? 0.15 : h > 8 ? 0.9 : 0.25; },
    pedras: 160, capim: 3400, corCapim: 0x6a5a2a,
    especies: [['abeto', 4], ['pinheiro', 3], ['seca', 1.2], ['betula', 1], ['carvalho', 0.6]],
    chao: { n: { flores: 380, arbustos: 260, cogumelos: 80, samambaias: 260 },
      paleta: { capim: [0x6a5a2a, 0x5a5228, 0x4a4a24, 0x6a6230], flores: [0xf2f0e8, 0x7a4ac8, 0xe8c83a, 0x9a6ad8], arbusto: [0x2a3a22, 0x34442a, 0x3a3a26], bagas: [0x2a2a6a, 0xb8241a] } },
    semCapim: (lx, lz) => Math.hypot(lx - VC.x, lz - VC.z) < 15 || Math.hypot(lx - CAVA.x, lz - CAVA.z) < CAVA.r
  });

  /* ---- gente de Valdouro ---- */
  const fig = (lx, lz, rot, op) => R.fig(lx, lz, rot, op);
  const at = (q, rot, op) => M.criarFigura(q.x + R.OX, q.z + R.OZ, rot, op);
  at(R.ELIAS, R.IGREJA_ROT, { id: 'elias', nome: 'Padre Elias', cor: 0x16120f, cabelo: 0x5a5048 });
  at(R.ROSA, R.ROSA_ROT, { id: 'rosa', nome: 'Viúva Rosa', cor: 0x1a1614, veu: 0x0e0c0a, sentado: true });
  at(R.JOANA, R.JOANA_ROT, { id: 'joana', nome: 'Joana, a padeira', cor: 0x8a7a5a, veu: 0xc8b89a });
  at(R.FULVIO, R.FULVIO_ROT, { id: 'fulvio', nome: 'Mestre Fúlvio', cor: 0x3a2a12, cabelo: 0x8a8a80 });
  fig(R.BRAS.x, R.BRAS.z, 2.4, { id: 'bras', nome: 'Brás, o capataz', cor: 0x4a3a2a, cabelo: 0x1a1210 });
  fig(R.VISAO.x - 1.5, R.VISAO.z - 1.5, 0.8, { id: 'lourenco', nome: 'São Lourenço', santo: true, oculto: true });
  // moradores e mineiros
  R.MORADORES = [
    [VC.x + 6, VC.z + 8, 0.4, { id: 'mor_minas1', nome: 'Mineiro cansado', cor: 0x3a342c, cabelo: 0x1a1612 }, 'Trabalhei a vida inteira lá embaixo. E não tenho nada.', 'Dizem que no fundo da Cava há um bezerro de ouro. Quem olha para ele não consegue mais sair.'],
    [VC.x - 9, VC.z - 6, 2.1, { id: 'mor_minas2', nome: 'Mulher da praça', cor: 0x5a3a2a, veu: 0x7a6a54 }, 'Até a água do poço tem dono agora. Mestre Fúlvio guarda a chave.', 'Ninguém empresta nada a ninguém em Valdouro. Cada um tranca a sua porta.'],
    [-88, 66, 1.2, { id: 'mor_minas3', nome: 'Mineiro jovem', cor: 0x4a3e30, cabelo: 0x3a2a1a }, 'O capataz Brás é o único que ainda divide o pão com a gente.', 'Na Galeria Velha ainda tem gente que nunca voltou.']
  ];

  /* ---- vícios pelos caminhos (nível 9 a 14) ---- */
  R.spawnsMundo = [
    ['escaravelho', 2, 118, 9], ['escaravelho', -3, 108, 9], ['escaravelho', 4, 96, 10, 'forte'],
    ['escaravelho', -48, 40, 10], ['escaravelho', -56, 30, 10], ['mineiro', -60, 24, 10, 'forte'],
    ['golem', 50, 26, 11], ['escaravelho', 74, 4, 11], ['escaravelho', 80, -2, 11, 'forte'], ['golem', 92, -30, 12, 'elite'],
    ['escaravelho', -104, -42, 12], ['mineiro', -110, -48, 12, 'elite'],
    ['escaravelho', 4, -10, 11], ['golem', 6, -30, 12, 'forte'], ['escaravelho', -6, -40, 12],
    ['escaravelho', -60, 74, 10], ['diabrete', -40, 80, 10, 'forte'], ['diabrete', 30, 112, 9], ['diabrete', -30, 120, 9]
  ].map(([t, x, z, n, v]) => [t, x + R.OX, z + R.OZ, n, v]);
})(window.OV);

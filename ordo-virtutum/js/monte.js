/* Ordo Virtutum — Ato VII: o Monte Santo. Região a oeste (centro em −1800, 0).
   Ao sul, o deserto e o Mosteiro da Sarça, de rito oriental, com a sarça que arde sem se consumir.
   Ao norte, o monte: a Escada de São João Clímaco sobe em três degraus até o cume, onde Moisés tirou as sandálias.
   Atrás do cume, num platô, a Torre negra que Nemrod ergueu para o Príncipe da Soberba: «façamos uma torre cujo
   topo chegue ao céu, e façamos um nome para nós» (Gn 11,4). A luta é no alto dela, acima das nuvens. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.criarRegiao) return;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  const A7 = () => OV.ato7;
  const MOST = { x: 0, z: 92 };                    // o Mosteiro da Sarça
  const IGREJA = { x: -9, z: 84 }, OFICINA = { x: 12, z: 85 };
  const SARCA = { x: -11, z: 101 };
  const TENDAS = { x: -52, z: 104 };
  const DEGRAUS = [{ id: 'degrau1', nome: 'Oratório da Renúncia', x: 40, z: 40 }, { id: 'degrau2', nome: 'Oratório da Obediência', x: -35, z: 5 }, { id: 'degrau3', nome: 'Oratório da Humildade', x: 40, z: -30 }];
  const CUME = { x: 0, z: -60, h: 46 };
  const TORRE = { x: 0, z: -118, r: 12, alt: 52, h: 44 };
  const PEDREIRA = { x: 72, z: -88 };
  const TOPO = TORRE.h + TORRE.alt + 0.4;            // a altura do chão no alto da Torre
  const naTorre = (lx, lz) => Math.hypot(lx - TORRE.x, lz - TORRE.z) < TORRE.r - 0.3;
  const noAlto = () => { const a = A7(); return !!(a && a.noAlto); };
  const montanha = (lx, lz) => { const d = Math.hypot(lx * 0.9, lz + 75); const k = Math.max(0, Math.min(1, 1 - (d - 12) / 150)); return 46 * Math.pow(k, 1.2); };

  const R = OV.criarRegiao({
    id: 'monte', nome: 'Monte Santo', OX: -1800, OZ: 0, meio: 170,
    dentro: (x, z) => x <= -1350,
    relevo(lx, lz) {
      let h = 2.2 + 0.9 * Math.sin(lx * 0.05 + 0.3) * Math.cos(lz * 0.043) + 0.5 * Math.sin(lx * 0.11 - lz * 0.07); // as dunas
      const m = montanha(lx, lz);
      h += m + (m / 46) * (2.6 * Math.sin(lx * 0.09 + lz * 0.05) + 1.6 * Math.cos(lx * 0.17 - lz * 0.12)); // a pedra do monte, rachada
      const bord = Math.max(Math.abs(lx), Math.abs(lz));
      h += smooth(126, 166, bord) * 24;
      return h;
    },
    depois(lx, lz, h) {
      // no alto da Torre, o chão é a laje do terraço
      if (noAlto() && naTorre(lx, lz)) return TOPO;
      return h;
    },
    // no alto da Torre ninguém passa do parapeito
    limitar(lx, lz) {
      if (!noAlto()) return null;
      const d = Math.hypot(lx - TORRE.x, lz - TORRE.z), R0 = TORRE.r - 1.4;
      if (d <= R0 || d > TORRE.r + 2.5) return null;
      const k = R0 / (d || 1); return [TORRE.x + (lx - TORRE.x) * k, TORRE.z + (lz - TORRE.z) * k];
    },
    planos: [
      { x: MOST.x, z: MOST.z, r: 34, h: 3.2 }, { x: TENDAS.x, z: TENDAS.z, r: 14, h: 3 }, { x: 0, z: 140, r: 14, h: 2.6 },
      ...DEGRAUS.map(d => ({ x: d.x, z: d.z, r: 9, h: Math.round(montanha(d.x, d.z)) })),
      { x: CUME.x, z: CUME.z, r: 18, h: CUME.h }, { x: TORRE.x, z: TORRE.z, r: 26, h: TORRE.h }, { x: 0, z: -90, r: 12, h: 45 },
      { x: PEDREIRA.x, z: PEDREIRA.z, r: 15, h: Math.round(montanha(PEDREIRA.x, PEDREIRA.z)) }
    ],
    estradas: [
      [[0, 158], [0, 112]],
      [[0, 72], [20, 58], [40, 40]],
      [[40, 40], [10, 24], [-35, 5]],
      [[-35, 5], [0, -12], [40, -30]],
      [[40, -30], [20, -48], [0, -60]],
      [[0, -64], [0, -104]],
      [[-14, 104], [-40, 104]],
      [[22, -42], [50, -70], [70, -86]]
    ],
    zonas: [['sarca', MOST.x, MOST.z, 24], ['cume', CUME.x, CUME.z, 16], ['torre', TORRE.x, TORRE.z, 24], ['pedreira', PEDREIRA.x, PEDREIRA.z, 16], ['subida', 0, -10, 72]],
    locais: {
      sarca: { nome: 'Mosteiro da Sarça', x: MOST.x, z: MOST.z, oy: -40 },
      subida: { nome: 'Escada de São João Clímaco', x: 0, z: 10, oy: -30 },
      cume: { nome: 'Cume do Monte Santo', x: CUME.x, z: CUME.z, oy: -20 },
      torre: { nome: 'A Torre', x: TORRE.x, z: TORRE.z, oy: -30 },
      pedreira: { nome: 'Pedreira de Nemrod', x: PEDREIRA.x, z: PEDREIRA.z, oy: -18 }
    },
    entrada: { x: 0, z: 150, facing: Math.PI },
    paleta: { h: 0.09, s: 0.32, l: 0.34, rocha: 0x8a7a64, rochaDe: 10, estrada: 0xb8a07a, mapaH: 36, mapaS: 30 },
    corExtra(lx, lz, h, c) {
      const m = montanha(lx, lz); if (m > 6) c.lerp(new THREE.Color(0x7a6656), Math.min(0.75, (m - 6) / 30));
      if (Math.hypot(lx - TORRE.x, lz - TORRE.z) < TORRE.r + 10) c.lerp(new THREE.Color(0x2a2626), 0.5);
    },
    mapaExtra(g, Q, ESC) {
      const [a, b] = Q(TORRE.x, TORRE.z); g.fillStyle = 'rgba(30,26,28,.95)'; g.beginPath(); g.arc(a, b, TORRE.r * ESC, 0, Math.PI * 2); g.fill();
      const [c, d] = Q(CUME.x, CUME.z); g.fillStyle = 'rgba(240,230,210,.9)'; g.beginPath(); g.arc(c, d, Math.max(2, 3 * ESC), 0, Math.PI * 2); g.fill();
      const [e, f] = Q(MOST.x - 22, MOST.z - 18); g.strokeStyle = 'rgba(220,210,190,.95)'; g.lineWidth = 3; g.strokeRect(e, f, 44 * ESC, 36 * ESC);
    }
  });
  OV.monte = R;
  Object.assign(R, { MOST, IGREJA, OFICINA, SARCA, TENDAS, DEGRAUS, CUME, TORRE, PEDREIRA, TOPO, TELHA: '#8a6a4a' });
  R.naTorre = naTorre;
  if (OV.inimigos && OV.inimigos.CENTROS) OV.inimigos.CENTROS.push({ x: MOST.x + R.OX, z: MOST.z + R.OZ }, { x: 0 + R.OX, z: 140 + R.OZ });
  const H = R.H;
  const X = lx => lx + R.OX, Z = lz => lz + R.OZ;
  const loc = p => ({ x: p.x - R.OX, z: p.z - R.OZ });
  const virarPara = (q, c) => Math.atan2(c.x - q.x, c.z - q.z);
  const MATS = {
    cal: sm(0xe8dcc4), pedra: sm(0xc8b89a, { roughness: 1 }), pedraE: sm(0x9a8a6e, { roughness: 1 }), negra: sm(0x221e22, { roughness: 0.8, metalness: 0.2 }), negraE: sm(0x161214, { roughness: 0.9 }),
    telha: sm(0x8a5a3a), ouro: sm(0xd8b048, { metalness: 0.7, roughness: 0.3 }), azul: sm(0x2a4a7a), lona: sm(0x6a4a3a, { side: THREE.DoubleSide }), lonaC: sm(0xb89a6a, { side: THREE.DoubleSide }), folha: sm(0x4a6a2a)
  };
  R.MAT = MATS;

  /* ================= O MOSTEIRO DA SARÇA ================= */
  (function () {
    // os muros do mosteiro, altos como os de uma fortaleza: foi sempre assim no deserto
    const S = { x0: -22, x1: 22, z0: 74, z1: 110 }, alto = 9, t = 1.4;
    const parede = (lx0, lz0, lx1, lz1) => {
      const cx = (lx0 + lx1) / 2, cz = (lz0 + lz1) / 2, lw = Math.abs(lx1 - lx0) || t, ld = Math.abs(lz1 - lz0) || t, comp = Math.max(lw, ld), aoX = lw > ld;
      const g = R.grupo(cx, cz, 0); g.add(mesh(new THREE.BoxGeometry(lw, alto, ld), MATS.pedra, 0, alto / 2 - 0.8, 0));
      const n = Math.floor(comp / 2.4); for (let k = 0; k < n; k++) { const o = -comp / 2 + 1.2 + k * 2.4; g.add(mesh(new THREE.BoxGeometry(aoX ? 1.0 : t + 0.1, 0.6, aoX ? t + 0.1 : 1.0), MATS.pedraE, aoX ? o : 0, alto - 0.5, aoX ? 0 : o)); }
      if (OV.cenario) OV.cenario.fundir(g); R.caixa(cx, cz, lw / 2, ld / 2, 0);
    };
    parede(S.x0, S.z0, -3, S.z0); parede(3, S.z0, S.x1, S.z0);             // o portão do norte, para a subida
    parede(S.x0, S.z1, -3.5, S.z1); parede(3.5, S.z1, S.x1, S.z1);         // o portão do sul, para a estrada
    parede(S.x0, S.z0, S.x0, S.z1); parede(S.x1, S.z0, S.x1, S.z1);
    [[-1, 0], [1, 0]].forEach(([s]) => [S.z0, S.z1].forEach(z => { const g = R.grupo(s * 3.6, z, 0); g.add(mesh(new THREE.BoxGeometry(2, alto + 2, 2), MATS.pedra, 0, (alto + 2) / 2 - 0.8, 0)); if (OV.cenario) OV.cenario.fundir(g); R.caixa(s * 3.6, z, 1, 1, 0); }));
    // a igreja: a porta abre para o pátio (sul); lá dentro, a iconóstase de ouro separa o altar
    const ig = R.casaInt(IGREJA.x, IGREJA.z, 0, 12, 16, 9, { mat: MATS.cal, roof: MATS.telha, rh: 4, piso: MAT.stone, nome: 'Igreja da Transfiguração' });
    R.IGREJA_INT = ig;
    M.mobilia(ig, 'altar', 0, -16 / 2 + 1.8, 0);
    const ico = new THREE.Group(); ico.position.set(0, 0.2, -16 / 2 + 4.2); ig.g.add(ico);
    [-4.4, -3, 3, 4.4].forEach(x => { ico.add(mesh(new THREE.BoxGeometry(1.3, 3.4, 0.16), MATS.ouro, x, 1.7, 0)); ico.add(mesh(new THREE.BoxGeometry(1.0, 1.5, 0.05), x < 0 ? MATS.azul : sm(0x8a1e1e), x, 2.2, 0.09)); });
    ico.add(mesh(new THREE.BoxGeometry(10.4, 0.5, 0.2), MATS.ouro, 0, 3.6, 0));
    [-1, 1].forEach(s => { const p = ig.W(s * 3.7, -16 / 2 + 4.2); M.obstacles.push({ x: p.x, z: p.z, r: 1.4 }); });
    R.ICONOSTASE = () => { const p = ig.W(-3.0, -16 / 2 + 4.3); return { x: p.x, y: H(IGREJA.x, IGREJA.z) + 2.4, z: p.z }; };
    for (let k = 0; k < 2; k++) [-1, 1].forEach(s => M.mobilia(ig, 'banco', s * 2.4, 1.4 + k * 2.4, 0));
    const porta = ig.W(0, 16 / 2 + 1.0);
    M.interativo(porta.x, porta.z, 2.6, () => A7() ? A7().textoIgreja() : null, () => A7().igreja());
    R.EFREM = loc(ig.W(0.8, -1.4)); R.EFREM_ROT = 0;
    R.BISPO = loc(ig.W(-0.6, -1.0)); R.BISPO_ROT = 0;
    // o campanário de madeira, à moda do deserto
    const cp = R.grupo(IGREJA.x + 8, IGREJA.z - 6, 0); [-1, 1].forEach(a => [-1, 1].forEach(b => cp.add(mesh(new THREE.BoxGeometry(0.24, 7, 0.24), MAT.wood, a * 1, 3.5, b * 1))));
    cp.add(mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), MATS.telha, 0, 7.2, 0)); const sino = mesh(new THREE.CylinderGeometry(0.35, 0.6, 0.9, 10, 1, true), sm(0x8a6a2a, { metalness: 0.6, side: THREE.DoubleSide }), 0, 6.2, 0); cp.add(sino); R.SINO = sino;
    R.obst(IGREJA.x + 8, IGREJA.z - 6, 1.4);
    // a oficina de ícones do Irmão Sabas
    const of = R.casaInt(OFICINA.x, OFICINA.z, 0, 7, 8, 4.6, { mat: MATS.cal, roof: MATS.telha, rh: 2.4, nome: 'Oficina de Ícones' });
    M.mobilia(of, 'mesa', 0, -1.6, 0); M.mobilia(of, 'prateleira', -2.6, -1.0, Math.PI / 2);
    R.SABAS = loc(of.W(0.6, 0.6)); R.SABAS_ROT = Math.PI;
    // as celas dos monges, encostadas no muro leste
    [80, 96].forEach(z => R.casa(19, z, -Math.PI / 2, 5, 4, 3.4, { rh: 1.6, luz: true, roof: MATS.telha }));
    // a sarça que arde e não se consome
    const sa = R.grupo(SARCA.x, SARCA.z, 0);
    sa.add(mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.6, 12), MATS.pedraE, 0, 0.3, 0));
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = i % 3 ? 0.7 : 0.25; const b = mesh(new THREE.SphereGeometry(0.55, 7, 6), MATS.folha, Math.cos(a) * r, 0.9 + (i % 3) * 0.32, Math.sin(a) * r); sa.add(b); }
    const fogo = []; for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd27a : 0xff9a3a, transparent: true, opacity: 0.85, depthWrite: false })); f.position.set(Math.cos(a) * 0.6, 1.6, Math.sin(a) * 0.6); sa.add(f); fogo.push(f); }
    M.animados.push((dt, t) => fogo.forEach((f, i) => { f.scale.y = 0.8 + Math.abs(Math.sin(t * 4 + i)) * 0.7; f.position.y = 1.6 + Math.sin(t * 3 + i) * 0.1; }));
    R.obst(SARCA.x, SARCA.z, 2.0);
    const luz = R.emissor(SARCA.x, H(SARCA.x, SARCA.z) + 2.2, SARCA.z, 1.2, 14, 0xffc070);
    // a Lâmpada da Humildade: quando se acende, a sarça arde branca e a luz alcança o deserto inteiro
    const lampada = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); lampada.position.y = 3.2; sa.add(lampada);
    R.acenderLampada = b => { lampada.material.opacity = b ? 0.95 : 0; luz.int = b ? 3.2 : 1.2; luz.dist = b ? 48 : 14; fogo.forEach(f => f.material.color.setHex(b ? 0xffffff : f.material.color.getHex())); };
    R.inter(SARCA.x + 2.6, SARCA.z + 1.4, 2.4, () => A7() ? A7().textoSarca() : null, () => A7().sarca());
    R.oratorio('sarca', 'Oratório da Sarça', 12, 101, -Math.PI / 2);
    // o poço de Moisés, no pátio
    const po = R.grupo(4, 104, 0); po.add(mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 12), MATS.pedra, 0, 0.45, 0)); if (OV.cenario) OV.cenario.fundir(po); R.obst(4, 104, 1.3);
    for (let a = 0; a < 360; a += 90) { const q = { x: 0 + Math.cos(a * Math.PI / 180) * 14, z: 101 + Math.sin(a * Math.PI / 180) * 6 }; if (Math.abs(q.x - SARCA.x) > 3) R.lanterna(q.x, q.z, 0xffc070); }
  })();

  /* ================= AS TENDAS DOS PASTORES ================= */
  (function () {
    [[-8, -4], [6, -6], [-4, 8], [9, 6]].forEach(([dx, dz], i) => {
      const g = R.grupo(TENDAS.x + dx, TENDAS.z + dz, i * 0.8);
      const tn = mesh(new THREE.BoxGeometry(4.2, 0.1, 3.4), i % 2 ? MATS.lona : MATS.lonaC, 0, 2.0, 0); tn.rotation.x = 0.06; g.add(tn);
      [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(0.12, 2.0, 0.12), MAT.wood, a, 1.0, b)));
      g.add(mesh(new THREE.BoxGeometry(4.2, 1.6, 0.08), i % 2 ? MATS.lona : MATS.lonaC, 0, 1.2, -1.7));
      R.caixa(TENDAS.x + dx, TENDAS.z + dz, 2.2, 1.8, i * 0.8);
    });
    // o curral de pedra seca, para a ovelha perdida
    const cu = R.grupo(TENDAS.x - 2, TENDAS.z - 16, 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (i === 3) continue; const pd = mesh(new THREE.BoxGeometry(1.4, 0.8, 0.5), MATS.pedraE, Math.cos(a) * 3.2, 0.4, Math.sin(a) * 3.2); pd.rotation.y = -a + Math.PI / 2; cu.add(pd); }
    if (OV.cenario) OV.cenario.fundir(cu);
    R.CURRAL = { x: TENDAS.x - 2, z: TENDAS.z - 16 };
    R.REBECA = { x: TENDAS.x + 1, z: TENDAS.z + 1.5 }; R.DAVI = { x: TENDAS.x - 2.4, z: TENDAS.z + 2.4 };
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const o = R.grupo(R.CURRAL.x + Math.cos(a) * 1.6, R.CURRAL.z + Math.sin(a) * 1.6, a); const l = sm(0xd8d2c4); const c = mesh(new THREE.SphereGeometry(0.4, 7, 5), l, 0, 0.5, 0); c.scale.set(1, 0.8, 1.3); o.add(c); o.add(mesh(new THREE.SphereGeometry(0.16, 6, 5), sm(0x2a2420), 0, 0.62, 0.48)); }
  })();

  /* ================= A ESCADA: OS TRÊS DEGRAUS, COM UM ABRIGO DE PEDRA EM CADA ================= */
  (function () {
    DEGRAUS.forEach((d, i) => {
      const g = R.grupo(d.x - 5, d.z + 3, 0.4 + i);
      [[-1.4, -1], [1.4, -1], [-1.4, 1], [1.4, 1]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), MAT.wood, a, 1.1, b)));
      g.add(mesh(new THREE.BoxGeometry(3.4, 0.14, 2.6), MATS.lona, 0, 2.25, 0));
      if (OV.cenario) OV.cenario.fundir(g);
      R.oratorio(d.id, d.nome, d.x, d.z, virarPara(d, { x: 0, z: 140 }));
      // os degraus de pedra talhados no caminho
      for (let k = 0; k < 5; k++) { const s = mesh(new THREE.BoxGeometry(3.2, 0.3, 0.8), MATS.pedraE, X(d.x + 6 + k * 0.1), H(d.x + 6, d.z - 4 - k * 1.1) + 0.1, Z(d.z - 4 - k * 1.1)); scene.add(s); }
    });
  })();

  /* ================= O CUME ================= */
  (function () {
    // a pedra das tábuas: uma laje inclinada, e o lugar onde Moisés tirou as sandálias
    const g = R.grupo(CUME.x, CUME.z - 6, 0);
    g.add(mesh(new THREE.BoxGeometry(3.4, 2.4, 1.2), MATS.pedra, -0.9, 1.1, 0)); g.add(mesh(new THREE.BoxGeometry(3.4, 2.4, 1.2), MATS.pedra, 0.9, 1.1, 0.1));
    g.add(mesh(new THREE.BoxGeometry(0.2, 3.4, 0.2), MAT.wood, 0, 2.6, -1)); g.add(mesh(new THREE.BoxGeometry(1.6, 0.2, 0.2), MAT.wood, 0, 3.6, -1));
    if (OV.cenario) OV.cenario.fundir(g); R.obst(CUME.x, CUME.z - 6, 2.2);
    R.VISAO = { x: CUME.x, z: CUME.z + 1 };
    R.inter(R.VISAO.x, R.VISAO.z, 2.6, () => A7() ? A7().textoCume() : null, () => A7().cume());
  })();

  /* ================= A TORRE ================= */
  (function () {
    const y0 = TORRE.h;
    const g = new THREE.Group(); g.position.set(X(TORRE.x), y0 - 1, Z(TORRE.z)); scene.add(g);
    g.add(mesh(new THREE.CylinderGeometry(TORRE.r - 0.6, TORRE.r + 0.6, TORRE.alt + 1, 24), MATS.negra, 0, (TORRE.alt + 1) / 2, 0));
    // a rampa em espiral, por fora, e as janelas que não dão para lugar nenhum
    for (let k = 0; k < 64; k++) { const a = k * 0.42, y = 2 + k * 0.78; const s = mesh(new THREE.BoxGeometry(2.4, 0.3, 1.6), MATS.negraE, Math.cos(a) * (TORRE.r + 0.4), y, Math.sin(a) * (TORRE.r + 0.4)); s.rotation.y = -a; g.add(s); }
    for (let k = 0; k < 18; k++) { const a = k * 1.1, y = 6 + k * 2.6; const j = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.2), new THREE.MeshBasicMaterial({ color: k % 3 ? 0x3a1a1a : 0xff5a2a })); j.position.set(Math.cos(a) * (TORRE.r - 0.2), y, Math.sin(a) * (TORRE.r - 0.2)); j.rotation.y = -a + Math.PI / 2; g.add(j); }
    // o terraço: laje, parapeito com ameias e um braseiro enorme no meio
    const topo = TORRE.alt + 1;
    g.add(mesh(new THREE.CylinderGeometry(TORRE.r + 0.4, TORRE.r - 0.6, 0.8, 32), MATS.negraE, 0, topo, 0));
    for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; if (k % 2) continue; const m = mesh(new THREE.BoxGeometry(1.8, 1.4, 0.7), MATS.negra, Math.cos(a) * (TORRE.r - 0.3), topo + 1.0, Math.sin(a) * (TORRE.r - 0.3)); m.rotation.y = -a + Math.PI / 2; g.add(m); }
    const br = mesh(new THREE.CylinderGeometry(1.4, 0.8, 1.2, 10), MATS.ouro, 0, topo + 0.9, 0); g.add(br);
    const chama = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0.85 })); chama.position.y = topo + 2.6; g.add(chama);
    M.animados.push((dt, t) => { chama.scale.y = 0.8 + Math.abs(Math.sin(t * 3)) * 0.5; chama.visible = !(OV.jogo && OV.jogo.prog && OV.jogo.prog.flags && OV.jogo.prog.flags.ato7_fim); });
    R.emissor(TORRE.x, TOPO + 3, TORRE.z, 1.4, 26, 0xff6a2a);
    R.TORRE_G = g;
    // a base é sólida; quando o peregrino está lá em cima, ela deixa de empurrar quem anda no terraço
    const ob = { x: X(TORRE.x), z: Z(TORRE.z), r: TORRE.r + 0.6 }; M.obstacles.push(ob);
    const obBr = { x: X(TORRE.x), z: Z(TORRE.z), r: 0 }; M.obstacles.push(obBr);
    R.alto = function (b) { ob.r = b ? 0 : TORRE.r + 0.6; obBr.r = b ? 1.5 : 0; };
    // a porta, ao sul, e a escada de dentro (que no jogo é uma subida só)
    const pt = R.grupo(TORRE.x, TORRE.z + TORRE.r + 0.2, 0, y0); pt.add(mesh(new THREE.BoxGeometry(3.2, 4.4, 0.6), MATS.negraE, 0, 1.4, 0)); pt.add(mesh(new THREE.BoxGeometry(2.0, 3.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x0a0606 }), 0, 1.1, 0.32));
    R.PORTA_TORRE = { x: TORRE.x, z: TORRE.z + TORRE.r + 2.2 };
    R.inter(R.PORTA_TORRE.x, R.PORTA_TORRE.z, 2.6, () => A7() ? A7().textoTorre() : null, () => A7().torre());
    // lá em cima, a escada para descer
    R.DESCIDA = { x: TORRE.x, z: TORRE.z + TORRE.r - 3 };
    R.inter(R.DESCIDA.x, R.DESCIDA.z, 2.2, () => (A7() && noAlto()) ? A7().textoDescer() : null, () => A7().descer());
    // as sentinelas de pedra na base, imóveis até a Torre acordar
    [-1, 1].forEach(s => { const q = R.grupo(TORRE.x + s * 5, TORRE.z + TORRE.r + 4, 0); q.add(mesh(new THREE.BoxGeometry(1.2, 3.4, 0.8), MATS.negraE, 0, 1.7, 0)); q.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 5), MAT.iron, s * 0.7, 2.2, 0.3)); if (OV.cenario) OV.cenario.fundir(q); R.obst(TORRE.x + s * 5, TORRE.z + TORRE.r + 4, 0.9); });
  })();

  /* ================= A PEDREIRA DE NEMROD ================= */
  (function () {
    const g = R.grupo(PEDREIRA.x, PEDREIRA.z, 0.5);
    [[-4, -3, 3, 2], [3, -4, 2.4, 1.6], [5, 2, 1.8, 1.2], [-3, 4, 2.2, 1.4]].forEach(([x, z, w, h]) => g.add(mesh(new THREE.BoxGeometry(w, h, w * 0.8), MATS.negraE, x, h / 2, z)));
    const gr = new THREE.Group(); gr.position.set(0, 0, -6); g.add(gr);
    gr.add(mesh(new THREE.BoxGeometry(0.3, 7, 0.3), MAT.wood, 0, 3.5, 0)); gr.add(mesh(new THREE.BoxGeometry(6, 0.24, 0.24), MAT.wood, 2, 6.8, 0));
    if (OV.cenario) OV.cenario.fundir(g);
    [[-4, -3, 2.4], [3, -4, 1.8], [5, 2, 1.4], [-3, 4, 1.6], [0, -6, 0.6]].forEach(([x, z, r]) => { const cs = Math.cos(0.5), sn = Math.sin(0.5); R.obst(PEDREIRA.x + x * cs + z * sn, PEDREIRA.z - x * sn + z * cs, r); });
    R.NEMROD = { x: PEDREIRA.x + 3, z: PEDREIRA.z + 6 };
  })();

  /* ---- a placa da estrada, na chegada, e a Capela do Peregrino ---- */
  R.placa(4, 146, -Math.PI / 2);
  R.inter(3, 147.5, 2.4, () => OV.viagem ? OV.viagem.textoPlaca('monte') : null, () => OV.viagem && OV.viagem.usarPlaca('monte'));
  R.CAPELA = { x: -26, z: 126 };

  /* ---- o deserto: tamareiras perto da água, arbustos secos e pedras; no monte, só pedra ---- */
  R.vegetacao({
    arvores: 150, espaco: 7, esc: [0.8, 1.3], alto: 1.2, copaAlta: 1.2, yCopa: 3.2, corCopa: 0x4a5a2a, corTronco: 0x5a4a32,
    densidade: (lx, lz) => {
      if (montanha(lx, lz) > 8) return 0;
      if (Math.hypot(lx - MOST.x, lz - MOST.z) < 34) return 0;
      if (Math.abs(lx) < 7 && lz > 100) return 0;
      return Math.max(Math.abs(lx), Math.abs(lz)) > 110 ? 0.4 : 0.12;
    },
    pedras: 140, capim: 1400, corCapim: 0x9a8a5a,
    especies: [['oliveira', 2], ['seca', 2.4], ['cipreste', 1]],
    chao: { n: { flores: 120, arbustos: 500 },
      paleta: { capim: [0x9a8a5a, 0xa8966a, 0x8a7a4e, 0xb09a6a], flores: [0xe8c83a, 0xd86a1a, 0xf2f0e8], arbusto: [0x6a6a3a, 0x5a5a32, 0x7a6a3e], bagas: [0xd8283a] } },
    semCapim: (lx, lz) => Math.hypot(lx - MOST.x, lz - MOST.z) < 24 || montanha(lx, lz) > 20
  });

  /* ---- gente do mosteiro e do deserto ---- */
  const at = (q, rot, op) => M.criarFigura(X(q.x), Z(q.z), rot, op);
  at(R.EFREM, R.EFREM_ROT, { id: 'abbaEfrem', nome: 'Abba Efrém, o abade', cor: 0x141012, cabelo: 0xe8e4dc });
  at(R.SABAS, R.SABAS_ROT, { id: 'sabas', nome: 'Irmão Sabas, o iconógrafo', cor: 0x1a1416, cabelo: 0x4a3a2a });
  at(R.BISPO, R.BISPO_ROT, { id: 'bispo', nome: 'Dom Atanásio, o bispo', cor: 0x6a1a3a, cabelo: 0xb8b4ac, oculto: true });
  at(R.REBECA, 0.6, { id: 'rebeca', nome: 'Rebeca, a pastora', cor: 0x5a3a2a, veu: 0x8a6a4a });
  at(R.DAVI, 1.2, { id: 'davizinho', nome: 'Davi, o pastorzinho', cor: 0x6a5a3a, cabelo: 0x2a1a10 });
  at(R.NEMROD, -2.4, { id: 'nemrod', nome: 'Nemrod, o arquiteto', cor: 0x3a2a3a, cabelo: 0x2a2a2a });
  at({ x: R.VISAO.x + 1.4, z: R.VISAO.z - 2.2 }, 0, { id: 'moises', nome: 'Moisés', santo: true, oculto: true });
  at({ x: TORRE.x + 3, z: TORRE.z - 3 }, Math.PI, { id: 'miguel', nome: 'São Miguel Arcanjo', santo: true, oculto: true });
  R.MORADORES = [
    [MOST.x - 6, MOST.z + 8, 0.4, { id: 'mor_monte1', nome: 'Monge porteiro', cor: 0x141012, cabelo: 0x6a5a4a }, 'Aqui no deserto ninguém tem pressa. Quem sobe o monte com pressa chega lá em cima sem ter subido.', 'Lá em cima, atrás do cume, há uma torre que não estava lá quando eu cheguei. Ninguém a viu crescer.'],
    [MOST.x + 6, MOST.z + 14, 2.6, { id: 'mor_monte2', nome: 'Peregrina do Oriente', cor: 0x3a4a6a, veu: 0xe8e0d0 }, 'Vim de muito longe para ver a sarça. Ela arde desde Moisés, dizem os monges, e nunca se consome.', 'Os soberbos sobem o monte pisando nos outros. Eu prefiro subir devagar, de joelhos, se for preciso.'],
    [TENDAS.x + 8, TENDAS.z - 6, -1.2, { id: 'mor_monte3', nome: 'Velho pastor', cor: 0x5a4a32, cabelo: 0xd8d4cc }, 'O meu avô dizia que no alto do monte Deus fala baixinho. Quem grita não ouve.', 'Os bodes do monte ficaram bravos desde que a torre subiu. Dizem que lá em cima alguém fez um bezerro de ouro.']
  ];

  /* ---- vícios pelos caminhos (nível 22 a 26) ---- */
  R.spawnsMundo = [
    ['bode', -30, 130, 22], ['bode', 30, 128, 22], ['caido', -80, 60, 22], ['caido', 80, 64, 22, 'forte'],
    ['soberbo', 20, 56, 23], ['bode', -10, 30, 23], ['caido', -50, 20, 23], ['soberbo', 0, 0, 23, 'forte'],
    ['bode', 50, -10, 24], ['caido', -20, -30, 24, 'forte'], ['soberbo', 60, -50, 24], ['sentinela', 14, -90, 25],
    ['sentinela', -14, -92, 25, 'forte'], ['caido', -60, -90, 25], ['bode', 100, -40, 24], ['caido', 120, 40, 24],
    ['soberbo', -120, 30, 24, 'forte'], ['bode', -110, -60, 25], ['caido', 140, -120, 26, 'elite'], ['sentinela', -140, -130, 26, 'elite'],
    ['murmurador', -90, 120, 22], ['murmurador', 90, 120, 22]
  ].map(([t, x, z, n, v]) => [t, X(x), Z(z), n, v]);
})(window.OV);

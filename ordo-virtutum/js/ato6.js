/* Ordo Virtutum — Ato VI: a Marca Ardente. Missões, os vícios da ira (o revide, a vingança, a guerra que ninguém
   lembra por que começou), São Martinho de Tours, Abadon e a Lâmpada da Paciência.
   A luta: de tempos em tempos Abadon abre os braços e provoca (aura vermelha). Quem revida dá de comer a ele: ele se
   cura e a Ira pega o peregrino. Quem espera até a provocação acabar o desarma: ele fica atordoado e mais frágil.
   Aos 30%, a oferta («olho por olho»), e os soldados dos dois lados correm possuídos para o campo: libertá-los. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.marca || !OV.missoes) return;
  const MS = OV.missoes, R = OV.marca, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, T = OV.tempo, IT = OV.itens, AV = OV.aventura;
  const sm = OV.sm, mesh = OV.mesh;
  const A6 = {}; OV.ato6 = A6;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, g, linha, ARV } = MS;
  const W = R.W, H = M.altura;
  const C = () => OV.combate;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const naRegiao = () => M.regiao(P.pos.x, P.pos.z) === 'marca';
  const local = () => ({ x: P.pos.x - R.OX, z: P.pos.z - R.OZ });
  const distMarco = () => { const l = local(); return Math.hypot(l.x - R.MARCO.x, l.z - R.MARCO.z); };
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  const figPos = id => () => { const f = M.figuras[id]; return f ? { x: f.x, z: f.z } : null; };
  const oraPos = id => () => { const o = M.oratorios[id]; return o ? { x: o.x, z: o.z } : null; };
  const tagPos = t => () => { const v = I.porTag(t).filter(vivo); if (!v.length) return null; let x = 0, z = 0; v.forEach(e => { x += e.g.position.x; z += e.g.position.z; }); return { x: x / v.length, z: z / v.length }; };
  const ou = (...fs) => () => { for (const f of fs) { const r = f(); if (r) return r; } return null; };
  const lugar = (lx, lz) => () => W(lx, lz);
  M.spawnsMundo.push(...R.spawnsMundo);

  /* ================= MISSÕES DO ATO VI ================= */
  const PZ = R.PONTE.z;
  const IRADOS = [[-7, PZ + 15], [7, PZ + 17], [-12, PZ + 22], [-6, PZ - 15], [8, PZ - 17], [13, PZ - 22]];
  const livres = () => (F().irados6 || []).length;
  const tregua = () => (F().tregua_roca ? 1 : 0) + (F().tregua_valv ? 1 : 0);
  Object.assign(MS.MIS, {
    a6m1: { ato: 6, nome: 'A Marca Ardente', tipo: 'p', xp: 180, etapas: ['Siga para a Marca Ardente pela placa de uma das estradas.', 'Procure a Irmã Firmina, no Hospital de São Martinho, a leste da praça.', 'Acenda a vela do Oratório de São Martinho, na praça.'],
      alvos: [() => R.ENTRADA, figPos('firmina'), oraPos('saomartinho')] },
    a6m2: { ato: 6, nome: 'Os Feridos da Ponte', tipo: 'p', xp: 340, etapas: [() => `Liberte os soldados irados que atacam as carroças de feridos na Ponte Queimada (${livres()}/6).`, 'Volte à Irmã Firmina.'],
      alvos: [ou(tagPos('irados6'), lugar(0, PZ)), figPos('firmina')] },
    a6m3: { ato: 6, nome: 'A Crônica do Marco', tipo: 'p', xp: 380, etapas: ['Pergunte ao Padre Gregório, na Igreja de São Martinho, pela história do marco.', 'Busque a crônica na arca da Capela do Marco, a sudeste do marco, no Campo das Cinzas.', () => `Convença o Conde Rodrigo, em Rocaforte (oeste), e o Barão Fernão, em Valverde (leste), a ir ao marco sem espada (${tregua()}/2).`],
      alvos: [figPos('padreGregorio'), lugar(R.ARCA.x, R.ARCA.z), () => F().tregua_roca ? figPos('fernao')() : figPos('rodrigo')()] },
    a6m4: { ato: 6, nome: 'O Manto Partido', tipo: 'p', xp: 340, etapas: ['Vá à Ponte Queimada e reze no meio dela.', 'Vigie com São Martinho: resista aos Cães de Guerra e às Brasas.'],
      alvos: [lugar(R.VISAO.x, R.VISAO.z), lugar(R.VISAO.x, R.VISAO.z)] },
    a6m5: { ato: 6, nome: 'Abadon', tipo: 'p', xp: 900, etapas: ['Vá ao marco, no meio do Campo das Cinzas, para a trégua.', 'Enfrente Abadon no Campo das Cinzas. Quando ele abrir os braços e provocar (aura vermelha), não revide: espere.', 'Vá à Igreja de São Martinho para a Missa.'],
      alvos: [lugar(R.MARCO.x, R.MARCO.z + 3), ou(tagPos('abadon'), lugar(R.MARCO.x, R.MARCO.z)), lugar(R.IGREJA.x + 12, R.IGREJA.z)] }
  });
  MS.aposAto5 = () => setTimeout(() => { if (!st('a6m1')) MS.iniciar('a6m1'); setTimeout(() => ui.toast('A estrada do oeste para a Marca Ardente está aberta: siga pelas placas das estradas.'), 1600); }, 400);
  function concluirA6m1() { MS.concluir('a6m1'); setTimeout(() => { MS.iniciar('a6m2'); if (livres() >= 6) MS.avancar('a6m2', 1); MS.respawnQuest(); }, 1500); }

  /* ================= OS VÍCIOS DA IRA ================= */
  const ferro = sm(0x4a4a50, { metalness: 0.5, roughness: 0.5 });
  function makeIrado() {
    const deRoca = Math.random() < 0.5;
    const b = OV.makePossesso(deRoca ? 0x5a1812 : 0x1c401c, false)();
    b.eye.color.setHex(0xff6a1a); b.eyeBase = 0xff6a1a;
    // o elmo de soldado e a túnica com a cor da casa
    const el = mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.24, 9), ferro, 0, 2.2, -0.02); b.g.add(el);
    b.g.add(mesh(new THREE.BoxGeometry(0.04, 0.2, 0.05), ferro, 0, 2.03, 0.2));
    b.g.add(mesh(new THREE.BoxGeometry(0.6, 0.34, 0.4), sm(deRoca ? 0x8a2a1e : 0x2e6a2e), 0, 1.45, 0));
    return b;
  }
  function makeBrasa() {
    const g = new THREE.Group();
    const nucleo = new THREE.MeshBasicMaterial({ color: 0xff7a2a }), crosta = sm(0x2a1a14, { emissive: 0x2a0a02, roughness: 1 }), eye = new THREE.MeshBasicMaterial({ color: 0xffe08a });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), nucleo)); g.children[0].position.y = 1.5;
    const cascas = [];
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const c = mesh(new THREE.DodecahedronGeometry(0.22, 0), crosta, Math.cos(a) * 0.42, 1.5 + Math.sin(a * 2) * 0.2, Math.sin(a) * 0.42); g.add(c); cascas.push(c); }
    const chamas = [];
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 5), nucleo); f.position.set((i - 1.5) * 0.18, 1.95, 0); g.add(f); chamas.push(f); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), eye); e.position.set(0.12 * s, 1.58, 0.4); g.add(e); });
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [crosta], eye, eyeBase: 0xffe08a, cascas, chamas };
  }
  function makeCao() {
    const g = new THREE.Group();
    const pelo = sm(0x3a2a1e, { emissive: 0x0a0402 }), couro = sm(0x2a2420), eye = new THREE.MeshBasicMaterial({ color: 0xff5a1a });
    const corpo = mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), pelo, 0, 0.78, 0); g.add(corpo);
    g.add(mesh(new THREE.BoxGeometry(0.56, 0.36, 0.7), couro, 0, 0.92, 0.18)); // a couraça de couro dos cães de guerra
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.ConeGeometry(0.05, 0.16, 4), ferro, (i % 2 ? 0.2 : -0.2), 1.12, 0.05 + Math.floor(i / 2) * 0.3));
    const cab = new THREE.Group(); cab.position.set(0, 1.05, 0.7); g.add(cab);
    cab.add(mesh(new THREE.BoxGeometry(0.36, 0.34, 0.38), pelo, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.22, 0.2, 0.3), pelo, 0, -0.06, 0.3));
    [-1, 1].forEach(s => { cab.add(mesh(new THREE.ConeGeometry(0.07, 0.18, 4), pelo, 0.12 * s, 0.24, -0.06)); const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.1 * s, 0.06, 0.2); cab.add(e); });
    const pernas = [];
    [[-0.18, 0.42], [0.18, 0.42], [-0.18, -0.42], [0.18, -0.42]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.62, z); p.add(mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), pelo, 0, -0.3, 0)); g.add(p); pernas.push(p); });
    const cauda = mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), pelo, 0, 0.95, -0.75); cauda.rotation.x = -0.6; g.add(cauda);
    const armL = new THREE.Group(), armR = new THREE.Group(); cab.add(armL); cab.add(armR);
    return { g, armL, armR, mats: [pelo, couro], eye, eyeBase: 0xff5a1a, patas: pernas, cab };
  }
  function makeGafanhoto() {
    // «Os gafanhotos pareciam cavalos preparados para a guerra; tinham coroas como de ouro, rostos como de homem,
    //  cabelos como de mulher, dentes como de leão e couraças como de ferro» (Ap 9,7-9)
    const g = new THREE.Group();
    const casca = sm(0x6a5a2a, { emissive: 0x0a0802, metalness: 0.3 }), couraca = sm(0x3a3a40, { metalness: 0.6, roughness: 0.4 }), rosto = sm(0xb8a088), cab = sm(0x2a1a10);
    const ouro = sm(0xd8b048, { metalness: 0.7, roughness: 0.3 }), eye = new THREE.MeshBasicMaterial({ color: 0xffd84a });
    const corpo = mesh(new THREE.CylinderGeometry(0.26, 0.18, 1.2, 8), casca, 0, 1.3, -0.2); corpo.rotation.x = Math.PI / 2; g.add(corpo);
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.36, 0.5), couraca, 0, 1.36, 0.28));
    g.add(mesh(new THREE.SphereGeometry(0.2, 8, 7), rosto, 0, 1.58, 0.62));
    g.add(mesh(new THREE.BoxGeometry(0.36, 0.5, 0.16), cab, 0, 1.46, 0.46));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.04, 0.16, 4), ouro, Math.cos(a) * 0.16, 1.8, 0.62 + Math.sin(a) * 0.16)); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.08 * s, 1.6, 0.8); g.add(e); });
    const asas = [];
    [-1, 1].forEach(s => { const p = new THREE.Group(); p.position.set(0.16 * s, 1.5, 0.1); const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.36), sm(0xc8b888, { transparent: true, opacity: 0.55, side: THREE.DoubleSide })); w.position.set(0.6 * s, 0, -0.2); w.rotation.x = -Math.PI / 2; p.add(w); g.add(p); asas.push(p); });
    [-1, 1].forEach(s => { const p = mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), casca, 0.24 * s, 0.9, -0.5); p.rotation.x = 0.6; g.add(p); });
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [casca, couraca], eye, eyeBase: 0xffd84a, asas };
  }
  function makeGigante() {
    const g = new THREE.Group();
    const cinza = sm(0x3a3634, { emissive: 0x0a0604, roughness: 1 }), escura = sm(0x241e1c, { roughness: 1 }), fenda = new THREE.MeshBasicMaterial({ color: 0xff5a1a }), eye = new THREE.MeshBasicMaterial({ color: 0xffa040 });
    const tronco = mesh(new THREE.BoxGeometry(2.0, 2.0, 1.2), cinza, 0, 3.5, 0); g.add(tronco);
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9 + (i % 2) * 0.5, 0.02), fenda); f.position.set(-0.7 + i * 0.35, 3.4 + (i % 3) * 0.2, 0.61); f.rotation.z = (i - 2) * 0.25; g.add(f); }
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.9, 0.9), cinza, 0, 4.95, 0.05));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.02), eye); e.position.set(0.22 * s, 5.0, 0.51); g.add(e); });
    const pernas = OV.andar.pernas(g, 0.55, 2.5, { coxa: 1.25, canela: 1.2, larg: 0.5, mat: escura, pe: [0.6, 0.24, 0.9] });
    const arm = s => { const p = new THREE.Group(); p.position.set(1.3 * s, 4.2, 0); p.add(mesh(new THREE.BoxGeometry(0.62, 1.7, 0.62), cinza, 0, -0.85, 0)); p.add(mesh(new THREE.BoxGeometry(0.8, 0.7, 0.8), escura, 0, -1.95, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [cinza, escura], eye, eyeBase: 0xffa040, pernas, passada: 1.8, marchaO: { A: 0.3, K: 0.45 } };
  }
  // Abadon, o anjo do abismo: alto, de armadura negra, asas de fumaça, coroa de ferro, a chave do poço na cintura
  function makeAbadon() {
    const g = new THREE.Group();
    const armadura = sm(0x1e1a1e, { metalness: 0.6, roughness: 0.35, emissive: 0x0a0204 }), bronze = sm(0x7a4a1e, { metalness: 0.7, roughness: 0.3 }), manto = sm(0x140e0e, { emissive: 0x0a0202 });
    const pele = sm(0x6a5a5a, { emissive: 0x0a0202 }), fumaca = new THREE.MeshBasicMaterial({ color: 0x1a1214, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff2a1a }), lamina = new THREE.MeshBasicMaterial({ color: 0xff4a1a });
    const pernas = OV.andar.pernas(g, 0.36, 1.9, { coxa: 0.95, canela: 0.9, larg: 0.36, mat: armadura, pe: [0.42, 0.18, 0.66] });
    pernas.saia = OV.andar.saia(g, manto, 0.6, 1.0, 1.4, 1.95, 9);
    g.add(mesh(new THREE.BoxGeometry(1.4, 1.5, 0.8), armadura, 0, 2.7, 0));
    g.add(mesh(new THREE.BoxGeometry(1.5, 0.16, 0.86), bronze, 0, 2.1, 0));
    [-1, 1].forEach(s => g.add(mesh(new THREE.SphereGeometry(0.42, 8, 6), armadura, 0.82 * s, 3.35, 0)));
    const cab = new THREE.Group(); cab.position.set(0, 3.85, 0.04); g.add(cab);
    cab.add(mesh(new THREE.SphereGeometry(0.34, 10, 8), pele, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.62, 0.3, 0.62), armadura, 0, 0.1, -0.06));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cab.add(mesh(new THREE.ConeGeometry(0.06, 0.4, 4), ferro, Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3)); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), eye); e.position.set(0.12 * s, 0.02, 0.3); cab.add(e); });
    // a chave do abismo, presa na cintura
    const ch = new THREE.Group(); ch.position.set(0.55, 2.0, 0.42); g.add(ch); ch.add(mesh(new THREE.TorusGeometry(0.12, 0.03, 5, 10), bronze, 0, 0, 0)); ch.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), bronze, 0, -0.34, 0));
    // as asas de fumaça
    const asas = [];
    [-1, 1].forEach(s => { const p = new THREE.Group(); p.position.set(0.4 * s, 3.2, -0.4); g.add(p); for (let k = 0; k < 3; k++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2 - k * 0.4, 0.9), fumaca); w.position.set(1.1 * s, 0.4 - k * 0.55, -0.1 * k); w.rotation.z = s * (0.3 + k * 0.25); p.add(w); } asas.push(p); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.95 * s, 3.25, 0); p.add(mesh(new THREE.BoxGeometry(0.34, 1.25, 0.36), armadura, 0, -0.62, 0)); p.add(mesh(new THREE.BoxGeometry(0.38, 0.3, 0.4), bronze, 0, -1.2, 0)); g.add(p); return p; };
    const armL = arm(-1), armR = arm(1);
    const esp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.06), lamina); esp.position.set(0, -2.2, 0.2); armR.add(esp);
    // a aura vermelha da provocação
    const aura = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.position.y = 2.6; aura.visible = false; g.add(aura);
    return { g, armL, armR, mats: [armadura, manto, pele], eye, eyeBase: 0xff2a1a, pernas, saia: pernas.saia, passada: 1.4, asas, aura };
  }
  Object.assign(I.CORES, {
    irado: ['Furioso', 0x4a1a12, 'Capitão Irado', 0x6a2a0a], brasa: ['Viva', 0x3a1a0a, 'Brasa do Incêndio', 0x8a3a0a],
    cao: ['Raivoso', 0x2a1a12, 'Cão do Capitão', 0x5a3a1a], gafanhoto: ['Do Abismo', 0x3a3a1a, 'Gafanhoto Coroado', 0x8a6a1a]
  });
  const FO = OV.FOES;
  FO.irado = { key: 'irado', name: 'Soldado irado', nivel: 20, build: makeIrado, hp: 250, speed: 4.0, dmg: 21, windup: 0.45, recover: 0.65, range: 2.1, r: 0.5, height: 2.4, knock: 0.8, stagger: true, xp: 70, aggro: 14, leash: 26, liberta: true, mundo: true, moedas: [5, 8], status: 'ira' };
  FO.brasa = { key: 'brasa', name: 'Brasa da Ira', nivel: 19, build: makeBrasa, hp: 120, speed: 3.8, dmg: 15, windup: 0.6, recover: 0.6, range: 1.7, r: 0.5, height: 2.2, knock: 1.2, stagger: true, xp: 52, mundo: true, aggro: 15, leash: 26, voa: true, moedas: [3, 6], status: 'ira',
    ia: e => { const t = e.ph; e.cascas.forEach((c, i) => { const a = i / 7 * Math.PI * 2 + t * 1.4; c.position.x = Math.cos(a) * 0.42; c.position.z = Math.sin(a) * 0.42; }); e.chamas.forEach((f, i) => { f.scale.y = 0.8 + Math.abs(Math.sin(t * 6 + i)) * 0.6; }); } };
  FO.cao = { key: 'cao', name: 'Cão de Guerra', nivel: 20, build: makeCao, hp: 170, speed: 5.6, dmg: 19, windup: 0.38, recover: 0.55, range: 1.8, r: 0.6, height: 1.4, knock: 1.0, stagger: true, xp: 58, mundo: true, aggro: 16, leash: 28, moedas: [3, 6], status: null,
    ia: e => { const k = e.state === 'chase' || e.state === 'voltar' ? 0.7 : 0.12; e.patas.forEach((p, i) => { p.rotation.x = Math.sin(e.ph * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * k; }); if (e.cab) e.cab.rotation.x = e.state === 'windup' ? 0.35 : 0; } };
  FO.gafanhoto = { key: 'gafanhoto', name: 'Gafanhoto do Abismo', nivel: 21, build: makeGafanhoto, hp: 115, speed: 5.2, dmg: 16, windup: 0.5, recover: 0.55, range: 1.8, r: 0.5, height: 2.0, knock: 1.3, stagger: true, xp: 56, mundo: true, aggro: 17, leash: 30, voa: true, moedas: [3, 6], status: null,
    ia: e => { e.asas.forEach((a, i) => { a.rotation.z = Math.sin(e.ph * 30 + i * Math.PI) * 0.5; }); } };
  FO.gigante = { key: 'gigante', name: 'Gigante de Cinza', nivel: 24, build: makeGigante, hp: 1150, speed: 2.3, dmg: 36, windup: 0.9, recover: 1.0, range: 3.6, r: 1.5, height: 5.8, knock: 0.15, stagger: false, xp: 600, aggro: 30, leash: 60, status: 'ira', chefe: true };
  FO.abadon = { key: 'abadon', name: 'Abadon, o Anjo do Abismo', nivel: 23, build: makeAbadon, hp: 3600, speed: 3.2, dmg: 38, windup: 0.7, recover: 0.8, range: 3.6, r: 1.3, height: 5.4, knock: 0.05, stagger: false, xp: 1100, aggro: 60, leash: 90, status: 'ira', chefe: true,
    fall: 'Abadon foi acorrentado no abismo. Que reine a Paciência.', reduz: e => reduzAbadon(e), ia: (e, dt) => iaAbadon(e, dt) };
  Object.assign(I.PADROES, {
    irado: ['g', 'r', 'F', 'I'], brasa: ['T', 'g', 'T3'], cao: ['g', 'I', 'r', 'g'], gafanhoto: ['I', 'T', 'g'],
    gigante: { fases: [[1, ['g', 'F', 'g', 'Tl']], [0.6, ['F', 'O', 'g', 'C']], [0.3, ['O', 'F', 'C', 'g', 'F']]] },
    abadon: { fases: [[1, ['g', 'T3', 'g', 'F', 'I']], [0.6, ['T5', 'C', 'g', 'I', 'F']], [0.3, ['O', 'C', 'T7', 'I', 'g', 'F']]] }
  });
  Object.assign(I.PROJ, { irado: [0xff5a1a, 'ira'], brasa: [0xff7a2a, 'ira'], gafanhoto: [0xc8a83a], gigante: [0xff5a1a, 'ira'], abadon: [0xff3a1a, 'ira'] });
  ['gigante', 'abadon'].forEach(k => I.CHEFES.add(k));

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  const CASA_SENHOR = { rodrigo: () => [R.RODRIGO, R.RODRIGO_ROT], fernao: () => [R.FERNAO, R.FERNAO_ROT] };
  function senhoresEmCasa() { for (const k in CASA_SENHOR) { const f = M.figuras[k]; if (!f) continue; const [q, r] = CASA_SENHOR[k](); f.mover(q.x + R.OX, q.z + R.OZ, r); } }
  function senhoresNoCampo(dist) {
    [['rodrigo', -1], ['fernao', 1]].forEach(([k, s]) => { const f = M.figuras[k]; if (!f) return; const p = W(R.MARCO.x + s * dist, R.MARCO.z - 2); f.mover(p.x, p.z, s > 0 ? -Math.PI / 2 : Math.PI / 2); });
  }
  MS.ganchos.aplicar.push(() => {
    const f = F();
    if (f.ato5_fim && !st('a6m1')) prog().missoes.a6m1 = { e: 0, fim: false, res: null };
    if (M.figuras.martinho) M.figuras.martinho.mostrar(false);
    R.acenderLampada(!!f.ato6_fim);
    resetarChefe();
    senhoresEmCasa();
  });
  MS.ganchos.spawn.push(() => {
    ['irados6', 'vigilia6', 'capela6'].forEach(MS.tagRemove);
    const f = F(), ja = f.irados6 || [];
    if (MS.feita('a6m1') && !MS.feita('a6m2')) IRADOS.forEach(([x, z], i) => { if (ja.includes(i)) return; const e = I.spawn('irado', false, W(x, z), { nivel: 20 }); e.tag = 'irados6'; e.bi = i; e.mundo = false; });
    // os cães e as brasas que rondam a capela, enquanto a crônica estiver lá
    if (MS.ativa('a6m3') && MS.etapa('a6m3') === 1 && !f.cronica) [['cao', -6, 8], ['cao', 6, 9], ['brasa', 0, 12]].forEach(([k, dx, dz]) => { const e = I.spawn(k, false, W(R.CAPM.x - 9 + dx * 0.4, R.CAPM.z + dz * 0.6), { nivel: 21 }); e.tag = 'capela6'; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.cronica && !MS.feita('a6m3')) inv.push('A Crônica do Marco (o Livro do Rio da Capela do Marco)');
    if (f.graca_martinho) inv.push('Graça de Martinho (quem não revida desarma Abadon mais depressa, e por mais tempo)');
  });

  /* ================= A IGREJA, A ARCA, O MARCO E A PONTE ================= */
  A6.textoIgreja = () => (MS.ativa('a6m5') && MS.etapa('a6m5') === 2) ? 'Entrar para a Missa' : 'Entrar na Igreja de São Martinho';
  A6.igreja = function () {
    if (MS.ativa('a6m5') && MS.etapa('a6m5') === 2) { missa6(); return; }
    ui.fala('Igreja de São Martinho', F().ato6_fim ? 'Nos bancos, gente de Rocaforte e de Valverde se senta misturada. Na parede, alguém pendurou uma espada partida ao meio, como o manto do santo.' : 'Uma igreja de vila, simples. No vitral, um soldado a cavalo corta o manto com a espada e dá a metade a um pobre.');
  };
  A6.textoArca = () => (MS.ativa('a6m3') && MS.etapa('a6m3') === 1 && !F().cronica) ? 'Abrir a arca da sacristia' : 'Ver a arca da sacristia';
  A6.arca = function () {
    const f = F();
    if (!(MS.ativa('a6m3') && MS.etapa('a6m3') === 1) || f.cronica) { ui.fala('Capela do Marco', f.cronica ? 'A arca está vazia. O capelão guardou aqui o que tinha de mais precioso: um livro.' : 'Uma arca de madeira, fechada com uma barra de ferro enferrujada.'); return; }
    if (I.porTag('capela6').some(e => vivo(e) && Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 18)) { ui.toast('Os cães rondam a capela: não dá para abrir a arca em paz.'); return; }
    f.cronica = true; A.bell(659, 0.14); MS.avancar('a6m3', 2); J().salvar();
    D.falas([
      ['', 'Debaixo de panos de altar queimados, um livro grosso, de capa de couro: «Livro do Rio, crônica da Capela do Marco». Na última página escrita, a letra do capelão.'],
      ['Crônica do Marco', '«Os irmãos Rodrigo e Fernão, filhos do velho senhor da Marca, repartiram a herança no ano de 1158. Puseram esta pedra na margem do Rio Rubro, que então corria ao norte, e disseram: daqui para o poente é de um, daqui para o nascente é do outro, e o campo do meio fica para os pobres de São Martinho.»'],
      ['Crônica do Marco', '«No ano de 1203, em março, o rio saiu do leito numa enchente e foi correr ao sul, onde corre hoje. A água arrancou o marco e o rolou campo abaixo. Rocaforte disse que Valverde o mudou de lugar; Valverde disse que foi Rocaforte. Que Deus tenha piedade de nós.»'],
      ['Anjo da Guarda', 'Ninguém mudou a pedra. Foi o rio. E os fundadores eram irmãos. Leve o livro aos dois senhores: o Conde Rodrigo, em Rocaforte, a oeste, e o Barão Fernão, em Valverde, a leste.']
    ]);
  };
  A6.textoMarco = () => (MS.ativa('a6m5') && MS.etapa('a6m5') === 0) ? 'Esperar a trégua junto ao marco' : 'Ver o marco';
  A6.marco = function () {
    if (MS.ativa('a6m5') && MS.etapa('a6m5') === 0) { tregua6(); return; }
    ui.fala('O Marco', F().ato6_fim ? (F().marco_fim === 'rio' ? 'Os dois senhores juraram aqui, sobre o Evangelho. Na pedra, alguém gravou embaixo dos brasões: «Irmãos».' : 'Em volta do marco, o campo foi arado pelos dois lados juntos. O trigo nasce sem saber de quem é.') : 'Uma pedra alta com dois brasões, um de cada lado: o leão vermelho de Rocaforte e a árvore verde de Valverde. Em cima, uma cruz gasta.');
  };
  A6.textoPonte = () => (MS.ativa('a6m4') && MS.etapa('a6m4') === 0) ? 'Rezar no meio da Ponte Queimada' : 'Olhar o rio da ponte';
  A6.ponte = function () {
    if (MS.ativa('a6m4') && MS.etapa('a6m4') === 0) { visaoMartinho(); return; }
    ui.fala('Ponte Queimada', F().ato6_fim ? 'Rocaforte trouxe a madeira, Valverde trouxe os pregos. As tábuas novas ainda cheiram a pinho.' : 'As tábuas do meio queimaram. O rio, embaixo, corre vermelho de barro. Dizem que é do barro.');
  };

  /* ================= SÃO MARTINHO E A VIGÍLIA ================= */
  function visaoMartinho() {
    if (!T.ehNoite()) T.definir(20.5);
    ui.clarao('#fff6dc'); M.figuras.martinho.mostrar(true); A.bell(587, 0.2);
    D.abrir(arv('São Martinho de Tours', {
      a: { txt: () => `Paz, ${g('meu irmão', 'minha irmã')}. Eu também fui soldado. Meu pai me pôs na cavalaria do Imperador aos quinze anos, e eu sabia usar a espada melhor que muitos.`, prox: 'b' },
      b: { txt: 'Numa noite de inverno, na porta de Amiens, um pobre tremia de frio, quase nu. Eu só tinha as armas e o manto. Cortei o manto ao meio com a espada e dei a metade a ele. Na noite seguinte, vi Cristo vestido com aquela metade, dizendo aos anjos: «Martinho, que ainda nem é batizado, me cobriu com esta veste.»', prox: 'c' },
      c: { txt: 'Depois de batizado, na véspera de uma batalha, eu disse ao Imperador: «Até hoje servi a ti; deixa-me agora servir a Deus. Sou soldado de Cristo.» Ele me chamou de covarde. Então eu me ofereci para ficar na frente do exército sem armas, só com a cruz. No dia seguinte, os inimigos pediram a paz.',
        prox: () => (F().graca_martinho || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('São Martinho de Tours', 'manto',
        'Divida também você o que tem com quem está ferido: a sua veste e metade da sua bolsa, para os soldados do hospital, sem perguntar de que lado são. Quem já dividiu o manto não tem mais nada para defender com a espada.',
        () => { F().graca_martinho = true; setTimeout(() => ui.toast('Você recebeu a Graça de Martinho: quem não revida desarma Abadon mais depressa, e por mais tempo.'), 1800); }, 'd',
        'Eu entendo. Também eu demorei a largar a espada. Sem a graça, a provocação de Abadon vai durar mais, e você vai precisar de mais paciência.') : {}),
      d: { txt: 'O que vem aí é Abadon, o anjo do abismo, o rei dos gafanhotos (Ap 9,11). Ele não vive de matar: vive de fazer revidar. Quando ele abrir os braços e provocar, não bata. Espere, como quem oferece a outra face. A paciência o desarma. Quer vigiar comigo esta noite? Os cães de guerra vão sair do campo.', opc: [
        { t: 'Vigiar com São Martinho.', ef: () => MS.avancar('a6m4', 1), ir: 'v' },
        { t: 'Agora não. Vou ao marco.', ef: () => { MS.concluir('a6m4', 'desceu'); iniciarA6m5(); }, ir: 'x' }] },
      v: { txt: 'Então vigie. Eles vêm em três levas. Quando a raiva subir, lembre-se: a espada que você não levanta também é uma vitória.', depois: () => iniciarVigilia() },
      x: { txt: 'Vá em paz. Bem-aventurados os mansos, porque possuirão a terra.', depois: () => setTimeout(() => M.figuras.martinho.mostrar(false), 800) }
    }));
  }
  const iniciarA6m5 = () => setTimeout(() => MS.iniciar('a6m5'), 1400);
  const vg = { ativa: false, onda: 0, espera: 0 };
  function iniciarVigilia() { vg.ativa = true; vg.onda = 0; vg.espera = 1.5; ui.clarao('#0a0608'); ui.toast('A noite cai sobre a ponte. Você vigia.'); }
  function atualizarVigilia(dt) {
    if (!vg.ativa) return;
    if (I.porTag('vigilia6').some(vivo)) return;
    vg.espera -= dt; if (vg.espera > 0) return;
    if (vg.onda >= 3) {
      vg.ativa = false;
      if (P.pers.virt.temperanca < OV.MAX_VIRTUDE) P.pers.virt.temperanca++;
      C().recalcular(); MS.ato('temperanca');
      ui.banner('A vigília'); ui.toast('Você vigiou sem levantar a espada por raiva. A sua Temperança se fortaleceu (+1).');
      if (IT.dar('mantoMartinho', 1, true)) setTimeout(() => ui.toast('São Martinho lhe deixou a metade do manto. Veja no inventário (I).'), 1800);
      MS.concluir('a6m4', 'vigilia'); iniciarA6m5();
      setTimeout(() => M.figuras.martinho.mostrar(false), 2500);
      return;
    }
    vg.onda++; vg.espera = 2.5;
    ui.toast(`Vigília: ${['primeira', 'segunda', 'terceira'][vg.onda - 1]} leva dos Cães de Guerra`);
    const n = 3 + vg.onda;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn(i % 2 ? 'brasa' : 'cao', true, W(R.VISAO.x + Math.cos(a) * 7, R.VISAO.z + Math.sin(a) * 7), { nivel: 21 }); e.tag = 'vigilia6'; e.mundo = false;
    }
  }

  /* ================= A TRÉGUA AO AMANHECER ================= */
  function tregua6() {
    if (chefe.falando || chefe.ativo) return;
    chefe.falando = true;
    T.definir(5.6); ui.clarao('#ffe8c8');
    senhoresNoCampo(9);
    const linhas = [
      ['', 'Ao primeiro raio do dia, os dois senhores chegam ao marco, cada um por um lado, sem espada. Atrás deles, de longe, os dois exércitos olham, e ninguém respira.'],
      ['Conde Rodrigo de Rocaforte', 'Fernão.'], ['Barão Fernão de Valverde', 'Rodrigo.'],
      ['', 'Ninguém diz mais nada. De repente, uma flecha sai das fileiras de Rocaforte e se crava no chão, aos pés do Barão.'],
      ['Barão Fernão de Valverde', 'Traição! Eu sabia! Às armas, Valverde!'],
      ['Anjo da Guarda', 'Ninguém atirou. Olhe a flecha: é de fogo negro. Ele está aqui.'],
      ['', 'As cinzas do campo sobem num redemoinho, e do meio delas se ergue um anjo de asas de fumaça, com uma coroa de ferro e uma chave na cintura.']
    ];
    const p = W(R.MARCO.x, R.MARCO.z);
    const depois = () => { senhoresNoCampo(34); desafiar(true); };
    if (OV.cenas) OV.cenas.contar(linhas, { alvo: new THREE.Vector3(p.x, H(p.x, p.z) + 1.6, p.z), raio: 11, altura: 4, olhar: 0.6, giro: 0.1 }, depois); else D.falas(linhas, depois);
  }

  /* ================= ABADON ================= */
  const chefe = { ativo: false, falando: false, final: false, fase: 0, b: null, prov: null, provT: 8, paciencia: 0, revides: 0, anel: null };
  A6.chefe = chefe;
  const intervalo = () => chefe.fase >= 3 ? 8 : chefe.fase >= 2 ? 9.5 : 11;
  function anelDeFogo(b) {
    if (chefe.anel) { M.scene.remove(chefe.anel); chefe.anel = null; }
    if (!b) return;
    const gr = new THREE.Group(); const p = W(R.MARCO.x, R.MARCO.z); gr.position.set(p.x, H(p.x, p.z) + 0.1, p.z);
    const an = new THREE.Mesh(new THREE.RingGeometry(R.MARCO.r - 0.4, R.MARCO.r + 0.6, 72), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false })); an.rotation.x = -Math.PI / 2; gr.add(an);
    const chamas = [];
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.8, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff7a2a : 0xffb04a, transparent: true, opacity: 0.85 })); f.position.set(Math.cos(a) * R.MARCO.r, 0.9, Math.sin(a) * R.MARCO.r); gr.add(f); chamas.push(f); }
    gr.userData.chamas = chamas; M.scene.add(gr); chefe.anel = gr;
  }
  function limparEfeitos() { anelDeFogo(false); chefe.prov = null; if (chefe.b && chefe.b.aura) chefe.b.aura.visible = false; }
  function resetarChefe() {
    ['abadon', 'abadon_add'].forEach(MS.tagRemove);
    limparEfeitos(); Object.assign(chefe, { ativo: false, falando: false, fase: 0, b: null, prov: null, provT: 8, paciencia: 0, revides: 0 });
  }
  function desafiar(primeira) {
    chefe.falando = true;
    if (MS.memChefe && MS.memChefe.tem('abadon')) { chefe.falando = false; iniciarChefe(); return; } // v24: quem já lutou não revê a cena de entrada
    const fala = () => D.abrir(arv('Abadon', {
      a: { txt: primeira ? 'Eu sou Abadon, o Exterminador. Não preciso matar ninguém: eles se matam sozinhos, desde que cada um revide. Uma flecha, e mais três gerações de sangue. É tão fácil.' : 'Voltou? Ótimo. Quem volta para a briga já começou a gostar dela.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: 'Quando ele abrir os braços e provocar, com a aura vermelha, não revide: espere até a provocação passar. A paciência o desarma. Quem bate na hora errada dá de comer a ele.',
        depois: () => { chefe.falando = false; iniciarChefe(); } }
    }));
    const p = W(R.MARCO.x, R.MARCO.z - 8);
    if (primeira && OV.cenas) OV.cenas.poema('abadon', { pos: { x: p.x, z: p.z }, raio: 12, altura: 5 }, fala); else fala();
  }
  function iniciarChefe() {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1; chefe.provT = 7;
    const b = I.spawn('abadon', !(OV.cenas && OV.cenas.trocar('abadon')), W(R.MARCO.x, R.MARCO.z - 10)); b.tag = 'abadon'; chefe.b = b;
    anelDeFogo(true);
    if (MS.etapa('a6m5') === 0) MS.avancar('a6m5', 1);
    A.bell(98, 0.35); J().shake(0.35);
    ui.toast('Um círculo de brasas fecha o Campo das Cinzas.');
  }
  const FRASES_PROV = ['«Bate! Bate, se tiver coragem!» Abadon abre os braços, em brasa. Não revide: espere.', '«Eles mataram os seus! Não vai fazer nada?» Abadon provoca. Espere, sem revidar.', '«Covarde! Até um cão morde quando apanha!» A aura vermelha arde. Paciência: espere.'];
  function provocar(e) {
    chefe.prov = { t: F().graca_martinho ? 2.6 : 3.6 };
    ui.toast(FRASES_PROV[(chefe.paciencia + chefe.revides) % FRASES_PROV.length]); A.bell(110, 0.22); J().shake(0.15);
  }
  function revide(e) {
    chefe.prov = null; chefe.provT = intervalo(); chefe.revides++;
    e.hp = Math.min(e.def.hp, e.hp + e.def.hp * 0.03); e.flash = 0.3;
    const HB = OV.habilidades, d = HB ? HB.durStatus('ira', 9) : 9; if (d > 0) P.status.ira = Math.max(P.status.ira || 0, d);
    ui.toast('Você revidou. Abadon ri e se fortalece, e a Ira pega você: o fôlego não volta.'); A.bell(82, 0.25);
  }
  function paciencia(e) {
    chefe.prov = null; chefe.provT = intervalo(); chefe.paciencia++;
    const gr = !!F().graca_martinho;
    I.atordoar(e, gr ? 5 : 3.5, true); e.marca = gr ? 5 : 3.5; e.marcaF = 0.5;
    if (chefe.paciencia <= 3) MS.ato('temperanca');
    P.hp = Math.min(P.D.maxHp, P.hp + P.D.maxHp * (gr ? 0.15 : 0.08));
    C().anel(0xffe6a8, 3.2, 0.9, 0.8); A.bell(523, 0.16); setTimeout(() => A.bell(659, 0.14), 200);
    ui.toast('Você não revidou. Sem a raiva de ninguém para comer, Abadon fica desarmado: agora!');
  }
  function reduzAbadon(e) { if (chefe.prov) { revide(e); return 0.0001; } return 1; }
  function chamarGafanhotos() {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.4, q = W(R.MARCO.x + Math.cos(a) * 13, R.MARCO.z + Math.sin(a) * 13);
      const e = I.spawn(i === 4 ? 'cao' : 'gafanhoto', true, q, { nivel: 22 }); e.tag = 'abadon_add'; e.mundo = false; e.def = Object.assign({}, e.def, { aggro: 40, leash: 60 });
    }
    ui.toast('Abadon gira a chave: o poço do abismo se abre, e sobem gafanhotos com rosto de homem e coroa de ouro!'); A.bell(147, 0.25); J().shake(0.3);
  }
  function possuirSoldados() {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + 0.8, q = W(R.MARCO.x + Math.cos(a) * 20, R.MARCO.z + Math.sin(a) * 20);
      const e = I.spawn('irado', true, q, { nivel: 22 }); e.tag = 'abadon_add'; e.mundo = false; e.def = Object.assign({}, e.def, { aggro: 40, leash: 60 });
    }
    ui.toast('Soldados dos dois lados correm para o campo, com os olhos em brasa. Não os fira de morte: liberte-os!');
  }
  function oferta(b) {
    limparEfeitos(); anelDeFogo(true); chefe.provT = 6;
    D.abrir(arv('Abadon', {
      a: { txt: 'Queimaram o seu trigo, mataram os seus, cuspiram no seu nome. Um soco merece um soco: olho por olho, dente por dente, é a justiça mais velha do mundo. Pegue a raiva que eu lhe dou e acabe com eles. Com os dois lados.', opc: [
        { t: '"Não pagueis a ninguém o mal com o mal." (Rm 12,17)', ef: () => { F().oferta6 = 'recusou'; MS.ato('temperanca'); }, ir: 'r' },
        { t: 'Só desta vez, que eles paguem...', ef: () => { F().oferta6 = 'cedeu'; P.status.ira = 30; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.15); }, ir: 'c' }] },
      r: { quem: '', txt: 'Abadon range os dentes. Nas duas fileiras, os soldados que olhavam de longe começam a correr para o campo, com os olhos em brasa.', depois: () => possuirSoldados() },
      c: { quem: 'Anjo da Guarda', txt: 'A raiva entrou, e ele ficou mais forte. Mas olhe: os soldados dos dois lados correm para o campo, possuídos. Não os fira de morte: liberte-os.', depois: () => possuirSoldados() }
    }));
  }
  function iaAbadon(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    if (e.asas) e.asas.forEach((a, i) => { a.rotation.y = (i ? -1 : 1) * (0.35 + Math.sin(e.ph * 1.6) * 0.18); });
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) { chefe.fase = 2; chamarGafanhotos(); }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; oferta(e); }
    if (e.aura) { e.aura.visible = !!chefe.prov; if (chefe.prov) e.aura.material.opacity = 0.22 + 0.14 * Math.sin(e.ph * 9); }
    if (D.aberto) return;
    if (chefe.prov) {
      chefe.prov.t -= dt; e.state = 'recover'; e.t = 0.3;
      e.g.rotation.y = Math.atan2(P.pos.x - e.g.position.x, P.pos.z - e.g.position.z);
      if (e.armL) e.armL.rotation.z = -0.9; if (e.armR) e.armR.rotation.z = 0.9;
      if (chefe.prov.t <= 0) paciencia(e);
      return;
    }
    if (e.armL) e.armL.rotation.z = 0; if (e.armR) e.armR.rotation.z = 0;
    chefe.provT -= dt;
    if (chefe.provT <= 0 && e.state !== 'stun' && Math.hypot(P.pos.x - e.g.position.x, P.pos.z - e.g.position.z) < 18) provocar(e);
  }
  function abadonVencido() {
    chefe.ativo = false; chefe.final = true; F().abadon_vencido = true; F().paciencia6 = chefe.paciencia; limparEfeitos();
    I.lista.filter(e => e.tag === 'abadon_add' && vivo(e)).forEach(e => { e.state = e.def.liberta ? 'liberto' : 'dead'; e.deadT = 0; e.t = 0; if (e.lab && e.lab.el) e.lab.el.style.display = 'none'; });
    J().salvar();
    setTimeout(finalAbadon, 1800);
  }
  function finalAbadon() {
    const f = F();
    senhoresNoCampo(4);
    D.abrir(arv('Conde Rodrigo de Rocaforte', {
      a: { quem: '', txt: 'Abadon cai de joelhos nas cinzas, e a terra se abre debaixo dele como um poço. Uma corrente de luz desce do céu e o arrasta para o fundo. O círculo de brasas se apaga. Os soldados libertados olham em volta, sem saber de que lado estão.', prox: 'b' },
      b: { txt: 'Fernão... a crônica diz que os nossos bisavós eram irmãos. E que este campo nunca foi de nenhum dos dois.', prox: 'c' },
      c: { quem: 'Barão Fernão de Valverde', txt: 'Três gerações brigando por um campo que era dos pobres. E queimando o trigo deles todo ano. O que fazemos agora, peregrino?', opc: [
        { t: 'Que o campo volte a ser dos pobres, como diz a crônica: lavrem juntos, e o pão vá para o hospital.', ef: () => { f.marco_fim = 'campo'; MS.ato('caridade'); }, ir: 'c1' },
        { t: 'Ponham o marco de volta na margem do rio velho, onde os fundadores o puseram, e jurem os dois sobre o Evangelho.', ef: () => { f.marco_fim = 'rio'; MS.ato('justica'); }, ir: 'c2' }] },
      c1: { txt: 'Então Rocaforte põe os bois, e Valverde, as sementes. E que ninguém mais acenda fogo neste campo, a não ser o do forno.', prox: 'z' },
      c2: { quem: 'Barão Fernão de Valverde', txt: 'Na margem do rio velho, então. E desta vez com testemunha: o padre, a freira e este peregrino.', prox: 'z' },
      z: { quem: 'Anjo da Guarda', txt: 'Está feito. O Padre Gregório espera na Igreja de São Martinho, do outro lado do rio. Hoje Rocaforte e Valverde vão comungar no mesmo altar.', ef: () => { MS.avancar('a6m5', 2); senhoresEmCasa(); J().salvar(); } }
    }));
  }
  if (MS.missas) MS.missas.push({ nome: 'Igreja de São Martinho', pronta: () => MS.ativa('a6m5') && MS.etapa('a6m5') === 2, iniciar: () => missa6() });
  function missa6() {
    const f = F();
    const linhas = [
      ['', 'A igreja de São Martinho nunca esteve tão cheia. De um lado do corredor, as túnicas vermelhas de Rocaforte; do outro, as verdes de Valverde. Ninguém sabe direito onde se sentar.'],
      ['Padre Gregório', 'Irmãos, ouvistes o que foi dito: olho por olho, dente por dente. Eu, porém, vos digo: amai os vossos inimigos, e rezai pelos que vos perseguem. O Senhor não pede que esqueçamos. Pede que não paguemos o mal com o mal.'],
      ['', 'Na hora da paz, o Conde Rodrigo atravessa o corredor e estende a mão ao Barão Fernão. O Barão fica parado um instante. Depois o abraça.']
    ];
    if (MS.feita('a6s2')) linhas.push(['Fausto, soldado de Valverde', 'A viúva Leonor está ali, no terceiro banco. Ela me perdoou por carta. Hoje vou pedir perdão a ela de joelhos, na frente de todos.']);
    if (MS.feita('a6s3')) linhas.push(['Mestre Teobaldo, o ferreiro', 'Os arados que fiz com as espadas do campo vão abrir a primeira terra amanhã. «Das suas espadas forjarão arados» (Is 2,4). Nunca pensei que fosse ver isso.']);
    if (MS.feita('a6s1')) linhas.push(['Irmã Firmina, a enfermeira', 'O hospital vai ficar vazio, se Deus quiser. Já estou com saudade dos resmungos dos meus soldados.']);
    linhas.push(['', 'Ao fim da Missa, todos vão em procissão até o Campo das Cinzas. Na Lanterna dos Mortos, pela primeira vez em três gerações, uma luz se acende para os que caíram dos dois lados: a Lâmpada da Paciência.']);
    ui.clarao('#000000');
    MS.missaDentro('Igreja de São Martinho', 'padreGregorio', linhas, () => {
      f.ato6_fim = true; MS.concluir('a6m5', f.marco_fim || 'campo');
      R.acenderLampada(true);
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([220, 277, 330, 392, 440][i], 0.3), t));
      setTimeout(() => {
        J().pausar(true);
        ui.fimAto(resumo6(), {
          eyebrow: 'Fim do Ato VI', titulo: 'As espadas viraram arados',
          texto: 'A Lâmpada da Paciência arde na Lanterna dos Mortos, no meio do Campo das Cinzas. A sexta das sete lâmpadas de Albária foi reacesa.',
          cite: 'A oeste, depois do deserto, o Monte Santo se ergue sobre um mosteiro de pedra clara. No alto, uma torre negra que alguém construiu para chegar ao céu sem precisar de Deus. A última lâmpada espera lá em cima.'
        });
        if (MS.aposAto6) MS.aposAto6();
      }, 2600);
    });
  }
  function resumo6() {
    const f = F(), r = [];
    r.push(f.marco_fim === 'rio' ? 'O marco voltou para a margem do rio velho, e os dois senhores juraram sobre o Evangelho.' : 'O Campo das Cinzas voltou a ser dos pobres: Rocaforte e Valverde vão lavrá-lo juntos.');
    if (f.sacrificio_manto) r.push('Como São Martinho, você dividiu o manto com os feridos.');
    r.push(f.oferta6 === 'cedeu' ? 'Você deixou a raiva entrar, por um instante, e Abadon ficou mais forte.' : 'Você não pagou o mal com o mal.');
    if ((f.paciencia6 || 0) >= 3) r.push('Diante da provocação, você esperou, e o anjo do abismo ficou desarmado.');
    if (MS.feita('a6s2')) r.push('A Viúva Leonor perdoou Fausto.');
    if (MS.feita('a6s3')) r.push('As espadas do campo viraram arados.');
    return r;
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"Eu nem lembro de que lado eu estava..."', '"Meu irmão serve em Valverde. Eu ia matá-lo?"', '"Que vergonha. Eu batia nos feridos da carroça."', '"Por que é que eu estava tão bravo? Por uma pedra?"', '"Deus me perdoe. A raiva tomava conta de tudo."', '"Que silêncio bom, de repente."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && naRegiao()) {
      if (MS.ativa('a6m1') && MS.etapa('a6m1') === 0) {
        MS.avancar('a6m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Sente o cheiro de fumaça? Aqui duas casas brigam há três gerações, e ninguém lembra mais por quê. É a Ira: ela não quer justiça, quer revide. Procure a Irmã Firmina, no hospital da vila: lá se cuida dos feridos dos dois lados.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'saomartinho' && MS.ativa('a6m1') && MS.etapa('a6m1') === 2) { concluirA6m1(); return false; }
    if (tipo === 'liberto' && x.def.key === 'irado') {
      x.sumir = true;
      if (x.tag === 'irados6') {
        f.irados6 = f.irados6 || [];
        if (!f.irados6.includes(x.bi)) f.irados6.push(x.bi);
        ui.toast(FRASES[(f.irados6.length - 1) % FRASES.length]);
        if (f.irados6.length >= 6) {
          MS.ato('caridade');
          if (MS.ativa('a6m2')) MS.avancar('a6m2', 1);
          setTimeout(() => D.falas([['Anjo da Guarda', 'Os seis estão livres: três com a túnica vermelha, três com a verde. Repare: libertos, nem sabem mais por que brigavam. Volte à Irmã Firmina.']]), 1600);
        }
      } else if (x.tag === 'abadon_add') ui.toast('O soldado libertado cai de joelhos nas cinzas e larga a espada.');
      else ui.toast('O soldado libertado tira o elmo, olha para as mãos e volta para casa.');
      J().salvar(); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'abadon') { abadonVencido(); return true; }
    if (tipo === 'renascer') {
      if (vg.ativa) { vg.ativa = false; if (st('a6m4')) st('a6m4').e = 0; MS.tagRemove('vigilia6'); M.figuras.martinho.mostrar(false); ui.toast('A vigília foi interrompida. Volte à ponte quando estiver pronto.'); }
      if (chefe.ativo || chefe.b) { resetarChefe(); senhoresEmCasa(); }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  MS.ganchos.update.push(dt => {
    atualizarVigilia(dt);
    if (chefe.anel) { const t = performance.now() / 1000; chefe.anel.userData.chamas.forEach((c, i) => { c.scale.y = 0.7 + Math.abs(Math.sin(t * 5 + i)) * 0.7; }); }
    if (!naRegiao() || chefe.ativo || chefe.falando || P.dead || D.aberto) return;
    if (MS.ativa('a6m5') && MS.etapa('a6m5') === 0 && distMarco() < 9) { tregua6(); return; }
    if (MS.ativa('a6m5') && MS.etapa('a6m5') === 1 && distMarco() < 16) {
      if (F().abadon_vencido) { if (!chefe.final) { chefe.final = true; finalAbadon(); } return; }
      desafiar(false);
    }
  });

  /* ================= DIÁLOGOS ================= */
  ARV.firmina = () => {
    const f = F(), q = 'Irmã Firmina, a enfermeira';
    if (MS.ativa('a6m1') && MS.etapa('a6m1') <= 1) return arv(q, {
      a: { txt: () => `Cuidado com o caminho, ${g('meu filho', 'minha filha')}: aqui no chão tem gente dormindo. Sou a Irmã Firmina. Este é o Hospital de São Martinho. Do lado direito, os feridos de Rocaforte; do esquerdo, os de Valverde. De noite eu troco as camas, para ver se alguém percebe. Ninguém percebe.`, prox: 'b' },
      b: { txt: 'As duas fortalezas brigam por um marco de pedra no meio do campo, do outro lado do rio. O avô do Conde brigou com o avô do Barão, e assim por diante. Ninguém lembra por que começou. Só sabem que o outro começou.', opc: [
        { t: 'E a vila?', ir: 'c' }, { t: 'Como posso ajudar?', ir: 'd' }] },
      c: { txt: 'A vila de São Martinho não é de nenhum dos dois. Nós plantamos, e eles queimam o campo para o outro não colher. E agora há coisa pior: soldados possuídos pela ira atacam as carroças de feridos na Ponte Queimada. De qualquer lado. Já nem sabem de que lado estão.', prox: 'd' },
      d: { txt: 'Acenda primeiro a vela do Oratório de São Martinho, na praça. Depois vá à Ponte Queimada e liberte aqueles pobres soldados. São filhos de alguém. Não os mate.',
        ef: () => { MS.avancar('a6m1', 2); if (prog().oratorios.saomartinho) concluirA6m1(); } }
    });
    if (MS.ativa('a6m1')) return linha(q, 'O Oratório fica na praça, ao norte do cruzeiro.');
    if (MS.ativa('a6m2') && MS.etapa('a6m2') === 1) return arv(q, {
      a: { txt: 'As carroças passaram! Seis feridos novos, e nenhum morto na ponte. Deus lhe pague.', prox: 'b' },
      b: { txt: 'Sabe o que me cortou o coração? O Fausto, de Valverde, está na cama ao lado de um rapaz de Rocaforte. Ontem um segurava a tigela para o outro beber. No campo, um mataria o outro. Por uma pedra.', prox: 'c' },
      c: { txt: 'Ninguém sabe a história daquela pedra. Ou melhor: o Padre Gregório deve saber. A paróquia guardava os livros da Capela do Marco antes do incêndio. Vá falar com ele, na igreja, do outro lado da praça.',
        ef: () => { MS.concluir('a6m2'); setTimeout(() => MS.iniciar('a6m3'), 1200); } }
    });
    if (MS.ativa('a6m2')) return linha(q, () => `Os soldados irados atacam as carroças na Ponte Queimada, ao norte da vila (${livres()}/6).`);
    if (MS.ativa('a6m3')) return linha(q, 'Rezo pelos dois senhores todas as noites. Uma oração para cada um. Às vezes troco os nomes, para ver se Deus percebe. Deus percebe, mas não reclama.');
    if (MS.ativa('a6m4') || MS.ativa('a6m5')) return linha(q, 'Quando a trégua vier, vou levar pão para os dois exércitos. O mesmo pão.');
    if (f.ato6_fim) return linha(q, 'O hospital está esvaziando, graças a Deus. Agora cuido dos velhos e das parturientes, que é trabalho de paz.');
    return linha(q, 'Onde dói? É só isso que eu pergunto aqui.');
  };
  ARV.padreGregorio = () => {
    const f = F(), q = 'Padre Gregório';
    if (MS.ativa('a6m3') && MS.etapa('a6m3') === 0) return arv(q, {
      a: { txt: 'O marco? Ah, peregrino. Faz trinta anos que eu prego sobre aquela pedra, e faz trinta anos que os dois lados acham que o sermão é para o outro.', prox: 'b' },
      b: { txt: 'A Capela do Marco, no meio do campo, tinha um capelão que escrevia tudo: o Livro do Rio. Quando a capela foi incendiada, ele escondeu o livro na arca da sacristia e fugiu. Morreu aqui, no hospital. As últimas palavras dele foram: «Está tudo no livro. Eram irmãos.»', prox: 'c' },
      c: { txt: 'Ninguém voltou à capela: o campo é dos cães de guerra e das brasas. Se você for, a capela fica a sudeste do marco, no caminho para Valverde. Que São Martinho vá com você.',
        ef: () => { MS.avancar('a6m3', 1); MS.respawnQuest(); } }
    });
    if (MS.ativa('a6m3') && MS.etapa('a6m3') === 1) return linha(q, 'A Capela do Marco fica a sudeste do marco, no Campo das Cinzas. Cuidado com os cães.');
    if (MS.ativa('a6m3')) return linha(q, () => tregua() < 2 ? 'O Conde mora em Rocaforte, a oeste do campo; o Barão, em Valverde, a leste. Leve o livro aos dois. A verdade às vezes demora três gerações, mas chega.' : 'Os dois vão ao marco? Sem espada? Glória a Deus. Mas a ira não desiste fácil: reze antes.');
    if (MS.ativa('a6m4')) return linha(q, 'Antes da trégua, vá à Ponte Queimada e reze. O santo desta vila também foi soldado: ele sabe o que é largar a espada.');
    if (MS.ativa('a6m5') && MS.etapa('a6m5') < 2) return linha(q, 'Ao amanhecer, no marco. Eu fico aqui rezando o terço com a Irmã Firmina e as mães dos soldados.');
    if (MS.ativa('a6m5')) return linha(q, 'O altar está pronto. Entre: hoje Rocaforte e Valverde vão comungar do mesmo Pão.');
    if (f.ato6_fim) return linha(q, 'Dizem que no Monte Santo, depois do deserto, há uma torre que alguém ergueu para chegar ao céu sozinho. Que o Senhor tenha piedade de quem sobe sem se ajoelhar.');
    return linha(q, 'Que São Martinho o cubra com a metade do manto.');
  };
  function decidir(quem, r) {
    const f = F();
    if (quem === 'rodrigo') { f.rodrigo_res = r; f.tregua_roca = true; } else { f.fernao_res = r; f.tregua_valv = true; }
    MS.ato(r === 'prudencia' ? 'prudencia' : r === 'caridade' ? 'caridade' : 'justica'); A.bell(587, 0.15);
    if (tregua() >= 2) {
      setTimeout(() => {
        MS.concluir('a6m3', (f.rodrigo_res || '') + '+' + (f.fernao_res || ''));
        D.falas([['Anjo da Guarda', 'Os dois vão ao marco, ao amanhecer, sem espada. Mas a ira não desiste fácil: antes, vá rezar na Ponte Queimada. O santo desta vila também foi soldado.']], () => MS.iniciar('a6m4'));
      }, 900);
    } else setTimeout(() => ui.toast(`${quem === 'rodrigo' ? 'O Conde Rodrigo' : 'O Barão Fernão'} aceitou ir ao marco sem espada. Falta o outro.`), 600);
    J().salvar();
  }
  ARV.rodrigo = () => {
    const f = F(), q = 'Conde Rodrigo de Rocaforte';
    if (MS.ativa('a6m3') && MS.etapa('a6m3') === 2 && !f.tregua_roca) return arv(q, {
      a: { txt: 'Um peregrino no meu salão, vindo do lado de Valverde. Se veio falar de paz, saiba: o meu bisavô morreu defendendo aquele marco, que os de Valverde arrastaram para o nosso lado numa noite de lua nova. Eu não vou ao campo sem espada.', opc: [
        { t: 'Mostrar a crônica: "Ninguém arrastou a pedra. Foi o rio, na enchente de 1203. E os fundadores eram irmãos."', mostrar: () => !!f.cronica, ef: () => decidir('rodrigo', 'justica'), ir: 'j' },
        { t: '"O seu celeiro está vazio. Há três anos ninguém colhe aquele campo, e o inverno vem para os dois lados."', cond: () => P.pers.virt.prudencia >= 16, motivo: 'Prudência 16', ef: () => decidir('rodrigo', 'prudencia'), ir: 'p' },
        { t: 'Pagar às viúvas de Valverde o trigo que Rocaforte queimou. (80 denários)', cond: () => (P.pers.denarios || 0) >= 80, motivo: 'você precisa de 80 denários', ef: () => { P.pers.denarios -= 80; decidir('rodrigo', 'caridade'); }, ir: 'c' },
        { t: 'Deixar para depois.' }] },
      j: { txt: '...É a letra do capelão. Eu a conheço das cartas que ele mandava ao meu pai. "Eram irmãos." Três gerações... Vou ao marco, ao amanhecer. Sem espada.' },
      p: { txt: 'Os meus homens comem pão de bolota desde o Natal. E eu digo que é castigo de Valverde. ...Está bem. Vou ao marco, ao amanhecer, sem espada.' },
      c: { txt: 'Um estrangeiro pagou pelo mal que nós fizemos? Então nós ficamos devendo. E quem deve não ataca. Vou ao marco, ao amanhecer, sem espada.' }
    });
    if (f.tregua_roca && !f.ato6_fim) return linha(q, 'Vou ao marco ao amanhecer. Se Fernão trouxer a espada dele... não. Eu disse que ia sem a minha.');
    if (f.ato6_fim) return linha(q, () => F().marco_fim === 'rio' ? 'Jurei sobre o Evangelho, ao lado de Fernão. A mão dele tremia mais que a minha. Somos primos, sabia? Em sétimo grau, mas somos.' : 'Os meus bois estão arando o campo do meio, ao lado dos homens de Fernão. O primeiro pão vai para o hospital.');
    return linha(q, 'Rocaforte não esquece. Volte quando tiver alguma coisa para dizer, peregrino.');
  };
  ARV.fernao = () => {
    const f = F(), q = 'Barão Fernão de Valverde';
    if (MS.ativa('a6m3') && MS.etapa('a6m3') === 2 && !f.tregua_valv) return arv(q, {
      a: { txt: 'Trégua? Rocaforte matou o meu filho naquele campo, no verão passado. Uma flecha, de longe, como covardes. E você quer que eu vá lá sem espada, para olhar na cara do Conde?', opc: [
        { t: 'Mostrar a crônica: "O marco foi posto pelos dois fundadores, que eram irmãos. Foi o rio que o levou."', mostrar: () => !!f.cronica, ef: () => decidir('fernao', 'justica'), ir: 'j' },
        { t: '"Metade dos seus homens está no hospital do outro lado do rio, deitada ao lado dos de Rocaforte. Quem ainda vai lutar?"', cond: () => P.pers.virt.prudencia >= 16, motivo: 'Prudência 16', ef: () => decidir('fernao', 'prudencia'), ir: 'p' },
        { t: 'Rezar com ele pelo filho que morreu no campo. (60 de Fé)', cond: () => P.fe >= 60, motivo: 'você precisa de 60 de Fé', ef: () => { P.fe -= 60; decidir('fernao', 'caridade'); }, ir: 'c' },
        { t: 'Deixar para depois.' }] },
      j: { txt: '"O campo do meio fica para os pobres de São Martinho." ...O meu filho morreu por um campo que nem era nosso. Vou ao marco. Não por Rodrigo: pelo meu filho.' },
      p: { txt: 'Eu sei. Eu visito os meus feridos de noite, escondido, para não verem o Barão chorar. ...Vou ao marco, ao amanhecer.' },
      c: { txt: '...Pai Nosso, que estais no céu... perdoai as nossas ofensas, assim como nós perdoamos... Como é difícil essa parte. Vou ao marco, peregrino. Sem espada.' }
    });
    if (f.tregua_valv && !f.ato6_fim) return linha(q, 'Ao amanhecer, no marco. Se for uma armadilha, que Deus me encontre rezando, não xingando.');
    if (f.ato6_fim) return linha(q, 'Rodrigo veio jantar ontem. Falamos dos nossos filhos. Os dele estão vivos; o meu, não. Mesmo assim, foi bom.');
    return linha(q, 'Valverde não esquece. Se veio de Rocaforte, volte para lá.');
  };
  ARV.martinho = () => linha('São Martinho de Tours', 'Sou soldado de Cristo. Bem-aventurados os mansos, porque possuirão a terra.');
  ARV.fausto = () => linha('Fausto, soldado de Valverde', () => MS.feita('a6s2') ? 'Ela me perdoou. Eu não sabia que isso pesava tanto. Pesa mais que a armadura, e é mais leve que tudo.' : F().ato6_fim ? 'Vou ficar na vila depois que sarar. Teobaldo precisa de alguém para segurar os arados.' : 'Fui eu que matei o marido da Viúva Leonor, na ponte. Ele carregava feridos. Eu nem vi o rosto dele. Agora não consigo dormir.');
  ARV.leonor = () => linha('Viúva Leonor', () => F().ato6_fim ? 'O Fausto veio me pedir perdão de joelhos, na igreja. Eu disse para ele levantar e vir almoçar.' : 'O meu marido levava os feridos de carroça, de um lado para o outro. Dizia que ferido não tem lado. Morreu na ponte.');
  R.MORADORES.forEach(([x, z, r, op, a, b]) => {
    M.criarFigura(x + R.OX, z + R.OZ, r, op);
    let k = 0; ARV[op.id] = () => linha(op.nome, F().ato6_fim ? 'Hoje vi um soldado de Rocaforte e um de Valverde dividindo o mesmo pão na ponte. A ponte nova.' : (k++ % 2) ? b : a);
  });
  if (OV.vida) {
    Object.assign(OV.vida.PASSEIO, { mor_marca3: 5, mor_marca4: 4 });
    Object.assign(OV.vida.SINAL, {
      firmina: () => (MS.ativa('a6m1') && MS.etapa('a6m1') <= 1) || (MS.ativa('a6m2') && MS.etapa('a6m2') === 1) ? '?' : null,
      padreGregorio: () => (MS.ativa('a6m3') && MS.etapa('a6m3') === 0) ? '?' : null,
      rodrigo: () => (MS.ativa('a6m3') && MS.etapa('a6m3') === 2 && !F().tregua_roca) ? '?' : null,
      fernao: () => (MS.ativa('a6m3') && MS.etapa('a6m3') === 2 && !F().tregua_valv) ? '?' : null
    });
    OV.vida.santosLuz.push('martinho');
  }
  if (IT) { IT.SACERDOTES.padreGregorio = 'Padre Gregório'; IT.criarCapela(R.CAPELA.x + R.OX, R.CAPELA.z + R.OZ, Math.atan2(-R.CAPELA.x, 128 - R.CAPELA.z) + Math.PI / 2, 'Capela do Peregrino (Marca Ardente)'); }

  /* ================= OS ITENS DO ATO VI ================= */
  Object.assign(OV.ITENS, {
    mantoMartinho: { nome: 'Metade do Manto de São Martinho', slot: 'veste', descr: '+40 de vida máxima e +10 de Fé máxima, e a Ira dura metade do tempo em você.', mods: { hp: 40, fe: 10, meio: ['ira'] }, cor: 0x9a1a1a },
    granadaJoao: { nome: 'Romã de São João de Deus', slot: 'santo', guilda: true, descr: 'Insígnia dos Hospitaleiros: +30 de vida máxima, e no Recolhimento a Fé volta 15% mais rápido.', mods: { hp: 30, prayFe: 1.15 } }
  });
  if (IT.HAGIO) Object.assign(IT.HAGIO, {
    mantoMartinho: 'A metade do manto que São Martinho não deu ao pobre de Amiens foi guardada pelos reis francos como relíquia: a «capa». O lugar onde ela era guardada passou a se chamar «capela».',
    granadaJoao: 'São João de Deus (1495-1550) foi soldado, pastor e livreiro antes de fundar, em Granada, um hospital onde ninguém era recusado. A romã com a cruz é o símbolo da sua ordem.'
  });

  /* ================= SÃO MARTINHO, COMO A IGREJA O RETRATA ================= */
  // soldado romano, de couraça, cortando com a espada o manto vermelho ao meio
  if (OV.modeloSanto) {
    OV.modeloSanto.martinho = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a2a14); m.emissiveIntensity = 0.6; return m; };
      const tunica = bri(sm(0xd8ccb0)), couraca = bri(sm(0xb0b6c0, { metalness: 0.5, roughness: 0.4 })), manto = bri(sm(0x9a1a1a)), carne = bri(sm(0xc8a07a)), cabelo = bri(sm(0x4a3420)), ouro = bri(sm(0xd8b048));
      gr.add(mesh(new THREE.CylinderGeometry(0.3, 0.42, 1.2, 8), tunica, 0, 0.82, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.62, 0.6, 0.4), couraca, 0, 1.62, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.66, 0.14, 0.44), ouro, 0, 1.32, 0));
      // o manto, só metade (a outra ficou com o pobre)
      const mt = mesh(new THREE.BoxGeometry(0.4, 1.3, 0.12), manto, -0.2, 1.3, -0.24); mt.rotation.z = -0.12; gr.add(mt);
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), carne, 0, 2.02, 0.03));
      gr.add(mesh(new THREE.BoxGeometry(0.38, 0.18, 0.36), cabelo, 0, 2.15, -0.02));
      // a espada erguida
      const esp = new THREE.Group(); esp.position.set(0.42, 1.4, 0.2); esp.rotation.z = -0.5; gr.add(esp);
      esp.add(mesh(new THREE.BoxGeometry(0.06, 1.0, 0.03), bri(sm(0xd8dce4, { metalness: 0.8 })), 0, 0.55, 0)); esp.add(mesh(new THREE.BoxGeometry(0.26, 0.05, 0.06), ouro, 0, 0.05, 0));
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.36, -0.1); gr.add(h);
    };
    if (OV.vida) OV.vida.vestirSanto('martinho', 'martinho');
  }

  /* ================= AS CARTAS DO ATO VI ================= */
  OV.cartasExtra = Object.assign(OV.cartasExtra || {}, {
    a6m1: ['Da Irmã Firmina', 'Paz e bem. Aqui na Marca, Rocaforte e Valverde brigam há três gerações, e nós, da vila de São Martinho, enterramos os mortos dos dois lados. Se alguém da Vila dos Muros souber derrubar o que separa irmãos, que venha.'],
    a6m2: ['Do diário do peregrino', 'Na Ponte Queimada, soldados possuídos pela ira atacam as carroças de feridos. Túnicas vermelhas e verdes, misturadas: já nem sabem de que lado estão. São filhos de alguém: é preciso libertá-los, não matá-los.'],
    a6m3: ['Do diário do peregrino', 'Ninguém lembra por que a guerra começou. O capelão da Capela do Marco escreveu tudo num livro e o escondeu antes de fugir. Suas últimas palavras foram: «Eram irmãos.»'],
    a6m4: ['Do diário do peregrino', 'O santo desta vila foi soldado: cortou o manto ao meio para um pobre e depois largou a espada. Antes da trégua, é preciso rezar na Ponte Queimada.'],
    a6m5: ['Do diário do peregrino', 'Os dois senhores vão ao marco ao amanhecer, sem espada. Mas quem se alimenta da raiva de três gerações não vai deixá-los apertar as mãos sem lutar.'],
    a6s1: ['Da Irmã Doroteia', 'Preciso de milfolhas, a erva dos soldados, para estancar o sangue. Cresce no Campo das Cinzas, justamente onde os cães rondam.'],
    a6s2: ['Da Viúva Leonor', 'O soldado que matou o meu marido está no hospital, e não dorme. Escrevi uma carta para ele. Não tenho coragem de entregar: leve você.'],
    a6s3: ['De Mestre Teobaldo', 'Há espadas abandonadas pelo Campo das Cinzas. Traga-as para a forja: vou fazer arados. Que o ferro sirva à vida.'],
    ma_calabouco: ['Do Velho Damião', 'Passei vinte anos no Calabouço da Torre Caída, preso pelos dois lados, cada um achando que eu era espião do outro. Deixei lá um crucifixo que talhei na madeira da porta. Traga-o, se o gigante deixar.']
  });

  /* ================= O POEMA DE ABADON E O DO GIGANTE ================= */
  if (OV.cenas && OV.cenas.POEMAS) Object.assign(OV.cenas.POEMAS, {
    abadon: ['Abadon, o Anjo do Abismo', [
      'Não sou eu quem mata: eu só entrego a pedra,\na flecha, a palavra, a lembrança, o rancor.\nUm empurra, o outro empurra, e a guerra medra\nsozinha, como o mato, sem precisar de flor.',
      'Eu guardo a chave do poço sem fundo,\nde lá sobem meus gafanhotos coroados.\nSe batem em ti, bate: é a regra do mundo.\nE os filhos dos teus filhos serão meus soldados.']],
    gigante: ['Gigante de Cinza', [
      'Fui feito das casas que a guerra queimou,\ndos telhados, das camas, dos berços, do pão.\nCada fogo aceso no campo me criou,\ne cada vingança me deu mais um pulmão.',
      'Na torre caída guardei os presos\nque cada lado jurava ser do outro lado.\nCinza não perdoa: só acumula os pesos\nde tudo o que foi, e não foi perdoado.']]
  });

  /* ================= AS MISSÕES DA MARCA (Aventuras) ================= */
  if (AV && AV.ajuda) {
    const aj = AV.ajuda, L = M.AVENTURA.LUGARES, ACH = M.AVENTURA.ACHADOS;
    // os achados novos: a espada abandonada no campo, e o feixe de espadas carregado
    AV.MODELOS.espada = () => { const g = new THREE.Group(); const l = mesh(new THREE.BoxGeometry(0.08, 1.0, 0.03), sm(0x8a8a90, { metalness: 0.6 }), 0, 0.55, 0); l.rotation.z = 0.25; g.add(l); g.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.06), sm(0x5a4a2a), -0.12, 0.08, 0)); return g; };
    AV.PROPS.espadas = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const l = mesh(new THREE.BoxGeometry(0.05, 0.7, 0.02), sm(0x8a8a90, { metalness: 0.6 }), (i - 1) * 0.06, 0, 0); l.rotation.z = (i - 1) * 0.12; g.add(l); } g.add(mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), sm(0x5a4a2a), 0, -0.3, 0)); return g; };
    // ---- a Irmã Firmina e a milfolhas, a erva dos soldados
    const cald = aj.caldeirao(R.CALDEIRAO.x + R.OX, R.CALDEIRAO.z + R.OZ, true);
    const colErvas = { id: 'm6_ervas', missao: 'a6s1', etapa: 0, pontos: ACH.ervas, modelo: 'erva', nome: 'Milfolhas', texto: 'Colher a milfolhas', carga: 'cesto',
      guarda: [[['cao', 20]], null, [['brasa', 21], ['cao', 20]], null] };
    AV.coleta(colErvas);
    AV.missao({ id: 'a6s1', ato: 6, nome: 'A Erva dos Soldados', npc: 'doroteia', xp: 230, den: 60, itens: [['pao', 2], ['agua', 1]], requer: () => MS.feita('a6m1'),
      etapas: [() => `Colha a milfolhas que cresce no Campo das Cinzas (${aj.conta(colErvas)()}).`, 'Leve o cesto de milfolhas à Irmã Doroteia, no hospital.'],
      alvos: [aj.proximo(colErvas), aj.ondeFig('doroteia')],
      convite: 'Sabe por que chamam a milfolhas de erva dos soldados? Porque estanca o sangue. Aquiles, dizem os antigos, curava os seus homens com ela. E Deus, que tem humor, faz ela crescer justamente no campo onde eles se ferem. A Irmã Firmina precisa de unguento, e eu já não tenho.',
      aceitar: 'Eu colho a milfolhas.', aceito: 'Quatro moitas, espalhadas pelo Campo das Cinzas. Florzinhas brancas, em guarda-chuva. Os cães rondam: cuidado.',
      lembrete: () => `Ainda faltam moitas de milfolhas (${aj.conta(colErvas)()}).`,
      agradece: 'Que cheiro de remédio bom! Venha, vou pôr no caldeirão agora mesmo.',
      entrega: { acao: 'panela', prop: 'cesto', alvo: () => cald, falas: [['Irmã Doroteia, a boticária', 'Um unguento para os de Rocaforte, e o mesmo unguento para os de Valverde. Leve este pão e esta água: na estrada, você também é um ferido em potencial.']] },
      depois: 'O unguento de milfolhas está fazendo milagre. Quer dizer: Deus faz, a erva ajuda.' });
    ARV.doroteia = () => linha('Irmã Doroteia, a boticária', 'Cada erva tem o seu santo, dizia a minha mestra. A milfolhas é de São Martinho: cresce onde os soldados caem.');
    // ---- a Viúva Leonor e a carta de perdão ao soldado Fausto
    AV.missao({ id: 'a6s2', ato: 6, nome: 'A Carta de Leonor', npc: 'leonor', receptor: 'fausto', xp: 240, den: 40, itens: [['vela', 2]], requer: () => MS.feita('a6m2'),
      etapas: ['Leve a carta da Viúva Leonor a Fausto, o soldado de Valverde, no hospital.'],
      alvos: [aj.ondeFig('fausto')],
      convite: 'O meu marido levava os feridos de carroça, dos dois lados. Um soldado de Valverde o matou na ponte, de noite, sem ver quem era. A Irmã Firmina me disse quem foi: está no hospital, e não dorme. Escrevi uma carta para ele. Não tenho coragem de entregar.',
      aceitar: 'Eu levo a carta.', aceito: 'Chama-se Fausto. Diga a ele que fui eu que escrevi. Só isso.',
      lembrete: 'Fausto está no Hospital de São Martinho, numa das camas do fundo.',
      agradece: '...Uma carta? Da Viúva Leonor? Eu... não sei se consigo ler.',
      entrega: { acao: 'ler', prop: 'carta', dur: 3, falas: [['Fausto, soldado de Valverde', '"O meu marido dizia que ferido não tem lado. Você também está ferido. Eu perdoo você. Durma." ...Ela me perdoou. Eu matei o marido dela, e ela me perdoou. Tome isto: era do meu pai. Eu não mereço.']] },
      aoConcluir: () => { F().fausto_perdoado = true; },
      depois: 'Ontem eu dormi a noite inteira. Pela primeira vez desde a ponte.' });
    AV.carga('carta', () => MS.ativa('a6s2') && MS.etapa('a6s2') === 0, 'a6s2');
    // ---- Mestre Teobaldo: das espadas, arados (Is 2,4)
    const colEsp = { id: 'm6_espadas', missao: 'a6s3', etapa: 0, pontos: ACH.espadas, modelo: 'espada', nome: 'Espada abandonada', texto: 'Recolher a espada abandonada', carga: 'espadas',
      guarda: [[['irado', 21]], [['cao', 21], ['brasa', 21]], null] };
    AV.coleta(colEsp);
    ARV.teobaldo = () => (OV.oficio && OV.oficio.FERREIROS && OV.oficio.FERREIROS.teobaldo && MS.feita('a6s3')) ? OV.oficio.menuFerreiro(OV.oficio.FERREIROS.teobaldo) : linha('Mestre Teobaldo, o ferreiro', F().ato6_fim ? 'Arados, enxadas, foices. Nunca martelei tanto, e nunca dormi tão bem.' : 'Antes eu fazia espadas para os dois lados. Era bom negócio. Agora não faço mais nenhuma.');
    AV.missao({ id: 'a6s3', ato: 6, nome: 'Espadas em Arados', npc: 'teobaldo', xp: 260, den: 70, itens: [], requer: () => MS.feita('a6m2'),
      etapas: [() => `Recolha as espadas abandonadas no Campo das Cinzas (${aj.conta(colEsp)()}).`, 'Leve as espadas à forja de Mestre Teobaldo, a oeste da praça.'],
      alvos: [aj.proximo(colEsp), aj.ondeFig('teobaldo')],
      convite: 'Vinte anos fazendo espadas para Rocaforte e para Valverde. Bom negócio: quanto mais um lado comprava, mais o outro comprava. Um dia vi uma espada minha nas costas de um menino morto. Desde então não faço mais nenhuma. Mas no campo há espadas largadas. Traga-as para mim.',
      aceitar: 'Eu trago as espadas.', aceito: 'Três, que eu vi da ponte: uma perto do caminho de Rocaforte, uma perto da Capela do Marco e uma no meio do campo. Cuidado: os soldados irados voltam para buscá-las.',
      lembrete: () => `Faltam espadas (${aj.conta(colEsp)()}).`,
      agradece: 'Boas lâminas. Ferro de primeira, que eu mesmo malhei. Agora vai ser malhado de novo.',
      entrega: { acao: 'forja', prop: 'espadas', alvo: () => R.FORJA_TEO(), dur: 4, falas: [['Mestre Teobaldo, o ferreiro', '«Das suas espadas forjarão arados, e das suas lanças, foices. Uma nação não levantará a espada contra outra» (Is 2,4). Três arados. E com o que sobrou do ferro bom, agora posso forjar uma arma do grau de Santo Elói para você: traga os materiais.']] },
      depois: 'Os arados estão prontos. Falta só a paz para usá-los.' });
    AV.carga('espadas', () => MS.ativa('a6s3') && MS.etapa('a6s3') === 1, 'a6s3');
    // ---- o Velho Damião e o Calabouço da Torre Caída
    AV.npc('damiao', 'Velho Damião, o antigo preso', L.damiao.x, L.damiao.z, Math.PI * 0.8, { cor: 0x4a4a42, cabelo: 0xd8d4cc });
    AV.masmorra({ id: 'calabouco', nome: 'Calabouço da Torre Caída', x: L.calabouco.x, z: L.calabouco.z, rot: L.calabouco.rot, regiao: 'marca', estilo: 'ruina', tema: 'cripta',
      salasDef: [{ inimigos: [['cao', 22], ['cao', 22], ['irado', 22], ['brasa', 22]] }, { inimigos: [['irado', 23, 'forte'], ['brasa', 23], ['cao', 23], ['gafanhoto', 23]] }, { chefe: ['gigante', 24], inimigos: [['brasa', 23], ['brasa', 23]] }],
      tesouro: { den: [220, 290], itens: [['agua', 3], ['vela', 2]], equip: true, raro: 0.8 } });
    AV.missao({ id: 'ma_calabouco', ato: 6, nome: 'O Calabouço da Torre Caída', npc: 'damiao', xp: 400, den: 130, itens: [['agua', 2]], requer: () => MS.feita('a6m1'),
      etapas: [() => `Purifique o Calabouço da Torre Caída, a leste da vila (salas: ${AV.salasLivres('calabouco')}/3).`, 'Leve o crucifixo de madeira ao Velho Damião.'],
      alvos: [aj.entradaDe('calabouco'), aj.ondeFig('damiao')],
      convite: 'Vinte anos naquele calabouço. Rocaforte me prendeu dizendo que eu era espião de Valverde; quando Valverde tomou a torre, me deixou lá dizendo que eu era de Rocaforte. Eu era só um pastor. Na cela, talhei um crucifixo na madeira da porta. Ficou lá. Hoje mora lá um gigante feito das cinzas de tudo o que essa guerra queimou.',
      aceitar: 'Eu trago o seu crucifixo.', aceito: 'Está na última cela, onde o gigante dorme. Não tenha raiva dele: ele é só o que sobrou.',
      aoAceitar: aj.jaFeita('ma_calabouco', 'calabouco'),
      lembrete: () => `O calabouço continua escuro (salas: ${AV.salasLivres('calabouco')}/3).`,
      agradece: 'O meu crucifixo! Ainda tem a marca das minhas unhas. Rezei com ele vinte anos. Perdoei os dois lados com ele na mão.',
      entrega: { acao: 'dar', prop: 'reliquia', falas: [['Velho Damião, o antigo preso', 'Vou levá-lo ao Padre Gregório, para pôr na Capela do Marco quando a reconstruírem. Que quem passar por lá saiba: dá para perdoar até vinte anos. Tome isto, que é tudo o que um velho preso tem.']] },
      depois: 'Às vezes vou até o calabouço só para ver a luz entrando pela porta aberta.' });
    aj.ligarMasmorra('ma_calabouco', 'calabouco');
    AV.carga('reliquia', () => MS.ativa('ma_calabouco') && MS.etapa('ma_calabouco') === 1, 'ma_calabouco');
    // ---- os Hospitaleiros de São João de Deus
    AV.npc('camilo', 'Irmão Camilo, o hospitaleiro', L.camilo.x - 1.2, L.camilo.z + 1, Math.PI * 0.75, { cor: 0x1a1a1a, cabelo: 0x5a4a3a });
    AV.guilda({ id: 'hospitaleiros', nome: 'Irmãos de São João de Deus', curto: 'Hospitaleiros', regiao: 'marca', ato: 6, mestre: 'camilo', ondeMestre: 'junto ao quadro dos irmãos, entre a vila e o rio',
      quadro: { x: L.camilo.x + 1.8, z: L.camilo.z + 1.2, rot: Math.PI * 0.75 }, cor: 0x1a1a2a, titulos: ['Irmão Enfermeiro', 'Irmão Esmoler', 'Irmão Hospitaleiro'],
      convite: 'São João de Deus foi soldado, pastor e livreiro, antes de enlouquecer de amor a Deus. Saía à noite pelas ruas de Granada gritando: «Fazei o bem, irmãos, a vós mesmos!», e trazia os doentes nas costas. Quer ser dos nossos? Vença vinte vícios aqui na Marca: cada um deles é uma ferida a menos.',
      contratos: [
        { nome: 'Feridas a menos', tipo: 'vencer', n: 20, txt: 'Vença ou liberte vinte vícios na Marca Ardente', xp: 240, den: 90, fala: 'Vinte! A Irmã Firmina vai ter menos trabalho esta semana. Você é Irmão Enfermeiro.' },
        { nome: 'As esmolas escondidas', tipo: 'baus', n: 3, txt: 'Abra três baús escondidos pela Marca Ardente', xp: 260, den: 80, itens: [['pao', 3]], fala: 'Tudo para o hospital, não é? Bom. Você é Irmão Esmoler.' },
        { nome: 'A torre caída', tipo: 'masmorra', masmorra: 'calabouco', txt: 'Purifique o Calabouço da Torre Caída', xp: 340, den: 150, itens: [['granadaJoao', 1]], fala: 'O gigante caiu! Tome a romã de São João de Deus: a fruta de muitos grãos debaixo de uma casca só, como os doentes debaixo do mesmo teto. Você é Irmão Hospitaleiro.' }
      ] });
    AV.ligarNpcs();
  }
})(window.OV);

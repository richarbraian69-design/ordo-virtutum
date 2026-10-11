/* Ordo Virtutum — os vícios: modelos, comportamento e surgimento */
(function (OV) {
  'use strict';
  const { lerp, angWrap, turnTo } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, M = OV.mundo;

  function makeIra() {
    const g = new THREE.Group();
    const body = sm(0x4a0b0b, { emissive: 0x2a0000 });
    const ember = sm(0xff5a1f, { emissive: 0xff3a0a, emissiveIntensity: 1.1 });
    const black = sm(0x120808);
    const eye = new THREE.MeshBasicMaterial({ color: 0xffd23a });
    g.add(mesh(new THREE.ConeGeometry(0.5, 1.1, 7), body, 0, 1.12, 0));
    // pernas de bode, curtas e nervosas
    const pernasIra = OV.andar.pernas(g, 0.17, 0.66, { coxa: 0.33, canela: 0.31, larg: 0.14, mat: black, matPe: ember, pe: [0.16, 0.08, 0.22] });
    const chest = mesh(new THREE.ConeGeometry(0.22, 0.9, 5), ember, 0, 1.1, 0.33); chest.rotation.x = 0.3; g.add(chest);
    g.add(mesh(new THREE.SphereGeometry(0.3, 7, 6), black, 0, 1.85, 0));
    [-1, 1].forEach(s => {
      const h = mesh(new THREE.ConeGeometry(0.07, 0.5, 5), ember, 0.17 * s, 2.15, 0); h.rotation.z = -0.5 * s; g.add(h);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), eye); e.position.set(0.1 * s, 1.88, 0.26); g.add(e);
    });
    const arm = s => {
      const p = new THREE.Group(); p.position.set(0.42 * s, 1.45, 0);
      p.add(mesh(new THREE.BoxGeometry(0.14, 0.8, 0.14), body, 0, -0.4, 0));
      const c = mesh(new THREE.ConeGeometry(0.09, 0.3, 4), ember, 0, -0.92, 0); c.rotation.x = Math.PI; p.add(c);
      g.add(p); return p;
    };
    return { g, armL: arm(-1), armR: arm(1), mats: [body, black], eye, eyeBase: 0xffd23a, pernas: pernasIra, passada: 0.5, marchaO: { A: 0.55, K: 1.0 } };
  }
  function makePreguica() {
    const g = new THREE.Group();
    const body = sm(0x4a4d38, { emissive: 0x0c0e06 });
    const skin = sm(0x66674e);
    const iron = sm(0x2b2b2e, { metalness: 0.6, roughness: 0.5 });
    const eye = new THREE.MeshBasicMaterial({ color: 0x9adf6a });
    const belly = mesh(new THREE.SphereGeometry(1, 8, 6), body, 0, 1.22, 0); belly.scale.set(1, 0.85, 0.95); g.add(belly);
    g.add(mesh(new THREE.SphereGeometry(0.38, 7, 6), skin, 0, 2.14, 0.38));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eye); e.position.set(0.13 * s, 2.17, 0.71); g.add(e); });
    const pernasPreg = OV.andar.pernas(g, 0.45, 0.58, { coxa: 0.3, canela: 0.27, larg: 0.3, mat: skin, matPe: iron, pe: [0.34, 0.1, 0.42] });
    const arm = s => {
      const p = new THREE.Group(); p.position.set(0.95 * s, 1.67, 0);
      p.add(mesh(new THREE.CylinderGeometry(0.22, 0.18, 1.3, 6), skin, 0, -0.65, 0));
      p.add(mesh(new THREE.SphereGeometry(0.28, 6, 5), skin, 0, -1.35, 0));
      g.add(p); return p;
    };
    g.add(mesh(new THREE.SphereGeometry(0.32, 7, 6), iron, 0.7, 0.32, -0.9));
    return { g, armL: arm(-1), armR: arm(1), mats: [body, skin], eye, eyeBase: 0x9adf6a, pernas: pernasPreg, passada: 0.45, marchaO: { A: 0.32, K: 0.45, bob: 0.12 }, ginga: 0.09 };
  }
  function makeSoberba() {
    const g = new THREE.Group();
    const robe = sm(0x120e16, { metalness: 0.3, roughness: 0.6, emissive: 0x07040a });
    const gold = sm(0xc9a24a, { metalness: 0.85, roughness: 0.3, emissive: 0x2a1a00 });
    const mirror = sm(0xd8dde6, { metalness: 1, roughness: 0.12 });
    const cape = sm(0x3a1240);
    const eye = new THREE.MeshBasicMaterial({ color: 0xf2efe6 });
    const mantoS = mesh(new THREE.ConeGeometry(0.75, 2.2, 8), robe, 0, 1.4, 0); g.add(mantoS);
    const pernasS = OV.andar.pernas(g, 0.2, 0.62, { coxa: 0.32, canela: 0.3, larg: 0.15, mat: robe, matPe: gold, pe: [0.17, 0.08, 0.3] });
    const c = mesh(new THREE.BoxGeometry(1.3, 2.2, 0.06), cape, 0, 1.35, -0.42); c.rotation.x = 0.12; g.add(c);
    [-1, 1].forEach(s => g.add(mesh(new THREE.SphereGeometry(0.26, 6, 5), gold, 0.48 * s, 2.35, 0)));
    g.add(mesh(new THREE.SphereGeometry(0.33, 10, 8), mirror, 0, 2.75, 0));
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.02), eye); slit.position.set(0, 2.78, 0.32); g.add(slit);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.07, 0.38, 4), gold, Math.cos(a) * 0.27, 3.1, Math.sin(a) * 0.27)); }
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 10), gold, 0, 2.98, 0));
    const arm = s => { const p = new THREE.Group(); p.position.set(0.55 * s, 2.25, 0); p.add(mesh(new THREE.BoxGeometry(0.16, 0.95, 0.16), robe, 0, -0.47, 0)); g.add(p); return p; };
    const armL = arm(-1), armR = arm(1);
    const sc = new THREE.Group(); sc.position.set(0, -0.95, 0.05); sc.rotation.x = Math.PI / 2;
    sc.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), gold, 0, 0.5, 0));
    sc.add(mesh(new THREE.OctahedronGeometry(0.16, 0), gold, 0, 1.45, 0));
    armR.add(sc);
    return { g, armL, armR, mats: [robe, gold], eye, eyeBase: 0xf2efe6, pernas: pernasS, manto: mantoS, passada: 0.7, marchaO: { A: 0.38, K: 0.6 } };
  }

  function makeDiabrete() {
    const g = new THREE.Group();
    const body = sm(0x2a0b0e, { emissive: 0x1a0004 });
    const horn = sm(0x8a2a18, { emissive: 0x3a0a04 });
    const wing = sm(0x1a0a0c, { side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffb02a });
    const asas = [], pendentes = [];
    g.add(mesh(new THREE.SphereGeometry(0.34, 7, 6), body, 0, 0.7, 0));
    g.add(mesh(new THREE.SphereGeometry(0.24, 7, 6), body, 0, 1.12, 0.06));
    [-1, 1].forEach(s => {
      const h = mesh(new THREE.ConeGeometry(0.05, 0.28, 4), horn, 0.11 * s, 1.36, 0.02); h.rotation.z = -0.5 * s; g.add(h);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), eye); e.position.set(0.08 * s, 1.14, 0.27); g.add(e);
      const wp = new THREE.Group(); wp.position.set(0.1 * s, 0.95, -0.18); g.add(wp); asas.push(wp);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), wing); w.position.set(0.33 * s, 0, 0); wp.add(w); wp.rotation.y = 0.6 * s;
      const lp = new THREE.Group(); lp.position.set(0.14 * s, 0.45, 0); lp.add(mesh(new THREE.BoxGeometry(0.1, 0.42, 0.1), body, 0, -0.21, 0)); g.add(lp); pendentes.push(lp);
    });
    const tail = mesh(new THREE.ConeGeometry(0.05, 0.6, 4), horn, 0, 0.55, -0.42); tail.rotation.x = -1.1; g.add(tail);
    const arm = s => { const p = new THREE.Group(); p.position.set(0.32 * s, 0.86, 0.05); p.add(mesh(new THREE.BoxGeometry(0.09, 0.42, 0.09), body, 0, -0.21, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [body], eye, eyeBase: 0xffb02a, asas, pendentes };
  }
  function makeLarva() {
    const g = new THREE.Group();
    const body = sm(0x5a5e48, { emissive: 0x0a0c04 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xb8d870 });
    const segs = [[0, 0.38, 0.35, 0.36], [0, 0.34, -0.15, 0.32], [0, 0.3, -0.58, 0.27], [0, 0.26, -0.92, 0.2]].map(([x, y, z, r]) => { const m = mesh(new THREE.SphereGeometry(r, 7, 6), body, x, y, z); m.userData.y0 = y; m.userData.z0 = z; g.add(m); return m; });
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), eye); e.position.set(0.12 * s, 0.5, 0.66); g.add(e); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.25 * s, 0.5, 0.45); p.add(mesh(new THREE.ConeGeometry(0.05, 0.3, 4), body, 0, -0.15, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [body], eye, eyeBase: 0xb8d870, segs, passada: 0.32 };
  }

  function makePossesso(cor, capuz) {
    return function () {
      const g = new THREE.Group();
      const robe = sm(cor || 0x2a2622, { emissive: 0x0a0204 }), skin = sm(0x9a7a68, { emissive: 0x050000 });
      const eye = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
      g.add(mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.72, 7), robe, 0, 1.29, 0));
      g.add(mesh(new THREE.BoxGeometry(0.58, 0.55, 0.38), robe, 0, 1.6, 0));
      const pernas = OV.andar.pernas(g, 0.13, 0.95, { coxa: 0.47, canela: 0.43, larg: 0.16, prof: 0.19, mat: sm(0x241c18), matPe: sm(0x120e0c), pe: [0.18, 0.08, 0.3] });
      pernas.saia = OV.andar.saia(g, robe, 0.36, 0.46, 0.62, 0.97, 7);
      const head = new THREE.Group(); head.position.set(0, 2.0, 0.02); head.rotation.z = 0.25; g.add(head);
      head.add(mesh(new THREE.SphereGeometry(0.19, 8, 7), skin, 0, 0, 0));
      head.add(mesh(new THREE.SphereGeometry(0.22, 8, 7), capuz ? robe : sm(0x1a1210), 0, 0.04, -0.06));
      [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), eye); e.position.set(0.07 * s, 0.02, 0.18); head.add(e); });
      const arm = s => { const p = new THREE.Group(); p.position.set(0.36 * s, 1.75, 0); p.add(mesh(new THREE.BoxGeometry(0.15, 0.7, 0.17), robe, 0, -0.35, 0)); p.add(mesh(new THREE.SphereGeometry(0.07, 5, 4), skin, 0, -0.74, 0)); g.add(p); return p; };
      return { g, armL: arm(-1), armR: arm(1), mats: [robe, skin, pernas.saia.mat], eye, eyeBase: 0xff2a1a, pernas, saia: pernas.saia, passada: 0.72 };
    };
  }
  OV.makePossesso = makePossesso;
  function makeLobo() {
    const g = new THREE.Group();
    const pelo = sm(0x4a4440), escuro = sm(0x2a2624);
    const eye = new THREE.MeshBasicMaterial({ color: 0xd8b040 });
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.55, 1.3), pelo, 0, 0.85, 0));
    g.add(mesh(new THREE.BoxGeometry(0.45, 0.42, 0.5), pelo, 0, 1.1, 0.8));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.22, 0.34), escuro, 0, 1.0, 1.15));
    [-1, 1].forEach(s => { const o = mesh(new THREE.ConeGeometry(0.08, 0.2, 4), pelo, 0.14 * s, 1.4, 0.75); g.add(o); const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.12 * s, 1.17, 1.05); g.add(e); });
    const tail = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.6), pelo, 0, 0.95, -0.85); tail.rotation.x = 0.6; g.add(tail);
    const legs = [];
    [[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]].forEach(([x, z]) => legs.push(OV.andar.perna(g, x, 0.64, { z, coxa: 0.32, canela: 0.3, larg: 0.13, mat: escuro, pe: [0.14, 0.06, 0.2] })));
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [pelo], eye, eyeBase: 0xd8b040, patas4: legs, cauda: tail, passada: 0.85 };
  }
  OV.makeLobo = makeLobo;

  OV.FOES = {
    possesso: { key: 'possesso', name: 'Possesso', nivel: 2, build: makePossesso(0x2a2622, true), hp: 64, speed: 3.4, dmg: 10, windup: 0.5, recover: 0.7, range: 1.8, r: 0.45, height: 2.3, knock: 1, stagger: true, xp: 25, aggro: 13, leash: 24, liberta: true, moedas: [2, 4] },
    lobo: { key: 'lobo', name: 'Lobo do Vale', nivel: 6, build: makeLobo, hp: 260, speed: 6.6, dmg: 20, windup: 0.4, recover: 0.5, range: 2.0, r: 0.6, height: 1.6, knock: 0.4, stagger: false, xp: 140, aggro: 11, leash: 24, animal: true, escala: 1.35 },
    lobo_cinza: { key: 'lobo_cinza', name: 'Lobo Cinzento', nivel: 3, build: makeLobo, hp: 70, speed: 6.0, dmg: 11, windup: 0.42, recover: 0.6, range: 1.9, r: 0.55, height: 1.5, knock: 0.9, stagger: true, xp: 35, mundo: true, aggro: 12, leash: 24, animal: true },
    diabrete: { key: 'diabrete', name: 'Diabrete', nivel: 2, build: makeDiabrete, hp: 36, speed: 5.0, dmg: 8, windup: 0.35, recover: 0.55, range: 1.5, r: 0.35, height: 1.5, knock: 1.4, stagger: true, xp: 15, mundo: true, aggro: 14, leash: 26, voa: true, moedas: [2, 3] },
    larva: { key: 'larva', name: 'Larva do Tédio', nivel: 1, build: makeLarva, hp: 32, speed: 1.3, dmg: 6, windup: 0.8, recover: 1.0, range: 1.5, r: 0.55, height: 1.0, knock: 0.8, stagger: true, xp: 12, mundo: true, aggro: 10, leash: 20, status: 'preguica', moedas: [1, 2] },
    ira: { key: 'ira', name: 'Ira', nivel: 3, build: makeIra, hp: 110, speed: 4.6, dmg: 13, windup: 0.42, recover: 0.7, range: 1.9, r: 0.5, height: 2.4, knock: 1, stagger: true, xp: 60, x: 7, z: -5,
      fall: 'A Ira foi vencida. Que reine a Mansidão.' },
    preguica: { key: 'preguica', name: 'Preguiça', nivel: 3, build: makePreguica, hp: 230, speed: 1.8, dmg: 26, windup: 1.0, recover: 1.3, range: 2.5, r: 1.0, height: 2.4, knock: 0.4, stagger: false, xp: 90, x: -7, z: -7,
      fall: 'A Preguiça foi vencida. Que reine a Diligência.' },
    soberba: { key: 'soberba', name: 'Arauto da Soberba', nivel: 4, chefe: true, build: makeSoberba, hp: 380, speed: 3.2, dmg: 22, windup: 0.65, recover: 0.9, range: 2.6, r: 0.75, height: 3.4, knock: 0.6, stagger: false, xp: 200, x: 0, z: -9,
      fall: 'A Soberba foi vencida. Que reine a Humildade.' }
  };

  const I = { lista: [] };
  OV.inimigos = I;

  /* variantes: a mesma criatura, de outra cor, mais forte ('forte'), ou um semi-chefe ('elite') */
  const VAR = {
    forte: { hp: 1.8, dmg: 1.35, xp: 2.2, esc: 1.12, drop: 2.5 },
    elite: { hp: 4.2, dmg: 1.6, xp: 5, esc: 1.45, drop: 10 }
  };
  const CORES = {
    possesso: ['Rubro', 0x6a1414, 'Possesso Atormentado', 0x14142a], diabrete: ['Roxo', 0x5a1a7a, 'Diabrete-Chefe', 0x0a3a2a],
    larva: ['Azulada', 0x24406a, 'Larva-Mãe', 0x5a2a5a], lobo_cinza: ['Negro', 0x141414, 'Lobo Branco, o Ancião', 0xe0ded4],
    corvo: ['Rubro', 0x7a1010, 'Corvo Ancião', 0xc8c0b0], larva_gula: ['Verde', 0x2a6a3a, 'Larva-Mãe da Gula', 0x8a6a1a],
    glutao: ['Verde', 0x2a4a1a, 'Glutão Insaciável', 0x4a1a4a]
  };
  I.VAR = VAR; I.CORES = CORES;
  function escalar(base, nivel, variante) {
    const n0 = base.nivel || 1, dn = nivel - n0, V = VAR[variante] || null;
    const d = Object.assign({}, base);
    d.nivel = nivel; d.variante = variante || null;
    d.hp = Math.round(base.hp * Math.max(0.4, 1 + 0.18 * dn) * (V ? V.hp : 1));
    d.dmg = Math.round(base.dmg * Math.max(0.5, 1 + 0.1 * dn) * (V ? V.dmg : 1));
    d.xp = Math.round(base.xp * Math.max(0.4, 1 + 0.3 * dn) * (V ? V.xp : 1));
    if (V) {
      const c = CORES[base.key];
      if (variante === 'forte') d.name = c ? `${base.name} ${c[0]}` : `${base.name} Forte`;
      else { d.name = c ? c[2] : `${base.name} Ancião`; d.chefeMenor = true; d.stagger = false; d.knock = (base.knock || 1) * 0.4; d.aggro = (base.aggro || 14) + 4; d.leash = (base.leash || 24) + 10; }
      if (variante === 'elite' && base.mundo) d.mundo = true;
    }
    return d;
  }
  function tingir(b, def) {
    const c = CORES[def.key]; if (!c || !def.variante) return;
    const cor = new THREE.Color(def.variante === 'elite' ? c[3] : c[1]);
    b.mats.forEach(m => { m.color.lerp(cor, 0.7); m.emissive.copy(cor).multiplyScalar(0.25); });
    if (def.variante === 'elite') { b.eye.color.setHex(0xffd84a); b.eyeBase = 0xffd84a; }
  }
  /* ================= DIFICULDADE =================
     Tudo ficou mais duro; perto das vilas os vícios continuam mansos, e quanto mais longe delas,
     mais fortes (até cinco níveis a mais). Os chefões ganham vida e força, e padrões em fases. */
  const CHEFES = new Set(['ira', 'preguica', 'soberba', 'meiodia', 'sombra', 'abade', 'senhor', 'mamom', 'asmodeu']);
  const FIXOS = new Set(['travessa', 'cofre', 'espelho', 'espelho_baile']);
  const CLAUSTRO = { ira: 7, preguica: 7, soberba: 7, possesso: 6 };
  I.CHEFES = CHEFES;
  const CENTROS = [{ x: 0, z: 150 }, { x: 0, z: 697 }, { x: -900, z: 58 }, { x: 0, z: -840 }];
  I.CENTROS = CENTROS; // as regiões dos Atos V a VII somam as suas vilas
  I.distVila = (x, z) => Math.min(...CENTROS.map(c => Math.hypot(x - c.x, z - c.z)));
  I.perigo = (x, z) => Math.max(0, Math.min(7, Math.floor((I.distVila(x, z) - 45) / 22)));
  const REGIAO_DURA = { porto: [1.6, 1.3, 0.9], minas: [1.5, 1.28, 0.9], corte: [1.35, 1.18, 0.92], muros: [1.35, 1.18, 0.92], marca: [1.35, 1.18, 0.92], monte: [1.35, 1.18, 0.92] };
  function endurecer(base, def, x, z, opts) {
    if (FIXOS.has(base.key) || opts.semAjuste || !def.dmg) return def;
    // os vícios do Claustro Tomado lutam como se fossem de nível 7 (o Irmão Afonso, de nível 6)
    const doClaustro = CLAUSTRO[base.key] && !opts.nivel && Math.abs(x) < 18 && Math.abs(z) < 18;
    // no co-op, os vícios do mundo do anfitrião têm 2,5x de vida e de dano (3,5x com três ou quatro jogadores)
    const fim = d0 => { if (OV.coop && OV.coop.multiplicador) { const k = OV.coop.multiplicador(); if (k !== 1) { d0.hp = Math.round(d0.hp * k); d0.dmg = Math.round(d0.dmg * k); d0.multCoop = k; } } return d0; }; // v25: multCoop deixa reajustar quando o grupo muda
    if (doClaustro) def = escalar(base, CLAUSTRO[base.key], def.variante);
    const chefe = CHEFES.has(base.key) || !!base.chefe;
    // v18: os chefões são bem mais duros (e entram em fúria no fim); longe das vilas os vícios crescem até sete níveis
    if (chefe) { def.hp = Math.round(def.hp * 2.1); def.dmg = Math.round(def.dmg * (doClaustro ? 1.25 : 1.5)); def.windup = (def.windup || 0.6) * 0.9; return fim(def); }
    const d = I.distVila(x, z);
    if (opts.mundo) { const extra = I.perigo(x, z); if (extra) def = Object.assign(escalar(base, def.nivel + extra, def.variante), { mundo: true }); }
    const longe = d >= 45;
    def.hp = Math.round(def.hp * (longe ? 1.45 : 1)); def.dmg = Math.round(def.dmg * (longe ? 1.35 : 1));
    if (longe) { def.windup = (def.windup || 0.6) * 0.88; def.aggro = (def.aggro || 18) + 3; }
    if (def.chefeMenor) { def.hp = Math.round(def.hp * 1.3); def.dmg = Math.round(def.dmg * 1.12); }
    // v24: os vícios comuns dos atos II em diante estavam fáceis demais: cada região endurece os seus
    const RF = REGIAO_DURA[M.regiao ? M.regiao(x, z) : 'vale'];
    if (RF) { def.hp = Math.round(def.hp * RF[0]); def.dmg = Math.round(def.dmg * RF[1]); def.windup = (def.windup || 0.6) * RF[2]; }
    return fim(def);
  }
  I.endurecer = endurecer;

  /* ================= PADRÕES DE ATAQUE =================
     Cada vício segue a sua sequência de passos; os chefões trocam de sequência conforme perdem vida.
     g golpe · r golpe rápido · F golpe forte em área · I investida · T tiro (T3/T5/T7 em leque, Tl lento e grande)
     O onda que se espalha do chão · C chuva: marcas no chão que explodem */
  const PS = (o) => Object.assign({ tipo: 'golpe', dmg: 1, wu: 1, rec: 1 }, o);
  const PASSOS = {
    g: PS({}), r: PS({ dmg: 0.7, wu: 0.55, rec: 0.45 }),
    F: PS({ tipo: 'forte', dmg: 1.8, wu: 2.1, rec: 1.5, area: 1.3 }),
    B: PS({ tipo: 'investida', dmg: 1.05, wu: 0.6, rec: 1.0, vel: 17, dur: 0.32 }), // v24: o bote — uma investida curta e de surpresa
    I: PS({ tipo: 'investida', dmg: 1.25, wu: 1.5, rec: 1.3, vel: 13, dur: 0.5 }),
    T: PS({ tipo: 'tiro', dmg: 0.8, wu: 1.7, rec: 0.9, n: 1, ab: 0, vel: 12, raio: 0.22 }),
    T3: PS({ tipo: 'tiro', dmg: 0.7, wu: 1.9, rec: 1.0, n: 3, ab: 0.3, vel: 12, raio: 0.22 }),
    T5: PS({ tipo: 'tiro', dmg: 0.6, wu: 2.0, rec: 1.0, n: 5, ab: 0.22, vel: 13, raio: 0.24 }),
    T7: PS({ tipo: 'tiro', dmg: 0.55, wu: 2.1, rec: 1.1, n: 7, ab: 0.2, vel: 14, raio: 0.25 }),
    Tl: PS({ tipo: 'tiro', dmg: 1.0, wu: 1.7, rec: 1.0, n: 1, vel: 6.5, raio: 0.42 }),
    O: PS({ tipo: 'onda', dmg: 1.0, wu: 2.3, rec: 1.3, alcance: 14 }),
    C: PS({ tipo: 'chuva', dmg: 1.0, wu: 1.4, rec: 1.0, n: 6 })
  };
  const PADROES = {
    possesso: ['g', 'g', 'F'], abade: ['g', 'g', 'F', 'T3', 'I'],
    lobo_cinza: ['g', 'r', 'I'], lobo: ['g', 'I', 'g', 'r', 'F'],
    diabrete: ['T', 'g', 'T', 'I'], larva: ['g', 'Tl'], larva_gula: ['B', 'g', 'Tl', 'g'],
    ira: ['g', 'r', 'F', 'I'], preguica: ['F', 'Tl', 'g'],
    soberba: { fases: [[1, ['g', 'T3', 'g', 'F']], [0.5, ['O', 'T5', 'I', 'g', 'F']]] },
    glutao: ['g', 'g', 'F'], corvo: ['I', 'T3', 'g'],
    mineiro: ['g', 'g', 'T'], escaravelho: ['I', 'r', 'r'], golem: ['F', 'g', 'Tl'],
    mascarado: ['g', 'r', 'F', 'I'], mariposa: ['T', 'T', 'I'], reflexo: ['g', 'I', 'r', 'g'],
    sombra: ['g', 'I'],
    meiodia: { fases: [[1, ['g', 'g', 'F', 'T3']], [0.66, ['T5', 'g', 'I', 'F', 'C']], [0.33, ['O', 'T7', 'I', 'g', 'g', 'C']]] },
    senhor: { fases: [[1, ['g', 'F', 'T3']], [0.6, ['I', 'g', 'g', 'C', 'T5']], [0.3, ['O', 'T5', 'F', 'C', 'I']]] },
    mamom: { fases: [[1, ['g', 'g', 'T5']], [0.66, ['C', 'F', 'I', 'T5']], [0.33, ['O', 'C', 'T7', 'g', 'I']]] },
    asmodeu: { fases: [[1, ['g', 'I', 'g', 'T3']], [0.66, ['T5', 'I', 'F', 'C']], [0.33, ['O', 'C', 'T7', 'I', 'g', 'g']]] }
  };
  // a cor e o vício de cada projétil
  const PROJ = {
    diabrete: [0xff6a1f], larva: [0x9adf6a, 'preguica'], larva_gula: [0x8ac83a, 'gula'], ira: [0xff4a1a, 'ira'], preguica: [0x7a8a3a, 'preguica'],
    soberba: [0xf2efe6, 'soberba'], corvo: [0x3a3438], mineiro: [0x8a8070], golem: [0x6a6258], mariposa: [0xe8a0f0, 'luxuria'], abade: [0xc8283a],
    meiodia: [0xffd27a, 'preguica'], senhor: [0xd8a060, 'gula'], mamom: [0xf0c040, 'avareza'], asmodeu: [0xe8306a, 'luxuria'], reflexo: [0xd8e4f0], sombra: [0x2a2030]
  };
  I.PADROES = PADROES; I.PASSOS = PASSOS; I.PROJ = PROJ;
  function padraoDe(e) {
    const p = PADROES[e.def.key]; if (!p) return null;
    if (Array.isArray(p)) return p;
    const frac = e.hp / e.def.hp; let atual = p.fases[0][1], fase = 0;
    p.fases.forEach(([lim, seq], i) => { if (frac <= lim) { atual = seq; fase = i; } });
    if (e.faseP !== undefined && fase > e.faseP) { // mudança de postura: um rugido
      e.passo = 0; OV.jogo.shake(0.45); if (OV.audio) OV.audio.bell(110 + fase * 30, 0.3); e.flash = 0.4;
      anelChao(e.g.position.x, e.g.position.z, 0.6, 6 + fase * 2, 0.9, 0xff4a2a);
    }
    e.faseP = fase;
    return atual;
  }
  function proximoPasso(e) {
    const seq = padraoDe(e); if (!seq) return PASSOS.g;
    return PASSOS[seq[(e.passo || 0) % seq.length]] || PASSOS.g;
  }

  /* ---- efeitos visuais dos ataques ---- */
  const C_ = () => OV.combate;
  function anelChao(x, z, r0, r1, dur, cor, op) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), new THREE.MeshBasicMaterial({ color: cor || 0xff3a2a, transparent: true, opacity: op || 0.8, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; const y = M.altura(x, z) + 0.08; m.position.set(x, y, z);
    C_().efeito([m], dur, p => { m.scale.setScalar(r0 + (r1 - r0) * p); m.material.opacity = (op || 0.8) * (1 - p * 0.85); });
    return m;
  }
  // marca no chão que acompanha o preparo (forte, chuva)
  function marca(x, z, r, dur, cor) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: cor || 0xff2a1a, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, M.altura(x, z) + 0.06, z); m.scale.setScalar(r);
    const borda = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: cor || 0xff2a1a, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
    borda.rotation.x = -Math.PI / 2; borda.position.copy(m.position); borda.position.y += 0.01; borda.scale.setScalar(r);
    C_().efeito([m, borda], dur, p => { m.material.opacity = 0.08 + 0.35 * p; borda.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(p * 14)); });
    if (!marca.semFx) fx({ k: 'marca', x, z, r, dur, cor: cor || 0xff2a1a });
  }
  I.marca = (x, z, r, dur, cor) => { marca.semFx = true; marca(x, z, r, dur, cor); marca.semFx = false; };

  /* ---- os alvos: o jogador e, no co-op, o colega (o anfitrião simula os vícios para os dois) ---- */
  I.alvos = () => (OV.coop && OV.coop.alvosRemotos ? [OV.P].concat(OV.coop.alvosRemotos()) : [OV.P]);
  const ferirAlvo = (P, dano, status, fonte, ang) => { if (P.remoto) OV.coop.ferirRemoto(P, { dano, status, fonte, ang }); else C_().ferirJogador(dano, status, fonte); };
  I.ferirAlvo = ferirAlvo;
  // golpe em área dos chefões: fere quem estiver dentro do círculo desenhado, conferindo a posição no instante do golpe
  I.golpeArea = function (A, dano, status, fonte) { let n = 0; for (const Q of I.alvos()) { if (Q.dead || Math.hypot(Q.pos.x - A.x, Q.pos.z - A.z) > A.r) continue; ferirAlvo(Q, dano, status, fonte, 0); n++; } return n; };
  const golpear = (e, P) => { if (P.remoto) OV.coop.golpeRemoto(P, e); else OV.combate.receberGolpe(e); };
  function escolherAlvo(e, alvos) {
    if (alvos.length === 1) return alvos[0];
    const g = e.g.position, dist = a => (a.dead ? 1e9 : Math.hypot(a.pos.x - g.x, a.pos.z - g.z));
    let best = alvos[0], bd = dist(best);
    for (let i = 1; i < alvos.length; i++) { const d = dist(alvos[i]); if (d < bd) { bd = d; best = alvos[i]; } }
    // não troca de alvo à toa: só se o outro estiver bem mais perto (ou o atual tiver caído)
    const cur = e.alvoP && alvos.includes(e.alvoP) ? e.alvoP : null;
    if (cur && cur !== best && !cur.dead && dist(cur) < bd + 3) best = cur;
    e.alvoP = best; return best;
  }
  I.aoFx = null; // o anfitrião avisa o convidado dos tiros, ondas e marcas, para ele ver e se esquivar
  const fx = m => { if (I.aoFx) I.aoFx(m); };

  /* ---- projéteis dos vícios ---- */
  I.projeteis = [];
  function disparar(e, passo, P) {
    P = P || OV.P; const def = e.def, [cor, st] = PROJ[def.key] || [0xff5a2a];
    const o = new THREE.Vector3(e.g.position.x, e.g.position.y + def.height * 0.62 * (e.escala || 1), e.g.position.z);
    const alvoY = P.pos.y + 1.1, dist = Math.hypot(P.pos.x - o.x, P.pos.z - o.z), tVoo = dist / passo.vel;
    // mira um pouco à frente de quem corre
    const px = P.pos.x + (P.vel ? P.vel.x * tVoo * 0.5 : 0), pz = P.pos.z + (P.vel ? P.vel.z * tVoo * 0.5 : 0);
    const base = Math.atan2(px - o.x, pz - o.z), n = passo.n || 1;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (passo.ab || 0);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(passo.raio || 0.22, 0), new THREE.MeshBasicMaterial({ color: cor }));
      const halo = new THREE.Mesh(new THREE.IcosahedronGeometry((passo.raio || 0.22) * 2.1, 1), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
      core.add(halo); core.position.copy(o); M.scene.add(core);
      const vy = (alvoY - o.y) / Math.max(0.3, tVoo);
      const vel = new THREE.Vector3(Math.sin(a) * passo.vel, vy, Math.cos(a) * passo.vel);
      I.projeteis.push({ mesh: core, vel, vida: 3.2, raio: passo.raio || 0.22, dano: Math.max(1, Math.round(def.dmg * passo.dmg)), status: st !== undefined ? st : def.status, fonte: e, cor });
      fx({ k: 'tiro', x: o.x, y: o.y, z: o.z, vx: vel.x, vy: vel.y, vz: vel.z, raio: passo.raio || 0.22, cor });
    }
    if (OV.audio) OV.audio.cast && OV.audio.cast();
  }
  // tiros e ondas só de enfeite (no convidado, que vê o ataque mas não o calcula)
  I.tiroVisual = function (m) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(m.raio || 0.22, 0), new THREE.MeshBasicMaterial({ color: m.cor }));
    core.add(new THREE.Mesh(new THREE.IcosahedronGeometry((m.raio || 0.22) * 2.1, 1), new THREE.MeshBasicMaterial({ color: m.cor, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })));
    core.position.set(m.x, m.y, m.z); M.scene.add(core);
    I.projeteis.push({ mesh: core, vel: new THREE.Vector3(m.vx, m.vy, m.vz), vida: 3.2, raio: m.raio || 0.22, dano: 0, cor: m.cor, visual: true });
  };
  I.ondaVisual = function (m) {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 64), new THREE.MeshBasicMaterial({ color: m.cor, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.set(m.x, M.altura(m.x, m.z) + 0.25, m.z); M.scene.add(r);
    I.ondas.push({ m: r, x: m.x, z: m.z, r: 0.5, max: m.max, vel: 9, dano: 0, acertou: true, visual: true });
  };
  I.atualizarVisuais = function (dt) { atualizarProjeteis(dt); atualizarOndas(dt); };
  function atualizarProjeteis(dt) {
    const alvos = I.alvos();
    for (let i = I.projeteis.length - 1; i >= 0; i--) {
      const p = I.projeteis[i], pos = p.mesh.position; p.vida -= dt;
      pos.addScaledVector(p.vel, dt); p.mesh.rotation.x += dt * 6; p.mesh.rotation.y += dt * 5;
      let fim = p.vida <= 0;
      const solo = M.altura(pos.x, pos.z); if (pos.y < solo + 0.1) fim = true;
      if (!fim) { const q = { x: pos.x, z: pos.z }; M.collide(q, 0.05); if (Math.abs(q.x - pos.x) + Math.abs(q.z - pos.z) > 0.02 && !(M.naPonte && M.naPonte(pos.x, pos.z))) fim = true; }
      if (!fim && !p.visual) for (const P of alvos) {
        if (P.dead || !(Math.hypot(P.pos.x - pos.x, P.pos.z - pos.z) < 0.5 + p.raio && pos.y > P.pos.y - 0.2 && pos.y < P.pos.y + 2.4)) continue;
        fim = true;
        const ang = Math.atan2(pos.x - P.pos.x, pos.z - P.pos.z);
        if (P.remoto) ferirAlvo(P, p.dano, p.status, p.fonte, ang);
        else if (P.parryT > 0 && Math.abs(OV.util.angWrap(ang - P.facing)) < 1.6) { if (OV.audio) OV.audio.parry(); OV.ui.toast('Sinal da Cruz! O golpe se desfaz.'); if (C_().aparouCerto) C_().aparouCerto(); }
        else C_().ferirJogador(p.dano, p.status, p.fonte);
        break;
      }
      if (fim) { C_().faisca(pos.x, pos.y, pos.z, p.cor); M.scene.remove(p.mesh); I.projeteis.splice(i, 1); }
    }
  }
  I.limparProjeteis = function () { I.projeteis.forEach(p => M.scene.remove(p.mesh)); I.projeteis.length = 0; };
  // onda: anel que se abre do vício; quem estiver na faixa quando ela passar é ferido (a esquiva atravessa)
  I.ondas = [];
  function onda(e, passo) {
    const x = e.g.position.x, z = e.g.position.z, cor = (PROJ[e.def.key] || [0xff5a2a])[0];
    const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 64), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, M.altura(x, z) + 0.25, z); M.scene.add(m);
    I.ondas.push({ m, x, z, r: 0.5, max: passo.alcance || 14, vel: 9, dano: Math.round(e.def.dmg * passo.dmg), fonte: e, acertou: false, status: (PROJ[e.def.key] || [])[1], acertados: new Set() });
    fx({ k: 'onda', x, z, max: passo.alcance || 14, cor });
    OV.jogo.shake(0.35);
  }
  function atualizarOndas(dt) {
    const alvos = I.alvos();
    for (let i = I.ondas.length - 1; i >= 0; i--) {
      const o = I.ondas[i]; const r0 = o.r; o.r += o.vel * dt; o.m.scale.setScalar(o.r); o.m.material.opacity = 0.85 * (1 - o.r / o.max);
      if (!o.visual) for (const P of alvos) {
        if (P.dead || (o.acertados && o.acertados.has(P))) continue;
        const d = Math.hypot(P.pos.x - o.x, P.pos.z - o.z);
        if (d >= r0 - 0.5 && d <= o.r + 0.3 && Math.abs(P.pos.y - M.altura(o.x, o.z)) < 2.5 && !M.paredeEntre(o.x, o.z, P.pos.x, P.pos.z)) { if (o.acertados) o.acertados.add(P); ferirAlvo(P, o.dano, o.status, o.fonte, Math.atan2(o.x - P.pos.x, o.z - P.pos.z)); }
      }
      if (o.r >= o.max) { M.scene.remove(o.m); I.ondas.splice(i, 1); }
    }
  }
  // chuva: marcas ao redor de quem luta; explodem depois de um instante
  I.chuvas = [];
  function chuva(e, passo, P) {
    P = P || OV.P; const cor = (PROJ[e.def.key] || [0xff5a2a])[0];
    const pts = [[P.pos.x, P.pos.z]];
    for (let i = 1; i < (passo.n || 6); i++) { const a = Math.random() * Math.PI * 2, r = 1.8 + Math.random() * 4.5; pts.push([P.pos.x + Math.cos(a) * r, P.pos.z + Math.sin(a) * r]); }
    pts.forEach(([x, z], i) => { marca(x, z, 1.5, 1.15 + i * 0.08, cor); I.chuvas.push({ x, z, t: 1.15 + i * 0.08, dano: Math.round(e.def.dmg * passo.dmg), fonte: e, cor, status: (PROJ[e.def.key] || [])[1] }); });
  }
  // a chuva: cada ponto marcado no chão recebe um projétil que cai do alto, visível para os dois
  function queda(c) {
    const y = M.altura(c.x, c.z), h = 9, t = 0.6, m = { x: c.x, y: y + h, z: c.z, vx: 0, vy: -(h - 0.2) / t, vz: 0, raio: 0.3, cor: c.cor };
    I.tiroVisual(m); fx(Object.assign({ k: 'tiro' }, m));
  }
  I.corProjetil = key => (PROJ[key] || [0xff5a2a])[0];
  I.impactoVisual = function (x, z, cor) { const y = M.altura(x, z); C_().faisca(x, y + 0.6, z, cor); anelChao(x, z, 0.4, 2.2, 0.35, cor); };
  function atualizarChuvas(dt) {
    const alvos = I.alvos();
    for (let i = I.chuvas.length - 1; i >= 0; i--) {
      const c = I.chuvas[i]; c.t -= dt;
      if (!c.caiu && c.t < 0.6) { c.caiu = true; queda(c); }
      if (c.t > 0) continue;
      I.impactoVisual(c.x, c.z, c.cor); fx({ k: 'impacto', x: c.x, z: c.z, cor: c.cor });
      for (const P of alvos) if (!P.dead && Math.hypot(P.pos.x - c.x, P.pos.z - c.z) <= 1.5) ferirAlvo(P, c.dano, c.status, c.fonte, 0);
      I.chuvas.splice(i, 1);
    }
  }
  // o preparo de cada passo: uma bola de luz na mão, a marca no chão do golpe forte
  function preparar(e, ps, P) {
    soltarOrbe(e);
    if (ps.tipo === 'tiro' || ps.tipo === 'onda') {
      const cor = (PROJ[e.def.key] || [0xff5a2a])[0];
      const o = new THREE.Mesh(new THREE.IcosahedronGeometry(ps.tipo === 'onda' ? 0.5 : 0.22, 1), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      o.scale.setScalar(0.3);
      if (ps.tipo === 'onda') { o.position.set(0, e.def.height * 0.75, 0.4); e.g.add(o); } else { o.position.set(0, -0.85, 0.15); e.armR.add(o); }
      e.orbe = o;
    } else if (ps.tipo === 'forte') {
      // o círculo desenhado é o golpe: guarda o centro e o raio para o impacto usar exatamente os mesmos
      const r = e.def.range + (ps.area || 1.2);
      e.areaAtaque = { x: e.g.position.x, z: e.g.position.z, y: e.g.position.y, r };
      marca(e.areaAtaque.x, e.areaAtaque.z, r, e.def.windup * ps.wu, 0xff3a1a);
    }
    else if (ps.tipo === 'investida') {
      const len = 8, a = e.g.rotation.y, x = e.g.position.x + Math.sin(a) * len / 2, z = e.g.position.z + Math.cos(a) * len / 2;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, len), new THREE.MeshBasicMaterial({ color: 0xff3a1a, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = a; m.position.set(x, M.altura(x, z) + 0.07, z);
      C_().efeito([m], e.def.windup * ps.wu, p => { m.material.opacity = 0.15 + 0.3 * p; });
      fx({ k: 'investida', x, z, a, len, dur: e.def.windup * ps.wu });
    } else if (ps.tipo === 'chuva') chuva(e, ps, P);
  }
  I._preparar = preparar; // (para os testes)
  function soltarOrbe(e) { if (e.orbe) { if (e.orbe.parent) e.orbe.parent.remove(e.orbe); e.orbe.geometry.dispose(); e.orbe = null; } }
  I.limparAtaques = function () { I.limparProjeteis(); I.ondas.forEach(o => M.scene.remove(o.m)); I.ondas.length = 0; I.chuvas.length = 0; };

  I.spawn = function (type, rise, pos, opts) {
    opts = opts || {};
    const base = OV.FOES[type];
    const def0 = (opts.nivel && opts.nivel !== base.nivel) || opts.variante ? escalar(base, opts.nivel || base.nivel || 1, opts.variante) : Object.assign({}, base, { nivel: base.nivel || 1 });
    const def = endurecer(base, def0, pos ? pos.x : base.x, pos ? pos.z : base.z, opts);
    const b = def.build();
    tingir(b, def);
    const esc = (def.escala || 1) * (VAR[def.variante] ? VAR[def.variante].esc : 1);
    if (esc !== 1) b.g.scale.setScalar(esc);
    const hx = pos ? pos.x : def.x, hz = pos ? pos.z : def.z;
    b.g.position.set(hx, M.altura(hx, hz) + (rise ? -3 : 0), hz);
    b.g.rotation.y = Math.random() * Math.PI * 2;
    M.scene.add(b.g);
    const lab = OV.ui.criarRotulo(def.name, def.nivel, def.variante);
    const e = Object.assign({ def, hp: def.hp, escala: esc, state: 'idle', t: 0, vel: new THREE.Vector3(), flash: 0, deadT: 0, removed: false,
      spawnT: rise ? 1.8 : 0, ph: Math.random() * 6, orig: b.mats.map(m => m.emissive.clone()), lab, home: { x: hx, z: hz }, mundo: !!def.mundo }, b);
    I.lista.push(e); return e;
  };
  const remover = e => { M.scene.remove(e.g); e.lab.el.remove(); };
  I.limpar = function () { I.lista.forEach(remover); I.lista = []; I.limparAtaques(); };
  I.removerMundo = function () { I.lista.filter(e => e.mundo).forEach(remover); I.lista = I.lista.filter(e => !e.mundo); };
  I.vivos = () => I.lista.filter(e => e.state !== 'dead' && e.state !== 'liberto' && e.spawnT <= 0);
  I.porTag = tag => I.lista.filter(e => e.tag === tag);
  I.resetar = function (e) {
    e.hp = e.def.hp; e.state = 'idle'; e.t = 0; e.vel.set(0, 0, 0);
    e.g.position.set(e.home.x, M.altura(e.home.x, e.home.z), e.home.z);
  };

  /* a marcha: pernas, patas, asas e corpos que rastejam, todos no ritmo da distância realmente andada */
  I.marchar = function (e, dt, mov) {
    const AN = OV.andar, mc = e.marcha || (e.marcha = AN.estado());
    AN.ciclo(mc, mov, dt, (e.passada || 0.7) * (e.escala || 1), Math.max(1.5, (e.def && e.def.speed ? e.def.speed : 4) * 0.75));
    let bob = 0, braco = 0, ginga = 0;
    const a1 = Math.min(1, mc.amp);
    if (e.pernas) {
      const r = AN.alvos(mc.ph, mc.amp, e.marchaO); AN.aplicar(e.pernas, r); bob = r.bob; braco = r.braco;
      if (e.manto) { e.manto.rotation.z = r.sway * 1.5; e.manto.rotation.x = Math.sin(mc.ph * 2) * 0.03 * a1; }
      if (e.ginga) ginga = Math.sin(mc.ph) * e.ginga * a1;
    } else if (e.patas4) { bob = AN.quadrupede(e.patas4, mc.ph, mc.amp); if (e.cauda) e.cauda.rotation.y = Math.sin(mc.ph * 2) * 0.35 * a1; }
    else if (e.patas6) bob = AN.hexapode(e.patas6, mc.ph, mc.amp);
    else if (e.segs) {
      const a = 0.25 + a1;
      e.segs.forEach((m, i) => { const w = Math.sin(mc.ph * 1.2 - i * 1.1); m.position.y = m.userData.y0 + Math.max(0, w) * 0.09 * a; m.position.z = m.userData.z0 + w * 0.05 * a; });
    }
    if (e.asas) {
      e.flap = (e.flap || 0) + dt * (9 + mc.v * 1.2);
      e.asas.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.55 + Math.sin(e.flap) * 0.6); });
      if (e.pendentes) e.pendentes.forEach((p, i) => { p.rotation.x = a1 * 0.7 + Math.sin(e.flap * 0.5 + i) * 0.2; });
      bob = Math.sin(e.flap) * 0.07;
    }
    return { bob: bob * (e.escala || 1), braco, ginga };
  };
  const AJOELHADO = { hL: -1.3, kL: 1.5, fL: 0, hR: 0.1, kR: 1.5, fR: -0.5 };

  /* v24: os chefões não ficam presos em atordoamentos seguidos. Cada atordoamento num chefe vale menos que o anterior,
     e depois dele o chefe fica alguns segundos imune (a resistência some aos poucos). */
  I.relogio = 0;
  I.stunImune = e => !!(e.def.chefe && e.imuneStun && I.relogio < e.imuneStun);
  I.atordoar = function (e, t, forcar) {
    if (e.state === 'dead') return;
    if (e.def.chefe && !forcar) {
      if (I.stunImune(e)) {
        if (!e._avisoImune || I.relogio - e._avisoImune > 5) { e._avisoImune = I.relogio; if (OV.ui) OV.ui.toast(`${e.def.name} resiste: as correntes não o prendem de novo tão cedo.`); }
        return;
      }
      e.cargaStun = Math.max(0, (e.cargaStun || 0) - (I.relogio - (e.ultStun || I.relogio)) * 0.01);
      t = t * Math.max(0.3, 1 - e.cargaStun); e.cargaStun = Math.min(0.7, e.cargaStun + 0.3); e.ultStun = I.relogio;
      e.imuneStun = I.relogio + t + 9;
    }
    soltarOrbe(e); e.state = 'stun'; e.t = t;
  };
  // o atordoamento se vê e se ouve: um "tim" curto e estrelinhas sobre o nome do vício (para os dois jogadores)
  M.animados.push(() => {
    const P = OV.P; if (!P || !P.pos) return;
    for (const e of I.lista) {
      if (e.removed) continue;
      const st = e.state === 'stun';
      if (st === !!e._atord) continue;
      e._atord = st; if (e.lab && e.lab.el) e.lab.el.classList.toggle('atordoado', st);
      if (st && OV.audio && OV.audio.bell && Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 30) { OV.audio.bell(1760, 0.05); setTimeout(() => OV.audio.bell(2349, 0.035), 70); }
    }
  });

  /* v21: a agressividade decide até onde o vício persegue. Fora de combate ele fica na área dele; em combate,
     o limite da área não vale, e ele só desiste quando o jogador se afasta além do limite. Ao voltar, mantém a vida
     e só se cura devagar, depois de 30 s sem lutar. Na masmorra, persegue até a saída, que é uma barreira para ele. */
  const BAIXA = new Set(['larva', 'gargula']);
  const LIMITE_PERSEGUE = { baixa: 15, media: 30, alta: 60 };
  function agressividade(e) {
    const d = e.def;
    if (d.agressao) return d.agressao;
    if (BAIXA.has(d.key)) return 'baixa';
    if (d.chefe || CHEFES.has(d.key) || d.chefeMenor || d.variante === 'elite' || e.chefeMasmorra || (d.aggro || 0) >= 30) return 'alta';
    return 'media';
  }
  I.agressividade = agressividade;
  /* v24: quem persegue e tem uma casa ou um muro no meio não fica esbarrando na parede: pede um caminho (A*,
     no máximo dois por quadro para não pesar) e anda pelos pontos dele até enxergar o alvo de novo */
  function contornar(e, g, ax, az, d, dt, vel) {
    const def = e.def;
    if (def.voa || def.fixo || !M.caminho || d < 2 || d > 45 || !(def.speed > 0)) { e.rota = null; return false; }
    if (!M.paredeEntre(g.position.x, g.position.z, ax, az)) { e.rota = null; return false; }
    e.rotaT = (e.rotaT || 0) - dt;
    if ((!e.rota || !e.rota.length || e.rotaT <= 0) && I._orcCaminho > 0) { I._orcCaminho--; e.rota = M.caminho(g.position.x, g.position.z, ax, az, Math.max(0.45, Math.min(1.2, def.r))) || []; e.rotaT = 1.4; }
    if (!e.rota || !e.rota.length) return false;
    let w = e.rota[0];
    if (Math.hypot(w.x - g.position.x, w.z - g.position.z) < 0.9) { e.rota.shift(); if (!e.rota.length) return false; w = e.rota[0]; }
    const a = Math.atan2(w.x - g.position.x, w.z - g.position.z);
    g.rotation.y = turnTo(g.rotation.y, a, 8 * dt);
    g.position.x += Math.sin(g.rotation.y) * vel * dt; g.position.z += Math.cos(g.rotation.y) * vel * dt;
    return true;
  }
  I.update = function (dt) {
    const P0 = OV.P, P = P0, alvos = I.alvos();
    if (I._pp && dt > 0) { P.vel = P.vel || { x: 0, z: 0 }; P.vel.x = (P.pos.x - I._pp.x) / dt; P.vel.z = (P.pos.z - I._pp.z) / dt; if (Math.hypot(P.vel.x, P.vel.z) > 20) P.vel.x = P.vel.z = 0; }
    I._pp = { x: P.pos.x, z: P.pos.z }; I._orcCaminho = 2; I.relogio += dt;
    atualizarProjeteis(dt); atualizarOndas(dt); atualizarChuvas(dt);
    const ousadia = OV.tempo && OV.tempo.ehNoite() && P.pos.x < 200 ? 1.3 : 1; // à noite os vícios avançam de mais longe
    I.lista.forEach(e => {
      const g = e.g, def = e.def;
      const P = escolherAlvo(e, alvos); // o jogador mais perto (no co-op, pode ser o colega)
      if (e.state === 'dead') {
        e.deadT += dt; g.position.y = M.altura(g.position.x, g.position.z) - e.deadT * 1.3; g.rotation.y += dt * 1.5;
        e.mats.forEach(m => m.emissive.setRGB(0.3, 0.05, 0.05));
        if (e.deadT > 2 && !e.removed) { M.scene.remove(g); e.removed = true; e.lab.el.remove(); }
        return;
      }
      if (e.orbe && e.state !== 'windup') soltarOrbe(e);
      const chao = M.altura(g.position.x, g.position.z);
      if (e.state === 'liberto') {
        e.t += dt; const chao = M.altura(g.position.x, g.position.z);
        if (!(e.sumir && e.t > 3.4)) {
          g.position.y = lerp(g.position.y, chao - 0.38, 1 - Math.exp(-6 * dt));
          e.armL.rotation.x = lerp(e.armL.rotation.x, -1.2, 0.1); e.armR.rotation.x = lerp(e.armR.rotation.x, -1.2, 0.1);
        }
        e.eye.color.setHex(0x3a2a20); e.mats.forEach((m, i) => m.emissive.copy(e.orig[i]));
        if (e.sumir && e.t > 3.4 && !e.removed) {
          // de pé, o libertado vai embora andando para a vila mais próxima; some de vez só longe da vista
          if (!e.rumo) { let best = CENTROS[0], bd = 1e9; CENTROS.forEach(c => { const dd = Math.hypot(c.x - g.position.x, c.z - g.position.z); if (dd < bd) { bd = dd; best = c; } }); e.rumo = { x: best.x + (Math.random() - 0.5) * 16, z: best.z + (Math.random() - 0.5) * 16 }; e.lab.el.style.display = 'none'; }
          const dx = e.rumo.x - g.position.x, dz = e.rumo.z - g.position.z, dd = Math.hypot(dx, dz);
          g.rotation.y = turnTo(g.rotation.y, Math.atan2(dx, dz), 4 * dt);
          const passo = Math.min(dd, 2.0 * dt * Math.min(1, (e.t - 3.4) / 0.8));
          const q = { x: g.position.x + Math.sin(g.rotation.y) * passo, z: g.position.z + Math.cos(g.rotation.y) * passo }; M.collide(q, 0.4);
          g.position.x = q.x; g.position.z = q.z; g.position.y = Math.min(M.altura(q.x, q.z), g.position.y + dt * 0.8);
          const r = I.marchar(e, dt, passo); e.armL.rotation.x = r.braco * 0.6; e.armR.rotation.x = -r.braco * 0.6;
          const longeP = Math.hypot(P.pos.x - g.position.x, P.pos.z - g.position.z);
          if (longeP > 55 || dd < 2 || e.t > 60) { e.some = (e.some || 0) + dt; const k = Math.max(0.01, 1 - e.some); g.scale.setScalar(k * (e.escala || 1)); if (e.some >= 1) { M.scene.remove(g); e.removed = true; e.lab.el.remove(); } }
          return;
        }
        if (e.pernas) OV.andar.aplicar(e.pernas, AJOELHADO, 0.1);
        return;
      }
      if (e.spawnT > 0) { e.spawnT -= dt; g.position.y = chao - 3 * Math.max(0, e.spawnT / 1.8); if (e.spawnT <= 0) { g.position.y = chao; e.state = 'chase'; } return; }
      const longe = Math.hypot(P.pos.x - g.position.x, P.pos.z - g.position.z);
      if (longe > 70 && e.state === 'idle') return;
      if (!e.furia && (CHEFES.has(e.def.key) || e.def.chefe) && !e.def.fixo && e.hp > 0 && e.hp < e.def.hp * 0.25) {
        e.furia = true; e.multDano = (e.multDano || 1) * 1.3; e.def = Object.assign({}, e.def, { speed: e.def.speed * 1.15, windup: e.def.windup * 0.85, recover: e.def.recover * 0.8 });
        if (OV.ui) OV.ui.toast(`${e.def.name} entra em fúria!`); if (OV.jogo) OV.jogo.shake(0.5); if (OV.audio) OV.audio.bell(110, 0.3);
        e.mats.forEach(m => m.emissive.setRGB(0.35, 0.06, 0.02));
      }
      e.flash = Math.max(0, e.flash - dt);
      if (e.marca > 0) e.marca -= dt;
      if (e.lento > 0) e.lento -= dt;
      e.mats.forEach((m, i) => { if (e.flash > 0) m.emissive.setRGB(1, 0.9, 0.8); else m.emissive.copy(e.orig[i]); });
      g.position.addScaledVector(e.vel, dt); e.vel.multiplyScalar(Math.exp(-6 * dt));
      // alvo: o jogador, ou o duplo de luz da Bilocação quando está por perto
      const isca = OV.isca && OV.isca.t > 0 && Math.hypot(OV.isca.x - g.position.x, OV.isca.z - g.position.z) < 16 ? OV.isca : null;
      const ax = isca ? isca.x : P.pos.x, az = isca ? isca.z : P.pos.z;
      const dx = ax - g.position.x, dz = az - g.position.z, d = Math.hypot(dx, dz), ang = Math.atan2(dx, dz), reach = d - def.r - 0.45;
      const vel = def.speed * (e.lento > 0 ? 0.5 : 1);
      e.ph += dt * (e.state === 'chase' ? def.speed * 1.6 : 1.5);
      const playerGone = P.dead || (P.oculto > 0 && !isca);
      const casa = Math.hypot(g.position.x - e.home.x, g.position.z - e.home.z);
      const pacifico = def.animal && !e.provocado && OV.P.pers && OV.P.pers.ordem === 'franciscano';
      const ag = e.agress || (e.agress = agressividade(e));
      e.semLuta = (e.semLuta || 0) + dt;
      if (e.state !== 'idle' && e.state !== 'voltar') e.semLuta = 0;
      else if (e.semLuta > 30 && e.hp < def.hp && e.hp > 0) e.hp = Math.min(def.hp, e.hp + def.hp * 0.02 * dt); // cura devagar, só depois de 30 s em paz
      if (e.state === 'idle') { if (!pacifico && !e.parado && !playerGone && (ag !== 'baixa' || e.provocado) && d < (def.aggro || 18) * ousadia && Math.abs(P.pos.y - g.position.y) < 6 && (d < 5 || !M.paredeEntre(g.position.x, g.position.z, P.pos.x, P.pos.z))) e.state = 'chase'; }
      else if (e.state === 'voltar') {
        const a = Math.atan2(e.home.x - g.position.x, e.home.z - g.position.z);
        g.rotation.y = turnTo(g.rotation.y, a, 6 * dt);
        g.position.x += Math.sin(g.rotation.y) * def.speed * dt; g.position.z += Math.cos(g.rotation.y) * def.speed * dt;
        // volta com a vida que tinha (não se cura no caminho); preso num muro ou numa árvore, fica onde está
        if (e.voltarMelhor === undefined || casa < e.voltarMelhor - 0.05) { e.voltarMelhor = casa; e.voltarPreso = 0; }
        else e.voltarPreso = (e.voltarPreso || 0) + dt;
        if (casa < 1.5 || e.voltarPreso > 1.2) { if (casa >= 1.5) e.home = { x: g.position.x, z: g.position.z }; e.state = 'idle'; e.voltarMelhor = undefined; e.voltarPreso = 0; }
      }
      else if (e.state === 'chase') {
        // desiste? Quem acabou de levar um golpe não desiste; na masmorra, só quando o jogador sai pela porta
        const mult = alvos.length > 1 ? 1.3 : 1, acabouDeApanhar = (e.apanhouT || 0) > 0;
        let desiste = false;
        if (e.masmorra && OV.aventura && OV.aventura.dentroMasmorra) desiste = !OV.aventura.dentroMasmorra(e.masmorra, P.pos.x, P.pos.z, 0.5);
        else if (!acabouDeApanhar) desiste = ag === 'alta' ? (longe > LIMITE_PERSEGUE.alta * mult || casa > 140) : longe > LIMITE_PERSEGUE[ag] * mult;
        if (desiste) e.state = 'voltar';
        else if (playerGone) e.state = casa > 6 ? 'voltar' : 'idle';
        else if (contornar(e, g, ax, az, d, dt, vel)) { /* v24: há uma parede no meio: contorna pelo caminho */ }
        else {
          g.rotation.y = turnTo(g.rotation.y, ang, 6 * dt);
          const ps = def.speed > 0 && def.dmg > 0 ? proximoPasso(e) : PASSOS.g; e.golpe = ps;
          const frente = Math.abs(angWrap(ang - g.rotation.y)) < 0.6;
          const anda = (sx) => { g.position.x += Math.sin(g.rotation.y) * vel * dt * sx; g.position.z += Math.cos(g.rotation.y) * vel * dt * sx; };
          if (ps.tipo === 'tiro' || ps.tipo === 'chuva') {
            // quem ataca de longe guarda distância: recua se o jogador chega perto demais
            if (d < 3.6) { anda(-0.75); if (reach < def.range && frente && Math.random() < dt * 1.5) { e.passo = (e.passo || 0) + 1; } }
            else if (d > 13) anda(1);
            if (d >= 3.6 && d < 15 && frente && !isca) { e.state = 'windup'; e.t = def.windup * ps.wu; e.t0 = e.t; preparar(e, ps, P); }
          } else if (ps.tipo === 'onda') {
            if (d > 8) anda(1);
            else if (frente) { e.state = 'windup'; e.t = def.windup * ps.wu; e.t0 = e.t; preparar(e, ps, P); }
          } else if (ps.tipo === 'investida') {
            if (d > 11) anda(1);
            else if (d < 2.6) { e.passo = (e.passo || 0) + 1; } // perto demais para tomar impulso: passa ao próximo
            else if (frente) { e.state = 'windup'; e.t = def.windup * ps.wu; e.t0 = e.t; preparar(e, ps, P); }
          } else {
            if (reach > def.range * 0.75) anda(1);
            if (reach < def.range && frente) { e.state = 'windup'; e.t = def.windup * ps.wu; e.t0 = e.t; preparar(e, ps, P); }
          }
        }
      } else if (e.state === 'windup') {
        const ps = e.golpe || PASSOS.g;
        g.rotation.y = turnTo(g.rotation.y, ang, (ps.tipo === 'tiro' ? 4 : 2.5) * dt); e.t -= dt;
        if (e.orbe) { const k = 1 - e.t / (e.t0 || 1); e.orbe.scale.setScalar(0.3 + k * 1.1); }
        if (e.t <= 0) {
          soltarOrbe(e);
          e.state = 'recover'; e.t = def.recover * ps.rec; e.t0 = e.t; e.passo = (e.passo || 0) + 1;
          if (ps.tipo === 'golpe') {
            const inReach = reach < def.range + 0.5 && Math.abs(angWrap(ang - g.rotation.y)) < 1.1;
            e.vel.x += Math.sin(g.rotation.y) * 3; e.vel.z += Math.cos(g.rotation.y) * 3;
            if (inReach && !isca && !playerGone && !M.paredeEntre(g.position.x, g.position.z, P.pos.x, P.pos.z)) { e.multDano = ps.dmg; golpear(e, P); e.multDano = 1; }
            else if (inReach && isca) OV.combate.faisca(isca.x, M.altura(isca.x, isca.z) + 1.2, isca.z, 0xd8c0ff);
          } else if (ps.tipo === 'forte') {
            const A = e.areaAtaque || { x: g.position.x, z: g.position.z, y: g.position.y, r: def.range + (ps.area || 1.2) }; e.areaAtaque = null;
            anelChao(A.x, A.z, 0.5, A.r, 0.45, 0xff6a2a); OV.jogo.shake(0.4); if (OV.audio) OV.audio.heavy();
            // a posição de cada um é conferida agora, no instante do golpe, contra o mesmo raio do círculo
            if (!isca) for (const Q of alvos) {
              if (Q.dead || Q.dormindo) continue;
              if (Math.hypot(Q.pos.x - A.x, Q.pos.z - A.z) > A.r || Math.abs(Q.pos.y - A.y) > 2.5) continue;
              if (M.paredeEntre(A.x, A.z, Q.pos.x, Q.pos.z)) continue;
              e.multDano = ps.dmg; golpear(e, Q); e.multDano = 1;
            }
          } else if (ps.tipo === 'investida') {
            e.state = 'investida'; e.t = ps.dur || 0.5; e.acertou = false; e.ps = ps;
          } else if (ps.tipo === 'tiro') disparar(e, ps, P);
          else if (ps.tipo === 'onda') onda(e, ps);
        }
      } else if (e.state === 'investida') {
        e.t -= dt; const ps = e.ps || PASSOS.I;
        g.position.x += Math.sin(g.rotation.y) * ps.vel * dt; g.position.z += Math.cos(g.rotation.y) * ps.vel * dt;
        if (!e.acertou && !playerGone && !isca && d < def.r + 0.8 && !M.paredeEntre(g.position.x, g.position.z, P.pos.x, P.pos.z)) { e.acertou = true; e.multDano = ps.dmg; golpear(e, P); e.multDano = 1; }
        if (e.t <= 0) { e.state = 'recover'; e.t = def.recover * ps.rec; e.t0 = e.t; }
      } else if (e.state === 'recover') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }
      else if (e.state === 'stun') { e.t -= dt; if (e.t <= 0) e.state = 'chase'; }

      // a marcha conta só o que o corpo realmente andou desde o quadro anterior
      const ult = e._ult || (e._ult = { x: g.position.x, z: g.position.z });
      const mov = def.fixo ? 0 : Math.hypot(g.position.x - ult.x, g.position.z - ult.z); ult.x = g.position.x; ult.z = g.position.z;
      const mar = I.marchar(e, dt, mov);
      let armL, armR;
      if (e.state === 'windup') { const k = 1 - e.t / (e.t0 || def.windup), tp = e.golpe ? e.golpe.tipo : 'golpe'; if (tp === 'tiro') { armL = -0.4 * k; armR = -1.9 * k; } else if (tp === 'forte' || tp === 'onda') { armL = armR = -3.0 * k; } else if (tp === 'investida') { armL = armR = 0.8 * k; } else armL = armR = -2.5 * k; }
      else if (e.state === 'investida') armL = armR = -1.4;
      else if (e.state === 'recover') armL = armR = 0.9 * (e.t / (e.t0 || def.recover));
      else if (e.state === 'stun') armL = armR = 0.5 + Math.sin(e.ph * 6) * 0.1;
      else if (e.pernas && e.marcha.amp > 0.05) { armL = mar.braco * 0.6; armR = -mar.braco * 0.6; }
      else { armL = Math.sin(e.ph) * 0.12; armR = -armL; }
      const k = 1 - Math.exp(-20 * dt);
      e.armL.rotation.x = lerp(e.armL.rotation.x, armL, k); e.armR.rotation.x = lerp(e.armR.rotation.x, armR, k);
      e.eye.color.setHex(e.state === 'windup' ? 0xff3b2f : e.state === 'stun' ? 0x555555 : e.eyeBase);
      g.rotation.z = e.state === 'stun' ? Math.sin(e.ph * 3) * 0.08 : mar.ginga;
      if (def.ia) def.ia(e, dt);
      g.position.y = M.altura(g.position.x, g.position.z) + (def.y0 || 0) + (def.fixo ? 0 : def.voa ? 0.35 + (e.asas ? mar.bob : Math.sin(e.ph * 2) * 0.12) : mar.bob);
      M.collide(g.position, def.r);
      if (e.masmorra && OV.aventura && OV.aventura.prenderNaMasmorra) OV.aventura.prenderNaMasmorra(e.masmorra, g.position);
      if (e.apanhouT > 0) e.apanhouT -= dt;
    });
    // separação entre vícios e empurrão no jogador
    const a = I.vivos();
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) {
        const p = a[i].g.position, q = a[j].g.position; const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), m = a[i].def.r + a[j].def.r;
        if (d < m && d > 1e-4) { const fi = a[i].def.fixo, fj = a[j].def.fixo; if (fi && fj) continue; const k = (m - d) / (fi || fj ? 1 : 2) / d; if (!fi) { p.x -= dx * k; p.z -= dz * k; } if (!fj) { q.x += dx * k; q.z += dz * k; } }
      }
      if (!P0.dead) {
        const P = P0; const p = a[i].g.position;
        if (a[i].def.fixo) { const dx = P.pos.x - p.x, dz = P.pos.z - p.z, d = Math.hypot(dx, dz), m = a[i].def.r + 0.45; if (d < m && d > 1e-4) { P.pos.x = p.x + dx / d * m; P.pos.z = p.z + dz / d * m; } continue; } const dx = P.pos.x - p.x, dz = P.pos.z - p.z, d = Math.hypot(dx, dz), m = a[i].def.r + 0.45;
        if (d < m && d > 1e-4) { P.pos.x = p.x + dx / d * m; P.pos.z = p.z + dz / d * m; }
      }
    }
  };
})(window.OV);

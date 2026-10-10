/* Ordo Virtutum — bestiário das terras de fora: os vícios que rondam longe das vilas e os guardiões das masmorras.
   Murmurador (a maledicência) e Gárgula da Acídia no vale; Caranguejo da Gula e Polvo da Gula no porto;
   Morcego da Avareza e Bezerro de Ouro nas minas; Pavão da Vaidade e Basilisco da Vanglória na corte. */
(function (OV) {
  'use strict';
  const I = OV.inimigos, M = OV.mundo; if (!I || !M || M.falhou) return;
  const sm = OV.sm, mesh = OV.mesh, AN = OV.andar;
  const olho = c => new THREE.MeshBasicMaterial({ color: c });

  /* ---- Murmurador: uma sombra de capuz que sussurra; flutua, sem pés ---- */
  function makeMurmurador() {
    const g = new THREE.Group();
    const manto = sm(0x2a2434, { emissive: 0x0a0612 }), pele = sm(0x6a6070), eye = olho(0xb88aff);
    const corpo = mesh(new THREE.ConeGeometry(0.52, 1.7, 8, 1, true), manto, 0, 1.0, 0); g.add(corpo);
    g.add(mesh(new THREE.SphereGeometry(0.3, 8, 7), manto, 0, 1.92, -0.04));
    g.add(mesh(new THREE.SphereGeometry(0.2, 7, 6), pele, 0, 1.86, 0.1));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), eye); e.position.set(0.07 * s, 1.9, 0.27); g.add(e); });
    const boca = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.02), eye); boca.position.set(0, 1.78, 0.29); g.add(boca);
    // tiras rasgadas na barra do manto
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const t = mesh(new THREE.BoxGeometry(0.12, 0.42, 0.03), manto, Math.sin(a) * 0.46, 0.14, Math.cos(a) * 0.46); t.rotation.y = a; g.add(t); }
    const arm = s => { const p = new THREE.Group(); p.position.set(0.36 * s, 1.55, 0.05); p.add(mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), manto, 0, -0.42, 0)); p.add(mesh(new THREE.ConeGeometry(0.06, 0.24, 4), pele, 0, -0.95, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [manto], eye, eyeBase: 0xb88aff, manto: corpo };
  }

  /* ---- Gárgula da Acídia: pedra que não quer se mexer, mas pesa como um muro ---- */
  function makeGargula() {
    const g = new THREE.Group();
    const pedra = sm(0x6e6a62, { roughness: 1, emissive: 0x060504 }), escura = sm(0x3e3a34), eye = olho(0x9adf6a);
    const tronco = mesh(new THREE.DodecahedronGeometry(0.85, 0), pedra, 0, 1.75, 0); tronco.scale.set(1.1, 1.05, 0.85); g.add(tronco);
    const pernas = AN.pernas(g, 0.42, 1.05, { coxa: 0.52, canela: 0.48, larg: 0.36, mat: escura, pe: [0.42, 0.16, 0.6] });
    g.add(mesh(new THREE.DodecahedronGeometry(0.46, 0), pedra, 0, 2.75, 0.18));
    [-1, 1].forEach(s => {
      const h = mesh(new THREE.ConeGeometry(0.1, 0.55, 5), escura, 0.24 * s, 3.15, 0.1); h.rotation.z = -0.6 * s; g.add(h);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eye); e.position.set(0.14 * s, 2.8, 0.58); g.add(e);
      // asas de pedra, dobradas
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.08), escura); w.position.set(0.8 * s, 2.3, -0.5); w.rotation.set(0.2, -0.5 * s, 0.35 * s); g.add(w);
    });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.95 * s, 2.25, 0); p.add(mesh(new THREE.BoxGeometry(0.34, 1.15, 0.34), pedra, 0, -0.57, 0)); p.add(mesh(new THREE.DodecahedronGeometry(0.3, 0), escura, 0, -1.25, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [pedra, escura], eye, eyeBase: 0x9adf6a, pernas, passada: 0.6, marchaO: { A: 0.3, K: 0.5, bob: 0.1 }, ginga: 0.06 };
  }

  /* ---- Caranguejo da Gula: carapaça vermelha, pinças que não largam ---- */
  function makeCaranguejo() {
    const g = new THREE.Group();
    const casca = sm(0x8a2a1a, { roughness: 0.6, emissive: 0x1a0402 }), claro = sm(0xc8704a), eye = olho(0xffd23a);
    const c = mesh(new THREE.SphereGeometry(0.62, 10, 7), casca, 0, 0.55, 0); c.scale.set(1.25, 0.48, 0.95); g.add(c);
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.ConeGeometry(0.05, 0.14, 4), claro, -0.4 + i * 0.2, 0.86, 0.35));
    [-1, 1].forEach(s => {
      const st = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 4), claro, 0.16 * s, 0.9, 0.42); g.add(st);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 4), eye); e.position.set(0.16 * s, 1.07, 0.42); g.add(e);
    });
    const patas = [];
    [-0.32, 0, 0.32].forEach(z => [-1, 1].forEach(s => { const p = mesh(new THREE.BoxGeometry(0.62, 0.06, 0.06), claro, 0.72 * s, 0.32, z); p.rotation.z = 0.5 * s; g.add(p); patas.push(p); }));
    const pinca = s => {
      const p = new THREE.Group(); p.position.set(0.66 * s, 0.6, 0.48);
      p.add(mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), casca, 0, -0.2, 0.1));
      const garra = mesh(new THREE.SphereGeometry(0.22, 7, 5), casca, 0, -0.5, 0.18); garra.scale.set(0.8, 1.25, 0.7); p.add(garra);
      p.add(mesh(new THREE.ConeGeometry(0.07, 0.3, 4), claro, 0.06, -0.78, 0.22));
      g.add(p); return p;
    };
    return { g, armL: pinca(-1), armR: pinca(1), mats: [casca], eye, eyeBase: 0xffd23a, patas6: patas, passada: 0.35 };
  }

  /* ---- Polvo da Gula: o guardião da gruta, oito braços que puxam tudo para a boca ---- */
  function makePolvo() {
    const g = new THREE.Group();
    const pele = sm(0x5a2a5a, { roughness: 0.5, emissive: 0x12040e }), clara = sm(0x9a5a8a), eye = olho(0xffc84a);
    const cab = mesh(new THREE.SphereGeometry(1.15, 12, 10), pele, 0, 2.5, -0.2); cab.scale.set(1, 1.25, 1); g.add(cab);
    g.add(mesh(new THREE.SphereGeometry(0.85, 10, 8), pele, 0, 1.45, 0.15));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 7, 6), eye); e.position.set(0.45 * s, 1.95, 0.8); g.add(e); const p = mesh(new THREE.SphereGeometry(0.08, 5, 4), sm(0x0a0408), 0.47 * s, 1.95, 0.95); g.add(p); });
    const tent = [];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, t = new THREE.Group(); t.position.set(Math.sin(a) * 0.6, 1.0, Math.cos(a) * 0.6); t.rotation.y = a;
      let pai = t;
      for (let k = 0; k < 4; k++) { const seg = new THREE.Group(); seg.position.set(0, 0, k ? 0.42 : 0); seg.add(mesh(new THREE.CylinderGeometry(0.17 - k * 0.035, 0.2 - k * 0.035, 0.46, 6), k % 2 ? clara : pele, 0, 0, 0.2)); seg.children[0].rotation.x = Math.PI / 2; pai.add(seg); pai = seg; }
      t.rotation.x = 0.45; g.add(t); tent.push(t);
    }
    const armL = tent[1], armR = tent[7];
    return { g, armL, armR, mats: [pele, clara], eye, eyeBase: 0xffc84a, tentaculos: tent, passada: 0.6 };
  }

  /* ---- Morcego da Avareza: olhos de moeda, asas de couro, vem em bando ---- */
  function makeMorcego() {
    const g = new THREE.Group();
    const couro = sm(0x2a2018, { emissive: 0x0a0602 }), ouro = sm(0xd8b040, { metalness: 0.85, roughness: 0.3, emissive: 0x3a2400 }), eye = olho(0xffd84a);
    g.add(mesh(new THREE.SphereGeometry(0.26, 8, 6), couro, 0, 0.9, 0));
    g.add(mesh(new THREE.SphereGeometry(0.18, 7, 6), couro, 0, 1.15, 0.12));
    [-1, 1].forEach(s => {
      const o = mesh(new THREE.ConeGeometry(0.06, 0.2, 4), couro, 0.09 * s, 1.34, 0.08); g.add(o);
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8), eye); e.rotation.x = Math.PI / 2; e.position.set(0.07 * s, 1.17, 0.29); g.add(e);
    });
    const asas = [];
    [-1, 1].forEach(s => { const wp = new THREE.Group(); wp.position.set(0.16 * s, 0.98, 0); g.add(wp); asas.push(wp); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.5), sm(0x3a2a20, { side: THREE.DoubleSide })); w.position.set(0.45 * s, 0, 0); wp.add(w); });
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10), ouro, 0, 0.62, 0)); // uma moeda presa nas garras
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [couro], eye, eyeBase: 0xffd84a, asas };
  }

  /* ---- Bezerro de Ouro: o ídolo que os homens fundiram, e que agora quer ser servido ---- */
  function makeBezerro() {
    const g = new THREE.Group();
    const ouro = sm(0xd8a830, { metalness: 0.9, roughness: 0.25, emissive: 0x3a2400 }), escuro = sm(0x8a6a1a, { metalness: 0.8, roughness: 0.4 }), eye = olho(0xff4a1a);
    const corpo = mesh(new THREE.BoxGeometry(1.25, 1.1, 2.5), ouro, 0, 1.55, 0); g.add(corpo);
    g.add(mesh(new THREE.BoxGeometry(0.85, 0.8, 0.95), ouro, 0, 2.25, 1.35));
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.45, 0.4), escuro, 0, 2.05, 1.95));
    [-1, 1].forEach(s => {
      const h = mesh(new THREE.ConeGeometry(0.1, 0.7, 6), escuro, 0.38 * s, 2.85, 1.3); h.rotation.z = -0.9 * s; g.add(h);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), eye); e.position.set(0.3 * s, 2.35, 1.82); g.add(e);
    });
    const cauda = mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), escuro, 0, 1.8, -1.55); cauda.rotation.x = 0.7; g.add(cauda);
    const patas = [];
    [[-0.42, 0.85], [0.42, 0.85], [-0.42, -0.85], [0.42, -0.85]].forEach(([x, z]) => patas.push(AN.perna(g, x, 1.0, { z, coxa: 0.52, canela: 0.48, larg: 0.26, mat: ouro, pe: [0.3, 0.12, 0.34] })));
    const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(0, 2.2, 1.6); armR.position.set(0, 2.2, 1.6); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [ouro, escuro], eye, eyeBase: 0xff4a1a, patas4: patas, cauda, passada: 1.1 };
  }

  /* ---- Pavão da Vaidade: a cauda aberta como um leque de olhos ---- */
  function makePavao() {
    const g = new THREE.Group();
    const azul = sm(0x1a5a7a, { roughness: 0.4, emissive: 0x041218 }), verde = sm(0x2a7a5a, { roughness: 0.4 }), ouro = sm(0xd8b048, { metalness: 0.8, roughness: 0.3 }), eye = olho(0xff5aa0);
    g.add(mesh(new THREE.SphereGeometry(0.42, 9, 7), azul, 0, 1.2, 0));
    g.children[0].scale.set(0.9, 1.2, 1);
    const pescoco = mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.7, 6), azul, 0, 1.75, 0.18); pescoco.rotation.x = -0.2; g.add(pescoco);
    g.add(mesh(new THREE.SphereGeometry(0.17, 7, 6), azul, 0, 2.15, 0.28));
    { const bico = mesh(new THREE.ConeGeometry(0.05, 0.2, 4), ouro, 0, 2.12, 0.48); bico.rotation.x = Math.PI / 2; g.add(bico); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.08 * s, 2.2, 0.4); g.add(e); });
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.ConeGeometry(0.025, 0.25, 4), ouro, (i - 1.5) * 0.06, 2.42, 0.26); g.add(c); }
    // o leque da cauda, com os olhos pintados
    const leque = new THREE.Group(); leque.position.set(0, 1.25, -0.35); g.add(leque);
    for (let i = 0; i < 11; i++) {
      const a = -1.3 + i / 10 * 2.6, pena = new THREE.Group(); pena.rotation.z = a; leque.add(pena);
      pena.add(mesh(new THREE.BoxGeometry(0.2, 1.5, 0.03), verde, 0, 0.85, 0));
      const o = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), ouro); o.position.set(0, 1.45, 0.02); pena.add(o);
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.05, 8), sm(0x1a2a6a)); p.position.set(0, 1.45, 0.03); pena.add(p);
    }
    leque.rotation.x = -0.25;
    const pernas = AN.pernas(g, 0.15, 0.8, { coxa: 0.4, canela: 0.38, larg: 0.07, mat: ouro, pe: [0.16, 0.05, 0.22] });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.38 * s, 1.35, 0); p.add(mesh(new THREE.BoxGeometry(0.08, 0.55, 0.3), azul, 0, -0.27, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [azul, verde], eye, eyeBase: 0xff5aa0, pernas, leque, passada: 0.55, marchaO: { A: 0.45, K: 0.8 } };
  }

  /* ---- Basilisco da Vanglória: a serpente coroada, cujo olhar quer fazer de cada um uma estátua de si ---- */
  function makeBasilisco() {
    const g = new THREE.Group();
    const escama = sm(0x2a4a2a, { roughness: 0.5, emissive: 0x040a04 }), ventre = sm(0x8a9a5a), ouro = sm(0xd8b048, { metalness: 0.85, roughness: 0.3, emissive: 0x2a1a00 }), eye = olho(0xf0f8a0);
    const segs = [];
    [[0, 0.5, -2.2, 0.5], [0.5, 0.55, -1.5, 0.58], [0.2, 0.6, -0.7, 0.64], [-0.2, 0.75, 0.1, 0.68], [0, 1.2, 0.6, 0.6], [0, 1.9, 0.75, 0.52]].forEach(([x, y, z, r], i) => {
      const m = mesh(new THREE.SphereGeometry(r, 10, 8), i % 2 ? ventre : escama, x, y, z); m.userData.y0 = y; m.userData.z0 = z; g.add(m); segs.push(m);
    });
    const cab = new THREE.Group(); cab.position.set(0, 2.55, 0.95); g.add(cab);
    const crn = mesh(new THREE.BoxGeometry(0.75, 0.42, 0.95), escama, 0, 0, 0.1); cab.add(crn);
    cab.add(mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), ventre, 0, -0.22, 0.25));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), eye); e.position.set(0.28 * s, 0.1, 0.45); cab.add(e); });
    // a coroa
    cab.add(mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 10), ouro, 0, 0.27, 0));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cab.add(mesh(new THREE.ConeGeometry(0.06, 0.26, 4), ouro, Math.cos(a) * 0.27, 0.45, Math.sin(a) * 0.27)); }
    const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(0, 2.5, 1.1); armR.position.set(0, 2.5, 1.1); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [escama, ventre], eye, eyeBase: 0xf0f8a0, segs, cabeca: cab, passada: 0.6 };
  }

  /* ================= AS FICHAS ================= */
  const FO = OV.FOES;
  Object.assign(FO, {
    murmurador: { key: 'murmurador', name: 'Murmurador', nivel: 4, build: makeMurmurador, hp: 72, speed: 3.2, dmg: 11, windup: 0.6, recover: 0.8, range: 1.8, r: 0.45, height: 2.2, knock: 1, stagger: true, xp: 40, mundo: true, aggro: 15, leash: 26, voa: true, moedas: [2, 4], status: null },
    gargula: { key: 'gargula', name: 'Gárgula da Acídia', nivel: 8, chefe: true, build: makeGargula, hp: 600, speed: 2.4, dmg: 24, windup: 0.85, recover: 1.0, range: 2.6, r: 0.95, height: 3.4, knock: 0.2, stagger: false, xp: 420, aggro: 30, leash: 40, status: 'preguica', moedas: [20, 30],
      fall: 'A Gárgula se desfaz em cascalho. Onde havia acídia, volta o desejo de servir.' },
    caranguejo: { key: 'caranguejo', name: 'Caranguejo da Gula', nivel: 8, build: makeCaranguejo, hp: 120, speed: 3.0, dmg: 15, windup: 0.5, recover: 0.7, range: 1.9, r: 0.7, height: 1.1, knock: 0.6, stagger: true, xp: 55, mundo: true, aggro: 12, leash: 22, moedas: [2, 5], status: 'gula' },
    polvo: { key: 'polvo', name: 'Polvo da Gula', nivel: 12, chefe: true, build: makePolvo, hp: 1100, speed: 1.9, dmg: 30, windup: 0.85, recover: 0.95, range: 3.4, r: 1.3, height: 3.4, knock: 0.1, stagger: false, xp: 720, aggro: 32, leash: 40, status: 'gula', moedas: [30, 45],
      fall: 'Os oito braços se soltam das pedras. A gruta, enfim, para de engolir.' },
    morcego: { key: 'morcego', name: 'Morcego da Avareza', nivel: 11, build: makeMorcego, hp: 80, speed: 6.0, dmg: 13, windup: 0.4, recover: 0.6, range: 1.5, r: 0.4, height: 1.4, knock: 1.2, stagger: true, xp: 48, mundo: true, aggro: 15, leash: 26, voa: true, moedas: [3, 6], status: 'avareza' },
    bezerro: { key: 'bezerro', name: 'Bezerro de Ouro', nivel: 16, chefe: true, build: makeBezerro, hp: 1600, speed: 3.4, dmg: 34, windup: 0.8, recover: 0.9, range: 2.6, r: 1.35, height: 3.0, knock: 0.1, stagger: false, xp: 1100, aggro: 32, leash: 40, status: 'avareza', moedas: [45, 70],
      fall: 'O ídolo cai do pedestal e se parte. Era só metal, e nunca foi mais que isso.' },
    pavao: { key: 'pavao', name: 'Pavão da Vaidade', nivel: 15, build: makePavao, hp: 150, speed: 4.0, dmg: 19, windup: 0.55, recover: 0.75, range: 1.9, r: 0.55, height: 2.4, knock: 0.9, stagger: true, xp: 80, mundo: true, aggro: 14, leash: 24, moedas: [4, 8], status: null },
    basilisco: { key: 'basilisco', name: 'Basilisco da Vanglória', nivel: 19, chefe: true, build: makeBasilisco, hp: 2000, speed: 3.0, dmg: 36, windup: 0.8, recover: 0.9, range: 3.0, r: 1.25, height: 3.2, knock: 0.1, stagger: false, xp: 1500, aggro: 32, leash: 40, status: 'soberba', moedas: [60, 90],
      fall: 'A coroa rola pelo chão de mármore. A serpente que queria ser olhada não tem mais quem a olhe.' }
  });
  Object.assign(I.CORES, {
    murmurador: ['Rubro', 0x5a1a2a, 'Murmurador Ancião', 0x1a1a3a], caranguejo: ['Negro', 0x2a1a14, 'Caranguejo-Rei', 0xa86a1a],
    morcego: ['Rubro', 0x5a1a14, 'Morcego Ancião', 0x6a5a20], pavao: ['Branco', 0xd8d4c8, 'Pavão Real da Vaidade', 0x5a1a6a]
  });
  ['gargula', 'polvo', 'bezerro', 'basilisco'].forEach(k => I.CHEFES.add(k));
  Object.assign(I.PADROES, {
    murmurador: ['T3', 'r', 'T', 'I'],
    gargula: { fases: [[1, ['g', 'F', 'Tl', 'g']], [0.5, ['O', 'g', 'I', 'F', 'C']]] },
    caranguejo: ['r', 'r', 'F', 'I'],
    polvo: { fases: [[1, ['g', 'T3', 'F']], [0.6, ['C', 'T5', 'g', 'O']], [0.3, ['O', 'T7', 'C', 'F', 'g']]] },
    morcego: ['I', 'r', 'T'],
    bezerro: { fases: [[1, ['g', 'I', 'F']], [0.66, ['I', 'C', 'T5', 'g']], [0.33, ['O', 'I', 'C', 'T7', 'F']]] },
    pavao: ['T5', 'g', 'r', 'I'],
    basilisco: { fases: [[1, ['g', 'T3', 'I']], [0.66, ['O', 'T5', 'C', 'g']], [0.33, ['O', 'C', 'T7', 'I', 'F']]] }
  });
  if (I.PROJ) Object.assign(I.PROJ, {
    murmurador: [0xb88aff, 'ira'], gargula: [0x9a9488, 'preguica'], caranguejo: [0xd8704a], polvo: [0x4a1a5a, 'gula'],
    morcego: [0xe0b040, 'avareza'], bezerro: [0xf0c040, 'avareza'], pavao: [0x3ac0c0], basilisco: [0xe8f08a, 'soberba']
  });

  // movimentos próprios: tentáculos que ondulam, o leque que se abre no golpe, o pescoço do basilisco
  const anim0 = {
    polvo: e => { const t = performance.now() / 600; e.tentaculos.forEach((tt, i) => { tt.rotation.x = 0.45 + Math.sin(t + i) * 0.18 + (e.state === 'windup' ? -0.5 : 0); }); },
    pavao: e => { if (e.leque) { const k = e.state === 'windup' ? 1 : 0; e.leque.rotation.x += ((-0.25 - 0.55 * k) - e.leque.rotation.x) * 0.12; e.leque.scale.setScalar(1 + 0.25 * k); } },
    basilisco: e => { if (e.cabeca) { const t = performance.now() / 500; e.cabeca.rotation.y = Math.sin(t) * 0.25; e.cabeca.position.y = 2.55 + (e.state === 'windup' ? 0.35 : Math.sin(t * 1.3) * 0.06); } },
    murmurador: e => { if (e.manto) e.manto.rotation.y += 0.01; }
  };
  for (const k in anim0) { const def = FO[k], f = anim0[k]; def.ia = f; }

  /* os poemas dos guardiões das masmorras */
  if (OV.cenas && OV.cenas.POEMAS) Object.assign(OV.cenas.POEMAS, {
    gargula: ['Gárgula da Acídia', [
      'Pedra eu fui, e pedra fico:\npara que andar, se a estrada cansa?\nO sino toca, e eu não me explico,\nnem rezo, nem choro, nem danço a dança.',
      'Senta à sombra destes muros,\nesquece o voto, esquece o irmão.\nOs dias passam, frios e duros,\ne é tão macio, tão macio o chão.']],
    polvo: ['Polvo da Gula', [
      'Oito braços tenho, e nenhum descansa\nde puxar para a boca o que o mar me traz.\nQuem come de tudo nunca alcança\no fundo do vazio que em si mesmo faz.',
      'Vem, marinheiro, a mesa é funda;\nsenta na pedra, molha o pão no sal.\nA maré sobe, a gruta inunda,\ne a fome engole o bem e o mal.']],
    bezerro: ['Bezerro de Ouro', [
      'Fundiram-me com brincos e anéis,\ncom o ouro das mulheres e das crianças.\nDançaram à minha volta, os infiéis,\ne me chamaram deus das esperanças.',
      'Ajoelha, mineiro, que eu brilho mais\nque a lâmpada pobre da tua capela.\nDá-me o salário, dá-me os teus pais:\no ouro não chora, nem vela.']],
    basilisco: ['Basilisco da Vanglória', [
      'Olha-me nos olhos e serás pedra,\nestátua de ti mesmo em praça e jardim.\nA glória que o mundo te dá não medra:\ncomeça no aplauso e acaba em mim.',
      'Ergue o teu nome mais alto que a torre,\ngrava-o no mármore, pinta-o no altar.\nO nome cresce, e a alma morre,\ne ninguém mais se lembra de rezar.']]
  });
})(window.OV);

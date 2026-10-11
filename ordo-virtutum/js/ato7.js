/* Ordo Virtutum — Ato VII: o Monte Santo. Missões, os vícios da soberba (o desprezo, a vanglória, a torre que quer
   chegar ao céu sem Deus), a Crisma no mosteiro, Moisés no cume, o Príncipe da Soberba, São Miguel e a Lâmpada da
   Humildade. O fim da peregrinação: três finais, conforme o caminho que o peregrino fez desde o Ato I.
   A luta, no alto da Torre: de tempos em tempos o Príncipe se exalta (sobe no ar, intocável). Quem se ajoelha
   (segura R) faz cair a luz sobre ele, e ele despenca atordoado. Aos 30%, «sereis como deuses», e ele se torna o
   Acusador: é preciso resistir à noite das acusações, até que São Miguel o precipite: «Quem é como Deus?» */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.monte || !OV.missoes) return;
  const MS = OV.missoes, R = OV.monte, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, T = OV.tempo, IT = OV.itens, AV = OV.aventura;
  const sm = OV.sm, mesh = OV.mesh;
  const A7 = { noAlto: false }; OV.ato7 = A7;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, g, linha, ARV } = MS;
  const W = R.W, H = M.altura;
  const C = () => OV.combate;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const naRegiao = () => M.regiao(P.pos.x, P.pos.z) === 'monte';
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  const figPos = id => () => { const f = M.figuras[id]; return f ? { x: f.x, z: f.z } : null; };
  const oraPos = id => () => { const o = M.oratorios[id]; return o ? { x: o.x, z: o.z } : null; };
  const tagPos = t => () => { const v = I.porTag(t).filter(vivo); if (!v.length) return null; let x = 0, z = 0; v.forEach(e => { x += e.g.position.x; z += e.g.position.z; }); return { x: x / v.length, z: z / v.length }; };
  const ou = (...fs) => () => { for (const f of fs) { const r = f(); if (r) return r; } return null; };
  const lugar = (lx, lz) => () => W(lx, lz);
  M.spawnsMundo.push(...R.spawnsMundo);

  /* ================= MISSÕES DO ATO VII ================= */
  const SOBERBOS = [[6, 66], [16, 58], [28, 50], [44, 44], [32, 32], [12, 28]];
  const livres = () => (F().soberbos7 || []).length;
  const degraus = () => R.DEGRAUS.filter(d => prog().oratorios[d.id]).length;
  const proxDegrau = () => { const d = R.DEGRAUS.find(x => !prog().oratorios[x.id]); return d ? oraPos(d.id)() : null; };
  Object.assign(MS.MIS, {
    a7m1: { ato: 7, nome: 'O Monte Santo', tipo: 'p', xp: 200, etapas: ['Siga para o Monte Santo pela placa de uma das estradas.', 'Procure Abba Efrém, na Igreja da Transfiguração, no Mosteiro da Sarça.', 'Acenda a vela do Oratório da Sarça, no pátio do mosteiro.'],
      alvos: [() => R.ENTRADA, figPos('abbaEfrem'), oraPos('sarca')] },
    a7m2: { ato: 7, nome: 'Os Soberbos do Caminho', tipo: 'p', xp: 360, etapas: [() => `Liberte os peregrinos soberbos que sobem o monte pisando nos outros, ao norte do mosteiro (${livres()}/6).`, 'Volte a Abba Efrém.'],
      alvos: [ou(tagPos('soberbos7'), lugar(20, 50)), figPos('abbaEfrem')] },
    a7m3: { ato: 7, nome: 'A Escada', tipo: 'p', xp: 400, etapas: [() => `Suba a Escada de São João Clímaco: acenda as velas dos três degraus do monte (${degraus()}/3).`],
      alvos: [proxDegrau] },
    a7m4: { ato: 7, nome: 'Tira as Sandálias', tipo: 'p', xp: 380, etapas: ['Suba ao cume do Monte Santo e reze descalço.', 'Vigie com Moisés: resista aos Caídos e aos Bodes do bezerro de ouro.'],
      alvos: [lugar(R.VISAO.x, R.VISAO.z), lugar(R.VISAO.x, R.VISAO.z)] },
    a7m5: { ato: 7, nome: 'O Príncipe da Soberba', tipo: 'p', xp: 1200, etapas: ['Entre na Torre, atrás do cume, e suba até o alto.', 'Enfrente o Príncipe da Soberba no alto da Torre. Quando ele se exaltar, ajoelhe-se (segure R).', 'Desça ao Mosteiro da Sarça para a Divina Liturgia.'],
      alvos: [lugar(R.PORTA_TORRE.x, R.PORTA_TORRE.z), ou(tagPos('principe'), lugar(R.TORRE.x, R.TORRE.z)), lugar(R.IGREJA.x, R.IGREJA.z + 10)] }
  });
  MS.aposAto6 = () => setTimeout(() => { if (!st('a7m1')) MS.iniciar('a7m1'); setTimeout(() => ui.toast('A estrada do deserto para o Monte Santo está aberta: siga pelas placas das estradas.'), 1600); }, 400);
  function concluirA7m1() { MS.concluir('a7m1'); setTimeout(() => { MS.iniciar('a7m2'); if (livres() >= 6) MS.avancar('a7m2', 1); MS.respawnQuest(); }, 1500); }

  /* ================= OS VÍCIOS DA SOBERBA ================= */
  const ouro = sm(0xd8b048, { metalness: 0.7, roughness: 0.3 });
  function makeSoberbo() {
    const b = OV.makePossesso(0x3a1a4a, false)();
    b.eye.color.setHex(0xffe08a); b.eyeBase = 0xffe08a;
    // o queixo para o alto, a corrente de ouro e uma coroa de papel dourado
    b.g.children.forEach(c => { if (c.isGroup && c.position.y > 1.9) c.rotation.x = -0.35; });
    b.g.add(mesh(new THREE.TorusGeometry(0.22, 0.03, 5, 12), ouro, 0, 1.78, 0.1));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; b.g.add(mesh(new THREE.ConeGeometry(0.04, 0.16, 4), ouro, Math.cos(a) * 0.17, 2.3, Math.sin(a) * 0.17)); }
    return b;
  }
  function makeCaido() {
    const g = new THREE.Group();
    const corpo = sm(0x1a161e, { emissive: 0x06040a }), pele = sm(0x5a5060), asaM = new THREE.MeshBasicMaterial({ color: 0x141016, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: 0xf0f0ff });
    g.add(mesh(new THREE.ConeGeometry(0.4, 1.3, 8), corpo, 0, 1.1, 0));
    g.add(mesh(new THREE.SphereGeometry(0.22, 8, 7), pele, 0, 1.95, 0.02));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.08 * s, 1.97, 0.2); g.add(e); });
    // a auréola quebrada, apagada
    const au = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 5, 18, Math.PI * 1.3), sm(0x4a4436)); au.position.set(0, 2.32, -0.05); au.rotation.x = 0.3; g.add(au);
    const asas = [];
    [-1, 1].forEach(s => { const p = new THREE.Group(); p.position.set(0.18 * s, 1.6, -0.15); g.add(p); const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), asaM); w.position.set(0.6 * s, 0.1, 0); w.rotation.z = s * 0.25; p.add(w); asas.push(p); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.32 * s, 1.6, 0.05); p.add(mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), corpo, 0, -0.3, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [corpo], eye, eyeBase: 0xf0f0ff, asas };
  }
  function makeSentinela() {
    const g = new THREE.Group();
    const pedra = sm(0x2a2628, { roughness: 1, emissive: 0x050404 }), escura = sm(0x161214), eye = new THREE.MeshBasicMaterial({ color: 0xff8a3a });
    g.add(mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), pedra, 0, 2.4, 0));
    g.add(mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), pedra, 0, 3.5, 0));
    g.add(mesh(new THREE.ConeGeometry(0.4, 0.6, 4), escura, 0, 4.1, 0));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.02), eye); e.position.set(0.13 * s, 3.55, 0.31); g.add(e); });
    const pernas = OV.andar.pernas(g, 0.3, 1.65, { coxa: 0.82, canela: 0.78, larg: 0.3, mat: escura, pe: [0.36, 0.14, 0.5] });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.75 * s, 3.0, 0); p.add(mesh(new THREE.BoxGeometry(0.3, 1.1, 0.3), pedra, 0, -0.55, 0)); g.add(p); return p; };
    const armL = arm(-1), armR = arm(1);
    const lanca = mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 5), MAT0().iron, 0, -0.4, 0.3); armR.add(lanca); armR.add(mesh(new THREE.ConeGeometry(0.1, 0.4, 4), MAT0().iron, 0, 1.3, 0.3));
    return { g, armL, armR, mats: [pedra, escura], eye, eyeBase: 0xff8a3a, pernas, passada: 1.1, marchaO: { A: 0.28, K: 0.45 } };
  }
  function makeBode() {
    const g = new THREE.Group();
    const pelo = sm(0x2a2420, { emissive: 0x060402 }), chifre = sm(0xd8b048, { metalness: 0.5 }), eye = new THREE.MeshBasicMaterial({ color: 0xffd84a });
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.55, 1.2), pelo, 0, 0.85, 0));
    const cab = new THREE.Group(); cab.position.set(0, 1.15, 0.7); g.add(cab);
    cab.add(mesh(new THREE.BoxGeometry(0.32, 0.38, 0.42), pelo, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.12, 0.26, 0.08), pelo, 0, -0.3, 0.12));
    [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 5, 10, Math.PI * 1.2), chifre); c.position.set(0.16 * s, 0.24, -0.06); c.rotation.y = Math.PI / 2; c.rotation.z = s * 0.4; cab.add(c); const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.13 * s, 0.06, 0.2); cab.add(e); });
    const patas = [];
    [[-0.18, 0.42], [0.18, 0.42], [-0.18, -0.42], [0.18, -0.42]].forEach(([x, z]) => { const p = new THREE.Group(); p.position.set(x, 0.62, z); p.add(mesh(new THREE.BoxGeometry(0.1, 0.62, 0.1), pelo, 0, -0.31, 0)); g.add(p); patas.push(p); });
    const armL = new THREE.Group(), armR = new THREE.Group(); cab.add(armL); cab.add(armR);
    return { g, armL, armR, mats: [pelo], eye, eyeBase: 0xffd84a, patas, cab };
  }
  // o Príncipe da Soberba: o mais belo dos anjos, que não quis servir. Seis asas, coroa de sete pontas, cetro de estrela.
  function makePrincipe() {
    const g = new THREE.Group(); const corpo = new THREE.Group(); g.add(corpo);
    const armadura = sm(0xc8b890, { metalness: 0.7, roughness: 0.3, emissive: 0x1a1408 }), negro = sm(0x161214, { metalness: 0.4, roughness: 0.5 }), pele = sm(0xe8dccc, { emissive: 0x0a0806 });
    const asaM = new THREE.MeshBasicMaterial({ color: 0x0e0a0e, transparent: true, opacity: 0.88, side: THREE.DoubleSide }), borda = new THREE.MeshBasicMaterial({ color: 0xd8b048 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff3a2a });
    const pernas = OV.andar.pernas(corpo, 0.34, 2.0, { coxa: 1.0, canela: 0.95, larg: 0.34, mat: armadura, pe: [0.4, 0.16, 0.62] });
    pernas.saia = OV.andar.saia(corpo, negro, 0.6, 1.1, 1.4, 2.05, 10);
    corpo.add(mesh(new THREE.BoxGeometry(1.3, 1.5, 0.75), armadura, 0, 2.8, 0));
    corpo.add(mesh(new THREE.BoxGeometry(1.36, 0.14, 0.8), ouro, 0, 2.2, 0));
    const cab = new THREE.Group(); cab.position.set(0, 3.9, 0.04); corpo.add(cab);
    cab.add(mesh(new THREE.SphereGeometry(0.32, 10, 8), pele, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.6, 0.34, 0.5), sm(0xe8d8a8), 0, 0.1, -0.12));
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cab.add(mesh(new THREE.ConeGeometry(0.05, 0.36, 4), ouro, Math.cos(a) * 0.3, 0.44, Math.sin(a) * 0.3)); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), eye); e.position.set(0.11 * s, 0.02, 0.28); cab.add(e); });
    const asas = [];
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { const p = new THREE.Group(); p.position.set(0.35 * s, 3.4 - k * 0.5, -0.4); corpo.add(p); const w = new THREE.Mesh(new THREE.PlaneGeometry(2.6 - k * 0.5, 0.8), asaM); w.position.set((1.3 - k * 0.25) * s, 0.3 - k * 0.1, 0); w.rotation.z = s * (0.5 - k * 0.45); p.add(w); const b = new THREE.Mesh(new THREE.BoxGeometry(2.6 - k * 0.5, 0.05, 0.04), borda); b.position.set((1.3 - k * 0.25) * s, 0.7 - k * 0.1, 0); b.rotation.z = s * (0.5 - k * 0.45); p.add(b); asas.push(p); } });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.9 * s, 3.35, 0); p.add(mesh(new THREE.BoxGeometry(0.32, 1.25, 0.34), armadura, 0, -0.62, 0)); corpo.add(p); return p; };
    const armL = arm(-1), armR = arm(1);
    armR.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), ouro, 0, -1.4, 0.2)); const est = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xffe8a8 })); est.position.set(0, -0.3, 0.2); armR.add(est);
    const aura = new THREE.Mesh(new THREE.SphereGeometry(2.8, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
    aura.position.y = 2.8; aura.visible = false; corpo.add(aura);
    return { g, armL, armR, mats: [armadura, negro, pele], eye, eyeBase: 0xff3a2a, pernas, saia: pernas.saia, passada: 1.4, asas, aura, corpo };
  }
  function MAT0() { return M.MAT; }
  Object.assign(I.CORES, {
    soberbo: ['Altivo', 0x4a1a5a, 'Soberbo Coroado', 0x8a6a1a], caido: ['Sombrio', 0x0a080c, 'Caído Antigo', 0x3a2a4a],
    sentinela: ['Negra', 0x101010, 'Sentinela da Torre', 0x4a2a1a], bode: ['Negro', 0x141010, 'Bode do Bezerro', 0x8a6a1a]
  });
  const FO = OV.FOES;
  FO.soberbo = { key: 'soberbo', name: 'Peregrino soberbo', nivel: 23, build: makeSoberbo, hp: 280, speed: 3.8, dmg: 24, windup: 0.5, recover: 0.7, range: 2.1, r: 0.5, height: 2.5, knock: 0.8, stagger: true, xp: 78, aggro: 14, leash: 26, liberta: true, mundo: true, moedas: [6, 9], status: 'soberba' };
  FO.caido = { key: 'caido', name: 'Anjo caído', nivel: 22, build: makeCaido, hp: 150, speed: 4.6, dmg: 19, windup: 0.55, recover: 0.6, range: 1.9, r: 0.5, height: 2.6, knock: 1.1, stagger: true, xp: 62, mundo: true, aggro: 16, leash: 28, voa: true, moedas: [4, 7], status: 'soberba',
    ia: e => { e.asas.forEach((a, i) => { a.rotation.y = (i ? -1 : 1) * (0.3 + Math.sin(e.ph * 4) * 0.35); }); } };
  FO.sentinela = { key: 'sentinela', name: 'Sentinela da Torre', nivel: 24, build: makeSentinela, hp: 460, speed: 2.4, dmg: 30, windup: 0.85, recover: 1.0, range: 3.0, r: 0.9, height: 4.4, knock: 0.25, stagger: false, xp: 100, mundo: true, aggro: 12, leash: 22, moedas: [6, 10], status: null };
  FO.bode = { key: 'bode', name: 'Bode do Bezerro', nivel: 22, build: makeBode, hp: 190, speed: 5.4, dmg: 22, windup: 0.45, recover: 0.6, range: 1.9, r: 0.6, height: 1.6, knock: 1.0, stagger: true, xp: 60, mundo: true, aggro: 15, leash: 26, moedas: [3, 6], status: null,
    ia: e => { const k = e.state === 'chase' || e.state === 'voltar' ? 0.7 : 0.12; e.patas.forEach((p, i) => { p.rotation.x = Math.sin(e.ph * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * k; }); if (e.cab) e.cab.rotation.x = e.state === 'windup' ? 0.5 : 0; } };
  FO.principe = { key: 'principe', name: 'O Príncipe da Soberba', nivel: 26, build: makePrincipe, hp: 4200, speed: 3.3, dmg: 40, windup: 0.7, recover: 0.8, range: 3.6, r: 1.3, height: 5.2, knock: 0.05, stagger: false, xp: 1500, aggro: 60, leash: 90, status: 'soberba', chefe: true,
    fall: 'O Príncipe da Soberba foi precipitado do céu como um raio. Que reine a Humildade.', reduz: e => reduzPrincipe(e), ia: (e, dt) => iaPrincipe(e, dt) };
  Object.assign(I.PADROES, {
    soberbo: ['g', 'r', 'F', 'T'], caido: ['T', 'I', 'g', 'T3'], sentinela: ['F', 'g', 'I', 'g'], bode: ['I', 'g', 'r', 'I'],
    principe: { fases: [[1, ['g', 'T3', 'g', 'F', 'T5']], [0.6, ['T5', 'C', 'I', 'g', 'F']], [0.3, ['O', 'C', 'T7', 'I', 'F']]] }
  });
  Object.assign(I.PROJ, { soberbo: [0xffe08a, 'soberba'], caido: [0xd8d0ff, 'soberba'], sentinela: [0xff8a3a], principe: [0xffd27a, 'soberba'] });
  I.CHEFES.add('principe');

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  function irAoChao() { A7.noAlto = false; if (R.alto) R.alto(false); }
  MS.ganchos.aplicar.push(() => {
    const f = F();
    if (f.ato6_fim && !st('a7m1')) prog().missoes.a7m1 = { e: 0, fim: false, res: null };
    ['moises', 'miguel', 'bispo'].forEach(k => { if (M.figuras[k]) M.figuras[k].mostrar(false); });
    R.acenderLampada(!!f.ato7_fim);
    irAoChao(); resetarChefe();
  });
  MS.ganchos.spawn.push(() => {
    ['soberbos7', 'vigilia7'].forEach(MS.tagRemove);
    const ja = F().soberbos7 || [];
    if (MS.feita('a7m1') && !MS.feita('a7m2')) SOBERBOS.forEach(([x, z], i) => { if (ja.includes(i)) return; const e = I.spawn('soberbo', false, W(x, z), { nivel: 23 }); e.tag = 'soberbos7'; e.bi = i; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.graca_moises) inv.push('Graça de Moisés (ajoelhar-se diante do Príncipe o derruba mais depressa, e a exaltação dele dá mais tempo)');
    if (f.crisma7) inv.push(`Lembrança da Crisma de Davi, de quem você foi ${g('padrinho', 'madrinha')}`);
  });

  /* ================= A IGREJA, A SARÇA, O CUME E A TORRE ================= */
  A7.textoIgreja = () => (MS.ativa('a7m5') && MS.etapa('a7m5') === 2) ? 'Entrar para a Divina Liturgia' : 'Entrar na Igreja da Transfiguração';
  A7.igreja = function () {
    if (MS.ativa('a7m5') && MS.etapa('a7m5') === 2) { liturgia7(); return; }
    ui.fala('Igreja da Transfiguração', 'Cheiro de incenso e de cera. Na iconóstase de ouro, os santos olham de frente, sem sombra: nos ícones, a luz vem de dentro. No alto, Cristo transfigurado no monte, entre Moisés e Elias.');
  };
  A7.textoSarca = () => 'Contemplar a sarça';
  A7.sarca = function () {
    ui.fala('A Sarça', F().ato7_fim ? 'A sarça arde branca, e a luz chega ao deserto inteiro. Arde, e não se consome: a Lâmpada da Humildade.' : '«O anjo do Senhor apareceu a Moisés numa chama de fogo, do meio de uma sarça. A sarça ardia, e não se consumia» (Ex 3,2). Os monges dizem que nunca se apagou.');
  };
  A7.textoCume = () => (MS.ativa('a7m4') && MS.etapa('a7m4') === 0) ? 'Tirar as sandálias e rezar' : 'Olhar o deserto do cume';
  A7.cume = function () {
    if (MS.ativa('a7m4') && MS.etapa('a7m4') === 0) { visaoMoises(); return; }
    ui.fala('Cume do Monte Santo', F().ato7_fim ? 'Daqui se vê o deserto inteiro, e lá embaixo, pequenina, a luz branca da sarça.' : 'O vento é frio. Ao norte, a Torre negra fura as nuvens. Ao sul, lá embaixo, o mosteiro parece de brinquedo.');
  };
  A7.textoTorre = () => (MS.ativa('a7m5') && MS.etapa('a7m5') <= 1) ? 'Subir a Torre' : 'Ver a porta da Torre';
  A7.torre = function () {
    if (MS.ativa('a7m5') && MS.etapa('a7m5') <= 1) { subir(); return; }
    ui.fala('A Torre', F().ato7_fim ? 'A porta está aberta e vazia. Nemrod diz que vai desmontá-la pedra por pedra e fazer casas para os pastores.' : 'Uma porta negra, sem fechadura. Em cima, gravado na pedra: «Façamos um nome para nós» (Gn 11,4).');
  };
  A7.textoDescer = () => chefe.ativo || chefe.falando ? null : 'Descer a escada da Torre';
  A7.descer = () => { if (chefe.ativo || chefe.falando) return; descer(); };
  function subir() {
    A7.noAlto = true; R.alto(true);
    const p = W(R.TORRE.x, R.TORRE.z + 6);
    ui.clarao('#000000'); C().posicionar(p.x, p.z, Math.PI); J().mudouLugar();
    I.lista.filter(e => vivo(e) && !e.tag && Math.hypot(e.g.position.x - p.x, e.g.position.z - p.z) < 20).forEach(e => { e.removed = true; e.g.visible = false; if (e.lab && e.lab.el) e.lab.el.style.display = 'none'; });
    ui.toast('Mil degraus no escuro. No alto, o vento, as nuvens lá embaixo e um braseiro de ouro.');
    if (MS.ativa('a7m5') && MS.etapa('a7m5') === 0) MS.avancar('a7m5', 1);
  }
  function descer() {
    irAoChao(); const p = W(R.PORTA_TORRE.x, R.PORTA_TORRE.z + 2);
    ui.clarao('#000000'); C().posicionar(p.x, p.z, 0); J().mudouLugar();
  }

  /* ================= A CRISMA DE DAVI, NO MOSTEIRO (cena, sem pontos) ================= */
  function crisma7(depois) {
    const bispo = M.figuras.bispo; if (bispo) bispo.mostrar(true);
    const f = F(); f.crisma7 = true;
    const linhas = [
      ['', 'No dia seguinte, o sino de madeira toca cedo. Dom Atanásio, o bispo, chegou do outro lado do deserto, montado num burro, para crismar os pastorzinhos.'],
      ['Rebeca, a pastora', () => `O Davi pediu que fosse você ${g('o padrinho', 'a madrinha')} dele. Ele diz que quer ser corajoso como quem libertou os soberbos do caminho.`],
      ['', () => `Davi se ajoelha diante do bispo. Você põe a mão direita no ombro dele, como ${g('padrinho', 'madrinha')}.`],
      ['Dom Atanásio, o bispo', 'Davi, recebe, por este sinal, o Espírito Santo, o Dom de Deus.'],
      ['Davi, o pastorzinho', 'Amém.'],
      ['Dom Atanásio, o bispo', 'A paz esteja contigo.'],
      ['', 'O óleo do crisma cheira a bálsamo. Sabedoria, entendimento, conselho, fortaleza, ciência, piedade e temor de Deus: sete dons, como sete lâmpadas. Davi se levanta mais alto do que se ajoelhou.'],
      ['Abba Efrém, o abade', 'A Fortaleza é dom do Espírito, não conquista nossa. Lá em cima você vai precisar dela. Suba a Escada, degrau por degrau: renúncia, obediência, humildade. São João Clímaco, que foi abade aqui, dizia que ninguém sobe pulando degraus.']
    ].map(([q, t]) => [q, typeof t === 'function' ? t() : t]);
    const p = W(R.IGREJA.x, R.IGREJA.z);
    const fim = () => { if (bispo) setTimeout(() => bispo.mostrar(false), 600); if (depois) depois(); };
    if (OV.cenas) OV.cenas.contar(linhas, { alvo: new THREE.Vector3(p.x, H(p.x, p.z) + 1.6, p.z), raio: 5, altura: 2.6, olhar: 1.2, giro: 0.08 }, fim); else D.falas(linhas, fim);
  }

  /* ================= MOISÉS E A VIGÍLIA ================= */
  function visaoMoises() {
    if (!T.ehNoite()) T.definir(21);
    ui.clarao('#fff6dc'); M.figuras.moises.mostrar(true); A.bell(587, 0.2);
    D.abrir(arv('Moisés', {
      a: { txt: '«Tira as sandálias dos teus pés, porque o lugar onde estás é terra santa» (Ex 3,5). Foi o que Ele me disse, na sarça, lá embaixo. Eu tinha sido príncipe no Egito, e fugi como um assassino. Era pastor das ovelhas do meu sogro. Ele me chamou quando eu já não era nada.', prox: 'b' },
      b: { txt: 'Eu disse: «Quem sou eu para ir ao Faraó?» E Ele não respondeu «tu és capaz». Respondeu: «Eu estarei contigo.» Dizem de mim que fui o mais humilde dos homens da terra (Nm 12,3). Não sei. Sei que nunca subi este monte sozinho.', prox: 'c' },
      c: { txt: 'Enquanto eu estava aqui em cima, lá embaixo o povo fez um bezerro de ouro e dançou em volta dele: queriam um deus que pudessem carregar. Atrás deste cume, alguém ergueu uma torre para chegar ao céu sem precisar de Deus. É a mesma coisa.',
        prox: () => (F().graca_moises || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('Moisés', 'gloria',
        'Tire também você as sandálias: deixe aqui as suas insígnias e os seus títulos, tudo o que diz quem você é para os outros. Lá em cima, na Torre, só vence quem não tem um nome para defender.',
        () => { F().graca_moises = true; setTimeout(() => ui.toast('Você recebeu a Graça de Moisés: ajoelhar-se diante do Príncipe o derruba mais depressa, e a exaltação dele dá mais tempo.'), 1800); }, 'd',
        'Eu também demorei a largar o Egito. Sem a graça, você vai precisar ficar mais tempo de joelhos diante dele, e ele vai se exaltar mais depressa.') : {}),
      d: { txt: 'O Príncipe da Soberba quer ser adorado. Quando ele se exaltar, subindo acima de você, não suba atrás dele: ajoelhe-se. «Quem se exalta será humilhado, e quem se humilha será exaltado.» Vigia comigo esta noite? Os caídos e os bodes do bezerro vão subir o monte.', opc: [
        { t: 'Vigiar com Moisés.', ef: () => MS.avancar('a7m4', 1), ir: 'v' },
        { t: 'Agora não. Vou à Torre.', ef: () => { MS.concluir('a7m4', 'desceu'); iniciarA7m5(); }, ir: 'x' }] },
      v: { txt: 'Então vigie. Eles vêm em três levas. Eu fico de braços erguidos, como em Refidim: enquanto as mãos estiverem no alto, a batalha é nossa.', depois: () => iniciarVigilia() },
      x: { txt: 'Vai. Eu estarei contigo, disse Ele. Não eu: Ele.', depois: () => setTimeout(() => M.figuras.moises.mostrar(false), 800) }
    }));
  }
  const iniciarA7m5 = () => setTimeout(() => MS.iniciar('a7m5'), 1400);
  const vg = { ativa: false, onda: 0, espera: 0 };
  function iniciarVigilia() { vg.ativa = true; vg.onda = 0; vg.espera = 1.5; ui.clarao('#0a0608'); ui.toast('A noite cai sobre o cume. Você vigia.'); }
  function atualizarVigilia(dt) {
    if (!vg.ativa) return;
    if (I.porTag('vigilia7').some(vivo)) return;
    vg.espera -= dt; if (vg.espera > 0) return;
    if (vg.onda >= 3) {
      vg.ativa = false;
      if (P.pers.virt.fe < OV.MAX_VIRTUDE) P.pers.virt.fe++;
      C().recalcular(); MS.ato('fe');
      ui.banner('A vigília'); ui.toast('Você vigiou de mãos erguidas, sem querer ser visto por ninguém. A sua Fé se fortaleceu (+1).');
      if (IT.dar('varaMoises', 1, true)) setTimeout(() => ui.toast('Moisés lhe deixou o seu cajado de pastor. Veja no inventário (I).'), 1800);
      MS.concluir('a7m4', 'vigilia'); iniciarA7m5();
      setTimeout(() => M.figuras.moises.mostrar(false), 2500);
      return;
    }
    vg.onda++; vg.espera = 2.5;
    ui.toast(`Vigília: ${['primeira', 'segunda', 'terceira'][vg.onda - 1]} leva dos Caídos`);
    const n = 3 + vg.onda;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn(i % 2 ? 'bode' : 'caido', true, W(R.VISAO.x + Math.cos(a) * 7, R.VISAO.z + 4 + Math.sin(a) * 6), { nivel: 24 }); e.tag = 'vigilia7'; e.mundo = false;
    }
  }

  /* ================= O PRÍNCIPE DA SOBERBA ================= */
  const chefe = { ativo: false, falando: false, final: false, fase: 0, b: null, exalt: null, exaltT: 8, humildade: 0, gloria: 0, cerco: null };
  A7.chefe = chefe;
  const intervalo = () => chefe.fase >= 2 ? 10 : 12;
  const precisa = () => F().graca_moises ? 0.9 : 1.6;
  function resetarChefe() {
    ['principe', 'principe_add'].forEach(MS.tagRemove);
    if (M.figuras.miguel) M.figuras.miguel.mostrar(false);
    Object.assign(chefe, { ativo: false, falando: false, fase: 0, b: null, exalt: null, exaltT: 8, humildade: 0, gloria: 0, cerco: null });
  }
  const noTopo = (dx, dz) => W(R.TORRE.x + dx, R.TORRE.z + dz);
  function desafiar() {
    chefe.falando = true;
    if (MS.memChefe && MS.memChefe.tem('principe')) { chefe.falando = false; iniciarChefe(); return; } // v24: quem já lutou não revê a cena de entrada
    const primeira = !F().principe_visto; F().principe_visto = true;
    const fala = () => D.abrir(arv('O Príncipe da Soberba', {
      a: { txt: primeira ? 'Subiu sozinho? Bom. Os outros sobem pisando, você sobe rezando, mas sobe. Todo mundo quer o alto. Eu também quis: «Subirei ao céu, acima das estrelas de Deus porei o meu trono» (Is 14,13). E aqui estou. Acima das nuvens.' : 'Voltou. Quem cai e volta é teimoso. Eu também sou.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: 'Quando ele se exaltar e subir no ar, ninguém o alcança com a espada. Ajoelhe-se: segure R. A luz cai sobre quem se faz alto, e levanta quem se faz pequeno. (A Soberba impede a oração: se ela pegar você, use água benta.)',
        depois: () => { chefe.falando = false; iniciarChefe(); } }
    }));
    const p = noTopo(0, -4);
    if (primeira && OV.cenas) OV.cenas.poema('principe', { pos: { x: p.x, z: p.z }, raio: 9, altura: 4 }, fala); else fala();
  }
  function iniciarChefe() {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1; chefe.exaltT = 8;
    const b = I.spawn('principe', !(OV.cenas && OV.cenas.trocar('principe')), noTopo(0, -5)); b.tag = 'principe'; chefe.b = b;
    A.bell(87, 0.35); J().shake(0.35);
  }
  function exaltar(e) {
    chefe.exalt = { t: F().graca_moises ? 6.8 : 5.4, raioT: 1.0 };
    ui.toast(P.status.soberba ? '«Subirei acima das nuvens!» O Príncipe se exalta. A Soberba impede você de se ajoelhar: água benta, depressa!' : '«Subirei acima das nuvens, serei semelhante ao Altíssimo!» O Príncipe se exalta: ajoelhe-se (segure R)!');
    A.bell(1046, 0.12); setTimeout(() => A.bell(1318, 0.1), 160);
  }
  function humilhar(e) {
    chefe.exalt = null; chefe.exaltT = intervalo(); chefe.humildade++;
    if (e.corpo) e.corpo.position.y = 0;
    const p = e.g.position, col = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 40, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.6, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    col.position.set(p.x, p.y + 20, p.z);
    C().efeito([col], 1.2, k => { col.material.opacity = 0.6 * (1 - k); });
    I.atordoar(e, 5, true); e.marca = 5; e.marcaF = 0.5;
    C().danoInimigo(e, Math.round(e.def.hp * 0.04), 0, 0);
    if (chefe.humildade <= 3) MS.ato('fe');
    J().shake(0.5); A.bell(523, 0.18); setTimeout(() => A.bell(784, 0.16), 220);
    ui.toast('«Quem se exalta será humilhado, e quem se humilha será exaltado» (Lc 14,11). A luz derruba o Príncipe!');
  }
  function gloria(e) {
    chefe.exalt = null; chefe.exaltT = intervalo(); chefe.gloria++;
    if (e.corpo) e.corpo.position.y = 0;
    e.hp = Math.min(e.def.hp, e.hp + e.def.hp * 0.05); e.flash = 0.3;
    const HB = OV.habilidades, d = HB ? HB.durStatus('soberba', 4) : 4; if (d > 0) P.status.soberba = Math.max(P.status.soberba || 0, d);
    ui.toast('Ninguém se ajoelhou. O Príncipe desce coberto de glória e se cura, e a Soberba pega você por um instante.'); A.bell(98, 0.2);
  }
  function reduzPrincipe() { return (chefe.exalt || chefe.cerco) ? 0.02 : 1; }
  function chamarCaidos() {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + 0.3, q = noTopo(Math.cos(a) * 7, Math.sin(a) * 7);
      const e = I.spawn(i === 3 ? 'sentinela' : 'caido', true, q, { nivel: 24 }); e.tag = 'principe_add'; e.mundo = false; e.def = Object.assign({}, e.def, { aggro: 30, leash: 40 });
    }
    ui.toast('Do braseiro sobem os caídos, os que o seguiram desde o princípio, e uma sentinela de pedra acorda.'); A.bell(147, 0.25); J().shake(0.3);
  }
  // as acusações: tudo o que o peregrino fez de errado, desde o Ato I
  function acusacoes() {
    const f = F(), r = [];
    if (f.tentacao === 'cedeu') r.push('Nos Portos do Festim, você comeu do banquete que era dos pobres.');
    if (f.pacto3 === 'cedeu') r.push('Nas Minas, você apertou a mão de Mamom. Eu vi.');
    if (f.oferta4 === 'cedeu') r.push('Na Corte das Máscaras, você se olhou no espelho e gostou do que viu.');
    if (f.oferta5 === 'cedeu') r.push('No Lago Partido, você quis o que era dos outros.');
    if (f.oferta6 === 'cedeu') r.push('No Campo das Cinzas, você deixou a raiva entrar.');
    if (f.oferta7 === 'cedeu') r.push('E agora mesmo, aqui, você quis ser como Deus.');
    if (r.length < 3) r.push('Você acha que fez tudo por amor? Fez para ser visto. Para que cantassem o seu nome nas sete terras.', 'Quantas vezes passou por um pobre sem parar? Eu contei. Eu conto tudo.', 'Acendeu seis lâmpadas e já se acha santo. Eu conheço os santos: nenhum se achava.');
    return r;
  }
  function caminho() {
    const f = F(), ofs = ['tentacao', 'pacto3', 'oferta4', 'oferta5', 'oferta6', 'oferta7'];
    if (f.confessou7 || f.pacto7) return 'ultima';
    const cedeu = ofs.filter(k => f[k] === 'cedeu').length, recusou = ofs.filter(k => f[k] === 'recusou').length;
    const sacr = Object.keys(f).filter(k => /^sacrificio_/.test(k) && f[k]).length;
    const secs = Object.keys(MS.MIS).filter(k => MS.MIS[k].tipo === 's' && MS.feita(k)).length;
    const v = P.pers.virt || {}, soma = Object.keys(v).reduce((a, k) => a + (v[k] || 0), 0);
    const pts = recusou * 2 - cedeu * 2 + sacr + Math.min(6, secs * 0.3) + (soma >= 70 ? 2 : soma >= 50 ? 1 : 0) + Math.min(2, (f.paciencia6 || 0) * 0.5);
    if (cedeu === 0 && pts >= 12) return 'santidade';
    if (cedeu <= 2 && pts >= 5) return 'fidelidade';
    return 'ultima';
  }
  A7.caminho = caminho;
  function oferta(b) {
    chefe.exalt = null; if (b.corpo) b.corpo.position.y = 0;
    D.abrir(arv('O Príncipe da Soberba', {
      a: { txt: 'Por que se ajoelhar? Olhe lá embaixo: as sete terras de Albária, as lâmpadas que você acendeu, uma por uma. Foi você. Não foi Deus: foi você. «Sereis como deuses» (Gn 3,5). Sente-se comigo no alto desta torre, e todos vão cantar o seu nome.', opc: [
        { t: '"Quis ut Deus? Quem é como Deus?"', ef: () => { F().oferta7 = 'recusou'; MS.ato('fe'); }, ir: 'r' },
        { t: 'Fui eu, sim... fui eu que acendi.', ef: () => { F().oferta7 = 'cedeu'; P.status.soberba = 30; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.15); }, ir: 'c' }] },
      r: { quem: '', txt: 'O Príncipe ri, e a risada não tem graça nenhuma. As asas se abrem, enormes, e a voz dele muda: agora é a voz de quem acusa num tribunal.', prox: 'z' },
      c: { quem: 'Anjo da Guarda', txt: 'Você disse «eu» onde devia dizer «Ele». Mas ainda não acabou: olhe, ele vai acusar você. Ele é o Acusador.', prox: 'z' },
      z: { quem: 'O Acusador', txt: () => acusacoes().slice(0, 2).join(' '), prox: 'y' },
      y: { quem: 'Anjo da Guarda', txt: 'Não discuta com ele: ele sabe tudo o que você fez, e mente sobre tudo o que você é. Resista até a noite passar. Ajoelhar-se encurta a noite. Quem julga é Outro, e Ele é misericordioso.', depois: () => iniciarCerco() }
    }));
  }
  function iniciarCerco() {
    F().fim7 = caminho();
    chefe.cerco = { t: F().oferta7 === 'cedeu' ? 34 : 24, ondaT: 1, acusT: 5, i: 2, rezou: false, lista: acusacoes() };
    ui.toast('A noite das acusações. Resista: ajoelhar-se (R) encurta a noite.');
  }
  function atualizarCerco(e, dt) {
    const c = chefe.cerco;
    c.t -= dt; c.ondaT -= dt; c.acusT -= dt;
    if (c.ondaT <= 0) {
      c.ondaT = 6;
      if (I.porTag('principe_add').filter(vivo).length < 6) for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, q = noTopo(Math.cos(a) * 7.5, Math.sin(a) * 7.5); const x = I.spawn(i === 2 ? 'soberbo' : 'caido', true, q, { nivel: 24 }); x.tag = 'principe_add'; x.mundo = false; x.def = Object.assign({}, x.def, { aggro: 30, leash: 40 }); }
    }
    if (c.acusT <= 0) { c.acusT = 6; ui.toast('O Acusador: «' + c.lista[c.i % c.lista.length] + '»'); c.i++; }
    if (P.praying && P.prayT >= 1.2) { if (!c.rezou) { c.rezou = true; c.t -= 4; ui.toast('A oração encurta a noite.'); A.bell(659, 0.1); } } else if (!P.praying) c.rezou = false;
    if (c.t <= 0) {
      chefe.cerco = null; chefe.falando = true;
      if (F().fim7 === 'ultima' && !F().confessou7 && !F().pacto7) pacto(e); else miguel(e);
    }
  }
  function pacto(e) {
    chefe.cerco = { t: 999, ondaT: 999, acusT: 999, i: 0, rezou: true, lista: [] }; // ele continua intocável enquanto fala
    D.abrir(arv('O Acusador', {
      a: { txt: 'Ninguém vem. Ninguém nunca vem. Você mesmo sabe o que fez, e eu sei melhor. Assine comigo, e eu calo tudo isto para sempre. Nunca mais ninguém vai acusar você. Nem você mesmo.', opc: [
        { t: '«Jesus, lembra-te de mim, quando entrares no teu Reino.» (Lc 23,42)', ef: () => { F().pacto7 = 'recusou'; MS.ato('esperanca'); }, ir: 'r' },
        { t: 'Calar tudo... sim. Eu assino.', ef: () => { F().pacto7 = 'aceitou'; }, ir: 'c' }] },
      r: { quem: '', txt: 'É a oração do bom ladrão, o que roubou o Céu na última hora. O Acusador recua um passo, como se a frase queimasse.', depois: () => miguel(e) },
      c: { quem: '', txt: 'Silêncio. As acusações param. E com elas, tudo: o vento, a voz do anjo, a luz da sarça lá embaixo.', depois: () => queda7() }
    }));
  }
  function miguel(e) {
    chefe.cerco = { t: 999, ondaT: 999, acusT: 999, i: 0, rezou: true, lista: [] };
    const m = M.figuras.miguel; if (m) { const q = noTopo(3, 1); m.mover(q.x, q.z, Math.atan2(e.g.position.x - q.x, e.g.position.z - q.z)); m.mostrar(true); }
    A.bell(784, 0.2); setTimeout(() => A.bell(1046, 0.2), 260); J().shake(0.4);
    D.falas([
      ['São Miguel Arcanjo', 'Quis ut Deus? Quem é como Deus?'],
      ['', 'Um clarão branco. A espada do arcanjo desce como um raio, e o Príncipe é precipitado do alto da torre, girando, até sumir nas nuvens lá embaixo. «Eu via Satanás cair do céu como um relâmpago» (Lc 10,18).'],
      ['São Miguel Arcanjo', '«Foi precipitado o acusador dos nossos irmãos, que os acusava dia e noite diante do nosso Deus. Eles o venceram pelo sangue do Cordeiro» (Ap 12,10-11). Levante-se. Ninguém acusa você mais: quem julga é o Cordeiro, e Ele já pagou.']
    ], () => {
      chefe.cerco = null; chefe.falando = false;
      I.lista.filter(x => x.tag === 'principe_add' && vivo(x)).forEach(x => { x.state = x.def.liberta ? 'liberto' : 'dead'; x.deadT = 0; x.t = 0; if (x.lab && x.lab.el) x.lab.el.style.display = 'none'; });
      if (vivo(e)) C().danoInimigo(e, e.hp + 10, 0, 0);
      setTimeout(() => { if (m) m.mostrar(false); }, 2500);
    });
  }
  function queda7() {
    const f = F();
    chefe.ativo = false; resetarChefe(); descer();
    if (st('a7m5')) st('a7m5').e = 0;
    J().salvar();
    setTimeout(() => {
      J().pausar(true);
      ui.fimAto(['A sétima lâmpada não se acendeu.', 'O Acusador calou as acusações, e junto com elas calou a sua voz.'], {
        eyebrow: 'Uma noite escura', titulo: 'A lâmpada apagada',
        texto: 'Você desceu a Torre sem lembrar de ter descido. Lá embaixo, a sarça continua ardendo, como se nada tivesse acontecido. Como se esperasse.',
        cite: 'Mas enquanto há vida, há volta: o filho pródigo também assinou o que não devia. Abba Efrém espera no Mosteiro da Sarça para ouvir a sua Confissão.'
      });
    }, 1200);
  }
  function iaPrincipe(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    if (e.asas) e.asas.forEach((a, i) => { a.rotation.y = (i < 3 ? 1 : -1) * (0.3 + Math.sin(e.ph * 1.4 + i) * 0.15); });
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) { chefe.fase = 2; chamarCaidos(); }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; oferta(e); }
    const alvoY = chefe.cerco ? 4 : chefe.exalt ? 6.5 : 0;
    if (e.corpo) e.corpo.position.y += (alvoY - e.corpo.position.y) * Math.min(1, dt * 3);
    if (e.aura) e.aura.visible = !!(chefe.exalt || chefe.cerco);
    if (D.aberto) return;
    if (chefe.cerco) { e.state = 'recover'; e.t = 0.3; atualizarCerco(e, dt); return; }
    if (chefe.exalt) {
      chefe.exalt.t -= dt; e.state = 'recover'; e.t = 0.3;
      // lá de cima, ele faz cair estrelas sobre o peregrino
      chefe.exalt.raioT -= dt;
      if (chefe.exalt.raioT <= 0) { chefe.exalt.raioT = 1.3; const x = P.pos.x + (Math.random() - 0.5) * 3, z = P.pos.z + (Math.random() - 0.5) * 3; I.marca(x, z, 1.5, 1.15, 0xffd27a); I.chuvas.push({ x, z, t: 1.15, dano: Math.round(e.def.dmg * 0.5), fonte: e, cor: 0xffd27a, status: null }); }
      if (P.praying && P.prayT >= precisa()) { humilhar(e); return; }
      if (chefe.exalt.t <= 0) gloria(e);
      return;
    }
    chefe.exaltT -= dt;
    if (chefe.exaltT <= 0 && e.state !== 'stun' && Math.hypot(P.pos.x - e.g.position.x, P.pos.z - e.g.position.z) < 20) exaltar(e);
  }
  function principeVencido() {
    chefe.ativo = false; chefe.final = true; F().principe_vencido = true; F().humildade7 = chefe.humildade;
    if (!F().fim7) F().fim7 = caminho();
    J().salvar();
    setTimeout(finalPrincipe, 1600);
  }
  function finalPrincipe() {
    D.abrir(arv('Anjo da Guarda', {
      a: { quem: '', txt: 'O braseiro de ouro se apaga. A Torre estremece de cima a baixo, mas não cai: fica ali, vazia, uma pilha de pedras empilhadas por quem queria um nome. Lá embaixo, entre as nuvens, aparece uma luz branca.', prox: 'b' },
      b: { txt: 'Olhe: a sarça. Ela está esperando. Desça, e vá ao mosteiro: Abba Efrém vai celebrar a Divina Liturgia, e a sétima lâmpada vai se acender.', ef: () => { MS.avancar('a7m5', 2); J().salvar(); }, depois: () => setTimeout(descer, 600) }
    }));
  }
  if (MS.missas) MS.missas.push({ nome: 'Igreja da Transfiguração', pronta: () => MS.ativa('a7m5') && MS.etapa('a7m5') === 2, iniciar: () => liturgia7() });
  function liturgia7() {
    const f = F();
    const linhas = [
      ['', 'A Igreja da Transfiguração está cheia: monges, pastores, peregrinos do Oriente, e gente que você nunca viu, que veio de longe porque ouviu dizer que a Torre se apagou.'],
      ['Abba Efrém, o abade', 'Bendito seja o Reino do Pai, e do Filho, e do Espírito Santo, agora e sempre, e pelos séculos dos séculos.'],
      ['', 'Amém. O coro dos monges canta em tons que sobem e descem como o caminho do monte. O incenso sobe direto, sem vento.'],
      ['Abba Efrém, o abade', '«Ele, que era de condição divina, não se apegou a ser igual a Deus, mas esvaziou-se a si mesmo, e se fez obediente até a morte, e morte de cruz. Por isso Deus o exaltou» (Fl 2,6-9). A soberba sobe pisando. O amor desce, e é por isso que sobe.']
    ];
    if (MS.feita('a7s3')) linhas.push(['Nemrod, o arquiteto', 'A pedra angular que eu trouxe está debaixo do altar. A única pedra da Torre que serviu para alguma coisa.']);
    if (MS.feita('a7s2')) linhas.push(['Irmão Sabas, o iconógrafo', 'O ícone voltou para a iconóstase. Cristo transfigurado, entre Moisés e Elias. A luz vem de dentro, como deve ser.']);
    if (MS.feita('a7s1')) linhas.push(['Rebeca, a pastora', `A ovelhinha que você trouxe nos ombros pariu ontem. Davi quer dar ao cordeiro o nome ${g('do padrinho', 'da madrinha')}.`]);
    linhas.push(['', 'No fim, todos saem em procissão até o pátio. A sarça, que ardia vermelha, começa a arder branca, e a luz alcança o deserto inteiro, até o cume, até a Torre vazia: a Lâmpada da Humildade.']);
    ui.clarao('#000000');
    MS.missaDentro('Igreja da Transfiguração', 'abbaEfrem', linhas, () => {
      f.ato7_fim = true; MS.concluir('a7m5', f.fim7 || caminho());
      R.acenderLampada(true);
      [0, 500, 1000, 1500, 2000, 2500, 3000].forEach((t, i) => setTimeout(() => A.bell([262, 294, 330, 349, 392, 440, 523][i], 0.3), t));
      setTimeout(() => { J().pausar(true); fimPeregrinacao(); }, 3400);
    });
  }
  function fimPeregrinacao() {
    const f = F(), fim = f.fim7 || caminho();
    const linhas = ['As sete lâmpadas de Albária ardem de novo: Diligência, Temperança, Generosidade, Castidade, Benevolência, Paciência e Humildade.'];
    linhas.push('Desceram do Céu para ajudar: Santo Antão, São Nicolau, São Lourenço, Santo Agostinho, São João Batista, São Martinho, Moisés e São Miguel Arcanjo.');
    if (MS.feita('s2')) linhas.push('Anos depois, Joaquim, o menino do pão roubado, foi ordenado padre na igreja de Santa Sabina. Na primeira Missa, contou a história do pão.');
    if (f.crisma7) linhas.push(`Davi, o pastorzinho de quem você foi ${g('padrinho', 'madrinha')} de Crisma, guarda até hoje o cordeiro com o seu nome.`);
    if (f.oferta7 === 'recusou') linhas.push('No alto da Torre, você respondeu com o nome do arcanjo: Quem é como Deus?');
    if ((f.humildade7 || 0) >= 2) linhas.push('Diante do Príncipe, você se ajoelhou, e a luz desceu.');
    if (f.confessou7) linhas.push('Você caiu, e voltou pela porta da Confissão. O Pai correu ao seu encontro.');
    const CFG = {
      santidade: { titulo: 'Santidade', texto: 'Você subiu o monte descalço, e desceu sem querer nada para si. Por onde passou, deixou lâmpadas acesas e ninguém precisou saber o seu nome. «Bem-aventurados os pobres em espírito, porque deles é o Reino dos Céus» (Mt 5,3).' },
      fidelidade: { titulo: 'O Servo Fiel', texto: 'Você caiu e se levantou, e não largou o caminho. Não foi perfeito: foi fiel. «Muito bem, servo bom e fiel: foste fiel no pouco, eu te confiarei muito. Entra na alegria do teu Senhor» (Mt 25,21).' },
      ultima: { titulo: 'O Operário da Última Hora', texto: 'O dono da vinha pagou o mesmo denário a quem chegou ao fim da tarde. E na cruz, um ladrão roubou o Céu com uma frase. «Hoje estarás comigo no Paraíso» (Lc 23,43). A misericórdia sempre chega antes de nós.' }
    }[fim] || { titulo: 'O Servo Fiel', texto: '' };
    ui.fimAto(linhas, { eyebrow: 'Fim da Peregrinação', titulo: CFG.titulo, texto: CFG.texto, cite: 'A peregrinação por Albária terminou. O caminho para o Céu, não: ele continua amanhã de manhã, na primeira oração do dia. Ite, missa est.' });
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"Eu subia pisando nos outros... e nem olhava para baixo."', '"Que vergonha. Eu queria chegar primeiro, só isso."', '"Quem sou eu? Achei que sabia."', '"Pode passar na frente. Eu espero."', '"Eu gritava para Deus me ouvir. Ele estava falando baixinho."', '"Que leveza, não precisar ser o maior."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && naRegiao()) {
      if (MS.ativa('a7m1') && MS.etapa('a7m1') === 0) {
        MS.avancar('a7m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'O Monte Santo. Lá embaixo, o mosteiro guarda a sarça que arde sem se consumir. Lá em cima, uma torre que alguém ergueu para chegar ao céu sozinho. É a Soberba, a mãe de todos os vícios: querer ser como Deus sem Deus. Procure Abba Efrém, no mosteiro.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'sarca' && MS.ativa('a7m1') && MS.etapa('a7m1') === 2) { concluirA7m1(); return false; }
    if (tipo === 'oratorio' && R.DEGRAUS.some(d => d.id === x) && MS.ativa('a7m3')) {
      const n = degraus();
      if (n >= 3) { MS.concluir('a7m3'); setTimeout(() => { D.falas([['Anjo da Guarda', 'Os três degraus: renúncia, obediência, humildade. Agora o cume. Lá em cima, alguém tirou as sandálias antes de você.']]); MS.iniciar('a7m4'); }, 1400); }
      else setTimeout(() => ui.toast(`A Escada: ${n}/3 degraus.`), 1200);
      return false;
    }
    if (tipo === 'liberto' && x.def.key === 'soberbo') {
      x.sumir = true;
      if (x.tag === 'soberbos7') {
        f.soberbos7 = f.soberbos7 || [];
        if (!f.soberbos7.includes(x.bi)) f.soberbos7.push(x.bi);
        ui.toast(FRASES[(f.soberbos7.length - 1) % FRASES.length]);
        if (f.soberbos7.length >= 6) {
          MS.ato('caridade');
          if (MS.ativa('a7m2')) MS.avancar('a7m2', 1);
          setTimeout(() => D.falas([['Anjo da Guarda', 'Os seis estão livres. Um deles ajudou o outro a descer, de mão dada. Volte a Abba Efrém.']]), 1600);
        }
      } else ui.toast('O peregrino libertado tira a coroa de papel e desce o monte devagar.');
      J().salvar(); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'principe') { principeVencido(); return true; }
    if (tipo === 'renascer') {
      if (vg.ativa) { vg.ativa = false; if (st('a7m4')) st('a7m4').e = 0; MS.tagRemove('vigilia7'); M.figuras.moises.mostrar(false); ui.toast('A vigília foi interrompida. Volte ao cume quando estiver pronto.'); }
      if (A7.noAlto || chefe.ativo || chefe.b) { resetarChefe(); irAoChao(); }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  MS.ganchos.update.push(dt => {
    atualizarVigilia(dt);
    if (!A7.noAlto || chefe.ativo || chefe.falando || P.dead || D.aberto) return;
    if (MS.ativa('a7m5') && MS.etapa('a7m5') === 1) {
      if (F().principe_vencido) { if (!chefe.final) { chefe.final = true; finalPrincipe(); } return; }
      desafiar();
    }
  });

  /* ================= DIÁLOGOS ================= */
  ARV.abbaEfrem = () => {
    const f = F(), q = 'Abba Efrém, o abade';
    if (f.pacto7 === 'aceitou' && !f.confessou7) return arv(q, {
      a: { txt: 'Você voltou. Está com a cara de quem assinou alguma coisa que não devia. Não precisa me contar lá fora: venha, ajoelhe-se aqui, atrás da iconóstase.', opc: [{ t: 'Confessar-se.', ir: 'b' }, { t: 'Agora não.' }] },
      b: { quem: '', txt: 'Você conta tudo. O Abba escuta de olhos fechados, com a mão na estola. Não interrompe nenhuma vez. No fim, fica um tempo em silêncio.', prox: 'c' },
      c: { txt: '«O pai o viu de longe, encheu-se de compaixão, correu, lançou-se ao seu pescoço e o beijou» (Lc 15,20). Deus não assina pactos com o Acusador: rasga-os. Eu te absolvo dos teus pecados, em nome do Pai, e do Filho, e do Espírito Santo.', prox: 'd' },
      d: { quem: '', txt: 'Amém. Algo que estava calado volta a falar dentro de você. Lá fora, a sarça arde como antes.', prox: 'e' },
      e: { txt: 'Agora suba de novo. Desta vez você não vai precisar de nenhum pacto: o Acusador não tem mais o que dizer de um pecado perdoado.', ef: () => { f.confessou7 = true; f.pacto7 = null; f.fim7 = null; if (st('a7m5')) st('a7m5').e = 0; J().salvar(); } }
    });
    if (MS.ativa('a7m1') && MS.etapa('a7m1') <= 1) return arv(q, {
      a: { txt: () => `Bem-vindo ao deserto, ${g('meu filho', 'minha filha')}. Aqui ninguém pergunta de onde você vem: pergunta para onde vai. Sou Efrém, o abade, o último de uma fila de abades que começa com São João Clímaco, o da Escada.`, prox: 'b' },
      b: { txt: 'A sarça do pátio arde desde Moisés, dizem. Eu não sei se é verdade. Sei que nunca vi ela se apagar. Mas lá em cima, atrás do cume, alguém ergueu uma torre negra. Chama-se Nemrod, o arquiteto, e construiu para um príncipe que não diz o nome.', opc: [
        { t: 'E os peregrinos?', ir: 'c' }, { t: 'O que posso fazer?', ir: 'd' }] },
      c: { txt: 'Sobem o monte pisando uns nos outros, possuídos pela soberba: querem chegar primeiro à Torre. Derrubam os velhos, empurram as crianças. E quando chegam lá em cima, não encontram nada.', prox: 'd' },
      d: { txt: 'Acenda primeiro a vela do Oratório da Sarça, aqui no pátio. Depois liberte os peregrinos soberbos, no começo da subida, ao norte do mosteiro. Mas não os humilhe: liberte-os. Humilhar é outra soberba.',
        ef: () => { MS.avancar('a7m1', 2); if (prog().oratorios.sarca) concluirA7m1(); } }
    });
    if (MS.ativa('a7m1')) return linha(q, 'O Oratório fica no pátio, à direita da sarça.');
    if (MS.ativa('a7m2') && MS.etapa('a7m2') === 1) return arv(q, {
      a: { txt: 'Seis libertados, e nenhum humilhado. Os monges os estão recebendo no refeitório. Um deles pediu para lavar os pés dos outros.', prox: 'b' },
      b: { txt: 'E veja quem chegou: Dom Atanásio, o bispo. Amanhã ele crisma os pastorzinhos, e o Davi, filho da Rebeca, pediu por você. Fique para a Crisma. Depois, suba a Escada.',
        ef: () => { MS.concluir('a7m2'); }, depois: () => crisma7(() => setTimeout(() => MS.iniciar('a7m3'), 600)) }
    });
    if (MS.ativa('a7m2')) return linha(q, () => `Os soberbos estão no começo da subida, ao norte do mosteiro (${livres()}/6).`);
    if (MS.ativa('a7m3')) return linha(q, () => `A Escada tem três degraus, três oratórios no caminho do monte (${degraus()}/3). Acenda um de cada vez. Quem pula degraus cai.`);
    if (MS.ativa('a7m4')) return linha(q, 'No cume, tire as sandálias. Moisés tirou, e ele tinha mais motivos que nós para ficar calçado.');
    if (MS.ativa('a7m5') && MS.etapa('a7m5') < 2) return linha(q, 'A Torre fica atrás do cume. Quando ele se exaltar, ajoelhe-se. Eu fico aqui rezando o ofício da noite.');
    if (MS.ativa('a7m5')) return linha(q, 'Entre: a Divina Liturgia vai começar. Hoje o deserto inteiro vem à igreja.');
    if (f.ato7_fim) return linha(q, 'A sarça arde branca agora. Os monges mais velhos dizem que nunca a viram assim. Eu digo que é a mesma sarça: somos nós que vemos melhor.');
    return linha(q, 'Que a luz do Tabor ilumine o seu caminho.');
  };
  ARV.bispo = () => linha('Dom Atanásio, o bispo', 'Que o Espírito Santo, o Dom de Deus, fortaleça você no caminho.');
  ARV.davizinho = () => linha('Davi, o pastorzinho', () => F().crisma7 ? 'O bispo disse que agora eu sou soldado de Cristo. Mas sem espada, igual a São Martinho. A minha mãe contou essa história.' : 'Eu vou ser crismado quando o bispo vier! A minha mãe disse que vai ser no mosteiro, na frente da sarça.');
  ARV.moises = () => linha('Moisés', 'Eu estarei contigo, disse Ele. Não eu: Ele.');
  ARV.miguel = () => linha('São Miguel Arcanjo', 'Quis ut Deus?');
  R.MORADORES.forEach(([x, z, r, op, a, b]) => {
    M.criarFigura(x + R.OX, z + R.OZ, r, op);
    let k = 0; ARV[op.id] = () => linha(op.nome, F().ato7_fim ? 'A sarça arde branca agora. De noite, dá para ler à luz dela.' : (k++ % 2) ? b : a);
  });
  if (OV.vida) {
    Object.assign(OV.vida.PASSEIO, { mor_monte1: 4, mor_monte2: 5 });
    Object.assign(OV.vida.SINAL, {
      abbaEfrem: () => ((MS.ativa('a7m1') && MS.etapa('a7m1') <= 1) || (MS.ativa('a7m2') && MS.etapa('a7m2') === 1) || (F().pacto7 === 'aceitou' && !F().confessou7)) ? '?' : null
    });
    OV.vida.santosLuz.push('moises', 'miguel');
  }
  if (IT) { IT.SACERDOTES.abbaEfrem = 'Abba Efrém'; IT.criarCapela(R.CAPELA.x + R.OX, R.CAPELA.z + R.OZ, Math.atan2(-R.CAPELA.x, 128 - R.CAPELA.z) + Math.PI / 2, 'Capela do Peregrino (Monte Santo)'); }

  /* ================= OS ITENS DO ATO VII ================= */
  Object.assign(OV.ITENS, {
    varaMoises: { nome: 'Cajado de Moisés', slot: 'santo', descr: '+20 de Fé máxima, e a Soberba dura metade do tempo em você.', mods: { fe: 20, meio: ['soberba'] } }
  });
  if (IT.HAGIO) Object.assign(IT.HAGIO, {
    varaMoises: 'Com o cajado de pastor, Moisés abriu o mar e tirou água da rocha. Mas, na batalha de Refidim, venceu só de braços erguidos, rezando, com Aarão e Hur segurando as suas mãos (Ex 17,11-12).'
  });

  /* ================= MOISÉS E SÃO MIGUEL, COMO A IGREJA OS RETRATA ================= */
  if (OV.modeloSanto) {
    // Moisés: túnica clara, manto escuro, barba branca, o rosto que brilha e as tábuas da Lei
    OV.modeloSanto.moises = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a2a14); m.emissiveIntensity = 0.6; return m; };
      const tunica = bri(sm(0xd8ccb0)), manto = bri(sm(0x5a2a1a)), carne = bri(sm(0xd8b498)), branco = bri(sm(0xecece4)), pedra = bri(sm(0xc8c0b0));
      gr.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.45, 8), tunica, 0, 0.95, 0));
      const mt = mesh(new THREE.CylinderGeometry(0.42, 0.56, 1.3, 8, 1, true), manto, 0, 1.2, -0.04); gr.add(mt);
      gr.add(mesh(new THREE.BoxGeometry(0.66, 0.55, 0.42), tunica, 0, 1.66, 0));
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), carne, 0, 2.02, 0.03));
      gr.add(mesh(new THREE.BoxGeometry(0.3, 0.46, 0.14), branco, 0, 1.8, 0.13));
      gr.add(mesh(new THREE.BoxGeometry(0.42, 0.2, 0.38), branco, 0, 2.15, -0.04));
      // os dois raios de luz na testa, como a arte antiga mostrava o rosto que brilhava (Ex 34,29)
      [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xffe6a8 })); r.position.set(0.08 * s, 2.3, 0.04); r.rotation.z = -s * 0.3; gr.add(r); });
      const tb = new THREE.Group(); tb.position.set(-0.36, 1.35, 0.3); gr.add(tb);
      [-0.11, 0.11].forEach(x => { tb.add(mesh(new THREE.BoxGeometry(0.2, 0.42, 0.05), pedra, x, 0, 0)); });
      const cj = new THREE.Group(); cj.position.set(0.44, 0, 0.12); gr.add(cj); cj.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.2, 6), bri(sm(0x6a4a2a)), 0, 1.1, 0));
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.42, -0.1); gr.add(h);
    };
    // São Miguel Arcanjo: armadura, asas brancas, a espada e a balança
    OV.modeloSanto.miguel = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a3020); m.emissiveIntensity = 0.7; return m; };
      const arm = bri(sm(0xd8dce4, { metalness: 0.6, roughness: 0.3 })), manto = bri(sm(0x9a1a1a)), carne = bri(sm(0xe8c8a8)), cabelo = bri(sm(0xc89a4a)), ouroM = bri(sm(0xd8b048, { metalness: 0.7 }));
      const asa = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
      gr.add(mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.3, 8), arm, 0, 0.9, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.7, 0.62, 0.42), arm, 0, 1.64, 0));
      const mt = mesh(new THREE.BoxGeometry(0.7, 1.3, 0.1), manto, 0, 1.25, -0.26); gr.add(mt);
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), carne, 0, 2.04, 0.03)); gr.add(mesh(new THREE.BoxGeometry(0.4, 0.26, 0.36), cabelo, 0, 2.14, -0.04));
      [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.9), asa); w.position.set(0.6 * s, 1.9, -0.36); w.rotation.y = s * 0.5; gr.add(w); });
      const esp = new THREE.Group(); esp.position.set(0.46, 1.5, 0.2); esp.rotation.z = -0.25; gr.add(esp);
      esp.add(mesh(new THREE.BoxGeometry(0.07, 1.3, 0.03), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }), 0, 0.7, 0)); esp.add(mesh(new THREE.BoxGeometry(0.3, 0.06, 0.06), ouroM, 0, 0.05, 0));
      const bal = new THREE.Group(); bal.position.set(-0.46, 1.3, 0.25); gr.add(bal);
      bal.add(mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), ouroM, 0, 0.3, 0)); [-0.22, 0.22].forEach(x => bal.add(mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.04, 8), ouroM, x, 0.05, 0)));
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.42, -0.1); gr.add(h);
    };
    if (OV.vida) { OV.vida.vestirSanto('moises', 'moises'); OV.vida.vestirSanto('miguel', 'miguel'); }
  }

  /* ================= AS CARTAS DO ATO VII ================= */
  OV.cartasExtra = Object.assign(OV.cartasExtra || {}, {
    a7m1: ['De Abba Efrém', 'Paz a quem atravessar o deserto. Aqui no Mosteiro da Sarça rezamos há mil anos ao pé do monte. Há pouco tempo, uma torre negra cresceu atrás do cume, e os peregrinos sobem pisando uns nos outros. Venha.'],
    a7m2: ['Do diário do peregrino', 'No começo da subida, peregrinos possuídos pela soberba empurram os velhos e as crianças para chegar primeiro à Torre. É preciso libertá-los sem humilhá-los: humilhar é outra soberba.'],
    a7m3: ['Do diário do peregrino', 'São João Clímaco, que foi abade aqui, escreveu a Escada do Paraíso: trinta degraus de virtude. O caminho do monte tem três oratórios, um em cada degrau: renúncia, obediência, humildade.'],
    a7m4: ['Do diário do peregrino', 'No cume, Moisés tirou as sandálias. Antes da Torre, é preciso subir até lá e rezar descalço.'],
    a7m5: ['Do diário do peregrino', 'A Torre negra fica atrás do cume. Lá em cima, acima das nuvens, espera o Príncipe da Soberba, cujo nome é melhor não escrever.'],
    a7s1: ['De Rebeca, a pastora', 'Uma ovelhinha se perdeu nas pedras do monte, a oeste da subida. Eu tenho noventa e nove, mas é dela que eu sinto falta.'],
    a7s2: ['Do Irmão Sabas', 'Os soberbos levaram o ícone da Transfiguração que eu pintava, para pendurar na Torre com outro rosto. Está largado nas pedras, a leste da subida.'],
    a7s3: ['De Nemrod, o arquiteto', 'Fui eu que ergui a Torre. Agora vejo o que construí. Há uma pedra que eu rejeitei por ser simples demais: leve-a ao Abba Efrém.']
  });

  /* ================= O POEMA DO PRÍNCIPE ================= */
  if (OV.cenas && OV.cenas.POEMAS) Object.assign(OV.cenas.POEMAS, {
    principe: ['O Príncipe da Soberba', [
      'Eu era a estrela da manhã, o mais belo,\no primeiro a ver a luz, o último a se curvar.\nDisseram-me: serve. Eu disse: não. E o selo\nque eu mesmo quebrei, ninguém pôde colar.',
      'Ergui esta torre com o orgulho dos homens,\ncada pedra um nome, cada nome um degrau.\nSobe comigo: aqui em cima os deuses comem,\ne ninguém se ajoelha diante do bem ou do mal.']]
  });

  /* ================= AS MISSÕES DO MONTE (Aventuras) ================= */
  if (AV && AV.ajuda) {
    const aj = AV.ajuda, ACH = M.AVENTURA.ACHADOS;
    AV.MODELOS.icone = () => { const g = new THREE.Group(); const p = mesh(new THREE.BoxGeometry(0.6, 0.8, 0.05), sm(0xd8b048, { metalness: 0.5 }), 0, 0.5, 0); p.rotation.x = -1.2; g.add(p); const f = mesh(new THREE.BoxGeometry(0.46, 0.64, 0.02), sm(0x2a4a7a), 0, 0.53, 0.02); f.rotation.x = -1.2; g.add(f); return g; };
    AV.PROPS.icone = () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.34, 0.46, 0.04), sm(0xd8b048, { metalness: 0.5 }), 0, 0, 0)); g.add(mesh(new THREE.BoxGeometry(0.26, 0.36, 0.02), sm(0x2a4a7a), 0, 0, 0.025)); return g; };
    AV.PROPS.pedra = () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.42, 0.3, 0.3), sm(0xc8b89a, { roughness: 1 }), 0, 0, 0)); return g; };
    // ---- Rebeca e a ovelha perdida (Lc 15,4-7)
    const colOvelha = { id: 'm7_ovelha', missao: 'a7s1', etapa: 0, pontos: ACH.ovelha, modelo: 'cordeiro', nome: 'Ovelha perdida', texto: 'Pôr a ovelha nos ombros', carga: 'cordeiro',
      guarda: [[['bode', 23], ['bode', 23], ['caido', 23]]] };
    AV.coleta(colOvelha);
    AV.missao({ id: 'a7s1', ato: 7, nome: 'A Ovelha Perdida', npc: 'rebeca', xp: 260, den: 50, itens: [['pao', 2], ['agua', 1]], requer: () => MS.feita('a7m1'),
      etapas: ['Encontre a ovelha perdida nas pedras do monte, a oeste da subida.', 'Leve a ovelha de volta ao curral de Rebeca, junto às tendas.'],
      alvos: [aj.proximo(colOvelha), aj.ondeFig('rebeca')],
      convite: 'Tenho cem ovelhas. Quer dizer, tinha: uma se perdeu nas pedras do monte, uma pequena, que manca. Os bodes bravos rondam por lá. Os outros pastores dizem que noventa e nove está bom. Não está.',
      aceitar: 'Eu vou buscá-la.', aceito: 'A oeste da subida, entre as pedras grandes. Ela vai estar assustada: ponha nos ombros, que é assim que se carrega quem não consegue andar.',
      lembrete: 'A ovelha está nas pedras do monte, a oeste da subida.',
      agradece: 'A minha pequena! Nos seus ombros, como o Bom Pastor. Venha, vamos pô-la no curral.',
      entrega: { acao: 'curral', prop: 'cordeiro', alvo: () => { const p = W(R.CURRAL.x, R.CURRAL.z); return { x: p.x, y: H(p.x, p.z) + 0.5, z: p.z }; }, falas: [['Rebeca, a pastora', '«Haverá mais alegria no Céu por um pecador que se converte do que por noventa e nove justos.» Eu nunca entendi a conta. Agora entendo. Tome, para a estrada.']] },
      depois: 'A pequena não manca mais. Quer dizer, manca, mas não se afasta.' });
    AV.carga('cordeiro', () => MS.ativa('a7s1') && MS.etapa('a7s1') === 1, 'a7s1');
    // ---- o ícone do Irmão Sabas
    const colIcone = { id: 'm7_icone', missao: 'a7s2', etapa: 0, pontos: ACH.icone, modelo: 'icone', nome: 'Ícone da Transfiguração', texto: 'Recolher o ícone', carga: 'icone',
      guarda: [[['soberbo', 24], ['caido', 24], ['caido', 24]]] };
    AV.coleta(colIcone);
    AV.missao({ id: 'a7s2', ato: 7, nome: 'O Ícone de Sabas', npc: 'sabas', xp: 260, den: 70, itens: [['vela', 2]], requer: () => MS.feita('a7m1'),
      etapas: ['Encontre o ícone da Transfiguração, largado nas pedras a leste da subida.', 'Leve o ícone ao Irmão Sabas, para a iconóstase.'],
      alvos: [aj.proximo(colIcone), aj.ondeFig('sabas')],
      convite: 'Eu pintava o ícone da Transfiguração: Cristo no monte, entre Moisés e Elias, a luz vindo de dentro. Os soberbos o levaram. Queriam pintar outro rosto por cima e pendurar na Torre. Ouvi dizer que desistiram no meio do caminho: ícone pesa.',
      aceitar: 'Eu trago o ícone.', aceito: 'A leste da subida, nas pedras. Não olhe muito para ele no caminho: ícone não é para ser admirado, é para ser rezado.',
      lembrete: 'O ícone está nas pedras, a leste da subida.',
      agradece: 'Inteiro! Nem um arranhão no rosto de Cristo. Venha, vamos pendurá-lo.',
      entrega: { acao: 'pendurar', prop: 'icone', alvo: () => R.ICONOSTASE(), falas: [['Irmão Sabas, o iconógrafo', 'Sabe por que nos ícones não há sombra? Porque a luz vem de dentro dos santos, não de fora. É a luz do Tabor. Tome estas velas: acenda uma diante dele quando passar por aqui.']] },
      depois: 'Rezei diante do ícone a noite toda. Ele me olhou de volta, como sempre.' });
    AV.carga('icone', () => MS.ativa('a7s2') && MS.etapa('a7s2') === 1, 'a7s2');
    // ---- Nemrod e a pedra angular (Sl 118,22)
    AV.missao({ id: 'a7s3', ato: 7, nome: 'A Pedra Angular', npc: 'nemrod', receptor: 'abbaEfrem', xp: 280, den: 80, itens: [['tercoPeregrino', 1]], requer: () => MS.feita('a7m2'),
      etapas: ['Leve a pedra que Nemrod rejeitou a Abba Efrém, no mosteiro.'],
      alvos: [aj.ondeFig('abbaEfrem')],
      convite: 'Fui eu que ergui a Torre. Cada pedra tinha o nome de quem pagou por ela. Esta aqui eu rejeitei: simples demais, sem nome, sem lugar. Ficou na pedreira. Agora, olhando a Torre lá em cima, eu entendo menos ainda o que construí, e mais esta pedra.',
      aceitar: 'Eu levo a pedra ao mosteiro.', aceito: 'Leve ao Abba Efrém. Diga a ele que Nemrod quer pôr uma pedra numa coisa que sirva para alguma coisa. Pela primeira vez.',
      lembrete: 'A pedra vai para Abba Efrém, no Mosteiro da Sarça.',
      agradece: 'Uma pedra? De Nemrod? «A pedra que os construtores rejeitaram tornou-se a pedra angular» (Sl 118,22).',
      entrega: { acao: 'dar', prop: 'pedra', falas: [['Abba Efrém, o abade', 'Vamos pô-la debaixo do altar. Diga a Nemrod que venha à Liturgia: aqui ninguém pergunta o nome de quem constrói. Tome este terço, foi de um peregrino que subiu antes de você.']] },
      aoConcluir: () => { F().nemrod = true; },
      depois: 'Nemrod diz que vai desmontar a Torre, pedra por pedra, e fazer casas para os pastores. Vai levar uns vinte anos. Ele diz que tem tempo.' });
    AV.carga('pedra', () => MS.ativa('a7s3') && MS.etapa('a7s3') === 0, 'a7s3');
    ARV.nemrod = () => linha('Nemrod, o arquiteto', F().ato7_fim ? 'Desmontar dá mais trabalho que construir. Mas é um trabalho que dá sono bom.' : 'Eles me pagavam por andar. Cada andar, um nome. Quanto mais alto, mais caro. Não perguntei para quê.');
    ARV.rebeca = () => linha('Rebeca, a pastora', F().crisma7 ? 'O Davi não para de falar da Crisma. Diz que agora tem um dom chamado Fortaleza, e que vai usar para carregar as ovelhas mais pesadas.' : 'O meu Davi vai ser crismado quando o bispo vier. Ele está mais nervoso do que no dia em que um lobo apareceu no curral.');
    ARV.sabas = () => linha('Irmão Sabas, o iconógrafo', 'Antes de pintar um rosto, eu jejuo três dias. O pincel tem que estar com fome de Deus.');
    AV.ligarNpcs();
  }
})(window.OV);

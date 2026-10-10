/* Ordo Virtutum — Ato III: as Minas de Mamom. Missões, vícios da avareza, São Lourenço, Mamom e a Lâmpada da Generosidade */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.minas) return;
  const MS = OV.missoes, R = OV.minas, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, H = OV.habilidades, T = OV.tempo, IT = OV.itens;
  const sm = OV.sm, mesh = OV.mesh;
  const A3 = {}; OV.ato3 = A3;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, res, g, linha, denarios, ARV } = MS;
  const W = R.W;
  const C = () => OV.combate;
  const den = () => (P.pers.denarios || 0);
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const naRegiao = () => M.regiao(P.pos.x, P.pos.z) === 'minas';
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  M.spawnsMundo.push(...R.spawnsMundo);

  /* ================= MISSÕES DO ATO III ================= */
  const BOCA = [[-74, -10], [-80, -6], [-86, -12], [-72, -18], [-82, -20]];
  const livres = () => (F().mineiros || []).length;
  Object.assign(MS.MIS, {
    a3m1: { ato: 3, nome: 'A Estrada da Serra', tipo: 'p', xp: 90, etapas: ['Siga para as Minas de Mamom pela placa da estrada (no fim da estrada sul do vale ou na entrada dos Portos do Festim).', 'Procure o padre de Valdouro, dentro da Igreja de São Lourenço, a noroeste da praça.', 'Acenda a vela do Oratório de Valdouro, na praça.'] },
    a3m2: { ato: 3, nome: 'A Boca da Mina', tipo: 'p', xp: 200, etapas: [() => `Liberte os mineiros possuídos na Boca da Mina, a oeste da cidade (${livres()}/5).`, 'Volte a Padre Elias.'] },
    a3m3: { ato: 3, nome: 'O Salário dos Mineiros', tipo: 'p', xp: 220, etapas: ['Procure o livro-razão no Escritório da Mina, ao lado da Boca da Mina.', 'Confronte Mestre Fúlvio na Casa de Contas, ao norte da praça.', 'Conte a Padre Elias o que aconteceu.'] },
    a3m4: { ato: 3, nome: 'O Diácono de Roma', tipo: 'p', xp: 220, etapas: ['Suba à Capela de Santa Bárbara, no pico a leste da cidade, e reze diante dela.', 'Proteja a partilha: resista ao ataque dos Escaravelhos de Ouro.'] },
    a3m5: { ato: 3, nome: 'Mamom', tipo: 'p', xp: 500, etapas: ['Abra o Cofre Grande, à beira da Grande Cava, com a chave de Mestre Fúlvio.', 'Desça ao fundo da Grande Cava.', 'Vença Mamom. Quebre os cofres que o protegem.', 'Vá à Igreja de São Lourenço para a Missa.'] },
    a3s1: { ato: 3, nome: 'A Lamparina de Tomás', tipo: 's', xp: 120, etapas: ['Procure os pertences de Tomás na Galeria Velha, a noroeste da Boca da Mina.', 'Leve a lamparina e o terço de Tomás à Viúva Rosa.'] },
    a3s2: { ato: 3, nome: 'Pão para a Mina', tipo: 's', xp: 100, etapas: [() => `Leve 3 pães abençoados a Brás, no Acampamento dos Mineiros (você tem ${IT.qtd('pao')}). Joana, a padeira, vende pão na praça.`] },
    a3s3: { ato: 3, nome: 'O Peso no Bolso', tipo: 's', xp: 90, etapas: ['As moedas de olhos de ouro atraem os Escaravelhos. Entregue-as a Padre Elias.'] }
  });
  MS.aposAto2 = () => setTimeout(() => { if (!st('a3m1')) MS.iniciar('a3m1'); setTimeout(() => ui.toast('A estrada da serra para as Minas de Mamom está aberta: siga pelas placas das estradas.'), 1600); }, 400);
  function concluirA3m1() { MS.concluir('a3m1'); setTimeout(() => { MS.iniciar('a3m2'); if (livres() >= 5) MS.avancar('a3m2', 1); }, 1500); }

  /* ================= OS VÍCIOS DA AVAREZA ================= */
  function makeMineiro() {
    const b = OV.makePossesso(0x3a3024, false)();
    const capacete = sm(0x6a5a2a, { metalness: 0.4, roughness: 0.6 });
    b.g.add(mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.14, 10), capacete, 0, 2.22, 0.02));
    b.g.add(mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0xffd060 }), 0, 2.24, 0.25));
    const cabo = mesh(new THREE.BoxGeometry(0.07, 0.95, 0.07), sm(0x4a3422), 0, -0.9, 0.12); b.armR.add(cabo);
    const pico = mesh(new THREE.BoxGeometry(0.62, 0.08, 0.08), sm(0x3a3a3e, { metalness: 0.6 }), 0, -1.36, 0.12); b.armR.add(pico);
    return b;
  }
  function makeEscaravelho() {
    const g = new THREE.Group();
    const casca = sm(0xb08a2a, { metalness: 0.85, roughness: 0.3, emissive: 0x2a1a00 }), escuro = sm(0x1a140c);
    const eye = new THREE.MeshBasicMaterial({ color: 0xff4a1a });
    const c = mesh(new THREE.SphereGeometry(0.42, 9, 7), casca, 0, 0.42, 0); c.scale.set(1, 0.6, 1.3); g.add(c);
    g.add(mesh(new THREE.BoxGeometry(0.04, 0.3, 0.9), escuro, 0, 0.62, 0));
    g.add(mesh(new THREE.SphereGeometry(0.2, 7, 6), escuro, 0, 0.4, 0.55));
    const ch = mesh(new THREE.ConeGeometry(0.06, 0.34, 5), casca, 0, 0.55, 0.78); ch.rotation.x = 1.1; g.add(ch);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.1 * s, 0.46, 0.72); g.add(e); });
    const pernas = [];
    [-0.3, 0, 0.3].forEach(z => [-1, 1].forEach(s => { const p = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.04), escuro, 0.38 * s, 0.24, z); p.rotation.z = 0.4 * s; g.add(p); pernas.push(p); }));
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [casca], eye, eyeBase: 0xff4a1a, patas6: pernas, passada: 0.3 };
  }
  function makeGolem() {
    const g = new THREE.Group();
    const pedra = sm(0x5a5248, { emissive: 0x0a0806 }), veio = sm(0xc9a24a, { metalness: 0.8, roughness: 0.35, emissive: 0x3a2400 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffc040 });
    const tronco = mesh(new THREE.DodecahedronGeometry(1.0, 0), pedra, 0, 1.7, 0); tronco.scale.set(1.15, 1.1, 0.9); g.add(tronco);
    g.add(mesh(new THREE.DodecahedronGeometry(0.62, 0), pedra, 0, 1.0, 0));
    // pernas de pedra, que fazem o chão tremer
    const pernasG = OV.andar.pernas(g, 0.45, 1.15, { coxa: 0.6, canela: 0.52, larg: 0.46, mat: pedra, pe: [0.58, 0.2, 0.74] });
    g.add(mesh(new THREE.DodecahedronGeometry(0.48, 0), pedra, 0, 2.95, 0.1));
    [[0.4, 1.9, 0.75], [-0.5, 1.4, 0.7], [0.1, 2.3, 0.72]].forEach(([x, y, z]) => g.add(mesh(new THREE.OctahedronGeometry(0.16, 0), veio, x, y, z)));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), eye); e.position.set(0.17 * s, 3.0, 0.5); g.add(e); });
    const arm = s => { const p = new THREE.Group(); p.position.set(1.2 * s, 2.3, 0); p.add(mesh(new THREE.DodecahedronGeometry(0.42, 0), pedra, 0, -0.5, 0)); p.add(mesh(new THREE.DodecahedronGeometry(0.5, 0), pedra, 0, -1.25, 0.05)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [pedra, veio], eye, eyeBase: 0xffc040, pernas: pernasG, passada: 1.0, marchaO: { A: 0.3, K: 0.5, bob: 0.1 }, ginga: 0.05 };
  }
  function makeCofre() {
    const g = new THREE.Group();
    const madeira = sm(0x3a2416), ferro = sm(0x2a2a2e, { metalness: 0.6, roughness: 0.5 }), ouro = sm(0xc9a24a, { metalness: 0.85, roughness: 0.3, emissive: 0x3a2400 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffd060 });
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.9, 1.0), madeira, 0, 0.45, 0));
    g.add(mesh(new THREE.BoxGeometry(1.46, 0.3, 1.06), ouro, 0, 1.05, 0));
    [-0.5, 0.5].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.1, 0.95, 1.08), ferro, x, 0.5, 0)));
    const corr = mesh(new THREE.TorusGeometry(0.75, 0.05, 4, 16), ferro, 0, 0.6, 0); corr.rotation.x = Math.PI / 2; g.add(corr);
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), eye); gema.position.y = 1.6; g.add(gema);
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [ouro, madeira], eye, eyeBase: 0xffd060 };
  }
  function makeMamom() {
    const g = new THREE.Group();
    const manto = sm(0x2a1a0a, { emissive: 0x0a0500 }), ouro = sm(0xd8b048, { metalness: 0.9, roughness: 0.25, emissive: 0x4a3000 }), negro = sm(0x0a0806);
    const eye = new THREE.MeshBasicMaterial({ color: 0xffc030 });
    const mantoM = mesh(new THREE.ConeGeometry(1.5, 2.9, 10), manto, 0, 1.95, 0); g.add(mantoM);
    const pernasM = OV.andar.pernas(g, 0.5, 1.0, { coxa: 0.5, canela: 0.48, larg: 0.34, mat: manto, matPe: ouro, pe: [0.42, 0.12, 0.62] });
    const peito = mesh(new THREE.BoxGeometry(1.9, 1.4, 1.1), ouro, 0, 3.3, 0.05); g.add(peito);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 8), ouro, Math.cos(a) * 0.7, 2.55, Math.sin(a) * 0.55 + 0.2)); }
    // a cabeça é a de um bezerro de ouro
    const cab = new THREE.Group(); cab.position.set(0, 4.35, 0.2); g.add(cab);
    cab.add(mesh(new THREE.BoxGeometry(0.9, 0.85, 1.1), ouro, 0, 0, 0));
    cab.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.45), ouro, 0, -0.2, 0.68));
    [-1, 1].forEach(s => { const c = mesh(new THREE.ConeGeometry(0.12, 0.8, 5), ouro, 0.45 * s, 0.55, 0); c.rotation.z = -0.7 * s; cab.add(c); const e = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), eye); e.position.set(0.24 * s, 0.12, 0.56); cab.add(e); });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; cab.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8), ouro, Math.cos(a) * 0.5, 0.55, Math.sin(a) * 0.5)); }
    const arm = (s, item) => { const p = new THREE.Group(); p.position.set(1.25 * s, 3.6, 0.1); p.add(mesh(new THREE.CylinderGeometry(0.26, 0.22, 1.6, 7), manto, 0, -0.75, 0)); p.add(mesh(new THREE.SphereGeometry(0.26, 6, 5), ouro, 0, -1.6, 0)); p.add(item); g.add(p); return p; };
    const saco = new THREE.Group(); saco.position.set(0, -2.0, 0.2);
    saco.add(mesh(new THREE.SphereGeometry(0.55, 8, 6), sm(0x6a4a2a), 0, 0, 0)); saco.add(mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.3, 6), sm(0x6a4a2a), 0, 0.55, 0));
    const bal = new THREE.Group(); bal.position.set(0, -1.9, 0.2);
    bal.add(mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), ouro, 0, 0, 0)); [-0.55, 0.55].forEach(x => bal.add(mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.06, 10), ouro, x, -0.4, 0)));
    return { g, armL: arm(-1, bal), armR: arm(1, saco), mats: [manto, ouro], eye, eyeBase: 0xffc030, pernas: pernasM, manto: mantoM, passada: 1.0, marchaO: { A: 0.3, K: 0.5, bob: 0.1 } };
  }
  Object.assign(I.CORES, {
    mineiro: ['Rubro', 0x5a1a14, 'Capataz Possuído', 0x1a1a3a], escaravelho: ['Negro', 0x1a1610, 'Escaravelho-Rei', 0xe8d070],
    golem: ['Rubro', 0x5a2a1a, 'Colosso de Cascalho', 0x2a2a3a]
  });
  const FO = OV.FOES;
  FO.mineiro = { key: 'mineiro', name: 'Mineiro possuído', nivel: 10, build: makeMineiro, hp: 150, speed: 3.2, dmg: 14, windup: 0.55, recover: 0.8, range: 2.0, r: 0.5, height: 2.4, knock: 0.8, stagger: true, xp: 40, aggro: 12, leash: 22, liberta: true, moedas: [3, 6], status: 'avareza' };
  FO.escaravelho = { key: 'escaravelho', name: 'Escaravelho de Ouro', nivel: 9, build: makeEscaravelho, hp: 48, speed: 5.6, dmg: 8, windup: 0.3, recover: 0.5, range: 1.4, r: 0.45, height: 1.2, knock: 1.3, stagger: true, xp: 20, mundo: true, aggro: 13, leash: 24, moedas: [2, 4], status: null,
    aoGolpear: e => { const n = Math.min(3, den()); if (!n) return; P.pers.denarios -= n; e.roubo = (e.roubo || 0) + n; ui.toast(`O Escaravelho roubou ${n} denários! Vença-o para recuperá-los.`); } };
  FO.golem = { key: 'golem', name: 'Guardião de Cascalho', nivel: 11, build: makeGolem, hp: 300, speed: 2.3, dmg: 24, windup: 1.0, recover: 1.1, range: 2.6, r: 1.0, height: 3.4, knock: 0.2, stagger: false, xp: 70, mundo: true, aggro: 12, leash: 22, moedas: [4, 9], status: 'avareza' };
  FO.cofre = { key: 'cofre', name: 'Cofre de Mamom', nivel: 14, build: makeCofre, hp: 140, speed: 0, dmg: 0, windup: 9, recover: 1, range: 0, r: 0.8, height: 1.8, knock: 0, stagger: false, xp: 15, aggro: 0, leash: 99, fixo: true, status: null,
    quebra: () => !!F().graca_lourenco, ia: e => { e.state = 'idle'; e.g.rotation.y += 0.008; } };
  FO.mamom = { key: 'mamom', name: 'Mamom, o Senhor dos Cofres', nivel: 14, build: makeMamom, hp: 2200, speed: 2.5, dmg: 30, windup: 0.85, recover: 0.9, range: 3.2, r: 1.4, height: 5.4, knock: 0.1, stagger: false, xp: 520, aggro: 45, leash: 50, status: 'avareza', chefe: true,
    fall: 'Mamom foi vencido. Que reine a Generosidade.', reduz: () => I.porTag('cofre').some(vivo) ? 0.25 : 1, ia: (e, dt) => iaMamom(e, dt) };

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  MS.ganchos.aplicar.push(() => {
    const f = F(), fig = M.figuras;
    if (f.ato2_fim && !st('a3m1')) prog().missoes.a3m1 = { e: 0, fim: false, res: null };
    fig.lourenco.mostrar(false);
    if (f.mamom_vencido) { const q = W(4, 50); fig.fulvio.ir(q.x, q.z, 0); }
    R.acenderLampada(!!f.ato3_fim);
    if (f.ato3_fim) R.poco.abrir(); else R.poco.fechar();
    R.portaCofre(!!f.cofre_aberto);
    R.idolo(!f.mamom_vencido);
    resetarChefe();
  });
  MS.ganchos.spawn.push(() => {
    const f = F();
    ['boca', 'escritorio', 'galeria', 'partilha', 'peso'].forEach(MS.tagRemove);
    const ja = f.mineiros || [];
    if (!MS.feita('a3m2')) BOCA.forEach(([x, z], i) => { if (ja.includes(i)) return; const e = I.spawn('mineiro', false, W(x, z)); e.tag = 'boca'; e.mi = i; });
    if (!f.livro3 && !MS.feita('a3m3')) [[-63, -21], [-69, -30], [-60, -29]].forEach(([x, z], i) => { const e = I.spawn('escaravelho', false, W(x, z), { nivel: 10, variante: i === 0 ? 'forte' : null }); e.tag = 'escritorio'; e.mundo = false; });
    if (MS.ativa('a3s1') && MS.etapa('a3s1') === 0) [[3, 2], [-3, 3], [0, 6]].forEach(([dx, dz], i) => { const e = I.spawn(i === 2 ? 'golem' : 'escaravelho', false, W(R.GALERIA.x + dx, R.GALERIA.z + dz), { nivel: 12 }); e.tag = 'galeria'; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.livro3 && !MS.feita('a3m3')) inv.push('Livro-razão da mina');
    if (f.chave_cofre && !f.cofre_aberto) inv.push('Chave do Cofre Grande');
    if (f.lamparina && !MS.feita('a3s1')) inv.push('Lamparina e terço de Tomás');
    if (f.graca_lourenco) inv.push('Graça de Lourenço (os cofres de Mamom se quebram com um golpe)');
    if (f.moedas_mamom && !MS.feita('a3s3') && MS.ativa('a3s3')) inv.push('Moedas de olhos de ouro (atraem os Escaravelhos)');
  });

  /* ================= OBJETOS DE VALDOURO ================= */
  A3.textoPoco = () => F().ato3_fim ? 'Tirar água do poço' : 'Examinar o poço';
  A3.poco = function () {
    if (F().ato3_fim) { P.hp = P.D.maxHp; ui.fala('Poço de Valdouro', 'A corrente foi tirada. Quem passa bebe, e ninguém cobra nada. Você bebe e se sente renovado.'); return; }
    ui.fala('Poço de Valdouro', 'O poço da praça tem tampa, corrente e cadeado. Numa tabuleta: "Água: um denário o balde. Por ordem de Mestre Fúlvio."');
  };
  A3.textoIgreja = () => (MS.ativa('a3m5') && MS.etapa('a3m5') === 3) ? 'Entrar para a Missa' : 'Entrar na Igreja de São Lourenço';
  A3.igreja = function () {
    if (MS.ativa('a3m5') && MS.etapa('a3m5') === 3) { missa3(); return; }
    ui.fala('Igreja de São Lourenço', F().ato3_fim ? 'Sobre o altar, a caixa das esmolas está aberta, e ninguém tira nada dela sem precisar. Da torre, a Lâmpada da Generosidade ilumina a serra.' : 'Atrás do altar está pendurada uma grelha de ferro: o sinal de São Lourenço, o diácono que deu aos pobres os bens da Igreja de Roma.');
  };
  A3.textoLivro = () => (MS.ativa('a3m3') && MS.etapa('a3m3') === 0) ? 'Examinar o livro-razão' : null;
  A3.livro = function () {
    if (I.porTag('escritorio').some(vivo)) { ui.toast('Os Escaravelhos de Ouro guardam o escritório.'); return; }
    D.falas([
      ['Livro-razão da mina', '"Ouro tirado da mina neste ano: trinta arrobas. Salários pagos: em moedas da Cava, ao câmbio de Mestre Fúlvio."'],
      ['Livro-razão da mina', '"Tomás, mineiro, morto no desabamento da Galeria Velha. À viúva: nada. A galeria foi fechada para não perder tempo."'],
      ['Anjo da Guarda', 'As moedas da Cava têm o rosto de Mamom: não compram pão, só prendem quem as guarda. Leve este livro a Mestre Fúlvio.']
    ], () => { F().livro3 = true; MS.avancar('a3m3', 1); J().salvar(); });
  };
  A3.textoGaleria = () => (MS.ativa('a3s1') && MS.etapa('a3s1') === 0) ? 'Procurar entre as pedras da galeria' : 'Olhar a Galeria Velha';
  A3.galeria = function () {
    if (!(MS.ativa('a3s1') && MS.etapa('a3s1') === 0)) { ui.fala('Galeria Velha', F().lamparina || MS.feita('a3s1') ? 'Uma cruz de madeira foi fincada entre as pedras. Alguém deixou flores.' : 'A entrada desabou. Entre as pedras, uma corrente de ar frio sai do escuro.'); return; }
    if (I.porTag('galeria').some(vivo)) { ui.toast('Os vícios ainda rondam a galeria.'); return; }
    F().lamparina = true; MS.avancar('a3s1', 1); MS.ato('caridade'); A.bell(392, 0.15);
    ui.fala('Galeria Velha', 'Entre as pedras você encontra uma lamparina de mineiro amassada e um terço de contas de madeira, enrolado num pedaço de pano. Você reza um Pai-Nosso pela alma de Tomás.');
  };
  A3.textoCapela = () => (MS.ativa('a3m4') && MS.etapa('a3m4') === 0) ? 'Rezar diante da Capela de Santa Bárbara' : 'Olhar a capela';
  A3.capelaBarbara = function () {
    if (MS.ativa('a3m4') && MS.etapa('a3m4') === 0) { visaoLourenco(); return; }
    ui.fala('Capela de Santa Bárbara', 'Santa Bárbara é a padroeira dos mineiros. Antes de descer à mina, eles sobem até aqui para pedir que a montanha não os engula.');
  };
  A3.textoCofre = () => (MS.ativa('a3m5') && MS.etapa('a3m5') === 0) ? (F().chave_cofre ? 'Abrir o Cofre Grande' : 'Examinar o Cofre Grande') : (F().cofre_aberto ? 'Olhar o Cofre Grande' : 'Examinar o Cofre Grande');
  A3.cofreGrande = function () {
    const f = F();
    if (f.cofre_aberto) { ui.fala('Cofre Grande', f.ato3_fim ? 'Vazio. Tudo o que estava aqui voltou para as famílias da mina.' : 'Os sacos de salário estão guardados, à espera de voltar para os mineiros.'); return; }
    if (!f.chave_cofre) { ui.fala('Cofre Grande', 'Uma porta de ferro com três fechaduras. Só Mestre Fúlvio tem a chave.'); return; }
    if (!(MS.ativa('a3m5') && MS.etapa('a3m5') === 0)) { ui.fala('Cofre Grande', 'Ainda não é hora de abri-lo.'); return; }
    f.cofre_aberto = true; R.portaCofre(true); A.bell(220, 0.25); J().shake(0.3);
    const v3 = (q, y) => { const w = W(q.x, q.z); return new THREE.Vector3(w.x, M.altura(w.x, w.z) + y, w.z); };
    (OV.cenas ? (l, c) => OV.cenas.contar(l, { alvo: v3({ x: 16, z: -66 }, 1.2), raio: 9, altura: 2.5, olhar: 0.5, alvos: [null, { alvo: v3({ x: R.ARENA.x, z: R.ARENA.z - 9 }, 2), raio: 14, altura: 7, olhar: 0 }] }, c) : D.falas)([
      ['', 'A porta de ferro range. Lá dentro há sacos de moedas boas, com o selo do rei: o salário de um ano inteiro, que nunca foi pago.'],
      ['', 'No fundo da Cava, o bezerro de ouro brilha de repente, como se tivesse aberto os olhos.'],
      ['Anjo da Guarda', 'Isto pertence aos mineiros. Mas quem guarda este ouro não vai deixá-lo sair sem lutar. Desça ao fundo da Cava.']
    ], () => { MS.avancar('a3m5', 1); J().salvar(); });
  };

  /* ================= SÃO LOURENÇO E A PARTILHA ================= */
  function visaoLourenco() {
    ui.clarao('#fff6dc'); M.figuras.lourenco.mostrar(true); A.bell(523, 0.2);
    D.abrir(arv('São Lourenço', {
      a: { txt: () => `A paz esteja com você, ${g('irmão', 'irmã')}. Fui diácono em Roma. O Papa me confiou os bens da Igreja, e eu os gastava com os pobres, as viúvas e os órfãos.`, prox: 'b' },
      b: { txt: 'Quando o prefeito da cidade exigiu os tesouros da Igreja, pedi três dias. Reuni os cegos, os doentes, as viúvas e os mendigos, e os levei até ele: "Eis os tesouros da Igreja."', prox: 'c' },
      c: { txt: 'Mamom faz o contrário: chama de tesouro o que é só metal, e esquece as pessoas. Os cofres que o cercam são feitos do salário que não foi pago. Eles não resistirão a quem sabe dar.',
        prox: () => (F().graca_lourenco || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('São Lourenço', 'denarios',
        'Mas só quebra o cofre quem não tem cofre. O que você carrega na bolsa é seu, ou é de Deus? Os mineiros do acampamento não comem há dias. Dê a eles tudo o que tem, e a graça é sua.',
        () => { F().graca_lourenco = true; setTimeout(() => ui.toast('Você recebeu a Graça de Lourenço: os cofres de Mamom se quebram com um só golpe.'), 1800); }, 'd',
        'Eu entendo. O ouro pesa na mão de quem o segura. Sem a graça, os cofres de Mamom vão resistir aos seus golpes.') : {}),
      d: { txt: () => F().graca_lourenco ? 'O que foi dado aos mineiros, o ouro de Mamom virá tomar de volta esta noite. Vigie comigo, e proteja a partilha.' : `Agora diga: quer ao menos vigiar comigo esta noite? O ouro de Mamom virá rondar o acampamento${den() ? `, e a vigília custa a sua bolsa (${den()} denários)` : ''}.`, opc: [
        { t: () => F().graca_lourenco || !den() ? 'Vigiar com São Lourenço.' : 'Dar tudo aos mineiros e vigiar com São Lourenço.', ef: () => { F().partilha_den = (F().partilha_den || 0) + den(); P.pers.denarios = 0; MS.avancar('a3m4', 1); }, ir: 'v' },
        { t: 'Agora não. Vou enfrentar Mamom.', ef: () => { MS.concluir('a3m4', 'desceu'); iniciarA3m5(); }, ir: 'x' }] },
      v: { txt: 'Então fique firme. Eles vêm em três levas. Quando tiverem roubado tudo e não acharem nada, terão perdido.', depois: () => iniciarPartilha() },
      x: { txt: 'Vá em paz. O ouro de Mamom pesa, mas o amor é mais leve.', depois: () => setTimeout(() => M.figuras.lourenco.mostrar(false), 800) }
    }));
  }
  const iniciarA3m5 = () => setTimeout(() => MS.iniciar('a3m5'), 1400);
  const pt = { ativa: false, onda: 0, espera: 0 };
  function iniciarPartilha() { pt.ativa = true; pt.onda = 0; pt.espera = 1.5; ui.clarao('#0a0608'); ui.toast('O ouro vem tomar de volta o que foi dado.'); }
  function atualizarPartilha(dt) {
    if (!pt.ativa) return;
    if (I.porTag('partilha').some(vivo)) return;
    pt.espera -= dt; if (pt.espera > 0) return;
    if (pt.onda >= 3) {
      pt.ativa = false;
      if (P.pers.virt.caridade < OV.MAX_VIRTUDE) P.pers.virt.caridade++;
      C().recalcular(); MS.ato('caridade');
      ui.banner('A partilha'); ui.toast('Você deu tudo, e não perdeu nada. Sua Caridade se fortaleceu (+1).');
      if (IT.dar('medLourenco', 1, true)) setTimeout(() => ui.toast('São Lourenço lhe deixou a sua medalha. Veja no inventário (I).'), 1800);
      MS.concluir('a3m4', 'partilha'); iniciarA3m5();
      setTimeout(() => M.figuras.lourenco.mostrar(false), 2500);
      return;
    }
    pt.onda++; pt.espera = 2.5;
    ui.toast(`A partilha: ${['primeira', 'segunda', 'terceira'][pt.onda - 1]} leva dos Escaravelhos de Ouro`);
    const n = 3 + pt.onda;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn(pt.onda === 3 && i === 0 ? 'golem' : 'escaravelho', true, { x: P.pos.x + Math.cos(a) * 8, z: P.pos.z + Math.sin(a) * 8 }, { nivel: 11 }); e.tag = 'partilha'; e.mundo = false;
    }
  }

  /* ================= MAMOM ================= */
  const chefe = { ativo: false, fase: 0, chuvaT: 0, slamT: 0, slam: 0, falando: false, b: null, chuvas: [], linhas: [] };
  A3.chefe = chefe;
  const COFRES = [[-10, -6], [10, -6], [-10, 8], [10, 8]];
  const matLinha = new THREE.LineBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.55 });
  function limparEfeitos() { chefe.linhas.forEach(l => M.scene.remove(l.obj)); chefe.linhas = []; chefe.chuvas.forEach(c => M.scene.remove(c.m)); chefe.chuvas = []; }
  function resetarChefe() {
    ['mamom', 'cofre', 'mamom_add'].forEach(MS.tagRemove);
    limparEfeitos(); chefe.ativo = false; chefe.fase = 0; chefe.slam = 0; chefe.falando = false; chefe.b = null;
  }
  function desafiar() {
    if (chefe.ativo || chefe.falando) return;
    chefe.falando = true;
    const fala = () => D.abrir(arv('Mamom', {
      a: { txt: 'Veio pelo ouro? Todos vêm pelo ouro. Os mineiros cavaram para mim, o Fúlvio contou para mim, e ninguém dormiu em paz. É assim que eu gosto.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: () => 'É Mamom, o ídolo da avareza. Os cofres em volta o protegem: enquanto houver um de pé, os seus golpes quase não o ferem. E cuidado com a chuva de moedas: não pise onde o ouro cai.' + (F().graca_lourenco ? ' A Graça de Lourenço está com você: um golpe basta para cada cofre.' : ''),
        depois: () => { chefe.falando = false; iniciarChefe(); } }
    }));
    if (OV.cenas) OV.cenas.poema('mamom', { pos: W(R.ARENA.x, R.ARENA.z - 6) }, fala); else fala();
  }
  function iniciarChefe() {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1; chefe.chuvaT = 4; chefe.slamT = 6;
    R.idolo(false);
    const b = I.spawn('mamom', !(OV.cenas && OV.cenas.trocar('mamom')), W(R.ARENA.x, R.ARENA.z - 6)); b.tag = 'mamom'; chefe.b = b;
    COFRES.forEach(([x, z]) => {
      const t = I.spawn('cofre', true, W(R.ARENA.x + x, R.ARENA.z + z)); t.tag = 'cofre'; t.parado = true;
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const obj = new THREE.Line(geo, matLinha); M.scene.add(obj); chefe.linhas.push({ t, obj });
    });
    MS.avancar('a3m5', 2);
    A.bell(130, 0.35); J().shake(0.35);
  }
  function chuvaDeMoedas() {
    const n = chefe.fase >= 2 ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = i === 0 ? 0 : 2.5 + Math.random() * 4;
      const x = P.pos.x + Math.cos(a) * r, z = P.pos.z + Math.sin(a) * r;
      const m = new THREE.Mesh(new THREE.CircleGeometry(2.6, 24), new THREE.MeshBasicMaterial({ color: 0xffc840, transparent: true, opacity: 0.12, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, M.altura(x, z) + 0.08, z); M.scene.add(m);
      chefe.chuvas.push({ x, z, t: 1.4, m });
    }
    ui.toast('Mamom faz chover moedas: saia dos círculos dourados!'); A.bell(880, 0.06);
  }
  function atualizarChuvas(dt) {
    chefe.chuvas = chefe.chuvas.filter(c => {
      c.t -= dt; c.m.material.opacity = 0.12 + 0.45 * (1 - Math.max(0, c.t) / 1.4); c.m.scale.setScalar(0.4 + 0.6 * (1 - Math.max(0, c.t) / 1.4));
      if (c.t > 0) return true;
      C().faisca(c.x, M.altura(c.x, c.z) + 0.6, c.z, 0xffd060);
      if (Math.hypot(P.pos.x - c.x, P.pos.z - c.z) < 2.6) C().ferirJogador(16, 'avareza');
      M.scene.remove(c.m); return false;
    });
  }
  function iaMamom(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) {
      chefe.fase = 2;
      [[-6, 12], [6, 12], [0, -14]].forEach(([x, z], i) => { const a = I.spawn(i === 2 ? 'golem' : 'escaravelho', true, W(R.ARENA.x + x, R.ARENA.z + z), { nivel: 13 }); a.tag = 'mamom_add'; a.def = Object.assign({}, a.def, { aggro: 30, leash: 40 }); });
      ui.toast('"Meus guardiões! Protejam o tesouro!" Mamom chama o ouro que ainda lhe obedece.'); A.bell(220, 0.25); J().shake(0.3);
    }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; chefe.slamT = 3; pacto(e); }
    chefe.chuvaT -= dt;
    if (chefe.chuvaT <= 0 && !D.aberto) { chefe.chuvaT = chefe.fase >= 3 ? 5 : 6.5; chuvaDeMoedas(); }
    if (chefe.fase === 3) {
      if (chefe.slam > 0) {
        chefe.slam -= dt; e.state = 'recover'; e.t = 0.6;
        if (chefe.slam <= 0) {
          const A0 = chefe.slamArea || { x: e.g.position.x, z: e.g.position.z, r: 6 }; chefe.slamArea = null;
          C().faisca(e.g.position.x, e.g.position.y + 0.3, e.g.position.z, 0xffc040); J().shake(0.5); if (A.heavy) A.heavy();
          I.golpeArea(A0, 28, 'avareza', e);
          chefe.slamT = 5.5;
        }
      } else {
        chefe.slamT -= dt;
        if (chefe.slamT <= 0 && (e.state === 'chase' || e.state === 'idle')) {
          chefe.slam = 1.4; e.state = 'recover'; e.t = 1.4;
          chefe.slamArea = { x: e.g.position.x, z: e.g.position.z, r: 6 };
          const disco = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({ color: 0xc8901a, transparent: true, opacity: 0.1, depthWrite: false }));
          disco.rotation.x = -Math.PI / 2; disco.position.set(e.g.position.x, M.altura(e.g.position.x, e.g.position.z) + 0.08, e.g.position.z);
          C().efeito([disco], 1.4, p => { disco.material.opacity = 0.1 + 0.4 * p; disco.scale.setScalar(0.3 + 0.7 * p); });
          if (I.aoFx) I.aoFx({ k: 'marca', x: chefe.slamArea.x, z: chefe.slamArea.z, r: chefe.slamArea.r, dur: 1.4, cor: 0xc8901a }); // o colega vê o mesmo círculo
          ui.toast('Mamom ergue a mão de ouro: afaste-se ou esquive!');
        }
      }
    }
  }
  function pacto(b) {
    D.abrir(arv('Mamom', {
      a: { txt: 'Chega. Por que lutar com as mãos vazias? Tudo isto será seu: o ouro da Cava, a casa de Fúlvio, a cidade inteira. Só precisa se ajoelhar.', opc: [
        { t: '"Ninguém pode servir a dois senhores. Não se pode servir a Deus e a Mamom."', ef: () => { F().pacto3 = 'recusou'; MS.ato('justica'); I.atordoar(b, 2.5); }, ir: 'r' },
        { t: 'Ajoelhar-se, só por um instante...', ef: () => { F().pacto3 = 'cedeu'; P.status.avareza = 25; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.2); }, ir: 'c' }] },
      r: { quem: '', txt: 'O ídolo estremece. Ouro nenhum consegue comprar quem já tem um Senhor.' },
      c: { quem: 'Anjo da Guarda', txt: 'Você se curvou, e a Avareza fechou a sua mão. Levante-se! Num Oratório, a esmola a solta de novo. E ainda é tempo de lutar.' }
    }));
  }
  function atualizarChefe(dt) {
    const b = chefe.b; if (!b) return;
    chefe.linhas.forEach(l => {
      const ok = vivo(l.t) && vivo(b); l.obj.visible = ok; if (!ok) return;
      const p = l.obj.geometry.attributes.position;
      p.setXYZ(0, l.t.g.position.x, l.t.g.position.y + 1.6, l.t.g.position.z); p.setXYZ(1, b.g.position.x, b.g.position.y + 3.2, b.g.position.z); p.needsUpdate = true;
    });
    matLinha.opacity = 0.35 + 0.25 * Math.sin(performance.now() / 160);
    atualizarChuvas(dt);
  }
  function mamomVencido() {
    chefe.ativo = false; F().mamom_vencido = true; limparEfeitos();
    I.lista.filter(e => (e.tag === 'cofre' || e.tag === 'mamom_add') && vivo(e)).forEach(e => { e.state = 'dead'; e.deadT = 0; e.lab.el.style.display = 'none'; });
    J().salvar();
    setTimeout(finalMamom, 1800);
  }
  function finalMamom() {
    { const q = W(R.ARENA.x + 3, R.ARENA.z + 4); M.figuras.fulvio.mover(q.x, q.z, Math.PI); }
    D.abrir(arv('Mestre Fúlvio', {
      a: { quem: '', txt: 'Mamom se desfaz numa poeira de ouro falso, que o vento leva. Do alto da rampa desce Mestre Fúlvio, tremendo, com as mãos vazias.', prox: 'b' },
      b: { txt: 'Eu desci atrás de você. Queria ver... se o ouro ia sobreviver. E agora não sobrou nada. Passei a vida contando, e nunca tive o bastante.', opc: [
        { t: 'Deus perdoa quem se arrepende. Venha à Missa: lá está o único tesouro que não se perde.', ef: () => { F().fulvio_fim = 'perdao'; MS.ato('caridade'); }, ir: 'c1' },
        { t: 'Então repare o mal: pague cada família, abra o poço e sustente a viúva de Tomás.', ef: () => { F().fulvio_fim = 'reparacao'; MS.ato('justica'); }, ir: 'c2' }] },
      c1: { txt: 'Perdão... nunca ninguém me deu nada de graça. Eu vou.', prox: 'z' },
      c2: { txt: 'Cada família. Cada balde de água. Vou começar por Rosa. Juro diante de São Lourenço.', prox: 'z' },
      z: { quem: 'Anjo da Guarda', txt: 'Está feito. Os salários voltam para os mineiros. Vá à Igreja de São Lourenço: Valdouro espera pela Missa.', ef: () => { MS.avancar('a3m5', 3); J().salvar(); },
        depois: () => setTimeout(() => { const q = W(4, 50); M.figuras.fulvio.ir(q.x, q.z, 0); }, 1500) }
    }));
  }
  function missa3() {
    const f = F();
    const linhas = [
      ['', 'A Igreja de São Lourenço se enche de mineiros com o rosto lavado. Pela primeira vez em anos, as portas de Valdouro ficam abertas.'],
      ['Padre Elias', 'Irmãos, onde está o vosso tesouro, aí estará o vosso coração. Hoje oferecemos a Deus o pão, que é fruto da terra e do trabalho humano.'],
      ['Mestre Fúlvio', f.fulvio_fim === 'reparacao' ? 'Hoje cada família recebeu o que era seu, e o poço não tem mais dono. É pouco, mas é o começo.' : 'Contei moedas a vida inteira. Hoje, pela primeira vez, contei pessoas.']
    ];
    if (MS.feita('a3s1')) linhas.push(['Viúva Rosa', 'Tomás descansa em paz. A lamparina dele vai ficar acesa ao pé do altar.']);
    if (MS.feita('a3s2')) linhas.push(['Brás, o capataz', 'Ninguém mais desce à mina com fome. Joana manda pão todo dia.']);
    if (res('a3m4') === 'partilha') linhas.push(['Brás, o capataz', 'E os denários que você deixou no acampamento? Viraram botas, cobertores e um telhado para a escola.']);
    linhas.push(['', 'Ao fim da Missa, os sinos tocam. No alto da torre, uma chama nova se acende: a Lâmpada da Generosidade ilumina a serra.']);
    ui.clarao('#000000');
    D.falas(linhas, () => {
      f.ato3_fim = true; MS.concluir('a3m5', f.fulvio_fim || 'perdao');
      R.acenderLampada(true); R.poco.abrir();
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([262, 330, 392, 494, 523][i], 0.3), t));
      setTimeout(() => {
        J().pausar(true);
        ui.fimAto(resumo3(), {
          eyebrow: 'Fim do Ato III', titulo: 'O tesouro eram as pessoas',
          texto: 'A Lâmpada da Generosidade arde na torre de Valdouro. A terceira das sete lâmpadas de Albária foi reacesa.',
          cite: 'Além das colinas, em Belmonte, dizem que os bailes não terminam nunca e que ninguém mais se lembra do próprio rosto. O Ato IV começa na Corte das Máscaras.'
        });
        if (MS.aposAto3) MS.aposAto3();
      }, 2600);
    });
  }
  function resumo3() {
    const f = F(), r = [];
    r.push({ justica: 'Você mostrou o livro-razão a Mestre Fúlvio, e ele entregou a chave do Cofre Grande.', prudencia: 'Com prudência, você convenceu Mestre Fúlvio a entregar a chave.', caridade: 'Você pagou do seu bolso o salário de uma família, e Fúlvio se envergonhou.' }[f.fulvio_res] || 'Mestre Fúlvio entregou a chave do Cofre Grande.');
    r.push(f.fulvio_fim === 'reparacao' ? 'Fúlvio pagou cada família e abriu o poço da praça.' : 'Fúlvio foi perdoado e voltou à Missa.');
    r.push(f.pacto3 === 'cedeu' ? 'Você se ajoelhou diante de Mamom por um instante, e mesmo assim se levantou.' : 'Você recusou o pacto de Mamom.');
    if (MS.feita('a3m4')) r.push(res('a3m4') === 'partilha' ? 'Você deu tudo o que tinha aos mineiros e vigiou com São Lourenço.' : 'Você desceu do pico sem fazer a partilha.');
    if (MS.feita('a3s1')) r.push('A Viúva Rosa enterrou Tomás com dignidade.');
    if (MS.feita('a3s2')) r.push('O Acampamento dos Mineiros voltou a ter pão.');
    if (MS.feita('a3s3')) r.push('As moedas de olhos de ouro foram derretidas.');
    return r;
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"Quanto tempo eu cavei? Nem lembro o nome dos meus filhos..."', '"Eu tinha ouro nas mãos e fome na barriga."', '"Desculpe. Eu ia bater em você por uma moeda."', '"Obrigado. Vou para casa. Ainda tenho casa?"', '"Senhor, tende piedade de mim, pecador."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && naRegiao()) {
      if (MS.ativa('a3m1') && MS.etapa('a3m1') === 0) {
        MS.avancar('a3m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Repare nas portas: cada uma tem o seu cadeado. Aqui ninguém confia em ninguém, e o ouro da montanha pesa sobre todos. Procure o padre, na Igreja de São Lourenço.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'valdouro' && MS.ativa('a3m1') && MS.etapa('a3m1') === 2) { concluirA3m1(); return false; }
    if (tipo === 'liberto' && x.tag === 'boca') {
      x.sumir = true; f.mineiros = f.mineiros || [];
      if (!f.mineiros.includes(x.mi)) f.mineiros.push(x.mi);
      ui.toast(FRASES[(f.mineiros.length - 1) % FRASES.length]);
      if (f.mineiros.length >= 5) {
        MS.ato('caridade');
        if (MS.ativa('a3m2')) MS.avancar('a3m2', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Todos livres. Agora vão sentir o cansaço de anos de trabalho sem descanso. Volte a Padre Elias.']]), 1600);
      }
      J().salvar(); return true;
    }
    if (tipo === 'liberto' && x.def.key === 'mineiro') { x.sumir = true; ui.toast('O mineiro libertado desce a encosta, aliviado.'); return true; }
    if (tipo === 'vencido' && x.roubo) { denarios(x.roubo); ui.toast(`Você recuperou ${x.roubo} denários.`); x.roubo = 0; }
    if (tipo === 'vencido' && x.def.key === 'cofre') {
      const restam = I.porTag('cofre').filter(vivo).length;
      ui.toast(restam ? `O cofre se abre, e o salário roubado se espalha pelo chão. Restam ${restam}.` : 'O último cofre se abre! Agora os golpes ferem Mamom de verdade.');
      A.bell(330 + restam * 40, 0.12); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'mamom') { mamomVencido(); return true; }
    if (tipo === 'renascer') {
      if (pt.ativa) { pt.ativa = false; if (st('a3m4')) st('a3m4').e = 0; denarios(F().partilha_den || 0); F().partilha_den = 0; MS.tagRemove('partilha'); M.figuras.lourenco.mostrar(false); ui.toast('A vigília foi interrompida. Os denários voltaram para a sua bolsa.'); }
      if (chefe.ativo || chefe.b) { resetarChefe(); R.idolo(!F().mamom_vencido); if (MS.ativa('a3m5') && MS.etapa('a3m5') === 2) st('a3m5').e = 1; }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  let pesoT = 40;
  MS.ganchos.update.push(dt => {
    atualizarPartilha(dt);
    if (!naRegiao()) return;
    const f = F();
    if (chefe.ativo) atualizarChefe(dt);
    // a chegada da missão "O Peso no Bolso"
    if (f.moedas_mamom && !st('a3s3') && MS.feita('a3m1')) MS.iniciar('a3s3');
    if (MS.ativa('a3s3') && !P.dead) {
      pesoT -= dt;
      if (pesoT <= 0) {
        pesoT = 75;
        if (I.porTag('peso').filter(vivo).length < 3 && !chefe.ativo) {
          for (let i = 0; i < 2; i++) { const a = Math.random() * Math.PI * 2; const e = I.spawn('escaravelho', true, { x: P.pos.x + Math.cos(a) * 9, z: P.pos.z + Math.sin(a) * 9 }, { nivel: 10 }); e.tag = 'peso'; e.mundo = false; }
          ui.toast('As moedas de olhos de ouro tilintam na sua bolsa. Os Escaravelhos ouviram.');
        }
      }
    }
    if (MS.ativa('a3m5') && MS.etapa('a3m5') === 1 && !chefe.ativo && !chefe.falando && !P.dead) {
      const a = W(R.ARENA.x, R.ARENA.z);
      if (Math.hypot(P.pos.x - a.x, P.pos.z - a.z) < 15) desafiar();
    }
  });

  /* ================= DIÁLOGOS ================= */
  ARV.elias = () => {
    const f = F(), q = 'Padre Elias';
    if (MS.ativa('a3m1') && MS.etapa('a3m1') <= 1) return arv(q, {
      a: { txt: () => `Um peregrino em Valdouro! Você subiu a serra a pé? Então ainda há gente que anda por amor, e não por ouro. Seja bem-${g('vindo', 'vinda')}.`, prox: 'b' },
      b: { txt: 'Esta cidade cresceu em volta da mina. Era pobre, mas repartia. Até que alguém achou, no fundo da Cava, um bezerro de ouro. Desde então, ninguém divide mais nada.', opc: [
        { t: 'Quem manda na mina?', ir: 'c' }, { t: 'E os mineiros?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      c: { txt: 'Mestre Fúlvio, o cambista. Paga os mineiros com moedas da Cava, de olhos de ouro, que ele mesmo troca pela metade do valor. Até a água do poço tem cadeado.', opc: [{ t: 'E os mineiros?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      d: { txt: 'Muitos não sobem mais da Boca da Mina. Cavam dia e noite, possuídos pela avareza, e atacam quem chega perto do ouro deles.', opc: [{ t: 'Quem manda na mina?', ir: 'c' }, { t: 'O que posso fazer?', ir: 'e' }] },
      e: { txt: () => `Primeiro, acenda a vela do Oratório na praça. Depois vá à Boca da Mina, a oeste. Liberte os mineiros, sem ferir de morte nenhum deles: são filhos de Deus, ${g('meu filho', 'minha filha')}.`,
        ef: () => { MS.avancar('a3m1', 2); if (prog().oratorios.valdouro) concluirA3m1(); } }
    });
    if (MS.ativa('a3m1')) return linha(q, 'O Oratório fica na praça, ao lado do poço trancado.');
    if (MS.ativa('a3m2') && MS.etapa('a3m2') === 1) return arv(q, {
      a: { txt: 'Cinco homens voltaram para casa! As mulheres choram na praça. Eles contam todos a mesma coisa: há meses não recebem salário de verdade.', prox: 'b' },
      b: { txt: 'O escritório da mina, junto à Boca, guarda o livro-razão. Se Fúlvio anotou as contas, ali está a prova. Vá ver.', ef: () => { MS.concluir('a3m2'); setTimeout(() => MS.iniciar('a3m3'), 1200); } }
    });
    if (MS.ativa('a3m2')) return linha(q, 'A Boca da Mina fica a oeste, subindo a encosta. Que Santa Bárbara proteja você lá embaixo.');
    if (MS.ativa('a3m3') && MS.etapa('a3m3') === 2) return arv(q, {
      a: { txt: 'A chave do Cofre Grande! Deus seja louvado. Mas o ouro da Cava não é só ouro: é um ídolo. E ídolos não se entregam.', prox: 'b' },
      b: { txt: 'Santa Bárbara é a padroeira dos mineiros, e na capela dela, no pico a leste, os antigos diziam ver São Lourenço, o diácono que deu aos pobres os tesouros da Igreja.', prox: 'c' },
      c: { txt: 'Suba até lá e reze. Antes de enfrentar Mamom, aprenda com quem nunca se deixou comprar.', ef: () => { MS.concluir('a3m3', f.fulvio_res); setTimeout(() => MS.iniciar('a3m4'), 1200); } }
    });
    if (MS.ativa('a3m3')) return linha(q, MS.etapa('a3m3') === 0 ? 'O escritório fica junto à Boca da Mina. Cuidado com os Escaravelhos: eles roubam até os denários do seu bolso.' : 'A Casa de Contas fica ao norte da praça. Fúlvio não é um monstro... só tem medo de nunca ter o bastante.');
    if (MS.ativa('a3m4')) return linha(q, 'A Capela de Santa Bárbara fica no pico a leste. A estrada sobe pela encosta.');
    if (MS.ativa('a3m5') && MS.etapa('a3m5') < 3) return linha(q, 'O Cofre Grande fica à beira da Cava, ao norte. Vá, e que São Miguel vá à sua frente.');
    if (MS.ativa('a3m5')) return linha(q, 'O altar está pronto. Entre pela porta principal: vamos celebrar a Missa.');
    if (f.ato3_fim) return linha(q, 'Valdouro aprendeu a repartir. Dizem que em Belmonte, além das colinas, há um baile que não termina nunca. Que Deus nos guarde.');
    return linha(q, 'Que São Lourenço reze por você.');
  };
  A3.darMoedasElias = function () {
    F().moedas_mamom = false; MS.ato('justica'); MS.concluir('a3s3'); MS.tagRemove('peso');
  };
  const ARV_ELIAS = ARV.elias;
  ARV.elias = () => {
    if (MS.ativa('a3s3')) {
      const base = ARV_ELIAS();
      return arv('Padre Elias', {
        a: { txt: 'Espere. Essa bolsa... está tilintando sozinha. São moedas de olhos de ouro? Elas atraem os Escaravelhos como o mel atrai as moscas.', opc: [
          { t: 'Entregar as moedas para que sejam derretidas.', ef: () => A3.darMoedasElias(), ir: 'b' },
          { t: 'Falar de outra coisa.', ef: () => setTimeout(() => D.abrir(base), 60) }] },
        b: { txt: 'Vou derretê-las e fazer delas uma lamparina para o altar. O ouro que servia a Mamom vai servir de luz para Deus.' }
      });
    }
    return ARV_ELIAS();
  };
  function decidirFulvio(r) {
    F().chave_cofre = true; F().fulvio_res = r;
    MS.ato(r === 'prudencia' ? 'prudencia' : r === 'caridade' ? 'caridade' : 'justica');
    MS.avancar('a3m3', 2); A.bell(523, 0.15);
  }
  ARV.fulvio = () => {
    const f = F(), q = 'Mestre Fúlvio';
    if (MS.ativa('a3m3') && MS.etapa('a3m3') === 1) return arv(q, {
      a: { txt: 'Feche a porta! Ah... não é um ladrão. Um peregrino. Peregrinos não têm dinheiro, então não tenho nada a tratar com você.', opc: [
        { t: 'Mostrar o livro-razão: trinta arrobas de ouro, e os salários pagos em moedas que não compram pão.', ef: () => decidirFulvio('justica'), ir: 'j' },
        { t: 'Mineiros sem salário não descem à mina. Sem eles, não há ouro, nem contas, nem Fúlvio.', cond: () => P.pers.virt.prudencia >= 10, motivo: 'Prudência 10', ef: () => decidirFulvio('prudencia'), ir: 'p' },
        { t: 'Eu pago do meu bolso o salário de uma família. (50 denários)', cond: () => den() >= 50, motivo: 'você precisa de 50 denários', ef: () => { denarios(-50); decidirFulvio('caridade'); }, ir: 'c' },
        { t: 'Ainda não. Volto depois.' }] },
      j: { txt: 'Isso... é a minha letra. Eu sabia, e contava de novo para não saber. Está bem. Está bem.', prox: 'z' },
      p: { txt: 'Sem mineiros... sem ouro. Você conta melhor do que eu. Está bem.', prox: 'z' },
      c: { txt: 'Você dá dinheiro... para quem não é seu parente? Ninguém nunca fez isso na minha frente. Guarde metade. Está bem.', ef: () => denarios(25), prox: 'z' },
      z: { txt: 'O salário que eu devo está no Cofre Grande, à beira da Cava. Tome a chave. Mas cuidado: desde que o bezerro apareceu lá embaixo, quem abre aquele cofre ouve alguém contar moedas no escuro.' }
    });
    if (f.ato3_fim || f.mamom_vencido) return linha(q, f.fulvio_fim === 'reparacao' ? 'Já paguei quarenta e duas famílias. Faltam nove. E durmo, pela primeira vez em anos.' : 'Vou à Missa todos os dias. Ainda tenho vontade de contar tudo... mas agora conto as bênçãos.');
    if (f.chave_cofre) return linha(q, 'Não consigo dormir. Ouço moedas caindo, a noite inteira.');
    return linha(q, 'Peregrino, não tenho nada para você. Volte quando tiver algo para trocar.');
  };
  ARV.rosa = () => {
    const f = F(), q = 'Viúva Rosa';
    if (MS.feita('a3s1')) return linha(q, 'Padre Elias benzeu a sepultura de Tomás. Agora rezo com o terço dele todas as noites.');
    if (MS.ativa('a3s1') && f.lamparina) return arv(q, {
      a: { txt: 'A lamparina dele... e o terço que eu dei no nosso casamento. Ele levava sempre no bolso, para descer à mina.', prox: 'b' },
      b: { txt: 'Agora posso enterrar alguma coisa dele, e rezar onde ele está. Fique com este outro terço, que era do pai dele, também mineiro. Que proteja você lá embaixo.', ef: () => { MS.ato('caridade'); MS.concluir('a3s1'); IT.dar('tercoMineiro', 1); } }
    });
    if (MS.ativa('a3s1')) return linha(q, 'A Galeria Velha fica a noroeste da Boca da Mina, na encosta. Fúlvio mandou fechar a entrada depois do desabamento.');
    return arv(q, {
      a: { txt: 'Meu marido Tomás morreu no desabamento da Galeria Velha. Fúlvio mandou fechar a entrada para não perder tempo. Nem o corpo eu pude enterrar.', opc: [
        { t: 'Vou procurar o que restou dele, para que a senhora possa enterrá-lo.', ef: () => { MS.iniciar('a3s1'); MS.respawnQuest(); }, ir: 'b' }, { t: 'Que Deus dê descanso a Tomás, e consolo à senhora.' }] },
      b: { txt: 'Ele levava uma lamparina e um terço de madeira. Deus lhe pague. Enterrar os mortos também é obra de misericórdia.' }
    });
  };
  ARV.joana = () => arv('Joana, a padeira', {
    a: { txt: () => F().ato3_fim ? 'Agora o forno não para! Fúlvio paga o pão dos mineiros, e eu ponho um a mais em cada cesto.' : 'Pão abençoado, feito de madrugada. Fúlvio quer que eu cobre em moedas da Cava, mas aqui só aceito denário de verdade.', opc: [
      { t: 'Comprar um pão abençoado. (5 denários)', cond: () => den() >= 5, motivo: 'você precisa de 5 denários', ef: () => { denarios(-5); IT.dar('pao', 1); }, ir: 'b' },
      { t: 'Comprar três pães abençoados. (14 denários)', cond: () => den() >= 14, motivo: 'você precisa de 14 denários', ef: () => { denarios(-14); IT.dar('pao', 3); }, ir: 'b' },
      { t: 'Até logo, Joana.' }] },
    b: { txt: () => MS.ativa('a3s2') ? 'É para o acampamento? Então leve com fé: pão repartido rende mais.' : 'Pão quente. Que lhe dê forças na serra.' }
  });
  ARV.bras = () => {
    const q = 'Brás, o capataz';
    if (MS.feita('a3s2')) return linha(q, F().ato3_fim ? 'Agora a gente come antes de descer, e reza a Santa Bárbara antes de cavar. Como antigamente.' : 'O pão acabou num instante, mas a esperança ficou. Obrigado.');
    if (MS.ativa('a3s2')) return arv(q, {
      a: { txt: 'Trouxe o pão?', opc: [
        { t: 'Entregar três pães abençoados.', cond: () => IT.qtd('pao') >= 3, motivo: () => `você tem ${IT.qtd('pao')} de 3`, ef: () => { IT.tirar('pao', 3); IT.refresh && IT.refresh(); MS.ato('caridade'); MS.concluir('a3s2'); IT.dar('agua', 2); }, ir: 'b' },
        { t: 'Ainda não.' }] },
      b: { txt: 'Deus lhe pague! Vou repartir com as crianças primeiro. Tome estas duas garrafas de água benta: Padre Elias benzeu para quem desce à mina.' }
    });
    return arv(q, {
      a: { txt: 'Sou o capataz desta gente. Os que saíram da mina estão aqui no acampamento, mas a panela está vazia. Fúlvio não paga, e o pão da cidade tem preço de ouro.', opc: [
        { t: 'Vou trazer pão para o acampamento.', ef: () => MS.iniciar('a3s2'), ir: 'b' }, { t: 'Que Santa Bárbara proteja vocês.' }] },
      b: { txt: 'Três pães já matam a fome das crianças hoje. Joana, a padeira da praça, ainda vende a preço justo.' }
    });
  };
  ARV.lourenco = () => linha('São Lourenço', 'Eis os tesouros da Igreja: os pobres.');
  // moradores de Valdouro
  R.MORADORES.forEach(([x, z, r, op, a, b]) => {
    M.criarFigura(x + R.OX, z + R.OZ, r, op);
    let k = 0; ARV[op.id] = () => linha(op.nome, F().ato3_fim ? 'As portas de Valdouro estão abertas de novo. Até a água do poço é de todos.' : (k++ % 2) ? b : a);
  });
  if (OV.vida) {
    Object.assign(OV.vida.PASSEIO, { mor_minas1: 5, mor_minas2: 4, mor_minas3: 5 });
    Object.assign(OV.vida.SINAL, {
      elias: () => (MS.ativa('a3m1') && MS.etapa('a3m1') <= 1) || (MS.ativa('a3m2') && MS.etapa('a3m2') === 1) || (MS.ativa('a3m3') && MS.etapa('a3m3') === 2) || MS.ativa('a3s3') ? '?' : null,
      fulvio: () => (MS.ativa('a3m3') && MS.etapa('a3m3') === 1) ? '?' : null,
      rosa: () => !st('a3s1') && MS.feita('a3m1') ? '!' : (MS.ativa('a3s1') && F().lamparina) ? '?' : null,
      bras: () => !st('a3s2') && MS.feita('a3m1') ? '!' : (MS.ativa('a3s2') && IT.qtd('pao') >= 3) ? '?' : null,
      joana: () => (MS.ativa('a3s2') && IT.qtd('pao') < 3) ? '?' : null
    });
    OV.vida.santosLuz.push('lourenco');
  }
  if (IT) { IT.SACERDOTES.elias = 'Padre Elias'; IT.criarCapela(R.CAPELA.x + R.OX, R.CAPELA.z + R.OZ, Math.atan2(-R.CAPELA.x, 58 - R.CAPELA.z), 'Capela do Peregrino (Valdouro)'); }

  /* ================= SÃO LOURENÇO, COMO A IGREJA O RETRATA ================= */
  // diácono jovem: alva branca, dalmática vermelha dos mártires, a grelha numa mão e a palma na outra
  if (OV.modeloSanto) {
    OV.modeloSanto.lourenco = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a2a14); m.emissiveIntensity = 0.6; return m; };
      const alva = bri(sm(0xf0ece2)), dalm = bri(sm(0xa01818)), ouro = bri(sm(0xd8b048, { metalness: 0.6, roughness: 0.35 })), pele = bri(sm(0xd8b498)), cabelo = bri(sm(0x3a2614)), ferro = sm(0x3a3a3e, { metalness: 0.6 }), palma = bri(sm(0x3a7a3a));
      gr.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.45, 8), alva, 0, 0.95, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.86, 1.05, 0.46), dalm, 0, 1.45, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.88, 0.07, 0.48), ouro, 0, 1.2, 0)); gr.add(mesh(new THREE.BoxGeometry(0.88, 0.07, 0.48), ouro, 0, 1.0, 0));
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), pele, 0, 2.02, 0.03));
      const cab = mesh(new THREE.TorusGeometry(0.17, 0.06, 6, 14), cabelo, 0, 2.1, 0); cab.rotation.x = Math.PI / 2; gr.add(cab); // tonsura
      const gre = new THREE.Group(); gre.position.set(-0.45, 1.3, 0.25);
      gre.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), ferro, 0, 0.3, 0)); gre.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), ferro, 0, -0.3, 0));
      for (let i = 0; i < 5; i++) gre.add(mesh(new THREE.BoxGeometry(0.03, 0.6, 0.03), ferro, -0.2 + i * 0.1, 0, 0));
      gre.add(mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), ferro, 0, -0.55, 0)); gr.add(gre);
      const pa = new THREE.Group(); pa.position.set(0.42, 1.2, 0.2);
      pa.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), palma, 0, 0.4, 0));
      for (let i = 0; i < 6; i++) { const f = mesh(new THREE.BoxGeometry(0.2, 0.03, 0.06), palma, (i % 2 ? 1 : -1) * 0.08, 0.5 + i * 0.08, 0); f.rotation.z = (i % 2 ? -1 : 1) * 0.5; pa.add(f); }
      gr.add(pa);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.34, -0.1); gr.add(h);
    };
    if (OV.vida) OV.vida.vestirSanto('lourenco', 'lourenco');
  }
})(window.OV);

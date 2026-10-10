/* Ordo Virtutum — Ato II: os Portos do Festim. Missões, vícios da gula, São Nicolau, o Senhor do Banquete e a Lâmpada da Temperança */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const MS = OV.missoes, PT = OV.porto, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, H = OV.habilidades, T = OV.tempo;
  const sm = OV.sm, mesh = OV.mesh;
  const OZ = PT.OZ;
  const A2 = { jejum: false }; OV.ato2 = A2;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, res, g, linha, denarios, ARV } = MS;
  const W = PT.W;
  const C = () => OV.combate;
  const den = () => (P.pers.denarios || 0);
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  M.spawnsMundo.push(...PT.spawnsMundo);

  /* ================= MISSÕES DO ATO II ================= */
  const GL = [[-8.8, -7], [-5.2, -1], [-1.6, -8.5], [1.6, 1], [5.2, -5.5], [8.8, 0]];
  const livres = () => (F().glutoes || []).length;
  Object.assign(MS.MIS, {
    a2m1: { ato: 2, nome: 'Rumo aos Portos do Festim', tipo: 'p', xp: 60, etapas: ['Siga a estrada ao sul da Vila de São Roque até os Portos do Festim. A placa fica no fim da estrada.', 'Procure Frei Gaspar, dentro da Igreja de São Nicolau, no alto da cidade.', 'Acenda a vela do Oratório de São Nicolau, ao lado da igreja.'] },
    a2m2: { ato: 2, nome: 'O Banquete sem Fim', tipo: 'p', xp: 140, etapas: [() => `Liberte os glutões da Praça do Banquete (${livres()}/6).`, 'Volte a Frei Gaspar.'] },
    a2m3: { ato: 2, nome: 'Os Celeiros Fechados', tipo: 'p', xp: 160, etapas: ['Investigue os celeiros do Barão, a leste do mercado.', 'Confronte o Barão Otávio, na casa do alto, a nordeste da praça.', 'Conte a Frei Gaspar o que aconteceu.'] },
    a2m4: { ato: 2, nome: 'O Farol de São Nicolau', tipo: 'p', xp: 150, etapas: ['Vá ao farol, no promontório a oeste do cais, e reze aos pés dele.', 'Jejue e vigie: resista aos Corvos da Fome.'] },
    a2m5: { ato: 2, nome: 'O Senhor do Banquete', tipo: 'p', xp: 350, etapas: [
      () => T.ehNoite() ? 'É noite: vá à Praça do Banquete e enfrente o convidado do trono.' : 'Espere a noite e vá à Praça do Banquete. Num Oratório aceso você pode velar até o anoitecer.',
      'Vença o Senhor do Banquete. Quebre as travessas que o alimentam.', 'Vá à Igreja de São Nicolau para a Missa.'] },
    a2s1: { ato: 2, nome: 'As Redes de Mestre Pedro', tipo: 's', xp: 70, etapas: ['Livre as redes do píer comprido das Larvas da Gula.', 'Volte a Mestre Pedro.'] },
    a2s2: { ato: 2, nome: 'A Panela de Lúcia', tipo: 's', xp: 80, etapas: ['Consiga um saco de farinha para Lúcia: compre de Rufino, no mercado, ou busque nos celeiros quando estiverem abertos.', 'Leve a farinha a Lúcia, no Bairro dos Pobres.'] },
    a2s3: { ato: 2, nome: 'O Grumete', tipo: 's', xp: 60, etapas: ['Ajude Tiago a matar a fome.'] },
    a2s4: { ato: 2, nome: 'As Moedas de Mamom', tipo: 's', xp: 90, etapas: ['Decida o destino do cofre do Barão, no pátio da casa dele.', 'Leve as moedas à Velha Ana, no Bairro dos Pobres.'] }
  });
  MS.aposAto1 = () => setTimeout(() => { if (!st('a2m1')) MS.iniciar('a2m1'); }, 400);
  function concluirA2m1() {
    MS.concluir('a2m1');
    setTimeout(() => { MS.iniciar('a2m2'); if (livres() >= 6) MS.avancar('a2m2', 1); }, 1500);
  }
  const iniciarA2m5 = () => setTimeout(() => MS.iniciar('a2m5'), 1400);

  /* ================= OS VÍCIOS DA GULA ================= */
  function makeGlutao() {
    const b = OV.makePossesso(0x6a2e1a, false)();
    b.g.children[0].scale.set(1.5, 1, 1.5); b.g.children[1].scale.set(1.4, 1, 1.5);
    b.saia.L.scale.set(1.45, 1, 1.45); b.saia.R.scale.set(1.45, 1, 1.45); b.marchaO = { A: 0.36, K: 0.55, bob: 0.09 }; b.ginga = 0.05;
    b.armR.add(mesh(new THREE.SphereGeometry(0.17, 6, 5), PT.MAT.assado, 0, -0.86, 0.06));
    return b;
  }
  function makeCorvo() {
    const g = new THREE.Group();
    const body = sm(0x141216, { emissive: 0x050308 }), bico = sm(0xb08a2a, { emissive: 0x2a1a00 }), asa = sm(0x0e0c10, { side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff4a2a });
    const corpo = mesh(new THREE.SphereGeometry(0.32, 7, 6), body, 0, 0.9, 0); corpo.scale.set(0.9, 0.85, 1.4); g.add(corpo);
    g.add(mesh(new THREE.SphereGeometry(0.2, 7, 6), body, 0, 1.12, 0.38));
    const b = mesh(new THREE.ConeGeometry(0.07, 0.3, 4), bico, 0, 1.08, 0.64); b.rotation.x = Math.PI / 2; g.add(b);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.09 * s, 1.17, 0.52); g.add(e); });
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.42), body, 0, 0.92, -0.52));
    const arm = s => { const p = new THREE.Group(); p.position.set(0.22 * s, 1.0, 0); const w = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.5), asa); w.position.set(0.47 * s, 0, 0); w.rotation.x = -Math.PI / 2; p.add(w); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [body], eye, eyeBase: 0xff4a2a };
  }
  function makeLarvaGula() {
    const b = OV.FOES.larva.build();
    b.mats[0].color.setHex(0x6a3a44); b.mats[0].emissive.setHex(0x160408);
    b.eye.color.setHex(0xff8ab0); b.eyeBase = 0xff8ab0;
    b.g.scale.set(1.15, 1.15, 1.15);
    return b;
  }
  function makeSenhor() {
    const g = new THREE.Group();
    const veludo = sm(0x4a0c12, { emissive: 0x1a0204 }), pele = sm(0x8a6a50, { emissive: 0x100500 }), ouro = sm(0xc9a24a, { metalness: 0.8, roughness: 0.3, emissive: 0x2a1a00 }), negro = sm(0x0a0606);
    const eye = new THREE.MeshBasicMaterial({ color: 0xffb02a });
    const barriga = mesh(new THREE.SphereGeometry(1.35, 10, 8), veludo, 0, 1.75, 0.1); barriga.scale.set(1.15, 1.05, 1.05); g.add(barriga);
    // pernas grossas de veludo, que pisam pesado
    const pernasS = OV.andar.pernas(g, 0.52, 1.0, { coxa: 0.52, canela: 0.46, larg: 0.46, mat: veludo, matPe: negro, pe: [0.5, 0.14, 0.72] });
    const colar = mesh(new THREE.TorusGeometry(0.62, 0.1, 6, 16), ouro, 0, 2.85, 0.1); colar.rotation.x = Math.PI / 2; g.add(colar);
    g.add(mesh(new THREE.SphereGeometry(0.55, 9, 7), pele, 0, 3.3, 0.15));
    g.add(mesh(new THREE.BoxGeometry(0.62, 0.2, 0.12), negro, 0, 3.08, 0.66));
    [-0.2, -0.07, 0.07, 0.2].forEach(x => { const d = mesh(new THREE.ConeGeometry(0.04, 0.12, 4), ouro, x, 3.15, 0.7); d.rotation.x = Math.PI; g.add(d); });
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.075, 5, 4), eye); e.position.set(0.19 * s, 3.43, 0.6); g.add(e); });
    g.add(mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.32, 8, 1, true), ouro, 0, 3.86, 0.1));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(mesh(new THREE.ConeGeometry(0.07, 0.3, 4), ouro, Math.cos(a) * 0.43, 4.15, 0.1 + Math.sin(a) * 0.43)); }
    const arm = (s, item) => {
      const p = new THREE.Group(); p.position.set(1.3 * s, 2.7, 0.1);
      p.add(mesh(new THREE.CylinderGeometry(0.24, 0.2, 1.5, 7), veludo, 0, -0.7, 0));
      p.add(mesh(new THREE.SphereGeometry(0.24, 6, 5), pele, 0, -1.5, 0));
      p.add(item); g.add(p); return p;
    };
    const cutelo = new THREE.Group(); cutelo.position.set(0, -1.7, 0.2);
    cutelo.add(mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), negro, 0, 0, 0)); cutelo.add(mesh(new THREE.BoxGeometry(0.06, 0.55, 0.7), ouro, 0, -0.45, 0.25));
    const taca = new THREE.Group(); taca.position.set(0, -1.75, 0.15);
    taca.add(mesh(new THREE.CylinderGeometry(0.22, 0.06, 0.35, 8), ouro, 0, 0.1, 0));
    return { g, armL: arm(-1, taca), armR: arm(1, cutelo), mats: [veludo, pele], eye, eyeBase: 0xffb02a, pernas: pernasS, passada: 1.0, marchaO: { A: 0.3, K: 0.5, bob: 0.12 }, ginga: 0.06 };
  }
  function makeTravessa() {
    const g = new THREE.Group();
    const madeira = sm(0x3a2416), ouro = sm(0xc9a24a, { metalness: 0.85, roughness: 0.3, emissive: 0x3a2400 }), comida = sm(0x7a3a1a, { emissive: 0x200800 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffc860 });
    g.add(mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 8), madeira, 0, 0.45, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.78, 0.6, 0.1, 12), ouro, 0, 0.95, 0));
    const c = mesh(new THREE.SphereGeometry(0.36, 7, 5), comida, 0, 1.15, 0); c.scale.set(1.3, 0.7, 1); g.add(c);
    [[-0.4, 0.2], [0.4, -0.2], [0.1, 0.45]].forEach(([x, z]) => g.add(mesh(new THREE.SphereGeometry(0.1, 5, 4), PT.MAT.fruta, x, 1.06, z)));
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), eye); gema.position.y = 1.65; g.add(gema);
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [ouro, comida], eye, eyeBase: 0xffc860 };
  }
  const FO = OV.FOES;
  FO.glutao = { key: 'glutao', name: 'Glutão possuído', nivel: 6, build: makeGlutao, hp: 110, speed: 3.0, dmg: 11, windup: 0.6, recover: 0.8, range: 1.9, r: 0.55, height: 2.3, knock: 0.8, stagger: true, xp: 30, aggro: 9, leash: 18, liberta: true, moedas: [2, 5], status: 'gula' };
  FO.corvo = { key: 'corvo', name: 'Corvo da Fome', nivel: 6, build: makeCorvo, hp: 44, speed: 5.4, dmg: 8, windup: 0.32, recover: 0.55, range: 1.5, r: 0.35, height: 1.5, knock: 1.4, stagger: true, xp: 15, mundo: true, aggro: 14, leash: 26, voa: true, moedas: [1, 3], status: null,
    ia: e => { const f = Math.sin(e.ph * 4) * 0.7; e.armL.rotation.z = f; e.armR.rotation.z = -f; } };
  FO.larva_gula = Object.assign({}, FO.larva, { key: 'larva_gula', name: 'Larva da Gula', nivel: 6, build: makeLarvaGula, hp: 55, dmg: 9, status: 'gula', xp: 22 });
  FO.travessa = { key: 'travessa', name: 'Travessa do Banquete', nivel: 9, build: makeTravessa, hp: 90, speed: 0, dmg: 0, windup: 9, recover: 1, range: 0, r: 0.65, height: 1.8, knock: 0, stagger: false, xp: 10, aggro: 0, leash: 99, fixo: true, status: null,
    quebra: () => !!F().graca_nicolau, ia: e => { e.state = 'idle'; e.g.rotation.y += 0.01; } };
  FO.senhor = { key: 'senhor', name: 'Senhor do Banquete', nivel: 10, build: makeSenhor, hp: 1400, speed: 2.7, dmg: 28, windup: 0.78, recover: 0.85, range: 3.0, r: 1.25, height: 4.5, knock: 0.1, stagger: false, xp: 350, aggro: 40, leash: 45, status: 'gula', chefe: true,
    fall: 'O Senhor do Banquete foi vencido. Que reine a Temperança.', ia: (e, dt) => iaSenhor(e, dt) };

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  MS.ganchos.aplicar.push(() => {
    const f = F(), fig = M.figuras;
    if (f.ato1_fim && !st('a2m1')) prog().missoes.a2m1 = { e: 0, fim: false, res: null };
    fig.nicolau.mostrar(false);
    if (MS.feita('a2s3')) { const q = W(13.4, 31.2); fig.tiago.ir(q.x, q.z, 0.5); };
    if (f.senhor_vencido) { const q = W(2.6, -26.5); fig.barao.ir(q.x, q.z, 0.1); }
    PT.acenderFarol(!!f.ato2_fim);
    PT.comida.forEach(m => { m.visible = !f.senhor_vencido; });
    visuais();
    resetarChefe();
  });
  function visuais() { const ok = MS.feita('a2s2'); PT.fogoLucia.visible = ok; PT.luzLucia.int = ok ? 1.3 : 0; }
  MS.ganchos.spawn.push(() => {
    const f = F();
    ['glutao', 'celeiro', 'redes', 'jejum'].forEach(MS.tagRemove);
    const livresIdx = f.glutoes || [];
    if (!MS.feita('a2m2')) GL.forEach(([x, z], i) => { if (livresIdx.includes(i)) return; const e = I.spawn('glutao', false, W(x, z)); e.tag = 'glutao'; e.gi = i; e.g.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; });
    if (!f.livro && !MS.feita('a2m3')) [[52, -14], [56.5, -13], [60, -10.5], [49.5, -2.5]].forEach(([x, z]) => { const e = I.spawn('corvo', false, W(x, z)); e.tag = 'celeiro'; e.mundo = false; });
    if (MS.ativa('a2s1') && MS.etapa('a2s1') === 0) [[14, 38], [14.4, 43], [13.6, 48]].forEach(([x, z]) => { const e = I.spawn('larva_gula', false, W(x, z)); e.tag = 'redes'; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.livro && !MS.feita('a2m3')) inv.push('Livro de contas do Barão');
    if (f.farinha && !MS.feita('a2s2')) inv.push('Saco de farinha para Lúcia');
    if (f.pao_tiago && !MS.feita('a2s3')) inv.push('Pão quente');
    if (MS.ativa('a2s4') && MS.etapa('a2s4') === 1) inv.push('Moedas do cofre do Barão (para o bairro)');
    if (f.moedas_mamom) inv.push('Moedas de olhos de ouro');
    if (f.graca_nicolau) inv.push('Graça de Nicolau (as travessas do banquete quebram com um golpe)');
    if (f.sopa_lucia) inv.push('Sopa de Lúcia (+15 de vida máxima)');
    if (f.concha) inv.push('Concha de peregrino (+10% de velocidade)');
  });

  /* ================= VIAGEM ENTRE REGIÕES ================= */
  A2.viajarRegiao = function (dest) {
    if (I.vivos().some(e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 10)) { ui.toast('Não é possível seguir viagem com vícios por perto.'); return; }
    ui.clarao('#000000');
    C().resetAcoes(); C().limparEfeitos();
    if (dest === 'porto') { C().posicionar(PT.ENTRADA.x, PT.ENTRADA.z, PT.ENTRADA.facing); OV.cam.yaw = Math.PI; }
    else { C().posicionar(M.INICIO.x, M.INICIO.z, Math.PI); OV.cam.yaw = 0; }
    OV.cam.pitch = 0.3; H.trazerAliados(); J().mudouLugar();
    T.definir(T.hora + 3);
    ui.toast(dest === 'porto' ? 'Depois de horas de estrada, o cheiro de sal e de assado anuncia os Portos do Festim.' : 'Você sobe a estrada de volta ao Vale de Santa Sabina.');
  };
  A2.textoEstradaSul = () => F().ato1_fim ? 'Seguir a estrada para os Portos do Festim' : 'Ler a placa da estrada';
  A2.estradaSul = function () {
    if (F().ato1_fim) { A2.viajarRegiao('porto'); return; }
    ui.fala('Placa da estrada', 'Para o sul: Portos do Festim. A estrada é longa, e ainda há trabalho a fazer no vale.');
  };

  /* ================= OBJETOS DO PORTO ================= */
  A2.textoIgreja = () => (MS.ativa('a2m5') && MS.etapa('a2m5') === 2) ? 'Entrar para a Missa' : 'Entrar na Igreja de São Nicolau';
  A2.igreja = function () {
    if (MS.ativa('a2m5') && MS.etapa('a2m5') === 2) { missa2(); return; }
    ui.fala('Igreja de São Nicolau', F().ato2_fim ? 'Sobre o altar, o cálice novo brilha ao lado do ícone. Pescadores rezam antes de sair ao mar.' : 'Uma igreja de pescadores. No altar, um ícone de São Nicolau segura três bolsas de ouro: o dote que ele deu, às escondidas, a três moças pobres.');
  };
  A2.textoLivro = () => (MS.ativa('a2m3') && MS.etapa('a2m3') === 0) ? 'Examinar o livro de contas' : null;
  A2.livro = function () {
    if (I.porTag('celeiro').some(vivo)) { ui.toast('Os Corvos da Fome guardam os celeiros.'); return; }
    D.falas([
      ['Livro de contas do Barão', '"Trigo recebido no porto: quarenta carros. Servido ao banquete: oito. Vendido ao bairro: nenhum."'],
      ['Livro de contas do Barão', '"Ordem do senhor Barão: os celeiros ficam trancados. O que sobrar, que apodreça. O convidado prefere assim."'],
      ['Anjo da Guarda', 'O trigo apodrece trancado enquanto o bairro passa fome. Leve isto ao Barão, na casa do alto.']
    ], () => { F().livro = true; MS.avancar('a2m3', 1); });
  };
  A2.textoFarinha = () => !F().pao_pobres ? 'Examinar a porta do celeiro' : (MS.ativa('a2s2') && !F().farinha) ? 'Pegar um saco de farinha' : null;
  A2.farinha = function () {
    if (!F().pao_pobres) { ui.fala('Celeiros do Barão', 'A porta está trancada com corrente. De dentro vem um cheiro de trigo podre.'); return; }
    F().farinha = true; MS.avancar('a2s2', 1); ui.fala('Celeiros do Barão', 'Os celeiros estão abertos, e as famílias do bairro carregam sacos para casa. Você separa um saco de farinha boa para Lúcia.');
  };
  A2.textoCofre = () => (MS.ativa('a2s4') && MS.etapa('a2s4') === 0) ? 'Abrir o cofre do Barão' : null;
  A2.cofre = function () {
    D.abrir(arv('Cofre do Barão', {
      a: { txt: 'Dentro do cofre há dezenas de moedas cunhadas com um rosto de olhos de ouro, iguais às que Lia encontrou no carvão do vale. São frias, e pesam mais do que deveriam.', opc: [
        { t: 'Levar as moedas à Velha Ana, para que sejam repartidas no bairro.', ef: () => MS.avancar('a2s4', 1), ir: 'b' },
        { t: 'Guardar as moedas. Dinheiro é dinheiro. (+60 denários)', ef: () => { denarios(60); F().moedas_mamom = true; MS.concluir('a2s4', 'guardou'); }, ir: 'c' }] },
      b: { quem: 'Anjo da Guarda', txt: 'Bem escolhido. O que foi tirado dos pobres volta para eles.' },
      c: { quem: 'Anjo da Guarda', txt: 'Essas moedas têm o rosto de Mamom. Cuidado: onde está o seu tesouro, aí estará o seu coração.' }
    }));
  };
  A2.textoFarol = () => (MS.ativa('a2m4') && MS.etapa('a2m4') === 0) ? 'Rezar aos pés do farol' : (F().ato2_fim ? 'Olhar a luz do farol' : 'Olhar o farol');
  A2.farol = function () {
    if (MS.ativa('a2m4') && MS.etapa('a2m4') === 0) { visaoNicolau(); return; }
    ui.fala('Farol de São Nicolau', F().ato2_fim ? 'A Lâmpada da Temperança gira no alto da torre. Lá embaixo, os barcos voltam ao porto guiados por ela.' : 'A torre está apagada há semanas. Sem a luz, os navios de trigo não se arriscam a entrar no porto à noite.');
  };
  A2.textoTrono = () => (MS.ativa('a2m5') && MS.etapa('a2m5') === 0) ? 'Aproximar-se do trono' : 'Olhar o trono';
  A2.trono = function () {
    if (MS.ativa('a2m5') && MS.etapa('a2m5') === 0) { if (T.ehNoite()) desafiar(); else ui.fala('Trono da cabeceira', 'O trono está vazio. O convidado só se senta à mesa depois das Vésperas. Num Oratório aceso você pode velar até o anoitecer.'); return; }
    ui.fala('Trono da cabeceira', F().senhor_vencido ? 'O veludo está rasgado e o ouro, fosco. Ninguém mais quer sentar ali.' : 'Um trono de veludo e ouro na cabeceira das mesas. À noite, dizem, alguém se senta nele.');
  };

  /* ================= SÃO NICOLAU E O JEJUM ================= */
  function visaoNicolau() {
    ui.clarao('#fff6dc'); M.figuras.nicolau.mostrar(true); A.bell(523, 0.2);
    D.abrir(arv('São Nicolau', {
      a: { txt: () => `Paz a você, ${g('filho', 'filha')}. Fui bispo de Mira, uma cidade de portos como esta. Houve um ano em que a fome chegou, e os navios carregados de trigo passavam ao largo, rumo ao imperador.`, prox: 'b' },
      b: { txt: 'Pedi aos marinheiros uma parte da carga. Tinham medo de que faltasse na conta. Deram, e ao chegar ao destino nenhum grão faltava. Deus não se deixa vencer em generosidade.', prox: 'c' },
      c: { txt: 'O demônio que se senta à mesa do Barão não tem fome de pão: ele se alimenta da fome dos outros. Cada travessa daquela mesa é uma mesa tirada dos pobres. Quebre-as, e ele não terá mais do que viver.',
        prox: () => (F().graca_nicolau || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('São Nicolau', 'equipamentos',
        'Eu tinha herdado uma fortuna, e a dei em segredo: três bolsas de ouro pela janela de um pai que não tinha como casar as filhas. Se quer a graça de quebrar a mesa dele, dê primeiro: tudo o que você leva equipado vai para os pobres do bairro, sem que ninguém saiba de onde veio.',
        () => { F().graca_nicolau = true; setTimeout(() => ui.toast('Você recebeu a Graça de Nicolau: as travessas do banquete se quebram com um só golpe.'), 1800); }, 'd',
        'Deus não se deixa vencer em generosidade, mas também não obriga ninguém a dar. Sem a graça, as travessas resistirão aos seus golpes. Lute com paciência.') : {}),
      d: { txt: 'Quer jejuar comigo esta noite? O jejum ensina o corpo a obedecer à alma. Mas os Corvos da Fome virão, e até o fim da vigília você renunciará à Ave-Maria.', opc: [
        { t: 'Jejuar e vigiar com São Nicolau.', ef: () => MS.avancar('a2m4', 1), ir: 'v' },
        { t: 'Agora não. Vou à praça.', ef: () => { MS.concluir('a2m4', 'desceu'); iniciarA2m5(); }, ir: 'x' }] },
      v: { txt: 'Então vigie. Eles vêm em três levas. Quando a fome apertar, lembre-se de quem não tem pão.', depois: () => iniciarJejum() },
      x: { txt: 'Vá em paz. O convidado do trono só se senta à mesa depois das Vésperas.', depois: () => setTimeout(() => M.figuras.nicolau.mostrar(false), 800) }
    }));
  }
  const jj = { ativa: false, onda: 0, espera: 0 };
  function iniciarJejum() {
    jj.ativa = true; A2.jejum = true; jj.onda = 0; jj.espera = 1.5;
    if (!T.ehNoite()) T.definir(21);
    ui.clarao('#0a0608'); ui.toast('A noite cai sobre o promontório. Você jejua.');
  }
  function atualizarJejum(dt) {
    if (!jj.ativa) return;
    if (I.porTag('jejum').some(vivo)) return;
    jj.espera -= dt; if (jj.espera > 0) return;
    if (jj.onda >= 3) {
      jj.ativa = false; A2.jejum = false;
      if (P.pers.virt.temperanca < OV.MAX_VIRTUDE) P.pers.virt.temperanca++;
      C().recalcular(); MS.ato('temperanca');
      ui.banner('O jejum'); ui.toast('Você venceu a fome. Sua Temperança se fortaleceu (+1).');
      MS.concluir('a2m4', 'jejum'); iniciarA2m5();
      setTimeout(() => M.figuras.nicolau.mostrar(false), 2500);
      return;
    }
    jj.onda++; jj.espera = 2.5;
    ui.toast(`Jejum: ${['primeira', 'segunda', 'terceira'][jj.onda - 1]} leva dos Corvos da Fome`);
    const n = 3 + jj.onda - 1;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn('corvo', true, W(-66 + Math.cos(a) * 7.5, 38 + Math.sin(a) * 6)); e.tag = 'jejum'; e.mundo = false;
    }
  }

  /* ================= O SENHOR DO BANQUETE ================= */
  const chefe = { ativo: false, fase: 0, slamT: 0, slam: 0, falando: false, linhas: [], b: null };
  A2.chefe = chefe;
  const TRAV = [[-12.5, 11], [12.5, 11], [-8.5, 21], [8.5, 21]];
  const matLinha = new THREE.LineBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.55 });
  function limparLinhas() { chefe.linhas.forEach(l => M.scene.remove(l.obj)); chefe.linhas = []; }
  function resetarChefe() {
    ['senhor', 'travessa', 'senhor_add'].forEach(MS.tagRemove);
    limparLinhas(); chefe.ativo = false; chefe.fase = 0; chefe.slam = 0; chefe.falando = false; chefe.b = null;
  }
  function desafiar() {
    if (chefe.ativo || chefe.falando) return;
    chefe.falando = true; PT.sombraTrono(false);
    const fala = () => D.abrir(arv('Senhor do Banquete', {
      a: { txt: 'Mais um convidado! Sente-se, coma. Aqui ninguém se levanta da mesa com fome... nem se levanta da mesa.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: () => 'É o demônio da gula. As travessas ao redor da praça o alimentam: quebre-as, e ele não se cura mais.' + (F().graca_nicolau ? ' A Graça de Nicolau está com você: um golpe basta para cada uma.' : ''),
        depois: () => { chefe.falando = false; iniciarChefe(); } }
    }));
    if (OV.cenas) OV.cenas.poema('senhor', { pos: W(0, 8) }, fala); else fala();
  }
  function iniciarChefe() {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1; chefe.slamT = 7;
    const b = I.spawn('senhor', !(OV.cenas && OV.cenas.trocar('senhor')), W(0, 8)); b.tag = 'senhor'; chefe.b = b;
    TRAV.forEach(([x, z]) => {
      const t = I.spawn('travessa', true, W(x, z)); t.tag = 'travessa'; t.parado = true;
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const obj = new THREE.Line(geo, matLinha); M.scene.add(obj); chefe.linhas.push({ t, obj });
    });
    MS.avancar('a2m5', 1);
    A.bell(147, 0.35); OV.jogo.shake(0.3);
  }
  function iaSenhor(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    const vivas = I.porTag('travessa').filter(vivo);
    if (vivas.length) e.hp = Math.min(e.def.hp, e.hp + 5 * vivas.length * dt);
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) {
      chefe.fase = 2;
      [[-6, 15], [6, 15], [0, 20]].forEach(([x, z]) => { const a = I.spawn('glutao', true, W(x, z)); a.tag = 'senhor_add'; a.def = Object.assign({}, a.def, { aggro: 30, leash: 40 }); });
      ui.toast('"Sirvam-se, meus convidados!" O Senhor do Banquete chama os seus comensais.'); A.bell(220, 0.25); OV.jogo.shake(0.3);
    }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; chefe.slamT = 3; tentacao(e); }
    if (chefe.fase === 3) {
      if (chefe.slam > 0) {
        chefe.slam -= dt; e.state = 'recover'; e.t = 0.6;
        if (chefe.slam <= 0) {
          const A0 = chefe.slamArea || { x: e.g.position.x, z: e.g.position.z, r: 5.6 }; chefe.slamArea = null;
          C().faisca(e.g.position.x, e.g.position.y + 0.3, e.g.position.z, 0xff9a4a); OV.jogo.shake(0.5); A.heavy && A.heavy();
          I.golpeArea(A0, 24, 'gula', e);
          chefe.slamT = 5.5;
        }
      } else {
        chefe.slamT -= dt;
        if (chefe.slamT <= 0 && (e.state === 'chase' || e.state === 'idle')) {
          chefe.slam = 1.4; e.state = 'recover'; e.t = 1.4;
          chefe.slamArea = { x: e.g.position.x, z: e.g.position.z, r: 5.6 };
          const disco = new THREE.Mesh(new THREE.CircleGeometry(5.6, 32), new THREE.MeshBasicMaterial({ color: 0xc8401a, transparent: true, opacity: 0.1, depthWrite: false }));
          disco.rotation.x = -Math.PI / 2; disco.position.set(e.g.position.x, M.altura(e.g.position.x, e.g.position.z) + 0.08, e.g.position.z);
          C().efeito([disco], 1.4, p => { disco.material.opacity = 0.1 + 0.4 * p; disco.scale.setScalar(0.3 + 0.7 * p); });
          if (I.aoFx) I.aoFx({ k: 'marca', x: chefe.slamArea.x, z: chefe.slamArea.z, r: chefe.slamArea.r, dur: 1.4, cor: 0xc8401a }); // o colega vê o mesmo círculo
          ui.toast('O Senhor do Banquete ergue o cutelo: afaste-se ou esquive!');
        }
      }
    }
  }
  function tentacao(b) {
    D.abrir(arv('Senhor do Banquete', {
      a: { txt: 'Pare. Por que lutar com fome? Sente-se, prove só um pouco. Ninguém precisa saber, e você se levantará mais forte.', opc: [
        { t: '"Nem só de pão vive o homem, mas de toda palavra que sai da boca de Deus."', ef: () => { F().tentacao = 'recusou'; MS.ato('temperanca'); I.atordoar(b, 2.5); }, ir: 'r' },
        { t: 'Só um pouco...', ef: () => { F().tentacao = 'cedeu'; P.status.gula = 25; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.2); }, ir: 'c' }] },
      r: { quem: '', txt: 'O demônio recua, cuspindo. Por um instante, ele não sabe o que fazer com alguém que não tem fome dele.' },
      c: { quem: 'Anjo da Guarda', txt: 'Você provou, e a Gula pesa sobre você. Mas ainda é tempo: levante-se e lute. O Recolhimento purifica.' }
    }));
  }
  function atualizarChefe() {
    const b = chefe.b; if (!b) return;
    chefe.linhas.forEach(l => {
      const ok = vivo(l.t) && vivo(b); l.obj.visible = ok; if (!ok) return;
      const p = l.obj.geometry.attributes.position;
      p.setXYZ(0, l.t.g.position.x, l.t.g.position.y + 1.6, l.t.g.position.z); p.setXYZ(1, b.g.position.x, b.g.position.y + 2.4, b.g.position.z); p.needsUpdate = true;
    });
    matLinha.opacity = 0.35 + 0.25 * Math.sin(performance.now() / 160);
  }
  function senhorVencido() {
    chefe.ativo = false; F().senhor_vencido = true; limparLinhas();
    I.lista.filter(e => (e.tag === 'travessa' || e.tag === 'senhor_add') && vivo(e)).forEach(e => { e.state = 'dead'; e.deadT = 0; e.lab.el.style.display = 'none'; });
    PT.comida.forEach(m => { m.visible = false; }); PT.sombraTrono(false);
    J().salvar();
    setTimeout(finalSenhor, 1800);
  }
  function finalSenhor() {
    { const q = W(2.4, 10.6); M.figuras.barao.mover(q.x, q.z, Math.PI + 0.3); }
    D.abrir(arv('Barão Otávio', {
      a: { quem: '', txt: 'O Senhor do Banquete se desfaz como fumaça gordurosa. Na mesa, a comida apodrece de uma vez. Atrás do trono, o Barão Otávio cai de joelhos.', prox: 'b' },
      b: { txt: 'Fui eu que o convidei. Ele prometeu que, enquanto houvesse banquete, eu nunca sentiria o vazio. E eu nunca estive tão vazio.', opc: [
        { t: 'Deus perdoa quem se arrepende. Venha à Missa e comece de novo.', ef: () => { F().barao_fim = 'perdao'; MS.ato('caridade'); }, ir: 'c1' },
        { t: 'Então repare o mal: abra a sua casa e a sua mesa aos pobres, todos os dias.', ef: () => { F().barao_fim = 'justica'; MS.ato('justica'); }, ir: 'c2' }] },
      c1: { txt: 'Depois de tudo... ainda há lugar para mim? Então eu vou.', prox: 'z' },
      c2: { txt: 'Todos os dias. Juro diante de São Nicolau: a minha mesa vai ser a mesa deles.', prox: 'z' },
      z: { quem: 'Anjo da Guarda', txt: 'Está feito. Vá à Igreja de São Nicolau, no alto da cidade: o porto inteiro espera pela Missa.', ef: () => { MS.avancar('a2m5', 2); J().salvar(); },
        depois: () => setTimeout(() => { const q = W(2.6, -26.5); M.figuras.barao.ir(q.x, q.z, 0.1); }, 1500) }
    }));
  }
  function missa2() {
    const f = F();
    const linhas = [
      ['', 'Pela primeira vez em semanas, a mesa da praça fica vazia, e a Igreja de São Nicolau se enche: pescadores, mercadores, as famílias do bairro.'],
      ['Frei Gaspar', 'Irmãos, comemos muito e nos saciamos pouco. Hoje recebemos o único Pão que sacia de verdade.'],
      ['Barão Otávio', f.barao_fim === 'justica' ? 'A minha casa estará aberta aos pobres todos os dias. É pouco, mas é o começo da reparação.' : 'Passei semanas sentado à mesa e nunca tive fome de Deus. Hoje tenho.']
    ];
    if (MS.feita('a2s2')) linhas.push(['Lúcia, a cozinheira', 'A panela do bairro não vai mais faltar. Quem tem fome, venha.']);
    if (MS.feita('a2s3')) linhas.push(['Tiago', 'Mestre Pedro disse que eu posso ser grumete no barco dele!']);
    linhas.push(['', 'Ao fim da Missa, todos sobem ao promontório. No alto do farol, uma chama nova se acende: a Lâmpada da Temperança volta a guiar os navios.']);
    ui.clarao('#000000');
    D.falas(linhas, () => {
      f.ato2_fim = true; MS.concluir('a2m5', f.barao_fim || 'perdao');
      PT.acenderFarol(true);
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([294, 370, 440, 370, 294][i], 0.3), t));
      setTimeout(() => {
        J().pausar(true);
        ui.fimAto(resumo2(), {
          eyebrow: 'Fim do Ato II', titulo: 'A mesa foi posta para todos',
          texto: 'A Lâmpada da Temperança arde no alto do farol de São Nicolau. A segunda das sete lâmpadas de Albária foi reacesa.',
          cite: f.moedas_mamom ? 'Na sua bolsa, as moedas de olhos de ouro pesam mais do que deviam. O Ato III leva às Minas de Mamom.' : 'Além das montanhas, nas Minas de Mamom, dizem que o ouro fala com a voz dos homens. O Ato III começa lá.'
        });
        if (MS.aposAto2) MS.aposAto2();
      }, 2600);
    });
  }
  function resumo2() {
    const f = F(), r = [];
    r.push({ justica: 'Você mostrou ao Barão o livro de contas, e os celeiros se abriram.', prudencia: 'Com prudência, você convenceu o Barão a abrir os celeiros.', caridade: 'Você pagou pelo trigo do bairro, e o Barão se envergonhou.' }[f.barao_res] || 'Os celeiros do Barão se abriram.');
    r.push(f.barao_fim === 'justica' ? 'O Barão Otávio abriu a casa e a mesa aos pobres.' : 'O Barão Otávio foi perdoado e voltou à Missa.');
    r.push(f.tentacao === 'cedeu' ? 'Você provou do banquete do demônio, e mesmo assim se levantou.' : 'Você recusou o banquete do demônio.');
    if (MS.feita('a2m4')) r.push(res('a2m4') === 'jejum' ? 'Você jejuou com São Nicolau e venceu os Corvos da Fome.' : 'Você desceu do farol sem jejuar.');
    if (MS.feita('a2s1')) r.push('As redes de Mestre Pedro voltaram a dar peixe para o bairro.');
    if (MS.feita('a2s2')) r.push('A panela de Lúcia alimenta o Bairro dos Pobres.');
    if (MS.feita('a2s3')) r.push('Tiago matou a fome e vai ser grumete.');
    if (MS.feita('a2s4')) r.push(res('a2s4') === 'repartiu' ? 'As moedas do Barão viraram pão, telhados e um cálice.' : 'Você guardou as moedas de olhos de ouro.');
    return r;
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"Faz semanas que eu como e não lembro o gosto de nada..."', '"Minha mulher... meus filhos... há quanto tempo não vou para casa?"', '"Eu tinha fome, mas não era de pão."',
    '"Que vergonha. O bairro passando fome, e eu aqui..."', '"Obrigado. Acho que vou vomitar, e depois rezar."', '"Senhor, tende piedade de mim."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && PT.ehPorto(P.pos.x, P.pos.z)) {
      if (MS.ativa('a2m1') && MS.etapa('a2m1') === 0) {
        MS.avancar('a2m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Sente o cheiro? Carne assada, vinho... e, por baixo, fome. Este porto está doente de gula. Procure o frade da Igreja de São Nicolau, no alto da cidade.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'nicolau' && MS.ativa('a2m1') && MS.etapa('a2m1') === 2) { concluirA2m1(); return false; }
    if (tipo === 'liberto' && x.tag === 'glutao') {
      x.sumir = true; f.glutoes = f.glutoes || [];
      if (!f.glutoes.includes(x.gi)) f.glutoes.push(x.gi);
      ui.toast(FRASES[(f.glutoes.length - 1) % FRASES.length]);
      if (f.glutoes.length >= 6) {
        MS.ato('caridade');
        if (MS.ativa('a2m2')) MS.avancar('a2m2', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Estão todos livres. A mesa continua posta, mas ninguém mais está preso a ela. Volte a Frei Gaspar.']]), 1600);
      }
      J().salvar();
      return true;
    }
    if (tipo === 'liberto' && x.tag === 'senhor_add') { x.sumir = true; ui.toast('O comensal libertado foge da praça.'); return true; }
    if (tipo === 'vencido' && x.def.key === 'travessa') {
      const restam = I.porTag('travessa').filter(vivo).length;
      ui.toast(restam ? `A travessa se quebra. Restam ${restam}.` : 'A última travessa se quebra. O Senhor do Banquete não se cura mais!');
      A.bell(330 + restam * 40, 0.12);
      return true;
    }
    if (tipo === 'vencido' && x.def.key === 'senhor') { senhorVencido(); return true; }
    if (tipo === 'vencido' && x.tag === 'redes' && !I.porTag('redes').some(vivo)) { MS.avancar('a2s1', 1); ui.toast('As redes estão livres. Volte a Mestre Pedro.'); return true; }
    if (tipo === 'renascer') {
      if (jj.ativa) { jj.ativa = false; A2.jejum = false; if (st('a2m4')) st('a2m4').e = 0; MS.tagRemove('jejum'); M.figuras.nicolau.mostrar(false); ui.toast('O jejum foi interrompido. Volte ao farol quando estiver pronto.'); }
      if (chefe.ativo || chefe.b) { resetarChefe(); if (MS.ativa('a2m5') && MS.etapa('a2m5') === 1) st('a2m5').e = 0; }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  let avisoDia = false;
  MS.ganchos.update.push(dt => {
    atualizarJejum(dt);
    if (P.pos.z < 400) return;
    const f = F();
    PT.sombraTrono(T.ehNoite() && !chefe.ativo && !chefe.falando && !f.senhor_vencido);
    if (chefe.ativo) atualizarChefe();
    if (MS.ativa('a2m5') && MS.etapa('a2m5') === 0 && !chefe.ativo && !chefe.falando && !P.dead) {
      const d = Math.hypot(P.pos.x, P.pos.z - W(0, 4).z) / PT.K;
      if (d < 12) {
        if (T.ehNoite()) desafiar();
        else if (!avisoDia) { avisoDia = true; ui.toast('O trono está vazio. O convidado só se senta à mesa depois das Vésperas.'); }
      } else if (d > 20) avisoDia = false;
    }
  });

  /* ================= DIÁLOGOS ================= */
  ARV.gaspar = () => {
    const f = F(), q = 'Frei Gaspar';
    if (MS.ativa('a2m1') && MS.etapa('a2m1') <= 1) return arv(q, {
      a: { txt: 'Louvado seja Nosso Senhor Jesus Cristo! Você vem do Vale de Santa Sabina? Então é verdade o que contam os tropeiros: os sinos voltaram a tocar lá em cima.', prox: 'b' },
      b: { txt: 'Aqui o mal é outro. Há semanas o Barão Otávio abriu um banquete na praça, e ninguém mais se levanta da mesa. Comem até passar mal, e comem de novo.', opc: [
        { t: 'Quem paga por tanta comida?', ir: 'c' }, { t: 'E os que não se sentam à mesa?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      c: { txt: 'O Barão. Dizem que trancou o trigo do porto nos celeiros e só dá de comer a quem se senta com ele. E à noite um convidado ocupa o trono da cabeceira. Ninguém consegue olhar para ele por muito tempo.', opc: [{ t: 'E os que não se sentam à mesa?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      d: { txt: 'No Bairro dos Pobres, a oeste, as crianças passam fome a poucos passos da mesa farta. A gula de uns é a fome de outros.', opc: [{ t: 'Quem paga por tanta comida?', ir: 'c' }, { t: 'O que posso fazer?', ir: 'e' }] },
      e: { txt: () => `Primeiro, acenda a vela do Oratório aqui ao lado da igreja. Depois desça à praça. Os comensais estão possuídos: liberte-os sem tirar a vida de ninguém. São nossos irmãos, ${g('filho', 'filha')}.`,
        ef: () => { MS.avancar('a2m1', 2); if (prog().oratorios.nicolau) concluirA2m1(); } }
    });
    if (MS.ativa('a2m1')) return linha(q, 'A vela do Oratório fica aqui ao lado, à direita da porta da igreja.');
    if (MS.ativa('a2m2') && MS.etapa('a2m2') === 1) return arv(q, {
      a: { txt: 'Seis almas livres! Choram de vergonha, e agora sentem fome de verdade. Mas a mesa continua posta... De onde vem tanta comida, se o bairro passa fome?', prox: 'b' },
      b: { txt: 'Os celeiros do Barão ficam a leste do mercado. Dizem que lá dentro o trigo apodrece. Vá ver com os seus olhos.', ef: () => { MS.concluir('a2m2'); setTimeout(() => MS.iniciar('a2m3'), 1200); } }
    });
    if (MS.ativa('a2m2')) return linha(q, 'A praça fica logo abaixo da igreja. Liberte os comensais e volte aqui.');
    if (MS.ativa('a2m3') && MS.etapa('a2m3') === 2) return arv(q, {
      a: { txt: 'Os celeiros se abriram! O pão vai chegar ao bairro hoje mesmo. Deus seja louvado.', prox: 'b' },
      b: { txt: 'Mas o convidado do trono continua lá, toda noite. O meu avô contava que São Nicolau salvou a cidade de Mira da fome. Ele é o padroeiro deste porto, e o farol foi erguido em sua honra.', prox: 'c' },
      c: { txt: 'Suba ao farol, no promontório a oeste do cais, e reze aos pés dele. Se alguém sabe vencer a fome sem pecar, é ele.', ef: () => { MS.concluir('a2m3', f.barao_res); setTimeout(() => MS.iniciar('a2m4'), 1200); } }
    });
    if (MS.ativa('a2m3')) return linha(q, MS.etapa('a2m3') === 0 ? 'Os celeiros ficam a leste do mercado. Cuidado: os Corvos da Fome fizeram ninho lá.' : 'O Barão mora na casa do alto, a nordeste da praça. Ele não é mau homem... só tem um buraco que nenhuma comida enche.');
    if (MS.ativa('a2m4')) return linha(q, 'O farol fica no promontório a oeste. Siga a beira-mar a partir do cais.');
    if (MS.ativa('a2m5') && MS.etapa('a2m5') < 2) return linha(q, () => T.ehNoite() ? 'É noite. O convidado já deve estar no trono. Vá, e que São Miguel vá à sua frente.' : 'O convidado só se senta à mesa depois das Vésperas. Reze, descanse, e vá à praça quando a noite cair.');
    if (MS.ativa('a2m5')) return linha(q, 'O altar está pronto. Entre pela porta principal: vamos celebrar a Missa.');
    if (f.ato2_fim) return linha(q, 'O farol voltou a brilhar. Dizem que nas Minas de Mamom, além das montanhas, o ouro fala com a voz dos homens. Que Deus nos guarde.');
    return linha(q, 'Que São Nicolau proteja o seu caminho.');
  };
  function decidirBarao(r) {
    F().pao_pobres = true; F().barao_res = r;
    MS.ato(r === 'prudencia' ? 'prudencia' : r === 'caridade' ? 'caridade' : 'justica');
    MS.avancar('a2m3', 2); A.bell(523, 0.15);
  }
  ARV.barao = () => {
    const f = F(), q = 'Barão Otávio';
    if (MS.ativa('a2m3') && MS.etapa('a2m3') === 1) return arv(q, {
      a: { txt: 'Uma visita! Sente-se à mesa, há lugar para todos... Ah, não veio comer. Então o que quer na minha casa?', opc: [
        { t: 'Mostrar o livro de contas: o trigo do porto apodrece trancado enquanto o bairro passa fome.', ef: () => decidirBarao('justica'), ir: 'j' },
        { t: 'Um porto faminto não tem marinheiros, e sem marinheiros não há comércio nem banquete.', cond: () => P.pers.virt.prudencia >= 7, motivo: 'Prudência 7', ef: () => decidirBarao('prudencia'), ir: 'p' },
        { t: 'Eu compro o trigo dos celeiros para o bairro. (40 denários)', cond: () => den() >= 40, motivo: 'você precisa de 40 denários', ef: () => { denarios(-40); decidirBarao('caridade'); }, ir: 'c' },
        { t: 'Ainda não. Volto depois.' }] },
      j: { txt: '...Está tudo aí, com a minha letra. Eu sabia, e fingia não saber. Pegue a chave: abra os celeiros.', prox: 'z' },
      p: { txt: 'Sem marinheiros... sem navios... Você tem razão, e eu não queria ouvir. Pegue a chave: abra os celeiros.', prox: 'z' },
      c: { txt: 'Você paga pelo que é meu para dar a quem não tem? Ninguém nunca fez isso diante de mim. Fique com metade de volta, e pegue a chave.', ef: () => denarios(20), prox: 'z' },
      z: { txt: 'Mais uma coisa. Há um cofre no pátio, cheio de moedas que um mercador do norte me deu. Desde que o abri, não consigo parar de comer. Faça com ele o que achar justo.', ef: () => MS.iniciar('a2s4') }
    });
    if (f.ato2_fim || f.senhor_vencido) return linha(q, f.barao_fim === 'justica' ? 'A minha mesa agora é a do bairro. Comemos juntos, e pela primeira vez a comida tem gosto.' : 'Vou à Missa todos os dias agora. A fome que eu sentia era de outra coisa.');
    if (f.pao_pobres) return linha(q, 'Não consigo dormir. À noite ouço o convidado do trono rindo, e sinto fome de novo.');
    return linha(q, 'Mais um peregrino! Sente-se à mesa, há lugar para todos. Bem... para todos os que se sentam.');
  };
  ARV.lucia = () => {
    const f = F(), q = 'Lúcia, a cozinheira';
    if (MS.feita('a2s2')) return linha(q, 'A panela não esvazia: quem tem, traz; quem não tem, come. É assim que deve ser.');
    if (MS.ativa('a2s2') && f.farinha) return arv(q, {
      a: { txt: 'Farinha! Deus lhe pague. Hoje o bairro come pão quente.', prox: 'b' },
      b: { txt: 'Tome a primeira tigela de sopa. Quem come com os pobres, come com Cristo.', ef: () => { f.sopa_lucia = true; C().recalcular(); MS.ato('caridade'); MS.concluir('a2s2'); visuais(); setTimeout(() => ui.toast('Sopa de Lúcia: +15 de vida máxima.'), 900); } }
    });
    if (MS.ativa('a2s2')) return linha(q, f.pao_pobres ? 'Os celeiros estão abertos! Pegue um saco de farinha lá, por favor.' : 'Rufino, o padeiro do mercado, vende farinha. Ou, se um dia os celeiros abrirem...');
    return arv(q, {
      a: { txt: 'Cozinho para o bairro desde menina. Mas o Barão fechou os celeiros, e a minha panela está vazia. Com um saco de farinha eu faço pão e sopa para todos.', opc: [
        { t: 'Vou conseguir a farinha.', ef: () => MS.iniciar('a2s2'), ir: 'b' }, { t: 'Que Deus encha a sua panela, Lúcia.' }] },
      b: { txt: 'Rufino vende no mercado, mas cobra caro. Os celeiros do Barão estão cheios, e trancados.' }
    });
  };
  ARV.rufino = () => arv('Rufino, o padeiro', {
    a: { txt: () => F().pao_pobres ? 'Agora vendo pão para o bairro também, e o Barão não reclama. Quem diria!' : 'O Barão compra todo o pão que eu faço para o banquete. Paga bem... mas o meu forno anda cheirando a culpa.', opc: [
      { t: 'Comprar um saco de farinha para Lúcia. (20 denários)', mostrar: () => MS.ativa('a2s2') && !F().farinha, cond: () => den() >= 20, motivo: 'você precisa de 20 denários', ef: () => { denarios(-20); F().farinha = true; MS.avancar('a2s2', 1); }, ir: 'b' },
      { t: 'Comprar um pão. (5 denários)', mostrar: () => MS.ativa('a2s3') && !F().pao_tiago, cond: () => den() >= 5, motivo: 'você precisa de 5 denários', ef: () => { denarios(-5); F().pao_tiago = true; }, ir: 'c' },
      { t: 'Até logo, Rufino.' }] },
    b: { txt: 'Farinha para a Lúcia? Leve, e diga a ela que o próximo saco é por minha conta.' },
    c: { txt: 'Pão de hoje, ainda quente. É para o pequeno Tiago? Então leve dois pedaços.' }
  });
  function darTiago(r) { MS.ato('caridade'); MS.concluir('a2s3', r); }
  ARV.tiago = () => {
    const q = 'Tiago';
    if (MS.feita('a2s3')) return linha(q, MS.feita('a2s1') ? 'Mestre Pedro disse que amanhã eu vou no barco com ele!' : 'Agora tenho força para remar! Só falta o Mestre Pedro deixar.');
    return arv(q, {
      a: { txt: 'Quero ser grumete no barco do Mestre Pedro, mas ele diz que estou fraco demais. É que... faz dois dias que eu não como.', ef: () => MS.iniciar('a2s3'), opc: [
        { t: 'Tome, comprei este pão para você.', mostrar: () => !!F().pao_tiago, ef: () => darTiago('pao'), ir: 'b' },
        { t: 'Vamos à panela da Lúcia: lá tem sopa para todos.', mostrar: () => MS.feita('a2s2'), ef: () => darTiago('lucia'), ir: 'b' },
        { t: 'Tome estes denários e compre pão com Rufino. (5 denários)', cond: () => den() >= 5, motivo: 'você precisa de 5 denários', ef: () => { denarios(-5); darTiago('moedas'); }, ir: 'b' },
        { t: 'Vou ver o que posso fazer.' }] },
      b: { txt: 'Obrigado! Olhe, achei isto na praia. Dizem que os peregrinos de Santiago usam. Fique com ela, para os seus caminhos.', ef: () => { F().concha = true; setTimeout(() => ui.toast('Concha de peregrino: você anda 10% mais rápido.'), 900); } }
    });
  };
  ARV.pedro = () => {
    const q = 'Mestre Pedro';
    if (MS.feita('a2s1')) return linha(q, MS.feita('a2s3') ? 'O pequeno Tiago comeu e agora rema como gente grande. Amanhã ele vem comigo.' : 'As redes estão livres. O primeiro peixe de cada dia vai para o bairro, é promessa.');
    if (MS.ativa('a2s1') && MS.etapa('a2s1') === 1) return arv(q, { a: { txt: 'As redes estão livres! Tome, é o que posso pagar. E o primeiro peixe de cada dia vai para o Bairro dos Pobres: prometo diante de São Nicolau.', ef: () => { denarios(15); MS.ato('caridade'); MS.concluir('a2s1'); } } });
    if (MS.ativa('a2s1')) return linha(q, 'As redes ficam no píer comprido, aqui ao lado. Cuidado: as larvas mordem.');
    return arv(q, {
      a: { txt: 'As redes estão cheias, mas não de peixe. Umas larvas gordas tomaram o píer e comem tudo o que a gente pesca. Desde que o banquete começou, elas não param de crescer.', opc: [
        { t: 'Eu limpo as redes para você.', ef: () => { MS.iniciar('a2s1'); MS.respawnQuest(); }, ir: 'b' }, { t: 'Boa pesca, Mestre Pedro.' }] },
      b: { txt: 'Que São Nicolau, padroeiro dos marinheiros, vá com você.' }
    });
  };
  ARV.ana = () => {
    const q = 'Velha Ana';
    if (MS.ativa('a2s4') && MS.etapa('a2s4') === 1) return arv(q, {
      a: { txt: 'Moedas do cofre do Barão, para o bairro? Vou reparti-las entre as famílias, uma por uma.', prox: 'b' },
      b: { txt: 'Mas olhe: elas têm um rosto estranho, de olhos de ouro. Vou pedir ao Frei Gaspar que as derreta e faça delas um cálice para São Nicolau. Ouro assim deve servir a Deus, e não o contrário.', ef: () => { MS.ato('caridade'); MS.ato('justica'); MS.concluir('a2s4', 'repartiu'); } }
    });
    if (res('a2s4') === 'repartiu') return linha(q, 'Com as moedas do Barão consertamos três telhados. E o cálice já está no altar.');
    return linha(q, F().pao_pobres ? 'Chegou trigo dos celeiros! Fazia tempo que eu não via as crianças rirem com a boca cheia.' : 'Aqui no bairro a gente reza a São Nicolau toda noite. O santo deu de comer a Mira; um dia há de lembrar de nós.');
  };
  ARV.marinheiro = () => linha('Marinheiro', F().ato2_fim ? 'Com a luz do farol, os navios de trigo voltaram a entrar no porto à noite. Viva São Nicolau!' : 'Dizem que no tempo de São Nicolau os navios davam trigo e nunca faltava na conta. Hoje o Barão compra tudo, e o farol está apagado.');
  ARV.nicolau = () => linha('São Nicolau', 'Deus não se deixa vencer em generosidade.');
})(window.OV);

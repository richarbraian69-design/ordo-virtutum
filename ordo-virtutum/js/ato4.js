/* Ordo Virtutum — Ato IV: a Corte das Máscaras. Missões, vícios da luxúria (tratados com sobriedade: o olhar que se perde,
   as promessas esquecidas), Santo Agostinho, Asmodeu e a Lâmpada da Castidade */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.corte) return;
  const MS = OV.missoes, R = OV.corte, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, H = OV.habilidades, T = OV.tempo, IT = OV.itens;
  const sm = OV.sm, mesh = OV.mesh;
  const A4 = {}; OV.ato4 = A4;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, res, g, linha, denarios, ARV } = MS;
  const W = R.W;
  const C = () => OV.combate;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const naRegiao = () => M.regiao(P.pos.x, P.pos.z) === 'corte';
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  M.spawnsMundo.push(...R.spawnsMundo);

  /* ================= MISSÕES DO ATO IV ================= */
  const BAILE = [[-7, -10], [7, -10], [-8, 3], [8, 3], [-4, 12], [4, 12]];
  const livres = () => (F().mascarados || []).length;
  Object.assign(MS.MIS, {
    a4m1: { ato: 4, nome: 'O Convite', tipo: 'p', xp: 120, etapas: ['Siga para a Corte das Máscaras pela placa de uma das estradas.', 'Procure Frei Bernardo, dentro da Igreja de Santo Agostinho, a oeste da praça.', 'Acenda a vela do Oratório de Belmonte, na Praça das Fontes.'] },
    a4m2: { ato: 4, nome: 'O Baile sem Fim', tipo: 'p', xp: 260, etapas: [() => `Liberte os mascarados no Palácio dos Bailes, ao norte da praça (${livres()}/6).`, 'Volte a Frei Bernardo.'] },
    a4m3: { ato: 4, nome: 'O Duque sem Rosto', tipo: 'p', xp: 280, etapas: ['Fale com a Duquesa Valéria, na Casa do Lago, a leste da praça.', 'Encontre o Duque Henrique no Jardim dos Espelhos, a oeste, e quebre o Grande Espelho.', 'Fale com o Duque Henrique.', 'Volte à Duquesa Valéria, na Casa do Lago.'] },
    a4m4: { ato: 4, nome: 'Toma e Lê', tipo: 'p', xp: 260, etapas: ['Vá ao Jardim da Figueira, a leste do palácio, e reze sob a figueira.', 'Vigie com Santo Agostinho: resista às Mariposas da Vaidade.'] },
    a4m5: { ato: 4, nome: 'Asmodeu', tipo: 'p', xp: 650, etapas: [
      () => T.ehNoite() ? 'É noite: entre no Palácio dos Bailes para o Grande Baile.' : 'Espere a noite e entre no Palácio dos Bailes. Num Oratório aceso você pode velar até o anoitecer.',
      'Vença Asmodeu. Quebre os espelhos do salão e desvie o olhar quando ele tirar a máscara.', 'Vá à Igreja de Santo Agostinho para a Missa.'] },
    a4s1: { ato: 4, nome: 'As Máscaras de Clara', tipo: 's', xp: 130, etapas: [() => `Recolha máscaras enfeitiçadas libertando mascarados (${Math.min(3, F().mascaras || 0)}/3).`, 'Leve as máscaras a Clara, no ateliê a nordeste da praça.'] },
    a4s2: { ato: 4, nome: 'O Terço do Jardineiro', tipo: 's', xp: 120, etapas: ['Encontre o terço de Mateus no canto noroeste do Jardim dos Espelhos.', 'Devolva o terço a Mateus, na entrada do jardim.'] },
    a4s3: { ato: 4, nome: 'A Carta de Inês', tipo: 's', xp: 120, etapas: ['Entregue a carta de Inês a Sebastião, o guarda do portão do palácio.', 'Volte a Inês, na casa a sudeste da praça.'] }
  });
  MS.aposAto3 = () => setTimeout(() => { if (!st('a4m1')) MS.iniciar('a4m1'); setTimeout(() => ui.toast('A estrada para a Corte das Máscaras está aberta: siga pelas placas das estradas.'), 1600); }, 400);
  function concluirA4m1() { MS.concluir('a4m1'); setTimeout(() => { MS.iniciar('a4m2'); if (livres() >= 6) MS.avancar('a4m2', 1); }, 1500); }

  /* ================= OS VÍCIOS DA CORTE ================= */
  const MASC = sm(0xf0ece4, { roughness: 0.4 }), OURO = sm(0xd8b048, { metalness: 0.85, roughness: 0.3, emissive: 0x2a1a00 });
  function makeMascarado() {
    const b = OV.makePossesso(0x4a1a4a, false)();
    b.g.add(mesh(new THREE.BoxGeometry(0.36, 0.2, 0.08), MASC, 0, 2.03, 0.2));
    const pl = mesh(new THREE.ConeGeometry(0.06, 0.6, 5), sm(0xc84a7a), 0.12, 2.35, -0.05); pl.rotation.z = -0.4; b.g.add(pl);
    // a saia do traje de baile, larga, que roda e se abre com os passos
    b.saia.L.scale.set(1.45, 1, 1.45); b.saia.R.scale.set(1.45, 1, 1.45); b.saia.mat.color.setHex(0x6a2a5a);
    return b;
  }
  function makeMariposa() {
    const g = new THREE.Group();
    const corpo = sm(0x3a2a3a, { emissive: 0x0a040a }), asa = sm(0xd8c8e0, { side: THREE.DoubleSide, emissive: 0x1a1020 }), ocelo = new THREE.MeshBasicMaterial({ color: 0x6a2a8a, side: THREE.DoubleSide });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff7ad0 });
    const c = mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.7, 6), corpo, 0, 1.1, 0); c.rotation.x = Math.PI / 2; g.add(c);
    g.add(mesh(new THREE.SphereGeometry(0.13, 6, 5), corpo, 0, 1.12, 0.38));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), eye); e.position.set(0.07 * s, 1.15, 0.48); g.add(e); });
    const arm = s => {
      const p = new THREE.Group(); p.position.set(0.08 * s, 1.15, 0); g.add(p);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.75, 10), asa); w.position.set(0.7 * s, 0, 0.05); w.rotation.x = -Math.PI / 2; w.scale.set(1, 1.3, 1); p.add(w);
      const o = new THREE.Mesh(new THREE.CircleGeometry(0.2, 10), ocelo); o.position.set(0.8 * s, 0.01, 0.15); o.rotation.x = -Math.PI / 2; p.add(o);
      return p;
    };
    return { g, armL: arm(-1), armR: arm(1), mats: [corpo, asa], eye, eyeBase: 0xff7ad0 };
  }
  function makeReflexo() {
    const g = new THREE.Group();
    const prata = sm(0xc8d0d8, { metalness: 0.45, roughness: 0.2, emissive: 0x2a3038 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xd0f0ff });
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.74, 8), prata, 0, 1.3, 0));
    const pernasR = OV.andar.pernas(g, 0.14, 0.95, { coxa: 0.47, canela: 0.43, larg: 0.17, mat: prata });
    pernasR.saia = OV.andar.saia(g, prata, 0.38, 0.48, 0.64, 0.97, 8);
    g.add(mesh(new THREE.BoxGeometry(0.62, 0.58, 0.4), prata, 0, 1.62, 0));
    g.add(mesh(new THREE.SphereGeometry(0.21, 9, 8), prata, 0, 2.04, 0.02));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), eye); e.position.set(0.08 * s, 2.06, 0.2); g.add(e); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.38 * s, 1.78, 0); p.add(mesh(new THREE.BoxGeometry(0.15, 0.72, 0.17), prata, 0, -0.36, 0)); p.add(mesh(new THREE.BoxGeometry(0.05, 0.7, 0.12), prata, 0, -0.95, 0.1)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [prata, pernasR.saia.mat], eye, eyeBase: 0xd0f0ff, pernas: pernasR, passada: 0.8 };
  }
  function makeEspelho() {
    const g = new THREE.Group();
    const vidro = sm(0xd8e0ea, { metalness: 0.35, roughness: 0.1, emissive: 0x3a4454 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff8ad8 });
    g.add(mesh(new THREE.BoxGeometry(2.4, 3.6, 0.16), vidro, 0, 2.1, 0));
    g.add(mesh(new THREE.BoxGeometry(2.7, 0.2, 0.24), OURO, 0, 4.0, 0)); g.add(mesh(new THREE.BoxGeometry(2.7, 0.2, 0.24), OURO, 0, 0.25, 0));
    [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.2, 3.9, 0.24), OURO, s * 1.3, 2.1, 0)));
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), eye); gema.position.set(0, 4.35, 0); g.add(gema);
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [vidro, OURO], eye, eyeBase: 0xff8ad8 };
  }
  function makeAsmodeu() {
    const g = new THREE.Group();
    const manto = sm(0x2a0e2a, { emissive: 0x0a020a }), seda = sm(0x6a1a5a, { emissive: 0x140410 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xff8ad8 });
    const mantoA = mesh(new THREE.ConeGeometry(1.1, 3.5, 10), manto, 0, 2.25, 0); g.add(mantoA);
    const pernasA = OV.andar.pernas(g, 0.3, 1.0, { coxa: 0.52, canela: 0.48, larg: 0.2, mat: seda, matPe: OURO, pe: [0.24, 0.1, 0.42] });
    g.add(mesh(new THREE.BoxGeometry(1.3, 1.2, 0.7), seda, 0, 3.7, 0));
    g.add(mesh(new THREE.SphereGeometry(0.45, 10, 8), manto, 0, 4.7, 0));
    const mascara = new THREE.Group(); mascara.position.set(0, 4.72, 0.38); g.add(mascara);
    mascara.add(mesh(new THREE.BoxGeometry(0.72, 0.55, 0.12), OURO, 0, 0, 0));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eye); e.position.set(0.16 * s, 0.05, 0.08); mascara.add(e); const c = mesh(new THREE.ConeGeometry(0.06, 0.5, 5), OURO, 0.36 * s, 0.32, -0.1); c.rotation.z = -0.5 * s; mascara.add(c); });
    // máscaras pequenas que giram em volta dele
    const roda = new THREE.Group(); roda.position.y = 3.2; g.add(roda);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const m = mesh(new THREE.BoxGeometry(0.32, 0.4, 0.06), MASC, Math.cos(a) * 1.8, Math.sin(i * 2) * 0.4, Math.sin(a) * 1.8); m.rotation.y = -a + Math.PI / 2; roda.add(m); }
    const arm = s => { const p = new THREE.Group(); p.position.set(0.85 * s, 4.0, 0); p.add(mesh(new THREE.CylinderGeometry(0.16, 0.13, 1.5, 7), seda, 0, -0.72, 0)); p.add(mesh(new THREE.BoxGeometry(0.06, 0.9, 0.2), OURO, 0, -1.7, 0.15)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [manto, seda], eye, eyeBase: 0xff8ad8, roda, pernas: pernasA, manto: mantoA, passada: 1.0, marchaO: { A: 0.4, K: 0.65 } };
  }
  Object.assign(I.CORES, {
    mascarado: ['Rubro', 0x6a1a2a, 'Mestre de Cerimônias Possuído', 0x1a1a3a], mariposa: ['Noturna', 0x2a2a4a, 'Mariposa-Rainha', 0xe8d070],
    reflexo: ['Escuro', 0x2a2a3a, 'Reflexo Soberbo', 0xd8b048]
  });
  const FO = OV.FOES;
  FO.mascarado = { key: 'mascarado', name: 'Mascarado possuído', nivel: 13, build: makeMascarado, hp: 170, speed: 3.6, dmg: 15, windup: 0.5, recover: 0.75, range: 2.0, r: 0.55, height: 2.4, knock: 0.8, stagger: true, xp: 48, aggro: 12, leash: 22, liberta: true, moedas: [3, 6], status: 'luxuria',
    ia: e => { if (e.state === 'chase') e.g.children[0].rotation.y += 0.2; } };
  FO.mariposa = { key: 'mariposa', name: 'Mariposa da Vaidade', nivel: 12, build: makeMariposa, hp: 62, speed: 5.0, dmg: 9, windup: 0.35, recover: 0.55, range: 1.6, r: 0.45, height: 1.6, knock: 1.3, stagger: true, xp: 26, mundo: true, aggro: 14, leash: 26, voa: true, moedas: [2, 4], status: 'luxuria',
    ia: e => { const f = Math.sin(e.ph * 5) * 0.8; e.armL.rotation.z = f; e.armR.rotation.z = -f; } };
  FO.reflexo = { key: 'reflexo', name: 'Reflexo', nivel: 13, build: makeReflexo, hp: 150, speed: 4.4, dmg: 17, windup: 0.42, recover: 0.6, range: 1.9, r: 0.5, height: 2.3, knock: 0.9, stagger: true, xp: 44, mundo: true, aggro: 13, leash: 24, moedas: [3, 5], status: null };
  FO.espelho = { key: 'espelho', name: 'O Grande Espelho', nivel: 14, build: makeEspelho, hp: 360, speed: 0, dmg: 0, windup: 9, recover: 1, range: 0, r: 1.3, height: 4.6, knock: 0, stagger: false, xp: 60, aggro: 0, leash: 99, fixo: true, status: null, ia: e => { e.state = 'idle'; } };
  FO.espelho_baile = Object.assign({}, FO.espelho, { key: 'espelho_baile', name: 'Espelho do Baile', nivel: 16, hp: 160, xp: 15, quebra: () => !!F().graca_agostinho, ia: e => { e.state = 'idle'; e.g.rotation.y += 0.006; } });
  FO.asmodeu = { key: 'asmodeu', name: 'Asmodeu, o Senhor das Máscaras', nivel: 16, build: makeAsmodeu, hp: 2600, speed: 3.4, dmg: 32, windup: 0.7, recover: 0.8, range: 2.8, r: 1.1, height: 5.6, knock: 0.15, stagger: false, xp: 700, aggro: 45, leash: 50, status: 'luxuria', chefe: true,
    fall: 'Asmodeu foi vencido. Que reine a Castidade.', ia: (e, dt) => iaAsmodeu(e, dt) };

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  function posFig() {
    const f = F(), fig = M.figuras;
    const henriqueLivre = !!f.duque_livre;
    if (henriqueLivre) { const q = W(R.HENRIQUE_CASA.x, R.HENRIQUE_CASA.z); fig.henrique.ir(q.x, q.z, R.VALERIA_ROT); }
    if (R.mascaraHenrique) R.mascaraHenrique.visible = !henriqueLivre;
    if (R.mascaraSebastiao) R.mascaraSebastiao.visible = !f.sebastiao_livre;
    if (!f.sebastiao_livre) { const q = W(R.PORTAO.x, R.PORTAO.z); fig.sebastiao.ir(q.x, q.z, -2.08); }
    else { const q = W(R.PORTAO.x, R.PORTAO.z); fig.sebastiao.ir(q.x, q.z, 0.2); }
  }
  MS.ganchos.aplicar.push(() => {
    const f = F();
    if (f.ato3_fim && !st('a4m1')) prog().missoes.a4m1 = { e: 0, fim: false, res: null };
    M.figuras.agostinho.mostrar(false);
    posFig();
    R.acenderLampada(!!f.ato4_fim);
    resetarChefe();
  });
  MS.ganchos.spawn.push(() => {
    const f = F();
    ['baile', 'espelho_jardim', 'jardim', 'labirinto', 'vigilia4'].forEach(MS.tagRemove);
    const ja = f.mascarados || [];
    if (!MS.feita('a4m2')) BAILE.forEach(([x, z], i) => { if (ja.includes(i)) return; const e = I.spawn('mascarado', false, W(R.ARENA.x + x, R.ARENA.z + z)); e.tag = 'baile'; e.bi = i; });
    if (MS.ativa('a4m3') && MS.etapa('a4m3') === 1) { const e = I.spawn('espelho', false, W(R.ESPELHO.x, R.ESPELHO.z)); e.tag = 'espelho_jardim'; e.g.rotation.y = 0; }
    if (MS.ativa('a4s2') && MS.etapa('a4s2') === 0) [[3, -3], [-2, -4], [4, 3]].forEach(([dx, dz]) => { const e = I.spawn('mariposa', false, W(R.TERCO.x + dx, R.TERCO.z + dz), { nivel: 13 }); e.tag = 'labirinto'; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.alianca && !f.duque_livre) inv.push('Aliança da Duquesa Valéria');
    if (f.carta && !f.sebastiao_livre) inv.push('Carta de Inês para Sebastião');
    if (f.terco_mateus && !MS.feita('a4s2')) inv.push('Terço de Mateus, o jardineiro');
    if (MS.ativa('a4s1')) inv.push(`Máscaras enfeitiçadas (${Math.min(3, f.mascaras || 0)}/3)`);
    if (f.graca_agostinho) inv.push('Graça de Agostinho (os espelhos do baile se quebram com um golpe, e você pressente o Fascínio)');
  });

  /* ================= OBJETOS DE BELMONTE ================= */
  A4.textoFonte = () => 'Olhar a fonte';
  A4.fonte = () => ui.fala('Fonte das Três Taças', F().ato4_fim ? 'A água corre clara. Na borda, alguém gravou: "Felizes os puros de coração, porque verão a Deus."' : 'Na água da fonte, os rostos aparecem bonitos e mascarados. Muita gente de Belmonte passa horas aqui, olhando para o próprio reflexo.');
  A4.textoIgreja = () => (MS.ativa('a4m5') && MS.etapa('a4m5') === 2) ? 'Entrar para a Missa' : 'Entrar na Igreja de Santo Agostinho';
  A4.igreja = function () {
    if (MS.ativa('a4m5') && MS.etapa('a4m5') === 2) { missa4(); return; }
    ui.fala('Igreja de Santo Agostinho', F().ato4_fim ? 'Pela porta aberta entra a luz da manhã. Duas alianças foram deixadas aos pés do altar, em ação de graças.' : 'Sobre o altar, um coração em chamas: o sinal de Santo Agostinho, que procurou Deus fora de si e o encontrou dentro.');
  };
  A4.textoTerco = () => (MS.ativa('a4s2') && MS.etapa('a4s2') === 0) ? 'Pegar o terço caído' : null;
  A4.terco = function () {
    if (I.porTag('labirinto').some(vivo)) { ui.toast('As Mariposas da Vaidade rondam o canto do jardim.'); return; }
    F().terco_mateus = true; MS.avancar('a4s2', 1); A.bell(587, 0.12);
    ui.fala('Jardim dos Espelhos', 'Entre as folhas secas, um terço de contas de oliveira, gasto de tanto uso. Na cruz, alguém gravou um nome: Mateus.');
  };
  A4.textoFigueira = () => (MS.ativa('a4m4') && MS.etapa('a4m4') === 0) ? 'Rezar sob a figueira' : 'Sentar-se sob a figueira';
  A4.figueira = function () {
    if (MS.ativa('a4m4') && MS.etapa('a4m4') === 0) { visaoAgostinho(); return; }
    ui.fala('Jardim da Figueira', 'No banco de pedra há um livro aberto nas cartas de São Paulo. Uma frase está sublinhada: "Revesti-vos do Senhor Jesus Cristo."');
  };

  /* ================= SANTO AGOSTINHO E A VIGÍLIA ================= */
  function visaoAgostinho() {
    ui.clarao('#fff6dc'); M.figuras.agostinho.mostrar(true); A.bell(523, 0.2);
    D.abrir(arv('Santo Agostinho', {
      a: { txt: () => `A paz esteja com você, ${g('meu filho', 'minha filha')}. Passei a juventude procurando a felicidade nas coisas belas que Deus criou, e me esquecia de quem as criou.`, prox: 'b' },
      b: { txt: 'Num jardim como este, debaixo de uma figueira, eu chorava sem saber sair de mim. Ouvi uma criança cantar: "Toma e lê, toma e lê." Abri as cartas de Paulo, e li: "Revesti-vos do Senhor Jesus Cristo."', prox: 'c' },
      c: { txt: 'Tarde te amei, Beleza tão antiga e tão nova! Tu estavas dentro de mim, e eu fora. O demônio do palácio vive dos olhares que se perdem: nos espelhos dele, cada um só vê a si mesmo, e esquece quem ama.',
        prox: () => (F().graca_agostinho || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('Santo Agostinho', 'mochila',
        'Quando me converti, vendi o que tinha e dei aos pobres. As coisas belas não eram más: eu é que me agarrava a elas. Deixe aqui, ao pé da figueira, tudo o que carrega na mochila. Com as mãos vazias, os olhos aprendem a ver.',
        () => { F().graca_agostinho = true; setTimeout(() => ui.toast('Você recebeu a Graça de Agostinho: os espelhos do baile se quebram com um golpe, e você pressente o Fascínio de longe.'), 1800); }, 'd',
        'Eu também demorei. «Dá-me a castidade, mas não agora», eu rezava. Sem a graça, os espelhos vão resistir, e o Fascínio vai pegar você de surpresa.') : {}),
      d: { txt: 'Quando ele tirar a máscara, não olhe para ele. Guardar os olhos não é medo: é saber o que se ama. Quer vigiar comigo esta noite? As Mariposas da Vaidade virão rondar a luz.', opc: [
        { t: 'Vigiar com Santo Agostinho.', ef: () => MS.avancar('a4m4', 1), ir: 'v' },
        { t: 'Agora não. Vou ao palácio.', ef: () => { MS.concluir('a4m4', 'desceu'); iniciarA4m5(); }, ir: 'x' }] },
      v: { txt: 'Então vigie. Elas vêm em três levas. Quando a vista turvar, reze: a oração limpa os olhos.', depois: () => iniciarVigilia() },
      x: { txt: 'Vá em paz. Inquieto está o nosso coração, enquanto não repousa em Deus.', depois: () => setTimeout(() => M.figuras.agostinho.mostrar(false), 800) }
    }));
  }
  const iniciarA4m5 = () => setTimeout(() => MS.iniciar('a4m5'), 1400);
  const vg = { ativa: false, onda: 0, espera: 0 };
  function iniciarVigilia() { vg.ativa = true; vg.onda = 0; vg.espera = 1.5; if (!T.ehNoite()) T.definir(21); ui.clarao('#0a0608'); ui.toast('A noite cai sobre o jardim. Você vigia.'); }
  function atualizarVigilia(dt) {
    if (!vg.ativa) return;
    if (I.porTag('vigilia4').some(vivo)) return;
    vg.espera -= dt; if (vg.espera > 0) return;
    if (vg.onda >= 3) {
      vg.ativa = false;
      if (P.pers.virt.temperanca < OV.MAX_VIRTUDE) P.pers.virt.temperanca++;
      C().recalcular(); MS.ato('temperanca');
      ui.banner('A vigília'); ui.toast('Você guardou os olhos e o coração. Sua Temperança se fortaleceu (+1).');
      if (IT.dar('cintoAgostinho', 1, true)) setTimeout(() => ui.toast('Santo Agostinho lhe deixou o seu cinto. Veja no inventário (I).'), 1800);
      MS.concluir('a4m4', 'vigilia'); iniciarA4m5();
      setTimeout(() => M.figuras.agostinho.mostrar(false), 2500);
      return;
    }
    vg.onda++; vg.espera = 2.5;
    ui.toast(`Vigília: ${['primeira', 'segunda', 'terceira'][vg.onda - 1]} leva das Mariposas da Vaidade`);
    const n = 3 + vg.onda;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn(vg.onda === 3 && i === 0 ? 'reflexo' : 'mariposa', true, W(R.FIGUEIRA.x - 4 + Math.cos(a) * 7, R.FIGUEIRA.z + Math.sin(a) * 7), { nivel: 14 }); e.tag = 'vigilia4'; e.mundo = false;
    }
  }

  /* ================= O JARDIM DOS ESPELHOS ================= */
  let reflexoT = 4;
  function atualizarJardim(dt) {
    if (!(MS.ativa('a4m3') && MS.etapa('a4m3') === 1)) return;
    const esp = I.porTag('espelho_jardim').find(vivo); if (!esp) return;
    const p = W(R.ESPELHO.x, R.ESPELHO.z);
    if (Math.hypot(P.pos.x - p.x, P.pos.z - p.z) > 26) return;
    reflexoT -= dt; if (reflexoT > 0) return;
    reflexoT = 9;
    if (I.porTag('jardim').filter(vivo).length >= 3) return;
    const e = I.spawn('reflexo', true, { x: p.x + (Math.random() - 0.5) * 6, z: p.z + 4 + Math.random() * 3 }, { nivel: 14 }); e.tag = 'jardim'; e.mundo = false;
    ui.toast('Do Grande Espelho sai mais um Reflexo.');
  }

  /* ================= ASMODEU ================= */
  const chefe = { ativo: false, fase: 0, fasT: 0, tele: 0, saltoT: 0, falando: false, b: null, anel: null, guardou: 0 };
  A4.chefe = chefe;
  const ESPELHOS = [[-7.5, -12], [7.5, -12], [-7.5, 10], [7.5, 10]];
  function limparEfeitos() { if (chefe.anel) { M.scene.remove(chefe.anel); chefe.anel = null; } }
  function resetarChefe() {
    ['asmodeu', 'espelho_baile', 'asmodeu_add'].forEach(MS.tagRemove);
    limparEfeitos(); chefe.ativo = false; chefe.fase = 0; chefe.tele = 0; chefe.falando = false; chefe.b = null; chefe.guardou = 0;
  }
  function desafiar() {
    if (chefe.ativo || chefe.falando) return;
    chefe.falando = true;
    const fala = () => D.abrir(arv('Asmodeu', {
      a: { txt: 'Bem-vindo ao baile! Aqui ninguém precisa ser quem é. Ninguém promete nada, ninguém cobra nada. Só olhe para mim... e esqueça o resto.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: () => 'É Asmodeu, o demônio que Rafael amarrou no livro de Tobias. Os espelhos do salão o alimentam: quebre-os. E quando ele tirar a máscara, desvie o olhar: vire a câmera para longe dele e solte a trava de alvo (Tab).' + (F().graca_agostinho ? ' A Graça de Agostinho está com você: um golpe basta para cada espelho.' : ''),
        depois: () => { chefe.falando = false; iniciarChefe(); } }
    }));
    if (OV.cenas) OV.cenas.poema('asmodeu', { pos: W(R.ARENA.x, R.ARENA.z - 8) }, fala); else fala();
  }
  function iniciarChefe() {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1; chefe.fasT = 6; chefe.saltoT = 6;
    const b = I.spawn('asmodeu', !(OV.cenas && OV.cenas.trocar('asmodeu')), W(R.ARENA.x, R.ARENA.z - 8)); b.tag = 'asmodeu'; chefe.b = b;
    ESPELHOS.forEach(([x, z]) => { const t = I.spawn('espelho_baile', true, W(R.ARENA.x + x, R.ARENA.z + z)); t.tag = 'espelho_baile'; t.parado = true; t.g.scale.setScalar(0.75); });
    MS.avancar('a4m5', 1);
    A.bell(165, 0.35); J().shake(0.3);
  }
  function olhandoPara(e) {
    const yaw = OV.cam.yaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const dx = e.g.position.x - P.pos.x, dz = e.g.position.z - P.pos.z, d = Math.hypot(dx, dz) || 1;
    return (fx * dx + fz * dz) / d > Math.cos(0.95) && d < 40;
  }
  function fascinio(e) {
    limparEfeitos();
    if (P.dead) return;
    if (olhandoPara(e)) {
      C().ferirJogador(18, 'luxuria');
      const espelhos = I.porTag('espelho_baile').filter(vivo).length;
      if (espelhos) { e.hp = Math.min(e.def.hp, e.hp + e.def.hp * 0.04 * espelhos); ui.toast('Você olhou para ele, e os espelhos o alimentaram com o seu olhar.'); }
      else ui.toast('Você olhou para ele. A vista turva, e o coração se dispersa.');
    } else {
      ui.toast('Você guardou os olhos. O Fascínio passou sem tocá-lo.');
      if (chefe.guardou < 3) { chefe.guardou++; MS.ato('temperanca'); }
      I.atordoar(e, 1.2);
    }
    A.bell(740, 0.1);
  }
  function iaAsmodeu(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    if (e.roda) e.roda.rotation.y += dt * 1.2;
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) {
      chefe.fase = 2;
      [[-9, 12], [9, 12], [0, -13]].forEach(([x, z], i) => { const a = I.spawn(i === 2 ? 'mascarado' : 'reflexo', true, W(R.ARENA.x + x, R.ARENA.z + z), { nivel: 15 }); a.tag = 'asmodeu_add'; a.def = Object.assign({}, a.def, { aggro: 30, leash: 40 }); });
      ui.toast('"Dancem, meus convidados!" Asmodeu chama os seus reflexos.'); A.bell(247, 0.25); J().shake(0.3);
    }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; oferta(e); }
    if (D.aberto) return;
    // o Fascínio: aviso, depois o olhar
    if (chefe.tele > 0) {
      chefe.tele -= dt;
      if (chefe.anel) { const k = 1 - Math.max(0, chefe.tele) / chefe.teleMax; chefe.anel.position.set(e.g.position.x, M.altura(e.g.position.x, e.g.position.z) + 0.1, e.g.position.z); chefe.anel.scale.setScalar(1 + k * 5); chefe.anel.material.opacity = 0.15 + 0.5 * k; }
      e.state = 'recover'; e.t = 0.3;
      if (chefe.tele <= 0) fascinio(e);
      return;
    }
    chefe.fasT -= dt;
    if (chefe.fasT <= 0) {
      chefe.fasT = chefe.fase >= 2 ? 6 : 7.5;
      chefe.teleMax = chefe.tele = F().graca_agostinho ? 2.4 : 1.6;
      chefe.anel = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0xff8ad8, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
      chefe.anel.rotation.x = -Math.PI / 2; M.scene.add(chefe.anel);
      ui.toast('Asmodeu leva a mão à máscara: desvie o olhar! (vire a câmera e solte a trava, Tab)'); A.bell(988, 0.06);
      return;
    }
    // fase 3: ele some e reaparece às costas do peregrino
    if (chefe.fase === 3) {
      chefe.saltoT -= dt;
      if (chefe.saltoT <= 0 && (e.state === 'chase' || e.state === 'idle')) {
        chefe.saltoT = 6;
        C().faisca(e.g.position.x, e.g.position.y + 2, e.g.position.z, 0xff8ad8);
        const a = P.facing + Math.PI, x = P.pos.x + Math.sin(a) * 4.5, z = P.pos.z + Math.cos(a) * 4.5;
        e.g.position.set(x, M.altura(x, z), z); M.collide(e.g.position, e.def.r);
        C().faisca(e.g.position.x, e.g.position.y + 2, e.g.position.z, 0xff8ad8);
        ui.toast('Asmodeu dança e reaparece às suas costas!');
        e.state = 'windup'; e.t = e.def.windup + 0.25;
      }
    }
  }
  function oferta(b) {
    limparEfeitos(); chefe.tele = 0;
    D.abrir(arv('Asmodeu', {
      a: { txt: 'Chega de lutar. Tome esta máscara: com ela você pode ser quem quiser, sem promessas, sem ninguém para cobrar nada. Só por esta noite...', opc: [
        { t: '"Felizes os puros de coração, porque verão a Deus."', ef: () => { F().oferta4 = 'recusou'; MS.ato('temperanca'); I.atordoar(b, 2.5); }, ir: 'r' },
        { t: 'Pegar a máscara, só por esta noite...', ef: () => { F().oferta4 = 'cedeu'; P.status.luxuria = 25; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.2); }, ir: 'c' }] },
      r: { quem: '', txt: 'A máscara cai das mãos de Asmodeu e se parte no chão de mármore. Por um instante, o salão inteiro parece mais claro.' },
      c: { quem: 'Anjo da Guarda', txt: 'Você aceitou, e a vista se turvou. Mas uma noite não é a vida inteira: levante-se. O Recolhimento limpa os olhos.' }
    }));
  }
  function asmodeuVencido() {
    chefe.ativo = false; F().asmodeu_vencido = true; limparEfeitos();
    I.lista.filter(e => (e.tag === 'espelho_baile' || e.tag === 'asmodeu_add') && vivo(e)).forEach(e => { e.state = 'dead'; e.deadT = 0; e.lab.el.style.display = 'none'; });
    J().salvar();
    setTimeout(finalAsmodeu, 1800);
  }
  function finalAsmodeu() {
    const f = F();
    D.abrir(arv('Duquesa Valéria', {
      a: { quem: '', txt: 'Asmodeu se desfaz como um véu rasgado. Uma a uma, as máscaras do salão caem no chão. As pessoas se olham como se acordassem de um sonho comprido.', prox: 'b' },
      b: { quem: () => f.duque_livre ? 'Duque Henrique' : 'Duquesa Valéria', txt: () => f.duque_livre ? 'Valéria está aqui, ao meu lado, e eu a vejo de novo. Mas a corte inteira usou essas máscaras. O que faremos com elas?' : 'Henrique ainda está perdido no jardim, mas o baile acabou. E agora, o que faremos com tantas máscaras?', opc: [
        { t: 'Queimem todas as máscaras na Praça das Fontes, à vista de todos.', ef: () => { f.mascaras_fim = 'queimar'; MS.ato('justica'); }, ir: 'c1' },
        { t: 'Que cada um tire a sua por vontade própria, quando estiver pronto.', ef: () => { f.mascaras_fim = 'livre'; MS.ato('prudencia'); }, ir: 'c2' }] },
      c1: { txt: 'Uma fogueira na praça... Que se veja de longe que Belmonte acordou.', prox: 'z' },
      c2: { txt: 'Ninguém arrancou a máscara de ninguém. É justo que ninguém a arranque agora.', prox: 'z' },
      z: { quem: 'Anjo da Guarda', txt: 'Está feito. Vá à Igreja de Santo Agostinho, a oeste da praça: Belmonte espera pela Missa.', ef: () => { MS.avancar('a4m5', 2); J().salvar(); } }
    }));
  }
  function missa4() {
    const f = F();
    const linhas = [
      ['', 'Pela primeira vez em meses, a música do palácio se cala, e os sinos de Santo Agostinho tocam. As pessoas entram na igreja com o rosto descoberto.'],
      ['Frei Bernardo', 'Irmãos, fomos feitos para Deus, e o nosso coração anda inquieto enquanto não repousa nele. Hoje a corte inteira se lembra do próprio nome.']
    ];
    if (f.duque_livre) linhas.push(['Duque Henrique', 'Diante deste altar, Valéria, renovo a promessa que fiz no dia do nosso casamento: ser fiel a você, na alegria e na tristeza, todos os dias da minha vida.'], ['Duquesa Valéria', 'E eu a renovo também. Desta vez com os olhos abertos.']);
    if (MS.feita('a4s3')) linhas.push(['Inês', 'Sebastião voltou. Marcamos o casamento para a primavera, aqui mesmo.']);
    if (MS.feita('a4s1')) linhas.push(['Clara, a costureira', 'Não costuro mais máscaras. Agora faço véus de batismo e roupas de festa para quem casa.']);
    linhas.push(['', 'Ao fim da Missa, todos olham para a torre do palácio. No alto, uma luz clara e serena se acende: a Lâmpada da Castidade.']);
    ui.clarao('#000000');
    D.falas(linhas, () => {
      f.ato4_fim = true; MS.concluir('a4m5', f.mascaras_fim || 'livre');
      R.acenderLampada(true);
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([294, 349, 440, 523, 587][i], 0.3), t));
      setTimeout(() => {
        J().pausar(true);
        ui.fimAto(resumo4(), {
          eyebrow: 'Fim do Ato IV', titulo: 'Os rostos foram devolvidos',
          texto: 'A Lâmpada da Castidade arde na torre do Palácio de Belmonte. A quarta das sete lâmpadas de Albária foi reacesa.',
          cite: 'Mais ao norte, na Vila dos Muros, as aldeias ergueram muralhas umas contra as outras, e ninguém suporta a alegria do vizinho. A peregrinação continua.'
        });
      }, 2600);
    });
  }
  function resumo4() {
    const f = F(), r = [];
    r.push({ justica: 'Você mostrou ao Duque a aliança de Valéria, e ele se lembrou da promessa.', prudencia: 'Com prudência, você mostrou ao Duque que o espelho mentia.', caridade: 'Você rezou com o Duque até ele chorar e tirar a máscara.' }[f.duque_res] || 'O Duque Henrique voltou para casa.');
    r.push(f.mascaras_fim === 'queimar' ? 'As máscaras da corte arderam numa fogueira na Praça das Fontes.' : 'Cada pessoa da corte tirou a sua máscara por vontade própria.');
    r.push(f.oferta4 === 'cedeu' ? 'Você aceitou a máscara de Asmodeu por um instante, e mesmo assim se levantou.' : 'Você recusou a máscara de Asmodeu.');
    if (MS.feita('a4m4')) r.push(res('a4m4') === 'vigilia' ? 'Você vigiou com Santo Agostinho sob a figueira.' : 'Você foi ao palácio sem vigiar sob a figueira.');
    if (MS.feita('a4s1')) r.push('Clara queimou as máscaras enfeitiçadas.');
    if (MS.feita('a4s2')) r.push('Mateus recuperou o terço.');
    if (MS.feita('a4s3')) r.push('Sebastião leu a carta de Inês e voltou para ela.');
    return r;
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"Que dia é hoje? Eu dançava... e não lembro desde quando."', '"Meu nome... meu nome é Teresa. Eu tinha esquecido."', '"Tenho uma esposa. Onde está a minha esposa?"', '"Obrigado. Esta máscara pesava mais do que parecia."', '"Que vergonha... Quero ir para casa."', '"Senhor, criai em mim um coração puro."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && naRegiao()) {
      if (MS.ativa('a4m1') && MS.etapa('a4m1') === 0) {
        MS.avancar('a4m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Música, luzes e máscaras... Aqui ninguém olha ninguém nos olhos. O vício desta corte é o olhar que se perde e as promessas que se esquecem. Procure Frei Bernardo, na Igreja de Santo Agostinho.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'belmonte' && MS.ativa('a4m1') && MS.etapa('a4m1') === 2) { concluirA4m1(); return false; }
    if (tipo === 'liberto' && x.def.key === 'mascarado') {
      x.sumir = true;
      if (MS.ativa('a4s1') && MS.etapa('a4s1') === 0) {
        f.mascaras = (f.mascaras || 0) + 1;
        ui.toast(`Você recolheu uma máscara enfeitiçada (${Math.min(3, f.mascaras)}/3).`);
        if (f.mascaras >= 3) MS.avancar('a4s1', 1);
      }
      if (x.tag === 'baile') {
        f.mascarados = f.mascarados || [];
        if (!f.mascarados.includes(x.bi)) f.mascarados.push(x.bi);
        ui.toast(FRASES[(f.mascarados.length - 1) % FRASES.length]);
        if (f.mascarados.length >= 6) {
          MS.ato('caridade');
          if (MS.ativa('a4m2')) MS.avancar('a4m2', 1);
          setTimeout(() => D.falas([['Anjo da Guarda', 'Todos livres. Repare: assim que tiram a máscara, perguntam pela família. Volte a Frei Bernardo.']]), 1600);
        }
      } else ui.toast('O mascarado libertado tira a máscara e procura o caminho de casa.');
      J().salvar(); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'espelho') {
      MS.tagRemove('jardim');
      MS.avancar('a4m3', 2); A.bell(880, 0.2); J().shake(0.3);
      const linhasE = [['', 'O Grande Espelho se parte em mil pedaços. Os Reflexos se apagam como velas.'], ['Anjo da Guarda', 'O Duque está aí, parado, olhando para a moldura vazia. Fale com ele.']];
      const ep = W(R.ESPELHO.x, R.ESPELHO.z);
      setTimeout(() => OV.cenas ? OV.cenas.contar(linhasE, { alvo: new THREE.Vector3(ep.x, M.altura(ep.x, ep.z) + 1, ep.z), raio: 6.5, altura: 2.2, olhar: 1, giro: 0.18 }) : D.falas(linhasE), 800);
      return true;
    }
    if (tipo === 'vencido' && x.def.key === 'espelho_baile') {
      const restam = I.porTag('espelho_baile').filter(vivo).length;
      ui.toast(restam ? `O espelho se parte. Restam ${restam}.` : 'O último espelho se parte! O Fascínio de Asmodeu não o alimenta mais.');
      A.bell(988 - restam * 80, 0.12); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'asmodeu') { asmodeuVencido(); return true; }
    if (tipo === 'renascer') {
      if (vg.ativa) { vg.ativa = false; if (st('a4m4')) st('a4m4').e = 0; MS.tagRemove('vigilia4'); M.figuras.agostinho.mostrar(false); ui.toast('A vigília foi interrompida. Volte à figueira quando estiver pronto.'); }
      if (chefe.ativo || chefe.b) { resetarChefe(); if (MS.ativa('a4m5') && MS.etapa('a4m5') === 1) st('a4m5').e = 0; }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  let avisoDia = false;
  MS.ganchos.update.push(dt => {
    atualizarVigilia(dt);
    if (!naRegiao()) return;
    atualizarJardim(dt);
    if (MS.ativa('a4m5') && MS.etapa('a4m5') === 0 && !chefe.ativo && !chefe.falando && !P.dead) {
      if (R.dentroPalacio()) {
        if (T.ehNoite()) desafiar();
        else if (!avisoDia) { avisoDia = true; ui.toast('O salão está vazio. O Grande Baile só começa depois das Vésperas.'); }
      } else avisoDia = false;
    }
  });

  /* ================= DIÁLOGOS ================= */
  ARV.bernardo = () => {
    const f = F(), q = 'Frei Bernardo';
    if (MS.ativa('a4m1') && MS.etapa('a4m1') <= 1) return arv(q, {
      a: { txt: () => `Graças a Deus, um rosto sem máscara! Sou Frei Bernardo, da Ordem de Santo Agostinho. Você vem de longe? Então ainda não sabe o que aconteceu com Belmonte.`, prox: 'b' },
      b: { txt: 'Há meses o palácio abriu um baile que não termina. Quem entra põe uma máscara, e com ela esquece o próprio nome, a família, as promessas que fez. Maridos não reconhecem as esposas. Noivos esquecem as noivas.', opc: [
        { t: 'Quem abriu o baile?', ir: 'c' }, { t: 'E as famílias?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      c: { txt: 'Dizem que um convidado estrangeiro, de máscara de ouro, chegou numa noite e pediu música. O Duque Henrique foi o primeiro a dançar. Desde então ninguém o vê no salão: dizem que se perdeu no Jardim dos Espelhos.', opc: [{ t: 'E as famílias?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      d: { txt: 'As casas estão vazias, as crianças ficam com os avós. A Duquesa Valéria mora sozinha na Casa do Lago. O pecado aqui não é a alegria da festa: é o olhar que se perde, e as promessas que se esquecem.', opc: [{ t: 'Quem abriu o baile?', ir: 'c' }, { t: 'O que posso fazer?', ir: 'e' }] },
      e: { txt: () => `Acenda primeiro a vela do Oratório, na Praça das Fontes. Depois vá ao palácio, ao norte. Liberte os mascarados, sem ferir de morte ninguém. Cada um deles tem um nome, ${g('meu filho', 'minha filha')}.`,
        ef: () => { MS.avancar('a4m1', 2); if (prog().oratorios.belmonte) concluirA4m1(); } }
    });
    if (MS.ativa('a4m1')) return linha(q, 'O Oratório fica na Praça das Fontes, junto à fonte das três taças.');
    if (MS.ativa('a4m2') && MS.etapa('a4m2') === 1) return arv(q, {
      a: { txt: 'Seis pessoas acordaram! Uma senhora veio aqui perguntar pelos netos; um rapaz pediu para se confessar. Deus seja louvado.', prox: 'b' },
      b: { txt: 'Mas o anfitrião continua lá. E a Duquesa Valéria me pediu ajuda: o Duque se perdeu. Vá à Casa do Lago, a leste, e fale com ela.', ef: () => { MS.concluir('a4m2'); setTimeout(() => MS.iniciar('a4m3'), 1200); } }
    });
    if (MS.ativa('a4m2')) return linha(q, 'O Palácio dos Bailes fica ao norte da praça. A música não para, nem de dia.');
    if (MS.ativa('a4m3')) return linha(q, 'A Duquesa Valéria mora na Casa do Lago, a leste. O Jardim dos Espelhos fica a oeste.');
    if (MS.ativa('a4m4')) return linha(q, 'O Jardim da Figueira fica a leste do palácio. Santo Agostinho se converteu num jardim assim, debaixo de uma figueira, chorando.');
    if (MS.ativa('a4m5') && MS.etapa('a4m5') < 2) return linha(q, () => T.ehNoite() ? 'É noite. O Grande Baile começou. Vá, e guarde os olhos.' : 'O anfitrião só aparece no salão depois das Vésperas. Reze, descanse, e vá ao palácio quando a noite cair.');
    if (MS.ativa('a4m5')) return linha(q, 'O altar está pronto. Entre pela porta principal: vamos celebrar a Missa.');
    if (f.ato4_fim) return linha(q, 'Belmonte acordou. Mas ouço dizer que na Vila dos Muros os vizinhos ergueram muralhas uns contra os outros. A inveja também é uma máscara.');
    return linha(q, 'Que Santo Agostinho reze por você.');
  };
  ARV.valeria = () => {
    const f = F(), q = 'Duquesa Valéria';
    if (MS.ativa('a4m3') && MS.etapa('a4m3') === 0) return arv(q, {
      a: { txt: 'Frei Bernardo mandou você? Então ouça. Meu marido, Henrique, foi o primeiro a dançar com o convidado de máscara de ouro. Uma noite saiu do salão para o Jardim dos Espelhos, e não voltou mais.', prox: 'b' },
      b: { txt: 'Fui até lá. Ele estava diante de um espelho enorme, olhando para si mesmo. Chamei pelo nome dele, e ele não me reconheceu.', prox: 'c' },
      c: { txt: 'Leve esta aliança. É a minha, do dia do nosso casamento. Se ele não se lembrar de mim, talvez se lembre da promessa.', ef: () => { f.alianca = true; MS.avancar('a4m3', 1); MS.respawnQuest(); } }
    });
    if (MS.ativa('a4m3') && MS.etapa('a4m3') < 3) return linha(q, 'O Jardim dos Espelhos fica a oeste da praça. A entrada é do lado leste do labirinto.');
    if (MS.ativa('a4m3') && MS.etapa('a4m3') === 3) return arv(q, {
      a: { txt: 'Henrique... ele está aqui. Ele me olhou nos olhos e disse o meu nome. Faz meses que ninguém diz o meu nome.', prox: 'b' },
      b: { txt: 'Frei Bernardo diz que Santo Agostinho se converteu num jardim, debaixo de uma figueira. Há um jardim assim aqui, a leste do palácio. Vá rezar lá antes de enfrentar quem está no salão.', ef: () => { MS.ato('caridade'); MS.concluir('a4m3', f.duque_res); setTimeout(() => MS.iniciar('a4m4'), 1200); } }
    });
    if (f.ato4_fim) return linha(q, 'Henrique e eu tomamos café juntos todas as manhãs, na beira do lago. Parece pouco. É tudo.');
    if (f.duque_livre) return linha(q, 'Henrique dorme pouco. Diz que ainda ouve a música do palácio. Mas segura a minha mão.');
    return linha(q, 'A música do palácio chega até aqui, à noite. Eu fecho as janelas e rezo.');
  };
  function decidirDuque(r) { F().duque_res = r; F().duque_livre = true; MS.ato(r === 'prudencia' ? 'prudencia' : r === 'caridade' ? 'caridade' : 'justica'); MS.avancar('a4m3', 3); A.bell(587, 0.15); }
  ARV.henrique = () => {
    const f = F(), q = 'Duque Henrique';
    if (MS.ativa('a4m3') && MS.etapa('a4m3') === 1) return linha(q, '...Não fale comigo. Estou vendo... a mim mesmo. Nunca fui tão bonito. Saia da frente do espelho.');
    if (MS.ativa('a4m3') && MS.etapa('a4m3') === 2) return arv(q, {
      a: { txt: 'O espelho... quebrou. Onde eu estou? Quem é você? Eu tinha uma casa... um lago... alguém me esperava.', opc: [
        { t: 'Mostrar a aliança de Valéria: "Você fez uma promessa diante de Deus. Ela ainda espera."', mostrar: () => !!f.alianca, ef: () => decidirDuque('justica'), ir: 'j' },
        { t: '"O espelho mostrava o que você queria ver. Valéria mostra quem você é."', cond: () => P.pers.virt.prudencia >= 12, motivo: 'Prudência 12', ef: () => decidirDuque('prudencia'), ir: 'p' },
        { t: 'Ficar e rezar com ele, até a máscara cair. (40 de Fé)', cond: () => P.fe >= 40, motivo: 'você precisa de 40 de Fé', ef: () => { P.fe -= 40; decidirDuque('caridade'); }, ir: 'c' }] },
      j: { txt: 'A aliança dela... Valéria. Valéria! Eu prometi. Na alegria e na tristeza. Como pude esquecer o rosto dela?', prox: 'z' },
      p: { txt: 'Eu olhava para mim, e o mundo inteiro sumia. Ela olhava para mim, e o mundo inteiro aparecia. Valéria...', prox: 'z' },
      c: { txt: '...Pai nosso, que estais no céu... Eu sabia esta oração. Minha mulher rezava comigo, toda noite. Valéria.', prox: 'z' },
      z: { quem: '', txt: 'O Duque tira a máscara com as mãos trêmulas e a deixa cair entre os cacos do espelho.', depois: () => { posFig(); J().salvar(); setTimeout(() => ui.toast('O Duque Henrique voltou para a Casa do Lago. Vá ver a Duquesa Valéria.'), 600); } }
    });
    if (f.ato4_fim) return linha(q, 'Quebrei todos os espelhos da casa, menos um: o que fica no quarto, onde Valéria se penteia. Esse eu deixei.');
    if (f.duque_livre) return linha(q, 'Obrigado por me trazer de volta. Ainda tenho vergonha de olhar para ela. Mas olho.');
    return linha(q, '...');
  };
  ARV.clara = () => {
    const f = F(), q = 'Clara, a costureira';
    if (MS.feita('a4s1')) return linha(q, 'O fogo levou as máscaras. Agora costuro véus de batismo. É outro tipo de beleza: a que não esconde ninguém.');
    if (MS.ativa('a4s1') && MS.etapa('a4s1') === 1) return arv(q, {
      a: { txt: 'Essas são as minhas máscaras... Fui eu que as costurei, para o convidado de ouro. Ele pagava bem, e eu não perguntava.', prox: 'b' },
      b: { txt: 'Vou queimá-las no meu fogão, agora, na sua frente. E tome esta túnica branca: comecei a fazê-la para um batizado, antes de tudo isso. Fica melhor em quem luta pela luz.', ef: () => { MS.ato('justica'); MS.concluir('a4s1'); IT.dar('tunicaBranca', 1); } }
    });
    if (MS.ativa('a4s1')) return linha(q, () => `Cada mascarado libertado deixa cair a sua máscara. Traga-me três. (${Math.min(3, f.mascaras || 0)}/3)`);
    return arv(q, {
      a: { txt: 'Fui eu que costurei as máscaras do baile. Não durmo mais desde então. Elas são encantadas: quem as põe esquece quem é. Queria queimá-las, mas estão todas no rosto das pessoas.', opc: [
        { t: 'Vou trazer as máscaras dos que eu libertar.', ef: () => MS.iniciar('a4s1'), ir: 'b' }, { t: 'Que Deus lhe dê paz, Clara.' }] },
      b: { txt: 'Três já bastam para eu desfazer o encanto da minha linha. Que Deus lhe pague.' }
    });
  };
  ARV.mateus = () => {
    const f = F(), q = 'Mateus, o jardineiro';
    if (MS.feita('a4s2')) return linha(q, 'Rezo o terço podando as sebes, como sempre fiz. As mariposas não voltaram.');
    if (MS.ativa('a4s2') && f.terco_mateus) return arv(q, {
      a: { txt: 'O meu terço! Era da minha mãe. Rezei com ele cinquenta anos neste jardim, antes de os espelhos chegarem.', prox: 'b' },
      b: { txt: 'Tome, um presente de jardineiro: um terço novo, que eu mesmo fiz com caroços de oliveira.', ef: () => { MS.ato('caridade'); MS.concluir('a4s2'); if (!IT.qtd('tercoOliveira')) IT.dar('tercoOliveira', 1); else denarios(30); } }
    });
    if (MS.ativa('a4s2')) return linha(q, 'Caiu no canto noroeste do labirinto, entre as sebes. As mariposas tomaram aquele canto.');
    return arv(q, {
      a: { txt: 'Cuido destas sebes desde menino. Agora o Duque mandou pendurar espelhos nelas, e o jardim virou um labirinto de gente olhando para si mesma. Perdi o meu terço lá dentro, fugindo das mariposas.', opc: [
        { t: 'Vou buscar o seu terço.', ef: () => { MS.iniciar('a4s2'); MS.respawnQuest(); }, ir: 'b' }, { t: 'Que Deus abençoe o seu jardim.' }] },
      b: { txt: 'No canto noroeste, depois do segundo corredor. Que Santo Agostinho vá com você.' }
    });
  };
  ARV.ines = () => {
    const f = F(), q = 'Inês';
    if (MS.feita('a4s3')) return linha(q, 'Sebastião vem jantar todo domingo com os meus pais. E reza o terço com a minha avó, imagine!');
    if (MS.ativa('a4s3') && f.sebastiao_livre) return arv(q, {
      a: { txt: 'Ele voltou! Bateu na porta de manhã, sem máscara, com a minha carta na mão. Chorou mais do que eu.', prox: 'b' },
      b: { txt: 'Tome este escapulário de São José. Era do meu avô. São José guardou a Sagrada Família com um coração puro: que guarde você também.', ef: () => { MS.ato('caridade'); MS.concluir('a4s3'); IT.dar('escJose', 1); } }
    });
    if (MS.ativa('a4s3')) return linha(q, 'Sebastião guarda o portão do palácio. Ele não sai de lá, mesmo quando a troca da guarda passa.');
    return arv(q, {
      a: { txt: 'Sou noiva de Sebastião, o guarda do portão do palácio. Ele prometeu casar comigo na primavera. Desde o baile, olha para dentro do salão e não me reconhece.', opc: [
        { t: 'Posso levar uma carta sua para ele.', ef: () => { MS.iniciar('a4s3'); f.carta = true; }, ir: 'b' }, { t: 'Que Deus guarde o seu noivado.' }] },
      b: { txt: 'Escrevi esta carta todas as noites, sem coragem de entregar. Diga a ele que eu ainda espero.' }
    });
  };
  ARV.sebastiao = () => {
    const f = F(), q = 'Sebastião, o guarda';
    if (MS.ativa('a4s3') && MS.etapa('a4s3') === 0 && f.carta) return arv(q, {
      a: { txt: '...A música... não está ouvindo? Lá dentro todos estão felizes. Ninguém precisa prometer nada.', opc: [
        { t: 'Entregar a carta de Inês.', ef: () => { f.sebastiao_livre = true; MS.avancar('a4s3', 1); posFig(); }, ir: 'b' }, { t: 'Deixar para depois.' }] },
      b: { txt: '"Sebastião, eu ainda espero." ...Inês. A minha Inês. O que eu estou fazendo aqui, de máscara, olhando para dentro? Preciso vê-la. Obrigado, peregrino. Obrigado.' }
    });
    if (f.sebastiao_livre) return linha(q, F().ato4_fim ? 'Agora guardo o portão de verdade: de dia, com os olhos abertos.' : 'Vou ver Inês assim que a troca da guarda passar. E desta vez não esqueço.');
    return linha(q, '...A música... Não está ouvindo? Afaste-se do portão.');
  };
  ARV.agostinho = () => linha('Santo Agostinho', 'Fizeste-nos para ti, Senhor, e inquieto está o nosso coração enquanto não repousa em ti.');
  R.MORADORES.forEach(([x, z, r, op, a, b]) => {
    M.criarFigura(x + R.OX, z + R.OZ, r, op);
    let k = 0; ARV[op.id] = () => linha(op.nome, F().ato4_fim ? 'Tiramos as máscaras. No começo dá vergonha. Depois dá alegria.' : (k++ % 2) ? b : a);
  });
  if (OV.vida) {
    Object.assign(OV.vida.PASSEIO, { mor_corte1: 5, mor_corte2: 4, mor_corte3: 4 });
    Object.assign(OV.vida.SINAL, {
      bernardo: () => (MS.ativa('a4m1') && MS.etapa('a4m1') <= 1) || (MS.ativa('a4m2') && MS.etapa('a4m2') === 1) ? '?' : null,
      valeria: () => (MS.ativa('a4m3') && (MS.etapa('a4m3') === 0 || MS.etapa('a4m3') === 3)) ? '?' : null,
      henrique: () => (MS.ativa('a4m3') && MS.etapa('a4m3') === 2) ? '?' : null,
      clara: () => !st('a4s1') && MS.feita('a4m1') ? '!' : (MS.ativa('a4s1') && MS.etapa('a4s1') === 1) ? '?' : null,
      mateus: () => !st('a4s2') && MS.feita('a4m1') ? '!' : (MS.ativa('a4s2') && F().terco_mateus) ? '?' : null,
      ines: () => !st('a4s3') && MS.feita('a4m1') ? '!' : (MS.ativa('a4s3') && F().sebastiao_livre) ? '?' : null,
      sebastiao: () => (MS.ativa('a4s3') && MS.etapa('a4s3') === 0) ? '?' : null
    });
    OV.vida.santosLuz.push('agostinho');
  }
  if (IT) { IT.SACERDOTES.bernardo = 'Frei Bernardo'; IT.criarCapela(R.CAPELA.x + R.OX, R.CAPELA.z + R.OZ, Math.atan2(-R.CAPELA.x, 60 - R.CAPELA.z), 'Capela do Peregrino (Belmonte)'); }

  /* ================= SANTO AGOSTINHO, COMO A IGREJA O RETRATA ================= */
  // bispo de Hipona: hábito negro de agostiniano, capa de bispo, mitra, barba, o livro e o coração em chamas
  if (OV.modeloSanto) {
    OV.modeloSanto.agostinho = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a2a14); m.emissiveIntensity = 0.6; return m; };
      const habito = bri(sm(0x1a1616)), capa = bri(sm(0xe8e0cc)), ouro = bri(sm(0xd8b048, { metalness: 0.6, roughness: 0.35 })), pele = bri(sm(0xc8a488)), barba = bri(sm(0x6a6058)), cor = bri(sm(0xb01a1a));
      gr.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.45, 8), habito, 0, 0.95, 0));
      gr.add(mesh(new THREE.CylinderGeometry(0.42, 0.6, 1.3, 8, 1, true), capa, 0, 1.25, -0.02));
      gr.add(mesh(new THREE.BoxGeometry(0.7, 0.55, 0.44), capa, 0, 1.68, 0));
      gr.add(mesh(new THREE.BoxGeometry(0.12, 1.3, 0.03), ouro, -0.22, 1.2, 0.24)); gr.add(mesh(new THREE.BoxGeometry(0.12, 1.3, 0.03), ouro, 0.22, 1.2, 0.24));
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), pele, 0, 2.02, 0.03));
      gr.add(mesh(new THREE.BoxGeometry(0.28, 0.3, 0.14), barba, 0, 1.86, 0.13));
      const mitra = new THREE.Group(); mitra.position.set(0, 2.22, 0);
      const mt = mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.5, 4), capa, 0, 0.2, 0); mt.rotation.y = Math.PI / 4; mt.scale.set(1, 1, 0.7); mitra.add(mt);
      mitra.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), ouro, 0, 0.2, 0.12)); gr.add(mitra);
      const livro = mesh(new THREE.BoxGeometry(0.36, 0.08, 0.46), habito, -0.38, 1.32, 0.3); livro.rotation.x = -0.5; gr.add(livro);
      const coracao = new THREE.Group(); coracao.position.set(0.4, 1.5, 0.3); gr.add(coracao);
      coracao.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), cor, 0, 0, 0));
      const ch = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 6), M.MAT.flame); ch.position.y = 0.2; coracao.add(ch);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.84, -0.1); gr.add(h);
    };
    if (OV.vida) OV.vida.vestirSanto('agostinho', 'agostinho');
  }
})(window.OV);

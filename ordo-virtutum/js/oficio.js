/* Ordo Virtutum — o ofício das mãos:
   · os materiais que os vícios deixam cair (cada terra tem os seus), guardados numa bolsa à parte;
   · uma arma própria para cada ordem, em três graus: a de Lia (Ato I), a do ferreiro do mosteiro
     (pede materiais do porto: é preciso voltar ao vale) e a de São Dunstano, nas minas (pede materiais da Corte);
   · a Armadura de São Miguel, que Lia só forja com a Máscara de Asmodeu;
   · o Pergaminho da Oração ao Anjo: raro, chama o anjo da guarda para lutar ao seu lado por um minuto. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes, IT = OV.itens; if (!M || M.falhou || !MS || !IT) return;
  const P = OV.P, ui = OV.ui, A = OV.audio, D = OV.dialogo, I = OV.inimigos;
  const C = () => OV.combate;
  const mesh = OV.mesh, sm = OV.sm, H = (x, z) => M.altura(x, z);
  const OF = {}; OV.oficio = OF;
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const esc = s => ui.esc(String(s));

  /* ===================================================================
     OS MATERIAIS
     =================================================================== */
  const MAT = {
    chifre: ['Chifre de Diabrete', 'diabrete'], lodo: ['Lodo do Tédio', 'larva'], pelo: ['Pelo de Lobo', 'lobo_cinza'], po: ['Pó de Murmúrio', 'murmurador'],
    pedraGargula: ['Pedra da Gárgula', 'gargula'], raio: ['Raio do Meio-Dia', 'meiodia'],
    pena: ['Pena de Corvo', 'corvo'], banha: ['Banha da Gula', 'larva_gula'], carapaca: ['Carapaça da Gula', 'caranguejo'], tinta: ['Tinta do Polvo', 'polvo'], taca: ['Taça do Banquete', 'senhor'],
    elitro: ['Élitro de Ouro', 'escaravelho'], pedraGolem: ['Coração de Golem', 'golem'], asa: ['Asa de Morcego', 'morcego'], chifreBezerro: ['Chifre do Bezerro de Ouro', 'bezerro'], moedaMamom: ['Moeda de Mamom', 'mamom'],
    seda: ['Seda de Mariposa', 'mariposa'], caco: ['Caco de Espelho', 'reflexo'], pluma: ['Pluma de Pavão', 'pavao'], olhoBasilisco: ['Olho do Basilisco', 'basilisco'], mascaraAsmodeu: ['Máscara de Asmodeu', 'asmodeu'],
    escamaSede: ['Escama da Sede', 'sede'],
    // v23: Atos V a VII
    escamaSerpe: ['Escama de Serpe', 'serpe'], olhoVerde: ['Olho Verde', 'olho'], pedraMuro: ['Pedra do Muro', 'muralha'], cabecaHidra: ['Cabeça da Hidra', 'hidra'], escamaLeviata: ['Escama de Leviatã', 'leviata'],
    brasaViva: ['Brasa Viva', 'brasa'], presaCao: ['Presa de Cão de Guerra', 'cao'], asaGafanhoto: ['Asa de Gafanhoto', 'gafanhoto'], cinzaGigante: ['Cinza do Gigante', 'gigante'], coroaAbadon: ['Coroa de Abadon', 'abadon'],
    penaCaida: ['Pena Caída', 'caido'], chifreBode: ['Chifre de Bode', 'bode'], pedraSentinela: ['Pedra da Sentinela', 'sentinela'], cetroPrincipe: ['Cetro do Príncipe', 'principe']
  };
  OF.MAT = MAT;
  const DROP = {}; for (const k in MAT) DROP[MAT[k][1]] = k;
  Object.assign(DROP, { lobo: 'pelo', glutao: 'banha', mineiro: 'elitro', espelho: 'caco', espelho_baile: 'caco', mascarado: 'seda', invejoso: 'olhoVerde', irado: 'brasaViva', soberbo: 'penaCaida' });
  const bolsa = () => { const p = P.pers; if (!p) return {}; if (!p.materiais) p.materiais = {}; return p.materiais; };
  OF.bolsa = bolsa;
  OF.qtd = k => bolsa()[k] || 0;
  OF.dar = function (k, n, silencioso) { const b = bolsa(); b[k] = (b[k] || 0) + (n || 1); if (!silencioso) ui.toast(`+${n || 1} ${MAT[k][0]}`); };
  OF.tirar = function (k, n) { const b = bolsa(); if ((b[k] || 0) < n) return false; b[k] -= n; if (b[k] <= 0) delete b[k]; return true; };
  // o que cai de cada vício vencido (os chefões sempre deixam o seu)
  const aoVencer0 = IT.aoVencer;
  IT.aoVencer = function (e) {
    aoVencer0.call(IT, e);
    const d = e.def; if (!P.pers || !d || e.tag === 'teste_sem_drop') return;
    const k = DROP[d.key]; if (!k) return;
    const chefe = d.chefe || (I.CHEFES && I.CHEFES.has(d.key));
    const ch = chefe ? 1 : d.variante === 'elite' ? 1 : d.variante === 'forte' ? 0.45 : 0.2;
    if (Math.random() < ch) OF.dar(k, chefe ? 1 : (d.variante === 'elite' ? 2 : 1));
    // os chefões principais também deixam um pergaminho
    // v24: só às vezes (o pergaminho ficou raro de verdade)
    if (chefe && ['senhor', 'mamom', 'asmodeu', 'leviata', 'abadon', 'principe'].includes(d.key) && Math.random() < 0.3) setTimeout(() => darPergaminho(), 1200);
  };

  /* ===================================================================
     AS ARMAS DE CADA ORDEM
     =================================================================== */
  const NOMES = {
    espada: ['Espada de ferro abençoado', 'Espada do Mosteiro', 'Espada de São Dunstano', 'Espada de Santo Elói'],
    cajado: ['Cajado de freixo abençoado', 'Cajado do Mosteiro', 'Cajado de São Dunstano', 'Cajado de Santo Elói'],
    pregacao: ['Breviário de capa de ferro', 'Breviário do Mosteiro', 'Breviário de São Dunstano', 'Breviário de Santo Elói'],
    aspersorio: ['Aspersório de ferro abençoado', 'Aspersório do Mosteiro', 'Aspersório de São Dunstano', 'Aspersório de Santo Elói'],
    adaga: ['Adaga de ferro abençoado', 'Adaga do Mosteiro', 'Adaga de São Dunstano', 'Adaga de Santo Elói'],
    machado: ['Machado de ferro abençoado', 'Machado do Mosteiro', 'Machado de São Dunstano', 'Machado de Santo Elói'],
    cantico: ['Lira de cordas de bronze', 'Lira do Mosteiro', 'Lira de São Dunstano', 'Lira de Santo Elói'],
    arco: ['Arco de teixo abençoado', 'Arco do Mosteiro', 'Arco de São Dunstano', 'Arco de Santo Elói'],
    luz: ['Rosário de contas de ferro', 'Rosário do Mosteiro', 'Rosário de São Dunstano', 'Rosário de Santo Elói'],
    crucifixo: ['Crucifixo de ferro abençoado', 'Crucifixo do Mosteiro', 'Crucifixo de São Dunstano', 'Crucifixo de Santo Elói']
  };
  const GRAUS = [
    { mods: { dano: 1.15 }, descr: '+15% de dano.' },
    { mods: { dano: 1.3, fe: 10 }, descr: '+30% de dano e +10 de Fé máxima. Forjada com um «insight» da oração dos monges.' },
    { mods: { dano: 1.48, danoDemonio: 1.1, fe: 15 }, descr: '+48% de dano, +10% contra os demônios e +15 de Fé máxima. São Dunstano prendeu o diabo com as tenazes da forja.' },
    { mods: { dano: 1.7, danoDemonio: 1.15, fe: 20, hp: 20 }, descr: '+70% de dano, +15% contra os demônios, +20 de Fé e +20 de vida máximas. Santo Elói, ourives e bispo, forjava cálices para o altar e correntes partidas para os cativos.' }
  ];
  if (IT.SLOTS && !IT.SLOTS.some(s => s[0] === 'arma')) IT.SLOTS.unshift(['arma', 'Arma']);
  for (const tipo in NOMES) NOMES[tipo].forEach((nome, n) => {
    OV.ITENS[`arma_${tipo}_${n + 1}`] = { nome, slot: 'arma', armaTipo: tipo, guilda: true, forjada: true, descr: GRAUS[n].descr + ' Só para quem luta com essa arma.', mods: GRAUS[n].mods };
  });
  OV.ITENS.armaduraMiguel = { nome: 'Armadura de São Miguel', slot: 'veste', guilda: true, forjada: true, cor: 0xd8c890, metal: true, descr: '+50 de vida máxima, 15% menos dano recebido e +10% contra os demônios. Forjada por Lia com a máscara de Asmodeu.', mods: { hp: 50, defesa: 0.85, danoDemonio: 1.1 } };
  OV.ITENS.pergaminho = { nome: 'Pergaminho da Oração ao Anjo', tipo: 'consumivel', raro: true, tecla: '7', descr: 'Muito raro. Lido em voz alta (tecla 7), chama o seu anjo da guarda para ajudar você por meio minuto. Depois o pergaminho se desfaz em luz.' };
  const armaDaOrdem = () => P.pers ? OV.ORDENS[P.pers.ordem].arma : 'espada';
  OF.idArma = n => `arma_${armaDaOrdem()}_${n}`;
  const equipar0 = IT.equipar;
  IT.equipar = function (id) {
    const it = OV.ITENS[id];
    if (it && it.slot === 'arma' && it.armaTipo !== armaDaOrdem()) { ui.toast('Essa arma não é da sua ordem: você não saberia usá-la.'); return; }
    return equipar0.call(IT, id);
  };
  // o pergaminho se usa como os outros consumíveis
  const usar0 = IT.usar;
  IT.usar = function (id) {
    if (id !== 'pergaminho') return usar0.call(IT, id);
    if (!P.D || P.dead) return;
    if (!IT.qtd('pergaminho')) { ui.toast('Você não tem nenhum Pergaminho da Oração ao Anjo.'); return; }
    if (OF.anjoAtivo()) { ui.toast('O seu anjo já luta ao seu lado.'); return; }
    if (OV.jogo && !OV.jogo.ativo()) return;
    IT.tirar('pergaminho'); IT.refresh(); OF.invocarAnjo();
  };
  function darPergaminho() {
    if (IT.dar('pergaminho', 1, true)) ui.toast('Você encontrou um Pergaminho da Oração ao Anjo. Leia-o com a tecla 7 numa luta difícil.');
    else { P.pers.bau.pergaminho = (P.pers.bau.pergaminho || 0) + 1; ui.toast('Um Pergaminho da Oração ao Anjo foi guardado no baú do peregrino.'); }
  }
  OF.darPergaminho = darPergaminho;
  // os baús ricos (das masmorras) às vezes guardam um pergaminho, e o último contrato de cada guilda também
  if (OV.aventura) {
    // v24: nas masmorras dos atos II em diante, uma chance pequena (o terceiro número é a chance); as guildas não dão mais
    OV.aventura.masmorras.forEach(m => { if (m.regiao === 'vale') return; const b = OV.aventura.baus.find(x => x.id === 'mas_' + m.id); if (b) b.conteudo = Object.assign({}, b.conteudo, { itens: (b.conteudo.itens || []).concat([['pergaminho', 1, 0.15]]) }); });
  }

  /* ---- a bolsa de materiais aparece no inventário ---- */
  const refresh0 = IT.refresh;
  IT.refresh = function () {
    refresh0.call(IT);
    const el = document.getElementById('inv'); if (!el || el.hidden || !P.pers || (IT.modoAtual && IT.modoAtual() === 'casa')) return;
    const b = bolsa(), ks = Object.keys(b).filter(k => b[k] > 0 && MAT[k]);
    const html = `<h3>Bolsa de materiais</h3><ul class="mats">${ks.length ? ks.map(k => `<li><b>${esc(MAT[k][0])}</b><em>×${b[k]}</em></li>`).join('') : '<li class="vazio">Vazia. Os vícios vencidos às vezes deixam cair materiais, que os ferreiros sabem usar.</li>'}</ul>`;
    const foot = el.querySelector('.foot'); if (foot) foot.insertAdjacentHTML('beforebegin', html); else el.insertAdjacentHTML('beforeend', html);
  };
  MS.ganchos.inventario.push(inv => { const b = bolsa(), n = Object.values(b).reduce((a, c) => a + c, 0); if (n) inv.push(`Materiais na bolsa: ${n}`); });

  /* ===================================================================
     OS FERREIROS
     =================================================================== */
  const custoTxt = r => [r.den ? `${r.den} denários` : null].concat(Object.keys(r.mats).map(k => `${r.mats[k]} ${MAT[k][0]}`)).filter(Boolean).join(', ');
  const falta = r => { const out = []; if ((P.pers.denarios || 0) < (r.den || 0)) out.push(`${r.den - (P.pers.denarios || 0)} denários`); for (const k in r.mats) if (OF.qtd(k) < r.mats[k]) out.push(`${r.mats[k] - OF.qtd(k)} ${MAT[k][0]}`); return out; };
  const tem = id => IT.qtd(id) > 0 || Object.values(IT.mochila().equip).includes(id) || (P.pers.bau[id] || 0) > 0;
  function forjar(npc, r, forja) {
    P.pers.denarios -= r.den || 0; for (const k in r.mats) OF.tirar(k, r.mats[k]);
    const id = typeof r.item === 'function' ? r.item() : r.item;
    const fim = () => {
      if (r.decor) { if (OV.casa) OV.casa.ganhar(r.decor, true); ui.toast(`Forjado: ${OV.casa.DECOR[r.decor].nome}. A peça já está na Casa do Peregrino, esperando um encaixe.`); if (A.bell) A.bell(784, 0.14); if (OV.jogo) OV.jogo.salvar(); return; }
      if (!IT.dar(id, 1, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + 1;
      ui.toast(`Forjado: ${OV.ITENS[id].nome}. Equipe-o no inventário (I).`); if (A.bell) A.bell(784, 0.14);
      if (OV.jogo) OV.jogo.salvar();
    };
    if (OV.aventura && forja) OV.aventura.entregar({ npc, prop: 'carvao', acao: 'forja', alvo: forja, dur: 3.4, falas: r.fala ? [[M.figuras[npc].op.nome, r.fala]] : null }, fim); else fim();
  }
  function menuFerreiro(cfg) {
    const nome = M.figuras[cfg.npc].op.nome;
    const rs = cfg.receitas.filter(r => !r.mostrar || r.mostrar());
    const opc = rs.map(r => {
      const id = typeof r.item === 'function' ? r.item() : r.item, feito = r.decor ? !!(OV.casa && OV.casa.tem(r.decor)) : tem(id);
      const nomeR = r.decor ? (OV.casa ? OV.casa.DECOR[r.decor].nome + ' (para a casa)' : r.decor) : OV.ITENS[id].nome;
      return { t: () => feito ? `${nomeR} (já forjada)` : `Forjar: ${nomeR} — ${custoTxt(r)}`, cond: () => !feito && !falta(r).length, motivo: () => feito ? 'você já tem' : 'falta: ' + falta(r).join(', '), ef: () => forjar(cfg.npc, r, cfg.forja) };
    }).concat([{ t: 'Que materiais servem para quê?', ir: 'm' }, { t: cfg.adeus || 'Só vim ver o fogo.' }]);
    return { inicio: 'a', nos: {
      a: { quem: nome, txt: typeof cfg.saudacao === 'function' ? cfg.saudacao() : cfg.saudacao, opc },
      m: { quem: nome, txt: cfg.dica, prox: 'a' }
    } };
  }
  OF.menuFerreiro = menuFerreiro;

  /* ---- Lia, na Forja da vila (Ato I) ---- */
  const forjaLia = () => { const c = M.interiores.find(k => k.nome === 'Forja de Lia'); if (!c) return null; const p = c.W(-2.2, -2.2); return { x: p.x, y: H(c.x, c.z) + 1.25, z: p.z }; };
  const cfgLia = {
    npc: 'lia', forja: forjaLia,
    saudacao: () => tem('armaduraMiguel') ? 'A Armadura de São Miguel ainda brilha em você. Foi a melhor peça que já saiu desta forja.' : 'A forja está acesa, graças a você. Traga os materiais certos, e eu faço coisa boa.',
    dica: 'Chifres de diabrete e lodo do tédio se acham aqui no vale; pelo de lobo, na floresta. Para coisas maiores, procure o Irmão Eustáquio, no mosteiro: os monges sabem forjar rezando. E dizem que, nas minas, um monge chamado Dunstano faz armas que nem o diabo aguenta.',
    receitas: [
      { item: () => OF.idArma(1), den: 40, mats: { chifre: 3, lodo: 2, pelo: 1 }, fala: 'Ferro bom, malhado a frio e benzido pelo Padre Tomé. Que ela corte só o que deve ser cortado.' },
      { item: 'armaduraMiguel', den: 180, mats: { mascaraAsmodeu: 1, pedraGargula: 1, carapaca: 3 }, mostrar: () => !!(F().ato2_fim || OF.qtd('mascaraAsmodeu')), fala: 'Derreti a máscara de Asmodeu no fogo mais quente da minha vida. O que era vaidade virou couraça. São Miguel que a vista.' }
    ]
  };
  { const lia0 = MS.ARV.lia; MS.ARV.lia = () => MS.feita('s5') ? menuFerreiro(cfgLia) : lia0(); }

  /* ---- uma oficina ao ar livre: telheiro, forja, bigorna e barris ---- */
  function oficina(x, z, rot, nome) {
    const g = M.grupo(x, z, rot), mad = M.MAT.wood, pedra = M.MAT.rock;
    [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(0.2, 3, 0.2), mad, a, 1.5, b)));
    const tl = mesh(new THREE.BoxGeometry(5.2, 0.16, 4.2), M.MAT.roofTile || mad, 0, 3.1, 0); tl.rotation.x = 0.12; g.add(tl);
    g.add(mesh(new THREE.BoxGeometry(1.8, 1.0, 1.3), pedra, -1.0, 0.5, -1.0));
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), new THREE.MeshBasicMaterial({ color: 0xff6a1a }), -1.0, 1.02, -1.0));
    g.add(mesh(new THREE.CylinderGeometry(0.35, 0.6, 2.4, 6), pedra, -1.0, 2.2, -1.4));
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), mad, 1.0, 0.3, 0.2)); g.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.32), M.MAT.iron, 1.0, 0.7, 0.2));
    [[1.6, -1.2], [1.9, -0.6]].forEach(([a, b]) => g.add(mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.85, 8), M.MAT.woodL, a, 0.42, b)));
    if (OV.cenario) OV.cenario.fundir(g);
    const cs = Math.cos(rot), sn = Math.sin(rot), W = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
    const f = W(-1.0, -1.0); M.emissor(f.x, H(x, z) + 1.5, f.z, 1.6, 9, 0xff5a1a);
    [[-1.0, -1.0, 0.9], [1.0, 0.2, 0.45], [1.7, -0.9, 0.5]].forEach(([a, b, r]) => { const q = W(a, b); M.obstacles.push({ x: q.x, z: q.z, r }); });
    if (M.LOCAIS && nome) M.LOCAIS['of_' + nome.toLowerCase().replace(/[^a-z]/g, '')] = { nome, x, z, oy: -20 };
    return { W, forja: () => ({ x: f.x, y: H(x, z) + 1.25, z: f.z }) };
  }

  /* ---- o Irmão Eustáquio, ferreiro do Mosteiro de Santa Sabina (Ato I, pede materiais do Ato II) ---- */
  const ofM = oficina(-26, -28, Math.PI * 0.15, 'Forja do Mosteiro');
  { const p = ofM.W(0.4, 1.6); M.criarFigura(p.x, p.z, Math.PI * 0.15, { id: 'eustaquio', nome: 'Irmão Eustáquio, o ferreiro', cor: 0x2a2220, capuz: true }); }
  const cfgEust = {
    npc: 'eustaquio', forja: ofM.forja,
    saudacao: () => MS.feita('m2') ? 'Ora et labora. Enquanto o ferro esquenta, eu rezo; quando o ferro está pronto, Deus já me disse onde bater. É o que chamo de «insight» do martelo.' : 'O claustro ainda está tomado. Volte quando os irmãos puderem rezar em paz.',
    dica: 'Para a arma do mosteiro preciso do que só se acha longe daqui: penas dos corvos do porto, carapaças dos caranguejos da gula e a tinta do polvo que vive na gruta dos contrabandistas. E uma pedra da gárgula do priorado, para a têmpera.',
    receitas: [{ item: () => OF.idArma(2), den: 90, mats: { pena: 3, carapaca: 2, tinta: 1, pedraGargula: 1 }, mostrar: () => MS.feita('m2'), fala: 'Cada golpe do martelo, um Pai-Nosso. Ela vai pesar menos do que parece, e ferir mais do que você espera.' }]
  };
  MS.ARV.eustaquio = () => menuFerreiro(cfgEust);

  /* ---- Irmão Dunstano, na Ermida de São Dunstano, nas Minas (Ato III, pede materiais do Ato IV) ---- */
  const ofD = oficina(-836, 108, -Math.PI * 0.35, 'Forja de São Dunstano');
  if (M.casa) M.casa(-845, 116, -Math.PI * 0.35, 5, 4.4, 3.2, { luz: true, rh: 2.2 });
  { const p = ofD.W(0.4, 1.6); M.criarFigura(p.x, p.z, -Math.PI * 0.35, { id: 'dunstano', nome: 'Irmão Dunstano, o monge ferreiro', cor: 0x1a1614, capuz: true }); }
  const cfgDun = {
    npc: 'dunstano', forja: ofD.forja,
    saudacao: 'Dizem que o santo cujo nome eu uso prendeu o nariz do diabo com as tenazes da forja. Eu nunca tentei. Mas as minhas armas, o diabo não aguenta.',
    dica: 'Élitros de ouro dos escaravelhos, asas dos morcegos e o chifre do bezerro de ouro, aqui das minas. E seda das mariposas da Corte das Máscaras: nada amarra melhor um cabo. Quem não foi até a Corte, não tem como.',
    receitas: [{ item: () => OF.idArma(3), den: 160, mats: { elitro: 3, asa: 2, chifreBezerro: 1, seda: 2 }, fala: 'Está pronta. Foi temperada em água benta e no silêncio de três noites. Não a use para a sua glória.' }]
  };
  MS.ARV.dunstano = () => menuFerreiro(cfgDun);
  OF.FERREIROS = { lia: cfgLia, eustaquio: cfgEust, dunstano: cfgDun };

  /* ---- v23: Mestre Teobaldo, na Vila de São Martinho (Ato VI). Depois que as espadas do Campo das Cinzas viram arados,
     ele forja o grau de Santo Elói, com os materiais dos Atos V e VI ---- */
  if (OV.marca && OV.marca.FORJA_TEO && M.figuras.teobaldo) {
    OF.FERREIROS.teobaldo = {
      npc: 'teobaldo', forja: OV.marca.FORJA_TEO,
      saudacao: () => 'Santo Elói era ourives antes de ser bispo. Fazia cálices para o altar e, com o ouro que sobrava, comprava cativos no mercado para libertá-los. Ferro bom é o que serve à vida.',
      dica: 'Para o grau de Santo Elói: uma escama de Leviatã, do lago da Vila dos Muros; olhos verdes dos invejosos de lá; presas dos cães de guerra e brasas vivas, aqui da Marca. A têmpera é na água do Rio Rubro.',
      receitas: [{ item: () => OF.idArma(4), den: 260, mats: { escamaLeviata: 1, olhoVerde: 2, presaCao: 3, brasaViva: 3 }, mostrar: () => MS.feita('a6s3'), fala: 'Bati esta com o mesmo martelo dos arados. Que ela só se levante contra o mal, e nunca contra um irmão.' }]
    };
  }

  /* ===================================================================
     O ANJO DA GUARDA, QUANDO É CHAMADO
     =================================================================== */
  const anjo = (function () {
    const g = new THREE.Group(), mats = [];
    const basic = (cor, op) => { const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthWrite: false }); m.userData.op = op === undefined ? 1 : op; mats.push(m); return m; };
    const veste = basic(0xf8f2e2), dourado = basic(0xf0c860), pele = basic(0xf0d6bc), cabelo = basic(0xd8b070), fogo = basic(0xfff0a0), asa = basic(0xffffff, 0.85);
    asa.side = THREE.DoubleSide;
    const brilho = basic(0xffe6a8, 0.22); brilho.blending = THREE.AdditiveBlending;
    const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); g.add(me); return me; };
    add(new THREE.CylinderGeometry(0.3, 0.6, 1.9, 10), veste, 0, 1.0, 0);
    add(new THREE.BoxGeometry(0.58, 0.55, 0.4), veste, 0, 2.0, 0);
    add(new THREE.SphereGeometry(0.21, 10, 8), pele, 0, 2.45, 0); add(new THREE.SphereGeometry(0.23, 10, 8), cabelo, 0, 2.5, -0.05);
    const halo = add(new THREE.TorusGeometry(0.28, 0.035, 6, 24), dourado, 0, 2.82, -0.08); halo.rotation.x = Math.PI / 2.4;
    add(new THREE.TorusGeometry(0.32, 0.04, 5, 16), dourado, 0, 1.75, 0).rotation.x = Math.PI / 2;
    const braco = new THREE.Group(); braco.position.set(0.36, 2.1, 0.05); g.add(braco);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.65, 0.16), veste); b1.position.y = -0.3; braco.add(b1);
    const espada = new THREE.Group(); espada.position.set(0, -0.65, 0.05); braco.add(espada);
    const lam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.03), fogo); lam.position.y = -0.8; espada.add(lam);
    const gu = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.07), dourado); espada.add(gu);
    const asas = [-1, 1].map(s => {
      const piv = new THREE.Group(); piv.position.set(0.12 * s, 2.15, -0.22);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(1.0 * s, 0.85, 1.75 * s, 0.5); sh.quadraticCurveTo(1.5 * s, -0.6, 1.0 * s, -1.6); sh.quadraticCurveTo(0.55 * s, -1.0, 0, -0.55); sh.closePath();
      const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), asa); m.rotation.y = -0.35 * s; piv.add(m); g.add(piv); return piv;
    });
    const aura = add(new THREE.SphereGeometry(1.7, 14, 10), brilho, 0, 1.6, 0);
    g.visible = false; M.scene.add(g);
    const luz = M.emissor(0, 0, 0, 0, 12, 0xffe6b0, false);
    return { g, mats, asas, halo, braco, espada, luz, aura };
  })();
  const AG = { ativo: false, t: 0, op: 0, alvo: null, golpeT: 0, x: 0, z: 0, y: 0 };
  OF.anjoAtivo = () => AG.ativo;
  OF.invocarAnjo = function () {
    AG.ativo = true; AG.t = 0; AG.dur = 30; AG.golpeT = 1.2; // v24: meio minuto (era um)
    const a = P.facing - 1.2; AG.x = P.pos.x + Math.sin(a) * 2.5; AG.z = P.pos.z + Math.cos(a) * 2.5; AG.y = H(AG.x, AG.z) + 6;
    C().anel(0xffe6a8, 5, 1.2, 0.9); if (A.bell) [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => A.bell(f, 0.16), i * 180));
    ui.clarao('#fff6dc'); ui.toast('«Santo Anjo do Senhor, meu zeloso guardador...» O seu anjo desce para lutar ao seu lado.');
    OV.jogo.shake(0.2);
  };
  function alvoAnjo() {
    let best = null, bd = 1e9;
    I.vivos().forEach(e => { if (e.def.fixo || e.removed) return; const d = Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z); if (d < 26 && d < bd) { bd = d; best = e; } });
    return best;
  }
  M.animados.push((dt, t) => {
    const g = anjo.g;
    if (!AG.ativo && AG.op <= 0.01) { g.visible = false; anjo.luz.int = 0; return; }
    const jogando = OV.jogo && OV.jogo.modo === 'jogo' && OV.jogo.ativo();
    if (AG.ativo && jogando) { AG.t += dt; if (AG.t >= AG.dur || P.dead) { AG.ativo = false; ui.toast('O seu anjo volta para o céu. Ele nunca deixa de guardar você.'); C().anel(0xffe6a8, 3, 0.9, 0.7); } }
    AG.op += ((AG.ativo ? 1 : 0) - AG.op) * Math.min(1, dt * 3);
    g.visible = AG.op > 0.02; anjo.mats.forEach(m => { m.opacity = m.userData.op * AG.op; });
    anjo.luz.int = 1.9 * AG.op;
    if (!jogando) return;
    // procura o vício mais perto do peregrino e luta com ele; sem vícios, fica ao lado
    let tx, tz, e = null;
    if (AG.ativo) { e = AG.alvo && AG.alvo.state !== 'dead' && AG.alvo.state !== 'liberto' && !AG.alvo.removed ? AG.alvo : alvoAnjo(); AG.alvo = e; }
    if (e) { const a = Math.atan2(AG.x - e.g.position.x, AG.z - e.g.position.z); tx = e.g.position.x + Math.sin(a) * (e.def.r + 1.3); tz = e.g.position.z + Math.cos(a) * (e.def.r + 1.3); }
    else { const a = P.facing - 1.0; tx = P.pos.x + Math.sin(a) * 2.4; tz = P.pos.z + Math.cos(a) * 2.4; }
    const dx = tx - AG.x, dz = tz - AG.z, dd = Math.hypot(dx, dz), vel = Math.min(dd, (e ? 9 : 6) * dt);
    if (dd > 0.01) { AG.x += dx / dd * vel; AG.z += dz / dd * vel; }
    AG.y += ((H(AG.x, AG.z) + 0.5 + Math.sin(t * 1.8) * 0.15) - AG.y) * Math.min(1, dt * 2.5);
    g.position.set(AG.x, AG.y, AG.z);
    const olha = e ? Math.atan2(e.g.position.x - AG.x, e.g.position.z - AG.z) : P.facing;
    g.rotation.y += OV.util.angWrap(olha - g.rotation.y) * Math.min(1, dt * 6);
    anjo.asas.forEach((p, i) => { p.rotation.y = (i ? -1 : 1) * (0.3 + Math.sin(t * (e ? 6 : 2.2)) * (e ? 0.3 : 0.12)); });
    anjo.halo.rotation.z += dt * 0.8; anjo.aura.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
    anjo.luz.x = AG.x; anjo.luz.y = AG.y + 2; anjo.luz.z = AG.z;
    // o golpe da espada de fogo
    AG.golpeT -= dt;
    const pronto = AG.golpeT <= 0;
    anjo.braco.rotation.x += ((pronto && e && dd < 1.5 ? -2.6 : -0.4) - anjo.braco.rotation.x) * Math.min(1, dt * 10);
    if (AG.ativo && e && dd < 1.6 && pronto) {
      AG.golpeT = 1.5;
      const dano = Math.round(((P.D ? P.D.dano : 12) * 0.9 + 6) * (e.def.chefe ? 0.6 : 1)); // v24: o anjo ajuda, não luta sozinho
      C().danoInimigo(e, dano, 5, Math.atan2(e.g.position.x - AG.x, e.g.position.z - AG.z), {});
      C().faisca(e.g.position.x, e.g.position.y + 1.2, e.g.position.z, 0xfff0a0);
      if (A.swish) A.swish();
    }
    // a presença do anjo consola: um pouco de vida e de Fé
    if (AG.ativo && P.D && !P.dead) { P.hp = Math.min(P.D.maxHp, P.hp + 0.5 * dt); P.fe = Math.min(P.D.maxFe, P.fe + 0.8 * dt); }
  });
  OF.anjoRestante = () => AG.ativo ? Math.max(0, AG.dur - AG.t) : 0;
  OF.anjoDur = () => AG.dur;
  OF.reiniciar = () => { AG.ativo = false; AG.op = 0; AG.alvo = null; anjo.g.visible = false; anjo.luz.int = 0; };
})(window.OV);

/* Ordo Virtutum — os caminhos das 12 ordens: habilidades, passivas, bônus de virtude, companheiros e efeitos */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { lerp, turnTo, angWrap } = OV.util;
  const sm = OV.sm, mesh = OV.mesh;
  const P = OV.P, ui = OV.ui, A = OV.audio;
  const C = () => OV.combate, I = () => OV.inimigos;
  const NOME_V = { prudencia: 'Prudência', justica: 'Justiça', fortaleza: 'Fortaleza', temperanca: 'Temperança', fe: 'Fé', esperanca: 'Esperança', caridade: 'Caridade' };

  /* ================= OS DOZE CAMINHOS =================
     Passivas nos níveis 1, 5 e 8; teclas F (nível 2), G (3), V (6) e B (10). */
  const pas = (id, nome, nivel, descr) => ({ id, nome, nivel, tipo: 'passiva', descr });
  const atv = (id, nome, nivel, tecla, custo, recarga, descr, extra) => Object.assign({ id, nome, nivel, tecla, custo, recarga, descr }, extra || {});
  const ULT = { consomeTudo: true };
  function caminho(nome, par, tri, extra, habil) {
    const b = `A cada nível par, +1 de ${NOME_V[par]}. Nos níveis 3, 6 e 9, +1 de ${NOME_V[tri]}.` + (extra ? ' ' + extra : '');
    return { nome, par, tri, bonus: b, habil };
  }
  OV.CAMINHOS = {
    joana: caminho("Caminho de Santa Joana d'Arc", 'fortaleza', 'justica', '', [
      pas('voz', 'Voz do Céu', 1, 'Nada a faz recuar: os golpes não interrompem o Recolhimento, e a Ira dura metade do tempo.'),
      atv('investida', 'Investida', 2, 'F', 25, 8, 'Avança 7 metros com a espada à frente, ferindo e derrubando tudo no caminho.', { cast: 0.35 }),
      atv('estandarte', 'Estandarte de Orléans', 3, 'G', 40, 30, 'Planta o estandarte por 15 s: no círculo dele, você causa 30% a mais de dano e os vícios ficam lentos.'),
      pas('armadura', 'Armadura da Donzela', 5, 'Enquanto o fôlego estiver acima da metade, você sofre 15% menos dano.'),
      atv('grito', 'Grito de Orléans', 6, 'V', 35, 18, 'Um brado em nome de Deus atordoa os vícios ao redor por 2 s e interrompe o golpe dos chefes.'),
      pas('feDonzela', 'Fé da Donzela', 8, 'Cada vício vencido devolve 8 de Fé e 5 de vida.'),
      atv('reims', 'Coroação em Reims', 10, 'B', 80, 60, 'Consome toda a Fé: 12 s de glória, com 60% mais dano, 40% menos dano recebido e golpes de espada mais longos.', ULT)
    ]),
    franciscano: caminho('Caminho de São Francisco', 'caridade', 'esperanca', 'Atos de caridade contam em dobro para o hábito.', [
      pas('paz', 'Paz das Criaturas', 1, 'Animais selvagens não atacam você. A Preguiça das Larvas do Tédio dura metade do tempo.'),
      atv('cantico', 'Cântico das Criaturas', 2, 'F', 30, 10, 'Um canto de louvor cura você e seus companheiros e purifica a Preguiça.', { gesto: 'ave' }),
      atv('lobo', 'Irmão Lobo', 3, 'G', 40, 30, 'Chama um lobo de luz que luta ao seu lado por 25 segundos. Com o Lobo do Vale como companheiro, ele avança com fúria dobrada.'),
      pas('alegria', 'Perfeita Alegria', 5, 'Com a vida abaixo de 30%, você sofre 25% menos dano e cada golpe recebido lhe devolve Fé.'),
      atv('pax', 'Paz e Bem', 6, 'V', 35, 18, 'Pax et Bonum: os vícios menores ao redor ficam atordoados por 4 segundos.'),
      pas('morte', 'Irmã Morte', 8, 'Uma vez a cada Oratório, ao cair, você se levanta com 1 de vida e toda a Fé.'),
      atv('sol', 'Cântico do Irmão Sol', 10, 'B', 80, 60, 'Consome toda a Fé: uma luz como o sol fere os demônios num grande círculo e cura metade da sua vida.', ULT)
    ]),
    dominicano: caminho({ m: 'Caminho de São Domingos', f: 'Caminho de Santa Catarina de Sena' }, 'prudencia', 'fe', '', [
      pas('lumen', 'Lumen', 1, 'A pregação revela a fraqueza do vício: quem é atingido fica marcado por 5 s e recebe 15% a mais de dano de tudo.'),
      atv('sermao', 'Sermão das Chamas', 2, 'F', 30, 9, 'Cinco línguas de fogo, como em Pentecostes, saem em leque à sua frente.'),
      atv('suma', 'Suma', 3, 'G', 35, 25, 'Por 12 s, cada acerto seguido fortalece o próximo em 10% (até 60%), como um argumento que se constrói.'),
      pas('disputatio', 'Disputatio', 5, 'O Sinal da Cruz não gasta Fé, e cada golpe aparado devolve 10 de Fé.'),
      atv('veritas', 'Veritas', 6, 'V', 40, 20, 'Um raio de Verdade em linha reta, de 18 metros, atravessa todos os vícios.'),
      pas('rosarioDomingos', 'Rosário de São Domingos', 8, 'No Recolhimento, a Fé volta 50% mais depressa.'),
      atv('doutor', 'Doutor Angélico', 10, 'B', 80, 60, 'Consome toda a Fé: por 10 s cada pregação lança três luzes e não gasta fôlego.', ULT)
    ]),
    diocesano: caminho({ m: "Caminho do Cura d'Ars", f: 'Caminho de Santa Luísa de Marillac' }, 'caridade', 'fe', '', [
      pas('curaAlmas', 'Cura de Almas', 1, 'A Ave-Maria cura 30% a mais.'),
      atv('bencao', 'Bênção', 2, 'F', 25, 8, 'Uma bênção forte cura muito e protege: por 6 s você sofre 30% menos dano.', { gesto: 'ave' }),
      atv('aguaBenta', 'Água Benta', 3, 'G', 35, 16, 'Asperge uma poça de água benta por 8 s: ela queima os vícios que a pisam e purifica você.'),
      pas('confessionario', 'Confessionário', 5, 'No Recolhimento, os vícios são purificados em 1 s em vez de 2, e a vida volta em dobro.'),
      atv('sinalPaz', 'Sinal da Paz', 6, 'V', 35, 20, 'Os possessos ao redor com menos da metade da vida são libertados na hora; os outros vícios ficam atordoados.'),
      pas('viatico', 'Viático', 8, 'Uma vez a cada Oratório, ao cair, você se levanta com metade da vida.'),
      atv('teDeum', 'Te Deum', 10, 'B', 80, 60, 'Consome toda a Fé: cura toda a vida, purifica todos os vícios e uma luz de louvor fere os demônios ao redor.', Object.assign({ gesto: 'ave' }, ULT))
    ]),
    miguel: caminho('Caminho de São Miguel', 'justica', 'fortaleza', '', [
      pas('milicia', 'Milícia Celeste', 1, 'Você causa 15% a mais de dano aos demônios.'),
      atv('quis', 'Quis ut Deus', 2, 'F', 30, 9, '"Quem como Deus?" Um golpe de luz em linha reta, de 12 metros, fere todos no caminho.'),
      atv('escudo', 'Escudo do Arcanjo', 3, 'G', 25, 12, 'Por 1,6 s nenhum golpe passa: o escudo devolve o dano ao atacante e o atordoa.', { cast: 0.3 }),
      pas('balanca', 'Balança da Justiça', 5, 'Golpes pesados em vícios atordoados causam 40% a mais.'),
      atv('lanca', 'Lança Celeste', 6, 'V', 40, 18, 'Uma lança de luz cai do céu sobre o alvo e fere tudo ao redor dele.'),
      pas('couraca', 'Couraça da Justiça', 8, 'Você sofre 15% menos dano, e a Soberba dura metade do tempo.'),
      atv('asas', 'Asas do Arcanjo', 10, 'B', 80, 60, 'Consome toda a Fé: asas de luz o cobrem por 10 s. Nada o fere, e cada golpe solta uma onda de luz.', ULT)
    ]),
    dimas: caminho({ m: 'Caminho de São Dimas', f: 'Caminho de Santa Maria Madalena' }, 'prudencia', 'justica', '', [
      pas('hojeMesmo', 'Hoje Mesmo', 1, '"Hoje mesmo estarás comigo no Paraíso." Uma vez a cada Oratório, ao cair, você se levanta com 30% da vida.'),
      atv('costas', 'Golpe pelas Costas', 2, 'F', 20, 6, 'Salta para trás do vício mais próximo e o fere com dano triplo.', { cast: 0.3 }),
      atv('sombra', 'Sombra', 3, 'G', 30, 18, 'Some da vista dos vícios por 4 s. O primeiro golpe nesse tempo é crítico (dano 2,5 vezes).', { cast: 0.2 }),
      pas('mao', 'Mão Ligeira', 5, 'Os vícios vencidos deixam o dobro de denários, e a esquiva gasta metade do fôlego.'),
      atv('arrependimento', 'Arrependimento', 6, 'V', 35, 20, 'Uma palavra ao coração: os possessos ao redor param de lutar por 4 s (cada um lhe dá 15 de Fé) e os demais vícios ficam atordoados.'),
      pas('paraiso', 'Paraíso Prometido', 8, 'Seus golpes têm 15% de chance de crítico (dano dobrado), e cada crítico lhe devolve vida.'),
      atv('comigo', 'Estarás Comigo', 10, 'B', 80, 60, 'Consome toda a Fé: por 8 s você caminha invisível entre os vícios, e todo golpe é crítico.', Object.assign({ cast: 0.2 }, ULT))
    ]),
    cecilia: caminho('Caminho de Santa Cecília', 'esperanca', 'temperanca', '', [
      pas('cantar', 'Quem Canta Reza Duas Vezes', 1, 'As orações custam 5 de Fé a menos.'),
      atv('gregoriano', 'Gregoriano', 2, 'F', 30, 20, 'Um canto gregoriano por 12 s: o fôlego volta em dobro e a Fé se renova sozinha.', { gesto: 'ave' }),
      atv('hino', 'Hino', 3, 'G', 30, 15, 'Um hino purifica todos os vícios em você e o protege deles por 8 s.', { gesto: 'ave' }),
      pas('harmonia', 'Harmonia', 5, 'Suas notas de luz atravessam o primeiro vício e seguem adiante.'),
      atv('polifonia', 'Polifonia', 6, 'V', 40, 18, 'Por 10 s, notas de luz giram ao seu redor e ferem quem se aproxima.'),
      pas('martires', 'Canto dos Mártires', 8, 'Com a vida abaixo de 40%, sua Fé se renova sozinha.'),
      atv('coro', 'Coro dos Anjos', 10, 'B', 80, 60, 'Consome toda a Fé: um coro celeste cura 60% da sua vida e atordoa todos os vícios num grande círculo por 4 s.', Object.assign({ gesto: 'ave' }, ULT))
    ]),
    bento: caminho({ m: 'Caminho de São Bento', f: 'Caminho de Santa Escolástica' }, 'temperanca', 'fortaleza', '', [
      pas('regra', 'A Regra', 1, 'O fôlego volta 40% mais depressa.'),
      atv('oraLabora', 'Ora et Labora', 2, 'F', 0, 1.5, 'Alterna a postura. Ora: 35% menos dano recebido e a Fé se renova. Labora: 25% mais dano e golpes que gastam menos fôlego.', { cast: 0.2, alterna: true }),
      atv('vadeRetro', 'Vade Retro', 3, 'G', 35, 14, '"Vade retro, Satana!" A medalha de São Bento empurra os vícios para longe e os atordoa.'),
      pas('estabilidade', 'Estabilidade', 5, 'Você sofre 10% menos dano, e o Sinal da Cruz atordoa 1 s a mais.'),
      atv('crux', 'Crux Sacra', 6, 'V', 35, 18, 'Um giro do cajado fere duas vezes todos os vícios ao redor.', { cast: 0.5 }),
      pas('silencio', 'Silêncio', 8, 'Os golpes não interrompem o Recolhimento, e ele cura em dobro.'),
      atv('escada', 'Escada de São Bento', 10, 'B', 80, 60, 'Consome toda a Fé: por 10 s cada golpe cura 8 de vida e solta uma onda que fere os vícios ao redor do alvo.', ULT)
    ]),
    eremita: caminho({ m: 'Caminho de Santo Antão', f: 'Caminho de Santa Sinclética' }, 'prudencia', 'temperanca', '', [
      pas('vigilia', 'Vigília', 1, 'Você nunca é pego de surpresa: o primeiro golpe de cada vício contra você causa metade do dano.'),
      atv('flechaAbencoada', 'Flecha Abençoada', 2, 'F', 25, 7, 'Uma flecha abençoada atravessa todos os vícios em linha, com dano dobrado.'),
      atv('discernimento', 'Discernimento dos Espíritos', 3, 'G', 30, 25, 'Por 12 s, todos os vícios num raio de 25 metros ficam revelados e recebem 25% a mais de dano.'),
      pas('deserto', 'Solidão do Deserto', 5, 'Sem nenhum vício a menos de 8 metros, suas flechas causam 20% a mais de dano.'),
      atv('chuva', 'Chuva do Deserto', 6, 'V', 40, 20, 'Uma chuva de flechas de luz cai por 3 s sobre o alvo e ao redor dele.'),
      pas('jejumEremita', 'Jejum do Eremita', 8, 'A Gula e a Preguiça duram metade do tempo.'),
      atv('tentacoes', 'Tentações Vencidas', 10, 'B', 80, 60, 'Consome toda a Fé: por 10 s cada flecha se divide em três e atordoa quem acerta.', ULT)
    ]),
    norte: caminho({ m: 'Caminho de Santo Olavo', f: 'Caminho de Santa Olga' }, 'fortaleza', 'justica', '', [
      pas('rocha', 'Rocha', 1, 'Seu corpo não cede: você sofre 15% menos dano.'),
      atv('zelo', 'Santo Zelo', 2, 'F', 25, 12, 'Por 8 s, 50% a mais de dano. Usado de novo antes de 20 s, o zelo vira Ira.'),
      atv('carregar', 'Carregar', 3, 'G', 30, 14, 'Como São Cristóvão atravessando o rio, você avança 8 metros sem ser ferido e derruba quem estiver no caminho.', { cast: 0.4 }),
      pas('batismo', 'Batismo de Fogo', 5, 'Com a vida abaixo de 40%, você causa 25% a mais de dano.'),
      atv('martelo', 'Martelo do Norte', 6, 'V', 40, 18, 'Um golpe no chão solta uma onda de choque que fere e atordoa os vícios ao redor.', { cast: 0.5 }),
      pas('vigor', 'Vigor', 8, 'Cada vício vencido lhe devolve 8 de vida.'),
      atv('stiklestad', 'Stiklestad', 10, 'B', 80, 60, 'Consome toda a Fé: a última batalha de Santo Olavo. Por 12 s você não cai e causa 50% a mais de dano.', ULT)
    ]),
    mistico: caminho({ m: 'Caminho de São Pio', f: "Caminho de Santa Teresa d'Ávila" }, 'fe', 'esperanca', '', [
      pas('leitura', 'Leitura de Almas', 1, 'Você vê o pecado que cada vício traz (ao lado do nome), e os vícios duram 30% menos em você.'),
      atv('sofrimento', 'Sofrimento Oferecido', 2, 'F', 0, 10, 'Oferece 20% da sua vida e recebe 50 de Fé.', { gesto: 'ave' }),
      atv('bilocacao', 'Bilocação', 3, 'G', 35, 22, 'Deixa um duplo de luz por 8 s. Os vícios por perto atacam o duplo em vez de você.'),
      pas('estigmas', 'Estigmas', 5, 'Quando você é ferido, 20% do dano volta como Fé.'),
      atv('extase', 'Êxtase', 6, 'V', 40, 20, 'Por 4 s nada o fere, e os vícios ao redor recebem dano sem parar.', { gesto: 'ave' }),
      pas('castelo', 'Castelo Interior', 8, 'Sua Fé máxima aumenta 30, e no Recolhimento a Fé volta 30% mais depressa.'),
      atv('noite', 'Noite Escura e Aurora', 10, 'B', 80, 60, 'Consome toda a Fé: a luz rompe a noite escura. Fere todos os vícios num grande círculo (o dobro nos demônios) e liberta os possessos.', ULT)
    ]),
    cipriano: caminho({ m: 'Caminho de São Cipriano', f: 'Caminho de Santa Gemma' }, 'fe', 'justica', '', [
      pas('nome', 'O Nome', 1, 'Ao vencer um tipo de vício pela primeira vez, você aprende o nome dele. Daí em diante, causa 20% a mais de dano a ele.'),
      atv('exorcismo', 'Exorcismo', 2, 'F', 30, 10, 'Prende o vício-alvo em correntes de luz por 4 s (menos nos chefes) e o fere sem parar.'),
      atv('rompimento', 'Rompimento do Pacto', 3, 'G', 40, 25, 'Liberta na hora o possesso mais próximo, que luta ao seu lado por 20 s.'),
      pas('estola', 'Estola', 5, 'Vícios presos ou atordoados recebem 30% a mais de dano.'),
      atv('ritual', 'Ritual Romano', 6, 'V', 45, 20, 'As palavras do rito atordoam e ferem todos os vícios ao redor.'),
      pas('penitencia', 'Penitência de Cipriano', 8, 'Como o antigo feiticeiro convertido, você resiste: a Ira e a Soberba não duram mais de 2 s em você.'),
      atv('vadeSatana', 'Exorcismo Solene', 10, 'B', 80, 60, 'Consome toda a Fé: o grande exorcismo fere muito os demônios ao redor, tira 15% da vida dos chefes e liberta os possessos.', ULT)
    ])
  };

  const H = { aliados: [], cd: {}, buffs: {}, zonas: [], agenda: [], suma: 0, postura: null, relogio: 0, ultimoZelo: -99, dash: null };
  OV.habilidades = H;
  const cam = () => P.pers ? OV.CAMINHOS[P.pers.ordem] : null;
  H.nomeCaminho = c => typeof c.nome === 'string' ? c.nome : c.nome[(P.pers && P.pers.sexo) || 'm'];
  H.lista = () => (cam() ? cam().habil : []);
  H.tem = id => { const h = H.lista().find(x => x.id === id); return !!(h && P.pers && P.pers.nivel >= h.nivel); };
  H.ativas = () => H.lista().filter(h => h.tecla);
  H.buff = id => (H.buffs[id] && H.buffs[id].t > 0) ? H.buffs[id] : null;
  function darBuff(id, dur, extra) { H.buffs[id] = Object.assign({ t: dur, dur }, extra || {}); }
  const vivos = () => I().vivos();
  const dist = e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z);
  const angPara = e => Math.atan2(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z);
  const demonio = e => !e.def.liberta && !e.def.animal && !e.def.fixo;
  const possesso = e => e.def.liberta && !e.def.chefe;
  const naoChefe = e => !e.def.chefe;
  const frente = d => ({ x: P.pos.x + Math.sin(P.facing) * d, z: P.pos.z + Math.cos(P.facing) * d });
  function alvoProx(max) {
    if (P.alvo && P.alvo.state !== 'dead' && P.alvo.state !== 'liberto' && dist(P.alvo) < max) return P.alvo;
    let best = null, bs = 1e9;
    vivos().forEach(e => { const d = dist(e); if (d > max) return; const s = d + Math.abs(angWrap(angPara(e) - P.facing)) * 3; if (s < bs) { bs = s; best = e; } });
    return best;
  }
  function libertar(e) { if (e.state === 'dead' || e.state === 'liberto') return; C().danoInimigo(e, e.hp + 999, 0, 0); }
  function atordoar(e, t, tChefe) { if (e.def.chefe) { if (tChefe) I().atordoar(e, tChefe); else if (e.state === 'windup') { e.state = 'recover'; e.t = 0.8; } } else I().atordoar(e, t); }
  function area(r, fn) { vivos().forEach(e => { if (dist(e) < r + e.def.r) fn(e, dist(e)); }); }
  const ferir = (e, dano, knock, extra) => C().danoInimigo(e, Math.round(dano), knock === undefined ? 4 : knock, angPara(e), Object.assign({ jogador: true }, extra || {}));
  const agendar = (t, fn) => H.agenda.push({ t, fn });

  /* ---- bônus ao subir de nível ---- */
  H.aoSubirNivel = function (nivel) {
    const msgs = [], c = cam(); if (!c) return msgs;
    const v = P.pers.virt;
    if (nivel % 2 === 0 && v[c.par] < OV.MAX_VIRTUDE) { v[c.par]++; msgs.push(`${H.nomeCaminho(c)}: +1 de ${NOME_V[c.par]}`); }
    if (nivel % 3 === 0 && v[c.tri] < OV.MAX_VIRTUDE) { v[c.tri]++; msgs.push(`+1 de ${NOME_V[c.tri]}`); }
    H.lista().forEach(h => { if (h.nivel === nivel) msgs.push(`Nova habilidade: ${h.nome}${h.tecla ? ` (tecla ${h.tecla})` : ''}`); });
    return msgs;
  };

  /* ================= MODIFICADORES (consultados pelo combate) ================= */
  H.modDano = function (e, d, opts) {
    let m = 1;
    if (H.buff('reims')) m *= 1.6;
    if (H.buff('zelo')) m *= 1.5;
    if (H.buff('stiklestad')) m *= 1.5;
    if (H.buff('suma')) m *= 1 + 0.1 * H.suma;
    if (H.postura === 'labora') m *= 1.25;
    if (H.zonas.some(z => z.tipo === 'estandarte' && Math.hypot(P.pos.x - z.x, P.pos.z - z.z) < z.r)) m *= 1.3;
    if (H.tem('milicia') && demonio(e)) m *= 1.15;
    if (H.tem('balanca') && opts.pesado && e.state === 'stun') m *= 1.4;
    if (H.tem('estola') && e.state === 'stun') m *= 1.3;
    if (H.tem('batismo') && P.hp < P.D.maxHp * 0.4) m *= 1.25;
    if (H.tem('deserto') && opts.projetil && !vivos().some(x => dist(x) < 8)) m *= 1.2;
    if (H.tem('nome') && P.pers.nomes && P.pers.nomes[e.def.key]) m *= 1.2;
    if (P.oculto > 0 || H.buff('comigo')) { m *= 2.5; opts.critico = true; if (!H.buff('comigo')) { P.oculto = 0; fantasma(false); } }
    else if (H.tem('paraiso') && Math.random() < 0.15) { m *= 2; opts.critico = true; }
    if (opts.critico) C().faisca(e.g.position.x, e.g.position.y + 1.4, e.g.position.z, 0xff5a3a);
    return Math.round(d * m);
  };
  H.aoAcertar = function (e, d, opts) {
    if (H.buff('suma')) H.suma = Math.min(6, H.suma + 1);
    if (H.tem('lumen') && opts.projetil) { e.marca = Math.max(e.marca || 0, 5); e.marcaF = Math.max(e.marcaF || 0, 0.15); }
    if (opts.critico && H.tem('paraiso')) P.hp = Math.min(P.D.maxHp, P.hp + Math.max(3, Math.round(d * 0.1)));
    if (H.buff('escada')) P.hp = Math.min(P.D.maxHp, P.hp + 8);
    if ((H.buff('escada') || H.buff('asas')) && !opts.onda) {
      const x = e.g.position.x, z = e.g.position.z;
      onda(x, z, 3, H.buff('asas') ? 0xfff1c8 : 0xe8d8a8);
      vivos().forEach(o => { if (o !== e && Math.hypot(o.g.position.x - x, o.g.position.z - z) < 3 + o.def.r) C().danoInimigo(o, Math.round(d * 0.5), 3, Math.atan2(o.g.position.x - x, o.g.position.z - z), { jogador: true, onda: true }); });
    }
  };
  H.aoVencer = function (e) {
    if (e.def.fixo) return;
    if (H.tem('feDonzela')) { P.fe = Math.min(P.D.maxFe, P.fe + 8); P.hp = Math.min(P.D.maxHp, P.hp + 5); }
    if (H.tem('vigor')) P.hp = Math.min(P.D.maxHp, P.hp + 8);
    if (H.tem('nome')) {
      P.pers.nomes = P.pers.nomes || {};
      if (!P.pers.nomes[e.def.key]) { P.pers.nomes[e.def.key] = true; setTimeout(() => ui.toast(`Você aprendeu o nome: ${e.def.name}. Daqui em diante ele o teme.`), 600); }
    }
  };
  H.modFerido = function (dmg, fonte) {
    if (H.buff('escudo')) {
      if (fonte && fonte.state !== 'dead' && fonte.state !== 'liberto') { C().danoInimigo(fonte, Math.round(dmg * 1.5) + P.D.dano, 6, angPara(fonte), { jogador: true }); I().atordoar(fonte, 1.5); C().faisca(P.pos.x, P.pos.y + 1.4, P.pos.z, 0x9ac0ff); }
      A.parry(); return 0;
    }
    if (H.buff('asas') || H.buff('extase')) return 0;
    let m = 1;
    if (H.tem('alegria') && P.hp - dmg < P.D.maxHp * 0.3) { m *= 0.75; P.fe = Math.min(P.D.maxFe, P.fe + 6); }
    if (H.tem('armadura') && P.sta > P.D.maxSta * 0.5) m *= 0.85;
    if (H.tem('couraca')) m *= 0.85;
    if (H.tem('rocha')) m *= 0.85;
    if (H.tem('estabilidade')) m *= 0.9;
    if (H.postura === 'ora') m *= 0.65;
    if (H.buff('bencao')) m *= 0.7;
    if (H.buff('reims')) m *= 0.6;
    if (H.tem('vigilia') && fonte && !fonte._vigiado) { fonte._vigiado = true; m *= 0.5; }
    dmg = Math.round(dmg * m);
    if (H.buff('stiklestad') && P.hp - dmg < 1) dmg = Math.max(0, Math.floor(P.hp - 1));
    return dmg;
  };
  H.aoFerido = function (dmg) { if (H.tem('estigmas')) P.fe = Math.min(P.D.maxFe, P.fe + dmg * 0.2); };
  H.reviver = function () {
    if (H.tem('morte')) return { hp: 0, fe: true, msg: 'Irmã Morte ainda não veio buscá-lo. Levante-se e louve.' };
    if (H.tem('viatico')) return { hp: 0.5, msg: 'O Viático o sustenta: você se levanta.' };
    if (H.tem('hojeMesmo')) return { hp: 0.3, msg: '"Hoje mesmo estarás comigo." Você se levanta, perdoado.' };
    return null;
  };
  H.recolhimentoFirme = () => H.tem('voz') || H.tem('silencio');
  H.durStatus = function (k, base) {
    if (H.buff('hino')) return 0;
    let d = base;
    if (OV.itens && OV.itens.meio(k)) d *= 0.5;
    if (k === 'preguica' && H.tem('paz')) d *= 0.5;
    if (k === 'ira' && H.tem('voz')) d *= 0.5;
    if (k === 'soberba' && H.tem('couraca')) d *= 0.5;
    if ((k === 'gula' || k === 'preguica') && H.tem('jejumEremita')) d *= 0.5;
    if (H.tem('leitura')) d *= 0.7;
    if ((k === 'ira' || k === 'soberba') && H.tem('penitencia')) d = Math.min(d, 2);
    return d;
  };
  H.multCura = () => H.tem('curaAlmas') ? 1.3 : 1;
  H.multPrayHp = () => (H.tem('confessionario') ? 2 : 1) * (H.tem('silencio') ? 2 : 1);
  H.multPrayFe = () => (H.tem('rosarioDomingos') ? 1.5 : 1) * (H.tem('castelo') ? 1.3 : 1);
  H.multSta = () => (H.tem('regra') ? 1.4 : 1) * (H.buff('gregoriano') ? 2 : 1);
  H.multFolego = () => H.buff('doutor') ? 0 : H.postura === 'labora' ? 0.7 : 1;
  H.multVel = () => H.buff('comigo') ? 1.15 : 1;
  H.multAlcance = () => H.buff('reims') ? 1.3 : 1;
  H.multiProjetil = () => !!(H.buff('doutor') || H.buff('tentacoes'));

  /* ================= USO ================= */
  // com que atributo a habilidade cresce: lido da própria fórmula, para nunca ficar desatualizado
  H.cresceCom = function (h, ordem) {
    if (!h || h.tipo === 'passiva') return '';
    const fn = EFEITOS[h.id]; if (!fn) return '';
    const src = fn.toString(), out = [];
    if (/P\.D\.burst|virt\.fe|P\.D\.miguel/.test(src)) out.push('Fé');
    if (/P\.D\.dano/.test(src)) { const a = OV.ORDENS[ordem] && OV.ORDENS[ordem].atributo; out.push(`${NOME_V[a] || 'Justiça'} (dano da arma)`); }
    if (/P\.D\.cura/.test(src)) out.push('Caridade e Fé (cura)');
    return out.join(' e ');
  };
  H.usar = function (tecla) {
    if (!OV.jogo.ativo() || P.dead) return;
    const h = H.lista().find(x => x.tecla === tecla);
    if (!h) return;
    if (P.pers.nivel < h.nivel) { ui.toast(`${h.nome} se aprende no nível ${h.nivel}.`); return; }
    if ((H.cd[h.id] || 0) > 0) return;
    if (P.status.soberba && h.custo > 0) { ui.toast('A Soberba impede a oração.'); return; }
    if (P.castT > 0 || P.dodgeT > 0 || P.oratT > 0 || H.dash) return;
    if (P.fe < h.custo) { ui.toast('Fé insuficiente. Segure R para rezar.'); return; }
    const fe0 = P.fe;
    if (h.consomeTudo) P.fe = 0; else P.fe -= h.custo;
    H.cd[h.id] = h.recarga; P.castT = h.cast !== undefined ? h.cast : 0.75; P.castKind = h.gesto || 'miguel'; P.atkT = 0; P.praying = false;
    if (EFEITOS[h.id]() === false) { P.fe = fe0; H.cd[h.id] = 0; P.castT = 0; }
  };

  /* ================= VISUAIS ================= */
  const basic = (cor, op) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op === undefined ? 0.8 : op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  function onda(x, z, r, cor) {
    const y = M.altura(x, z) + 0.12;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 36), basic(cor, 0.85)); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y, z);
    C().efeito([ring], 0.5, p => { ring.scale.setScalar(0.3 + p * r); ring.material.opacity = 0.85 * (1 - p); });
  }
  function feixe(len, larg, cor) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.5, len), basic(cor, 0.85));
    const f = frente(len / 2); m.position.set(f.x, P.pos.y + 1.2, f.z); m.rotation.y = P.facing;
    C().efeito([m], 0.45, p => { m.material.opacity = 0.85 * (1 - p); m.scale.x = 1 + p * 0.8; m.scale.y = 1 - p * 0.6; });
  }
  function emLinha(len, larg) {
    const dx = Math.sin(P.facing), dz = Math.cos(P.facing), out = [];
    vivos().forEach(e => { const rx = e.g.position.x - P.pos.x, rz = e.g.position.z - P.pos.z, t = rx * dx + rz * dz; if (t < 0 || t > len) return; if (Math.abs(rx * dz - rz * dx) < larg + e.def.r) out.push(e); });
    return out;
  }
  function coluna(x, z, cor, alt) {
    const y = M.altura(x, z);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, alt || 12, 12, 1, true), basic(cor, 0.6)); c.position.set(x, y + (alt || 12) / 2, z);
    C().efeito([c], 0.7, p => { c.material.opacity = 0.6 * (1 - p); c.scale.x = c.scale.z = 1 + p; });
  }
  let fantasmaMats = null;
  function fantasma(b) {
    if (!P.heroi) return;
    if (b) {
      if (fantasmaMats) return; fantasmaMats = [];
      P.heroi.g.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && !fantasmaMats.includes(o.material)) fantasmaMats.push(o.material); });
      fantasmaMats.forEach(m => { m.transparent = true; m.opacity = 0.28; m.needsUpdate = true; });
    } else if (fantasmaMats) { fantasmaMats.forEach(m => { m.opacity = 1; m.transparent = false; m.needsUpdate = true; }); fantasmaMats = null; }
  }
  function zona(o) {
    const y = M.altura(o.x, o.z) + 0.1;
    const disco = new THREE.Mesh(new THREE.CircleGeometry(o.r, 32), basic(o.cor, 0.22)); disco.rotation.x = -Math.PI / 2; disco.position.set(o.x, y, o.z); M.scene.add(disco);
    const borda = new THREE.Mesh(new THREE.RingGeometry(o.r - 0.12, o.r, 40), basic(o.cor, 0.7)); borda.rotation.x = -Math.PI / 2; borda.position.set(o.x, y + 0.01, o.z); M.scene.add(borda);
    const z = Object.assign({ tick: 0, meshes: [disco, borda], extras: [] }, o, { dur: o.t });
    H.zonas.push(z); return z;
  }
  function removerZona(z) { z.meshes.concat(z.extras).forEach(m => M.scene.remove(m)); }

  /* ================= EFEITOS DAS HABILIDADES ================= */
  const EFEITOS = {
    /* --- Franciscanos --- */
    cantico() {
      const v = P.pers.virt, cura = 20 + v.caridade * 4;
      P.hp = Math.min(P.D.maxHp, P.hp + cura);
      if (P.status.preguica) delete P.status.preguica;
      H.aliados.forEach(a => { a.hp = a.maxHp; });
      C().anel(0x9fdc7a, 3.2, 1.1, 0.75); C().anel(0xffe2a0, 2.2, 0.8, 0.5);
      folhas(P.pos.x, P.pos.y, P.pos.z, 0xa8d878);
      A.bell(523, 0.14); setTimeout(() => A.bell(659, 0.12), 160); setTimeout(() => A.bell(784, 0.1), 320);
    },
    lobo() {
      const comp = H.aliados.find(a => a.permanente);
      if (comp) { comp.furia = 10; ui.toast('Irmão Lobo, avante!'); A.bell(392, 0.15); return; }
      H.chamarLobo(false); A.bell(330, 0.18);
    },
    pax() {
      let n = 0;
      area(8, e => { if (naoChefe(e)) { I().atordoar(e, 4); n++; } });
      C().anel(0xf4f0e6, 7, 0.9, 0.7);
      for (let i = 0; i < 6; i++) pomba(P.pos.x, P.pos.y + 1.5, P.pos.z, i);
      A.bell(587, 0.18);
      if (!n) ui.toast('Pax et Bonum.');
    },
    sol() {
      C().anel(0xffd27a, 12, 1.3, 0.95); C().anel(0xfff1c8, 8, 1.0, 0.7);
      M.burstLight.position.set(P.pos.x, P.pos.y + 3, P.pos.z); M.burstLight.intensity = 9;
      P.hp = Math.min(P.D.maxHp, P.hp + P.D.maxHp * 0.5);
      area(12, (e, d) => ferir(e, P.D.burst * 2.5 * (1 - d / 24), 10));
      OV.jogo.shake(0.4); A.bell(262, 0.32); setTimeout(() => A.bell(392, 0.25), 220);
    },

    /* --- Santa Joana d'Arc --- */
    investida() { H.dash = { dir: P.facing, dist: 7, vel: 22, dano: P.D.dano * 1.5, atord: 1.0, atingidos: new Set(), invuln: false, cor: 0xe8e0c8 }; A.heavy(); },
    estandarte() {
      const z = zona({ tipo: 'estandarte', x: P.pos.x, z: P.pos.z, r: 6, t: 15, cor: 0xf0d890 });
      const y = M.altura(z.x, z.z);
      const mastro = mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6), sm(0x4a3422), z.x, y + 1.8, z.z);
      const pano = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), sm(0xece4d0, { side: THREE.DoubleSide })); pano.position.set(z.x + 0.52, y + 2.85, z.z);
      const lis = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), sm(0xc9a24a, { side: THREE.DoubleSide })); lis.position.set(z.x + 0.52, y + 2.9, z.z + 0.01);
      [mastro, pano, lis].forEach(m => M.scene.add(m)); z.extras.push(mastro, pano, lis);
      A.bell(392, 0.2); setTimeout(() => A.bell(494, 0.16), 200); ui.toast('O estandarte de Orléans se ergue!');
    },
    grito() { area(7, e => atordoar(e, 2)); C().anel(0xf0d890, 6, 0.6, 0.85); OV.jogo.shake(0.25); A.bell(196, 0.25); },
    reims() { darBuff('reims', 12); C().anel(0xffd27a, 4, 1.0, 0.9); M.burstLight.position.set(P.pos.x, P.pos.y + 3, P.pos.z); M.burstLight.intensity = 6; A.bell(523, 0.3); setTimeout(() => A.bell(659, 0.25), 250); ui.toast('Coroação em Reims: glória a Deus!'); },

    /* --- Dominicanos --- */
    sermao() {
      const o = C().origemMao();
      for (let i = -2; i <= 2; i++) { const a = P.facing + i * 0.22; C().lancar({ origem: o, dir: C().direcaoTiro(o, a, 13, i === 0 ? P.mira : null), dano: P.D.dano * 1.2, cor: 0xffd8a0, brilho: 0xff6a1a, alcance: 13, raio: 0.2 }); }
      A.cast();
    },
    suma() { H.suma = 0; darBuff('suma', 12); C().anel(0xffe2a0, 2.5, 0.8, 0.7); ui.toast('Suma: cada acerto seguido fortalece o próximo.'); },
    veritas() {
      feixe(18, 1.0, 0xfff1c8);
      emLinha(18, 1.1).forEach(e => ferir(e, P.D.burst * 1.2 + P.D.dano, 6));
      A.bell(587, 0.22); OV.jogo.shake(0.2);
    },
    doutor() { darBuff('doutor', 10); C().anel(0xffe2a0, 4, 1.0, 0.9); A.bell(440, 0.25); ui.toast('Doutor Angélico: a Verdade se multiplica.'); },

    /* --- Clero diocesano --- */
    bencao() { P.hp = Math.min(P.D.maxHp, P.hp + 40 + P.pers.virt.caridade * 5); darBuff('bencao', 6); C().anel(0xcfe0ff, 2.6, 0.9, 0.75); A.heal(); },
    aguaBenta() {
      const f = frente(2.5);
      zona({ tipo: 'agua', x: f.x, z: f.z, r: 4, t: 8, cor: 0x8ac8ff, dps: 10 + P.pers.virt.fe * 2, purga: true });
      for (let i = 0; i < 10; i++) gota(f.x, f.z, i);
      A.cast();
    },
    sinalPaz() {
      let n = 0;
      area(8, e => { if (possesso(e) && e.hp < e.def.hp * 0.5) { libertar(e); n++; } else atordoar(e, 1.5); });
      C().anel(0xf4f0e6, 7, 0.9, 0.7); A.bell(587, 0.2);
      ui.toast(n ? `A paz esteja convosco. ${n} ${n > 1 ? 'possessos foram libertados' : 'possesso foi libertado'}.` : 'A paz esteja convosco.');
    },
    teDeum() {
      P.hp = P.D.maxHp; P.status = {};
      C().anel(0xffd27a, 12, 1.3, 0.95); M.burstLight.position.set(P.pos.x, P.pos.y + 3, P.pos.z); M.burstLight.intensity = 8;
      area(12, (e, d) => ferir(e, P.D.burst * 2 * (1 - d / 24), 8));
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => A.bell(f, 0.2), i * 180));
      ui.toast('Te Deum laudamus!');
    },

    /* --- São Miguel --- */
    quis() { feixe(12, 1.2, 0xbfd8ff); emLinha(12, 1.3).forEach(e => ferir(e, P.D.dano * 2 + P.pers.virt.fe * 3, 7)); A.bell(440, 0.22); OV.jogo.shake(0.2); },
    escudo() { darBuff('escudo', 1.6); C().anel(0x9ac0ff, 1.4, 1.6, 0.8); A.parry(); },
    lanca() {
      const t = alvoProx(14); const p = t ? { x: t.g.position.x, z: t.g.position.z } : frente(6);
      coluna(p.x, p.z, 0xdfe8ff, 14); onda(p.x, p.z, 3, 0xdfe8ff);
      vivos().forEach(e => { const d = Math.hypot(e.g.position.x - p.x, e.g.position.z - p.z); if (d < 3 + e.def.r) C().danoInimigo(e, Math.round(P.D.burst * 1.8), 6, Math.atan2(e.g.position.x - p.x, e.g.position.z - p.z), { jogador: true }); });
      M.burstLight.position.set(p.x, M.altura(p.x, p.z) + 3, p.z); M.burstLight.intensity = 6; A.bell(330, 0.3); OV.jogo.shake(0.35);
    },
    asas() { darBuff('asas', 10); asasVisuais(true); C().anel(0xfff1c8, 5, 1.0, 0.9); A.bell(523, 0.3); setTimeout(() => A.bell(784, 0.25), 220); ui.toast('As asas do Arcanjo o cobrem.'); },

    /* --- São Dimas --- */
    costas() {
      const t = alvoProx(9); if (!t) { ui.toast('Nenhum vício perto o bastante.'); return false; }
      const r = t.g.rotation.y, x = t.g.position.x - Math.sin(r) * (t.def.r + 0.9), z = t.g.position.z - Math.cos(r) * (t.def.r + 0.9);
      C().faisca(P.pos.x, P.pos.y + 1, P.pos.z, 0x6a5a7a);
      C().posicionar(x, z, Math.atan2(t.g.position.x - x, t.g.position.z - z)); M.collide(P.pos, 0.45);
      ferir(t, P.D.dano * 3, 5, { critico: true });
      A.swish();
    },
    sombra() { P.oculto = 4; fantasma(true); C().faisca(P.pos.x, P.pos.y + 1, P.pos.z, 0x4a3a5a); A.dodge(); },
    arrependimento() {
      let n = 0;
      area(8, e => { if (possesso(e)) { I().atordoar(e, 4); n++; } else atordoar(e, 2.5); });
      P.fe = Math.min(P.D.maxFe, P.fe + n * 15);
      C().anel(0xd8c0e8, 7, 0.9, 0.7); A.bell(494, 0.18);
    },
    comigo() { darBuff('comigo', 8); P.oculto = 8; fantasma(true); C().anel(0x8a7aa0, 3, 0.8, 0.7); A.bell(392, 0.25); },

    /* --- Santa Cecília --- */
    gregoriano() { darBuff('gregoriano', 12); notas(P.pos.x, P.pos.y, P.pos.z, 0x9ac8ff); A.bell(440, 0.14); setTimeout(() => A.bell(494, 0.12), 300); setTimeout(() => A.bell(440, 0.12), 600); },
    hino() { P.status = {}; darBuff('hino', 8); C().anel(0xcfe0ff, 3, 0.9, 0.75); notas(P.pos.x, P.pos.y, P.pos.z, 0xf0e0a0); A.bell(587, 0.16); setTimeout(() => A.bell(659, 0.14), 200); },
    polifonia() {
      const z = zona({ tipo: 'polifonia', x: P.pos.x, z: P.pos.z, r: 2.9, t: 10, cor: 0x7ab0ff, dps: 8 + P.pers.virt.esperanca * 2, seguir: true });
      for (let i = 0; i < 3; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xdcefff })); n.add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), basic(0x6aa8ff, 0.4))); M.scene.add(n); z.extras.push(n); }
      A.bell(523, 0.14); setTimeout(() => A.bell(659, 0.12), 150); setTimeout(() => A.bell(784, 0.1), 300);
    },
    coro() {
      P.hp = Math.min(P.D.maxHp, P.hp + P.D.maxHp * 0.6);
      area(12, e => atordoar(e, 4, 1.5));
      C().anel(0xfff1c8, 12, 1.4, 0.9); for (let i = 0; i < 6; i++) pomba(P.pos.x, P.pos.y + 1.5, P.pos.z, i);
      [523, 659, 784, 659, 1046].forEach((f, i) => setTimeout(() => A.bell(f, 0.18), i * 200));
      ui.toast('Sanctus, Sanctus, Sanctus!');
    },

    /* --- São Bento --- */
    oraLabora() {
      H.postura = H.postura === 'ora' ? 'labora' : 'ora';
      C().anel(H.postura === 'ora' ? 0xcfe0ff : 0xf0c070, 1.6, 0.5, 0.7); A.bell(H.postura === 'ora' ? 440 : 330, 0.12);
      ui.toast(H.postura === 'ora' ? 'Ora: postura de oração (menos dano recebido, a Fé se renova).' : 'Labora: postura de trabalho (mais dano, golpes mais leves).');
    },
    vadeRetro() {
      area(8, e => { const a = angPara(e); e.vel.x += Math.sin(a) * (e.def.chefe ? 3 : 16); e.vel.z += Math.cos(a) * (e.def.chefe ? 3 : 16); atordoar(e, 1.5); ferir(e, P.D.burst * 0.35, 0); }); // oração: cresce com a Fé
      C().anel(0xc9a24a, 7, 0.7, 0.85); A.bell(262, 0.25); OV.jogo.shake(0.25);
      ui.toast('Vade retro, Satana!');
    },
    crux() {
      const giro = () => { area(3.5, e => ferir(e, P.D.dano * 1.6, 5)); onda(P.pos.x, P.pos.z, 3.5, 0xe8d8a8); A.swish(); };
      giro(); agendar(0.35, giro);
    },
    escada() { darBuff('escada', 10); coluna(P.pos.x, P.pos.z, 0xf0e0b0, 16); A.bell(392, 0.25); ui.toast('A escada de São Bento desce do céu.'); },

    /* --- Santo Antão --- */
    flechaAbencoada() {
      const o = C().origemMao(), t = alvoProx(26);
      const dir = t ? C().direcaoTiro(o, angPara(t), 28, t) : C().direcaoTiro(o, P.facing, 28, null);
      if (t) P.facing = angPara(t);
      C().lancar({ origem: o, dir, dano: P.D.dano * 2.2, flecha: true, pesado: true, perfura: 99, vel: 32, alcance: 28, cor: 0xffffff, brilho: 0xffd27a, explode: false });
      A.cast();
    },
    discernimento() {
      let n = 0; area(25, e => { e.marca = 12; e.marcaF = Math.max(e.marcaF || 0, 0.25); n++; });
      C().anel(0xe8e0ff, 20, 1.2, 0.6); A.bell(659, 0.15);
      ui.toast(n ? `Discernimento: ${n} ${n > 1 ? 'vícios revelados' : 'vício revelado'}.` : 'Nenhum vício por perto.');
    },
    chuva() {
      const t = alvoProx(18); const p = t ? { x: t.g.position.x, z: t.g.position.z } : frente(7);
      const z = zona({ tipo: 'chuva', x: p.x, z: p.z, r: 5, t: 3, cor: 0xffe0a0, dps: 14 + P.pers.virt.prudencia * 3 });
      z.chuva = true; A.cast();
    },
    tentacoes() { darBuff('tentacoes', 10); C().anel(0xffd27a, 4, 1.0, 0.9); A.bell(494, 0.25); ui.toast('As tentações foram vencidas no deserto.'); },

    /* --- Convertidos do Norte --- */
    zelo() {
      if (H.relogio - H.ultimoZelo < 20) { P.status.ira = H.durStatus('ira', 8); ui.toast('O zelo passou da medida e virou Ira!'); }
      H.ultimoZelo = H.relogio; darBuff('zelo', 8); C().anel(0xff8a4a, 2.4, 0.7, 0.8); A.heavy();
    },
    carregar() { H.dash = { dir: P.facing, dist: 8, vel: 18, dano: P.D.dano * 1.2, atord: 1.2, atingidos: new Set(), invuln: true, cor: 0xd8c8a8 }; A.heavy(); },
    martelo() {
      area(5, e => { ferir(e, P.D.dano * 1.5, 7); atordoar(e, 2); });
      onda(P.pos.x, P.pos.z, 5, 0xd8b080); onda(P.pos.x, P.pos.z, 3.5, 0xffffff); OV.jogo.shake(0.5); A.heavy();
    },
    stiklestad() { darBuff('stiklestad', 12); C().anel(0xff6a3a, 4, 1.0, 0.9); A.bell(196, 0.3); ui.toast('Stiklestad: você não cairá.'); },

    /* --- Místicos --- */
    sofrimento() {
      const custo = Math.round(P.D.maxHp * 0.2);
      if (P.hp <= custo + 1) { ui.toast('Você está fraco demais para oferecer mais.'); return false; }
      P.hp -= custo; P.fe = Math.min(P.D.maxFe, P.fe + 50); P.flash = 0.2;
      C().anel(0xc04060, 1.8, 0.8, 0.7); A.heal();
    },
    bilocacao() {
      const p = frente(2.5);
      if (OV.isca && OV.isca.mesh) M.scene.remove(OV.isca.mesh);
      const g = new THREE.Group(); const mat = basic(0xb08aff, 0.55);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.48, 1.45, 8), mat).translateY(0.95));
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat).translateY(2.0));
      g.position.set(p.x, M.altura(p.x, p.z), p.z); M.scene.add(g);
      OV.isca = { x: p.x, z: p.z, t: 8, mesh: g, mat };
      C().faisca(p.x, M.altura(p.x, p.z) + 1.2, p.z, 0xb08aff); A.bell(659, 0.15);
    },
    extase() {
      darBuff('extase', 4);
      zona({ tipo: 'extase', x: P.pos.x, z: P.pos.z, r: 6, t: 4, cor: 0xb08aff, dps: 10 + P.pers.virt.fe * 2, seguir: true });
      coluna(P.pos.x, P.pos.z, 0xd8c0ff, 10); A.bell(784, 0.2);
    },
    noite() {
      C().anel(0xfff1c8, 14, 1.4, 0.95); C().anel(0xb08aff, 10, 1.1, 0.7);
      M.burstLight.position.set(P.pos.x, P.pos.y + 3, P.pos.z); M.burstLight.intensity = 9;
      area(14, (e, d) => { if (possesso(e)) libertar(e); else ferir(e, P.D.burst * 3 * (demonio(e) ? 2 : 1) * (1 - d / 28), 9); });
      OV.jogo.shake(0.4); A.bell(262, 0.3); setTimeout(() => A.bell(523, 0.25), 300);
    },

    /* --- Exorcistas de São Cipriano --- */
    exorcismo() {
      const t = alvoProx(12); if (!t) { ui.toast('Nenhum vício ao alcance.'); return false; }
      atordoar(t, 4, 1.5); t.dot = { t: 4, dps: 8 + P.pers.virt.fe * 2, tick: 0 };
      const corr = new THREE.Mesh(new THREE.TorusGeometry(t.def.r + 0.3, 0.06, 6, 24), basic(0xffd27a, 0.9)); corr.rotation.x = Math.PI / 2;
      const corr2 = corr.clone(); corr2.rotation.x = Math.PI / 2.6;
      C().efeito([corr, corr2], 4, p => { [corr, corr2].forEach((c, i) => { c.position.set(t.g.position.x, t.g.position.y + 0.8 + i * 0.6, t.g.position.z); c.rotation.z += 0.05; c.material.opacity = 0.9 * (1 - p * 0.6); }); });
      A.bell(392, 0.2);
    },
    rompimento() {
      let best = null, bd = 10;
      vivos().forEach(e => { if (!possesso(e)) return; const d = dist(e); if (d < bd) { bd = d; best = e; } });
      if (!best) { ui.toast('Nenhum possesso por perto.'); return false; }
      const x = best.g.position.x, z = best.g.position.z;
      libertar(best);
      H.chamarAliado('liberto', 20, x, z);
      coluna(x, z, 0xffd27a, 8); A.bell(523, 0.2);
      ui.toast('O pacto foi rompido. O libertado luta ao seu lado.');
    },
    ritual() { area(8, e => { atordoar(e, 2); ferir(e, P.D.burst * 0.8, 5); }); C().anel(0xffd27a, 7, 0.8, 0.85); A.bell(294, 0.25); OV.jogo.shake(0.2); },
    vadeSatana() {
      C().anel(0xff8a4a, 12, 1.3, 0.9); C().anel(0xfff1c8, 8, 1.0, 0.7);
      M.burstLight.position.set(P.pos.x, P.pos.y + 3, P.pos.z); M.burstLight.intensity = 9;
      area(12, e => {
        if (possesso(e)) { libertar(e); return; }
        const base = P.D.burst * 4 * (demonio(e) ? 1 : 0.5);
        ferir(e, e.def.chefe ? Math.max(base, e.def.hp * 0.15) : base, 9);
      });
      OV.jogo.shake(0.5); A.bell(196, 0.35); setTimeout(() => A.bell(392, 0.3), 280);
      ui.toast('Em nome de Cristo: afasta-te, Satanás!');
    }
  };

  /* ---- pequenos efeitos ---- */
  function folhas(x, y, z, cor) {
    const ms = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
      const a = i / 14 * Math.PI * 2; m.position.set(x + Math.cos(a) * 1.2, y + 0.4, z + Math.sin(a) * 1.2); m.userData = { a }; ms.push(m);
    }
    C().efeito(ms, 1.4, p => ms.forEach(m => { const a = m.userData.a + p * 4, r = 1.2 + p * 1.5; m.position.set(x + Math.cos(a) * r, y + 0.4 + p * 2.4, z + Math.sin(a) * r); m.rotation.y = a * 2; m.material.opacity = 0.9 * (1 - p); }));
  }
  function notas(x, y, z, cor) {
    const ms = [];
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), basic(cor, 0.9)); const a = i / 8 * Math.PI * 2; m.userData = { a }; ms.push(m); }
    C().efeito(ms, 1.6, p => ms.forEach(m => { const a = m.userData.a + p * 3, r = 0.9 + p * 1.2; m.position.set(x + Math.cos(a) * r, y + 1.2 + p * 2 + Math.sin(p * 12 + a) * 0.2, z + Math.sin(a) * r); m.material.opacity = 0.9 * (1 - p); }));
  }
  function gota(x, z, i) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), basic(0xbfe0ff, 0.9));
    const a = i / 10 * Math.PI * 2, r = 1 + Math.random() * 2.5, y0 = M.altura(x, z);
    C().efeito([m], 0.6, p => { m.position.set(x + Math.cos(a) * r * p, y0 + 2.2 - p * 2.1 + Math.sin(p * Math.PI) * 0.8, z + Math.sin(a) * r * p); m.material.opacity = 0.9 * (1 - p * 0.5); });
  }
  function pomba(x, y, z, i) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xf6f2e8, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), mat));
    [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.14), mat); w.position.x = 0.17 * s; g.add(w); });
    g.position.set(x, y, z);
    const a = i / 6 * Math.PI * 2;
    C().efeito([g], 1.6, p => { g.position.set(x + Math.cos(a) * p * 6, y + p * 3, z + Math.sin(a) * p * 6); g.rotation.y = -a; g.children[1].rotation.z = Math.sin(p * 40) * 0.6; g.children[2].rotation.z = -Math.sin(p * 40) * 0.6; mat.opacity = 1 - p; });
  }
  let asasMesh = null;
  function asasVisuais(b) {
    if (asasMesh && P.heroi) { P.heroi.body.remove(asasMesh); asasMesh = null; }
    if (!b || !P.heroi) return;
    asasMesh = new THREE.Group(); const mat = basic(0xfff1c8, 0.55);
    [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), mat); w.position.set(0.85 * s, 1.85, -0.35); w.rotation.z = 0.35 * s; w.rotation.y = -0.3 * s; asasMesh.add(w); });
    P.heroi.body.add(asasMesh);
  }

  /* ================= COMPANHEIROS ================= */
  function novoAliado(b, permanente, dur, extra) {
    const ang = P.facing + Math.PI * 0.7;
    if (!b.g.position.lengthSq()) b.g.position.set(P.pos.x + Math.sin(ang) * 2, P.pos.y, P.pos.z + Math.cos(ang) * 2);
    M.scene.add(b.g);
    const a = Object.assign({ ...b, permanente, vida: permanente ? Infinity : dur, maxHp: 1, hp: 1, cd: 0, furia: 0, ph: 0, alvo: null }, extra || {});
    H.aliados.push(a); return a;
  }
  const luminoso = (b, cor) => b.g.traverse(o => { if (o.isMesh && o.material !== b.eye) { o.material = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }); o.castShadow = false; } });
  H.chamarLobo = function (permanente) {
    if (permanente && H.aliados.some(a => a.permanente)) return;
    const b = OV.makeLobo();
    if (!permanente) luminoso(b, 0xffe9b8);
    const a = novoAliado(b, permanente, 25);
    if (!permanente) C().anel(0xffe9b8, 2.4, 0.8, 0.7);
    return a;
  };
  H.chamarAliado = function (tipo, dur, x, z) {
    const b = OV.makePossesso(0xd8c8a8, false)();
    b.eye.color.setHex(0x3a2a20);
    b.g.position.set(x, M.altura(x, z), z);
    return novoAliado(b, false, dur, { dano: 8 + P.pers.virt.fe * 1.5, humano: true });
  };
  H.limpar = function (tudo) {
    H.aliados = H.aliados.filter(a => { if (tudo || !a.permanente) { M.scene.remove(a.g); return false; } return true; });
    H.cd = {}; H.buffs = {}; H.suma = 0; H.dash = null; H.agenda = [];
    H.zonas.forEach(removerZona); H.zonas = [];
    if (OV.isca) { if (OV.isca.mesh) M.scene.remove(OV.isca.mesh); OV.isca = null; }
    P.oculto = 0; fantasma(false); asasVisuais(false);
    if (tudo) H.postura = null;
  };
  H.trazerAliados = function () {
    H.aliados.forEach((a, i) => { const ang = P.facing + Math.PI * (0.7 + i * 0.3); a.g.position.set(P.pos.x + Math.sin(ang) * 2, P.pos.y, P.pos.z + Math.cos(ang) * 2); a.alvo = null; });
  };

  /* ================= POR QUADRO ================= */
  let leituraT = 0;
  H.update = function (dt) {
    H.relogio += dt;
    for (const k in H.cd) H.cd[k] = Math.max(0, H.cd[k] - dt);
    for (const k in H.buffs) { const b = H.buffs[k]; b.t -= dt; if (b.t <= 0) { delete H.buffs[k]; if (k === 'suma') H.suma = 0; if (k === 'asas') asasVisuais(false); if (k === 'comigo') { P.oculto = 0; fantasma(false); } } }
    for (let i = H.agenda.length - 1; i >= 0; i--) { const a = H.agenda[i]; a.t -= dt; if (a.t <= 0) { H.agenda.splice(i, 1); a.fn(); } }
    if (P.pers && !P.dead) {
      if (H.buff('gregoriano')) P.fe = Math.min(P.D.maxFe, P.fe + 3 * dt);
      if (H.postura === 'ora') P.fe = Math.min(P.D.maxFe, P.fe + 2 * dt);
      if (H.tem('martires') && P.hp < P.D.maxHp * 0.4) P.fe = Math.min(P.D.maxFe, P.fe + 2 * dt);
    }
    if (P.oculto > 0) { P.oculto -= dt; if (P.oculto <= 0) { P.oculto = 0; if (!H.buff('comigo')) fantasma(false); } }
    // investidas
    if (H.dash) {
      const d = H.dash, passo = Math.min(d.dist, d.vel * dt);
      P.pos.x += Math.sin(d.dir) * passo; P.pos.z += Math.cos(d.dir) * passo; d.dist -= passo; P.facing = d.dir;
      M.collide(P.pos, 0.45); P.pos.y = M.altura(P.pos.x, P.pos.z); P.castT = Math.max(P.castT, 0.3);
      if (d.invuln) P.invuln = Math.max(P.invuln, 0.15);
      vivos().forEach(e => { if (d.atingidos.has(e) || dist(e) > 1.6 + e.def.r) return; d.atingidos.add(e); ferir(e, d.dano, 9); atordoar(e, d.atord); C().faisca(e.g.position.x, e.g.position.y + 1, e.g.position.z, d.cor); });
      if (d.dist <= 0.01) H.dash = null;
    }
    // zonas
    for (let i = H.zonas.length - 1; i >= 0; i--) {
      const z = H.zonas[i]; z.t -= dt;
      if (z.seguir) { z.x = P.pos.x; z.z = P.pos.z; const y = M.altura(z.x, z.z) + 0.1; z.meshes.forEach((m, k) => m.position.set(z.x, y + k * 0.01, z.z)); }
      const op = Math.min(1, z.t / 0.6);
      z.meshes[0].material.opacity = 0.22 * op; z.meshes[1].material.opacity = 0.7 * op;
      if (z.tipo === 'polifonia') z.extras.forEach((n, k) => { const a = H.relogio * 3 + k * Math.PI * 2 / 3; n.position.set(z.x + Math.cos(a) * 2.2, P.pos.y + 1.3, z.z + Math.sin(a) * 2.2); });
      if (z.chuva && Math.random() < dt * 30) flecha(z.x + (Math.random() - 0.5) * z.r * 1.6, z.z + (Math.random() - 0.5) * z.r * 1.6);
      if (z.tipo === 'estandarte') { vivos().forEach(e => { if (Math.hypot(e.g.position.x - z.x, e.g.position.z - z.z) < z.r) e.lento = 0.3; }); z.extras[1] && (z.extras[1].rotation.y = Math.sin(H.relogio * 2) * 0.2); }
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.5;
        if (z.dps) vivos().forEach(e => { if (Math.hypot(e.g.position.x - z.x, e.g.position.z - z.z) < z.r + e.def.r) C().danoInimigo(e, Math.round(z.dps * 0.5), 0.5, Math.atan2(e.g.position.x - z.x, e.g.position.z - z.z), { jogador: true, onda: true }); });
        if (z.purga && Math.hypot(P.pos.x - z.x, P.pos.z - z.z) < z.r && Object.keys(P.status).length) { P.status = {}; ui.toast('A água benta purifica você.'); }
      }
      if (z.t <= 0) { removerZona(z); H.zonas.splice(i, 1); }
    }
    // correntes do exorcismo
    I().lista.forEach(e => {
      if (!e.dot || e.state === 'dead' || e.state === 'liberto') return;
      e.dot.t -= dt; e.dot.tick -= dt;
      if (e.dot.tick <= 0) { e.dot.tick = 0.5; C().danoInimigo(e, Math.round(e.dot.dps * 0.5), 0, 0, { jogador: true, onda: true }); }
      if (e.dot.t <= 0) e.dot = null;
    });
    // duplo da Bilocação
    if (OV.isca) {
      OV.isca.t -= dt; OV.isca.mat.opacity = 0.35 + 0.2 * Math.sin(H.relogio * 6);
      if (OV.isca.t <= 0) { M.scene.remove(OV.isca.mesh); OV.isca = null; }
    }
    // Leitura de Almas: o pecado ao lado do nome
    leituraT -= dt;
    if (leituraT <= 0 && H.tem('leitura')) {
      leituraT = 0.5;
      vivos().forEach(e => { if (e._lido || dist(e) > 25) return; e._lido = true; const s = e.def.status !== undefined ? e.def.status : e.def.key; const t = s && OV.STATUS[s] ? OV.STATUS[s].label : null; if (t && e.lab.el.firstChild) e.lab.el.firstChild.textContent = `${e.lab.el.firstChild.textContent} · ${t}`; });
    }
    // companheiros
    for (let i = H.aliados.length - 1; i >= 0; i--) {
      const a = H.aliados[i], g = a.g;
      a.vida -= dt; a.furia = Math.max(0, a.furia - dt); a.cd = Math.max(0, a.cd - dt);
      if (a.vida <= 0) { C().faisca(g.position.x, g.position.y + 0.8, g.position.z, 0xffe9b8); M.scene.remove(g); H.aliados.splice(i, 1); if (a.humano) ui.toast('O libertado volta para casa, em paz.'); continue; }
      if (!a.alvo || a.alvo.state === 'dead' || a.alvo.state === 'liberto' || Math.hypot(a.alvo.g.position.x - P.pos.x, a.alvo.g.position.z - P.pos.z) > 16) {
        a.alvo = null; let bd = 11;
        vivos().forEach(e => { if (e.def.animal && !e.provocado) return; if (e.def.fixo && !a.humano) return; const d = Math.hypot(e.g.position.x - g.position.x, e.g.position.z - g.position.z); if (d < bd) { bd = d; a.alvo = e; } });
      }
      let tx, tz, perto = false, vel = 6.5;
      if (a.alvo) { tx = a.alvo.g.position.x; tz = a.alvo.g.position.z; perto = Math.hypot(tx - g.position.x, tz - g.position.z) < 1.4 + a.alvo.def.r; }
      else { const ang = P.facing + Math.PI * 0.75; tx = P.pos.x + Math.sin(ang) * 2.2; tz = P.pos.z + Math.cos(ang) * 2.2; vel = Math.max(2, Math.min(8, Math.hypot(tx - g.position.x, tz - g.position.z) * 2)); }
      const d = Math.hypot(tx - g.position.x, tz - g.position.z);
      const ang = Math.atan2(tx - g.position.x, tz - g.position.z);
      g.rotation.y = turnTo(g.rotation.y, ang, 8 * dt);
      let anda = 0;
      if (!perto && d > 0.6) { g.position.x += Math.sin(g.rotation.y) * vel * dt; g.position.z += Math.cos(g.rotation.y) * vel * dt; anda = 1; }
      if (perto && a.cd <= 0) {
        const dano = Math.round((a.dano || (6 + P.pers.virt.caridade * 1.5)) * (a.furia > 0 ? 2 : 1));
        C().danoInimigo(a.alvo, dano, 2.5, ang); a.cd = 0.9;
        if (a.humano) { a.armR.rotation.x = -2.2; }
      }
      if (d > 40) { H.trazerAliados(); }
      M.collide(g.position, 0.5);
      // o companheiro também anda passo a passo
      const ultA = a._ult || (a._ult = { x: g.position.x, z: g.position.z });
      const movA = Math.hypot(g.position.x - ultA.x, g.position.z - ultA.z); ultA.x = g.position.x; ultA.z = g.position.z;
      const marA = OV.inimigos.marchar(a, dt, movA);
      a.ph += dt * (anda ? 10 : 2);
      const sw = a.pernas ? marA.braco * 0.6 : Math.sin(a.ph) * 0.5 * anda;
      a.armL.rotation.x = lerp(a.armL.rotation.x, sw, 0.3); a.armR.rotation.x = lerp(a.armR.rotation.x, -sw, 0.15);
      g.position.y = M.altura(g.position.x, g.position.z) + marA.bob;
    }
  };
  function flecha(x, z) {
    const y = M.altura(x, z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), basic(0xffe0a0, 0.95));
    C().efeito([m], 0.3, p => { m.position.set(x, y + 6 - p * 6, z); m.material.opacity = 0.95 * (1 - p * 0.5); });
  }
})(window.OV);

/* Ordo Virtutum — inventário, equipamentos, itens que caem dos vícios, a bênção dos itens corrompidos e o baú da capela */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const P = OV.P, ui = OV.ui, A = OV.audio;
  const sm = OV.sm, mesh = OV.mesh;
  const $ = id => document.getElementById(id);
  const esc = s => ui.esc(s);

  /* ================= OS ITENS ================= */
  const SLOTS = [['veste', 'Veste'], ['escapulario', 'Escapulário'], ['terco', 'Terço'], ['santo', 'Santo']];
  const ITENS = {
    // consumíveis
    pao: { nome: 'Pão abençoado', tipo: 'consumivel', tecla: '5', descr: 'Recupera 35 de vida. Depois de comer, espere 18 s para o próximo.' },
    agua: { nome: 'Água benta', tipo: 'consumivel', tecla: '6', descr: 'Purifica todos os vícios em você e devolve 20 de Fé. Depois de usar, espere 30 s.' },
    vela: { nome: 'Vela de cera', tipo: 'consumivel', descr: 'Acesa numa breve oração, devolve 40 de Fé.' },
    exame: { nome: 'Vela do Exame de Consciência', tipo: 'raro', descr: 'Rara. Acesa na ficha (tecla C), permite tirar pontos já distribuídos das virtudes e distribuí-los de novo.' },
    // corrompidos: só servem depois da bênção de um sacerdote
    essencia: { nome: 'Essência corrompida', tipo: 'corrompido', descr: 'Um resto frio e escuro do vício. Um sacerdote pode abençoá-la: três essências viram água benta.' },
    profanado: { nome: 'Objeto profanado', tipo: 'corrompido', descr: 'Um objeto santo que caiu nas mãos dos demônios. Um sacerdote pode purificá-lo e devolvê-lo ao bom uso.' },
    // vestes
    habitoLa: { nome: 'Hábito de lã grossa', slot: 'veste', descr: '+15 de vida máxima.', mods: { hp: 15 }, cor: 0x4a3e34 },
    manto: { nome: 'Manto de peregrino', slot: 'veste', descr: '+8% de velocidade e +15 de fôlego máximo.', mods: { vel: 1.08, sta: 15 }, cor: 0x6a5a3a },
    linho: { nome: 'Veste de linho abençoado', slot: 'veste', descr: '+25 de Fé máxima.', mods: { fe: 25 }, cor: 0xe8e0cc },
    cota: { nome: 'Cota de malha', slot: 'veste', descr: '+30 de vida máxima, mas 5% mais lento.', mods: { hp: 30, vel: 0.95 }, cor: 0x8a8e94, metal: true },
    placas: { nome: 'Armadura de placas', slot: 'veste', descr: '+45 de vida máxima e 10% menos dano recebido, mas 10% mais lento.', mods: { hp: 45, defesa: 0.9, vel: 0.9 }, cor: 0xb0b6c0, metal: true },
    // escapulários
    escMiguel: { nome: 'Escapulário de São Miguel', slot: 'escapulario', descr: '+10% de dano contra os demônios.', mods: { danoDemonio: 1.1 } },
    escPaixao: { nome: 'Escapulário da Paixão', slot: 'escapulario', descr: '+20 de vida máxima.', mods: { hp: 20 } },
    escJose: { nome: 'Escapulário de São José', slot: 'escapulario', descr: 'Você sofre 10% menos dano.', mods: { defesa: 0.9 } },
    escTrindade: { nome: 'Escapulário da Santíssima Trindade', slot: 'escapulario', descr: '+20 de Fé máxima, e a Fé volta 10% mais rápido no Recolhimento.', mods: { fe: 20, prayFe: 1.1 } },
    // terços
    tercoMadeira: { nome: 'Terço de madeira', slot: 'terco', descr: 'As orações custam 3 de Fé a menos.', mods: { custo: 3 } },
    tercoOliveira: { nome: 'Terço de contas de oliveira', slot: 'terco', descr: 'No Recolhimento, a Fé volta 25% mais rápido.', mods: { prayFe: 1.25 } },
    tercoPrata: { nome: 'Terço de prata', slot: 'terco', descr: 'A Ave-Maria cura 20% a mais.', mods: { cura: 1.2 } },
    tercoPeregrino: { nome: 'Terço do peregrino', slot: 'terco', descr: '+15 de fôlego máximo, e o fôlego volta 15% mais rápido.', mods: { sta: 15, staRegen: 1.15 } },
    // itens de santos
    medBento: { nome: 'Medalha de São Bento', slot: 'santo', descr: 'A Ira e a Soberba duram metade do tempo em você.', mods: { meio: ['ira', 'soberba'] } },
    medCristovao: { nome: 'Medalha de São Cristóvão', slot: 'santo', descr: '+10% de velocidade, para as longas estradas.', mods: { vel: 1.1 } },
    iconeNicolau: { nome: 'Ícone de São Nicolau', slot: 'santo', descr: 'Os vícios vencidos deixam 50% mais denários.', mods: { denarios: 1.5 } },
    tauAntao: { nome: 'Tau de Santo Antão', slot: 'santo', descr: 'A Preguiça dura metade do tempo, e à noite você causa 10% a mais de dano.', mods: { meio: ['preguica'], noite: 1.1 } },
    reliqJorge: { nome: 'Relíquia de São Jorge', slot: 'santo', descr: '+10% de dano.', mods: { dano: 1.1 } },
    medLourenco: { nome: 'Medalha de São Lourenço', slot: 'santo', descr: 'A Avareza dura metade do tempo em você, e os vícios deixam 25% mais denários.', mods: { meio: ['avareza'], denarios: 1.25 } },
    cintoAgostinho: { nome: 'Cinto de Santo Agostinho', slot: 'santo', descr: 'A Luxúria dura metade do tempo em você, e +15 de Fé máxima.', mods: { meio: ['luxuria'], fe: 15 } },
    tercoMineiro: { nome: 'Terço do mineiro', slot: 'terco', descr: 'As orações custam 2 de Fé a menos, e à noite você causa 15% a mais de dano.', mods: { custo: 2, noite: 1.15 } },
    // insígnias das guildas e confrarias (só se ganham no último contrato)
    vieira: { nome: 'Vieira do Peregrino', slot: 'santo', guilda: true, descr: 'Insígnia da Confraria de São Roque: +8% de velocidade e +10 de Fé máxima.', mods: { vel: 1.08, fe: 10 } },
    anzol: { nome: 'Anzol de São Pedro', slot: 'santo', guilda: true, descr: 'Insígnia dos Pescadores: +10% de dano, e os vícios deixam 25% mais denários.', mods: { dano: 1.1, denarios: 1.25 } },
    lanterna: { nome: 'Lanterna de Santa Bárbara', slot: 'santo', guilda: true, descr: 'Insígnia dos Mineiros: +20 de Fé máxima, e à noite você causa 15% a mais de dano.', mods: { fe: 20, noite: 1.15 } },
    esquadro: { nome: 'Esquadro de São José', slot: 'santo', guilda: true, descr: 'Insígnia dos Artesãos: +20 de vida máxima e 12% menos dano recebido.', mods: { defesa: 0.88, hp: 20 } },
    // v24: relíquias únicas (não caem de baú nenhum)
    cruzEremita: { nome: 'Cruz de ferro do Eremita', slot: 'santo', unico: true, descr: 'Forjada com a picareta que achou o primeiro ouro de Valdouro. A Avareza dura metade do tempo em você, e você fere 25% a mais os vícios da avareza e o próprio Mamom.', mods: { meio: ['avareza'], contra_avareza: 1.25 } },
    tunicaBranca: { nome: 'Túnica branca', slot: 'veste', descr: '+30 de Fé máxima, +15 de vida máxima, e a Luxúria dura metade do tempo.', mods: { fe: 30, hp: 15, meio: ['luxuria'] }, cor: 0xece6d6 }
  };
  OV.ITENS = ITENS;
  const EQUIP = Object.keys(ITENS).filter(k => ITENS[k].slot && !ITENS[k].guilda && !ITENS[k].unico);
  const CAPACIDADE = 20; // espaços da mochila; consumíveis e restos corrompidos se empilham até 10 por espaço

  const IT = {}; OV.itens = IT;
  IT.SLOTS = SLOTS;
  IT.CAPACIDADE = CAPACIDADE;
  IT.CHANCE_EXAME = 0.03;
  function mochila() {
    const p = P.pers; if (!p) return null;
    if (!p.mochila) p.mochila = { itens: { pao: 2, agua: 1 }, equip: {} };
    p.mochila.itens = p.mochila.itens || {}; p.mochila.equip = p.mochila.equip || {};
    if (!p.bau) p.bau = {};
    return p.mochila;
  }
  IT.mochila = mochila;
  // quantos de um mesmo item cabem num espaço
  IT.pilha = id => { const it = ITENS[id]; if (!it || it.slot) return 1; if (it.tipo === 'consumivel') return it.raro ? 3 : 10; if (it.tipo === 'corrompido') return 10; return 1; };
  const espacos = itens => Object.keys(itens).reduce((a, id) => a + (itens[id] > 0 && ITENS[id] ? Math.ceil(itens[id] / IT.pilha(id)) : 0), 0);
  IT.qtd = id => { const m = mochila(); return m ? (m.itens[id] || 0) : 0; };
  IT.total = () => { const m = mochila(); return m ? Object.values(m.itens).reduce((a, b) => a + b, 0) : 0; };
  IT.usados = () => { const m = mochila(); return m ? espacos(m.itens) : 0; };
  IT.cabe = function (n, id) {
    const m = mochila(); if (!m) return false; n = n || 1;
    if (!id) return espacos(m.itens) + n <= CAPACIDADE;
    const it = Object.assign({}, m.itens); it[id] = (it[id] || 0) + n;
    return espacos(it) <= CAPACIDADE;
  };
  // a Vela do Exame de Consciência: no máximo uma de cada vez (na mochila ou no baú)
  IT.temExame = () => IT.qtd('exame') > 0 || !!(P.pers && P.pers.bau && P.pers.bau.exame > 0);
  IT.dar = function (id, n, silencioso) {
    const m = mochila(); n = n || 1;
    if (id === 'exame') { if (IT.temExame()) { if (!silencioso) ui.toast('Você já guarda uma Vela do Exame de Consciência. Só se carrega uma de cada vez.'); return true; } n = 1; }
    if (!IT.cabe(n, id)) { if (!silencioso) ui.toast('O inventário está cheio. Guarde itens no baú de uma capela ou da Casa do Peregrino.'); return false; }
    m.itens[id] = (m.itens[id] || 0) + n;
    if (!silencioso) ui.toast(`Você recolheu: ${ITENS[id].nome}${n > 1 ? ' ×' + n : ''}`);
    IT.refresh(); return true;
  };
  IT.tirar = function (id, n) { const m = mochila(); n = n || 1; if ((m.itens[id] || 0) < n) return false; m.itens[id] -= n; if (m.itens[id] <= 0) delete m.itens[id]; return true; };

  /* ---- modificadores dos equipamentos ---- */
  IT.equipados = () => { const m = mochila(); return m ? Object.values(m.equip).filter(Boolean).map(id => ITENS[id]).filter(Boolean) : []; };
  IT.mod = function (k) {
    const soma = ['hp', 'fe', 'sta', 'custo'].includes(k);
    let v = soma ? 0 : 1;
    IT.equipados().forEach(it => { const x = it.mods && it.mods[k]; if (x === undefined) return; v = soma ? v + x : v * x; });
    return v;
  };
  IT.meio = k => IT.equipados().some(it => it.mods && it.mods.meio && it.mods.meio.includes(k));
  IT.danoContra = function (e) {
    let m = IT.mod('dano');
    if (!e.def.liberta && !e.def.animal && !e.def.fixo) m *= IT.mod('danoDemonio');
    if (OV.tempo && OV.tempo.ehNoite()) m *= IT.mod('noite');
    if (e.def.status) m *= IT.mod('contra_' + e.def.status);
    return m;
  };

  /* ---- usar e equipar ---- */
  IT.usar = function (id) {
    if (!P.D || P.dead) return;
    if (!IT.qtd(id)) { ui.toast(`Você não tem ${ITENS[id].nome}.`); return; }
    if (P.status.avareza) { ui.toast('A Avareza prende a sua mão: você não consegue usar nada do que carrega. Dê esmola num Oratório.'); return; }
    // v24: o pão e a água benta têm recarga: não se usa um atrás do outro
    const rc = IT.RECARGA[id];
    if (rc && (P.cd['item_' + id] || 0) > 0) { ui.toast(`${ITENS[id].nome}: espere mais ${Math.ceil(P.cd['item_' + id])} s.`); return; }
    if (id === 'pao') { if (P.hp >= P.D.maxHp) { ui.toast('Você já está com a vida cheia.'); return; } P.hp = Math.min(P.D.maxHp, P.hp + 35 * (P.status.gula ? 0.5 : 1)); OV.combate.anel(0xe8c890, 1.6, 0.6, 0.6); A.heal(); }
    else if (id === 'agua') { P.status = {}; P.fe = Math.min(P.D.maxFe, P.fe + 20); OV.combate.anel(0x8ac8ff, 2, 0.7, 0.7); A.heal(); ui.toast('A água benta purifica você.'); }
    else if (id === 'vela') { P.fe = Math.min(P.D.maxFe, P.fe + 40); OV.combate.anel(0xffd27a, 1.6, 0.7, 0.6); A.bell(523, 0.12); }
    else return;
    if (rc) P.cd['item_' + id] = rc;
    IT.tirar(id); IT.refresh();
  };
  IT.RECARGA = { pao: 18, agua: 30 };
  IT.equipar = function (id) {
    const it = ITENS[id], m = mochila(); if (!it || !it.slot || !IT.qtd(id)) return;
    const atual = m.equip[it.slot];
    IT.tirar(id);
    if (atual) m.itens[atual] = (m.itens[atual] || 0) + 1;
    m.equip[it.slot] = id;
    aplicar(); ui.toast(`Equipado: ${it.nome}`);
  };
  IT.desequipar = function (slot) {
    const m = mochila(), id = m.equip[slot]; if (!id) return;
    if (!IT.cabe(1, id)) { ui.toast('O inventário está cheio.'); return; }
    m.equip[slot] = null; m.itens[id] = (m.itens[id] || 0) + 1;
    aplicar();
  };
  function aplicar() {
    const hp0 = P.D ? P.D.maxHp : 0;
    OV.combate.recalcular();
    if (P.D && P.D.maxHp > hp0) P.hp = Math.min(P.D.maxHp, P.hp + (P.D.maxHp - hp0));
    if (P.D) { P.hp = Math.min(P.hp, P.D.maxHp); P.fe = Math.min(P.fe, P.D.maxFe); P.sta = Math.min(P.sta, P.D.maxSta); }
    IT.visual(); IT.refresh();
  }
  /* a veste muda a cor do hábito ou da armadura */
  IT.visual = function () {
    const h = P.heroi; if (!h || !h.mats || !h.mats[0]) return;
    const mat = h.mats[0];
    if (mat._corBase === undefined) mat._corBase = mat.color.getHex();
    const m = mochila(), v = m && m.equip.veste ? ITENS[m.equip.veste] : null;
    mat.color.setHex(v && v.cor !== undefined ? v.cor : mat._corBase);
    mat.metalness = v && v.metal ? 0.7 : (mat._metalBase !== undefined ? mat._metalBase : (mat._metalBase = mat.metalness));
    mat.roughness = v && v.metal ? 0.4 : (mat._roughBase !== undefined ? mat._roughBase : (mat._roughBase = mat.roughness));
    if (h.saia) { h.saia.mat.color.copy(mat.color); h.saia.mat.metalness = mat.metalness; h.saia.mat.roughness = mat.roughness; }
  };

  /* ================= O QUE OS VÍCIOS DEIXAM CAIR ================= */
  const chao = [];
  const BOM = ['pao', 'pao', 'vela', 'agua'];
  function sortear(lista) { return lista[(Math.random() * lista.length) | 0]; }
  IT.aoVencer = function (e) {
    const d = e.def; if (!P.pers || d.fixo || d.key === 'sombra' || e.tag === 'teste_sem_drop') return;
    if (d.animal && !d.variante) return; // os animais não carregam nada
    let chance = d.chefe || (OV.inimigos.CHEFES && OV.inimigos.CHEFES.has(d.key)) ? 1 : d.variante === 'elite' ? 1 : d.variante === 'forte' ? 0.5 : 0.22;
    chance = Math.min(1, chance + (d.nivel || 1) * 0.015);
    if (Math.random() > chance) return;
    const x = e.g.position.x, z = e.g.position.z, cai = [];
    if (d.liberta) {
      // o possesso libertado devolve o que carregava de bom
      cai.push(Math.random() < 0.6 ? 'pao' : 'vela');
      if (Math.random() < (d.variante || d.chefe ? 0.5 : 0.08)) cai.push(Math.random() < 0.5 ? 'tercoMadeira' : sortear(EQUIP));
    } else {
      // o demônio deixa um resto corrompido, ou algo bom que tinha roubado
      if (Math.random() < 0.2) cai.push(sortear(BOM)); else cai.push('essencia');
      if (d.chefe || d.variante === 'elite') cai.push('profanado');
      else if (Math.random() < (d.variante === 'forte' ? 0.2 : 0.06)) cai.push('profanado');
      if (d.chefe) cai.push('profanado', 'essencia');
    }
    // a Vela do Exame de Consciência é raríssima: só os chefões, 3% das vezes, e nunca para quem já tem uma
    const grande = d.chefe || (OV.inimigos.CHEFES && OV.inimigos.CHEFES.has(d.key) && !d.fixo);
    if (grande && !IT.temExame() && Math.random() < IT.CHANCE_EXAME) cai.push('exame');
    cai.forEach((id, i) => soltar(id, x + Math.cos(i * 2.1) * 0.9, z + Math.sin(i * 2.1) * 0.9));
  };
  const geoItem = new THREE.OctahedronGeometry(0.2, 0);
  function soltar(id, x, z) {
    const corrompido = ITENS[id].tipo === 'corrompido';
    const g = new THREE.Group();
    const raro = ITENS[id].tipo === 'raro';
    const nucleo = new THREE.Mesh(geoItem, new THREE.MeshBasicMaterial({ color: corrompido ? 0x5a2a6a : raro ? 0xfff4d0 : 0xffe2a0 }));
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: corrompido ? 0x6a2a8a : 0xffd27a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(nucleo); g.add(brilho);
    const y = M.altura(x, z);
    g.position.set(x, y + 0.6, z); M.scene.add(g);
    chao.push({ id, g, x, z, y, t: 90, ph: Math.random() * 6 });
  }
  IT.soltar = soltar;
  IT.limparChao = () => { chao.forEach(c => M.scene.remove(c.g)); chao.length = 0; };
  let avisoCheio = 0;
  IT.update = function (dt) {
    avisoCheio -= dt;
    for (let i = chao.length - 1; i >= 0; i--) {
      const c = chao[i]; c.t -= dt; c.ph += dt;
      c.g.position.y = c.y + 0.6 + Math.sin(c.ph * 2.5) * 0.12; c.g.rotation.y += dt * 1.8;
      if (c.t <= 0) { M.scene.remove(c.g); chao.splice(i, 1); continue; }
      if (!P.dead && Math.hypot(P.pos.x - c.x, P.pos.z - c.z) < 1.7) {
        if (c.id === 'exame' && IT.temExame()) continue;
        if (IT.cabe(1, c.id)) { IT.dar(c.id); M.scene.remove(c.g); chao.splice(i, 1); A.bell(784, 0.06); }
        else if (avisoCheio <= 0) { avisoCheio = 4; ui.toast('O inventário está cheio. Guarde itens no baú de uma capela ou da Casa do Peregrino.'); }
      }
    }
  };

  /* ================= A BÊNÇÃO DO SACERDOTE ================= */
  IT.temCorrompidos = () => IT.qtd('essencia') >= 3 || IT.qtd('profanado') > 0;
  IT.purificar = function () {
    const out = [];
    let n = 0;
    while (IT.qtd('essencia') >= 3) { IT.tirar('essencia', 3); mochila().itens.agua = (mochila().itens.agua || 0) + 1; n++; }
    if (n) out.push(`${n} ${n > 1 ? 'frascos' : 'frasco'} de água benta`);
    while (IT.qtd('profanado') > 0) {
      IT.tirar('profanado');
      const m = mochila(), tem = id => (m.itens[id] || 0) > 0 || Object.values(m.equip).includes(id) || (P.pers.bau[id] || 0) > 0;
      const novos = EQUIP.filter(id => !tem(id));
      if (novos.length) { const id = sortear(novos); m.itens[id] = (m.itens[id] || 0) + 1; out.push(ITENS[id].nome); }
      else { P.pers.denarios = (P.pers.denarios || 0) + 30; out.push('30 denários para os pobres... e para você'); }
    }
    IT.refresh();
    if (OV.jogo) OV.jogo.salvar();
    return out;
  };
  /* antes da conversa com um sacerdote, se houver itens corrompidos */
  IT.SACERDOTES = { tome: 'Padre Tomé', gaspar: 'Frei Gaspar', abade: 'Abade Anselmo' };
  IT.conversaSacerdote = function (id, abrirConversa) {
    if (!IT.temCorrompidos()) return false;
    const quem = IT.SACERDOTES[id];
    OV.dialogo.abrir({ inicio: 'a', nos: {
      a: { quem, txt: 'A paz esteja com você. Em que posso ajudar?', opc: [
        { t: 'Pedir a bênção sobre os itens corrompidos que carrego.', ir: 'b' },
        { t: 'Conversar.', ef: () => setTimeout(abrirConversa, 0) }] },
      b: { quem, txt: () => {
        const r = IT.purificar();
        A.bell(523, 0.2); setTimeout(() => A.bell(659, 0.16), 220);
        return `Em nome do Pai, do Filho e do Espírito Santo. O que o mal tomou para si volta a servir a Deus. Receba: ${r.join(', ')}.`;
      } }
    } });
    return true;
  };

  /* ================= A CAPELA DO PEREGRINO E O BAÚ ================= */
  IT.capelas = [];
  // v24: a Capela do Peregrino saiu do jogo: a Casa do Peregrino, que existe em todas as regiões, guarda o baú e o genuflexório
  IT.CAPELAS_ATIVAS = false;
  IT.criarCapela = function (x, z, rot, nome) {
    if (!IT.CAPELAS_ATIVAS) return null;
    const H = M.altura, MAT = M.MAT, f = M.frente;
    const g = M.grupo(x, z, rot);
    const pedra = MAT.wall, telha = MAT.roofTile;
    g.add(mesh(new THREE.BoxGeometry(5, 4.4, 0.4), pedra, 0, 2.2, -3)); // fundo
    [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(0.4, 4.4, 6.4), pedra, s * 2.3, 2.2, 0)));
    [-1, 1].forEach(s => g.add(mesh(new THREE.BoxGeometry(1.5, 4.4, 0.4), pedra, s * 1.75, 2.2, 3)));
    g.add(mesh(new THREE.BoxGeometry(2, 1.2, 0.4), pedra, 0, 3.8, 3));
    const tl = M.telhado(5, 6.4, 2.2, telha); tl.position.y = 4.4; g.add(tl);
    g.add(mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), MAT.gold, 0, 7.1, 3.1)); g.add(mesh(new THREE.BoxGeometry(0.6, 0.14, 0.16), MAT.gold, 0, 7.3, 3.1));
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 6), MAT.stone); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.04; g.add(piso);
    g.add(mesh(new THREE.BoxGeometry(1.8, 1.0, 0.8), MAT.col, 0, 0.5, -2.2)); // altar
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), MAT.gold, 0, 1.4, -2.3)); g.add(mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), MAT.gold, 0, 1.55, -2.3));
    // o baú do peregrino
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.75, 0.75), sm(0x4a2e1a), 1.35, 0.38, -1.3));
    g.add(mesh(new THREE.BoxGeometry(1.36, 0.12, 0.8), MAT.gold, 1.35, 0.8, -1.3));
    [[-0.6, -2.2], [0.6, -2.2]].forEach(([vx, vz]) => { g.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 6), MAT.wax, vx, 1.18, vz)); });
    const lp = f(x, z, rot, -1.5);
    M.emissor(lp.x, H(x, z) + 1.6, lp.z, 1.1, 7, 0xffb060);
    // paredes sólidas (com a porta aberta na frente)
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const loc = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
    [[0, -3, 2.5, 0.25], [-2.3, 0, 0.25, 3.2], [2.3, 0, 0.25, 3.2], [-1.75, 3, 0.75, 0.25], [1.75, 3, 0.75, 0.25]].forEach(([lx, lz, hw, hd]) => { const p = loc(lx, lz); M.caixa(p.x, p.z, hw, hd, rot); });
    const porta = loc(0, 1.2);
    const c = { x: porta.x, z: porta.z, nome: nome || 'Capela do Peregrino', capela: true, facing: rot + Math.PI };
    M.interativo(porta.x, porta.z, 2.0, () => 'Rezar na capela e abrir o baú', () => OV.jogo.usarCapela(c)).pessoal = true;
    IT.capelas.push(c);
    return c;
  };

  /* ================= PAINEL DO INVENTÁRIO E DO BAÚ ================= */
  /* uma grade de espaços com ícones; ao passar o mouse, a descrição do item com a sua nota de hagiografia */
  const HAGIO = {
    pao: 'Os primeiros cristãos levavam para casa o pão bento ao fim da Missa, a eulogia, e o repartiam com quem não pôde ir.',
    agua: 'A água benta lembra o Batismo. É abençoada com sal, como fez o profeta Eliseu ao sanear as águas de Jericó (2Rs 2,21).',
    vela: 'A vela de cera é sinal de Cristo, luz do mundo. Na Vigília Pascal, a Igreja canta até a abelha que fez a cera do círio.',
    exame: 'Santo Inácio de Loyola ensinava que o exame de consciência nunca se deixa, nem no dia em que falta tempo para as outras orações.',
    essencia: 'Um resto frio do vício vencido. Sozinho não serve a nada; abençoado, volta a servir a Deus.',
    profanado: 'A Igreja manda que os objetos sagrados profanados sejam purificados antes de voltarem ao culto.',
    habitoLa: 'São Bento pedia na Regra que os monges vestissem o que a região oferecesse, com o hábito mais grosso no inverno.',
    manto: 'Os peregrinos de Santiago recebiam a bênção do padre sobre o manto, o bordão e a sacola antes de partir.',
    linho: 'O linho branco lembra a veste do Batismo e a alva que o sacerdote veste para celebrar.',
    cota: 'São Luís, rei da França, ia para a guerra com a cota de malha sob o manto e não deixava de rezar as Horas.',
    placas: 'Santa Joana d\'Arc vestia armadura branca, mas dizia que amava o seu estandarte quarenta vezes mais que a espada.',
    escMiguel: '«Houve uma batalha no céu: Miguel e os seus anjos lutaram contra o Dragão» (Ap 12,7).',
    escPaixao: 'O escapulário vermelho da Paixão foi aprovado pelo papa Pio IX em 1847, para lembrar o amor de Cristo crucificado.',
    escJose: 'O escapulário de São José foi aprovado por Leão XIII, para pôr o trabalho e a família sob a guarda do pai adotivo de Jesus.',
    escTrindade: 'O escapulário branco vem dos trinitários, a ordem que São João da Mata fundou em 1198 para resgatar cativos.',
    tercoMadeira: 'Diz a tradição que São Domingos espalhou a oração do Rosário; os pobres a rezavam com contas de madeira.',
    tercoOliveira: 'As contas de oliveira lembram o Monte das Oliveiras, onde Cristo rezou na noite em que foi entregue.',
    tercoPrata: 'Um terço de prata passa de mãe para filha. As contas gastas contam as Ave-Marias de uma família inteira.',
    tercoPeregrino: 'Os peregrinos rezavam o terço enquanto caminhavam: a cada dezena, mais um trecho da estrada.',
    medBento: 'A medalha de São Bento traz as iniciais do Vade retro Satana. Bento é invocado contra as tentações e o veneno.',
    medCristovao: 'Diz a lenda que São Cristóvão levou o Menino Jesus nos ombros para atravessar um rio. É o padroeiro dos viajantes.',
    iconeNicolau: 'São Nicolau, bispo de Mira, deu às escondidas o dote de três moças pobres, jogando bolsas de ouro pela janela.',
    tauAntao: 'O tau era o sinal de Santo Antão, pai dos monges do deserto, que venceu as tentações com oração e trabalho.',
    reliqJorge: 'São Jorge, soldado e mártir, é retratado vencendo o dragão: a fé que não se rende ao mal.',
    medLourenco: 'São Lourenço, diácono de Roma, apresentou os pobres ao prefeito como os verdadeiros tesouros da Igreja.',
    cintoAgostinho: '«Revesti-vos do Senhor Jesus Cristo» (Rm 13,14). Foi lendo estas palavras que Santo Agostinho se converteu.',
    tercoMineiro: 'Os mineiros rezavam na boca da mina antes de descer e deixavam uma luz acesa para Santa Bárbara.',
    vieira: 'A vieira é o sinal dos peregrinos de Santiago de Compostela: com ela se bebia água e se recebia esmola.',
    anzol: '«Segui-me, e eu farei de vós pescadores de homens» (Mt 4,19).',
    lanterna: 'Santa Bárbara, virgem e mártir, é a padroeira dos mineiros e de todos os que trabalham com fogo.',
    esquadro: 'São José, o carpinteiro de Nazaré, é o patrono dos operários e da boa morte.',
    tunicaBranca: '«Lavaram as suas vestes e as alvejaram no sangue do Cordeiro» (Ap 7,14).',
    picareta: 'Santa Bárbara foi presa numa torre pelo próprio pai; por isso é invocada pelos que trabalham debaixo da terra.',
    vara: 'Depois da Ressurreição, Cristo apareceu aos discípulos que pescavam no lago de Tiberíades (Jo 21).',
    peixe: 'O peixe, ichthys em grego, era o sinal secreto dos primeiros cristãos: Jesus Cristo, Filho de Deus, Salvador.',
    peixeIsca: '«Poderás tu pescar o Leviatã com anzol?» (Jó 40,25).',
    anelPai: '«Trazei depressa a melhor túnica e vesti-o; ponde-lhe um anel no dedo» (Lc 15,22).',
    pergaminho: '«Ele dará ordem aos seus anjos para te guardarem em todos os teus caminhos» (Sl 91,11).',
    armaduraMiguel: '«Revesti-vos da armadura de Deus, para poderdes resistir às ciladas do demônio» (Ef 6,11).'
  };
  IT.HAGIO = HAGIO;
  const hagioDe = id => HAGIO[id] || (/^arma_/.test(id) ? 'São Dunstano, monge e ferreiro, é o padroeiro dos que trabalham na forja. Toda arma da Ordem é benzida antes de ir à luta.' : '');
  const SVG = {
    pao: '<path d="M3.5 15c0-4.5 4-8 8.5-8s8.5 3.5 8.5 8v2.5h-17z"/><path d="M8 10.5l1.4 3M12 9.5v4M16 10.5l-1.4 3"/>',
    frasco: '<path d="M10 3h4M10.5 3v5.5L6 15.5A4 4 0 0 0 9.5 21h5a4 4 0 0 0 3.5-5.5L13.5 8.5V3"/><path d="M7.5 15h9"/>',
    vela: '<path d="M9 10h6v11H9z"/><path d="M12 2.5c1.6 2 1.6 3.6 0 5.2-1.6-1.6-1.6-3.2 0-5.2z"/>',
    exame: '<path d="M9.5 11h5v10h-5z"/><path d="M12 3c1.5 2 1.5 3.5 0 5-1.5-1.5-1.5-3 0-5z"/><path d="M5 5.5l2 1.5M19 5.5l-2 1.5M4 10.5h2.2M17.8 10.5H20"/>',
    essencia: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/><path d="M9.8 14.5c0 1.6 1.1 2.8 2.7 2.8"/>',
    profanado: '<path d="M6.5 4h11c0 5-2.4 8-5.5 8S6.5 9 6.5 4z"/><path d="M12 12v6M8 21h8M11 4l1.8 2.6-1.4 2"/>',
    veste: '<path d="M8 3L3 7l2 3 2-1v12h10V9l2 1 2-3-5-4c-1 1.5-2.2 2-4 2s-3-.5-4-2z"/>',
    armadura: '<path d="M6 4l3 1.5h6L18 4l2 4-2 2v8c-2 2-4 3-6 3s-4-1-6-3v-8L4 8z"/><path d="M12 6v14"/>',
    escapulario: '<path d="M8.5 12C8 8 8 5 9 3h6c1 2 1 5 .5 9"/><path d="M5.5 12h5v8h-5zM13.5 12h5v8h-5z"/><path d="M8 14.5v3M6.5 16h3"/>',
    terco: '<circle cx="12" cy="9" r="6" stroke-dasharray="1.6 1.9"/><path d="M12 15v6.5M9.8 18h4.4"/>',
    medalha: '<path d="M8.5 3l3.5 6 3.5-6"/><circle cx="12" cy="15" r="5"/><path d="M12 12.4v5.2M9.8 14.6h4.4"/>',
    icone: '<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="12" cy="10" r="3.3"/><path d="M8 19c0-3 1.8-5 4-5s4 2 4 5"/>',
    tau: '<path d="M4.5 5h15M12 5v16M4.5 5v2.4M19.5 5v2.4M9.5 21h5"/>',
    reliquia: '<path d="M8 21h8M12 21v-3.5M7 17.5h10l-1.2-6.5H8.2z"/><path d="M12 3v6M9.6 5.4h4.8"/>',
    cinto: '<path d="M3 10h18v4H3z"/><path d="M10 8.5h4v7h-4z"/><path d="M15.5 14l1 6M18 14l1.4 5"/>',
    vieira: '<path d="M12 20.5L4 10.5C6 6.5 9 4.5 12 4.5s6 2 8 6z"/><path d="M12 20.5v-16M12 20.5L8.4 6M12 20.5L15.6 6M12 20.5L5.4 8.8M12 20.5l6.6-11.7"/>',
    anzol: '<path d="M14 4v10a4 4 0 0 1-8 0v-2l-2 2"/><circle cx="14" cy="3" r="1.1"/>',
    lanterna: '<path d="M9 4h6M10 4V2.5h4V4M8 6h8l-1 13H9z"/><path d="M12 9.8c1.1 1.3 1.1 2.5 0 3.7-1.1-1.2-1.1-2.4 0-3.7z"/><path d="M7 21h10"/>',
    esquadro: '<path d="M4 3.5V20.5h16.5V16.5H8V3.5z"/><path d="M8 8h2M8 12h2"/>',
    picareta: '<path d="M3.5 8.5c4.5-4.5 12.5-4.5 17 0"/><path d="M12 5.5V21"/>',
    vara: '<path d="M4 21L18 3.5"/><path d="M18 3.5c2 4 2 9 1 13"/><path d="M19 16.5l-1.6 2.4"/>',
    peixe: '<path d="M2.5 12c3-4 7-5.2 11-4.2 2.2.5 4 2 5 4.2-1 2.2-2.8 3.7-5 4.2-4 1-8-.2-11-4.2z"/><path d="M18.5 12L21.5 8.5v7z"/><circle cx="14.5" cy="11" r=".7"/>',
    pergaminho: '<path d="M7 4h11v13a3 3 0 0 1-3 3H6"/><path d="M7 4a2 2 0 0 0-2 2v1.5h2M6 20a2 2 0 0 0 2-2v-1h10"/><path d="M10 8.5h5M10 11.5h5M10 14.5h3"/>',
    anel: '<circle cx="12" cy="14.5" r="6"/><path d="M10 6.2l2-3 2 3-2 2.2z"/>',
    espada: '<path d="M12 2.5l1.6 2V15h-3.2V4.5z"/><path d="M7 15h10M12 15v4.5M10 21h4"/>',
    cajado: '<path d="M10 21V7"/><path d="M10 7c0-3 2-4.5 4-4.5s3.5 1.5 3.5 3.5-1.5 3-3 3"/>',
    livro: '<path d="M4 5c3-1 5.5-1 8 1 2.5-2 5-2 8-1v14c-3-1-5.5-1-8 1-2.5-2-5-2-8-1z"/><path d="M12 6v14"/>',
    aspersorio: '<path d="M5 19L13 11"/><circle cx="15.5" cy="8.5" r="3.5"/><path d="M19 4.5l.8-.8M20.5 7.5l1-.3M17.5 3l.3-1"/>',
    adaga: '<path d="M12 3l1.4 2v8.5h-2.8V5z"/><path d="M8.5 13.5h7M12 13.5v4M10.5 21h3l-1.5-3.5z"/>',
    machado: '<path d="M8 21L15 4"/><path d="M12.5 6c3-2 6.5-1 8 1.5-1.5 3-4.5 4.5-7.5 4"/>',
    lira: '<path d="M7 4c-2 4-2 9 1 13h8c3-4 3-9 1-13"/><path d="M6.5 7h11M10 7v10M12 7v10M14 7v10M8 20h8"/>',
    arco: '<path d="M7 3c7 3 7 15 0 18"/><path d="M7 3v18M4 12h15M16.5 9.5L19 12l-2.5 2.5"/>',
    crucifixo: '<path d="M12 2.5v19M7 7.5h10"/><path d="M10.5 9.5l1.5 2 1.5-2"/>',
    item: '<rect x="5" y="5" width="14" height="14" rx="2"/>'
  };
  const ICONE_ID = { pao: 'pao', peixe: 'peixe', peixeIsca: 'peixe', agua: 'frasco', vela: 'vela', exame: 'exame', essencia: 'essencia', profanado: 'profanado',
    placas: 'armadura', cota: 'armadura', armaduraMiguel: 'armadura', iconeNicolau: 'icone', tauAntao: 'tau', reliqJorge: 'reliquia', cruzEremita: 'crucifixo', cintoAgostinho: 'cinto',
    vieira: 'vieira', anzol: 'anzol', lanterna: 'lanterna', esquadro: 'esquadro', picareta: 'picareta', vara: 'vara', pergaminho: 'pergaminho', anelPai: 'anel' };
  const ICONE_ARMA = { espada: 'espada', cajado: 'cajado', pregacao: 'livro', aspersorio: 'aspersorio', adaga: 'adaga', machado: 'machado', cantico: 'lira', arco: 'arco', luz: 'terco', crucifixo: 'crucifixo' };
  const ICONE_SLOT = { veste: 'veste', escapulario: 'escapulario', terco: 'terco', santo: 'medalha', arma: 'espada' };
  const iconeDe = id => { const it = ITENS[id] || {}; return ICONE_ID[id] || (it.armaTipo && ICONE_ARMA[it.armaTipo]) || ICONE_SLOT[it.slot] || 'item'; };
  IT.svg = (k, cls) => `<svg class="${cls || 'ico'}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SVG[k] || SVG.item}</svg>`;
  IT.icone = id => IT.svg(iconeDe(id));
  const ORDEM_TIPO = { consumivel: 0, raro: 1, arma: 2, veste: 3, escapulario: 4, terco: 5, santo: 6, ferramenta: 7, corrompido: 8 };
  const classeDe = it => it.slot || it.tipo || 'outro';
  const NOME_TIPO = { consumivel: 'Consumível', raro: 'Raro', corrompido: 'Corrompido · precisa de bênção', ferramenta: 'Ferramenta', arma: 'Arma', veste: 'Veste', escapulario: 'Escapulário', terco: 'Terço', santo: 'Item de santo' };
  const tipoTxt = it => (NOME_TIPO[classeDe(it)] || '') + (it.guilda && it.slot !== 'arma' ? ' · insígnia' : '') + (it.unico ? ' · relíquia' : '') + (it.forjada ? ' · forjada' : '') + (it.raro && it.tipo === 'consumivel' ? ' · raro' : '');
  const raridade = it => it.tipo === 'corrompido' ? 'corr' : (it.tipo === 'raro' || it.raro) ? 'raro' : (it.guilda || it.forjada || it.unico) ? 'insigne' : '';
  let ordem = 'tipo';
  try { ordem = localStorage.getItem('ov_inv_ordem') || 'tipo'; } catch (e) { /* sem armazenamento */ }
  function ordenar(ids) {
    const nm = id => ITENS[id].nome;
    if (ordem === 'nome') return ids.sort((a, b) => nm(a).localeCompare(nm(b), 'pt'));
    return ids.sort((a, b) => ((ORDEM_TIPO[classeDe(ITENS[a])] ?? 9) - (ORDEM_TIPO[classeDe(ITENS[b])] ?? 9)) || nm(a).localeCompare(nm(b), 'pt'));
  }
  // as pilhas de cada item, como ocupam os espaços
  function pilhas(obj, semLimite) {
    const out = [];
    ordenar(Object.keys(obj).filter(id => obj[id] > 0 && ITENS[id])).forEach(id => {
      let n = obj[id]; const p = semLimite ? Infinity : IT.pilha(id);
      while (n > 0) { const q = Math.min(n, p); out.push([id, q]); n -= q; }
    });
    return out;
  }
  let modo = null; // 'inv' | 'bau'
  let sel = null; // { onde: 'inv'|'bau'|'eq', id, slot }
  IT.tituloBau = 'Baú do Peregrino';
  IT.aberto = () => !!modo;
  IT.proxTitulo = null; // a Casa do Peregrino abre o mesmo baú com outro título
  IT.abrir = function (m) { modo = m || 'inv'; sel = null; IT.tituloBau = IT.proxTitulo || 'Baú do Peregrino'; IT.proxTitulo = null; $('inv').hidden = false; IT.refresh(); };
  IT.fechar = function () { if (modo === 'casa' && OV.casa) OV.casa.fechou(); modo = null; sel = null; $('inv').hidden = true; dica(null); };
  IT.abrirBau = () => { if (OV.jogo) OV.jogo.abrirInventario('bau'); };
  const celula = (id, n, onde, extra) => {
    const it = ITENS[id], s = sel && sel.onde === onde && sel.id === id && (!extra || sel.slot === extra);
    return `<button type="button" class="cel ${raridade(it)}${s ? ' sel' : ''}" data-cel="${onde}" data-id="${id}"${extra ? ` data-slot="${extra}"` : ''}>${IT.icone(id)}${n > 1 ? `<em>${n}</em>` : ''}</button>`;
  };
  const vazia = () => '<span class="cel vazia"></span>';
  function acoes(s) {
    if (!s) return '';
    const it = ITENS[s.id], b = [];
    if (s.onde === 'inv') {
      if (it.tipo === 'consumivel') b.push(['usar', 'Usar']);
      if (it.slot) b.push(['equipar', 'Equipar']);
      if (modo === 'bau') b.push(['guardar', abaBau === 'dupla' ? 'Guardar no baú da dupla →' : 'Guardar no baú →']);
      if (IT.podeDarColega && IT.podeDarColega(s.id)) b.push(['presente', `Dar a ${esc(IT.nomeColega())}`]);
    } else if (s.onde === 'bau' || s.onde === 'dupla') b.push(['pegar', '← Pegar']);
    else if (s.onde === 'eq') b.push(['tirar', 'Tirar']);
    return b.map(([a, t]) => `<button type="button" data-acao="${a}" data-id="${s.id}"${s.slot ? ` data-slot="${s.slot}"` : ''}>${t}</button>`).join('');
  }
  function fichaItem(id) {
    const it = ITENS[id], h = hagioDe(id);
    return `<b class="tt-nome">${esc(it.nome)}</b><span class="tt-tipo">${esc(tipoTxt(it))}</span><p class="tt-efeito">${esc(it.descr)}</p>${h ? `<p class="tt-hagio">${esc(h)}</p>` : ''}`;
  }
  IT.fichaItem = fichaItem;
  IT.modoAtual = () => modo;
  IT.refresh = function () {
    if (!modo || !P.pers) return;
    if (modo === 'casa') { $('inv').innerHTML = OV.casa ? OV.casa.html() : ''; return; }
    const m = mochila();
    if (sel && sel.onde === 'inv' && !m.itens[sel.id]) sel = null;
    if (sel && sel.onde === 'bau' && !P.pers.bau[sel.id]) sel = null;
    const temDupla = !!(IT.dupla && IT.dupla.ativo());
    if (!temDupla) abaBau = 'meu';
    if (sel && sel.onde === 'dupla' && !(temDupla && IT.dupla.lista()[sel.id] > 0)) sel = null;
    if (sel && sel.onde === 'eq' && m.equip[sel.slot] !== sel.id) sel = null;
    const eq = IT.SLOTS.map(([k, nome]) => { const id = m.equip[k]; return `<div class="eqc"><span>${nome}</span>${id && ITENS[id] ? celula(id, 1, 'eq', k) : `<span class="cel vazia">${IT.svg(ICONE_SLOT[k] || 'item', 'ico fantasma')}</span>`}</div>`; }).join('');
    const pm = pilhas(m.itens), usados = pm.length;
    let grade = pm.map(([id, n]) => celula(id, n, 'inv')).join('');
    for (let i = usados; i < CAPACIDADE; i++) grade += vazia();
    let html = `<div class="inv-top"><h2>${modo === 'bau' ? esc(IT.tituloBau) : 'Inventário'}</h2><div class="inv-ordem"><span>Ordenar:</span><button type="button" data-ordem="tipo" class="${ordem === 'tipo' ? 'on' : ''}">por tipo</button><button type="button" data-ordem="nome" class="${ordem === 'nome' ? 'on' : ''}">por nome</button></div><button type="button" class="btn ghost" data-acao="fechar">Fechar</button></div>`;
    if (modo === 'bau') html += '<p class="sub">O baú do peregrino é o mesmo em todas as Casas do Peregrino: o que você guarda aqui, encontra na casa de qualquer região.</p>';
    html += `<h3>Equipado</h3><div class="eqs">${eq}</div>`;
    html += `<div class="cols${modo === 'bau' ? ' duas' : ''}"><div><h3>Mochila <small>${usados}/${CAPACIDADE} espaços</small></h3><div class="grade">${grade}</div></div>`;
    if (modo === 'bau') {
      const dupla = abaBau === 'dupla', fonte = dupla ? IT.dupla.lista() : P.pers.bau, onde = dupla ? 'dupla' : 'bau';
      const pb = pilhas(fonte, true);
      let gb = pb.map(([id, n]) => celula(id, n, onde)).join('');
      for (let i = pb.length; i < Math.max(CAPACIDADE, Math.ceil((pb.length + 1) / 5) * 5); i++) gb += vazia();
      const abas = temDupla ? `<div class="inv-abas"><button type="button" data-aba="meu" class="${dupla ? '' : 'on'}">Seu baú</button><button type="button" data-aba="dupla" class="${dupla ? 'on' : ''}">Baú da dupla</button></div>` : '';
      html += `<div>${abas}<h3>${dupla ? 'Baú da dupla' : 'Baú'} <small>${pb.length} ${pb.length === 1 ? 'item' : 'itens'}</small></h3>${dupla ? '<p class="sub">Os dois jogadores veem e usam este baú. Ele fica guardado no mundo do anfitrião.</p>' : ''}<div class="grade">${gb}</div></div>`;
    }
    html += `</div><div class="inv-det">${sel ? `<div class="det-txt">${fichaItem(sel.id)}</div><div class="det-acoes">${acoes(sel)}</div>` : '<p class="det-vazio">Passe o mouse sobre um item para ler a sua descrição. Clique para escolher o que fazer com ele; dois cliques usam, equipam ou guardam.</p>'}</div>`;
    html += '<p class="foot">Consumíveis e restos corrompidos se empilham até 10 por espaço. Itens corrompidos só servem depois da bênção de um sacerdote (Padre Tomé, Frei Gaspar). Pressione I ou Esc para fechar.</p>';
    $('inv').innerHTML = html;
  };
  /* a descrição que segue o mouse */
  let tip = null;
  function dica(cel) {
    if (!tip) { tip = document.createElement('div'); tip.id = 'invTip'; tip.hidden = true; document.body.appendChild(tip); }
    if (!cel || !ITENS[cel.dataset.id]) { tip.hidden = true; return; }
    tip.innerHTML = fichaItem(cel.dataset.id); tip.hidden = false;
    const r = cel.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = r.right + 10, y = r.top;
    if (x + w > innerWidth - 8) x = r.left - w - 10;
    if (x < 8) x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
    if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  document.addEventListener('mouseover', ev => { const c = ev.target.closest && ev.target.closest('#inv .cel[data-id]'); dica(c || null); });
  function agir(a, id, slot, onde) {
    if (a === 'usar') IT.usar(id);
    else if (a === 'equipar') IT.equipar(id);
    else if (a === 'tirar') IT.desequipar(slot);
    else if (a === 'presente') { if (IT.darColega) IT.darColega(id); }
    else if (a === 'guardar') { if (abaBau === 'dupla' && IT.dupla) IT.dupla.guardar(id); else if (IT.tirar(id)) P.pers.bau[id] = (P.pers.bau[id] || 0) + 1; }
    else if (a === 'pegar' && (onde === 'dupla' || (!onde && abaBau === 'dupla'))) { if (IT.dupla) IT.dupla.pegar(id); }
    else if (a === 'pegar') { if (!(P.pers.bau[id] > 0)) return; if (!IT.cabe(1, id)) ui.toast('A mochila está cheia.'); else { P.pers.bau[id]--; if (P.pers.bau[id] <= 0) delete P.pers.bau[id]; mochila().itens[id] = (mochila().itens[id] || 0) + 1; } }
  }
  let abaBau = 'meu'; // 'meu' | 'dupla'
  let ultimoClique = null;
  const primaria = (onde, id) => { const it = ITENS[id]; if (onde === 'eq') return 'tirar'; if (onde === 'bau' || onde === 'dupla') return 'pegar'; if (modo === 'bau') return 'guardar'; return it.tipo === 'consumivel' ? 'usar' : it.slot ? 'equipar' : null; };
  document.addEventListener('click', ev => {
    const ab = ev.target.closest('#inv [data-aba]');
    if (ab) { abaBau = ab.dataset.aba; sel = null; IT.refresh(); return; }
    const o = ev.target.closest('#inv [data-ordem]');
    if (o) { ordem = o.dataset.ordem; try { localStorage.setItem('ov_inv_ordem', ordem); } catch (e) { /* ok */ } IT.refresh(); return; }
    const c = ev.target.closest('#inv .cel[data-id]');
    if (c) {
      const s = { onde: c.dataset.cel, id: c.dataset.id, slot: c.dataset.slot }, agora = performance.now();
      const mesmo = ultimoClique && ultimoClique.onde === s.onde && ultimoClique.id === s.id && ultimoClique.slot === s.slot && agora - ultimoClique.t < 380;
      ultimoClique = mesmo ? null : Object.assign({ t: agora }, s);
      if (mesmo) { const a = primaria(s.onde, s.id); if (a) { agir(a, s.id, s.slot, s.onde); sel = null; dica(null); IT.refresh(); return; } }
      sel = s; IT.refresh(); return;
    }
    const b = ev.target.closest('#inv [data-acao]'); if (!b) return;
    const a = b.dataset.acao, id = b.dataset.id;
    if (a === 'fechar') { OV.jogo.fecharInventario(); return; }
    agir(a, id, b.dataset.slot, sel ? sel.onde : null);
    IT.refresh();
  });

  /* ---- ao começar ou continuar ---- */
  IT.preparar = function () { mochila(); IT.limparChao(); IT.visual(); };
})(window.OV);
/* as capelas do peregrino: uma na Vila de São Roque e outra nos Portos do Festim */
(function (OV) {
  'use strict';
  if (!OV.itens || !OV.mundo || OV.mundo.falhou) return;
  { const v = OV.mundo.SITIO.vila, a = 315 * Math.PI / 180, cx = v.x + Math.cos(a) * 44, cz = v.z + Math.sin(a) * 44; OV.itens.criarCapela(cx, cz, Math.atan2(v.x - cx, v.z - cz), 'Capela do Peregrino (Vila de São Roque)'); }
  if (OV.porto) { const q = OV.porto.W(-18, -38); OV.itens.criarCapela(q.x, q.z, Math.PI / 2, 'Capela do Peregrino (Portos do Festim)'); }
})(window.OV);

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
    pao: { nome: 'Pão abençoado', tipo: 'consumivel', tecla: '5', descr: 'Recupera 35 de vida.' },
    agua: { nome: 'Água benta', tipo: 'consumivel', tecla: '6', descr: 'Purifica todos os vícios em você e devolve 20 de Fé.' },
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
    tunicaBranca: { nome: 'Túnica branca', slot: 'veste', descr: '+30 de Fé máxima, +15 de vida máxima, e a Luxúria dura metade do tempo.', mods: { fe: 30, hp: 15, meio: ['luxuria'] }, cor: 0xece6d6 }
  };
  OV.ITENS = ITENS;
  const EQUIP = Object.keys(ITENS).filter(k => ITENS[k].slot && !ITENS[k].guilda);
  const CAPACIDADE = 20;

  const IT = {}; OV.itens = IT;
  IT.SLOTS = SLOTS;
  function mochila() {
    const p = P.pers; if (!p) return null;
    if (!p.mochila) p.mochila = { itens: { pao: 2, agua: 1 }, equip: {} };
    p.mochila.itens = p.mochila.itens || {}; p.mochila.equip = p.mochila.equip || {};
    if (!p.bau) p.bau = {};
    return p.mochila;
  }
  IT.mochila = mochila;
  IT.qtd = id => { const m = mochila(); return m ? (m.itens[id] || 0) : 0; };
  IT.total = () => { const m = mochila(); return m ? Object.values(m.itens).reduce((a, b) => a + b, 0) : 0; };
  IT.cabe = n => IT.total() + (n || 1) <= CAPACIDADE;
  IT.dar = function (id, n, silencioso) {
    const m = mochila(); n = n || 1;
    if (!IT.cabe(n)) { if (!silencioso) ui.toast('O inventário está cheio. Guarde itens no baú de uma capela.'); return false; }
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
    return m;
  };

  /* ---- usar e equipar ---- */
  IT.usar = function (id) {
    if (!P.D || P.dead) return;
    if (!IT.qtd(id)) { ui.toast(`Você não tem ${ITENS[id].nome}.`); return; }
    if (P.status.avareza) { ui.toast('A Avareza prende a sua mão: você não consegue usar nada do que carrega. Dê esmola num Oratório.'); return; }
    if (id === 'pao') { if (P.hp >= P.D.maxHp) { ui.toast('Você já está com a vida cheia.'); return; } P.hp = Math.min(P.D.maxHp, P.hp + 35 * (P.status.gula ? 0.5 : 1)); OV.combate.anel(0xe8c890, 1.6, 0.6, 0.6); A.heal(); }
    else if (id === 'agua') { P.status = {}; P.fe = Math.min(P.D.maxFe, P.fe + 20); OV.combate.anel(0x8ac8ff, 2, 0.7, 0.7); A.heal(); ui.toast('A água benta purifica você.'); }
    else if (id === 'vela') { P.fe = Math.min(P.D.maxFe, P.fe + 40); OV.combate.anel(0xffd27a, 1.6, 0.7, 0.6); A.bell(523, 0.12); }
    else return;
    IT.tirar(id); IT.refresh();
  };
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
    if (!IT.cabe()) { ui.toast('O inventário está cheio.'); return; }
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
      if (d.chefe) cai.push('exame');
    } else {
      // o demônio deixa um resto corrompido, ou algo bom que tinha roubado
      if (Math.random() < 0.2) cai.push(sortear(BOM)); else cai.push('essencia');
      if (d.chefe || d.variante === 'elite') cai.push('profanado');
      else if (Math.random() < (d.variante === 'forte' ? 0.2 : 0.06)) cai.push('profanado');
      if (d.chefe) cai.push('profanado', 'essencia');
      const grande = d.chefe || (OV.inimigos.CHEFES && OV.inimigos.CHEFES.has(d.key) && !d.fixo);
      if (grande || (d.variante === 'elite' && Math.random() < 0.25) || (d.variante === 'forte' && Math.random() < 0.04)) cai.push('exame');
    }
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
        if (IT.cabe()) { IT.dar(c.id); M.scene.remove(c.g); chao.splice(i, 1); A.bell(784, 0.06); }
        else if (avisoCheio <= 0) { avisoCheio = 4; ui.toast('O inventário está cheio. Guarde itens no baú de uma capela.'); }
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
  IT.criarCapela = function (x, z, rot, nome) {
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
    M.interativo(porta.x, porta.z, 2.0, () => 'Rezar na capela e abrir o baú', () => OV.jogo.usarCapela(c));
    IT.capelas.push(c);
    return c;
  };

  /* ================= PAINEL DO INVENTÁRIO E DO BAÚ ================= */
  let modo = null; // 'inv' | 'bau'
  IT.aberto = () => !!modo;
  IT.abrir = function (m) { modo = m || 'inv'; $('inv').hidden = false; IT.refresh(); };
  IT.fechar = function () { modo = null; $('inv').hidden = true; };
  IT.abrirBau = () => { if (OV.jogo) OV.jogo.abrirInventario('bau'); };
  function linhaItem(id, n, onde) {
    const it = ITENS[id];
    let botoes = '';
    if (onde === 'inv') {
      if (it.tipo === 'consumivel') botoes += `<button type="button" data-acao="usar" data-id="${id}">Usar</button>`;
      if (it.slot) botoes += `<button type="button" data-acao="equipar" data-id="${id}">Equipar</button>`;
      if (modo === 'bau') botoes += `<button type="button" data-acao="guardar" data-id="${id}">Guardar →</button>`;
    } else botoes += `<button type="button" data-acao="pegar" data-id="${id}">← Pegar</button>`;
    return `<li class="${it.tipo === 'corrompido' ? 'corr' : it.tipo === 'raro' ? 'raro' : ''}"><div><b>${esc(it.nome)}${n > 1 ? ` <em>×${n}</em>` : ''}</b><small>${esc(it.descr)}${it.slot ? ` · ${SLOTS.find(s => s[0] === it.slot)[1]}` : ''}</small></div><span>${botoes}</span></li>`;
  }
  IT.refresh = function () {
    if (!modo || !P.pers) return;
    const m = mochila();
    const eq = SLOTS.map(([k, nome]) => { const id = m.equip[k]; return `<div class="eq"><span>${nome}</span>${id ? `<b>${esc(ITENS[id].nome)}</b><small>${esc(ITENS[id].descr)}</small><button type="button" data-acao="tirar" data-slot="${k}">Tirar</button>` : '<i>vazio</i>'}</div>`; }).join('');
    const lista = obj => Object.keys(obj).filter(id => obj[id] > 0 && ITENS[id]).sort((a, b) => (ITENS[a].tipo || ITENS[a].slot).localeCompare(ITENS[b].tipo || ITENS[b].slot));
    const inv = lista(m.itens).map(id => linhaItem(id, m.itens[id], 'inv')).join('') || '<li class="vazio">Nada na mochila.</li>';
    let html = `<div class="inv-top"><h2>${modo === 'bau' ? 'Capela do Peregrino' : 'Inventário'}</h2><button type="button" class="btn ghost" data-acao="fechar">Fechar</button></div>`;
    if (modo === 'bau') html += '<p class="sub">O baú do peregrino é o mesmo em todas as capelas: o que você guarda aqui, encontra em qualquer outra.</p>';
    html += `<h3>Equipado</h3><div class="eqs">${eq}</div>`;
    html += `<div class="cols${modo === 'bau' ? ' duas' : ''}"><div><h3>Mochila (${IT.total()}/${CAPACIDADE})</h3><ul class="itens">${inv}</ul></div>`;
    if (modo === 'bau') { const b = P.pers.bau; html += `<div><h3>Baú</h3><ul class="itens">${lista(b).map(id => linhaItem(id, b[id], 'bau')).join('') || '<li class="vazio">O baú está vazio.</li>'}</ul></div>`; }
    html += '</div><p class="foot">Itens corrompidos só servem depois da bênção de um sacerdote (Padre Tomé, Frei Gaspar). Pressione I ou Esc para fechar.</p>';
    $('inv').innerHTML = html;
  };
  document.addEventListener('click', ev => {
    const b = ev.target.closest('#inv [data-acao]'); if (!b) return;
    const a = b.dataset.acao, id = b.dataset.id;
    if (a === 'fechar') { OV.jogo.fecharInventario(); return; }
    if (a === 'usar') IT.usar(id);
    else if (a === 'equipar') IT.equipar(id);
    else if (a === 'tirar') IT.desequipar(b.dataset.slot);
    else if (a === 'guardar') { if (IT.tirar(id)) P.pers.bau[id] = (P.pers.bau[id] || 0) + 1; }
    else if (a === 'pegar') { if (!IT.cabe()) ui.toast('A mochila está cheia.'); else { P.pers.bau[id]--; if (P.pers.bau[id] <= 0) delete P.pers.bau[id]; mochila().itens[id] = (mochila().itens[id] || 0) + 1; } }
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

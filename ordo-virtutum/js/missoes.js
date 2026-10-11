/* Ordo Virtutum — Ato I: missões, diálogos dos personagens, objetos do vale, hábitos e o fim do ato */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, CR = OV.cripta, H = OV.habilidades;
  const MS = {}; OV.missoes = MS;
  MS.ganchos = { aplicar: [], spawn: [], evento: [], update: [], inventario: [] };
  const J = () => OV.jogo;
  const prog = () => OV.jogo.prog;
  const F = () => prog().flags;
  const g = (m, f) => (P.pers && P.pers.sexo === 'f') ? f : m;
  const titulo = () => P.pers ? OV.ORDENS[P.pers.ordem].titulo[P.pers.sexo] : '';
  const NOME_V = { prudencia: 'Prudência', justica: 'Justiça', fortaleza: 'Fortaleza', temperanca: 'Temperança', fe: 'Fé', esperanca: 'Esperança', caridade: 'Caridade' };

  /* ================= MISSÕES ================= */
  const MIS = {
    m1: { nome: 'O Vale Silencioso', tipo: 'p', xp: 50, etapas: ['Fale com Padre Tomé, na igreja da Vila de São Roque.', 'Acenda a vela do Oratório da praça da vila.'] },
    m2: { nome: 'O Claustro Tomado', tipo: 'p', xp: 120, etapas: ['Vá ao Mosteiro de Santa Sabina, ao norte da vila, e entre no claustro.', 'Expulse os vícios do claustro e liberte o monge possesso.'] },
    m3: { nome: 'Os Sinos Mudos', tipo: 'p', xp: 150, etapas: [() => `Encontre os três badalos (${(prog().inv.badalos || []).length}/3): no dormitório do mosteiro, no moinho e nas ruínas da floresta.`, 'Leve os badalos à torre do sino do mosteiro.'] },
    m4: { nome: 'A Ermida de Antão', tipo: 'p', xp: 120, etapas: ['Suba à Ermida de Antão, do outro lado do rio, e reze diante da cruz.', 'Resista à vigília até a aurora.'] },
    m5: { nome: 'Ao Meio-Dia', tipo: 'p', xp: 300, etapas: ['Desça à cripta de Santa Sabina, a leste do claustro.', 'Chegue à Câmara do Meio-Dia, no fundo da cripta.', 'Vença o Demônio do Meio-Dia.', 'Volte à igreja abacial para a Missa. A porta fica no lado leste.'] },
    s1: { nome: 'O Moinho Parado', tipo: 's', xp: 70, etapas: ['Fale com Bartolomeu, o moleiro.', 'Solte a trava da roda do moinho, junto ao rio.'] },
    s2: { nome: 'O Pão Roubado', tipo: 's', xp: 60, etapas: ['Decida o que fazer com Joaquim.'] },
    s3: { nome: 'O Lobo do Vale', tipo: 's', xp: 60, etapas: ['Vá ao covil do lobo, a oeste da floresta.', 'Conte ao pastor o que aconteceu.'] },
    s4: { nome: 'A Relíquia de Santa Sabina', tipo: 's', xp: 70, etapas: ['Recupere a relíquia no acampamento dos possessos, a sudeste da vila.', 'Deposite a relíquia aos pés da cruz do claustro.'] },
    s5: { nome: 'O Fole da Ferreira', tipo: 's', xp: 70, etapas: ['Traga carvão da Mina Velha, nas colinas ao sul, a oeste da estrada.', 'Leve o carvão a Lia.'] },
    s6: { nome: 'O Moribundo', tipo: 's', xp: 80, etapas: ['Encontre Padre Tomé na Capela de São Roque, na floresta.', 'Volte à casa de Matias.'] }
  };
  MS.MIS = MIS;
  const st = id => prog().missoes[id];
  MS.ativa = id => !!(st(id) && !st(id).fim);
  MS.feita = id => !!(st(id) && st(id).fim);
  MS.etapa = id => st(id) ? st(id).e : -1;
  const res = id => st(id) ? st(id).res : null;
  MS.iniciar = function (id) {
    if (st(id)) return;
    prog().missoes[id] = { e: 0, fim: false, res: null };
    ui.toast(`Nova missão: ${MIS[id].nome}`); A.bell(587, 0.1); J().salvar();
  };
  MS.avancar = function (id, e) {
    if (!st(id)) MS.iniciar(id);
    if (st(id).fim || st(id).e >= e) return;
    st(id).e = e; J().salvar();
  };
  MS.concluir = function (id, r) {
    if (!st(id)) prog().missoes[id] = { e: 0, fim: false, res: null };
    if (st(id).fim) return;
    st(id).fim = true; st(id).res = r || null;
    setTimeout(() => { ui.toast(`Missão concluída: ${MIS[id].nome}`); A.bell(659, 0.14); }, 400);
    OV.combate.ganharXp(MIS[id].xp);
    J().salvar();
  };

  /* hábitos: atos repetidos fortalecem a virtude */
  MS.ato = function (v, n) {
    const pers = P.pers; pers.habitos = pers.habitos || {};
    const k = (pers.ordem === 'franciscano' && v === 'caridade' ? 2 : 1) * (n || 1);
    pers.habitos[v] = (pers.habitos[v] || 0) + k;
    while (pers.habitos[v] >= 3) {
      pers.habitos[v] -= 3;
      if (pers.virt[v] < OV.MAX_VIRTUDE) { pers.virt[v]++; OV.combate.recalcular(); setTimeout(() => ui.toast(`Pelo hábito, sua ${NOME_V[v]} cresceu (+1).`), 1600); }
    }
  };
  const denarios = n => { P.pers.denarios = Math.max(0, (P.pers.denarios || 0) + n); if (n > 0) ui.toast(`+${n} denários`); };
  const temBadalo = id => (prog().inv.badalos || []).includes(id);
  function pegarBadalo(id, msg) {
    if (temBadalo(id)) return;
    prog().inv.badalos.push(id);
    const n = prog().inv.badalos.length;
    ui.fala('Badalo', `${msg} (${n}/3)`); A.bell(880, 0.08);
    if (n >= 3 && MS.ativa('m3')) MS.avancar('m3', 1);
    J().salvar();
  }

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  MS.init = function () {
    const p = prog();
    p.flags = p.flags || {}; p.missoes = p.missoes || {}; p.inv = p.inv || {}; p.inv.badalos = p.inv.badalos || [];
    P.pers.denarios = P.pers.denarios === undefined ? 10 : P.pers.denarios; P.pers.habitos = P.pers.habitos || {};
    if (!st('m1')) p.missoes.m1 = { e: 0, fim: false, res: null };
    vigilia.ativa = false;
    aplicarMundo(); spawnQuest();
    H.limpar(true);
    if (F().lobo_companheiro && P.pers.ordem === 'franciscano') H.chamarLobo(true);
  };
  function aplicarMundo() {
    const f = F(), fig = M.figuras;
    M.rodadaFig = (M.rodadaFig || 0) + 1; // quem não for mandado a outro lugar nesta rodada volta (andando) para casa
    Object.values(fig).forEach(x => x.reset());
    const S = M.SITIO;
    if (f.tome_capela) fig.tome.ir(S.capela.x + 3.5, S.capela.z + 0.5, -Math.PI / 2);
    if (res('s2') === 'justica') fig.joaquim.ir(S.vila.x - 6, S.vila.z - 17, 0.2);
    if (res('s2') === 'ambos') fig.joaquim.ir(S.moinho.x + 3.5, S.moinho.z + 5.8, -0.4);
    fig.afonso.mostrar(!!f.afonso_livre);
    fig.abade.mostrar(!!f.abade_livre && !!f.ato1_fim);
    fig.antao.mostrar(false);
    M.rodaGirando(!!f.roda_solta);
    M.lampada(!!f.ato1_fim);
    CR.resetarChefe();
    if (!f.chefe_resolvido && MS.ativa('m5') && MS.etapa('m5') === 2) st('m5').e = 1; // v24: a luta interrompida recomeça (antes, o chefe sumia)
    MS.ganchos.aplicar.forEach(fn => fn());
    const PAS = (OV.vida && OV.vida.PASSEIO) || {};
    Object.entries(fig).forEach(([id, x]) => { if (x.rodada !== M.rodadaFig && !PAS[id] && !x.op.santo) x.ir(x.x0, x.z0, x.rot0); });
  }
  MS.aplicarMundo = () => aplicarMundo();
  /* v24: a memória do chefe. Quem cai na luta volta e encontra o chefe ferido como o deixou (com um fôlego a mais),
     sem a cena de entrada de novo. Vale para todos os chefões. */
  const vivoE = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  MS.memChefe = {
    tem: k => !!(F().memChefe && F().memChefe[k]),
    ler: k => F().memChefe && F().memChefe[k],
    guardar(k, e, extra) { const f = F(); f.memChefe = f.memChefe || {}; f.memChefe[k] = Object.assign({ hp: Math.max(0.12, e.hp / e.def.hp) }, extra || {}); },
    limpar(k) { if (F().memChefe) delete F().memChefe[k]; }
  };
  MS.guardarChefes = () => I.lista.forEach(e => { if (e.def.chefe && vivoE(e) && e.hp < e.def.hp) MS.memChefe.guardar(e.def.key, e); });
  // ao surgir de novo, o chefe traz as feridas da última luta
  const spawn0 = I.spawn;
  I.spawn = function (tipo) {
    const e = spawn0.apply(I, arguments);
    const m = e && e.def.chefe && MS.memChefe.ler(e.def.key);
    if (m) { e.hp = Math.min(e.def.hp, Math.round(e.def.hp * Math.min(1, m.hp + 0.08))); setTimeout(() => ui.toast(`${e.def.name} ainda traz as feridas da última luta.`), 900); }
    return e;
  };
  MS.ganchos.evento.push((tipo, x) => {
    if ((tipo === 'vencido' || tipo === 'liberto') && x && x.def && x.def.chefe) { MS.memChefe.limpar(x.def.key); if (x.def.key === 'abade') MS.memChefe.limpar('meiodia'); }
    return false;
  });
  const tagRemove = tag => { I.porTag(tag).forEach(e => { if (!e.removed) { M.scene.remove(e.g); e.lab.el.remove(); e.removed = true; } }); I.lista = I.lista.filter(e => e.tag !== tag); };
  MS.tagRemove = tagRemove;
  function spawnQuest() {
    const f = F(), der = prog().derrotados;
    ['afonso', 'b1', 'acamp', 'mina', 'lobo', 'vila_larva', 'vigilia', 'prova'].forEach(tagRemove);
    if (!f.afonso_livre && !f.afonso_deixado) { const e = I.spawn('possesso', false, { x: 6, z: -6 }); e.tag = 'afonso'; e.lab.el.firstChild.textContent = 'Irmão Afonso, possuído'; }
    if (!temBadalo('dormitorio')) [[-20, -2], [-19, -9], [-21, 3]].forEach(([x, z]) => { const e = I.spawn('diabrete', false, { x, z }); e.tag = 'b1'; });
    if (!f.reliquia_obtida && !f.reliquia_guardada) [[-2, -3], [3, 2], [-4, 3]].forEach(([dx, dz]) => { const e = I.spawn('possesso', false, { x: M.SITIO.acampamento.x + dx, z: M.SITIO.acampamento.z + dz }, { nivel: 3 }); e.tag = 'acamp'; e.sumir = true; });
    if (!f.carvao) [[2, -4], [-2, -2], [4, 2]].forEach(([dx, dz]) => { const e = I.spawn('larva', false, { x: M.SITIO.mina.x + dx, z: M.SITIO.mina.z + dz }, { nivel: 2 }); e.tag = 'mina'; });
    if (MS.ativa('s3') && MS.etapa('s3') === 0) { const e = I.spawn('lobo', false, { x: M.SITIO.covil.x, z: M.SITIO.covil.z }); e.tag = 'lobo'; }
    if (f.reliquia_guardada) [[5, 8], [-6, -7]].forEach(([dx, dz]) => { const e = I.spawn('larva', false, { x: M.SITIO.vila.x + dx, z: M.SITIO.vila.z + dz }); e.tag = 'vila_larva'; });
    MS.ganchos.spawn.forEach(fn => fn());
  }
  MS.respawnQuest = function () { spawnQuest(); };

  /* ================= OBJETOS E LUGARES DAS MISSÕES ================= */
  // acampamento dos possessos
  (function () {
    const x = M.SITIO.acampamento.x, z = M.SITIO.acampamento.z, h = M.altura(x, z), sm = OV.sm, mesh = OV.mesh;
    M.scene.add(mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.25, 8), sm(0x2a2422), x, h + 0.12, z));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 6), new THREE.MeshBasicMaterial({ color: 0xff8a34 })); f.position.set(x, h + 0.6, z); M.scene.add(f); M.flames.push(f);
    M.emissor(x, h + 1.2, z, 1.6, 12, 0xff7a2a);
    [[-3.5, -2, 0.5], [3, -3, -0.4]].forEach(([dx, dz, r]) => { const t = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 4), sm(0x4a3a2a)); t.position.set(x + dx, M.altura(x + dx, z + dz) + 1.2, z + dz); t.rotation.y = r; t.castShadow = true; M.scene.add(t); M.obstacles.push({ x: x + dx, z: z + dz, r: 1.3 }); });
    M.scene.add(mesh(new THREE.BoxGeometry(1.1, 0.7, 0.7), sm(0x4a2e1a), x, M.altura(x, z - 2.3) + 0.35, z - 2.3));
    M.scene.add(mesh(new THREE.BoxGeometry(1.15, 0.1, 0.75), OV.mundo.MAT.gold, x, M.altura(x, z - 2.3) + 0.72, z - 2.3));
    M.obstacles.push({ x, z: z - 2.3, r: 0.7 });
    M.interativo(x, z - 3.6, 2.2, () => (!F().reliquia_obtida && !F().reliquia_guardada) ? 'Abrir o baú' : null, () => {
      if (I.porTag('acamp').some(e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed)) { ui.toast('Os possessos ainda guardam o baú.'); return; }
      D.abrir({ inicio: 'a', nos: {
        a: { quem: 'Baú dos possessos', txt: 'Dentro do baú, envolta num pano bordado, está a relíquia de Santa Sabina. Ela pesa pouco, e aquece as mãos.', opc: [
          { t: 'Levar a relíquia de volta ao mosteiro.', ef: () => { F().reliquia_obtida = true; MS.iniciar('s4'); MS.avancar('s4', 1); }, ir: 'b' },
          { t: 'Ficar com ela. A proteção da santa será útil na estrada.', ef: () => { F().reliquia_guardada = true; MS.iniciar('s4'); MS.concluir('s4', 'guardada'); spawnQuest(); }, ir: 'c' }] },
        b: { quem: 'Anjo da Guarda', txt: 'Leve-a ao claustro e deposite-a aos pés da cruz. Santa Sabina voltará a guardar esta terra.' },
        c: { quem: 'Anjo da Guarda', txt: 'A relíquia agora renova a sua Fé aos poucos. Mas a vila ficou sem a guarda da santa, e o tédio já rasteja até as casas.' }
      } });
    });
  })();
  // mina velha
  (function () {
    const x = M.SITIO.mina.x, z = M.SITIO.mina.z, h = M.altura(x, z), sm = OV.sm, mesh = OV.mesh, wood = OV.mundo.MAT.woodL;
    [-1.3, 1.3].forEach(dx => M.scene.add(mesh(new THREE.BoxGeometry(0.3, 3, 0.3), wood, x + dx, h + 1.5, z + 1.2)));
    M.scene.add(mesh(new THREE.BoxGeometry(3.2, 0.35, 0.4), wood, x, h + 3, z + 1.2));
    M.scene.add(mesh(new THREE.BoxGeometry(2.3, 2.8, 2.6), sm(0x050404), x, h + 1.3, z + 2.6));
    M.scene.add(mesh(new THREE.BoxGeometry(5, 5, 4), sm(0x3d3630), x, h + 1.6, z + 4.3));
    M.caixa(x, z + 3.6, 2.5, 2.2, 0);
    M.scene.add(mesh(new THREE.BoxGeometry(1.1, 0.6, 0.8), wood, x + 2.4, h + 0.3, z - 0.4));
    M.scene.add(mesh(new THREE.SphereGeometry(0.4, 6, 5), sm(0x161412), x - 2.2, h + 0.35, z - 0.2));
    M.emissor(x, h + 2.3, z + 0.4, 0.9, 7, 0xff8a34);
    M.interativo(x - 2.2, z - 0.8, 2.2, () => (MS.ativa('s5') && !F().carvao) ? 'Pegar o saco de carvão' : null, () => {
      if (I.porTag('mina').some(e => e.state !== 'dead' && !e.removed)) { ui.toast('As Larvas do Tédio cercam a entrada da mina.'); return; }
      F().carvao = true; MS.avancar('s5', 1); ui.fala('Mina Velha', 'Você enche um saco com carvão. Está pesado, mas Lia vai gostar.');
    });
  })();
  // badalo do dormitório
  M.interativo(-23.0, -6, 2.6, () => !temBadalo('dormitorio') ? 'Procurar no dormitório' : null, () => {
    if (I.porTag('b1').some(e => e.state !== 'dead' && !e.removed && Math.hypot(e.g.position.x + 20, e.g.position.z + 3) < 14)) { ui.toast('Os diabretes rondam o dormitório.'); return; }
    pegarBadalo('dormitorio', 'Entre as camas reviradas dos monges, você encontra um badalo de bronze, ainda com a corda.');
  });
  // badalo das ruínas
  M.interativo(M.SITIO.ruinas.x + 0.5, M.SITIO.ruinas.z + 3, 2.6, () => !temBadalo('ruinas') ? 'Remover as pedras das ruínas' : null, () => {
    if (I.vivos().some(e => Math.hypot(e.g.position.x - M.SITIO.ruinas.x - 1, e.g.position.z - M.SITIO.ruinas.z - 3) < 9)) { ui.toast('Há diabretes demais por perto.'); return; }
    pegarBadalo('ruinas', 'Sob as pedras caídas, brilha o bronze de um badalo.');
  });
  // relíquia aos pés da cruz
  M.interativo(0, 3.4, 2.4, () => (F().reliquia_obtida && !F().reliquia_devolvida) ? 'Depositar a relíquia aos pés da cruz' : null, () => {
    F().reliquia_devolvida = true; MS.ato('justica'); MS.concluir('s4', 'devolvida');
    ui.fala('Claustro de Santa Sabina', 'As velas ao redor da cruz se avivam. Santa Sabina volta a guardar o claustro e a vila.'); A.bell(523, 0.15);
  });
  // diário do abade, na sala dos monges
  M.interativo(306.3, 13.2, 2.3, () => 'Ler o diário do Abade', () => D.falas([
    ['Diário do Abade Anselmo', '"Dia de São Bento. Os irmãos rezam as horas, e eu não sinto nada. Vou à capela só por obrigação."'],
    ['Diário do Abade Anselmo', '"Já não desço para o refeitório. Para quê? O sol não se move. As horas não passam. Uma voz me diz que nada disto vale a pena."'],
    ['Diário do Abade Anselmo', '"Mandei calar os sinos. Desço à cripta, onde ao menos há silêncio. Que Deus tenha piedade de mim, se ainda se lembra do meu nome."']
  ]));
  // saída da cripta e porta da igreja
  M.interativo(300, 58.6, 2.4, () => 'Subir ao mosteiro', () => { CR.sair(); J().mudouLugar(); });
  M.interativo(9.4, -31, 3.0, () => (MS.ativa('m5') && MS.etapa('m5') === 3) ? 'Entrar para a Missa' : (F().ato1_fim ? 'Entrar na igreja abacial' : null), () => {
    if (F().ato1_fim) { ui.fala('Igreja abacial', 'A Lâmpada da Diligência arde sobre o altar. Alguns aldeões rezam em silêncio.'); return; }
    missa();
  });

  /* ---- objetos do vale (chamados pelo vale.js) ---- */
  MS.textoObjeto = function (id) {
    const f = F();
    if (id === 'roda') return f.roda_solta ? 'Olhar a roda do moinho' : 'Soltar a trava da roda';
    if (id === 'torre') return (MS.ativa('m3') && MS.etapa('m3') === 1) ? 'Recolocar os badalos na torre' : 'Olhar a torre do sino';
    if (id === 'cripta') return (MS.ativa('m5') || f.chefe_resolvido) ? 'Descer à cripta' : 'Examinar o portão da cripta';
    if (id === 'cruz') return (MS.ativa('m4') && MS.etapa('m4') === 0) ? 'Rezar diante da cruz' : 'Olhar a cruz da ermida';
    return 'Examinar';
  };
  MS.objeto = function (id) {
    const f = F();
    if (id === 'roda') {
      if (f.roda_solta) { ui.fala('Roda do moinho', 'A roda gira, e a água canta embaixo dela.'); return; }
      MS.soltarRoda();
      const fim = () => { pegarBadalo('moinho', 'Ao soltar a trava, cai na água rasa um badalo de sino que estava preso nela.'); if (MS.ativa('s1')) MS.avancar('s1', 1); };
      if (OV.cenas) OV.cenas.acontecimentos.roda(fim); else fim();
      return;
    }
    if (id === 'torre') {
      if (MS.ativa('m3') && MS.etapa('m3') === 1) { sinos(); return; }
      if (f.sinos) { ui.fala('Torre do sino', 'Os sinos de Santa Sabina voltaram a tocar as horas.'); return; }
      const n = (prog().inv.badalos || []).length;
      ui.fala('Torre do sino', MS.ativa('m3') ? `Faltam badalos: você tem ${n} de 3.` : 'Os sinos estão mudos. Alguém arrancou os badalos e os escondeu pelo vale.');
      return;
    }
    if (id === 'cripta') {
      if (MS.ativa('m5') || f.chefe_resolvido) {
        const primeira = MS.ativa('m5') && MS.etapa('m5') === 0;
        CR.entrar(); J().mudouLugar();
        if (primeira) { MS.avancar('m5', 1); setTimeout(() => D.falas([['Anjo da Guarda', 'A cripta é fria, e lá embaixo o tempo parece parado. No fundo, o sol do meio-dia entra por uma fresta. Fique perto da luz.']]), 400); }
        return;
      }
      ui.fala('Portão da cripta', f.sinos ? 'O portão continua selado. Talvez alguém no alto do vale saiba como abri-lo.' : 'O portão está selado. Dizem na vila que ele só se abre quando os sinos de Santa Sabina voltarem a tocar.');
      return;
    }
    if (id === 'cruz') {
      if (MS.ativa('m4') && MS.etapa('m4') === 0) { visao(); return; }
      ui.fala('Cruz da ermida', f.graca_antao ? 'O vento sopra no alto do rochedo. Você ainda sente a paz da visão.' : 'O vento sopra forte no alto do rochedo. A madeira está gasta por anos de oração.');
    }
  };
  MS.soltarRoda = function () { F().roda_solta = true; M.rodaGirando(true); A.bell(220, 0.1); };

  /* ================= OS SINOS ================= */
  function sinos() {
    F().sinos = true;
    [0, 700, 1400, 2400, 3100, 3800].forEach((t, i) => setTimeout(() => A.bell([196, 247, 294][i % 3], 0.32), t));
    const fim = () => {
      ui.banner('Os sinos voltam a tocar');
      MS.concluir('m3');
      setTimeout(() => { MS.iniciar('m4'); ui.toast('No vale, as portas se abrem e o povo sai para ouvir.'); }, 4200);
    };
    if (OV.cenas) OV.cenas.acontecimentos.sinos(fim); else fim();
  }

  /* ================= A VISÃO DE SANTO ANTÃO E A VIGÍLIA ================= */
  const vigilia = { ativa: false, onda: 0, espera: 0 };
  function visao() {
    ui.clarao('#fff6dc');
    M.figuras.antao.mostrar(true);
    A.bell(523, 0.2);
    const repetir = !!F().graca_antao;
    D.abrir({ inicio: repetir ? 'd' : 'a', nos: {
      a: { quem: 'Santo Antão', txt: () => `Não tenha medo, ${g('filho', 'filha')}. Também eu fui tentado no deserto, ao meio-dia, quando o sol parecia não andar e a cela parecia uma prisão.`, prox: 'b' },
      b: { quem: 'Santo Antão', txt: 'O demônio do meio-dia não grita: ele sussurra que nada vale a pena. Foi assim que levou o Abade Anselmo. Ele se trancou na cripta, e o demônio ocupou o lugar da esperança dele.', prox: 'c' },
      c: { quem: 'Santo Antão', txt: 'Para vencê-lo, não pare. Quem trabalha e reza não lhe dá espaço. E quando precisar rezar, faça-o dentro da luz: lá ele não alcança você... se tiver a graça para isso.', prox: () => (F().graca_antao || F().recusou_antao || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('Santo Antão', 'niveis',
        'Mas essa graça não se recebe de mãos cheias. Eu deixei tudo no deserto: a casa, a herança, até o nome. O que você conquistou até aqui, a força e a experiência dos combates, ofereça a Deus. Ele devolve de outro modo.',
        () => { F().graca_antao = true; setTimeout(() => ui.toast('Você recebeu a Graça de Antão: rezando dentro da luz, nada o fere.'), 1800); }, 'd',
        'Deus não força ninguém. Sem a graça, a luz do meio-dia não vai proteger você. Lute mesmo assim: quem não para não se perde.') : {}),
      d: { quem: 'Santo Antão', ef: () => { if (!F().graca_antao) F().recusou_antao = true; }, txt: 'Agora escolha: vai velar comigo até a aurora, ou descer já ao vale? A vigília é dura, mas fortalece a Fé.', opc: [
        { t: 'Fazer a vigília até a aurora.', ef: () => { MS.avancar('m4', 1); }, ir: 'v' },
        { t: 'Descer agora.', ef: () => { MS.concluir('m4', 'desceu'); abrirCripta(); }, ir: 'x' }] },
      v: { quem: 'Santo Antão', txt: 'Então vigie. Eles virão em três levas. Não durma.', depois: () => iniciarVigilia() },
      x: { quem: 'Santo Antão', txt: 'Vá em paz. O portão da cripta não está mais selado para você.', depois: () => setTimeout(() => M.figuras.antao.mostrar(false), 800) }
    } });
  }
  function abrirCripta() { setTimeout(() => { MS.iniciar('m5'); ui.toast('O portão da cripta de Santa Sabina se abriu.'); }, 1200); }
  function iniciarVigilia() { vigilia.ativa = true; vigilia.onda = 0; vigilia.espera = 1.5; if (OV.tempo && !OV.tempo.ehNoite()) OV.tempo.definir(21); ui.clarao('#0a0608'); ui.toast('A noite cai sobre o rochedo...'); }
  function atualizarVigilia(dt) {
    if (!vigilia.ativa) return;
    const vivos = I.porTag('vigilia').filter(e => e.state !== 'dead' && !e.removed);
    if (vivos.length) return;
    vigilia.espera -= dt; if (vigilia.espera > 0) return;
    if (vigilia.onda >= 3) {
      vigilia.ativa = false;
      if (P.pers.virt.fe < OV.MAX_VIRTUDE) P.pers.virt.fe++;
      OV.combate.recalcular(); MS.ato('fortaleza');
      ui.banner('A aurora'); ui.toast('A aurora chega. Sua Fé se fortaleceu (+1).');
      MS.concluir('m4', 'vigilia'); abrirCripta(); if (OV.tempo) { OV.tempo.definir(5.6); ui.clarao('#ffd9a0'); }
      setTimeout(() => M.figuras.antao.mostrar(false), 2500);
      return;
    }
    vigilia.onda++; vigilia.espera = 2.5;
    ui.toast(`Vigília: ${['primeira', 'segunda', 'terceira'][vigilia.onda - 1]} leva`);
    for (let i = 0; i < 3 + vigilia.onda - 1; i++) {
      const a = i / (3 + vigilia.onda - 1) * Math.PI * 2 + Math.random();
      const e = I.spawn('diabrete', true, { x: M.SITIO.ermida.x - 4.5 + Math.cos(a) * 7, z: M.SITIO.ermida.z + 4.5 + Math.sin(a) * 7 }, { nivel: 3 + vigilia.onda }); e.tag = 'vigilia'; e.mundo = false;
    }
  }

  /* ================= O CHEFE E O FIM DO ATO ================= */
  let prova = false;
  function finalAbade(e) {
    D.abrir({ inicio: 'a', nos: {
      a: { quem: 'Abade Anselmo', txt: 'Eu... eu desisti de tudo. Rezar, trabalhar, esperar... O demônio ainda está agarrado em mim. Eu o sinto.', prox: 'b' },
      b: { quem: 'Anjo da Guarda', txt: 'Você pode libertá-lo de vez, mas o demônio vai lutar uma última vez, e isso vai custar toda a sua Fé. Ou pode selar a cripta com ele dentro e sair agora, em segurança.', opc: [
        { t: 'Libertar o Abade de vez (custa toda a sua Fé).', ef: () => { P.fe = 0; }, ir: 'c' },
        { t: 'Selar a cripta com ele dentro.', ef: () => { F().abade_selado = true; }, ir: 'd' }] },
      c: { quem: 'Abade Anselmo', txt: 'Não desista de mim...', depois: () => {
        prova = true; ui.toast('Resista! O demônio luta pela última vez.'); OV.jogo.shake(0.4);
        for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const s = I.spawn('diabrete', true, { x: CR.X + Math.cos(a) * 8, z: (CR.CZ || -38) + Math.sin(a) * 8 }); s.tag = 'prova'; }
      } },
      d: { quem: 'Abade Anselmo', txt: 'Então... me deixe aqui. Talvez eu mereça.', depois: () => { e.sumir = true; resolverChefe(); } }
    } });
  }
  function resolverChefe() {
    F().chefe_resolvido = true; CR.fecharPortao(false);
    const X = CR.X, cz = CR.CZ || -38;
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const asas = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.2), mat); m.position.set(X + s * 3.6, -2, cz); m.rotation.z = s * 0.35; return m; });
    OV.combate.efeito(asas, 3.2, p => { mat.opacity = p < 0.3 ? p / 0.3 * 0.8 : 0.8 * (1 - (p - 0.3) / 0.7); asas.forEach((m, i) => { m.position.y = -2 + p * 3; m.rotation.z = (i ? 1 : -1) * (0.35 - p * 0.5); }); });
    M.burstLight.position.set(X, -1, cz); M.burstLight.intensity = 8; A.bell(392, 0.3); setTimeout(() => A.bell(523, 0.25), 300);
    ui.toast('Asas de luz descem sobre a câmara: São Miguel sela o abismo.');
    MS.ato('fortaleza');
    MS.avancar('m5', 3);
    setTimeout(() => D.falas([['Anjo da Guarda', F().abade_livre ? 'O Abade está livre. Ele subirá para a Missa. Vá também: a igreja abacial espera por você.' : 'Está feito. A cripta está selada. Suba e vá à igreja abacial: o vale espera pela Missa.']]), 2600);
    J().salvar();
  }
  /* v24: a Missa de cada ato acontece DENTRO da igreja: o peregrino entra e fica num banco do meio, o sacerdote vai
     ao altar, e a câmera mostra a nave, de costas para a porta. */
  MS.missaDentro = function (nomeIgreja, padreId, linhas, fim) {
    const ig = (M.interiores || []).find(c => c.nome === nomeIgreja);
    if (!ig) { D.falas(linhas, fim); return; }
    const vira = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
    const altar = ig.W(0, -ig.hd + 1.6), banco = ig.W(-1.0, Math.min(ig.hd * 0.3, ig.hd - 2.2));
    OV.combate.posicionar(banco.x, banco.z, vira(banco, altar)); if (OV.cam) OV.cam.yaw = P.facing + Math.PI; J().mudouLugar();
    const p = padreId && M.figuras[padreId];
    if (p) { p.destino = null; p.mostrar(true); const q = ig.W(0, -ig.hd + 2.9); p.mover(q.x, q.z, vira(q, banco)); }
    const meio = ig.W(0, -ig.hd * 0.3), y = M.altura(ig.x, ig.z) + 1.6;
    const cam = { alvo: new THREE.Vector3(meio.x, y, meio.z), raio: Math.max(2.6, Math.min(ig.hd * 0.9, ig.hd - 1.2)), altura: 1.8, olhar: 0.5, giro: 0.02, ang0: ig.rot + 0.18 };
    if (OV.cenas && OV.cenas.contar) OV.cenas.contar(linhas, cam, fim); else D.falas(linhas, fim);
  };
  // v24: quem entra na igreja na hora da Missa não precisa achar a porta de novo: a Missa começa lá dentro
  MS.missas = [];
  MS.ganchos.update.push(() => {
    if (!MS.missas.length || D.aberto || P.dead || !J() || !J().ativo || !J().ativo() || !M.interiorDe) return;
    const c = M.interiorDe(P.pos.x, P.pos.z); if (!c || !c.nome) return;
    for (const m of MS.missas) if (m.nome === c.nome && !m.rodando && m.pronta()) { m.rodando = true; setTimeout(() => { m.rodando = false; }, 5000); m.iniciar(); return; }
  });
  MS.missas.push({ nome: 'Igreja abacial', pronta: () => MS.ativa('m5') && MS.etapa('m5') === 3, iniciar: () => missa() });
  function missa() {
    const f = F();
    const linhas = [
      ['', 'Os sinos de Santa Sabina chamam o vale inteiro. Pela primeira vez em semanas, a igreja abacial se enche de gente.'],
      ['Padre Tomé', 'Irmãos, este altar ficou frio por muito tempo. Hoje voltamos a oferecer o Sacrifício, e a luz volta a esta casa.']
    ];
    if (f.abade_livre) linhas.push(['Abade Anselmo', 'Eu desisti, e Deus não desistiu de mim. Que esta lâmpada nunca mais se apague.']);
    else linhas.push(['Padre Tomé', 'Rezemos também pelo Abade Anselmo, que ficou nas trevas. A misericórdia de Deus é maior que qualquer porta selada.']);
    if (f.afonso_livre) linhas.push(['Irmão Afonso', 'Eu estava perdido na ira, e hoje canto as matinas de novo.']);
    linhas.push(['', 'No momento da consagração, a Lâmpada da Diligência volta a arder sobre o altar. O silêncio do vale termina.']);
    ui.clarao('#000000');
    MS.missaDentro('Igreja abacial', 'tome', linhas, () => {
      f.ato1_fim = true; MS.concluir('m5', f.abade_livre ? 'libertado' : 'selado');
      M.lampada(true); M.figuras.abade.mostrar(!!f.abade_livre);
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([262, 330, 392, 330, 262][i], 0.3), t));
      setTimeout(() => { J().pausar(true); ui.fimAto(resumo()); if (MS.aposAto1) MS.aposAto1(); }, 2600);
    });
  }
  function resumo() {
    const f = F(), r = [];
    r.push(f.abade_livre ? 'Você libertou o Abade Anselmo, mesmo custando toda a sua Fé.' : 'Você selou o Abade Anselmo na cripta.');
    r.push(f.afonso_livre ? 'O Irmão Afonso foi libertado e voltou a rezar.' : 'O Irmão Afonso ficou para trás, no claustro.');
    if (res('s1')) r.push(res('s1') === 'curado' ? 'Bartolomeu voltou a moer com alegria.' : 'Bartolomeu voltou a moer, convencido pela razão.');
    if (res('s2')) r.push({ justica: 'Joaquim respondeu pelo que fez, trabalhando na igreja.', caridade: 'Você pagou a dívida de Joaquim.', ambos: 'Joaquim devolveu o que pegou e trabalha no moinho.' }[res('s2')]);
    if (res('s3')) r.push(f.lobo_companheiro ? 'O Lobo do Vale caminha com você.' : res('s3') === 'paz' ? 'O lobo deixou o vale em paz.' : 'O lobo foi caçado.');
    if (res('s4')) r.push(res('s4') === 'devolvida' ? 'A relíquia de Santa Sabina voltou ao claustro.' : 'Você ficou com a relíquia de Santa Sabina.');
    if (MS.feita('s5')) r.push('A forja de Lia voltou a arder.');
    if (MS.feita('s6')) r.push('O Velho Matias se reconciliou com Deus.');
    if (MS.feita('m4')) r.push(res('m4') === 'vigilia' ? 'Você velou com Santo Antão até a aurora.' : 'Você desceu da ermida sem a vigília.');
    return r;
  }

  /* ================= DIÁLOGOS DOS PERSONAGENS ================= */
  const ARV = {};
  ARV.tome = () => {
    const f = F();
    if (MS.ativa('s6') && MS.etapa('s6') === 0 && f.tome_capela) return { inicio: 'a', nos: {
      a: { quem: 'Padre Tomé', txt: 'Matias pediu por mim? Então não há tempo a perder. Vamos!', ef: () => { f.tome_capela = false; MS.avancar('s6', 1); },
        depois: () => { ui.clarao('#000000'); aplicarMundo(); const fm = M.figuras.matias; OV.combate.posicionar(fm.x + Math.sin(fm.rot) * 1.8, fm.z + Math.cos(fm.rot) * 1.8, fm.rot + Math.PI); J().mudouLugar(); ui.toast('Vocês atravessam a floresta e chegam juntos à casa de Matias.'); } } } };
    if (MS.etapa('m1') === 0 && !MS.feita('m1')) return { inicio: 'a', nos: {
      a: { quem: 'Padre Tomé', txt: () => `${g('Peregrino', 'Peregrina')}! Ou devo dizer ${titulo().toLowerCase()}? Graças a Deus. Faz semanas que este vale está em silêncio.`, prox: 'b' },
      b: { quem: 'Padre Tomé', txt: 'Primeiro calaram-se os sinos do mosteiro. Depois os monges sumiram, um a um. O Abade Anselmo foi o último a ser visto.', opc: [
        { t: 'O que aconteceu com o povo?', ir: 'c' }, { t: 'Onde está o Abade?', ir: 'd' }, { t: 'Diga-me o que fazer.', ir: 'e' }] },
      c: { quem: 'Padre Tomé', txt: 'Perderam a vontade de tudo. Ninguém planta, ninguém mói, ninguém reza. Os antigos chamavam isso de acídia, o demônio do meio-dia.', opc: [{ t: 'Onde está o Abade?', ir: 'd' }, { t: 'Diga-me o que fazer.', ir: 'e' }] },
      d: { quem: 'Padre Tomé', txt: 'Ninguém sabe. Os aldeões dizem que ouvem gemidos vindos do claustro à noite.', opc: [{ t: 'O que aconteceu com o povo?', ir: 'c' }, { t: 'Diga-me o que fazer.', ir: 'e' }] },
      e: { quem: 'Padre Tomé', txt: () => `Acenda a vela do Oratório aqui na praça: a luz de um Oratório guarda quem reza. Depois vá à portaria do mosteiro, na estrada de pedras ao norte: o Irmão Porteiro mandou pedir socorro. Que Santa Sabina acompanhe você, ${g('filho', 'filha')}.`,
        ef: () => { MS.avancar('m1', 1); if (prog().oratorios.vila) { MS.concluir('m1'); if (MS.irParaPortaria) MS.irParaPortaria(); else MS.iniciar('m2'); } } }
    } };
    if (MS.ativa('m1')) return linha('Padre Tomé', 'Acenda a vela do Oratório da praça, e depois vá à portaria do mosteiro, na estrada de pedras.');
    if (MS.ativa('m2')) return linha('Padre Tomé', 'O mosteiro fica ao norte, depois da estrada de pedras. Cuidado com o que ronda o claustro.');
    if (MS.ativa('m3') && !f.tome_m3) return { inicio: 'a', nos: {
      a: { quem: 'Padre Tomé', txt: 'Você libertou o claustro! Mas os sinos continuam mudos: alguém arrancou os três badalos.', prox: 'b' },
      b: { quem: 'Padre Tomé', txt: 'Um monge me contou, antes de sumir, que viu um deles no dormitório. O moleiro diz que algo emperrou a roda dele. E nas ruínas da floresta há sempre diabretes rondando.', opc: [
        { t: 'Há mais alguma coisa?', ir: 'c' }, { t: 'Vou encontrá-los.', ef: () => { f.tome_m3 = true; } }] },
      c: { quem: 'Padre Tomé', txt: 'Há. Os possessos roubaram a relíquia de Santa Sabina do mosteiro e acamparam a sudeste da vila. Se puder, traga-a de volta.', ef: () => { f.tome_m3 = true; MS.iniciar('s4'); } }
    } };
    if (MS.ativa('m3')) return linha('Padre Tomé', 'Os badalos: o dormitório, a roda do moinho e as ruínas da floresta.');
    if (MS.ativa('m4')) return linha('Padre Tomé', 'Os sinos! Ouviu? O povo está saindo das casas. Ontem sonhei com um eremita no alto do rochedo, além do rio. Vá até lá. Talvez Deus tenha algo a lhe dizer.');
    if (MS.ativa('m5') && MS.etapa('m5') < 3) return linha('Padre Tomé', 'O portão da cripta se abriu? Então o Abade está lá embaixo. Vá, e que São Miguel vá à sua frente.');
    if (MS.ativa('m5')) return linha('Padre Tomé', 'A Missa está pronta. Venha à igreja abacial, pela porta do lado leste.');
    if (f.ato1_fim) return linha('Padre Tomé', 'Este vale voltou a respirar. Mas ouvi dizer que em outras terras o silêncio também chegou, e que no porto do Festim ninguém para de comer.');
    return linha('Padre Tomé', 'Que Deus abençoe seus passos.');
  };
  ARV.marta = () => {
    const r = res('s2');
    const t = r === 'justica' ? 'Levaram o meu filho para trabalhar na igreja. Dói, mas talvez seja o certo.'
      : r === 'caridade' ? 'Você pagou o que o meu filho devia? Deus lhe pague em dobro.'
        : r === 'ambos' ? 'Joaquim agora trabalha no moinho. Volta à noite cansado, mas com pão nas mãos.'
          : F().sinos ? 'Os sinos tocaram... Hoje acendi o fogo. Mas o meu Joaquim continua sumindo à noite.'
            : 'O meu Joaquim saiu cedo outra vez... Faz dias que não tenho vontade nem de acender o fogo.';
    return linha('Viúva Marta', t);
  };
  ARV.matias = () => {
    if (MS.feita('s6')) return linha('Velho Matias', () => `Estou em paz, ${g('peregrino', 'peregrina')}. Que Deus lhe pague.`);
    if (MS.ativa('s6') && MS.etapa('s6') === 1) return { inicio: 'a', nos: {
      a: { quem: '', txt: 'Padre Tomé entra na casa e fica a sós com Matias. Quando a porta se abre, há paz no rosto do velho.', prox: 'b' },
      b: { quem: 'Velho Matias', txt: 'Agora posso ouvir o sino tranquilo. Minha filha deixou isto para você. Não é muito, mas é de coração.', ef: () => { denarios(20); MS.ato('caridade'); MS.concluir('s6'); } }
    } };
    if (MS.ativa('s6')) return linha('Velho Matias', 'Por favor, traga o padre... Ele está na Capela de São Roque, na floresta.');
    return { inicio: 'a', nos: {
      a: { quem: 'Velho Matias', txt: 'Estou velho e cansado. Queria me confessar antes de partir, mas Padre Tomé foi rezar na Capela de São Roque, lá na floresta, e não volta.', opc: [
        { t: 'Eu vou buscá-lo.', ef: () => { MS.iniciar('s6'); F().tome_capela = true; aplicarMundo(); }, ir: 'b' },
        { t: 'Agora não posso, Matias.' }] },
      b: { quem: 'Velho Matias', txt: 'Deus lhe pague. Mas não demore...' }
    } };
  };
  ARV.lia = () => {
    if (MS.feita('s5')) return linha('Lia, a ferreira', 'A forja está acesa. Sua arma vai cortar fundo.');
    if (MS.ativa('s5') && F().carvao) return { inicio: 'a', nos: {
      a: { quem: 'Lia, a ferreira', txt: 'Carvão! Agora sim. Deixe-me afiar sua arma enquanto o fogo pega.', ef: () => { F().arma_afiada = true; OV.combate.recalcular(); }, prox: 'b' },
      b: { quem: 'Lia, a ferreira', txt: 'Que estranho... misturadas ao carvão havia moedas cunhadas com um rosto de olhos de ouro. Dizem que vêm das Minas de Mamom, além das montanhas.', ef: () => { MS.concluir('s5'); ui.toast('Sua arma foi afiada: +3 de dano.'); } }
    } };
    if (MS.ativa('s5')) return linha('Lia, a ferreira', 'A Mina Velha fica nas colinas ao sul, a oeste da estrada por onde você chegou. As larvas tomaram a entrada.');
    return { inicio: 'a', nos: {
      a: { quem: 'Lia, a ferreira', txt: 'A forja está fria. Sem carvão da mina velha, não há o que bater.', opc: [
        { t: 'Eu busco o carvão para você.', ef: () => MS.iniciar('s5'), ir: 'b' }, { t: 'Onde fica a mina?', ir: 'c' }, { t: 'Até mais, Lia.' }] },
      b: { quem: 'Lia, a ferreira', txt: 'Sério? Então traga um saco cheio, e eu deixo sua arma afiada como nunca.' },
      c: { quem: 'Lia, a ferreira', txt: 'Nas colinas ao sul, a oeste da estrada por onde você chegou. Mas as Larvas do Tédio tomaram a entrada.', opc: [{ t: 'Eu busco o carvão.', ef: () => MS.iniciar('s5'), ir: 'b' }, { t: 'Até mais, Lia.' }] }
    } };
  };
  ARV.aldea = () => linha('Aldeã', F().sinos ? 'Ouviu os sinos? Meu marido voltou a cuidar da horta. Dizem que foi alguém de fora que trouxe os badalos.' : 'Dizem que no alto do vale vivia um eremita, depois do rio. Ninguém sobe lá há anos.');
  ARV.aldeao = () => {
    if (MS.ativa('s3') && MS.etapa('s3') === 1) return { inicio: 'a', nos: {
      a: { quem: 'Aldeão, o pastor', txt: () => res('s3') === 'cacado' || F().lobo_morto ? 'Morto? Bem... As ovelhas estão a salvo. Tome, é pouco, mas é seu.' : 'Ele não volta mais? Nem acredito... Tome, é pouco, mas é seu.', ef: () => { denarios(10); MS.concluir('s3', F().lobo_morto ? 'cacado' : 'paz'); } }
    } };
    if (MS.ativa('s3')) return linha('Aldeão, o pastor', 'O covil fica a oeste, depois das árvores da floresta.');
    if (MS.feita('s3')) return linha('Aldeão, o pastor', F().sinos ? 'Voltei a levar as ovelhas ao pasto. Trabalhar faz bem, quem diria.' : 'As ovelhas estão quietas. Talvez amanhã eu as leve ao pasto.');
    return { inicio: 'a', nos: {
      a: { quem: 'Aldeão, o pastor', txt: 'Trabalhar hoje? Hoje não. E pra quê? Um lobo vem toda noite e leva as ovelhas que sobram. Mora num covil a oeste da floresta.', opc: [
        { t: 'Eu vou até o covil.', ef: () => { MS.iniciar('s3'); spawnQuest(); } }, { t: 'Boa sorte com as ovelhas.' }] }
    } };
  };
  ARV.joaquim = () => {
    const r = res('s2');
    if (r === 'justica') return linha('Joaquim', 'O Padre Tomé me pôs para varrer a igreja. É chato, mas ele divide o pão comigo.');
    if (r === 'caridade') return linha('Joaquim', 'Não roubei mais nada. Prometi, lembra?');
    if (r === 'ambos') return linha('Joaquim', 'O Bartolomeu me ensinou a ajustar a mó. Esse pão eu ganhei!');
    return { inicio: 'a', nos: {
      a: { quem: 'Joaquim', txt: 'Tenho fome... mas não conte a ninguém o que eu faço para comer.', opc: [{ t: 'O que você anda fazendo?', ir: 'b' }, { t: 'Fique em paz, Joaquim.' }] },
      b: { quem: 'Joaquim', txt: 'À noite eu entro no celeiro do mosteiro e pego pão. Os monges sumiram, ninguém vê. Minha mãe nem sabe.', ef: () => MS.iniciar('s2'), opc: [
        { t: 'Isso é roubo. Vamos ao Padre Tomé, e você vai responder pelo que fez.', ef: () => { MS.ato('justica'); MS.concluir('s2', 'justica'); }, ir: 'c1' },
        { t: 'Tome. Isto paga o pão que você pegou. (15 denários)', cond: () => (P.pers.denarios || 0) >= 15, motivo: 'você precisa de 15 denários', ef: () => { denarios(-15); MS.ato('caridade'); MS.concluir('s2', 'caridade'); }, ir: 'c2' },
        { t: 'Bartolomeu precisa de braços no moinho. Devolva o que pegou e ganhe o pão trabalhando.', cond: () => !!(F().bart_curado || F().bart_convencido), motivo: 'o moinho ainda está parado', ef: () => { MS.ato('justica'); MS.ato('caridade'); MS.concluir('s2', 'ambos'); }, ir: 'c3' },
        { t: 'Vou pensar no que fazer.' }] },
      c1: { quem: 'Joaquim', txt: '...Tá bom. Eu vou. Mas não conte para a minha mãe, por favor.', depois: () => aplicarMundo() },
      c2: { quem: 'Joaquim', txt: 'Você... pagou por mim? Prometo que não faço mais.' },
      c3: { quem: 'Joaquim', txt: 'Trabalhar no moinho? ...Eu topo. Pelo menos o pão vai ser meu de verdade.', depois: () => aplicarMundo() }
    } };
  };
  ARV.bartolomeu = () => {
    const f = F();
    if (MS.feita('s1')) return linha('Bartolomeu, o moleiro', res('s2') === 'ambos' ? 'O rapaz Joaquim trabalha bem. A roda canta, e o vale tem farinha.' : res('s1') === 'curado' ? 'A roda canta de novo! Volte quando quiser pão fresco.' : 'Trabalho, mas sem muita alegria. Ao menos a vila terá farinha.');
    if (f.roda_solta) return { inicio: 'a', nos: {
      a: { quem: 'Bartolomeu, o moleiro', txt: () => `A roda está girando! Fazia tempo que eu não sentia vontade de trabalhar. Obrigado, ${g('irmão', 'irmã')}.`, ef: () => { f.bart_curado = true; MS.iniciar('s1'); MS.ato('caridade'); MS.concluir('s1', 'curado'); } }
    } };
    if (MS.ativa('s1') && MS.etapa('s1') === 1) return linha('Bartolomeu, o moleiro', 'A trava fica junto da roda, do lado do rio. Puxe com força.');
    return { inicio: 'a', nos: {
      a: { quem: 'Bartolomeu, o moleiro', txt: 'Pra que moer, se ninguém mais faz pão? A roda parou, e eu parei junto com ela.', opc: [
        { t: 'Se você não moer, a vila passa fome. O pão começa na sua roda.', cond: () => P.pers.virt.prudencia >= 5, motivo: 'Prudência 5', ef: () => { f.bart_convencido = true; MS.iniciar('s1'); MS.soltarRoda(); pegarBadalo('moinho', 'Bartolomeu solta a trava e lhe entrega um badalo de sino que estava preso nela.'); MS.ato('prudencia'); MS.concluir('s1', 'convencido'); }, ir: 'b1' },
        { t: 'Vamos consertar a roda juntos.', ef: () => { MS.iniciar('s1'); MS.avancar('s1', 1); }, ir: 'b2' },
        { t: 'Descanse, Bartolomeu.' }] },
      b1: { quem: 'Bartolomeu, o moleiro', txt: 'Talvez você tenha razão... Olhe só: havia um badalo preso na trava! Leve, deve ser do mosteiro.' },
      b2: { quem: 'Bartolomeu, o moleiro', txt: 'Juntos? Ninguém me ajuda faz tempo... A trava fica junto da roda, do lado do rio. Puxe com força.' }
    } };
  };
  ARV.afonso = () => {
    if (!F().rosario) return { inicio: 'a', nos: { a: { quem: 'Irmão Afonso', txt: () => `Você me tirou das trevas, ${g('irmão', 'irmã')}. Leve este rosário: ele tornará suas orações mais leves.`, ef: () => { F().rosario = true; ui.toast('Rosário do Irmão Afonso: as orações custam 5 de Fé a menos.'); J().salvar(); } } } };
    return linha('Irmão Afonso', 'Rezo por você a cada hora do ofício.');
  };
  ARV.abade = () => linha('Abade Anselmo', 'Eu desisti de tudo, e o demônio ocupou o lugar da minha esperança. Obrigado por não desistir de mim.');
  ARV.antao = () => linha('Santo Antão', 'Vigie e reze.');
  const linha = (quem, txt) => ({ inicio: 'a', nos: { a: { quem, txt } } });
  Object.assign(MS, { ARV, linha, st, res, F, g, titulo, denarios, pegarBadalo, NOME_V });
  MS.falar = function (id) {
    const f = ARV[id]; if (!f) return false;
    if (OV.itens && OV.itens.SACERDOTES[id] && OV.itens.conversaSacerdote(id, () => D.abrir(f()))) return true;
    D.abrir(f()); return true;
  };

  /* ================= EVENTOS ================= */
  MS.evento = function (tipo, x) {
    const f = F();
    for (const fn of MS.ganchos.evento) if (fn(tipo, x)) return;
    if (tipo === 'inicio') {
      if (!f.anjo_intro) { f.anjo_intro = true; setTimeout(() => D.falas([
        ['Anjo da Guarda', 'Não tenha medo. Eu sou o anjo que Deus colocou ao seu lado desde o seu batismo.'],
        ['Anjo da Guarda', 'Você traz uma carta para o Abade Anselmo. Mas sinto algo errado neste vale: um silêncio pesado, como de quem desistiu de tudo.'],
        ['Anjo da Guarda', 'Siga a estrada até a Vila de São Roque e procure o Padre Tomé, na igreja. Ele saberá onde está o Abade.'],
        ['Anjo da Guarda', 'Quando quiser rever suas missões, abra o Diário com a tecla L.']
      ]), 1800); }
    }
    else if (tipo === 'oratorio') {
      if (x === 'vila' && MS.ativa('m1') && MS.etapa('m1') === 1) { MS.concluir('m1'); setTimeout(() => { if (MS.irParaPortaria) MS.irParaPortaria(); else MS.iniciar('m2'); }, 1500); }
    }
    else if (tipo === 'zona') {
      if (x === 'claustro' && MS.ativa('m2') && MS.etapa('m2') === 0) {
        MS.avancar('m2', 1);
        const anjo = () => D.falas([['Anjo da Guarda', 'Sinto a Ira e a Preguiça aqui... e um irmão que sofre. Os possessos não são inimigos: vença-os sem tirar a vida, e eles serão libertados.']]);
        const ira = I.lista.find(e => e.def.key === 'ira' && e.state !== 'dead'), preg = I.lista.find(e => e.def.key === 'preguica' && e.state !== 'dead');
        if (OV.cenas && ira && preg) OV.cenas.poema('ira', { e: ira }, () => OV.cenas.poema('preguica', { e: preg }, anjo)); else anjo();
      }
    }
    else if (tipo === 'soberba') { ui.toast('O claustro está livre dos vícios.'); verificarM2(); }
    else if (tipo === 'vencido') {
      if (x.tag === 'lobo') { F().lobo_morto = true; MS.avancar('s3', 1); }
      if (x.tag === 'prova' && prova && !I.porTag('prova').some(e => e.state !== 'dead' && !e.removed)) {
        prova = false; F().abade_livre = true; MS.ato('caridade');
        const ab = I.porTag('abade')[0]; if (ab) ab.sumir = true;
        resolverChefe();
      }
    }
    else if (tipo === 'liberto') {
      if (x.tag === 'afonso') abrirAfonso(x);
      else if (x.tag === 'abade') finalAbade(x);
      else { x.sumir = true; ui.toast('O possesso foi libertado e foge para a vila.'); }
    }
    else if (tipo === 'renascer') {
      if (vigilia.ativa) { vigilia.ativa = false; MS.avancar('m4', 0); st('m4').e = 0; ui.toast('A vigília foi interrompida. Volte à cruz quando estiver pronto.'); }
      prova = false;
      if (!F().chefe_resolvido) { CR.resetarChefe(); if (MS.ativa('m5') && MS.etapa('m5') === 2) st('m5').e = 1; }
      I.porTag('vigilia').forEach(e => { if (!e.removed) { M.scene.remove(e.g); e.lab.el.remove(); e.removed = true; } });
      I.lista = I.lista.filter(e => e.tag !== 'vigilia');
      M.figuras.antao.mostrar(false);
      spawnQuest();
    }
  };
  function verificarM2() {
    const f = F();
    if (MS.ativa('m2') && prog().soberba && (f.afonso_livre || f.afonso_deixado)) { MS.concluir('m2'); setTimeout(() => MS.iniciar('m3'), 1500); }
  }
  let afonsoInter = null;
  function abrirAfonso(e) {
    const decidir = () => D.abrir({ inicio: 'a', nos: {
      a: { quem: 'Irmão Afonso', txt: 'Onde... onde estou? Eu sentia uma raiva que não era minha... Ajude-me, por caridade.', opc: [
        { t: 'Rezar com ele até que se liberte de vez (custa 30 de Fé).', cond: () => P.fe >= 30, motivo: 'Fé insuficiente: faça o Recolhimento e volte', ef: () => { P.fe -= 30; F().afonso_livre = true; MS.ato('caridade'); }, ir: 'b1' },
        { t: 'Descanse aqui. Não posso fazer mais nada agora.', ef: () => { F().afonso_deixado = true; }, ir: 'b2' },
        { t: 'Espere um pouco. Preciso recuperar minhas forças.' }] },
      b1: { quem: 'Irmão Afonso', txt: 'Sinto paz... Vou para a vila ajudar o Padre Tomé. Que Deus lhe pague.', depois: fim },
      b2: { quem: 'Irmão Afonso', txt: '...Tudo bem. Vou ficar aqui, sozinho.', depois: fim }
    } });
    function fim() { e.sumir = true; if (afonsoInter) { M.removerInterativo(afonsoInter); afonsoInter = null; } aplicarMundo(); verificarM2(); J().salvar(); }
    if (afonsoInter) M.removerInterativo(afonsoInter);
    afonsoInter = M.interativo(e.g.position.x, e.g.position.z + 1.2, 2.4, () => (F().afonso_livre || F().afonso_deixado) ? null : 'Falar com o Irmão Afonso', decidir);
    decidir();
  }

  /* ---- o lobo: conversa pacífica ---- */
  let loboInter = null;
  function atualizarLobo() {
    const lobo = I.porTag('lobo').find(e => e.state !== 'dead' && !e.removed);
    if (!lobo) { if (loboInter) { M.removerInterativo(loboInter); loboInter = null; } return; }
    if (!loboInter) loboInter = M.interativo(0, 0, 3.2, () => (lobo.state === 'idle' || lobo.state === 'stun') && !lobo.provocado ? 'Aproximar-se do lobo' : null, () => falarLobo(lobo));
    loboInter.x = lobo.g.position.x; loboInter.z = lobo.g.position.z;
  }
  function falarLobo(lobo) {
    const remover = () => { lobo.removed = true; M.scene.remove(lobo.g); lobo.lab.el.remove(); I.lista = I.lista.filter(e => e !== lobo); };
    if (P.pers.ordem === 'franciscano') D.abrir({ inicio: 'a', nos: {
      a: { quem: 'Lobo do Vale', txt: 'O lobo para. Os olhos amarelos fitam você, e ele não rosna.', opc: [
        { t: 'Irmão lobo, venha cá. Em nome de Cristo, não faça mal a ninguém, nem às ovelhas, nem aos homens.', ef: () => { F().lobo_companheiro = true; MS.ato('caridade'); MS.avancar('s3', 1); }, ir: 'b' },
        { t: 'Afastar-se.' }] },
      b: { quem: 'Lobo do Vale', txt: 'O lobo baixa a cabeça e põe a pata na sua mão. Daqui em diante, ele caminha com você.', depois: () => { remover(); H.chamarLobo(true); J().salvar(); } }
    } });
    else D.abrir({ inicio: 'a', nos: {
      a: { quem: 'Lobo do Vale', txt: 'O lobo rosna baixo, mas ainda não ataca.', opc: [
        { t: 'Oferecer pão e falar com mansidão.', cond: () => P.pers.virt.caridade >= 6, motivo: 'Caridade 6', ef: () => { MS.ato('caridade'); MS.avancar('s3', 1); }, ir: 'b' },
        { t: 'Afastar-se devagar.' }] },
      b: { quem: 'Lobo do Vale', txt: 'O lobo cheira a sua mão... e some entre as árvores, para longe do vale.', depois: () => { remover(); J().salvar(); } }
    } });
  }

  /* ================= POR QUADRO ================= */
  MS.update = function (dt) {
    atualizarVigilia(dt); atualizarLobo();
    MS.ganchos.update.forEach(fn => fn(dt));
    if (P.pos.x > 200) {
      CR.update(dt);
      if (P.pos.z < -24.5 && !CR.iniciado && !F().chefe_resolvido && !P.dead && !D.aberto && MS.ativa('m5') && (MS.etapa('m5') === 1 || MS.etapa('m5') === 2)) {
        if (MS.etapa('m5') === 1) MS.avancar('m5', 2); CR.iniciado = true;
        if (MS.memChefe.tem('meiodia') || MS.memChefe.tem('abade')) { CR.iniciado = false; CR.iniciarChefe(); return; }
        const anjo = () => D.falas([['Anjo da Guarda', 'É ele: o demônio do meio-dia. Não pare, não desista. Quando precisar rezar, faça-o dentro da luz.']], () => { CR.iniciado = false; CR.iniciarChefe(); });
        if (OV.cenas) OV.cenas.poema('meiodia', { pos: { x: 300, z: (CR.CZ || -38) - 6 }, raio: 7.5, altura: 2.2 }, anjo); else anjo();
      }
    } else CR.update(dt);
  };

  /* ================= RASTREADOR E DIÁRIO ================= */
  const textoEtapa = id => { const e = MIS[id].etapas[MS.etapa(id)]; return typeof e === 'function' ? e() : e; };
  MS.rastreador = function () {
    const p = prog(); if (!p || !p.missoes) return [];
    const aqui = M.atoDaRegiao(M.regiao(P.pos.x, P.pos.z));
    const ordem = Object.keys(MIS).sort((a, b) => ((MIS[a].ato || 1) === aqui ? 0 : 1) - ((MIS[b].ato || 1) === aqui ? 0 : 1));
    const out = [];
    const principal = ordem.find(id => MIS[id].tipo === 'p' && MS.ativa(id));
    if (principal) out.push({ p: true, nome: MIS[principal].nome, txt: textoEtapa(principal) });
    ordem.filter(id => MIS[id].tipo === 's' && MS.ativa(id)).slice(0, 2).forEach(id => out.push({ p: false, nome: MIS[id].nome, txt: textoEtapa(id) }));
    return out;
  };
  MS.consigo = () => MS.diario(true);
  MS.diario = function (soConsigo) {
    const esc = ui.esc, p = prog();
    const ids = Object.keys(MIS).sort((a, b) => (MIS[b].ato || 1) - (MIS[a].ato || 1));
    const bloco = tipo => ids.filter(id => MIS[id].tipo === (tipo === 'm' ? 'p' : 's') && st(id)).map(id => {
      const m = MIS[id], s = st(id);
      return `<li class="${s.fim ? 'feita' : ''}"><b>${s.fim ? '✓ ' : ''}${esc(m.nome)}</b>${s.fim ? '' : `<span>${esc(textoEtapa(id))}</span>`}</li>`;
    }).join('') || '<li class="vazio">Nenhuma ainda.</li>';
    const inv = [];
    const nb = (p.inv.badalos || []).length; if (nb && !F().sinos) inv.push(`Badalos de sino (${nb}/3)`);
    if (F().reliquia_obtida && !F().reliquia_devolvida) inv.push('Relíquia de Santa Sabina');
    if (F().reliquia_guardada) inv.push('Relíquia de Santa Sabina (renova a Fé)');
    if (F().carvao && !MS.feita('s5')) inv.push('Saco de carvão');
    if (F().rosario) inv.push('Rosário do Irmão Afonso (orações custam 5 a menos)');
    if (F().arma_afiada) inv.push('Arma afiada por Lia (+3 de dano)');
    if (F().graca_antao) inv.push('Graça de Antão (dentro da luz, a oração protege)');
    MS.ganchos.inventario.forEach(fn => fn(inv));
    const hab = P.pers.habitos || {};
    const habs = Object.keys(NOME_V).filter(k => hab[k]).map(k => `${NOME_V[k]} ${hab[k]}/3`).join(' · ') || 'Nenhum ato registrado ainda.';
    if (soConsigo) return `<p class="sub">${esc(P.pers.nome)} · ${P.pers.denarios || 0} denários</p>
      <h3>Consigo</h3><ul class="mis">${inv.map(i => `<li>${esc(i)}</li>`).join('') || '<li class="vazio">Nada por enquanto.</li>'}</ul>
      <h3>Hábitos</h3><p class="habt">${esc(habs)}</p><p class="habt nota">Três atos da mesma virtude a fortalecem em +1.</p>`;
    return `<h2>Diário</h2>
      <p class="sub">${esc(P.pers.nome)} · ${P.pers.denarios || 0} denários</p>
      <h3>Missões principais</h3><ul class="mis">${bloco('m')}</ul>
      <h3>Missões secundárias</h3><ul class="mis">${bloco('s')}</ul>
      <h3>Consigo</h3><ul class="mis">${inv.map(i => `<li>${esc(i)}</li>`).join('') || '<li class="vazio">Nada por enquanto.</li>'}</ul>
      <h3>Hábitos</h3><p class="habt">${esc(habs)}</p><p class="foot">Três atos da mesma virtude a fortalecem em +1. Pressione L para fechar.</p>`;
  };
})(window.OV);

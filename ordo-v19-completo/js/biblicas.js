/* Ordo Virtutum — histórias do Evangelho e coisas para ir e voltar:
   · os encostos do meio-dia nos telhados da vila (vencer, e depois abençoar a casa com água benta);
   · o Poço da Samaritana, no Festim, com a Serpente da Sede lá no fundo;
   · o Filho Pródigo, entre os porcos, e o pai que espera na Estalagem do vale;
   · o barco de Mestre Pedro: o vale pelo rio, e a Rocha do Prudente, onde mora o homem que construiu sobre a rocha;
   · a picareta de Santa Bárbara (Ato III) abre uma gruta fechada no vale (Ato I);
   · a vara de pesca (Ato IV), a lagoa da floresta e o peixe-isca dourado (para um dia atrair o Leviatã);
   · montarias e animais: jumentinho, cavalo, cachorro e pintassilgo. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes, AV = OV.aventura, IT = OV.itens, I = OV.inimigos; if (!M || M.falhou || !MS || !AV || !IT) return;
  const P = OV.P, ui = OV.ui, A = OV.audio, D = OV.dialogo, T = OV.tempo, OF = OV.oficio, AJ = OV.ajustes;
  const C = () => OV.combate;
  const mesh = OV.mesh, sm = OV.sm, H = (x, z) => M.altura(x, z), scene = M.scene;
  const BI = {}; OV.biblicas = BI;
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const st = id => prog() && prog().missoes && prog().missoes[id];
  const g = (m, f) => (P.pers && P.pers.sexo === 'f') ? f : m;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const linha = (quem, txt) => ({ inicio: 'a', nos: { a: { quem, txt } } });
  const fundir = gr => { if (OV.cenario) OV.cenario.fundir(gr); };
  const regiao = () => P.pos ? M.regiao(P.pos.x, P.pos.z) : 'vale';
  const den = () => (P.pers && P.pers.denarios) || 0;

  /* ---- os itens novos ---- */
  Object.assign(OV.ITENS, {
    picareta: { nome: 'Picareta de Santa Bárbara', tipo: 'ferramenta', descr: 'Uma picareta de mineiro, benzida na capela de Santa Bárbara. Quebra pedras que nenhuma mão tira do lugar.' },
    vara: { nome: 'Vara de pesca', tipo: 'ferramenta', descr: 'Uma vara de bambu com linha de seda. Pesca-se onde houver água parada ou corrente mansa.' },
    peixe: { nome: 'Peixe fresco', tipo: 'consumivel', descr: 'Assado na brasa, recupera 30 de vida.' },
    peixeIsca: { nome: 'Peixe-isca dourado', tipo: 'raro', descr: 'Raro. As escamas brilham como ouro velho. Os pescadores do Festim dizem que só um peixe assim atrairia o Leviatã para fora do abismo.' },
    anelPai: { nome: 'Anel do Pai', slot: 'santo', guilda: true, descr: 'O anel que o estalajadeiro pôs no dedo do filho que voltou. +15 de vida e +15 de Fé máxima.', mods: { hp: 15, fe: 15 } }
  });
  const usar0 = IT.usar;
  IT.usar = function (id) {
    if (id !== 'peixe') return usar0.call(IT, id);
    if (!P.D || P.dead || !IT.qtd('peixe')) return;
    if (P.hp >= P.D.maxHp) { ui.toast('Você já está com a vida cheia.'); return; }
    P.hp = Math.min(P.D.maxHp, P.hp + 30 * (P.status.gula ? 0.5 : 1)); C().anel(0xe8c890, 1.6, 0.6, 0.6); if (A.heal) A.heal();
    IT.tirar('peixe'); IT.refresh();
  };
  const darItem = (id, n, msg) => { if (!IT.dar(id, n || 1, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + (n || 1); if (msg) ui.toast(msg); };
  const temItem = id => IT.qtd(id) > 0 || (P.pers && (P.pers.bau[id] || 0) > 0);

  /* ===================================================================
     1. OS ENCOSTOS DO MEIO-DIA (Vila de São Roque)
     =================================================================== */
  OV.FOES.meiodiazinho = Object.assign({}, OV.FOES.diabrete, {
    key: 'meiodiazinho', name: 'Encosto do Meio-Dia', nivel: 5, hp: 90, dmg: 12, xp: 45, mundo: false, status: 'preguica', moedas: [3, 6], aggro: 16,
    build: () => {
      const b = OV.FOES.diabrete.build();
      b.mats.forEach(m => { m.color.setHex(0xb08a3a); m.emissive.setHex(0x2a1a04); });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffd060 })); halo.position.y = 1.5; halo.rotation.x = Math.PI / 2; b.g.add(halo);
      if (b.eye) b.eye.color.setHex(0xffe060);
      return b;
    }
  });
  if (I.PADROES) I.PADROES.meiodiazinho = ['T', 'g', 'I', 'g'];
  if (I.PROJ) I.PROJ.meiodiazinho = [0xffd060, 'preguica'];
  if (I.CORES) I.CORES.meiodiazinho = ['Rubro', 0x8a3a1a, 'Encosto Antigo', 0x3a1a4a];
  // as casas da vila (sem a igreja)
  const CASAS = (M.RECTS || []).filter(([x, z, w, d]) => Math.hypot(x, z - 150) < 36 && w * d < 90 && Math.hypot(x, z - 119) > 7).slice(0, 10).map(([x, z, w, d, rot], i) => {
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0), int = M.interiores.find(k => Math.hypot(k.x - x, k.z - z) < 1);
    const porta = int ? int.porta : { x: x + s * (d / 2 + 1.5), z: z + c * (d / 2 + 1.5) };
    return { i, x, z, w, d, rot: rot || 0, porta, telhado: H(x, z) + 6.4, nome: int && int.nome ? int.nome : 'uma casa da vila' };
  });
  BI.CASAS = CASAS;
  const md = () => { const f = F(); if (!f.meiodia) f.meiodia = {}; return f.meiodia; };
  const dia = () => F().dia || 0;
  let horaAnt = null;
  // a aura que inunda a casa, e o encosto sentado no telhado
  const visual = CASAS.map(c => {
    const aura = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: 0xd8a040, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    aura.scale.set(c.w * 0.85, 4.4, c.d * 0.85); aura.position.set(c.x, H(c.x, c.z) + 1.2, c.z); aura.visible = false; scene.add(aura);
    const luz = M.emissor(c.x, H(c.x, c.z) + 3, c.z, 0, 12, 0xc89040, false);
    return { aura, luz, deco: null, brilho: 0 };
  });
  function decoEncosto(c, v) {
    if (v.deco) return;
    const b = OV.FOES.meiodiazinho.build(); b.g.position.set(c.x, c.telhado, c.z); b.g.rotation.y = c.rot; scene.add(b.g); v.deco = b;
  }
  function tirarDeco(v) { if (v.deco) { scene.remove(v.deco.g); v.deco = null; } }
  function estado(i) { return md()[i] || null; }
  function aplicarMeiodia() {
    CASAS.forEach((c, i) => {
      const e = estado(i), v = visual[i];
      const tomada = e && e.st === 'tomada', vencida = e && e.st === 'vencida';
      v.aura.visible = tomada || vencida; v.luz.int = tomada ? 1.3 : vencida ? 0.6 : 0;
      v.aura.material.opacity = tomada ? 0.2 : 0.12;
      if (tomada && !I.porTag('md_' + i).some(vivo)) decoEncosto(c, v); else tirarDeco(v);
      if (!tomada) MS.tagRemove('md_' + i);
    });
  }
  let mdT = 0;
  function atualizarMeiodia(dt, t) {
    if (!prog() || !MS.feita('m2')) return;
    // os dias passam
    if (horaAnt !== null && T.hora < horaAnt - 12) F().dia = dia() + 1;
    horaAnt = T.hora;
    mdT -= dt; if (mdT > 0) return; mdT = 0.5;
    const h = T.hora, m = md();
    // ao meio-dia, os encostos voltam às casas que não foram abençoadas
    if (h >= 11.5 && h < 14.5 && m.semeado !== dia()) {
      m.semeado = dia();
      CASAS.forEach((c, i) => { const e = m[i]; if (e && e.st === 'vencida') m[i] = { st: 'tomada', dia: dia() }; });
      const livres = CASAS.map((c, i) => i).filter(i => { const e = m[i]; return !e || (e.st === 'abencoada' && dia() - e.dia >= 2); });
      const n = Math.min(livres.length, 1 + (Math.random() < 0.6 ? 1 : 0));
      for (let k = 0; k < n; k++) { const j = livres.splice((Math.random() * livres.length) | 0, 1)[0]; m[j] = { st: 'tomada', dia: dia() }; }
      if (regiao() === 'vale' && Math.hypot(P.pos.x, P.pos.z - 150) < 70) ui.toast('Meio-dia. Uma sombra dourada se assenta sobre os telhados da vila.');
      aplicarMeiodia();
    }
    // quem chega perto faz o encosto descer do telhado
    CASAS.forEach((c, i) => {
      const e = m[i], v = visual[i]; if (!e || e.st !== 'tomada') return;
      v.aura.material.opacity = 0.16 + 0.06 * Math.sin(t * 2 + i);
      if (I.porTag('md_' + i).some(vivo)) return;
      if (Math.hypot(P.pos.x - c.porta.x, P.pos.z - c.porta.z) < 15) {
        tirarDeco(v);
        const en = I.spawn('meiodiazinho', false, { x: c.porta.x, z: c.porta.z }, { nivel: 5 + Math.min(3, Math.floor(dia() / 3)) }); en.tag = 'md_' + i; en.mundo = false;
        en.g.position.y = c.telhado; en.spawnT = 0; en.state = 'chase';
        if (A.bell) A.bell(220, 0.12);
      }
    });
  }
  MS.ganchos.evento.push((tipo, x) => {
    if (tipo === 'vencido' && x && x.tag && /^md_\d+$/.test(x.tag)) {
      const i = +x.tag.slice(3); md()[i] = { st: 'vencida', dia: dia() }; aplicarMeiodia();
      setTimeout(() => ui.toast('O encosto caiu, mas a casa ainda está inundada de acídia. Abençoe-a com água benta.'), 600);
    }
    return false;
  });
  CASAS.forEach((c, i) => {
    M.interativo(c.porta.x, c.porta.z, 2.2, () => { const e = estado(i); return e && e.st === 'vencida' ? 'Abençoar a casa com água benta' : null; }, () => {
      if (IT.qtd('agua') < 1) { ui.toast('Você precisa de um frasco de água benta. Um sacerdote abençoa três essências em um frasco.'); return; }
      IT.tirar('agua'); IT.refresh();
      md()[i] = { st: 'abencoada', dia: dia() };
      const y = H(c.x, c.z); C().anel(0x8ac8ff, 4, 1.1, 0.8);
      for (let k = 0; k < 6; k++) setTimeout(() => C().faisca(c.x + (Math.random() - 0.5) * c.w, y + 1 + Math.random() * 3, c.z + (Math.random() - 0.5) * c.d, 0x9ad0ff), k * 120);
      if (A.bell) { A.bell(523, 0.14); setTimeout(() => A.bell(784, 0.12), 220); }
      F().md_benzidas = (F().md_benzidas || 0) + 1; P.pers.denarios = den() + 6;
      ui.toast(`A casa está abençoada. O encosto não volta mais aqui por um tempo. (+6 denários)`);
      if (MS.ativa('v_meiodia') && MS.etapa('v_meiodia') === 0 && (F().md_benzidas - (F().md_base || 0)) >= 3) { MS.avancar('v_meiodia', 1); setTimeout(() => ui.toast('Três casas abençoadas. Volte a Dona Inácia.'), 1500); }
      aplicarMeiodia(); if (OV.jogo) OV.jogo.salvar();
    });
  });
  // Dona Inácia, que mora na vila, conta do encosto
  AV.npc('inacia', 'Dona Inácia', 12, 168, Math.PI * 0.9, { cor: 0x5a4a5a, veu: 0x3a2a2a });
  const nBenz = () => (F().md_benzidas || 0) - (F().md_base || 0);
  AV.missao({ id: 'v_meiodia', ato: 1, nome: 'Os Encostos do Meio-Dia', npc: 'inacia', xp: 140, den: 30, itens: [['vela', 2]],
    requer: () => MS.feita('m2'),
    etapas: [() => `Ao meio-dia, vença os encostos que pousam nos telhados da vila e abençoe cada casa com água benta (${Math.min(3, nBenz())}/3).`, 'Volte a Dona Inácia.'],
    alvos: [() => { const i = CASAS.findIndex((c, k) => { const e = estado(k); return e && (e.st === 'tomada' || e.st === 'vencida'); }); return i >= 0 ? CASAS[i].porta : { x: 0, z: 150 }; }, () => { const f = M.figuras.inacia; return f ? { x: f.x, z: f.z } : null; }],
    convite: 'Um vizinho veio me contar: todo dia, ao meio-dia, uma coisa dourada pousa no telhado da casa dele, e lá dentro ninguém tem vontade de nada. Ontem foi a casa ao lado. Encosto, é o que é. O Padre Tomé diz que é o mesmo mal do mosteiro, só que pequeno.',
    aceitar: 'Eu cuido dos encostos.', aceito: 'Eles só aparecem ao meio-dia. Vença o encosto e depois abençoe a casa com água benta, senão ele volta no dia seguinte. Leve estas duas, para começar.',
    aoAceitar: () => { F().md_base = F().md_benzidas || 0; darItem('agua', 2); if (!(T.hora >= 11.5 && T.hora < 14.5)) setTimeout(() => ui.toast('Os encostos só pousam ao meio-dia. Num Oratório aceso você pode velar até a hora certa.'), 1600); },
    lembrete: () => `Ao meio-dia, olhe os telhados da vila. Já foram ${Math.min(3, nBenz())} casas abençoadas.`,
    agradece: 'A vila está mais leve, dá para sentir. Meu vizinho voltou a cantar enquanto trabalha!',
    entrega: { acao: 'dar', prop: 'flores', falas: [['Dona Inácia', 'Colhi estas flores para você. E estas velas: acenda uma quando precisar de coragem ao meio-dia.']] },
    depois: 'Ainda aparece um encosto aqui e ali, ao meio-dia. Mas agora a gente sabe o que fazer.' });

  /* ===================================================================
     2. O POÇO DA SAMARITANA (Portos do Festim)
     =================================================================== */
  // a Serpente da Sede: um corpo de anéis que ondula, a cabeça com presas
  function makeSede() {
    const gr = new THREE.Group();
    const esc = sm(0x2a5a6a, { emissive: 0x041418, roughness: 0.6 }), barriga = sm(0x8ab0a0), eye = new THREE.MeshBasicMaterial({ color: 0x6af0ff });
    const segs = [];
    for (let i = 0; i < 9; i++) {
      const r = 0.62 - i * 0.045, s = mesh(new THREE.SphereGeometry(r, 9, 7), i % 2 ? esc : barriga, Math.sin(i * 0.8) * 0.5, 0.55 + Math.max(0, 4 - i) * 0.35, -i * 0.7);
      s.userData.y0 = s.position.y; s.userData.z0 = s.position.z; gr.add(s); segs.push(s);
    }
    const cab = new THREE.Group(); cab.position.set(0, 2.6, 0.55); gr.add(cab);
    const cr = mesh(new THREE.SphereGeometry(0.55, 10, 8), esc, 0, 0, 0); cr.scale.set(1.1, 0.8, 1.4); cab.add(cr);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), eye); e.position.set(0.28 * s, 0.18, 0.5); cab.add(e); const p = mesh(new THREE.ConeGeometry(0.06, 0.32, 5), barriga, 0.16 * s, -0.32, 0.62); p.rotation.x = Math.PI; cab.add(p); const ch = mesh(new THREE.ConeGeometry(0.1, 0.6, 5), esc, 0.32 * s, 0.42, -0.2); ch.rotation.x = -0.8; cab.add(ch); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.6 * s, 2.0, 0.2); gr.add(p); return p; };
    return { g: gr, armL: arm(-1), armR: arm(1), mats: [esc, barriga], eye, eyeBase: 0x6af0ff, segs, cabeca: cab };
  }
  OV.FOES.sede = { key: 'sede', name: 'Serpente da Sede', nivel: 13, chefe: true, build: makeSede, hp: 1200, speed: 2.6, dmg: 30, windup: 0.8, recover: 0.9, range: 3.0, r: 1.2, height: 3.0, knock: 0.15, stagger: false, xp: 800, aggro: 32, leash: 40, status: 'gula', moedas: [30, 50],
    fall: 'A serpente se desfaz em água limpa, que corre de volta para o fundo do poço.',
    ia: e => { if (e.cabeca) { const t = performance.now() / 450; e.cabeca.rotation.y = Math.sin(t) * 0.3; e.cabeca.position.y = 2.6 + (e.state === 'windup' ? 0.5 : Math.sin(t * 1.4) * 0.1); } } };
  I.CHEFES.add('sede');
  if (I.PADROES) I.PADROES.sede = { fases: [[1, ['g', 'T3', 'I']], [0.6, ['O', 'T5', 'g', 'C']], [0.3, ['O', 'C', 'T7', 'I', 'F']]] };
  if (I.PROJ) I.PROJ.sede = [0x6ad0ff, 'gula'];
  if (OV.cenas && OV.cenas.POEMAS) OV.cenas.POEMAS.sede = ['Serpente da Sede', [
    'Bebo o poço, bebo o rio,\nbebo a chuva antes do chão.\nQuanto mais bebo, mais vazio:\nnão há água para o coração.',
    'Desce o balde, sobe seco,\na mulher volta a chorar.\nQuem tem sede do que é eco\nnunca para de buscar.']];
  const PT = OV.porto;
  const POCO = { x: -15, z: 693 };
  if (PT) {
    const y = H(POCO.x, POCO.z), gr = M.grupo(POCO.x, POCO.z, 0);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const p = mesh(new THREE.BoxGeometry(0.62, 0.9, 0.36), M.MAT.rock, Math.cos(a) * 1.05, 0.45, Math.sin(a) * 1.05); p.rotation.y = -a; gr.add(p); }
    gr.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0x050404 }), 0, 0.82, 0));
    [-1, 1].forEach(s => gr.add(mesh(new THREE.BoxGeometry(0.16, 2.4, 0.16), M.MAT.wood, s * 1.2, 1.2, 0)));
    gr.add(mesh(new THREE.BoxGeometry(2.7, 0.14, 0.14), M.MAT.wood, 0, 2.3, 0));
    const tl = mesh(new THREE.ConeGeometry(1.9, 0.9, 4), M.MAT.roofTile || M.MAT.wood, 0, 2.85, 0); tl.rotation.y = Math.PI / 4; gr.add(tl);
    gr.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 3), sm(0x8a7a5a), 0, 1.7, 0));
    gr.add(mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.26, 8), M.MAT.wood, 0, 1.05, 0));
    fundir(gr); M.obstacles.push({ x: POCO.x, z: POCO.z, r: 1.3 });
    M.LOCAIS.poco = { nome: 'Poço da Samaritana', x: POCO.x, z: POCO.z, oy: -20 };
  }
  // a masmorra debaixo do poço (fica numa área escondida do mapa, debaixo da terra)
  const MP = AV.masmorra({ id: 'poco', nome: 'O Fundo do Poço', x: 440, z: -170, rot: 0, regiao: 'subterraneo', estilo: 'rocha', tema: 'cripta', teto: 7.2,
    salasDef: [{ inimigos: [['caranguejo', 11], ['caranguejo', 11], ['larva_gula', 11], ['larva_gula', 11]] }, { inimigos: [['caranguejo', 12, 'forte'], ['larva_gula', 12, 'forte'], ['larva_gula', 12], ['caranguejo', 12]] }, { chefe: ['sede', 13], inimigos: [['larva_gula', 12], ['larva_gula', 12]] }],
    tesouro: { den: [80, 120], itens: [['agua', 3]], equip: true, raro: 0.5 } });
  { // a boca do túnel por onde se desce: pedras e a corda pendurada
    const e = MP.W(0, 27.3), y = H(e.x, e.z), gr = M.grupo(e.x, e.z, 0);
    for (let i = 0; i < 6; i++) { const r = mesh(new THREE.DodecahedronGeometry(0.9 + (i % 3) * 0.3, 0), M.MAT.rock, -2.2 + i * 0.9, 0.6 + (i % 2) * 0.5, 0.4); gr.add(r); }
    gr.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 7, 4), sm(0x8a7a5a), 0, 3.5, -1.0));
    fundir(gr); M.caixa(e.x, e.z, 2.6, 0.6, 0);
  }
  const dentroDoPoco = () => P.pos.x > 400 && P.pos.x < 480 && P.pos.z < -120 && P.pos.z > -220;
  function descer() {
    const p = MP.W(0, 23.5);
    ui.clarao('#000000'); C().resetAcoes(); C().posicionar(p.x, p.z, Math.PI); OV.cam.yaw = 0; OV.jogo.mudouLugar();
    ui.toast('Você desce pela corda. Lá embaixo, a água some num túnel de pedra.');
    if (MS.ativa('p_poco') && MS.etapa('p_poco') === 0) MS.avancar('p_poco', 1);
  }
  function subir() { ui.clarao('#000000'); C().resetAcoes(); C().posicionar(POCO.x + 2.2, POCO.z, -Math.PI / 2); OV.cam.yaw = Math.PI / 2; OV.jogo.mudouLugar(); ui.toast('Você sobe pela corda até a praça.'); }
  if (PT) M.interativo(POCO.x + 1.6, POCO.z, 2.0, () => (st('p_poco') && !MS.feita('p_poco')) || AV.masmorraFeita('poco') ? (AV.masmorraFeita('poco') ? 'Descer de novo ao fundo do poço' : 'Descer pela corda do poço') : (MS.feita('p_poco') ? 'Tirar água do poço' : null), () => {
    if (MS.feita('p_poco') && !(st('p_poco') && MS.ativa('p_poco'))) { const ok = !AV.masmorraFeita('poco'); if (!ok && Math.random() < 0.5) { descer(); return; } P.fe = Math.min(P.D.maxFe, P.fe + 15); P.hp = Math.min(P.D.maxHp, P.hp + 15); ui.toast('A água é fresca e limpa. Você se sente renovado.'); return; }
    descer();
  });
  { const s = MP.W(0, 25.4); M.interativo(s.x, s.z, 2.2, () => 'Subir pela corda do poço', subir); }
  AV.npc('fotina', 'Fotina, a do poço', POCO.x - 2.8, POCO.z - 2.2, 0.9, { cor: 0x4a5a6a, veu: 0x8a7a6a });
  AV.missao({ id: 'p_poco', ato: 2, nome: 'O Poço da Samaritana', npc: 'fotina', xp: 260, den: 50, itens: [['agua', 3]],
    etapas: ['Desça pela corda do poço da praça e descubra o que bebe a água do Festim.', () => `Vença o que mora no fundo do poço (salas: ${AV.salasLivres('poco')}/3).`, 'Volte a Fotina, junto ao poço.'],
    alvos: [() => POCO, () => dentroDoPoco() ? MP.W(0, -18) : POCO, () => { const f = M.figuras.fotina; return f ? { x: f.x, z: f.z } : null; }],
    convite: 'Desde que o banquete começou, o balde desce cheio de corda e volta seco. O povo bebe vinho, porque água não há. Dizem que lá embaixo alguma coisa bebe toda a água antes que ela suba. O meu nome é o mesmo da samaritana do Evangelho, sabia? Ela também veio ao poço com sede.',
    aceitar: 'Eu desço ao fundo do poço.', aceito: 'Há uma corda boa amarrada na trave. Desça devagar, e volte. Eu fico aqui, rezando.',
    lembrete: () => MS.etapa('p_poco') === 0 ? 'A corda está amarrada na trave do poço. Desça devagar.' : `Ainda há sede lá embaixo (salas: ${AV.salasLivres('poco')}/3).`,
    pronto: () => MS.etapa('p_poco') === 2,
    agradece: 'Você voltou! E escute: a água está subindo de novo. Deixe-me tirar o primeiro balde.',
    entrega: { acao: 'beber', prop: 'balde', falas: [['Fotina, a do poço', '«Quem beber desta água terá sede de novo; mas quem beber da água que Eu darei nunca mais terá sede.» Eu nunca tinha entendido isso tão bem quanto hoje. Tome, e que nunca lhe falte água viva.']] },
    depois: 'O poço dá água para todos de novo. E à tarde as mulheres do bairro vêm aqui conversar, como antigamente.' });
  MS.ganchos.evento.push((tipo, x) => { if (tipo === 'masmorra' && x && x.id === 'poco' && MS.ativa('p_poco') && MS.etapa('p_poco') < 2) { MS.avancar('p_poco', 2); setTimeout(() => ui.toast('A água volta a correr para cima. Suba pela corda e fale com Fotina.'), 2600); } return false; });

  /* ===================================================================
     3. O FILHO PRÓDIGO
     =================================================================== */
  const POCILGA = { x: 99, z: 648 };
  if (PT) {
    const gr = M.grupo(POCILGA.x, POCILGA.z, 0.3), mad = M.MAT.wood;
    const hw = 4.2, hd = 3.4;
    const lado = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.4); for (let i = 0; i <= n; i++) { const t = i / n; gr.add(mesh(new THREE.BoxGeometry(0.14, 0.9, 0.14), mad, x0 + (x1 - x0) * t, 0.45, z0 + (z1 - z0) * t)); } const hz = Math.abs(x1 - x0) > Math.abs(z1 - z0), L = Math.hypot(x1 - x0, z1 - z0); [0.35, 0.7].forEach(h => gr.add(mesh(new THREE.BoxGeometry(hz ? L : 0.06, 0.07, hz ? 0.06 : L), mad, (x0 + x1) / 2, h, (z0 + z1) / 2))); };
    lado(-hw, -hd, hw, -hd); lado(-hw, -hd, -hw, hd); lado(hw, -hd, hw, hd); lado(-hw, hd, -1.2, hd); lado(1.2, hd, hw, hd);
    gr.add(mesh(new THREE.BoxGeometry(2.2, 0.4, 0.6), mad, 1.5, 0.2, -2.6));
    const lama = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 - 0.4, hd * 2 - 0.4), sm(0x4a3a24, { roughness: 1 })); lama.rotation.x = -Math.PI / 2; lama.position.y = 0.04; gr.add(lama);
    fundir(gr);
    const rosa = sm(0xd89a90), focinho = sm(0xc07a70);
    BI.porcos = [[-2, -1.5], [1.6, 0.6], [-0.8, 1.4], [2.4, -1.4]].map(([lx, lz], i) => {
      const p = new THREE.Group(), c = Math.cos(0.3), s = Math.sin(0.3), x = POCILGA.x + lx * c + lz * s, z = POCILGA.z - lx * s + lz * c;
      const corpo = mesh(new THREE.SphereGeometry(0.42, 8, 6), rosa, 0, 0.45, 0); corpo.scale.set(1, 0.85, 1.35); p.add(corpo);
      p.add(mesh(new THREE.SphereGeometry(0.22, 7, 5), rosa, 0, 0.55, 0.55)); { const fo = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 7), focinho, 0, 0.52, 0.76); fo.rotation.x = Math.PI / 2; p.add(fo); }
      [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.3], [0.2, -0.3]].forEach(([a, b]) => p.add(mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), rosa, a, 0.15, b)));
      p.position.set(x, H(x, z), z); p.rotation.y = i * 1.7; scene.add(p); return p;
    });
    M.obstacles.push({ x: POCILGA.x, z: POCILGA.z, r: 3.6 });
  }
  AV.npc('ruben', 'Rúben, o rapaz dos porcos', POCILGA.x + 3.2, POCILGA.z + 4.4, Math.PI + 0.3, { cor: 0x4a3e30, cabelo: 0x3a2a1a });
  MS.MIS.p_prodigo = { ato: 2, nome: 'O Filho Pródigo', tipo: 's', xp: 160, etapas: ['Ouça a história do rapaz que cuida dos porcos, a leste do porto.', 'Leve a notícia ao estalajadeiro de São Roque, na Estalagem do Peregrino, no Vale.'],
    alvos: [() => { const f = M.figuras.ruben; return f ? { x: f.x, z: f.z } : null; }, () => { const f = M.figuras.estalajadeiro; return f ? { x: f.x, z: f.z } : null; }] };
  MS.MIS.m_prodigo = { ato: 3, nome: 'O Filho que Ficou', tipo: 's', xp: 200, etapas: ['Leve a notícia ao estalajadeiro de São Roque, na Estalagem do Peregrino, no Vale.'],
    alvos: [() => { const f = M.figuras.estalajadeiro; return f ? { x: f.x, z: f.z } : null; }] };
  MS.ARV.ruben = function () {
    const pd = F().prodigo;
    if (pd === 'desistiu') return linha('Rúben, o rapaz dos porcos', 'O meu pai não ia me perdoar. Você mesmo disse. Pelo menos os porcos não me julgam.');
    if (pd === 'ficou') return linha('Rúben, o rapaz dos porcos', 'Juntei quase nada. O comerciante diz que nas Minas de Mamom se ganha ouro aos montes... Talvez eu vá para lá.');
    if (pd) return linha('Rúben', 'Estou voltando para casa. Obrigado.');
    return { inicio: 'a', nos: {
      a: { quem: 'Rúben, o rapaz dos porcos', txt: 'Não olhe assim para mim. Eu era o filho do estalajadeiro de São Roque, lá no vale. Pedi ao meu pai a minha parte da herança e vim gastar tudo no banquete do Barão.', prox: 'b', ef: () => { if (!st('p_prodigo')) MS.iniciar('p_prodigo'); } },
      b: { quem: 'Rúben, o rapaz dos porcos', txt: 'Quando o dinheiro acabou, os amigos acabaram junto. Agora cuido dos porcos de um comerciante, e tenho vontade de comer até a lavagem deles. Na casa do meu pai até os empregados comem pão. O que você acha que eu devo fazer?', opc: [
        { t: 'Volte para o seu pai. Ele está esperando você.', ef: () => { F().prodigo = 'voltou'; MS.avancar('p_prodigo', 1); MS.ato('caridade'); }, ir: 'v' },
        { t: 'Junte dinheiro primeiro, para não voltar de mãos vazias.', ef: () => { F().prodigo = 'ficou'; MS.concluir('p_prodigo', 'ficou'); }, ir: 'f' },
        { t: 'O seu pai nunca vai perdoar o que você fez.', ef: () => { F().prodigo = 'desistiu'; MS.concluir('p_prodigo', 'desistiu'); }, ir: 'd' }] },
      v: { quem: 'Rúben, o rapaz dos porcos', txt: 'Vou dizer a ele: «Pai, pequei contra o céu e contra ti. Já não mereço ser chamado teu filho. Trata-me como um dos teus empregados.» ...Você vai na frente? Conte a ele que eu estou chegando.', depois: () => { aplicarProdigo(); OV.jogo.salvar(); } },
      f: { quem: 'Rúben, o rapaz dos porcos', txt: 'É, faz sentido. Ninguém volta de mãos vazias. Mais uns meses, e eu volto de cabeça erguida.', depois: () => OV.jogo.salvar() },
      d: { quem: 'Rúben, o rapaz dos porcos', txt: '...Eu sabia. Bem, os porcos pelo menos não me julgam.', depois: () => OV.jogo.salvar() }
    } };
  };
  if (OV.vida && OV.vida.SINAL) { OV.vida.SINAL.ruben = () => (!F().prodigo && F().ato1_fim) ? '!' : null; }
  // o pai, na Estalagem do Peregrino
  const estal0 = MS.ARV.estalajadeiro;
  MS.ARV.estalajadeiro = function () {
    const pd = F().prodigo, q = 'Estalajadeiro';
    if ((pd === 'voltou' || pd === 'voltou2') && !F().festa) return { inicio: 'a', nos: {
      a: { quem: q, txt: 'O que você disse? O meu filho... está vindo? Do porto? Eu vi alguém na estrada, de longe, e pensei que eram os meus olhos cansados.', prox: 'b' },
      b: { quem: '', txt: 'O velho larga o pano e sai correndo pela estrada. Pouco depois volta abraçado a um rapaz magro, sujo de lama, que chora sem conseguir falar.', prox: 'c' },
      c: { quem: q, txt: 'Tragam a melhor túnica! Ponham um anel no dedo dele e sandálias nos pés! Matem o novilho gordo, vamos comer e festejar: este meu filho estava morto e voltou a viver, estava perdido e foi encontrado!', prox: 'd' },
      d: { quem: q, txt: () => `E você, ${g('peregrino', 'peregrina')}, que me trouxe a notícia: fique com este anel. Era o meu, e eu pus outro no dedo dele. Hoje não falta nada nesta casa.`, ef: () => {
        F().festa = true; darItem('anelPai', 1); P.pers.denarios = den() + 40; MS.ato('caridade');
        if (MS.ativa('p_prodigo')) MS.concluir('p_prodigo', 'voltou'); if (MS.ativa('m_prodigo')) MS.concluir('m_prodigo', 'voltou');
        setTimeout(() => ui.toast('Recebido: Anel do Pai e 40 denários.'), 1200); aplicarProdigo(); OV.jogo.salvar();
      } }
    } };
    if (F().festa) return linha(q, 'O meu filho trabalha comigo agora. O irmão mais velho ainda resmunga um pouco, mas já se sentou à mesa com ele. Deus seja louvado.');
    if (pd === 'desistiu') return linha(q, 'Todo dia, no fim da tarde, eu olho a estrada do sul. Um dia ele aparece. Um pai nunca para de olhar a estrada.');
    if (F().ato1_fim && !pd) return linha(q, 'Bem-vindo à Estalagem. Se for ao porto, procure um rapaz chamado Rúben... é o meu filho mais novo. Pediu a herança e foi embora. Diga que o pai não está zangado.');
    return estal0 ? estal0() : linha(q, 'Bem-vindo à Estalagem do Peregrino. Pão quente e cama limpa, quando a vila voltar a viver.');
  };
  if (OV.vida && OV.vida.SINAL) { const s0 = OV.vida.SINAL.estalajadeiro; OV.vida.SINAL.estalajadeiro = () => ((F().prodigo === 'voltou' || F().prodigo === 'voltou2') && !F().festa) ? '?' : (s0 ? s0() : null); }
  function aplicarProdigo() {
    const r = M.figuras.ruben; if (!r) return;
    const pd = F().prodigo, inn = M.interiores.find(c => c.nome === 'Estalagem do Peregrino');
    if ((pd === 'voltou' || pd === 'voltou2') && inn) { const q = inn.W(1.6, 0.4); r.mover(q.x, q.z, inn.rot + Math.PI); r.mostrar(!!F().festa || true); }
    else if (pd === 'ficou' && F().ato2_fim) r.mostrar(false);
    else { r.mover(r.x0, r.z0, r.rot0); r.mostrar(true); }
  }
  // quem ficou para juntar dinheiro, a avareza encontra nas minas
  MS.ganchos.spawn.push(() => {
    MS.tagRemove('ruben');
    if (F().prodigo === 'ficou' && F().ato2_fim && !F().ruben_livre) {
      const R = OV.regioes && OV.regioes.minas; if (!R) return;
      const e = I.spawn('mineiro', false, { x: -960, z: -6 }, { nivel: 13, variante: 'elite' }); e.tag = 'ruben'; e.mundo = false;
      if (e.lab && e.lab.el.firstChild) e.lab.el.firstChild.textContent = 'Rúben, possuído pela avareza';
    }
  });
  MS.ganchos.evento.push((tipo, x) => {
    if (tipo === 'liberto' && x && x.tag === 'ruben') {
      x.sumir = true; F().ruben_livre = true; F().prodigo = 'voltou2';
      setTimeout(() => D.falas([['Rúben', 'Onde... onde eu estou? Eu cavava, cavava, e cada pepita só me deixava com mais fome. Juntei ouro para voltar de cabeça erguida, e quase não volto nunca mais.'], ['Rúben', 'Você me disse para juntar dinheiro. Não foi culpa sua: eu é que não quis ouvir o que o coração dizia. Vou para casa agora, do jeito que estou. Conte ao meu pai?']], () => { MS.iniciar('m_prodigo'); aplicarProdigo(); OV.jogo.salvar(); }), 600);
      return true;
    }
    return false;
  });
  MS.ganchos.aplicar.push(aplicarProdigo);

  /* ===================================================================
     4. O BARCO DE MESTRE PEDRO E A ROCHA DO PRUDENTE
     =================================================================== */
  const ILHA = { x: 66, z: 803, r: 10 };
  if (PT) {
    const alt0 = PT.altura, lim0 = PT.limitar;
    PT.altura = function (x, z) { const d = Math.hypot(x - ILHA.x, z - ILHA.z); if (d < ILHA.r + 1) return 1.7 + 0.5 * Math.max(0, 1 - (d / ILHA.r) ** 2) - Math.max(0, d - ILHA.r) * 4; return alt0(x, z); };
    PT.limitar = function (p, r) { const d = Math.hypot(p.x - ILHA.x, p.z - ILHA.z); if (d < ILHA.r + 3) { const lim = ILHA.r - 0.6; if (d > lim) { p.x = ILHA.x + (p.x - ILHA.x) / d * lim; p.z = ILHA.z + (p.z - ILHA.z) / d * lim; } return; } return lim0(p, r); };
    const gr = new THREE.Group(); gr.position.set(ILHA.x, 0, ILHA.z); scene.add(gr);
    const rocha = M.MAT.rock, escura = sm(0x4a4440, { roughness: 1 });
    const base = mesh(new THREE.CylinderGeometry(ILHA.r, ILHA.r + 2.4, 7, 14), escura, 0, -1.4, 0); gr.add(base);
    const topo = mesh(new THREE.CylinderGeometry(ILHA.r - 0.2, ILHA.r, 0.6, 14), rocha, 0, 1.9, 0); gr.add(topo);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const r = mesh(new THREE.DodecahedronGeometry(1.4 + (i % 3) * 0.6, 0), i % 2 ? rocha : escura, Math.cos(a) * (ILHA.r + 0.8), 0.6 + (i % 3) * 0.4, Math.sin(a) * (ILHA.r + 0.8)); r.rotation.set(i, i * 2, 0); gr.add(r); }
    gr.add(mesh(new THREE.BoxGeometry(1.6, 0.14, 4), M.MAT.woodL, 0, 1.0, -ILHA.r - 1.2));
    fundir(gr);
    const casaY = 2.15, cg = new THREE.Group(); cg.position.set(ILHA.x + 2, casaY, ILHA.z + 3); cg.rotation.y = Math.PI; scene.add(cg);
    const muro = M.MAT.plaster ? M.MAT.plaster[0] : rocha;
    cg.add(mesh(new THREE.BoxGeometry(4.6, 3, 4), muro, 0, 1.5, 0));
    const tl = mesh(new THREE.ConeGeometry(3.6, 1.8, 4), M.MAT.roofTile || rocha, 0, 3.9, 0); tl.rotation.y = Math.PI / 4; cg.add(tl);
    cg.add(mesh(new THREE.BoxGeometry(1, 1.9, 0.1), M.MAT.wood, 0, 0.95, 2.02)); cg.add(mesh(new THREE.BoxGeometry(0.6, 0.6, 0.1), M.MAT.winLit, 1.4, 1.8, 2.02));
    fundir(cg); M.caixa(ILHA.x + 2, ILHA.z + 3, 2.4, 2.1, Math.PI); M.emissor(ILHA.x + 2, casaY + 2.4, ILHA.z + 0.6, 1.0, 9, 0xffb468);
    M.LOCAIS.rocha = { nome: 'Rocha do Prudente', x: ILHA.x, z: ILHA.z, oy: -24 };
    AV.npc('eliaquim', 'Eliaquim, o construtor prudente', ILHA.x - 1.5, ILHA.z - 1.6, Math.PI * 0.85, { cor: 0x5a4a3a, cabelo: 0xd8d0c0 });
  }
  // a viagem de barco, com a câmera de cena
  const barcoMar = AJ ? AJ.modeloBarco() : new THREE.Group(); barcoMar.visible = false; scene.add(barcoMar);
  let viagem = null;
  const CAIS = { x: 21, z: 779 }, ILHA_CAIS = { x: ILHA.x, z: ILHA.z - ILHA.r - 2.4 };
  function navegar(de, para, depois) {
    if (viagem) return;
    viagem = { t: 0, dur: 6.5, de, para, depois };
    barcoMar.visible = true; if (AJ) AJ.navegando = true; P.travado = true;
    if (OV.cenas) OV.cenas.iniciar({ alvo: () => new THREE.Vector3(barcoMar.position.x, 0.5, barcoMar.position.z), raio: 11, altura: 4.5, giro: 0.1, olhar: 0.6, barco: true });
    if (A.bell) A.bell(330, 0.08);
  }
  M.animados.push(dt => {
    if (!viagem) return;
    const v = viagem; v.t += dt;
    const k = Math.min(1, v.t / v.dur), e = k * k * (3 - 2 * k);
    const x = v.de.x + (v.para.x - v.de.x) * e, z = v.de.z + (v.para.z - v.de.z) * e;
    barcoMar.position.set(x, -0.35 + Math.sin(v.t * 2) * 0.06, z); barcoMar.rotation.y = Math.atan2(v.para.x - v.de.x, v.para.z - v.de.z); barcoMar.rotation.z = Math.sin(v.t * 1.6) * 0.05;
    P.pos.set(x, barcoMar.position.y + 0.5, z); if (P.heroi) { P.heroi.g.position.copy(P.pos); P.heroi.g.rotation.y = barcoMar.rotation.y; }
    P.invuln = Math.max(P.invuln || 0, 0.3);
    if (k >= 1) {
      viagem = null; barcoMar.visible = false; if (AJ) AJ.navegando = false; P.travado = false;
      if (OV.cenas && OV.cenas.ativa && OV.cenas.ativa.barco) OV.cenas.encerrar();
      if (v.depois) v.depois();
      OV.jogo.mudouLugar();
    }
  });
  const viajarVale = () => { const m = M.figuras.barqueiro; ui.clarao('#000000'); C().resetAcoes(); const x = m ? m.x + 1.6 : 104, z = m ? m.z + 2 : 20; C().posicionar(x, z, Math.PI / 2); OV.cam.yaw = -Math.PI / 2; T.definir(T.hora + 3); OV.jogo.mudouLugar(); ui.toast('O barco sobe o Rio Lento a remo e a vela. Você desembarca no cais de Simeão, no Vale de Santa Sabina.'); };
  const viajarPorto = () => { ui.clarao('#000000'); C().resetAcoes(); C().posicionar(CAIS.x, CAIS.z - 4, Math.PI); OV.cam.yaw = 0; T.definir(T.hora + 3); OV.jogo.mudouLugar(); ui.toast('O barco desce o Rio Lento até o mar. Você desembarca no cais comprido dos Portos do Festim.'); };
  BI.viajarVale = viajarVale; BI.viajarPorto = viajarPorto;
  const pedro0 = MS.ARV.pedro;
  MS.ARV.pedro = function () {
    if (!MS.feita('a2s1')) return pedro0 ? pedro0() : null;
    return { inicio: 'a', nos: {
      a: { quem: 'Mestre Pedro', txt: 'As redes estão limpas, e o barco é seu quando precisar. Para onde?', opc: [
        { t: 'Para a Rocha do Prudente, no mar.', ef: () => { P.pos.set(CAIS.x, P.pos.y, CAIS.z); navegar(CAIS, ILHA_CAIS, () => { C().posicionar(ILHA_CAIS.x, ILHA_CAIS.z + 3.4, 0); OV.cam.yaw = Math.PI; if (!F().rocha_visitada) { F().rocha_visitada = true; ui.toast('Uma casa pequena no alto da rocha. As ondas batem, e ela nem treme.'); } }); } },
        { t: 'Para o Vale de Santa Sabina, subindo o Rio Lento.', ef: () => setTimeout(viajarVale, 200) },
        { t: 'Para o mar aberto.', ir: 'm' },
        { t: 'Conte da rocha no mar.', ir: 'r' },
        { t: 'Fico em terra, obrigado.' }] },
      m: { quem: 'Mestre Pedro', txt: () => (temItem('peixeIsca') ? 'Esse peixe dourado... é a isca de que os velhos falavam. Mas nem com ela eu levo o barco para o mar aberto: lá mora o Leviatã, e ele engoliu navios inteiros. Um dia, quando Deus abrir esse caminho, nós vamos.' : 'O mar aberto? Lá mora o Leviatã, a serpente das águas. Engoliu navios inteiros, e dizem que guarda no ventre coisas que o mundo perdeu. Nenhum pescador vai até lá. Os velhos dizem que só um peixe-isca dourado o faria subir.'), prox: 'a' },
      r: { quem: 'Mestre Pedro', txt: 'Lá mora o velho Eliaquim. Quando era moço, todo mundo construía na areia, que era mais fácil. Ele cavou até a rocha. Veio a tempestade de trinta anos atrás, e só a casa dele ficou de pé. Sabe fazer ferramenta como ninguém.', prox: 'a' }
    } };
  };
  M.interativo(ILHA_CAIS.x, ILHA_CAIS.z + 1.6, 2.4, () => viagem ? null : 'Voltar ao porto no barco de Mestre Pedro', () => navegar(ILHA_CAIS, CAIS, () => { C().posicionar(CAIS.x, CAIS.z - 4, Math.PI); OV.cam.yaw = 0; }));
  // Simeão também desce o rio até o mar
  const sim0 = MS.ARV.barqueiro;
  MS.ARV.barqueiro = function () {
    return { inicio: 'a', nos: { a: { quem: 'Simeão, o barqueiro', txt: () => F().ato1_fim ? 'Atravessar o rio é de graça. Descer até o mar leva meio dia, mas eu levo. Quer ir aos Portos do Festim?' : 'O rio está fundo e frio. Nadar, só os peixes. Para atravessar, é só subir no barco, ali no cais.', opc: F().ato1_fim ? [{ t: 'Descer o rio até os Portos do Festim.', ef: () => setTimeout(viajarPorto, 200) }, { t: 'Agora não.' }] : null } } };
  };
  // Eliaquim, o homem que construiu sobre a rocha: afina as armas e as ferramentas
  const AFINA = [
    { den: 70, mats: { carapaca: 3, banha: 2 } },
    { den: 120, mats: { pedraGolem: 2, elitro: 2 } },
    { den: 200, mats: { caco: 2, pluma: 2, olhoBasilisco: 1 } }
  ];
  const nivelAfina = () => F().afinacao || 0;
  const danoContra0 = IT.danoContra;
  IT.danoContra = function (e) { return danoContra0.call(IT, e) * (1 + 0.08 * nivelAfina()); };
  MS.ARV.eliaquim = function () {
    const n = nivelAfina(), r = AFINA[n], MATN = OF ? OF.MAT : {};
    const custo = r ? [`${r.den} denários`].concat(Object.keys(r.mats).map(k => `${r.mats[k]} ${MATN[k][0]}`)).join(', ') : '';
    const falta = r ? Object.keys(r.mats).filter(k => OF.qtd(k) < r.mats[k]).map(k => MATN[k][0]).concat(den() < r.den ? ['denários'] : []) : [];
    return { inicio: 'a', nos: {
      a: { quem: 'Eliaquim', txt: () => F().eliaquim_ouviu ? (n >= 3 ? 'As suas armas e ferramentas estão afinadas como eu nunca afinei as minhas. Vá com Deus, e construa na rocha.' : `Quer que eu afine as suas armas e ferramentas? O afinamento ${['primeiro', 'segundo', 'terceiro'][n]} pede: ${custo}.`) : 'Você atravessou o mar só para ver um velho numa pedra? Sente-se. Vou contar por que moro aqui.', prox: () => F().eliaquim_ouviu ? null : 'p', opc: F().eliaquim_ouviu && n < 3 ? [
        { t: `Afinar as armas e ferramentas (grau ${n + 1} de 3).`, cond: () => !falta.length, motivo: () => 'falta: ' + falta.join(', '), ef: () => {
          P.pers.denarios = den() - r.den; for (const k in r.mats) OF.tirar(k, r.mats[k]);
          F().afinacao = n + 1; C().anel(0xffe6a8, 2.4, 0.8, 0.7); if (A.bell) A.bell(784, 0.14);
          setTimeout(() => ui.toast(`Afinação ${n + 1}: todas as suas armas ferem ${8 * (n + 1)}% a mais, e a vara e a picareta respondem melhor.`), 500); OV.jogo.salvar();
        }, ir: 'f' },
        { t: 'Que materiais servem?', ir: 'm' }, { t: 'Só vim ouvir o mar.' }] : null },
      p: { quem: 'Eliaquim', txt: '«Todo aquele que ouve estas minhas palavras e as põe em prática será como o homem prudente que construiu a sua casa sobre a rocha. Caiu a chuva, vieram as enchentes, sopraram os ventos e investiram contra aquela casa; mas ela não caiu, porque estava fundada na rocha.»', prox: 'q' },
      q: { quem: 'Eliaquim', txt: 'Todos construíram na areia. Eu cavei. Levei três anos para chegar à pedra, e riam de mim. Na grande tempestade, a minha foi a única casa que ficou. Desde então afino ferramentas: quem constrói direito, começa pela ferramenta direita.', ef: () => { F().eliaquim_ouviu = true; OV.jogo.salvar(); }, prox: 'a' },
      m: { quem: 'Eliaquim', txt: 'Carapaças e banha da gula, aqui do porto, para começar. Depois, corações de golem e élitros de ouro das minas. Por último, cacos de espelho e plumas de pavão da Corte, e o olho do basilisco que vive no mausoléu dos duques. A rocha não tem pressa.', prox: 'a' },
      f: { quem: 'Eliaquim', txt: 'Pronto. Ferramenta afinada não força a mão de quem trabalha. Volte quando quiser mais.' }
    } };
  };

  /* ===================================================================
     5. A GRUTA DO EREMITA (Vale): só abre com a picareta de Santa Bárbara
     =================================================================== */
  const GRUTA = { x: -153, z: -120, rot: 0.6 };
  {
    const gr = M.grupo(GRUTA.x, GRUTA.z, GRUTA.rot), rocha = M.MAT.rock;
    for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI, r = mesh(new THREE.DodecahedronGeometry(1.5 + (i % 3) * 0.5, 0), rocha, Math.cos(a) * 3.2, Math.sin(a) * 3.2 + 0.4, -1.2); r.rotation.set(i, i * 1.3, 0); gr.add(r); }
    gr.add(mesh(new THREE.BoxGeometry(4.4, 3.4, 3), sm(0x050404), 0, 1.6, -1.8));
    gr.add(mesh(new THREE.DodecahedronGeometry(3.6, 0), rocha, 0, 3.6, -3.6));
    fundir(gr);
    const cs = Math.cos(GRUTA.rot), sn = Math.sin(GRUTA.rot), W = (lx, lz) => ({ x: GRUTA.x + lx * cs + lz * sn, z: GRUTA.z - lx * sn + lz * cs });
    [[-3.2, -1.2], [3.2, -1.2]].forEach(([a, b]) => { const q = W(a, b); M.obstacles.push({ x: q.x, z: q.z, r: 1.8 }); });
    { const q = W(0, -3.4); M.caixa(q.x, q.z, 3, 1.2, GRUTA.rot); }
    // o entulho que fecha a boca da gruta
    const ent = new THREE.Group(); ent.position.set(GRUTA.x, H(GRUTA.x, GRUTA.z), GRUTA.z); ent.rotation.y = GRUTA.rot; scene.add(ent);
    for (let i = 0; i < 8; i++) { const r = mesh(new THREE.DodecahedronGeometry(0.6 + (i % 3) * 0.25, 0), sm(0x6a625a), -1.6 + (i % 4) * 1.05, 0.4 + Math.floor(i / 4) * 0.8, 0.1 + (i % 2) * 0.3); r.rotation.set(i, i, i); ent.add(r); }
    const cxEnt = M.caixa(W(0, 0.2).x, W(0, 0.2).z, 2.2, 0.8, GRUTA.rot);
    BI.gruta = { W, ent, cxEnt };
    const frente = W(0, 1.8);
    M.interativo(frente.x, frente.z, 2.4, () => F().gruta_aberta ? null : (temItem('picareta') ? 'Abrir caminho com a picareta de Santa Bárbara' : 'Examinar as pedras caídas'), () => {
      if (!temItem('picareta')) { ui.fala('Pedras caídas', 'Uma gruta fechada por um desabamento antigo. As pedras são grandes demais para as mãos. Seria preciso uma boa picareta de mineiro.'); return; }
      abrirGruta();
    });
    M.LOCAIS.gruta_eremita = { nome: 'Gruta do Eremita', x: GRUTA.x, z: GRUTA.z, oy: -22 };
    const dentro = W(0, -0.4);
    AV.bau({ id: 'gruta_eremita', x: W(1.0, -0.9).x, z: W(1.0, -0.9).z, rot: GRUTA.rot, regiao: 'vale', rico: true, cond: () => !!F().gruta_aberta,
      conteudo: { den: [60, 90], itens: [['pergaminho', 1], ['vela', 2]], equip: true, raro: 0.8 } });
    M.interativo(W(-1.1, -0.6).x, W(-1.1, -0.6).z, 1.8, () => F().gruta_aberta ? 'Ler o diário do eremita' : null, () => D.falas([
      ['Diário do eremita', '«Vim para esta gruta quando as lâmpadas ainda ardiam. Rezei aqui quarenta anos. Agora sinto que se apagam, uma a uma, e não tenho mais forças para descer ao vale.»', { verso: true }],
      ['Diário do eremita', '«Vi em sonho o Monte Santo, onde a última lâmpada arde mais perto do céu. A subida é longa: é preciso acampar no caminho, e os demônios esperam nas pedras. No topo, uma ovelha branca, a que se perdeu, espera quem a vá buscar.»', { verso: true }],
      ['Diário do eremita', '«E vi o mar. Lá embaixo, no abismo, o Leviatã guarda no ventre o que engoliu. Como Jonas, alguém terá de atravessar dentro do peixe. Que Deus mande essa pessoa. Eu fico aqui, rezando por ela.»', { verso: true }]
    ], () => { F().lore_sinai = true; F().lore_leviata = true; }));
    BI.dentroGruta = dentro;
  }
  function abrirGruta() {
    F().gruta_aberta = true; P.travado = true;
    const g0 = BI.gruta.ent; let t = 0;
    for (let i = 0; i < 6; i++) setTimeout(() => { if (A.hit) A.hit(); OV.jogo.shake(0.25); C().faisca(g0.position.x + (Math.random() - 0.5) * 2, g0.position.y + 1, g0.position.z + (Math.random() - 0.5) * 2, 0xc8b89a); }, i * 330);
    C().efeito([], 2.4, p => { t = p; g0.children.forEach((r, i) => { r.position.y = (0.4 + Math.floor(i / 4) * 0.8) * (1 - p) - p * 0.3; r.position.x += (i % 2 ? 1 : -1) * 0.02; }); if (p >= 0.99) { g0.visible = false; } });
    setTimeout(() => { BI.gruta.cxEnt.ativa = false; P.travado = false; ui.toast('As pedras rolam para o lado. Lá dentro, um baú antigo e um livro aberto sobre uma pedra.'); OV.jogo.salvar(); }, 2500);
  }
  MS.ganchos.aplicar.push(() => { if (BI.gruta) { BI.gruta.ent.visible = !F().gruta_aberta; BI.gruta.cxEnt.ativa = !F().gruta_aberta; } });
  // a picareta vem das minas (Ato III); a vara de pesca, da Corte (Ato IV)
  const concluir0 = MS.concluir;
  MS.concluir = function (id, r) {
    const antes = MS.feita(id);
    concluir0.call(MS, id, r);
    if (antes) return;
    if ((id === 'a3m2' || id === 'm_pocos') && !temItem('picareta')) setTimeout(() => darItem('picareta', 1, id === 'a3m2' ? 'Os mineiros libertados lhe deram uma Picareta de Santa Bárbara. «Dizem que lá no vale de onde você veio há pedras que só ela quebra.»' : 'Leandro lhe deu uma Picareta de Santa Bárbara.'), 2600);
    if (id === 'a4s2' && !temItem('vara')) setTimeout(() => darItem('vara', 1, 'Mateus também lhe deu a sua vara de pesca: «Na lagoa da floresta do seu vale, dizem, há peixes dourados.»'), 3000);
  };
  MS.ganchos.aplicar.push(() => {
    if (!P.pers) return;
    if ((MS.feita('a3m2') || MS.feita('m_pocos')) && !temItem('picareta')) darItem('picareta', 1);
    if (MS.feita('a4s2') && !temItem('vara')) darItem('vara', 1);
  });

  /* ===================================================================
     6. A LAGOA DA FLORESTA E A PESCA
     =================================================================== */
  const LAGOA = { x: -88, z: 116, r: 3.4 };
  {
    const y = H(LAGOA.x, LAGOA.z);
    const agua = new THREE.Mesh(new THREE.CircleGeometry(LAGOA.r, 20), sm(0x2a5a6a, { roughness: 0.15, metalness: 0.3 })); agua.rotation.x = -Math.PI / 2; agua.position.set(LAGOA.x, y + 0.08, LAGOA.z); scene.add(agua);
    const gr = M.grupo(LAGOA.x, LAGOA.z, 0);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; gr.add(mesh(new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.1, 0), M.MAT.rock, Math.cos(a) * (LAGOA.r + 0.2), 0.05, Math.sin(a) * (LAGOA.r + 0.2))); if (i % 3 === 0) gr.add(mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 3), sm(0x5a7a3a), Math.cos(a) * (LAGOA.r - 0.2), 0.5, Math.sin(a) * (LAGOA.r - 0.2))); }
    fundir(gr); M.obstacles.push({ x: LAGOA.x, z: LAGOA.z, r: LAGOA.r + 0.2 });
    M.LOCAIS.lagoa = { nome: 'Lagoa da Floresta', x: LAGOA.x, z: LAGOA.z, oy: -16 };
  }
  // onde se pode pescar: a lagoa, os cais do rio e o píer do porto
  const PESQUEIROS = [{ x: LAGOA.x, z: LAGOA.z + LAGOA.r + 1.0, nome: 'a lagoa', lagoa: true }];
  if (M.figuras.barqueiro) PESQUEIROS.push({ x: M.rioX(20) - 4.6, z: 22.2, nome: 'o Rio Lento' });
  if (PT) PESQUEIROS.push({ x: 21, z: 776, nome: 'o mar' });
  let pesca = null;
  PESQUEIROS.forEach(pq => {
    M.interativo(pq.x, pq.z, 2.0, () => !temItem('vara') ? (pq.lagoa ? 'Olhar a lagoa' : null) : !pesca ? 'Pescar com a vara' : pesca.fisgou ? 'Puxar a linha!' : 'Esperar o peixe...', () => {
      if (!temItem('vara')) { ui.fala(pq.nome === 'a lagoa' ? 'Lagoa da Floresta' : 'Água', 'A água é escura e calma. Às vezes um brilho dourado passa lá no fundo. Com uma vara de pesca, quem sabe...'); return; }
      if (!pesca) { pesca = { pq, t: 0, espera: 2.5 + Math.random() * 4, fisgou: false, janela: 0 }; ui.toast('Você lança a linha e espera.'); if (A.dodge) A.dodge(); P.travado = true; return; }
      if (pesca.fisgou) puxar(); else { ui.toast('Ainda não. Espere o peixe morder.'); }
    });
  });
  function puxar() {
    const pq = pesca.pq, noite = T.ehNoite(), af = nivelAfina();
    pesca = null; P.travado = false;
    const r = Math.random();
    const chIsca = pq.lagoa ? (noite ? 0.25 : 0.1) * (1 + af * 0.25) : 0;
    if (r < chIsca) { darItem('peixeIsca', 1, 'Um peixe dourado, que brilha como ouro velho! O Peixe-isca dourado de que os pescadores falam.'); if (A.level) A.level(); }
    else if (r < 0.85) { darItem('peixe', 1, 'Você pescou um peixe fresco.'); if (A.bell) A.bell(659, 0.08); }
    else ui.toast('Só uma bota velha e muita lama. Tente de novo.');
    if (OV.jogo) OV.jogo.salvar();
  }
  M.animados.push(dt => {
    if (!pesca) return;
    if (!OV.jogo || !OV.jogo.ativo()) return;
    const ps = pesca; ps.t += dt;
    if (Math.hypot(P.pos.x - ps.pq.x, P.pos.z - ps.pq.z) > 3.5 || P.dead) { pesca = null; P.travado = false; return; }
    if (!ps.fisgou && ps.t >= ps.espera) { ps.fisgou = true; ps.janela = 1.1 + nivelAfina() * 0.2; ui.toast('Fisgou! Aperte E agora!'); if (A.bell) A.bell(880, 0.1); OV.jogo.shake(0.08); }
    else if (ps.fisgou) { ps.janela -= dt; if (ps.janela <= 0) { pesca = null; P.travado = false; ui.toast('O peixe escapou. Lance de novo.'); } }
  });

  /* ===================================================================
     7. ANIMAIS: o jumentinho, o cavalo, o cachorro e o pintassilgo
     =================================================================== */
  const ANIMAIS = {
    jumento: { nome: 'Jumentinho', preco: 100, vel: 1.45, alt: 0.72, montaria: true, cor: 0x7a6a5a, esc: 0.9 },
    cavalo: { nome: 'Cavalo', preco: 280, vel: 1.9, alt: 1.05, montaria: true, cor: 0x4a2a1a, esc: 1.2 },
    cachorro: { nome: 'Cachorro', preco: 70 },
    passaro: { nome: 'Pintassilgo', preco: 50 }
  };
  BI.ANIMAIS = ANIMAIS;
  const tem = k => !!(F().animais && F().animais[k]);
  function comprar(k) {
    const a = ANIMAIS[k]; if (den() < a.preco) return;
    P.pers.denarios = den() - a.preco; F().animais = F().animais || {}; F().animais[k] = true;
    if (A.bell) A.bell(659, 0.12);
    if (k === 'jumento' || k === 'cavalo') setTimeout(() => ui.toast(`Você comprou um ${a.nome.toLowerCase()}. Aperte H para montar ou desmontar (longe da luta).`), 400);
    if (k === 'cachorro') { chamarCachorro(); setTimeout(() => ui.toast('O cachorro abana o rabo e vai com você. Ele morde os vícios que chegam perto.'), 400); }
    if (k === 'passaro') { setTimeout(() => ui.toast('O pintassilgo pousa no seu ombro. Ele avisa quando vê um baú escondido por perto.'), 400); }
    OV.jogo.salvar();
  }
  function vendedor(id, nome, x, z, rot, op, k, fala) {
    AV.npc(id, nome, x, z, rot, op);
    MS.ARV[id] = () => {
      const a = ANIMAIS[k];
      return { inicio: 'a', nos: { a: { quem: nome, txt: tem(k) ? fala.tem : fala.oferta, opc: tem(k) ? null : [
        { t: `Comprar o ${a.nome.toLowerCase()} (${a.preco} denários).`, cond: () => den() >= a.preco && !(k === 'cachorro' && P.pers.ordem === 'franciscano' && F().lobo_companheiro), motivo: () => (k === 'cachorro' && F().lobo_companheiro) ? 'o seu irmão lobo ficaria com ciúme' : `você tem ${den()}`, ef: () => comprar(k), ir: 'b' },
        { t: 'Agora não.' }] }, b: { quem: nome, txt: fala.vendido } } };
    };
  }
  vendedor('zacarias', 'Zacarias, o tropeiro', 14, 182, Math.PI, { cor: 0x6a5a3a, cabelo: 0x3a2a1a }, 'jumento', {
    oferta: 'Um jumentinho manso, que conhece todos os caminhos do vale. Foi num jumentinho que Nosso Senhor entrou em Jerusalém, sabia? Não há montaria mais humilde, nem mais honrada.',
    tem: 'Como vai o jumentinho? Dê água a ele, e ele leva você até o fim do mundo. Na Corte das Máscaras vendem cavalos, se um dia quiser algo mais rápido.',
    vendido: 'Trate-o bem. E não monte nele no meio da briga: jumento é corajoso, mas não é burro.' });
  vendedor('ismael', 'Ismael, o mercador de animais', 54, 664, Math.PI * 0.6, { cor: 0x5a3a2a, cabelo: 0x1a1210 }, 'cachorro', {
    oferta: 'Este cachorro foi de um marinheiro que morreu no mar. Ninguém quer ficar com ele, mas é o mais fiel que já vi. Leve-o: ele morde os vícios que chegam perto de você.',
    tem: 'O cachorro está gordo e feliz. Bom sinal: quem tem fome, divide.',
    vendido: 'Ele já escolheu você. Os cães sabem.' });
  vendedor('bonifacio', 'Bonifácio, o estribeiro do Duque', 66, -830, Math.PI * 0.5, { cor: 0x2a3a5a, cabelo: 0x8a6a3a }, 'cavalo', {
    oferta: 'Os cavalos do Duque comem melhor que muita gente desta cidade. Este aqui é dos bons, e o Duque nem sabe que o tem. Venda honesta: o dinheiro vai para os cavalariços, que não recebem há meses.',
    tem: 'O seu cavalo está sendo bem tratado? Ele corre mais que qualquer jumento, mas também cansa mais o bolso.',
    vendido: 'É seu. Aperte os joelhos, e ele entende.' });
  // Aurélio vende o pintassilgo, depois de reaver o canário
  const aur0 = MS.ARV.aurelio;
  MS.ARV.aurelio = function () {
    if (MS.feita('m_canario') && !tem('passaro')) return { inicio: 'a', nos: { a: { quem: 'Aurélio, o mineiro', txt: 'O canário teve filhotes! Bem, não exatamente: este é um pintassilgo que apareceu na gaiola. Esperto como ele só, vê um baú escondido a cem passos. Quer levar?', opc: [
      { t: `Levar o pintassilgo (${ANIMAIS.passaro.preco} denários, para a família do Aurélio).`, cond: () => den() >= ANIMAIS.passaro.preco, motivo: () => `você tem ${den()}`, ef: () => comprar('passaro'), ir: 'b' }, { t: 'Agora não.' }] },
      b: { quem: 'Aurélio, o mineiro', txt: 'Ele canta quando acha alguma coisa. Preste atenção.' } } };
    return aur0 ? aur0() : null;
  };
  // o cachorro é um companheiro de verdade (como o irmão lobo dos franciscanos)
  function chamarCachorro() {
    const Hb = OV.habilidades; if (!Hb || !Hb.chamarLobo) return;
    if (Hb.aliados.some(a => a.permanente)) return;
    const a = Hb.chamarLobo(true); if (!a) return;
    a.cachorro = true; a.g.scale.setScalar(0.72);
    a.g.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material !== a.eye) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(0x8a5a2a), 0.75); } });
    a.dano = 5 + (P.pers ? P.pers.nivel * 1.5 : 0);
  }
  MS.ganchos.aplicar.push(() => { if (tem('cachorro')) setTimeout(() => { if (P.pers && !(P.pers.ordem === 'franciscano' && F().lobo_companheiro)) chamarCachorro(); }, 50); });
  // o pintassilgo: voa em volta e avisa dos baús escondidos
  const passaro = new THREE.Group();
  { const am = sm(0xe8c030), pr = sm(0x1a1a1a); passaro.add(mesh(new THREE.SphereGeometry(0.1, 7, 5), am, 0, 0, 0)); passaro.add(mesh(new THREE.SphereGeometry(0.07, 6, 5), pr, 0, 0.05, 0.09)); { const bico = mesh(new THREE.ConeGeometry(0.025, 0.07, 4), sm(0xe0a060), 0, 0.04, 0.17); bico.rotation.x = Math.PI / 2; passaro.add(bico); }
    BI.asasP = [-1, 1].map(s => { const w = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.09), pr, 0.1 * s, 0.02, 0); passaro.add(w); return w; }); }
  passaro.visible = false; scene.add(passaro);
  let avisoT = 3;
  M.animados.push((dt, t) => {
    const ok = tem('passaro') && OV.jogo && OV.jogo.modo === 'jogo' && P.heroi && P.pos.x < 400;
    passaro.visible = !!ok; if (!ok) return;
    const a = t * 0.9;
    passaro.position.set(P.pos.x + Math.sin(a) * 1.6, P.pos.y + 2.6 + Math.sin(t * 2.3) * 0.25, P.pos.z + Math.cos(a) * 1.6);
    passaro.rotation.y = a + Math.PI / 2; BI.asasP.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(t * 22) * 0.8; });
    avisoT -= dt; if (avisoT > 0 || !OV.jogo.ativo()) return; avisoT = 4;
    const achou = AV.baus.find(b => !(prog().baus || {})[b.id] && !b.id.startsWith('mas_') && Math.hypot(b.x - P.pos.x, b.z - P.pos.z) < 70 && !(F().passaro_viu || {})[b.id] && (!b.cond || b.cond()));
    if (achou) {
      F().passaro_viu = F().passaro_viu || {}; F().passaro_viu[achou.id] = true;
      if (OV.rumo) OV.rumo.revelar(achou.x, achou.z, 16);
      for (let i = 0; i < 4; i++) setTimeout(() => A.bell && A.bell(1900 + Math.random() * 600, 0.03), i * 120);
      const dir = OV.rumo && OV.rumo.rumoTexto ? OV.rumo.rumoTexto(achou.x, achou.z) : 'por perto';
      ui.toast(`O pintassilgo canta: há um baú ${dir}. Ele aparece no seu mapa.`);
    }
  });
  // a montaria
  function modeloMontaria(k) {
    const a = ANIMAIS[k], gr = new THREE.Group(), pelo = sm(a.cor), esc = sm(0x2a1a10), e = a.esc;
    const corpo = mesh(new THREE.BoxGeometry(0.55 * e, 0.55 * e, 1.25 * e), pelo, 0, 0.95 * e, 0); gr.add(corpo);
    const pesc = mesh(new THREE.BoxGeometry(0.28 * e, 0.6 * e, 0.3 * e), pelo, 0, 1.35 * e, 0.62 * e); pesc.rotation.x = -0.5; gr.add(pesc);
    const cab = mesh(new THREE.BoxGeometry(0.26 * e, 0.28 * e, 0.55 * e), pelo, 0, 1.62 * e, 0.88 * e); gr.add(cab);
    [-1, 1].forEach(s => { const o = mesh(new THREE.BoxGeometry(0.06 * e, (k === 'jumento' ? 0.38 : 0.18) * e, 0.08 * e), pelo, 0.1 * s * e, 1.86 * e, 0.72 * e); o.rotation.z = 0.25 * s; gr.add(o); });
    gr.add(mesh(new THREE.BoxGeometry(0.06 * e, 0.4 * e, 0.06 * e), esc, 0, 0.95 * e, -0.66 * e));
    gr.add(mesh(new THREE.BoxGeometry(0.62 * e, 0.12 * e, 0.6 * e), sm(0x7a1a14), 0, 1.25 * e, -0.02));
    const pernas = [[-0.2, 0.45], [0.2, 0.45], [-0.2, -0.45], [0.2, -0.45]].map(([x, z]) => { const p = new THREE.Group(); p.position.set(x * e, 0.72 * e, z * e); p.add(mesh(new THREE.BoxGeometry(0.12 * e, 0.72 * e, 0.12 * e), pelo, 0, -0.36 * e, 0)); p.add(mesh(new THREE.BoxGeometry(0.13 * e, 0.1 * e, 0.15 * e), esc, 0, -0.7 * e, 0.02)); gr.add(p); return p; });
    gr.userData.pernas = pernas;
    return gr;
  }
  const montarias = {};
  P.montado = null;
  const SENTADO = { hL: -1.2, kL: 1.1, fL: 0, hR: -1.2, kR: 1.1, fR: 0 };
  function montar() {
    if (P.montado) { desmontar(); return; }
    const k = tem('cavalo') ? 'cavalo' : tem('jumento') ? 'jumento' : null; if (!k) return;
    if (M.interiorAtual || P.pos.x > 200) { ui.toast('Aqui dentro não dá para montar.'); return; }
    if (I.vivos().some(e => !e.def.fixo && e.state !== 'idle' && Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 12)) { ui.toast('Com vícios em cima de você, não dá para montar.'); return; }
    if (!montarias[k]) { montarias[k] = modeloMontaria(k); scene.add(montarias[k]); }
    P.montado = Object.assign({ k, g: montarias[k], ph: 0, ult: { x: P.pos.x, z: P.pos.z } }, ANIMAIS[k]);
    montarias[k].visible = true; if (A.bell) A.bell(392, 0.06);
  }
  function desmontar() { if (!P.montado) return; P.montado.g.visible = false; P.montado = null; if (P.heroi) P.heroi.g.position.y = P.pos.y; }
  BI.desmontar = desmontar;
  M.animados.push(dt => {
    const m = P.montado; if (!m) return;
    if (!OV.jogo || OV.jogo.modo !== 'jogo' || P.dead || P.atkT > 0 || P.dodgeT > 0 || P.praying || P.castT > 0 || M.interiorAtual || P.pos.x > 200 || viagem) { desmontar(); return; }
    const gm = m.g, mov = Math.hypot(P.pos.x - m.ult.x, P.pos.z - m.ult.z); m.ult.x = P.pos.x; m.ult.z = P.pos.z;
    gm.position.set(P.pos.x, P.pos.y, P.pos.z); gm.rotation.y = P.facing;
    m.ph += mov * 2.6; const amp = Math.min(1, mov / Math.max(0.001, dt) / 4);
    gm.userData.pernas.forEach((p, i) => { p.rotation.x = Math.sin(m.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 * amp; });
    if (P.heroi) { P.heroi.g.position.y = P.pos.y + m.alt + Math.abs(Math.sin(m.ph)) * 0.05 * amp; if (P.heroi.pernas && OV.andar) OV.andar.aplicar(P.heroi.pernas, SENTADO, 1); }
  });
  // a montaria muda a velocidade
  BI.velMontaria = () => P.montado ? P.montado.vel : 1;
  addEventListener('DOMContentLoaded', () => {
    if (!OV.jogo) return;
    const extra0 = OV.jogo.teclaExtra;
    OV.jogo.teclaExtra = code => { if (code === 'KeyH') montar(); else if (extra0) extra0(code); };
    const sair0 = OV.jogo.aoSairMenu;
    OV.jogo.aoSairMenu = () => { desmontar(); pesca = null; viagem = null; P.travado = false; if (sair0) sair0(); };
  });

  /* ===================================================================
     O RESTO: atualização e ligações
     =================================================================== */
  MS.ganchos.update.push(dt => { atualizarMeiodia(dt, performance.now() / 1000); });
  MS.ganchos.aplicar.push(aplicarMeiodia);
  AV.ligarNpcs();
  MS.ganchos.inventario.push(inv => {
    if (F().animais) { const n = Object.keys(F().animais).filter(k => F().animais[k]).map(k => ANIMAIS[k].nome); if (n.length) inv.push('Animais: ' + n.join(', ')); }
    if (F().afinacao) inv.push(`Armas afinadas por Eliaquim (grau ${F().afinacao} de 3)`);
  });
})(window.OV);

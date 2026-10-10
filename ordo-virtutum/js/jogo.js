/* Ordo Virtutum — o jogo: estados, entrada, câmera, Oratórios, mapa, regiões e laço principal */
(function (OV) {
  'use strict';
  const { clamp, lerp, rnd, turnTo } = OV.util;
  const M = OV.mundo, ui = OV.ui;
  if (!M || M.falhou) { ui.semWebGL(); return; }
  const C = OV.combate, P = OV.P, I = OV.inimigos, A = OV.audio, S = OV.save, MP = OV.mapa;
  const canvas = M.renderer.domElement;
  if (M.reassentar) M.reassentar(); // o terreno se acomoda sob as construções

  const J = { modo: 'menu', pausado: false, ficha: false, mapa: false, dialogo: false, diarioAb: false, inv: false, prog: null, shakeV: 0, soberbaTimer: -1, vitoriaTimer: -1, zona: null, zonaT: 0 };
  OV.jogo = J;
  const keys = {}; OV.input = { keys };
  const cam = { yaw: 0, pitch: 0.32 }; OV.cam = cam;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  J.ativo = () => J.modo === 'jogo' && !J.pausado && !J.ficha && !J.mapa && !J.dialogo && !J.diarioAb && !J.inv && !ui.ovAberto();
  const MS = () => OV.missoes, H = OV.habilidades;
  J.entrarDialogo = function () { J.dialogo = true; limparTeclas(); soltar(); ui.prompt(null); };
  J.sairDialogo = function () { J.dialogo = false; limparTeclas(); if (J.modo === 'jogo' && !J.pausado && !ui.ovAberto()) tryLock(); };
  J.mudouLugar = function () { J.zona = null; J.zonaT = 0; P.alvo = null; J.cortarCam = true; };
  J.toggleDiario = function () {
    if (J.modo !== 'jogo' || J.pausado || J.ficha || J.mapa || J.dialogo || P.dead || ui.ovAberto()) return;
    J.diarioAb = !J.diarioAb; limparTeclas(); ui.diario(J.diarioAb);
    if (J.diarioAb) soltar(); else tryLock();
  };
  J.abrirInventario = function (m) {
    if (J.modo !== 'jogo' || J.pausado || J.ficha || J.mapa || J.dialogo || J.diarioAb || P.dead || ui.ovAberto()) return;
    J.inv = true; limparTeclas(); soltar(); OV.itens.abrir(m);
  };
  J.fecharInventario = function () { if (!J.inv) return; J.inv = false; OV.itens.fechar(); limparTeclas(); tryLock(); };
  J.shake = v => { J.shakeV = Math.max(J.shakeV, v); };
  const limparTeclas = () => { for (const k in keys) keys[k] = false; };
  const vicioPerto = r => I.vivos().some(e => Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < r);

  /* ---- ponteiro do mouse ---- */
  let locked = false, lockFailed = false, dragging = false, dragDist = 0, dragBtn = 0;
  function tryLock() {
    if (lockFailed || locked) return;
    try {
      const r = canvas.requestPointerLock();
      if (r && r.catch) r.catch(() => { lockFailed = true; });
    } catch (e) { lockFailed = true; }
  }
  function soltar() { if (document.pointerLockElement) document.exitPointerLock(); }
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas; if (locked) lockFailed = false;
    // o mouse chegou preso no meio de uma fala ou cena (pedido que demorou): solta de novo, sem pausar
    if (locked && (J.dialogo || (OV.cenas && OV.cenas.ativa))) { soltar(); return; }
    const podePausar = () => !J.semPausaAuto && !locked && J.modo === 'jogo' && !J.pausado && !J.ficha && !J.mapa && !J.dialogo && !J.diarioAb && !J.inv && !P.dead && !ui.ovAberto() && !(OV.cenas && OV.cenas.ativa);
    if (podePausar()) setTimeout(() => { if (podePausar()) J.pausar(); }, 180);
  });
  document.addEventListener('pointerlockerror', () => { lockFailed = true; });

  /* ---- progresso ---- */
  function normalizarProg(p) {
    p = p || {};
    p.derrotados = p.derrotados || []; p.soberba = !!p.soberba;
    p.oratorios = p.oratorios || {};
    if (p.oratorio === true) p.oratorios.sabina = true;
    delete p.oratorio;
    if (!p.ultimo || !p.oratorios[p.ultimo]) p.ultimo = p.oratorios.sabina ? 'sabina' : (Object.keys(p.oratorios).find(k => p.oratorios[k]) || null);
    p.visitados = p.visitados || [];
    return p;
  }

  /* ---- menus ---- */
  J.irMenu = function () {
    soltar(); limparTeclas();
    J.modo = 'menu'; J.pausado = false; J.ficha = false; J.mapa = false; J.diarioAb = false; ui.ficha(false); ui.diario(false); MP.fechar();
    if (J.inv) { J.inv = false; OV.itens.fechar(); } OV.itens.limparChao(); P.autoCorrer = false;
    if (OV.dialogo.aberto) OV.dialogo.fechar(); J.dialogo = false; if (OV.cenas) OV.cenas.limpar(); if (I.limparAtaques) I.limparAtaques(); if (H) H.limpar(true); if (OV.aventura) OV.aventura.reiniciar(); if (OV.oficio) OV.oficio.reiniciar(); if (J.aoSairMenu) J.aoSairMenu();
    ui.mostrarHud(false); ui.limparToasts(); I.limpar(); C.limparEfeitos();
    if (P.heroi) P.heroi.g.visible = false;
    ui.menu(S.ler());
  };
  J.iniciarCriacao = function () {
    J.modo = 'criacao'; C.resetAcoes();
    C.posicionar(M.PREVIEW.x, M.PREVIEW.z, Math.PI);
    ui.criacao();
  };
  J.preview = function (sexo, ordem) {
    C.trocarModelo(sexo, ordem); P.heroi.g.visible = true;
    P.heroi.g.position.set(M.PREVIEW.x, 0, M.PREVIEW.z);
  };
  J.professar = function () {
    const d = ui.dadosCriacao(); const o = OV.ORDENS[d.ordem];
    const nome = d.nome || (d.sexo === 'f' ? 'Peregrina' : 'Peregrino');
    const pers = { nome, sexo: d.sexo, ordem: d.ordem, nivel: 1, xp: 0, pontos: 0, virt: Object.assign({}, o.virt) };
    const prog = normalizarProg({});
    S.gravar({ v: 2, pers, prog });
    J.comecar(pers, prog, true);
  };
  J.continuar = function () {
    const s = S.ler(); if (!s || !s.pers) { J.irMenu(); return; }
    J.comecar(s.pers, normalizarProg(s.prog), false);
  };
  J.comecar = function (pers, prog, novo) {
    A.init();
    J.prog = prog; J.soberbaTimer = -1;
    if (OV.tempo) OV.tempo.definir(typeof prog.hora === 'number' ? prog.hora : 8); J.vitoriaTimer = -1; J.zona = null;
    for (const id in M.oratorios) M.oratorios[id].acender(!!prog.oratorios[id]);
    C.resetAcoes(); C.limparEfeitos();
    C.definirPersonagem(pers); OV.itens.preparar(); C.recalcular(); C.restaurar();
    posicionarInicio();
    I.limpar(); spawnHistoria(); horaAnt = null; spawnMundo(true);
    P.morteUsada = false;
    MS().init();
    ui.identidade(pers); ui.montarSlots(); ui.mostrarHud(true); ui.montarHabs(); ui.fecharOv();
    J.modo = 'jogo'; J.pausado = false; J.ficha = false; J.mapa = false; P.heroi.g.visible = true;
    limparTeclas(); tryLock();
    ui.aplicarOpcoes();
    if (novo) { setTimeout(() => ui.toast('Você desce ao Vale de Santa Sabina.'), 900); setTimeout(() => ui.toast('Esc abre o menu. Em Tutoriais estão todos os controles.'), 6500); }
    else setTimeout(() => ui.toast(`Bem-vindo de volta, ${pers.nome}.`), 600);
    MS().evento('inicio');
  };
  function posicionarEm(o) {
    const f = o.facing + Math.PI;
    C.posicionar(o.x, o.z, f); cam.yaw = f + Math.PI; cam.pitch = 0.32;
    if (H) H.trazerAliados(); J.mudouLugar();
  }
  function posicionarInicio() {
    const o = J.prog && J.prog.ultimo && M.oratorios[J.prog.ultimo];
    if (o && J.prog.oratorios[o.id]) posicionarEm(o);
    else { C.posicionar(M.INICIO.x, M.INICIO.z, M.INICIO.facing); cam.yaw = M.INICIO.facing + Math.PI; cam.pitch = 0.3; }
  }
  function spawnHistoria() {
    const der = J.prog.derrotados;
    if (!der.includes('ira')) I.spawn('ira');
    if (!der.includes('preguica')) I.spawn('preguica');
    if (der.includes('ira') && der.includes('preguica') && !J.prog.soberba) I.spawn('soberba', false);
  }
  /* os vícios do mundo vencidos só voltam depois do amanhecer seguinte, e nunca à vista de quem joga */
  const mortosMundo = () => (J.prog.mortosMundo = J.prog.mortosMundo || {});
  J.dia = () => (J.prog && J.prog.diaMundo) || 0;
  const longeDeTodos = (x, z, r) => I.alvos().every(a => Math.hypot(a.pos.x - x, a.pos.z - z) > r);
  function spawnMundo(inicio) {
    if (inicio) I.removerMundo();
    const vivos = new Set(I.lista.filter(e => e.mundo && !e.removed && e.state !== 'dead' && e.state !== 'liberto').map(e => e.mundoIdx));
    const mortos = mortosMundo();
    M.spawnsMundo.forEach(([t, x, z, nivel, variante], i) => {
      if (vivos.has(i)) return;
      if (mortos[i] !== undefined && !(J.dia() > mortos[i])) return; // ainda não amanheceu desde que foi vencido
      if (!inicio && !longeDeTodos(x, z, 60)) return;               // ninguém vê um vício surgir do nada
      delete mortos[i];
      const e = I.spawn(t, false, { x, z }, { nivel, variante, mundo: true }); e.mundo = true; e.mundoIdx = i;
    });
  }
  let horaAnt = null, mundoT = 0;
  function cuidarDoMundo(dt) {
    if (OV.tempo) { const h = OV.tempo.hora; if (horaAnt !== null && ((horaAnt < 6 && h >= 6) || (h < horaAnt - 1 && h >= 6))) J.prog.diaMundo = J.dia() + 1; horaAnt = h; }
    mundoT -= dt; if (mundoT > 0) return; mundoT = 2;
    const mortos = mortosMundo();
    I.lista.forEach(e => { if (e.mundo && e.mundoIdx !== undefined && !e.marcadoMorto && (e.state === 'dead' || e.state === 'liberto')) { e.marcadoMorto = true; mortos[e.mundoIdx] = J.dia(); } });
    spawnMundo(false);
  }
  function resetarHistoria() { I.lista.forEach(e => { if (!e.mundo && e.state !== 'dead' && e.spawnT <= 0) I.resetar(e); }); }

  /* ---- pausa, ficha, mapa, morte ---- */
  J.pausar = function (silencioso) {
    if (J.modo !== 'jogo' || J.pausado) return;
    J.pausado = true; limparTeclas(); soltar(); if (!silencioso) ui.pausa(A.on);
  };
  J.retomar = function () { J.pausado = false; ui.fecharOv(); A.init(); tryLock(); };
  J.toggleFicha = function () {
    if (J.modo !== 'jogo' || J.pausado || J.mapa || J.dialogo || J.diarioAb || P.dead || ui.ovAberto()) return;
    J.ficha = !J.ficha; limparTeclas(); ui.ficha(J.ficha);
    if (J.ficha) soltar(); else tryLock();
  };
  J.toggleMapa = function () {
    if (J.modo !== 'jogo' || J.pausado || J.ficha || J.dialogo || J.diarioAb || P.dead || ui.ovAberto()) return;
    if (!J.mapa && P.pos.x > 200) { ui.toast('O mapa não alcança as profundezas da cripta.'); return; }
    J.mapa = !J.mapa; limparTeclas();
    if (J.mapa) { MP.abrir(); soltar(); } else { MP.fechar(); tryLock(); }
  };
  J.viajar = function (id) {
    const o = M.oratorios[id]; if (!o || !o.aceso) return;
    if (vicioPerto(12)) { ui.toast('Não é possível viajar com vícios por perto.'); return; }
    J.mapa = false; MP.fechar();
    C.resetAcoes(); C.limparEfeitos(); posicionarEm(o);
    ui.toast(`Você chega a ${o.nome}.`); tryLock();
  };
  J.morreu = function () {
    setTimeout(() => { if (J.modo !== 'jogo' || !P.dead) return; soltar(); ui.morte(!!(J.prog.ultimo && J.prog.oratorios[J.prog.ultimo])); }, 1400);
  };
  // parcial: no co-op, quando o colega continua lutando, a luta dele não recomeça
  J.renascer = function (parcial) {
    J.mapa = false; MP.fechar(); J.ficha = false; ui.ficha(false);
    C.resetAcoes(); C.restaurar(); C.limparEfeitos(); posicionarInicio();
    if (parcial !== true) resetarHistoria();
    P.morteUsada = false;
    if (H) { H.limpar(false); H.trazerAliados(); }
    if (parcial !== true) MS().evento('renascer');
    ui.fecharOv(); J.pausado = false; tryLock();
  };
  J.reiniciarLutas = function () { resetarHistoria(); MS().evento('renascer'); };

  /* ---- vícios vencidos ---- */
  J.salvar = function () { if (OV.tempo) J.prog.hora = Math.round(OV.tempo.hora * 100) / 100; if (OV.rumo && OV.rumo.salvarAgora && J.modo === 'jogo') OV.rumo.salvarAgora(); return S.gravar({ v: 2, pers: P.pers, prog: J.prog }); };
  J.vicioVencido = function (e) {
    if (e.mundo) return;
    const k = e.def.key;
    if (!J.prog.derrotados.includes(k)) J.prog.derrotados.push(k);
    if (k === 'soberba') { J.prog.soberba = true; J.salvar(); A.bell(262, 0.3); setTimeout(() => MS().evento('soberba'), 1500); }
    const der = J.prog.derrotados;
    if (der.includes('ira') && der.includes('preguica') && !J.prog.soberba && !I.lista.some(x => x.def.key === 'soberba') && J.soberbaTimer < 0) J.soberbaTimer = 2.5;
  };

  /* ---- interação e Oratórios ---- */
  J.interagir = function () {
    if (!J.ativo() || P.dead || P.oratT > 0) return;
    const i = M.interativoProximo(P.pos.x, P.pos.z); if (i) i.acao();
  };
  J.usarOratorio = function (o, direto) {
    if (vicioPerto(9)) { ui.toast('Os vícios estão perto demais para rezar em paz.'); return; }
    if (!direto && J.prog.oratorios[o.id] && OV.tempo) { menuOratorio(o); return; }
    P.oratT = 1.6; P.oratAlvo = o; P.atkT = 0; P.alvo = null; P.praying = false;
    C.posicionar(o.x, o.z, o.facing); ui.fecharFala();
  };
  function menuOratorio(o) {
    const T = OV.tempo; let escolha = null;
    OV.dialogo.abrir({ inicio: 'a', nos: { a: {
      quem: o.nome,
      txt: () => `${T.horaCanonica()}, ${String(Math.floor(T.hora)).padStart(2, '0')}h. A vela arde diante do ícone. O que deseja fazer?`,
      depois: () => {
        if (!escolha || J.modo !== 'jogo') return;
        if (escolha !== 'rezar') {
          T.descansar(escolha); ui.clarao('#0a0608');
          J.descanso = escolha === 'manha' ? 'Você reza as Completas, dorme junto ao Oratório e desperta com as Laudes.' : 'Você reza e vela em silêncio até as Vésperas.';
        }
        J.usarOratorio(o, true);
      },
      opc: [
        { t: 'Dar esmola e pedir a libertação da Avareza', mostrar: () => !!P.status.avareza, ef: () => { const d = Math.min(5, P.pers.denarios || 0); P.pers.denarios = (P.pers.denarios || 0) - d; delete P.status.avareza; MS().ato('caridade'); ui.toast(d ? `Você deu ${d} denários aos pobres. A Avareza soltou a sua mão.` : 'Você não tem moedas, mas oferece o que tem. A Avareza soltou a sua mão.'); A.bell(587, 0.14); }, ir: 'a' },
        { t: 'Rezar e guardar o progresso', ef: () => { escolha = 'rezar'; } },
        { t: 'Rezar e descansar até o amanhecer', mostrar: () => !(T.hora >= 5 && T.hora < 9), ef: () => { escolha = 'manha'; } },
        { t: 'Rezar e velar até o anoitecer', mostrar: () => !(T.hora >= 18.5 && T.hora < 22), ef: () => { escolha = 'noite'; } },
        { t: 'Seguir caminho' }
      ] } } });
  }
  J.usarCapela = function (c) {
    if (vicioPerto(9)) { ui.toast('Os vícios estão perto demais para rezar em paz.'); return; }
    P.oratT = 1.2; P.oratAlvo = c; P.atkT = 0; P.alvo = null; P.praying = false;
    C.posicionar(c.x, c.z, c.facing); ui.fecharFala();
  };
  J.oratorioConcluido = function () {
    const o = P.oratAlvo; if (!o) return;
    if (o.capela) { P.oratAlvo = null; J.salvar(); A.bell(440, 0.18); J.abrirInventario('bau'); return; }
    const primeiraVez = !J.prog.oratorios[o.id];
    const primeiroDeTodos = !Object.keys(J.prog.oratorios).some(k => J.prog.oratorios[k]);
    J.prog.oratorios[o.id] = true; J.prog.ultimo = o.id; o.acender(true);
    C.restaurar(); resetarHistoria(); P.morteUsada = false; // rezar não faz os vícios vencidos voltarem
    const ok = J.salvar(); A.bell(392, 0.25);
    MS().evento('oratorio', o.id);
    if (!ok) ui.toast('Vida e Fé restauradas. Este navegador não permite guardar o progresso.');
    else if (J.descanso) { ui.toast(J.descanso); J.descanso = null; }
    else ui.toast(primeiraVez ? `Você acendeu a vela: ${o.nome}. O progresso foi guardado.` : 'Vida e Fé restauradas. O progresso foi guardado.');
    if (primeiroDeTodos) setTimeout(() => ui.toast('No mapa (M) você pode viajar entre os Oratórios acesos.'), 3000);
  };

  /* ---- regiões ---- */
  // a música de cada lugar: chefão perto → tema do chefão; dentro do palácio ou de uma igreja → o tema do interior
  function temaAgora(z) {
    if (I.CHEFES) for (const e of I.lista) {
      if (!I.CHEFES.has(e.def.key) || e.state === 'dead' || e.state === 'liberto' || e.state === 'idle') continue;
      if (Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) < 32) return 'chefe';
    }
    const it = M.interiorAtual;
    if (it && it.nome) {
      if (/Palácio/.test(it.nome)) return 'palacio';
      if (/Igreja|Capela|Catedral|Basílica|Mosteiro/.test(it.nome)) return 'capela';
    }
    return A.temaDoLugar(z);
  }
  function atualizarZona(dt) {
    J.zonaT -= dt; if (J.zonaT > 0) return; J.zonaT = 0.3;
    const z = M.zonaEm(P.pos.x, P.pos.z);
    if (A.tema && !(OV.cenas && OV.cenas.ativa)) A.tema(temaAgora(z));
    if (z === J.zona) return;
    const antes = J.zona; J.zona = z;
    const nome = M.nomeZona(z); ui.local(M.interiorAtual && M.interiorAtual.nome ? M.interiorAtual.nome : nome);
    MS().evento('zona', z);
    if (z !== 'vale' && !J.prog.visitados.includes(z)) J.prog.visitados.push(z);
    const agora = performance.now(), saidas = J.saidasZona || (J.saidasZona = {});
    if (antes) saidas[antes] = agora;
    const grande = z !== 'vale' || antes === null;
    const faz = saidas[z] === undefined || agora - saidas[z] > 5 * 60 * 1000;
    if (grande && faz && !(antes === 'claustro' && z === 'mosteiro') && !(antes === 'mosteiro' && z === 'claustro' && J.prog.visitados.length > 1)) ui.banner(nome);
  }

  /* ---- cliques nas sobreposições ---- */
  document.getElementById('ov').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    A.init();
    if (act === 'continuar') J.continuar();
    else if (act === 'novo') { const s = S.ler(); if (s && s.pers) ui.confirmarNovo(s); else J.iniciarCriacao(); }
    else if (act === 'apagar-e-criar') { S.apagar(); J.iniciarCriacao(); }
    else if (act === 'menu') J.irMenu();
    else if (act === 'professar') J.professar();
    else if (act === 'retomar') J.retomar();
    else if (act === 'musica') { A.toggle(); ui.pausa(A.on); }
    else if (act === 'salvar') { const ok = J.salvar(); ui.pausaNota(ok ? 'Jogo salvo. Ao continuar, você desperta no último Oratório em que rezou.' : 'Este navegador não permite guardar o progresso.'); A.bell(392, 0.14); }
    else if (act === 'opcoes') ui.pausa(A.on, 'opcoes');
    else if (act === 'tutoriais') ui.pausa(A.on, 'tutoriais');
    else if (act === 'pausa-menu') ui.pausa(A.on);
    else if (act === 'missoes') { J.pausado = false; ui.fecharOv(); J.toggleDiario(); }
    else if (act === 'renascer') J.renascer();
  });

  /* ---- teclado e mouse ---- */
  addEventListener('keydown', e => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') { if (e.code === 'Enter' && J.modo === 'criacao') J.professar(); return; }
    if (J.modo === 'jogo' && ['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (J.modo === 'jogo' && OV.dialogo.aberto) { if (!e.repeat) OV.dialogo.tecla(e.code); e.preventDefault(); return; }
    keys[e.code] = true;
    if (e.repeat || J.modo !== 'jogo') return;
    if (e.code === 'Escape' && J.inv) { J.fecharInventario(); return; }
    if (e.code === 'KeyI') { if (J.inv) J.fecharInventario(); else J.abrirInventario('inv'); return; }
    if (J.inv) return;
    if (e.code === 'Escape') { if (J.mapa) J.toggleMapa(); else if (J.ficha) J.toggleFicha(); else if (J.diarioAb) J.toggleDiario(); else if (!locked && !ui.ovAberto()) J.pausar(); return; }
    if (ui.ovAberto() || J.pausado) return;
    if (e.code === 'KeyM') { J.toggleMapa(); return; }
    if (J.mapa) { MP.tecla(e.code); return; }
    if (e.code === 'KeyL') { J.toggleDiario(); return; }
    if (J.diarioAb) return;
    if (e.code === 'KeyC') { J.toggleFicha(); return; }
    if (J.ficha) return;
    if (['KeyQ', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'KeyF', 'KeyG', 'KeyV', 'KeyB'].includes(e.code)) ui.marcarUso();
    switch (e.code) {
      case 'Space': C.esquivar(); break;
      case 'KeyQ': C.sinal(); break;
      case 'Digit1': C.orar(1); break;
      case 'Digit2': C.orar(2); break;
      case 'Digit3': C.orar(3); break;
      case 'Digit4': C.orar(4); break;
      case 'Digit5': OV.itens.usar('pao'); break;
      case 'Digit6': OV.itens.usar('agua'); break;
      case 'KeyT': P.autoCorrer = !P.autoCorrer; ui.toast(P.autoCorrer ? 'Corrida contínua ligada (T desliga).' : 'Corrida contínua desligada.'); break;
      case 'Tab': C.lockToggle(); break;
      case 'KeyE': J.interagir(); break;
      case 'KeyF': H.usar('F'); break;
      case 'KeyG': H.usar('G'); break;
      case 'KeyV': H.usar('V'); break;
      case 'KeyB': H.usar('B'); break;
      case 'KeyJ': C.atacar(false); break;
      case 'KeyK': C.atacar(true); break;
      case 'Digit7': OV.itens.usar('pergaminho'); break;
      default: if (J.teclaExtra) J.teclaExtra(e.code);
    }
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', limparTeclas);
  addEventListener('mousemove', e => {
    if (J.modo !== 'jogo' || !J.ativo()) return;
    const sv = (ui.opcoes && ui.opcoes.sens) || 1;
    if (locked) { if (!P.alvo) cam.yaw -= e.movementX * 0.0025 * sv; cam.pitch = clamp(cam.pitch + e.movementY * 0.002 * sv, -0.15, 0.9); }
    else if (dragging) { dragDist += Math.abs(e.movementX) + Math.abs(e.movementY); if (!P.alvo) cam.yaw -= e.movementX * 0.005 * sv; cam.pitch = clamp(cam.pitch + e.movementY * 0.004 * sv, -0.15, 0.9); }
  });
  canvas.addEventListener('mousedown', e => {
    if (!J.ativo()) return;
    if (locked) { if (e.button === 0) C.atacar(false); else if (e.button === 2) C.atacar(true); }
    else {
      // um clique na tela recaptura o mouse (depois do Esc o navegador às vezes recusa a primeira tentativa: tenta de novo a cada clique)
      recaptura = !lockFailed; lockFailed = false; tryLock();
      dragging = true; dragDist = 0; dragBtn = e.button;
    }
  });
  let recaptura = false;
  addEventListener('mouseup', () => { if (dragging) { dragging = false; if (dragDist < 6 && !recaptura && !locked) C.atacar(dragBtn === 2); recaptura = false; } });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  /* ---- câmera ---- */
  const camTarget = new THREE.Vector3(), camDesired = new THREE.Vector3();
  let tempo = 0;
  J.atualizarCamera = dt => atualizarCamera(dt);
  function atualizarCamera(dt) {
    const camera = M.camera;
    if (J.modo === 'menu') {
      cam.yaw += dt * 0.05;
      camTarget.set(0, 1.9, 0);
      camDesired.set(Math.sin(cam.yaw) * 9.5, 3.6, Math.cos(cam.yaw) * 9.5);
      camera.position.lerp(camDesired, 1 - Math.exp(-3 * dt)); camera.lookAt(camTarget); return;
    }
    if (J.modo === 'criacao') {
      const x = M.PREVIEW.x, z = M.PREVIEW.z;
      camDesired.set(x + 1.35, 1.55, z - 4.6); camTarget.set(x + 1.35, 1.1, z);
      camera.position.lerp(camDesired, 1 - Math.exp(-4 * dt)); camera.lookAt(camTarget); return;
    }
    if (OV.cenas && OV.cenas.camera(camera, dt)) return; // uma cena manda na câmera
    // a Luxúria deixa a câmera instável
    if (P.status && P.status.luxuria) { cam.yaw += Math.sin(tempo * 1.7) * 0.42 * dt; cam.pitch = clamp(cam.pitch + Math.cos(tempo * 1.3) * 0.16 * dt, -0.15, 0.9); }
    if (P.alvo) {
      const t = P.alvo.g.position;
      const want = Math.atan2(P.pos.x - t.x, P.pos.z - t.z);
      cam.yaw = turnTo(cam.yaw, want, 4 * dt);
      cam.pitch = lerp(cam.pitch, 0.25, 1 - Math.exp(-3 * dt));
    }
    const dist = 6.6, cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw), off = 0.7;
    camTarget.set(P.pos.x + rx * off, P.pos.y + 2.05 + (P.heroi ? P.heroi.body.position.y * 0.6 : 0), P.pos.z + rz * off); // o centro da câmera um pouco acima do herói: mais campo de visão
    camDesired.set(camTarget.x + Math.sin(cam.yaw) * cp * dist, camTarget.y + sp * dist + 0.3, camTarget.z + Math.cos(cam.yaw) * cp * dist);
    if (Math.abs(P.pos.x) < 16.4 && Math.abs(P.pos.z) < 16.4) {
      // dentro do claustro a câmera não atravessa as galerias: se for preciso, chega mais perto pelo mesmo ângulo
      // (antes ela só era empurrada para dentro e acabava olhando de cima para baixo, colada no herói)
      const L = 14.4, dx = camDesired.x - camTarget.x, dy = camDesired.y - camTarget.y, dz = camDesired.z - camTarget.z;
      let k = 1;
      if (Math.abs(camDesired.x) > L && Math.abs(dx) > 1e-4) k = Math.min(k, (Math.sign(dx) * L - camTarget.x) / dx);
      if (Math.abs(camDesired.z) > L && Math.abs(dz) > 1e-4) k = Math.min(k, (Math.sign(dz) * L - camTarget.z) / dz);
      k = clamp(k, 0.34, 1);
      camDesired.set(camTarget.x + dx * k, camTarget.y + Math.max(0.35, dy * k), camTarget.z + dz * k);
    }
    M.recuarCamera(camTarget, camDesired);
    if (P.pos.x > 200) camDesired.y = Math.min(camDesired.y, OV.cripta.teto(camDesired.x, camDesired.z) - 0.5);
    camDesired.y = Math.max(camDesired.y, M.altura(camDesired.x, camDesired.z) + 0.6);
    if (J.cortarCam) { camera.position.copy(camDesired); J.cortarCam = false; }
    else camera.position.lerp(camDesired, 1 - Math.exp(-12 * dt));
    if (J.shakeV > 0 && !reduceMotion) { camera.position.x += rnd(-1, 1) * J.shakeV * 0.25; camera.position.y += rnd(-1, 1) * J.shakeV * 0.25; }
    J.shakeV = Math.max(0, J.shakeV - dt * 1.6);
    camera.lookAt(camTarget);
  }

  /* ---- ondas e vitória ---- */
  function atualizarOndas(dt) {
    if (J.soberbaTimer >= 0) {
      J.soberbaTimer -= dt;
      if (J.soberbaTimer < 0) {
        const sb = I.spawn('soberba', !OV.cenas); A.bell(196, 0.3); J.shake(0.4);
        if (OV.cenas) OV.cenas.poema('soberba', { e: sb }, () => ui.toast('Algo se ergue diante dos vitrais…')); else ui.toast('Algo se ergue diante dos vitrais…');
      }
    }
    if (J.vitoriaTimer >= 0) {
      J.vitoriaTimer -= dt;
      if (J.vitoriaTimer < 0) { J.pausado = true; soltar(); ui.vitoria(); }
    }
  }

  /* passo de simulação usado por testes automáticos */
  // o mundo segue vivo? No jogo solo, só quando nenhuma tela está aberta; no co-op, as telas não param o mundo (coop.js)
  J.mundoVivo = () => J.ativo();
  J.passo = function (dt) { if (!J.mundoVivo()) return; C.update(dt); I.update(dt); atualizarOndas(dt); atualizarZona(dt); MS().update(dt); if (OV.rumo) OV.rumo.update(dt); cuidarDoMundo(dt); };

  /* ---- laço ---- */
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tempo += dt;
    const vivo = J.mundoVivo();
    let fx = 0, fz = 0;
    if (J.modo === 'jogo') {
      if (vivo) { C.update(dt); I.update(dt); atualizarOndas(dt); atualizarZona(dt); MS().update(dt); if (OV.rumo) OV.rumo.update(dt); cuidarDoMundo(dt); }
      C.animarHeroi(vivo ? dt : 0);
      const it = J.ativo() && !P.dead && P.oratT <= 0 ? M.interativoProximo(P.pos.x, P.pos.z) : null;
      ui.prompt(it ? `<kbd>E</kbd> ${ui.esc(it.texto())}` : null);
      if (J.mapa) MP.desenhar();
      fx = P.pos.x; fz = P.pos.z;
    } else if (J.modo === 'criacao' && P.heroi) {
      P.moveAmt = 0; C.animarHeroi(dt, true);
      P.heroi.g.rotation.y = Math.PI + Math.sin(tempo * 0.6) * 0.45;
      fx = M.PREVIEW.x; fz = M.PREVIEW.z;
    }
    M.ambient(dt, fx, fz);
    atualizarCamera(dt);
    ui.rotulos(I.lista, M.camera, P, J.modo === 'jogo');
    if (!J.mapa) M.renderer.render(M.scene, M.camera); // com o mapa aberto, a cena fica escondida atrás dele
    if (J.modo === 'jogo') { ui.hud(P); if (OV.rumo) OV.rumo.desenharHud(dt); }
    // a Luxúria turva a visão
    const turvo = J.modo === 'jogo' && P.status && P.status.luxuria ? 1 : 0;
    if (turvo !== J.turvo) { J.turvo = turvo; M.renderer.domElement.style.filter = turvo ? 'blur(2.4px) saturate(1.35) brightness(1.08)' : ''; }
  }

  J.irMenu();
  requestAnimationFrame(frame);
})(window.OV);

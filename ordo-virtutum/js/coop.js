/* Ordo Virtutum — o co-op para até 4 jogadores.
   · O servidor (server.js) só junta os navegadores numa sala e repassa as mensagens.
   · O ANFITRIÃO (quem cria a sala) é dono do mundo: só no navegador dele os vícios pensam, os sorteios
     acontecem, as missões andam e o jogo é salvo. Com dois jogadores, os vícios têm 2,5x de vida e de dano;
     com três ou quatro, 3,5x. Quem já estava no mundo se ajusta quando alguém entra ou sai.
   · Até três CONVIDADOS: cada um vê os outros, e todos acompanham o anfitrião.
   · O CONVIDADO leva o próprio personagem: anda, luta e reza por conta própria; os golpes dele vão para o
     anfitrião, e os vícios, as falas, as cenas e a hora vêm do anfitrião. Ganha XP, moedas e itens próprios,
     e salva só o personagem (o mundo dele fica intacto).
   · As telas (inventário, ficha, mapa, diário, menus) não param o mundo no co-op. As conversas e as cenas,
     que os dois veem juntos, param os dois; quem conduz é o anfitrião.
   · Os dois andam juntos: barco, viagem e masmorra levam o convidado junto com o anfitrião. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.jogo) return;
  const P = OV.P, C = OV.combate, I = OV.inimigos, ui = OV.ui, D = OV.dialogo, S = OV.save, A = OV.audio;
  const J = OV.jogo, MS = () => OV.missoes, HI = () => OV.historia;
  const { turnTo, lerp } = OV.util;
  const $ = id => document.getElementById(id);
  const esc = s => ui.esc(String(s));
  const VERSAO = '25';
  const MULT2 = 2.5, MULT34 = 3.5, VAGAS = 4;

  const CO = { papel: null, codigo: null, ficha: null, ws: null, conectado: false, colegaOn: false, colegaNome: '', seq: 0, atkSeq: 0, mundoHost: null, espelho: false, slot: 0, on: new Set(), nomes: {} };
  OV.coop = CO;
  CO.VERSAO = VERSAO;
  CO.ativo = () => !!CO.papel;
  CO.anfitriao = () => CO.papel === 'anfitriao';
  CO.convidado = () => CO.papel === 'convidado';
  // quantos estão na sala agora (o próprio jogador incluído)
  CO.jogadores = () => (CO.ativo() ? 1 + CO.on.size : 1);
  CO.multiplicador = () => (CO.anfitriao() ? (CO.jogadores() >= 3 ? MULT34 : MULT2) : 1);
  const nomeDe = k => CO.nomes[k] || (k === 0 ? 'o anfitrião' : 'um colega');
  // os nomes dos outros, por extenso: "Alex", "Alex e Gusta", "Alex, Gusta e Lia"
  const listaNomes = ks => { const n = ks.map(nomeDe); return n.length <= 1 ? (n[0] || '') : n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1]; };
  function recalcularColegas() {
    if (CO.anfitriao()) { CO.colegaOn = CO.on.size > 0; CO.colegaNome = listaNomes([...CO.on].sort()); }
    else if (CO.convidado()) { CO.colegaOn = CO.on.has(0); CO.colegaNome = CO.nomes[0] || CO.colegaNome; }
  }
  // o co-op só existe quando o jogo vem do próprio servidor (no Render, ou rodando o server.js no computador)
  CO.disponivel = () => /^https?:$/.test(location.protocol) && !/claude\.ai|claude\.site|claudeusercontent|anthropic/.test(location.host);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const r2 = v => Math.round(v * 100) / 100;

  /* =====================================================================
     A CONEXÃO COM O SERVIDOR
     ===================================================================== */
  const urlWs = () => (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  // o plano grátis do Render dorme: a primeira visita o acorda, e isso leva até um minuto
  async function acordar(aviso) {
    const t0 = Date.now();
    while (Date.now() - t0 < 110000) {
      try { const r = await fetch('/saude', { cache: 'no-store' }); if (r.ok && (await r.text()).trim() === 'ok') return true; } catch (e) { /* ainda dormindo */ }
      if (aviso) aviso(Math.round((Date.now() - t0) / 1000));
      await sleep(2500);
    }
    return false;
  }
  function abrirWs() {
    return new Promise((ok, falha) => {
      let ws; try { ws = new WebSocket(urlWs()); } catch (e) { falha(e); return; }
      const t = setTimeout(() => { try { ws.close(); } catch (e) { /* nada */ } falha(new Error('tempo')); }, 15000);
      ws.onopen = () => { clearTimeout(t); ok(ws); };
      ws.onerror = () => { clearTimeout(t); falha(new Error('erro')); };
    });
  }
  function ligar(ws) {
    CO.ws = ws; CO.conectado = true;
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } receber(m); };
    ws.onclose = () => { if (CO.ws !== ws) return; CO.conectado = false; CO.ws = null; if (CO.papel && !CO.saindo) reconectar(); atualizarTag(); };
  }
  CO.enviar = m => { if (CO.ws && CO.ws.readyState === 1) CO.ws.send(JSON.stringify(m)); };
  setInterval(() => { if (CO.conectado) CO.enviar({ t: 'ping' }); }, 20000);

  let reconectando = false;
  async function reconectar() {
    if (reconectando) return; reconectando = true;
    const t0 = Date.now();
    aviso('A conexão caiu. Tentando voltar à sala…');
    while (CO.papel && !CO.saindo && Date.now() - t0 < 4 * 60 * 1000) {
      await acordar();
      try {
        const ws = await abrirWs(); ligar(ws);
        CO.enviar({ t: 'voltar', codigo: CO.codigo, papel: CO.papel, ficha: CO.ficha, versao: VERSAO, nome: P.pers ? P.pers.nome : '' });
        const r = await esperar(m => m.t === 'sala' || m.t === 'erro', 8000);
        if (r && r.t === 'sala') {
          reconectando = false; aviso('De volta à sala ' + CO.codigo + '.');
          // quem está na sala agora (alguém pode ter entrado ou saído enquanto a conexão esteve fora)
          const agora = new Set((r.jogadores || []).map(j => j.slot));
          [...CO.on].forEach(k => { if (!agora.has(k)) aoColegaSair(k); });
          (r.jogadores || []).forEach(j => aoColegaEntrar(j.slot, j.nome, true, true));
          if (typeof r.slot === 'number') CO.slot = r.slot;
          atualizarTag(); return;
        }
        if (r && r.semSala && CO.anfitriao()) {
          // o servidor reiniciou: o anfitrião recria a sala (com o mesmo código, se ainda estiver livre)
          CO.enviar({ t: 'criar', codigo: CO.codigo, versao: VERSAO, nome: P.pers ? P.pers.nome : '' });
          const r2_ = await esperar(m => m.t === 'sala' || m.t === 'erro', 8000);
          if (r2_ && r2_.t === 'sala') { reconectando = false; aviso(r2_.codigo === CO.codigo ? 'Sala recriada: ' + CO.codigo + '.' : 'Sala recriada com um código novo: ' + r2_.codigo + '. Passe ao seu colega.'); CO.codigo = r2_.codigo; CO.ficha = r2_.ficha; atualizarTag(); return; }
        }
        try { ws.close(); } catch (e) { /* nada */ }
      } catch (e) { /* tenta de novo */ }
      await sleep(3000);
    }
    reconectando = false;
    if (CO.papel && !CO.saindo) { aviso('Não foi possível voltar à sala. O co-op terminou.'); encerrar(true); }
  }
  // espera uma mensagem específica do servidor
  const esperas = [];
  function esperar(teste, ms) {
    return new Promise(ok => { const w = { teste, ok }; esperas.push(w); setTimeout(() => { const i = esperas.indexOf(w); if (i >= 0) { esperas.splice(i, 1); ok(null); } }, ms); });
  }

  /* =====================================================================
     O COLEGA NA TELA (o mesmo estado que o próprio peregrino usa para se animar)
     ===================================================================== */
  // v25: cada colega na sala é um "remoto" (o mesmo estado que o próprio peregrino usa para se animar), pela vaga
  const REM = new Map();
  function remDe(k) {
    let R = REM.get(k); if (R) return R;
    R = { remoto: true, slot: k, pos: new THREE.Vector3(), alvo: null, facing: 0, heroi: null, dead: false, oculto: 0, vel: { x: 0, z: 0 },
      atkT: 0, atkDur: 0.5, atkPesado: false, dodgeT: 0, praying: false, prayT: 0, oratT: 0, castT: 0, castKind: null, signT: 0, parryFlash: 0, flash: 0,
      correndo: false, carga: null, velaMao: false, arma: null, ocupado: null, nome: '', ordem: null, sexo: null, nivel: 1, hp: 1, mhp: 1, visto: 0, ad: 0, longeT: 0 };
    R.rotulo = document.createElement('div'); R.rotulo.className = 'coop-nome'; R.rotulo.hidden = true; document.body.appendChild(R.rotulo);
    REM.set(k, R); return R;
  }
  CO.remotos = () => [...REM.values()];
  // o colega "principal": para o convidado, o anfitrião; para o anfitrião, o primeiro convidado
  Object.defineProperty(CO, 'R', { get: () => (CO.convidado() ? remDe(0) : remDe([...CO.on].sort()[0] || 1)) });
  const recente = Q => Q.visto && performance.now() - Q.visto < 6000;
  const presentes = () => CO.remotos().filter(Q => CO.on.has(Q.slot) && Q.heroi && recente(Q));
  CO.alvosRemotos = () => (CO.anfitriao() && CO.colegaOn && J.modo === 'jogo' ? presentes().filter(Q => Q.slot > 0) : []);
  function tirarColega(R) {
    if (!R) return;
    if (OV.aventura && OV.aventura.soltarDe) OV.aventura.soltarDe(R);
    if (OV.biblicas && OV.biblicas.montariaDe) OV.biblicas.montariaDe(R, null, 0);
    if (R.heroi) { M.scene.remove(R.heroi.g); R.heroi = null; }
    R.visto = 0; R.ocupado = null; R.dead = false; R.rotulo.hidden = true;
  }
  const tirarTodos = () => CO.remotos().forEach(tirarColega);
  function receberEu(m) {
    if (!m.ordem || !OV.ORDENS[m.ordem]) return;
    const R = remDe(m.de || 0);
    if (!R.heroi || R.ordem !== m.ordem || R.sexo !== m.sexo) {
      if (R.heroi) M.scene.remove(R.heroi.g);
      R.heroi = OV.criarHeroi(m.sexo, m.ordem); M.scene.add(R.heroi.g);
      R.ordem = m.ordem; R.sexo = m.sexo; R.arma = OV.ARMAS[OV.ORDENS[m.ordem].arma];
      R.pos.set(m.x, m.y, m.z); R.heroi.g.position.copy(R.pos);
    }
    const ant = R.alvo;
    R.alvo = { x: m.x, y: m.y, z: m.z };
    if (ant) { R.vel.x = (m.x - ant.x) * 10; R.vel.z = (m.z - ant.z) * 10; if (Math.hypot(R.vel.x, R.vel.z) > 20) R.vel.x = R.vel.z = 0; }
    if (!R.visto || Math.hypot(m.x - R.pos.x, m.z - R.pos.z) > 10) { R.pos.set(m.x, m.y, m.z); if (R.heroi) R.heroi.g.position.copy(R.pos); }
    R.visto = performance.now();
    const caiuAgora = !!m.dead && !R.dead;
    R.facingAlvo = m.f; R.correndo = !!m.cr; R.dead = !!m.dead; R.praying = !!m.pr; R.oratT = m.or ? 1 : 0; R.prayT = m.pr ? 2 : 0;
    if (m.ad !== R.ad) { R.ad = m.ad; R.atkDur = m.adur || 0.5; R.atkT = R.atkDur; R.atkPesado = !!m.ap; }
    R.dodgeT = m.dg ? Math.max(R.dodgeT, 0.25) : 0; R.castT = m.ck ? Math.max(R.castT, 0.4) : R.castT; R.castKind = m.ck || R.castKind; R.signT = m.sg ? Math.max(R.signT, 0.3) : R.signT;
    R.velaMao = !!m.vm; R.oculto = m.ocl ? 1 : 0; R.cargaProp = m.cg || null; R.montaK = m.mt || null;
    // as lutas recomeçam só quando todos caíram (ou o anfitrião já tinha despertado longe)
    if (CO.anfitriao() && caiuAgora && J.modo === 'jogo' && (P.dead || CO.separados) && !presentes().some(Q => !Q.dead)) setTimeout(() => { if (J.modo === 'jogo' && J.reiniciarLutas && !presentes().some(Q => !Q.dead)) J.reiniciarLutas(); }, 3200);
    R.ocupado = m.oc || null; R.nome = m.nome || nomeDe(R.slot); R.nivel = m.nivel || 1; R.hp = m.hp; R.mhp = m.mhp || 1;
    if (m.nome && CO.nomes[R.slot] !== m.nome) { CO.nomes[R.slot] = m.nome; recalcularColegas(); }
  }
  M.animados.push(dt => { for (const R of REM.values()) animarColega(R, dt); });
  function animarColega(R, dt) {
    const rotulo = R.rotulo;
    if (!R.heroi) { rotulo.hidden = true; return; }
    const vis = CO.ativo() && CO.on.has(R.slot) && J.modo === 'jogo' && recente(R);
    const telaLocal = J.inv || J.ficha || J.mapa || J.diarioAb || J.pausado || ui.ovAberto() || D.aberto || !!motivoLocal();
    R.heroi.g.visible = !!vis; rotulo.hidden = !vis || telaLocal || P.dead;
    if (!vis) return;
    if (R.alvo) {
      const k = 1 - Math.exp(-12 * dt);
      R.pos.x += (R.alvo.x - R.pos.x) * k; R.pos.z += (R.alvo.z - R.pos.z) * k; R.pos.y += (R.alvo.y - R.pos.y) * k;
    }
    R.facing = turnTo(R.facing, R.facingAlvo || 0, 14 * dt);
    R.atkT = Math.max(0, R.atkT - dt); R.dodgeT = Math.max(0, R.dodgeT - dt); R.castT = Math.max(0, R.castT - dt); R.signT = Math.max(0, R.signT - dt);
    if (OV.aventura && OV.aventura.porNaMaoDe) OV.aventura.porNaMaoDe(R, R.dead ? null : R.cargaProp);
    C.animarHeroi(dt, false, R);
    if (OV.biblicas && OV.biblicas.montariaDe) OV.biblicas.montariaDe(R, R.dead ? null : R.montaK, dt);
    // o nome do colega, flutuando sobre a cabeça
    const v = new THREE.Vector3(R.pos.x, R.pos.y + 2.55, R.pos.z).project(M.camera);
    const cv = M.renderer.domElement.getBoundingClientRect();
    if (v.z > 1 || v.z < -1 || rotulo.hidden) { rotulo.hidden = true; return; }
    rotulo.style.transform = `translate(${Math.round(cv.left + (v.x + 1) / 2 * cv.width)}px, ${Math.round(cv.top + (1 - v.y) / 2 * cv.height)}px) translate(-50%, -100%)`;
    const pct = Math.max(0, Math.min(100, Math.round(100 * (R.hp || 0) / (R.mhp || 1))));
    rotulo.innerHTML = `<b>${esc(R.nome)}</b> <small>nv ${R.nivel}</small><i><u style="width:${pct}%"></u></i>${R.dead ? '<em>caído</em>' : ''}`;
  }

  /* =====================================================================
     O QUE CADA UM MANDA: o próprio estado, 10 vezes por segundo
     ===================================================================== */
  const atacar0 = C.atacar;
  C.atacar = function (pesado) { const a = P.atkT; atacar0.call(C, pesado); if (P.atkT > a + 0.01) CO.atkSeq++; };
  function motivoLocal() {
    if (J.modo !== 'jogo') return null;
    // o que o convidado só assiste (a conversa, a cena e o prólogo do anfitrião) não segura o mundo
    if (HI() && HI().espelhandoPrologo && HI().espelhandoPrologo()) return null;
    if (OV.cenas && OV.cenas.ativa && OV.cenas.ativa.espelhoHost) return null;
    if (HI() && HI().prologoAberto && HI().prologoAberto()) return 'vendo uma cena';
    if (CO.espelho || CO.servico) return null;
    if (J.dialogo || D.aberto) return 'numa conversa';
    if (OV.cenas && OV.cenas.ativa && !OV.cenas.ativa.entrega) return 'vendo uma cena'; // a entrega o colega vê na tela dele, sem parar
    // no co-op, as telas não param o mundo: só servem para mostrar ao outro o que o colega está fazendo
    if (CO.ativo()) return null;
    if (J.inv) return 'no inventário';
    if (J.mapa) return 'olhando o mapa';
    if (J.diarioAb) return 'lendo o diário';
    if (J.ficha) return 'na ficha do personagem';
    if (J.pausado) return 'com o jogo pausado';
    if (ui.ovAberto()) return 'num menu';
    return null;
  }
  function meuEstado() {
    const pers = P.pers || {};
    return { t: 'eu', x: r2(P.pos.x), y: r2(P.pos.y), z: r2(P.pos.z), f: r2(P.facing), cr: P.correndo ? 1 : 0, ad: CO.atkSeq, adur: r2(P.atkDur || 0.5), ap: P.atkPesado ? 1 : 0,
      dg: P.dodgeT > 0 ? 1 : 0, pr: P.praying ? 1 : 0, or: P.oratT > 0 ? 1 : 0, ck: P.castT > 0 ? P.castKind : 0, sg: P.signT > 0 ? 1 : 0, dead: P.dead ? 1 : 0,
      hp: Math.round(P.hp || 0), mhp: P.D ? P.D.maxHp : 1, nome: pers.nome || '', sexo: pers.sexo, ordem: pers.ordem, nivel: pers.nivel || 1, oc: motivoLocal(), vm: P.velaMao ? 1 : 0, ocl: P.oculto > 0 ? 1 : 0,
      cg: P.carga ? P.carga.prop : 0, mt: P.montado ? P.montado.k : 0 };
  }

  /* =====================================================================
     A PAUSA VALE PARA OS DOIS
     ===================================================================== */
  const ativo0 = J.ativo;
  const ocupadoAgora = () => (CO.ativo() ? presentes().find(Q => Q.ocupado) : null);
  CO.colegaOcupado = () => !!ocupadoAgora();
  J.ativo = () => ativo0() && !CO.colegaOcupado();
  // no co-op o mundo não para com o inventário, a ficha, o mapa, o diário ou o menu: só com conversas e cenas
  const vivo0 = J.mundoVivo;
  J.mundoVivo = function () {
    if (vivo0.call(J)) return true;
    if (!CO.ativo() || J.modo !== 'jogo' || CO.colegaOcupado()) return false;
    if ((J.dialogo || D.aberto) && !CO.servico) return false;
    if (OV.cenas && OV.cenas.ativa) return false;
    if (HI() && HI().prologoAberto && HI().prologoAberto()) return false;
    return true;
  };
  const faixa = document.createElement('div'); faixa.id = 'coopPausa'; faixa.hidden = true; document.body.appendChild(faixa);
  function atualizarFaixa() {
    const mostrar = J.modo === 'jogo' && CO.colegaOcupado() && !motivoLocal();
    faixa.hidden = !mostrar;
    if (mostrar) { const Q = ocupadoAgora(); faixa.textContent = `⏸ ${(Q && Q.nome) || 'O seu colega'} está ${Q ? Q.ocupado : 'ocupado'}: o mundo espera.`; }
  }

  /* =====================================================================
     O ANFITRIÃO: dono do mundo
     ===================================================================== */
  // cada vício ganha um número, para os dois navegadores falarem do mesmo
  const spawn0 = I.spawn;
  // um vício "de mentira": aceita tudo o que se faz com ele e não existe no mundo (o convidado aplicando o mundo)
  const STUB = (() => { const alvo = function () {}; const px = new Proxy(alvo, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'removed' ? true : k === 'state' ? 'dead' : px), set: () => true, apply: () => px }); return px; })();
  I.spawn = function () {
    if (CO.convidado() && CO.stubSpawn) return STUB;
    const e = spawn0.apply(I, arguments); if (e && !e.netId) e.netId = ++CO.seq; return e;
  };
  const porIdH = id => I.lista.find(e => e.netId === id && !e.removed);
  const estadoDe = e => (e.spawnT > 0 ? 'surgindo' : e.state);
  function fotoInimigos() {
    const refs = CO.remotos().filter(Q => Q.slot > 0 && CO.on.has(Q.slot)).map(Q => Q.alvo || Q.pos);
    if (!refs.length) refs.push(P.pos);
    return I.lista.filter(e => !e.removed && e.netId && refs.some(ref => Math.hypot(e.g.position.x - ref.x, e.g.position.z - ref.z) < 110)).map(e => {
      const g = e.g.position, lab = e.lab && e.lab.el, nome = lab && lab.firstChild && lab.firstChild.textContent !== e.def.name ? lab.firstChild.textContent : 0;
      const k = e.state === 'windup' ? r2(1 - e.t / (e.t0 || 1)) : 0;
      return [e.netId, e.def.key, e.def.nivel || 1, e.def.variante || 0, r2(g.x), r2(g.y), r2(g.z), r2(e.g.rotation.y), Math.max(0, Math.round(e.hp)), e.def.hp, estadoDe(e), nome, k, e.golpe ? e.golpe.tipo : 0, lab && lab.style.display === 'none' ? 1 : 0, r2(e.escala || 1)];
    });
  }
  // o golpe de um vício chega no colega: quem calcula o Sinal da Cruz, a esquiva e a defesa é o navegador dele
  CO.golpeRemoto = function (R_, e) {
    CO.enviar({ t: 'ferir', para: R_.slot, golpe: 1, d: Math.round(e.def.dmg * (e.multDano || 1)), st: e.def.status !== undefined ? e.def.status : e.def.key, id: e.netId, key: e.def.key, ex: r2(e.g.position.x), ez: r2(e.g.position.z) });
  };
  CO.ferirRemoto = function (R_, o) {
    const f = o.fonte && o.fonte.g ? o.fonte : null;
    CO.enviar({ t: 'ferir', para: R_.slot, d: o.dano, st: o.status || 0, a: r2(o.ang || 0), id: f ? f.netId : 0, key: f ? f.def.key : 0, ex: f ? r2(f.g.position.x) : 0, ez: f ? r2(f.g.position.z) : 0 });
  };
  I.aoFx = m => { if (CO.anfitriao() && CO.colegaOn) { m.t = 'fx'; CO.enviar(m); } };
  if (OV.aventura) OV.aventura.aoEntrega = m => { if (CO.anfitriao() && CO.colegaOn) CO.enviar(Object.assign({ t: 'entrega' }, m)); };
  // as mortes: o anfitrião ganha como sempre; o convidado recebe a notícia e ganha a parte dele
  // a experiência de cada vício vencido vale para quem está a até 40 m dele (ou para quem deu o golpe)
  const RAIO_XP = 40;
  CO.emDano = 0; CO.semXp = false;
  const dano0 = C.danoInimigo;
  C.danoInimigo = function (e, dmg, knock, ang, opts) {
    if (CO.convidado()) return golpeDoConvidado(e, dmg, knock, ang, opts);
    const vivo = e && e.state !== 'dead' && e.state !== 'liberto';
    const doColega = !!(opts && opts.colega);
    CO.emDano++; CO.semXp = doColega && e && Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z) > RAIO_XP;
    try { dano0.call(C, e, dmg, knock, ang, opts); } finally { CO.emDano--; CO.semXp = false; }
    if (CO.anfitriao() && CO.colegaOn && vivo && (e.state === 'dead' || e.state === 'liberto')) {
      const d = e.def;
      CO.enviar({ t: 'morte', id: e.netId, x: r2(e.g.position.x), y: r2(e.g.position.y), z: r2(e.g.position.z), seu: doColega ? 1 : 0, por: doColega && opts.de ? opts.de : 0, def: { key: d.key, nivel: d.nivel || 1, xp: d.xp || 0, moedas: d.moedas || 0, chefe: d.chefe ? 1 : 0, liberta: d.liberta ? 1 : 0, variante: d.variante || 0, animal: d.animal ? 1 : 0, fixo: d.fixo ? 1 : 0 }, fall: d.fall || 0 });
    }
  };
  // a experiência que não vem de vício vencido (missões, livros, achados) vale inteira para os dois
  const xp0 = C.ganharXp;
  C.ganharXp = function (n) {
    if (CO.semXp) return;
    const r = xp0.call(C, n);
    if (CO.anfitriao() && CO.colegaOn && !CO.emDano && n > 0 && J.modo === 'jogo') CO.enviar({ t: 'xp', n: Math.round(n) });
    return r;
  };
  function aplicarGolpeDoColega(m) {
    const e = porIdH(m.id); if (!e || e.state === 'dead' || e.state === 'liberto') return;
    dano0Wrap(e, m.d, m.kn || 0, m.a || 0, { pesado: !!m.p, colega: true, de: m.de || 1 });
  }
  const dano0Wrap = (e, d, kn, a, o) => C.danoInimigo(e, d, kn, a, o);
  // missões: as novidades e a XP valem para os dois
  function embrulharMissoes() {
    const ms = MS(); if (!ms || ms._coop) return; ms._coop = true;
    const ini0 = ms.iniciar, ava0 = ms.avancar, con0 = ms.concluir, upd0 = ms.update, ev0 = ms.evento;
    ms.iniciar = function (id) {
      if (CO.convidado()) return;
      const antes = ms.feita ? (ms.feita(id) || ms.ativa(id)) : true;
      ini0.apply(ms, arguments);
      if (CO.anfitriao() && CO.colegaOn && !antes && ms.MIS[id]) CO.enviar({ t: 'aviso', txt: 'Nova missão: ' + ms.MIS[id].nome });
    };
    ms.avancar = function () { if (CO.convidado()) return; return ava0.apply(ms, arguments); };
    ms.concluir = function (id) {
      if (CO.convidado()) return;
      const antes = ms.feita ? ms.feita(id) : true;
      con0.apply(ms, arguments);
      if (CO.anfitriao() && CO.colegaOn && !antes && ms.MIS[id]) anotarRecompensa(ms.MIS[id].nome);
    };
    ms.update = function () { if (CO.convidado()) return; return upd0.apply(ms, arguments); };
    ms.evento = function () { if (CO.convidado()) return false; return ev0.apply(ms, arguments); };
  }
  // o que o anfitrião tem agora: denários, itens (mochila, baú e equipados) e as peças da casa
  function haveres() {
    const p = P.pers || {}, mo = p.mochila || {}, t = {};
    [mo.itens || {}, p.bau || {}].forEach(o => { for (const k in o) t[k] = (t[k] || 0) + (o[k] || 0); });
    Object.values(mo.equip || {}).forEach(k => { if (k) t[k] = (t[k] || 0) + 1; });
    return { den: p.denarios || 0, itens: t, decor: Object.keys((p.casa && p.casa.acervo) || {}) };
  }
  // a base é a de pelo menos um segundo antes (ou a de quando a conversa abriu): pega o que foi dado junto com a missão
  let haverAntigo = null, haverNovo = null, recPend = null, recT = 0;
  CO.marcarHaveres = function () { if (recPend || !P.pers) return; if (D.aberto && haverAntigo) return; haverAntigo = haverNovo || haveres(); haverNovo = haveres(); };
  function anotarRecompensa(nome) {
    if (!recPend) recPend = { nomes: [], base: haverAntigo || haveres() };
    recPend.nomes.push(nome);
    clearTimeout(recT); recT = setTimeout(fecharRecompensa, 2500);
  }
  function fecharRecompensa() {
    const r = recPend; recPend = null; if (!r) return;
    const a = r.base, b = haveres(), itens = {};
    for (const k in b.itens) { const d = b.itens[k] - (a.itens[k] || 0); if (d > 0 && k !== 'exame' && OV.ITENS[k]) itens[k] = d; }
    const decor = b.decor.filter(k => !a.decor.includes(k));
    if (CO.colegaOn) CO.enviar({ t: 'recompensa', nomes: r.nomes, den: Math.max(0, b.den - a.den), itens, decor });
    haverAntigo = haverNovo = b;
  }
  function receberRecompensa(m) {
    if (!P.pers || J.modo !== 'jogo') return;
    const IT = OV.itens, partes = [];
    if (m.den > 0) { P.pers.denarios = (P.pers.denarios || 0) + m.den; partes.push(`${m.den} denários`); }
    for (const id in (m.itens || {})) {
      const n = m.itens[id], it = OV.ITENS[id]; if (!it || !(n > 0)) continue;
      if (!IT.dar(id, n, true)) P.pers.bau[id] = (P.pers.bau[id] || 0) + n;
      partes.push(`${it.nome}${n > 1 ? ' ×' + n : ''}`);
    }
    (m.decor || []).forEach(k => { if (OV.casa && OV.casa.DECOR[k] && OV.casa.ganhar(k, true)) partes.push(`${OV.casa.DECOR[k].nome} (para a casa)`); });
    ui.toast(`Missão concluída: ${(m.nomes || []).join(', ')}.${partes.length ? ' Você também recebeu: ' + partes.join(', ') + '.' : ''}`);
    if (IT.refresh) IT.refresh();
    J.salvar();
  }
  // falas: tudo o que o anfitrião lê, o convidado lê junto (e o mundo fica parado para os dois)
  const ir0 = D.ir, fechar0 = D.fechar, abrir0 = D.abrir, continuar0 = D.continuar, escolher0 = D.escolher;
  function espelharFala() {
    if (!(CO.anfitriao() && CO.colegaOn && D.aberto)) return;
    CO.enviar({ t: 'fala', on: 1, quem: $('dlgQuem').textContent, txt: $('dlgTxt').textContent, verso: $('dlg').classList.contains('verso') ? 1 : 0,
      opc: D.opcs.map(o => { const t = typeof o.op.t === 'function' ? o.op.t() : o.op.t; return [String(t), o.ok ? 1 : 0]; }) });
  }
  D.ir = function (id) { ir0.call(D, id); espelharFala(); };
  D.fechar = function () {
    const era = D.aberto, espelho = CO.espelho; CO.espelho = false;
    fechar0.call(D);
    if (!D.aberto) CO.servico = false;
    if (CO.anfitriao() && CO.colegaOn && era && !espelho && !D.aberto) CO.enviar({ t: 'fala', on: 0 });
  };
  D.continuar = function () { if (CO.espelho) return; return continuar0.call(D); };
  D.escolher = function (i) { if (CO.espelho) return; return escolher0.call(D, i); };
  function mostrarFala(m) {
    if (!m.on) { if (D.aberto && CO.espelho) { CO.espelho = false; fechar0.call(D); } return; }
    const opc = (m.opc || []).length ? m.opc.map(([t]) => ({ t, cond: () => false, motivo: 'quem escolhe é o anfitrião' })) : null;
    CO.espelho = false;
    abrir0.call(D, { inicio: 'a', nos: { a: { quem: m.quem, txt: m.txt, verso: !!m.verso, opc } } });
    CO.espelho = true;
    if (!opc) $('dlgOpc').innerHTML = `<p class="coop-espera">${esc(CO.colegaNome || 'O anfitrião')} conduz a conversa…</p>`;
  }
  // a história das lâmpadas aparece para os dois
  function embrulharHistoria() {
    const hi = HI(); if (!hi || hi._coop) return; hi._coop = true;
    const pro0 = hi.prologo;
    hi.prologo = function (qual, fim) { if (CO.anfitriao() && CO.colegaOn && qual === 'historia') CO.enviar({ t: 'cena', qual }); return pro0.call(hi, qual, fim); };
    // o anfitrião vira as páginas e fecha o livro; o convidado acompanha
    hi.aoPrologo = (k, i) => { if (!(CO.anfitriao() && CO.colegaOn)) return; if (k === 'pag') CO.enviar({ t: 'cena_pag', i }); else CO.enviar({ t: 'cena_fim', prologo: 1 }); };
  }
  /* as cenas com câmera (os poemas dos chefões, a roda do moinho, os sinos): tocam para os dois ao mesmo tempo,
     e quem começa e termina é o anfitrião */
  function embrulharCenas() {
    const CE = OV.cenas; if (!CE || CE._coop) return; CE._coop = true;
    const poema0 = CE.poema, iniciar0 = CE.iniciar, encerrar0 = CE.encerrar;
    const flags = () => (J.prog && J.prog.flags) || {};
    CE.poema = function (key, op, depois) {
      const vai = CO.anfitriao() && CO.colegaOn && CE.POEMAS[key] && !flags()['poema_' + key];
      if (vai) { op = op || {}; CO.enviar({ t: 'poema', key, id: op.e && op.e.netId ? op.e.netId : 0, pos: op.pos ? { x: r2(op.pos.x), z: r2(op.pos.z) } : 0, raio: op.raio || 0, altura: op.altura !== undefined ? op.altura : null }); }
      CO.emPoema = !!vai;
      try { return poema0.call(CE, key, op, depois); } finally { CO.emPoema = false; }
    };
    CE.iniciar = function (cfg) {
      if (CO.anfitriao() && CO.colegaOn && !CO.emPoema && cfg && !cfg.entrega && !cfg.espelhoHost) {
        const a = typeof cfg.alvo === 'function' ? cfg.alvo() : cfg.alvo;
        if (a) CO.enviar({ t: 'cena_cam', a: [r2(a.x), r2(a.y), r2(a.z)], raio: cfg.raio || 7, altura: cfg.altura || 3, giro: cfg.giro !== undefined ? cfg.giro : 0.12, olhar: cfg.olhar !== undefined ? cfg.olhar : 1.4 });
      }
      return iniciar0.call(CE, cfg);
    };
    CE.encerrar = function () {
      const era = CE.ativa;
      encerrar0.call(CE);
      if (era && !era.entrega && !era.espelhoHost && CO.anfitriao() && CO.colegaOn) CO.enviar({ t: 'cena_fim' });
    };
  }
  function cenaDoAnfitriao(m) {
    if (J.modo !== 'jogo' || !OV.cenas) return;
    const CE = OV.cenas;
    if (m.t === 'poema') {
      if (CE.ativa) CE.encerrar();
      const e = m.id ? porIdC.get(m.id) : null;
      CE.poemaEspelho(m.key, { e: e && !e.removed ? e : null, pos: m.pos || (e ? { x: e.g.position.x, z: e.g.position.z } : null), raio: m.raio || 0, altura: m.altura === null ? undefined : m.altura });
    } else if (m.t === 'cena_cam') {
      if (CE.ativa) CE.encerrar();
      CE.iniciar({ alvo: new THREE.Vector3(m.a[0], m.a[1], m.a[2]), raio: m.raio, altura: m.altura, giro: m.giro, olhar: m.olhar, espelhoHost: true });
    } else if (m.t === 'cena_fim') {
      if (CE.ativa && CE.ativa.espelhoHost) CE.encerrar();
      if (HI() && HI().espelhandoPrologo && HI().espelhandoPrologo()) HI().fecharPrologo();
    } else if (m.t === 'cena_pag') { if (HI() && HI().paginaPrologo) HI().paginaPrologo(m.i); }
  }
  // o mundo (missões, flags, lâmpadas, baús) e a hora
  let ultimoMundo = '', mundoT = 0, horaT = 0;
  function mundoAtual() { const p = Object.assign({}, J.prog); delete p.hora; delete p.mortosMundo; delete p.diaMundo; return p; }
  // os pontos das missões no mapa e na bússola: o anfitrião calcula, o convidado mostra
  let alvosTxt = '';
  function enviarAlvos() {
    const RU = OV.rumo; if (!RU || !RU.ativas) return;
    const a = {}; RU.ativas().forEach(id => { const p = RU.alvoBruto(id); if (p) a[id] = [r2(p.x), r2(p.z)]; });
    const t = JSON.stringify(a); if (t === alvosTxt) return; alvosTxt = t; CO.enviar({ t: 'alvos', a });
  }
  if (OV.rumo && OV.rumo.alvoBruto) {
    const bruto0 = OV.rumo.alvoBruto;
    OV.rumo.alvoBruto = function (id) {
      if (!(CO.convidado() && CO.alvosHost)) return bruto0.call(OV.rumo, id);
      const p = CO.alvosHost[id]; return p ? { x: p[0], z: p[1] } : null;
    };
  }
  function enviarMundo(forcar) {
    if (!J.prog) return;
    const p = mundoAtual(), txt = JSON.stringify(p);
    if (!forcar && txt === ultimoMundo) return;
    ultimoMundo = txt; CO.enviar({ t: 'mundo', prog: p, hora: OV.tempo ? r2(OV.tempo.hora) : 8 });
  }
  // andar juntos: o convidado acompanha os saltos do anfitrião (barco, viagem, masmorra) e não se afasta demais
  let ultimaPos = null, navAnt = false;
  const levar = (motivo, Q) => CO.enviar({ t: 'teleporte', para: Q.slot, x: r2(P.pos.x), z: r2(P.pos.z), f: r2(P.facing), motivo });
  const convidadosVivos = () => presentes().filter(Q => Q.slot > 0 && !Q.dead);
  function andarJuntos(dt) {
    const agora = { x: P.pos.x, z: P.pos.z };
    if (CO.separados && presentes().some(Q => Q.alvo && Math.hypot(Q.alvo.x - P.pos.x, Q.alvo.z - P.pos.z) < 30)) CO.separados = false;
    if (P.dead) { ultimaPos = null; CO.remotos().forEach(Q => { Q.longeT = 0; }); return; }
    const vivos = convidadosVivos();
    if (ultimaPos && Math.hypot(agora.x - ultimaPos.x, agora.z - ultimaPos.z) > 25 && !CO.separados) vivos.forEach(Q => levar('salto', Q));
    ultimaPos = agora;
    // o barco do rio, o de Mestre Pedro: ao desembarcar, os colegas desembarcam juntos
    const nav = !!((OV.ajustes && OV.ajustes.navegando) || P.travado);
    if (navAnt && !nav) vivos.forEach(Q => levar('salto', Q));
    navAnt = nav;
    for (const Q of vivos) {
      if (J.ativo() && !CO.separados && Q.alvo && Math.hypot(Q.alvo.x - P.pos.x, Q.alvo.z - P.pos.z) > 70) { Q.longeT += dt; if (Q.longeT > 3) { Q.longeT = 0; levar('longe', Q); } }
      else Q.longeT = 0;
    }
  }

  /* =====================================================================
     OS EFEITOS DE CADA JOGADOR: tiros, orações e habilidades aparecem para os dois (só a imagem)
     ===================================================================== */
  CO.acao = 0; CO.replicando = false;
  const emAcao = (obj, nome) => { const f0 = obj && obj[nome]; if (!f0) return; obj[nome] = function () { CO.acao++; try { return f0.apply(this, arguments); } finally { CO.acao--; } }; };
  emAcao(C, 'orar'); emAcao(C, 'atacar'); emAcao(OV.habilidades, 'usar'); emAcao(OV.itens, 'usar');
  function serMesh(m) {
    const g = m && m.geometry, mt = m && m.material;
    if (!g || !g.parameters || typeof THREE[g.type] !== 'function' || !mt || Array.isArray(mt)) return null;
    return { g: g.type, p: Object.values(g.parameters).filter(v => typeof v === 'number' || typeof v === 'boolean'), c: mt.color ? mt.color.getHex() : 0xffffff, o: r2(mt.opacity === undefined ? 1 : mt.opacity),
      b: mt.blending === THREE.AdditiveBlending ? 1 : 0, s: mt.side === THREE.DoubleSide ? 1 : 0,
      x: [m.position.x, m.position.y, m.position.z, m.rotation.x, m.rotation.y, m.rotation.z, m.scale.x, m.scale.y, m.scale.z].map(r2), ch: m.children.map(serMesh).filter(Boolean) };
  }
  function desMesh(d) {
    let geo; try { geo = new THREE[d.g](...d.p); } catch (e) { return null; }
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: d.o, blending: d.b ? THREE.AdditiveBlending : THREE.NormalBlending, side: d.s ? THREE.DoubleSide : THREE.FrontSide, depthWrite: false }));
    m.position.set(d.x[0], d.x[1], d.x[2]); m.rotation.set(d.x[3], d.x[4], d.x[5]); m.scale.set(d.x[6], d.x[7], d.x[8]);
    (d.ch || []).forEach(c => { const k = desMesh(c); if (k) m.add(k); });
    return m;
  }
  C.aoFx = function (m) {
    if (CO.replicando || !CO.ativo() || !CO.colegaOn || J.modo !== 'jogo') return;
    if (m.k === 'ef') { if (!CO.acao) return; const ms = m.meshes.map(serMesh).filter(Boolean); if (!ms.length) return; CO.enviar({ t: 'fxp', k: 'ef', dur: r2(m.dur), m: ms }); return; }
    CO.enviar(Object.assign({ t: 'fxp' }, m));
  };
  function efeitoDoColega(m) {
    const R = REM.get(m.de || 0);
    if (J.modo !== 'jogo' || !R || !R.heroi || !R.heroi.g.visible) return;
    CO.replicando = true;
    try {
      const pos = { x: R.pos.x, y: R.pos.y, z: R.pos.z };
      if (m.k === 'anel') C.anel(m.cor, m.escala, m.dur, m.op, pos);
      else if (m.k === 'burst') C.burstVisual(pos);
      else if (m.k === 'proj') C.lancar({ visual: true, origem: new THREE.Vector3(m.o[0], m.o[1], m.o[2]), dir: new THREE.Vector3(m.d[0], m.d[1], m.d[2]), pesado: !!m.p, cor: m.cor || undefined, brilho: m.brilho || undefined, flecha: !!m.fl, raio: m.r, vel: m.v, alcance: m.al, dano: 0 });
      else if (m.k === 'ef') {
        const ms = (m.m || []).map(desMesh).filter(Boolean); if (!ms.length) return;
        const op0 = ms.map(x => x.material.opacity);
        C.efeito(ms, m.dur || 0.5, p => ms.forEach((x, i) => { x.material.opacity = op0[i] * (1 - p); x.children.forEach(c => { if (c.material) c.material.opacity = Math.min(c.material.opacity, op0[i] * (1 - p)); }); }));
      }
    } finally { CO.replicando = false; }
  }

  /* =====================================================================
     O CONVIDADO: vê o mundo do anfitrião e luta nele
     ===================================================================== */
  const porIdC = new Map();
  const AJOELHADO = { hL: -1.3, kL: 1.5, fL: 0, hR: 0.1, kR: 1.5, fR: -0.5 };
  // o que o jogo do convidado criar por conta própria (vícios de missão, do mundo) some: quem manda é o anfitrião
  function limparLocais() {
    if (!CO.convidado()) return;
    I.lista = I.lista.filter(e => {
      if (e.replica) return true;
      if (!e.removed) { M.scene.remove(e.g); if (e.lab) e.lab.el.remove(); e.removed = true; }
      return false;
    });
  }
  function criarReplica(a) {
    const [id, key, nivel, variante, x, y, z] = a;
    if (!OV.FOES[key]) return null;
    const e = spawn0.call(I, key, false, { x, z }, { nivel, variante: variante || null, semAjuste: true });
    e.netId = id; e.replica = true; e.spawnT = 0; e.state = 'idle'; e.g.position.set(x, y, z);
    porIdC.set(id, e); return e;
  }
  function receberInimigos(m) {
    if (J.modo !== 'jogo') return;
    const vistos = new Set();
    for (const a of m.l) {
      const id = a[0]; let e = porIdC.get(id);
      if (!e || e.removed) { e = criarReplica(a); if (!e) continue; }
      vistos.add(id);
      const [, , , , x, y, z, ry, hp, mhp, st, nome, k, golpe, semRotulo, escala] = a;
      e.alvoNet = { x, y, z, ry }; e.def = e.def.hp === mhp ? e.def : Object.assign({}, e.def, { hp: mhp });
      if (e.hpOtimista === undefined || hp < e.hp || performance.now() - (e.otimT || 0) > 600) e.hp = hp;
      e.netState = st; e.state = st === 'surgindo' ? 'idle' : st; e.spawnT = 0; e.k = k; e.tipoGolpe = golpe;
      if (nome && e.lab && e.lab.el.firstChild && e.lab.el.firstChild.textContent !== nome) e.lab.el.firstChild.textContent = nome;
      if (e.lab) e.lab.el.style.display = semRotulo || st === 'dead' ? 'none' : '';
      if (escala && Math.abs(e.g.scale.x - escala) > 0.01 && st !== 'liberto') e.g.scale.setScalar(escala);
    }
    for (const [id, e] of porIdC) if (!vistos.has(id)) { if (!e.removed) { M.scene.remove(e.g); if (e.lab) e.lab.el.remove(); e.removed = true; } porIdC.delete(id); }
    I.lista = I.lista.filter(e => !e.removed || !e.replica);
    limparLocais();
  }
  function animarReplica(e, dt) {
    const g = e.g, t = e.alvoNet; if (!t || e.removed) return;
    const ox = g.position.x, oz = g.position.z, k = 1 - Math.exp(-10 * dt);
    if (Math.hypot(t.x - ox, t.z - oz) > 8) { g.position.x = t.x; g.position.z = t.z; } else { g.position.x += (t.x - ox) * k; g.position.z += (t.z - oz) * k; }
    g.position.y += (t.y - g.position.y) * k;
    g.rotation.y = turnTo(g.rotation.y, t.ry, 10 * dt);
    const mov = Math.hypot(g.position.x - ox, g.position.z - oz);
    e.flash = Math.max(0, (e.flash || 0) - dt); e.ph = (e.ph || 0) + dt * 2;
    if (e.mats) e.mats.forEach((m, i) => { if (e.flash > 0) m.emissive.setRGB(1, 0.9, 0.8); else if (e.netState === 'dead') m.emissive.setRGB(0.3, 0.05, 0.05); else if (e.orig) m.emissive.copy(e.orig[i]); });
    const st = e.netState;
    if (st === 'liberto') { if (e.pernas && mov < 0.01) OV.andar.aplicar(e.pernas, AJOELHADO, 0.1); else I.marchar(e, dt, mov); if (e.eye) e.eye.color.setHex(0x3a2a20); return; }
    if (st === 'dead') return;
    const mar = I.marchar(e, dt, mov);
    let armL, armR;
    if (st === 'windup') { const kk = e.k || 0, tp = e.tipoGolpe || 'golpe'; if (tp === 'tiro') { armL = -0.4 * kk; armR = -1.9 * kk; } else if (tp === 'forte' || tp === 'onda') { armL = armR = -3.0 * kk; } else if (tp === 'investida') { armL = armR = 0.8 * kk; } else armL = armR = -2.5 * kk; }
    else if (st === 'investida') armL = armR = -1.4;
    else if (st === 'recover') armL = armR = 0.5;
    else if (st === 'stun') armL = armR = 0.5 + Math.sin(e.ph * 6) * 0.1;
    else if (e.pernas && e.marcha && e.marcha.amp > 0.05) { armL = mar.braco * 0.6; armR = -mar.braco * 0.6; }
    else { armL = Math.sin(e.ph) * 0.12; armR = -armL; }
    const kb = 1 - Math.exp(-20 * dt);
    if (e.armL) e.armL.rotation.x = lerp(e.armL.rotation.x, armL, kb); if (e.armR) e.armR.rotation.x = lerp(e.armR.rotation.x, armR, kb);
    if (e.eye) e.eye.color.setHex(st === 'windup' ? 0xff3b2f : st === 'stun' ? 0x555555 : (e.eyeBase || 0xffd23a));
    // o aviso antes do tiro e da onda: a bola de luz cresce na mão, como no anfitrião
    const avisa = st === 'windup' && (e.tipoGolpe === 'tiro' || e.tipoGolpe === 'onda' || e.tipoGolpe === 'chuva');
    if (avisa && !e.orbeR) {
      const cor = (I.corProjetil ? I.corProjetil(e.def.key) : 0xff5a2a);
      const o = new THREE.Mesh(new THREE.IcosahedronGeometry(e.tipoGolpe === 'onda' ? 0.5 : 0.22, 1), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      if (e.tipoGolpe === 'onda') { o.position.set(0, e.def.height * 0.75, 0.4); e.g.add(o); } else if (e.armR) { o.position.set(0, -0.85, 0.15); e.armR.add(o); } else e.g.add(o);
      e.orbeR = o;
    }
    if (e.orbeR) { if (avisa) e.orbeR.scale.setScalar(0.3 + (e.k || 0) * 1.1); else { if (e.orbeR.parent) e.orbeR.parent.remove(e.orbeR); e.orbeR = null; } }
    if (e.def.ia) { try { e.def.ia(e, dt); } catch (err) { /* animações próprias de alguns chefões */ } }
  }
  const update0 = I.update;
  I.update = function (dt) {
    if (!CO.convidado()) return update0.call(I, dt);
    limparLocais();
    I.atualizarVisuais(dt);
    I.lista.forEach(e => animarReplica(e, dt));
    if (OV.aventura && OV.aventura.atualizarEspelho) OV.aventura.atualizarEspelho(dt);
  };
  // os golpes do convidado: ele calcula a parte dele (arma, habilidades, itens) e o anfitrião aplica no vício de verdade
  function golpeDoConvidado(e, dmg, knock, ang, opts) {
    if (!e || !e.replica || e.state === 'dead' || e.state === 'liberto') return;
    let d = dmg; const HB = OV.habilidades;
    if (opts && opts.jogador && HB) d = HB.modDano(e, d, opts);
    if (opts && opts.jogador && OV.itens) d = Math.round(d * OV.itens.danoContra(e));
    if (e.marca > 0) d = Math.round(d * (1 + (e.marcaF || 0.15)));
    CO.enviar({ t: 'golpe', id: e.netId, d, kn: r2(knock || 0), a: r2(ang || 0), p: opts && opts.pesado ? 1 : 0 });
    e.flash = 0.12; e.hp = Math.max(1, e.hp - d); e.otimT = performance.now(); e.hpOtimista = true;
    J.shake(0.12); A.hit();
    if (opts && opts.jogador && HB) HB.aoAcertar(e, d, opts);
  }
  const atordoar0 = I.atordoar;
  I.atordoar = function (e, t, forcar) { if (CO.convidado()) { if (e && e.replica) CO.enviar({ t: 'atordoar', id: e.netId, s: r2(t) }); return; } return atordoar0.call(I, e, t, forcar); };
  // os golpes que chegam no convidado
  function serFerido(m) {
    if (P.dead || J.modo !== 'jogo') return;
    const e = porIdC.get(m.id);
    const fonte = { def: { key: m.key || 'golpe', dmg: m.d, status: m.st || undefined, nivel: 1 }, g: { position: new THREE.Vector3(m.ex || P.pos.x, P.pos.y, m.ez || P.pos.z) }, netId: m.id, multDano: 1, replica: true };
    if (m.golpe) {
      // o Sinal da Cruz do convidado também atordoa o vício
      const ang = Math.atan2(fonte.g.position.x - P.pos.x, fonte.g.position.z - P.pos.z);
      if (P.parryT > 0 && Math.abs(OV.util.angWrap(ang - P.facing)) < 1.6) {
        CO.enviar({ t: 'atordoar', id: m.id, s: 1.5 }); if (e) e.flash = 0.12;
        A.parry(); P.parryFlash = 0.45; J.shake(0.15); C.aparouCerto(); ui.toast('Sinal da Cruz! O vício cambaleia.'); return;
      }
      C.ferirJogador(m.d, m.st || null, e || fonte);
    } else {
      if (P.parryT > 0 && Math.abs(OV.util.angWrap((m.a || 0) - P.facing)) < 1.6) { A.parry(); C.aparouCerto(); ui.toast('Sinal da Cruz! O golpe se desfaz.'); return; }
      C.ferirJogador(m.d, m.st || null, e || fonte);
    }
  }
  // a parte do convidado em cada vitória: XP, moedas e o que o vício deixar cair (sorteado para ele)
  function receberMorte(m) {
    if (J.modo !== 'jogo' || !P.pers || P.dead) return;
    const meu = m.seu && (m.por === undefined || m.por === CO.slot);
    if (!meu && Math.hypot(m.x - P.pos.x, m.z - P.pos.z) > RAIO_XP) return;
    const fake = { def: Object.assign({}, m.def, { name: '' }), g: { position: new THREE.Vector3(m.x, m.y, m.z) }, tag: null, hp: 0, state: 'dead' };
    C.ganharXp(C.xpDe(fake));
    const mo = m.def.moedas;
    if (mo && mo.length === 2) { const n = Math.round((mo[0] + Math.floor(Math.random() * (mo[1] - mo[0] + 1))) * (OV.habilidades && OV.habilidades.tem('mao') ? 2 : 1) * (OV.itens ? OV.itens.mod('denarios') : 1) * (OV.ECON ? OV.ECON.inimigos : 1)); P.pers.denarios = (P.pers.denarios || 0) + n; }
    if (OV.itens) OV.itens.aoVencer(fake);
    if (m.fall) ui.toast(m.fall);
    const e = porIdC.get(m.id); if (e) { e.netState = m.def.liberta ? 'liberto' : 'dead'; e.state = e.netState; if (e.lab) e.lab.el.style.display = 'none'; }
  }
  function efeitoRemoto(m) {
    if (J.modo !== 'jogo') return;
    if (m.k === 'tiro') I.tiroVisual(m);
    else if (m.k === 'onda') I.ondaVisual(m);
    else if (m.k === 'marca' && I.marca) I.marca(m.x, m.z, m.r, m.dur, m.cor);
    else if (m.k === 'impacto' && I.impactoVisual) I.impactoVisual(m.x, m.z, m.cor);
    else if (m.k === 'investida') {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, m.len), new THREE.MeshBasicMaterial({ color: 0xff3a1a, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }));
      pl.rotation.x = -Math.PI / 2; pl.rotation.z = m.a; pl.position.set(m.x, M.altura(m.x, m.z) + 0.07, m.z);
      C.efeito([pl], m.dur, p => { pl.material.opacity = 0.15 + 0.3 * p; });
    }
  }
  // o mundo do anfitrião chega
  let aplicarT = 0, mundoPendente = false;
  function receberMundo(m) {
    const primeiro = !CO.mundoHost;
    CO.mundoHost = m.prog; CO.horaHost = m.hora;
    if (J.modo === 'jogo' && CO.convidado()) { J.prog = JSON.parse(JSON.stringify(m.prog)); mundoPendente = true; return; }
    // fora do jogo: nunca redesenha a tela por cima da criação do personagem; só libera os botões
    if (CO.entrandoCom) { const pers = CO.entrandoCom; CO.entrandoCom = null; J.comecar(pers, null, false); return; }
    if (primeiro || document.querySelector('#ov .coop-convidado [data-entrar][disabled]')) atualizarTelaConvidado(); // botões ainda apagados: acende
  }
  function aplicarMundoAgora() {
    if (!mundoPendente || J.modo !== 'jogo' || performance.now() - aplicarT < 1500) return;
    mundoPendente = false; aplicarT = performance.now();
    try {
      for (const id in M.oratorios) M.oratorios[id].acender(!!(J.prog.oratorios || {})[id]);
      CO.stubSpawn = true;
      if (MS().aplicarMundo) MS().aplicarMundo();
      if (MS().respawnQuest) MS().respawnQuest(); // os objetos de missão aparecem e somem como no anfitrião
    } catch (err) { console.warn('co-op: mundo', err); } finally { CO.stubSpawn = false; }
    limparLocais();
  }
  // o convidado não conversa nem mexe no mundo (o anfitrião conduz); também não viaja sozinho
  const proximo0 = M.interativoProximo;
  M.interativoProximo = function (x, z) {
    if (!CO.convidado()) return proximo0.call(M, x, z);
    // só o que é pessoal: o baú das capelas e a Casa do Peregrino
    let best = null, bd = 1e9;
    for (const i of M.interativos) { if (!i.pessoal) continue; const d = Math.hypot(i.x - x, i.z - z); if (d < i.r && d < bd && i.texto()) { bd = d; best = i; } }
    return best || servicoProximo(x, z);
  };
  /* os serviços que o convidado também usa, sem a conversa da história: a bênção do padre e a forja */
  const SERVICOS = { tome: 'padre', gaspar: 'padre', abade: 'padre', lia: 'ferreiro', eustaquio: 'ferreiro', dunstano: 'ferreiro' };
  const servicoCache = {};
  function servicoProximo(x, z) {
    let best = null, bd = 2.8;
    for (const id in SERVICOS) {
      const f = M.figuras[id]; if (!f || f.visivel === false) continue;
      const d = Math.hypot(f.x - x, f.z - z); if (d < bd) { bd = d; best = id; }
    }
    if (!best) return null;
    const f = M.figuras[best], nome = (f.op && f.op.nome) || 'Padre', tipo = SERVICOS[best];
    const i = servicoCache[best] || (servicoCache[best] = { r: 2.8, pessoal: true });
    i.x = f.x; i.z = f.z;
    i.texto = () => tipo === 'padre' ? `Pedir a bênção a ${nome}` : `Pedir um trabalho na forja a ${nome}`;
    i.acao = () => abrirServico(best, tipo, nome);
    return i;
  }
  function abrirServico(id, tipo, nome) {
    const IT = OV.itens;
    CO.servico = true;
    if (tipo === 'padre') {
      const tem = IT.temCorrompidos();
      D.abrir({ inicio: 'a', nos: {
        a: { quem: nome, txt: tem ? 'A paz esteja com você. Quer que eu abençoe o que você carrega?' : 'A paz esteja com você. Três essências corrompidas viram um frasco de água benta, e um objeto profanado volta a servir a Deus. Quando tiver, é só trazer.',
          opc: tem ? [{ t: 'Pedir a bênção sobre os itens corrompidos.', ir: 'b' }, { t: 'Agora não.' }] : null },
        b: { quem: nome, txt: () => { const r = IT.purificar(); if (A.bell) { A.bell(523, 0.2); setTimeout(() => A.bell(659, 0.16), 220); } return `Em nome do Pai, do Filho e do Espírito Santo. O que o mal tomou para si volta a servir a Deus. Receba: ${r.join(', ')}.`; } }
      } });
    } else {
      const OF = OV.oficio, cfg = OF && OF.FERREIROS && OF.FERREIROS[id];
      const acesa = id !== 'lia' || (MS() && MS().feita && MS().feita('s5'));
      if (!cfg || !acesa) D.abrir({ inicio: 'a', nos: { a: { quem: nome, txt: 'A forja ainda está fria. Quando ela voltar a arder, eu trabalho para você também.' } } });
      else D.abrir(OF.menuFerreiro(cfg));
    }
    CO.servico = true;
  }

  /* a troca: dar um item da mochila ao colega */
  const IT_ = OV.itens;
  if (IT_) {
    // v25: com mais gente na sala, o presente vai para o colega mais perto
    const maisPerto = () => { let best = null, bd = 1e9; presentes().forEach(Q => { const p = Q.alvo || Q.pos, d = Math.hypot(p.x - P.pos.x, p.z - P.pos.z); if (d < bd) { bd = d; best = Q; } }); return best; };
    IT_.podeDarColega = id => CO.ativo() && CO.conectado && J.modo === 'jogo' && id !== 'exame' && IT_.qtd(id) > 0 && !!maisPerto();
    IT_.nomeColega = () => { const Q = maisPerto(); return Q ? (Q.nome || nomeDe(Q.slot)) : 'o colega'; };
    IT_.darColega = function (id) {
      const Q = maisPerto();
      if (!Q || !IT_.podeDarColega(id) || !IT_.tirar(id)) return;
      CO.enviar({ t: 'presente', para: Q.slot, id }); if (A.bell) A.bell(659, 0.08);
      ui.toast(`Você deu a ${Q.nome || nomeDe(Q.slot)}: ${OV.ITENS[id].nome}.`);
      J.salvar();
    };
  }
  function receberPresente(m) {
    const it = OV.ITENS[m.id]; if (!it || !P.pers || J.modo !== 'jogo') return;
    const IT = OV.itens, quem = (REM.get(m.de) && REM.get(m.de).nome) || nomeDe(m.de) || 'O seu colega';
    if (IT.dar(m.id, 1, true)) ui.toast(`${quem} deu a você: ${it.nome}.`);
    else { P.pers.bau[m.id] = (P.pers.bau[m.id] || 0) + 1; ui.toast(`${quem} deu a você: ${it.nome}. A mochila está cheia: foi para o seu baú.`); }
    if (A.bell) A.bell(784, 0.08);
    IT.refresh(); J.salvar();
  }

  /* o baú da dupla: fica no mundo do anfitrião e os dois usam */
  const duplaObj = () => { if (!J.prog) return {}; J.prog.bauDupla = J.prog.bauDupla || {}; return J.prog.bauDupla; };
  if (IT_) IT_.dupla = {
    ativo: () => J.modo === 'jogo' && !!J.prog && (CO.ativo() ? (CO.anfitriao() || CO.colegaOn) : Object.values(J.prog.bauDupla || {}).some(n => n > 0)),
    lista: () => (J.prog && J.prog.bauDupla) || {},
    guardar(id) {
      if (CO.convidado() && !CO.colegaOn) { ui.toast('O anfitrião está fora: o baú do grupo espera ele voltar.'); return; }
      if (!IT_.tirar(id)) return;
      const b = duplaObj(); b[id] = (b[id] || 0) + 1;
      if (CO.convidado()) CO.enviar({ t: 'dupla', op: 'guardar', id }); else { J.salvar(); if (CO.colegaOn) enviarMundo(true); }
      J.salvar();
    },
    pegar(id) {
      const b = duplaObj(); if (!(b[id] > 0)) return;
      if (!IT_.cabe(1, id)) { ui.toast('A mochila está cheia.'); return; }
      if (CO.convidado()) {
        if (!CO.colegaOn) { ui.toast('O anfitrião está fora: o baú do grupo espera ele voltar.'); return; }
        b[id]--; if (b[id] <= 0) delete b[id];
        CO.enviar({ t: 'dupla', op: 'pegar', id }); // o item chega quando o anfitrião confirma
      } else {
        b[id]--; if (b[id] <= 0) delete b[id];
        IT_.mochila().itens[id] = (IT_.mochila().itens[id] || 0) + 1;
        J.salvar(); if (CO.colegaOn) enviarMundo(true);
      }
    }
  };
  function duplaDoConvidado(m) {
    if (J.modo !== 'jogo' || !OV.ITENS[m.id]) return;
    const b = duplaObj();
    if (m.op === 'guardar') b[m.id] = (b[m.id] || 0) + 1;
    else if (m.op === 'pegar') {
      if (b[m.id] > 0) { b[m.id]--; if (b[m.id] <= 0) delete b[m.id]; CO.enviar({ t: 'dupla_ok', para: m.de, id: m.id }); }
      else CO.enviar({ t: 'dupla_nao', para: m.de, id: m.id });
    }
    J.salvar(); enviarMundo(true); if (OV.itens.refresh) OV.itens.refresh();
  }
  const interagir0 = J.interagir;
  J.interagir = function () {
    if (CO.convidado()) {
      if (J.ativo() && !P.dead && M.interativoProximo(P.pos.x, P.pos.z)) return interagir0.call(J);
      avisoUmaVez('interagir', `No co-op, quem conversa e mexe no mundo é ${CO.colegaNome || 'o anfitrião'}. A Casa do Peregrino e o baú dela você usa à vontade.`); return;
    }
    return interagir0.call(J);
  };
  const viajar0 = J.viajar;
  J.viajar = function (id) { if (CO.convidado()) { ui.toast('No co-op vocês andam juntos: só o anfitrião viaja pelos Oratórios.'); return; } return viajar0.call(J, id); };
  // o convidado salva só o próprio personagem, sem mexer no mundo dele
  const salvar0 = J.salvar;
  J.salvar = function () {
    if (!CO.convidado()) return salvar0.call(J);
    if (!P.pers) return false;
    const s = S.ler() || { v: 2, prog: { derrotados: [], soberba: false, oratorios: {}, visitados: [] } };
    s.pers = P.pers; return S.gravar(s);
  };
  // quem cai desperta sozinho no Oratório; o outro continua onde está, e o mundo não para
  CO.separados = false;
  const morreu0 = J.morreu;
  J.morreu = function () {
    const vivosAgora = presentes().filter(Q => !Q.dead);
    const comColega = CO.ativo() && vivosAgora.length > 0;
    if (!CO.convidado() && !comColega) return morreu0.call(J);
    setTimeout(() => {
      if (!CO.ativo() || J.modo !== 'jogo' || !P.dead) return;
      const vivos = presentes().filter(Q => !Q.dead);
      const parcial = CO.convidado() || vivos.length > 0;
      J.renascer(parcial);
      CO.separados = true; ultimaPos = null;
      ui.toast(vivos.length ? `Você caiu e despertou no Oratório. ${listaNomes(vivos.map(Q => Q.slot))} ${vivos.length > 1 ? 'continuam' : 'continua'} lutando: vá ao encontro.` : 'Você caiu e despertou no Oratório. Os seus companheiros também caíram.');
      if (CO.convidado()) J.salvar();
    }, 3000);
  };
  function irParaColega(cortar, x, z, f) {
    const R = remDe(0);
    const ax = x !== undefined ? x : (R.alvo ? R.alvo.x : P.pos.x), az = z !== undefined ? z : (R.alvo ? R.alvo.z : P.pos.z), af = f !== undefined ? f : (R.facingAlvo || 0);
    let px = ax - Math.sin(af) * 1.6 + Math.cos(af) * 0.8, pz = az - Math.cos(af) * 1.6 - Math.sin(af) * 0.8;
    const q = { x: px, z: pz }; M.collide(q, 0.45);
    C.posicionar(q.x, q.z, af); OV.cam.yaw = af + Math.PI;
    if (cortar) J.mudouLugar();
  }
  let longeAvisoT = 0;
  function convidadoPerto(dt) {
    const R = remDe(0);
    if (!R.alvo || P.dead || R.dead) return;
    if (CO.separados) { if (Math.hypot(R.alvo.x - P.pos.x, R.alvo.z - P.pos.z) < 30) CO.separados = false; return; }
    const d = Math.hypot(R.alvo.x - P.pos.x, R.alvo.z - P.pos.z);
    longeAvisoT -= dt;
    if (d > 55 && longeAvisoT <= 0) { longeAvisoT = 8; ui.toast(`Fique perto de ${CO.colegaNome || 'o seu companheiro'}: no co-op vocês caminham juntos.`); }
  }

  /* =====================================================================
     O RELÓGIO DO CO-OP: manda o próprio estado e cuida do mundo
     ===================================================================== */
  let ultimoTick = performance.now(), haverT = 0;
  setInterval(() => {
    const agora = performance.now(), dt = Math.min(0.5, (agora - ultimoTick) / 1000); ultimoTick = agora;
    atualizarFaixa(); atualizarTag(true);
    if (!CO.ativo() || !CO.conectado) return;
    if (J.modo !== 'jogo' || !P.pers || !CO.on.size) return;
    CO.enviar(meuEstado());
    if (CO.anfitriao() && CO.colegaOn) {
      CO.enviar({ t: 'inim', l: fotoInimigos() });
      mundoT -= dt; if (mundoT <= 0) { mundoT = 1; enviarMundo(false); enviarAlvos(); }
      horaT -= dt; if (horaT <= 0 && OV.tempo) { horaT = 2; CO.enviar({ t: 'hora', h: r2(OV.tempo.hora) }); }
      haverT -= dt; if (haverT <= 0) { haverT = 1; CO.marcarHaveres(); }
      andarJuntos(dt);
    }
    if (CO.convidado()) { aplicarMundoAgora(); if (J.ativo()) convidadoPerto(dt); }
  }, 100);

  /* =====================================================================
     AS MENSAGENS QUE CHEGAM
     ===================================================================== */
  function receber(m) {
    for (let i = esperas.length - 1; i >= 0; i--) if (esperas[i].teste(m)) { const w = esperas.splice(i, 1)[0]; w.ok(m); }
    switch (m.t) {
      case 'colega_entrou': aoColegaEntrar(m.slot || 0, m.nome, m.voltou); break;
      case 'colega_saiu': aoColegaSair(m.slot || 0); break;
      case 'sala_fechada': if (CO.convidado()) { aviso('O anfitrião não voltou. O co-op terminou e o seu personagem foi salvo.'); encerrar(true); } break;
      case 'eu': receberEu(m); break;
      // do anfitrião para o convidado
      case 'mundo': if (CO.convidado()) receberMundo(m); break;
      case 'inim': if (CO.convidado()) receberInimigos(m); break;
      case 'morte': if (CO.convidado()) receberMorte(m); break;
      case 'ferir': if (CO.convidado()) serFerido(m); break;
      case 'fx': if (CO.convidado()) efeitoRemoto(m); break;
      case 'fala': if (CO.convidado() && J.modo === 'jogo') mostrarFala(m); break;
      case 'cena': if (CO.convidado() && HI() && J.modo === 'jogo') HI().prologoEspelho(m.qual, CO.colegaNome); break;
      case 'poema': case 'cena_cam': case 'cena_fim': case 'cena_pag': if (CO.convidado()) cenaDoAnfitriao(m); break;
      case 'entrega': { const H = remDe(0); if (CO.convidado() && J.modo === 'jogo' && OV.aventura && OV.aventura.espelharEntrega && H.alvo && Math.hypot(H.alvo.x - P.pos.x, H.alvo.z - P.pos.z) < 60) OV.aventura.espelharEntrega(Object.assign(m, { quem: H })); } break;
      case 'alvos': if (CO.convidado()) CO.alvosHost = m.a || {}; break;
      case 'hora': if (CO.convidado() && OV.tempo && Math.abs(OV.tempo.hora - m.h) > 0.08 && Math.abs(OV.tempo.hora - m.h) < 23.9) OV.tempo.definir(m.h); break;
      case 'aviso': if (CO.convidado()) ui.toast(m.txt); break;
      case 'recompensa': if (CO.convidado()) receberRecompensa(m); break;
      case 'xp': if (CO.convidado() && P.pers && J.modo === 'jogo') C.ganharXp(m.n || 0); break;
      case 'presente': receberPresente(m); break;
      case 'dupla': if (CO.anfitriao()) duplaDoConvidado(m); break;
      case 'dupla_ok': if (CO.convidado() && P.pers) { const IT = OV.itens; if (!IT.dar(m.id, 1, true)) P.pers.bau[m.id] = (P.pers.bau[m.id] || 0) + 1; IT.refresh(); J.salvar(); } break;
      case 'dupla_nao': if (CO.convidado()) { ui.toast('Esse item já tinha saído do baú do grupo.'); OV.itens.refresh(); } break;
      case 'teleporte': if (CO.convidado() && J.modo === 'jogo' && !P.dead) { irParaColega(true, m.x, m.z, m.f); if (m.motivo === 'longe') ui.toast(`Você se afastou demais e voltou para perto de ${CO.colegaNome || 'o anfitrião'}.`); } break;
      case 'fim': if (CO.convidado()) { aviso(`${CO.colegaNome || 'O anfitrião'} encerrou a sessão. O seu personagem foi salvo.`); encerrar(true); } break;
      // do convidado para o anfitrião
      case 'golpe': if (CO.anfitriao()) aplicarGolpeDoColega(m); break;
      case 'atordoar': if (CO.anfitriao()) { const e = porIdH(m.id); if (e) atordoar0.call(I, e, m.s || 1); } break;
      case 'pedir_mundo': if (CO.anfitriao() && J.modo === 'jogo') { enviarMundo(true); alvosTxt = ''; enviarAlvos(); } break;
      // dos dois lados
      case 'fxp': efeitoDoColega(m); break;
    }
  }
  function aoColegaEntrar(slot, nome, voltou, quieto) {
    const mult0 = CO.multiplicador();
    CO.on.add(slot); if (nome) CO.nomes[slot] = nome; remDe(slot);
    recalcularColegas();
    if (CO.anfitriao()) {
      if (!quieto) { ui.toast(`${nomeDe(slot)} ${voltou ? 'voltou para' : 'entrou na'} sala. ${avisoForca(mult0)}`); A.bell(659, 0.12); }
      if (J.modo === 'jogo') { ultimoMundo = ''; alvosTxt = ''; enviarMundo(true); }
      reescalar();
    } else {
      if (slot === 0 && J.modo === 'jogo') CO.enviar({ t: 'pedir_mundo' });
      else if (slot > 0 && !quieto && J.modo === 'jogo') ui.toast(`${nomeDe(slot)} ${voltou ? 'voltou para' : 'entrou na'} sala.`);
    }
    atualizarTag();
  }
  function aoColegaSair(slot) {
    const mult0 = CO.multiplicador();
    CO.on.delete(slot); tirarColega(REM.get(slot)); recalcularColegas();
    if (CO.anfitriao()) { ui.toast(`${nomeDe(slot)} saiu da sala. Pode voltar com o mesmo código. ${avisoForca(mult0)}`); reescalar(); }
    else if (slot === 0) {
      if (J.modo === 'jogo') aviso(`${nomeDe(0)} caiu. Esperando ele voltar…`);
      if (CO.espelho && D.aberto) { CO.espelho = false; fechar0.call(D); }
    } else if (J.modo === 'jogo') ui.toast(`${nomeDe(slot)} saiu da sala.`);
    atualizarTag();
  }
  // a força dos vícios acompanha o tamanho do grupo: quem já está no mundo cresce (ou volta) na mesma hora
  function avisoForca(mult0) {
    const k = CO.multiplicador(); if (k === mult0) return '';
    return k > mult0 ? `Com ${CO.jogadores()} peregrinos, os vícios ficam ${String(k).replace('.', ',')}x mais fortes.` : `Os vícios voltam a ${String(k).replace('.', ',')}x.`;
  }
  function reescalar() {
    if (!CO.anfitriao()) return;
    const k = CO.multiplicador();
    I.lista.forEach(e => {
      if (e.removed || e.state === 'dead' || e.state === 'liberto' || !e.def || !e.def.multCoop || e.def.multCoop === k) return;
      const f = k / e.def.multCoop;
      e.def = Object.assign({}, e.def, { hp: Math.round(e.def.hp * f), dmg: Math.round(e.def.dmg * f), multCoop: k });
      e.hp = Math.max(1, Math.round(e.hp * f));
    });
  }
  CO.reescalar = reescalar;

  /* =====================================================================
     ENTRAR NO JOGO E SAIR
     ===================================================================== */
  // o convidado entra no mundo do anfitrião, com o próprio personagem; o anfitrião entra no próprio mundo
  const comecar0 = J.comecar;
  J.comecar = function (pers, prog, novo) {
    if (CO.convidado()) {
      // o anfitrião ainda não começou: o personagem fica guardado e entra sozinho assim que o mundo chegar
      if (!CO.mundoHost) { CO.entrandoCom = pers; telaStatus('Quase lá', `Esperando ${esc(CO.colegaNome || 'o anfitrião')} começar o jogo. Você entra sozinho assim que o mundo dele abrir.`); CO.enviar({ t: 'pedir_mundo' }); return; }
      CO.entrandoCom = null;
      const hi = HI(), sp = hi ? hi.semPrologo : false; if (hi) hi.semPrologo = true;
      comecar0.call(J, pers, JSON.parse(JSON.stringify(CO.mundoHost)), false);
      if (hi) hi.semPrologo = sp;
      if (OV.tempo && typeof CO.horaHost === 'number') OV.tempo.definir(CO.horaHost);
      porIdC.clear(); limparLocais(); irParaColega(true);
      ui.toast(`Você entrou no mundo de ${CO.colegaNome || 'o anfitrião'}.`);
      CO.enviar({ t: 'pedir_mundo' }); atualizarTag();
      return;
    }
    comecar0.call(J, pers, prog, novo);
    if (CO.anfitriao()) { ultimaPos = null; if (CO.colegaOn) { ultimoMundo = ''; enviarMundo(true); } atualizarTag(); }
  };
  const irMenu0 = J.irMenu;
  J.irMenu = function () {
    const estavaNoJogo = J.modo === 'jogo';
    if (CO.ativo() && estavaNoJogo) {
      if (CO.convidado()) J.salvar(); else CO.enviar({ t: 'fim' });
      irMenu0.call(J); encerrar(false); return;
    }
    irMenu0.call(J);
  };
  function encerrar(voltarAoMenu) {
    CO.saindo = true;
    const ws = CO.ws; CO.ws = null; CO.conectado = false;
    if (ws) try { ws.close(); } catch (e) { /* nada */ }
    if (CO.convidado() && J.modo === 'jogo') J.salvar();
    const eraConvidado = CO.convidado();
    CO.papel = null; CO.codigo = null; CO.ficha = null; CO.colegaOn = false; CO.mundoHost = null; CO.espelho = false; CO.entrandoCom = null; CO.separados = false;
    CO.on.clear(); CO.nomes = {}; CO.slot = 0;
    S.padrao = 'solo';
    tirarTodos(); porIdC.clear(); atualizarTag();
    setTimeout(() => { CO.saindo = false; }, 500);
    if (voltarAoMenu && J.modo === 'jogo') setTimeout(() => { if (D.aberto) fechar0.call(D); irMenu0.call(J); }, eraConvidado ? 2500 : 0);
  }
  CO.encerrar = encerrar;

  /* =====================================================================
     A TELA DE ENTRADA DO CO-OP
     ===================================================================== */
  const tag = document.createElement('div'); tag.id = 'coopTag'; tag.hidden = true; document.body.appendChild(tag);
  let tagTxt = '';
  function atualizarTag(soSeMudou) {
    let t = '';
    if (CO.ativo() && J.modo === 'jogo') {
      if (!CO.conectado) t = '<b>Co-op</b> · reconectando…';
      else if (CO.anfitriao()) t = CO.colegaOn ? `<b>Co-op</b> · sala ${CO.on.size < VAGAS - 1 ? `<span class="cod">${CO.codigo}</span>` : CO.codigo} · com ${esc(CO.colegaNome)} · vícios ${String(CO.multiplicador()).replace('.', ',')}x` : `<b>Co-op</b> · sala <span class="cod">${CO.codigo}</span> · passe o código aos seus colegas (até 3)`;
      else { const outros = [...CO.on].filter(k => k > 0).sort(); t = `<b>Co-op</b> · no mundo de ${esc(nomeDe(0))}${outros.length ? ' · com ' + esc(listaNomes(outros)) : ''}${CO.colegaOn ? '' : ' · esperando ele voltar'}`; }
    }
    if (soSeMudou && t === tagTxt) return;
    tagTxt = t; tag.innerHTML = t; tag.hidden = !t;
  }
  let avisados = {};
  function avisoUmaVez(k, txt) { const a = performance.now(); if (avisados[k] && a - avisados[k] < 5000) return; avisados[k] = a; ui.toast(txt); }
  function aviso(txt) { if (J.modo === 'jogo') ui.toast(txt); else { const s = $('coopStatus'); if (s) s.textContent = txt; } }

  const menu0 = ui.menu;
  ui.menu = function (save) {
    menu0.call(ui, save);
    const card = document.querySelector('#ov .card.menu'); if (!card) return;
    const div = document.createElement('div'); div.className = 'coop-menu';
    if (CO.disponivel()) div.innerHTML = `<div class="menu-actions"><button class="btn ghost" data-coop="criar">Criar sala</button><button class="btn ghost" data-coop="entrar">Entrar com código</button></div>`;
    else div.innerHTML = `<p class="note">O co-op funciona quando o jogo é aberto pelo link do servidor (Render).</p>`;
    const alvo = card.querySelector('.menu-coop');
    if (alvo) alvo.appendChild(div); else { const acoes = card.querySelector('.menu-actions'); if (acoes) acoes.insertAdjacentElement('afterend', div); else card.appendChild(div); }
  };
  function telaStatus(titulo, txt) {
    ui.ov(`<div class="card coop"><p class="eyebrow">Co-op · até 4 jogadores</p><h2 class="title">${titulo}</h2><p class="coop-status" id="coopStatus">${txt}</p><div class="menu-actions"><button class="btn ghost" data-coop="cancelar">Voltar</button></div></div>`, 'menu');
  }
  async function conectarComAviso() {
    telaStatus('Conectando…', 'Procurando o servidor…');
    const ok = await acordar(s => aviso(s < 4 ? 'Procurando o servidor…' : `O servidor estava dormindo e está acordando (${s} s). No plano grátis isso leva até um minuto.`));
    if (!ok) { aviso('O servidor não respondeu. Confira a internet e tente de novo.'); return null; }
    try { const ws = await abrirWs(); ligar(ws); return ws; } catch (e) { aviso('Não foi possível conectar à sala. Tente de novo.'); return null; }
  }
  // ao abrir ou entrar numa sala, nenhum mundo está escolhido ainda: quem joga escolhe um dos 3 mundos de co-op
  function prepararMundosCoop() { S.slot = 0; S.padrao = 'coop'; }
  const ultimoCoop = () => { const n = S.ultimo('coop'); return n ? S.lerSlot('coop', n) : null; };
  async function criarSala() {
    CO.saindo = false; prepararMundosCoop();
    const s = ultimoCoop();
    if (!(await conectarComAviso())) return;
    CO.enviar({ t: 'criar', versao: VERSAO, nome: s && s.pers ? s.pers.nome : 'Anfitrião' });
    const r = await esperar(m => m.t === 'sala' || m.t === 'erro', 10000);
    if (!r || r.t !== 'sala') { aviso(r ? r.msg : 'O servidor não respondeu.'); return; }
    CO.papel = 'anfitriao'; CO.codigo = r.codigo; CO.ficha = r.ficha; CO.slot = 0; CO.on.clear(); CO.nomes = { 0: s && s.pers ? s.pers.nome : 'Anfitrião' }; recalcularColegas();
    embrulharMissoes(); embrulharHistoria(); embrulharCenas();
    telaAnfitriao();
  }
  function telaAnfitriao() {
    ui.ov(`<div class="card coop"><p class="eyebrow">Co-op · você é o anfitrião</p><h2 class="title">Sala criada</h2>
      <p class="coop-codigo" aria-label="Código da sala">${CO.codigo}</p>
      <p class="coop-status" id="coopStatus">Passe este código aos seus colegas (até três). Cada um abre o mesmo link e escolhe «Entrar com código».</p>
      <ul class="coop-regras"><li>O jogo acontece no <b>seu</b> mundo, e é você quem salva.</li><li>Com dois peregrinos, os vícios ficam <b>2,5x mais fortes e mais resistentes</b>; com três ou quatro, <b>3,5x</b>.</li><li>Quem abre um menu congela o mundo para os dois.</li><li>Vocês andam juntos: barco, viagem e masmorra levam o colega.</li></ul>
      <p class="eyebrow mundos-tit">Escolha o mundo de co-op</p>${ui.mundos('coop', 'anfitriao')}
      <div class="menu-actions"><button class="btn ghost" data-coop="cancelar">Cancelar</button></div></div>`, 'menu');
    const f = document.querySelector('#ov .mundos .btn'); if (f) f.setAttribute('data-foco', '');
  }
  function telaCodigo() {
    ui.ov(`<div class="card coop"><p class="eyebrow">Co-op · entrar numa sala</p><h2 class="title">Código da sala</h2>
      <p class="coop-status" id="coopStatus">Digite as 4 letras que o anfitrião passou.</p>
      <input id="coopCodigo" class="coop-input" maxlength="4" autocomplete="off" spellcheck="false" aria-label="Código da sala" placeholder="ABCD">
      <div class="menu-actions"><button class="btn" data-coop="juntar">Entrar</button><button class="btn ghost" data-coop="cancelar">Voltar</button></div></div>`, 'menu');
    const inp = $('coopCodigo'); inp.focus();
    inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
    inp.addEventListener('keydown', ev => { if (ev.code === 'Enter' || ev.code === 'NumpadEnter') juntar(); });
  }
  async function juntar() {
    const inp = $('coopCodigo'); const codigo = inp ? inp.value.trim().toUpperCase() : '';
    if (!/^[A-Z]{4}$/.test(codigo)) { aviso('O código tem 4 letras.'); return; }
    CO.saindo = false; prepararMundosCoop();
    const s = ultimoCoop();
    if (!(await conectarComAviso())) return;
    CO.enviar({ t: 'entrar', codigo, versao: VERSAO, nome: s && s.pers ? s.pers.nome : 'Convidado' });
    const r = await esperar(m => m.t === 'sala' || m.t === 'erro', 10000);
    if (!r || r.t !== 'sala') { aviso(r ? r.msg : 'O servidor não respondeu.'); if (CO.ws) try { CO.ws.close(); } catch (e) { /* nada */ } return; }
    CO.papel = 'convidado'; CO.codigo = r.codigo; CO.ficha = r.ficha; CO.slot = r.slot || 1; CO.mundoHost = null;
    CO.on.clear(); CO.nomes = { 0: r.colega || 'o anfitrião' }; (r.jogadores || []).forEach(j => { CO.on.add(j.slot); CO.nomes[j.slot] = j.nome; });
    if (r.colegaOn) CO.on.add(0); recalcularColegas();
    embrulharMissoes(); embrulharHistoria(); embrulharCenas();
    CO.enviar({ t: 'pedir_mundo' });
    telaConvidado();
  }
  function telaConvidado() {
    if (!CO.convidado() || J.modo === 'jogo') return;
    const pronto = !!CO.mundoHost;
    ui.ov(`<div class="card coop coop-convidado"><p class="eyebrow">Co-op · você é o convidado</p><h2 class="title">Sala ${CO.codigo}</h2>
      <p class="coop-status" id="coopStatus">${pronto ? `Você vai jogar no mundo de ${esc(CO.colegaNome)}. Escolha o seu personagem:` : `${esc(CO.colegaNome)} ainda não começou o jogo. Os botões se acendem assim que o mundo dele abrir.`}</p>
      <ul class="coop-regras"><li>Você leva o seu personagem: XP, moedas e itens ficam com você.</li><li>O mundo, as missões e as conversas são do anfitrião; você vê e luta junto${[...CO.on].filter(k => k > 0).length ? ' com ' + esc(listaNomes([...CO.on].filter(k => k > 0).sort())) : ''}.</li><li>A Casa do Peregrino é sua: abra o baú quando quiser.</li></ul>
      <p class="eyebrow mundos-tit">Com qual personagem? (os seus mundos de co-op)</p>${ui.mundos('coop', 'convidado', pronto)}
      <div class="menu-actions"><button class="btn ghost" data-coop="cancelar">Sair da sala</button></div></div>`, 'menu');
  }
  // o mundo do anfitrião chegou: acende os botões na tela que já está aberta, sem trocar de tela
  function atualizarTelaConvidado() {
    const card = document.querySelector('#ov .card.coop-convidado');
    if (!card) return; // o convidado está criando o personagem (ou em outra tela): não mexe
    telaConvidado();
  }
  $('ov').addEventListener('click', ev => {
    const b = ev.target.closest('[data-coop]'); if (!b) return;
    A.init();
    const a = b.dataset.coop;
    if (a === 'criar') criarSala();
    else if (a === 'entrar') telaCodigo();
    else if (a === 'juntar') juntar();
    else if (a === 'cancelar') { encerrar(false); irMenu0.call(J); }
  });

  // as embalagens que dependem de módulos carregados antes (missões, história, cenas) entram já
  embrulharMissoes(); embrulharHistoria(); embrulharCenas();
  // o menu já estava na tela antes deste arquivo carregar: desenha de novo, agora com o co-op
  if (J.modo === 'menu' && ui.ovAberto()) ui.menu(S.ler());
  CO._teste = { get R() { return CO.R; }, REM, remDe, porIdC, fotoInimigos, limparLocais, receber, motivoLocal, reescalar };
})(window.OV);

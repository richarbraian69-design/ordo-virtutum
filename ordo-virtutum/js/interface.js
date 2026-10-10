/* Ordo Virtutum — interface: HUD, menus, criação de personagem, ficha */
(function (OV) {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ui = {};
  OV.ui = ui;
  ui.esc = esc;

  /* ---- avisos: cada um na sua tira de papel, empilhados, com tempo para ler ---- */
  const lastToast = {}, filaToast = [];
  const MAX_TOAST = 3;
  function mostrarToast(msg) {
    const box = $('toast');
    const t = document.createElement('div'); t.className = 't'; t.textContent = msg;
    box.appendChild(t); void t.offsetWidth; t.classList.add('on');
    const dur = Math.min(11000, 5200 + msg.length * 55); // tempo de sobra para ler
    setTimeout(() => { t.classList.remove('on'); t.classList.add('sai'); setTimeout(() => { t.remove(); if (filaToast.length) mostrarToast(filaToast.shift()); }, 450); }, dur);
  }
  ui.toast = function (msg) {
    if (!msg) return;
    const now = performance.now(); if (lastToast[msg] && now - lastToast[msg] < 1500) return; lastToast[msg] = now;
    const box = $('toast');
    if (box.querySelectorAll('.t:not(.sai)').length >= MAX_TOAST) { if (!filaToast.includes(msg)) filaToast.push(msg); return; }
    mostrarToast(msg);
  };
  ui.limparToasts = function () { filaToast.length = 0; $('toast').innerHTML = ''; };

  /* ---- opções do jogador (volume, câmera, minimapa): ficam guardadas neste navegador ---- */
  const OPC0 = { musica: 0.7, efeitos: 0.85, sens: 1, minimapa: true, bussola: true };
  ui.opcoes = Object.assign({}, OPC0);
  try { const o = JSON.parse(localStorage.getItem('ordo_opcoes') || 'null'); if (o) Object.assign(ui.opcoes, o); } catch (e) { /* sem armazenamento */ }
  ui.aplicarOpcoes = function () {
    const o = ui.opcoes;
    if (OV.audio && OV.audio.volumes) OV.audio.volumes(o.musica, o.efeitos);
    const mm = $('minimapa'), bs = $('bussola');
    if (mm && ui._hudOn) mm.hidden = !o.minimapa;
    if (bs && ui._hudOn) bs.hidden = !o.bussola;
  };
  ui.salvarOpcoes = function () { try { localStorage.setItem('ordo_opcoes', JSON.stringify(ui.opcoes)); } catch (e) { /* sem armazenamento */ } ui.aplicarOpcoes(); };

  /* ---- HUD (só escreve no DOM quando o valor muda) ---- */
  const setW = (el, frac) => { const v = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%'; if (el._w !== v) { el.style.width = v; el._w = v; } };
  const setT = (el, t) => { t = String(t); if (el._t !== t) { el.textContent = t; el._t = t; } };
  ui.mostrarHud = function (on) {
    ui._hudOn = on;
    ['hud', 'tracker'].forEach(id => { $(id).hidden = !on; });
    $('minimapa').hidden = !on || !ui.opcoes.minimapa; $('bussola').hidden = !on || !ui.opcoes.bussola;
    $('slots').hidden = !on; $('keysLegend').hidden = true;
    if (!on) { $('habs').hidden = true; $('diario').hidden = true; ui.prompt(null); $('prayBox').hidden = true; $('alvo').hidden = true; $('fala').hidden = true; $('banner').classList.remove('on'); }
  };
  // a barra de orações e habilidades só aparece quando é usada ou está recarregando
  let usoT = 0;
  ui.marcarUso = function () { usoT = performance.now(); };

  /* ---- nome do lugar, faixa de região e falas ---- */
  let bannerT = 0, falaT = 0;
  ui.local = function (nome) { $('localN').textContent = nome; };
  ui.banner = function (nome) {
    const b = $('banner'); b.querySelector('h2').textContent = nome; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), 3400);
  };
  ui.fala = function (nome, texto) {
    const f = $('fala'); f.querySelector('b').textContent = nome; f.querySelector('p').textContent = texto; f.hidden = false;
    clearTimeout(falaT); falaT = setTimeout(() => { f.hidden = true; }, Math.max(4500, texto.length * 70));
  };
  ui.fecharFala = function () { $('fala').hidden = true; };
  let lastChips = '';
  ui.hud = function (P) {
    const D = P.D; if (!D) return;
    setW($('hpF'), P.hp / D.maxHp); setT($('hpN'), Math.ceil(P.hp));
    setW($('staF'), P.sta / D.maxSta); setT($('staN'), Math.ceil(Math.max(0, P.sta)));
    setW($('feF'), P.fe / D.maxFe); setT($('feN'), Math.floor(P.fe));
    const pers = P.pers;
    const need = OV.xpParaProximo(pers.nivel);
    setW($('xpF'), pers.nivel >= OV.NIVEL_MAX ? 1 : pers.xp / need);
    setT($('nivelN'), pers.nivel + (pers.pontos > 0 ? ` · ${pers.pontos} ponto${pers.pontos > 1 ? 's' : ''} para distribuir (C)` : ''));
    let h = '';
    for (const k in P.status) h += `<div class="chip"><b>${OV.STATUS[k].label}</b> — ${OV.STATUS[k].desc}<span>${Math.ceil(P.status[k])}s</span></div>`;
    if (h !== lastChips) { $('chips').innerHTML = h; lastChips = h; }
    const pb = $('prayBox');
    const orando = P.praying || P.oratT > 0;
    if (pb.hidden === orando) pb.hidden = !orando;
    if (orando) {
      setT($('prayLabel'), P.oratT > 0 ? (P.oratAlvo ? P.oratAlvo.nome : 'Oratório') : 'Recolhimento');
      setW($('prayF'), P.oratT > 0 ? (1 - P.oratT / 1.6) : Math.min(1, P.prayT / 2));
    }
    ui.slots(P);
    // em paz (tudo cheio, sem vícios e sem alvo), o painel esmaece para não pesar sobre a cena
    const calmo = P.hp >= D.maxHp - 0.5 && P.sta >= D.maxSta - 0.5 && P.fe >= D.maxFe - 0.5 && !h && !P.alvo && !orando;
    const hud = $('hud'); if (hud._calmo !== calmo) { hud.classList.toggle('calmo', calmo); hud._calmo = calmo; }
    setT($('denN'), (pers.denarios || 0) + ' denários');
    if (OV.tempo) setT($('relogio'), P.pos.x > 200 ? '✠ Sob a terra' : OV.tempo.rotulo());
    if (OV.habilidades) ui.habs(P);
    // orações e habilidades: recolhidas, a não ser logo depois de usar alguma ou enquanto recarregam
    let rec = false; for (const k in P.cd) if (P.cd[k] > 0) { rec = true; break; }
    if (!rec && OV.habilidades) for (const k in OV.habilidades.cd) if (OV.habilidades.cd[k] > 0) { rec = true; break; }
    const vis = rec || performance.now() - usoT < 2600 || !!P.alvo;
    const sl = $('slots'); if (sl._vis !== vis) { sl.classList.toggle('recolhida', !vis); $('habs').classList.toggle('recolhida', !vis); sl._vis = vis; }
  };
  ui.identidade = function (pers) {
    const o = OV.ORDENS[pers.ordem];
    $('heroNome').textContent = pers.nome;
    $('heroTitulo').textContent = `${o.titulo[pers.sexo]} · ${o.ordem[pers.sexo]}`;
  };

  /* ---- barra de orações ---- */
  ui.montarSlots = function () {
    const items = [{ key: 'Q', nome: OV.SINAL.nome, custo: OV.SINAL.custo, id: 'sinal' }].concat(OV.ORACOES.map(o => ({ key: String(o.slot), nome: o.nome, custo: o.custo, id: o.id, bloq: o.bloq })));
    $('slots').innerHTML = items.map(it => `<div class="slot${it.bloq ? ' locked' : ''}" data-slot="${it.id || ''}" title="${esc(it.bloq || '')}">
      <kbd>${it.key}</kbd><b>${esc(it.nome)}</b><span>${it.bloq ? 'Bloqueada' : it.custo + ' de Fé'}</span><i></i></div>`).join('');
  };
  ui.slots = function (P) {
    document.querySelectorAll('#slots .slot').forEach(el => {
      const id = el.dataset.slot; if (!id) return;
      const def = id === 'sinal' ? OV.SINAL : OV.ORACOES.find(o => o.id === id);
      const cd = P.cd[id] || 0;
      const custo = id === 'sinal' ? def.custo : OV.combate.custoOracao(def.custo);
      const sem = P.fe < custo || !!P.status.soberba;
      if (el._dim !== sem) { el.classList.toggle('dim', sem); el._dim = sem; }
      const i = el.querySelector('i'), hv = (cd > 0 ? cd / def.recarga * 100 : 0).toFixed(0) + '%';
      if (i._h !== hv) { i.style.height = hv; i._h = hv; }
    });
  };

  /* ---- barra de habilidades da ordem ---- */
  let habsKey = '';
  ui.montarHabs = function () {
    const H = OV.habilidades, ats = H ? H.ativas() : [];
    const box = $('habs');
    if (!ats.length) { box.hidden = true; box.innerHTML = ''; habsKey = ''; return; }
    box.innerHTML = ats.map(h => `<div class="slot hab" data-hab="${h.id}"><kbd>${h.tecla}</kbd><b>${esc(h.nome)}</b><span></span><i></i></div>`).join('');
    box.hidden = false; habsKey = '';
  };
  ui.habs = function (P) {
    const H = OV.habilidades; const box = $('habs'); if (box.hidden) return;
    box.querySelectorAll('[data-hab]').forEach(el => {
      const h = H.lista().find(x => x.id === el.dataset.hab);
      const travada = P.pers.nivel < h.nivel;
      const txt = travada ? `Nível ${h.nivel}` : h.alterna ? (H.postura === 'labora' ? 'Labora' : H.postura === 'ora' ? 'Ora' : 'Escolher postura') : h.consomeTudo ? `Toda a Fé (mín. ${h.custo})` : h.custo ? `${h.custo} de Fé` : 'Sem custo de Fé';
      const sp = el.querySelector('span'); if (sp._t !== txt) { sp.textContent = txt; sp._t = txt; }
      const dim = travada || P.fe < h.custo;
      if (el._dim !== dim) { el.classList.toggle('dim', dim); el._dim = dim; }
      if (el._tr !== travada) { el.classList.toggle('locked', travada); el._tr = travada; }
      const cd = H.cd[h.id] || 0, i = el.querySelector('i'), hv = (cd > 0 ? cd / h.recarga * 100 : 0).toFixed(0) + '%';
      if (i._h !== hv) { i.style.height = hv; i._h = hv; }
    });
  };

  /* ---- diálogo: painel é controlado por OV.dialogo ---- */
  ui.clarao = function (cor) {
    const f = $('clarao'); f.style.background = cor || '#fff'; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  };
  ui.diario = function (open, id) { const d = $('diario'); d.hidden = !open; if (open) { if (OV.rumo) { OV.rumo.abrirTela(id); d.innerHTML = OV.rumo.telaMissoes(); } else if (OV.missoes) d.innerHTML = OV.missoes.diario(); } };
  ui.fimAto = function (linhas, cfg) {
    cfg = cfg || { eyebrow: 'Fim do Ato I', titulo: 'O vale voltou a respirar', texto: 'A Lâmpada da Diligência arde de novo sobre o altar de Santa Sabina. A primeira das sete lâmpadas de Albária foi reacesa.', cite: 'As outras seis regiões esperam. O Ato II começa nos Portos do Festim: siga a estrada ao sul da vila.' };
    ui.ov(`<div class="card">
      <p class="eyebrow">${esc(cfg.eyebrow)}</p><h1 class="title">${esc(cfg.titulo)}</h1>${RULE}
      <p>${esc(cfg.texto)}</p>
      <ul class="resumo">${linhas.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
      <p class="cite">${esc(cfg.cite)}</p>
      <div class="menu-actions"><button class="btn" data-act="retomar" data-foco>Continuar explorando</button><button class="btn ghost" data-act="menu">Voltar ao menu</button></div>
    </div>`);
  };

  /* ---- prompt de interação ---- */
  let lastPrompt = null;
  ui.prompt = function (txt) {
    if (txt === lastPrompt) return; lastPrompt = txt;
    const el = $('prompt'); if (!txt) { el.hidden = true; return; } el.innerHTML = txt; el.hidden = false;
  };

  /* ---- rótulos dos vícios e marcador de alvo ---- */
  ui.criarRotulo = function (nome, nivel, variante) {
    const el = document.createElement('div'); el.className = 'foe' + (variante ? ' ' + variante : '');
    el.innerHTML = `${esc(nome)}<small>Nível ${nivel || 1}</small><div class="track"><div class="fill"></div></div>`;
    $('foes').appendChild(el);
    return { el, fill: el.querySelector('.fill'), nv: el.querySelector('small'), nivel: nivel || 1 };
  };
  const proj = new THREE.Vector3();
  ui.rotulos = function (lista, camera, P, ativo) {
    const alvoEl = $('alvo'); let alvoVis = false;
    lista.forEach(e => {
      if (e.state === 'dead' || e.state === 'liberto' || e.removed || !ativo) { if (e.lab.el.style.display !== 'none') e.lab.el.style.display = 'none'; return; }
      const d = Math.hypot(e.g.position.x - P.pos.x, e.g.position.z - P.pos.z);
      proj.set(e.g.position.x, e.g.position.y + e.def.height + 0.25, e.g.position.z).project(camera);
      if (proj.z > 1 || d > (e.marca > 0 ? 32 : 22) || e.spawnT > 0) { if (e.lab.el.style.display !== 'none') e.lab.el.style.display = 'none'; return; }
      const x = (proj.x * 0.5 + 0.5) * innerWidth, y = (-proj.y * 0.5 + 0.5) * innerHeight;
      if (e.lab.el.style.display !== 'block') e.lab.el.style.display = 'block';
      e.lab.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%)`;
      setW(e.lab.fill, e.hp / e.def.hp);
      const isAlvo = P.alvo === e, isStun = e.state === 'stun';
      if (e.lab._a !== isAlvo) { e.lab.el.classList.toggle('alvo', isAlvo); e.lab._a = isAlvo; }
      if (e.lab._s !== isStun) { e.lab.el.classList.toggle('stun', isStun); e.lab._s = isStun; }
      const pn = P.pers ? P.pers.nivel : 1;
      if (e.lab._pn !== pn) { e.lab._pn = pn; const dif = e.lab.nivel - pn; e.lab.nv.className = dif >= 3 ? 'perigo' : dif <= -3 ? 'fraco' : ''; }
      const marc = e.marca > 0; if (e.lab._m !== marc) { e.lab.el.classList.toggle('marcado', marc); e.lab._m = marc; }
      if (P.alvo === e) {
        proj.set(e.g.position.x, e.g.position.y + e.def.height * 0.55, e.g.position.z).project(camera);
        alvoEl.style.transform = `translate(${((proj.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px,${((-proj.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px) translate(-50%,-50%)`;
        alvoVis = true;
      }
    });
    if (alvoEl.hidden === alvoVis) alvoEl.hidden = !alvoVis;
  };

  /* ---- sobreposições ---- */
  ui.ov = function (html, cls) {
    const ov = $('ov'); ov.className = cls || ''; ov.innerHTML = html; ov.hidden = false;
    const b = ov.querySelector('[data-foco]') || ov.querySelector('button.btn');
    if (b) b.focus({ preventScroll: true });
  };
  ui.fecharOv = function () { $('ov').hidden = true; $('ov').innerHTML = ''; };
  ui.ovAberto = () => !$('ov').hidden;

  const RULE = '<div class="rule"><span>✠</span></div>';
  const CONTROLES = `<dl class="ctl">
    <dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Andar · <kbd>Shift</kbd> segurar para correr (gasta um pouco de fôlego) · <kbd>T</kbd> liga e desliga a corrida contínua</dd>
    <dt>Mouse</dt><dd>Girar a câmera</dd>
    <dt>Clique esquerdo</dt><dd>Golpe leve</dd>
    <dt>Clique direito</dt><dd>Golpe pesado: gasta mais fôlego e às vezes atordoa os vícios comuns</dd>
    <dt><kbd>Espaço</kbd></dt><dd>Esquiva</dd>
    <dt><kbd>Q</kbd></dt><dd>Sinal da Cruz: no instante do golpe inimigo, apara e deixa o vício atordoado</dd>
    <dt><kbd>Tab</kbd></dt><dd>Travar a câmera num alvo</dd>
    <dt><kbd>1</kbd> <kbd>2</kbd></dt><dd>Ave-Maria (cura) · Oração a São Miguel (luz leve em área)</dd>
    <dt><kbd>I</kbd> · <kbd>5</kbd> <kbd>6</kbd></dt><dd>Inventário e equipamentos · usar Pão abençoado e Água benta</dd>
    <dt><kbd>R</kbd> segurar</dt><dd>Recolhimento: recupera Fé e vida e purifica a Ira, a Preguiça e a Gula</dd>
    <dt><kbd>E</kbd></dt><dd>Interagir, conversar e rezar no Oratório (guarda o progresso)</dd>
    <dt><kbd>M</kbd> · <kbd>L</kbd></dt><dd>Mapa da região (clique num Oratório aceso para viajar) · Diário de missões</dd>
    <dt>Oratórios</dt><dd>Rezar guarda o progresso. Num Oratório já aceso, você também pode descansar até o amanhecer ou velar até o anoitecer</dd>
    <dt><kbd>F</kbd> <kbd>G</kbd> <kbd>V</kbd> <kbd>B</kbd></dt><dd>Habilidades da sua ordem, conforme o nível</dd>
    <dt><kbd>C</kbd> · <kbd>Esc</kbd></dt><dd>Ficha · Pausa (a música se liga e desliga na pausa)</dd>
  </dl>`;
  ui.controles = CONTROLES;

  /* ---- os mundos salvos (v22): até 3 individuais e até 3 de co-op, cada um separado ---- */
  ui.atoDe = function (save) {
    const f = (save && save.prog && save.prog.flags) || {};
    if (f.ato4_fim) return ['Ato IV concluído', 'A Lâmpada da Castidade'];
    if (f.ato3_fim) return ['Ato IV', 'A Corte das Máscaras'];
    if (f.ato2_fim) return ['Ato III', 'As Minas de Mamom'];
    if (f.ato1_fim) return ['Ato II', 'Os Portos do Festim'];
    return ['Ato I', 'O Vale de Santa Sabina'];
  };
  const quando = t => { if (!t) return ''; const d = new Date(t); const p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)} às ${p(d.getHours())}:${p(d.getMinutes())}`; };
  ui.descMundo = function (s) {
    const o = OV.ORDENS[s.pers.ordem], classe = o && o.titulo ? o.titulo[s.pers.sexo] || o.titulo.m : s.pers.ordem;
    return `${esc(classe)} · Nível ${s.pers.nivel} · ${ui.atoDe(s)[0]}`;
  };
  // modo: 'menu' (individuais no menu), 'lista' (co-op no menu: só ver e apagar), 'anfitriao', 'convidado'
  ui.mundos = function (tipo, modo, pronto) {
    const S = OV.save, lista = S.lista(tipo), coop = tipo === 'coop';
    return `<ol class="mundos" data-mundos="${tipo}">${lista.map((s, i) => {
      const n = i + 1, at = `data-tipo="${tipo}" data-slot="${n}"`, trava = modo === 'convidado' ? ` data-entrar${pronto ? '' : ' disabled'}` : '';
      let info, acoes = '';
      if (s) {
        info = `<b>${esc(s.pers.nome)}</b><span>${ui.descMundo(s)}</span>${s.salvoEm ? `<small>salvo em ${quando(s.salvoEm)}</small>` : ''}`;
        if (modo === 'menu') acoes = `<button class="btn mini" data-act="jogar" ${at}>Jogar</button><button class="btn ghost mini" data-act="apagar-slot" ${at} aria-label="Apagar o mundo de ${esc(s.pers.nome)}">Apagar</button>`;
        else if (modo === 'lista') acoes = `<button class="btn ghost mini" data-act="apagar-slot" ${at} aria-label="Apagar o mundo de ${esc(s.pers.nome)}">Apagar</button>`;
        else if (modo === 'anfitriao') acoes = `<button class="btn mini" data-act="jogar" ${at}>Jogar este mundo</button>`;
        else acoes = `<button class="btn mini" data-act="jogar" ${at}${trava}>Entrar com ${esc(s.pers.nome)}</button>`;
      } else {
        info = `<b class="vago">Mundo ${n}</b><span>${coop ? 'livre para um mundo de co-op' : 'livre'}</span>`;
        if (modo === 'menu') acoes = `<button class="btn ghost mini" data-act="novo" ${at}>Novo mundo</button>`;
        else if (modo === 'anfitriao') acoes = `<button class="btn ghost mini" data-act="novo" ${at}>Novo mundo co-op</button>`;
        else if (modo === 'convidado') acoes = `<button class="btn ghost mini" data-act="novo" ${at}${trava}>Criar personagem</button>`;
      }
      return `<li class="mundo${s ? '' : ' vazio'}"><span class="mundo-n">${n}</span><div class="mundo-info">${info}</div><div class="mundo-acoes">${acoes}</div></li>`;
    }).join('')}</ol>`;
  };
  ui.menu = function () {
    const S = OV.save, ult = S.ultimo('solo'), s = ult ? S.lerSlot('solo', ult) : null;
    const cont = s && s.pers ? `<button class="btn" data-act="continuar" data-foco>Continuar</button><p class="savemeta">${esc(s.pers.nome)} · ${ui.descMundo(s)} · ${ui.atoDe(s)[1]}</p>` : '';
    ui.ov(`<div class="card menu">
      <p class="eyebrow">${s && s.pers ? ui.atoDe(s).join(' · ') : 'Escolha o seu mundo'}</p>
      <h1 class="title big">Ordo Virtutum</h1>
      <p class="motto">A ordem das virtudes contra o reino dos vícios</p>
      ${RULE}
      ${cont ? `<div class="menu-actions">${cont}</div>` : ''}
      <p class="eyebrow mundos-tit">Mundos individuais · até ${S.LIMITE}</p>
      ${ui.mundos('solo', 'menu')}
      <div class="menu-coop"><p class="eyebrow mundos-tit">Mundos de co-op · até ${S.LIMITE}</p>${ui.mundos('coop', 'lista')}</div>
      <p class="note" id="touchNote" hidden>Este jogo usa teclado e mouse. Abra no computador para jogar.</p>
      <p class="foot">Atos I a IV · do Vale de Santa Sabina à Corte das Máscaras</p>
    </div>`, 'menu');
    if (matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches) $('touchNote').hidden = false;
  };
  ui.confirmarNovo = function (save) {
    ui.ov(`<div class="card">
      <p class="eyebrow">Novo mundo</p><h1 class="title">Começar de novo aqui?</h1>${RULE}
      <p>O mundo de <em>${esc(save.pers.nome)}</em> (${ui.descMundo(save)}) será apagado. Os outros mundos ficam como estão.</p>
      <div class="menu-actions"><button class="btn" data-act="apagar-e-criar" data-foco>Apagar e começar</button><button class="btn ghost" data-act="menu">Voltar</button></div>
    </div>`);
  };
  ui.confirmarApagar = function (tipo, n) {
    const s = OV.save.lerSlot(tipo, n); if (!s || !s.pers) { ui.menu(); return; }
    ui.ov(`<div class="card">
      <p class="eyebrow">${tipo === 'coop' ? 'Mundo de co-op' : 'Mundo individual'} ${n}</p><h1 class="title">Apagar este mundo?</h1>${RULE}
      <p>O mundo de <em>${esc(s.pers.nome)}</em> (${ui.descMundo(s)}) será apagado para sempre. Os outros mundos ficam como estão.</p>
      <div class="menu-actions"><button class="btn" data-act="apagar-confirmado" data-tipo="${tipo}" data-slot="${n}">Apagar</button><button class="btn ghost" data-act="menu" data-foco>Voltar</button></div>
    </div>`, 'menu');
  };

  /* ---- criação de personagem ---- */
  const cri = { nome: '', sexo: 'm', ordem: 'joana' };
  ui.criacao = function () {
    ui.ov(`<div class="side" id="criacao">
      <p class="eyebrow">Profissão</p>
      <h1 class="title">Quem entra na ordem?</h1>
      ${RULE}
      <label class="lbl" for="nomeIn">Nome</label>
      <input id="nomeIn" maxlength="24" autocomplete="off" spellcheck="false" placeholder="Ex.: Tomás, Inês">
      <p class="lbl">Personagem</p>
      <div class="seg" role="radiogroup" aria-label="Homem ou mulher">
        <button type="button" data-sexo="m" role="radio">Homem</button><button type="button" data-sexo="f" role="radio">Mulher</button>
      </div>
      <p class="lbl">Ordem</p>
      <div class="ordens" id="ordensBox"></div>
      <div class="det" id="ordemDet"></div>
      <button class="btn wide" data-act="professar">Professar e entrar no claustro</button>
      <button class="link" data-act="menu">Voltar ao menu</button>
    </div>`, 'criacao');
    const nomeIn = $('nomeIn'); nomeIn.value = cri.nome;
    nomeIn.addEventListener('input', () => { cri.nome = nomeIn.value; });
    $('ov').querySelectorAll('[data-sexo]').forEach(b => b.addEventListener('click', () => { cri.sexo = b.dataset.sexo; renderCri(); }));
    renderCri();
    setTimeout(() => nomeIn.focus({ preventScroll: true }), 30);
  };
  const NOME_VIRT = k => { const v = (OV.VIRTUDES || []).find(x => x.k === k); return v ? v.nome : k; };
  function renderCri() {
    $('ov').querySelectorAll('[data-sexo]').forEach(b => b.setAttribute('aria-checked', b.dataset.sexo === cri.sexo ? 'true' : 'false'));
    $('ordensBox').innerHTML = Object.values(OV.ORDENS).map(o => `
      <button type="button" class="ordem${o.id === cri.ordem ? ' sel' : ''}" data-ordem="${o.id}" aria-pressed="${o.id === cri.ordem}">
        <b>${esc(o.titulo[cri.sexo])}</b><span>${esc(o.ordem[cri.sexo])}</span><small>${esc(o.classe)} · ${esc(o.papel)}</small><em class="alc">${esc(o.alcance || '')}</em>
      </button>`).join('');
    $('ordensBox').querySelectorAll('[data-ordem]').forEach(b => b.addEventListener('click', () => { cri.ordem = b.dataset.ordem; renderCri(); }));
    const o = OV.ORDENS[cri.ordem];
    const rows = OV.VIRTUDES.map(v => `<div class="vmini"><span>${v.nome}</span><div class="track"><div class="fill" style="width:${o.virt[v.k] * 10}%"></div></div><em>${o.virt[v.k]}</em></div>`).join('');
    $('ordemDet').innerHTML = `<p class="desc">${esc(o.descr)}</p>
      <dl class="kv"><dt>Patrono</dt><dd>${esc(o.patrono[cri.sexo])}</dd><dt>Arma</dt><dd>${esc(o.armaNome)}</dd>
        <dt>Alcance</dt><dd>${esc(o.alcance || '')}${OV.ALCANCE_TXT && OV.ALCANCE_TXT[o.alcance] ? ` · ${esc(OV.ALCANCE_TXT[o.alcance])}` : ''}</dd>
        <dt>Cresce com</dt><dd>${esc(NOME_VIRT(o.atributo))} nos golpes da arma · Fé nas orações</dd></dl>
      <div class="vgrid">${rows}</div>
      ${caminhoResumo(cri.ordem, cri.sexo)}`;
    if (OV.jogo) OV.jogo.preview(cri.sexo, cri.ordem);
  }
  function caminhoResumo(ordem, sexo) {
    const c = OV.CAMINHOS && OV.CAMINHOS[ordem]; if (!c) return '';
    const nome = typeof c.nome === 'string' ? c.nome : c.nome[sexo];
    const cresce = h => (OV.habilidades && OV.habilidades.cresceCom ? OV.habilidades.cresceCom(h, ordem) : '');
    return `<p class="lbl">${esc(nome)}</p><ul class="cam">${c.habil.map(h => { const cc = cresce(h); return `<li><b>${esc(h.nome)}</b><span>${h.tecla ? 'tecla ' + h.tecla : 'passiva'} · nível ${h.nivel}${cc ? ` · cresce com ${esc(cc)}` : ''}</span></li>`; }).join('')}</ul>`;
  }
  ui.dadosCriacao = () => ({ nome: (cri.nome || '').trim(), sexo: cri.sexo, ordem: cri.ordem });

  /* ---- pausa: um menu curto; opções e tutoriais têm cada um o seu painel ---- */
  const TUTORIAIS = [
    ['Andar e olhar', [['<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', 'Andar'], ['<kbd>Shift</kbd>', 'Segurar para correr (gasta um pouco de fôlego)'], ['<kbd>T</kbd>', 'Liga e desliga a corrida contínua'], ['Mouse', 'Girar a câmera'], ['<kbd>Tab</kbd>', 'Travar a câmera num vício']]],
    ['Combate', [['Clique esquerdo', 'Golpe leve'], ['Clique direito', 'Golpe pesado: gasta mais fôlego e às vezes atordoa os vícios comuns'], ['<kbd>Espaço</kbd>', 'Esquiva'], ['<kbd>Q</kbd>', 'Sinal da Cruz: no instante do golpe, apara e deixa o vício atordoado. Também rebate o que ele atira de longe']]],
    ['Orações e Fé', [['<kbd>1</kbd>', 'Ave-Maria: cura'], ['<kbd>2</kbd>', 'Oração a São Miguel: luz em área'], ['<kbd>R</kbd> segurar', 'Recolhimento: recupera Fé e vida e purifica a Ira, a Preguiça e a Gula'], ['<kbd>F</kbd> <kbd>G</kbd> <kbd>V</kbd> <kbd>B</kbd>', 'Habilidades da sua ordem, conforme o nível (veja na ficha, tecla C)']]],
    ['Itens', [['<kbd>I</kbd>', 'Inventário e equipamentos'], ['<kbd>5</kbd> · <kbd>6</kbd>', 'Usar Pão abençoado · Água benta'], ['Sacerdotes', 'Abençoam os itens corrompidos que você carrega'], ['Capelas', 'O baú do peregrino é o mesmo em todas as capelas']]],
    ['Mapa e missões', [['<kbd>M</kbd>', 'Mapa: arraste para mover, use a roda do mouse para aproximar, clique num Oratório aceso para viajar'], ['<kbd>L</kbd>', 'Missões: escolha qual rastrear. A rastreada aparece no canto, no minimapa (roxo: principal; verde: secundária) e na bússola'], ['<kbd>C</kbd>', 'Ficha: virtudes, pontos para distribuir e o caminho da sua ordem'], ['<kbd>E</kbd>', 'Conversar, examinar, rezar']]],
    ['Oratórios', [['Rezar', 'Guarda o progresso e restaura vida e Fé. Os vícios do mundo voltam'], ['Num Oratório aceso', 'Também dá para descansar até o amanhecer ou velar até o anoitecer'], ['Morte', 'Você desperta no último Oratório em que rezou']]]
  ];
  let pausaVista = 'menu';
  ui.pausa = function (musicOn, vista) {
    pausaVista = vista || 'menu';
    let corpo = '';
    if (pausaVista === 'opcoes') {
      const o = ui.opcoes, pc = v => Math.round(v * 100);
      corpo = `<p class="eyebrow">Opções</p><h1 class="title">Opções</h1>${RULE}
        <div class="opcs">
          <label class="opc"><span>Música</span><input type="range" min="0" max="100" step="5" value="${pc(o.musica)}" data-opc="musica"><em>${pc(o.musica)}%</em></label>
          <label class="opc"><span>Efeitos sonoros</span><input type="range" min="0" max="100" step="5" value="${pc(o.efeitos)}" data-opc="efeitos"><em>${pc(o.efeitos)}%</em></label>
          <label class="opc"><span>Sensibilidade da câmera</span><input type="range" min="40" max="200" step="10" value="${pc(o.sens)}" data-opc="sens"><em>${pc(o.sens)}%</em></label>
          <label class="opc chk"><span>Minimapa</span><input type="checkbox" data-opc="minimapa" ${o.minimapa ? 'checked' : ''}><em>${o.minimapa ? 'visível' : 'escondido'}</em></label>
          <label class="opc chk"><span>Bússola</span><input type="checkbox" data-opc="bussola" ${o.bussola ? 'checked' : ''}><em>${o.bussola ? 'visível' : 'escondida'}</em></label>
        </div>
        <div class="menu-actions"><button class="btn ghost" data-act="pausa-menu" data-foco>← Voltar</button></div>`;
    } else if (pausaVista === 'tutoriais') {
      corpo = `<p class="eyebrow">Tutoriais</p><h1 class="title">Como se joga</h1>${RULE}
        <div class="tuto">${TUTORIAIS.map(([t, l]) => `<section><h3>${esc(t)}</h3><dl>${l.map(([k, d]) => `<dt>${k}</dt><dd>${esc(d)}</dd>`).join('')}</dl></section>`).join('')}</div>
        <div class="menu-actions"><button class="btn ghost" data-act="pausa-menu" data-foco>← Voltar</button></div>`;
    } else {
      corpo = `<p class="eyebrow">Pausa</p><h1 class="title">O claustro espera</h1>${RULE}
        <nav class="menu-lista">
          <button class="btn" data-act="retomar" data-foco>Continuar</button>
          <button class="btn ghost" data-act="salvar">Salvar jogo</button>
          <button class="btn ghost" data-act="missoes">Missões</button>
          <button class="btn ghost" data-act="opcoes">Opções</button>
          <button class="btn ghost" data-act="tutoriais">Tutoriais</button>
          <button class="btn ghost" data-act="menu">Voltar ao menu principal</button>
        </nav>
        <p class="pausa-nota" id="pausaNota"></p>`;
    }
    ui.ov(`<div class="card pausa ${pausaVista}">${corpo}</div>`);
  };
  ui.pausaNota = t => { const n = $('pausaNota'); if (n) n.textContent = t; };
  $('ov').addEventListener('input', e => {
    const i = e.target.closest('[data-opc]'); if (!i) return;
    const k = i.dataset.opc, o = ui.opcoes;
    if (i.type === 'checkbox') { o[k] = i.checked; i.nextElementSibling.textContent = i.checked ? (k === 'bussola' ? 'visível' : 'visível') : (k === 'bussola' ? 'escondida' : 'escondido'); }
    else { o[k] = +i.value / 100; i.nextElementSibling.textContent = i.value + '%'; }
    ui.salvarOpcoes();
  });
  ui.morte = function (temOratorio) {
    ui.ov(`<div class="card">
      <p class="eyebrow">Derrota</p><h1 class="title">Você caiu</h1>${RULE}
      <p class="cite">O justo cai sete vezes e se levanta. — Pr 24,16</p>
      <div class="menu-actions"><button class="btn" data-act="renascer" data-foco>${temOratorio ? 'Despertar no Oratório' : 'Levantar-se'}</button></div>
    </div>`);
  };
  ui.vitoria = function () {
    ui.ov(`<div class="card">
      <p class="eyebrow">Vitória</p><h1 class="title">O claustro está livre</h1>${RULE}
      <p>A Ira, a Preguiça e o Arauto da Soberba fugiram de Santa Sabina. O progresso foi guardado.</p>
      <p>Mas o vale continua em silêncio: os sinos estão mudos, a cripta segue selada e o povo da vila espera. Essa parte da história chega na próxima fase.</p>
      <div class="menu-actions"><button class="btn" data-act="retomar" data-foco>Continuar explorando</button><button class="btn ghost" data-act="menu">Voltar ao menu</button></div>
    </div>`);
  };

  /* ---- ficha do personagem ---- */
  ui.renderFicha = function () {
    const P = OV.P, pers = P.pers, D = P.D, o = OV.ORDENS[pers.ordem];
    const need = OV.xpParaProximo(pers.nivel);
    const grupo = tipo => OV.VIRTUDES.filter(v => v.tipo === tipo).map(v => {
      const val = pers.virt[v.k];
      const pode = pers.pontos > 0 && val < OV.MAX_VIRTUDE;
      const tira = OV.combate.podeTirar(v.k);
      return `<div class="vrow"><b>${v.nome}</b><div class="track"><div class="fill" style="width:${val / OV.MAX_VIRTUDE * 100}%"></div></div><em>${val}</em>
        <span class="pm"><button type="button" class="plus menos" data-tirar="${v.k}" ${tira ? '' : 'disabled'} aria-label="Tirar um ponto de ${v.nome}" title="Tirar um ponto">−</button><button type="button" class="plus" data-virt="${v.k}" ${pode ? '' : 'disabled'} aria-label="Aumentar ${v.nome}">+</button></span><span class="ef">${efeito(v.k, D)}</span></div>`;
    }).join('');
    $('ficha').innerHTML = `<h2>${esc(pers.nome)}</h2>
      <p class="sub">${esc(o.titulo[pers.sexo])} · ${esc(o.ordem[pers.sexo])}<br>Patrono: ${esc(o.patrono[pers.sexo])}</p>
      <p class="lvl">Nível ${pers.nivel} · ${pers.nivel >= OV.NIVEL_MAX ? 'nível máximo' : `${Math.floor(pers.xp)} de ${need} de experiência`}</p>
      ${pers.pontos > 0 ? `<p class="pts">${pers.pontos} ponto${pers.pontos > 1 ? 's' : ''} de virtude para distribuir</p>` : ''}
      ${exameHtml()}
      <h3>Virtudes cardeais</h3>${grupo('Cardeais')}
      <h3>Virtudes teológicas</h3>${grupo('Teologais')}
      ${fichaCaminho(pers)}
      <p class="foot">O progresso se guarda ao rezar num Oratório. Pressione C para fechar.</p>`;
  };
  // desfazer: o que foi posto nesta abertura da ficha sai de graça; o resto, só com a Vela do Exame de Consciência
  function exameHtml() {
    const C = OV.combate;
    if (C.exameAtivo()) return '<p class="exame on">✠ A Vela do Exame de Consciência está acesa: tire os pontos que quiser (−) e distribua de novo.</p>';
    const n = OV.itens ? OV.itens.qtd('exame') : 0;
    const temGasto = C.pontosDistribuidos() > 0;
    if (n > 0 && temGasto) return `<p class="exame"><button type="button" class="btn ghost" data-exame>Acender a Vela do Exame de Consciência</button><small>Você tem ${n}. Com ela acesa, dá para tirar pontos de qualquer virtude e redistribuí-los.</small></p>`;
    if (C.gastosNaFicha() > 0) return '<p class="exame dica">Os pontos postos agora podem ser tirados (−) enquanto a ficha estiver aberta.</p>';
    return temGasto ? '<p class="exame dica">Para mudar pontos já distribuídos, é preciso uma Vela do Exame de Consciência: os chefões e os vícios mais fortes às vezes a deixam cair.</p>' : '';
  }
  function fichaCaminho(pers) {
    const c = OV.CAMINHOS && OV.CAMINHOS[pers.ordem]; if (!c) return '';
    const itens = c.habil.slice().sort((a, b) => a.nivel - b.nivel).map(h => {
      const ok = pers.nivel >= h.nivel;
      const tag = ok ? (h.tecla ? `tecla ${h.tecla}` : 'passiva') : `nível ${h.nivel}`;
      const cc = OV.habilidades && OV.habilidades.cresceCom ? OV.habilidades.cresceCom(h, pers.ordem) : '';
      return `<li class="${ok ? 'ok' : ''}"><div><b>${esc(h.nome)}</b>${h.descr ? `<small>${esc(h.descr)}${cc ? ` <i class="cresce">Cresce com: ${esc(cc)}.</i>` : ''}</small>` : ''}</div><span>${tag}</span></li>`;
    }).join('');
    return `<h3>${esc(OV.habilidades.nomeCaminho(c))}</h3><p class="bonus">${esc(c.bonus)}</p><ul class="hab">${itens}</ul>`;
  }
  function efeito(k, D) {
    const ordem = OV.P.pers && OV.P.pers.ordem, d = OV.DANO_ORDEM && OV.DANO_ORDEM[ordem];
    const arma = d && k === d.attr ? `Dano da arma: ${D.dano} (atributo da sua ordem)` : d && (k === d.tri || (k === 'justica')) ? 'Soma um pouco ao dano da arma' : '';
    const junta = (a, b) => [a, b].filter(Boolean).join(' · ');
    if (d) switch (k) {
      case 'prudencia': return junta(arma, `Esquiva: invulnerável por ${String(D.iframe).replace('.', ',')} s`);
      case 'justica': return arma || 'Soma um pouco ao dano da arma';
      case 'fortaleza': return junta(arma, `Vida máxima: ${D.maxHp}`);
      case 'temperanca': return junta(arma, `Fôlego máximo: ${D.maxSta}`);
      case 'fe': return junta(arma, `Fé máxima: ${D.maxFe} · São Miguel: ${D.miguel} de dano em área`);
      case 'esperanca': return junta(arma, `No Recolhimento: +${D.prayHp} de vida e +${D.prayFe} de Fé por segundo`);
      case 'caridade': return junta(arma, `Ave-Maria cura ${D.cura} de vida`);
    }
    switch (k) {
      case 'prudencia': return `Esquiva: invulnerável por ${String(D.iframe).replace('.', ',')} s`;
      case 'justica': return `Dano da arma: ${D.dano}`;
      case 'fortaleza': return `Vida máxima: ${D.maxHp}`;
      case 'temperanca': return `Fôlego máximo: ${D.maxSta}`;
      case 'fe': return `Fé máxima: ${D.maxFe} · São Miguel: ${D.miguel} de dano em área`;
      case 'esperanca': return `No Recolhimento: +${D.prayHp} de vida e +${D.prayFe} de Fé por segundo`;
      case 'caridade': return `Ave-Maria cura ${D.cura} de vida`;
    }
    return '';
  }
  ui.ficha = function (open) { $('ficha').hidden = !open; OV.combate.abrirFicha(open); if (open) ui.renderFicha(); };
  $('ficha').addEventListener('click', e => {
    const b = e.target.closest('[data-virt]'), t = e.target.closest('[data-tirar]'), x = e.target.closest('[data-exame]');
    if (b && !b.disabled) OV.combate.distribuir(b.dataset.virt);
    else if (t && !t.disabled) OV.combate.tirar(t.dataset.tirar);
    else if (x) OV.combate.acenderExame();
    else return;
    ui.renderFicha();
  });

  ui.semWebGL = function () {
    ui.ov('<div class="card"><h1 class="title">Sem gráficos 3D</h1><p>Seu navegador não conseguiu iniciar o WebGL. Tente abrir no Chrome ou no Edge atualizados.</p></div>');
  };
})(window.OV);

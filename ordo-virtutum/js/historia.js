/* Ordo Virtutum — a história que amarra tudo:
   · o prólogo (os sinos calados e a carta do Bispo) e, depois do Livro do Abade, a história das sete lâmpadas contada pelo Padre Tomé;
   · o Livro do Abade, que transforma a carta numa missão maior, e a aba "As Sete Lâmpadas" do Diário;
   · as cartas de quem pediu ajuda, na tela de missões;
   · os santos que descem do céu quando o peregrino reza, e sobem de volta;
   · os sacrifícios que cada santo pede em troca da sua graça. */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes; if (!M || M.falhou || !MS) return;
  const ui = OV.ui, A = OV.audio, D = OV.dialogo, P = OV.P, IT = OV.itens;
  const C = () => OV.combate;
  const HI = {}; OV.historia = HI;
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const st = id => prog() && prog().missoes && prog().missoes[id];
  const esc = s => ui.esc(String(s));
  const g = (m, f) => (P.pers && P.pers.sexo === 'f') ? f : m;
  const H = (x, z) => M.altura(x, z);

  /* ===================================================================
     AS SETE LÂMPADAS
     =================================================================== */
  HI.LAMPADAS = [
    { k: 'diligencia', nome: 'Lâmpada da Diligência', virtude: 'Diligência', pecado: 'Acídia', terra: 'Vale de Santa Sabina', principe: 'o Demônio do Meio-Dia', servos: 'Larvas do Tédio, Diabretes, Murmuradores', acesa: () => !!F().ato1_fim, ato: 1 },
    { k: 'temperanca', nome: 'Lâmpada da Temperança', virtude: 'Temperança', pecado: 'Gula', terra: 'Portos do Festim', principe: 'o Senhor do Banquete', servos: 'Glutões, Corvos da Fome, Caranguejos da Gula', acesa: () => !!F().ato2_fim, ato: 2 },
    { k: 'generosidade', nome: 'Lâmpada da Generosidade', virtude: 'Generosidade', pecado: 'Avareza', terra: 'Minas de Mamom', principe: 'Mamom', servos: 'Escaravelhos, Golens de ouro, Morcegos da Avareza', acesa: () => !!F().ato3_fim, ato: 3 },
    { k: 'castidade', nome: 'Lâmpada da Castidade', virtude: 'Castidade', pecado: 'Luxúria', terra: 'Corte das Máscaras', principe: 'Asmodeu', servos: 'Mascarados, Mariposas, Reflexos, Pavões', acesa: () => !!F().ato4_fim, ato: 4 },
    { k: 'paciencia', nome: 'Lâmpada da Paciência', virtude: 'Paciência', pecado: 'Ira', terra: 'uma terra de fronteira, ainda fechada', principe: 'Abadon, o Anjo do Abismo', servos: '?', acesa: () => false, ato: 5, futuro: true },
    { k: 'benevolencia', nome: 'Lâmpada da Benevolência', virtude: 'Benevolência', pecado: 'Inveja', terra: 'além do mar', principe: 'Leviatã, a serpente das águas', servos: '?', acesa: () => false, ato: 6, futuro: true },
    { k: 'humildade', nome: 'Lâmpada da Humildade', virtude: 'Humildade', pecado: 'Soberba', terra: 'o Monte Santo', principe: 'o Príncipe da Soberba, cujo nome é melhor não escrever', servos: '?', acesa: () => false, ato: 7, futuro: true }
  ];
  HI.acesas = () => HI.LAMPADAS.filter(l => l.acesa()).length;

  /* ===================================================================
     O PRÓLOGO
     =================================================================== */
  // a abertura de um jogo novo só fala do que o peregrino sabe: os sinos calados e a carta do Bispo
  const ABERTURA = [
    { eyebrow: 'Prólogo · I', titulo: 'O vale que cantava',
      txt: () => 'No Vale de Santa Sabina, os sinos do mosteiro marcavam as horas: as Laudes ao amanhecer, a Sexta ao meio-dia, as Completas à noite. O povo da Vila de São Roque trabalhava e rezava ao som deles.',
      desenho: (c, w, h, t) => { entardecer(c, w, h, t); vale(c, w, h, t, { sinos: true, peregrino: false }); } },
    { eyebrow: 'Prólogo · II', titulo: 'O silêncio',
      txt: () => 'Há algumas semanas, os sinos se calaram. Nenhuma carta desceu do vale desde então. Os poucos peregrinos que voltaram falavam de uma vila parada, de gente que já não tinha vontade de nada.',
      desenho: (c, w, h, t) => { noite(c, w, h, t); vale(c, w, h, t, { peregrino: false }); } },
    { eyebrow: 'Prólogo · III', titulo: 'A carta do Bispo',
      txt: () => 'Em Albária, o Bispo escreveu uma carta curta ao Abade Anselmo e procurou quem pudesse levá-la. A carta dizia só isto: «Os sinos do vale se calaram. Vá ver por quê.»',
      desenho: (c, w, h, t) => carta(c, w, h, t) },
    { eyebrow: 'Prólogo · IV', titulo: () => P.pers ? `${P.pers.nome}, ${titulo().toLowerCase()}` : 'O peregrino',
      txt: () => `Você é ${g('um peregrino', 'uma peregrina')} da ordem dos ${ordemNome()}. Leva a carta no alforje e desce a estrada do vale ao entardecer. Ninguém disse que seria perigoso.`,
      desenho: (c, w, h, t) => { entardecer(c, w, h, t); vale(c, w, h, t); } }
  ];
  // a história das lâmpadas só aparece quando o Padre Tomé a conta, depois do Livro do Abade
  const HISTORIA = [
    { eyebrow: 'As Sete Lâmpadas · I', titulo: 'Sete lâmpadas',
      txt: () => 'Em Patmos, São João viu sete candelabros de ouro, e o Senhor lhe disse: «Os sete candelabros são as sete Igrejas.» Quando a fé chegou a Albária, sete igrejas acenderam sete lâmpadas que nunca se apagavam. Cada uma guardava uma virtude contra um pecado capital.',
      desenho: (c, w, h, t) => { noite(c, w, h, t); lampadas(c, w, h, t, i => 1); } },
    { eyebrow: 'As Sete Lâmpadas · II', titulo: 'O Antigo Inimigo',
      txt: () => 'O Dragão, a antiga serpente, não pode tocar no que é santo. Por isso mandou os seus sete príncipes, um para cada pecado. E cada príncipe mandou na frente os seus servos, os vícios pequenos, que entram pelas portas que ninguém vigia.',
      desenho: (c, w, h, t) => { noite(c, w, h, t); dragao(c, w, h, t); lampadas(c, w, h, t, i => 1, 0.6); } },
    { eyebrow: 'As Sete Lâmpadas · III', titulo: 'Uma a uma',
      txt: () => 'As lâmpadas foram se apagando uma a uma, e ninguém viu quando. O povo apenas foi esquecendo: de trabalhar, de partilhar, de rezar, de esperar. A cada lâmpada apagada, o Dragão ficava mais forte.',
      desenho: (c, w, h, t) => { noite(c, w, h, t); lampadas(c, w, h, t, i => Math.max(0, Math.min(1, 1 - (t - 0.8 - i * 0.7) / 0.5))); } },
    { eyebrow: 'As Sete Lâmpadas · IV', titulo: 'A lâmpada do vale',
      txt: () => 'Os sinos calados do vale eram só o começo. A Lâmpada da Diligência, sobre o altar do mosteiro, está se apagando, e atrás do tédio da vila espera o primeiro dos sete príncipes: o Demônio do Meio-Dia.',
      desenho: (c, w, h, t) => { noite(c, w, h, t); lampadas(c, w, h, t, i => i === 0 ? 0.55 + 0.35 * Math.abs(Math.sin(t * 2.3)) : 0); } }
  ];
  const SEQ = { abertura: ABERTURA, historia: HISTORIA };
  const titulo = () => P.pers ? OV.ORDENS[P.pers.ordem].titulo[P.pers.sexo] : 'Peregrino';
  const ordemNome = () => { if (!P.pers) return 'peregrinos'; const o = OV.ORDENS[P.pers.ordem].ordem[P.pers.sexo]; return o.replace(/\s*\(.*\)/, ''); };

  // ---- desenhos (tinta e ouro sobre a noite) ----
  const estrelas = Array.from({ length: 90 }, (_, i) => [(i * 97.13 % 1), (i * 57.71 % 1) * 0.62, 0.4 + (i * 13.3 % 1) * 1.4, i * 1.7]);
  function noite(c, w, h, t) {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#05040a'); gr.addColorStop(0.6, '#140c14'); gr.addColorStop(1, '#22140e');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    estrelas.forEach(([x, y, r, ph]) => { c.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.3 + ph); c.fillStyle = '#f4e6c0'; c.beginPath(); c.arc(x * w, y * h, r, 0, 7); c.fill(); });
    c.globalAlpha = 1;
  }
  function entardecer(c, w, h, t) {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1a30'); gr.addColorStop(0.45, '#8a4a3a'); gr.addColorStop(0.7, '#d89a5a'); gr.addColorStop(1, '#3a2418');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,220,150,.85)'; c.beginPath(); c.arc(w * 0.72, h * 0.5, Math.min(w, h) * 0.06, 0, 7); c.fill();
  }
  function lampada(c, x, y, s, acesa, t, i) {
    c.save(); c.translate(x, y);
    // a base e a haste de ouro
    c.fillStyle = '#a87722'; c.strokeStyle = '#3a2410'; c.lineWidth = Math.max(1, s * 0.04);
    c.beginPath(); c.moveTo(-s * 0.32, 0); c.lineTo(s * 0.32, 0); c.lineTo(s * 0.16, -s * 0.12); c.lineTo(-s * 0.16, -s * 0.12); c.closePath(); c.fill(); c.stroke();
    c.fillRect(-s * 0.05, -s * 0.85, s * 0.1, s * 0.75);
    [-0.35, -0.6].forEach(k => { c.beginPath(); c.ellipse(0, s * k, s * 0.1, s * 0.05, 0, 0, 7); c.fill(); });
    c.beginPath(); c.moveTo(-s * 0.28, -s * 0.85); c.quadraticCurveTo(0, -s * 0.7, s * 0.28, -s * 0.85); c.lineTo(s * 0.22, -s * 0.95); c.lineTo(-s * 0.22, -s * 0.95); c.closePath(); c.fill(); c.stroke();
    if (acesa > 0.02) {
      const fl = 1 + 0.12 * Math.sin(t * 9 + i * 2) + 0.06 * Math.sin(t * 23 + i);
      const r = c.createRadialGradient(0, -s * 1.15, 0, 0, -s * 1.15, s * 1.1 * acesa);
      r.addColorStop(0, `rgba(255,230,160,${0.55 * acesa})`); r.addColorStop(1, 'rgba(255,180,80,0)');
      c.fillStyle = r; c.beginPath(); c.arc(0, -s * 1.15, s * 1.1 * acesa, 0, 7); c.fill();
      c.fillStyle = `rgba(255,${190 + 40 * acesa | 0},90,${acesa})`;
      c.beginPath(); c.moveTo(0, -s * (0.95 + 0.42 * fl * acesa)); c.quadraticCurveTo(s * 0.14, -s * 1.0, 0, -s * 0.94); c.quadraticCurveTo(-s * 0.14, -s * 1.0, 0, -s * (0.95 + 0.42 * fl * acesa)); c.fill();
    } else {
      // a fumaça de quem acabou de se apagar
      c.strokeStyle = 'rgba(180,170,160,.35)'; c.lineWidth = s * 0.03;
      c.beginPath(); for (let k = 0; k < 12; k++) { const yy = -s * (1 + k * 0.08), xx = Math.sin(t * 2 + k * 0.7 + i) * s * 0.08 * (k / 6); if (!k) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke();
    }
    c.restore();
  }
  function lampadas(c, w, h, t, acesaDe, esc) {
    const n = 7, s = Math.min(w / 11, h / 5) * (esc || 1), cx = w / 2, base = h * (esc ? 0.92 : 0.82);
    for (let i = 0; i < n; i++) { const a = (i - 3) / 3; lampada(c, cx + a * w * 0.36, base - (1 - a * a) * h * 0.12, s, acesaDe(i), t, i); }
  }
  function dragao(c, w, h, t) {
    const sobe = Math.min(1, t / 3), cx = w / 2, cy = h * (0.95 - 0.35 * sobe), s = Math.min(w, h) * 0.55, bat = Math.sin(t * 1.4) * 0.08;
    c.save(); c.translate(cx, cy); c.globalAlpha = 0.92;
    c.fillStyle = '#0a0608'; c.strokeStyle = 'rgba(160,40,30,.35)'; c.lineWidth = 2;
    [-1, 1].forEach(sd => {
      c.beginPath(); c.moveTo(sd * s * 0.12, -s * 0.2);
      c.quadraticCurveTo(sd * s * 0.7, -s * (0.95 + bat), sd * s * 1.25, -s * (0.55 + bat));
      for (let k = 0; k < 4; k++) { const x0 = sd * s * (1.25 - k * 0.27), y0 = -s * (0.55 + bat - k * 0.04); c.quadraticCurveTo(sd * s * (1.12 - k * 0.27), -s * (0.25 + bat * 0.5), x0 - sd * s * 0.27, y0 + s * 0.05); }
      c.lineTo(sd * s * 0.1, s * 0.15); c.closePath(); c.fill(); c.stroke();
    });
    c.beginPath(); c.ellipse(0, s * 0.05, s * 0.2, s * 0.45, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-s * 0.1, -s * 0.35); c.quadraticCurveTo(0, -s * 0.75, s * 0.06, -s * 0.62); c.quadraticCurveTo(s * 0.14, -s * 0.45, s * 0.1, -s * 0.35); c.fill();
    c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3); c.fillStyle = '#ff3a1a';
    [-1, 1].forEach(sd => { c.beginPath(); c.ellipse(s * 0.02 + sd * s * 0.035, -s * 0.6, s * 0.018, s * 0.008, 0, 0, 7); c.fill(); });
    c.restore(); c.globalAlpha = 1;
  }
  function carta(c, w, h, t) {
    const gr = c.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, Math.max(w, h) * 0.7); gr.addColorStop(0, '#3a2414'); gr.addColorStop(1, '#0a0606');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const s = Math.min(w, h) * 0.5, cx = w * 0.46, cy = h * 0.42 + Math.sin(t * 0.8) * 2;
    c.save(); c.translate(cx, cy); c.rotate(-0.06);
    c.fillStyle = '#e8d6a8'; c.strokeStyle = '#7a5a2a'; c.lineWidth = 2;
    c.beginPath(); c.rect(-s * 0.6, -s * 0.38, s * 1.2, s * 0.76); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(60,36,16,.55)'; c.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) { const y = -s * 0.22 + i * s * 0.1, L = i === 4 ? 0.5 : 0.95; c.beginPath(); c.moveTo(-s * 0.48, y); c.lineTo(-s * 0.48 + s * L, y); c.stroke(); }
    c.fillStyle = '#9e1d13'; c.beginPath(); c.arc(s * 0.42, s * 0.24, s * 0.09, 0, 7); c.fill();
    c.strokeStyle = '#e8c070'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(s * 0.42, s * 0.18); c.lineTo(s * 0.42, s * 0.3); c.moveTo(s * 0.37, s * 0.23); c.lineTo(s * 0.47, s * 0.23); c.stroke();
    c.restore();
    // a vela ao lado
    const vx = w * 0.8, vy = h * 0.62, fl = 1 + 0.1 * Math.sin(t * 9);
    const r = c.createRadialGradient(vx, vy - h * 0.12, 0, vx, vy - h * 0.12, h * 0.3); r.addColorStop(0, 'rgba(255,210,130,.35)'); r.addColorStop(1, 'rgba(255,180,80,0)');
    c.fillStyle = r; c.fillRect(0, 0, w, h);
    c.fillStyle = '#efe2c4'; c.fillRect(vx - h * 0.02, vy - h * 0.1, h * 0.04, h * 0.12);
    c.fillStyle = '#ffc860'; c.beginPath(); c.moveTo(vx, vy - h * (0.1 + 0.06 * fl)); c.quadraticCurveTo(vx + h * 0.018, vy - h * 0.11, vx, vy - h * 0.1); c.quadraticCurveTo(vx - h * 0.018, vy - h * 0.11, vx, vy - h * (0.1 + 0.06 * fl)); c.fill();
  }
  function vale(c, w, h, t, op) {
    op = op || {};
    const montes = (y, cor, amp, f) => { c.fillStyle = cor; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * f) * amp + Math.sin(x * f * 2.3 + 1) * amp * 0.4); c.lineTo(w, h); c.closePath(); c.fill(); };
    montes(h * 0.55, '#4a2a2a', h * 0.05, 0.006); montes(h * 0.66, '#2e1c18', h * 0.04, 0.009);
    // o mosteiro e a torre do sino calada
    const mx = w * 0.3, my = h * 0.63, s = h * 0.1;
    c.fillStyle = '#140c0a'; c.fillRect(mx - s, my - s * 0.8, s * 2.2, s * 0.8); c.fillRect(mx + s * 0.9, my - s * 1.9, s * 0.45, s * 1.9);
    c.beginPath(); c.moveTo(mx + s * 0.85, my - s * 1.9); c.lineTo(mx + s * 1.125, my - s * 2.4); c.lineTo(mx + s * 1.4, my - s * 1.9); c.fill();
    c.beginPath(); c.moveTo(mx - s * 1.1, my - s * 0.8); c.lineTo(mx + s * 0.1, my - s * 1.35); c.lineTo(mx + s * 1.25, my - s * 0.8); c.fill();
    if (op.sinos) { // o som dos sinos, em ondas que saem da torre
      const tx = mx + s * 1.125, ty = h * 0.63 - s * 1.6;
      for (let k = 0; k < 3; k++) { const f = ((t * 0.6 + k / 3) % 1); c.strokeStyle = `rgba(255,220,150,${0.5 * (1 - f)})`; c.lineWidth = 2; c.beginPath(); c.arc(tx, ty, s * (0.4 + f * 2.2), -Math.PI * 0.85, -Math.PI * 0.15); c.stroke(); }
    }
    montes(h * 0.8, '#1a100c', h * 0.03, 0.012);
    if (op.peregrino === false) return;
    // a estrada e o peregrino que desce
    c.strokeStyle = 'rgba(220,180,120,.35)'; c.lineWidth = h * 0.025; c.beginPath(); c.moveTo(w * 0.95, h); c.quadraticCurveTo(w * 0.6, h * 0.86, w * 0.4, h * 0.72); c.stroke();
    const k = Math.min(1, t / 9), px = w * (0.9 - 0.42 * k), py = h * (0.97 - 0.2 * k), ps = h * 0.06 * (1 - 0.4 * k), passo = Math.sin(t * 6);
    c.fillStyle = '#0a0606'; c.beginPath(); c.moveTo(px - ps * 0.25, py); c.lineTo(px + ps * 0.25, py); c.lineTo(px + ps * 0.15, py - ps * 0.9); c.lineTo(px - ps * 0.15, py - ps * 0.9); c.fill();
    c.beginPath(); c.arc(px, py - ps * 1.05, ps * 0.16, 0, 7); c.fill();
    c.strokeStyle = '#0a0606'; c.lineWidth = Math.max(1.5, ps * 0.06); c.beginPath(); c.moveTo(px + ps * 0.3, py + passo * ps * 0.05); c.lineTo(px + ps * 0.38, py - ps * 1.3); c.stroke();
  }

  let pl = null;
  function montarPrologo() {
    if (pl) return pl;
    const el = document.createElement('div'); el.id = 'prologo'; el.hidden = true;
    el.innerHTML = `<canvas id="prologoCv"></canvas>
      <div class="pl-legenda"><p class="pl-eyebrow"></p><h2 class="pl-titulo"></h2><p class="pl-txt"></p>
        <div class="pl-acoes"><span class="pl-pontos"></span><button type="button" class="btn ghost" data-pl="pular">Pular</button><button type="button" class="btn" data-pl="seguir">Continuar</button></div></div>`;
    document.body.appendChild(el);
    pl = { el, cv: el.querySelector('canvas'), i: 0, t: 0, fim: null, raf: 0 };
    el.addEventListener('click', ev => { const b = ev.target.closest('[data-pl]'); if (!b || pl.espelho) return; if (b.dataset.pl === 'pular') fecharPrologo(); else seguirPrologo(); });
    addEventListener('keydown', ev => {
      if (!pl || pl.el.hidden) return;
      ev.stopImmediatePropagation(); ev.preventDefault();
      if (ev.repeat || pl.espelho) return;
      if (ev.code === 'Escape') fecharPrologo(); else if (['Space', 'Enter', 'KeyE', 'ArrowRight'].includes(ev.code)) seguirPrologo();
    }, true);
    return pl;
  }
  function mostrarPainel() {
    const p = pl.lista[pl.i], val = v => typeof v === 'function' ? v() : v;
    pl.el.querySelector('.pl-eyebrow').textContent = p.eyebrow;
    pl.el.querySelector('.pl-titulo').textContent = val(p.titulo);
    pl.el.querySelector('.pl-txt').textContent = val(p.txt);
    pl.el.querySelector('.pl-pontos').textContent = pl.lista.map((_, k) => k === pl.i ? '✠' : '·').join(' ');
    pl.el.querySelector('[data-pl="seguir"]').textContent = pl.i === pl.lista.length - 1 ? (pl.qual === 'abertura' ? 'Começar' : 'Fechar o livro') : 'Continuar';
    pl.t = 0; pl.el.classList.remove('entra'); void pl.el.offsetWidth; pl.el.classList.add('entra');
    if (A.bell) A.bell([392, 330, 262, 523][pl.i] || 392, 0.12);
  }
  function quadro(now) {
    if (!pl || pl.el.hidden) return;
    pl.raf = requestAnimationFrame(quadro);
    const dt = Math.min(0.05, (now - (pl.last || now)) / 1000); pl.last = now; pl.t += dt;
    const cv = pl.cv, w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    pl.lista[pl.i].desenho(c, w, h, pl.t);
    // as bordas escurecem, como numa iluminura vista à luz de vela
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)'); c.fillStyle = v; c.fillRect(0, 0, w, h);
  }
  function seguirPrologo() { if (pl.i < pl.lista.length - 1) { pl.i++; mostrarPainel(); if (HI.aoPrologo) HI.aoPrologo('pag', pl.i); } else fecharPrologo(); }
  function fecharPrologo() {
    if (!pl || pl.el.hidden) return;
    pl.el.hidden = true; cancelAnimationFrame(pl.raf);
    if (HI.aoPrologo && !pl.espelho) HI.aoPrologo('fim');
    pl.espelho = false; pl.el.classList.remove('espelho');
    const fim = pl.fim; pl.fim = null; if (fim) setTimeout(fim, 30);
  }
  HI.prologo = function (qual, fim) {
    if (typeof qual === 'function' || qual == null) { fim = qual; qual = 'abertura'; }
    montarPrologo(); pl.qual = SEQ[qual] ? qual : 'abertura'; pl.lista = SEQ[pl.qual]; pl.i = 0; pl.fim = fim || null; pl.el.hidden = false; pl.last = 0;
    if (A.init) A.init();
    mostrarPainel(); pl.raf = requestAnimationFrame(quadro);
  };
  HI.prologoAberto = () => !!(pl && !pl.el.hidden);
  // no co-op, o convidado vê a mesma cena e quem vira as páginas é o anfitrião
  HI.prologoEspelho = function (qual, quem) {
    HI.prologo(qual, null); pl.espelho = true; pl.el.classList.add('espelho');
    const a = pl.el.querySelector('.pl-acoes'); let n = a.querySelector('.pl-espera');
    if (!n) { n = document.createElement('span'); n.className = 'pl-espera'; a.appendChild(n); }
    n.textContent = `${quem || 'O anfitrião'} vira as páginas…`;
  };
  HI.paginaPrologo = i => { if (!pl || pl.el.hidden) return; pl.i = Math.max(0, Math.min(i, pl.lista.length - 1)); mostrarPainel(); };
  HI.fecharPrologo = () => fecharPrologo();
  HI.espelhandoPrologo = () => !!(pl && !pl.el.hidden && pl.espelho);
  // um jogo novo começa pelo prólogo
  addEventListener('DOMContentLoaded', () => {
    if (!OV.jogo) return;
    const comecar0 = OV.jogo.comecar;
    OV.jogo.comecar = function (pers, pg, novo) {
      if (novo && !HI.semPrologo && !(pg.flags && pg.flags.prologo_visto)) {
        pg.flags = pg.flags || {}; pg.flags.prologo_visto = true;
        const p0 = P.pers; P.pers = pers;
        HI.prologo('abertura', () => { P.pers = p0; comecar0.call(OV.jogo, pers, pg, novo); });
        return;
      }
      return comecar0.call(OV.jogo, pers, pg, novo);
    };
    const ativo0 = OV.jogo.ativo;
    OV.jogo.ativo = () => ativo0() && !HI.prologoAberto();
  });

  /* ===================================================================
     O LIVRO DO ABADE
     =================================================================== */
  MS.MIS.livro = { ato: 1, nome: 'O Livro do Abade', tipo: 'p', xp: 80,
    etapas: ['Leia o livro do Abade Anselmo, aberto sobre a estante da Igreja de São Roque, junto do altar.', 'Converse com o Padre Tomé sobre o que o livro diz.'],
    alvos: [() => estante(), () => { const f = M.figuras.tome; return f ? { x: f.x, z: f.z } : null; }] };
  let estanteP = null;
  const estante = () => estanteP;
  (function () {
    const ig = M.interiores.find(c => c.nome === 'Igreja de São Roque'); if (!ig) return;
    const lx = -3.7, lz = -5.4, p = ig.W(lx, lz), y = H(ig.x, ig.z) + 0.2;
    const gr = new THREE.Group(); gr.position.set(p.x, y, p.z); gr.rotation.y = ig.rot + 0.5; M.scene.add(gr);
    const mad = M.MAT.wood, mesh = OV.mesh, sm = OV.sm;
    gr.add(mesh(new THREE.CylinderGeometry(0.06, 0.18, 1.0, 6), mad, 0, 0.5, 0));
    const tampo = mesh(new THREE.BoxGeometry(0.62, 0.05, 0.46), mad, 0, 1.08, 0); tampo.rotation.x = -0.45; gr.add(tampo);
    [-1, 1].forEach(s => { const f = mesh(new THREE.BoxGeometry(0.28, 0.02, 0.38), sm(0xeee2c0), s * 0.15, 1.13, 0.01); f.rotation.x = -0.45; f.rotation.z = s * 0.08; gr.add(f); });
    const fita = mesh(new THREE.BoxGeometry(0.03, 0.01, 0.3), sm(0x9e1d13), 0.02, 1.15, 0.12); fita.rotation.x = -0.45; gr.add(fita);
    estanteP = { x: p.x, z: p.z };
    M.obstacles.push({ x: p.x, z: p.z, r: 0.4 });
    M.interativo(p.x, p.z, 1.9, () => (F().livro_lido || MS.feita('m2') || st('livro')) ? 'Ler o livro do Abade Anselmo' : null, lerLivro);
  })();
  const PAGINAS = [
    ['Livro das Sete Lâmpadas', '«No princípio da fé em Albária, sete igrejas acenderam sete lâmpadas diante do Senhor. Cada lâmpada guarda uma virtude contra um pecado: a Diligência contra a Acídia; a Temperança contra a Gula; a Generosidade contra a Avareza; a Castidade contra a Luxúria; a Paciência contra a Ira; a Benevolência contra a Inveja; a Humildade contra a Soberba.»', { verso: true }],
    ['Livro das Sete Lâmpadas', '«Enquanto as sete arderem, o Antigo Inimigo não entra em Albária...» O resto da página está borrado de cera de vela.', { verso: true }],
    ['À margem, na letra do Abade Anselmo', '«Os sinos se calaram. Esta noite a lâmpada do altar tremeu. Se ela se apagar, que Deus mande alguém. Eu não sou forte o bastante.»', { verso: true }]
  ];
  function lerLivro() {
    D.falas(PAGINAS, () => {
      F().livro_lido = true;
      if (!st('livro')) MS.iniciar('livro');
      if (MS.ativa('livro') && MS.etapa('livro') === 0) MS.avancar('livro', 1);
      OV.jogo.salvar();
    });
  }
  // o livro entra na história quando o claustro é libertado
  const iniciar0 = MS.iniciar;
  MS.iniciar = function (id) { iniciar0.call(MS, id); if (id === 'm3' && !st('livro')) setTimeout(() => { if (!st('livro')) { iniciar0.call(MS, 'livro'); ui.toast('O Padre Tomé falou de um livro do Abade, aberto na estante da igreja.'); } }, 6500); };
  MS.ganchos.aplicar.push(() => { if (MS.feita('m2') && !st('livro') && prog()) prog().missoes.livro = { e: 0, fim: false, res: null }; });
  // o Padre Tomé explica o livro
  const tome0 = MS.ARV.tome;
  const arvTome = () => ({ inicio: 'a', nos: {
    a: { quem: 'Padre Tomé', txt: 'Você leu o livro do Abade? Eu conhecia a história das lâmpadas como quem conhece uma lenda de avó. Mas se o Abade escreveu aquilo com a própria mão, então é verdade.', prox: 'a2' },
    a2: { quem: 'Padre Tomé', txt: 'A página borrada eu sei de cor. Sente-se aqui. Vou contar do jeito que o Abade contava para nós, quando éramos meninos.', depois: () => setTimeout(() => HI.prologo('historia', () => D.abrir(arvTome(), 'b')), 250) },
    b: { quem: 'Padre Tomé', txt: 'Pense assim: o Dragão é um rei que não pode sair do castelo. Os sete príncipes são os generais dele, e cada general tem os seus servos. Para chegar a um general, é preciso vencer antes os servos. E cada general vencido é uma lâmpada reacesa, e o Dragão mais fraco.', prox: 'c' },
    c: { quem: 'Padre Tomé', txt: () => `Aqui no vale o servo é o tédio, e o general é o Demônio do Meio-Dia. Foi ele que levou o Abade. Você veio só entregar uma carta, ${g('filho', 'filha')}... e Deus pôs nas suas mãos uma missão bem maior.`, opc: [
      { t: 'Então vou reacender as sete lâmpadas.', ir: 'd' },
      { t: 'É muito para uma pessoa só.', ir: 'e' }] },
    d: { quem: 'Padre Tomé', txt: 'Comece pela que está diante de você: a Lâmpada da Diligência, sobre o altar do mosteiro. As outras virão no tempo de Deus. Anote no seu diário: as sete lâmpadas, e quem guarda cada uma.', ef: concluirLivro },
    e: { quem: 'Padre Tomé', txt: 'É. Por isso ninguém vai sozinho: o seu anjo vai com você, e os santos rezam no céu por quem luta aqui embaixo. Comece pela lâmpada que está diante de você.', ef: concluirLivro }
  } });
  MS.ARV.tome = function () {
    if (MS.ativa('livro') && MS.etapa('livro') === 1) return arvTome();
    return tome0 ? tome0() : null;
  };
  function concluirLivro() {
    if (MS.feita('livro')) return;
    F().lampadas_reveladas = true; MS.concluir('livro');
    setTimeout(() => ui.toast('Nova página no Diário (L): As Sete Lâmpadas.'), 1500);
  }
  if (OV.vida && OV.vida.SINAL) { const s0 = OV.vida.SINAL.tome; OV.vida.SINAL.tome = () => (MS.ativa('livro') && MS.etapa('livro') === 1) ? '?' : (s0 ? s0() : null); }

  /* ---- a aba das Sete Lâmpadas ---- */
  const svgLamp = acesa => `<svg viewBox="0 0 40 56" aria-hidden="true"><path d="M8 54 L32 54 L26 50 L14 50 Z M18.5 50 L18.5 24 L21.5 24 L21.5 50 Z M10 24 Q20 30 30 24 L28 21 L12 21 Z" fill="${acesa ? '#c9a24a' : '#8a7a62'}" stroke="#3a2410" stroke-width="1"/>${acesa ? '<circle cx="20" cy="12" r="10" fill="rgba(255,214,130,.45)"/><path d="M20 3 Q26 14 20 20 Q14 14 20 3 Z" fill="#ffb84a" stroke="#a85a10" stroke-width=".8"/>' : '<path d="M20 20 q-3 -5 0 -9 q3 -4 0 -9" fill="none" stroke="#9a8e80" stroke-width="1.3" opacity=".7"/>'}</svg>`;
  HI.telaLampadas = function () {
    if (!F().lampadas_reveladas) return `<div class="lp-vazio"><p>O Bispo só pediu que você descobrisse por que os sinos do vale se calaram.</p><p>Talvez o Padre Tomé, ou algum livro do mosteiro, saiba dizer mais.</p><button type="button" class="btn ghost" data-lp-prologo="abertura">Rever o prólogo</button></div>`;
    const n = HI.acesas();
    const cards = HI.LAMPADAS.map(l => {
      const ac = l.acesa(), conhecida = !l.futuro;
      return `<li class="lp ${ac ? 'acesa' : ''} ${l.futuro ? 'futura' : ''}">${svgLamp(ac)}<div><b>${esc(l.nome)}</b>
        <small>${esc(l.virtude)} contra a ${esc(l.pecado)}</small>
        <span><em>Terra:</em> ${esc(conhecida ? l.terra : l.terra)}</span>
        <span><em>Príncipe:</em> ${esc(l.principe)}</span>
        ${conhecida ? `<span><em>Servos:</em> ${esc(l.servos)}</span>` : '<span class="futuro">Uma terra que ainda não se abriu.</span>'}
        <i>${ac ? '✠ Reacesa' : l.futuro ? 'Apagada' : 'Apagada · Ato ' + ['', 'I', 'II', 'III', 'IV'][l.ato]}</i></div></li>`;
    }).join('');
    return `<div class="lp-tela">
      <div class="lp-intro"><p class="eyebrow">Livro das Sete Lâmpadas</p>
        <h3>${n} de 7 lâmpadas reacesas</h3>
        <p>O Dragão não pode entrar onde as lâmpadas ardem. Cada príncipe vencido é uma lâmpada reacesa, e o Dragão fica mais fraco. Para chegar a um príncipe, vença antes os servos dele.</p>
        <ol class="lp-camadas"><li><b>Os servos</b> · os vícios de cada terra</li><li><b>Os sete príncipes</b> · um para cada pecado</li><li><b>O Dragão</b> · o Antigo Inimigo, que espera o fim</li></ol>
        <div class="lp-botoes"><button type="button" class="btn ghost" data-lp-prologo="historia">Rever a história das lâmpadas</button><button type="button" class="btn ghost" data-lp-prologo="abertura">Rever o prólogo</button></div></div>
      <ul class="lp-lista">${cards}</ul></div>`;
  };
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-lp-prologo]'); if (b) HI.prologo(b.dataset.lpPrologo || 'abertura', null); });

  /* ===================================================================
     AS CARTAS DE QUEM PEDIU AJUDA
     =================================================================== */
  const CARTAS = {
    m1: ['Do Bispo de Albária', 'Ao Abade Anselmo, do Mosteiro de Santa Sabina. Paz e bem. Há semanas não chegam notícias do vale, e os peregrinos que voltam dizem que os sinos se calaram. Envio-lhe quem leva esta carta: receba-o como a mim, e conte-lhe o que se passa. Rezo por vocês.'],
    m2: ['Bilhete do Padre Tomé', 'Os monges sumiram um a um, e à noite se ouvem gemidos no claustro. Há vícios lá dentro, e um irmão possuído. Vá com cuidado, e lembre: os possessos não são inimigos. Liberte-os.'],
    m3: ['Do diário do peregrino', 'Os três badalos foram arrancados e escondidos pelo vale: um no dormitório do mosteiro, outro preso no moinho, o terceiro nas ruínas da floresta. Sem os sinos, ninguém lembra as horas de rezar.'],
    m4: ['Do diário do peregrino', 'Dizem que no alto do rochedo, do outro lado do rio, um eremita rezava sozinho. O Padre Tomé sonhou com ele. Talvez Deus tenha algo a dizer lá em cima.'],
    m5: ['Do diário do peregrino', 'O portão da cripta se abriu. O Abade Anselmo desceu para lá e não voltou. No fundo, onde o sol do meio-dia entra por uma fresta, espera o general deste vale.'],
    livro: ['Do diário do peregrino', 'O Padre Tomé falou de um livro que o Abade lia nas últimas semanas. Ficou aberto na estante da igreja, junto do altar, e ninguém teve coragem de mexer.'],
    s1: ['De Bartolomeu, o moleiro', 'A roda parou e eu parei com ela. Se alguém ainda se importa com o pão desta vila, que venha soltar a trava. Eu não tenho mais vontade nem de tentar.'],
    s2: ['Da Viúva Marta', 'Meu Joaquim some todas as noites e volta com pão que não comprou. Tenho medo do que ele anda fazendo, e mais medo ainda de perguntar.'],
    s3: ['Do pastor da vila', 'Um lobo vem toda noite e leva as ovelhas que sobram. O covil fica a oeste da floresta. Não peço que o mate: peço que as ovelhas fiquem em paz.'],
    s4: ['Do Padre Tomé', 'Os possessos roubaram a relíquia de Santa Sabina e acamparam a sudeste da vila. Ela guardava o claustro e a vila. Se puder, traga-a de volta aos pés da cruz.'],
    s5: ['De Lia, a ferreira', 'A forja está fria. Sem carvão da Mina Velha não há o que bater, e as larvas tomaram a entrada. Traga um saco cheio, e eu deixo a sua arma afiada como nunca.'],
    s6: ['Do Velho Matias', 'Estou velho e cansado. Queria me confessar antes de partir, mas o Padre Tomé foi rezar na Capela de São Roque, na floresta, e não volta. Traga-o, por caridade.'],
    a2s1: ['De Mestre Pedro, pescador', 'As larvas tomaram o píer comprido e comem tudo o que cai nas redes. Sem peixe, o bairro passa fome. Limpe as redes, e o primeiro peixe de cada dia vai para os pobres.'],
    a2s2: ['De Lúcia, a cozinheira', 'A panela do Bairro dos Pobres está vazia. Um saco de farinha, só um, e eu faço sopa para todas as crianças. Rufino vende no mercado; os celeiros do Barão estão cheios e trancados.'],
    a2s3: ['De Tiago, o grumete', 'Quero ser grumete no barco do Mestre Pedro, mas ele diz que sou fraco demais. Não é fraqueza. É que faz dois dias que não como.'],
    a2s4: ['Do Barão Otávio', 'Há um cofre no pátio, cheio de moedas que um mercador do norte me deu. Desde que o abri, não consigo parar de comer. Faça com ele o que achar justo.'],
    a3s1: ['Da Viúva Rosa', 'Meu marido Tomás morreu no desabamento da Galeria Velha. Fúlvio mandou fechar a entrada. Eu só queria enterrar alguma coisa dele: a lamparina, o terço que eu lhe dei no casamento.'],
    a3s2: ['De Brás, o capataz', 'Os que saíram da mina estão no acampamento, e a panela está vazia. Três pães já matam a fome das crianças hoje. Joana, a padeira da praça, ainda vende barato.'],
    a3s3: ['Do Padre Elias', 'As moedas de olhos de ouro atraem os Escaravelhos como mel atrai moscas. Traga-as para mim antes que tragam a desgraça para você.'],
    a4s1: ['De Clara, a costureira', 'Fui eu que costurei as máscaras do baile. Não sabia o que fazia: cada máscara prende quem a usa. Traga-me três, das que caírem dos libertados, e eu desfaço o encanto da minha linha.'],
    a4s2: ['De Mateus, o jardineiro', 'Perdi o meu terço no canto noroeste do Jardim dos Espelhos, e as mariposas tomaram aquele canto. Rezo o terço podando as sebes desde menino. Sem ele, as mãos não sabem o que fazer.'],
    a4s3: ['De Inês', 'Sebastião, o guarda do portão do palácio, era o meu noivo. Desde o baile ele não sai de lá, nem me reconhece. Leve-lhe esta carta. Talvez as palavras cheguem onde eu não chego.'],
    v_ervas: ['De Clotilde, a ervanária', 'A febre do tédio deixou a vila de cama. Com sálvia eu faço um caldo que levanta qualquer um, mas os vícios rondam os prados a leste, e as minhas pernas já não são as mesmas.'],
    v_carvoaria: ['De Gervásio, o carvoeiro', 'Uns vultos cochicham dia e noite em volta do meu forno: «pra que trabalhar, ninguém agradece». Eu acreditei e deixei o fogo morrer. Cale-os, e me ajude a acender de novo.'],
    v_lenha: ['De Gervásio, o carvoeiro', 'O primeiro saco de carvão não vou vender. A Viúva Marta passa frio desde que o marido morreu. Diga que é presente, senão ela não aceita.'],
    v_cordeiros: ['De Benedita, a pastora', 'Três cordeiros fugiram na noite dos lobos, e eu fiquei tão desanimada que nem fui atrás. O bom pastor deixa as noventa e nove... e eu nem isso. Traga-os um de cada vez, no colo.'],
    v_priorado: ['De Simão, o eremita', 'Entre as árvores, ao norte, rezavam os monges do priorado. Pararam por cansaço, um a um. Hoje uma gárgula guarda o altar. Lá dentro está a Regra que eles seguiam: traga-a.'],
    p_febre: ['Da Irmã Dulce', 'Os estivadores comem até passar mal e depois ardem em febre. Um chá de camomila acalma o estômago e a febre, mas ela cresce nas dunas do oeste, onde os corvos não deixam ninguém passar.'],
    p_rede: ['De Bento, o pescador', 'A maré levou a minha rede para as pedras do oeste. Sem rede, não tem peixe; sem peixe, o bairro passa fome. Cuidado com os caranguejos: comem tudo o que acham.'],
    p_gruta: ['Do Velho Cosme', 'Os contrabandistas roubaram o cálice da capela dos pescadores e o esconderam na gruta. Comeram e beberam tanto em cima do roubo que a gula tomou forma. Traga o cálice de volta ao altar.'],
    m_canario: ['De Aurélio, o mineiro', 'O canário é o anjo do mineiro: quando ele para de cantar, o ar lá embaixo ficou ruim. Os morcegos levaram a gaiola para o norte. Sem ele, ninguém desce tranquilo.'],
    m_agua: ['De Teodora, a lavadeira', 'O capataz vende a água do poço, uma moeda por caneca, e o Velho Jerônimo não tem moeda. A Fonte de Santa Bárbara ninguém vigia. Leve este balde, que eu não posso largar a roupa.'],
    m_pocos: ['De Leandro, capelão dos mineiros', 'No fundo dos Sete Poços os mineiros fundiram ouro numa forma de bezerro e começaram a adorá-lo. Levaram a imagem de Santa Bárbara que guardava a entrada. O nicho está vazio.'],
    c_alaude: ['De Lúcio, o trovador', 'Eu cantava para o Duque, só louvores, cada vez mais bonitos e mais vazios. Quando quis cantar um salmo, os pavões arrancaram o alaúde das minhas mãos. Ajude-me a cantar de novo.'],
    c_lirios: ['De Mônica, a sacristã', 'Na Corte todos enfeitam a si mesmos, e ninguém enfeita o altar. Quero lírios brancos para Nosso Senhor. Crescem no jardim abandonado, a oeste, entre as mariposas.'],
    c_mausoleu: ['De Ludovico, o velho mordomo', 'Servi três duques. O último quis espelhos no túmulo, e a vaidade chocou ali dentro um basilisco. A Duquesa, que era santa, foi enterrada com um rosário simples. Ninguém pode mais rezar por ela.']
  };
  HI.CARTAS = CARTAS;
  HI.cartaHtml = function (id) {
    let c = CARTAS[id];
    if (!c && OV.aventura && OV.aventura.guildas) {
      for (const gd of OV.aventura.guildas) { const k = gd.contratos.find(x => x.id === id); if (k) { c = [`Contrato da ${gd.nome}`, `${k.txt}. Assinado por ${(M.figuras[gd.mestre] && M.figuras[gd.mestre].op.nome) || 'o mestre'}, em nome da confraria. Pagamento na entrega: ${k.den || 0} denários${k.itens && k.itens.length ? ' e uma recompensa' : ''}.`]; break; } }
    }
    if (!c) return '';
    const diario = /^Do diário/.test(c[0]);
    return `<details class="mi-carta" ${diario ? '' : 'open'}><summary>${diario ? 'Do diário do peregrino' : 'Ler a carta'}</summary><div class="carta"><p>${esc(c[1])}</p><p class="ass">${diario ? '' : '— ' + esc(c[0].replace(/^(De|Do|Da|Bilhete do)\s/, ''))}</p></div></details>`;
  };

  /* ===================================================================
     OS SANTOS DESCEM DO CÉU E SOBEM DE VOLTA
     =================================================================== */
  const SANTOS = ['antao', 'nicolau', 'lourenco', 'agostinho'];
  function coluna(x, z, dur, sobe) {
    const y0 = H(x, z);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 26, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    col.position.set(x, y0 + 13, z);
    const luz = M.emissor(x, y0 + 3, z, 0, 14, 0xffe2a8, false);
    C().efeito([col], dur, p => { const k = Math.sin(Math.min(1, p) * Math.PI); col.material.opacity = 0.42 * k; col.scale.set(1 - 0.3 * p, 1, 1 - 0.3 * p); luz.int = 3 * k; if (p >= 0.99) { luz.ativo = false; const i = M.emissores.indexOf(luz); if (i >= 0) M.emissores.splice(i, 1); } });
    C().anel(0xffe6a8, 3.4, 1.2, 0.8);
    if (A.bell) [523, 659, 784, sobe ? 523 : 1046].forEach((f, i) => setTimeout(() => A.bell(f, 0.1), i * 230));
  }
  let camSanto = null;
  SANTOS.forEach(id => {
    const f = M.figuras[id]; if (!f || f._aparicao) return;
    f._aparicao = true;
    const m0 = f.mostrar;
    f.mostrar = function (b) {
      const jogando = OV.jogo && OV.jogo.modo === 'jogo' && P.pos && Math.hypot(P.pos.x - f.x, P.pos.z - f.z) < 40;
      if (b && !f.visivel && jogando) {
        m0.call(f, true);
        const y = H(f.x, f.z); f.g.position.y = y + 7; f.descendo = 0;
        coluna(f.x, f.z, 2.6, false);
        if (OV.cenas && !OV.cenas.ativa) {
          OV.cenas.iniciar({ alvo: () => new THREE.Vector3(f.x, H(f.x, f.z), f.z), raio: 5.4, altura: 1.6, giro: 0.06, olhar: 1.7, santo: true, ang0: Math.atan2(P.pos.x - f.x, P.pos.z - f.z) + 0.5 });
          camSanto = { t: 0 };
        }
        return;
      }
      if (!b && f.visivel && jogando && !f.subindo) {
        f.subindo = 0; coluna(f.x, f.z, 2.0, true);
        setTimeout(() => { f.subindo = null; m0.call(f, false); }, 1700);
        return;
      }
      m0.call(f, b);
    };
  });
  M.animados.push(dt => {
    SANTOS.forEach(id => {
      const f = M.figuras[id]; if (!f) return;
      const y = H(f.x, f.z);
      if (f.descendo !== undefined && f.descendo !== null) { f.descendo += dt; const k = Math.min(1, f.descendo / 1.6), e = 1 - Math.pow(1 - k, 3); f.g.position.y = y + 7 * (1 - e); if (k >= 1) f.descendo = null; }
      else if (f.subindo !== undefined && f.subindo !== null) { f.subindo += dt; const k = Math.min(1, f.subindo / 1.6); f.g.position.y = y + 8 * k * k; }
    });
    if (camSanto) {
      camSanto.t += dt;
      const cena = OV.cenas && OV.cenas.ativa;
      if (!cena || !cena.santo) camSanto = null;
      else if (camSanto.t > 2 && !D.aberto) { OV.cenas.encerrar(); camSanto = null; }
    }
  });

  /* ===================================================================
     OS SACRIFÍCIOS
     Cada santo pede uma coisa diferente em troca da sua graça. A graça facilita muito o chefe da terra;
     o sacrifício dói de verdade. A escolha é uma vez só.
     =================================================================== */
  const nomeItem = id => (OV.ITENS[id] && OV.ITENS[id].nome) || id;
  HI.SACRIFICIOS = {
    niveis: {
      oferta: () => P.pers.nivel > 1 ? `Oferecer dois níveis de experiência (você volta ao nível ${Math.max(1, P.pers.nivel - 2)}, e perde os pontos de virtude que vieram com eles)` : 'Oferecer toda a experiência que juntou até aqui',
      aplicar: () => { const n = C().perderNiveis ? C().perderNiveis(2) : 0; return n ? `Você voltou ao nível ${P.pers.nivel}.` : 'Você ofereceu a experiência que tinha.'; }
    },
    equipamentos: {
      oferta: () => { const eq = Object.values(IT.mochila().equip).filter(Boolean); return eq.length ? `Entregar aos pobres tudo o que leva equipado (${eq.map(nomeItem).join(', ')})` : `Entregar aos pobres todos os seus denários (${P.pers.denarios || 0}), já que não leva nada equipado`; },
      aplicar: () => {
        const m = IT.mochila(), eq = Object.keys(m.equip).filter(k => m.equip[k]);
        if (!eq.length) { P.pers.denarios = 0; return 'Os seus denários foram para os pobres.'; }
        eq.forEach(k => { m.equip[k] = null; }); C().recalcular(); IT.visual(); IT.refresh();
        P.hp = Math.min(P.hp, P.D.maxHp); P.fe = Math.min(P.fe, P.D.maxFe);
        return 'Os seus equipamentos foram para os pobres do bairro.';
      }
    },
    denarios: {
      oferta: () => `Dar aos pobres todos os seus denários (${P.pers.denarios || 0})`,
      aplicar: () => { F().partilha_den = (F().partilha_den || 0) + (P.pers.denarios || 0); P.pers.denarios = 0; return 'Os seus denários foram para os pobres.'; }
    },
    mochila: {
      oferta: () => { const n = IT.total(); return n ? `Deixar tudo o que carrega na mochila (${n} ${n > 1 ? 'itens' : 'item'})` : 'Deixar a mochila vazia e os seus denários'; },
      aplicar: () => { const m = IT.mochila(); if (!IT.total()) { P.pers.denarios = 0; return 'Você deixou tudo.'; } m.itens = {}; IT.refresh(); return 'Você deixou tudo o que carregava.'; }
    }
  };
  // monta os nós de diálogo do sacrifício: 's' (o pedido) e 'n' (a recusa); ambos seguem para 'depois'
  HI.nosSacrificio = function (santo, tipo, pedido, aoAceitar, depois, recusa) {
    const S = HI.SACRIFICIOS[tipo];
    return {
      s: { quem: santo, txt: pedido, opc: [
        { t: () => S.oferta(), ef: () => { const r = S.aplicar(); F()['sacrificio_' + tipo] = true; aoAceitar(); C().anel(0xffe6a8, 3, 1.0, 0.8); if (A.bell) { A.bell(392, 0.2); setTimeout(() => A.bell(587, 0.18), 260); } setTimeout(() => ui.toast(r), 400); if (OV.jogo) OV.jogo.salvar(); }, ir: depois },
        { t: 'Não posso oferecer isso.', ir: 'n' }] },
      n: { quem: santo, txt: recusa || 'Deus não força ninguém. Vá em paz: a luta será mais dura, mas você não estará só.', prox: depois }
    };
  };
})(window.OV);

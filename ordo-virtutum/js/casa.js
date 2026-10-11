/* Ordo Virtutum — a Casa do Peregrino.
   A mesma casa em cada região (vale, porto, minas e corte), como o baú das capelas: três cômodos
   (o canto de oração com o genuflexório, o quarto e a sala com o baú) e encaixes fixos nas paredes e no chão.
   As peças vêm das missões, dos baús raros, da santeira da vila e dos ferreiros. Por enquanto são só beleza, sem bônus. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !M.casaInterior || !OV.itens) return;
  const P = OV.P, ui = OV.ui, A = OV.audio, IT = OV.itens, MS = OV.missoes, MAT = M.MAT;
  const sm = OV.sm, mesh = OV.mesh, H = (x, z) => M.altura(x, z);
  const esc = s => ui.esc(s);
  const F = () => (OV.jogo && OV.jogo.prog && OV.jogo.prog.flags) || {};
  const feita = id => !!(MS && MS.feita && OV.jogo && OV.jogo.prog && MS.feita(id));
  const den = () => (P.pers && P.pers.denarios) || 0;
  const CS = {}; OV.casa = CS;

  /* ================= O QUE SE GUARDA NO PERSONAGEM ================= */
  function dados() {
    if (!P.pers) return null;
    const c = P.pers.casa = P.pers.casa || {};
    c.acervo = c.acervo || {}; c.slots = c.slots || {};
    return c;
  }
  CS.dados = dados;
  CS.tem = id => { const d = dados(); return !!(d && d.acervo[id]); };

  /* ================= AS PINTURAS DOS SANTOS ================= */
  const telas = {};
  function pintura(chave, op) {
    if (telas[chave]) return telas[chave];
    const w = 128, h = 176, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    // fundo de folha de ouro, com o arco do nicho
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e8c46a'); gr.addColorStop(0.5, '#c99a3a'); gr.addColorStop(1, '#a87722');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = op.fundo || '#1e2c4e'; g.beginPath(); g.moveTo(10, h - 30); g.lineTo(10, 54); g.arc(w / 2, 54, w / 2 - 10, Math.PI, 0); g.lineTo(w - 10, h - 30); g.closePath(); g.fill();
    // auréola
    g.fillStyle = '#f2d27a'; g.beginPath(); g.arc(w / 2, 54, 25, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8a5c14'; g.lineWidth = 2; g.stroke();
    if (op.asas) { g.fillStyle = '#f4ecd8'; [-1, 1].forEach(s => { g.beginPath(); g.moveTo(w / 2 + s * 14, 84); g.quadraticCurveTo(w / 2 + s * 58, 50, w / 2 + s * 52, 128); g.quadraticCurveTo(w / 2 + s * 34, 104, w / 2 + s * 16, 104); g.fill(); }); }
    // veste e manto
    g.fillStyle = op.veste || '#6a4a2a'; g.beginPath(); g.moveTo(w / 2 - 20, 78); g.lineTo(w / 2 + 20, 78); g.lineTo(w / 2 + 34, h - 32); g.lineTo(w / 2 - 34, h - 32); g.closePath(); g.fill();
    if (op.manto) { g.fillStyle = op.manto; g.beginPath(); g.moveTo(w / 2 - 22, 76); g.lineTo(w / 2 - 40, h - 32); g.lineTo(w / 2 - 20, h - 32); g.lineTo(w / 2 - 6, 92); g.closePath(); g.fill(); g.beginPath(); g.moveTo(w / 2 + 22, 76); g.lineTo(w / 2 + 40, h - 32); g.lineTo(w / 2 + 20, h - 32); g.lineTo(w / 2 + 6, 92); g.closePath(); g.fill(); }
    if (op.estola) { g.fillStyle = '#e2b85a'; g.fillRect(w / 2 - 3, 86, 6, h - 120); }
    // rosto, cabelo, véu, mitra ou coroa
    if (op.veu) { g.fillStyle = op.veu; g.beginPath(); g.arc(w / 2, 56, 17, Math.PI, 0); g.lineTo(w / 2 + 22, 82); g.lineTo(w / 2 - 22, 82); g.closePath(); g.fill(); }
    g.fillStyle = '#e0b894'; g.beginPath(); g.ellipse(w / 2, 58, 11, 14, 0, 0, Math.PI * 2); g.fill();
    if (op.barba) { g.fillStyle = op.barba; g.beginPath(); g.moveTo(w / 2 - 10, 62); g.lineTo(w / 2 + 10, 62); g.lineTo(w / 2, 80); g.closePath(); g.fill(); }
    if (op.mitra) { g.fillStyle = '#f2ece0'; g.beginPath(); g.moveTo(w / 2 - 11, 46); g.lineTo(w / 2 + 11, 46); g.lineTo(w / 2 + 8, 28); g.lineTo(w / 2, 22); g.lineTo(w / 2 - 8, 28); g.closePath(); g.fill(); g.fillStyle = '#d8b048'; g.fillRect(w / 2 - 1.5, 24, 3, 22); }
    if (op.coroa) { g.fillStyle = '#e8c45a'; g.beginPath(); g.moveTo(w / 2 - 12, 46); g.lineTo(w / 2 - 12, 36); g.lineTo(w / 2 - 6, 42); g.lineTo(w / 2, 33); g.lineTo(w / 2 + 6, 42); g.lineTo(w / 2 + 12, 36); g.lineTo(w / 2 + 12, 46); g.closePath(); g.fill(); }
    // o atributo: um traço simples nas mãos
    if (op.atributo) op.atributo(g, w, h);
    // o nome em letras de ouro sobre o vermelho
    g.fillStyle = '#7a140d'; g.fillRect(8, h - 28, w - 16, 20);
    g.fillStyle = '#f4dc94'; g.font = 'bold 11px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText((op.rotulo || '').toUpperCase(), w / 2, h - 18, w - 20);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 2;
    return (telas[chave] = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0.1 }));
  }
  const cruzNasMaos = cor => (g, w) => { g.strokeStyle = cor || '#3a2410'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 + 16, 92); g.lineTo(w / 2 + 16, 122); g.moveTo(w / 2 + 8, 100); g.lineTo(w / 2 + 24, 100); g.stroke(); };
  const livroNasMaos = cor => (g, w) => { g.fillStyle = cor || '#7a140d'; g.fillRect(w / 2 - 22, 104, 18, 13); };
  const bastao = cor => (g, w) => { g.strokeStyle = cor || '#d8b048'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 + 26, 80); g.lineTo(w / 2 + 26, 140); g.stroke(); };
  const PINT = {
    // os santos dos atos
    antao: { rotulo: 'S. Antão', veste: '#4a3424', manto: '#2e2018', barba: '#ecece4', fundo: '#1e3a5e', atributo: (g, w) => { g.strokeStyle = '#3a6aa8'; g.lineWidth = 4; g.beginPath(); g.moveTo(w / 2 + 18, 90); g.lineTo(w / 2 + 18, 140); g.moveTo(w / 2 + 8, 90); g.lineTo(w / 2 + 28, 90); g.stroke(); } },
    nicolau: { rotulo: 'S. Nicolau', veste: '#f0ece2', manto: '#9a1a1a', barba: '#f2f0ea', mitra: true, estola: true, fundo: '#21365a', atributo: livroNasMaos('#9a1a1a') },
    lourenco: { rotulo: 'S. Lourenço', veste: '#9a1a1a', manto: '#7a1010', estola: true, fundo: '#253a2a', atributo: (g, w) => { g.strokeStyle = '#2a2a2e'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2 + 12 + i * 4, 96); g.lineTo(w / 2 + 12 + i * 4, 132); g.stroke(); } g.beginPath(); g.moveTo(w / 2 + 10, 96); g.lineTo(w / 2 + 28, 96); g.moveTo(w / 2 + 10, 132); g.lineTo(w / 2 + 28, 132); g.stroke(); } },
    joaoBatista: { rotulo: 'S. João Batista', veste: '#8a6a3a', manto: '#9a1a1a', barba: '#3a2414', fundo: '#2a4a5a', atributo: (g, w) => { g.strokeStyle = '#d8b048'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 + 22, 78); g.lineTo(w / 2 + 22, 140); g.moveTo(w / 2 + 15, 86); g.lineTo(w / 2 + 29, 86); g.stroke(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.ellipse(w / 2 - 16, 116, 11, 7, 0, 0, Math.PI * 2); g.fill(); } },
    martinho: { rotulo: 'S. Martinho', veste: '#b0b6c0', manto: '#9a1a1a', barba: null, fundo: '#2a1e3a', atributo: (g, w) => { g.strokeStyle = '#d8d8d8'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2 - 26, 96); g.lineTo(w / 2 - 26, 132); g.stroke(); g.fillStyle = '#9a1a1a'; g.fillRect(w / 2 + 6, 100, 22, 30); } },
    moises: { rotulo: 'S. Moisés', veste: '#d8ccb0', manto: '#5a2a1a', barba: '#ecece4', fundo: '#3a2a1a', atributo: (g, w) => { g.fillStyle = '#c8c0b0'; g.beginPath(); g.moveTo(w / 2 - 24, 128); g.lineTo(w / 2 - 24, 100); g.arc(w / 2 - 17, 100, 7, Math.PI, 0); g.lineTo(w / 2 - 10, 128); g.closePath(); g.fill(); g.strokeStyle = '#f2d27a'; g.lineWidth = 2; [-1, 1].forEach(k => { g.beginPath(); g.moveTo(w / 2 + k * 8, 40); g.lineTo(w / 2 + k * 14, 26); g.stroke(); }); } },
    agostinho: { rotulo: 'S. Agostinho', veste: '#1a1614', manto: '#8a6a2a', barba: '#3a2a1a', mitra: true, fundo: '#3a1e2a', atributo: livroNasMaos('#d8b048') },
    // ícone do Cristo Pantocrator (IC XC)
    pantocrator: { rotulo: 'IC XC', veste: '#7a1a14', manto: '#1e3a7a', barba: '#3a2414', fundo: '#c99a3a', atributo: livroNasMaos('#d8b048') },
    bizantino: { rotulo: 'Ícone antigo', veste: '#3a1e14', manto: '#1a3a2a', barba: '#4a3a2a', fundo: '#8a6a2a', atributo: cruzNasMaos('#e8c45a') }
  };
  // os patronos das ordens: cores e sinais da iconografia de cada um
  const PATRONO_PINT = {
    "Santa Joana d'Arc": { veste: '#b0b6c0', manto: '#1e3a7a', fundo: '#2a1e3a', atributo: bastao('#f4ecd8') },
    'São Francisco de Assis': { veste: '#6a4a2a', manto: '#5a3e22', fundo: '#2e3a22', atributo: cruzNasMaos() },
    'Santa Clara de Assis': { veste: '#6a4a2a', veu: '#1a1614', fundo: '#2e3a22', atributo: (g, w) => { g.fillStyle = '#e8c45a'; g.fillRect(w / 2 + 10, 100, 14, 18); } },
    'Santo Tomás de Aquino': { veste: '#f0ece2', manto: '#1a1614', fundo: '#21365a', atributo: livroNasMaos('#7a140d') },
    'Santa Catarina de Sena': { veste: '#f0ece2', manto: '#1a1614', veu: '#f0ece2', fundo: '#21365a', atributo: cruzNasMaos() },
    "Santo Cura d'Ars": { veste: '#1a1614', manto: '#f0ece2', fundo: '#3a2a1e', atributo: cruzNasMaos() },
    'Santa Luísa de Marillac': { veste: '#5a5a62', veu: '#1a1614', fundo: '#2a3a4a', atributo: livroNasMaos('#3a2410') },
    'São Miguel Arcanjo': { veste: '#b0b6c0', manto: '#9a1a1a', asas: true, fundo: '#1e2c4e', atributo: bastao('#e8e8f0') },
    'São Dimas, o Bom Ladrão': { veste: '#c8b48a', fundo: '#3a2a1e', atributo: cruzNasMaos('#5a3a1a') },
    'Santa Maria Madalena': { veste: '#5a1e22', manto: '#9a1a1a', fundo: '#2a1e2a', atributo: (g, w) => { g.fillStyle = '#e8d8b0'; g.fillRect(w / 2 + 10, 102, 12, 14); } },
    'Santa Cecília': { veste: '#2f5b33', manto: '#9a1a1a', fundo: '#2a1e3a', atributo: (g, w) => { g.fillStyle = '#d8b048'; for (let i = 0; i < 4; i++) g.fillRect(w / 2 + 10 + i * 4, 96 + i * 3, 3, 30 - i * 3); } },
    'São Bento': { veste: '#1a1614', manto: '#2a2420', barba: '#ecece4', fundo: '#3a2a1e', atributo: livroNasMaos('#7a140d') },
    'Santa Escolástica': { veste: '#1a1614', veu: '#f0ece2', fundo: '#3a2a1e', atributo: livroNasMaos('#7a140d') },
    'Santo Antão': PINT.antao,
    'Santa Sinclética': { veste: '#3a2a20', veu: '#1a1614', fundo: '#1e3a5e', atributo: cruzNasMaos() },
    'Santo Olavo e São Cristóvão': { veste: '#1e3a7a', manto: '#9a1a1a', coroa: true, barba: '#c8a060', fundo: '#21365a', atributo: bastao('#b0b6c0') },
    'Santa Olga de Kiev': { veste: '#5a2a6a', manto: '#d8b048', coroa: true, fundo: '#21365a', atributo: cruzNasMaos('#e8c45a') },
    'São Pio de Pietrelcina': { veste: '#6a4a2a', barba: '#d8d4cc', fundo: '#2e3a22', atributo: cruzNasMaos() },
    "Santa Teresa d'Ávila": { veste: '#6a4a2a', manto: '#f0ece2', veu: '#1a1614', fundo: '#3a2a1e', atributo: livroNasMaos('#7a140d') },
    'São Cipriano de Antioquia': { veste: '#f0ece2', manto: '#9a1a1a', mitra: true, barba: '#3a2a1a', fundo: '#2a1e2a', atributo: livroNasMaos('#d8b048') },
    'Santa Gemma Galgani': { veste: '#1a1614', fundo: '#2a1e3a', atributo: cruzNasMaos('#9a1a1a') }
  };
  const abrev = n => n.replace(/^Santa /, 'Sta. ').replace(/^Santo /, 'Sto. ').replace(/^São /, 'S. ').replace(/,.*$/, '').replace(/ de Assis| de Aquino| de Sena| de Marillac| de Pietrelcina| de Antioquia| de Kiev| Galgani/, '');

  /* ================= AS PEÇAS ================= */
  const BOX = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
  const CIL = (rt, rb, h, mat, x, y, z, n) => mesh(new THREE.CylinderGeometry(rt, rb, h, n || 8), mat, x, y, z);
  const bronze = sm(0xa87722, { metalness: 0.65, roughness: 0.4 }), prata = sm(0xc8ccd2, { metalness: 0.7, roughness: 0.35 });
  const linho = sm(0xece4d0), pano = c => sm(c, { roughness: 1 });
  let chamasDe = null; // as chamas da peça que está sendo montada
  function chama(g, x, y, z, s) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05 * (s || 1), 0.16 * (s || 1), 5), MAT.flame); f.position.set(x, y, z); g.add(f); M.flames.push(f); if (chamasDe) chamasDe.push(f); return f; }
  const vela = (g, x, y, z, h) => { g.add(CIL(0.045, 0.05, h, MAT.wax, x, y + h / 2, z, 6)); chama(g, x, y + h + 0.07, z); };
  function quadro(mat, w, h) { // uma pintura na parede, com moldura de ouro
    const g = new THREE.Group();
    g.add(BOX(w + 0.14, h + 0.14, 0.06, MAT.gold, 0, 0, 0.03));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.z = 0.065; g.add(p);
    return g;
  }
  const santoQuadro = (chave, op) => () => quadro(pintura(chave, op), 0.62, 0.86);
  function crucifixo(madeira) {
    const g = new THREE.Group(), m = madeira || MAT.woodL, corpo = sm(0xe6d6bc);
    g.add(BOX(0.09, 1.05, 0.06, m, 0, 0, 0.03)); g.add(BOX(0.62, 0.09, 0.06, m, 0, 0.24, 0.03));
    g.add(BOX(0.08, 0.36, 0.05, corpo, 0, 0.02, 0.08)); g.add(BOX(0.46, 0.05, 0.04, corpo, 0, 0.22, 0.08));
    g.add(mesh(new THREE.SphereGeometry(0.045, 6, 5), corpo, 0, 0.29, 0.09));
    g.add(BOX(0.18, 0.06, 0.02, linho, 0, 0.44, 0.07)); // o letreiro INRI
    return g;
  }
  function tapecaria(cores, motivo) {
    const g = new THREE.Group(), w = 1.15, h = 1.6;
    const c = document.createElement('canvas'); c.width = 64; c.height = 96; const x = c.getContext('2d');
    x.fillStyle = cores[0]; x.fillRect(0, 0, 64, 96); x.fillStyle = cores[1]; x.fillRect(4, 4, 56, 88); x.fillStyle = cores[0]; x.fillRect(8, 8, 48, 80);
    x.fillStyle = cores[2]; for (let i = 0; i < 6; i++) { x.fillRect(4 + i * 10, 4, 4, 4); x.fillRect(4 + i * 10, 88, 4, 4); }
    motivo(x);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 1, side: THREE.DoubleSide })); p.position.set(0, 0, 0.04); g.add(p);
    g.add(CIL(0.025, 0.025, w + 0.25, MAT.wood, 0, h / 2 + 0.04, 0.05, 6)); g.children[g.children.length - 1].rotation.z = Math.PI / 2;
    return g;
  }
  function estandarte(cor) {
    const g = new THREE.Group();
    g.add(CIL(0.18, 0.24, 0.1, MAT.wood, 0, 0.05, 0)); g.add(CIL(0.03, 0.035, 2.5, MAT.wood, 0, 1.3, 0, 6));
    g.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), MAT.gold, 0, 2.58, 0));
    const b = BOX(0.8, 0.05, 0.05, MAT.wood, 0, 2.38, 0.04); g.add(b);
    const ban = BOX(0.72, 1.05, 0.02, pano(cor), 0, 1.84, 0.06); g.add(ban);
    g.add(BOX(0.08, 0.6, 0.025, MAT.gold, 0, 1.88, 0.08)); g.add(BOX(0.36, 0.08, 0.025, MAT.gold, 0, 2.0, 0.08));
    return g;
  }
  const corOrdem = () => ({ joana: 0x1e3a7a, franciscano: 0x6a4a2a, dominicano: 0x1a1614, diocesano: 0x7a140d, miguel: 0x9a1a1a, dimas: 0x3a2a1e, cecilia: 0x2f5b33, bento: 0x1a1614, eremita: 0x4a5a3a, norte: 0x3a4a6a })[P.pers && P.pers.ordem] || 0x7a140d;

  /* tipo: 'parede' (no alto da parede) ou 'chao'. fonte: missao, loja, ferreiro ou bau */
  const DECOR = {
    // as imagens dos santos dos atos (recompensa ao fim de cada ato)
    imgAntao: { nome: 'Imagem de Santo Antão', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato1_fim, onde: 'Recompensa do Ato I', descr: 'Uma pintura do pai dos monges, com o Tau azul e a barba branca.', hagio: 'Santo Antão vendeu tudo o que tinha ao ouvir no Evangelho: «Se queres ser perfeito, vende o que tens e dá aos pobres» (Mt 19,21).', mk: santoQuadro('antao', PINT.antao) },
    imgNicolau: { nome: 'Imagem de São Nicolau', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato2_fim, onde: 'Recompensa do Ato II', descr: 'O bispo de Mira, de capa vermelha e mitra, com o livro dos Evangelhos.', hagio: 'São Nicolau é lembrado como o bispo generoso que socorria os pobres às escondidas.', mk: santoQuadro('nicolau', PINT.nicolau) },
    imgLourenco: { nome: 'Imagem de São Lourenço', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato3_fim, onde: 'Recompensa do Ato III', descr: 'O diácono de Roma, de dalmática vermelha, com a grelha do martírio.', hagio: 'Diz a tradição que, na grelha, São Lourenço ainda brincou com os carrascos: «Deste lado já está assado, virem-me do outro».', mk: santoQuadro('lourenco', PINT.lourenco) },
    imgAgostinho: { nome: 'Imagem de Santo Agostinho', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato4_fim, onde: 'Recompensa do Ato IV', descr: 'O bispo de Hipona, de hábito negro e mitra, com o livro das Confissões.', hagio: '«Fizeste-nos para ti, Senhor, e o nosso coração anda inquieto enquanto não descansa em ti» (Confissões, I, 1).', mk: santoQuadro('agostinho', PINT.agostinho) },
    imgJoao: { nome: 'Imagem de São João Batista', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato5_fim, onde: 'Recompensa do Ato V', descr: 'O Precursor, de pele de camelo e manto vermelho, com a cruz de cana e o Cordeiro.', hagio: '«É preciso que ele cresça e eu diminua» (Jo 3,30). O amigo do noivo se alegra com a voz do noivo.', mk: santoQuadro('joaoBatista', PINT.joaoBatista) },
    imgMartinho: { nome: 'Imagem de São Martinho de Tours', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato6_fim, onde: 'Recompensa do Ato VI', descr: 'O soldado de Cristo, de armadura e manto vermelho cortado ao meio.', hagio: 'Diante do imperador, Martinho disse: «Sou soldado de Cristo; não me é lícito combater». E se ofereceu para ficar desarmado diante das fileiras.', mk: santoQuadro('martinho', PINT.martinho) },
    imgMoises: { nome: 'Imagem de Moisés', tipo: 'parede', grupo: 'Santos', fonte: 'missao', cond: () => !!F().ato7_fim, onde: 'Recompensa do Ato VII', descr: 'O legislador de Israel, com as tábuas da Lei e o rosto que brilha.', hagio: '«Moisés era o homem mais humilde que havia sobre a terra» (Nm 12,3). Ao descer do Sinai, o seu rosto brilhava, e ele não sabia.', mk: santoQuadro('moises', PINT.moises) },
    // lembranças das missões
    concha: { nome: 'Concha de peregrino', tipo: 'parede', grupo: 'Lembranças', fonte: 'missao', cond: () => feita('m1b'), onde: 'Missão «A Portaria do Mosteiro»', descr: 'A vieira que o Irmão Bernardo dá a cada peregrino que passa pela portaria.', hagio: 'Os peregrinos de Santiago traziam a vieira no chapéu ou no manto, como sinal da viagem cumprida.',
      mk: () => { const g = new THREE.Group(); g.add(BOX(0.5, 0.5, 0.04, MAT.woodL, 0, 0, 0.02)); const s = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12, 0, Math.PI), sm(0xe8d8b8)); s.position.set(0, -0.08, 0.05); g.add(s); for (let i = 0; i < 6; i++) { const r = BOX(0.015, 0.2, 0.01, sm(0xc8a878), 0, -0.0, 0.055); r.rotation.z = -1.2 + i * 0.48; r.position.set(Math.sin(-(-1.2 + i * 0.48)) * 0.1, -0.08 + Math.cos(-1.2 + i * 0.48) * 0.1, 0.055); g.add(r); } return g; } },
    badalo: { nome: 'Badalo de bronze', tipo: 'chao', grupo: 'Lembranças', fonte: 'missao', cond: () => feita('m3'), onde: 'Missão «Os Sinos Mudos»', descr: 'Um badalo velho, rachado, que o sineiro trocou depois que os sinos voltaram a tocar.', hagio: 'Os sinos chamam à oração três vezes por dia, no Ângelus da manhã, do meio-dia e da tarde.',
      mk: () => { const g = new THREE.Group(); g.add(BOX(0.7, 0.08, 0.5, MAT.wood, 0, 0.04, 0)); [-0.28, 0.28].forEach(x => g.add(BOX(0.07, 1.1, 0.07, MAT.wood, x, 0.6, 0))); g.add(BOX(0.66, 0.07, 0.07, MAT.wood, 0, 1.15, 0)); g.add(CIL(0.02, 0.02, 0.4, MAT.iron, 0, 0.92, 0, 5)); g.add(CIL(0.05, 0.12, 0.34, bronze, 0, 0.6, 0)); g.add(mesh(new THREE.SphereGeometry(0.11, 8, 6), bronze, 0, 0.42, 0)); return g; } },
    tercoMatias: { nome: 'Terço do Velho Matias', tipo: 'parede', grupo: 'Lembranças', fonte: 'missao', cond: () => feita('s6'), onde: 'Missão «O Moribundo»', descr: 'O terço de contas gastas que o Velho Matias deixou para quem rezou com ele no fim.', hagio: '«Rogai por nós, pecadores, agora e na hora da nossa morte.»',
      mk: () => { const g = new THREE.Group(); g.add(BOX(0.42, 0.56, 0.04, MAT.woodL, 0, 0, 0.02)); g.add(CIL(0.012, 0.012, 0.06, MAT.iron, 0, 0.2, 0.05, 4)); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; g.add(mesh(new THREE.SphereGeometry(0.018, 5, 4), MAT.wood, Math.sin(a) * 0.12, 0.05 + Math.cos(a) * 0.14, 0.06)); } g.add(BOX(0.012, 0.12, 0.012, MAT.wood, 0, -0.16, 0.06)); g.add(BOX(0.07, 0.012, 0.012, MAT.wood, 0, -0.14, 0.06)); return g; } },
    lanternaFarol: { nome: 'Lanterna do farol', tipo: 'chao', grupo: 'Lembranças', fonte: 'missao', cond: () => feita('a2m4'), onde: 'Missão «O Farol de São Nicolau»', descr: 'Uma das lanternas velhas do farol, que os pescadores deram de presente.', hagio: 'São Nicolau é o padroeiro dos marinheiros: diz a tradição que acalmou uma tempestade com a oração.',
      mk: () => { const g = new THREE.Group(); g.add(CIL(0.2, 0.26, 0.6, MAT.wood, 0, 0.3, 0, 6)); g.add(BOX(0.28, 0.36, 0.28, MAT.iron, 0, 0.8, 0)); g.add(BOX(0.22, 0.3, 0.22, new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.55 }), 0, 0.8, 0)); g.add(mesh(new THREE.ConeGeometry(0.22, 0.16, 4), MAT.iron, 0, 1.06, 0)); chama(g, 0, 0.78, 0, 1.2); return g; } },
    // a santeira da vila
    crucifixo: { nome: 'Crucifixo de madeira', tipo: 'parede', grupo: 'Sagrado', fonte: 'loja', preco: 40, descr: 'Um crucifixo de nogueira, entalhado por um irmão leigo do mosteiro.', hagio: '«Nós pregamos Cristo crucificado, escândalo para os judeus e loucura para os pagãos» (1Cor 1,23).', mk: () => crucifixo(MAT.woodL) },
    pantocrator: { nome: 'Ícone do Cristo Pantocrator', tipo: 'parede', grupo: 'Sagrado', fonte: 'loja', preco: 70, descr: 'Cristo, Senhor de todas as coisas, com o livro dos Evangelhos na mão.', hagio: 'Os ícones são escritos, não pintados: o iconógrafo reza e jejua enquanto trabalha.', mk: () => quadro(pintura('pantocrator', PINT.pantocrator), 0.62, 0.86) },
    candelabro: { nome: 'Candelabro de três velas', tipo: 'chao', grupo: 'Sagrado', fonte: 'loja', preco: 30, descr: 'Três velas acesas num pé de madeira torneada.', hagio: 'A luz das velas diante das imagens é uma oração que continua acesa quando a pessoa já saiu.',
      mk: () => { const g = new THREE.Group(); g.add(CIL(0.22, 0.26, 0.06, MAT.wood, 0, 0.03, 0)); g.add(CIL(0.04, 0.05, 1.0, MAT.wood, 0, 0.55, 0, 6)); g.add(BOX(0.6, 0.05, 0.08, MAT.wood, 0, 1.06, 0)); [-0.25, 0, 0.25].forEach((x, i) => vela(g, x, 1.08, 0, i === 1 ? 0.28 : 0.2)); return g; } },
    tapecariaPastor: { nome: 'Tapeçaria do Bom Pastor', tipo: 'parede', grupo: 'Sagrado', fonte: 'loja', preco: 80, descr: 'Lã tecida em verde e ouro: o pastor com a ovelha nos ombros.', hagio: '«Eu sou o bom pastor. O bom pastor dá a vida pelas suas ovelhas» (Jo 10,11).',
      mk: () => tapecaria(['#2f5b33', '#d8b048', '#9a1a1a'], x => { x.fillStyle = '#f2d27a'; x.beginPath(); x.arc(32, 30, 7, 0, 7); x.fill(); x.fillStyle = '#e0b894'; x.fillRect(29, 26, 6, 8); x.fillStyle = '#9a1a1a'; x.fillRect(24, 36, 16, 34); x.fillStyle = '#ece4d0'; x.fillRect(20, 34, 24, 8); x.fillStyle = '#5a3a1a'; x.fillRect(44, 30, 2, 44); }) },
    estandarte: { nome: 'Estandarte da sua ordem', tipo: 'chao', grupo: 'Sagrado', fonte: 'loja', preco: 50, descr: 'O pano da sua ordem, com a cruz bordada em ouro, num mastro de carvalho.', hagio: 'Os estandartes iam à frente das procissões, para que o povo soubesse por quem caminhava.', mk: () => estandarte(corOrdem()) },
    estante: { nome: 'Estante de livros', tipo: 'chao', grupo: 'Móveis', fonte: 'loja', preco: 60, descr: 'Uma estante de pinho com breviários, um saltério e uma vida de santos.', hagio: 'Os mosteiros copiaram à mão os livros que hoje lemos, uma letra de cada vez.',
      mk: () => { const g = new THREE.Group(); g.add(BOX(1.1, 1.7, 0.34, MAT.wood, 0, 0.85, -0.1)); const cores = [0x7a140d, 0x2f5b33, 0x27467e, 0x5a3a1a, 0xa87722]; [0.45, 0.95, 1.42].forEach((y, k) => { g.add(BOX(1.0, 0.04, 0.3, MAT.woodL, 0, y - 0.2, -0.06)); for (let i = 0; i < 7; i++) g.add(BOX(0.1, 0.32 - (i % 3) * 0.04, 0.22, sm(cores[(i + k) % 5]), -0.4 + i * 0.13, y - 0.02, -0.04)); }); return g; } },
    arca: { nome: 'Arca entalhada', tipo: 'chao', grupo: 'Móveis', fonte: 'loja', preco: 45, descr: 'Uma arca de castanho com cruzes entalhadas na tampa. Por enquanto, só enfeita.', hagio: 'Nas casas antigas, a arca guardava o enxoval, os papéis da família e as velas da Candelária.',
      mk: () => { const g = new THREE.Group(); g.add(BOX(1.1, 0.55, 0.6, sm(0x5a3a22), 0, 0.28, 0)); g.add(BOX(1.14, 0.1, 0.64, sm(0x4a2e1a), 0, 0.6, 0)); [-0.42, 0.42].forEach(x => g.add(BOX(0.05, 0.6, 0.66, MAT.iron, x, 0.32, 0))); g.add(BOX(0.04, 0.16, 0.02, MAT.gold, 0, 0.36, 0.31)); g.add(BOX(0.12, 0.04, 0.02, MAT.gold, 0, 0.4, 0.31)); return g; } },
    lirios: { nome: 'Vaso de lírios', tipo: 'chao', grupo: 'Móveis', fonte: 'loja', preco: 20, descr: 'Lírios brancos num vaso de barro. Não murcham, por graça de quem os pôs ali.', hagio: '«Olhai os lírios do campo: não trabalham nem fiam» (Mt 6,28).',
      mk: () => { const g = new THREE.Group(); g.add(CIL(0.16, 0.12, 0.42, sm(0x9a5a3a), 0, 0.21, 0)); const caule = sm(0x3a6a2a), flor = sm(0xf4f0e6); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28, r = 0.05; const c = CIL(0.01, 0.01, 0.7, caule, Math.sin(a) * r, 0.75, Math.cos(a) * r, 4); c.rotation.set(Math.cos(a) * 0.15, 0, -Math.sin(a) * 0.15); g.add(c); g.add(mesh(new THREE.ConeGeometry(0.06, 0.14, 5), flor, Math.sin(a) * r * 2.4, 1.12 + (i % 2) * 0.06, Math.cos(a) * r * 2.4)); } return g; } },
    // os ferreiros
    castical: { nome: 'Castiçal de ferro', tipo: 'chao', grupo: 'Sagrado', fonte: 'ferreiro', ferreiro: 'lia', den: 25, mats: { chifre: 1, lodo: 1 }, onde: 'Forja de Lia, na vila', descr: 'Um castiçal alto, de ferro batido, com um círio de cera de abelha.', hagio: 'O círio pascal, aceso na Vigília, é o sinal de Cristo ressuscitado no meio do seu povo.',
      mk: () => { const g = new THREE.Group(); [0, 2.09, 4.19].forEach(a => { const p = BOX(0.04, 0.04, 0.32, MAT.iron, Math.sin(a) * 0.12, 0.04, Math.cos(a) * 0.12); p.rotation.y = a; g.add(p); }); g.add(CIL(0.025, 0.03, 1.3, MAT.iron, 0, 0.68, 0, 6)); g.add(CIL(0.1, 0.06, 0.06, MAT.iron, 0, 1.34, 0)); vela(g, 0, 1.36, 0, 0.42); return g; } },
    crucifixoFerro: { nome: 'Crucifixo de ferro', tipo: 'parede', grupo: 'Sagrado', fonte: 'ferreiro', ferreiro: 'lia', den: 30, mats: { pelo: 1, chifre: 1 }, onde: 'Forja de Lia, na vila', descr: 'Forjado a frio por Lia e benzido pelo Padre Tomé.', hagio: '«Ave, ó cruz, única esperança» (hino Vexilla Regis, de São Venâncio Fortunato).', mk: () => crucifixo(MAT.iron) },
    lampadario: { nome: 'Lampadário de bronze', tipo: 'chao', grupo: 'Sagrado', fonte: 'ferreiro', ferreiro: 'eustaquio', den: 40, mats: { pena: 1, carapaca: 1 }, onde: 'Forja do Mosteiro', descr: 'Uma lâmpada de azeite pendurada num suporte de bronze, como a do sacrário.', hagio: 'Nas igrejas, uma lâmpada sempre acesa avisa que Cristo está presente no sacrário.',
      mk: () => { const g = new THREE.Group(); g.add(CIL(0.18, 0.22, 0.06, bronze, 0, 0.03, 0)); g.add(CIL(0.025, 0.03, 1.6, bronze, 0, 0.83, 0, 6)); g.add(BOX(0.42, 0.03, 0.03, bronze, 0.19, 1.6, 0)); g.add(CIL(0.006, 0.006, 0.3, MAT.iron, 0.38, 1.45, 0, 3)); g.add(CIL(0.1, 0.05, 0.12, new THREE.MeshBasicMaterial({ color: 0xc81e1a, transparent: true, opacity: 0.8 }), 0.38, 1.28, 0)); chama(g, 0.38, 1.37, 0, 0.8); return g; } },
    tenaz: { nome: 'Tenazes de São Dunstano', tipo: 'parede', grupo: 'Lembranças', fonte: 'ferreiro', ferreiro: 'dunstano', den: 60, mats: { elitro: 1, asa: 1 }, onde: 'Forja de São Dunstano, nas minas', descr: 'Um par de tenazes cruzadas sobre uma tábua, como as do santo ferreiro.', hagio: 'Conta a lenda que São Dunstano prendeu o nariz do diabo com as tenazes em brasa da sua forja.',
      mk: () => { const g = new THREE.Group(); g.add(BOX(0.6, 0.6, 0.04, MAT.wood, 0, 0, 0.02)); [-0.6, 0.6].forEach(a => { const t = BOX(0.04, 0.7, 0.03, MAT.iron, 0, 0, 0.06); t.rotation.z = a; g.add(t); }); return g; } },
    // os baús raros
    bizantino: { nome: 'Ícone bizantino', tipo: 'parede', grupo: 'Sagrado', fonte: 'bau', onde: 'Baús raros', descr: 'Um ícone antigo, de ouro gasto, trazido do Oriente por algum peregrino.', hagio: 'O II Concílio de Niceia (787) ensinou que a honra dada à imagem passa para quem ela representa.', mk: () => quadro(pintura('bizantino', PINT.bizantino), 0.62, 0.86) },
    tapecariaArca: { nome: 'Tapeçaria da Arca de Noé', tipo: 'parede', grupo: 'Sagrado', fonte: 'bau', onde: 'Baús raros', descr: 'A arca sobre as águas e a pomba com o ramo de oliveira.', hagio: '«A pomba voltou ao entardecer, trazendo no bico um ramo novo de oliveira» (Gn 8,11).',
      mk: () => tapecaria(['#27467e', '#d8b048', '#ece4d0'], x => { x.fillStyle = '#5a3a1a'; x.fillRect(14, 54, 36, 10); x.fillRect(22, 44, 20, 10); x.fillStyle = '#4a7ab8'; x.fillRect(8, 64, 48, 12); x.fillStyle = '#ece4d0'; x.fillRect(38, 24, 8, 5); x.fillStyle = '#3a6a2a'; x.fillRect(46, 25, 4, 2); }) },
    estandarteJorge: { nome: 'Estandarte de São Jorge', tipo: 'chao', grupo: 'Sagrado', fonte: 'bau', onde: 'Baús raros', descr: 'Pano branco com a cruz vermelha, de um antigo cavaleiro.', hagio: 'São Jorge, soldado e mártir, é invocado contra o dragão: o mal que se vence com a fé.', mk: () => estandarte(0xece4d0) },
    ampulheta: { nome: 'Ampulheta do monge', tipo: 'chao', grupo: 'Móveis', fonte: 'bau', onde: 'Baús raros', descr: 'Uma mesinha com uma ampulheta e um crânio de cera: lembrança de que o tempo passa.', hagio: 'Os monges deixavam um memento mori à vista: «Lembra-te de que és pó».',
      mk: () => { const g = new THREE.Group(); g.add(BOX(0.6, 0.05, 0.45, MAT.woodL, 0, 0.72, 0)); [[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]].forEach(([a, b]) => g.add(BOX(0.05, 0.72, 0.05, MAT.wood, a, 0.36, b))); g.add(BOX(0.14, 0.03, 0.14, MAT.wood, -0.1, 0.76, 0)); g.add(BOX(0.14, 0.03, 0.14, MAT.wood, -0.1, 1.0, 0)); g.add(mesh(new THREE.ConeGeometry(0.06, 0.11, 8), sm(0xd8ecf0, { transparent: true, opacity: 0.6 }), -0.1, 0.83, 0)); const c2 = mesh(new THREE.ConeGeometry(0.06, 0.11, 8), sm(0xd8ecf0, { transparent: true, opacity: 0.6 }), -0.1, 0.93, 0); c2.rotation.x = Math.PI; g.add(c2); g.add(mesh(new THREE.SphereGeometry(0.08, 7, 6), MAT.wax, 0.15, 0.82, 0)); return g; } }
  };
  // os patronos de todas as ordens (a santeira vende os da sua)
  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '');
  const PATRONOS = {};
  for (const k in (OV.ORDENS || {})) {
    const o = OV.ORDENS[k]; if (!o.patrono) continue;
    ['m', 'f'].forEach(s => {
      const nome = o.patrono[s], id = 'pat_' + slug(nome); if (DECOR[id]) { PATRONOS[k] = PATRONOS[k] || []; if (!PATRONOS[k].includes(id)) PATRONOS[k].push(id); return; }
      const pint = Object.assign({ rotulo: abrev(nome) }, PATRONO_PINT[nome] || { veste: '#27467e', fundo: '#2a1e3a', atributo: cruzNasMaos() }); pint.rotulo = abrev(nome);
      DECOR[id] = { nome: 'Imagem de ' + nome, tipo: 'parede', grupo: 'Santos', fonte: 'loja', preco: 60, patrono: k, descr: `Uma pintura de ${nome}, patrono da ordem ${o.ordem ? o.ordem[s] : ''}.`.replace(' patrono da ordem .', '.'), hagio: 'Cada ordem guarda a imagem do seu patrono, para lembrar que ninguém luta sozinho: os santos intercedem do céu.', mk: santoQuadro(id, pint) };
      PATRONOS[k] = PATRONOS[k] || []; if (!PATRONOS[k].includes(id)) PATRONOS[k].push(id);
    });
  }
  // nome de quem patrocina: o feminino do patrono, quando a personagem é mulher, vem primeiro
  if (DECOR.pat_SantaJoanadArc) DECOR.pat_SantaJoanadArc.descr = 'Uma pintura de Santa Joana d\'Arc, a donzela de Orléans, de armadura e estandarte.';
  CS.DECOR = DECOR;
  const ORDEM_GRUPO = ['Santos', 'Sagrado', 'Lembranças', 'Móveis'];
  const fonteTxt = d => d.fonte === 'loja' ? `Santeira da vila · ${d.preco} denários` : d.fonte === 'ferreiro' ? (d.onde || 'Ferreiros') : d.fonte === 'bau' ? 'Baús raros (masmorras e tesouros)' : (d.onde || 'Missões');

  /* ================= A CASA ================= */
  const W_ = 12, D_ = 10, H_ = 4.6, T = 0.35;
  // os encaixes: [id, nome, cômodo, lx, lz, rot, tipo]
  const ENCAIXES = [
    ['o1', 'Parede do altar', 'Canto de oração', -3, -4.62, 0, 'parede'],
    ['o2', 'Parede do oratório', 'Canto de oração', -5.62, -1.1, Math.PI / 2, 'parede'],
    ['o3', 'Canto do oratório', 'Canto de oração', -5.0, -0.9, 2.2, 'chao'],
    ['o4', 'Junto ao altar', 'Canto de oração', -0.9, -4.0, -0.95, 'chao'],
    ['q1', 'Parede do quarto', 'Quarto', 2.2, -4.62, 0, 'parede'],
    ['q2', 'Parede da porta do quarto', 'Quarto', 0.14, -2.4, Math.PI / 2, 'parede'],
    ['q3', 'Canto do quarto', 'Quarto', 1.1, -1.0, 2.3, 'chao'],
    ['s1', 'Parede da sala', 'Sala', 0, 0.14, 0, 'parede'],
    ['s2', 'Parede do baú', 'Sala', 5.62, 1.0, -Math.PI / 2, 'parede'],
    ['s5', 'Parede da entrada', 'Sala', -3.0, 4.62, Math.PI, 'parede'],
    ['s3', 'Canto da lareira', 'Sala', -5.0, 4.0, 1.9, 'chao'],
    ['s4', 'Canto da entrada', 'Sala', 5.0, 4.0, -1.9, 'chao']
  ];
  CS.ENCAIXES = ENCAIXES;
  const ENC = {}; ENCAIXES.forEach(e => { ENC[e[0]] = e; });
  CS.casas = [];
  function construirCasa(regiao, x, z, rot) {
    const c = M.casaInterior(x, z, rot, W_, D_, H_, { nome: 'Casa do Peregrino', rh: 2.8, mat: MAT.plaster[2] });
    c.peregrino = true; c.regiao = regiao;
    const g = c.g, mp = c.mp, cs = Math.cos(rot), sn = Math.sin(rot);
    // as paredes de dentro: uma divisória que separa a sala dos dois cômodos do fundo, e outra entre eles
    const tp = 0.2, porta = 1.4, ih = W_ / 2 - T;
    const segs = [[-ih, -3 - porta / 2], [-3 + porta / 2, 3 - porta / 2], [3 + porta / 2, ih]];
    const parede = (lx, lz, hw, hd) => {
      g.add(mesh(new THREE.BoxGeometry(hw * 2, H_, hd * 2), mp, lx, H_ / 2, lz));
      const p = c.W(lx, lz), b = M.caixa(p.x, p.z, hw, hd, rot); c.caixas.push(b);
    };
    segs.forEach(([a, b]) => parede((a + b) / 2, 0, (b - a) / 2, tp / 2));
    parede(0, -(D_ / 2 - T) / 2, tp / 2, (D_ / 2 - T) / 2);
    // vergas de madeira sobre as portas de dentro
    [-3, 3].forEach(lx => g.add(BOX(porta + 0.2, 0.16, tp + 0.08, MAT.wood, lx, 2.35, 0)));
    [-3, 3].forEach(lx => g.add(BOX(porta, H_ - 2.43, tp, mp, lx, 2.43 + (H_ - 2.43) / 2, 0)));
    // tapete de pedra no canto de oração
    const pedra = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 4.4), MAT.stone); pedra.rotation.x = -Math.PI / 2; pedra.position.set(-3, 0.22, -2.45); g.add(pedra);
    // o canto de oração: o genuflexório diante de uma mesinha de altar
    const alt = new THREE.Group(); alt.position.set(-3, 0.2, -4.25); g.add(alt);
    alt.add(BOX(1.3, 0.9, 0.55, MAT.woodL, 0, 0.45, 0)); alt.add(BOX(1.36, 0.04, 0.6, linho, 0, 0.92, 0)); alt.add(BOX(1.0, 0.3, 0.02, linho, 0, 0.78, 0.31));
    vela(alt, -0.45, 0.94, 0, 0.26); vela(alt, 0.45, 0.94, 0, 0.26);
    const gen = new THREE.Group(); gen.position.set(-3, 0.2, -2.55); gen.rotation.y = Math.PI; g.add(gen);
    gen.add(BOX(0.95, 0.12, 0.42, MAT.wood, 0, 0.06, 0.12)); gen.add(BOX(0.9, 0.06, 0.34, pano(0x7a140d), 0, 0.15, 0.12));
    [-0.42, 0.42].forEach(s => gen.add(BOX(0.07, 0.95, 0.07, MAT.wood, s, 0.48, -0.1)));
    const apoio = BOX(0.95, 0.06, 0.3, MAT.woodL, 0, 0.95, -0.08); apoio.rotation.x = -0.35; gen.add(apoio);
    gen.add(BOX(0.84, 0.5, 0.04, MAT.wood, 0, 0.55, -0.12));
    // o quarto: cama e um banquinho
    M.mobilia(c, 'cama', 4.85, -3.35, 0);
    M.mobilia(c, 'banco', 4.85, -0.9, 0);
    // a sala: lareira, mesa, banco e o baú do peregrino
    M.mobilia(c, 'lareira', -5.3, 1.0, Math.PI / 2);
    M.mobilia(c, 'mesa', -2.6, 2.4, 0);
    M.mobilia(c, 'banco', -2.6, 3.25, 0);
    const bau = new THREE.Group(); bau.position.set(3.3, 0.2, 4.1); bau.rotation.y = Math.PI; g.add(bau);
    bau.add(BOX(1.3, 0.75, 0.75, sm(0x4a2e1a), 0, 0.38, 0)); bau.add(BOX(1.36, 0.12, 0.8, MAT.gold, 0, 0.8, 0)); bau.add(BOX(0.12, 0.2, 0.04, MAT.gold, 0, 0.55, 0.39));
    { const p = c.W(3.3, 4.1); M.obstacles.push({ x: p.x, z: p.z, r: 0.75 }); }
    { const p = c.W(-3, -4.25); M.obstacles.push({ x: p.x, z: p.z, r: 0.6 }); }
    // os encaixes: um grupo para cada um, onde a peça escolhida é montada
    c.encaixes = {};
    ENCAIXES.forEach(([id, nome, comodo, lx, lz, r, tipo]) => {
      const e = new THREE.Group(); e.position.set(lx, tipo === 'parede' ? 2.05 : 0.2, lz); e.rotation.y = r; g.add(e);
      c.encaixes[id] = { g: e, peca: null, chamas: [] };
      const p = c.W(lx, lz), dentro = c.W(lx + Math.sin(r) * 0.9, lz + Math.cos(r) * 0.9);
      const i = M.interativo(dentro.x, dentro.z, 1.25, () => `Decorar: ${nome} (${pecaEm(id) ? DECOR[pecaEm(id)].nome : 'vazio'})`, () => abrirDecorar(id));
      i.pessoal = true; i.casa = c;
      if (tipo === 'chao') { const o = { x: 1e6, z: 1e6, x0: p.x, z0: p.z, r: 0.4, encaixe: id, casa: c }; M.obstacles.push(o); }
    });
    // as interações do baú e do genuflexório
    { const p = c.W(3.3, 3.05); const i = M.interativo(p.x, p.z, 1.5, () => 'Abrir o baú do peregrino', () => abrirBau()); i.pessoal = true; }
    { const p = c.W(-3, -1.85); const i = M.interativo(p.x, p.z, 1.4, () => 'Ajoelhar-se no genuflexório', () => rezar(c)); i.pessoal = true; }
    { const p = c.W(-3, -2.55); c.genuflexorio = { x: p.x, z: p.z, facing: rot + Math.PI }; }
    // uma luz quente em cada cômodo do fundo
    { const o = c.W(-3, -3.4), q = c.W(3, -2.6); [M.emissor(o.x, H(x, z) + 1.6, o.z, 0.8, 6, 0xffb060), M.emissor(q.x, H(x, z) + 3.4, q.z, 0.6, 6, 0xffb468)].forEach(e => { e.casa = true; e.dentro = true; }); }
    if (M.LOCAIS) M.LOCAIS['casa_' + regiao] = { nome: 'Casa do Peregrino', x, z, oy: -16 };
    CS.casas.push(c);
    return c;
  }
  // a casa fica perto da Capela do Peregrino de cada região
  for (let i = M.RECTS.length - 1; i >= 0; i--) if (M.RECTS[i].reserva) M.RECTS.splice(i, 1);
  (M.CASAS_PEREGRINO || [['vale', 18, 96, -0.322]]).forEach(([rg, x, z, rot]) => {
    if (rg === 'porto' && !OV.porto) return;
    if (rg !== 'vale' && rg !== 'porto' && !(OV.regioes && OV.regioes[rg])) return;
    construirCasa(rg, x, z, rot);
  });

  /* ---- montar as peças nos encaixes de todas as casas ---- */
  const pecaEm = id => { const d = dados(); return d && d.slots[id] && DECOR[d.slots[id]] ? d.slots[id] : null; };
  CS.pecaEm = pecaEm;
  function montar() {
    CS.casas.forEach(c => {
      for (const id in c.encaixes) {
        const en = c.encaixes[id], k = pecaEm(id);
        if (en.peca === k) continue;
        while (en.g.children.length) en.g.remove(en.g.children[0]);
        en.chamas.forEach(f => { const i = M.flames.indexOf(f); if (i >= 0) M.flames.splice(i, 1); }); en.chamas = [];
        en.peca = k;
        if (k) { chamasDe = en.chamas; try { en.g.add(DECOR[k].mk()); } catch (e) { console.warn('peça', k, e); } chamasDe = null; }
      }
      M.obstacles.forEach(o => { if (o.casa === c && o.encaixe) { const ok = !!pecaEm(o.encaixe); o.x = ok ? o.x0 : 1e6; o.z = ok ? o.z0 : 1e6; } });
    });
  }
  CS.montar = montar;

  /* ---- ganhar peças ---- */
  CS.ganhar = function (k, silencioso) {
    const d = dados(); if (!d || !DECOR[k] || d.acervo[k]) return false;
    d.acervo[k] = 1;
    if (!silencioso) setTimeout(() => ui.toast(`Nova peça para a Casa do Peregrino: ${DECOR[k].nome}. Escolha onde pô-la num dos encaixes da casa.`), 300);
    if (A.bell) A.bell(698, 0.1);
    return true;
  };
  CS.sortearNova = function (fonte) {
    const ks = Object.keys(DECOR).filter(k => DECOR[k].fonte === fonte && !CS.tem(k));
    return ks.length ? ks[(Math.random() * ks.length) | 0] : null;
  };
  // as recompensas de missão chegam sozinhas quando a condição se cumpre (vale também para gravações antigas)
  let checarT = 0;
  function checarRecompensas() {
    const d = dados(); if (!d || !OV.jogo || !OV.jogo.prog) return;
    for (const k in DECOR) { const it = DECOR[k]; if (it.fonte === 'missao' && it.cond && !d.acervo[k] && it.cond()) CS.ganhar(k); }
    if (!d.avisada && feita('m1')) { d.avisada = true; setTimeout(() => ui.toast('Você tem uma casa na vila: a Casa do Peregrino. O baú dela é o mesmo em todas as regiões, e há uma casa igual em cada uma.'), 9000); }
  }
  M.animados.push(dt => {
    checarT -= dt; if (checarT > 0) return; checarT = 1.5;
    if (!OV.jogo || OV.jogo.modo !== 'jogo' || !P.pers) return;
    checarRecompensas(); montar();
  });

  /* ---- o baú e o genuflexório ---- */
  function abrirBau() { if (!OV.jogo) return; IT.proxTitulo = 'Casa do Peregrino'; OV.jogo.salvar(); if (A.bell) A.bell(440, 0.12); OV.jogo.abrirInventario('bau'); }
  CS.abrirBau = abrirBau;
  function rezar(c) {
    if (!P.D) return;
    OV.combate.posicionar(c.genuflexorio.x, c.genuflexorio.z, c.genuflexorio.facing);
    P.fe = P.D.maxFe; P.sta = P.D.maxSta;
    if (OV.combate.anel) OV.combate.anel(0xffd27a, 1.4, 0.8, 0.6);
    if (A.bell) A.bell(523, 0.16);
    const frases = ['Em silêncio, você entrega a Deus o caminho de hoje.', 'Você reza um Pai-Nosso pelos que ainda dormem no vício.', 'Você pede aos santos que intercedem do céu: «Rogai por nós».', 'Você faz o exame de consciência do dia e agradece o que foi bom.'];
    ui.toast(frases[(Math.random() * frases.length) | 0] + ' A Fé e o fôlego voltam.');
    OV.jogo.salvar();
  }

  /* ================= O PAINEL DE DECORAR ================= */
  let encSel = null, marcador = null;
  function abrirDecorar(id) { encSel = id || encSel || 'o1'; if (OV.jogo) OV.jogo.abrirInventario('casa'); }
  CS.abrirDecorar = abrirDecorar;
  const casaAtual = () => { let best = null, bd = 1e9; CS.casas.forEach(c => { const d = Math.hypot(c.x - P.pos.x, c.z - P.pos.z); if (d < bd) { bd = d; best = c; } }); return bd < 30 ? best : null; };
  function marcar(id) {
    if (!marcador) {
      marcador = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.46, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false }));
      marcador.renderOrder = 10;
    }
    const c = casaAtual();
    if (marcador.parent) marcador.parent.remove(marcador);
    if (!c || !id) return;
    const e = ENC[id]; c.encaixes[id].g.add(marcador);
    if (e[6] === 'chao') { marcador.rotation.set(-Math.PI / 2, 0, 0); marcador.position.set(0, 0.04, 0); } else { marcador.rotation.set(0, 0, 0); marcador.position.set(0, 0, 0.12); }
  }
  M.animados.push((dt, t) => { if (marcador && marcador.parent) marcador.material.opacity = 0.45 + 0.4 * Math.abs(Math.sin((t || 0) * 3)); });
  CS.fechou = () => marcar(null);
  CS.html = function () {
    const d = dados(); if (!d) return '';
    if (!ENC[encSel]) encSel = 'o1';
    marcar(encSel);
    const e = ENC[encSel], tipo = e[6], atual = pecaEm(encSel);
    const comodos = {};
    ENCAIXES.forEach(x => { (comodos[x[2]] = comodos[x[2]] || []).push(x); });
    const lista = Object.keys(comodos).map(cm => `<div class="cs-comodo"><h4>${esc(cm)}</h4>${comodos[cm].map(x => { const p = pecaEm(x[0]); return `<button type="button" class="cs-enc${x[0] === encSel ? ' sel' : ''}" data-casa-enc="${x[0]}"><span>${esc(x[1])}<small>${x[6] === 'parede' ? 'parede' : 'chão'}</small></span><em>${p ? esc(DECOR[p].nome) : 'vazio'}</em></button>`; }).join('')}</div>`).join('');
    const minhas = Object.keys(DECOR).filter(k => d.acervo[k] && DECOR[k].tipo === tipo);
    const ondeEsta = k => { for (const s in d.slots) if (d.slots[s] === k) return s; return null; };
    const pecas = minhas.length ? minhas.map(k => { const o = ondeEsta(k), it = DECOR[k]; return `<button type="button" class="cs-peca${k === atual ? ' sel' : ''}" data-casa-peca="${k}"><b>${esc(it.nome)}</b><small>${esc(it.descr)}</small><i>${esc(it.hagio)}</i>${o && o !== encSel ? `<u>Hoje em: ${esc(ENC[o][1])} (muda para cá)</u>` : ''}</button>`; }).join('')
      : `<p class="cs-vazio">Você ainda não tem peças para ${tipo === 'parede' ? 'a parede' : 'o chão'}.</p>`;
    const faltam = Object.keys(DECOR).filter(k => !d.acervo[k] && (!DECOR[k].patrono || DECOR[k].patrono === (P.pers && P.pers.ordem)));
    const tem = Object.keys(DECOR).filter(k => d.acervo[k]).length;
    const porGrupo = ORDEM_GRUPO.map(gp => { const ks = faltam.filter(k => DECOR[k].grupo === gp); return ks.length ? `<li><b>${gp}:</b> ${ks.map(k => `${esc(DECOR[k].nome)} <small>(${esc(fonteTxt(DECOR[k]))})</small>`).join(' · ')}</li>` : ''; }).join('');
    return `<div class="inv-top"><h2>Casa do Peregrino</h2><button type="button" class="btn ghost" data-acao="fechar">Fechar</button></div>
      <p class="sub">A mesma casa espera você em cada região. Escolha um encaixe e a peça que vai nele. As peças são só para enfeitar, por enquanto.</p>
      <div class="cs-cols"><div class="cs-encs">${lista}</div>
      <div class="cs-pecas"><h3>${esc(e[1])} <small>${esc(e[2])} · ${tipo === 'parede' ? 'parede' : 'chão'}</small></h3>${pecas}${atual ? '<button type="button" class="cs-tirar" data-casa-tirar="1">Deixar este encaixe vazio</button>' : ''}</div></div>
      <h3>Acervo <small>${tem} de ${tem + faltam.length} peças</small></h3>${faltam.length ? `<ul class="cs-faltam">${porGrupo}</ul>` : '<p class="cs-vazio">Você reuniu todas as peças. Deus seja louvado!</p>'}
      <p class="foot">Pressione I ou Esc para fechar.</p>`;
  };
  document.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('#inv [data-casa-enc], #inv [data-casa-peca], #inv [data-casa-tirar]'); if (!t) return;
    const d = dados(); if (!d) return;
    if (t.dataset.casaEnc) encSel = t.dataset.casaEnc;
    else if (t.dataset.casaPeca) {
      const k = t.dataset.casaPeca;
      for (const s in d.slots) if (d.slots[s] === k) delete d.slots[s];
      d.slots[encSel] = k; if (A.bell) A.bell(587, 0.08);
      montar(); if (OV.jogo) OV.jogo.salvar();
    } else if (t.dataset.casaTirar) { delete d.slots[encSel]; montar(); if (OV.jogo) OV.jogo.salvar(); }
    IT.refresh();
  });

  /* ================= A SANTEIRA DA VILA ================= */
  {
    const c = CS.casas[0], st = c.W(5.6, 8.6), mesa = c.W(4.2, 8.1), r = c.rot;
    const g = M.grupo(mesa.x, mesa.z, r);
    g.add(BOX(1.9, 0.08, 0.8, MAT.woodL, 0, 0.82, 0)); [[-0.85, -0.32], [0.85, -0.32], [-0.85, 0.32], [0.85, 0.32]].forEach(([a, b]) => g.add(BOX(0.08, 0.82, 0.08, MAT.wood, a, 0.41, b)));
    g.add(BOX(1.9, 0.5, 0.04, pano(0x7a140d), 0, 0.6, 0.4));
    [-0.6, 0, 0.6].forEach((a, i) => { const q = quadro(pintura(['antao', 'pantocrator', 'nicolau'][i], PINT[['antao', 'pantocrator', 'nicolau'][i]]), 0.3, 0.42); q.position.set(a, 1.1, -0.2); q.rotation.x = -0.25; g.add(q); });
    [[-2.1, 0], [2.1, 0]].forEach(([a, b]) => { g.add(BOX(0.1, 2.4, 0.1, MAT.wood, a * 0.5, 1.2, -0.5)); });
    g.add(BOX(2.3, 0.06, 1.4, pano(0xd8c8a0), 0, 2.4, -0.1));
    M.obstacles.push({ x: mesa.x, z: mesa.z, r: 1.0 });
    if (OV.aventura && OV.aventura.npc) OV.aventura.npc('santeira', 'Dona Clotilde, a santeira', st.x, st.z, r, { cor: 0x3a2a4a, cabelo: 0x8a8278, veu: true });
    else M.criarFigura(st.x, st.z, r, { id: 'santeira', nome: 'Dona Clotilde, a santeira' });
  }
  const aVenda = () => {
    const ks = Object.keys(DECOR).filter(k => DECOR[k].fonte === 'loja' && (!DECOR[k].patrono || DECOR[k].patrono === (P.pers && P.pers.ordem)));
    return ks.sort((a, b) => (DECOR[a].patrono ? 0 : 1) - (DECOR[b].patrono ? 0 : 1));
  };
  function comprar(k) {
    const it = DECOR[k]; if (!it || CS.tem(k) || den() < it.preco) return;
    P.pers.denarios = den() - it.preco; CS.ganhar(k, true);
    ui.toast(`Você comprou: ${it.nome}. Ela já está na Casa do Peregrino, esperando um encaixe.`);
    if (A.bell) A.bell(659, 0.12);
    if (OV.jogo) OV.jogo.salvar();
  }
  if (MS && MS.ARV) MS.ARV.santeira = function () {
    const q = 'Dona Clotilde, a santeira';
    const opc = aVenda().filter(k => !CS.tem(k)).map(k => ({ t: `${DECOR[k].nome} — ${DECOR[k].preco} denários`, cond: () => den() >= DECOR[k].preco, motivo: () => `você tem ${den()}`, ef: () => comprar(k), ir: 'b' }));
    opc.push({ t: 'O que é a Casa do Peregrino?', ir: 'c' }, { t: 'Só estou olhando.' });
    return { inicio: 'a', nos: {
      a: { quem: q, txt: () => aVenda().every(k => CS.tem(k)) ? 'Você já levou tudo o que eu tinha. Volte daqui a uns meses: as minhas mãos ainda trabalham.' : 'Imagens, cruzes, velas e um ou outro móvel. Tudo benzido pelo Padre Tomé. O que leva para a sua casa?', opc },
      b: { quem: q, txt: 'Que ela lhe lembre, cada vez que você entrar em casa, de quem cuida de nós lá do céu.', prox: 'a' },
      c: { quem: q, txt: 'A casa aqui do lado. O Padre Tomé a guarda para os peregrinos que lutam pelo vale. Dizem que há uma igual em cada terra por onde você passar, com o mesmo baú e as mesmas imagens. Mistérios de Deus, e dos marceneiros.', prox: 'a' }
    } };
  };

  /* ================= OS FERREIROS TAMBÉM FAZEM PEÇAS ================= */
  if (OV.oficio && OV.oficio.FERREIROS) {
    const FR = OV.oficio.FERREIROS;
    Object.keys(DECOR).forEach(k => { const it = DECOR[k]; if (it.fonte !== 'ferreiro' || !FR[it.ferreiro]) return; FR[it.ferreiro].receitas.push({ decor: k, den: it.den, mats: it.mats }); });
  }

  /* ---- ao começar ou continuar ---- */
  CS.preparar = function () { dados(); CS.casas.forEach(c => { for (const id in c.encaixes) c.encaixes[id].peca = undefined; }); montar(); };
  { const prep0 = IT.preparar; IT.preparar = function () { prep0.call(IT); CS.preparar(); }; }
})(window.OV);

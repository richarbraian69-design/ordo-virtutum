/* Ordo Virtutum — o que há para fazer longe das vilas, em cada uma das quatro terras:
   personagens novos com missões, coletas, baús, uma masmorra com guardião, uma guilda ou confraria
   com três contratos, e os bichos novos pelos caminhos. Também dá às missões antigas a carga nas mãos
   e a entrega animada (o carvão vai para a forja de Lia, a farinha para a panela de Lúcia...). */
(function (OV) {
  'use strict';
  const M = OV.mundo, MS = OV.missoes, AV = OV.aventura; if (!M || M.falhou || !MS || !AV) return;
  const P = OV.P, ui = OV.ui, A = OV.audio, D = OV.dialogo, IT = OV.itens, I = OV.inimigos;
  const H = M.altura, sm = OV.sm, mesh = OV.mesh, MAT = M.MAT, scene = M.scene;
  const L = M.AVENTURA.LUGARES, BAUS = M.AVENTURA.BAUS, ACH = M.AVENTURA.ACHADOS;
  const prog = () => OV.jogo && OV.jogo.prog;
  const F = () => (prog() && prog().flags) || {};
  const g = (m, f) => MS.g ? MS.g(m, f) : m;
  const fig = id => M.figuras[id];
  const ondeFig = id => () => { const f = fig(id); return f ? { x: f.x, z: f.z } : null; };
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const B = AV.B, grupo = AV.grupo;
  const fundir = gr => { if (OV.cenario) OV.cenario.fundir(gr); };
  const obst = (x, z, r) => M.obstacles.push({ x, z, r });
  const virar = (x, z, a) => Math.atan2(a.x - x, a.z - z);
  const madeira = MAT.woodL, escura = MAT.wood;
  const visuais = []; // funções que acertam o mundo com o progresso (fogo aceso, rede no varal...)
  const acertar = () => visuais.forEach(fn => { try { fn(); } catch (e) { /* segue */ } });

  /* ================= PEÇAS DO CENÁRIO ================= */
  function caldeirao(x, z, aceso) {
    const y = H(x, z);
    scene.add(mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.6, 10), MAT.iron, x, y + 0.55, z));
    scene.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 10), sm(0x6a7a3a, { roughness: 0.3 }), x, y + 0.84, z));
    [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; scene.add(mesh(new THREE.BoxGeometry(0.07, 0.6, 0.07), MAT.iron, x + Math.cos(a) * 0.45, y + 0.3, z + Math.sin(a) * 0.45)); });
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 6), MAT.flame); f.position.set(x, y + 0.2, z); scene.add(f); M.flames.push(f);
    const luz = M.emissor(x, y + 1, z, aceso ? 1.2 : 0, 8, 0xff8a3a); f.visible = !!aceso;
    obst(x, z, 0.7);
    return { x, y: y + 0.85, z, fogo: f, luz };
  }
  function fogueira(x, z) {
    const y = H(x, z);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; scene.add(mesh(new THREE.DodecahedronGeometry(0.22, 0), MAT.rock, x + Math.cos(a) * 0.6, y + 0.1, z + Math.sin(a) * 0.6)); }
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 6), MAT.flame); f.position.set(x, y + 0.3, z); scene.add(f); M.flames.push(f);
    M.emissor(x, y + 1, z, 1.3, 10, 0xff8a3a); obst(x, z, 0.8);
  }
  // cerca de pau-a-pique com uma porteira no lado +z local
  function curral(x, z, rot, hw, hd) {
    const gr = grupo(x, z, rot), cs = Math.cos(rot), sn = Math.sin(rot);
    const W = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
    const lado = (x0, z0, x1, z1, vao) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 1.5);
      for (let i = 0; i <= n; i++) { const t = i / n, lx = x0 + (x1 - x0) * t, lz = z0 + (z1 - z0) * t; if (vao && Math.abs(lx) < vao) continue; gr.add(mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), escura, lx, 0.55, lz)); }
      const hz = Math.abs(x1 - x0) > Math.abs(z1 - z0);
      const segs = vao ? [[x0, -vao], [vao, x1]] : [[hz ? x0 : z0, hz ? x1 : z1]];
      segs.forEach(([a, b]) => {
        const c = (a + b) / 2, l = Math.abs(b - a);
        [0.45, 0.85].forEach(h => gr.add(hz ? mesh(new THREE.BoxGeometry(l, 0.08, 0.06), madeira, c, h, z0) : mesh(new THREE.BoxGeometry(0.06, 0.08, l), madeira, x0, h, c)));
        const w = hz ? W(c, z0) : W(x0, c); M.caixa(w.x, w.z, hz ? l / 2 : 0.1, hz ? 0.1 : l / 2, rot);
      });
    };
    lado(-hw, -hd, hw, -hd); lado(-hw, -hd, -hw, hd); lado(hw, -hd, hw, hd); lado(-hw, hd, hw, hd, 1.2);
    const feno = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.7, 10), sm(0xc8a858), hw - 1, 0.35, -hd + 1); feno.rotation.z = Math.PI / 2; gr.add(feno);
    fundir(gr);
    return W;
  }
  function placa(x, z, rot, txt) { // uma tabuleta de madeira (só enfeite)
    const gr = grupo(x, z, rot);
    gr.add(mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), escura, 0, 0.7, 0)); gr.add(mesh(new THREE.BoxGeometry(1.0, 0.45, 0.06), madeira, 0, 1.3, 0.05));
    fundir(gr); return gr;
  }
  function carvoeira(x, z) { // o forno de carvão, um monte de terra com respiros
    const y = H(x, z), gr = grupo(x, z, 0);
    const m = mesh(new THREE.SphereGeometry(2.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), sm(0x3a2e24, { roughness: 1 }), 0, 0, 0); m.scale.y = 0.8; gr.add(m);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; gr.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), sm(0x0a0806), Math.cos(a) * 2.0, 0.35, Math.sin(a) * 2.0)); }
    gr.add(mesh(new THREE.BoxGeometry(0.8, 0.7, 0.4), sm(0x0a0806), 0, 0.35, 2.1));
    fundir(gr); obst(x, z, 2.4);
    const fogo = []; for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 5), MAT.flame); f.position.set(x - 0.25 + i * 0.25, y + 0.3, z + 2.25); scene.add(f); M.flames.push(f); fogo.push(f); }
    const luz = M.emissor(x, y + 0.8, z + 2.6, 0, 9, 0xff6a2a);
    // a fumaça sobe quando o forno arde
    const fumo = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), new THREE.MeshBasicMaterial({ color: 0x9a948c, transparent: true, opacity: 0, depthWrite: false })); s.userData.d = i / 6; scene.add(s); fumo.push(s); }
    let aceso = false;
    M.animados.push(dt => { if (!aceso) return; const t = performance.now() / 1000; fumo.forEach(s => { const q = (t * 0.18 + s.userData.d) % 1; s.position.set(x + Math.sin(q * 5 + s.userData.d * 9) * 0.6, y + 1.9 + q * 6, z + q * 1.2); s.scale.setScalar(0.7 + q * 2.2); s.material.opacity = 0.32 * Math.sin(q * Math.PI); }); });
    return { x, y: y + 0.55, z: z + 2.2, acender: b => { aceso = b; fogo.forEach(f => f.visible = b); luz.int = b ? 1.6 : 0; fumo.forEach(s => s.visible = b); } };
  }
  function lenhaPilha(x, z, rot) {
    const gr = grupo(x, z, rot);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) { const t = mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.6, 7), i % 2 ? madeira : escura, (i - (3 - r) / 2) * 0.34, 0.18 + r * 0.3, 0); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2; gr.add(t); }
    fundir(gr); obst(x, z, 1.0);
  }
  function varal(x, z, rot) { // dois postes e uma vara, para secar redes
    const gr = grupo(x, z, rot);
    [-1.3, 1.3].forEach(s => gr.add(mesh(new THREE.BoxGeometry(0.14, 2.1, 0.14), escura, s, 1.05, 0)));
    { const v = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 6), madeira, 0, 2.0, 0); v.rotation.z = Math.PI / 2; gr.add(v); }
    fundir(gr);
    const rede = new THREE.Group(); rede.position.set(x, H(x, z), z); rede.rotation.y = rot; scene.add(rede);
    const pano = mesh(new THREE.PlaneGeometry(2.4, 1.3, 8, 4), sm(0x8a7a5a, { wireframe: true, side: THREE.DoubleSide }), 0, 1.35, 0.02); rede.add(pano);
    for (let i = 0; i < 5; i++) { const b = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), sm(0xd8c87a), -1 + i * 0.5, 0.75, 0.04); b.rotation.x = Math.PI / 2; rede.add(b); }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    [-1.3, 1.3].forEach(s => obst(x + s * cs, z - s * sn, 0.3));
    return { x, y: H(x, z) + 1.5, z, rede };
  }
  function gancho(x, z, rot) { // poste com braço, para pendurar a gaiola do canário
    const gr = grupo(x, z, rot);
    gr.add(mesh(new THREE.BoxGeometry(0.18, 2.6, 0.18), escura, 0, 1.3, 0)); gr.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 1.0), escura, 0, 2.5, 0.45));
    gr.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 3), MAT.iron, 0, 2.32, 0.9));
    fundir(gr); obst(x, z, 0.3);
    const cs = Math.cos(rot), sn = Math.sin(rot), px = x + 0.9 * sn, pz = z + 0.9 * cs;
    const gaiola = AV.PROPS.gaiola(); gaiola.position.set(px, H(x, z) + 2.0, pz); scene.add(gaiola);
    return { x: px, y: H(x, z) + 2.0, z: pz, gaiola };
  }
  function nicho(x, z, rot) { // nicho de pedra com a imagem de Santa Bárbara (a torre ao lado)
    const gr = grupo(x, z, rot);
    gr.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 0.9), MAT.rock, 0, 0.45, 0)); gr.add(mesh(new THREE.BoxGeometry(1.5, 1.7, 0.25), MAT.rock, 0, 1.75, -0.35));
    { const t = mesh(new THREE.ConeGeometry(0.95, 0.6, 4), MAT.rock, 0, 2.9, -0.2); t.rotation.y = Math.PI / 4; gr.add(t); }
    gr.add(mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), sm(0xc8b89a), 0.42, 1.15, -0.1));
    gr.add(mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), MAT.gold, -0.35, 1.3, 0.1)); gr.add(mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), MAT.gold, -0.35, 1.5, 0.1));
    fundir(gr); obst(x, z, 0.9);
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const imagem = AV.PROPS.reliquia(); imagem.position.set(x + 0.1 * sn, H(x, z) + 1.05, z + 0.1 * cs); scene.add(imagem);
    return { x: x + 0.1 * sn, y: H(x, z) + 1.05, z: z + 0.1 * cs, imagem };
  }
  function altarzinho(x, z, rot) { // um altar ao ar livre, com cruz e jarro
    const gr = grupo(x, z, rot);
    gr.add(mesh(new THREE.BoxGeometry(1.8, 1.0, 0.8), sm(0xd8d2c4, { roughness: 0.6 }), 0, 0.5, 0)); gr.add(mesh(new THREE.BoxGeometry(1.9, 0.06, 0.85), sm(0xf0ead8), 0, 1.03, 0));
    gr.add(mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), MAT.gold, 0, 1.5, -0.25)); gr.add(mesh(new THREE.BoxGeometry(0.45, 0.08, 0.08), MAT.gold, 0, 1.7, -0.25));
    gr.add(mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.3, 8), sm(0x8a6a4a), 0.6, 1.2, 0));
    fundir(gr); obst(x, z, 1.0);
    const cs = Math.cos(rot), sn = Math.sin(rot), vx = x + 0.6 * cs, vz = z - 0.6 * sn;
    const flores = new THREE.Group(); flores.position.set(vx, H(x, z) + 1.25, vz); scene.add(flores);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; flores.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 3), sm(0x4a7a3a), Math.cos(a) * 0.05, 0.25, Math.sin(a) * 0.05)); const fl = mesh(new THREE.ConeGeometry(0.08, 0.16, 6, 1, true), sm(0xfafaf0, { side: THREE.DoubleSide }), Math.cos(a) * 0.1, 0.52, Math.sin(a) * 0.1); fl.rotation.x = Math.PI; flores.add(fl); }
    return { x: vx, y: H(x, z) + 1.3, z: vz, flores };
  }
  function tenda(x, z, rot, cor) {
    const t = mesh(new THREE.ConeGeometry(2.0, 2.8, 6), sm(cor || 0xd8ccb0, { roughness: 1 }), x, H(x, z) + 1.4, z); t.rotation.y = rot; t.castShadow = true; scene.add(t);
    scene.add(mesh(new THREE.BoxGeometry(0.06, 3.3, 0.06), escura, x, H(x, z) + 1.65, z)); obst(x, z, 1.8);
  }
  function fonte(x, z) {
    const y = H(x, z), gr = grupo(x, z, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; const p = mesh(new THREE.BoxGeometry(0.75, 0.6, 0.35), MAT.rock, Math.cos(a) * 1.25, 0.3, Math.sin(a) * 1.25); p.rotation.y = -a; gr.add(p); }
    gr.add(mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), MAT.rock, 0, 0.8, -1.1)); gr.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), MAT.iron, 0, 1.25, -0.8));
    fundir(gr);
    scene.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.04, 16), sm(0x4a7aa8, { roughness: 0.15, metalness: 0.2 }), x, y + 0.5, z));
    const fio = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 4), new THREE.MeshBasicMaterial({ color: 0xa8d0f0, transparent: true, opacity: 0.6 }), x, y + 0.88, z - 0.62); scene.add(fio);
    obst(x, z, 1.5);
  }
  const casinha = (x, z, rot, w, d, h) => M.casa(x, z, rot, w, d, h, { luz: true, rh: 1.8 });

  /* ================= PEQUENAS AJUDAS DAS MISSÕES ================= */
  // o ponto ainda não colhido mais perto (ou o destino, se a coisa já está nas mãos)
  const proximo = cfg => () => {
    const mao = F()[cfg.id + '_mao'];
    if (cfg.um && mao !== undefined && mao !== null) return { x: cfg.destino.x, z: cfg.destino.z };
    const l = AV.colhidos(cfg); let b = null, bd = 1e9;
    cfg.pontos.forEach(([x, z], i) => { if (l.includes(i) || mao === i) return; const d = Math.hypot(x - P.pos.x, z - P.pos.z); if (d < bd) { bd = d; b = { x, z }; } });
    return b;
  };
  const conta = cfg => () => `${AV.colhidos(cfg).length}/${cfg.pontos.length}`;
  const entradaDe = id => () => { const m = AV.masmorras.find(x => x.id === id); return m ? m.W(0, m.HD + 3) : null; };
  // quando a masmorra é purificada, a missão dela avança (ou já começa adiantada)
  const ligarMasmorra = (qid, mid) => MS.ganchos.evento.push((tipo, x) => { if (tipo === 'masmorra' && x && x.id === mid && MS.ativa(qid) && MS.etapa(qid) === 0) { MS.avancar(qid, 1); setTimeout(() => ui.toast(`${MS.MIS[qid].nome}: volte para contar o que houve.`), 2600); } return false; });
  const jaFeita = (qid, mid) => () => { if (AV.masmorraFeita(mid)) MS.avancar(qid, 1); };
  const casaDe = id => {
    const f = fig(id); if (!f) return null;
    return M.interiores.find(c => { const dx = f.x0 - c.x, dz = f.z0 - c.z, lx = dx * c.cs - dz * c.sn, lz = dx * c.sn + dz * c.cs; return Math.abs(lx) < c.hw + 0.4 && Math.abs(lz) < c.hd + 0.4; });
  };
  const naCasa = (id, lx, lz, dy) => () => { const c = casaDe(id); if (!c) { const f = fig(id); return f ? { x: f.x, y: H(f.x, f.z) + 1, z: f.z } : null; } const p = c.W(lx, lz); return { x: p.x, y: H(c.x, c.z) + 0.2 + dy, z: p.z }; };
  const casaNome = (nome, lx, lz, dy) => () => { const c = M.interiores.find(k => k.nome === nome); if (!c) return null; const p = c.W(lx, lz); return { x: p.x, y: H(c.x, c.z) + 0.2 + dy, z: p.z }; };
  const den = (a, b) => [a, b];

  /* ===================================================================
     VALE DE SANTA SABINA (Ato I)
     =================================================================== */
  // ---- Clotilde, a ervanária, e a sálvia dos prados
  casinha(157.5, 41, -Math.PI / 2, 5, 4.4, 2.6);
  const caldClotilde = caldeirao(150.5, 41.5, true);
  AV.npc('clotilde', 'Clotilde, a ervanária', L.clotilde.x, L.clotilde.z, -Math.PI / 2 - 0.4, { cor: 0x5a6a3a, veu: 0x8a8a6a });
  const colSalvia = { id: 'v_salvia', missao: 'v_ervas', etapa: 0, pontos: ACH.salvia, modelo: 'erva', nome: 'Sálvia', texto: 'Colher a sálvia', carga: 'cesto',
    guarda: [[['diabrete', 4]], null, [['larva', 4], ['larva', 4]], [['murmurador', 5]]] };
  AV.coleta(colSalvia);
  AV.missao({ id: 'v_ervas', ato: 1, nome: 'As Ervas de Clotilde', npc: 'clotilde', xp: 90, den: 15, itens: [['agua', 2]],
    etapas: [() => `Colha a sálvia que cresce nos prados a leste, perto do rio (${conta(colSalvia)()}).`, 'Leve o cesto de sálvia a Clotilde, a ervanária.'],
    alvos: [proximo(colSalvia), ondeFig('clotilde')],
    convite: 'A febre do tédio deixou a vila de cama. Com sálvia eu faço um caldo que levanta qualquer um... mas os vícios rondam os prados onde ela cresce, e as minhas pernas já não são as mesmas.',
    aceitar: 'Eu colho a sálvia para a senhora.', aceito: 'Quatro ramos, dos prados a leste, entre o rio e o rochedo. Que São Rafael guie as suas mãos.',
    lembrete: () => `Ainda faltam ramos de sálvia (${conta(colSalvia)()}). Crescem nos prados a leste, perto do rio.`,
    agradece: 'Que cheiro bom! Venha, vou pôr no caldeirão agora mesmo.',
    entrega: { acao: 'panela', prop: 'cesto', alvo: () => caldClotilde, falas: [['Clotilde, a ervanária', 'Pronto: o caldo está fervendo. Amanhã cedo levo uma tigela a cada casa da vila. Leve esta água benta, que você vai precisar mais do que eu.']] },
    depois: 'O caldo de sálvia já correu a vila inteira. Até o moleiro voltou a assobiar.' });

  // ---- Gervásio, o carvoeiro, e o forno apagado
  const forno = carvoeira(40, -153);
  lenhaPilha(47, -146, 0.4);
  AV.npc('gervasio', 'Gervásio, o carvoeiro', 35, -147, Math.PI * 0.75, { cor: 0x2a2420, cabelo: 0x1a1410 });
  AV.missao({ id: 'v_carvoaria', ato: 1, nome: 'A Carvoaria Apagada', npc: 'gervasio', xp: 110, den: 25, itens: [['pao', 2]],
    etapas: [() => `Expulse os Murmuradores que rondam a carvoaria de Gervásio (${4 - I.porTag('carvoaria').filter(vivo).length}/4).`, 'Pegue um feixe de lenha seca na pilha ao lado do forno.', 'Leve a lenha a Gervásio, para acender o forno.'],
    alvos: [() => ({ x: 40, z: -150 }), () => ({ x: 47, z: -146 }), ondeFig('gervasio')],
    convite: 'Escuta? São eles. Uns vultos que cochicham dia e noite em volta do meu forno: "pra que trabalhar, ninguém compra carvão, ninguém agradece". Até que eu acreditei, e deixei o fogo morrer.',
    aceitar: 'Eu calo esses murmuradores.', aceito: 'São quatro. Cuidado: eles não mordem, mas a voz deles cansa a alma.',
    aoAceitar: () => MS.respawnQuest(),
    lembrete: () => MS.etapa('v_carvoaria') === 0 ? 'Ainda ouço os cochichos em volta do forno...' : 'A pilha de lenha seca fica ali, ao lado do forno. Traga um feixe.',
    agradece: 'Lenha seca, e silêncio! Olhe só: o fogo vai pegar na primeira faísca.',
    entrega: { acao: 'forja', prop: 'lenha', alvo: () => forno, falas: [['Gervásio, o carvoeiro', 'Está ardendo! Daqui a três dias tem carvão para a forja de Lia e para todo o vale. O trabalho bem feito é uma oração, dizia o meu pai.']] },
    aoConcluir: () => acertar() });
  visuais.push(() => forno.acender(MS.feita('v_carvoaria')));
  M.interativo(47, -144.4, 2.2, () => MS.ativa('v_carvoaria') && MS.etapa('v_carvoaria') === 1 ? 'Pegar um feixe de lenha seca' : null, () => { MS.avancar('v_carvoaria', 2); ui.toast('Você amarra um bom feixe de lenha seca.'); A.bell(392, 0.06); });
  AV.carga('lenha', () => MS.ativa('v_carvoaria') && MS.etapa('v_carvoaria') === 2, 'v_carvoaria');
  MS.ganchos.spawn.push(() => {
    MS.tagRemove('carvoaria');
    if (MS.ativa('v_carvoaria') && MS.etapa('v_carvoaria') === 0) [[34, -158], [46, -160], [32, -142], [50, -150]].forEach(([x, z]) => { const e = I.spawn('murmurador', false, { x, z }, { nivel: 4 }); e.tag = 'carvoaria'; e.mundo = false; });
  });
  MS.ganchos.evento.push((tipo, x) => {
    if (tipo === 'vencido' && x && x.tag === 'carvoaria' && MS.ativa('v_carvoaria') && MS.etapa('v_carvoaria') === 0 && !I.porTag('carvoaria').some(vivo)) { MS.avancar('v_carvoaria', 1); ui.toast('O silêncio volta à carvoaria. Pegue lenha seca na pilha.'); }
    return false;
  });
  // ---- e o carvão de Gervásio para a lareira da Viúva Marta
  AV.missao({ id: 'v_lenha', ato: 1, nome: 'O Inverno da Viúva Marta', npc: 'gervasio', receptor: 'marta', xp: 70, den: 0, itens: [['vela', 2]],
    requer: () => MS.feita('v_carvoaria'),
    etapas: ['Leve o saco de carvão de Gervásio à Viúva Marta, na casa dela na praça da vila.'],
    alvos: [ondeFig('marta')],
    convite: 'O primeiro saco de carvão não vou vender. A Viúva Marta, lá na vila, passa frio desde que o marido morreu, e nem acende mais a lareira. Leva para ela?',
    aceitar: 'Levo, sim.', aceito: 'Deus lhe pague. Diga que é presente, senão ela não aceita.',
    lembrete: 'A casa da Viúva Marta fica na praça da vila. Diga que é presente.',
    agradece: 'Carvão? Para mim? ...Um presente do Gervásio. Faz tanto tempo que ninguém se lembra desta casa.',
    entrega: { acao: 'lareira', prop: 'carvao', alvo: casaNome('Casa da Viúva Marta', 0, -3.1, 0.45), falas: [['Viúva Marta', 'Olhe como pega! A casa ficou quente de novo... Tome estas velas, eram do meu marido. Reze por ele, quando acender.']] },
    depois: 'Acendo a lareira toda noite, e rezo. A casa não parece mais tão vazia.' });
  AV.carga('carvao', () => MS.ativa('v_lenha'), 'v_lenha');

  // ---- Benedita, a pastora, e os cordeiros perdidos
  const curralW = curral(-161, -36, 0, 4, 3);
  AV.npc('benedita', 'Benedita, a pastora', -154.5, -28.5, -2.4, { cor: 0x6a5a4a, veu: 0xd8ccb0 });
  const cordeirosNoCurral = [[-1.8, -0.6], [1.2, -1.2], [0, 0.6]].map(([lx, lz], i) => { const p = curralW(lx, lz), c = AV.PROPS.cordeiro(); c.position.set(p.x, H(p.x, p.z) + 0.45, p.z); c.rotation.y = i * 2.1; scene.add(c); return c; });
  const colCord = { id: 'v_cord', missao: 'v_cordeiros', etapa: 0, pontos: ACH.cordeiros, modelo: 'cordeiro', nome: 'Cordeiro no curral', texto: 'Pegar o cordeiro no colo', carga: 'cordeiro', um: true,
    pegou: 'O cordeiro treme, mas se aninha nos seus braços.',
    guarda: [[['lobo_cinza', 4], ['lobo_cinza', 4]], [['diabrete', 4], ['diabrete', 5]], [['lobo_cinza', 5, 'forte']]],
    destino: { x: curralW(0, 4.6).x, z: curralW(0, 4.6).z, texto: 'Pôr o cordeiro no curral', acao: 'curral', alvo: () => { const p = curralW(0, -0.4); return { x: p.x, y: H(p.x, p.z) + 0.5, z: p.z }; }, aoDeixar: () => acertar() } };
  AV.coleta(colCord);
  visuais.push(() => { const n = MS.feita('v_cordeiros') ? 3 : AV.colhidos(colCord).length; cordeirosNoCurral.forEach((c, i) => c.visible = i < n); });
  AV.missao({ id: 'v_cordeiros', ato: 1, nome: 'Os Cordeiros de Benedita', npc: 'benedita', xp: 100, den: 20, itens: [['pao', 2]],
    etapas: [() => `Encontre os três cordeiros perdidos e leve-os, um de cada vez, ao curral de Benedita (${conta(colCord)()}).`, 'Fale com Benedita, a pastora.'],
    alvos: [proximo(colCord), ondeFig('benedita')],
    convite: () => `Três cordeiros fugiram na noite em que os lobos uivaram, e eu fiquei tão desanimada que nem fui atrás. Um bom pastor deixa as noventa e nove e vai buscar a que se perdeu... e eu nem isso. Me ajuda, ${g('irmão', 'irmã')}?`,
    aceitar: 'Vamos buscar os cordeiros.', aceito: 'Um balia perto das ruínas do norte, outro na clareira do noroeste, o terceiro no pasto do oeste. Traga um de cada vez no colo, que eles se assustam.',
    lembrete: () => `Ainda faltam cordeiros (${conta(colCord)()}). Traga-os um de cada vez, no colo, até o curral.`,
    agradece: 'Os três! Estão aqui, todos! Como no Evangelho: há mais alegria por um que volta do que por noventa e nove que nunca se perderam.',
    depois: 'Agora vou com eles ao pasto todos os dias. E, quando um se afasta, vou atrás.', aoConcluir: () => acertar() });

  // ---- Simão, o eremita, e o Priorado Esquecido
  fogueira(-63, -85);
  AV.npc('simao', 'Simão, o eremita', L.simao.x, L.simao.z, Math.PI * 0.85, { cor: 0x4a3a2a, capuz: true, cabelo: 0xb8b0a0 });
  AV.masmorra({ id: 'priorado', nome: 'Ruínas do Priorado Esquecido', x: L.priorado.x, z: L.priorado.z, rot: L.priorado.rot, regiao: 'vale', estilo: 'ruina', tema: 'cripta',
    salasDef: [{ inimigos: [['diabrete', 5], ['diabrete', 5], ['larva', 5, 'forte'], ['murmurador', 5]] }, { inimigos: [['murmurador', 6], ['murmurador', 6], ['diabrete', 6, 'forte'], ['lobo_cinza', 6]] }, { chefe: ['gargula', 8], inimigos: [['diabrete', 6], ['diabrete', 6]] }],
    tesouro: { den: [50, 80], itens: [['agua', 2], ['vela', 2]], equip: true, raro: 0.6 } });
  AV.missao({ id: 'v_priorado', ato: 1, nome: 'O Priorado Esquecido', npc: 'simao', xp: 220, den: 40, itens: [['agua', 1]],
    etapas: [() => `Purifique as Ruínas do Priorado Esquecido, ao norte do eremitério de Simão (salas: ${AV.salasLivres('priorado')}/3).`, 'Leve a Regra do Priorado a Simão, o eremita.'],
    alvos: [entradaDe('priorado'), ondeFig('simao')],
    convite: 'Ali atrás, entre as árvores, rezavam os monges do priorado. Um dia pararam de rezar, um a um, por cansaço. Hoje uma gárgula de pedra guarda o altar e ninguém mais entra. Lá dentro está a Regra que eles seguiam.',
    aceitar: 'Eu entro no priorado.', aceito: () => `Três salas, e grades entre elas. A última grade só se abre quando a sala de antes fica em paz. Leve luz no coração, ${g('filho', 'filha')}.`,
    aoAceitar: jaFeita('v_priorado', 'priorado'),
    lembrete: () => `O priorado ainda geme lá atrás (salas: ${AV.salasLivres('priorado')}/3).`,
    agradece: 'A Regra! Deixe-me ver... "Ora et labora: reza e trabalha, e o dia não pesa." Era só isso que eles tinham esquecido.',
    entrega: { acao: 'ler', prop: 'carta', falas: [['Simão, o eremita', 'Vou copiá-la à mão, devagar, e levar uma cópia ao mosteiro. Que nunca mais se esqueça. Deus lhe pague pelo que fez lá dentro.']] },
    depois: 'Copio a Regra uma linha por dia. É trabalho, e é oração.' });
  ligarMasmorra('v_priorado', 'priorado');
  AV.carga('carta', () => MS.ativa('v_priorado') && MS.etapa('v_priorado') === 1, 'v_priorado');

  // ---- Confraria dos Peregrinos de São Roque
  AV.npc('tadeu', 'Irmão Tadeu, o confrade', 29.8, 124.6, -Math.PI / 2, { cor: 0x5a4a32, capuz: true });
  AV.guilda({ id: 'roque', nome: 'Confraria dos Peregrinos de São Roque', curto: 'Confraria de São Roque', regiao: 'vale', ato: 1, mestre: 'tadeu', ondeMestre: 'junto ao quadro da confraria, a leste da vila',
    quadro: { x: 29.6, z: 128.8, rot: -Math.PI / 2 }, cor: 0x7a2a14, titulos: ['Peregrino Iniciado', 'Peregrino Provado', 'Mestre Peregrino'],
    convite: () => `A Confraria dos Peregrinos de São Roque cuida das estradas: quem caminha precisa de estrada limpa. Temos contratos no quadro, e pagamos bem. Quer o primeiro, ${g('irmão', 'irmã')}? Vença dez vícios aqui no vale.`,
    contratos: [
      { nome: 'Estradas limpas', tipo: 'vencer', n: 10, txt: 'Vença ou liberte dez vícios no Vale de Santa Sabina', xp: 90, den: 35, fala: 'Dez! As estradas do vale já respiram. O seu nome está no livro: agora é Peregrino Iniciado.' },
      { nome: 'Os tesouros esquecidos', tipo: 'baus', n: 3, txt: 'Encontre e abra três baús esquecidos pelo vale', xp: 110, den: 30, itens: [['vela', 2]], fala: 'Três baús! Os peregrinos de antigamente escondiam provisões pelo caminho. Agora você é Peregrino Provado.' },
      { nome: 'O priorado', tipo: 'masmorra', masmorra: 'priorado', txt: 'Purifique as Ruínas do Priorado Esquecido', xp: 160, den: 60, itens: [['vieira', 1]], fala: 'O priorado está em paz! Tome a vieira de São Roque: quem a leva no peito caminha mais leve. Você é Mestre Peregrino.' }
    ] });

  /* ===================================================================
     PORTOS DO FESTIM (Ato II)
     =================================================================== */
  // ---- Irmã Dulce e a febre do cais
  tenda(101, 593, 0.3, 0xe0d8c8);
  const caldDulce = caldeirao(93, 592, true);
  AV.npc('dulce', 'Irmã Dulce, a enfermeira', L.dulce.x, L.dulce.z, Math.PI * 0.9, { cor: 0xe8e0d0, veu: 0x2a3a6a });
  const colCam = { id: 'p_cam', missao: 'p_febre', etapa: 0, pontos: ACH.camomila, modelo: 'flor', nome: 'Camomila', texto: 'Colher a camomila', carga: 'cesto',
    guarda: [[['corvo', 8]], [['larva_gula', 8], ['larva_gula', 8]], [['caranguejo', 9]]] };
  AV.coleta(colCam);
  AV.missao({ id: 'p_febre', ato: 2, nome: 'A Febre do Cais', npc: 'dulce', xp: 140, den: 30, itens: [['agua', 2]],
    etapas: [() => `Colha camomila nas dunas a oeste do porto (${conta(colCam)()}).`, 'Leve a camomila à Irmã Dulce, na tenda da enfermaria.'],
    alvos: [proximo(colCam), ondeFig('dulce')],
    convite: 'Os estivadores comem até passar mal, e depois ardem em febre. A gula cobra caro do corpo. Um chá de camomila acalma o estômago e a febre, mas a camomila cresce nas dunas do oeste, e lá os corvos não deixam ninguém passar.',
    aceitar: 'Eu trago a camomila.', aceito: 'Três tufos bastam. E coma alguma coisa antes: quem cuida dos outros também precisa de pão.',
    lembrete: () => `Ainda falta camomila (${conta(colCam)()}). Cresce nas dunas a oeste.`,
    agradece: 'Que perfume! Vou pôr a água para ferver agora mesmo.',
    entrega: { acao: 'panela', prop: 'cesto', alvo: () => caldDulce, falas: [['Irmã Dulce, a enfermeira', 'Uma xícara para cada doente, e uma oração para cada um. Deus cura, e nós só ajudamos. Fique com esta água benta.']] },
    depois: 'Os estivadores já estão de pé. Alguns até vieram ajudar na tenda.' });

  // ---- Bento, o pescador, e a rede levada pela maré
  const varalBento = varal(-57.5, 738, 0.15);
  AV.npc('bento', 'Bento, o pescador', L.bento.x - 1, L.bento.z - 2.5, Math.PI, { cor: 0x3a4a5a, cabelo: 0x3a2a1a });
  const colRede = { id: 'p_rede', missao: 'p_rede', etapa: 0, pontos: ACH.rede, modelo: 'rede', nome: 'Rede de Bento', texto: 'Recolher a rede de Bento', carga: 'rede',
    guarda: [[['caranguejo', 9], ['caranguejo', 9], ['caranguejo', 10, 'forte']]] };
  AV.coleta(colRede);
  AV.missao({ id: 'p_rede', ato: 2, nome: 'A Rede de Bento', npc: 'bento', xp: 120, den: 35, itens: [['pao', 3]],
    etapas: ['Recupere a rede de Bento, que a maré levou para as pedras a oeste da praia.', 'Leve a rede a Bento, junto ao varal da praia.'],
    alvos: [proximo(colRede), ondeFig('bento')],
    convite: 'A maré levou a minha rede para as pedras do oeste, e lá agora só tem caranguejo da gula, uns bichos do tamanho de um cão que comem tudo o que acham. Sem rede, não tem peixe. Sem peixe, o bairro passa fome.',
    aceitar: 'Eu busco a rede.', aceito: 'Na ponta oeste da praia, nas pedras. Cuidado com as pinças.',
    lembrete: 'A rede ficou nas pedras da ponta oeste da praia.',
    agradece: 'A minha rede! Rasgada só um pouquinho. Vou pendurar para secar, e amanhã remendo.',
    entrega: { acao: 'pendurar', prop: 'rede', alvo: () => varalBento, falas: [['Bento, o pescador', 'São Pedro também era pescador, sabia? Lançou a rede quando o Senhor mandou, e ela quase rasgou de tanto peixe. Leve estes pães, é o que eu tenho.']] },
    aoConcluir: () => acertar(), depois: 'A rede está remendada. Amanhã cedo, se Deus quiser, tem peixe para o bairro.' });
  visuais.push(() => { varalBento.rede.visible = MS.feita('p_rede'); });

  // ---- Velho Cosme e a Gruta dos Contrabandistas
  AV.npc('cosme', 'Velho Cosme', L.cosme.x, L.cosme.z, -Math.PI / 2 - 0.3, { cor: 0x4a4a4a, cabelo: 0xd8d0c0 });
  AV.masmorra({ id: 'gruta', nome: 'Gruta dos Contrabandistas', x: L.gruta.x, z: L.gruta.z, rot: L.gruta.rot, regiao: 'porto', estilo: 'rocha', tema: 'cripta',
    salasDef: [{ inimigos: [['caranguejo', 10], ['caranguejo', 10], ['larva_gula', 10], ['corvo', 10]] }, { inimigos: [['caranguejo', 11, 'forte'], ['corvo', 11], ['corvo', 11], ['larva_gula', 11, 'forte']] }, { chefe: ['polvo', 12], inimigos: [['caranguejo', 11], ['caranguejo', 11]] }],
    tesouro: { den: [90, 130], itens: [['agua', 2], ['pao', 2]], equip: true, raro: 0.6 } });
  AV.missao({ id: 'p_gruta', ato: 2, nome: 'A Gruta dos Contrabandistas', npc: 'cosme', xp: 260, den: 60, itens: [['vela', 2]],
    etapas: [() => `Purifique a Gruta dos Contrabandistas, a oeste do porto (salas: ${AV.salasLivres('gruta')}/3).`, 'Leve o cálice roubado ao Velho Cosme.'],
    alvos: [entradaDe('gruta'), ondeFig('cosme')],
    convite: 'Naquela gruta os contrabandistas escondiam o que roubavam dos navios. Um dia roubaram o cálice da capela dos pescadores, e levaram para lá. Comeram e beberam tanto em cima do roubo que a gula tomou forma: um polvo enorme, que agora vive no fundo da gruta.',
    aceitar: 'Eu trago o cálice de volta.', aceito: 'Três salas, cheias de bichos da gula. O polvo fica no fundo, junto do altar dos contrabandistas. Que São Pedro reme com você.',
    aoAceitar: jaFeita('p_gruta', 'gruta'),
    lembrete: () => `A gruta ainda fede a gula (salas: ${AV.salasLivres('gruta')}/3).`,
    agradece: 'O cálice da capela! Depois de tantos anos... A minha mãe comungou com ele.',
    entrega: { acao: 'dar', prop: 'reliquia', falas: [['Velho Cosme', 'Vou levá-lo a Frei Gaspar amanhã cedo. No domingo ele volta ao altar, onde é o lugar dele. Tome: guardei isto para quem tivesse coragem.']] },
    depois: 'O cálice voltou ao altar. Fui à Missa, e chorei como menino.' });
  ligarMasmorra('p_gruta', 'gruta');
  AV.carga('reliquia', () => MS.ativa('p_gruta') && MS.etapa('p_gruta') === 1, 'p_gruta');

  // ---- Guilda dos Pescadores de São Pedro
  AV.npc('simplicio', 'Mestre Simplício', L.simplicio.x - 1.2, L.simplicio.z - 1.2, Math.PI, { cor: 0x2a3a4a, cabelo: 0x8a8070 });
  AV.guilda({ id: 'pedro', nome: 'Guilda dos Pescadores de São Pedro', curto: 'Guilda de São Pedro', regiao: 'porto', ato: 2, mestre: 'simplicio', ondeMestre: 'junto ao quadro da guilda, perto da praia',
    quadro: { x: L.simplicio.x + 1.8, z: L.simplicio.z + 1.2, rot: Math.PI }, cor: 0x1a3a6a, titulos: ['Grumete da Guilda', 'Marinheiro da Guilda', 'Mestre Pescador'],
    convite: 'A Guilda dos Pescadores de São Pedro protege quem vive do mar. Se quiser trabalhar com a gente, há contratos no quadro. O primeiro: vença doze vícios aqui nos Portos.',
    contratos: [
      { nome: 'Cais seguro', tipo: 'vencer', n: 12, txt: 'Vença ou liberte doze vícios nos Portos do Festim', xp: 120, den: 50, fala: 'O cais está seguro! Agora você é Grumete da Guilda.' },
      { nome: 'Os achados da maré', tipo: 'baus', n: 3, txt: 'Abra três baús que a maré e os contrabandistas deixaram pelos Portos', xp: 140, den: 45, itens: [['agua', 2]], fala: 'Três baús! O mar devolve o que leva, para quem procura. Você é Marinheiro da Guilda.' },
      { nome: 'A gruta', tipo: 'masmorra', masmorra: 'gruta', txt: 'Purifique a Gruta dos Contrabandistas', xp: 200, den: 80, itens: [['anzol', 1]], fala: 'O polvo caiu! Tome o anzol de São Pedro. "Farei de vocês pescadores de homens." Você é Mestre Pescador.' }
    ] });

  /* ===================================================================
     MINAS DE MAMOM (Ato III)
     =================================================================== */
  // ---- Aurélio e o canário da mina
  const ganchoAur = gancho(-786, 44, -Math.PI / 2);
  AV.npc('aurelio', 'Aurélio, o mineiro', L.aurelio.x - 1, L.aurelio.z - 1.2, -Math.PI * 0.6, { cor: 0x4a3a2a, cabelo: 0x2a1a10 });
  const colCan = { id: 'm_can', missao: 'm_canario', etapa: 0, pontos: ACH.canario, modelo: 'gaiola', nome: 'Gaiola do canário', texto: 'Pegar a gaiola do canário', carga: 'gaiola',
    guarda: [[['morcego', 12], ['morcego', 12], ['escaravelho', 12, 'forte']]] };
  AV.coleta(colCan);
  AV.missao({ id: 'm_canario', ato: 3, nome: 'O Canário de Aurélio', npc: 'aurelio', xp: 150, den: 45, itens: [['pao', 2]],
    etapas: ['Encontre a gaiola do canário de Aurélio, nas pedras ao norte do acampamento.', 'Leve a gaiola a Aurélio, para pendurá-la no poste.'],
    alvos: [proximo(colCan), ondeFig('aurelio')],
    convite: 'O canário é o anjo do mineiro: quando ele para de cantar, é que o ar ficou ruim lá embaixo. Os morcegos levaram a gaiola dele lá para o norte, e desde então ninguém desce tranquilo.',
    aceitar: 'Eu trago o canário.', aceito: 'Nas pedras do norte, onde os morcegos dormem. Traga com cuidado, que ele é pequeno.',
    lembrete: 'A gaiola ficou nas pedras do norte, onde os morcegos dormem.',
    agradece: 'Ele está vivo! Escute... ainda canta. Vamos pendurá-lo no poste, onde todos ouçam.',
    entrega: { acao: 'pendurar', prop: 'gaiola', alvo: () => ganchoAur, falas: [['Aurélio, o mineiro', 'Enquanto ele cantar, a gente desce em paz. Até os pássaros louvam a Deus, dizia São Francisco. Tome, é pouco, mas é de coração.']] },
    aoConcluir: () => acertar(), depois: 'Escuta o canário? Assim a gente sabe que o ar lá embaixo está bom.' });
  visuais.push(() => { ganchoAur.gaiola.visible = MS.feita('m_canario'); });
  // o canário pendurado canta de vez em quando
  let cantoT = 4;
  MS.ganchos.update.push(dt => { if (!MS.feita('m_canario')) return; cantoT -= dt; if (cantoT > 0) return; cantoT = 5 + Math.random() * 6; if (Math.hypot(P.pos.x - ganchoAur.x, P.pos.z - ganchoAur.z) < 22) for (let i = 0; i < 4; i++) setTimeout(() => A.bell && A.bell(1800 + Math.random() * 700, 0.03), i * 140); });

  // ---- Teodora, a Fonte de Santa Bárbara e o Velho Jerônimo
  fonte(L.fonte.x, L.fonte.z);
  AV.npc('teodora', 'Teodora, a lavadeira', L.teodora.x - 2, L.teodora.z - 2, Math.PI * 0.8, { cor: 0x6a4a3a, veu: 0xb8a888 });
  AV.npc('jeronimo', 'Velho Jerônimo', L.teodora.x + 3, L.teodora.z + 1, -Math.PI / 2, { cor: 0x3a3028, cabelo: 0xd8d0c0 });
  AV.missao({ id: 'm_agua', ato: 3, nome: 'Água da Fonte', npc: 'teodora', receptor: 'jeronimo', xp: 120, den: 35, itens: [['agua', 2]],
    etapas: ['Encha o balde na Fonte de Santa Bárbara, a leste do acampamento.', 'Leve a água ao Velho Jerônimo, ao lado de Teodora.'],
    alvos: [() => ({ x: L.fonte.x, z: L.fonte.z }), ondeFig('jeronimo')],
    convite: 'O capataz de Fúlvio vende a água do poço, uma moeda por caneca, e o Velho Jerônimo não tem moeda. Há uma fonte que ninguém vigia, a de Santa Bárbara, mas eu não posso largar a roupa. Leva este balde?',
    aceitar: 'Eu busco a água.', aceito: 'A fonte fica a leste daqui, entre as pedras. A água de lá não se vende: é de Deus e de todo mundo.',
    lembrete: () => MS.etapa('m_agua') === 0 ? 'A Fonte de Santa Bárbara fica a leste, entre as pedras.' : 'Leve a água ao Velho Jerônimo, aqui do meu lado.',
    agradece: 'Água fresca... sem pagar nada? Deus lhe pague, porque eu não posso.',
    entrega: { acao: 'beber', prop: 'balde', falas: [['Velho Jerônimo', 'Ah... "Quem der de beber a um destes pequenos, ainda que seja um copo de água fresca, não perderá a sua recompensa." Eu nunca tinha entendido isso tão bem.'], ['Teodora, a lavadeira', 'Tome estas águas bentas. O padre Elias benzeu ontem, e você merece mais que eu.']] },
    depois: 'Agora a gente busca água na fonte, todo dia, e ninguém paga.' });
  M.interativo(L.fonte.x, L.fonte.z + 1.8, 2.4, () => MS.ativa('m_agua') && MS.etapa('m_agua') === 0 ? 'Encher o balde na fonte' : 'Beber da fonte', () => {
    if (MS.ativa('m_agua') && MS.etapa('m_agua') === 0) { MS.avancar('m_agua', 1); ui.toast('Você enche o balde com água fresca da fonte.'); A.bell(659, 0.06); return; }
    P.hp = Math.min(P.D.maxHp, P.hp + 10); ui.toast('A água é fresca e limpa. Você se sente melhor.');
  });
  AV.carga('balde', () => MS.ativa('m_agua') && MS.etapa('m_agua') === 1, 'm_agua');

  // ---- Leandro e a Mina dos Sete Poços
  const nichoLe = nicho(L.leandro.x + 4, L.leandro.z + 2, Math.PI * 0.75);
  AV.npc('leandro', 'Leandro, o capelão dos mineiros', L.leandro.x, L.leandro.z, Math.PI * 0.9, { cor: 0x2a2a2a, cabelo: 0x5a4a3a });
  AV.masmorra({ id: 'pocos', nome: 'Mina dos Sete Poços', x: L.pocos.x, z: L.pocos.z, rot: L.pocos.rot, regiao: 'minas', estilo: 'mina', tema: 'cripta',
    salasDef: [{ inimigos: [['escaravelho', 14], ['escaravelho', 14], ['morcego', 14], ['morcego', 14]] }, { inimigos: [['morcego', 15], ['morcego', 15], ['golem', 15, 'forte'], ['escaravelho', 15]] }, { chefe: ['bezerro', 16], inimigos: [['escaravelho', 15], ['escaravelho', 15]] }],
    tesouro: { den: [120, 170], itens: [['agua', 2], ['vela', 2]], equip: true, raro: 0.65 } });
  AV.missao({ id: 'm_pocos', ato: 3, nome: 'A Mina dos Sete Poços', npc: 'leandro', xp: 300, den: 80, itens: [['agua', 2]],
    etapas: [() => `Purifique a Mina dos Sete Poços, ao norte de onde Leandro reza (salas: ${AV.salasLivres('pocos')}/3).`, 'Leve a imagem de Santa Bárbara a Leandro, para o nicho dos mineiros.'],
    alvos: [entradaDe('pocos'), () => ({ x: nichoLe.x, z: nichoLe.z })],
    convite: 'Os sete poços eram a mina mais funda de Mamom. Lá embaixo os mineiros fundiram ouro numa forma de bezerro, e começaram a adorá-lo, como no deserto. Levaram até a imagem de Santa Bárbara que guardava a entrada, e o nicho ficou vazio.',
    aceitar: 'Eu trago a imagem de volta.', aceito: 'Desça pelas três salas. O bezerro de ouro fica no fundo. Ele brilha, mas não tem vida nenhuma: lembre-se disso quando olhar para ele.',
    aoAceitar: jaFeita('m_pocos', 'pocos'),
    lembrete: () => `A mina dos sete poços ainda reluz de ouro falso (salas: ${AV.salasLivres('pocos')}/3).`,
    agradece: 'Santa Bárbara! Voltou para casa. Ajude-me a pô-la no nicho.',
    entrega: { acao: 'altar', prop: 'reliquia', alvo: () => nichoLe, falas: [['Leandro, o capelão dos mineiros', 'Santa Bárbara, rogai por nós, que descemos à terra para ganhar o pão. Agora os mineiros vão passar por aqui e lembrar que o ouro não salva ninguém.']] },
    aoConcluir: () => acertar(), depois: 'Os mineiros param no nicho antes de descer. Uns rezam, outros só tiram o chapéu. Já é um começo.' });
  ligarMasmorra('m_pocos', 'pocos');
  visuais.push(() => { nichoLe.imagem.visible = MS.feita('m_pocos'); });
  AV.carga('reliquia', () => MS.ativa('m_pocos') && MS.etapa('m_pocos') === 1, 'm_pocos');

  // ---- Guilda dos Mineiros de Santa Bárbara
  AV.npc('lucas', 'Mestre Lucas', L.lucas.x - 1.2, L.lucas.z - 1, Math.PI * 0.8, { cor: 0x3a3a2a, cabelo: 0x6a6a6a });
  AV.guilda({ id: 'barbara', nome: 'Guilda dos Mineiros de Santa Bárbara', curto: 'Guilda de Santa Bárbara', regiao: 'minas', ato: 3, mestre: 'lucas', ondeMestre: 'junto ao quadro da guilda, no oeste do acampamento',
    quadro: { x: L.lucas.x + 1.8, z: L.lucas.z + 1.4, rot: Math.PI * 0.8 }, cor: 0x8a5a14, titulos: ['Aprendiz da Guilda', 'Oficial da Guilda', 'Mestre Mineiro'],
    convite: 'A Guilda dos Mineiros de Santa Bárbara era dos mineiros, não do patrão. Fúlvio quis acabar com ela, mas o livro ainda está comigo. Quer ajudar? Primeiro contrato: vença quinze vícios aqui nas Minas.',
    contratos: [
      { nome: 'Galerias livres', tipo: 'vencer', n: 15, txt: 'Vença ou liberte quinze vícios nas Minas de Mamom', xp: 150, den: 60, fala: 'Quinze! Os caminhos estão livres. Você é Aprendiz da Guilda.' },
      { nome: 'O ouro escondido', tipo: 'baus', n: 3, txt: 'Abra três baús escondidos pelas Minas', xp: 170, den: 50, itens: [['vela', 3]], fala: 'O ouro guardado não serve a ninguém: reparta o que achou. Você é Oficial da Guilda.' },
      { nome: 'Os sete poços', tipo: 'masmorra', masmorra: 'pocos', txt: 'Purifique a Mina dos Sete Poços', xp: 240, den: 100, itens: [['lanterna', 1]], fala: 'O bezerro de ouro caiu! Tome a lanterna de Santa Bárbara: ela ilumina mesmo no escuro da noite. Você é Mestre Mineiro.' }
    ] });

  /* ===================================================================
     CORTE DAS MÁSCARAS (Ato IV)
     =================================================================== */
  // ---- Lúcio, o trovador, e o alaúde roubado
  AV.npc('lucio', 'Lúcio, o trovador', L.lucio.x, L.lucio.z, -Math.PI * 0.75, { cor: 0x6a2a4a, cabelo: 0x8a5a2a });
  const colAla = { id: 'c_ala', missao: 'c_alaude', etapa: 0, pontos: ACH.alaude, modelo: 'alaude', nome: 'Alaúde de Lúcio', texto: 'Pegar o alaúde', carga: 'alaude',
    guarda: [[['pavao', 15], ['pavao', 15], ['mariposa', 15, 'forte']]] };
  AV.coleta(colAla);
  AV.missao({ id: 'c_alaude', ato: 4, nome: 'O Alaúde do Trovador', npc: 'lucio', xp: 170, den: 60, itens: [['vela', 2]],
    etapas: ['Recupere o alaúde de Lúcio, levado pelos pavões ao jardim do sudeste.', 'Leve o alaúde a Lúcio, o trovador.'],
    alvos: [proximo(colAla), ondeFig('lucio')],
    convite: 'Eu cantava para o Duque, só louvores a ele, cada vez mais bonitos e mais vazios. Um dia quis cantar um salmo, e os pavões da vaidade arrancaram o alaúde das minhas mãos. Dizem que um canto bom ofende quem só quer ser admirado.',
    aceitar: 'Eu trago o seu alaúde.', aceito: 'Os pavões ficam no jardim do sudeste, perto do muro. Eles abrem a cauda para hipnotizar: não olhe muito tempo.',
    lembrete: 'Os pavões levaram o alaúde para o jardim do sudeste.',
    agradece: 'O meu alaúde! Escute, que a primeira canção é para Deus.',
    entrega: { acao: 'tocar', prop: 'alaude', falas: [['Lúcio, o trovador', '"Cantai ao Senhor um canto novo." Faz tanto tempo que eu não cantava para Alguém que não precisa de elogios. Tome, peregrino, que um trovador paga com o que tem.']] },
    depois: 'Agora toco na praça, de graça. Uns riem, outros param para escutar. Os dois me fazem bem.' });

  // ---- Mônica, a sacristã, e os lírios para o altar
  const altarMon = altarzinho(L.monica.x + 3, L.monica.z - 2.2, -Math.PI / 2 + 0.3);
  AV.npc('monica', 'Mônica, a sacristã', L.monica.x, L.monica.z, Math.PI / 2, { cor: 0x3a2a3a, veu: 0xe8e0d0 });
  const colLir = { id: 'c_lir', missao: 'c_lirios', etapa: 0, pontos: ACH.lirios, modelo: 'lirio', nome: 'Lírios', texto: 'Colher os lírios', carga: 'flores',
    guarda: [[['mariposa', 14]], null, [['reflexo', 15]], [['mariposa', 14], ['mariposa', 14]]] };
  AV.coleta(colLir);
  AV.missao({ id: 'c_lirios', ato: 4, nome: 'Lírios para o Altar', npc: 'monica', xp: 150, den: 50, itens: [['agua', 2]],
    etapas: [() => `Colha os lírios brancos do jardim abandonado, a oeste da praça (${conta(colLir)()}).`, 'Leve os lírios a Mônica, para o altar.'],
    alvos: [proximo(colLir), ondeFig('monica')],
    convite: 'Na Corte todo mundo enfeita a si mesmo, e ninguém enfeita o altar. Eu queria pôr lírios brancos para Nosso Senhor, como se fazia antigamente. Crescem no jardim abandonado, a oeste, mas as mariposas tomaram conta.',
    aceitar: 'Eu colho os lírios.', aceito: 'Quatro hastes. O lírio é a flor da pureza: branca por dentro e por fora, sem máscara nenhuma.',
    lembrete: () => `Faltam lírios (${conta(colLir)()}). O jardim abandonado fica a oeste da praça.`,
    agradece: 'Que brancos! Vamos pô-los no altar agora.',
    entrega: { acao: 'altar', prop: 'flores', alvo: () => altarMon, falas: [['Mônica, a sacristã', '"Olhai os lírios do campo: não trabalham nem fiam, e nem Salomão se vestiu como um deles." Que a Corte aprenda com eles. Tome, e Deus lhe pague.']] },
    aoConcluir: () => acertar(), depois: 'Troco os lírios toda semana. Algumas damas da Corte já vieram rezar aqui, sem máscara.' });
  visuais.push(() => { altarMon.flores.visible = MS.feita('c_lirios'); });

  // ---- Ludovico, o velho mordomo, e o Mausoléu dos Duques
  AV.npc('ludovico', 'Ludovico, o velho mordomo', L.ludovico.x, L.ludovico.z, -Math.PI * 0.6, { cor: 0x1a1a2a, cabelo: 0xe8e0d8 });
  AV.masmorra({ id: 'mausoleu', nome: 'Mausoléu dos Duques', x: L.mausoleu.x, z: L.mausoleu.z, rot: L.mausoleu.rot, regiao: 'corte', estilo: 'marmore', tema: 'cripta',
    salasDef: [{ inimigos: [['mariposa', 17], ['mariposa', 17], ['pavao', 17], ['reflexo', 17]] }, { inimigos: [['pavao', 18, 'forte'], ['reflexo', 18], ['reflexo', 18], ['mariposa', 18]] }, { chefe: ['basilisco', 19], inimigos: [['mariposa', 18], ['mariposa', 18]] }],
    tesouro: { den: [160, 220], itens: [['agua', 3], ['vela', 2]], equip: true, raro: 0.7 } });
  AV.missao({ id: 'c_mausoleu', ato: 4, nome: 'O Mausoléu dos Duques', npc: 'ludovico', xp: 340, den: 100, itens: [['agua', 2]],
    etapas: [() => `Purifique o Mausoléu dos Duques, no fundo do parque do sudoeste (salas: ${AV.salasLivres('mausoleu')}/3).`, 'Leve o rosário da Duquesa a Ludovico.'],
    alvos: [entradaDe('mausoleu'), ondeFig('ludovico')],
    convite: 'Servi três duques. Todos foram enterrados ali, com estátuas maiores do que eles. O último pediu que pusessem espelhos no túmulo, para se ver por toda a eternidade. A vaidade chocou dentro dele um basilisco, que transforma em pedra quem o olha. A Duquesa, que era santa, foi enterrada com um rosário simples... Ninguém pode mais entrar para rezar por ela.',
    aceitar: 'Eu entro no mausoléu.', aceito: 'O basilisco fica na última sala, entre as estátuas. Não se deixe prender pelo olhar dele: olhe para o chão e reze.',
    aoAceitar: jaFeita('c_mausoleu', 'mausoleu'),
    lembrete: () => `O mausoléu continua frio de vaidade (salas: ${AV.salasLivres('mausoleu')}/3).`,
    agradece: 'O rosário da Duquesa... as contas gastas de tanto rezar. Ela era a única ali que não precisava de estátua.',
    entrega: { acao: 'dar', prop: 'terco', falas: [['Ludovico, o velho mordomo', 'Vou levá-lo à capela e pedir uma Missa por ela, e pelos três duques também, que precisam mais. Tome isto, que guardei a vida inteira.']] },
    depois: 'Rezo o rosário da Duquesa todas as tardes. As estátuas que se cubram de musgo.' });
  ligarMasmorra('c_mausoleu', 'mausoleu');
  AV.carga('terco', () => MS.ativa('c_mausoleu') && MS.etapa('c_mausoleu') === 1, 'c_mausoleu');

  // ---- Confraria dos Artesãos de São José
  AV.npc('gaudencio', 'Mestre Gaudêncio', L.gaudencio.x - 1.2, L.gaudencio.z + 1.2, Math.PI, { cor: 0x6a4a2a, cabelo: 0x9a9080 });
  AV.guilda({ id: 'jose', nome: 'Confraria dos Artesãos de São José', curto: 'Confraria de São José', regiao: 'corte', ato: 4, mestre: 'gaudencio', ondeMestre: 'junto ao quadro da confraria, no sul da Corte',
    quadro: { x: L.gaudencio.x + 1.8, z: L.gaudencio.z + 1.0, rot: Math.PI }, cor: 0x4a2a14, titulos: ['Aprendiz Artesão', 'Oficial Artesão', 'Mestre Artesão'],
    convite: 'Nós, os artesãos, fazemos as coisas belas da Corte, e a Corte nos esquece. São José era carpinteiro e ninguém sabia o nome dele, e foi o pai adotivo do Filho de Deus. Quer entrar na confraria? Vença vinte vícios aqui na Corte.',
    contratos: [
      { nome: 'Oficina em paz', tipo: 'vencer', n: 20, txt: 'Vença ou liberte vinte vícios na Corte das Máscaras', xp: 180, den: 70, fala: 'Vinte! Já se pode trabalhar sem medo. Você é Aprendiz Artesão.' },
      { nome: 'As obras escondidas', tipo: 'baus', n: 3, txt: 'Abra três baús escondidos pela Corte', xp: 200, den: 60, itens: [['vela', 3]], fala: 'Boas mãos e bons olhos. Você é Oficial Artesão.' },
      { nome: 'O mausoléu', tipo: 'masmorra', masmorra: 'mausoleu', txt: 'Purifique o Mausoléu dos Duques', xp: 280, den: 120, itens: [['esquadro', 1]], fala: 'O basilisco caiu! Tome o esquadro de São José: tudo o que é reto e justo fica de pé. Você é Mestre Artesão.' }
    ] });

  /* ================= OS BAÚS ================= */
  const CENTRO = { vale: { x: 0, z: 0 }, porto: { x: 0, z: 680 }, minas: { x: -900, z: 0 }, corte: { x: 0, z: -900 } };
  const CONT = {
    vale: { den: [6, 18], guarda: [['diabrete', 4], ['larva', 4], ['lobo_cinza', 4], ['murmurador', 5]] },
    porto: { den: [14, 30], guarda: [['corvo', 9], ['larva_gula', 9], ['caranguejo', 9]] },
    minas: { den: [20, 38], guarda: [['escaravelho', 12], ['morcego', 12], ['golem', 12]] },
    corte: { den: [26, 46], guarda: [['mariposa', 15], ['pavao', 15], ['reflexo', 15]] }
  };
  const LOTE = [[['pao', 1]], [['agua', 1]], [['vela', 1]], [['pao', 2]], [['agua', 1], ['vela', 1]], [['pao', 1], ['agua', 1]]];
  Object.keys(BAUS).forEach(reg => BAUS[reg].forEach(([x, z], i) => {
    const c = CONT[reg], gd = i % 2 === 0 ? [c.guarda[i % c.guarda.length], c.guarda[(i + 1) % c.guarda.length]] : (i === 3 ? [c.guarda[0]] : null);
    AV.bau({ id: `${reg}_${i}`, x, z, rot: virar(x, z, CENTRO[reg]), regiao: reg, rico: i === 5,
      conteudo: { den: c.den, itens: LOTE[i], equip: i === 2 || i === 5, raro: i === 5 ? 0.35 : 0.08 }, guarda: gd });
  }));

  /* ================= OS BICHOS NOVOS PELOS CAMINHOS ================= */
  M.spawnsMundo.push(
    ['murmurador', -20, -120, 4], ['murmurador', 62, -108, 5], ['murmurador', 150, -50, 5], ['murmurador', 160, 22, 5, 'forte'], ['murmurador', -150, -66, 6],
    ['caranguejo', -100, 738, 8], ['caranguejo', 22, 742, 8], ['caranguejo', 108, 734, 9, 'forte'], ['caranguejo', -122, 650, 9], ['caranguejo', 122, 642, 10],
    ['morcego', -800, -100, 11], ['morcego', -1040, -100, 12], ['morcego', -780, 118, 12, 'forte'], ['morcego', -1000, 155, 12], ['morcego', -870, -150, 13],
    ['pavao', 130, -1000, 15], ['pavao', -140, -960, 15], ['pavao', 140, -868, 16, 'forte'], ['pavao', -130, -800, 16], ['pavao', 60, -1050, 17, 'elite']
  );

  /* ================= AS MISSÕES ANTIGAS: A COISA NAS MÃOS, E A ENTREGA DE VERDADE ================= */
  const st = id => prog() && prog().missoes[id];
  AV.carga('carvao', () => !!F().carvao && !MS.feita('s5'), 's5');
  AV.carga('reliquia', () => !!F().reliquia_obtida && !F().reliquia_devolvida, 's4');
  AV.carga('badalo', () => prog() && (prog().inv.badalos || []).length > 0 && !F().sinos, 'm3');
  AV.carga('farinha', () => !!F().farinha && !MS.feita('a2s2'), 'a2s2');
  AV.carga('moedas', () => MS.ativa('a2s4') && MS.etapa('a2s4') === 1, 'a2s4');
  AV.carga('lamparina', () => !!F().lamparina && !MS.feita('a3s1'), 'a3s1');
  AV.carga('paes', () => MS.ativa('a3s2') && IT.qtd('pao') >= 3, 'a3s2');
  AV.carga('mascaras', () => MS.ativa('a4s1') && MS.etapa('a4s1') === 1, 'a4s1');
  AV.carga('terco', () => !!F().terco_mateus && !MS.feita('a4s2'), 'a4s2');
  AV.carga('carta', () => MS.ativa('a4s3') && MS.etapa('a4s3') === 0 && !!F().carta, 'a4s3');
  const lucia = () => { const x = -33 * 1.5, z = 700 - 25 * 1.5; return { x, y: H(x, z) + 0.85, z }; }; // a panela do Bairro dos Pobres (porto.js)
  const RETRO = {
    s5: () => AV.entregar({ npc: 'lia', prop: 'carvao', acao: 'forja', alvo: casaNome('Forja de Lia', -2.2, -2.2, 1.05), falas: [['Lia, a ferreira', 'Ouviu? A forja voltou a cantar! Da próxima vez que passar por aqui, a sua arma vai cortar como nunca.']] }),
    s4: r => { if (r === 'devolvida') AV.entregar({ prop: 'reliquia', acao: 'colocar', alvo: { x: 0, y: H(0, 3) + 0.5, z: 3 }, dur: 2.8 }); },
    a2s2: () => AV.entregar({ npc: 'lucia', prop: 'farinha', acao: 'panela', alvo: lucia, falas: [['Lúcia, a cozinheira', 'Olhe como engrossa! Esta panela vai alimentar o bairro inteiro.']] }),
    a2s4: r => { if (r === 'repartiu') AV.entregar({ npc: 'ana', prop: 'moedas', acao: 'dar' }); },
    a3s1: () => AV.entregar({ npc: 'rosa', prop: 'lamparina', acao: 'pendurar', alvo: naCasa('rosa', 2.2, 0.6, 1.1), falas: [['Viúva Rosa', 'Vou deixá-la acesa aqui, na mesa onde ele jantava. E amanhã, ao pé do altar.']] }),
    a3s2: () => AV.entregar({ npc: 'bras', prop: 'paes', acao: 'dar' }),
    a4s1: () => AV.entregar({ npc: 'clara', prop: 'mascaras', acao: 'lareira', alvo: naCasa('clara', 2.4, -2.7, 0.45), falas: [['Clara, a costureira', 'Pronto. Que queimem, com tudo o que escondiam.']] }),
    a4s2: () => AV.entregar({ npc: 'mateus', prop: 'terco', acao: 'dar' })
  };
  const concluir0 = MS.concluir;
  MS.concluir = function (id, r) {
    const antes = !!(st(id) && st(id).fim);
    concluir0.call(MS, id, r);
    if (!antes && RETRO[id]) try { RETRO[id](r); } catch (e) { console.warn(e); }
  };
  const avancar0 = MS.avancar;
  MS.avancar = function (id, e) {
    const antes = MS.etapa(id);
    avancar0.call(MS, id, e);
    if (id === 'a4s3' && e === 1 && antes === 0 && MS.etapa(id) === 1) AV.entregar({ npc: 'sebastiao', prop: 'carta', acao: 'ler', dur: 2.6 });
  };

  /* ================= LIGAR TUDO ================= */
  MS.ganchos.aplicar.push(acertar);
  AV.ligarNpcs();
})(window.OV);

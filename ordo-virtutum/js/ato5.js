/* Ordo Virtutum — Ato V: a Vila dos Muros. Missões, os vícios da inveja (a comparação, a maledicência,
   o muro entre vizinhos), São João Batista, Leviatã e a Lâmpada da Benevolência.
   A luta: quando o olho do Leviatã fica verde, cai uma graça sobre a Pedra — é o bem do outro. Quem se alegra
   com ela (vai até a luz) atordoa o monstro; quem a deixa, vê o Leviatã engoli-la e pega a Inveja.
   Aos 30%, Leviatã engole o peregrino, como a Jonas: lá dentro, só a oração (R) o faz cuspir de volta. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou || !OV.muros || !OV.missoes) return;
  const MS = OV.missoes, R = OV.muros, ui = OV.ui, P = OV.P, A = OV.audio, D = OV.dialogo, I = OV.inimigos, T = OV.tempo, IT = OV.itens, AV = OV.aventura;
  const sm = OV.sm, mesh = OV.mesh;
  const A5 = {}; OV.ato5 = A5;
  const J = () => OV.jogo, prog = () => OV.jogo.prog, F = () => prog().flags;
  const { st, res, g, linha, denarios, ARV } = MS;
  const W = R.W, H = M.altura;
  const C = () => OV.combate;
  const vivo = e => e.state !== 'dead' && e.state !== 'liberto' && !e.removed;
  const naRegiao = () => M.regiao(P.pos.x, P.pos.z) === 'muros';
  const local = () => ({ x: P.pos.x - R.OX, z: P.pos.z - R.OZ });
  const naPedra = () => { const l = local(); return Math.hypot(l.x - R.PEDRA.x, l.z - R.PEDRA.z) < R.PEDRA.r - 0.3; };
  function arv(quem, nos) { for (const k in nos) if (nos[k].quem === undefined) nos[k].quem = quem; return { inicio: 'a', nos }; }
  const figPos = id => () => { const f = M.figuras[id]; return f ? { x: f.x, z: f.z } : null; };
  const oraPos = id => () => { const o = M.oratorios[id]; return o ? { x: o.x, z: o.z } : null; };
  const tagPos = t => () => { const v = I.porTag(t).filter(vivo); if (!v.length) return null; let x = 0, z = 0; v.forEach(e => { x += e.g.position.x; z += e.g.position.z; }); return { x: x / v.length, z: z / v.length }; };
  const ou = (...fs) => () => { for (const f of fs) { const r = f(); if (r) return r; } return null; };
  const lugar = (lx, lz) => () => W(lx, lz);
  M.spawnsMundo.push(...R.spawnsMundo);

  /* ================= MISSÕES DO ATO V ================= */
  const INVEJOSOS = [[R.MONT.x - 6, R.MONT.z - 6], [R.MONT.x + 7, R.MONT.z - 4], [R.MONT.x, R.MONT.z + 9], [R.VALB.x + 6, R.VALB.z - 6], [R.VALB.x - 7, R.VALB.z - 4], [R.VALB.x, R.VALB.z + 9]];
  const livres = () => (F().invejosos || []).length;
  const chaves = () => (F().chave_montalto ? 1 : 0) + (F().chave_valbaixo ? 1 : 0);
  Object.assign(MS.MIS, {
    a5m1: { ato: 5, nome: 'O Muro', tipo: 'p', xp: 160, etapas: ['Siga para a Vila dos Muros pela placa de uma das estradas.', 'Procure o Padre Zacarias, na metade leste da Igreja de São João, do lado de Valbaixo.', 'Acenda a vela do Oratório de Valbaixo.'],
      alvos: [() => R.ENTRADA, figPos('padreZacarias'), oraPos('valbaixo')] },
    a5m2: { ato: 5, nome: 'As Duas Aldeias', tipo: 'p', xp: 320, etapas: [() => `Liberte os invejosos de Montalto (oeste) e de Valbaixo (leste) (${livres()}/6).`, 'Volte ao Padre Zacarias.'],
      alvos: [ou(tagPos('invejosos'), lugar(R.MONT.x, R.MONT.z)), figPos('padreZacarias')] },
    a5m3: { ato: 5, nome: 'As Duas Chaves', tipo: 'p', xp: 340, etapas: [() => `Convença os dois alcaides a abrir as suas fechaduras: Lisandro, em Montalto, e Úrsula, em Valbaixo (${chaves()}/2).`, 'Gire as duas chaves da Porta do Meio, no fim do muro, junto ao lago.'],
      alvos: [() => F().chave_montalto ? figPos('ursula')() : figPos('lisandro')(), lugar(2.6, R.PORTA_MEIO.z + 1.5)] },
    a5m4: { ato: 5, nome: 'O Amigo do Noivo', tipo: 'p', xp: 320, etapas: ['Vá ao Vau do Precursor, a leste de Valbaixo, e reze à beira da água.', 'Vigie com São João Batista: resista às Serpes do Lago.'],
      alvos: [lugar(R.VISAO.x, R.VISAO.z), lugar(R.VISAO.x, R.VISAO.z)] },
    a5m5: { ato: 5, nome: 'Leviatã', tipo: 'p', xp: 800, etapas: ['Toque o sino de São João, no campanário sobre o muro, ao sul da igreja.', 'Atravesse a Porta do Meio e enfrente Leviatã na Pedra do Meio, no centro do lago. Quando o olho dele ficar verde, alegre-se com a graça que cair (vá até a luz).', 'Vá à Igreja de São João para a Missa.'],
      alvos: [lugar(3, R.CAMPANARIO.z + 1.6), ou(tagPos('leviata'), lugar(R.PEDRA.x, R.PEDRA.z)), lugar(12, R.IGREJA.z)] }
  });
  MS.aposAto4 = () => setTimeout(() => { if (!st('a5m1')) MS.iniciar('a5m1'); setTimeout(() => ui.toast('A estrada do norte para a Vila dos Muros está aberta: siga pelas placas das estradas.'), 1600); }, 400);
  function concluirA5m1() { MS.concluir('a5m1'); setTimeout(() => { MS.iniciar('a5m2'); if (livres() >= 6) MS.avancar('a5m2', 1); MS.respawnQuest(); }, 1500); }

  /* ================= OS VÍCIOS DA INVEJA ================= */
  const VERDE = sm(0x3a6a2a, { emissive: 0x0a1a04 }), VERDEO = new THREE.MeshBasicMaterial({ color: 0x8aff5a });
  function makeInvejoso() {
    const b = OV.makePossesso(0x2a3a22, false)();
    // olhos verdes e um olhar de lado: o invejoso nunca olha de frente
    b.eye.color.setHex(0x8aff5a); b.eyeBase = 0x8aff5a;
    const lenco = mesh(new THREE.BoxGeometry(0.5, 0.12, 0.42), sm(0x4a5a2a), 0, 2.17, -0.02); b.g.add(lenco);
    return b;
  }
  function makeSerpe() {
    const g = new THREE.Group();
    const esc = sm(0x2a4a3a, { emissive: 0x041008, roughness: 0.5 }), ventre = sm(0x8a9a6a), eye = new THREE.MeshBasicMaterial({ color: 0x9aff6a });
    const segs = [];
    for (let i = 0; i < 7; i++) { const s = mesh(new THREE.SphereGeometry(0.34 - i * 0.03, 8, 6), esc, 0, 0.32, -i * 0.42); s.scale.set(1, 0.8, 1.2); g.add(s); segs.push(s); }
    const cab = new THREE.Group(); cab.position.set(0, 0.85, 0.35); g.add(cab);
    cab.add(mesh(new THREE.SphereGeometry(0.3, 8, 6), esc, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.34, 0.12, 0.42), ventre, 0, -0.12, 0.18));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), eye); e.position.set(0.14 * s, 0.1, 0.22); cab.add(e); });
    const pescoco = mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.6, 7), esc, 0, 0.55, 0.15); pescoco.rotation.x = 0.4; g.add(pescoco);
    const armL = new THREE.Group(), armR = new THREE.Group(); cab.add(armL); cab.add(armR);
    return { g, armL, armR, mats: [esc, ventre], eye, eyeBase: 0x9aff6a, segs, cab };
  }
  function makeOlho() {
    const g = new THREE.Group();
    const branco = sm(0xe8e4d4, { emissive: 0x1a1a10 }), carne = sm(0x5a2a2a, { emissive: 0x100404 }), iris = new THREE.MeshBasicMaterial({ color: 0x5aff3a });
    const globo = mesh(new THREE.SphereGeometry(0.55, 14, 10), branco, 0, 1.6, 0); g.add(globo);
    const ir = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), iris); ir.position.set(0, 1.6, 0.54); g.add(ir);
    const pu = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), new THREE.MeshBasicMaterial({ color: 0x0a0a0a })); pu.position.set(0, 1.6, 0.555); g.add(pu);
    // as pálpebras e os cílios, como espinhos
    const palp = mesh(new THREE.SphereGeometry(0.6, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), carne, 0, 1.6, 0); g.add(palp);
    for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.22; const c = mesh(new THREE.ConeGeometry(0.035, 0.36, 4), carne, Math.sin(a) * 0.55, 1.6 + Math.cos(a) * 0.55, 0.12); c.rotation.z = -a; g.add(c); }
    const cauda = mesh(new THREE.ConeGeometry(0.16, 1.0, 6), carne, 0, 1.0, -0.2); cauda.rotation.x = Math.PI; g.add(cauda);
    const armL = new THREE.Group(), armR = new THREE.Group(); g.add(armL); g.add(armR);
    return { g, armL, armR, mats: [branco, carne], eye: iris, eyeBase: 0x5aff3a, palp };
  }
  function makeMuralha() {
    const g = new THREE.Group();
    const pedra = sm(0x6e665a, { roughness: 1, emissive: 0x060504 }), escura = sm(0x4e483e, { roughness: 1 }), eye = new THREE.MeshBasicMaterial({ color: 0x9aff6a });
    // um pedaço de muro que anda: tijolos empilhados, com ameias na cabeça
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const t = mesh(new THREE.BoxGeometry(0.62, 0.42, 0.7), (r + c) % 2 ? pedra : escura, (c - 1) * 0.64 + (r % 2) * 0.16, 1.15 + r * 0.44, 0); g.add(t); }
    [-0.6, 0, 0.6].forEach(x => g.add(mesh(new THREE.BoxGeometry(0.4, 0.4, 0.72), pedra, x, 3.0, 0)));
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.02), eye); e.position.set(0.24 * s, 2.45, 0.37); g.add(e); });
    const pernas = OV.andar.pernas(g, 0.36, 0.95, { coxa: 0.48, canela: 0.44, larg: 0.32, mat: escura, pe: [0.4, 0.16, 0.56] });
    const arm = s => { const p = new THREE.Group(); p.position.set(1.15 * s, 2.3, 0); p.add(mesh(new THREE.BoxGeometry(0.46, 1.2, 0.5), pedra, 0, -0.6, 0)); p.add(mesh(new THREE.BoxGeometry(0.56, 0.5, 0.56), escura, 0, -1.35, 0)); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [pedra, escura], eye, eyeBase: 0x9aff6a, pernas, passada: 0.9, marchaO: { A: 0.32, K: 0.5 } };
  }
  function makeHidra() {
    const g = new THREE.Group();
    const esc = sm(0x2a3a2a, { emissive: 0x060a04 }), ventre = sm(0x7a8a5a), eye = new THREE.MeshBasicMaterial({ color: 0x9aff6a });
    const corpo = mesh(new THREE.SphereGeometry(1.5, 12, 10), esc, 0, 1.6, 0); corpo.scale.set(1.2, 0.9, 1.4); g.add(corpo);
    const cabecas = [];
    [-1, 0, 1].forEach((s, i) => {
      const pe = new THREE.Group(); pe.position.set(s * 0.8, 2.4, 0.6); pe.rotation.z = -s * 0.35; g.add(pe);
      for (let k = 0; k < 5; k++) pe.add(mesh(new THREE.SphereGeometry(0.34 - k * 0.02, 8, 6), esc, 0, k * 0.42, k * 0.1));
      const cab = new THREE.Group(); cab.position.set(0, 2.2, 0.5); pe.add(cab); cab.add(mesh(new THREE.SphereGeometry(0.4, 8, 7), esc, 0, 0, 0)); cab.add(mesh(new THREE.BoxGeometry(0.4, 0.16, 0.5), ventre, 0, -0.16, 0.24));
      [-1, 1].forEach(q => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), eye); e.position.set(0.16 * q, 0.12, 0.3); cab.add(e); });
      cabecas.push(pe);
    });
    const cauda = mesh(new THREE.ConeGeometry(0.6, 3, 8), esc, 0, 1.0, -2.2); cauda.rotation.x = -Math.PI / 2 + 0.3; g.add(cauda);
    return { g, armL: cabecas[0], armR: cabecas[2], mats: [esc, ventre], eye, eyeBase: 0x9aff6a, cabecas };
  }
  // Leviatã: a cabeça e o pescoço saem da água na borda da Pedra; o corpo enrolado fica para fora, no lago
  function makeLeviata() {
    const g = new THREE.Group(); const corpo = new THREE.Group(); g.add(corpo);
    const esc = sm(0x1e3a34, { emissive: 0x020a08, roughness: 0.45, metalness: 0.2 }), ventre = sm(0x9a9a6a, { roughness: 0.7 }), crista = sm(0x5a1a1a, { emissive: 0x100202 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xffd84a });
    // o pescoço, em arco, da água (atrás) até a cabeça (em cima da borda)
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([0, -2.4 + Math.sin(t * Math.PI * 0.75) * 7.2, -9 + t * 9]); }
    pts.forEach(([x, y, z], i) => { const r = 1.15 - i * 0.04; const s = mesh(new THREE.SphereGeometry(r, 10, 8), esc, x, y, z); corpo.add(s); if (i % 2 === 0 && i > 1) { const c = mesh(new THREE.ConeGeometry(0.26, 0.9, 4), crista, x, y + r * 0.9, z); corpo.add(c); } });
    const cab = new THREE.Group(); cab.position.set(0, 4.6, 0.6); corpo.add(cab);
    cab.add(mesh(new THREE.BoxGeometry(1.7, 1.1, 2.4), esc, 0, 0.2, 0.4));
    const queixo = new THREE.Group(); queixo.position.set(0, -0.3, -0.4); cab.add(queixo);
    queixo.add(mesh(new THREE.BoxGeometry(1.5, 0.42, 2.3), ventre, 0, -0.2, 1.1));
    for (let i = 0; i < 6; i++) { [-1, 1].forEach(s => { const d = mesh(new THREE.ConeGeometry(0.08, 0.34, 4), sm(0xe8e2cc), s * 0.6, 0.1, 0.4 + i * 0.32); queixo.add(d); }); }
    [-1, 1].forEach(s => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 6), eye); e.position.set(0.66 * s, 0.55, 1.0); cab.add(e);
      const ch = mesh(new THREE.ConeGeometry(0.2, 1.4, 5), crista, 0.55 * s, 1.1, -0.5); ch.rotation.x = -0.7; cab.add(ch);
    });
    // as voltas do corpo, no lago, mais para fora
    const voltas = [];
    [[-10, 10], [6, 14], [-4, 18]].forEach(([x, z], i) => { const v = new THREE.Mesh(new THREE.TorusGeometry(2.4 - i * 0.3, 0.9 - i * 0.1, 8, 18, Math.PI), esc); v.position.set(x, -1.2, -z); v.rotation.y = i * 0.9; corpo.add(v); voltas.push(v); });
    const armL = new THREE.Group(), armR = new THREE.Group(); cab.add(armL); cab.add(armR);
    return { g, armL, armR, mats: [esc, ventre, crista], eye, eyeBase: 0xffd84a, corpo, cab, voltas, queixo };
  }
  Object.assign(I.CORES, {
    invejoso: ['Rubro', 0x4a2a1a, 'Invejoso Ressentido', 0x1a3a1a], serpe: ['Negra', 0x141c18, 'Serpe-Mãe', 0x6a8a2a],
    olho: ['Sanguíneo', 0x6a1a1a, 'Olho Que Tudo Cobiça', 0xd8c040], muralha: ['Escura', 0x2e2a24, 'Muralha Antiga', 0x8a7a4a]
  });
  const FO = OV.FOES;
  FO.invejoso = { key: 'invejoso', name: 'Invejoso possuído', nivel: 17, build: makeInvejoso, hp: 210, speed: 3.7, dmg: 18, windup: 0.48, recover: 0.7, range: 2.0, r: 0.5, height: 2.4, knock: 0.8, stagger: true, xp: 62, aggro: 13, leash: 24, liberta: true, mundo: true, moedas: [4, 7], status: 'inveja' };
  FO.serpe = { key: 'serpe', name: 'Serpe do Lago', nivel: 16, build: makeSerpe, hp: 130, speed: 4.8, dmg: 15, windup: 0.42, recover: 0.6, range: 1.9, r: 0.5, height: 1.3, knock: 1.0, stagger: true, xp: 48, mundo: true, aggro: 14, leash: 26, moedas: [3, 6], status: 'inveja',
    ia: e => { const t = e.ph; e.segs.forEach((s, i) => { s.position.x = Math.sin(t * 2 - i * 0.7) * 0.16 * i; }); } };
  FO.olho = { key: 'olho', name: 'Olho Verde', nivel: 17, build: makeOlho, hp: 96, speed: 3.6, dmg: 13, windup: 0.6, recover: 0.6, range: 1.6, r: 0.55, height: 2.3, knock: 1.4, stagger: true, xp: 46, mundo: true, aggro: 16, leash: 28, voa: true, moedas: [3, 6], status: 'inveja',
    ia: e => { if (e.palp) e.palp.rotation.x = e.state === 'windup' ? -0.6 : Math.sin(e.ph * 0.7) * 0.15; } };
  FO.muralha = { key: 'muralha', name: 'Muralha Viva', nivel: 18, build: makeMuralha, hp: 380, speed: 2.4, dmg: 26, windup: 0.85, recover: 1.0, range: 2.4, r: 0.95, height: 3.4, knock: 0.3, stagger: false, xp: 90, mundo: true, aggro: 12, leash: 22, moedas: [5, 9], status: null };
  FO.hidra = { key: 'hidra', name: 'Hidra da Discórdia', nivel: 21, build: makeHidra, hp: 980, speed: 2.6, dmg: 30, windup: 0.7, recover: 0.85, range: 3.2, r: 1.6, height: 4.4, knock: 0.2, stagger: false, xp: 520, aggro: 30, leash: 60, status: 'inveja', chefe: true,
    ia: e => { const t = e.ph; e.cabecas.forEach((c, i) => { c.rotation.x = Math.sin(t * 1.3 + i * 2) * 0.25 + (e.state === 'windup' ? -0.4 : 0); }); } };
  FO.leviata = { key: 'leviata', name: 'Leviatã, a Serpente das Águas', nivel: 20, build: makeLeviata, hp: 3000, speed: 2.2, dmg: 34, windup: 0.75, recover: 0.85, range: 5.2, r: 1.7, height: 6.4, knock: 0.05, stagger: false, xp: 900, aggro: 60, leash: 80, status: 'inveja', chefe: true,
    fall: 'Leviatã afundou no abismo. Que reine a Benevolência.', reduz: () => (chefe.submerso ? 0.02 : 1), ia: (e, dt) => iaLeviata(e, dt) };
  Object.assign(I.PADROES, {
    invejoso: ['g', 'r', 'g', 'F'], serpe: ['T', 'r', 'I', 'g'], olho: ['T3', 'T', 'r'], muralha: ['F', 'g', 'Tl', 'g'],
    hidra: { fases: [[1, ['g', 'T3', 'g', 'F']], [0.6, ['T5', 'C', 'g', 'O']], [0.3, ['O', 'T7', 'C', 'F', 'g']]] },
    leviata: { fases: [[1, ['g', 'T5', 'g', 'F']], [0.6, ['T5', 'C', 'g', 'O', 'g']], [0.3, ['O', 'T7', 'C', 'g', 'F', 'T5']]] }
  });
  Object.assign(I.PROJ, { invejoso: [0x8aff5a, 'inveja'], serpe: [0x6adf8a, 'inveja'], olho: [0x5aff3a, 'inveja'], muralha: [0x8a8070], hidra: [0x7ae06a, 'inveja'], leviata: [0x4ac8a8, 'inveja'] });
  ['hidra', 'leviata'].forEach(k => I.CHEFES.add(k));

  /* ================= O MUNDO DE ACORDO COM O PROGRESSO ================= */
  MS.ganchos.aplicar.push(() => {
    const f = F();
    if (f.ato4_fim && !st('a5m1')) prog().missoes.a5m1 = { e: 0, fim: false, res: null };
    if (M.figuras.joaoBatista) M.figuras.joaoBatista.mostrar(false);
    R.acenderLampada(!!f.ato5_fim);
    R.abrirMuro(!!f.ato5_fim);
    R.portaMeio(!!f.porta_meio);
    resetarChefe();
  });
  MS.ganchos.spawn.push(() => {
    ['invejosos', 'vigilia5'].forEach(MS.tagRemove);
    const ja = F().invejosos || [];
    if (MS.feita('a5m1') && !MS.feita('a5m2')) INVEJOSOS.forEach(([x, z], i) => { if (ja.includes(i)) return; const e = I.spawn('invejoso', false, W(x, z), { nivel: 17 }); e.tag = 'invejosos'; e.bi = i; e.mundo = false; });
  });
  MS.ganchos.inventario.push(inv => {
    const f = F();
    if (f.livro_batismos && !f.porta_meio) inv.push('Livro de batismos da paróquia de São João');
    if (f.chave_montalto && !f.porta_meio) inv.push('Chave de Montalto');
    if (f.chave_valbaixo && !f.porta_meio) inv.push('Chave de Valbaixo');
    if (f.graca_joao) inv.push('Graça de João (a graça que cai na Pedra dura mais, e no ventre do Leviatã a oração liberta depressa)');
  });

  /* ================= A IGREJA, A PORTA DO MEIO, O SINO E O VAU ================= */
  A5.textoIgreja = () => (MS.ativa('a5m5') && MS.etapa('a5m5') === 2) ? 'Entrar para a Missa' : 'Entrar na Igreja de São João';
  A5.igreja = function () {
    if (MS.ativa('a5m5') && MS.etapa('a5m5') === 2) { missa5(); return; }
    ui.fala('Igreja de São João', F().ato5_fim ? 'A parede de pedra no meio da nave sumiu. Pela primeira vez em anos, quem entra pela porta vê o altar.' : 'A nave acaba numa parede de pedra: é o muro, que atravessa a igreja de lado a lado. Do outro lado, invisível, fica o altar.');
  };
  A5.textoPorta = function () {
    const f = F(); if (f.porta_meio) return null;
    if (MS.ativa('a5m3') && MS.etapa('a5m3') === 1) return 'Girar as duas chaves da Porta do Meio';
    return 'Ver a Porta do Meio';
  };
  A5.porta = function () {
    const f = F();
    if (!(MS.ativa('a5m3') && MS.etapa('a5m3') === 1)) { ui.fala('Porta do Meio', 'Uma grade de ferro fecha o caminho de pedra que entra no lago. Tem duas fechaduras: uma virada para Montalto, outra para Valbaixo. Cada aldeia guarda a sua chave, e nenhuma abre sem a outra.'); return; }
    f.porta_meio = true; R.portaMeio(true); A.bell(220, 0.25); J().shake(0.25);
    const p = W(0, R.PORTA_MEIO.z - 6);
    const linhas = [['', 'As duas chaves giram ao mesmo tempo. A grade sobe rangendo, e o caminho de pedra aparece, coberto de limo, até o meio do lago.'],
      ['Anjo da Guarda', 'Há anos ninguém passa por aqui. Lá no meio, na Pedra, a água borbulha. Não vá ainda: antes, procure quem pode ensinar você a vencer a inveja. O Padre Zacarias falou de um vau, a leste.']];
    const fim = () => { MS.concluir('a5m3', (f.lisandro_res || '') + '+' + (f.ursula_res || '')); setTimeout(() => MS.iniciar('a5m4'), 1400); J().salvar(); };
    if (OV.cenas) OV.cenas.contar(linhas, { alvo: new THREE.Vector3(p.x, 1.5, p.z), raio: 9, altura: 4, olhar: 0.5, giro: 0.12 }, fim); else D.falas(linhas, fim);
  };
  let sinoT = 0;
  M.animados.push(dt => { if (sinoT > 0 && R.SINO) { sinoT -= dt; R.SINO.rotation.z = Math.sin(sinoT * 9) * 0.5 * Math.min(1, sinoT); } });
  A5.textoSino = () => (MS.ativa('a5m5') && MS.etapa('a5m5') === 0) ? 'Tocar o sino de São João' : F().ato5_fim ? 'Tocar o sino' : 'Puxar a corda do sino';
  A5.sino = function () {
    if (MS.ativa('a5m5') && MS.etapa('a5m5') === 0) {
      sinoT = 4; [196, 165, 196, 147].forEach((f, i) => setTimeout(() => A.bell(f, 0.32), i * 700));
      MS.avancar('a5m5', 1); J().shake(0.2);
      setTimeout(() => D.falas([['', 'O sino de São João toca pela primeira vez desde que o muro subiu. Dos dois lados, as janelas se abrem.'], ['Anjo da Guarda', 'E no lago, olhe: a água ferve em volta da Pedra do Meio. Ele ouviu. Atravesse a Porta do Meio e vá até a Pedra.']]), 1200);
      return;
    }
    if (F().ato5_fim) { sinoT = 3; A.bell(196, 0.3); setTimeout(() => A.bell(247, 0.25), 600); ui.toast('O sino toca, e das duas aldeias alguém acena.'); return; }
    ui.fala('Campanário de São João', 'A corda está amarrada lá em cima. Ninguém toca este sino desde que o muro subiu: cada aldeia acha que o sino é da outra.');
  };
  A5.textoVau = () => (MS.ativa('a5m4') && MS.etapa('a5m4') === 0) ? 'Rezar à beira da água' : 'Molhar as mãos no vau';
  A5.vau = function () {
    if (MS.ativa('a5m4') && MS.etapa('a5m4') === 0) { visaoJoao(); return; }
    ui.fala('Vau do Precursor', 'A água é fria e clara. Na cruz de cana, alguém escreveu com carvão: "Eis o Cordeiro de Deus".');
  };

  /* ================= SÃO JOÃO BATISTA E A VIGÍLIA ================= */
  function visaoJoao() {
    ui.clarao('#fff6dc'); M.figuras.joaoBatista.mostrar(true); A.bell(587, 0.2);
    D.abrir(arv('São João Batista', {
      a: { txt: () => `Não tenha medo, ${g('meu irmão', 'minha irmã')}. Eu batizava na água do Jordão, num vau como este. Vinha gente de toda parte, e os meus discípulos gostavam de ver a multidão.`, prox: 'b' },
      b: { txt: 'Um dia vieram correndo: «Mestre, aquele que estava contigo no Jordão está batizando, e todos vão até ele!» Queriam que eu sentisse inveja. Eu respondi: «O amigo do noivo fica feliz ao ouvir a voz do noivo. É preciso que ele cresça e eu diminua.»', prox: 'c' },
      c: { txt: 'A inveja é a tristeza pelo bem do outro. Ela ergueu esse muro, pedra por pedra: cada aldeia ficou triste porque a outra tinha alguma coisa. E no lago mora quem se alimenta dessa tristeza, a serpente que Jó viu, o Leviatã.',
        prox: () => (F().graca_joao || !OV.historia) ? 'd' : 's' },
      ...(OV.historia ? OV.historia.nosSacrificio('São João Batista', 'virtude',
        'Eu diminuí para que ele crescesse. Ofereça também você um pedaço do que tem de melhor: um ponto da sua maior virtude. Não é perda: é deixar espaço para Deus. Quem não precisa ser o primeiro, não tem a quem invejar.',
        () => { F().graca_joao = true; setTimeout(() => ui.toast('Você recebeu a Graça de João: a graça que cai na Pedra dura mais, e no ventre do Leviatã a oração liberta depressa.'), 1800); }, 'd',
        'Também os meus discípulos demoraram a entender. Sem a graça, a luz que cair na Pedra vai se apagar depressa, e o ventre do Leviatã vai ser mais escuro.') : {}),
      d: { txt: 'Quando o olho dele ficar verde, vai cair uma luz sobre a Pedra: é o bem de outro. Não fique olhando de longe, comparando. Corra até ela e alegre-se: a alegria pelo bem do outro desarma a serpente. Quer vigiar comigo esta noite? As serpes do lago vão sair da água.', opc: [
        { t: 'Vigiar com São João Batista.', ef: () => MS.avancar('a5m4', 1), ir: 'v' },
        { t: 'Agora não. Vou tocar o sino.', ef: () => { MS.concluir('a5m4', 'desceu'); iniciarA5m5(); }, ir: 'x' }] },
      v: { txt: 'Então vigie. Elas vêm em três levas. Quando a inveja apertar, lembre-se: o que o outro tem não foi tirado de você.', depois: () => iniciarVigilia() },
      x: { txt: 'Vá em paz. Endireitai os caminhos do Senhor.', depois: () => setTimeout(() => M.figuras.joaoBatista.mostrar(false), 800) }
    }));
  }
  const iniciarA5m5 = () => setTimeout(() => MS.iniciar('a5m5'), 1400);
  const vg = { ativa: false, onda: 0, espera: 0 };
  function iniciarVigilia() { vg.ativa = true; vg.onda = 0; vg.espera = 1.5; if (!T.ehNoite()) T.definir(21); ui.clarao('#0a0608'); ui.toast('A noite cai sobre o vau. Você vigia.'); }
  function atualizarVigilia(dt) {
    if (!vg.ativa) return;
    if (I.porTag('vigilia5').some(vivo)) return;
    vg.espera -= dt; if (vg.espera > 0) return;
    if (vg.onda >= 3) {
      vg.ativa = false;
      if (P.pers.virt.caridade < OV.MAX_VIRTUDE) P.pers.virt.caridade++;
      C().recalcular(); MS.ato('caridade');
      ui.banner('A vigília'); ui.toast('Você vigiou sem se comparar com ninguém. Sua Caridade se fortaleceu (+1).');
      if (IT.dar('conchaJoao', 1, true)) setTimeout(() => ui.toast('São João Batista lhe deixou a concha do batismo. Veja no inventário (I).'), 1800);
      MS.concluir('a5m4', 'vigilia'); iniciarA5m5();
      setTimeout(() => M.figuras.joaoBatista.mostrar(false), 2500);
      return;
    }
    vg.onda++; vg.espera = 2.5;
    ui.toast(`Vigília: ${['primeira', 'segunda', 'terceira'][vg.onda - 1]} leva das Serpes do Lago`);
    const n = 3 + vg.onda;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + Math.random();
      const e = I.spawn(vg.onda === 3 && i === 0 ? 'olho' : 'serpe', true, W(R.VISAO.x + Math.cos(a) * 7, R.VISAO.z + Math.sin(a) * 7), { nivel: 18 }); e.tag = 'vigilia5'; e.mundo = false;
    }
  }

  /* ================= LEVIATÃ ================= */
  const chefe = { ativo: false, falando: false, fase: 0, b: null, ang: -Math.PI / 2, mergT: 10, merg: null, submerso: false, luzT: 8, luz: null, alegrou: 0, engT: 0, eng: null, ventre: null, jonas: false };
  A5.chefe = chefe;
  const ANEL = 19.4;
  const ancora = a => W(R.PEDRA.x + Math.cos(a) * ANEL, R.PEDRA.z + Math.sin(a) * ANEL);
  let ventreEl = null;
  function ventre(b) {
    if (!ventreEl) { ventreEl = document.createElement('div'); ventreEl.id = 'ventreLeviata'; ventreEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at 50% 55%, rgba(30,60,40,.35) 0, rgba(6,18,12,.92) 55%, rgba(0,4,2,.98) 100%)'; document.body.appendChild(ventreEl); }
    ventreEl.style.opacity = b ? '1' : '0';
  }
  function limparEfeitos() {
    if (chefe.luz) { M.scene.remove(chefe.luz.g); chefe.luz = null; }
    if (chefe.eng && chefe.eng.anel) { M.scene.remove(chefe.eng.anel); } chefe.eng = null;
    if (chefe.ventre) sairDoVentre(false);
  }
  function resetarChefe() {
    ['leviata', 'leviata_add'].forEach(MS.tagRemove);
    limparEfeitos(); Object.assign(chefe, { ativo: false, falando: false, fase: 0, b: null, ang: -Math.PI / 2, mergT: 10, merg: null, submerso: false, luzT: 8, alegrou: 0, engT: 0, jonas: false });
  }
  function desafiar() {
    if (chefe.ativo || chefe.falando) return;
    chefe.falando = true;
    const lutar = (isca) => {
      const fala = () => D.abrir(arv('Leviatã', {
        a: { txt: 'Quem toca o sino que eles calaram? Um peregrino... Olhe as duas margens: lá em cima eles têm pão branco, aqui embaixo eles têm pano fino. E você? Você não tem nada. Não dói?', prox: 'b' },
        b: { quem: 'Anjo da Guarda', txt: 'É o Leviatã, a serpente das águas que Jó viu. Ele vive da tristeza pelo bem dos outros. Quando o olho dele ficar verde, vai cair uma luz sobre a Pedra: corra até ela e alegre-se. Se ele engolir você, reze: segure R, como Jonas no ventre do peixe.',
          depois: () => { chefe.falando = false; iniciarChefe(isca); } }
      }));
      if (OV.cenas) OV.cenas.poema('leviata', { pos: ancora(chefe.ang), raio: 12, altura: 5 }, fala); else fala();
    };
    if (IT.qtd('peixeIsca') > 0 && !F().peixe_lancado) {
      D.abrir(arv('', {
        a: { txt: 'Na beira da Pedra, a água borbulha. No seu alforje, o peixe-isca dourado da lagoa do vale brilha como ouro velho. «Poderás tu pescar o Leviatã com anzol?»', opc: [
          { t: 'Lançar o peixe-isca dourado na água.', ef: () => { IT.tirar ? IT.tirar('peixeIsca', 1) : null; F().peixe_lancado = true; }, ir: 'b' },
          { t: 'Guardar o peixe.', ir: 'c' }] },
        b: { txt: 'O peixe afunda girando. Um instante depois, a água se abre: a serpente sobe atrás da isca, com o anzol de ouro preso na boca.', depois: () => lutar(true) },
        c: { txt: 'Você guarda o peixe. A água continua fervendo.', depois: () => lutar(false) }
      }));
    } else lutar(false);
  }
  function iniciarChefe(isca) {
    resetarChefe();
    chefe.ativo = true; chefe.fase = 1;
    const l = local(); chefe.ang = Math.atan2(l.z - R.PEDRA.z, l.x - R.PEDRA.x) + Math.PI; // do lado oposto ao peregrino
    const b = I.spawn('leviata', !(OV.cenas && OV.cenas.trocar('leviata')), ancora(chefe.ang)); b.tag = 'leviata'; chefe.b = b;
    if (isca) { b.hp = Math.round(b.def.hp * 0.85); I.atordoar(b, 5); setTimeout(() => ui.toast('Leviatã ficou preso no anzol de ouro! Aproveite: ele está atordoado.'), 400); }
    MS.avancar('a5m5', 1);
    A.bell(131, 0.35); J().shake(0.35);
  }
  // a graça que cai na Pedra: o bem do outro
  function soltarLuz(e) {
    const l = local(); let px, pz;
    for (let k = 0; k < 12; k++) { const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * (F().graca_joao ? 4 : 7); px = l.x + Math.cos(a) * r; pz = l.z + Math.sin(a) * r; if (Math.hypot(px - R.PEDRA.x, pz - R.PEDRA.z) < R.PEDRA.r - 2.5) break; px = R.PEDRA.x; pz = R.PEDRA.z; }
    const p = W(px, pz), y = H(p.x, p.z);
    const gr = new THREE.Group(); gr.position.set(p.x, y, p.z); M.scene.add(gr);
    const orbe = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a0 })); orbe.position.y = 1.2; gr.add(orbe);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 14, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); col.position.y = 7; gr.add(col);
    const anel = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 28), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })); anel.rotation.x = -Math.PI / 2; anel.position.y = 0.08; gr.add(anel);
    chefe.luz = { g: gr, orbe, x: p.x, z: p.z, t: F().graca_joao ? 6.5 : 4.5, t0: F().graca_joao ? 6.5 : 4.5 };
    e.eye.color.setHex(0x5aff3a); e.eyeBase = 0x5aff3a;
    ui.toast(chefe.alegrou ? 'O olho do Leviatã fica verde: mais uma graça caiu sobre a Pedra!' : 'O olho do Leviatã fica verde: uma graça caiu sobre a Pedra. É o bem do outro: vá até a luz e alegre-se, antes que ele a engula!');
    A.bell(1046, 0.08);
  }
  function atualizarLuz(e, dt) {
    const L = chefe.luz; if (!L) return;
    L.t -= dt; L.orbe.position.y = 1.2 + Math.sin(L.t * 4) * 0.15; L.g.children[1].material.opacity = 0.2 + 0.25 * (L.t / L.t0);
    if (!P.dead && !chefe.ventre && Math.hypot(P.pos.x - L.x, P.pos.z - L.z) < 1.9) {
      M.scene.remove(L.g); chefe.luz = null; e.eyeBase = 0xffd84a;
      P.hp = Math.min(P.D.maxHp, P.hp + P.D.maxHp * 0.12);
      I.atordoar(e, 2.6); if (chefe.alegrou < 3) MS.ato('caridade'); chefe.alegrou++;
      C().anel(0xffe6a8, 3, 0.8, 0.8); A.bell(784, 0.14);
      ui.toast('Você se alegrou com o bem do outro. A serpente se encolhe, sem ter o que comer.');
      return;
    }
    if (L.t <= 0) {
      M.scene.remove(L.g); chefe.luz = null; e.eyeBase = 0xffd84a;
      e.hp = Math.min(e.def.hp, e.hp + e.def.hp * 0.05);
      if (!P.dead && !chefe.ventre) C().ferirJogador(10, 'inveja', e);
      ui.toast('O Leviatã engoliu o bem do outro, e ficou mais forte. A tristeza dele pegou você: Inveja.');
    }
  }
  // o mergulho: a cabeça afunda e volta do outro lado da Pedra
  function atualizarMergulho(e, dt) {
    const c = e.corpo; if (!c) return;
    if (chefe.merg) {
      chefe.merg.t += dt;
      if (chefe.merg.fase === 'desce') {
        c.position.y = -9 * Math.min(1, chefe.merg.t / 1.0); chefe.submerso = c.position.y < -4;
        if (chefe.merg.t >= 1.0) { const l = local(); chefe.ang = Math.atan2(l.z - R.PEDRA.z, l.x - R.PEDRA.x) + (Math.random() - 0.5) * 1.6; chefe.merg = { fase: 'sobe', t: 0 }; }
      } else {
        c.position.y = -9 * (1 - Math.min(1, chefe.merg.t / 1.0)); chefe.submerso = c.position.y < -4;
        if (chefe.merg.t >= 1.0) { chefe.merg = null; chefe.submerso = false; c.position.y = 0; const p = ancora(chefe.ang); C().anel(0x4ac8a8, 3.2, 0.7, 0.7); C().faisca(p.x, 1.4, p.z, 0x9ae8ff); J().shake(0.25); }
      }
      e.state = 'recover'; e.t = 0.4;
      return;
    }
    chefe.mergT -= dt;
    if (chefe.mergT <= 0 && (e.state === 'chase' || e.state === 'idle')) { chefe.mergT = chefe.fase >= 3 ? 10 : 13; chefe.merg = { fase: 'desce', t: 0 }; A.bell(98, 0.2); }
  }
  // Jonas: o peregrino engolido. Lá dentro, só a oração (segurar R) faz o Leviatã cuspir.
  function marcarEngolir(e) {
    const anel = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.8, 30), new THREE.MeshBasicMaterial({ color: 0x4ac8a8, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
    anel.rotation.x = -Math.PI / 2; anel.position.set(P.pos.x, H(P.pos.x, P.pos.z) + 0.1, P.pos.z); M.scene.add(anel);
    chefe.eng = { x: P.pos.x, z: P.pos.z, t: F().graca_joao ? 2.4 : 1.9, anel };
    ui.toast('O Leviatã abre a boca debaixo de você: saia do círculo!'); A.bell(110, 0.2);
    if (OV.inimigos.marca) OV.inimigos.marca(P.pos.x, P.pos.z, 2.8, chefe.eng.t, 0x4ac8a8);
  }
  function engolir(e, forcado) {
    if (chefe.eng && chefe.eng.anel) M.scene.remove(chefe.eng.anel); chefe.eng = null;
    if (P.dead) return;
    chefe.ventre = { t: 0, x: P.pos.x, z: P.pos.z, precisa: F().graca_joao ? 1.0 : 1.8 };
    P.travado = true; P.oculto = 99; P.alvo = null; if (P.heroi) P.heroi.g.visible = false;
    ventre(true); A.bell(73, 0.4); J().shake(0.5);
    const txt = forcado ? 'O Leviatã se lança da água e engole você inteiro. Escuridão, água, e um coração enorme batendo. «Do ventre do abismo clamei ao Senhor» (Jn 2,3). Segure R para rezar.' : 'O Leviatã engoliu você! Lá dentro, só a oração vale: segure R.';
    ui.toast(txt);
    if (forcado && !chefe.jonas) setTimeout(() => { if (chefe.ventre) D.falas([['Anjo da Guarda', 'Como Jonas no ventre do peixe: você não sai daqui com a espada. Ajoelhe-se e reze. Segure R até a oração subir.']]); }, 900);
  }
  function sairDoVentre(cuspido) {
    const v = chefe.ventre; chefe.ventre = null;
    P.travado = false; P.oculto = 0; if (P.heroi) P.heroi.g.visible = true; ventre(false);
    if (!cuspido) return;
    const a = Math.random() * Math.PI * 2, p = W(R.PEDRA.x + Math.cos(a) * 5, R.PEDRA.z + Math.sin(a) * 5);
    C().posicionar(p.x, p.z, Math.atan2(chefe.b ? chefe.b.g.position.x - p.x : 0, chefe.b ? chefe.b.g.position.z - p.z : 1));
    P.invuln = 1.2; C().anel(0x9ae8ff, 3.4, 0.8, 0.8); J().shake(0.4);
    const e = chefe.b; if (e && vivo(e)) { I.atordoar(e, 6); e.marca = 6; e.marcaF = 0.6; }
    if (!chefe.jonas) { chefe.jonas = true; MS.ato('esperanca'); F().jonas5 = true; }
    ui.toast('A oração subiu, e o Senhor falou ao peixe. O Leviatã cuspiu você na Pedra, atordoado e ferido por dentro!');
    A.bell(523, 0.2); setTimeout(() => A.bell(659, 0.18), 260);
  }
  function atualizarVentre(dt) {
    const v = chefe.ventre; if (!v) return;
    v.t += dt; P.pos.x = v.x; P.pos.z = v.z; P.invuln = Math.max(P.invuln, 0.2);
    if (!P.praying) { P.hp -= 5 * dt; if (P.hp <= 1) { P.hp = 1; if (v.t > 14) { sairDoVentre(false); P.invuln = 0; C().ferirJogador(9999, null); return; } } }
    if (P.praying && P.prayT >= v.precisa) sairDoVentre(true);
  }
  function iaLeviata(e, dt) {
    if (e.state === 'dead' || !chefe.ativo) return;
    // sempre preso ao anel da Pedra: a cabeça na borda, o corpo para fora, na água
    const p = ancora(chefe.ang); e.g.position.x = p.x; e.g.position.z = p.z; e.vel.set(0, 0, 0);
    if (e.voltas) e.voltas.forEach((v, i) => { v.position.y = -1.2 + Math.sin(e.ph * 0.8 + i * 1.7) * 0.6; });
    if (e.queixo) { const alvo = e.state === 'windup' ? 0.75 : e.state === 'stun' ? 0.35 : 0.05; e.queixo.rotation.x += (alvo - e.queixo.rotation.x) * Math.min(1, dt * 8); }
    const max = e.def.hp;
    if (chefe.fase === 1 && e.hp < max * 0.6) {
      chefe.fase = 2;
      [0.6, -0.6, Math.PI].forEach((da, i) => { const q = W(R.PEDRA.x + Math.cos(chefe.ang + da) * 12, R.PEDRA.z + Math.sin(chefe.ang + da) * 12); const a = I.spawn(i === 2 ? 'muralha' : 'serpe', true, q, { nivel: 19 }); a.tag = 'leviata_add'; a.mundo = false; a.def = Object.assign({}, a.def, { aggro: 40, leash: 60 }); });
      ui.toast('O Leviatã chama as serpes do lago, e um pedaço do muro se levanta da água!'); A.bell(147, 0.25); J().shake(0.3);
    }
    if (chefe.fase === 2 && e.hp < max * 0.3) { chefe.fase = 3; oferta(e); }
    if (D.aberto) return;
    if (chefe.ventre) { e.state = 'recover'; e.t = 0.3; return; }
    atualizarMergulho(e, dt);
    if (chefe.merg) return;
    atualizarLuz(e, dt);
    if (!chefe.luz) { chefe.luzT -= dt; if (chefe.luzT <= 0 && e.state !== 'stun') { chefe.luzT = chefe.fase >= 2 ? 9 : 11; soltarLuz(e); } }
    if (chefe.fase >= 3) {
      if (chefe.eng) {
        chefe.eng.t -= dt; if (chefe.eng.anel) chefe.eng.anel.material.opacity = 0.3 + 0.5 * Math.abs(Math.sin(chefe.eng.t * 8));
        if (chefe.eng.t <= 0) { if (Math.hypot(P.pos.x - chefe.eng.x, P.pos.z - chefe.eng.z) < 2.8 && !P.dead) engolir(e, false); else { if (chefe.eng.anel) M.scene.remove(chefe.eng.anel); chefe.eng = null; C().faisca(P.pos.x, 1, P.pos.z, 0x4ac8a8); ui.toast('A boca do Leviatã se fecha no vazio.'); } }
      } else { chefe.engT -= dt; if (chefe.engT <= 0 && e.state !== 'stun') { chefe.engT = 15; marcarEngolir(e); } }
    }
  }
  function oferta(b) {
    limparEfeitos(); chefe.luzT = 6;
    D.abrir(arv('Leviatã', {
      a: { txt: 'Por que eles, e não você? Eles têm casa, pão, filhos, a igreja de cada lado. Você caminha de terra em terra e não tem nada. Fique comigo: eu ponho tudo do seu lado do muro. Tudo o que é deles, será seu.', opc: [
        { t: '"O amor não é invejoso." (1Cor 13,4)', ef: () => { F().oferta5 = 'recusou'; MS.ato('caridade'); }, ir: 'r' },
        { t: 'Ficar com o que é deles, só desta vez...', ef: () => { F().oferta5 = 'cedeu'; P.status.inveja = 25; b.hp = Math.min(b.def.hp, b.hp + b.def.hp * 0.15); }, ir: 'c' }] },
      r: { quem: '', txt: 'A serpente silva, ofendida, e mergulha. A água fica parada demais.', depois: () => setTimeout(() => { if (chefe.ativo && vivo(b)) engolir(b, true); }, 900) },
      c: { quem: 'Anjo da Guarda', txt: 'Você quis o que é dos outros, e a tristeza entrou. Mas cuidado: a água está parada demais...', depois: () => setTimeout(() => { if (chefe.ativo && vivo(b)) engolir(b, true); }, 900) }
    }));
  }
  function leviataVencido() {
    chefe.ativo = false; chefe.final = true; F().leviata_vencido = true; limparEfeitos();
    I.lista.filter(e => e.tag === 'leviata_add' && vivo(e)).forEach(e => { e.state = 'dead'; e.deadT = 0; e.lab.el.style.display = 'none'; });
    J().salvar();
    setTimeout(finalLeviata, 1800);
  }
  function finalLeviata() {
    const f = F();
    D.abrir(arv('Padre Zacarias', {
      a: { quem: '', txt: 'O Leviatã afunda devagar, e a água do lago fica verde, depois clara. Nas duas margens, gente que nunca se falou desce até a beira, olhando para o mesmo lado.', prox: 'b' },
      b: { quem: 'Lisandro, o alcaide de Montalto', txt: 'Úrsula... eu vi do alto do moinho. A serpente comia o que a gente sentia um pelo outro. E nós dávamos de comer a ela todo dia.', prox: 'c' },
      c: { quem: 'Úrsula, a alcaidessa de Valbaixo', txt: 'E agora? O muro continua lá. O que fazemos com tanta pedra?', opc: [
        { t: 'Usem as pedras do muro para refazer a igreja inteira, e uma ponte sobre o regato.', ef: () => { f.muro_fim = 'ponte'; MS.ato('caridade'); }, ir: 'c1' },
        { t: 'Derrubem o muro, e cada aldeia leve de volta as pedras que pôs.', ef: () => { f.muro_fim = 'derrubar'; MS.ato('justica'); }, ir: 'c2' }] },
      c1: { quem: 'Lisandro, o alcaide de Montalto', txt: 'Uma ponte... Montalto põe a pedra, Valbaixo põe a mão de obra. Ninguém fica devendo a ninguém.', prox: 'z' },
      c2: { quem: 'Úrsula, a alcaidessa de Valbaixo', txt: 'Que cada um leve as suas. Assim ninguém vai poder dizer que o muro era do outro.', prox: 'z' },
      z: { quem: 'Anjo da Guarda', txt: 'Está feito. A igreja está esperando: vá até a porta de São João. Hoje, pela primeira vez, as duas aldeias vão entrar pelo mesmo lado.', ef: () => { MS.avancar('a5m5', 2); R.abrirMuro(true); J().salvar(); } }
    }));
  }
  function missa5() {
    const f = F();
    const linhas = [
      ['', 'A parede de pedra no meio da nave foi tirada durante a noite. Quem entra pela porta vê o altar. As duas aldeias se misturam nos bancos, sem saber direito onde sentar.'],
      ['Padre Zacarias', 'Irmãos, o amor é paciente, o amor é bondoso; não tem inveja. Hoje celebramos no mesmo altar, e ninguém precisa ser maior do que ninguém.']
    ];
    linhas.push(['Lisandro, o alcaide de Montalto', 'Úrsula, sou padrinho do seu Tomé e nunca fui à casa dele. Na semana que vem eu levo farinha. E fico para o almoço, se você deixar.'], ['Úrsula, a alcaidessa de Valbaixo', 'Deixo. E a sua Clara vai ganhar o primeiro pano do tear novo.']);
    if (MS.feita('a5s3')) linhas.push(['Davi, o irmão mais novo', 'Bruno e eu dividimos a herança de novo, desta vez sem advogado: foi o padre que contou as moedas.']);
    if (MS.feita('a5s2')) linhas.push(['Lívia, a tecelã', 'A toalha do altar fui eu que teci. Com fio de Montalto e tear de Valbaixo.']);
    if (MS.feita('a5s1')) linhas.push(['Rute, a sacristã', 'As cartas sem nome viraram cinza no braseiro da sacristia. Ninguém nunca vai saber quem escreveu. É melhor assim.']);
    linhas.push(['', 'Ao fim da Missa, o sino de São João toca, e no alto do campanário uma luz verde-clara se acende sobre o muro aberto: a Lâmpada da Benevolência.']);
    ui.clarao('#000000');
    D.falas(linhas, () => {
      f.ato5_fim = true; MS.concluir('a5m5', f.muro_fim || 'ponte');
      R.acenderLampada(true); R.abrirMuro(true);
      [0, 600, 1200, 1800, 2400].forEach((t, i) => setTimeout(() => A.bell([262, 330, 392, 440, 523][i], 0.3), t));
      setTimeout(() => {
        J().pausar(true);
        ui.fimAto(resumo5(), {
          eyebrow: 'Fim do Ato V', titulo: 'Os muros caíram',
          texto: 'A Lâmpada da Benevolência arde no campanário de São João. A quinta das sete lâmpadas de Albária foi reacesa.',
          cite: 'A oeste, na Marca Ardente, duas fortalezas queimadas se encaram há três gerações por causa de uma pedra de fronteira, e ninguém lembra mais quem começou. A peregrinação continua.'
        });
        if (MS.aposAto5) MS.aposAto5();
      }, 2600);
    });
  }
  function resumo5() {
    const f = F(), r = [];
    const como = { justica: 'com o livro de batismos', prudencia: 'com prudência', caridade: 'com caridade' };
    r.push(`Você convenceu Lisandro ${como[f.lisandro_res] || ''} e Úrsula ${como[f.ursula_res] || ''} a abrir a Porta do Meio.`.replace(/\s+/g, ' '));
    r.push(f.muro_fim === 'derrubar' ? 'O muro foi derrubado, e cada aldeia levou de volta as suas pedras.' : 'As pedras do muro refizeram a igreja inteira e uma ponte sobre o regato.');
    r.push(f.oferta5 === 'cedeu' ? 'Você quis o que era dos outros por um instante, e mesmo assim se levantou.' : 'Você recusou a oferta de Leviatã.');
    if (f.jonas5) r.push('Como Jonas, você rezou no ventre do monstro, e foi devolvido à terra.');
    if (f.peixe_lancado) r.push('O peixe-isca dourado da lagoa do vale fisgou o Leviatã.');
    if (MS.feita('a5m4')) r.push(res('a5m4') === 'vigilia' ? 'Você vigiou com São João Batista no vau.' : 'Você foi ao lago sem vigiar no vau.');
    if (MS.feita('a5s1')) r.push('As cartas sem nome viraram cinza.');
    if (MS.feita('a5s2')) r.push('Lívia teceu de novo.');
    if (MS.feita('a5s3')) r.push('Bruno e Davi voltaram a ser irmãos.');
    return r;
  }

  /* ================= EVENTOS ================= */
  const FRASES = ['"O que é que eu estava espiando por cima do muro? Nem sei mais."', '"A vizinha tem um tear novo... e daí? Que bom para ela."', '"Desculpe. Eu falava mal de gente que nem conheço."', '"Meu irmão mora do outro lado. Faz dois anos que não o vejo."', '"Deus me perdoe, eu ficava contente quando dava errado para eles."', '"Que leveza... como se eu tivesse largado uma pedra."'];
  MS.ganchos.evento.push((tipo, x) => {
    const f = F();
    if (tipo === 'zona' && naRegiao()) {
      if (MS.ativa('a5m1') && MS.etapa('a5m1') === 0) {
        MS.avancar('a5m1', 1);
        setTimeout(() => D.falas([['Anjo da Guarda', 'Um muro corta a terra, a igreja e até o lago. Aqui cada um mede a própria vida pela do vizinho. É a inveja: a tristeza pelo bem do outro. Procure o Padre Zacarias, na Igreja de São João, do lado de Valbaixo.']]), 700);
      }
      return false;
    }
    if (tipo === 'oratorio' && x === 'valbaixo' && MS.ativa('a5m1') && MS.etapa('a5m1') === 2) { concluirA5m1(); return false; }
    if (tipo === 'liberto' && x.def.key === 'invejoso') {
      x.sumir = true;
      if (x.tag === 'invejosos') {
        f.invejosos = f.invejosos || [];
        if (!f.invejosos.includes(x.bi)) f.invejosos.push(x.bi);
        ui.toast(FRASES[(f.invejosos.length - 1) % FRASES.length]);
        if (f.invejosos.length >= 6) {
          MS.ato('caridade');
          if (MS.ativa('a5m2')) MS.avancar('a5m2', 1);
          setTimeout(() => D.falas([['Anjo da Guarda', 'Os seis estão livres, três de cada lado. Repare como cada um olhou para o muro como quem acorda. Volte ao Padre Zacarias.']]), 1600);
        }
      } else ui.toast('O invejoso libertado olha em volta, envergonhado, e vai para casa.');
      J().salvar(); return true;
    }
    if (tipo === 'vencido' && x.def.key === 'leviata') { leviataVencido(); return true; }
    if (tipo === 'renascer') {
      if (vg.ativa) { vg.ativa = false; if (st('a5m4')) st('a5m4').e = 0; MS.tagRemove('vigilia5'); M.figuras.joaoBatista.mostrar(false); ui.toast('A vigília foi interrompida. Volte ao vau quando estiver pronto.'); }
      if (chefe.ativo || chefe.b) { resetarChefe(); if (MS.ativa('a5m5') && MS.etapa('a5m5') === 1) { /* o sino já tocou: basta voltar à Pedra */ } }
      return false;
    }
    return false;
  });

  /* ================= POR QUADRO ================= */
  MS.ganchos.update.push(dt => {
    atualizarVigilia(dt);
    atualizarVentre(dt);
    if (!naRegiao()) return;
    if (!(MS.ativa('a5m5') && MS.etapa('a5m5') === 1) || chefe.ativo || chefe.falando || P.dead || !naPedra()) return;
    // vencido mas a escolha final ainda não foi feita (fechou o jogo no meio): a conversa volta
    if (F().leviata_vencido) { if (!chefe.final && !D.aberto) { chefe.final = true; finalLeviata(); } return; }
    desafiar();
  });

  /* ================= DIÁLOGOS ================= */
  ARV.padreZacarias = () => {
    const f = F(), q = 'Padre Zacarias';
    if (MS.ativa('a5m1') && MS.etapa('a5m1') <= 1) return arv(q, {
      a: { txt: () => `Um peregrino! Entre, ${g('meu filho', 'minha filha')}, entre... deste lado. É o único lado que tenho. Sou o Padre Zacarias, pároco de São João. Pároco de meia igreja.`, prox: 'b' },
      b: { txt: 'Montalto e Valbaixo eram uma paróquia só. Um ano o trigo de cima deu muito, no outro ano o pano de baixo vendeu bem, e cada aldeia começou a contar o que a outra tinha. Primeiro foram as palavras. Depois as cercas. Depois o muro.', opc: [
        { t: 'E a igreja?', ir: 'c' }, { t: 'Ninguém tentou derrubar o muro?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      c: { txt: 'O muro passou bem no meio da nave. Montalto ficou com o altar e nenhuma porta; Valbaixo ficou com a porta e nenhum altar. Eu celebro olhando para uma parede de pedra.', opc: [{ t: 'Ninguém tentou derrubar o muro?', ir: 'd' }, { t: 'O que posso fazer?', ir: 'e' }] },
      d: { txt: 'Quem tenta é chamado de traidor pelos dois lados. E há coisa pior: gente possuída pela inveja ronda as duas praças, espalhando cartas sem nome e olhando por cima do muro dia e noite.', opc: [{ t: 'E a igreja?', ir: 'c' }, { t: 'O que posso fazer?', ir: 'e' }] },
      e: { txt: 'Acenda primeiro a vela do Oratório de Valbaixo, aqui na praça. Depois liberte os invejosos das duas aldeias, os de cima e os de baixo. São vizinhos, não inimigos.',
        ef: () => { MS.avancar('a5m1', 2); if (prog().oratorios.valbaixo) concluirA5m1(); } }
    });
    if (MS.ativa('a5m1')) return linha(q, 'O Oratório fica na praça de Valbaixo, a nordeste do tear grande.');
    if (MS.ativa('a5m2') && MS.etapa('a5m2') === 1) return arv(q, {
      a: { txt: 'Seis libertados! E veja: uma senhora de Montalto mandou um recado para a irmã de Valbaixo. Por cima do muro, mas mandou.', prox: 'b' },
      b: { txt: 'Agora o mais difícil. No fim do muro, junto ao lago, há a Porta do Meio, com duas fechaduras. Lisandro, o alcaide de Montalto, guarda uma chave; Úrsula, a de Valbaixo, a outra. Nenhum dos dois abre primeiro.', prox: 'c' },
      c: { txt: 'Leve este livro de batismos. Está tudo escrito aqui: Lisandro é padrinho do filho de Úrsula, e Úrsula é madrinha da filha de Lisandro. Prometeram diante da mesma pia. Talvez se lembrem.',
        ef: () => { f.livro_batismos = true; MS.concluir('a5m2'); setTimeout(() => MS.iniciar('a5m3'), 1200); } }
    });
    if (MS.ativa('a5m2')) return linha(q, () => `Os invejosos rondam as duas praças: Montalto, a oeste do muro, e Valbaixo, aqui a leste (${livres()}/6).`);
    if (MS.ativa('a5m3')) return linha(q, () => chaves() < 2 ? 'Lisandro mora na casa grande da praça de Montalto; Úrsula, aqui em Valbaixo, na casa do tear. Cada um acha que o outro deve abrir primeiro.' : 'As duas chaves! Vá à Porta do Meio, no fim do muro, junto ao lago.');
    if (MS.ativa('a5m4')) return linha(q, 'O vau fica a leste de Valbaixo, onde o regato desce para o lago. Os antigos diziam que lá apareceu o Precursor. Reze à beira da água.');
    if (MS.ativa('a5m5') && MS.etapa('a5m5') === 0) return linha(q, 'O sino do campanário, sobre o muro, ninguém toca há anos. Toque-o: é o sino das duas aldeias. E depois, que Deus vá com você até a Pedra.');
    if (MS.ativa('a5m5') && MS.etapa('a5m5') === 1) return linha(q, 'O sino tocou, e o lago ferve. Atravesse a Porta do Meio. Eu fico rezando, olhando para a parede, como sempre. Mas desta vez com esperança.');
    if (MS.ativa('a5m5')) return linha(q, 'O altar está pronto. Entre pela porta: hoje as duas aldeias vão estar do mesmo lado.');
    if (f.ato5_fim) return linha(q, 'Um padre de igreja inteira! Agora tenho o dobro de bancos para varrer. Graças a Deus. E dizem que na Marca Ardente, a oeste, há uma guerra que ninguém lembra por que começou.');
    return linha(q, 'Que São João Batista prepare o seu caminho.');
  };
  function decidir(quem, r) {
    const f = F();
    if (quem === 'lisandro') { f.lisandro_res = r; f.chave_montalto = true; } else { f.ursula_res = r; f.chave_valbaixo = true; }
    MS.ato(r === 'prudencia' ? 'prudencia' : r === 'caridade' ? 'caridade' : 'justica'); A.bell(587, 0.15);
    if (chaves() >= 2) MS.avancar('a5m3', 1);
    setTimeout(() => ui.toast(chaves() >= 2 ? 'Você tem as duas chaves. Vá à Porta do Meio, no fim do muro, junto ao lago.' : `Você recebeu a chave de ${quem === 'lisandro' ? 'Montalto' : 'Valbaixo'}. Falta a outra.`), 600);
    J().salvar();
  }
  ARV.lisandro = () => {
    const f = F(), q = 'Lisandro, o alcaide de Montalto';
    if (MS.ativa('a5m3') && MS.etapa('a5m3') === 0 && !f.chave_montalto) return arv(q, {
      a: { txt: 'Veio de Valbaixo, não é? Então veio cheio de conversa. Eles têm o lago, os teares, o dinheiro do pano. Nós temos o trigo e o suor. O muro foi a única coisa justa que Montalto já fez. A chave? Que eles abram primeiro.', opc: [
        { t: 'Mostrar o livro de batismos: "Você é padrinho de Tomé, o filho de Úrsula. Prometeu cuidar dele."', mostrar: () => !!f.livro_batismos, ef: () => decidir('lisandro', 'justica'), ir: 'j' },
        { t: '"Desde que o muro subiu, o seu trigo apodrece no celeiro: quem comprava a farinha era Valbaixo."', cond: () => P.pers.virt.prudencia >= 15, motivo: 'Prudência 15', ef: () => decidir('lisandro', 'prudencia'), ir: 'p' },
        { t: 'Pagar a dívida que Valbaixo tem com o moinho. (60 denários)', cond: () => (P.pers.denarios || 0) >= 60, motivo: 'você precisa de 60 denários', ef: () => { P.pers.denarios -= 60; decidir('lisandro', 'caridade'); }, ir: 'c' },
        { t: 'Deixar para depois.' }] },
      j: { txt: 'Tomé... o menino tinha três anos quando eu o segurei na pia. Hoje deve ter dez. Nunca vi o meu afilhado crescer, por causa de umas pedras. Tome a chave.' },
      p: { txt: '...O celeiro está cheio de farinha mofada, é verdade. Eu dizia que era castigo para eles. Era castigo para nós. Tome a chave.' },
      c: { txt: 'Você pagou o que eles deviam? Um estrangeiro? Então não temos mais desculpa nenhuma, nem eles, nem nós. Tome a chave.' }
    });
    if (f.chave_montalto && !f.porta_meio) return linha(q, 'A minha chave está com você. Agora veremos se Úrsula tem coragem.');
    if (f.ato5_fim) return linha(q, () => F().muro_fim === 'ponte' ? 'Estamos fazendo a ponte com as pedras do muro. Eu carrego, os de Valbaixo assentam. Às vezes a gente até ri.' : 'Levei as minhas pedras de volta. Fiz um banco na frente de casa, para quem vem de Valbaixo sentar.');
    if (f.porta_meio) return linha(q, 'A porta está aberta. Se a serpente sair do lago, que Deus nos ajude a todos, dos dois lados.');
    return linha(q, 'Montalto não deve nada a ninguém. Volte para o seu lado do muro, peregrino.');
  };
  ARV.ursula = () => {
    const f = F(), q = 'Úrsula, a alcaidessa de Valbaixo';
    if (MS.ativa('a5m3') && MS.etapa('a5m3') === 0 && !f.chave_valbaixo) return arv(q, {
      a: { txt: 'A chave? E deixar que os de cima desçam até o nosso lago? Eles têm o poço, o moinho, o altar da igreja. Nós ficamos com uma porta que dá para uma parede. Abra Lisandro primeiro, se for homem.', opc: [
        { t: 'Mostrar o livro de batismos: "Você é madrinha de Clara, a filha de Lisandro."', mostrar: () => !!f.livro_batismos, ef: () => decidir('ursula', 'justica'), ir: 'j' },
        { t: '"Os seus panos não vendem mais em Montalto, e a lã boa vinha de lá. O muro empobreceu os dois lados."', cond: () => P.pers.virt.prudencia >= 15, motivo: 'Prudência 15', ef: () => decidir('ursula', 'prudencia'), ir: 'p' },
        { t: 'Rezar com ela pela afilhada que ela não vê. (50 de Fé)', cond: () => P.fe >= 50, motivo: 'você precisa de 50 de Fé', ef: () => { P.fe -= 50; decidir('ursula', 'caridade'); }, ir: 'c' },
        { t: 'Deixar para depois.' }] },
      j: { txt: 'Clara... eu bordei o vestido de batismo dela. Prometi diante de Deus ser uma segunda mãe para ela. E a deixei do outro lado de um muro. Tome a minha chave.' },
      p: { txt: 'Faz dois anos que o tear grande fica parado metade da semana. Eu dizia que era porque os de cima tinham inveja. A inveja era minha. Tome a chave.' },
      c: { txt: '...Ave Maria, cheia de graça... Clara deve estar uma moça. Tome a chave, peregrino, antes que eu me arrependa.' }
    });
    if (f.chave_valbaixo && !f.porta_meio) return linha(q, 'A chave está com você. Se Lisandro também der a dele... bom, então veremos.');
    if (f.ato5_fim) return linha(q, 'Clara veio ontem me visitar. Trouxe pão branco. Eu dei a ela um pano do tear. Ninguém contou quem deu mais.');
    if (f.porta_meio) return linha(q, 'Abrimos a porta. Agora só falta ninguém ser engolido pelo lago.');
    return linha(q, 'Valbaixo tem o seu orgulho, peregrino. Não vamos implorar nada aos de cima.');
  };
  ARV.joaoBatista = () => linha('São João Batista', 'Eis o Cordeiro de Deus, que tira o pecado do mundo. É preciso que ele cresça e eu diminua.');
  R.MORADORES.forEach(([x, z, r, op, a, b]) => {
    M.criarFigura(x + R.OX, z + R.OZ, r, op);
    let k = 0; ARV[op.id] = () => linha(op.nome, F().ato5_fim ? 'Desci até a praça de baixo ontem. Foi esquisito: lá eles riem das mesmas coisas que a gente.' : (k++ % 2) ? b : a);
  });
  if (OV.vida) {
    Object.assign(OV.vida.PASSEIO, { mor_muros1: 5, mor_muros2: 3, mor_muros3: 5, mor_muros4: 4 });
    Object.assign(OV.vida.SINAL, {
      padreZacarias: () => (MS.ativa('a5m1') && MS.etapa('a5m1') <= 1) || (MS.ativa('a5m2') && MS.etapa('a5m2') === 1) ? '?' : null,
      lisandro: () => (MS.ativa('a5m3') && MS.etapa('a5m3') === 0 && !F().chave_montalto) ? '?' : null,
      ursula: () => (MS.ativa('a5m3') && MS.etapa('a5m3') === 0 && !F().chave_valbaixo) ? '?' : null
    });
    OV.vida.santosLuz.push('joaoBatista');
  }
  if (IT) { IT.SACERDOTES.padreZacarias = 'Padre Zacarias'; IT.criarCapela(R.CAPELA.x + R.OX, R.CAPELA.z + R.OZ, Math.atan2(-R.CAPELA.x, 128 - R.CAPELA.z) + Math.PI / 2, 'Capela do Peregrino (Vila dos Muros)'); }

  /* ================= OS ITENS DO ATO V ================= */
  Object.assign(OV.ITENS, {
    conchaJoao: { nome: 'Concha do Batismo', slot: 'santo', descr: 'A Inveja dura metade do tempo em você, e no Recolhimento a Fé volta 20% mais rápido.', mods: { meio: ['inveja'], prayFe: 1.2 } },
    mantoLivia: { nome: 'Manto tecido por Lívia', slot: 'veste', descr: '+30 de vida máxima e +15 de Fé máxima, e a Inveja dura metade do tempo.', mods: { hp: 30, fe: 15, meio: ['inveja'] }, cor: 0x5a7a8a },
    pedraPonte: { nome: 'Pedra da Ponte de São Benedito', slot: 'santo', guilda: true, descr: 'Insígnia dos Irmãos da Ponte: +25 de vida máxima e 10% menos dano recebido.', mods: { hp: 25, defesa: 0.9 } }
  });
  if (IT.HAGIO) Object.assign(IT.HAGIO, {
    conchaJoao: 'A concha é o sinal do Batismo: muitas igrejas derramam a água sobre a cabeça do batizado com uma concha de prata, lembrando o Jordão.',
    mantoLivia: '«Quem tiver duas túnicas, dê uma a quem não tem» (Lc 3,11), pregava João Batista às multidões no deserto.',
    pedraPonte: 'São Benedito (Bénézet) de Avinhão era um pastorzinho que, no século XII, convenceu a cidade a construir uma ponte sobre o Ródano. Dizem que ergueu sozinho a primeira pedra.'
  });

  /* ================= SÃO JOÃO BATISTA, COMO A IGREJA O RETRATA ================= */
  // pele de camelo e cinto de couro, manto vermelho, a cruz de cana com a faixa «Ecce Agnus Dei» e o Cordeiro
  if (OV.modeloSanto) {
    OV.modeloSanto.joaoBatista = function (gr) {
      const bri = m => { m.emissive = new THREE.Color(0x3a2a14); m.emissiveIntensity = 0.6; return m; };
      const pele = bri(sm(0x8a6a3a, { roughness: 1 })), manto = bri(sm(0x9a1a1a)), carne = bri(sm(0xb8906a)), cabelo = bri(sm(0x3a2414)), cana = bri(sm(0xc8b07a)), la = bri(sm(0xf0ece2));
      gr.add(mesh(new THREE.CylinderGeometry(0.3, 0.46, 1.4, 8), pele, 0, 0.92, 0));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; gr.add(mesh(new THREE.BoxGeometry(0.1, 0.28, 0.04), pele, Math.sin(a) * 0.44, 0.24, Math.cos(a) * 0.44)); }
      { const ci = mesh(new THREE.TorusGeometry(0.33, 0.04, 5, 16), bri(sm(0x4a2a14)), 0, 1.22, 0); ci.rotation.x = Math.PI / 2; gr.add(ci); }
      const mt = mesh(new THREE.BoxGeometry(0.66, 0.9, 0.3), manto, 0.08, 1.5, -0.12); mt.rotation.z = 0.25; gr.add(mt);
      gr.add(mesh(new THREE.BoxGeometry(0.64, 0.52, 0.4), pele, 0, 1.66, 0));
      gr.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), carne, 0, 2.02, 0.03));
      gr.add(mesh(new THREE.BoxGeometry(0.42, 0.5, 0.2), cabelo, 0, 2.0, -0.12));
      gr.add(mesh(new THREE.BoxGeometry(0.26, 0.34, 0.14), cabelo, 0, 1.84, 0.13));
      const cruz = new THREE.Group(); cruz.position.set(0.48, 0, 0.1); gr.add(cruz);
      cruz.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 5), cana, 0, 1.3, 0)); cruz.add(mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), cana, 0, 2.3, 0));
      const faixa = mesh(new THREE.BoxGeometry(0.06, 0.5, 0.36), la, 0.04, 2.0, 0.2); cruz.add(faixa);
      const cord = new THREE.Group(); cord.position.set(-0.5, 0, 0.35); gr.add(cord);
      const cc = mesh(new THREE.SphereGeometry(0.22, 8, 6), la, 0, 0.32, 0); cc.scale.set(1, 0.8, 1.3); cord.add(cc); cord.add(mesh(new THREE.SphereGeometry(0.1, 6, 5), bri(sm(0x2a2420)), 0, 0.45, 0.26));
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.36, -0.1); gr.add(h);
    };
    if (OV.vida) OV.vida.vestirSanto('joaoBatista', 'joaoBatista');
  }

  /* ================= AS CARTAS DO ATO V ================= */
  OV.cartasExtra = Object.assign(OV.cartasExtra || {}, {
    a5m1: ['Do Padre Zacarias', 'Paz e bem a quem vier da Corte. Sou pároco de uma igreja partida ao meio por um muro. Se Deus mandar alguém, que venha a Valbaixo, do lado da porta. Do lado do altar eu não posso receber ninguém.'],
    a5m2: ['Do diário do peregrino', 'Nas duas praças, gente possuída pela inveja olha por cima do muro dia e noite. Três em Montalto, três em Valbaixo. São vizinhos, não inimigos: é preciso libertá-los sem ferir ninguém de morte.'],
    a5m3: ['Do diário do peregrino', 'A Porta do Meio tem duas fechaduras. Lisandro guarda uma chave, Úrsula a outra, e cada um espera que o outro abra primeiro. O livro de batismos diz que um é padrinho do filho do outro.'],
    a5m4: ['Do diário do peregrino', 'O padre falou de um vau a leste, onde o regato desce para o lago. Os antigos diziam que ali apareceu o Precursor, aquele que se alegrou quando outro cresceu.'],
    a5m5: ['Do diário do peregrino', 'O sino de São João não toca desde que o muro subiu. No meio do lago, na Pedra, a água borbulha. Quem vive lá se alimenta da tristeza de uma aldeia pela alegria da outra.'],
    a5s1: ['De Rute, a sacristã', 'Toda manhã aparecem cartas pregadas no muro, sem nome. Quatro, dos dois lados. Arranque-as sem ler e leve ao padre. A língua é um fogo pequeno que queima um bosque inteiro.'],
    a5s2: ['De Lívia, a tecelã', 'Ganhei o prêmio da feira, e no dia seguinte a minha lançadeira sumiu. Jogaram nos campos a leste da aldeia, onde rondam os olhos verdes. Sem ela eu não teço.'],
    a5s3: ['De Bruno, o irmão mais velho', 'Meu pai deixou a casa para mim e o barco para o meu irmão. Cada um achou que o outro ganhou mais. Leve esta carta a Davi, em Valbaixo. Escrevi cem vezes.'],
    mu_cisterna: ['Do Velho Noé', 'As duas aldeias bebiam da mesma cisterna, com o mesmo cântaro de barro. Quando brigaram, jogaram o cântaro lá dentro. A água parada criou um bicho de três cabeças. Traga o cântaro de volta.']
  });

  /* ================= O POEMA DE LEVIATÃ E O DA HIDRA ================= */
  if (OV.cenas && OV.cenas.POEMAS) Object.assign(OV.cenas.POEMAS, {
    leviata: ['Leviatã, a Serpente das Águas', [
      'Olha a outra margem: lá o pão é mais branco,\no pano é mais fino, a criança é mais bela.\nO teu barco é velho, o teu remo é manco;\nporque é que a sorte sorri só para ela?',
      'Eu moro no fundo do que tu não tens,\nengulo a alegria que o vizinho tiver.\nErgue o teu muro, conta os teus bens,\ne fica com nada, mas fica a valer.']],
    hidra: ['Hidra da Discórdia', [
      'Três bocas tenho, e cada uma acusa:\nfoi ele, foi ela, foi o outro lado.\nCorta-me uma, e outra se recusa\na calar o que ouviu no mercado.',
      'Na água parada da velha cisterna\nbebi os rancores de duas cidades.\nA briga é minha mãe, a briga é eterna,\ne cresce comendo meias-verdades.']]
  });

  /* ================= AS MISSÕES DOS DOIS LADOS DO MURO (Aventuras) ================= */
  if (AV && AV.ajuda) {
    const aj = AV.ajuda, L = M.AVENTURA.LUGARES, ACH = M.AVENTURA.ACHADOS;
    const B = AV.B;
    // os achados novos
    AV.MODELOS.carta = () => { const g = new THREE.Group(); const p = mesh(new THREE.BoxGeometry(0.4, 0.5, 0.03), sm(0xe8dcc0), 0, 1.2, 0); g.add(p); g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5), MAT0().wood, 0, 0.9, -0.05)); return g; };
    AV.MODELOS.lancadeira = () => { const g = new THREE.Group(); const l = mesh(new THREE.BoxGeometry(0.12, 0.08, 0.5), sm(0x8a5a2a), 0, 0.12, 0); g.add(l); g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 6), sm(0xc8b8a0), 0, 0.12, 0)); return g; };
    AV.PROPS.lancadeira = () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.08, 0.06, 0.34), sm(0x8a5a2a), 0, 0, 0)); g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6), sm(0xc8b8a0), 0, 0, 0)); return g; };
    // ---- Rute, a sacristã, e as cartas sem nome pregadas no muro (a maledicência)
    const colCartas = { id: 'm5_cartas', missao: 'a5s1', etapa: 0, pontos: ACH.cartas, modelo: 'carta', nome: 'Carta sem nome', texto: 'Arrancar a carta pregada no muro', carga: 'carta',
      guarda: [[['murmurador', 18]], null, [['murmurador', 18], ['olho', 18]], null] };
    AV.coleta(colCartas);
    AV.missao({ id: 'a5s1', ato: 5, nome: 'As Cartas sem Nome', npc: 'rute', receptor: 'padreZacarias', xp: 220, den: 70, itens: [['agua', 2]], requer: () => MS.feita('a5m1'),
      etapas: [() => `Arranque as cartas sem nome pregadas nos dois lados do muro (${aj.conta(colCartas)()}).`, 'Leve as cartas ao Padre Zacarias, na Igreja de São João.'],
      alvos: [aj.proximo(colCartas), aj.ondeFig('padreZacarias')],
      convite: 'Toda manhã aparecem cartas pregadas no muro, dos dois lados. Sem nome, sem assinatura. Dizem que a mulher do moleiro rouba farinha, que a filha da tecelã namora escondido. Metade é mentira, e a outra metade não devia ser dita.',
      aceitar: 'Eu arranco as cartas.', aceito: 'Quatro, pelas minhas contas: duas do lado de cima, duas do lado de baixo. Uns vultos que cochicham ficam por perto. Não leia: leve ao padre, que ele sabe o que fazer.',
      lembrete: () => `As cartas continuam no muro (${aj.conta(colCartas)()}).`,
      agradece: 'Você trouxe as cartas sem ler? Bom. A língua é um fogo pequeno que queima um bosque inteiro.',
      entrega: { acao: 'dar', prop: 'carta', falas: [['Padre Zacarias', '«Não faleis mal uns dos outros, irmãos.» Vou queimá-las no braseiro da sacristia. E domingo vou pregar sobre a língua. Os dois lados vão achar que é para o outro.']] },
      depois: 'Não apareceram mais cartas. Agora as pessoas falam mal umas das outras na cara, o que já é um progresso.' });
    // ---- Lívia, a tecelã, e a lançadeira roubada
    const colLanc = { id: 'm5_lanc', missao: 'a5s2', etapa: 0, pontos: ACH.lancadeira, modelo: 'lancadeira', nome: 'Lançadeira de Lívia', texto: 'Pegar a lançadeira', carga: 'lancadeira',
      guarda: [[['olho', 19, 'forte'], ['serpe', 18], ['serpe', 18]]] };
    AV.coleta(colLanc);
    AV.missao({ id: 'a5s2', ato: 5, nome: 'A Lançadeira de Lívia', npc: 'livia', xp: 210, den: 50, itens: [['pao', 2]], requer: () => MS.feita('a5m1'),
      etapas: ['Recupere a lançadeira de Lívia, jogada nos campos a leste de Valbaixo.', 'Leve a lançadeira a Lívia.'],
      alvos: [aj.proximo(colLanc), aj.ondeFig('livia')],
      convite: 'Ganhei o prêmio da feira com um pano azul, e no dia seguinte a minha lançadeira sumiu. Alguém daqui mesmo, de Valbaixo, não aguentou. Jogaram nos campos do leste, onde os olhos verdes rondam. Sem ela eu não teço.',
      aceitar: 'Eu trago a sua lançadeira.', aceito: 'Nos campos a leste da aldeia, perto do regato. Tome cuidado: dizem que um olho enorme vigia o lugar.',
      lembrete: 'A lançadeira está nos campos a leste de Valbaixo.',
      agradece: 'A minha lançadeira! Inteira! Não vou nem perguntar quem jogou.',
      entrega: { acao: 'dar', prop: 'lancadeira', falas: [['Lívia, a tecelã', 'Tome este manto. Teci com fio de Montalto, que um moleiro me deu escondido. É o melhor pano que já fiz, e não vou mandar para nenhuma feira.']] },
      aoConcluir: () => { if (!IT.qtd('mantoLivia')) IT.dar('mantoLivia', 1); },
      depois: 'Estou tecendo a toalha do altar de São João. Comprida o bastante para as duas metades da igreja.' });
    // ---- Bruno e Davi, os dois irmãos separados pelo muro
    AV.missao({ id: 'a5s3', ato: 5, nome: 'Os Dois Irmãos', npc: 'bruno', receptor: 'davi', xp: 200, den: 60, itens: [['tercoPeregrino', 1]], requer: () => MS.feita('a5m1'),
      etapas: ['Leve a carta de Bruno ao irmão, Davi, em Valbaixo.'],
      alvos: [aj.ondeFig('davi')],
      convite: 'O meu pai morreu e deixou a casa para mim e o barco para o meu irmão, Davi. Eu achei que o barco valia mais. Ele achou que a casa valia mais. Ele foi morar em Valbaixo e o muro subiu entre nós. Escrevi esta carta cem vezes.',
      aceitar: 'Eu levo a carta.', aceito: 'Davi mora em Valbaixo, na casa a sudoeste da praça. Se ele rasgar a carta, não me conte.',
      lembrete: 'Davi mora em Valbaixo, a sudoeste da praça.',
      agradece: '...Uma carta do Bruno? Deixe eu ler. Sozinho.',
      entrega: { acao: 'ler', prop: 'carta', dur: 2.6, falas: [['Davi, o irmão mais novo', '"Fique com a casa também. Eu só quero o meu irmão." ...Ele escreveu isso? Diga a ele que o barco está na beira do lago, esperando os dois para pescar. Tome, para o caminho.']] },
      depois: 'Bruno e eu pescamos juntos no domingo. Não pegamos nada. Foi o melhor domingo em dois anos.' });
    AV.carga('carta', () => MS.ativa('a5s3') && MS.etapa('a5s3') === 0, 'a5s3');
    // ---- o Velho Noé e a Cisterna dos Rancores
    AV.npc('noe', 'Velho Noé, o guarda da cisterna', L.noe.x, L.noe.z, -Math.PI * 0.75, { cor: 0x3a3a2a, cabelo: 0xd8d4cc });
    AV.masmorra({ id: 'cisterna', nome: 'Cisterna dos Rancores', x: L.cisterna.x, z: L.cisterna.z, rot: L.cisterna.rot, regiao: 'muros', estilo: 'rocha', tema: 'cripta',
      salasDef: [{ inimigos: [['serpe', 20], ['serpe', 20], ['olho', 20], ['invejoso', 20]] }, { inimigos: [['muralha', 21, 'forte'], ['olho', 21], ['serpe', 21], ['invejoso', 21]] }, { chefe: ['hidra', 22], inimigos: [['serpe', 21], ['serpe', 21]] }],
      tesouro: { den: [200, 260], itens: [['agua', 3], ['vela', 2]], equip: true, raro: 0.75 } });
    AV.missao({ id: 'mu_cisterna', ato: 5, nome: 'A Cisterna dos Rancores', npc: 'noe', xp: 380, den: 120, itens: [['agua', 2]], requer: () => MS.feita('a5m1'),
      etapas: [() => `Purifique a Cisterna dos Rancores, a noroeste, perto do moinho de Montalto (salas: ${AV.salasLivres('cisterna')}/3).`, 'Leve o cântaro das duas aldeias ao Velho Noé.'],
      alvos: [aj.entradaDe('cisterna'), aj.ondeFig('noe')],
      convite: 'Antes do muro, as duas aldeias tiravam água da mesma cisterna, com o mesmo cântaro de barro. Quando brigaram, cada uma fez o seu poço, e jogaram o cântaro lá dentro. A água parada criou um bicho de três cabeças, que só sabe acusar.',
      aceitar: 'Eu desço à cisterna.', aceito: 'A hidra fica na última sala. Cada cabeça grita uma coisa diferente: não escute nenhuma.',
      aoAceitar: aj.jaFeita('mu_cisterna', 'cisterna'),
      lembrete: () => `A cisterna continua escura (salas: ${AV.salasLivres('cisterna')}/3).`,
      agradece: 'O cântaro! Rachado, mas inteiro. Bebi água dele quando era menino, junto com os meninos de baixo.',
      entrega: { acao: 'dar', prop: 'balde', falas: [['Velho Noé, o guarda da cisterna', 'Vou enchê-lo e deixar na Porta do Meio. Quem quiser beber, que beba. Tome isto, que é tudo o que um velho guarda tem.']] },
      depois: 'Deixo o cântaro cheio na Porta do Meio todo dia. Bebem os de cima e os de baixo. Às vezes ao mesmo tempo.' });
    aj.ligarMasmorra('mu_cisterna', 'cisterna');
    AV.carga('balde', () => MS.ativa('mu_cisterna') && MS.etapa('mu_cisterna') === 1, 'mu_cisterna');
    // ---- os Irmãos da Ponte de São Benedito
    AV.npc('benedito', 'Mestre Benedito, o pontífice', L.benedito.x - 1.2, L.benedito.z + 1, -Math.PI / 2, { cor: 0x3a4a5a, cabelo: 0x8a8070 });
    AV.guilda({ id: 'ponte', nome: 'Irmãos da Ponte de São Benedito', curto: 'Irmãos da Ponte', regiao: 'muros', ato: 5, mestre: 'benedito', ondeMestre: 'junto ao quadro dos irmãos, a leste de Valbaixo',
      quadro: { x: L.benedito.x + 1.8, z: L.benedito.z + 1.2, rot: -Math.PI / 2 }, cor: 0x2a4a5a, titulos: ['Aprendiz da Ponte', 'Oficial da Ponte', 'Mestre Pontífice'],
      convite: 'Os Irmãos da Ponte faziam pontes onde os outros faziam muros. São Benedito de Avinhão era um pastorzinho, e convenceu uma cidade inteira a atravessar um rio. Quer ser dos nossos? Vença vinte vícios aqui na Vila dos Muros.',
      contratos: [
        { nome: 'Caminhos livres', tipo: 'vencer', n: 20, txt: 'Vença ou liberte vinte vícios na Vila dos Muros', xp: 220, den: 80, fala: 'Vinte! Já dá para andar de uma aldeia à outra. Você é Aprendiz da Ponte.' },
        { nome: 'As pedras escondidas', tipo: 'baus', n: 3, txt: 'Abra três baús escondidos pela Vila dos Muros', xp: 240, den: 70, itens: [['vela', 3]], fala: 'Boas pedras para a fundação. Você é Oficial da Ponte.' },
        { nome: 'A cisterna', tipo: 'masmorra', masmorra: 'cisterna', txt: 'Purifique a Cisterna dos Rancores', xp: 320, den: 140, itens: [['pedraPonte', 1]], fala: 'A hidra caiu! Tome a pedra da ponte de São Benedito: onde ela estiver, alguém vai conseguir atravessar. Você é Mestre Pontífice.' }
      ] });
    AV.ligarNpcs();
  }
  function MAT0() { return M.MAT; }
})(window.OV);

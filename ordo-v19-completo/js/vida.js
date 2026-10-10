/* Ordo Virtutum — gente que vive: NPCs que andam, sinais de missão (! e ?), o Anjo da Guarda visível e os santos reconhecíveis */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const MS = OV.missoes, P = OV.P, T = OV.tempo;
  const sm = OV.sm, mesh = OV.mesh;
  const { rnd, turnTo } = OV.util;
  const F = () => (OV.jogo.prog && OV.jogo.prog.flags) || {};
  const st = id => OV.jogo.prog && OV.jogo.prog.missoes ? OV.jogo.prog.missoes[id] : null;
  const ativa = MS.ativa, feita = MS.feita, etapa = MS.etapa;

  /* ================= SINAIS SOBRE A CABEÇA ================= */
  // "!" = tem missão para oferecer · "?" = é com esta pessoa que a missão continua ou termina
  const SINAL = {
    tome: () => (ativa('m1') && etapa('m1') === 0) || (ativa('s6') && etapa('s6') === 0 && F().tome_capela) ? '?' : (ativa('m3') && !F().tome_m3) ? '!' : null,
    matias: () => !st('s6') ? '!' : (ativa('s6') && etapa('s6') === 1) ? '?' : null,
    lia: () => !st('s5') ? '!' : (ativa('s5') && F().carvao) ? '?' : null,
    aldeao: () => !st('s3') ? '!' : (ativa('s3') && etapa('s3') === 1) ? '?' : null,
    joaquim: () => !st('s2') ? '!' : null,
    bartolomeu: () => !st('s1') ? '!' : (F().roda_solta && !feita('s1')) ? '?' : null,
    afonso: () => !F().rosario ? '!' : null,
    gaspar: () => (ativa('a2m1') && etapa('a2m1') <= 1) || (ativa('a2m2') && etapa('a2m2') === 1) || (ativa('a2m3') && etapa('a2m3') === 2) ? '?' : null,
    barao: () => (ativa('a2m3') && etapa('a2m3') === 1) ? '?' : null,
    lucia: () => !st('a2s2') ? '!' : (ativa('a2s2') && F().farinha) ? '?' : null,
    tiago: () => !feita('a2s3') ? (st('a2s3') ? '?' : '!') : null,
    pedro: () => !st('a2s1') ? '!' : (ativa('a2s1') && etapa('a2s1') === 1) ? '?' : null,
    ana: () => (ativa('a2s4') && etapa('a2s4') === 1) ? '?' : null,
    rufino: () => (ativa('a2s2') && !F().farinha) || (ativa('a2s3') && !F().pao_tiago) ? '?' : null
  };
  MS.sinal = id => SINAL[id] ? SINAL[id]() : null;
  function texturaSinal(ch, cor) {
    return M.canvasTex(64, 96, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.font = 'bold 84px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = '#1a0e08'; g.strokeText(ch, w / 2, h / 2 + 4);
      g.fillStyle = cor; g.fillText(ch, w / 2, h / 2 + 4);
    });
  }
  const TEX = { '!': texturaSinal('!', '#ffd24a'), '?': texturaSinal('?', '#e8e4d8') };
  Object.values(TEX).forEach(t => { t.repeat.set(1, 1); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
  const sinais = {};
  function sinalDe(id) {
    if (sinais[id]) return sinais[id];
    const fig = M.figuras[id]; if (!fig) return null;
    const mat = new THREE.SpriteMaterial({ map: TEX['!'], transparent: true, depthTest: false, fog: false });
    const s = new THREE.Sprite(mat); s.scale.set(0.55, 0.82, 1); s.position.set(0, 2.95, 0); s.renderOrder = 10; s.visible = false;
    fig.g.add(s); sinais[id] = { s, mat, atual: null };
    return sinais[id];
  }
  let sinalT = 0;
  function atualizarSinais(dt, t) {
    sinalT -= dt; if (sinalT <= 0) {
      sinalT = 0.4;
      const jogando = OV.jogo.modo === 'jogo' && OV.jogo.prog && OV.jogo.prog.missoes;
      for (const id in SINAL) {
        const s = sinalDe(id); if (!s) continue;
        const fig = M.figuras[id];
        const v = jogando && fig.visivel && Math.hypot(fig.x - P.pos.x, fig.z - P.pos.z) < 60 ? SINAL[id]() : null;
        if (v !== s.atual) { s.atual = v; s.s.visible = !!v; if (v) { s.mat.map = TEX[v]; s.mat.needsUpdate = true; } }
      }
    }
    for (const id in sinais) { const s = sinais[id]; if (s.s.visible) s.s.position.y = 2.95 + Math.sin(t * 2.6) * 0.08; }
  }
  M.animados.push(atualizarSinais);

  /* ================= GENTE QUE ANDA ================= */
  // moradores sem missão que circulam pelas cidades
  const fig = (x, z, rot, op) => M.criarFigura(x, z, rot, op);
  const OZ = OV.porto ? OV.porto.OZ : 700, PW = OV.porto ? OV.porto.W : (x, z) => ({ x, z: z + OZ });
  const VX = M.SITIO ? M.SITIO.vila.x : 0, VZ = M.SITIO ? M.SITIO.vila.z : 150;
  [
    [VX + 7, VZ - 7, 0.3, { id: 'mor_vila1', nome: 'Aldeã do poço', cor: 0x6a4a3a, veu: 0x8a7a64 }, 'Desde que os sinos voltaram, a gente tira água cantando.', 'Dizem que o caminho para o mosteiro anda cheio de diabretes à noite.'],
    [VX - 10, VZ + 6, 2.0, { id: 'mor_vila2', nome: 'Lenhador', cor: 0x4a3a28, cabelo: 0x3a2a1a }, 'Na floresta de Vésperas há lobos cinzentos. E um lobo branco, enorme, que ninguém consegue caçar.', 'As árvores da floresta são velhas como o mosteiro.'],
    [VX + 11, VZ + 7, -1.0, { id: 'mor_vila3', nome: 'Menina do vale', cor: 0x7a3a3a, cabelo: 0x4a2a1a }, 'Você é cavaleiro de verdade? Ou frade? Ou os dois?', 'Minha avó diz que quem reza no Oratório nunca se perde.'],
    [PW(-6, 2).x, PW(-6, 2).z, 0.4, { id: 'mor_porto1', nome: 'Pescador', cor: 0x2a3a4a, cabelo: 0x6a6a60 }, 'O mar está calmo, mas a fome não.', 'Os corvos da estrada do norte ficaram maiores. Um deles tem penas cinzentas e é velho como o farol.'],
    [PW(22, -16).x, PW(22, -16).z, -0.4, { id: 'mor_porto2', nome: 'Mercadora', cor: 0x7a5a2a, veu: 0x9a7a4a }, 'Compre, compre! Ou não compre: hoje ninguém tem dinheiro mesmo.', 'Dizem que o Barão guardou moedas estranhas no pátio.'],
    [PW(-36, -30).x, PW(-36, -30).z, 1.2, { id: 'mor_porto3', nome: 'Mãe do bairro', cor: 0x4a3a34, veu: 0x5a5048 }, 'Meus filhos dormem cedo para não sentir fome.', 'Lúcia faz milagres com uma panela vazia.']
  ].forEach(([x, z, r, op, a, b]) => {
    fig(x, z, r, op);
    let k = 0; MS.ARV[op.id] = () => MS.linha(op.nome, (k++ % 2) ? b : a);
  });
  M.figuras.mor_vila3.g.scale.setScalar(0.72);
  // raio do perímetro de cada morador, medido a partir do seu lugar
  const PASSEIO = { aldea: 4, joaquim: 3, marinheiro: 4, tiago: 3, mor_vila1: 5, mor_vila2: 6, mor_vila3: 4, mor_porto1: 5, mor_porto2: 4, mor_porto3: 4 };
  const VEL = 0.85; // metros por segundo: passo de quem passeia
  const andantes = {};
  MS.ganchos.aplicar.push(() => {
    for (const id in PASSEIO) {
      const f = M.figuras[id]; if (!f) continue;
      const ant = andantes[id];
      // se o lugar dele não mudou, ele continua de onde estava (sem saltar de volta)
      if (ant && Math.hypot(ant.casa.x - f.x, ant.casa.z - f.z) < 0.1 && ant.pos) { f.mover(ant.pos.x, ant.pos.z, ant.pos.rot); ant.alvo = null; continue; }
      andantes[id] = { casa: { x: f.x, z: f.z }, alvo: null, espera: rnd(1, 4), ph: Math.random() * 6, pos: null };
    }
  });
  function andar(dt) {
    if (OV.jogo.modo !== 'jogo') return;
    for (const id in andantes) {
      const f = M.figuras[id], a = andantes[id]; if (!f || !f.visivel) continue;
      if (f.destino) { a.casa = { x: f.destino.x, z: f.destino.z }; a.alvo = null; a.pos = null; a.espera = 2; continue; } // está indo para outro lugar
      if (Math.hypot(f.x - P.pos.x, f.z - P.pos.z) > 70) continue;
      const dj = Math.hypot(f.x - P.pos.x, f.z - P.pos.z), perto = dj < 3.2;
      if (perto || OV.dialogo.aberto) {
        // parado: só vira o rosto para quem chega, sem sair do lugar
        if (perto) { const ang = Math.atan2(P.pos.x - f.x, P.pos.z - f.z); f.mover(f.x, f.z, turnTo(f.rot, ang, 3 * dt)); }
        a.alvo = null; a.espera = Math.max(a.espera, 1.5); a.pos = { x: f.x, z: f.z, rot: f.rot };
        continue;
      }
      if (a.espera > 0) { a.espera -= dt; continue; }
      if (!a.alvo) {
        // escolhe um ponto dentro do perímetro, longe do jogador, e que não caia dentro de um obstáculo
        for (let k = 0; k < 6 && !a.alvo; k++) {
          const ang = Math.random() * Math.PI * 2, r = (0.3 + 0.7 * Math.sqrt(Math.random())) * PASSEIO[id];
          const q = { x: a.casa.x + Math.cos(ang) * r, z: a.casa.z + Math.sin(ang) * r };
          if (Math.hypot(q.x - P.pos.x, q.z - P.pos.z) < 5) continue;
          const t = { x: q.x, z: q.z }; M.collide(t, 0.45); if (Math.hypot(t.x - q.x, t.z - q.z) > 0.05) continue;
          a.alvo = q;
        }
        if (!a.alvo) { a.espera = rnd(2, 4); continue; }
        a.tentativa = 2.5 * PASSEIO[id] / VEL + 2;
      }
      const dx = a.alvo.x - f.x, dz = a.alvo.z - f.z, d = Math.hypot(dx, dz);
      a.tentativa -= dt;
      if (d < 0.4 || a.tentativa <= 0) { a.alvo = null; a.espera = rnd(2, 6); continue; }
      const rot = turnTo(f.rot, Math.atan2(dx, dz), 5 * dt);
      const passo = Math.min(VEL * dt, d);
      const p = { x: f.x + Math.sin(rot) * passo, z: f.z + Math.cos(rot) * passo };
      // desvia de paredes e árvores, sem contar o próprio corpo (o círculo dele sai do caminho por um instante)
      const o = f.obst, ox = o ? o.x : 0; if (o) o.x = 1e9;
      M.collide(p, 0.45); if (o) o.x = ox;
      // nunca sai do perímetro nem dá saltos
      const salto = Math.hypot(p.x - f.x, p.z - f.z);
      if (salto > VEL * dt * 1.5 + 0.02 || Math.hypot(p.x - a.casa.x, p.z - a.casa.z) > PASSEIO[id] + 0.5) { a.alvo = null; a.espera = rnd(1.5, 3); continue; }
      f.mover(p.x, p.z, rot); a.pos = { x: p.x, z: p.z, rot };
      a.ph += dt * 7;
    }
  }
  M.animados.push(andar);

  /* ================= O ANJO DA GUARDA ================= */
  const anjo = (function () {
    const g = new THREE.Group();
    const mats = [];
    const basic = (cor, op) => { const m = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, depthWrite: false }); m.userData.op = op === undefined ? 1 : op; mats.push(m); return m; };
    const veste = basic(0xf6f0e0), dourado = basic(0xe8c060), pele = basic(0xf0d6bc), cabelo = basic(0xd8b070);
    const asa = basic(0xfff8e8, 0.85); asa.side = THREE.DoubleSide;
    const brilho = basic(0xffe6a8, 0.25); brilho.blending = THREE.AdditiveBlending;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.55, 1.7, 10), veste).translateY(0.95));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.36), veste).translateY(1.85));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 5, 16), dourado).translateY(1.62).rotateX(Math.PI / 2));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), pele).translateY(2.28));
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), cabelo); cab.position.set(0, 2.33, -0.04); g.add(cab);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 6, 24), dourado); halo.position.set(0, 2.62, -0.08); halo.rotation.x = Math.PI / 2.4; g.add(halo);
    [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.16), veste); b.position.set(0.3 * s, 1.72, 0.08); b.rotation.x = -0.6; g.add(b); });
    const asas = [-1, 1].map(s => {
      const piv = new THREE.Group(); piv.position.set(0.12 * s, 1.95, -0.2);
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(0.9 * s, 0.7, 1.5 * s, 0.4); shape.quadraticCurveTo(1.3 * s, -0.5, 0.9 * s, -1.4); shape.quadraticCurveTo(0.5 * s, -0.9, 0, -0.5); shape.closePath();
      const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), asa); m.rotation.y = -0.35 * s; piv.add(m); g.add(piv); return piv;
    });
    const aura = new THREE.Mesh(new THREE.SphereGeometry(1.5, 14, 10), brilho); aura.position.y = 1.5; g.add(aura);
    g.visible = false; M.scene.add(g);
    const luz = M.emissor(0, 0, 0, 0, 9, 0xffe6b0, false);
    const A = { g, op: 0, alvo: 0 };
    A.fala = quem => { A.alvo = /Anjo/.test(quem || '') ? 1 : 0; };
    M.animados.push((dt, t) => {
      A.op += (A.alvo - A.op) * Math.min(1, dt * 4);
      const vis = A.op > 0.02; g.visible = vis; luz.int = vis ? 1.6 * A.op : 0;
      if (!vis) return;
      const ang = P.facing - 0.75, d = 2.3;
      const x = P.pos.x + Math.sin(ang) * d, z = P.pos.z + Math.cos(ang) * d;
      g.position.set(x, M.altura(x, z) + 0.45 + Math.sin(t * 1.6) * 0.12, z);
      g.rotation.y = Math.atan2(P.pos.x - x, P.pos.z - z);
      asas.forEach((p, i) => { p.rotation.y = (i ? -1 : 1) * (0.25 + Math.sin(t * 2) * 0.12); });
      halo.rotation.z += dt * 0.6;
      luz.x = x; luz.y = g.position.y + 1.8; luz.z = z;
      mats.forEach(m => { m.opacity = m.userData.op * A.op; });
    });
    return A;
  })();
  OV.anjo = anjo;

  /* ================= OS SANTOS, COMO A IGREJA OS RETRATA ================= */
  function brilhoSanto(mat) { mat.emissive = new THREE.Color(0x3a2a14); mat.emissiveIntensity = 0.6; return mat; }
  function aureola(g, y) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, y, -0.1); g.add(h);
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); d.position.set(0, y, -0.12); g.add(d);
  }
  const SANTOS = {
    // Santo Antão: o pai dos monges — hábito escuro com o Tau azul, barba branca, cajado em Tau com a sineta e o porquinho aos pés
    antao(g) {
      const habito = brilhoSanto(sm(0x2a2220)), pele = brilhoSanto(sm(0xd8b498)), branco = brilhoSanto(sm(0xece8e0)), azul = brilhoSanto(sm(0x3a6aa8)), madeira = sm(0x5a4028), bronze = sm(0xb08a3a, { metalness: 0.7, roughness: 0.4 });
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.45, 8), habito, 0, 0.95, 0));
      g.add(mesh(new THREE.BoxGeometry(0.66, 0.6, 0.42), habito, 0, 1.6, 0));
      g.add(mesh(new THREE.SphereGeometry(0.26, 9, 8), habito, 0, 2.02, -0.08));
      g.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), pele, 0, 1.98, 0.04));
      g.add(mesh(new THREE.BoxGeometry(0.26, 0.5, 0.14), branco, 0, 1.68, 0.14)); // barba longa
      g.add(mesh(new THREE.BoxGeometry(0.16, 0.04, 0.02), azul, -0.22, 1.72, 0.22)); g.add(mesh(new THREE.BoxGeometry(0.04, 0.16, 0.02), azul, -0.22, 1.66, 0.22));
      const cj = new THREE.Group(); cj.position.set(0.42, 0, 0.12);
      cj.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.2, 6), madeira, 0, 1.1, 0)); cj.add(mesh(new THREE.BoxGeometry(0.42, 0.07, 0.07), madeira, 0, 2.2, 0));
      cj.add(mesh(new THREE.ConeGeometry(0.07, 0.14, 8), bronze, 0.2, 2.06, 0)); g.add(cj);
      const porco = new THREE.Group(); porco.position.set(-0.6, 0, 0.45); porco.rotation.y = 0.6;
      const rosa = sm(0xd89a8a);
      porco.add(mesh(new THREE.SphereGeometry(0.22, 8, 6), rosa, 0, 0.26, 0)); porco.children[0].scale.set(1, 0.85, 1.4);
      porco.add(mesh(new THREE.SphereGeometry(0.12, 7, 5), rosa, 0, 0.32, 0.28)); porco.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 8), rosa, 0, 0.3, 0.39)).children;
      [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]].forEach(([x, z]) => porco.add(mesh(new THREE.BoxGeometry(0.05, 0.14, 0.05), rosa, x, 0.07, z)));
      g.add(porco);
      aureola(g, 2.34);
    },
    // São Nicolau: bispo de Mira — alva branca, capa vermelha com bordas de ouro, mitra, báculo e o livro com as três bolsas de ouro
    nicolau(g) {
      const alva = brilhoSanto(sm(0xf0ece2)), capa = brilhoSanto(sm(0x9a1a1a)), ouro = brilhoSanto(sm(0xd8b048, { metalness: 0.6, roughness: 0.35 })), pele = brilhoSanto(sm(0xd8b498)), branco = brilhoSanto(sm(0xf2f0ea));
      g.add(mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.45, 8), alva, 0, 0.95, 0));
      const c = mesh(new THREE.CylinderGeometry(0.42, 0.6, 1.3, 8, 1, true), capa, 0, 1.25, -0.02); g.add(c);
      g.add(mesh(new THREE.BoxGeometry(0.7, 0.55, 0.44), capa, 0, 1.68, 0));
      g.add(mesh(new THREE.BoxGeometry(0.14, 1.3, 0.03), ouro, 0, 1.2, 0.24)); // estola de ouro
      g.add(mesh(new THREE.SphereGeometry(0.19, 9, 8), pele, 0, 2.02, 0.03));
      g.add(mesh(new THREE.BoxGeometry(0.28, 0.32, 0.14), branco, 0, 1.84, 0.13)); // barba branca
      const mitra = new THREE.Group(); mitra.position.set(0, 2.22, 0);
      mitra.add(mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.5, 4), branco, 0, 0.2, 0)); mitra.children[0].rotation.y = Math.PI / 4; mitra.children[0].scale.set(1, 1, 0.7);
      mitra.add(mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), ouro, 0, 0.2, 0.12)); mitra.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), ouro, 0, 0.0, 0.12));
      g.add(mitra);
      const bac = new THREE.Group(); bac.position.set(0.45, 0, 0.12);
      bac.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 2.3, 6), ouro, 0, 1.15, 0));
      const volta = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 5, 14, Math.PI * 1.4), ouro); volta.position.set(0.08, 2.35, 0); volta.rotation.z = -0.4; bac.add(volta);
      g.add(bac);
      const livro = new THREE.Group(); livro.position.set(-0.36, 1.32, 0.3); livro.rotation.x = -0.5;
      livro.add(mesh(new THREE.BoxGeometry(0.34, 0.06, 0.42), capa, 0, 0, 0));
      [-0.09, 0, 0.09].forEach((x, i) => livro.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), ouro, x, 0.08, -0.08 + i * 0.08)));
      g.add(livro);
      aureola(g, 2.82);
    }
  };
  OV.modeloSanto = SANTOS;
  function vestirSanto(id, tipo) {
    const f = M.figuras[id]; if (!f) return;
    const manter = []; f.g.children.forEach(c => { if (c.isSprite) manter.push(c); });
    while (f.g.children.length) f.g.remove(f.g.children[0]);
    SANTOS[tipo](f.g);
    manter.forEach(c => f.g.add(c));
  }
  const santosLuz = ['antao', 'nicolau'];
  OV.vida = { SINAL, PASSEIO, vestirSanto, santosLuz };
  vestirSanto('antao', 'antao');
  vestirSanto('nicolau', 'nicolau');
  // quando um santo aparece, uma luz dourada o acompanha
  const luzSanto = M.emissor(0, 0, 0, 0, 10, 0xffe2a8, false);
  M.animados.push(() => {
    let alvo = null;
    santosLuz.forEach(id => { const f = M.figuras[id]; if (f && f.visivel) alvo = f; });
    luzSanto.int = alvo ? 1.8 : 0;
    if (alvo) { luzSanto.x = alvo.x; luzSanto.y = M.altura(alvo.x, alvo.z) + 2.4; luzSanto.z = alvo.z + 0.6; }
  });
})(window.OV);

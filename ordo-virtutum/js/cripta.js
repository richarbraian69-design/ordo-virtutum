/* Ordo Virtutum — a Cripta de Santa Sabina e o Demônio do Meio-Dia
   A cripta fica numa área separada do mapa (x ≈ 300): Ossuário → Sala dos Monges → Câmara do Meio-Dia */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { lerp, rnd, angWrap } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene;
  // v21: a Câmara do Meio-Dia ficou bem maior (raio 22 m), e o ossuário e a sala dos monges, mais largos
  const X = 300, R = 22, CZ = -24 - R;
  const CR = { X, CZ, R, iniciado: false, fase: 0, chefe: null };
  OV.cripta = CR;

  /* ---- chão e teto ---- */
  CR.altura = function (x, z) {
    if (z >= 60) return 0;
    if (z >= 52) return -2 + 2 * (z - 52) / 8;
    if (z >= 22) return -2;
    if (z >= 18) return -4 + 2 * (z - 18) / 4;
    if (z >= -12) return -4;
    if (z >= -22) return -6 + 2 * (z + 22) / 10;
    return -6;
  };
  CR.teto = function (x, z) {
    if (z >= 22) return CR.altura(x, z) + 4.4;
    if (z >= -12) return 3;
    if (z >= -22) return CR.altura(x, z) + 4.2;
    return 5;
  };

  /* ---- materiais ---- */
  const wallTex = M.canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#0c0807'; g.fillRect(0, 0, w, h); const bw = 16, bh = 8;
    for (let r = 0; r < h / bh; r++) { const off = (r % 2) * bw / 2; for (let x = -bw; x < w; x += bw) { g.fillStyle = `hsl(24,10%,${rnd(11, 18) | 0}%)`; g.fillRect(x + off + 1, r * bh + 1, bw - 2, bh - 2); } }
  }, 3, 2);
  const floorTex = M.canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#0e0a09'; g.fillRect(0, 0, w, h); const s = 16;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = `hsl(20,8%,${rnd(10, 17) | 0}%)`; g.fillRect(x + 1, y + 1, s - 2, s - 2); }
  }, 4, 4);
  const wall = sm(0xffffff, { map: wallTex, roughness: 1 });
  const chao = sm(0xffffff, { map: floorTex, roughness: 1 });
  const teto = sm(0x0b0807, { side: THREE.DoubleSide });
  const osso = sm(0xb9ad94, { roughness: 0.8 });
  const col = sm(0x5a4e44);
  const ferro = sm(0x222225, { metalness: 0.6, roughness: 0.5 });
  const flame = new THREE.MeshBasicMaterial({ color: 0xffb347 });

  function parede(x1, z1, x2, z2, y0, h) {
    const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    scene.add(mesh(new THREE.BoxGeometry(w, h, d), wall, cx, y0 + h / 2, cz));
    return M.caixa(cx, cz, w / 2, d / 2, 0);
  }
  function piso(x1, z1, x2, z2) {
    // piso inclinado acompanha CR.altura em faixas de 1 unidade
    for (let z = z1; z < z2; z += 1) {
      const y = (CR.altura(0, z) + CR.altura(0, z + 1)) / 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.2, 1.02), chao); m.position.set((x1 + x2) / 2, y - 0.1, z + 0.5); m.receiveShadow = true; scene.add(m);
    }
  }
  function tampa(x1, z1, x2, z2, y) { const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, 0.6, z2 - z1), teto); m.position.set((x1 + x2) / 2, y + 0.3, (z1 + z2) / 2); m.castShadow = true; scene.add(m); }
  function tocha(x, z, lado) {
    const y = CR.altura(x, z);
    scene.add(mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), ferro, x, y + 2.1, z));
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 5), flame); f.position.set(x, y + 2.45, z); scene.add(f); M.flames.push(f);
    M.emissor(x + lado * 0.4, y + 2.4, z, 1.3, 9, 0xff8a34);
  }

  /* A: escada de entrada */
  parede(296.2, 50, 297, 61.2, -2, 6); parede(303, 50, 303.8, 61.2, -2, 6); parede(296.2, 61.2, 303.8, 62, -2, 6);
  piso(297, 50, 303, 61.2); tampa(296.2, 50, 303.8, 62, 3.4);
  for (let z = 52; z < 60; z += 1) scene.add(mesh(new THREE.BoxGeometry(6, 0.12, 0.12), col, X, CR.altura(0, z) + 0.06, z));
  tocha(297.4, 56, 1); tocha(302.6, 56, -1);
  /* B: ossuário */
  parede(293.9, 22, 294.7, 50, -2, 4.6); parede(305.3, 22, 306.1, 50, -2, 4.6);
  parede(294.7, 49.2, 297, 50, -2, 4.6); parede(303, 49.2, 305.3, 50, -2, 4.6);
  piso(294.7, 22, 305.3, 50); tampa(293.9, 22, 306.1, 50, 2.4);
  for (let z = 25; z < 49; z += 3.2) [-1, 1].forEach(s => {
    const x = X + s * 5.15;
    scene.add(mesh(new THREE.BoxGeometry(0.25, 1.2, 2.2), sm(0x080605), x, -0.4, z));
    for (let k = 0; k < 3; k++) scene.add(mesh(new THREE.SphereGeometry(0.13, 6, 5), osso, x - s * 0.08, -0.85 + (k % 2) * 0.35, z - 0.6 + k * 0.6));
  });
  for (let z = 26; z < 50; z += 8) { tocha(295.1, z, 1); tocha(304.9, z + 4, -1); }
  /* rampa B→C */
  parede(296.2, 17.6, 297, 22, -4, 7); parede(303, 17.6, 303.8, 22, -4, 7);
  parede(293.9, 21.6, 297, 22.4, -4, 7); parede(303, 21.6, 306.1, 22.4, -4, 7);
  piso(297, 17.6, 303, 22); tampa(296.2, 17.6, 303.8, 22, 2.4);
  /* C: sala dos monges */
  parede(286.2, -12, 287, 18, -4, 7); parede(313, -12, 313.8, 18, -4, 7);
  parede(286.2, 18, 297, 18.8, -4, 7); parede(303, 18, 313.8, 18.8, -4, 7);
  parede(286.2, -12.8, 297, -12, -4, 7); parede(303, -12.8, 313.8, -12, -4, 7);
  piso(287, -12, 313, 18); tampa(286.2, -12.8, 313.8, 18.8, 3);
  [[292, 12], [308, 12], [292, 2], [308, 2], [292, -8], [308, -8]].forEach(([x, z]) => {
    scene.add(mesh(new THREE.CylinderGeometry(0.42, 0.5, 7, 8), col, x, -0.5, z)); M.obstacles.push({ x, z, r: 0.55 });
  });
  [[289, 6], [311, -3]].forEach(([x, z]) => { scene.add(mesh(new THREE.BoxGeometry(1.4, 0.9, 2.6), col, x, -3.55, z)); M.obstacles.push({ x, z, r: 1.1 }); });
  scene.add(mesh(new THREE.BoxGeometry(1.6, 1.0, 0.8), sm(0x3a2a1c), 310.5, -3.5, 14)); M.obstacles.push({ x: 310.5, z: 14, r: 0.9 });
  scene.add(mesh(new THREE.BoxGeometry(0.5, 0.08, 0.36), sm(0x6e1414), 310.5, -2.95, 14));
  tocha(287.4, 8, 1); tocha(312.6, 8, -1); tocha(287.4, -6, 1); tocha(312.6, -6, -1);
  /* D: corredor para a câmara */
  parede(296.2, -22, 297, -12, -6, 6); parede(303, -22, 303.8, -12, -6, 6);
  piso(297, -24.5, 303, -12); tampa(296.2, -22, 303.8, -12, 2.2);
  tocha(297.4, -17, 1);
  /* portão de ferro (fecha durante a luta) */
  const grade = new THREE.Group(); grade.position.set(X, -6, -22.4); scene.add(grade);
  for (let i = -3; i <= 3; i++) grade.add(mesh(new THREE.BoxGeometry(0.1, 4, 0.1), ferro, i * 0.85, 2, 0));
  grade.add(mesh(new THREE.BoxGeometry(6, 0.12, 0.12), ferro, 0, 3.6, 0));
  grade.visible = false;
  const portao = M.caixa(X, -22.4, 3, 0.3, 0); portao.ativa = false;
  CR.fecharPortao = b => { grade.visible = b; portao.ativa = b; };

  /* E: câmara do meio-dia (círculo de 24 segmentos, aberto ao norte) */
  const NSEG = 24, LSEG = 2 * Math.PI * (R + 0.4) / NSEG + 0.25;
  for (let i = 0; i < NSEG; i++) {
    const a = i / NSEG * Math.PI * 2 + Math.PI / NSEG;
    if (Math.abs(angWrap(a - Math.PI / 2)) < 0.2) continue;
    const x = X + Math.cos(a) * (R + 0.4), z = CZ + Math.sin(a) * (R + 0.4), rot = -a - Math.PI / 2;
    const m = mesh(new THREE.BoxGeometry(LSEG, 11, 1), wall, x, -6 + 5.5, z); m.rotation.y = rot; scene.add(m);
    M.caixa(x, z, LSEG / 2, 0.5, rot);
  }
  // muro curto que fecha as laterais da entrada norte
  parede(290.2, -24.6, 297, -23.8, -6, 11); parede(303, -24.6, 309.8, -23.8, -6, 11);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(R + 0.6, 24), chao); disco.rotation.x = -Math.PI / 2; disco.position.set(X, -6.01, CZ); disco.receiveShadow = true; scene.add(disco);
  const anelTeto = new THREE.Mesh(new THREE.RingGeometry(2.6, R + 1.5, 24), teto); anelTeto.rotation.x = Math.PI / 2; anelTeto.position.set(X, 5, CZ); scene.add(anelTeto);
  // altar quebrado no fundo
  scene.add(mesh(new THREE.BoxGeometry(3, 1.1, 1.4), col, X, -5.45, CZ - R + 3)); M.obstacles.push({ x: X, z: CZ - R + 3, r: 1.4 });
  [[-13, -9], [13, -9], [-13, 9], [13, 9]].forEach(([dx, dz]) => tocha(X + dx, CZ + dz, 0));

  /* raio de sol do meio-dia */
  const raio = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 11, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  raio.position.set(X, -0.5, CZ); scene.add(raio);
  const poca = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  poca.rotation.x = -Math.PI / 2; poca.position.set(X, -5.95, CZ); scene.add(poca);
  const luzSol = M.emissor(X, -1, CZ, 2.6, 12, 0xffe9b0, false);
  CR.sol = { x: X, z: CZ };

  /* ---- os inimigos da cripta ---- */
  function makeMeioDia() {
    const g = new THREE.Group();
    const trapo = sm(0x9a8456, { emissive: 0x2a1c06 }), pele = sm(0x5a4a38), negro = sm(0x0a0806);
    const eye = new THREE.MeshBasicMaterial({ color: 0xfff4c8 });
    const manto = mesh(new THREE.ConeGeometry(0.7, 2.25, 8), trapo, 0, 1.475, 0); g.add(manto);
    const pernas = OV.andar.pernas(g, 0.22, 0.68, { coxa: 0.35, canela: 0.33, larg: 0.15, mat: pele, matPe: negro, pe: [0.17, 0.08, 0.3] });
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.7, 0.5), trapo, 0, 2.55, 0));
    g.add(mesh(new THREE.SphereGeometry(0.3, 8, 7), pele, 0, 3.15, 0.05));
    const disco = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.09, 6, 22), sm(0x6a4a10, { emissive: 0x3a2400, metalness: 0.6 })); disco.position.set(0, 3.2, -0.25); g.add(disco);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const r = mesh(new THREE.ConeGeometry(0.05, 0.45, 4), negro, Math.cos(a) * 0.95, 3.2 + Math.sin(a) * 0.95, -0.25); r.rotation.z = a - Math.PI / 2; g.add(r); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), eye); e.position.set(0.1 * s, 3.18, 0.32); g.add(e); });
    const arm = s => { const p = new THREE.Group(); p.position.set(0.55 * s, 2.75, 0); p.add(mesh(new THREE.BoxGeometry(0.16, 1.5, 0.16), pele, 0, -0.75, 0)); const c = mesh(new THREE.ConeGeometry(0.1, 0.5, 4), negro, 0, -1.65, 0); c.rotation.x = Math.PI; p.add(c); g.add(p); return p; };
    return { g, armL: arm(-1), armR: arm(1), mats: [trapo, pele], eye, eyeBase: 0xfff4c8, pernas, manto, passada: 0.75, marchaO: { A: 0.36, K: 0.55 } };
  }
  OV.FOES.meiodia = { key: 'meiodia', name: 'Demônio do Meio-Dia', nivel: 8, build: makeMeioDia, hp: 950, speed: 3.1, dmg: 27, windup: 0.72, recover: 0.85, range: 2.9, r: 0.8, height: 3.8, knock: 0.15, stagger: false, xp: 300, aggro: 40, leash: 60, status: 'preguica', chefe: true, fall: null };
  OV.FOES.sombra = { key: 'sombra', name: 'Demônio do Meio-Dia', nivel: 8, build: makeMeioDia, hp: 1, speed: 3.4, dmg: 16, windup: 0.8, recover: 1.0, range: 2.9, r: 0.8, height: 3.8, knock: 0.2, stagger: false, xp: 10, aggro: 40, leash: 60, status: 'preguica' };
  OV.FOES.abade = { key: 'abade', name: 'Abade Anselmo, possuído', nivel: 8, build: OV.makePossesso(0x111014, true), hp: 320, speed: 3.8, dmg: 19, windup: 0.55, recover: 0.8, range: 2.0, r: 0.5, height: 2.4, knock: 0.6, stagger: false, xp: 80, aggro: 40, leash: 60, liberta: true, chefe: true };

  function sombraDe(e, temSombra) { e.g.traverse(o => { if (o.isMesh) o.castShadow = temSombra; }); }

  OV.FOES.meiodia.ia = function (e) {
    if (e.state === 'dead' || !CR.iniciado) return;
    const max = e.def.hp;
    if (CR.fase === 1 && e.hp < max * 0.66) {
      CR.fase = 2; sombraDe(e, false);
      // os três surgem do lado oposto ao peregrino, em leque: o caminho de volta fica livre para ele escapar
      const P = OV.P, aj = Math.atan2(P.pos.z - CZ, P.pos.x - X) + Math.PI;
      const pos = [-0.75, 0, 0.75].map(k => { const a = aj + k; return { x: X + Math.cos(a) * (R * 0.55), z: CZ + Math.sin(a) * (R * 0.55) }; });
      e.g.position.set(pos[0].x, -6, pos[0].z);
      [1, 2].forEach(i => { const s = OV.inimigos.spawn('sombra', false, pos[i]); s.tag = 'sombra'; s.state = 'chase'; sombraDe(s, true); });
      OV.combate.faisca(e.g.position.x, -4, e.g.position.z, 0xfff1c8); OV.jogo.shake(0.3); OV.audio.bell(220, 0.25);
      OV.ui.toast('O demônio se divide em três. Ao meio-dia, só o verdadeiro não tem sombra.');
    }
    if (CR.fase === 2 && e.hp < max * 0.33) {
      CR.fase = 3;
      OV.inimigos.porTag('sombra').forEach(s => { if (s.state !== 'dead') { s.hp = 0; s.state = 'dead'; s.deadT = 0; s.lab.el.style.display = 'none'; } });
      e.state = 'dead'; e.deadT = 0; e.lab.el.style.display = 'none'; OV.combate.ganharXp(e.def.xp);
      const ab = OV.inimigos.spawn('abade', true, { x: X, z: CZ - 4 }); ab.tag = 'abade';
      OV.jogo.shake(0.5); OV.audio.bell(196, 0.3);
      OV.ui.toast('O demônio se esconde no corpo do Abade Anselmo! Vença-o sem tirar a vida dele.');
    }
  };

  /* ---- entrada, saída e encontros ---- */
  CR.entrar = function () {
    OV.combate.resetAcoes(); OV.combate.limparEfeitos();
    OV.combate.posicionar(X, 57.5, Math.PI); OV.cam.yaw = 0; OV.cam.pitch = 0.3;
    OV.habilidades.trazerAliados();
    CR.spawnInimigos();
  };
  CR.sair = function () {
    const ang = -Math.PI / 2; const fx = 27 + Math.sin(ang) * 4.6, fz = -12 + Math.cos(ang) * 4.6;
    OV.combate.resetAcoes(); OV.combate.posicionar(fx, fz, ang); OV.cam.yaw = ang + Math.PI;
    OV.habilidades.trazerAliados();
  };
  CR.spawnInimigos = function () {
    OV.inimigos.porTag('cripta').forEach(e => { if (!e.removed) { scene.remove(e.g); e.lab.el.remove(); } });
    OV.inimigos.lista = OV.inimigos.lista.filter(e => e.tag !== 'cripta');
    const f = OV.jogo.prog.flags;
    if (f.chefe_resolvido) return;
    const lista = [['larva', 300, 42], ['larva', 301.5, 31], ['possesso', 299, 26], ['diabrete', 295, 6], ['diabrete', 305, 1], ['diabrete', 300, -6], ['possesso', 294, -9], ['possesso', 306, 11]];
    lista.forEach(([t, x, z]) => { const e = OV.inimigos.spawn(t, false, { x, z }); e.tag = 'cripta'; if (t === 'possesso') e.sumir = true; });
  };
  CR.resetarChefe = function () {
    ['meiodia', 'sombra', 'abade', 'prova'].forEach(tag => OV.inimigos.porTag(tag).forEach(e => { if (!e.removed) { scene.remove(e.g); e.lab.el.remove(); e.removed = true; } }));
    OV.inimigos.lista = OV.inimigos.lista.filter(e => !['meiodia', 'sombra', 'abade', 'prova'].includes(e.tag));
    CR.iniciado = false; CR.fase = 0; CR.chefe = null; CR.fecharPortao(false);
  };
  CR.iniciarChefe = function () {
    CR.iniciado = true; CR.fase = 1; CR.fecharPortao(true);
    const b = OV.inimigos.spawn('meiodia', !(OV.cenas && OV.cenas.trocar('meiodia')), { x: X, z: CZ - 6 }); b.tag = 'meiodia'; CR.chefe = b;
    sombraDe(b, true);
    OV.audio.bell(147, 0.35);
  };

  /* ---- por quadro: o sol se move, a Preguiça pesa fora da luz ---- */
  let tSol = 0, parado = 0, avisou = false;
  CR.update = function (dt) {
    tSol += dt;
    const a = tSol * 0.16;
    CR.sol.x = X + Math.cos(a) * R * 0.5; CR.sol.z = CZ + Math.sin(a) * R * 0.5;
    raio.position.set(CR.sol.x, -0.5, CR.sol.z); poca.position.set(CR.sol.x, -5.95, CR.sol.z);
    luzSol.x = CR.sol.x; luzSol.z = CR.sol.z;
    raio.material.opacity = 0.15 + 0.04 * Math.sin(tSol * 2);
    const P = OV.P;
    if (P.pos.x < 200 || P.dead) return;
    const naCamara = P.pos.z < -24;
    if (!naCamara) { parado = 0; return; }
    const naLuz = Math.hypot(P.pos.x - CR.sol.x, P.pos.z - CR.sol.z) < 2.4;
    if (naLuz) {
      parado = 0;
      if (OV.jogo.prog.flags.graca_antao && P.praying) { P.invuln = Math.max(P.invuln, 0.15); P.hp = Math.min(P.D.maxHp, P.hp + 4 * dt); }
    } else if (CR.iniciado && P.moveAmt < 0.15 && P.dodgeT <= 0) {
      parado += dt;
      if (parado > 2) {
        P.status.preguica = Math.max(P.status.preguica || 0, 3); parado = 1.2;
        if (!avisou) { avisou = true; OV.ui.toast('Fora da luz, quem para é tomado pela Preguiça. Mova-se ou volte ao sol.'); }
      }
    } else parado = Math.max(0, parado - dt);
  };
})(window.OV);

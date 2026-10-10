/* Ordo Virtutum — o Vale de Santa Sabina: claustro, mosteiro, cripta, vila, floresta, capela, moinho, ermida */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { rnd } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, H = M.altura;

  /* ---- materiais e texturas ---- */
  const floorTex = M.canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#120d0c'; g.fillRect(0, 0, w, h); const s = 16;
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      g.fillStyle = `hsl(18,10%,${rnd(14, 23) | 0}%)`; g.fillRect(x + 1, y + 1, s - 2, s - 2);
      for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(0,0,0,${rnd(0.1, 0.35).toFixed(2)})`; g.fillRect((x + 1 + rnd(0, s - 4)) | 0, (y + 1 + rnd(0, s - 3)) | 0, 2, 1); }
    }
  }, 8, 8);
  const wallTex = M.canvasTex(64, 64, (g, w, h) => {
    g.fillStyle = '#100b0a'; g.fillRect(0, 0, w, h); const bw = 16, bh = 8;
    for (let r = 0; r < h / bh; r++) { const off = (r % 2) * bw / 2; for (let x = -bw; x < w; x += bw) { g.fillStyle = `hsl(26,12%,${rnd(18, 26) | 0}%)`; g.fillRect(x + off + 1, r * bh + 1, bw - 2, bh - 2); } }
  }, 4, 2);
  const glassTex = () => M.canvasTex(32, 64, (g, w, h) => {
    g.fillStyle = '#0a0606'; g.fillRect(0, 0, w, h);
    const cols = ['#7d1418', '#1b3a80', '#b88a2e', '#245c40', '#5a2470', '#a3361a'];
    for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x + 1, y + 1, 4, 4); }
    g.fillStyle = '#f0cf72'; g.fillRect(w / 2 - 2, 8, 4, h - 16); g.fillRect(8, 20, w - 16, 4);
  });
  const bannerTex = M.canvasTex(32, 64, (g, w, h) => {
    g.fillStyle = '#6e0f13'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a24a'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); g.fillRect(w - 2, 0, 2, h);
    g.fillRect(w / 2 - 2, 12, 4, 34); g.fillRect(8, 22, w - 16, 4);
    g.fillStyle = '#4a0a0d'; g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, h - 10); g.lineTo(w, h); g.fill();
  });
  const MAT = {
    stone: sm(0xffffff, { map: floorTex, roughness: 1 }),
    wall: sm(0xffffff, { map: wallTex, roughness: 1 }),
    col: sm(0x857766, { roughness: 0.9 }),
    colDark: sm(0x5c5045),
    wood: sm(0x2b1d14),
    woodL: sm(0x4a3422),
    roof: sm(0x1c1412),
    roofTile: sm(0x3a1e18),
    wax: sm(0xd9cfb4, { roughness: 0.6 }),
    bone: sm(0xcfc3a8, { roughness: 0.7 }),
    gold: sm(0xc9a24a, { metalness: 0.8, roughness: 0.35 }),
    iron: sm(0x232326, { metalness: 0.6, roughness: 0.5 }),
    rock: sm(0x5a5550),
    plaster: [sm(0x7d7364), sm(0x6e6457), sm(0x857a6a), sm(0x6a5f52)],
    dark: sm(0x0e0a09),
    flame: new THREE.MeshBasicMaterial({ color: 0xffb347 }),
    winLit: new THREE.MeshBasicMaterial({ color: 0x8a5a24 }),
    winDark: sm(0x120c0a)
  };
  M.MAT = MAT;

  function chama(x, y, z, s) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.055 * (s || 1), 0.17 * (s || 1), 5), MAT.flame); f.position.set(x, y, z); scene.add(f); M.flames.push(f); return f; }
  function vela(x, z, y, h) { scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, h, 6), MAT.wax, x, y + h / 2, z)); chama(x, y + h + 0.08, z); }
  function telhado(w, d, rh, mat, parede) {
    if (OV.cenario) return OV.cenario.telhado(w, d, rh, mat, parede);
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.4, 0); sh.lineTo(w / 2 + 0.4, 0); sh.lineTo(0, rh); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); g.translate(0, 0, -(d + 0.6) / 2);
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function grupo(x, z, rot, y) { const g = new THREE.Group(); g.position.set(x, y === undefined ? H(x, z) : y, z); g.rotation.y = rot || 0; scene.add(g); return g; }
  const frente = (x, z, rot, d) => ({ x: x + Math.sin(rot) * d, z: z + Math.cos(rot) * d });

  /* ---- Oratórios ---- */
  function criarOratorio(id, nome, x, z, rot) {
    const g = grupo(x, z, rot);
    g.add(mesh(new THREE.BoxGeometry(1.9, 3.1, 0.5), MAT.colDark, 0, 1.55, 0));
    g.add(mesh(new THREE.BoxGeometry(2.2, 0.3, 0.7), MAT.col, 0, 3.2, 0.05));
    g.add(mesh(new THREE.BoxGeometry(1.3, 0.12, 0.45), MAT.col, 0, 1.25, 0.4));
    g.add(mesh(new THREE.ConeGeometry(0.22, 0.95, 7), MAT.bone, 0, 1.78, 0.4));
    g.add(mesh(new THREE.SphereGeometry(0.12, 7, 6), MAT.bone, 0, 2.32, 0.4));
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 5, 18), MAT.gold); halo.position.set(0, 2.38, 0.48); g.add(halo);
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.05, 6), MAT.wood, 0.75, 0.52, 0.75));
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.38, 7), MAT.wax, 0.75, 1.24, 0.75));
    g.add(mesh(new THREE.BoxGeometry(1.0, 0.22, 0.4), MAT.wood, 0, 0.11, 1.25));
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), MAT.flame); fl.position.set(0.75, 1.55, 0.75); fl.visible = false; g.add(fl); M.flames.push(fl);
    const lp = frente(x, z, rot, 1.0);
    const luz = M.emissor(lp.x + Math.cos(rot) * 0.5, H(x, z) + 1.9, lp.z - Math.sin(rot) * 0.5, 0, 8, 0xffb060);
    M.obstacles.push({ x, z, r: 0.95 });
    const k = frente(x, z, rot, 1.75);
    const o = { id, nome, x: k.x, z: k.z, facing: rot + Math.PI, aceso: false, acender(b) { this.aceso = b; fl.visible = b; luz.int = b ? 1.6 : 0; } };
    M.oratorios[id] = o;
    M.interativo(k.x, k.z, 2.2, () => o.aceso ? 'Rezar e guardar o progresso' : 'Acender a vela e rezar', () => OV.jogo.usarOratorio(o));
    return o;
  }

  /* ---- figuras (aldeões) ---- */
  M.figuras = {};
  function figura(x, z, rot, op) {
    const g = grupo(x, z, rot);
    const c = new THREE.Group(); g.add(c); // o corpo, que sobe e desce com o passo
    // o feitio de cada um (altura, corpo, pele, cabelo, roupa) sai do nome, sempre igual para a mesma pessoa
    const v = OV.cenario && !op.santo ? OV.cenario.feitio(Object.assign({ regiao: M.regiao ? M.regiao(x, z) : 'vale' }, op)) : null;
    const robe = op.santo ? new THREE.MeshBasicMaterial({ color: 0xf2e6c8, transparent: true, opacity: 0.85 }) : sm(op.cor || (v ? v.corRoupa : 0x4a3a2c));
    const skin = op.santo ? new THREE.MeshBasicMaterial({ color: 0xffe9c0 }) : sm(v ? v.pele : 0xbf9478, { roughness: 0.8 });
    const curta = v && !v.mulher && !v.clerigo; // homens leigos: túnica curta, calças e botas à mostra
    const sent = !!op.sentado;
    const by = sent ? -0.45 : 0;
    let pernas = null, bracos = null;
    if (!sent && !op.santo) {
      // pernas de verdade sob o hábito, e a barra do hábito se abre com os passos
      pernas = OV.andar.pernas(c, 0.13, 0.95, { coxa: 0.47, canela: 0.43, larg: 0.17, prof: 0.2, mat: curta ? sm(v.calca) : sm(0x2a221c), matPe: sm(v ? v.bota : 0x1a1410), pe: [0.19, 0.08, 0.3] });
      c.add(mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.72, 7), robe, 0, 1.3, 0));
      pernas.saia = curta ? OV.andar.saia(c, robe, 0.35, 0.41, 0.4, 0.97, 7) : v && v.mulher ? OV.andar.saia(c, robe, 0.36, 0.5, 0.68, 0.97, 8) : OV.andar.saia(c, robe, 0.36, 0.46, 0.62, 0.97, 7);
    } else c.add(mesh(new THREE.CylinderGeometry(0.28, 0.46, 1.4, 7), robe, 0, 0.95 + by, 0));
    c.add(mesh(new THREE.SphereGeometry(0.19, 8, 7), skin, 0, 1.95 + by - (sent ? 0.08 : 0), sent ? 0.12 : 0.02));
    if (op.veu) c.add(mesh(new THREE.SphereGeometry(0.22, 8, 7), sm(op.veu), 0, 1.99 + by - (sent ? 0.08 : 0), sent ? 0.06 : -0.04));
    else if (op.capuz) c.add(mesh(new THREE.SphereGeometry(0.23, 8, 7), robe, 0, 2.0 + by - (sent ? 0.08 : 0), sent ? 0.05 : -0.05));
    else if (v && v.penteado === 'calvo') { const cb = mesh(new THREE.SphereGeometry(0.2, 8, 7), sm(v.cabelo), 0, 1.97 + by, -0.06); cb.scale.set(1.04, 0.55, 0.92); c.add(cb); }
    else c.add(mesh(new THREE.SphereGeometry(0.2, 8, 7), sm(v ? v.cabelo : (op.cabelo || 0x2b1d14)), 0, 2.03 + by, -0.03));
    if (v) OV.cenario.vestir(c, v, op, 1.95 + by - (sent ? 0.08 : 0), sent);
    if (pernas) {
      bracos = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(0.32 * s, 1.66, 0); p.add(mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), robe, 0, -0.31, 0)); p.add(mesh(new THREE.SphereGeometry(0.07, 5, 4), skin, 0, -0.66, 0.02)); c.add(p); return p; });
    } else [-1, 1].forEach(s => { const a = mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), robe, 0.32 * s, 1.35 + by, sent ? 0.18 : 0); a.rotation.x = sent ? -0.9 : 0; c.add(a); });
    if (sent) { c.add(mesh(new THREE.BoxGeometry(0.62, 0.35, 0.5), MAT.woodL, 0, 0.18, -0.15)); g.rotation.x = 0; }
    if (v) { if (bracos) OV.cenario.naMao(bracos[1], v); if (!sent) { c.scale.set(v.larg, v.alt, v.larg); if (v.velho) c.rotation.x = 0.1; } OV.cenario.fundir(c, true); }
    if (op.santo) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a })); h.position.set(0, 2.32, -0.08); c.add(h);
      c.add(mesh(new THREE.BoxGeometry(0.3, 0.5, 0.12), new THREE.MeshBasicMaterial({ color: 0xe8e0d0 }), 0, 1.68, 0.2));
      g.traverse(o => { if (o.isMesh) o.castShadow = false; });
    }
    const obst = { x, z, r: 0.5 }; M.obstacles.push(obst);
    const fig = { g, corpo: c, pernas, bracos, marcha: OV.andar.estado(), _d: 0, x, z, rot, op, obst, visivel: !op.oculto, x0: x, z0: z, rot0: rot };
    const inter = M.interativo(0, 0, 2.2, () => fig.visivel ? `Falar com ${op.nome}` : null,
      () => { if (!(op.id && OV.missoes && OV.missoes.falar(op.id))) OV.ui.fala(op.nome, typeof op.fala === 'function' ? op.fala() : op.fala); });
    fig.mover = function (nx, nz, nr) {
      const dd = Math.hypot(nx - fig.x, nz - fig.z); if (dd < 3) fig._d += dd;
      fig.x = nx; fig.z = nz; fig.rot = nr; g.position.set(nx, H(nx, nz), nz); g.rotation.y = nr;
      obst.x = nx; obst.z = nz; const p = frente(nx, nz, nr, 1.0); inter.x = p.x; inter.z = p.z;
    };
    fig.mostrar = function (b) { fig.visivel = b; g.visible = b; obst.r = b ? 0.5 : 0; };
    // ir andando até um lugar (quando alguém está olhando); sem plateia, chega de uma vez
    fig.ir = function (nx, nz, nr) {
      fig.rodada = M.rodadaFig;
      if (Math.hypot(nx - fig.x, nz - fig.z) < 0.3) { fig.destino = null; fig.mover(fig.x, fig.z, nr); return; }
      if (fig.destino && Math.hypot(fig.destino.x - nx, fig.destino.z - nz) < 0.3) { fig.destino.rot = nr; return; }
      const P = OV.P, perto = P && P.pos && (Math.hypot(P.pos.x - fig.x, P.pos.z - fig.z) < 80 || Math.hypot(P.pos.x - nx, P.pos.z - nz) < 80);
      if (!OV.jogo || OV.jogo.modo !== 'jogo' || !fig.visivel || !perto || !fig.pernas) { fig.destino = null; fig.mover(nx, nz, nr); return; }
      fig.destino = { x: nx, z: nz, rot: nr, preso: 0, lado: 0 };
    };
    fig.reset = function () { fig.mostrar(!op.oculto); }; // a posição é decidida depois (ir para casa ou para o lugar da missão)
    fig.mover(x, z, rot); fig.mostrar(!op.oculto);
    if (op.id) M.figuras[op.id] = fig;
    return g;
  }
  M.criarFigura = figura;
  const interiorDe = (x, z) => (M.interiores || []).find(c => { const dx = x - c.x, dz = z - c.z, lx = dx * c.cs - dz * c.sn, lz = dx * c.sn + dz * c.cs; return Math.abs(lx) < c.hw && Math.abs(lz) < c.hd; }) || null;
  M.interiorDe = interiorDe;
  // quem tem destino caminha até ele, contornando paredes
  M.animados.push(dt => {
    if (!OV.jogo || !OV.jogo.ativo || !OV.jogo.ativo()) return;
    const P = OV.P; if (!P || !P.pos) return;
    for (const id in M.figuras) {
      const f = M.figuras[id], d = f.destino; if (!d) continue;
      // quem está dentro de uma casa e vai para fora sai pela porta (primeiro até a soleira, depois para fora)
      if (!d.via && d.via !== false) {
        const cf = interiorDe(f.x, f.z), cd = interiorDe(d.x, d.z);
        d.via = cf && cf !== cd ? [cf.W(0, cf.hd - 0.5), cf.porta] : false; d.casa = cf || null;
      }
      const alvoP = d.via && d.via.length ? d.via[0] : d;
      const dx = alvoP.x - f.x, dz = alvoP.z - f.z, dist = Math.hypot(dx, dz);
      if (alvoP !== d && dist < 0.5) { d.via.shift(); d.preso = 0; continue; }
      if (dist < 0.25) { f.destino = null; f.mover(d.x, d.z, d.rot); continue; }
      // preso dentro de casa por mais de 3 s: reaparece do lado de fora da porta
      if (d.casa && d.preso > 3 && interiorDe(f.x, f.z) === d.casa) { const pt = d.casa.porta; f.mover(pt.x, pt.z, f.rot); d.via = false; d.preso = 0; continue; }
      if (Math.hypot(P.pos.x - f.x, P.pos.z - f.z) > 90 && Math.hypot(P.pos.x - d.x, P.pos.z - d.z) > 90) { f.destino = null; f.mover(d.x, d.z, d.rot); continue; }
      const passo = Math.min(dist, 1.35 * dt), alvo = Math.atan2(dx, dz);
      const tenta = a => { const q = { x: f.x + Math.sin(a) * passo, z: f.z + Math.cos(a) * passo }; const r0 = f.obst.r; f.obst.r = 0; M.collide(q, 0.35); f.obst.r = r0; return q; };
      let q = tenta(alvo + d.lado);
      if (Math.hypot(q.x - f.x, q.z - f.z) < passo * 0.35) {
        d.preso += dt;
        for (const k of [0.8, -0.8, 1.6, -1.6]) { const q2 = tenta(alvo + k); if (Math.hypot(q2.x - f.x, q2.z - f.z) > passo * 0.6) { q = q2; d.lado = k; break; } }
      } else { d.preso = Math.max(0, d.preso - dt * 0.5); if (d.lado && Math.random() < dt * 0.6) d.lado = 0; }
      if (d.preso > 3) q = { x: f.x + Math.sin(alvo) * passo, z: f.z + Math.cos(alvo) * passo }; // preso de verdade: passa rente à parede
      const rumo = Math.atan2(q.x - f.x, q.z - f.z);
      f.mover(q.x, q.z, OV.util.turnTo(f.rot, rumo, 6 * dt));
    }
  });
  // a cada quadro, quem anda mexe as pernas na medida dos próprios passos; quem para junta os pés
  M.animados.push(dt => {
    const P = OV.P; if (!P || !P.pos) return;
    for (const id in M.figuras) {
      const f = M.figuras[id]; if (!f.pernas || !f.visivel) { if (f) f._d = 0; continue; }
      if (Math.abs(f.x - P.pos.x) > 70 || Math.abs(f.z - P.pos.z) > 70) { f._d = 0; continue; }
      OV.andar.ciclo(f.marcha, f._d, dt, 0.6, 0.9); f._d = 0;
      const r = OV.andar.alvos(f.marcha.ph, f.marcha.amp, { A: 0.4, K: 0.7, bob: 0.05 });
      OV.andar.aplicar(f.pernas, r);
      f.corpo.position.y = r.bob; f.corpo.rotation.z = r.sway;
      if (f.gesto) f.gesto(dt); // um gesto próprio (entregar, martelar, tocar) manda nos braços
      else if (f.bracos) { f.bracos[0].rotation.x = r.braco * 0.7; f.bracos[1].rotation.x = -r.braco * 0.7; }
    }
  });
  const trato = () => (OV.P.pers && OV.P.pers.sexo === 'f') ? 'peregrina' : 'peregrino';

  /* ---- casa simples ---- */
  function casa(x, z, rot, w, d, h, op) {
    op = op || {};
    if (M.patamar && !op.semPatamar) M.patamar(x, z, rot, w / 2 + 0.7, d / 2 + 0.9, H(x, z)); // o chão se nivela sob a casa
    const g = grupo(x, z, rot);
    const mat = op.mat || MAT.plaster[(Math.random() * MAT.plaster.length) | 0];
    g.add(mesh(new THREE.BoxGeometry(w, h, d), mat, 0, h / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.2, 1.6, d + 0.2), MAT.colDark, 0, -0.6, 0)); // embasamento de pedra, enterrado
    const t = telhado(d, w, op.rh || 2.2, op.roof || MAT.roofTile, mat); t.rotation.y = Math.PI / 2; t.position.y = h; g.add(t);
    g.add(mesh(new THREE.BoxGeometry(1.1, 1.9, 0.12), MAT.wood, 0, 0.95, d / 2 + 0.03));
    [-1, 1].forEach(s => { if (w > 4.5) g.add(mesh(new THREE.BoxGeometry(0.7, 0.6, 0.1), op.luz ? MAT.winLit : MAT.winDark, s * w / 3.2, h * 0.62, d / 2 + 0.03)); });
    if (op.luz) { const p = frente(x, z, rot, d / 2 + 0.8); M.emissor(p.x, H(x, z) + 1.6, p.z, 0.7, 7, 0xd9822e); }
    if (OV.cenario) {
      if (!op.semOrnato) OV.cenario.ornarCasa(g, w, d, h, { x, z, rot, rh: op.rh || 2.2, janela: op.luz ? MAT.winLit : MAT.winDark, janelasFrente: w > 4.5, estilo: op.estilo, semChamine: op.semChamine });
      OV.cenario.fundir(g); // a casa inteira vira duas ou três malhas
    }
    M.caixa(x, z, w / 2 + 0.1, d / 2 + 0.1, rot);
    M.RECTS.push([x, z, w, d, rot]);
    return g;
  }
  M.RECTS = M.RECTS || [];

  /* ---- casa onde se pode entrar: paredes, porta aberta, piso, luz e mobília; o telhado some quando o jogador entra ---- */
  M.interiores = [];
  function casaInterior(x, z, rot, w, d, h, op) {
    op = op || {};
    if (M.patamar && !op.semPatamar) M.patamar(x, z, rot, w / 2 + 0.7, d / 2 + 1.0, H(x, z));
    const g = grupo(x, z, rot);
    const base = op.mat || MAT.plaster[(Math.random() * MAT.plaster.length) | 0];
    const mp = base.clone();
    const t = 0.35, porta = 1.9, alt = Math.min(2.7, h - 0.6), seg = (w - porta) / 2;
    const parede = (bw, bh, bd, lx, ly, lz) => g.add(mesh(new THREE.BoxGeometry(bw, bh, bd), mp, lx, ly, lz));
    parede(w, h, t, 0, h / 2, -d / 2 + t / 2);
    [-1, 1].forEach(s => parede(t, h, d, s * (w / 2 - t / 2), h / 2, 0));
    [-1, 1].forEach(s => parede(seg, h, t, s * (porta / 2 + seg / 2), h / 2, d / 2 - t / 2));
    parede(porta, h - alt, t, 0, alt + (h - alt) / 2, d / 2 - t / 2);
    const verga = mesh(new THREE.BoxGeometry(porta + 0.3, 0.2, t + 0.12), MAT.wood, 0, alt + 0.1, d / 2 - t / 2); g.add(verga);
    g.add(mesh(new THREE.BoxGeometry(w + 0.25, 1.4, d + 0.25), MAT.colDark, 0, -0.52, 0));
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * t, d - 2 * t), op.piso || MAT.woodL); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.2; piso.receiveShadow = true; g.add(piso);
    const tl = telhado(d, w, op.rh || 2.4, op.roof || MAT.roofTile, mp); tl.rotation.y = Math.PI / 2; tl.position.y = h; g.add(tl);
    const ornato = OV.cenario && !op.semOrnato ? OV.cenario.ornarCasa(g, w, d, h, { x, z, rot, rh: op.rh || 2.4, interior: true, porta, alt, janela: op.luz === false ? MAT.winDark : MAT.winLit, janelasLado: d > 6, estilo: op.estilo, semChamine: op.semChamine || d > 14 }) : null;
    [-1, 1].forEach(s => [-1, 1].forEach(k => { if (d > 6) { const j = mesh(new THREE.BoxGeometry(0.1, 0.8, 0.9), op.luz === false ? MAT.winDark : MAT.winLit, s * (w / 2 + 0.01), h * 0.55, k * d / 4); g.add(j); } }));
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const Wd = (lx, lz) => ({ x: x + lx * cs + lz * sn, z: z - lx * sn + lz * cs });
    const centro = Wd(0, 0);
    M.emissor(centro.x, H(x, z) + h - 0.9, centro.z, 1.15, Math.max(w, d) + 2, 0xffb468);
    const caixas = [];
    [[0, -d / 2 + t / 2, w / 2, t / 2], [-(w / 2 - t / 2), 0, t / 2, d / 2], [w / 2 - t / 2, 0, t / 2, d / 2], [-(porta / 2 + seg / 2), d / 2 - t / 2, seg / 2, t / 2], [porta / 2 + seg / 2, d / 2 - t / 2, seg / 2, t / 2]].forEach(([lx, lz, hw, hd]) => {
      const p = Wd(lx, lz); caixas.push(M.caixa(p.x, p.z, hw + 0.04, hd + 0.04, rot));
    });
    M.RECTS.push([x, z, w, d, rot]);
    const c = { ornato, verga, x, z, rot, cs, sn, hw: w / 2 - 0.2, hd: d / 2 - 0.2, telhado: tl, mp, caixas, g, W: Wd, h, nome: op.nome || null, dentro: false, porta: Wd(0, d / 2 + 1.3) };
    M.interiores.push(c);
    return c;
  }
  /* mobília dentro de uma casa (coordenadas locais da casa) */
  function mobilia(c, tipo, lx, lz, r) {
    const g = new THREE.Group(); g.position.set(lx, 0.2, lz); g.rotation.y = r || 0; c.g.add(g);
    const p = c.W(lx, lz); let raio = 0.6;
    const madeira = MAT.woodL, escura = MAT.wood;
    if (tipo === 'mesa') { g.add(mesh(new THREE.BoxGeometry(1.7, 0.1, 0.95), madeira, 0, 0.8, 0)); [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(([a, b]) => g.add(mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), escura, a, 0.4, b))); g.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.18, 6), MAT.col, 0.3, 0.94, 0.1)); g.add(mesh(new THREE.BoxGeometry(0.34, 0.12, 0.22), sm(0x9a6a32), -0.3, 0.91, -0.1)); raio = 1.0; }
    else if (tipo === 'banco') { g.add(mesh(new THREE.BoxGeometry(1.5, 0.12, 0.42), madeira, 0, 0.45, 0)); [-0.6, 0.6].forEach(a => g.add(mesh(new THREE.BoxGeometry(0.1, 0.45, 0.36), escura, a, 0.22, 0))); raio = 0.7; }
    else if (tipo === 'cama') { g.add(mesh(new THREE.BoxGeometry(1.1, 0.4, 2.1), escura, 0, 0.2, 0)); g.add(mesh(new THREE.BoxGeometry(1.0, 0.16, 1.9), sm(0xb8aa8a), 0, 0.46, 0.04)); g.add(mesh(new THREE.BoxGeometry(0.7, 0.14, 0.4), sm(0xe2d8c0), 0, 0.6, -0.72)); raio = 1.0; }
    else if (tipo === 'lareira') { g.add(mesh(new THREE.BoxGeometry(1.8, 1.6, 0.7), MAT.rock, 0, 0.8, 0)); g.add(mesh(new THREE.BoxGeometry(1.0, 0.7, 0.2), MAT.dark, 0, 0.45, 0.28)); const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 6), MAT.flame); f.position.set(0, 0.35, 0.3); g.add(f); M.flames.push(f); const q = c.W(lx, lz + 0.8); M.emissor(q.x, H(c.x, c.z) + 0.9, q.z, 1.3, 7, 0xff8a3a); raio = 1.0; }
    else if (tipo === 'forja') { g.add(mesh(new THREE.BoxGeometry(1.8, 1.0, 1.3), MAT.rock, 0, 0.5, 0)); g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 0.8), new THREE.MeshBasicMaterial({ color: 0xff6a1a }), 0, 1.02, 0)); g.add(mesh(new THREE.CylinderGeometry(0.35, 0.6, 1.8, 6), MAT.rock, 0, 1.9, -0.3)); const q = c.W(lx, lz); M.emissor(q.x, H(c.x, c.z) + 1.4, q.z, 1.8, 8, 0xff5a1a); raio = 1.2; }
    else if (tipo === 'bigorna') { g.add(mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), escura, 0, 0.3, 0)); g.add(mesh(new THREE.BoxGeometry(0.8, 0.22, 0.32), MAT.iron, 0, 0.7, 0)); raio = 0.5; }
    else if (tipo === 'barris') { [[-0.4, 0], [0.4, 0.1], [0, -0.5]].forEach(([a, b]) => g.add(mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.9, 8), madeira, a, 0.45, b))); raio = 0.9; }
    else if (tipo === 'prateleira') { g.add(mesh(new THREE.BoxGeometry(1.8, 1.7, 0.4), escura, 0, 0.85, 0)); for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), [MAT.wax, MAT.col, sm(0x6a3a2a)][i % 3], -0.7 + i * 0.35, 1.3 - (i % 2) * 0.6, 0.12)); raio = 0.7; }
    else if (tipo === 'altar') { g.add(mesh(new THREE.BoxGeometry(2.4, 1.1, 1.0), MAT.col, 0, 0.55, 0)); g.add(mesh(new THREE.BoxGeometry(2.5, 0.08, 1.05), sm(0xece4d0), 0, 1.12, 0)); g.add(mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), MAT.gold, 0, 1.6, -0.2)); g.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), MAT.gold, 0, 1.78, -0.2)); [-0.8, 0.8].forEach(a => { g.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.4, 6), MAT.wax, a, 1.36, 0)); chama(c.W(lx + a, lz).x, H(c.x, c.z) + 1.8, c.W(lx + a, lz).z); }); raio = 1.3; }
    else if (tipo === 'ovelha') { const l = sm(0xd8d2c4); g.add(mesh(new THREE.SphereGeometry(0.4, 7, 5), l, 0, 0.45, 0)); g.children[g.children.length - 1].scale.set(1, 0.8, 1.3); g.add(mesh(new THREE.SphereGeometry(0.18, 6, 5), sm(0x2a2420), 0, 0.55, 0.5)); raio = 0.5; }
    M.obstacles.push({ x: p.x, z: p.z, r: raio });
    return g;
  }
  // a cada quadro: telhado e paredes somem quando o jogador está dentro
  M.animados.push(() => {
    const P = OV.P; if (!P || !P.pos) return;
    for (const c of M.interiores) {
      const dx = P.pos.x - c.x, dz = P.pos.z - c.z;
      let dentro = false;
      if (Math.abs(dx) < 14 && Math.abs(dz) < 14) { const lx = dx * c.cs - dz * c.sn, lz = dx * c.sn + dz * c.cs; dentro = Math.abs(lx) < c.hw && Math.abs(lz) < c.hd; }
      if (dentro === c.dentro) continue;
      c.dentro = dentro; c.telhado.visible = !dentro; c.verga.visible = !dentro; if (c.ornato) c.ornato.visible = !dentro;
      M.interiorAtual = dentro ? c : (M.interiorAtual === c ? null : M.interiorAtual);
      c.mp.transparent = dentro; c.mp.opacity = dentro ? 0.2 : 1; c.mp.depthWrite = !dentro; c.mp.needsUpdate = true;
      c.caixas.forEach(b => { b.semCamera = dentro; });
      if (OV.jogo && OV.jogo.modo === 'jogo' && OV.ui) OV.ui.local(dentro && c.nome ? c.nome : M.nomeZona(M.zonaEm(P.pos.x, P.pos.z)));
    }
  });

  Object.assign(M, { casa, casaInterior, mobilia, telhado, criarOratorio, grupo, vela, chama, frente });

  /* ================= CLAUSTRO DE SANTA SABINA (centro 0,0) ================= */
  (function () {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), MAT.stone); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.03; fl.receiveShadow = true; scene.add(fl);
    scene.add(mesh(new THREE.BoxGeometry(33, 6.4, 0.8), MAT.wall, 0, 3.2, -16));
    [-1, 1].forEach(s => scene.add(mesh(new THREE.BoxGeometry(14.2, 6.4, 0.8), MAT.wall, s * 9.3, 3.2, 16)));
    scene.add(mesh(new THREE.BoxGeometry(4.4, 2.2, 0.8), MAT.wall, 0, 5.3, 16));
    [-1, 1].forEach(s => scene.add(mesh(new THREE.BoxGeometry(0.8, 4.4, 1.2), MAT.colDark, s * 2.4, 2.2, 16)));
    [-16, 16].forEach(x => scene.add(mesh(new THREE.BoxGeometry(0.8, 6.4, 33), MAT.wall, x, 3.2, 0)));
    M.caixa(0, -16, 16.6, 0.45); M.caixa(16, 0, 0.45, 16.6); M.caixa(-16, 0, 0.45, 16.6);
    M.caixa(-9.4, 16, 7.2, 0.45); M.caixa(9.4, 16, 7.2, 0.45);
    [-14, 14].forEach(z => scene.add(mesh(new THREE.BoxGeometry(33, 0.4, 4.6), MAT.roof, 0, 6.2, z)));
    [-14, 14].forEach(x => scene.add(mesh(new THREE.BoxGeometry(4.6, 0.4, 33), MAT.roof, x, 6.2, 0)));
    [-12, 12].forEach(z => scene.add(mesh(new THREE.BoxGeometry(24.9, 0.8, 0.9), MAT.colDark, 0, 5.6, z)));
    [-12, 12].forEach(x => scene.add(mesh(new THREE.BoxGeometry(0.9, 0.8, 24.9), MAT.colDark, x, 5.6, 0)));
    const seen = new Set();
    const addCol = (x, z) => {
      const k = x + ',' + z; if (seen.has(k)) return; seen.add(k);
      scene.add(mesh(new THREE.BoxGeometry(1, 0.3, 1), MAT.colDark, x, 0.15, z));
      scene.add(mesh(new THREE.CylinderGeometry(0.38, 0.44, 2.9, 8), MAT.col, x, 1.6, z));
      scene.add(mesh(new THREE.BoxGeometry(1, 0.35, 1), MAT.colDark, x, 3.05, z));
      M.obstacles.push({ x, z, r: 0.55 });
    };
    for (let i = -3; i <= 3; i++) { addCol(i * 4, -12); addCol(i * 4, 12); addCol(-12, i * 4); addCol(12, i * 4); }
    const archGeo = new THREE.TorusGeometry(2, 0.28, 5, 12, Math.PI);
    for (let i = -3; i < 3; i++) {
      [-12, 12].forEach(z => scene.add(mesh(archGeo, MAT.col, i * 4 + 2, 3.2, z)));
      [-12, 12].forEach(x => { const a = mesh(archGeo, MAT.col, x, 3.2, i * 4 + 2); a.rotation.y = Math.PI / 2; scene.add(a); });
    }
    [-6, 0, 6].forEach(x => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.2), new THREE.MeshBasicMaterial({ map: glassTex(), fog: false }));
      g.position.set(x, 3.1, -15.55); scene.add(g);
      scene.add(mesh(new THREE.BoxGeometry(2.4, 0.3, 0.4), MAT.colDark, x, 0.85, -15.45));
      scene.add(mesh(new THREE.BoxGeometry(2.4, 0.3, 0.4), MAT.colDark, x, 5.35, -15.45));
    });
    M.emissor(0, 3, -13.4, 1.3, 13, 0xa8406e);
    [[-15.55, Math.PI / 2], [15.55, -Math.PI / 2]].forEach(([x, ry]) => [-6, 6].forEach(z => {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), sm(0xffffff, { map: bannerTex, side: THREE.DoubleSide }));
      b.position.set(x, 3.6, z); b.rotation.y = ry; scene.add(b);
    }));
    scene.add(mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 8), MAT.colDark, 0, 0.175, 0));
    scene.add(mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.35, 8), MAT.col, 0, 0.525, 0));
    scene.add(mesh(new THREE.BoxGeometry(0.36, 4.4, 0.36), MAT.wood, 0, 2.9, 0));
    scene.add(mesh(new THREE.BoxGeometry(2.3, 0.32, 0.32), MAT.wood, 0, 3.95, 0));
    M.obstacles.push({ x: 0, z: 0, r: 2.5 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; vela(Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0.35, rnd(0.3, 0.65)); }
    M.emissor(0, 1.3, 0, 1.9, 14);
    [[-14, -14], [14, -14], [-14, 14], [14, 14]].forEach(([x, z]) => {
      scene.add(mesh(new THREE.BoxGeometry(1, 0.6, 1), MAT.colDark, x, 0.3, z));
      for (let i = 0; i < 5; i++) vela(x + rnd(-0.35, 0.35), z + rnd(-0.35, 0.35), 0.6, rnd(0.25, 0.6));
      M.emissor(x, 1.6, z, 1.4, 10);
      M.obstacles.push({ x, z, r: 0.8 });
    });
    criarOratorio('sabina', 'Oratório de Santa Sabina', -6, 15.15, Math.PI);
  })();

  /* ================= MOSTEIRO, TORRE E CRIPTA ================= */
  (function () {
    // igreja abacial, ao norte do claustro
    const ig = grupo(0, -31, 0, 0);
    ig.add(mesh(new THREE.BoxGeometry(16, 11, 24), MAT.wall, 0, 5.5, 0));
    const t = telhado(16, 24, 6, MAT.roof); t.position.y = 11; ig.add(t);
    ig.add(mesh(new THREE.BoxGeometry(17, 0.6, 25), MAT.colDark, 0, 0.3, 0));
    [-6, 0, 6].forEach(z => [-1, 1].forEach(s => {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4), new THREE.MeshBasicMaterial({ map: glassTex(), fog: true }));
      v.position.set(s * 8.05, 6, z); v.rotation.y = s * Math.PI / 2; ig.add(v);
    }));
    const rosa = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), new THREE.MeshBasicMaterial({ map: glassTex() }));
    rosa.position.set(0, 12.5, -12.05); rosa.rotation.y = Math.PI; ig.add(rosa);
    M.caixa(0, -31, 8.2, 12.2);
    // torre do sino
    const tw = grupo(11.5, -20.5, 0, 0);
    tw.add(mesh(new THREE.BoxGeometry(5, 19, 5), MAT.wall, 0, 9.5, 0));
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(a => { const o = mesh(new THREE.BoxGeometry(1.6, 2.6, 0.3), MAT.dark, Math.sin(a) * 2.45, 16.5, Math.cos(a) * 2.45); o.rotation.y = a; tw.add(o); });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.8, 6, 4), MAT.roof); cone.rotation.y = Math.PI / 4; cone.position.y = 22; cone.castShadow = true; tw.add(cone);
    tw.add(mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), MAT.gold, 0, 25.6, 0)); tw.add(mesh(new THREE.BoxGeometry(0.9, 0.18, 0.18), MAT.gold, 0, 25.9, 0));
    M.caixa(11.5, -20.5, 2.6, 2.6);
    M.interativo(15.2, -20.5, 2.6, () => OV.missoes ? OV.missoes.textoObjeto('torre') : 'Olhar a torre do sino', () => OV.missoes ? OV.missoes.objeto('torre') : OV.ui.fala('Torre do sino', 'Os sinos estão mudos.'));
    // dormitório
    if (M.patamar) M.patamar(-28, -6, 0, 4.9, 13.4, 0, 3);
    const dm = grupo(-28, -6, 0, 0);
    dm.add(mesh(new THREE.BoxGeometry(9, 7, 26), MAT.wall, 0, 3.5, 0));
    const t2 = telhado(9, 26, 4, MAT.roof); t2.position.y = 7; dm.add(t2);
    for (let i = -2; i <= 2; i++) dm.add(mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), MAT.winDark, 4.55, 4.5, i * 4.5));
    M.caixa(-28, -6, 4.6, 13.1);
    M.RECTS.push([0, -31, 16, 24, 0], [11.5, -20.5, 5, 5, 0], [-28, -6, 9, 26, 0], [27, -12, 6, 6, 0]);
    // horta e cemitério dos monges
    for (let i = 0; i < 9; i++) {
      const x = 22 + (i % 3) * 2.4, z = 4 + Math.floor(i / 3) * 2.6;
      const c = grupo(x, z, rnd(-0.1, 0.1));
      c.add(mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), MAT.wood, 0, 0.55, 0)); c.add(mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), MAT.wood, 0, 0.82, 0));
    }
    // entrada da cripta
    const cx = 27, cz = -12, rot = -Math.PI / 2;
    const cr = grupo(cx, cz, rot);
    cr.add(mesh(new THREE.BoxGeometry(6, 4.5, 6), MAT.wall, 0, 2.25, 0));
    const t3 = telhado(6, 6, 2.2, MAT.roof); t3.position.y = 4.5; cr.add(t3);
    cr.add(mesh(new THREE.BoxGeometry(2.2, 3, 0.2), MAT.dark, 0, 1.5, 3.02));
    for (let i = -2; i <= 2; i++) cr.add(mesh(new THREE.BoxGeometry(0.08, 3, 0.08), MAT.iron, i * 0.45, 1.5, 3.12));
    cr.add(mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), MAT.iron, 0, 2.4, 3.12));
    cr.add(mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), MAT.bone, -1.8, 3.3, 3.1)); // caveira estilizada / relevo
    M.caixa(cx, cz, 3.1, 3.1, rot);
    const porta = frente(cx, cz, rot, 4);
    [-1, 1].forEach(s => {
      const p = { x: porta.x, z: porta.z + s * 1.7 };
      scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5), MAT.iron, p.x, H(p.x, p.z) + 0.8, p.z));
      chama(p.x, H(p.x, p.z) + 1.75, p.z, 2.2);
      M.emissor(p.x, H(p.x, p.z) + 2, p.z, 1.2, 9, 0xff7a2a);
    });
    M.interativo(porta.x, porta.z, 2.6, () => OV.missoes ? OV.missoes.textoObjeto('cripta') : 'Examinar o portão da cripta', () => OV.missoes ? OV.missoes.objeto('cripta') : OV.ui.fala('Portão da cripta', 'O portão está selado.'));
  })();

  /* ================= VILA DE SÃO ROQUE: a cidade do vale (centro 0,150) ================= */
  (function () {
    const cx = M.SITIO.vila.x, cz = M.SITIO.vila.z;
    // poço na praça
    const p = grupo(cx, cz, 0);
    p.add(mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 10, 1, true), MAT.col, 0, 0.45, 0));
    p.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 10), sm(0x0c1218), 0, 0.3, 0));
    [-1, 1].forEach(s => p.add(mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), MAT.wood, s * 1.0, 1.1, 0)));
    const tp = telhado(2.4, 1.6, 0.8, MAT.roofTile); tp.rotation.y = Math.PI / 2; tp.position.y = 2.2; p.add(tp);
    M.obstacles.push({ x: cx, z: cz, r: 1.4 });
    const piso = new THREE.Mesh(new THREE.CircleGeometry(15, 28), MAT.stone); piso.rotation.x = -Math.PI / 2; piso.position.set(cx, H(cx, cz) + 0.05, cz); piso.receiveShadow = true; scene.add(piso);
    const pos = (a, r) => ({ x: cx + Math.cos(a * Math.PI / 180) * r, z: cz + Math.sin(a * Math.PI / 180) * r });
    const rotC = q => Math.atan2(cx - q.x, cz - q.z);
    // igreja da vila (Padre Tomé fica lá dentro, junto ao altar)
    const iq = pos(270, 31), ir = rotC(iq);
    const ig = casaInterior(iq.x, iq.z, ir, 11, 18, 7.5, { mat: MAT.plaster[2], roof: MAT.roof, rh: 3.6, piso: MAT.stone, nome: 'Igreja de São Roque' });
    mobilia(ig, 'altar', 0, -6.8, 0);
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => mobilia(ig, 'banco', s * 2.3, -3 + k * 2.4, 0));
    const vr = new THREE.Mesh(new THREE.CircleGeometry(1.1, 14), new THREE.MeshBasicMaterial({ map: glassTex() })); vr.position.set(0, 5.2, -8.8); ig.g.add(vr);
    const torre = grupo(ig.W(-6.6, 6.5).x, ig.W(-6.6, 6.5).z, ir);
    torre.add(mesh(new THREE.BoxGeometry(3.2, 12, 3.2), MAT.plaster[2], 0, 6, 0));
    const tc = mesh(new THREE.ConeGeometry(2.6, 3.6, 4), MAT.roof, 0, 13.8, 0); tc.rotation.y = Math.PI / 4; torre.add(tc);
    torre.add(mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), MAT.gold, 0, 16.2, 0)); torre.add(mesh(new THREE.BoxGeometry(0.6, 0.15, 0.15), MAT.gold, 0, 16.4, 0));
    const tw = ig.W(-6.6, 6.5); M.caixa(tw.x, tw.z, 1.7, 1.7, ir);
    figura(ig.W(0, -4.4).x, ig.W(0, -4.4).z, ir, { id: 'tome', nome: 'Padre Tomé', cor: 0x16120f, cabelo: 0x8a8580, fala: () => `Os sinos se calaram, e o povo se calou com eles. Que bom que você chegou, ${trato()}.` });

    // casas da praça: as de quem tem missão têm interior
    const anel = [
      [20, 9, 8, 5, { nome: 'Forja de Lia', mob: [['forja', -2.2, -2.2], ['bigorna', 0.6, -0.8], ['barris', 3, -2.5], ['prateleira', 3.2, 1.6, -Math.PI / 2]] }, ['lia', 'Lia, a ferreira', { cor: 0x4a2a1c, cabelo: 0x5a2a14 }, 0.6, 0.6]],
      [50, 8, 7, 4.6, null], [130, 8, 7, 4.6, null],
      [160, 9, 8, 5, { nome: 'Casa da Viúva Marta', mob: [['lareira', 0, -3.4], ['mesa', 2.2, 0.4], ['cama', -3, -1.2]] }, ['marta', 'Viúva Marta', { cor: 0x2a2420, veu: 0x15110e, sentado: true }, 0.8, -1.5]],
      [200, 9, 8, 5, { nome: 'Casa do Velho Matias', mob: [['cama', -2.6, -1.4], ['lareira', 1.4, -3.4], ['mesa', 2.6, 1.2]] }, ['matias', 'Velho Matias', { cor: 0x3c3328, cabelo: 0xb9b2a6, sentado: true }, -1.4, -1.0]],
      [230, 8, 7, 4.6, null],
      [310, 9, 8, 5, { nome: 'Casa do Pastor', mob: [['lareira', -2.4, -3.4], ['ovelha', 2.6, -2.2], ['ovelha', 3.2, -0.6], ['banco', -2.4, 1.6]] }, ['aldeao', 'Aldeão, o pastor', { cor: 0x3a2e24, sentado: true }, -0.6, -1.2]],
      [340, 8, 7, 4.6, null]
    ];
    anel.forEach(([a, w, d, h, int, npc]) => {
      const q = pos(a, 25), r = rotC(q);
      if (!int) { casa(q.x, q.z, r, w, d, h, { luz: Math.random() < 0.6, rh: 2.6 }); return; }
      const c = casaInterior(q.x, q.z, r, w, d, h, { nome: int.nome, rh: 2.8 });
      int.mob.forEach(([t, lx, lz, rr]) => mobilia(c, t, lx, lz, rr));
      if (npc) { const [id, nome, op, lx, lz] = npc; const f = c.W(lx, lz); figura(f.x, f.z, r, Object.assign({ id, nome, fala: '...' }, op)); }
    });
    // anel de fora: a cidade continua
    [[10, 9], [40, 8], [72, 8], [108, 9], [140, 10], [172, 8], [206, 9], [236, 8], [300, 9], [330, 8]].forEach(([a, w], i) => {
      const q = pos(a, 44), r = rotC(q);
      if (a === 140) {
        const c = casaInterior(q.x, q.z, r, 11, 9, 5.4, { nome: 'Estalagem do Peregrino', rh: 3 });
        mobilia(c, 'mesa', -2.5, -1.5); mobilia(c, 'mesa', 2.5, -1.5); mobilia(c, 'barris', 4, 2.5); mobilia(c, 'lareira', 0, -3.9);
        const f = c.W(-1.2, 1); figura(f.x, f.z, r, { id: 'estalajadeiro', nome: 'Estalajadeiro', cor: 0x5a3a24, cabelo: 0x2a1a10, fala: 'Bem-vindo à Estalagem do Peregrino. Pão quente e cama limpa, quando os vícios deixam.' });
        return;
      }
      casa(q.x, q.z, r, w, 7 + (i % 2), 4.4 + (i % 3) * 0.4, { luz: i % 2 === 0, rh: 2.6 });
    });
    // lanternas da praça
    [0, 60, 120, 180, 240, 300].forEach(a => {
      const q = pos(a + 30, 14), x = q.x, z = q.z;
      scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 5), MAT.wood, x, H(x, z) + 1.3, z));
      scene.add(mesh(new THREE.BoxGeometry(0.34, 0.4, 0.34), MAT.iron, x, H(x, z) + 2.75, z));
      chama(x, H(x, z) + 2.72, z, 1.4);
      M.emissor(x, H(x, z) + 2.8, z, 1.1, 10, 0xffa040);
      M.obstacles.push({ x, z, r: 0.25 });
    });
    const oq = pos(305, 12);
    criarOratorio('vila', 'Oratório da Vila de São Roque', oq.x, oq.z, Math.atan2(cx - oq.x, cz - oq.z));
    // na praça e nas ruas
    let q = pos(130, 18); figura(q.x, q.z, rotC(q), { id: 'aldea', nome: 'Aldeã', cor: 0x3a3a2a, veu: 0x4a3a2a, fala: 'Dizem que no alto do vale vivia um eremita, depois do rio. Ninguém sobe lá há anos.' });
    figura(cx + 3.2, cz + 4, Math.PI * 0.8, { id: 'joaquim', nome: 'Joaquim', cor: 0x52402a, cabelo: 0x2a1a10, fala: 'Tenho fome... mas não conte a ninguém o que eu faço para comer.' });
    M.ESTALAGEM = pos(140, 44);
  })();

  figura(M.SITIO.vila.x + 7, M.SITIO.vila.z - 14, 0, { id: 'afonso', nome: 'Irmão Afonso', cor: 0x16120f, capuz: true, oculto: true, fala: 'Rezo por você.' });
  figura(11.2, -27, Math.PI / 2, { id: 'abade', nome: 'Abade Anselmo', cor: 0x111014, capuz: true, oculto: true, fala: 'Obrigado.' });
  (function () {
    const lamp = new THREE.Group(); lamp.position.set(0, 15.6, -18.6); scene.add(lamp);
    lamp.add(mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), MAT.gold, 0, 0, 0));
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c8 })); luz.position.y = 0.05; lamp.add(luz);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); lamp.add(halo);
    const e = M.emissor(0, 15, -17.6, 0, 26, 0xffe2a0);
    M.lampada = b => { luz.visible = b; halo.visible = b; e.int = b ? 2.6 : 0; };
    M.lampada(false);
  })();

  /* ================= FLORESTA DE VÉSPERAS E CAPELA DE SÃO ROQUE ================= */
  (function () {
    // capela de São Roque (aberta para o leste)
    const x = M.SITIO.capela.x, z = M.SITIO.capela.z;
    const cap = grupo(x, z, 0);
    cap.add(mesh(new THREE.BoxGeometry(0.6, 4, 7.4), MAT.wall, -3.2, 2, 0));
    [-1, 1].forEach(s => { cap.add(mesh(new THREE.BoxGeometry(6.4, 4 - (s > 0 ? 1.2 : 0), 0.6), MAT.wall, 0, (4 - (s > 0 ? 1.2 : 0)) / 2, s * 3.4)); });
    const tr = mesh(new THREE.BoxGeometry(4.4, 0.3, 4.2), MAT.roof, -1.3, 4.3, -1.6); tr.rotation.x = 0.35; cap.add(tr);
    cap.add(mesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), MAT.col, 2.2, 0.25, 4.6));
    const h = H(x, z);
    M.caixa(x - 3.2, z, 0.35, 3.7); M.caixa(x, z - 3.4, 3.2, 0.35); M.caixa(x, z + 3.4, 3.2, 0.35);
    criarOratorio('roque', 'Capela de São Roque', x - 2.3, z, Math.PI / 2);
    [[-1.4, -2.6], [-1.6, 2.5], [0.4, -2.8]].forEach(([dx, dz]) => vela(x + dx, z + dz, h, rnd(0.3, 0.6)));
    M.emissor(x - 1, h + 1.5, z, 0.9, 8);
    // ruínas
    const rx = M.SITIO.ruinas.x, rz = M.SITIO.ruinas.z;
    [[0, 0, 0], [4, 1, 0.3], [-3, 3, 1.2]].forEach(([dx, dz, r]) => {
      const g = grupo(rx + dx, rz + dz, r);
      g.add(mesh(new THREE.BoxGeometry(4, rnd(1.2, 2.8), 0.6), MAT.wall, 0, 1, 0));
      M.caixa(rx + dx, rz + dz, 2, 0.35, r);
    });
    [[2, -3], [-1, -4]].forEach(([dx, dz]) => {
      const c = mesh(new THREE.CylinderGeometry(0.38, 0.44, 2.8, 8), MAT.col, rx + dx, H(rx + dx, rz + dz) + 0.38, rz + dz); c.rotation.z = Math.PI / 2; c.rotation.y = rnd(0, 3); scene.add(c);
    });
    M.obstacles.push({ x: rx + 1, z: rz - 3.5, r: 1.2 });
  })();

  /* ================= MOINHO DO RIO LENTO ================= */
  (function () {
    const x = M.SITIO.moinho.x, z = M.SITIO.moinho.z;
    const mo = casaInterior(x, z, 0, 9, 8, 5.8, { mat: MAT.plaster[1], rh: 2.8, nome: 'Moinho do Rio Lento' });
    mobilia(mo, 'barris', 2.8, -2.6); mobilia(mo, 'mesa', -2.4, 1.2);
    { const mg = new THREE.Group(); mg.position.set(-0.6, 0.2, -1.4); mo.g.add(mg); mg.add(mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 14), MAT.rock, 0, 0.4, 0)); mg.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 14), MAT.rock, 0, 0.75, 0)); const pm = mo.W(-0.6, -1.4); M.obstacles.push({ x: pm.x, z: pm.z, r: 1.1 }); }
    const wx = x - 5.1;
    const roda = new THREE.Group(); roda.position.set(wx, H(wx, z) + 1.2, z); scene.add(roda);
    const disc = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.35, 16, 1, true), MAT.woodL, 0, 0, 0); disc.rotation.z = Math.PI / 2; roda.add(disc);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const pa = mesh(new THREE.BoxGeometry(0.4, 0.12, 1.2), MAT.woodL, 0, Math.sin(a) * 2.4, Math.cos(a) * 2.4); pa.rotation.x = -a; roda.add(pa); }
    const eixo = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8), MAT.iron, 0, 0, 0); eixo.rotation.z = Math.PI / 2; roda.add(eixo);
    M.obstacles.push({ x: wx, z, r: 1.2 });
    M.interativo(wx - 0.4, z + 3.4, 2.4, () => OV.missoes ? OV.missoes.textoObjeto('roda') : 'Olhar a roda do moinho', () => OV.missoes ? OV.missoes.objeto('roda') : OV.ui.fala('Roda do moinho', 'A roda está parada.'));
    M.RODA = roda.position;
    let girando = false; M.rodaGirando = b => { girando = b; }; M.animados.push(dt => { if (girando) roda.rotation.x += dt * 0.9; });
    const d = mo.W(1.6, 0.4);
    figura(d.x, d.z, 0.2, { id: 'bartolomeu', nome: 'Bartolomeu, o moleiro', cor: 0x5a4a38, cabelo: 0x6a5a48, sentado: true, fala: 'Pra que moer, se ninguém mais faz pão? A roda parou, e eu parei junto com ela.' });
    // sacos de farinha
    [[1.5, 5.4], [2.2, 5.1]].forEach(([dx, dz]) => scene.add(mesh(new THREE.SphereGeometry(0.4, 6, 5), sm(0xb8ad94), x + dx + 0.6, H(x, z) + 0.3, z + dz)));
  })();

  /* ================= ERMIDA DE ANTÃO ================= */
  (function () {
    const x = M.SITIO.ermida.x, z = M.SITIO.ermida.z;
    const r = Math.atan2(-6, 8);
    casa(x, z, r, 3.8, 3.8, 2.8, { mat: sm(0x5a524a), rh: 1.4, roof: MAT.roof });
    const cxr = x - 4.5, czr = z + 4.5, h = H(cxr, czr);
    scene.add(mesh(new THREE.BoxGeometry(0.32, 4.6, 0.32), MAT.wood, cxr, h + 2.3, czr));
    const tv = mesh(new THREE.BoxGeometry(2.2, 0.3, 0.3), MAT.wood, cxr, h + 3.5, czr); tv.rotation.y = r; scene.add(tv);
    vela(cxr + 0.5, czr + 0.5, h, 0.3);
    M.emissor(cxr, h + 1.2, czr, 0.8, 8);
    M.obstacles.push({ x: cxr, z: czr, r: 0.4 });
    M.interativo(cxr + 1.2, czr + 1.2, 2.4, () => OV.missoes ? OV.missoes.textoObjeto('cruz') : 'Olhar a cruz', () => OV.missoes ? OV.missoes.objeto('cruz') : OV.ui.fala('Cruz da ermida', 'O vento sopra forte no alto do rochedo.'));
    figura(cxr - 1.6, czr + 0.9, Math.PI * 0.6, { id: 'antao', nome: 'Santo Antão', santo: true, oculto: true, fala: 'Vigie e reze.' });
  })();

  /* ================= VEGETAÇÃO E PEDRAS: floresta alta e aberta ================= */
  (function () {
    const S = M.SITIO;
    const PL = [[0, -12, 48], [S.vila.x, S.vila.z, 62], [S.moinho.x, S.moinho.z, 18], [S.capela.x, S.capela.z, 12], [S.ruinas.x, S.ruinas.z, 9], [S.ermida.x, S.ermida.z, 8], [27, -12, 10], [24, 6, 8], [S.acampamento.x, S.acampamento.z, 13], [S.mina.x, S.mina.z + 2, 11], [S.covil.x, S.covil.z, 8], [0, 182, 8]];
    const grade = new Map(), CEL = 6;
    const chave = (x, z) => ((x / CEL) | 0) + ',' + ((z / CEL) | 0);
    const perto = (x, z, d) => { const gx = (x / CEL) | 0, gz = (z / CEL) | 0; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = grade.get((gx + i) + ',' + (gz + j)); if (l) for (const t of l) if (Math.hypot(t.x - x, t.z - z) < d) return true; } return false; };
    const marcar = t => { const k = chave(t.x, t.z); if (!grade.has(k)) grade.set(k, []); grade.get(k).push(t); };
    const livre = (x, z, m) => {
      if (Math.hypot(x * 0.95, z) > M.LIM - 6) return false;
      if (M.reservado && M.reservado(x, z, 1)) return false;
      if (M.distEstrada(x, z) < 4 + m) return false;
      if (Math.abs(x - M.rioX(z)) < 7 + m) return false;
      for (const [px, pz, r] of PL) if (Math.hypot(x - px, z - pz) < r + m) return false;
      return true;
    };
    const dummy = new THREE.Object3D();
    function arvores(lista, corCopa) {
      const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 2.4, 5), sm(0x2a1d14), lista.length);
      const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 3.8, 6), sm(corCopa), lista.length);
      trunk.castShadow = crown.castShadow = true;
      lista.forEach((t, i) => {
        const y = H(t.x, t.z), a = t.alt || 1;
        dummy.position.set(t.x, y + 1.2 * t.s * a, t.z); dummy.rotation.set(0, t.r, 0); dummy.scale.set(t.s, t.s * a, t.s); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, y + 2.4 * t.s * a + 1.6 * t.s * a, t.z); dummy.scale.set(t.s, t.s * a, t.s); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
        M.obstacles.push({ x: t.x, z: t.z, r: 0.4 * t.s });
        M.copas.push({ x: t.x, z: t.z, r: 1.6 * t.s, y0: y + 1.9 * t.s * a, y1: y + 6 * t.s * a });
      });
      scene.add(trunk); scene.add(crown);
    }
    const A = [], B = [];
    // Floresta de Vésperas: árvores altas, com espaço para andar e lutar entre elas
    const F = M.LOCAIS.floresta;
    let tent = 0;
    while (A.length + B.length < 620 && tent < 12000) {
      tent++;
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * F.r;
      const x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d;
      if (!livre(x, z, 0) || perto(x, z, 5.2)) continue;
      const t = { x, z, s: rnd(1.1, 1.6), alt: rnd(1.5, 2.2), r: rnd(0, 6) };
      marcar(t); (Math.random() < 0.75 ? A : B).push(t);
    }
    tent = 0;
    while (tent < 9000 && A.length + B.length < 1050) {
      tent++;
      const x = rnd(-185, 185), z = rnd(-185, 185);
      if (Math.hypot(x - F.x, z - F.z) < F.r + 4 || !livre(x, z, 2) || perto(x, z, 7)) continue;
      const t = { x, z, s: rnd(0.9, 1.5), alt: rnd(1.1, 1.7), r: rnd(0, 6) };
      marcar(t); (Math.random() < 0.5 ? A : B).push(t);
    }
    if (OV.cenario) {
      // muitas espécies, de tamanhos diferentes: na floresta, carvalhos, pinheiros, abetos e bétulas;
      // perto da vila e do mosteiro, pomares e árvores floridas; nos campos, um pouco de tudo
      const V = S.vila;
      OV.cenario.arvoredo(A.map(t => ({ ...t, alt: t.alt * 0.82 })).concat(B.map(t => ({ ...t, alt: t.alt * 0.82 }))), (x, z) => {
        if (Math.hypot(x - F.x, z - F.z) < F.r) return [['carvalho', 4], ['pinheiro', 3], ['abeto', 2], ['betula', 1.5], ['seca', 0.4], ['macieira', 0.25]];
        if (Math.hypot(x - V.x, z - V.z) < 75 || Math.hypot(x, z) < 70) return [['macieira', 3], ['pereira', 2], ['cerejeira', 2], ['amendoeira', 1.2], ['carvalho', 2], ['olaia', 0.8], ['cipreste', 1], ['betula', 0.8]];
        return [['carvalho', 4], ['betula', 2], ['pinheiro', 2], ['cerejeira', 0.9], ['acacia', 0.6], ['macieira', 0.8], ['olaia', 0.4], ['cipreste', 0.6]];
      }, { semente: 'vale' });
    } else { arvores(A, 0x1d2a1c); arvores(B, 0x3b2d1a); }

    const pedras = [];
    for (let i = 0; i < 900 && pedras.length < 320; i++) {
      let x, z;
      if (i < 260) { x = S.ermida.x + rnd(-30, 30); z = S.ermida.z + rnd(-30, 30); }
      else if (i < 330) { x = S.covil.x + rnd(-9, 9); z = S.covil.z + rnd(-9, 9); }
      else { x = rnd(-185, 185); z = rnd(-185, 185); }
      if (!livre(x, z, 0.5)) continue;
      pedras.push({ x, z, s: rnd(0.4, 1.9) });
    }
    const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MAT.rock, pedras.length); rk.castShadow = true; rk.receiveShadow = true;
    pedras.forEach((p, i) => {
      dummy.position.set(p.x, H(p.x, p.z) + p.s * 0.35, p.z); dummy.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); dummy.scale.set(p.s, p.s * 0.75, p.s); dummy.updateMatrix(); rk.setMatrixAt(i, dummy.matrix);
      if (p.s > 0.9) M.obstacles.push({ x: p.x, z: p.z, r: p.s * 0.8 });
    });
    scene.add(rk);

    if (OV.cenario) {
      const Cn = OV.cenario;
      Cn.manchar(M.terreno);
      // o chão: capim em tufos, flores silvestres em prados, arbustos, pedrinhas; na floresta, samambaias e cogumelos
      const naFloresta = (x, z) => Math.hypot(x - F.x, z - F.z) < F.r;
      Cn.chao({
        area: [-185, 185, -185, 185], casas: M.RECTS, semente: 'chao-vale',
        livre: (x, z, m) => !(Math.abs(x) < 17 && Math.abs(z) < 17) && Math.hypot(x - S.vila.x, z - S.vila.z) > 13 && Math.hypot(x * 0.95, z) < M.LIM && M.distEstrada(x, z) > 1.6 + m && Math.abs(x - M.rioX(z)) > 4 + m,
        n: { capim: 13000, flores: 1900, arbustos: 520, pedrinhas: 800, cogumelos: 180, samambaias: 650 },
        floresta: naFloresta, prado: (x, z) => naFloresta(x, z) ? 0.25 : Cn.prado(x, z)
      });
    } else {
      const G = 5200, gr = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.42, 3), sm(0x3b3a22), G);
      let n = 0;
      for (let i = 0; i < G * 3 && n < G; i++) {
        const x = rnd(-185, 185), z = rnd(-185, 185);
        if (Math.abs(x) < 17 && Math.abs(z) < 17) continue;
        if (Math.hypot(x - S.vila.x, z - S.vila.z) < 16) continue;
        if (Math.hypot(x * 0.95, z) > M.LIM || M.distEstrada(x, z) < 1.6 || Math.abs(x - M.rioX(z)) < 4) continue;
        dummy.position.set(x, H(x, z) + 0.15, z); dummy.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); const sc = rnd(0.7, 1.5); dummy.scale.set(sc, sc, sc); dummy.updateMatrix();
        gr.setMatrixAt(n++, dummy.matrix);
      }
      gr.count = n; scene.add(gr);
    }
    M.LOCAL_COVIL = { x: S.covil.x, z: S.covil.z };
  })();

  /* ---- inimigos que vagam pelo vale ---- */
  M.spawnsMundo = [
    // estrada da vila ao mosteiro
    ['larva', -4, 168, 1], ['larva', 6, 128, 1], ['diabrete', -6, 104, 2], ['diabrete', 8, 98, 2], ['larva', 10, 86, 2, 'forte'],
    ['diabrete', -8, 70, 3], ['diabrete', 7, 62, 3], ['diabrete', 0, 52, 3, 'forte'], ['larva', -10, 40, 2],
    // da vila ao moinho (ponte do sul)
    ['diabrete', 38, 132, 2], ['diabrete', 52, 128, 3], ['larva', 66, 122, 3], ['diabrete', 82, 124, 4, 'forte'],
    // Floresta de Vésperas: lobos e diabretes
    ['diabrete', -48, 136, 2], ['diabrete', -74, 128, 3], ['lobo_cinza', -96, 112, 3], ['lobo_cinza', -100, 116, 3],
    ['diabrete', -120, 104, 4], ['diabrete', -126, 96, 4, 'forte'], ['lobo_cinza', -110, 60, 4], ['lobo_cinza', -116, 64, 4],
    ['diabrete', -100, 70, 4], ['diabrete', -92, 30, 4], ['lobo_cinza', -140, 40, 5, 'forte'], ['lobo_cinza', -86, 80, 7, 'elite'],
    ['diabrete', -150, 72, 5, 'elite'],
    // do mosteiro à ermida (ponte do norte e o rochedo)
    ['diabrete', 34, -24, 3], ['diabrete', 60, -44, 4], ['diabrete', 84, -58, 4, 'forte'], ['larva', 112, -70, 4],
    ['diabrete', 120, -82, 5], ['diabrete', 126, -92, 5], ['larva', 118, -96, 5, 'forte'], ['diabrete', 150, -80, 6, 'elite'],
    // colinas do sul (mina e acampamento)
    ['larva', -30, 168, 2], ['larva', 30, 164, 2], ['diabrete', 50, 170, 3], ['larva', -44, 178, 3, 'forte'],
    // campos abertos
    ['diabrete', 60, 60, 4], ['larva', 50, 30, 3], ['diabrete', -40, -40, 4], ['diabrete', -60, -60, 5, 'forte'], ['larva', -120, -40, 5],
    ['diabrete', -150, -90, 7, 'elite'], ['diabrete', 150, 40, 5], ['larva', 160, 70, 6, 'forte'], ['diabrete', 60, -120, 6]
  ];
})(window.OV);

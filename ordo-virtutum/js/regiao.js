/* Ordo Virtutum — construtor de regiões distantes (Atos III em diante).
   Cada região fica numa área separada do mapa e traz o seu relevo, estradas, zonas, terreno, casas e vegetação.
   Coordenadas "locais" (lx, lz) são relativas ao centro da região (OX, OZ). */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const { rnd, clamp } = OV.util;
  const sm = OV.sm, mesh = OV.mesh, scene = M.scene, MAT = M.MAT, smooth = M.smooth;
  OV.regioes = OV.regioes || {};

  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
    const t = L ? clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1) : 0;
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
  }

  OV.criarRegiao = function (cfg) {
    const R = { id: cfg.id, nome: cfg.nome, OX: cfg.OX, OZ: cfg.OZ, MEIO: cfg.meio, RECTS: [], cfg, subterraneo: cfg.subterraneo || null };
    const X = lx => R.OX + lx, Z = lz => R.OZ + lz;
    R.W = (lx, lz) => ({ x: X(lx), z: Z(lz) });
    R.dentro = cfg.dentro;
    R.ESTRADAS = cfg.estradas || [];
    R.PLANOS = cfg.planos || [];
    R.distEstrada = (lx, lz) => { let d = 1e9; for (const L of R.ESTRADAS) for (let i = 0; i < L.length - 1; i++) d = Math.min(d, distSeg(lx, lz, L[i][0], L[i][1], L[i + 1][0], L[i + 1][1])); return d; };
    R.relevo = function (lx, lz) {
      let h = cfg.relevo(lx, lz);
      for (const p of R.PLANOS) { const w = 1 - smooth(p.r * 0.6, p.r, Math.hypot(lx - p.x, lz - p.z)); if (w > 0) h = h * (1 - w) + p.h * w; }
      if (cfg.depois) h = cfg.depois(lx, lz, h);
      return M.nivelar ? M.nivelar(lx + R.OX, lz + R.OZ, h) : h;
    };
    R.altura = (x, z) => R.relevo(x - R.OX, z - R.OZ);
    const H = (lx, lz) => R.relevo(lx, lz);
    R.H = H;
    const LIM = R.MEIO - 6;
    R.limitar = function (p) {
      let lx = clamp(p.x - R.OX, -LIM, LIM), lz = clamp(p.z - R.OZ, -LIM, LIM);
      if (cfg.limitar) { const q = cfg.limitar(lx, lz); if (q) { lx = q[0]; lz = q[1]; } }
      p.x = X(lx); p.z = Z(lz);
    };
    R.ZONAS = cfg.zonas || [];
    R.zona = function (x, z) { const lx = x - R.OX, lz = z - R.OZ; for (const [k, cx, cz, r] of R.ZONAS) if (Math.hypot(lx - cx, lz - cz) < r) return k; return R.id; };
    // lugares com nome (para a faixa de chegada e o mapa)
    M.LOCAIS[R.id] = { nome: R.nome };
    R.LOCAIS = [];
    for (const k in (cfg.locais || {})) { const l = cfg.locais[k]; M.LOCAIS[k] = { nome: l.nome, x: X(l.x), z: Z(l.z), oy: l.oy }; R.LOCAIS.push(k); }
    R.ENTRADA = { x: X(cfg.entrada.x), z: Z(cfg.entrada.z), facing: cfg.entrada.facing };
    M.REGIOES.push(R); OV.regioes[R.id] = R;

    /* ---- terreno ---- */
    (function () {
      const S = R.MEIO * 2 + 30, N = cfg.malha || 150;
      const geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
      const pal = cfg.paleta;
      const ROCHA = new THREE.Color(pal.rocha), CHAO = new THREE.Color(pal.estrada), ALTO = new THREE.Color(pal.alto || pal.rocha);
      for (let i = 0; i < pos.count; i++) {
        const lx = pos.getX(i), lz = pos.getZ(i), h = R.relevo(lx, lz); pos.setY(i, h);
        const g = 0.5 + 0.5 * Math.sin(lx * 0.17) * Math.cos(lz * 0.13);
        c.setHSL(pal.h + g * 0.04, pal.s, pal.l + g * 0.05);
        if (pal.rochaDe !== undefined && h > pal.rochaDe) c.lerp(ROCHA, smooth(pal.rochaDe, pal.rochaDe + 10, h));
        if (pal.altoDe !== undefined && h > pal.altoDe) c.lerp(ALTO, smooth(pal.altoDe, pal.altoDe + 8, h));
        const est = R.distEstrada(lx, lz); if (est < 3) c.lerp(CHAO, 1 - smooth(1.3, 3, est));
        if (cfg.corExtra) cfg.corExtra(lx, lz, h, c);
        cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
      const t = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
      t.position.set(R.OX, 0, R.OZ); t.receiveShadow = true; scene.add(t); R.terreno = t; if (M.terrenos) M.terrenos.push(t);
      if (OV.cenario) OV.cenario.manchar(t, cfg.manchas || {});
    })();

    /* ---- ajudantes (coordenadas locais) ---- */
    R.grupo = (lx, lz, rot, y) => M.grupo(X(lx), Z(lz), rot, y);
    R.caixa = (lx, lz, hw, hd, rot) => M.caixa(X(lx), Z(lz), hw, hd, rot);
    R.obst = (lx, lz, r) => M.obstacles.push({ x: X(lx), z: Z(lz), r });
    R.inter = (lx, lz, r, txt, acao) => M.interativo(X(lx), Z(lz), r, txt, acao);
    R.emissor = (lx, y, lz, i, dist, cor, fl) => M.emissor(X(lx), y, Z(lz), i, dist, cor, fl);
    R.casa = (lx, lz, rot, w, d, h, op) => { R.RECTS.push([lx, lz, w, d, rot]); return M.casa(X(lx), Z(lz), rot, w, d, h, op); };
    R.casaInt = (lx, lz, rot, w, d, h, op) => { R.RECTS.push([lx, lz, w, d, rot]); return M.casaInterior(X(lx), Z(lz), rot, w, d, h, op); };
    R.oratorio = (id, nome, lx, lz, rot) => M.criarOratorio(id, nome, X(lx), Z(lz), rot);
    R.fig = (lx, lz, rot, op) => M.criarFigura(X(lx), Z(lz), rot, op);
    R.lanterna = function (lx, lz, cor) {
      const h = H(lx, lz);
      scene.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 5), MAT.wood, X(lx), h + 1.3, Z(lz)));
      scene.add(mesh(new THREE.BoxGeometry(0.34, 0.42, 0.34), MAT.winLit, X(lx), h + 2.75, Z(lz)));
      R.emissor(lx, h + 2.8, lz, 0.9, 8, cor || 0xe0902e); R.obst(lx, lz, 0.25);
    };
    R.placa = function (lx, lz, rot) {
      const g = R.grupo(lx, lz, rot);
      g.add(mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), MAT.wood, 0, 1.15, 0));
      g.add(mesh(new THREE.BoxGeometry(1.7, 0.42, 0.08), MAT.woodL, 0.55, 1.9, 0));
      const p = mesh(new THREE.ConeGeometry(0.24, 0.4, 3), MAT.woodL, 1.5, 1.9, 0); p.rotation.z = -Math.PI / 2; g.add(p);
      const t2 = mesh(new THREE.BoxGeometry(1.5, 0.36, 0.08), MAT.woodL, -0.4, 1.4, 0); t2.rotation.y = 0.5; g.add(t2);
      R.obst(lx, lz, 0.25);
      return g;
    };
    // praça circular de pedra
    R.praca = function (lx, lz, raio) {
      const y0 = H(lx, lz);
      const piso = new THREE.Mesh(new THREE.CircleGeometry(raio, 36), MAT.stone); piso.rotation.x = -Math.PI / 2; piso.position.set(X(lx), y0 + 0.05, Z(lz)); piso.receiveShadow = true; scene.add(piso);
      return y0;
    };
    // árvores, pedras e capim, em instâncias
    R.livre = function (lx, lz, m) {
      if (Math.abs(lx) > LIM - 2 || Math.abs(lz) > LIM - 2) return false;
      if (R.distEstrada(lx, lz) < 3.5 + m) return false;
      if (M.CASAS_PEREGRINO && M.CASAS_PEREGRINO.some(([rg, x, z]) => rg === R.id && Math.hypot(X(lx) - x, Z(lz) - z) < 9 + m)) return false;
      for (const p of R.PLANOS) if (p.semArvore !== false && Math.hypot(lx - p.x, lz - p.z) < p.r * 0.85 + m) return false;
      for (const [x, z, w, d] of R.RECTS) if (Math.abs(lx - x) < w / 2 + 2 + m && Math.abs(lz - z) < d / 2 + 2 + m) return false;
      if (cfg.livre && !cfg.livre(lx, lz)) return false;
      return true;
    };
    R.vegetacao = function (op) {
      const dummy = new THREE.Object3D();
      const arv = [];
      for (let t = 0; t < op.arvores * 12 && arv.length < op.arvores; t++) {
        const lx = rnd(-LIM, LIM), lz = rnd(-LIM, LIM);
        const dens = op.densidade ? op.densidade(lx, lz) : 1; if (Math.random() > dens) continue;
        if (!R.livre(lx, lz, 0.6)) continue;
        if (arv.some(a => Math.abs(a.x - lx) < op.espaco && Math.abs(a.z - lz) < op.espaco && Math.hypot(a.x - lx, a.z - lz) < op.espaco)) continue;
        arv.push({ x: lx, z: lz, s: rnd(op.esc[0], op.esc[1]), r: rnd(0, 6) });
      }
      if (OV.cenario && op.especies) {
        OV.cenario.arvoredo(arv.map(t => ({ x: X(t.x), z: Z(t.z), s: t.s, r: t.r, alt: (op.alto || 1) * 0.85 })), op.especies, { H: R.altura, semente: R.id });
      } else {
        const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 2, 5), sm(op.corTronco || 0x2a1d14), arv.length);
        const copa = new THREE.InstancedMesh(op.geoCopa || new THREE.ConeGeometry(1.1, 4.2, 6), sm(op.corCopa || 0x1e2e1e), arv.length);
        tronco.castShadow = copa.castShadow = true;
        arv.forEach((t, i) => {
          const y = H(t.x, t.z), a = op.alto || 1;
          dummy.position.set(X(t.x), y + 1 * t.s * a, Z(t.z)); dummy.rotation.set(0, t.r, 0); dummy.scale.set(t.s, t.s * a, t.s); dummy.updateMatrix(); tronco.setMatrixAt(i, dummy.matrix);
          dummy.position.set(X(t.x), y + (op.yCopa || 3.6) * t.s * a, Z(t.z)); dummy.scale.set(t.s, t.s * a * (op.copaAlta || 1), t.s); dummy.updateMatrix(); copa.setMatrixAt(i, dummy.matrix);
          M.obstacles.push({ x: X(t.x), z: Z(t.z), r: 0.4 * t.s });
          M.copas.push({ x: X(t.x), z: Z(t.z), r: (op.raioCopa || 1.1) * t.s, y0: y + 1.6 * t.s * a, y1: y + 6.5 * t.s * a });
        });
        scene.add(tronco); scene.add(copa);
      }
      if (op.pedras) {
        const ps = [];
        for (let i = 0; i < op.pedras * 6 && ps.length < op.pedras; i++) { const lx = rnd(-LIM, LIM), lz = rnd(-LIM, LIM); if (!R.livre(lx, lz, 0.3)) continue; ps.push({ x: lx, z: lz, s: rnd(0.4, 1.8) }); }
        const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), op.matPedra || MAT.rock, ps.length); rk.castShadow = true; rk.receiveShadow = true;
        ps.forEach((p, i) => { dummy.position.set(X(p.x), H(p.x, p.z) + p.s * 0.2, Z(p.z)); dummy.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); dummy.scale.set(p.s, p.s * 0.7, p.s); dummy.updateMatrix(); rk.setMatrixAt(i, dummy.matrix); if (p.s > 1) R.obst(p.x, p.z, p.s * 0.8); });
        scene.add(rk);
      }
      if (op.capim && OV.cenario && op.chao) {
        const ch = op.chao;
        OV.cenario.chao({
          area: [X(-LIM), X(LIM), Z(-LIM), Z(LIM)], casas: M.RECTS, H: R.altura, semente: 'chao-' + R.id,
          livre: (x, z, m) => { const lx = x - R.OX, lz = z - R.OZ; return Math.abs(lx) < LIM && Math.abs(lz) < LIM && R.distEstrada(lx, lz) > 1.8 + m && !(op.semCapim && op.semCapim(lx, lz)); },
          n: Object.assign({ capim: Math.round(op.capim * 2.2), flores: Math.round(op.capim / 6), arbustos: Math.round(op.capim / 12), pedrinhas: Math.round(op.capim / 8) }, ch.n || {}),
          paleta: ch.paleta, floresta: ch.floresta, prado: ch.prado
        });
      } else       if (op.capim) {
        const G = op.capim, gr = new THREE.InstancedMesh(new THREE.ConeGeometry(0.07, 0.42, 3), sm(op.corCapim || 0x4a5226), G);
        let n = 0;
        for (let i = 0; i < G * 3 && n < G; i++) {
          const lx = rnd(-LIM, LIM), lz = rnd(-LIM, LIM);
          if (R.distEstrada(lx, lz) < 1.8) continue;
          if (op.semCapim && op.semCapim(lx, lz)) continue;
          dummy.position.set(X(lx), H(lx, lz) + 0.15, Z(lz)); dummy.rotation.set(rnd(-0.3, 0.3), 0, rnd(-0.3, 0.3)); dummy.scale.setScalar(rnd(0.7, 1.4)); dummy.updateMatrix();
          gr.setMatrixAt(n++, dummy.matrix);
        }
        gr.count = n; scene.add(gr);
      }
    };

    /* ---- o mapa da região (tecla M) ---- */
    R.mapa = { nome: R.nome, cx: R.OX, cz: R.OZ, tam: R.MEIO * 2 };
    R.desenharMapa = function (g, SZ, ESC, px) {
      const T = R.MEIO * 2, pal = cfg.paleta;
      for (let y = 0; y < SZ; y += 4) for (let x = 0; x < SZ; x += 4) {
        const lx = x / ESC - T / 2, lz = y / ESC - T / 2, h = R.relevo(lx, lz);
        const l = 13 + Math.max(-6, Math.min(30, h)) * 0.7;
        g.fillStyle = `hsl(${(pal.mapaH !== undefined ? pal.mapaH : 34)},${pal.mapaS || 18}%,${l.toFixed(1)}%)`;
        g.fillRect(x, y, 4, 4);
      }
      if (cfg.mapaExtra) cfg.mapaExtra(g, (lx, lz) => px(X(lx), Z(lz)), ESC);
      g.strokeStyle = 'rgba(214,196,160,.75)'; g.lineWidth = 2; g.setLineDash([6, 4]);
      R.ESTRADAS.forEach(L => { g.beginPath(); L.forEach(([lx, lz], i) => { const [a, b] = px(X(lx), Z(lz)); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.stroke(); });
      g.setLineDash([]);
      g.fillStyle = '#d6c8a8';
      R.RECTS.forEach(([lx, lz, w, d, r]) => { const [a, b] = px(X(lx), Z(lz)); g.save(); g.translate(a, b); g.rotate(-(r || 0)); g.fillRect(-w / 2 * ESC, -d / 2 * ESC, Math.max(2, w * ESC), Math.max(2, d * ESC)); g.restore(); });
    };
    return R;
  };
})(window.OV);

/* Ordo Virtutum — motor do mundo: renderizador, relevo do vale, rio, estradas, colisão, luzes e céu */
(function (OV) {
  'use strict';
  const { clamp, rnd } = OV.util;
  const M = { obstacles: [], caixas: [], copas: [], emissores: [], flames: [], interativos: [], oratorios: {}, animados: [] };
  OV.mundo = M;

  const PIX = 3;
  const canvas = document.getElementById('c');
  try { M.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
  catch (e) { M.falhou = true; return; }
  M.renderer.setPixelRatio(1);
  M.renderer.shadowMap.enabled = true;
  M.renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene(); M.scene = scene;
  const FOG = 0x140b10;
  scene.background = new THREE.Color(FOG);
  scene.fog = new THREE.Fog(FOG, 24, 88);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 190); M.camera = camera;
  M.resize = function () {
    const w = innerWidth, h = innerHeight;
    M.renderer.setSize(Math.max(1, Math.floor(w / PIX)), Math.max(1, Math.floor(h / PIX)), false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  addEventListener('resize', M.resize); M.resize();

  /* ---- ajudantes ---- */
  OV.sm = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.88, metalness: 0, flatShading: true }, o || {}));
  OV.mesh = function (geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; return m; };
  M.canvasTex = function (w, h, draw, rx, ry) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); return t;
  };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  M.smooth = smooth;
  function distSeg(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz;
    const t = L ? clamp(((px - ax) * dx + (pz - az) * dz) / L, 0, 1) : 0;
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
  }

  /* ---- geografia do vale (norte = -z) ---- */
  /* o vale ampliado: cerca de 380 m de ponta a ponta; o mosteiro fica no centro */
  M.LIM = 190;
  M.rioX = z => 100 + 12 * Math.sin(z / 50) + 6 * Math.sin(z / 18);
  M.PONTES = [120, -60].map(z => ({ z, x: M.rioX(z), deck: 0 }));
  const MOINHO_X = M.rioX(115) + 10.3;
  M.SITIO = { vila: { x: 0, z: 150 }, moinho: { x: MOINHO_X, z: 115 }, capela: { x: -150, z: 100 }, ruinas: { x: -105, z: 45 }, ermida: { x: 140, z: -110 }, mina: { x: -62, z: 172 }, acampamento: { x: 72, z: 166 }, covil: { x: -172, z: 48 } };
  M.LOCAIS = {
    claustro: { nome: 'Claustro de Santa Sabina', x: 0, z: 0 },
    mosteiro: { nome: 'Mosteiro de Santa Sabina', x: 0, z: -14, r: 40 },
    cripta: { nome: 'Entrada da Cripta', x: 27, z: -12, r: 7 },
    vila: { nome: 'Vila de São Roque', x: 0, z: 150, r: 50 },
    capela: { nome: 'Capela de São Roque', x: -150, z: 100, r: 12 },
    floresta: { nome: 'Floresta de Vésperas', x: -115, z: 70, r: 78 },
    moinho: { nome: 'Moinho do Rio Lento', x: MOINHO_X, z: 115, r: 18 },
    ermida: { nome: 'Ermida de Antão', x: 140, z: -110, r: 26 },
    mina: { nome: 'Mina Velha', x: -62, z: 172, r: 12 },
    acampamento: { nome: 'Acampamento dos Possessos', x: 72, z: 166, r: 13 },
    covil: { nome: 'Covil do Lobo', x: -172, z: 48, r: 12 },
    ossuario: { nome: 'Ossuário de Santa Sabina' },
    sala: { nome: 'Sala dos Monges' },
    camara: { nome: 'Câmara do Meio-Dia' }
  };
  M.ESTRADAS = [
    [[0, 16], [2, 45], [-3, 80], [-6, 104], [-9, 118], [-9, 134], [-4, 142]],
    [[0, 164], [-2, 188]],
    [[14, 146], [40, 136], [70, 126], [M.rioX(120) - 7, 120], [M.rioX(120) + 7, 120], [MOINHO_X - 2, 121]],
    [[-14, 152], [-50, 140], [-85, 122], [-115, 108], [-142, 101]],
    [[16, -6], [38, -28], [M.rioX(-60) - 7, -60], [M.rioX(-60) + 7, -60], [118, -76], [132, -94], [136, -103]],
    [[16, -4], [22, -10]],
    [[12, 162], [40, 166], [64, 166]],
    [[-10, 164], [-36, 170], [-56, 172]],
    [[-85, 122], [-100, 80], [-104, 52]]
  ];
  M.distEstrada = function (x, z) {
    let d = 1e9;
    for (const L of M.ESTRADAS) for (let i = 0; i < L.length - 1; i++) d = Math.min(d, distSeg(x, z, L[i][0], L[i][1], L[i + 1][0], L[i + 1][1]));
    return d;
  };
  const PLANOS = [
    { x: 0, z: -12, r: 44, h: 0 },
    { x: 0, z: 150, r: 56, h: 0.6 },
    { x: MOINHO_X, z: 115, r: 16, h: 0.5 },
    { x: -150, z: 100, r: 13, h: 1.2 },
    { x: 27, z: -12, r: 9, h: 0 },
    { x: 72, z: 166, r: 12, h: 0.8 }
  ];
  function relevo(x, z) {
    let h = 2.4 * Math.sin(x * 0.0225) * Math.cos(z * 0.025) + 1.4 * Math.sin(x * 0.055 + 1.3) * Math.sin(z * 0.045 + 0.7) + 0.5 * Math.sin(x * 0.155 + z * 0.135);
    h += 24 * Math.exp(-((x - 140) ** 2 + (z + 110) ** 2) / (2 * 28 * 28));
    h += 10 * Math.exp(-((x + 170) ** 2 + (z + 80) ** 2) / (2 * 36 * 36));
    h += 7 * Math.exp(-((x + 62) ** 2 + (z - 196) ** 2) / (2 * 26 * 26));
    h += 4 * Math.exp(-((x - 60) ** 2 + (z - 60) ** 2) / (2 * 30 * 30));
    h += smooth(166, 228, Math.hypot(x * 0.95, z)) * 44;
    for (const p of PLANOS) { const w = 1 - smooth(p.r * 0.6, p.r, Math.hypot(x - p.x, z - p.z)); h = h * (1 - w) + p.h * w; }
    const dr = Math.abs(x - M.rioX(z));
    h -= 2.4 * (1 - smooth(2.5, 7, dr));
    return h;
  }
  M.relevo = relevo;
  const VAU = -1.55;
  // dentro d'água (para andar mais devagar)
  M.naAgua = (x, z) => x < 200 && z < 400 && z > -232 && !M.regiaoEm(x, z) && !M.naPonte(x, z) && Math.abs(x - M.rioX(z)) < 3.6 && relevo(x, z) < -0.95;
  M.PONTES.forEach(p => { p.deck = Math.max(relevo(p.x - 6, p.z), relevo(p.x + 6, p.z), 0) + 0.25; });
  M.naPonte = (x, z) => M.PONTES.some(p => Math.abs(z - p.z) < 2.2 && Math.abs(x - p.x) < 6.2);
  // regiões distantes (Atos III em diante) se registram aqui: cada uma sabe a própria altura, limites e zonas
  M.REGIOES = [];
  M.regiaoEm = function (x, z) { for (const r of M.REGIOES) if (r.dentro(x, z)) return r; return null; };
  M.altura = function (x, z) {
    if (x > 200 && OV.cripta) return OV.cripta.altura(x, z);
    if (M.REGIOES.length) { const R = M.regiaoEm(x, z); if (R) return R.altura(x, z); }
    if (z > 400 && OV.porto) return OV.porto.altura(x, z);
    let h = M.nivelar(x, z, relevo(x, z));
    // no rio, o pé firma num vau raso: a água bate na cintura, nunca acima
    if (Math.abs(x - M.rioX(z)) < 7 && Math.abs(z) < 232) h = Math.max(h, VAU);
    for (const p of M.PONTES) if (Math.abs(z - p.z) < 2.2 && Math.abs(x - p.x) < 6.2) return Math.max(h, p.deck);
    return h;
  };

  /* ---- patamares: o chão se nivela debaixo de cada construção (e desce em rampa suave ao redor),
     para nenhuma casa ficar flutuando numa encosta. Cada construção registra o seu; depois de tudo
     construído, M.reassentar() refaz a altura dos vértices do terreno perto deles. ---- */
  M.patamares = [];
  const gradeP = new Map(), GP = 16;
  M.patamar = function (x, z, rot, hw, hd, y, margem) {
    const p = { x, z, c: Math.cos(rot || 0), s: Math.sin(rot || 0), hw, hd, y, m: margem === undefined ? 4.5 : margem };
    const R = Math.hypot(hw, hd) + p.m + 1;
    for (let i = Math.floor((x - R) / GP); i <= Math.floor((x + R) / GP); i++) for (let j = Math.floor((z - R) / GP); j <= Math.floor((z + R) / GP); j++) {
      const k = i + ',' + j; if (!gradeP.has(k)) gradeP.set(k, []); gradeP.get(k).push(p);
    }
    M.patamares.push(p); return p;
  };
  M.nivelar = function (x, z, h) {
    const l = gradeP.get(Math.floor(x / GP) + ',' + Math.floor(z / GP)); if (!l) return h;
    let melhor = 0, y = h;
    for (const p of l) {
      const dx = x - p.x, dz = z - p.z, lx = dx * p.c - dz * p.s, lz = dx * p.s + dz * p.c;
      const e = Math.hypot(Math.max(0, Math.abs(lx) - p.hw), Math.max(0, Math.abs(lz) - p.hd));
      const w = e <= 0.9 ? 1 : 1 - smooth(0.9, 0.9 + p.m, e);
      if (w > melhor) { melhor = w; y = p.y; }
    }
    return melhor > 0 ? h + (y - h) * melhor : h;
  };
  // refaz a altura dos vértices do terreno perto dos patamares (chamado depois de tudo construído)
  M.terrenos = [];
  M.reassentar = function () {
    for (const t of M.terrenos) {
      if (!t) continue;
      const pos = t.geometry.attributes.position, ox = t.position.x, oz = t.position.z; let mudou = false;
      if (!t.userData.y0) t.userData.y0 = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));
      const y0 = t.userData.y0;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + ox, z = pos.getZ(i) + oz;
        if (!gradeP.has(Math.floor(x / GP) + ',' + Math.floor(z / GP))) continue;
        const y = M.nivelar(x, z, y0[i]); if (Math.abs(y - pos.getY(i)) > 1e-3) { pos.setY(i, y); mudou = true; }
      }
      if (mudou) { pos.needsUpdate = true; t.geometry.computeVertexNormals(); t.geometry.computeBoundingSphere(); }
    }
  };

  /* ---- terreno ---- */
  (function () {
    const S = 460, N = 230;
    const geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = relevo(x, z); pos.setY(i, h);
      const est = M.distEstrada(x, z), rio = Math.abs(x - M.rioX(z));
      const grama = 0.5 + 0.5 * Math.sin(x * 0.21) * Math.cos(z * 0.17);
      c.setHSL(0.2 + grama * 0.05, 0.28, 0.13 + grama * 0.04);
      if (h > 9) c.lerp(new THREE.Color(0x4a443e), smooth(9, 16, h));
      if (h > 20) c.lerp(new THREE.Color(0x2a2626), smooth(20, 30, h));
      if (rio < 6) c.lerp(new THREE.Color(0x2b2218), 1 - smooth(3, 6, rio));
      if (est < 3) c.lerp(new THREE.Color(0x4b3a28), 1 - smooth(1.2, 3, est));
      const vila = Math.hypot(x, z - 150); if (vila < 16) c.lerp(new THREE.Color(0x3d3126), 1 - smooth(11, 16, vila));
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const t = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    t.receiveShadow = true; scene.add(t); M.terreno = t; M.terrenos.push(t);

    // o rio
    const pts = []; for (let z = -230; z <= 230; z += 3) pts.push(z);
    const wg = new THREE.BufferGeometry(); const vtx = [], idx = [];
    pts.forEach((z, i) => { const x = M.rioX(z); vtx.push(x - 3.6, -0.9, z, x + 3.6, -0.9, z); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
    wg.setAttribute('position', new THREE.Float32BufferAttribute(vtx, 3)); wg.setIndex(idx); wg.computeVertexNormals();
    M.agua = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: 0x1a2838, roughness: 0.25, metalness: 0.3, emissive: 0x060c16 }));
    scene.add(M.agua);

    // pontes
    const madeira = OV.sm(0x4a3422);
    M.PONTES.forEach(p => {
      scene.add(OV.mesh(new THREE.BoxGeometry(12.4, 0.3, 4), madeira, p.x, p.deck - 0.15, p.z));
      [-1, 1].forEach(s => {
        scene.add(OV.mesh(new THREE.BoxGeometry(12.4, 0.12, 0.12), madeira, p.x, p.deck + 0.85, p.z + 1.9 * s));
        for (let k = -2; k <= 2; k++) scene.add(OV.mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), madeira, p.x + k * 3, p.deck + 0.4, p.z + 1.9 * s));
      });
    });
  })();

  /* ---- céu ---- */
  (function () {
    const N = 500, a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const th = Math.random() * Math.PI * 2, ph = Math.random() * 1.2; a[i * 3] = Math.cos(th) * Math.sin(ph) * 160; a[i * 3 + 1] = Math.cos(ph) * 160 + 10; a[i * 3 + 2] = Math.sin(th) * Math.sin(ph) * 160; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    M.estrelas = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xd8d0c0, size: 0.6, fog: false }));
    scene.add(M.estrelas);
    M.lua = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xd6cfbb, fog: false, transparent: true }));
    scene.add(M.lua);
    // o sol e seu halo
    M.sol = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2cf, fog: false }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd890, fog: false, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    M.sol.add(halo); M.sol.visible = false; scene.add(M.sol);
    // offsets relativos ao foco (ajustados pelo ciclo do dia em tempo.js)
    M.luaOff = new THREE.Vector3(-55, 62, -100); M.solOff = new THREE.Vector3(0, 120, 60); M.luzOff = new THREE.Vector3(-14, 30, 10);
  })();

  /* ---- luzes ---- */
  M.amb = new THREE.AmbientLight(0x3c2630, 0.62); scene.add(M.amb);
  M.hemi = new THREE.HemisphereLight(0x4a5070, 0x1a0c0c, 0.38); scene.add(M.hemi);
  const moon = new THREE.DirectionalLight(0x8a96c4, 0.55); M.astro = moon;
  M.luzFator = 1; // velas e lanternas pesam menos sob a luz do dia
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 });
  scene.add(moon); scene.add(moon.target);
  M.burstLight = new THREE.PointLight(0xffd27a, 0, 16, 2); scene.add(M.burstLight);

  // conjunto fixo de luzes pontuais, reposicionadas nas fontes mais próximas do jogador
  const POOL = 8; const pool = [];
  for (let i = 0; i < POOL; i++) { const l = new THREE.PointLight(0xff9a3c, 0, 10, 2); scene.add(l); pool.push({ l, e: null }); }
  M.emissor = function (x, y, z, int, dist, cor, flick) {
    const e = { x, y, z, int, dist, cor: cor || 0xff9a3c, ph: Math.random() * 10, flick: flick !== false, ativo: true };
    M.emissores.push(e); return e;
  };
  let poolT = 0;
  function distribuirLuzes(fx, fz) {
    const ativos = M.emissores.filter(e => e.ativo && e.int > 0);
    ativos.forEach(e => { e._d = (e.x - fx) ** 2 + (e.z - fz) ** 2; });
    ativos.sort((a, b) => a._d - b._d);
    for (let i = 0; i < POOL; i++) {
      const e = ativos[i] || null, p = pool[i]; p.e = e;
      if (e) { p.l.position.set(e.x, e.y, e.z); p.l.color.setHex(e.cor); p.l.distance = e.dist; }
      else p.l.intensity = 0;
    }
  }

  /* ---- brasas perto do foco ---- */
  const EMB = 160, embPos = new Float32Array(EMB * 3);
  const embGeo = new THREE.BufferGeometry(); embGeo.setAttribute('position', new THREE.BufferAttribute(embPos, 3));
  for (let i = 0; i < EMB; i++) { embPos[i * 3] = rnd(-14, 14); embPos[i * 3 + 1] = rnd(0, 8); embPos[i * 3 + 2] = rnd(-14, 14); }
  M.brasas = new THREE.PointsMaterial({ color: 0xff8a3a, size: 0.09, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(embGeo, M.brasas));

  let ambT = 0;
  M.ambient = function (dt, fx, fz) {
    ambT += dt;
    poolT -= dt; if (poolT <= 0) { poolT = 0.2; distribuirLuzes(fx, fz); }
    const lf = M.luzFator;
    pool.forEach(p => { if (p.e) p.l.intensity = lf * (p.e.flick ? p.e.int * (0.85 + 0.15 * Math.sin(ambT * 9 + p.e.ph) + 0.08 * Math.sin(ambT * 23 + p.e.ph * 2)) : p.e.int); });
    M.flames.forEach((f, i) => { if (f.visible) f.scale.y = 0.8 + 0.35 * Math.abs(Math.sin(ambT * 11 + i * 1.7)); });
    M.animados.forEach(fn => fn(dt, ambT));
    const fy = M.altura(fx, fz);
    const a = embGeo.attributes.position.array;
    for (let i = 0; i < EMB; i++) {
      a[i * 3 + 1] += dt * (0.35 + (i % 5) * 0.08); a[i * 3] += Math.sin(ambT + i) * dt * 0.15;
      if (a[i * 3 + 1] > fy + 8.5 || Math.abs(a[i * 3] - fx) > 16 || Math.abs(a[i * 3 + 2] - fz) > 16) { a[i * 3] = fx + rnd(-14, 14); a[i * 3 + 1] = fy + rnd(0, 2); a[i * 3 + 2] = fz + rnd(-14, 14); }
    }
    embGeo.attributes.position.needsUpdate = true;
    if (OV.tempo) OV.tempo.aplicar(dt, fx, fz);
    moon.position.set(fx + M.luzOff.x, M.luzOff.y, fz + M.luzOff.z); moon.target.position.set(fx, 0, fz);
    M.estrelas.position.set(fx, 0, fz); M.lua.position.set(fx + M.luaOff.x, M.luaOff.y, fz + M.luaOff.z);
    M.sol.position.set(fx + M.solOff.x, M.solOff.y, fz + M.solOff.z);
  };

  /* ---- colisão ---- */
  M.caixa = function (x, z, hw, hd, rot) { const b = { x, z, hw, hd, c: Math.cos(rot || 0), s: Math.sin(rot || 0), ativa: true }; M.caixas.push(b); return b; };
  // há uma parede entre dois pontos? (para ninguém ferir nem ser ferido através de paredes)
  M.paredeEntre = function (ax, az, bx, bz) {
    const minx = Math.min(ax, bx), maxx = Math.max(ax, bx), minz = Math.min(az, bz), maxz = Math.max(az, bz);
    for (const b of M.caixas) {
      if (!b.ativa) continue;
      const ext = b.hw + b.hd;
      if (b.x + ext < minx || b.x - ext > maxx || b.z + ext < minz || b.z - ext > maxz) continue;
      // os dois pontos no referencial da caixa, e o teste das faixas (Liang-Barsky)
      const dxa = ax - b.x, dza = az - b.z, dxb = bx - b.x, dzb = bz - b.z;
      const lax = dxa * b.c - dza * b.s, laz = dxa * b.s + dza * b.c, lbx = dxb * b.c - dzb * b.s, lbz = dxb * b.s + dzb * b.c;
      const hw = b.hw - 0.04, hd = b.hd - 0.04; if (hw <= 0 || hd <= 0) continue;
      let t0 = 0, t1 = 1; const dx = lbx - lax, dz = lbz - laz;
      const corta = (p, q) => { if (Math.abs(p) < 1e-9) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
      if (corta(-dx, lax + hw) && corta(dx, hw - lax) && corta(-dz, laz + hd) && corta(dz, hd - laz) && t0 <= t1) return true;
    }
    return false;
  };
  M.collide = function (p, r) {
    const RG = M.regiaoEm(p.x, p.z);
    const cripta = p.x > 200 || p.z > 400 || !!RG;
    if (RG) RG.limitar(p, r);
    else if (p.z > 400 && OV.porto) OV.porto.limitar(p, r);
    if (!cripta) { const rr = Math.hypot(p.x * 0.95, p.z), lim = M.LIM; if (rr > lim) { const k = lim / rr; p.x *= k; p.z *= k; } }
    for (const o of M.obstacles) {
      const dx = p.x - o.x, dz = p.z - o.z; if (Math.abs(dx) > o.r + r || Math.abs(dz) > o.r + r) continue;
      const d = Math.hypot(dx, dz), m = o.r + r;
      if (d < m && d > 1e-4) { p.x = o.x + dx / d * m; p.z = o.z + dz / d * m; }
    }
    for (const b of M.caixas) {
      if (!b.ativa) continue;
      const dx = p.x - b.x, dz = p.z - b.z; if (Math.abs(dx) > b.hw + b.hd + r || Math.abs(dz) > b.hw + b.hd + r) continue;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      const cx = clamp(lx, -b.hw, b.hw), cz = clamp(lz, -b.hd, b.hd);
      let nx = lx - cx, nz = lz - cz, d = Math.hypot(nx, nz);
      if (d >= r) continue;
      let ox, oz;
      if (d > 1e-5) { ox = cx + nx / d * r; oz = cz + nz / d * r; }
      else {
        const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz);
        if (px < pz) { ox = Math.sign(lx || 1) * (b.hw + r); oz = lz; } else { ox = lx; oz = Math.sign(lz || 1) * (b.hd + r); }
      }
      p.x = b.x + ox * b.c + oz * b.s; p.z = b.z - ox * b.s + oz * b.c;
    }
    // o rio não é mais muralha: dá para atravessá-lo a vau (e o leito seco, a pé)
  };

  /* ---- câmera: recua diante de paredes e copas de árvores ---- */
  function bloqueado(x, y, z) {
    for (const b of M.caixas) {
      if (!b.ativa || b.semCamera) continue;
      const dx = x - b.x, dz = z - b.z; if (Math.abs(dx) > b.hw + b.hd + 0.3 || Math.abs(dz) > b.hw + b.hd + 0.3) continue;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      if (Math.abs(lx) < b.hw + 0.25 && Math.abs(lz) < b.hd + 0.25) return true;
    }
    for (const c of M.copas) {
      if (Math.abs(x - c.x) > c.r || Math.abs(z - c.z) > c.r || y < c.y0 || y > c.y1) continue;
      const k = 1 - (y - c.y0) / (c.y1 - c.y0);
      if (Math.hypot(x - c.x, z - c.z) < c.r * (0.35 + 0.65 * k)) return true;
    }
    return false;
  }
  M.recuarCamera = function (alvo, desejo) {
    const N = 14;
    for (let i = 2; i <= N; i++) {
      const t = i / N;
      if (bloqueado(alvo.x + (desejo.x - alvo.x) * t, alvo.y + (desejo.y - alvo.y) * t, alvo.z + (desejo.z - alvo.z) * t)) {
        const k = Math.max(0.22, (i - 1.5) / N);
        desejo.set(alvo.x + (desejo.x - alvo.x) * k, alvo.y + (desejo.y - alvo.y) * k, alvo.z + (desejo.z - alvo.z) * k);
        return;
      }
    }
  };

  /* ---- interação ---- */
  M.interativo = function (x, z, r, texto, acao) { const i = { x, z, r, texto, acao }; M.interativos.push(i); return i; };
  M.removerInterativo = function (i) { const k = M.interativos.indexOf(i); if (k >= 0) M.interativos.splice(k, 1); };
  M.interativoProximo = function (x, z) {
    let best = null, bd = 1e9;
    for (const i of M.interativos) { const d = Math.hypot(i.x - x, i.z - z); if (d < i.r && d < bd && i.texto()) { bd = d; best = i; } }
    return best;
  };
  M.zonasExtra = [];
  M.zonaEm = function (x, z) {
    for (const [k, x0, z0, r] of (M.zonasExtra || [])) if (Math.abs(x - x0) < r && Math.abs(z - z0) < r && Math.hypot(x - x0, z - z0) < r) return k;
    if (x > 200) return z > 21 ? 'ossuario' : z > -13 ? 'sala' : 'camara';
    if (z > 400) return OV.porto ? OV.porto.zona(x, z) : 'porto';
    { const R = M.regiaoEm(x, z); if (R) return R.zona(x, z); }
    if (Math.abs(x) < 16 && Math.abs(z) < 16) return 'claustro';
    for (const k of ['cripta', 'capela', 'moinho', 'mina', 'acampamento', 'covil', 'vila', 'ermida', 'mosteiro', 'floresta']) {
      const l = M.LOCAIS[k]; if (Math.hypot(x - l.x, z - l.z) < l.r) return k;
    }
    return 'vale';
  };
  M.nomeZona = k => k === 'vale' ? 'Vale de Santa Sabina' : (M.LOCAIS[k] ? M.LOCAIS[k].nome : k);
  M.regiao = (x, z) => { const R = M.regiaoEm(x, z); return R ? R.id : z > 400 ? 'porto' : x > 200 ? 'cripta' : 'vale'; };
  // número do ato de cada região (para o rastreador de missões)
  M.atoDaRegiao = k => ({ vale: 1, cripta: 1, porto: 2, minas: 3, corte: 4 })[k] || 1;

  // a Casa do Peregrino de cada região (construída em casa.js): o lugar é reservado já aqui, para nada nascer dentro dela
  M.CASAS_PEREGRINO = [['vale', 18, 96, -0.322], ['porto', -29, 655, Math.PI / 2], ['minas', -920, 1, 0.227], ['corte', -19, -893, 0.237]];
  M.RECTS = M.RECTS || [];
  M.CASAS_PEREGRINO.forEach(([, x, z, rot]) => { const r = [x, z, 13, 11, rot]; r.reserva = true; M.RECTS.push(r); });
  M.PREVIEW = { x: 0, z: 9 };
  M.INICIO = { x: 0, z: 182, facing: Math.PI };
})(window.OV);

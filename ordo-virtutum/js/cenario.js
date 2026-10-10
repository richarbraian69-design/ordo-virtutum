/* Ordo Virtutum — o recheio do cenário:
   · ornamentos das casas (enxaimel, cunhais de pedra, barras pintadas, janelas com batentes e floreiras, chaminés, beirais)
   · árvores de muitas espécies e tamanhos, algumas floridas e outras com frutos
   · o chão: manchas no capim, tufos, flores silvestres em prados, arbustos, pedrinhas e cogumelos
   · o feitio de cada pessoa (altura, corpo, pele, cabelo, barba, chapéu, colete, avental, xale)
   Tudo o que é parado é fundido por material ou desenhado em instâncias, para pesar pouco. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const C = {}; OV.cenario = C;
  const sm = OV.sm, scene = M.scene;
  const PI = Math.PI;

  /* ---------- sorte determinística (a mesma casa e a mesma pessoa saem sempre iguais) ---------- */
  function hash(t) { t = String(t); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  C.sorte = function (sem) {
    let s = typeof sem === 'number' ? (Math.abs(Math.floor(sem * 9301 + 49297)) % 2147483646) + 1 : hash(sem);
    const f = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    f.entre = (a, b) => a + f() * (b - a);
    f.um = l => l[Math.floor(f() * l.length) % l.length];
    f.peso = l => { let t = 0; l.forEach(x => t += x[1]); let r = f() * t; for (const x of l) { r -= x[1]; if (r <= 0) return x[0]; } return l[0][0]; };
    return f;
  };
  const MATS = new Map();
  const mat = (cor, op) => { const k = cor + '|' + (op ? JSON.stringify(op) : ''); if (!MATS.has(k)) MATS.set(k, sm(cor, op)); return MATS.get(k); };
  C.mat = mat;
  const BRANCO = mat(0xffffff);

  /* ---------- fundir: junta as malhas paradas de um grupo, uma por material ---------- */
  function juntar(geos) {
    let n = 0; geos.forEach(g => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
    geos.forEach(g => {
      pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, k * 2);
      k += g.attributes.position.count; g.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    return geo;
  }
  const naoIndexada = g => g.index ? g.toNonIndexed() : g.clone();
  // materiais únicos com a cor nos vértices: muitas peças, uma só chamada de desenho
  const VC = sm(0xffffff, { vertexColors: true }), VCB = new THREE.MeshBasicMaterial({ vertexColors: true });
  C.VC = VC;
  function comCor(g, cor) {
    const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = cor.r; a[i * 3 + 1] = cor.g; a[i * 3 + 2] = cor.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g;
  }
  function juntarCor(geos) {
    let n = 0; geos.forEach(g => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let k = 0;
    geos.forEach(g => { pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); col.set(g.attributes.color.array, k * 3); k += g.attributes.position.count; g.dispose(); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere(); return geo;
  }
  /* fundir: junta as malhas paradas de um grupo. As de cor lisa viram uma malha só (cor nos vértices);
     as acesas (MeshBasic) viram outra; as que têm textura ou transparência ficam agrupadas por material. */
  C.fundir = function (raiz, soFilhos) {
    raiz.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(raiz.matrixWorld).invert(), m4 = new THREE.Matrix4();
    const lisas = [], acesas = [], outras = new Map(), tirar = [];
    const pegar = o => {
      if (!o.isMesh || o.isInstancedMesh || o.userData.solto) return;
      const g = naoIndexada(o.geometry); g.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
      const m = o.material;
      if (m === VC || m === VCB) (m === VCB ? acesas : lisas).push(g); // já tem a cor nos vértices
      else if (m && !m.map && !m.transparent && m.color && (m.isMeshStandardMaterial || m.isMeshBasicMaterial)) {
        comCor(g, m.color); (m.isMeshBasicMaterial ? acesas : lisas).push(g);
      } else { if (!outras.has(m)) outras.set(m, []); outras.get(m).push(g); }
      tirar.push(o);
    };
    if (soFilhos) raiz.children.slice().forEach(pegar); else raiz.traverse(o => { if (o !== raiz) pegar(o); });
    tirar.forEach(o => o.parent.remove(o));
    const por = (geo, m) => { const me = new THREE.Mesh(geo, m); me.castShadow = !raiz.userData.semSombra && m !== VCB; me.receiveShadow = true; raiz.add(me); };
    if (lisas.length) por(juntarCor(lisas), VC);
    if (acesas.length) por(juntarCor(acesas), VCB);
    for (const [m, gs] of outras) por(juntar(gs), m);
    if (!soFilhos) { const limpar = gr => gr.children.slice().forEach(o => { if (o.isGroup) { limpar(o); if (!o.children.length) gr.remove(o); } }); limpar(raiz); }
    return raiz;
  };
  // uma geometria com transformação já aplicada
  function T(geo, x, y, z, sx, sy, sz, rx, ry, rz) {
    const g = naoIndexada(geo), o = new THREE.Object3D();
    o.position.set(x || 0, y || 0, z || 0); o.scale.set(sx || 1, sy || sx || 1, sz || sx || 1); o.rotation.set(rx || 0, ry || 0, rz || 0); o.updateMatrix();
    g.applyMatrix4(o.matrix); return g;
  }

  /* ---------- lotes: muitas cópias de um modelo, assadas em pedaços de terreno com a cor nos vértices ---------- */
  const PEDACO = 64;
  // modelo: partes [{ geo, cor }]; cor null = recebe a cor de cada cópia (a copa, a flor), senão cor fixa
  function modelo(partes) {
    const gs = partes.filter(p => p.geo).map(p => [naoIndexada(p.geo), p]); let n = 0; gs.forEach(([g]) => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cor = new Float32Array(n * 3), ting = new Uint8Array(n), c = new THREE.Color(); let k = 0;
    gs.forEach(([g, p]) => {
      const m = g.attributes.position.count; pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3);
      if (p.cor === null || p.cor === undefined) ting.fill(1, k, k + m); else { c.set(p.cor); for (let i = k; i < k + m; i++) { cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b; } }
      k += m;
    });
    return { pos, nor, cor, ting, n };
  }
  C.modelo = modelo;
  function Lote(op) { this.p = new Map(); this.op = op || {}; }
  Lote.prototype.por = function (mod, it) {
    const k = Math.floor(it.x / PEDACO) + ',' + Math.floor(it.z / PEDACO);
    let p = this.p.get(k); if (!p) { p = { l: [], n: 0 }; this.p.set(k, p); }
    p.l.push([mod, it]); p.n += mod.n;
  };
  Lote.prototype.fazer = function () {
    const d = new THREE.Object3D(), nm = new THREE.Matrix3(), c = new THREE.Color(), out = [];
    for (const [, p] of this.p) {
      const pos = new Float32Array(p.n * 3), nor = new Float32Array(p.n * 3), col = new Float32Array(p.n * 3); let k = 0;
      for (const [mod, it] of p.l) {
        d.position.set(it.x, it.y, it.z); d.rotation.set(it.rx || 0, it.r || 0, it.rz || 0);
        const s = it.s || 1; d.scale.set(it.sx || s, it.sy || s, it.sz || it.sx || s); d.updateMatrix();
        const e = d.matrix.elements; nm.getNormalMatrix(d.matrix); const q = nm.elements;
        const tinge = it.cor !== undefined && it.cor !== null; if (tinge) { c.set(it.cor); if (it.tom) c.multiplyScalar(it.tom); }
        const P = mod.pos, N = mod.nor, CO = mod.cor, TI = mod.ting;
        for (let i = 0; i < mod.n; i++) {
          const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], o = (k + i) * 3;
          pos[o] = e[0] * x + e[4] * y + e[8] * z + e[12]; pos[o + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; pos[o + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
          const a = N[i * 3], b = N[i * 3 + 1], cc = N[i * 3 + 2];
          let nx = q[0] * a + q[3] * b + q[6] * cc, ny = q[1] * a + q[4] * b + q[7] * cc, nz = q[2] * a + q[5] * b + q[8] * cc; const l = Math.hypot(nx, ny, nz) || 1;
          nor[o] = nx / l; nor[o + 1] = ny / l; nor[o + 2] = nz / l;
          if (TI[i] && tinge) { col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b; } else if (TI[i]) { col[o] = col[o + 1] = col[o + 2] = 1; } else { col[o] = CO[i * 3]; col[o + 1] = CO[i * 3 + 1]; col[o + 2] = CO[i * 3 + 2]; }
        }
        k += mod.n;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeBoundingSphere();
      const me = new THREE.Mesh(geo, VC); me.castShadow = !!this.op.sombra; me.receiveShadow = true; me.matrixAutoUpdate = false; me.updateMatrix();
      scene.add(me); out.push(me);
    }
    this.p.clear();
    return out;
  };
  C.Lote = Lote;

  /* ================= CASAS ================= */
  // textura de telhas (clara, multiplica a cor do telhado): fileiras de telhas desencontradas
  const texTelha = M.canvasTex(32, 32, (g, w, h) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
    for (let col = 0; col < 4; col++) {
      const x0 = col * 8;
      for (let y = (col % 2) * 4; y < h + 8; y += 8) {
        const grd = g.createLinearGradient(x0, 0, x0 + 8, 0); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.7, '#d0d0d0'); grd.addColorStop(1, '#8a8a8a');
        g.fillStyle = grd; g.fillRect(x0, y - 8, 8, 7);
        g.fillStyle = '#7a7a7a'; g.fillRect(x0, y - 1, 8, 1);
      }
      g.fillStyle = '#6a6a6a'; g.fillRect(x0 + 7, 0, 1, h);
    }
  }, 1, 1);
  texTelha.wrapS = texTelha.wrapT = THREE.RepeatWrapping;
  C.texturarTelhado = function (m) { if (m && !m.map && !m.userData.semTelha) { m.map = texTelha; m.needsUpdate = true; } };

  // telhado com duas águas de verdade (lajes com telhas) e a empena preenchida com a parede
  C.telhado = function (w, d, rh, matT, matParede) {
    C.texturarTelhado(matT);
    const g = new THREE.Group();
    const meio = w / 2 + 0.4, ang = Math.atan2(rh, meio), L = Math.hypot(meio, rh) + 0.14, comp = d + 0.6, esp = 0.16;
    [-1, 1].forEach(s => {
      const geo = new THREE.BoxGeometry(L, esp, comp);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 0.55, uv.getY(i) * comp / 0.5);
      const m = new THREE.Mesh(geo, matT);
      m.position.set(s * meio / 2 + s * Math.sin(ang) * esp / 2, rh / 2 + Math.cos(ang) * esp / 2, 0); m.rotation.z = -s * ang;
      m.castShadow = m.receiveShadow = true; g.add(m);
    });
    // a empena (triângulo) na cor da parede, recuada sob o beiral
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, rh * (w / 2) / meio); sh.closePath();
    const eg = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); eg.translate(0, 0, -d / 2);
    const e = new THREE.Mesh(eg, matParede || matT); e.castShadow = e.receiveShadow = true; g.add(e);
    // cumeeira
    const cu = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, comp + 0.08), matT); cu.position.y = rh + 0.08; cu.castShadow = true; g.add(cu);
    return g;
  };

  const ESTILOS = {
    vale: [['enxaimel', 5], ['pedra', 3], ['barra', 1.5]],
    porto: [['barra', 6], ['pedra', 1], ['cal', 2]],
    minas: [['pedra', 5], ['enxaimel', 3], ['tabuas', 2]],
    corte: [['nobre', 6], ['barra', 2], ['enxaimel', 1]]
  };
  const PALETAS = {
    vale: { madeira: [0x3a2618, 0x2e1f14, 0x4a3020], batente: [0x2f5a3a, 0x6a2a1e, 0x2a4a6a, 0x5a3c22, 0x4a5a2a], barra: [0x6a5a44, 0x5a4a3a], pedra: [0x9a9488, 0x8a8478, 0xa8a090] },
    porto: { madeira: [0x3a2a1c, 0x4a3422], batente: [0x24508a, 0x2a6a4a, 0x2a5a8a, 0x8a6a2a, 0x1e3e6a], barra: [0x2a5a9a, 0xc89a3a, 0x8a3a2a, 0x2a6a5a], pedra: [0xb8b0a0, 0xa8a090] },
    minas: { madeira: [0x2a1c12, 0x3a2618], batente: [0x3a3a32, 0x4a3a2a, 0x2a3a3a], barra: [0x4a4038], pedra: [0x6a645c, 0x5a544c, 0x7a7268] },
    corte: { madeira: [0x3a2a1e, 0x4a3426], batente: [0x5a7a6a, 0x4a5a7a, 0xb8aa8a, 0x6a4a5a, 0x3a5a4a], barra: [0x8a7a5a, 0x5a6a7a], pedra: [0xd8ccb4, 0xc8bca4, 0xe0d4bc] }
  };
  const FLORES = [0xd8283a, 0xe8c83a, 0xf2f0e8, 0xc8509a, 0x7a4ac8, 0xe8743a, 0xf0a0b8];
  const regiaoDe = (x, z) => { const r = M.regiao ? M.regiao(x, z) : 'vale'; return PALETAS[r] ? r : 'vale'; };

  /* op: { x, z, rot, mat (parede), roof, rh, interior, porta (largura do vão), alt (altura do vão), janela (material do vidro),
          janelasFrente, janelasLado, estilo, semChamine } */
  C.ornarCasa = function (casa, w, d, h, op) {
    op = op || {};
    const reg = op.regiao || regiaoDe(op.x || 0, op.z || 0), pal = PALETAS[reg];
    const r = C.sorte((op.x || 0) * 13.7 + (op.z || 0) * 7.3 + w);
    const estilo = op.estilo || r.peso(ESTILOS[reg]);
    const orn = new THREE.Group(); casa.add(orn);
    const mMad = mat(r.um(pal.madeira)), mBat = mat(r.um(pal.batente)), mPedra = mat(r.um(pal.pedra)), mFerro = mat(0x1e1e22, { metalness: 0.5, roughness: 0.6 });
    const mVidro = op.janela || mat(0x120c0a), mVerde = mat(0x2f5a26), mTerra = mat(0xa0522d), mLenha = mat(0x5a3a22), mPonta = mat(0xb08a5a);
    const B = (pai, bw, bh, bd, x, y, z, m, rx, ry, rz) => { const me = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m); me.position.set(x, y, z); me.rotation.set(rx || 0, ry || 0, rz || 0); pai.add(me); return me; };
    const Cl = (pai, rt, rb, hh, x, y, z, m, seg, rx, rz) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, seg || 7), m); me.position.set(x, y, z); me.rotation.set(rx || 0, 0, rz || 0); pai.add(me); return me; };
    const Bo = (pai, rr, x, y, z, m, sy) => { const me = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 0), m); me.position.set(x, y, z); if (sy) me.scale.y = sy; pai.add(me); return me; };
    // cada face como um plano local: x ao longo da parede, +z para fora
    const face = (lado, u, y) => {
      const s = new THREE.Group();
      if (lado === 'f') s.position.set(u, y, d / 2);
      else if (lado === 't') { s.position.set(-u, y, -d / 2); s.rotation.y = PI; }
      else if (lado === 'd') { s.position.set(w / 2, y, -u); s.rotation.y = PI / 2; }
      else { s.position.set(-w / 2, y, u); s.rotation.y = -PI / 2; }
      orn.add(s); return s;
    };
    const larg = l => (l === 'f' || l === 't') ? w : d;
    const furos = { f: [], t: [], d: [], e: [] }; // retângulos [u0,u1,y0,y1] onde não passa viga

    /* --- janelas --- */
    const comFloreira = reg !== 'minas' && r() < 0.75;
    const corBatente = r() < 0.85;
    function janela(lado, u, y, ww, wh, op2) {
      op2 = op2 || {};
      const s = face(lado, u, y);
      if (op2.vidro !== false) B(s, ww, wh, 0.06, 0, 0, 0.03, mVidro);
      const mol = estilo === 'nobre' || estilo === 'cal' || estilo === 'barra' ? mPedra : mMad;
      B(s, ww + 0.22, 0.1, 0.12, 0, wh / 2 + 0.05, 0.06, mol); B(s, ww + 0.22, 0.1, 0.12, 0, -wh / 2 - 0.05, 0.06, mol);
      B(s, 0.1, wh, 0.12, -ww / 2 - 0.05, 0, 0.06, mol); B(s, 0.1, wh, 0.12, ww / 2 + 0.05, 0, 0.06, mol);
      B(s, 0.05, wh, 0.08, 0, 0, 0.06, mMad); B(s, ww, 0.05, 0.08, 0, 0.04, 0.06, mMad);
      B(s, ww + 0.4, 0.08, 0.26, 0, -wh / 2 - 0.13, 0.12, mPedra); // peitoril
      if (estilo === 'nobre') { B(s, ww + 0.5, 0.12, 0.22, 0, wh / 2 + 0.24, 0.1, mPedra); B(s, ww + 0.2, 0.1, 0.16, 0, wh / 2 + 0.34, 0.08, mPedra); }
      if (corBatente && op2.batentes !== false) [-1, 1].forEach(k => {
        const bw = ww * 0.52;
        B(s, bw, wh + 0.08, 0.06, k * (ww / 2 + 0.12 + bw / 2), 0, 0.05, mBat);
        B(s, bw * 0.8, 0.035, 0.03, k * (ww / 2 + 0.12 + bw / 2), wh * 0.22, 0.09, mMad);
        B(s, bw * 0.8, 0.035, 0.03, k * (ww / 2 + 0.12 + bw / 2), -wh * 0.22, 0.09, mMad);
      });
      if (op2.floreira && comFloreira) {
        B(s, ww + 0.24, 0.22, 0.26, 0, -wh / 2 - 0.3, 0.2, r() < 0.5 ? mMad : mTerra);
        B(s, ww + 0.1, 0.1, 0.2, 0, -wh / 2 - 0.15, 0.2, mVerde);
        const fl = mat(r.um(FLORES)), fl2 = mat(r.um(FLORES));
        for (let i = 0; i < 5; i++) Bo(s, 0.075, -ww / 2 + 0.05 + i * (ww - 0.1) / 4, -wh / 2 - 0.08 + r() * 0.06, 0.2 + (r() - 0.5) * 0.08, i % 2 ? fl : fl2, 0.8);
      }
      const L = lado; furos[L].push([u - ww / 2 - (corBatente ? ww * 0.6 + 0.2 : 0.2), u + ww / 2 + (corBatente ? ww * 0.6 + 0.2 : 0.2), y - wh / 2 - 0.45, y + wh / 2 + 0.25]);
    }
    // frente
    if (op.interior) {
      const seg = (w - op.porta) / 2;
      if (seg >= 1.5) [-1, 1].forEach(k => janela('f', k * (op.porta / 2 + seg / 2), h * 0.58, 0.7, 0.66, { floreira: true, vidro: true }));
    } else if (op.janelasFrente) [-1, 1].forEach(k => janela('f', k * w / 3.2, h * 0.62, 0.7, 0.6, { floreira: true, vidro: false }));
    // laterais e fundos
    if (op.interior) { if (op.janelasLado) ['d', 'e'].forEach(l => [-1, 1].forEach(k => janela(l, k * d / 4, h * 0.55, 0.9, 0.8, { vidro: false }))); }
    else {
      if (d >= 4) ['d', 'e'].forEach(l => janela(l, 0, h * 0.55, 0.6, 0.6, { floreira: r() < 0.5 }));
      if (w >= 5) janela('t', (r() - 0.5) * w * 0.4, h * 0.6, 0.6, 0.6, {});
    }

    /* --- porta --- */
    const pw = op.interior ? op.porta : 1.1, ph = op.interior ? op.alt : 1.9;
    {
      const s = face('f', 0, 0);
      const mol = estilo === 'nobre' || estilo === 'barra' || estilo === 'cal' ? mPedra : mMad;
      B(s, 0.16, ph + 0.1, 0.14, -pw / 2 - 0.08, ph / 2, 0.07, mol); B(s, 0.16, ph + 0.1, 0.14, pw / 2 + 0.08, ph / 2, 0.07, mol);
      B(s, pw + 0.48, 0.18, 0.16, 0, ph + 0.12, 0.08, mol);
      if (estilo === 'nobre') { const t = B(s, pw + 0.7, 0.14, 0.26, 0, ph + 0.34, 0.12, mPedra); }
      B(s, pw + 0.6, 0.16, 0.6, 0, 0.08, 0.3, mPedra); // degrau
      if (!op.interior) {
        B(s, 0.05, ph - 0.1, 0.03, -pw / 6, ph / 2, 0.065, mMad); B(s, 0.05, ph - 0.1, 0.03, pw / 6, ph / 2, 0.065, mMad);
        B(s, pw - 0.1, 0.08, 0.03, 0, ph * 0.3, 0.065, mFerro); B(s, pw - 0.1, 0.08, 0.03, 0, ph * 0.75, 0.065, mFerro);
        Bo(s, 0.06, pw * 0.3, ph * 0.5, 0.1, mFerro);
      }
      if (reg === 'corte' || reg === 'porto' || r() < 0.3) { // lanterna ao lado da porta
        B(s, 0.08, 0.3, 0.2, pw / 2 + 0.45, ph + 0.05, 0.1, mFerro);
        B(s, 0.2, 0.26, 0.2, pw / 2 + 0.45, ph - 0.12, 0.25, mFerro);
        const lu = B(s, 0.13, 0.18, 0.13, pw / 2 + 0.45, ph - 0.12, 0.25, new THREE.MeshBasicMaterial({ color: 0xffc070 })); lu.userData.solto = true;
      }
      furos.f.push([-pw / 2 - 0.3, pw / 2 + 0.3, 0, ph + 0.3]);
    }

    /* --- paredes conforme o estilo --- */
    const yb = 0.4; // altura do embasamento
    if (estilo === 'enxaimel' || estilo === 'tabuas') {
      ['f', 't', 'd', 'e'].forEach(l => {
        const W = larg(l), s = face(l, 0, 0), z = 0.025, eV = 0.16;
        const livreV = (u, y0, y1) => !furos[l].some(([a, b, c, e]) => u > a - 0.1 && u < b + 0.1 && y1 > c && y0 < e);
        const livreH = (u0, u1, y) => !furos[l].some(([a, b, c, e]) => y > c - 0.08 && y < e + 0.08 && u1 > a && u0 < b);
        if (estilo === 'tabuas') { // tábuas verticais na metade de cima
          for (let u = -W / 2 + 0.2; u < W / 2 - 0.1; u += 0.32) if (livreV(u, h * 0.5, h)) B(s, 0.04, h * 0.5, 0.03, u, h * 0.75, z, mMad);
          B(s, W, 0.14, 0.06, 0, h * 0.5, z + 0.01, mMad);
          return;
        }
        const ym = Math.max(1.3, h * 0.42);
        B(s, W + 0.02, eV, 0.06, 0, yb + 0.07, z, mMad); B(s, W + 0.02, eV, 0.06, 0, h - 0.08, z, mMad);
        // travessa do meio, partida onde houver porta ou janela
        let u0 = -W / 2; const passo = 0.25;
        for (let u = -W / 2; u <= W / 2 + 0.001; u += passo) {
          const ok = u < W / 2 && livreH(u, u + passo, ym);
          if (!ok || u + passo > W / 2) { const fim = ok ? W / 2 : u; if (fim - u0 > 0.3) B(s, fim - u0, eV * 0.9, 0.06, (u0 + fim) / 2, ym, z, mMad); u0 = u + passo; }
        }
        // esteios a cada ~1,3 m
        const n = Math.max(2, Math.round(W / 1.3)), us = [];
        for (let i = 0; i <= n; i++) { const u = -W / 2 + 0.08 + i * (W - 0.16) / n; if (livreV(u, yb, h)) { B(s, eV, h - yb, 0.06, u, (h + yb) / 2, z, mMad); us.push(u); } }
        // mãos-francesas em X ou em diagonal nos vãos livres
        for (let i = 0; i < us.length - 1; i++) {
          const a = us[i], b = us[i + 1], bw = b - a; if (bw < 0.6 || bw > 2.2) continue;
          [[yb + 0.1, ym], [ym, h - 0.1]].forEach(([y0, y1], j) => {
            if (!livreV((a + b) / 2, y0, y1) || !livreV(a + bw * 0.25, y0, y1) || !livreV(b - bw * 0.25, y0, y1)) return;
            const L = Math.hypot(bw, y1 - y0), ang = Math.atan2(y1 - y0, bw) * ((i + j) % 2 ? 1 : -1);
            B(s, L, eV * 0.8, 0.05, (a + b) / 2, (y0 + y1) / 2, z, mMad, 0, 0, ang);
          });
        }
      });
      // na empena, um pendural
      ['d', 'e'].forEach(l => { const s = face(l, 0, 0); B(s, 0.14, (op.rh || 2.2) * 0.9, 0.06, 0, h + (op.rh || 2.2) * 0.45, 0.025, mMad); B(s, d * 0.8, 0.12, 0.06, 0, h + 0.15, 0.025, mMad); });
    }
    if (estilo === 'pedra' || estilo === 'nobre' || estilo === 'cal') {
      // cunhais: blocos alternados nas quinas
      const mq = estilo === 'pedra' ? mPedra : mat(r.um(pal.pedra));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        for (let y = yb + 0.2, i = 0; y < h - 0.1; y += 0.4, i++) {
          const L = i % 2 ? 0.7 : 0.42;
          B(orn, L, 0.34, 0.05, sx * (w / 2 - L / 2 + 0.02), y, sz * (d / 2 + 0.02), mq);
          B(orn, 0.05, 0.34, i % 2 ? 0.42 : 0.7, sx * (w / 2 + 0.02), y, sz * (d / 2 - (i % 2 ? 0.21 : 0.35) + 0.02), mq);
        }
      });
    }
    if (estilo === 'nobre' || estilo === 'cal') {
      // cornija sob o beiral e pilastras
      B(orn, w + 0.3, 0.18, 0.26, 0, h - 0.06, d / 2 + 0.1, mPedra); B(orn, w + 0.3, 0.18, 0.26, 0, h - 0.06, -d / 2 - 0.1, mPedra);
      B(orn, 0.26, 0.18, d + 0.3, w / 2 + 0.1, h - 0.06, 0, mPedra); B(orn, 0.26, 0.18, d + 0.3, -w / 2 - 0.1, h - 0.06, 0, mPedra);
      if (estilo === 'nobre' && !op.interior && w > 5 && r() < 0.6) { // sacada
        const s = face('f', 0, 0), sy = h * 0.62 - 0.5;
        B(s, 1.6, 0.12, 0.6, 0, sy, 0.3, mPedra);
        for (let i = 0; i <= 6; i++) B(s, 0.04, 0.5, 0.04, -0.75 + i * 0.25, sy + 0.3, 0.56, mFerro);
        B(s, 1.6, 0.05, 0.06, 0, sy + 0.55, 0.56, mFerro);
      }
    }
    if (estilo === 'barra' || estilo === 'cal') {
      // barra pintada no pé da parede (aberta no vão da porta)
      const mb = mat(r.um(pal.barra)), hb = 0.75;
      ['f', 't', 'd', 'e'].forEach(l => {
        const W = larg(l), s = face(l, 0, 0);
        if (l === 'f') { const lado = (W - pw) / 2 - 0.25; if (lado > 0.1) [-1, 1].forEach(k => B(s, lado, hb, 0.03, k * (W / 2 - lado / 2), yb + hb / 2, 0.015, mb)); }
        else B(s, W, hb, 0.03, 0, yb + hb / 2, 0.015, mb);
      });
      // cantos em faixa clara
      const mc = mat(0xe0d8c8);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { B(orn, 0.22, h - yb, 0.05, sx * (w / 2 - 0.1), (h + yb) / 2, sz * (d / 2 + 0.02), mc); B(orn, 0.05, h - yb, 0.22, sx * (w / 2 + 0.02), (h + yb) / 2, sz * (d / 2 - 0.1), mc); });
    }
    // trepadeira subindo por uma quina
    if ((reg === 'vale' || reg === 'corte') && r() < 0.35) {
      const sx = r() < 0.5 ? -1 : 1, mh = mat(r() < 0.5 ? 0x2a4a22 : 0x3a5a2a), fl = r() < 0.5 ? mat(r.um([0xc8509a, 0xf2f0e8, 0xd8283a])) : null;
      for (let i = 0; i < 26; i++) {
        const y = 0.3 + r() * (h - 0.2) * (1 - r() * 0.4), u = r() * 1.4;
        Bo(orn, 0.16 + r() * 0.12, sx * (w / 2 - u), y, d / 2 + 0.06, mh, 0.7);
        if (fl && r() < 0.3) Bo(orn, 0.07, sx * (w / 2 - u) + 0.08, y + 0.05, d / 2 + 0.14, fl);
      }
    }

    /* --- telhado: beirais, bordas da empena e chaminé --- */
    const rh = op.rh || 2.2, meio = d / 2 + 0.4;
    [-1, 1].forEach(sz => B(orn, w + 0.62, 0.2, 0.07, 0, h - 0.04, sz * (meio + 0.02), mMad));
    const angE = Math.atan2(rh, meio), Lb = Math.hypot(meio, rh);
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => B(orn, 0.07, 0.22, Lb, sx * (w / 2 + 0.33), h + rh / 2 - 0.06, sz * meio / 2, mMad, sz * angE, 0, 0)));
    if (!op.semChamine && r() < 0.7) {
      const cx = (r() < 0.5 ? -1 : 1) * w * (0.18 + r() * 0.14), cz = -d * 0.18, ys = h + rh * (1 - Math.abs(cz) / meio);
      const mc = reg === 'corte' ? mat(0x7a3a2a) : reg === 'porto' ? mat(0xd8d0c0) : mat(0x5a5048);
      const top = h + rh + 0.7;
      B(orn, 0.62, top - ys + 0.3, 0.62, cx, (top + ys - 0.3) / 2, cz, mc);
      B(orn, 0.82, 0.14, 0.82, cx, top + 0.07, cz, mPedra);
      if (reg === 'porto') { B(orn, 0.5, 0.3, 0.12, cx, top + 0.3, cz, mc); }
    }

    /* --- coisas no chão, junto da casa --- */
    {
      const s = face('f', 0, 0);
      // vasos ao lado da porta
      const nv = reg === 'minas' ? 0 : (r() * 3) | 0;
      for (let i = 0; i < nv; i++) {
        const k = i % 2 ? 1 : -1, u = k * (pw / 2 + 0.55 + r() * 0.3);
        Cl(s, 0.2, 0.14, 0.32, u, 0.16, 0.42, mTerra, 7);
        Bo(s, 0.24, u, 0.42, 0.42, mVerde, 0.85);
        const fl = mat(r.um(FLORES)); for (let j = 0; j < 4; j++) Bo(s, 0.06, u + (r() - 0.5) * 0.3, 0.55 + r() * 0.08, 0.42 + (r() - 0.5) * 0.25, fl);
      }
      // barril ou banco
      const extra = r();
      if (extra < 0.35) {
        const u = (r() < 0.5 ? -1 : 1) * (w / 2 - 0.45);
        Cl(s, 0.3, 0.3, 0.78, u, 0.39, 0.42, mLenha, 9); Cl(s, 0.315, 0.315, 0.05, u, 0.18, 0.42, mFerro, 9); Cl(s, 0.315, 0.315, 0.05, u, 0.6, 0.42, mFerro, 9);
      } else if (extra < 0.6 && (reg === 'vale' || reg === 'minas')) {
        const u = (r() < 0.5 ? -1 : 1) * (pw / 2 + 1.4);
        if (Math.abs(u) < w / 2 - 0.6) { B(s, 1.3, 0.1, 0.36, u, 0.46, 0.36, mMad); B(s, 0.1, 0.42, 0.3, u - 0.5, 0.21, 0.36, mMad); B(s, 0.1, 0.42, 0.3, u + 0.5, 0.21, 0.36, mMad); }
      }
      // pedras de pisar até a porta
      if (r() < 0.6) for (let i = 0; i < 3; i++) B(s, 0.5 + r() * 0.2, 0.06, 0.4, (r() - 0.5) * 0.3, 0.03, 0.95 + i * 0.6, mPedra, 0, r() * 0.6, 0);
    }
    // lenha empilhada contra uma parede lateral
    if ((reg === 'vale' || reg === 'minas') && r() < 0.5) {
      const l = r() < 0.5 ? 'd' : 'e', s = face(l, 0, 0), u0 = (r() - 0.5) * (d - 2.2);
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) {
        const lg = Cl(s, 0.11, 0.11, 0.9, u0 - 0.6 + i * 0.23 + row * 0.11, 0.12 + row * 0.2, 0.32, i % 3 ? mLenha : mPonta, 6, PI / 2, 0);
        lg.rotation.set(PI / 2, 0, 0);
      }
      B(s, 1.6, 0.06, 0.62, u0, 1.0, 0.36, mMad); // telheiro
    }

    C.fundir(orn);
    return orn;
  };

  /* ================= ÁRVORES ================= */
  const ICO = (r, d) => new THREE.IcosahedronGeometry(r, d || 0);
  const ESPECIES = {};
  function especie(nome, def) { ESPECIES[nome] = def; }
  // cada espécie: tronco, copa e (talvez) flores ou frutos — geometrias de escala 1, alturas em metros
  function frutosEm(cx, cy, cz, rx, ry, rz, n, tam, semente) {
    const r = C.sorte(semente), gs = [];
    for (let i = 0; i < n; i++) {
      const th = r() * PI * 2, ph = Math.acos(1 - r() * 1.4); // mais em cima e nos lados
      gs.push(T(new THREE.OctahedronGeometry(tam * (0.9 + r() * 0.5), 0), cx + Math.sin(ph) * Math.cos(th) * rx * 0.98, cy + Math.cos(ph) * ry * 0.9, cz + Math.sin(ph) * Math.sin(th) * rz * 0.98));
    }
    return juntar(gs);
  }
  especie('carvalho', {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.2, 0.34, 2.8, 6), 0, 1.4), T(new THREE.CylinderGeometry(0.07, 0.12, 1.4, 5), 0.42, 2.5, 0, 1, 1, 1, 0, 0, -0.75), T(new THREE.CylinderGeometry(0.06, 0.11, 1.3, 5), -0.36, 2.6, 0.2, 1, 1, 1, 0.3, 0, 0.8)]),
    copa: () => juntar([T(ICO(1.55), 0, 3.9, 0, 1, 0.82), T(ICO(1.15), 1.0, 3.4, 0.3, 1, 0.85), T(ICO(1.05), -0.95, 3.5, -0.35, 1, 0.85), T(ICO(0.95), 0.15, 4.7, 0.5, 1, 0.8), T(ICO(0.9), 0.2, 3.3, -1.0)]),
    corTronco: 0x3a2a1c, cores: [0x2c4424, 0x34502a, 0x283e20, 0x3c5a2c], raio: 2.0, topo: 5.6, base: 2.6
  });
  especie('pinheiro', {
    tronco: () => T(new THREE.CylinderGeometry(0.13, 0.24, 3.2, 5), 0, 1.6),
    copa: () => juntar([T(new THREE.ConeGeometry(1.7, 2.4, 7), 0, 2.7), T(new THREE.ConeGeometry(1.3, 2.2, 7), 0, 3.8), T(new THREE.ConeGeometry(0.9, 2.0, 7), 0, 4.9), T(new THREE.ConeGeometry(0.5, 1.4, 6), 0, 5.9)]),
    corTronco: 0x3a2618, cores: [0x1c3020, 0x203826, 0x182a1c], raio: 1.6, topo: 6.6, base: 1.6
  });
  especie('abeto', {
    tronco: () => T(new THREE.CylinderGeometry(0.12, 0.22, 2.4, 5), 0, 1.2),
    copa: () => juntar([0, 1, 2, 3, 4].map(i => T(new THREE.ConeGeometry(1.5 - i * 0.26, 1.7, 7), 0, 1.6 + i * 1.05))),
    corTronco: 0x2e1f14, cores: [0x16261a, 0x1a2c1e, 0x14221a], raio: 1.4, topo: 7.2, base: 1.0
  });
  especie('cipreste', {
    tronco: () => T(new THREE.CylinderGeometry(0.11, 0.17, 1.2, 5), 0, 0.6),
    copa: () => juntar([T(ICO(1, 1), 0, 3.4, 0, 0.72, 3.0, 0.72), T(ICO(0.5, 0), 0, 6.1, 0, 0.6, 1.2, 0.6)]),
    corTronco: 0x2e1f14, cores: [0x1a2c1c, 0x1e3220, 0x162618], raio: 0.8, topo: 6.6, base: 0.8
  });
  especie('pinheiroManso', {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.16, 0.28, 4.6, 6), 0.15, 2.3, 0, 1, 1, 1, 0, 0, -0.06), T(new THREE.CylinderGeometry(0.07, 0.11, 1.6, 5), 0.6, 4.4, 0, 1, 1, 1, 0, 0, -0.9)]),
    copa: () => juntar([T(ICO(1.6), 0.2, 5.2, 0, 1.5, 0.42, 1.4), T(ICO(1.2), 1.4, 5.0, 0.4, 1.3, 0.4, 1.2), T(ICO(1.1), -0.9, 5.1, -0.4, 1.3, 0.4, 1.2)]),
    corTronco: 0x5a3a24, cores: [0x2a4426, 0x30502c], raio: 2.6, topo: 5.9, base: 4.5
  });
  especie('betula', {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.1, 0.15, 3.8, 6), 0, 1.9), T(new THREE.CylinderGeometry(0.04, 0.06, 1.0, 4), 0.3, 3.2, 0, 1, 1, 1, 0, 0, -0.6)]),
    copa: () => juntar([T(ICO(0.95), 0, 4.2, 0, 1, 1.15), T(ICO(0.75), 0.55, 3.5, 0.2), T(ICO(0.7), -0.5, 3.7, -0.25), T(ICO(0.6), 0.1, 5.0, 0.1)]),
    corTronco: 0xd8d0c0, cores: [0x6a8a3a, 0x7a9a42, 0x5a7a34, 0x8aa24a], raio: 1.3, topo: 5.6, base: 2.8
  });
  especie('oliveira', {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.16, 0.3, 1.6, 6), 0.1, 0.8, 0, 1, 1, 1, 0, 0, -0.2), T(new THREE.CylinderGeometry(0.1, 0.16, 1.3, 5), -0.15, 1.8, 0.1, 1, 1, 1, 0.2, 0, 0.45), T(new THREE.CylinderGeometry(0.08, 0.14, 1.2, 5), 0.45, 1.9, -0.1, 1, 1, 1, -0.2, 0, -0.5)]),
    copa: () => juntar([T(ICO(1.2), 0, 2.8, 0, 1.3, 0.6, 1.2), T(ICO(0.9), 0.9, 2.5, 0.3, 1.2, 0.6, 1.1), T(ICO(0.85), -0.8, 2.6, -0.3, 1.2, 0.6, 1.1)]),
    corTronco: 0x5a4a3a, cores: [0x5a6a4a, 0x6a7a58, 0x4e5e42], raio: 1.9, topo: 3.4, base: 1.8
  });
  const pomar = (nome, corCopa, corFruta, tam) => especie(nome, {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.15, 0.24, 1.8, 6), 0, 0.9), T(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 5), 0.3, 1.8, 0, 1, 1, 1, 0, 0, -0.7), T(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 5), -0.28, 1.85, 0.1, 1, 1, 1, 0.2, 0, 0.7)]),
    copa: () => juntar([T(ICO(1.3, 1), 0, 2.75, 0, 1, 0.82), T(ICO(0.85), 0.8, 2.4, 0.3), T(ICO(0.8), -0.75, 2.5, -0.3)]),
    extra: () => frutosEm(0, 2.75, 0, 1.3, 1.07, 1.3, 16, tam, nome), corExtra: corFruta,
    corTronco: 0x3a2a1c, cores: corCopa, raio: 1.6, topo: 3.8, base: 1.8
  });
  pomar('macieira', [0x3a5a2a, 0x42622e, 0x34522a], 0xb8241a, 0.1);
  pomar('laranjeira', [0x24421e, 0x2a4a22, 0x203a1c], 0xe8861a, 0.11);
  pomar('limoeiro', [0x2e4e24, 0x34562a], 0xe8d43a, 0.1);
  pomar('pereira', [0x3e5e2c, 0x466a32], 0xb8b03a, 0.11);
  const florida = (nome, cores, corFlor) => especie(nome, {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.14, 0.24, 2.0, 6), 0, 1.0), T(new THREE.CylinderGeometry(0.06, 0.1, 1.2, 5), 0.38, 2.0, 0, 1, 1, 1, 0, 0, -0.8), T(new THREE.CylinderGeometry(0.06, 0.1, 1.2, 5), -0.36, 2.05, -0.1, 1, 1, 1, -0.2, 0, 0.8)]),
    copa: () => juntar([T(ICO(1.25, 1), 0, 3.0, 0, 1.15, 0.78, 1.1), T(ICO(0.9), 1.0, 2.7, 0.2, 1, 0.8), T(ICO(0.85), -0.95, 2.8, -0.2, 1, 0.8), T(ICO(0.7), 0.1, 3.6, 0.5)]),
    extra: () => frutosEm(0, 3.0, 0, 1.4, 0.98, 1.3, 28, 0.12, nome), corExtra: corFlor,
    corTronco: 0x3a2620, cores, raio: 1.8, topo: 4.0, base: 2.1
  });
  florida('cerejeira', [0xe8a0b4, 0xf0b4c4, 0xdc90a8], 0xfae0e8);
  florida('amendoeira', [0xf2ece4, 0xece0dc, 0xf8f2ec], 0xf0b8c8);
  florida('olaia', [0xa8508c, 0xb860a0, 0x984882], 0xd890c8);   // árvore-de-judas
  florida('acacia', [0xd8b830, 0xe8c838, 0xc8a828], 0xf6e070);  // mimosa amarela
  especie('seca', {
    tronco: () => juntar([T(new THREE.CylinderGeometry(0.12, 0.26, 3.4, 5), 0, 1.7, 0, 1, 1, 1, 0, 0, 0.08), T(new THREE.CylinderGeometry(0.04, 0.08, 1.6, 4), 0.5, 3.0, 0, 1, 1, 1, 0, 0, -0.8), T(new THREE.CylinderGeometry(0.03, 0.07, 1.4, 4), -0.45, 2.6, 0.2, 1, 1, 1, 0.3, 0, 0.9), T(new THREE.CylinderGeometry(0.03, 0.06, 1.1, 4), 0.1, 3.6, -0.4, 1, 1, 1, -0.7, 0, 0.1)]),
    copa: null, corTronco: 0x3a3028, cores: [], raio: 0.8, topo: 4.0, base: 3.0
  });

  const geoEsp = {};
  const pegarGeo = (nome, parte) => { const k = nome + ':' + parte; if (!(k in geoEsp)) { const f = ESPECIES[nome][parte]; geoEsp[k] = f ? f() : null; } return geoEsp[k]; };
  // tamanhos variados: mudas, árvores comuns e velhas
  function tamanho(r) { const q = r(); return q < 0.2 ? 0.5 + r() * 0.25 : q < 0.82 ? 0.82 + r() * 0.38 : 1.22 + r() * 0.45; }
  /* lista: [{x, z, s?, alt?, r?}] em coordenadas do mundo; mistura: [['carvalho', peso], ...] ou função (x, z) -> mistura */
  C.arvoredo = function (lista, mistura, op) {
    op = op || {};
    const H = op.H || M.altura, r = C.sorte(op.semente || 'arvoredo' + lista.length);
    const porEsp = {};
    lista.forEach(t => {
      if (M.reservado && M.reservado(t.x, t.z, 1)) return; // lugar guardado para uma aventura
      const mix = typeof mistura === 'function' ? mistura(t.x, t.z) : mistura;
      const nome = t.esp || r.peso(mix), E = ESPECIES[nome]; if (!E) return;
      const sc = (t.s || 1) * tamanho(r) * (op.escala || 1), alt = (t.alt || 1) * (0.88 + r() * 0.3), y = H(t.x, t.z) - 0.05;
      const it = { x: t.x, y, z: t.z, r: t.r !== undefined ? t.r : r() * PI * 2, sx: sc, sy: sc * alt, sz: sc * (0.9 + r() * 0.2) };
      it.cor = E.cores.length ? r.um(E.cores) : 0; it.tom = 0.85 + r() * 0.3;
      (porEsp[nome] = porEsp[nome] || []).push(it);
      (M.arvoresMapa = M.arvoresMapa || []).push({ x: t.x, z: t.z, esp: nome, s: sc, cor: it.cor }); // o mapa ilustrado desenha cada árvore
      M.obstacles.push({ x: t.x, z: t.z, r: 0.35 * sc });
      if (E.copa) M.copas.push({ x: t.x, z: t.z, r: E.raio * sc, y0: y + E.base * sc * alt, y1: y + E.topo * sc * alt });
    });
    const lote = new Lote({ sombra: true });
    for (const nome in porEsp) {
      const E = ESPECIES[nome];
      const k = 'mod:' + nome; if (!geoEsp[k]) geoEsp[k] = modelo([{ geo: pegarGeo(nome, 'tronco'), cor: E.corTronco }, { geo: pegarGeo(nome, 'copa'), cor: null }, { geo: pegarGeo(nome, 'extra'), cor: E.corExtra }]);
      porEsp[nome].forEach(it => lote.por(geoEsp[k], it));
    }
    lote.fazer();
    return porEsp;
  };
  C.ESPECIES = ESPECIES;

  /* ================= O CHÃO ================= */
  // manchas no capim: prados mais claros, trevo escuro, palha seca e um grão em cada vértice
  const ruido = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.052 - 0.7) + 0.25 * Math.sin((x + z) * 0.11) * Math.cos((x - z) * 0.083);
  C.prado = ruido;
  C.manchar = function (malha, op) {
    op = op || {};
    const geo = malha.geometry, pos = geo.attributes.position, col = geo.attributes.color; if (!col) return;
    const ox = malha.position.x, oz = malha.position.z, c = new THREE.Color(), seco = new THREE.Color(op.seco || 0x6a6a2a), trevo = new THREE.Color(op.trevo || 0x1e3a18);
    const r = C.sorte('manchar' + ox + oz), hsl = {};
    for (let i = 0; i < pos.count; i++) {
      c.setRGB(col.getX(i), col.getY(i), col.getZ(i)); c.getHSL(hsl);
      const x = pos.getX(i) + ox, z = pos.getZ(i) + oz;
      const verde = hsl.h > 0.12 && hsl.h < 0.42 && hsl.s > 0.12;
      const grao = 0.9 + r() * 0.2;
      if (verde) {
        const n1 = ruido(x * 1.7, z * 1.7), n2 = ruido(z * 0.6 + 40, x * 0.6 - 20);
        if (n1 > 0.62) c.lerp(seco, Math.min(0.55, (n1 - 0.62) * 2.2) * (op.secura || 1));
        if (n2 < 0.36) c.lerp(trevo, Math.min(0.5, (0.36 - n2) * 2.5));
        c.multiplyScalar(grao * (0.94 + 0.12 * ruido(x * 4.1, z * 3.7)));
      } else c.multiplyScalar(0.95 + r() * 0.1);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  };

  // geometrias pequenas do chão
  const GEO = {};
  GEO.tufo = modelo([0, 1, 2].map(i => { const a = i / 3 * PI * 2 + 0.3; return { geo: T(new THREE.ConeGeometry(0.05, 0.5 + i * 0.12, 3, 1, true), Math.cos(a) * 0.06, 0.25 + i * 0.06, Math.sin(a) * 0.06, 1, 1, 1, Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35), cor: null }; }));
  GEO.caule = modelo([{ geo: T(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 3, 1, true), 0, 0.18), cor: 0x3a5a22 }]);
  GEO.flor = modelo([{ geo: T(new THREE.OctahedronGeometry(0.08, 0), 0, 0.38, 0, 1, 0.5), cor: null }]);
  GEO.arbusto = modelo([{ geo: juntar([T(ICO(0.55), 0, 0.32, 0, 1, 0.72), T(ICO(0.42), 0.38, 0.26, 0.15, 1, 0.75), T(ICO(0.38), -0.32, 0.25, -0.2, 1, 0.75)]), cor: null }]);
  GEO.bagas = modelo([{ geo: frutosEm(0, 0.32, 0, 0.58, 0.42, 0.58, 10, 0.06, 'bagas'), cor: null }]);
  GEO.pedrinha = modelo([{ geo: T(new THREE.OctahedronGeometry(0.2, 0), 0, 0.04, 0, 1, 0.5), cor: null }]);
  GEO.cogumelo = modelo([{ geo: T(new THREE.CylinderGeometry(0.03, 0.04, 0.16, 5, 1, true), 0, 0.08), cor: 0xe8e0d0 }, { geo: T(new THREE.ConeGeometry(0.1, 0.09, 6), 0, 0.2), cor: null }]);
  GEO.samambaia = modelo([{ geo: juntar([0, 1, 2, 3, 4].map(i => { const a = i / 5 * PI * 2; return T(new THREE.BoxGeometry(0.11, 0.02, 0.62), Math.cos(a) * 0.27, 0.2, Math.sin(a) * 0.27, 1, 1, 1, 0, -a + PI / 2, 0.45); })), cor: null }]);
  GEO.laje = modelo([{ geo: new THREE.BoxGeometry(1, 0.08, 1), cor: null }]);
  const PALETA_CHAO = {
    capim: [0x4a5a26, 0x56662c, 0x3e4e22, 0x6a6a2e, 0x5a6a32],
    flores: FLORES.concat([0xf2f0e8, 0xe8c83a, 0xf2f0e8]),
    arbusto: [0x2a4422, 0x32502a, 0x24401e, 0x3a5a2c],
    bagas: [0xb8241a, 0xf2f0e8, 0xe8c83a, 0x7a3ac8, 0xd85a8a],
    pedra: [0x5a564e, 0x6a645a, 0x4e4a44, 0x625c52],
    cogumelo: [0xb8241a, 0x8a5a32, 0xd8c8a8]
  };
  /* op: { area:[x0,x1,z0,z1], H, livre(x,z,margem), casas:[[x,z,w,d,rot]], n:{capim,flores,arbustos,pedrinhas,cogumelos,samambaias},
          paleta, prado(x,z) -> 0..1 (densidade de flores), floresta(x,z) -> bool } */
  C.chao = function (op) {
    const pal = Object.assign({}, PALETA_CHAO, op.paleta || {}), H = op.H || M.altura, n = op.n || {};
    const [x0, x1, z0, z1] = op.area, r = C.sorte(op.semente || 'chao' + x0 + z0);
    // as casas, num gradeado, para nada nascer dentro delas
    const grade = new Map(), G = 16;
    (op.casas || []).forEach(([x, z, w, d]) => { const rr = Math.hypot(w, d) / 2 + 0.6; for (let i = Math.floor((x - rr) / G); i <= Math.floor((x + rr) / G); i++) for (let j = Math.floor((z - rr) / G); j <= Math.floor((z + rr) / G); j++) { const k = i + ',' + j; if (!grade.has(k)) grade.set(k, []); grade.get(k).push([x, z, rr]); } });
    const naCasa = (x, z) => { const l = grade.get(Math.floor(x / G) + ',' + Math.floor(z / G)); return l ? l.some(([a, b, rr]) => Math.hypot(x - a, z - b) < rr) : false; };
    const ok = (x, z, m) => op.livre(x, z, m || 0) && !naCasa(x, z);
    const sortear = (qtd, m, f) => { let k = 0; for (let t = 0; t < qtd * 4 && k < qtd; t++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (!ok(x, z, m)) continue; if (f(x, z) !== false) k++; } };
    const prado = op.prado || ((x, z) => ruido(x, z));
    const L = { tufo: [], caule: [], flor: [], arbusto: [], bagas: [], pedrinha: [], cogumelo: [], samambaia: [] };
    sortear(n.capim || 0, 0, (x, z) => { const s = 0.7 + r() * 0.8; L.tufo.push({ x, y: H(x, z) - 0.02, z, r: r() * 6, sx: s, sy: s * (0.8 + r() * 0.5), cor: r.um(pal.capim), tom: 0.85 + r() * 0.3 }); });
    // flores em ramalhetes, mais densas nos prados
    sortear(n.flores || 0, 0, (x, z) => {
      if (r() > Math.pow(prado(x, z), 2.2) * 1.6) return false;
      const cor = r.um(pal.flores), q = 3 + ((r() * 6) | 0);
      for (let i = 0; i < q; i++) { const fx = x + (r() - 0.5) * 1.2, fz = z + (r() - 0.5) * 1.2, s = 0.8 + r() * 0.5, y = H(fx, fz) - 0.02, rot = r() * 6; L.caule.push({ x: fx, y, z: fz, r: rot, s, cor: 0x3a5a22 }); L.flor.push({ x: fx, y, z: fz, r: rot, s, cor, tom: 0.9 + r() * 0.2 }); }
    });
    sortear(n.arbustos || 0, 0.6, (x, z) => { const s = 0.6 + r() * 0.9, y = H(x, z) - 0.05, rot = r() * 6; const it = { x, y, z, r: rot, sx: s, sy: s * (0.8 + r() * 0.4), cor: r.um(pal.arbusto), tom: 0.85 + r() * 0.3 }; L.arbusto.push(it); if (r() < 0.35) L.bagas.push({ ...it, cor: r.um(pal.bagas), tom: 1 }); });
    sortear(n.pedrinhas || 0, 0, (x, z) => { const s = 0.5 + r() * 1.3; L.pedrinha.push({ x, y: H(x, z), z, r: r() * 6, sx: s, sy: s * (0.6 + r() * 0.6), cor: r.um(pal.pedra), tom: 0.85 + r() * 0.3 }); });
    sortear(n.cogumelos || 0, 0, (x, z) => { if (op.floresta && !op.floresta(x, z)) return false; const cor = r.um(pal.cogumelo); for (let i = 0; i < 2 + r() * 4; i++) { const fx = x + (r() - 0.5) * 0.7, fz = z + (r() - 0.5) * 0.7, s = 0.7 + r() * 0.8; L.cogumelo.push({ x: fx, y: H(fx, fz) - 0.02, z: fz, r: r() * 6, s, cor }); } });
    sortear(n.samambaias || 0, 0.3, (x, z) => { if (op.floresta && !op.floresta(x, z)) return false; const s = 0.8 + r() * 0.8; L.samambaia.push({ x, y: H(x, z) - 0.02, z, r: r() * 6, sx: s, sy: s * (0.8 + r() * 0.5), cor: r.um([0x2a4a22, 0x34562a, 0x3a5a26]), tom: 0.9 + r() * 0.2 }); });
    const lote = new Lote({ sombra: false });
    for (const k in L) L[k].forEach(it => lote.por(GEO[k], it));
    lote.fazer();
    return L;
  };
  // calçamento de pedras num largo
  C.calcamento = function (cx, cz, raio, op) {
    op = op || {};
    const H = op.H || M.altura, r = C.sorte('calc' + cx + cz), its = [], cores = op.cores || [0x6a645c, 0x7a7468, 0x5a544c, 0x8a8274, 0x6e665a];
    const tam = op.tam || 0.5;
    for (let rr = tam; rr < raio; rr += tam * 0.95) {
      const n = Math.max(6, Math.floor(rr * PI * 2 / (tam * 1.1)));
      for (let i = 0; i < n; i++) {
        const a = i / n * PI * 2 + rr * 1.7, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        if (op.livre && !op.livre(x, z)) continue;
        its.push({ x, y: H(x, z) + 0.02, z, r: -a, sx: tam * (0.88 + r() * 0.12), sy: 1, sz: tam * (0.72 + r() * 0.16), cor: r.um(cores), tom: 0.9 + r() * 0.2 });
      }
    }
    const lote = new Lote(); its.forEach(it => lote.por(GEO.laje, it)); lote.fazer();
  };

  /* ================= O FEITIO DE CADA PESSOA ================= */
  const PELES = [0xe0b898, 0xd4a888, 0xc89878, 0xb88868, 0xa87858, 0x8a6044, 0xe8c4a4];
  const CABELOS = [0x1a1210, 0x2b1d14, 0x3a2414, 0x5a3a1a, 0x7a5a2a, 0xa8823a, 0x8a3a1a, 0x4a3a2a];
  const GRISALHO = [0x8a8a80, 0xa8a8a0, 0xc8c8c0, 0x6a6a60];
  const ROUPA = {
    vale: [0x5a4a32, 0x4a5a32, 0x6a3a2a, 0x3a4a5a, 0x7a6a4a, 0x5a3a4a, 0x6a5a3a],
    porto: [0x2a4a6a, 0xd8d0c0, 0x8a3a2a, 0x3a6a7a, 0xc8a050, 0x2a3a5a],
    minas: [0x3a3a34, 0x4a3a2a, 0x5a5048, 0x2a2a28, 0x6a5a4a],
    corte: [0x6a1a2a, 0x2a4a5a, 0x4a2a5a, 0x7a6a3a, 0x2a5a3a, 0x8a5a6a, 0xb89a4a]
  };
  const mulherPorNome = n => /^(Irmã|Madre|Dona|Santa|Viúva|Velha|Menina|Mãe|Avó|Aldeã|Duquesa|Mercadora|Lavadeira|Inês|Isabel|Beatriz|Raquel|Ester|Ruth)\b/.test(n) || /^[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõç]*a\b/.test(n);
  C.feitio = function (op) {
    const nome = op.nome || '', r = C.sorte(op.id || nome || Math.random());
    const regiao = op.regiao || 'vale';
    const clerigo = /^(Padre|Frei|Irmão|Irmã|Madre|Dom|Bispo|Abade|Abadessa)\b/.test(nome) || !!op.capuz;
    const mulher = op.mulher !== undefined ? op.mulher : (!!op.veu || mulherPorNome(nome));
    const velho = /\b(Velh[oa]|Avó|Avô|Ancião|Anciã)\b/.test(nome) || /Mestre/.test(nome) && r() < 0.5;
    const nobre = /\b(Duque|Duquesa|Barão|Baronesa|Conde|Condessa)\b/.test(nome);
    const roupas = ROUPA[regiao] || ROUPA.vale;
    const v = {
      mulher, clerigo, velho, nobre,
      alt: mulher ? 0.9 + r() * 0.1 : 0.94 + r() * 0.12, larg: 0.9 + r() * (velho ? 0.15 : 0.25),
      pele: r.um(PELES),
      cabelo: op.cabelo !== undefined ? op.cabelo : velho ? r.um(GRISALHO) : r.um(CABELOS),
      penteado: mulher ? r.peso([['longo', 4], ['coque', 3], ['trança', 2]]) : r.peso([['curto', 5], ['calvo', velho ? 4 : 0.6], ['crespo', 1.5]]),
      barba: !mulher && !clerigo ? r.peso([['nenhuma', 4], ['cheia', 3], ['bigode', 1.5], ['cavanhaque', 1]]) : 'nenhuma',
      chapeu: clerigo || op.capuz || op.veu ? 'nenhum' : mulher ? r.peso([['nenhum', 4], ['lenco', 4], ['touca', 2]]) : nobre ? 'feltro' : r.peso([['nenhum', 4], ['palha', regiao === 'porto' || regiao === 'vale' ? 3 : 0.5], ['boina', 3], ['gorro', regiao === 'minas' ? 4 : 1]]),
      corChapeu: r.um([0xc8a860, 0x5a3a2a, 0x2a2a3a, 0x6a1a1a, 0x3a4a2a, 0xd8ccb0]),
      colete: !clerigo && !nobre && r() < 0.45 ? r.um(roupas) : null,
      cinto: clerigo && (op.capuz || /Frei|Irmão/.test(nome)) ? 'cordao' : r() < 0.75 ? r.um([0x3a2414, 0x2a1a10, 0x5a3a1a, 0x6a1a1a]) : null,
      avental: !clerigo && !nobre && (mulher ? r() < 0.55 : r() < 0.2) ? r.um([0xd8ccb0, 0xc8b898, 0xe0d8c8, 0x8a7a5a]) : null,
      xale: mulher && !clerigo && r() < 0.4 ? r.um(roupas.concat([0x8a2a2a, 0x2a4a3a, 0xc8b898])) : null,
      calca: r.um([0x3a3024, 0x4a4034, 0x2a2a30, 0x5a4a3a, 0x3a3a2a]),
      bota: r.um([0x1a1410, 0x2a1c12, 0x3a2618]),
      cesto: mulher && !clerigo && r() < 0.3, cajado: velho || /pastor/i.test(nome),
      corRoupa: r.um(roupas), colarinho: /^Padre\b/.test(nome), pena: nobre ? r.um([0xd8283a, 0xf2f0e8, 0x2a6a8a]) : null
    };
    return v;
  };
  // acessórios da cabeça e do corpo (no grupo do corpo `c`, cabeça em y = hy); devolve a lista de malhas criadas
  C.vestir = function (c, v, op, hy, sent) {
    const M2 = (geo, m, x, y, z, sx, sy, sz, rx, rz) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (sx) me.scale.set(sx, sy || sx, sz || sx); if (rx || rz) me.rotation.set(rx || 0, 0, rz || 0); me.castShadow = true; c.add(me); return me; };
    const mc = mat(v.cabelo), olho = mat(0x1a1210);
    // olhos e nariz
    [-1, 1].forEach(s => M2(new THREE.BoxGeometry(0.045, 0.05, 0.03), olho, s * 0.065, hy + 0.02, (sent ? 0.12 : 0.02) + 0.175));
    M2(new THREE.BoxGeometry(0.04, 0.06, 0.05), mat(v.pele), 0, hy - 0.03, (sent ? 0.12 : 0.02) + 0.19);
    const zc = sent ? 0.12 : 0.02;
    if (!op.veu && !op.capuz) {
      if (v.penteado === 'longo') M2(new THREE.BoxGeometry(0.34, 0.5, 0.14), mc, 0, hy - 0.2, zc - 0.14);
      else if (v.penteado === 'coque') M2(new THREE.SphereGeometry(0.1, 6, 5), mc, 0, hy + 0.12, zc - 0.17);
      else if (v.penteado === 'trança') { M2(new THREE.BoxGeometry(0.1, 0.55, 0.1), mc, 0, hy - 0.3, zc - 0.2); M2(new THREE.SphereGeometry(0.06, 5, 4), mat(0x8a2a2a), 0, hy - 0.58, zc - 0.2); }
      else if (v.penteado === 'crespo') M2(new THREE.IcosahedronGeometry(0.23, 0), mc, 0, hy + 0.08, zc - 0.03);
    }
    if (v.barba === 'cheia') M2(new THREE.BoxGeometry(0.26, 0.2, 0.12), mc, 0, hy - 0.13, zc + 0.12);
    else if (v.barba === 'bigode') M2(new THREE.BoxGeometry(0.16, 0.04, 0.05), mc, 0, hy - 0.08, zc + 0.19);
    else if (v.barba === 'cavanhaque') M2(new THREE.BoxGeometry(0.1, 0.12, 0.08), mc, 0, hy - 0.16, zc + 0.15);
    const mh = mat(v.corChapeu);
    if (v.chapeu === 'palha') { M2(new THREE.CylinderGeometry(0.42, 0.44, 0.04, 10), mat(0xc8a860), 0, hy + 0.15, zc - 0.02); M2(new THREE.CylinderGeometry(0.18, 0.21, 0.16, 8), mat(0xc8a860), 0, hy + 0.24, zc - 0.02); M2(new THREE.CylinderGeometry(0.212, 0.212, 0.04, 8), mat(0x6a1a1a), 0, hy + 0.19, zc - 0.02); }
    else if (v.chapeu === 'boina') M2(new THREE.SphereGeometry(0.24, 8, 5), mh, 0.03, hy + 0.13, zc - 0.03, 1, 0.42, 1, 0, -0.18);
    else if (v.chapeu === 'gorro') M2(new THREE.ConeGeometry(0.21, 0.32, 7), mh, 0, hy + 0.24, zc - 0.05, 1, 1, 1, -0.3, 0);
    else if (v.chapeu === 'feltro') { M2(new THREE.CylinderGeometry(0.36, 0.38, 0.04, 10), mat(0x1a1416), 0, hy + 0.15, zc); M2(new THREE.CylinderGeometry(0.17, 0.2, 0.26, 8), mat(0x1a1416), 0, hy + 0.28, zc); if (v.pena) M2(new THREE.BoxGeometry(0.04, 0.42, 0.08), mat(v.pena), 0.2, hy + 0.36, zc - 0.05, 1, 1, 1, -0.4, -0.4); }
    else if (v.chapeu === 'lenco') { M2(new THREE.SphereGeometry(0.225, 8, 6), mh, 0, hy + 0.04, zc - 0.04); M2(new THREE.BoxGeometry(0.14, 0.12, 0.1), mh, 0, hy - 0.06, zc - 0.22); }
    else if (v.chapeu === 'touca') M2(new THREE.SphereGeometry(0.215, 8, 6, 0, PI * 2, 0, PI * 0.55), mat(0xe8e0d0), 0, hy + 0.02, zc - 0.03);
    if (sent) return;
    // corpo: colete, cinto, avental, xale, colarinho
    if (v.colete) M2(new THREE.CylinderGeometry(0.295, 0.35, 0.5, 7), mat(v.colete), 0, 1.44, 0);
    if (v.cinto === 'cordao') { M2(new THREE.CylinderGeometry(0.37, 0.37, 0.05, 8), mat(0xd8ccb0), 0, 1.0, 0); M2(new THREE.BoxGeometry(0.04, 0.5, 0.04), mat(0xd8ccb0), 0.16, 0.74, 0.34); }
    else if (v.cinto) { M2(new THREE.CylinderGeometry(0.365, 0.365, 0.07, 8), mat(v.cinto), 0, 1.0, 0); M2(new THREE.BoxGeometry(0.08, 0.07, 0.04), mat(0xb8962e, { metalness: 0.6, roughness: 0.4 }), 0, 1.0, 0.36); if (!v.mulher && Math.abs(v.alt - 1) > 0.02) M2(new THREE.BoxGeometry(0.14, 0.16, 0.08), mat(0x5a3a1a), -0.3, 0.9, 0.18); }
    if (v.avental) M2(new THREE.BoxGeometry(0.44, v.mulher ? 0.66 : 0.5, 0.03), mat(v.avental), 0, v.mulher ? 0.68 : 0.76, 0.43, 1, 1, 1, -0.12, 0);
    if (v.xale) M2(new THREE.CylinderGeometry(0.33, 0.42, 0.26, 8), mat(v.xale), 0, 1.6, 0);
    if (v.colarinho) M2(new THREE.BoxGeometry(0.14, 0.06, 0.04), mat(0xf2f0e8), 0, 1.67, 0.27);
  };
  // objeto na mão (cesto ou cajado), preso ao braço
  C.naMao = function (braco, v) {
    if (!braco) return;
    if (v.cajado) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.9, 5), mat(0x4a3422)); s.position.set(0, -0.35, 0.12); s.castShadow = true; braco.add(s); }
    else if (v.cesto) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.22, 8), mat(0x8a6a3a)); b.position.set(0.06, -0.72, 0.08); braco.add(b); const a = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 4, 10, PI), mat(0x6a4a2a)); a.position.set(0.06, -0.62, 0.08); braco.add(a); const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), mat(0xb8241a)); f.position.set(0.06, -0.6, 0.08); braco.add(f); }
  };
})(window.OV);

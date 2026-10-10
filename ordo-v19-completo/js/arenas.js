/* Ordo Virtutum — as salas dos chefões, mais grandiosas: o dossel do Senhor do Banquete, o anel de obeliscos
   de Mamom na Grande Cava, o salão e o pórtico do Palácio dos Bailes, e a Câmara do Meio-Dia com pilares e o disco do sol. */
(function (OV) {
  'use strict';
  const M = OV.mundo, C = OV.cenario; if (!M || M.falhou || !C) return;
  const scene = M.scene, mat = C.mat, PI = Math.PI;
  const OURO = mat(0xc9a24a, { metalness: 0.75, roughness: 0.35 }), PEDRA = mat(0x8a8274), PEDRA_E = mat(0x4a443e), MARMORE = mat(0xe8e0d0), MARMORE_E = mat(0xc8bca8);
  const VELUDO = mat(0x6a1018), VELUDO_E = mat(0x3a0a10), FERRO = mat(0x1e1e22, { metalness: 0.5, roughness: 0.6 }), MADEIRA = mat(0x3a2618);
  const B = (g, w, h, d, x, y, z, m, rx, ry, rz) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.set(rx || 0, ry || 0, rz || 0); g.add(me); return me; };
  const Cl = (g, rt, rb, h, x, y, z, m, seg) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), m); me.position.set(x, y, z); g.add(me); return me; };
  const Co = (g, r, h, x, y, z, m, seg) => { const me = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 4), m); me.position.set(x, y, z); g.add(me); return me; };
  const grupo = (x, y, z, rot) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot || 0; scene.add(g); return g; };
  const chama = (g, x, y, z, s) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22 * (s || 1), 0.6 * (s || 1), 6), new THREE.MeshBasicMaterial({ color: 0xffa040 })); f.position.set(x, y, z); f.userData.solto = true; g.add(f); M.flames.push(f); return f; };
  // coluna clássica: base, fuste, capitel
  function coluna(g, x, z, h, r, m, mc) {
    B(g, r * 2.6, 0.35, r * 2.6, x, 0.18, z, mc || m);
    Cl(g, r * 0.9, r, h - 0.8, x, 0.35 + (h - 0.8) / 2, z, m, 12);
    B(g, r * 2.6, 0.45, r * 2.6, x, h - 0.22, z, mc || m);
  }

  /* ================= O DOSSEL DO SENHOR DO BANQUETE (Portos do Festim) ================= */
  (function () {
    const PT = OV.porto; if (!PT) return;
    const K = PT.K || 1.5, W = (lx, lz) => PT.W(lx, lz), H = (x, z) => PT.altura(x, z);
    const c = W(0, 14), y0 = H(c.x, c.z);
    const g = grupo(c.x, y0, c.z, 0);
    // estrado em degraus atrás do trono
    [[18, 0.3, 6.4, 3.0], [15, 0.6, 5.2, 3.6], [12, 0.9, 4.0, 4.2]].forEach(([w, h, d, z]) => B(g, w, h, d, 0, h / 2, z + 1.2, PEDRA));
    // quatro colunas altas e o dossel de veludo com franja de ouro
    const HC = 10.5;
    [[-6, -1.6], [6, -1.6], [-6, 6.5], [6, 6.5]].forEach(([x, z]) => { coluna(g, x, z, HC, 0.55, MARMORE, OURO); M.obstacles.push({ x: c.x + x, z: c.z + z, r: 0.85 }); });
    B(g, 13.4, 0.6, 9.4, 0, HC + 0.3, 2.45, VELUDO_E);
    B(g, 13.8, 0.25, 9.8, 0, HC - 0.05, 2.45, OURO);
    for (let i = 0; i < 18; i++) B(g, 0.5, 0.5 + (i % 2) * 0.25, 0.08, -6.5 + i * 0.76, HC - 0.45, -2.3, OURO);
    const tp = Co(g, 7.6, 3.4, 0, HC + 2.3, 2.45, VELUDO, 4); tp.rotation.y = PI / 4; tp.scale.set(1, 1, 0.68);
    Cl(g, 0.6, 0.6, 0.5, 0, HC + 4.2, 2.45, OURO, 8); Co(g, 0.45, 1.2, 0, HC + 5, 2.45, OURO, 6);
    // a parede do fundo: arco triunfal com um prato de ouro gigante, o brasão da gula
    const zf = 9.2;
    B(g, 20, 13, 1.2, 0, 6.5, zf, PEDRA);
    B(g, 21, 0.8, 1.6, 0, 13.2, zf, MARMORE_E); B(g, 21, 0.5, 1.5, 0, 0.25, zf, MARMORE_E);
    Cl(g, 3.2, 3.2, 0.3, 0, 7.6, zf - 0.75, OURO, 24).rotation.x = PI / 2;
    Cl(g, 2.4, 2.4, 0.35, 0, 7.6, zf - 0.8, mat(0x8a6a2a, { metalness: 0.6, roughness: 0.4 }), 24).rotation.x = PI / 2;
    [-1, 1].forEach(s => {
      B(g, 2.2, 10, 0.12, s * 7.5, 6.8, zf - 0.68, VELUDO); B(g, 2.2, 0.4, 0.14, s * 7.5, 11.6, zf - 0.7, OURO);
      Co(g, 1.1, 1.3, s * 7.5, 1.15, zf - 0.68, VELUDO, 3).rotation.y = PI / 3;
      // ânforas e barris empilhados
      Cl(g, 0.55, 0.4, 1.4, s * 9, 0.7, 4, mat(0x9a5a2a), 9); Cl(g, 0.25, 0.4, 0.5, s * 9, 1.6, 4, mat(0x9a5a2a), 9);
      for (let k = 0; k < 3; k++) Cl(g, 0.5, 0.5, 1.1, s * (10.5 - k * 1.1), 0.55, 6.5, MADEIRA, 10).rotation.z = PI / 2;
      // grandes braseiros nas laterais do estrado
      const bx = s * 8.6, bz = -0.5;
      Cl(g, 0.25, 0.4, 2.4, bx, 1.2, bz, FERRO, 8); Cl(g, 0.9, 0.4, 0.6, bx, 2.6, bz, FERRO, 10);
      chama(g, bx, 3.3, bz, 2.2); M.emissor(c.x + bx, y0 + 3.4, c.z + bz, 1.3, 14, 0xff9a40, true);
      M.obstacles.push({ x: c.x + bx, z: c.z + bz, r: 0.8 });
    });
    M.caixa(c.x, c.z + zf, 10, 0.6, 0);
    C.fundir(g);
  })();

  /* ================= A GRANDE CAVA DE MAMOM (Minas) ================= */
  (function () {
    const R = OV.regioes && OV.regioes.minas; if (!R || !R.CAVA) return;
    const CV = R.CAVA, cw = R.W(CV.x, CV.z), H = (x, z) => R.altura(x, z);
    const g = grupo(0, 0, 0, 0);
    const OURO_V = mat(0xe0b040, { metalness: 0.8, roughness: 0.3 }), NEGRO = mat(0x2a2420);
    // anel de obeliscos, aberto para o lado da rampa
    const N = 12, RA = 19;
    for (let i = 0; i < N; i++) {
      const a = i / N * PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.42) continue;
      const x = cw.x + Math.sin(a) * RA, z = cw.z + Math.cos(a) * RA, y = H(x, z);
      const o = new THREE.Group(); o.position.set(x, y, z); o.rotation.y = a; g.add(o);
      B(o, 2.4, 1, 2.4, 0, 0.5, 0, NEGRO);
      const fuste = Cl(o, 0.55, 0.95, 10, 0, 6, 0, PEDRA_E, 4); fuste.rotation.y = PI / 4;
      [3, 6.5, 9].forEach(h => { const b2 = Cl(o, 0.98 - h * 0.04, 0.98 - h * 0.04, 0.3, 0, h, 0, OURO_V, 4); b2.rotation.y = PI / 4; });
      const pt = Co(o, 0.75, 1.6, 0, 11.8, 0, OURO_V, 4); pt.rotation.y = PI / 4;
      chama(o, 0, 13, 0, 1.4);
      M.obstacles.push({ x, z, r: 1.3 });
      // correntes até o próximo obelisco
      const a2 = (i + 1) / N * PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a2), Math.cos(a2))) >= 0.42) {
        const x2 = cw.x + Math.sin(a2) * RA, z2 = cw.z + Math.cos(a2) * RA, y2 = H(x2, z2);
        const L = Math.hypot(x2 - x, z2 - z), mx = (x + x2) / 2, mz = (z + z2) / 2, my = (y + y2) / 2 + 7;
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, L), FERRO); ch.position.set(mx, my - 0.8, mz); ch.lookAt(x2, y2 + 7, z2); g.add(ch);
        for (let k = 1; k < 6; k++) { const t = k / 6, el = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 4, 8), FERRO); el.position.set(x + (x2 - x) * t, (y + (y2 - y) * t) + 7 - Math.sin(t * PI) * 1.2, z + (z2 - z) * t); el.rotation.y = a + PI / 2; g.add(el); }
      }
    }
    // o portão de ouro no pé da rampa
    { const x = cw.x, z = cw.z + RA - 1.5, y = H(x, z); const p = new THREE.Group(); p.position.set(x, y, z); g.add(p);
      [-1, 1].forEach(s => { B(p, 1.6, 11, 1.6, s * 4.4, 5.5, 0, NEGRO); B(p, 1.9, 0.5, 1.9, s * 4.4, 11.1, 0, OURO_V); M.obstacles.push({ x: x + s * 4.4, z, r: 1.1 }); });
      B(p, 10.6, 1.4, 1.8, 0, 11.6, 0, NEGRO); B(p, 10.8, 0.3, 2, 0, 12.4, 0, OURO_V);
      const moeda = Cl(p, 1.6, 1.6, 0.3, 0, 13.9, 0, OURO_V, 20); moeda.rotation.x = PI / 2; B(p, 0.6, 0.6, 0.35, 0, 13.9, 0, NEGRO);
    }
    // degraus em volta do pedestal do ídolo
    { const ix = cw.x, iz = cw.z - 6, y = H(ix, iz); const p = new THREE.Group(); p.position.set(ix, y, iz); g.add(p);
      [[5.2, 0.3], [4.4, 0.6]].forEach(([r, h]) => Cl(p, r, r + 0.2, h, 0, h / 2 - 0.05, 0, NEGRO, 8));
      [0, 1, 2, 3].forEach(k => { const a = k / 4 * PI * 2 + PI / 4; Cl(p, 0.3, 0.4, 3.2, Math.sin(a) * 4.6, 1.6, Math.cos(a) * 4.6, OURO_V, 8); chama(p, Math.sin(a) * 4.6, 3.5, Math.cos(a) * 4.6, 1.3); });
    }
    // montanhas de moedas atrás dos obeliscos
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2 + 0.2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.6) continue; const r = RA + 4 + (i % 3), x = cw.x + Math.sin(a) * r, z = cw.z + Math.cos(a) * r; const m = Co(g, 2.4 + (i % 3) * 0.6, 1.6 + (i % 2) * 0.8, x, H(x, z) + 0.6, z, OURO_V, 8); }
    M.emissor(cw.x, H(cw.x, cw.z) + 6, cw.z, 1.1, 30, 0xffc060, true);
    C.fundir(g);
  })();

  /* ================= O PALÁCIO DOS BAILES (Belmonte) ================= */
  (function () {
    const R = OV.regioes && OV.regioes.corte; if (!R || !R.PALACIO) return;
    const pal = R.PALACIO, h = 11, w = 26, d = 34;
    // dentro: piso xadrez, tapete vermelho, arcos dourados entre as colunas, cortinas, um lustre imenso e estátuas mascaradas
    const dent = new THREE.Group(); pal.g.add(dent);
    for (let i = 0; i < 12; i++) for (let k = 0; k < 16; k++) if ((i + k) % 2) B(dent, 2, 0.02, 2, -11 + i * 2, 0.215, -15 + k * 2, mat(0x3a3438));
    B(dent, 3.2, 0.03, 30, 0, 0.235, 0.5, VELUDO); B(dent, 0.18, 0.035, 30, -1.7, 0.24, 0.5, OURO); B(dent, 0.18, 0.035, 30, 1.7, 0.24, 0.5, OURO);
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => {
      const lz = -12 + k * 6 + 3;
      B(dent, 0.5, 0.6, 5.2, s * 9, h - 1.6, lz, OURO);
      const arco = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.22, 6, 16, PI), OURO); arco.position.set(s * 9, h - 4.4, lz); arco.rotation.y = PI / 2; dent.add(arco);
      B(dent, 0.12, h - 1.2, 3.6, s * (w / 2 - 0.55), h / 2, lz, VELUDO);
      B(dent, 0.14, 0.5, 3.8, s * (w / 2 - 0.55), h - 0.8, lz, OURO);
    });
    const lu = new THREE.Group(); lu.position.set(0, h - 2.6, -3); dent.add(lu);
    [2.6, 1.8, 1.0].forEach((r, i) => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 6, 28), OURO); a.rotation.x = PI / 2; a.position.y = -i * 0.7; lu.add(a); for (let j = 0; j < 8 + i * 2; j++) { const t = j / (8 + i * 2) * PI * 2; chama(lu, Math.cos(t) * r, 0.2 - i * 0.7, Math.sin(t) * r, 0.5); } });
    B(lu, 0.06, 2.6, 0.06, 0, 1.3, 0, OURO);
    { const q = pal.W(0, -3); M.emissor(q.x, M.altura(q.x, q.z) + h - 2.8, q.z, 1.6, 22, 0xffd8a0); }
    [-1, 1].forEach(s => {
      const st = new THREE.Group(); st.position.set(s * 6.4, 0.2, -14.5); dent.add(st);
      B(st, 1.4, 1.2, 1.4, 0, 0.6, 0, MARMORE_E); Co(st, 0.8, 3.2, 0, 2.8, 0, MARMORE, 8); const cb = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), MARMORE); cb.position.y = 4.65; st.add(cb);
      B(st, 0.55, 0.3, 0.12, 0, 4.7, 0.38, OURO);
    });
    C.fundir(dent);
    // fora: um pórtico de colunas com frontão e uma escadaria larga
    const fr = new THREE.Group(); pal.g.add(fr);
    const zf = d / 2 + 2.2, HC = 9;
    [-10.6, -7.6, -4.6, 4.6, 7.6, 10.6].forEach(x => { coluna(fr, x, zf, HC, 0.55, MARMORE, MARMORE_E); const q = pal.W(x, zf); M.obstacles.push({ x: q.x, z: q.z, r: 0.75 }); });
    B(fr, 24, 1.1, 2.4, 0, HC + 0.55, zf, MARMORE_E); B(fr, 24.6, 0.25, 2.6, 0, HC + 1.2, zf, OURO);
    const sh = new THREE.Shape(); sh.moveTo(-12.4, 0); sh.lineTo(12.4, 0); sh.lineTo(0, 3.6); sh.closePath();
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false }); fg.translate(0, 0, -1.1);
    const fp = new THREE.Mesh(fg, MARMORE); fp.position.set(0, HC + 1.3, zf); fr.add(fp);
    const ms = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), OURO); ms.position.set(0, HC + 2.4, zf + 1.12); fr.add(ms);
    [0, 1, 2].forEach(k => B(fr, 26 - k * 2, 0.16, 1.4, 0, 0.08 + k * 0.16, zf + 3.6 - k * 1.2, MARMORE_E));
    [-1, 1].forEach(s => { B(fr, 1.6, 7, 0.1, s * 6.1, 5.4, zf + 0.62, VELUDO); B(fr, 1.6, 0.3, 0.12, s * 6.1, 8.9, zf + 0.64, OURO); });
    C.fundir(fr);
    // o pórtico some junto com o telhado quando se entra (para não tapar a câmera)
    const orn = pal.ornato; pal.portico = fr;
    M.animados.push(() => { fr.visible = !pal.dentro; });
  })();

  /* ================= A CÂMARA DO MEIO-DIA (Cripta) ================= */
  (function () {
    const CR = OV.cripta; if (!CR) return;
    const X = 300, CZ = -38, RR = 14, y0 = CR.altura(X, CZ), teto = CR.teto(X, CZ);
    const g = grupo(0, 0, 0, 0), HT = teto - y0;
    const PEDRA_C = mat(0x6a6058), SOL = mat(0xe8b84a, { metalness: 0.6, roughness: 0.35, emissive: 0x3a2400 });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) continue; // a entrada
      const x = X + Math.sin(a) * (RR - 2.2), z = CZ + Math.cos(a) * (RR - 2.2);
      const p = new THREE.Group(); p.position.set(x, y0, z); g.add(p);
      coluna(p, 0, 0, HT, 0.5, PEDRA_C, PEDRA_E);
      // a figura de um monge em oração, aos pés de cada pilar
      const m = new THREE.Group(); m.position.set(-Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); m.rotation.y = a + PI; p.add(m);
      Co(m, 0.42, 1.5, 0, 0.75, 0, PEDRA_E, 8); const cab = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), PEDRA_E); cab.position.y = 1.6; m.add(cab);
      M.obstacles.push({ x, z, r: 0.75 });
    }
    // o disco do sol no fundo da câmara, e sarcófagos de pedra
    const sz = CZ - RR + 0.6;
    const d1 = Cl(g, 2.6, 2.6, 0.25, X, y0 + 6, sz, SOL, 24); d1.rotation.x = PI / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; const r1 = Co(g, 0.35, 1.6, X + Math.cos(a) * 3.4, y0 + 6 + Math.sin(a) * 3.4, sz + 0.05, SOL, 4); r1.rotation.z = a - PI / 2; }
    [[-7, -4], [7, -4], [-8.5, 3], [8.5, 3]].forEach(([dx, dz]) => { const x = X + dx, z = CZ + dz; B(g, 2.4, 0.9, 1.2, x, y0 + 0.45, z, PEDRA_E, 0, Math.atan2(dx, dz), 0); B(g, 2.2, 0.25, 1.0, x, y0 + 1.0, z, PEDRA_C, 0, Math.atan2(dx, dz), 0); M.obstacles.push({ x, z, r: 1.1 }); });
    C.fundir(g);
  })();
})(window.OV);

/* v18: as salas dos chefões ficam ainda mais imponentes — colossos, estandartes, braseiros altos e lustres */
(function (OV) {
  'use strict';
  const M = OV.mundo, C = OV.cenario; if (!M || M.falhou || !C) return;
  const scene = M.scene, mat = C.mat, PI = Math.PI;
  const OURO = mat(0xc9a24a, { metalness: 0.75, roughness: 0.35 }), PEDRA = mat(0x7a7266), PEDRA_E = mat(0x3e3832), MARMORE = mat(0xe8e0d0), FERRO = mat(0x1e1e22, { metalness: 0.5, roughness: 0.6 });
  const VELUDO = mat(0x6a1018), ROXO = mat(0x3a1a4a);
  const B = (g, w, h, d, x, y, z, m, ry) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.y = ry || 0; g.add(me); return me; };
  const Cl = (g, rt, rb, h, x, y, z, m, seg) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 10), m); me.position.set(x, y, z); g.add(me); return me; };
  const Co = (g, r, h, x, y, z, m, seg) => { const me = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 6), m); me.position.set(x, y, z); g.add(me); return me; };
  const Sp = (g, r, x, y, z, m) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); me.position.set(x, y, z); g.add(me); return me; };
  const grupo = (x, y, z, rot) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot || 0; scene.add(g); return g; };
  const chama = (g, x, y, z, s, cor) => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.22 * s, 0.6 * s, 6), new THREE.MeshBasicMaterial({ color: cor || 0xffa040 })); f.position.set(x, y, z); f.userData.solto = true; g.add(f); M.flames.push(f); return f; };
  // um braseiro alto, de ferro, com fogo e luz
  function braseiro(g, wx, wz, y, h, cor, luz) {
    const p = grupo(wx, y, wz, 0); Cl(p, 0.2, 0.45, h, 0, h / 2, 0, FERRO, 8); Cl(p, 1.0, 0.45, 0.6, 0, h + 0.2, 0, FERRO, 10); chama(p, 0, h + 0.9, 0, 2.6, cor);
    M.emissor(wx, y + h + 1.2, wz, 1.5, 16, luz || 0xff9a40, true); M.obstacles.push({ x: wx, z: wz, r: 0.7 }); C.fundir(p);
  }
  // um colosso de pedra: plinto, corpo em manto, cabeça e coroa
  function colosso(g, x, z, rot, alt, m, coroa, lx) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; g.add(c);
    B(c, 3.2, 2.2, 3.2, 0, 1.1, 0, PEDRA_E); B(c, 3.5, 0.3, 3.5, 0, 2.3, 0, OURO);
    Co(c, 1.5, alt * 0.62, 0, 2.4 + alt * 0.31, 0, m, 8);
    B(c, 2.6, alt * 0.18, 1.3, 0, 2.4 + alt * 0.62, 0, m);
    Sp(c, 0.75, 0, 2.4 + alt * 0.8, 0.1, m);
    if (coroa) { Cl(c, 0.72, 0.62, 0.55, 0, 2.4 + alt * 0.8 + 0.75, 0, OURO, 8); for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; Co(c, 0.13, 0.5, Math.cos(a) * 0.62, 2.4 + alt * 0.8 + 1.25, Math.sin(a) * 0.62, OURO, 4); } }
    [-1, 1].forEach(s => { const br = B(c, 0.5, alt * 0.36, 0.5, s * 1.25, 2.4 + alt * 0.48, 0.55, m); br.rotation.x = -0.5; });
    if (lx) B(c, 1.6, 0.18, 1.6, 0, 2.4 + alt * 0.58, 1.25, OURO); // o prato de ouro estendido
    return c;
  }
  function estandarte(g, x, z, alt, m, rot) {
    const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = rot || 0; g.add(e);
    Cl(e, 0.09, 0.12, alt, 0, alt / 2, 0, FERRO, 6); Co(e, 0.18, 0.5, 0, alt + 0.2, 0, OURO, 6);
    B(e, 1.6, 0.12, 0.12, 0, alt - 0.3, 0, OURO); B(e, 1.4, alt * 0.45, 0.06, 0, alt - 0.3 - alt * 0.225, 0.05, m);
    B(e, 1.4, 0.2, 0.08, 0, alt - 0.3 - alt * 0.45, 0.05, OURO);
  }

  /* ---- o Senhor do Banquete: dois colossos de reis glutões e estandartes em volta da praça ---- */
  (function () {
    const PT = OV.porto; if (!PT) return;
    const c = PT.W(0, 14), y0 = PT.altura(c.x, c.z), g = grupo(c.x, y0, c.z, 0);
    [-1, 1].forEach(s => { colosso(g, s * 12.5, 5, s * 0.25, 10, PEDRA, true, true); M.obstacles.push({ x: c.x + s * 12.5, z: c.z + 5, r: 2.0 }); });
    for (let i = 0; i < 8; i++) { const a = PI + (i - 3.5) / 3.5 * 1.25, r = 22; estandarte(g, Math.sin(a) * r, Math.cos(a) * r + 2, 9, i % 2 ? VELUDO : mat(0x8a6a1a), a); M.obstacles.push({ x: c.x + Math.sin(a) * r, z: c.z + Math.cos(a) * r + 2, r: 0.4 }); }
    C.fundir(g);
    [-1, 1].forEach(s => braseiro(g, c.x + s * 16, c.z - 6, y0, 4.2));
  })();

  /* ---- Mamom: seis colunas colossais de ouro e pedra negra em volta da Grande Cava ---- */
  (function () {
    const R = OV.regioes && OV.regioes.minas; if (!R || !R.CAVA) return;
    const cw = R.W(R.CAVA.x, R.CAVA.z), Hm = (x, z) => R.altura(x, z), g = grupo(0, 0, 0, 0), NEGRO = mat(0x221c18), OURO_V = mat(0xe0b040, { metalness: 0.8, roughness: 0.3 });
    for (let i = 0; i < 6; i++) {
      const a = (i + 0.5) / 6 * PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.5) continue;
      const x = cw.x + Math.sin(a) * 29, z = cw.z + Math.cos(a) * 29, y = Hm(x, z);
      const o = grupo(x, y, z, a); B(o, 3.6, 1.6, 3.6, 0, 0.8, 0, NEGRO); Cl(o, 1.1, 1.4, 16, 0, 9.6, 0, NEGRO, 8);
      [4, 9, 14].forEach(h => Cl(o, 1.5, 1.5, 0.5, 0, h, 0, OURO_V, 8)); Cl(o, 2.2, 1.2, 1.2, 0, 18, 0, OURO_V, 10); chama(o, 0, 19.2, 0, 3.4, 0xffd040);
      M.emissor(x, y + 19.5, z, 1.3, 22, 0xffc050, true); M.obstacles.push({ x, z, r: 2.0 }); C.fundir(o);
    }
  })();

  /* ---- o Palácio dos Bailes: espelhos altos de moldura dourada pelas paredes, e mais dois lustres ---- */
  (function () {
    const R = OV.regioes && OV.regioes.corte; if (!R || !R.PALACIO) return;
    const pal = R.PALACIO, h = 11, g = new THREE.Group(); pal.g.add(g);
    const ESPELHO = mat(0xbcc8d8, { metalness: 0.95, roughness: 0.08 });
    for (let k = 0; k < 4; k++) [-1, 1].forEach(s => { const lz = -12 + k * 6; B(g, 0.1, 6.4, 2.4, s * 12.35, 3.8, lz, ESPELHO); B(g, 0.16, 6.9, 0.18, s * 12.3, 3.8, lz - 1.25, OURO); B(g, 0.16, 6.9, 0.18, s * 12.3, 3.8, lz + 1.25, OURO); B(g, 0.16, 0.25, 2.7, s * 12.3, 7.3, lz, OURO); });
    [-12, 7].forEach(lz => {
      const lu = new THREE.Group(); lu.position.set(0, h - 2.4, lz); g.add(lu);
      [1.8, 1.1].forEach((r, i) => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 6, 24), OURO); a.rotation.x = PI / 2; a.position.y = -i * 0.6; lu.add(a); for (let j = 0; j < 8; j++) { const t = j / 8 * PI * 2; Cl(lu, 0.05, 0.05, 0.22, Math.cos(t) * r, -i * 0.6 + 0.14, Math.sin(t) * r, MARMORE, 6); } });
      B(lu, 0.05, 2.4, 0.05, 0, 1.2, 0, OURO);
      const q = pal.W(0, lz); M.emissor(q.x, M.altura(q.x, q.z) + h - 2.6, q.z, 1.2, 16, 0xffd8a0);
    });
    C.fundir(g);
  })();

  /* ---- a Câmara do Meio-Dia: um sol maior, quatro braseiros de chama roxa e um estrado de pedra ---- */
  (function () {
    const CR = OV.cripta; if (!CR) return;
    const X = 300, CZ = -38, RR = 14, y0 = CR.altura(X, CZ), g = grupo(0, 0, 0, 0);
    const SOL = mat(0xe8b84a, { metalness: 0.6, roughness: 0.35, emissive: 0x3a2400 }), sz = CZ - RR + 0.4;
    const anel = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.35, 8, 32), SOL); anel.position.set(X, y0 + 6, sz); g.add(anel);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; const r1 = Co(g, 0.3, 1.8, X + Math.cos(a) * 5.6, y0 + 6 + Math.sin(a) * 5.6, sz, SOL, 4); r1.rotation.z = a - PI / 2; }
    [[6, 6.2], [5, 6.6], [4, 7.0]].forEach(([w, z], k) => B(g, w * 2, 0.3, 1.6, X, y0 + 0.15 + k * 0.3, CZ - RR + z, PEDRA));
    C.fundir(g);
    [[-6, -9], [6, -9], [-9, 2], [9, 2]].forEach(([dx, dz]) => braseiro(g, X + dx, CZ + dz, y0, 3.2, 0xc87aff, 0xb070ff));
  })();
})(window.OV);

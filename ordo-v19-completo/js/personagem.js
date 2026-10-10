/* Ordo Virtutum — o personagem: corpo, hábito, cabeça e arma conforme o sexo e a ordem (12 ordens) */
(function (OV) {
  'use strict';
  const sm = OV.sm, mesh = OV.mesh;

  /* aparência de cada ordem: corpo, cores, cabeça (m/f), extras e arma */
  const ESTILO = {
    joana: { corpo: 'armadura', main: 0x9097a0, metal: true, trim: 0xc9a24a, tabardo: 0xe6dcc6, capa: 0x22356e, cruz: true, cab: { m: 'elmo', f: 'donzela' }, arma: 'espada' },
    miguel: { corpo: 'armadura', main: 0xd6dae2, metal: true, trim: 0xc9a24a, tabardo: 0x1e3a7a, capa: 0xece6d8, cruz: true, cab: { m: 'elmoPluma', f: 'dama' }, arma: 'espadaEscudo' },
    franciscano: { corpo: 'veste', main: 0x5a4030, perna: 0x2c2420, trim: 0xd8ccb0, cordao: true, cab: { m: 'tonsura', f: 'veuFranciscano' }, arma: 'tau' },
    dominicano: { corpo: 'veste', main: 0xe2dccf, perna: 0x2c2420, trim: 0x15121a, cappa: 0x15121a, rosario: true, cab: { m: 'capuzBranco', f: 'veuDominicano' }, arma: 'orbe' },
    diocesano: { corpo: 'veste', mainM: 0x17141a, mainF: 0x3d4a5e, perna: 0x141214, trim: 0xf2eee4, estola: { m: 0x5a2a7a }, colarinho: true, cab: { m: 'cabeloCurto', f: 'corneta' }, arma: 'aspersorio' },
    dimas: { corpo: 'veste', mainM: 0x3a2a22, mainF: 0x6a1a1a, perna: 0x221a16, trim: 0xa08a60, cordao: true, cab: { m: 'capuzPenitente', f: 'madalena' }, arma: 'adaga' },
    cecilia: { corpo: 'veste', main: 0x2e4a7a, perna: 0x1e2430, trim: 0xc9a24a, cinto: true, cab: { m: 'cabeloCurto', f: 'coroaFlores' }, arma: 'lira' },
    bento: { corpo: 'veste', main: 0x141214, perna: 0x141214, trim: 0x2a2428, escapulario: true, medalha: true, cab: { m: 'capuzNegro', f: 'veuBeneditino' }, arma: 'cajado' },
    eremita: { corpo: 'veste', main: 0x7a6440, perna: 0x3a2e20, trim: 0x4a3a24, cordao: true, aljava: true, cab: { m: 'barbaLonga', f: 'lencoDeserto' }, arma: 'arco' },
    norte: { corpo: 'tunica', main: 0x5a3a24, perna: 0x2a2018, trim: 0x8a7a64, pele: 0x8a7a64, cab: { m: 'nortista', f: 'trancas' }, arma: 'machado' },
    mistico: { corpo: 'veste', mainM: 0x4a3222, mainF: 0x5a3a24, perna: 0x2a2018, trim: 0xd8ccb0, cordao: true, cappaF: 0xece4d4, luvas: { m: 0x2a1c16 }, cab: { m: 'capuchinho', f: 'veuCarmelita' }, arma: 'orbeVioleta' },
    cipriano: { corpo: 'veste', mainM: 0x17141a, mainF: 0x18141a, perna: 0x141214, trim: 0xc9a24a, sobrepeliz: { m: 0xf0ece2 }, estola: { m: 0x5a2a7a, f: 0x2a1a2e }, cab: { m: 'cabeloCurto', f: 'gemma' }, arma: 'crucifixo' }
  };
  OV.ESTILOS = ESTILO;

  OV.criarHeroi = function (sexo, ordem) {
    const f = sexo === 'f';
    const E = ESTILO[ordem] || ESTILO.joana;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const skin = sm(0xc79a7e, { roughness: 0.8 });
    const dark = sm(0x262022);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1210 });
    const flashMats = [];
    const sw = f ? 0.64 : 0.74;
    const corMain = E.main !== undefined ? E.main : (f ? E.mainF : E.mainM);
    const main = E.metal ? sm(corMain, { metalness: 0.65, roughness: 0.42 }) : sm(corMain);
    const trim = sm(E.trim, E.metal ? { metalness: 0.8, roughness: 0.35 } : {});
    const legMat = E.corpo === 'armadura' ? main : sm(E.perna);
    const armMat = main;
    flashMats.push(main);

    /* pernas */
    // coxa, canela e pé: a perna dobra no joelho e o pé acompanha o chão
    const legO = { coxa: 0.47, canela: 0.43, larg: 0.23, prof: 0.27, mat: legMat, matPe: dark, pe: [0.26, 0.09, 0.36] };
    const legL = OV.andar.perna(body, -0.16, 0.95, legO), legR = OV.andar.perna(body, 0.16, 0.95, legO);
    let saia = null;

    /* tronco */
    if (E.corpo === 'armadura') {
      const tabard = sm(E.tabardo), cape = sm(E.capa);
      body.add(mesh(new THREE.BoxGeometry(sw, 0.8, 0.42), main, 0, 1.4, 0));
      body.add(mesh(new THREE.BoxGeometry(sw + 0.06, 0.95, 0.46), tabard, 0, 1.22, 0));
      body.add(mesh(new THREE.BoxGeometry(0.1, 0.55, 0.02), trim, 0, 1.25, 0.24));
      body.add(mesh(new THREE.BoxGeometry(0.38, 0.1, 0.02), trim, 0, 1.38, 0.24));
      body.add(mesh(new THREE.BoxGeometry(sw + 0.08, 0.08, 0.48), dark, 0, 0.95, 0));
      const c = mesh(new THREE.BoxGeometry(sw - 0.04, 1.3, 0.05), cape, 0, 1.12, -0.27); c.rotation.x = 0.08; body.add(c);
      [-1, 1].forEach(s => body.add(mesh(new THREE.SphereGeometry(0.2, 6, 5), main, (sw / 2 + 0.06) * s, 1.78, 0)));
      flashMats.push(tabard);
    } else if (E.corpo === 'tunica') {
      const pele = sm(E.pele), couro = sm(0x3a2618);
      body.add(mesh(new THREE.BoxGeometry(sw, 0.85, 0.44), main, 0, 1.38, 0));
      body.add(mesh(new THREE.CylinderGeometry(0.34, 0.44, 0.55, 8), main, 0, 0.82, 0));
      body.add(mesh(new THREE.BoxGeometry(sw + 0.06, 0.1, 0.48), couro, 0, 1.0, 0));
      body.add(mesh(new THREE.BoxGeometry(0.14, 0.12, 0.04), trim, 0, 1.0, 0.25));
      [-1, 1].forEach(s => { const m = mesh(new THREE.SphereGeometry(0.24, 7, 5), pele, (sw / 2 + 0.02) * s, 1.8, -0.02); m.scale.set(1, 0.6, 1.1); body.add(m); });
      body.add(mesh(new THREE.BoxGeometry(sw - 0.1, 0.14, 0.5), pele, 0, 1.86, -0.04));
      const costas = mesh(new THREE.BoxGeometry(sw + 0.1, 1.1, 0.08), pele, 0, 1.3, -0.27); costas.rotation.x = 0.06; body.add(costas);
      flashMats.push(pele);
    } else {
      // o hábito: a parte de cima fica no corpo, a de baixo se abre com as passadas
      body.add(mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.74, 8), main, 0, 1.3, 0));
      saia = OV.andar.saia(body, main, 0.4, 0.5, 0.66, 0.98, 8); flashMats.push(saia.mat);
      body.add(mesh(new THREE.BoxGeometry(sw - 0.06, 0.6, 0.42), main, 0, 1.6, 0));
      [-1, 1].forEach(s => body.add(mesh(new THREE.SphereGeometry(0.17, 6, 5), main, (sw / 2) * s, 1.8, 0)));
      if (E.cordao) {
        const cord = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 5, 16), trim); cord.rotation.x = Math.PI / 2; cord.position.y = 1.32; body.add(cord);
        body.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 4), trim, 0.12, 0.98, 0.36));
        [0.85, 0.98, 1.11].forEach(y => body.add(mesh(new THREE.SphereGeometry(0.045, 5, 4), trim, 0.12, y, 0.36)));
      }
      if (E.cinto) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.04, 5, 16), trim); c.rotation.x = Math.PI / 2; c.position.y = 1.3; body.add(c); }
      if (E.cappa) {
        const cappa = sm(E.cappa);
        body.add(mesh(new THREE.BoxGeometry(sw + 0.06, 1.55, 0.05), cappa, 0, 1.08, -0.3));
        [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(0.16, 1.4, 0.05), cappa, (sw / 2 - 0.02) * s, 1.1, 0.25)));
      }
      if (E.cappaF && f) {
        const cappa = sm(E.cappaF);
        body.add(mesh(new THREE.BoxGeometry(sw + 0.1, 1.5, 0.05), cappa, 0, 1.1, -0.31));
        [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(0.14, 1.35, 0.05), cappa, (sw / 2) * s, 1.12, 0.24)));
      }
      if (E.rosario) { const ros = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 4, 14), sm(0x241a14)); ros.position.set(-0.2, 1.05, 0.33); body.add(ros); }
      if (E.escapulario) { body.add(mesh(new THREE.BoxGeometry(0.36, 1.35, 0.04), sm(0x0a0909), 0, 1.15, 0.24)); body.add(mesh(new THREE.BoxGeometry(0.36, 1.2, 0.04), sm(0x0a0909), 0, 1.2, -0.25)); }
      if (E.medalha) { const m = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10), sm(0xc9a24a, { metalness: 0.8, roughness: 0.3 }), 0, 1.62, 0.27); m.rotation.x = Math.PI / 2; body.add(m); }
      if (E.colarinho) body.add(mesh(new THREE.BoxGeometry(0.12, 0.06, 0.03), sm(0xf2eee4), 0, 1.86, 0.2));
      if (E.sobrepeliz && E.sobrepeliz[sexo]) {
        const sp = sm(E.sobrepeliz[sexo]);
        body.add(mesh(new THREE.CylinderGeometry(0.36, 0.48, 0.75, 8), sp, 0, 1.38, 0)); flashMats.push(sp);
      }
      if (E.estola && E.estola[sexo]) {
        const est = sm(E.estola[sexo]);
        [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(0.1, 1.15, 0.03), est, 0.11 * s, 1.3, 0.26)));
        if (sexo === 'm') [-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), sm(0xc9a24a), 0.11 * s, 0.82, 0.28)));
      }
      if (E.aljava) {
        const alj = mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.8, 7), sm(0x4a3220), 0.18, 1.5, -0.3); alj.rotation.z = -0.35; body.add(alj);
        [0, 1, 2].forEach(i => { const fl = mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), sm(0xe8e0cc), 0.32 + i * 0.03, 1.95 + i * 0.02, -0.3); fl.rotation.z = -0.35; body.add(fl); });
      }
    }

    /* cabeça */
    const headY = 2.04;
    const tipo = E.cab[sexo];
    const rosto = () => {
      body.add(mesh(new THREE.SphereGeometry(0.2, 9, 8), skin, 0, headY, 0.02));
      [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 5, 4), eyeMat); e.position.set(0.07 * s, headY + 0.02, 0.2); body.add(e); });
    };
    const cabelo = (cor, longo) => {
      const hm = sm(cor);
      const h = mesh(new THREE.SphereGeometry(0.225, 9, 8), hm, 0, headY + 0.05, -0.04); h.scale.set(1, 0.95, 1); body.add(h);
      if (longo) body.add(mesh(new THREE.BoxGeometry(0.42, longo, 0.16), hm, 0, headY - 0.06 - (longo - 0.16) / 2, -0.13));
      return hm;
    };
    const veu = (cor, faixa, peito) => {
      const v = sm(cor), b = sm(faixa);
      body.add(mesh(new THREE.SphereGeometry(0.245, 9, 8), v, 0, headY + 0.05, -0.06));
      body.add(mesh(new THREE.BoxGeometry(0.46, 0.62, 0.1), v, 0, headY - 0.26, -0.2));
      body.add(mesh(new THREE.BoxGeometry(0.38, 0.06, 0.06), b, 0, headY + 0.15, 0.13));
      body.add(mesh(new THREE.BoxGeometry(peito ? 0.34 : 0.3, peito ? 0.14 : 0.1, 0.07), b, 0, headY - 0.2, 0.12));
    };
    const circlet = cor => { const c = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.02, 4, 18), sm(cor, { metalness: 0.8, roughness: 0.3 })); c.rotation.x = Math.PI / 2; c.position.set(0, headY + 0.12, 0); body.add(c); };
    const barba = (cor, comp) => body.add(mesh(new THREE.BoxGeometry(0.26, comp, 0.14), sm(cor), 0, headY - 0.14 - comp / 2 + 0.06, 0.12));
    const capuz = (mat, alto) => {
      body.add(mesh(new THREE.SphereGeometry(0.26, 9, 8), mat, 0, headY + 0.06, -0.07));
      if (alto) body.add(mesh(new THREE.ConeGeometry(0.16, 0.3, 6), mat, 0, headY + 0.3, -0.14));
      body.add(mesh(new THREE.BoxGeometry(0.46, 0.3, 0.14), mat, 0, 1.86, -0.2));
    };
    if (tipo === 'elmo' || tipo === 'elmoPluma') {
      body.add(mesh(new THREE.CylinderGeometry(0.23, 0.25, 0.44, 8), main, 0, 2.05, 0));
      body.add(mesh(new THREE.BoxGeometry(0.3, 0.045, 0.02), dark, 0, 2.07, 0.245));
      body.add(mesh(new THREE.BoxGeometry(0.045, 0.2, 0.02), dark, 0, 2.0, 0.245));
      if (tipo === 'elmoPluma') { const pl = mesh(new THREE.BoxGeometry(0.06, 0.18, 0.46), sm(0xece6d8), 0, 2.38, -0.05); pl.rotation.x = -0.2; body.add(pl); }
      else body.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.32), trim, 0, 2.33, 0));
    } else {
      rosto();
      switch (tipo) {
        case 'donzela': { const hm = cabelo(0x3a2618); body.add(mesh(new THREE.BoxGeometry(0.42, 0.16, 0.2), hm, 0, headY - 0.06, -0.12)); circlet(0xc9a24a); break; }
        case 'dama': cabelo(0x5a3a1e, 0.6); circlet(0xe8e2d0); break;
        case 'tonsura': { const r = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 5, 16), sm(0x3a2618)); r.rotation.x = Math.PI / 2; r.position.set(0, headY + 0.08, 0); body.add(r); body.add(mesh(new THREE.BoxGeometry(0.44, 0.22, 0.2), main, 0, 1.9, -0.22)); break; }
        case 'veuFranciscano': veu(0x16110f, 0xece4d4, false); break;
        case 'veuDominicano': veu(0x16110f, 0xece4d4, true); break;
        case 'veuBeneditino': veu(0x0c0a0a, 0xf2eee4, true); break;
        case 'veuCarmelita': veu(0x0c0a0a, 0xf2eee4, true); break;
        case 'capuzBranco': capuz(main); break;
        case 'capuzNegro': capuz(sm(0x0c0a0a)); break;
        case 'capuzPenitente': capuz(main, true); break;
        case 'cabeloCurto': cabelo(0x2a1c14); break;
        case 'corneta': {
          const br = sm(0xf6f2ea); body.add(mesh(new THREE.SphereGeometry(0.235, 9, 8), br, 0, headY + 0.06, -0.05));
          [-1, 1].forEach(s => { const a = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.34), br, 0.26 * s, headY + 0.24, 0); a.rotation.z = 0.45 * s; body.add(a); });
          body.add(mesh(new THREE.BoxGeometry(0.34, 0.12, 0.06), br, 0, headY - 0.2, 0.13));
          break;
        }
        case 'madalena': cabelo(0x5a2a14, 0.78); break;
        case 'coroaFlores': {
          cabelo(0x6a4422, 0.7);
          for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; body.add(mesh(new THREE.SphereGeometry(0.045, 5, 4), sm(i % 2 ? 0xf2ece0 : 0xb0283a), Math.cos(a) * 0.205, headY + 0.13, Math.sin(a) * 0.205)); }
          break;
        }
        case 'barbaLonga': body.add(mesh(new THREE.SphereGeometry(0.205, 9, 8), sm(0x9a9488), 0, headY + 0.0, -0.06)); barba(0x9a9488, 0.42); break;
        case 'lencoDeserto': veu(0x8a7450, 0x8a7450, false); break;
        case 'nortista': cabelo(0xc8a060, 0.3); barba(0xc8a060, 0.24); break;
        case 'trancas': { const hm = cabelo(0xd0aa68); [-1, 1].forEach(s => body.add(mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.7, 6), hm, 0.17 * s, headY - 0.42, 0.06))); break; }
        case 'capuchinho': capuz(main); barba(0x6a5a4a, 0.22); break;
        case 'gemma': { cabelo(0x1e1410, 0.36); body.add(mesh(new THREE.SphereGeometry(0.24, 9, 8), sm(0x0c0a0a), 0, headY + 0.1, -0.1)); break; }
      }
    }

    /* braços */
    const handMat = E.luvas && E.luvas[sexo] ? sm(E.luvas[sexo]) : skin;
    const arm = x => {
      const p = new THREE.Group(); p.position.set(x, 1.72, 0);
      if (E.corpo === 'armadura') {
        p.add(mesh(new THREE.BoxGeometry(0.17, 0.72, 0.19), armMat, 0, -0.36, 0));
        p.add(mesh(new THREE.BoxGeometry(0.19, 0.16, 0.21), dark, 0, -0.78, 0));
      } else if (E.corpo === 'tunica') {
        p.add(mesh(new THREE.BoxGeometry(0.2, 0.4, 0.22), armMat, 0, -0.2, 0));
        p.add(mesh(new THREE.BoxGeometry(0.17, 0.36, 0.19), skin, 0, -0.56, 0));
        p.add(mesh(new THREE.BoxGeometry(0.19, 0.14, 0.21), sm(0x3a2618), 0, -0.72, 0));
      } else {
        p.add(mesh(new THREE.BoxGeometry(0.22, 0.7, 0.24), armMat, 0, -0.35, 0));
        p.add(mesh(new THREE.SphereGeometry(0.075, 6, 5), handMat, 0, -0.78, 0));
      }
      body.add(p); return p;
    };
    const armL = arm(-(sw / 2 + 0.1)), armR = arm(sw / 2 + 0.1);

    /* armas */
    let orb = null;
    const madeira = sm(0x6b4a2e), aco = sm(0xc8ced6, { metalness: 0.9, roughness: 0.25 }), ouro = sm(0xc9a24a, { metalness: 0.8, roughness: 0.3 });
    const orbe = (cor, brilho, mao, y) => {
      const s = new THREE.Group(); s.position.set(0, y || -0.82, 0.08);
      orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: cor }));
      orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: brilho, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })));
      s.add(orb); (mao || armR).add(s);
    };
    const livro = (cor) => {
      const b = new THREE.Group(); b.position.set(0, -0.82, 0.1);
      b.add(mesh(new THREE.BoxGeometry(0.26, 0.06, 0.32), sm(cor), 0, 0, 0));
      b.add(mesh(new THREE.BoxGeometry(0.24, 0.065, 0.28), sm(0xe8dcc0), 0.01, 0, 0));
      armL.add(b);
    };
    const espada = () => {
      const s = new THREE.Group(); s.position.set(0, -0.8, 0.05); s.rotation.x = Math.PI / 2;
      s.add(mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), dark, 0, 0, 0));
      s.add(mesh(new THREE.SphereGeometry(0.05, 5, 4), trim, 0, -0.13, 0));
      s.add(mesh(new THREE.BoxGeometry(0.36, 0.05, 0.07), trim, 0, 0.12, 0));
      s.add(mesh(new THREE.BoxGeometry(0.07, 1.15, 0.02), aco, 0, 0.72, 0));
      armR.add(s);
    };
    switch (E.arma) {
      case 'espada': espada(); break;
      case 'espadaEscudo': {
        espada();
        const e = new THREE.Group(); e.position.set(-0.08, -0.5, 0.1); e.rotation.y = -0.2;
        const esc = mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 14), sm(0x1e3a7a), 0, 0, 0); esc.rotation.z = Math.PI / 2; e.add(esc);
        const borda = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 5, 18), ouro); borda.rotation.y = Math.PI / 2; e.add(borda);
        e.add(mesh(new THREE.BoxGeometry(0.02, 0.46, 0.08), ouro, -0.04, 0, 0)); e.add(mesh(new THREE.BoxGeometry(0.02, 0.08, 0.36), ouro, -0.04, 0.06, 0));
        e.rotation.y = Math.PI / 2; armL.add(e);
        break;
      }
      case 'tau': {
        const s = new THREE.Group(); s.position.set(0, -0.8, 0.06); s.rotation.x = 0.25;
        s.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.0, 6), madeira, 0, 0.35, 0));
        s.add(mesh(new THREE.BoxGeometry(0.4, 0.07, 0.07), madeira, 0, 1.32, 0));
        armR.add(s); break;
      }
      case 'cajado': {
        const s = new THREE.Group(); s.position.set(0, -0.8, 0.06); s.rotation.x = 0.25;
        s.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.1, 6), sm(0x3a2618), 0, 0.3, 0));
        s.add(mesh(new THREE.SphereGeometry(0.06, 6, 5), ouro, 0, 1.36, 0));
        armR.add(s); break;
      }
      case 'orbe': orbe(0xffe2a0, 0xffc860); livro(0x5c1416); break;
      case 'orbeVioleta': orbe(0xf4e6ff, 0xa86aff); { const t = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.016, 4, 12), sm(0x241a14)); t.position.set(0, -0.82, 0.1); armL.add(t); } break;
      case 'aspersorio': {
        const s = new THREE.Group(); s.position.set(0, -0.8, 0.06); s.rotation.x = Math.PI / 2;
        s.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.6, 6), madeira, 0, 0.22, 0));
        s.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), aco, 0, 0.58, 0));
        armR.add(s);
        if (!f) livro(0x2a1a3a);
        break;
      }
      case 'adaga': {
        const s = new THREE.Group(); s.position.set(0, -0.8, 0.05); s.rotation.x = Math.PI / 2;
        s.add(mesh(new THREE.BoxGeometry(0.045, 0.16, 0.045), dark, 0, 0, 0));
        s.add(mesh(new THREE.BoxGeometry(0.18, 0.04, 0.05), trim, 0, 0.09, 0));
        s.add(mesh(new THREE.BoxGeometry(0.06, 0.42, 0.015), aco, 0, 0.32, 0));
        armR.add(s);
        const s2 = s.clone(); armL.add(s2);
        break;
      }
      case 'lira': {
        orbe(0xdcefff, 0x6aa8ff);
        const l = new THREE.Group(); l.position.set(0, -0.78, 0.14);
        [-1, 1].forEach(sx => { const b = mesh(new THREE.BoxGeometry(0.04, 0.42, 0.04), ouro, 0.11 * sx, 0.12, 0); b.rotation.z = -0.15 * sx; l.add(b); });
        l.add(mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), ouro, 0, 0.33, 0)); l.add(mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), ouro, 0, -0.08, 0));
        for (let i = -1; i <= 1; i++) l.add(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.38, 0.008), new THREE.MeshBasicMaterial({ color: 0xf2ece0 })).translateX(i * 0.05).translateY(0.13));
        armL.add(l); break;
      }
      case 'arco': {
        const a = new THREE.Group(); a.position.set(0, -0.8, 0.12); a.rotation.y = Math.PI / 2;
        const curva = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 4, 18, Math.PI * 0.9), madeira); curva.rotation.z = Math.PI / 2 + Math.PI * 0.05; curva.position.x = -0.2; a.add(curva);
        const corda = new THREE.Mesh(new THREE.BoxGeometry(0.006, 1.2, 0.006), new THREE.MeshBasicMaterial({ color: 0xe8e0cc })); corda.position.x = -0.18; a.add(corda);
        armL.add(a);
        orbe(0xfff4d0, 0xffe0a0, armL, -0.8); orb.visible = false;
        break;
      }
      case 'machado': {
        const s = new THREE.Group(); s.position.set(0, -0.8, 0.05); s.rotation.x = Math.PI / 2;
        s.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.5, 6), madeira, 0, 0.45, 0));
        const lam = mesh(new THREE.BoxGeometry(0.04, 0.42, 0.36), aco, 0, 1.08, 0.16); s.add(lam);
        s.add(mesh(new THREE.BoxGeometry(0.06, 0.12, 0.12), dark, 0, 1.08, -0.02));
        armR.add(s); break;
      }
      case 'crucifixo': {
        const c = new THREE.Group(); c.position.set(0, -0.86, 0.1);
        c.add(mesh(new THREE.BoxGeometry(0.05, 0.42, 0.04), ouro, 0, 0.12, 0)); c.add(mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), ouro, 0, 0.2, 0));
        armR.add(c);
        orbe(0xfff0d8, 0xff6a3a, armR, -0.6); orb.scale.setScalar(0.6);
        livro(0x6a1418);
        break;
      }
    }

    /* auréola do Recolhimento */
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, fog: false }));
    halo.rotation.x = Math.PI / 2; halo.position.y = 2.55; body.add(halo);

    /* cruz luminosa do Sinal da Cruz */
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const cross = new THREE.Group(); cross.position.set(0, 1.5, 0.75);
    cross.add(new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1.0), crossMat));
    const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.14), crossMat); ch.position.y = 0.18; cross.add(ch);
    body.add(cross);

    return { g, body, legL, legR, saia, pernas: { L: legL, R: legR, saia }, marcha: OV.andar.estado(), armL, armR, halo, cross, crossMat, orb, mats: flashMats };
  };
})(window.OV);

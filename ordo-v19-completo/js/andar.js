/* Ordo Virtutum — o andar de todos: pernas de dois segmentos (coxa, canela e pé), saias e hábitos que se abrem com o passo,
   e ciclos de marcha calculados pela distância realmente percorrida (assim os pés não deslizam no chão). */
(function (OV) {
  'use strict';
  const sm = OV.sm, mesh = OV.mesh;
  const AN = {}; OV.andar = AN;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---- peças ---- */
  // uma perna com pivô no quadril; o joelho e o tornozelo são grupos filhos, para dobrar
  AN.perna = function (pai, x, y, o) {
    const coxa = o.coxa, canela = o.canela, w = o.larg || 0.2, d = o.prof || w * 1.1;
    const hip = new THREE.Group(); hip.position.set(x, y, o.z || 0);
    hip.add(mesh(new THREE.BoxGeometry(w, coxa + 0.04, d), o.mat, 0, -coxa / 2, 0));
    const joelho = new THREE.Group(); joelho.position.set(0, -coxa, 0); hip.add(joelho);
    joelho.add(mesh(new THREE.BoxGeometry(w * 0.88, canela + 0.04, d * 0.9), o.matCanela || o.mat, 0, -canela / 2, 0));
    const pe = new THREE.Group(); pe.position.set(0, -canela, 0); joelho.add(pe);
    if (o.pe !== false) {
      const [pw, ph, pd] = o.pe || [w * 1.08, 0.09, d * 1.35];
      pe.add(mesh(new THREE.BoxGeometry(pw, ph, pd), o.matPe || o.mat, 0, -ph / 2 + 0.01, pd * 0.2));
    }
    hip.joelho = joelho; hip.pe = pe;
    pai.add(hip); return hip;
  };
  // par de pernas
  AN.pernas = function (pai, sep, y, o) { return { L: AN.perna(pai, -sep, y, o), R: AN.perna(pai, sep, y, o) }; };
  // a parte de baixo de um hábito, cortada em duas metades que acompanham as coxas
  AN.saia = function (pai, mat, rTop, rBot, h, y, segs) {
    const m = mat.clone(); m.side = THREE.DoubleSide;
    const metade = (t0) => {
      const p = new THREE.Group(); p.position.set(0, y, 0);
      const s = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs || 8, 1, true, t0, Math.PI), m);
      s.position.y = -h / 2; s.castShadow = true; s.receiveShadow = true; p.add(s); pai.add(p); return p;
    };
    return { L: metade(Math.PI), R: metade(0), mat: m };
  };

  /* ---- o ciclo ---- */
  // avança a fase pela distância andada; a amplitude acompanha a velocidade (passos curtos ao começar, largos ao correr)
  AN.ciclo = function (st, dist, dt, passada, velRef) {
    if (!(dist < 3)) dist = 0; // teleporte não conta como passo
    const v = dt > 0 ? dist / dt : 0;
    const alvo = clamp(v / (velRef || 4), 0, 1.7);
    st.amp += (alvo - st.amp) * (1 - Math.exp(-(alvo > st.amp ? 8 : 6) * dt));
    st.ph += dist / Math.max(0.2, passada) * Math.PI;
    if (st.amp < 0.03) { st.ph += (Math.round(st.ph / Math.PI) * Math.PI - st.ph) * Math.min(1, dt * 4); } // ao parar, os pés se juntam
    st.v = v;
    return st;
  };
  AN.estado = () => ({ ph: 0, amp: 0, v: 0 });

  /* ---- poses ---- */
  // alvos de um bípede para a fase e a amplitude (corrida > 1 dá passos mais altos e o corpo inclinado)
  AN.alvos = function (ph, amp, o) {
    o = o || {};
    const a = Math.min(amp, 1.7), corrida = clamp((a - 1) / 0.6, 0, 1);
    const A = (o.A || 0.42) * Math.min(a, 1) * (1 + 0.55 * corrida);
    const K = (o.K || 0.75) * Math.min(a, 1) * (1 + 0.8 * corrida);
    const r = {};
    [['L', ph], ['R', ph + Math.PI]].forEach(([k, f]) => {
      const hip = -A * Math.sin(f);
      const knee = K * Math.max(0, Math.cos(f)) + 0.06 * Math.min(a, 1) + (o.agachado || 0);
      r['h' + k] = hip; r['k' + k] = knee; r['f' + k] = -(hip + knee) * 0.65 + (Math.cos(f) < 0 ? -0.18 * Math.min(a, 1) * Math.max(0, -Math.sin(f)) : 0);
    });
    // o corpo sobe no meio do passo e desce quando as pernas se abrem
    r.bob = (0.5 - Math.abs(Math.sin(ph))) * (o.bob || 0.07) * Math.min(a, 1.2) * (1 + corrida);
    r.lean = (o.lean || 0.16) * corrida;
    r.sway = Math.sin(ph) * 0.035 * Math.min(a, 1);
    r.braco = Math.sin(ph) * (0.5 + 0.4 * corrida) * Math.min(a, 1.2);
    r.corrida = corrida;
    return r;
  };
  AN.aplicar = function (p, r, k) {
    const set = (o, v) => { if (!o) return; o.rotation.x = k === undefined ? v : o.rotation.x + (v - o.rotation.x) * k; };
    set(p.L, r.hL); set(p.L.joelho, r.kL); set(p.L.pe, r.fL);
    set(p.R, r.hR); set(p.R.joelho, r.kR); set(p.R.pe, r.fR);
    if (p.saia) { set(p.saia.L, (p.L.rotation.x) * 0.5); set(p.saia.R, (p.R.rotation.x) * 0.5); }
  };
  // atalho: põe um bípede na pose da marcha e devolve o balanço vertical
  AN.bipede = function (p, ph, amp, o) { const r = AN.alvos(ph, amp, o); AN.aplicar(p, r); return r; };
  // quatro patas em diagonal (como o lobo trota): dianteira esquerda com traseira direita
  AN.quadrupede = function (pernas, ph, amp, o) {
    o = o || {};
    const a = Math.min(amp, 1.7), A = (o.A || 0.55) * Math.min(a, 1.2), K = (o.K || 0.7) * Math.min(a, 1.2);
    pernas.forEach((pp, i) => {
      const f = ph + ((i === 0 || i === 3) ? 0 : Math.PI);
      const tras = i >= 2;
      pp.rotation.x = -A * Math.sin(f);
      if (pp.joelho) pp.joelho.rotation.x = (tras ? -1 : 1) * K * Math.max(0, Math.cos(f));
    });
    return (0.5 - Math.abs(Math.sin(ph))) * 0.05 * Math.min(a, 1.4);
  };
  // seis patas em tripé (escaravelhos)
  AN.hexapode = function (pernas, ph, amp) {
    const a = Math.min(amp, 1.5);
    pernas.forEach((p, i) => { const f = ph + (i % 2 === (Math.floor(i / 2) % 2) ? 0 : Math.PI); p.rotation.y = Math.sin(f) * 0.45 * a; p.rotation.x = Math.max(0, Math.cos(f)) * -0.35 * a; });
    return Math.abs(Math.sin(ph * 2)) * 0.02 * a;
  };
})(window.OV);

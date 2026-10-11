/* Ordo Virtutum — os lugares das aventuras longe das vilas (masmorras, acampamentos, baús, guildas).
   Fica aqui, carregado cedo, para as árvores e as pedras não nascerem em cima deles. Coordenadas do mundo. */
(function (OV) {
  'use strict';
  const M = OV.mundo; if (!M || M.falhou) return;
  const L = {
    /* ---- Vale de Santa Sabina ---- */
    priorado: { x: -80, z: -125, r: 44, rot: 0, regiao: 'vale' },          // masmorra: as Ruínas do Priorado Esquecido
    simao: { x: -66, z: -83, r: 5, regiao: 'vale' },
    carvoaria: { x: 40, z: -150, r: 12, regiao: 'vale' },
    clotilde: { x: 152, z: 38, r: 9, regiao: 'vale' },
    benedita: { x: -160, z: -30, r: 11, regiao: 'vale' },
    tadeu: { x: 32, z: 126, r: 5, regiao: 'vale' },
    /* ---- Portos do Festim ---- */
    gruta: { x: -100, z: 600, r: 44, rot: Math.PI / 2, regiao: 'porto' },  // masmorra: a Gruta dos Contrabandistas
    cosme: { x: -58, z: 606, r: 5, regiao: 'porto' },
    dulce: { x: 96, z: 588, r: 10, regiao: 'porto' },
    bento: { x: -62, z: 735, r: 7, regiao: 'porto' },
    simplicio: { x: 48, z: 722, r: 5, regiao: 'porto' },
    /* ---- Minas de Mamom ---- */
    pocos: { x: -1012, z: 122, r: 44, rot: Math.PI, regiao: 'minas' },    // masmorra: a Mina dos Sete Poços
    leandro: { x: -1000, z: 72, r: 5, regiao: 'minas' },
    aurelio: { x: -790, z: 40, r: 9, regiao: 'minas' },
    teodora: { x: -938, z: 132, r: 7, regiao: 'minas' },
    fonte: { x: -850, z: 148, r: 6, regiao: 'minas' },
    lucas: { x: -948, z: 98, r: 5, regiao: 'minas' },
    /* ---- Corte das Máscaras ---- */
    mausoleu: { x: -100, z: -1020, r: 44, rot: 0, regiao: 'corte' },      // masmorra: o Mausoléu dos Duques
    ludovico: { x: -86, z: -978, r: 5, regiao: 'corte' },
    lucio: { x: 130, z: -815, r: 8, regiao: 'corte' },
    monica: { x: -34, z: -828, r: 5, regiao: 'corte' },
    gaudencio: { x: 42, z: -790, r: 5, regiao: 'corte' },
    /* ---- Vila dos Muros (Ato V) ---- */
    cisterna: { x: -110, z: -1920, r: 44, rot: 0, regiao: 'muros' },     // masmorra: a Cisterna dos Rancores
    noe: { x: -96, z: -1876, r: 5, regiao: 'muros' },
    benedito: { x: 112, z: -1706, r: 6, regiao: 'muros' },
    /* ---- Marca Ardente (Ato VI) ---- */
    calabouco: { x: -780, z: -800, r: 44, rot: 0, regiao: 'marca' },     // masmorra: o Calabouço Velho de Rocaforte
    damiao: { x: -766, z: -757, r: 5, regiao: 'marca' },
    camilo: { x: -858, z: -842, r: 6, regiao: 'marca' },
    teobaldo: { x: -945, z: -830, r: 7, regiao: 'marca' }
  };
  // os baús espalhados por cada região
  const BAUS = {
    vale: [[-150, -110], [80, -165], [165, -30], [165, 70], [-95, 150], [5, -176]],
    porto: [[-128, 566], [125, 570], [128, 700], [-128, 690], [73, 617.5], [-30, 598]],
    minas: [[-1050, -140], [-760, -150], [-760, 100], [-1050, 40], [-900, 155], [-985, -62]],
    corte: [[150, -1040], [-150, -1045], [150, -752], [-150, -752], [155, -905], [-155, -905]],
    muros: [[-150, -1700], [150, -1690], [-150, -1840], [150, -1890], [-60, -1950], [80, -1940]],
    marca: [[-1050, -780], [-750, -1030], [-1050, -1030], [-760, -860], [-980, -1050], [-830, -760]],
    monte: [[-1940, 120], [-1660, 110], [-1930, -20], [-1670, -60], [-1860, -140], [-1720, -140]]
  };
  // as coisas a colher e a achar nas missões novas
  const ACHADOS = {
    cordeiros: [[-125, -95], [-40, -160], [-170, 25]],
    salvia: [[135, -20], [160, 10], [146, 80], [128, 98]],
    camomila: [[-75, 570], [-45, 580], [-20, 566]],
    rede: [[-125, 745]],
    canario: [[-800, -130]],
    alaude: [[115, -1035]],
    lirios: [[-140, -860], [-125, -790], [-150, -770], [-98, -768]],
    cartas: [[-9, -1736], [9, -1708], [-12, -1806], [12, -1796]],
    lancadeira: [[132, -1782]],
    ervas: [[-960, -910], [-840, -915], [-930, -995], [-865, -1000]],
    espadas: [[-945, -910], [-850, -970], [-915, -985]],
    ovelha: [[-1872, -48]],
    icone: [[-1702, -40]]
  };
  M.AVENTURA = { LUGARES: L, BAUS, ACHADOS };
  const reservas = [];
  for (const k in L) reservas.push([L[k].x, L[k].z, L[k].r]);
  for (const k in BAUS) BAUS[k].forEach(([x, z]) => reservas.push([x, z, 3.2]));
  for (const k in ACHADOS) ACHADOS[k].forEach(([x, z]) => reservas.push([x, z, 2.4]));
  // a Casa do Peregrino de cada região (e, na vila, a banca da santeira)
  (M.CASAS_PEREGRINO || []).forEach(([rg, x, z]) => reservas.push([x, z, rg === 'vale' ? 11 : 9]));
  M.RESERVAS = reservas;
  M.reservado = (x, z, m) => { m = m || 0; for (const [a, b, r] of reservas) if (Math.abs(x - a) < r + m && Math.abs(z - b) < r + m && Math.hypot(x - a, z - b) < r + m) return true; return false; };
})(window.OV);

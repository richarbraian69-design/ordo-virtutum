/* Ordo Virtutum — dados do jogo: virtudes, ordens, armas, orações, pecados */
window.OV = window.OV || {};
(function (OV) {
  'use strict';

  const U = {};
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rnd = (a, b) => a + Math.random() * (b - a);
  U.angWrap = a => { if (!isFinite(a)) return 0; while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  U.turnTo = (a, b, s) => { const d = U.angWrap(b - a); return a + U.clamp(d, -s, s); };
  U.dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  OV.util = U;

  OV.VIRTUDES = [
    { k: 'prudencia', nome: 'Prudência', tipo: 'Cardeais' },
    { k: 'justica', nome: 'Justiça', tipo: 'Cardeais' },
    { k: 'fortaleza', nome: 'Fortaleza', tipo: 'Cardeais' },
    { k: 'temperanca', nome: 'Temperança', tipo: 'Cardeais' },
    { k: 'fe', nome: 'Fé', tipo: 'Teologais' },
    { k: 'esperanca', nome: 'Esperança', tipo: 'Teologais' },
    { k: 'caridade', nome: 'Caridade', tipo: 'Teologais' }
  ];
  OV.MAX_VIRTUDE = 20;
  OV.NIVEL_MAX = 20;
  OV.xpParaProximo = n => Math.round(175 * Math.pow(n, 1.42)); // cada nível pede bem mais que o anterior (v18: subir ficou mais difícil)

  OV.ORDENS = {
    joana: {
      id: 'joana', classe: 'Guerreiro', arma: 'espada',
      ordem: { m: "Cavaleiros de Santa Joana d'Arc", f: "Cavaleiras de Santa Joana d'Arc" },
      titulo: { m: 'Cavaleiro', f: 'Cavaleira' },
      patrono: { m: "Santa Joana d'Arc", f: "Santa Joana d'Arc" },
      papel: 'Corpo a corpo, linha de frente',
      armaNome: 'Espada longa',
      descr: "Lutam na linha de frente sob o estandarte da donzela de Orléans. Aguentam golpes e respondem com força.",
      virt: { prudencia: 3, justica: 5, fortaleza: 6, temperanca: 4, fe: 3, esperanca: 3, caridade: 2 },
      habil: ['Estandarte de Orléans', 'Investida', 'Voz do Céu (passiva)']
    },
    franciscano: {
      id: 'franciscano', classe: 'Druida', arma: 'cajado',
      ordem: { m: 'Irmãos Menores (Franciscanos)', f: 'Irmãs Franciscanas (Ordem Terceira)' },
      titulo: { m: 'Frei franciscano', f: 'Irmã franciscana' },
      patrono: { m: 'São Francisco de Assis', f: 'Santa Clara de Assis' },
      papel: 'Natureza, animais e cura',
      armaNome: 'Cajado do Tau',
      descr: 'Pobres e alegres, caminham com as criaturas. O cajado é rápido e alcança longe, e as orações de cura rendem mais.',
      virt: { prudencia: 3, justica: 3, fortaleza: 4, temperanca: 4, fe: 4, esperanca: 4, caridade: 6 },
      habil: ['Irmão Lobo', 'Cântico das Criaturas', 'Paz das criaturas (passiva)']
    },
    dominicano: {
      id: 'dominicano', classe: 'Mago', arma: 'pregacao',
      ordem: { m: 'Frades Pregadores (Dominicanos)', f: 'Irmãs Dominicanas' },
      titulo: { m: 'Frei pregador', f: 'Irmã dominicana' },
      patrono: { m: 'Santo Tomás de Aquino', f: 'Santa Catarina de Sena' },
      papel: 'Dano à distância',
      armaNome: 'Pregação: luz lançada de longe',
      descr: 'Combatem com a Verdade: palavras de luz lançadas à distância. Frágeis de perto, certeiros de longe.',
      virt: { prudencia: 6, justica: 4, fortaleza: 3, temperanca: 3, fe: 5, esperanca: 3, caridade: 2 }
    },
    diocesano: {
      id: 'diocesano', classe: 'Clérigo', arma: 'aspersorio',
      ordem: { m: 'Clero diocesano', f: 'Filhas da Caridade (Irmãs hospitaleiras)' },
      titulo: { m: 'Sacerdote', f: 'Irmã hospitaleira' },
      patrono: { m: "Santo Cura d'Ars", f: 'Santa Luísa de Marillac' },
      papel: 'Cura e suporte',
      armaNome: 'Aspersório de prata',
      descr: 'Pastores e enfermeiras das almas. Curam muito, purificam os vícios e aguentam a luta com paciência.',
      virt: { prudencia: 4, justica: 3, fortaleza: 4, temperanca: 3, fe: 5, esperanca: 3, caridade: 6 }
    },
    miguel: {
      id: 'miguel', classe: 'Paladino', arma: 'espada',
      ordem: { m: 'Cavaleiros de São Miguel', f: 'Damas de São Miguel' },
      titulo: { m: 'Cavaleiro de São Miguel', f: 'Dama de São Miguel' },
      patrono: { m: 'São Miguel Arcanjo', f: 'São Miguel Arcanjo' },
      papel: 'Espada, escudo e luz',
      armaNome: 'Espada e escudo do Arcanjo',
      descr: '"Quem como Deus?" Juntam a espada à luz do céu. Ferem mais os demônios e devolvem os golpes que aparam.',
      virt: { prudencia: 3, justica: 6, fortaleza: 5, temperanca: 4, fe: 4, esperanca: 2, caridade: 2 }
    },
    dimas: {
      id: 'dimas', classe: 'Ladino', arma: 'adaga',
      ordem: { m: 'Penitentes de São Dimas', f: 'Penitentes de Santa Maria Madalena' },
      titulo: { m: 'Penitente de São Dimas', f: 'Penitente de Santa Maria Madalena' },
      patrono: { m: 'São Dimas, o Bom Ladrão', f: 'Santa Maria Madalena' },
      papel: 'Furtividade e golpes críticos',
      armaNome: 'Adaga curta',
      descr: 'Pecadores arrependidos que conhecem as sombras por dentro. Rápidos, somem da vista e golpeiam onde dói.',
      virt: { prudencia: 6, justica: 5, fortaleza: 3, temperanca: 5, fe: 3, esperanca: 3, caridade: 2 }
    },
    cecilia: {
      id: 'cecilia', classe: 'Bardo', arma: 'cantico',
      ordem: { m: 'Irmãos de Santa Cecília', f: 'Irmãs de Santa Cecília' },
      titulo: { m: 'Irmão de Santa Cecília', f: 'Irmã de Santa Cecília' },
      patrono: { m: 'Santa Cecília', f: 'Santa Cecília' },
      papel: 'Suporte por cantos',
      armaNome: 'Lira e notas de luz',
      descr: 'Quem canta reza duas vezes. Lançam notas de luz, sustentam o fôlego e purificam os vícios com hinos.',
      virt: { prudencia: 4, justica: 3, fortaleza: 3, temperanca: 4, fe: 4, esperanca: 6, caridade: 3 }
    },
    bento: {
      id: 'bento', classe: 'Monge', arma: 'cajado',
      ordem: { m: 'Beneditinos', f: 'Beneditinas' },
      titulo: { m: 'Monge beneditino', f: 'Monja beneditina' },
      patrono: { m: 'São Bento', f: 'Santa Escolástica' },
      papel: 'Mãos firmes e cajado',
      armaNome: 'Cajado e medalha de São Bento',
      descr: 'Ora et labora. Alternam a postura de oração e de trabalho, e a medalha de São Bento afasta os demônios.',
      virt: { prudencia: 4, justica: 3, fortaleza: 4, temperanca: 6, fe: 4, esperanca: 3, caridade: 3 }
    },
    eremita: {
      id: 'eremita', classe: 'Patrulheiro', arma: 'arco',
      ordem: { m: 'Eremitas do Deserto', f: 'Eremitas do Deserto' },
      titulo: { m: 'Eremita do deserto', f: 'Eremita do deserto' },
      patrono: { m: 'Santo Antão', f: 'Santa Sinclética' },
      papel: 'Arco e discernimento',
      armaNome: 'Arco do deserto',
      descr: 'Vigiam no silêncio e enxergam o inimigo antes de serem vistos. Atiram flechas abençoadas de muito longe.',
      virt: { prudencia: 6, justica: 4, fortaleza: 3, temperanca: 5, fe: 4, esperanca: 3, caridade: 2 }
    },
    norte: {
      id: 'norte', classe: 'Bárbaro', arma: 'machado',
      ordem: { m: 'Convertidos do Norte', f: 'Convertidas do Norte' },
      titulo: { m: 'Convertido do Norte', f: 'Convertida do Norte' },
      patrono: { m: 'Santo Olavo e São Cristóvão', f: 'Santa Olga de Kiev' },
      papel: 'Dano pesado e resistência',
      armaNome: 'Machado de duas mãos',
      descr: 'Guerreiros do norte batizados no fogo. Golpes lentos e devastadores, e um corpo que não cede.',
      virt: { prudencia: 2, justica: 4, fortaleza: 7, temperanca: 5, fe: 3, esperanca: 3, caridade: 3 }
    },
    mistico: {
      id: 'mistico', classe: 'Feiticeiro', arma: 'luz',
      ordem: { m: 'Místicos', f: 'Místicas' },
      titulo: { m: 'Místico', f: 'Mística' },
      patrono: { m: 'São Pio de Pietrelcina', f: "Santa Teresa d'Ávila" },
      papel: 'Dons extraordinários',
      armaNome: 'Luz da oração',
      descr: 'Almas de oração profunda que recebem dons raros: bilocação, êxtase, leitura das almas. A Fé é a sua força.',
      virt: { prudencia: 4, justica: 3, fortaleza: 3, temperanca: 3, fe: 7, esperanca: 4, caridade: 3 }
    },
    cipriano: {
      id: 'cipriano', classe: 'Bruxo', arma: 'crucifixo',
      ordem: { m: 'Exorcistas de São Cipriano', f: 'Penitentes de Santa Gemma' },
      titulo: { m: 'Exorcista de São Cipriano', f: 'Penitente de Santa Gemma' },
      patrono: { m: 'São Cipriano de Antioquia', f: 'Santa Gemma Galgani' },
      papel: 'Controle de demônios',
      armaNome: 'Crucifixo e Ritual',
      descr: 'Como Cipriano, o antigo feiticeiro convertido, conhecem o inimigo pelo nome. Prendem, ferem e libertam.',
      virt: { prudencia: 4, justica: 4, fortaleza: 3, temperanca: 3, fe: 7, esperanca: 3, caridade: 3 }
    }
  };

  OV.ARMAS = {
    espada: { tempo: 0.5, pesado: 0.85, alcance: 2.3, arco: 1.15, folego: 14, dano: v => 10 + v.justica * 3 },
    cajado: { tempo: 0.38, pesado: 0.8, alcance: 2.7, arco: 1.6, folego: 10, dano: v => 6 + Math.round(v.justica * 2.5) },
    pregacao: { tempo: 0.45, pesado: 0.9, alcance: 16, arco: 0.6, folego: 12, dano: v => 6 + Math.round(v.justica * 1.5 + v.prudencia * 1.5), projetil: true },
    aspersorio: { tempo: 0.46, pesado: 0.85, alcance: 2.2, arco: 1.3, folego: 12, dano: v => 7 + Math.round(v.justica * 2 + v.caridade * 1.5) },
    adaga: { tempo: 0.3, pesado: 0.62, alcance: 1.9, arco: 1.0, folego: 8, dano: v => 5 + Math.round(v.justica * 2 + v.prudencia * 1.2) },
    machado: { tempo: 0.68, pesado: 1.05, alcance: 2.6, arco: 1.5, folego: 18, dano: v => 13 + Math.round(v.justica * 2.5 + v.fortaleza * 1.5) },
    cantico: { tempo: 0.42, pesado: 0.85, alcance: 13, arco: 0.6, folego: 11, dano: v => 5 + Math.round(v.esperanca * 1.6 + v.fe * 1.2), projetil: true, cor: 0xdcefff, brilho: 0x6aa8ff },
    arco: { tempo: 0.55, pesado: 0.95, alcance: 22, arco: 0.5, folego: 12, dano: v => 7 + Math.round(v.prudencia * 1.8 + v.justica * 1.2), projetil: true, flecha: true, cor: 0xfff4d0, brilho: 0xffe0a0 },
    luz: { tempo: 0.45, pesado: 0.9, alcance: 15, arco: 0.6, folego: 12, dano: v => 5 + Math.round(v.fe * 2 + v.esperanca * 0.8), projetil: true, cor: 0xf4e6ff, brilho: 0xa86aff },
    crucifixo: { tempo: 0.5, pesado: 0.9, alcance: 10, arco: 0.6, folego: 12, dano: v => 7 + Math.round(v.fe * 1.5 + v.justica * 1.5), projetil: true, cor: 0xfff0d8, brilho: 0xff6a3a }
  };

  OV.derivados = function (v, arma) {
    const A = OV.ARMAS[arma];
    return {
      maxHp: 60 + v.fortaleza * 8,
      maxSta: 60 + v.temperanca * 10,
      maxFe: 40 + v.fe * 15,
      dano: A.dano(v),
      iframe: +(0.2 + v.prudencia * 0.03).toFixed(2),
      burst: 20 + v.fe * 6,
      miguel: Math.round(8 + v.fe * 2.2),
      cura: Math.round(20 + v.caridade * 4 + v.fe * 2),
      prayHp: 3 + v.esperanca,
      prayFe: 8 + v.esperanca * 2,
      staRegen: 20 + v.temperanca * 1.5
    };
  };

  OV.STATUS = {
    ira: { label: 'Ira', desc: 'o fôlego não se recupera', dur: 6 },
    preguica: { label: 'Preguiça', desc: 'movimentos lentos', dur: 6 },
    soberba: { label: 'Soberba', desc: 'não consegue rezar', dur: 7 },
    gula: { label: 'Gula', desc: 'curas pela metade e o fôlego se esvai', dur: 7 },
    avareza: { label: 'Avareza', desc: 'não consegue usar itens (dar esmola num Oratório purifica)', dur: 9 },
    luxuria: { label: 'Luxúria', desc: 'visão turva e câmera instável', dur: 7 }
  };

  OV.ORACOES = [
    { slot: 1, id: 'ave', nome: 'Ave-Maria', custo: 25, recarga: 6, descr: 'Cura a vida' },
    { slot: 2, id: 'miguel', nome: 'São Miguel', custo: 30, recarga: 4, descr: 'Luz que fere de leve todos os vícios ao redor e os empurra' },
    { slot: 3, id: null, nome: 'Pai-Nosso', bloq: 'Aprende-se com Padre Tomé, no vale' },
    { slot: 4, id: null, nome: 'Vazio', bloq: 'Novas orações se equipam nos Oratórios' }
  ];
  OV.SINAL = { nome: 'Sinal da Cruz', custo: 10, recarga: 0.8, janela: 0.3 };
})(window.OV);

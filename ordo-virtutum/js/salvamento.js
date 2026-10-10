/* Ordo Virtutum — salvamento no navegador (guardado nos Oratórios) */
(function (OV) {
  'use strict';
  const KEY = 'ordo-virtutum-save-v1';
  let memoria = null; // reserva quando o navegador bloqueia o armazenamento
  const S = {};
  S.ler = function () {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* armazenamento indisponível */ }
    return memoria;
  };
  S.gravar = function (dados) {
    dados.salvoEm = Date.now();
    memoria = JSON.parse(JSON.stringify(dados));
    try { localStorage.setItem(KEY, JSON.stringify(dados)); return true; } catch (e) { return false; }
  };
  S.apagar = function () { memoria = null; try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } };
  S.existe = () => !!S.ler();
  OV.save = S;
})(window.OV);

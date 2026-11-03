/* Language matching is based on explicit preference, never IP or citizenship. */
(function (scope) {
  'use strict';
  const codes = ['ko','en','ja','zh-CN','ar','cs','da','de','el','es-MX','fi','fr','he','hi','hu','id','it','ms','nb','nl','pl','pt-BR','ro','ru','sv','th','tr','uk','vi'];
  const byLower = Object.fromEntries(codes.map(code => [code.toLowerCase(), code]));
  const aliases = {zh:'zh-CN','zh-hans':'zh-CN',es:'es-MX',pt:'pt-BR',no:'nb',nn:'nb',iw:'he',in:'id'};
  function match(value) {
    const normalized = String(value || '').trim().replaceAll('_','-').toLowerCase();
    return byLower[normalized] || aliases[normalized] || byLower[normalized.split('-')[0]] || aliases[normalized.split('-')[0]] || null;
  }
  function detect(preferred) {
    for (const value of Array.isArray(preferred) ? preferred : [preferred]) {
      const found = match(value);
      if (found) return found;
    }
    return 'en';
  }
  function route(path) {
    const value = String(path || '').match(/^\/([^/]+)(?:\/index\.html|\/)?$/i)?.[1];
    return value ? match(value) : null;
  }
  function resolve({path = '/', stored = null, preferred = []} = {}) {
    const explicit = route(path);
    const remembered = codes.includes(stored) ? stored : null;
    return {language: explicit || remembered || detect(preferred), manual: explicit || remembered};
  }
  const api = Object.freeze({codes:Object.freeze(codes),match,detect,route,resolve});
  scope.PixiraLocale = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);

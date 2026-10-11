import tr from '../locales/tr.json'

export function t(key) {
  return key.split('.').reduce((o, i) => {
    if (o) return o[i];
    return undefined;
  }, tr) || key;
}

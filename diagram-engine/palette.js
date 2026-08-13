'use strict';

// dataviz skill'in referans paletinden alinip `scripts/validate_palette.js`
// ile dogrulanmis kategorik renkler (3 slot: CVD-safe, sira SABIT).
// Yeni bir dizin grubu icin renk UYDURULMAZ -- 8 slottan sonrasi "Diger"
// (notr/muted) kovasina duser; bu, dataviz skill'inin "categorical hues
// asla cycle edilmez" kuralinin geregidir.
const CATEGORICAL = [
  { light: '#2a78d6', dark: '#3987e5' }, // 1 blue
  { light: '#1baf7a', dark: '#199e70' }, // 2 aqua
  { light: '#eda100', dark: '#c98500' }, // 3 yellow
  { light: '#008300', dark: '#008300' }, // 4 green
  { light: '#4a3aa7', dark: '#9085e9' }, // 5 violet
  { light: '#e34948', dark: '#e66767' }, // 6 red
  { light: '#e87ba4', dark: '#d55181' }, // 7 magenta
  { light: '#eb6834', dark: '#d95926' }, // 8 orange
];

const OTHER_GROUP = { light: '#898781', dark: '#898781' };

const TOKENS = {
  light: {
    pagePlane: '#f9f9f7',
    surface: '#fcfcfb',
    primaryInk: '#0b0b0b',
    secondaryInk: '#52514e',
    mutedInk: '#898781',
    baseline: '#c3c2b7',
  },
  dark: {
    pagePlane: '#0d0d0d',
    surface: '#1a1a19',
    primaryInk: '#ffffff',
    secondaryInk: '#c3c2b7',
    mutedInk: '#898781',
    baseline: '#383835',
  },
};

function colorForGroupIndex(index) {
  return index < CATEGORICAL.length ? CATEGORICAL[index] : OTHER_GROUP;
}

module.exports = { CATEGORICAL, OTHER_GROUP, TOKENS, colorForGroupIndex };

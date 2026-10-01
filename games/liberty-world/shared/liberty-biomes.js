import {worldPalette} from './world-palette.js';
// Natural terrain palettes are separate from Liberty-branded rails, UI and rewards.
export function runnerBiome(id){
  const variants={
    canyon:{sky:'#f6d4a2',skyTop:'#bc9078',water:'#b97040',waterLight:'#eab875',grass:'#d39a50',grassLight:'#edc386',grassDark:'#9c663d',rockLight:'#e8b071',rockDark:'#9b503b',leaf:'#b9a164',pine:'#687849',mountainNear:'#bb7652',mountainFar:'#d9a57b'},
    alpine:{sky:'#c4deed',skyTop:'#537fa7',water:'#6faac6',waterLight:'#d8f3fa',grass:'#e2edf1',grassLight:'#f2f7fa',grassDark:'#a3bfcc',rockLight:'#c4d6e0',rockDark:'#6c8a9d',leaf:'#598c95',leafLight:'#d6f4ef',pine:'#326c75',mountainNear:'#789bab',mountainFar:'#a8c1cf'},
    volcano:{sky:'#6a3842',skyTop:'#201d35',water:'#d64017',waterLight:'#ffb942',grass:'#56424a',grassLight:'#8e7774',grassDark:'#372f3d',rockLight:'#8e7470',rockDark:'#392d39',leaf:'#79554b',pine:'#453947',mountainNear:'#63464e',mountainFar:'#9f6760',cloud:'#b69281'},
    skybreak:{sky:'#170d34',skyTop:'#050816',water:'#160d31',waterLight:'#6ee9ff',grass:'#241947',grassLight:'#5b4b8b',grassDark:'#100b25',rockLight:'#6a5a93',rockDark:'#171126',leaf:'#3e3976',pine:'#25234f',mountainNear:'#332c66',mountainFar:'#5e5794',cloud:'#b9a7ff',nightFog:'#120d29',nightGround:'#0b0a19',nightGlass:'#6ee9ff',nightShadow:'#0a0817',nightRoof:'#251744',stone:'#9184b6',moon:'#f7d7ff'}
  };
  const colors={...worldPalette,...variants[id]};return {colors,fog:id==='skyline'||id==='skybreak'?colors.nightFog:colors.sky,night:id==='skyline'||id==='volcano'||id==='skybreak'};
}

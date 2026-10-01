export function rng(seed) {return () => {seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;};}
export function hashSeed(text) {let n=2166136261; for (let i=0;i<text.length;i++) n=Math.imul(n^text.charCodeAt(i),16777619); return n>>>0;}
export const utcDay = () => new Date().toISOString().slice(0,10);

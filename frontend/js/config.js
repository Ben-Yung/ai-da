/* ── Frontend Config ── */
const API_BASE = window.location.origin + '/api';

// Tools (mirror of backend config)
const TOOLS = {
  beat: [
    { id: 'slipper', name: '拖鞋', icon: '🥿', power: 5, rangeVal: 3 },
    { id: 'stick', name: '棍棒', icon: '🏏', power: 7, rangeVal: 4 },
    { id: 'pliers', name: '老虎鉗', icon: '🦀', power: 9, rangeVal: 2 },
    { id: 'incense', name: '香爐', icon: '🔥', power: 6, rangeVal: 6 },
  ],
  hug: [
    { id: 'feather', name: '羽毛', icon: '🪶', power: 8, rangeVal: 3 },
    { id: 'lipstick', name: '唇印', icon: '💋', power: 6, rangeVal: 4 },
    { id: 'rose', name: '玫瑰', icon: '🌹', power: 7, rangeVal: 5 },
  ],
};

// Dolls (mirror of backend config)
const DOLLS = [
  { id: 'traditional', name: '傳統紙人', color: '#FF4444', shape: 'humanoid' },
  { id: 'ghost', name: '鬼怪紙人', color: '#9944CC', shape: 'ghost' },
  { id: 'frog', name: '青蛙紙人', color: '#44BB44', shape: 'circle' },
  { id: 'demon', name: '惡魔紙人', color: '#CC2222', shape: 'triangle' },
  { id: 'angel', name: '天使紙人', color: '#FFD700', shape: 'humanoid' },
  { id: 'cat', name: '貓貓紙人', color: '#FF9900', shape: 'circle' },
  { id: 'bunny', name: '兔兔紙人', color: '#FFB6C1', shape: 'circle' },
  { id: 'star', name: '星星紙人', color: '#66CCFF', shape: 'star' },
];

// Rhymes
const BEAT_RHYMES = [
  '打你個{name}頭，等你一世唔出頭',
  '打你個{name}手，等你一世冇朋友',
  '打你個{name}眼，等你一世冇人睇',
  '打你個{name}腳，等你一世冇鞋著',
];

const HUG_RHYMES = [
  '錫錫{name}個頭，煩惱全部走',
  '錫錫{name}對手，好運跟你走',
  '錫錫{name}一雙眼，日日都燦爛',
  '錫錫{name}一對腳，路路都快樂',
];

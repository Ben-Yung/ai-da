"""Pre-defined tool configs (no DB table needed)."""
from typing import List, Dict

# Each tool: id, name, icon (SVG path or emoji), mode, power(1-10), range(1-10)
TOOLS_CONFIG: List[Dict] = [
    # ── Beat mode tools ──
    {"id": "slipper",    "name": "拖鞋",   "icon": "🥿", "mode": "beat", "power": 5,  "range": 3},
    {"id": "stick",      "name": "棍棒",   "icon": "🏏", "mode": "beat", "power": 7,  "range": 4},
    {"id": "pliers",     "name": "老虎鉗", "icon": "🦀", "mode": "beat", "power": 9,  "range": 2},
    {"id": "incense",    "name": "香爐",   "icon": "🔥", "mode": "beat", "power": 6,  "range": 6},
    # ── Hug mode tools ──
    {"id": "feather",    "name": "羽毛",   "icon": "🪶", "mode": "hug",  "power": 8,  "range": 3},
    {"id": "lipstick",   "name": "唇印",   "icon": "💋", "mode": "hug",  "power": 6,  "range": 4},
    {"id": "rose",       "name": "玫瑰",   "icon": "🌹", "mode": "hug",  "power": 7,  "range": 5},
]

# Pre-defined paper dolls (JSON config, not a DB table)
DOLLS_CONFIG: List[Dict] = [
    {"id": "traditional",   "name": "傳統紙人",   "color": "#FF4444", "shape": "humanoid"},
    {"id": "ghost",         "name": "鬼怪紙人",   "color": "#9944CC", "shape": "ghost"},
    {"id": "frog",          "name": "青蛙紙人",   "color": "#44BB44", "shape": "circle"},
    {"id": "demon",         "name": "惡魔紙人",   "color": "#CC2222", "shape": "triangle"},
    {"id": "angel",         "name": "天使紙人",   "color": "#FFD700", "shape": "humanoid"},
    {"id": "cat",           "name": "貓貓紙人",   "color": "#FF9900", "shape": "circle"},
    {"id": "bunny",         "name": "兔兔紙人",   "color": "#FFB6C1", "shape": "circle"},
    {"id": "star",          "name": "星星紙人",   "color": "#66CCFF", "shape": "star"},
]

# ── Beat rhymes ──
BEAT_RHYMES = [
    "打你個{name}頭，等你一世唔出頭",
    "打你個{name}手，等你一世冇朋友",
    "打你個{name}眼，等你一世冇人睇",
    "打你個{name}腳，等你一世冇鞋著",
]

# ── Hug rhymes ──
HUG_RHYMES = [
    "錫錫{name}個頭，煩惱全部走",
    "錫錫{name}對手，好運跟你走",
    "錫錫{name}一雙眼，日日都燦爛",
    "錫錫{name}一對腳，路路都快樂",
]


def get_tools(mode: str = None) -> List[Dict]:
    """Return tools filtered by mode, or all tools."""
    if mode:
        return [t for t in TOOLS_CONFIG if t["mode"] == mode]
    return TOOLS_CONFIG


def get_dolls() -> List[Dict]:
    return DOLLS_CONFIG


def get_rhymes(mode: str) -> List[str]:
    return BEAT_RHYMES if mode == "beat" else HUG_RHYMES

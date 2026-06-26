# SCP Operator — UI / 美术构建规范
<!-- LAST_REVIEWED: 2026-06-26 -->

---

## 一、设计语言定义

### 调性关键词

> **军用终端 · 信息过载 · 认知压抑 · 绿磷光屏**

- 一切视觉元素服务于"你在操作一台1990s军用调度终端"的沉浸感
- 不用圆角（`border-radius:0`）、不用阴影装饰、不用图标库
- 所有交互反馈都用颜色变化 + 边框变化，不用位移动画
- 文字全部等宽字体（`Courier New, monospace`），强化终端感
- 信息密度故意偏高，让玩家感到"需要处理的事情很多"

---

## 二、颜色系统

### CSS变量（定义在 `:root`，位于 `ui_prototype.html` 第8-17行）

```css
:root {
  /* 背景层级：bg < bg2 < bg3（越深越亮） */
  --bg:    #0a0c0e;   /* 最底层背景，主体区域 */
  --bg2:   #0e1214;   /* 次级背景：面板头/卡片/浮动窗口 */
  --bg3:   #141a1e;   /* 高亮背景：hover/选中/输入框 */

  --border: #1e2c2e;  /* 默认边框：所有分割线、卡片边框 */

  /* 功能色 · 亮色用于前景文字/激活边框，暗色用于背景填充 */
  --green:      #4aff9a;  /* 主色：在线/正常/确认/标题 */
  --green-dim:  #1a4a2e;  /* 绿色背景填充：选中状态/注释连线 */

  --amber:      #ffb84a;  /* 警告色：待处理/沉默超时/暴露指标 */
  --amber-dim:  #3a2800;  /* 琥珀背景填充 */

  --red:        #ff4a4a;  /* 危险色：高危事件/失控/删除/特遣队 */
  --red-dim:    #3a0a0a;  /* 红色背景填充 */

  --blue:       #4ab8ff;  /* 转接/特殊机构/转接运行标签 */
  --blue-dim:   #0a2a3a;

  --purple:     #b84aff;  /* 预留：元叙事/高级权限事件（暂未使用） */
  --purple-dim: #2a0a3a;

  --grey:       #4a5a5e;  /* 沉默/不可用/无分配 */
  --text:       #c8d8d4;  /* 主要文字 */
  --text-dim:   #5a7070;  /* 次要文字：标签/元信息/未激活状态 */
}
```

### 颜色语义速查

| 颜色 | 语义 | 使用场景 |
|------|------|----------|
| `--green` | 正常 / 在线 / 确认 | 调查员在线状态、结案确认、主选项 |
| `--amber` | 警告 / 待处理 / 压力 | 调查员沉默、事件超时、暴露度条 |
| `--red` | 危险 / 紧急 / 破坏 | III级事件徽章、失控度条、特遣队调度、删除操作 |
| `--blue` | 转接 / 外部 / 协作 | 部门转接标签、ε6接管、外部支援 |
| `--purple` | 元叙事 / 超权限 | 预留，暂未启用 |
| `--grey` | 沉默 / 断联 / 不可用 | 调查员沉默头像、禁用按钮 |
| `--text-dim` | 次要信息 | 时间戳、元数据标签、说明文字 |

---

## 三、全局排版

```css
body {
  font-family: 'Courier New', monospace;
  font-size: 13px;         /* 基础字号 */
  zoom: 1.22;              /* 全局缩放，可在设置窗口调整 0.8~1.8 */
  background: var(--bg);
  color: var(--text);
  height: 100vh;
  overflow: hidden;        /* 禁止页面滚动，所有滚动在子容器内 */
}
```

- 字号层级：10px（微标签）→ 11px（元信息）→ 12px（卡片名称）→ 13px（正文）→ 14px（时钟/强调）
- `letter-spacing` 用于强化终端感：标题/徽章通常 `1~3px`
- 所有滚动条：宽度 `2~3px`，颜色 `var(--border)` 或 `var(--green-dim)`

---

## 四、布局结构

```
┌─────────────────── #topbar (34px) ──────────────────────────────┐
│ LOGO │ 状态指标 │ 进度条 │ 时钟                     │ 设置按钮 │
├──────────────────────────────────────────────────────────────────┤
│                     #main (flex:1, grid)                         │
│  左栏 252px     │     中栏 1fr      │     右栏 288px             │
│  .panel          │     .panel        │     .panel                │
│  (事件看板)      │     (地图)        │     (通讯)                │
├──────────────────────────────────────────────────────────────────┤
│                      #bot (36px)                                 │
│  档案库 │ 申请支援 │ 部门转接 │ 标记等级 │ 特遣队 │ 升级申请    │
└──────────────────────────────────────────────────────────────────┘

叠加层（position:fixed）：
  #terminal-dock  — 最小化通讯终端停靠栏，bottom:44px 居中
  #speed-ind      — 时间加速提示，bottom:52px 居中
  .fw × N         — 浮动窗口（档案库/转接/特遣队/设置），z-index:500
  .sct × N        — 通讯终端窗口，z-index:3000
  #speed-ind      — z-index:4000（最顶层）
```

### 三栏配比说明

```css
grid-template-columns: 252px 1fr 288px;
gap: 1px;
background: var(--border);  /* 1px gap 填border色，形成分割线效果 */
```

左栏固定 252px，右栏固定 288px，中栏地图占剩余全部空间。

---

## 五、通用组件规范

### `.panel` — 面板容器
```
.ph（面板头 28px）
  .dot（状态点 5×5px）
  .ptitle（10px letter-spacing:2px 灰色）
  .pcount（文件数量）
  .tog（折叠按钮 ▼）
.panel-body（flex:1 overflow:hidden）
  （各面板内容）
```

### `.ev` — 事件卡片
```
.ev-row1：[ .evb等级徽章 ][ .ev-name ][ 可选：状态标签 ][ .ev-resolve ✓按钮 ]
.ev-row2：[ .ev-ag 调查员 ][ 类型 ][ .ev-t 时间 ]
```
- 未选中：`border: 1px solid var(--border)`
- 选中 `.sel`：`border-color: var(--green)`
- 转接运行 `.xfer`：`border-color: var(--blue-dim)`
- 等级徽章颜色：I级灰，II级琥珀，III级红，未知级灰虚线框

### `.cc` — 通讯卡片
折叠状态：只显示 `.cc-row`（头像+名称+状态）
展开预览：`.cc-preview.open`（最后消息+快捷操作）
展开详情：`.cc-detail.open`（元数据+通话日志+全部操作）

左侧边框颜色编码状态：
- `.online` → `border-left: 2px solid var(--green)`
- `.silent` → `border-left: 2px solid var(--grey)` + `opacity:.7`
- `.warn` → `border-left: 2px solid var(--amber)`

### `.bs` — 小操作按钮（统一规范）
```css
/* 默认：灰边灰字 hover变绿 */
.bs        → border:var(--border)  color:var(--text-dim)  hover→green
.bs.w      → border:amber-dim      color:amber             （警告操作）
.bs.b      → border:blue-dim       color:blue              （转接操作）
.bs.d      → border:red-dim        color:red               （危险操作）
```

### `.fw` — 浮动窗口
```
position:fixed; display:none;  → .open 时 display:flex
.fh（标题栏 28px，cursor:move，触发拖拽）
  .ft（9px letter-spacing:2px 灰色标题）
  .fc（× 关闭按钮，hover变红）
（窗口内容区）
```
z-index: 500，多窗口通过 `bringFront()` 动态调整层级。

### `.sct` — 通讯终端窗口
```
.sct-head（标题栏：SECURE COMMS标签 + 调查员代号 + 状态 + 最小化/关闭按钮）
.sct-id（身份卡：32×32头像 + 全名 + 区位 + 加密状态）
.sct-log（通话内容：打字机文本区 + 光标）
.sct-cmd（选项区：选项按钮列，打字完成后才显示）
.sct-foot（底栏：时间戳 + 关闭按钮）
```
边框颜色：正常=`var(--green)`，告警=`var(--amber)`（`.warn-terminal`）

---

## 六、地图视觉规范

### 地图背景特效（纯CSS）
```css
/* 水平扫描线叠加 */
#map-canvas::after {
  background: repeating-linear-gradient(0deg,
    transparent 0, transparent 2px,
    rgba(0,0,0,.15) 2px, rgba(0,0,0,.15) 4px);
}
/* 暗角压制（聚焦中心）*/
#map-canvas::before {
  background: radial-gradient(ellipse at 50% 50%,
    transparent 35%, rgba(10,12,14,.65) 100%);
}
```

### 节点视觉规范

| 节点类型 | 形状 | 边框色 | 背景 | 尺寸 |
|----------|------|--------|------|------|
| 调查员 `.node-ag` | 矩形 | `--green` | `rgba(74,255,154,.06)` | 48×28px |
| 事件 `.node-ev` | 菱形（rotate 45deg）| `--amber` | `rgba(255,184,74,.06)` | 24×24px |
| 高危事件 `.node-ev-hi` | 菱形 | `--red` | `rgba(255,74,74,.08)` | 同上 |
| 转接节点 `.node-xfer` | 矩形 | `--blue` | `rgba(74,184,255,.06)` | 38×28px |
| 支援卡片 `.sup-card` | 矩形 | `#3a6a4a` | `var(--bg2)` | 动态 |

活跃调查员节点带 `.n-pulse`（绿色边框脉冲动画，opacity 0→1→0 循环）。

### SVG连线颜色语义

| 连线颜色 | 语义 |
|----------|------|
| `#ff4a4a` 红 | 调查员→高危事件 |
| `#ffb84a` 琥珀 | 调查员→普通事件 |
| `#4ab8ff` 蓝 | 转接节点连线 |
| `#6aee9a` 绿 | 支援卡片→最近事件 |

所有连线均为虚线（`stroke-dasharray:5,3`），opacity 0.3~0.5。

---

## 七、动效规范

### 全局 keyframes（仅两个）
```css
@keyframes pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:.3; transform:scale(.5); }
}
@keyframes blink {
  50% { opacity:0; }
}
```

| 动效 | 用途 | 参数 |
|------|------|------|
| `pulse 0.8s infinite` | `.run-tag` 蓝点（转接运行标签） | 0.8s 快速 |
| `pulse 1.0s infinite` | 收件箱待接入 `.ii-dot` | 1.0s |
| `pulse 1.2s infinite` | 最小化终端停靠按钮 `.sct-mini-dot` | 1.2s |
| `pulse 1.5s infinite` | 调查员节点光晕 `.n-pulse` | 1.5s 慢速 |
| `pulse 1.5s infinite` | 通讯终端LIVE状态标签 | 同上 |
| `blink 1s infinite` | 打字机光标 `▋` | 1s |

### 状态变化过渡
- 卡片选中/hover：`transition: border-color .12s`（极短，响应快）
- 选项按钮出现：`transition: all .12s`
- 结案节点淡出：`transition: opacity .6s`（0.6s 淡出）
- 结案卡片收起：`transition: max-height .5s, opacity .5s`（1.2s后触发）

---

## 八、功能模块实现逻辑

### 8.1 游戏时间系统

```javascript
// GT 对象（ui_prototype.html JS段开头）
const GT = {
  day:7, hour:8, min:0,   // 初始时间 D+7 08:00
  speed:1,                 // 倍速（1=正常，10=空格加速）
  paused:false,            // 通讯终端打字期间暂停
  tick(){
    if(this.paused) return;
    this.min += this.speed;
    if(this.min >= 60){ this.min -= 60; this.hour++; }
    if(this.hour >= 24){ this.hour = 0; this.day++; }
    document.getElementById('clock').textContent = this.fmt();
    this._check();
  },
  fmt(){ return 'D+'+this.day+' '+String(this.hour).padStart(2,'0')+':'+String(this.min).padStart(2,'0'); },
  scheduleAt(d, fn){ this._sched.push({...d, fn}); },
  _check(){ this._sched = this._sched.filter(s=>{ ... }); }
};
setInterval(()=>GT.tick(), 1000);  // 1真实秒 = 1游戏分钟

// 空格加速
document.addEventListener('keydown', e=>{ if(e.code==='Space'){ GT.speed=10; } });
document.addEventListener('keyup',   e=>{ if(e.code==='Space'){ GT.speed=1; } });
```

### 8.2 通讯终端（SECURE COMMS）

**触发路径**：`GT.scheduleAt` 到期 → `openTerminal(evt)` → 创建 `.sct` DOM

**打字机实现**：
```javascript
const PAUSE = {'。':320,'，':140,'…':500,'—':200,'\n':260,'！':280,'？':280,'、':100};
function typeNext(){
  if(ci >= txt.length){ cursor.style.display='none'; renderOpts(tid,evt,ag); return; }
  const ch = txt[ci++];
  textEl.textContent += ch;
  const d = PAUSE[ch] !== undefined ? PAUSE[ch] : (ci%3===0 ? 28 : 18);
  setTimeout(typeNext, d);
}
// GT.paused=true 在打字期间，防止时间流逝
```

**选项系统**：打字完成后 `renderOpts()` 插入按钮，点击后追加调查员回复到日志，可触发 `scheduleAt` 预定后续事件。

**最小化/停靠**：
- 点击 `—` 按钮 → `minimizeTerminal(tid)` → 隐藏 `.sct` → 在 `#terminal-dock` 插入 `.sct-mini` 按钮
- 点击停靠按钮 → `restoreTerminal(tid)` → 移除停靠按钮 → 显示 `.sct`

**多窗口管理**：
- 每个终端有唯一 `tid='sct-'+evt.id`
- `termCount` 计数器控制新窗口初始位置错开（`top: 60+n*30, left: 80+n*30`）
- 点击窗口任意位置 → `bringTermFront(tid)` 提升 z-index

### 8.3 地图系统

**坐标系**：
```
#map-canvas（视口，overflow:hidden）
  └─ #map-inner（1200×900px 画布，应用 transform）
       ├─ .node × N（绝对定位，left/top 是画布坐标）
       └─ #map-svg（SVG overlay，与map-inner等大，不跟随transform）
```

**关键变量**：
```javascript
let ms = 0.4;   // 缩放比例（0.15~3）
let mx = 0;     // X平移（canvas坐标）
let my = 0;     // Y平移（canvas坐标）
```

**坐标转换**（节点画布坐标 → SVG坐标）：
```javascript
function nodeCenter(id){
  const el = document.getElementById(id);
  const rx = parseFloat(el.style.left) + el.offsetWidth/2;
  const ry = parseFloat(el.style.top)  + el.offsetHeight/2;
  return { x: rx*ms + mx,  y: ry*ms + my };  // 应用变换
}
```

**LINKS数组**（动态，`let`）：
```javascript
let LINKS = [
  ['节点A-id', '节点B-id', '#颜色', 透明度],
  ...
];
```
`drawLinks()` 每帧清空 SVG 重绘所有线段。

### 8.4 事件系统

**新建事件（`.ev-add` 按钮）**：
1. `prompt()` 输入名称
2. `spawnEventNode(name, agNodeId)` → 在 `map-inner` 随机位置插入菱形节点，推入 LINKS（如有关联调查员）
3. 创建 `.ev` 卡片，`dataset.nodeId` 绑定地图节点 ID
4. `addFileToArchive()` 在档案库添加草稿文件

**结案（`.ev-resolve` ✓ 按钮）**：
1. `resolveEvent(evCard, nodeId)` 触发
2. 卡片变灰 + 删除线 + 追加"✓ 结案"标签
3. 地图节点 `opacity:0` 淡出 → 0.65s 后从 DOM 移除
4. `LINKS = LINKS.filter(([a,b])=> a!==nodeId && b!==nodeId)` 断线
5. `drawLinks()` 重绘
6. 1.2s 后卡片 `max-height:0` 折叠，1.8s 后从 DOM 移除

**收件箱接入**：`inboxAccept()` 在通讯卡列表头部插入新 `.cc` 卡，移除原收件箱条目。

### 8.5 浮动窗口系统

```javascript
function openW(id){ document.getElementById(id).classList.add('open'); bringFront(document.getElementById(id)); }
function closeW(id){ document.getElementById(id).classList.remove('open'); }
```

拖拽：`.fh`（标题栏）`mousedown` → 记录偏移 → `mousemove` 更新 `left/top` → `mouseup` 清除。

窗口层级：`mousedown` 时 `bringFront()` 将当前窗口 z-index 设为所有窗口最大值+1。

### 8.6 字体缩放系统

```javascript
function applyZoom(v){
  document.body.style.zoom = v;
  document.getElementById('zoom-display').textContent = Math.round(v*100)+'%';
}
```

`body{zoom:1.22}` 是初始默认值，设置窗口滑块实时调整，刷新后恢复默认。

---

## 九、新增组件 checklist

新增任何UI组件，按顺序确认：

- [ ] 颜色只用已有 CSS 变量，不写 hardcode 色值（地图SVG连线颜色除外）
- [ ] 字体必须是 `'Courier New', monospace`
- [ ] 无圆角（除非明确需要圆点）
- [ ] 按钮默认灰色边框+灰字，hover 变绿，危险操作用红色变体
- [ ] 新增功能色用 `--purple`（元叙事/超权限），避免引入新色
- [ ] 交互反馈用 `border-color` 变化，不用 `transform: translateY`
- [ ] 滚动容器设置 `::-webkit-scrollbar{ width:3px }` 细滚动条
- [ ] 动画只用已有的 `pulse` 和 `blink` keyframes
- [ ] `position:fixed` 弹层确认 z-index 层级不冲突（参考上方层级表）

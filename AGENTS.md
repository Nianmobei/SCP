# SCP Operator — 接线员 · AI接手导航
<!-- LAST_REVIEWED: 2026-06-26 -->

## 一句话

单人独立游戏原型，HTML/CSS/JS 单文件，无框架，无构建工具。玩家扮演SCP基金会接线员，通过延迟/失真的通讯协调调查员处理异常事件。

---

## 项目文件一览

```
D:\学习资料\创作项目\接线\
├── ui_prototype.html   ← 唯一可运行主文件，直接浏览器打开
├── AGENTS.md           ← 本文件，AI接手导航
├── UI_SPEC.md          ← UI美术构建规范（样式变量/布局/组件/动效）
├── SCP_Operator_GDD.md ← 游戏设计文档（核心体验/事件/调查员系统）
├── gen_html.py         ← CSS字符串定义（历史辅助脚本，不再需要执行）
└── gen2.py             ← HTML重建脚本（历史辅助脚本，不再需要执行）
```

> `gen_html.py` / `gen2.py` 是编码污染修复期间的重建脚本，当前 `ui_prototype.html` 已干净，**不再需要运行**。

---

## 禁区

| 操作 | 原因 |
|------|------|
| 用 PowerShell `Get-Content \| Set-Content` 读写此文件 | 会将 UTF-8 转为 GBK，破坏中文注释 |
| 用任何会改变文件编码的编辑器保存 | 同上 |
| 在 `</html>` 后追加内容 | 会渲染为可见文本，破坏页面 |

---

## 技术架构

### 文件结构（ui_prototype.html 内部）

```
<head>
  <style> ← 全部CSS，约280行，使用CSS变量（见 UI_SPEC.md）
</head>
<body>
  #topbar          ← 顶部状态栏（时钟/暴露/失控指标）
  #terminal-dock   ← 最小化通讯终端的停靠栏（空时隐藏）
  #speed-ind       ← 时间加速提示（空格键触发时显示）
  #main            ← 三栏主布局（flex row）
    .panel × 3    ← 左(事件看板) 中(地图) 右(通讯)
  #bot             ← 底栏快捷操作按钮行
  .fw × N         ← 浮动窗口（档案库/部门转接/特遣队/设置）
  #terminal-dock 内的 .sct ← 通讯终端窗口（动态创建）
  <script>         ← 全部JS，约700行
```

### 核心JS对象/函数

| 名称 | 职责 |
|------|------|
| `GT` | 游戏时间对象。`tick()` 每秒触发，`min+=speed`；`fmt()` 返回显示字符串；`scheduleAt(d,fn)` 预定事件；`_check()` 检查是否到期触发 |
| `AGENTS{}` | 调查员数据字典。键为代码（`'AV'`），值含 `name/callsign/status/events[]` |
| `EVENTS[]` | 调度事件数组。每项 `{id,agCode,day,hour,min,text,opts[]}` |
| `openTerminal(evt)` | 弹出通讯终端窗口。打字机效果，选项打完后才显示 |
| `selectOpt(tid,evt,ag,opt)` | 玩家选择回复选项，追加对话记录，触发后续事件 |
| `minimizeTerminal(tid)` | 最小化终端到 `#terminal-dock` |
| `restoreTerminal(tid)` | 从停靠栏恢复终端窗口 |
| `drawLinks()` | 重绘地图SVG连线，坐标公式：`x = nodeLeft * ms + mx` |
| `spawnEventNode(name,agNodeId)` | 新建地图菱形节点，可选连线到调查员 |
| `resolveEvent(evCard,nodeId)` | 结案：卡片变灰 → 节点淡出 → LINKS过滤 → drawLinks |
| `GT.speed` | 时间倍速。正常=1，按住空格=10 |

### 游戏时间系统

```javascript
// 1真实秒 = 1游戏分钟（speed=1时）
// 按住空格：speed=10（10倍加速）
setInterval(()=>{ GT.tick(); }, 1000);

// 调度事件示例
GT.scheduleAt({day:7, hour:9, min:30}, ()=>{ openTerminal(EVENTS[0]); });
```

### 通讯终端（.sct 窗口）

```javascript
// 打字机标点停顿映射
const PAUSE = {'。':320,'，':140,'…':500,'—':200,'\n':260,'！':280,'？':280,'、':100};

// GT.paused=true 在终端打字期间暂停游戏时间
// 打字完成后才渲染选项按钮（renderOpts()）
```

### 地图系统

```javascript
let ms=0.4, mx=0, my=0;  // 缩放 / 平移状态

// 坐标转换（节点坐标→SVG坐标）
x = nodeLeft * ms + mx
y = nodeTop  * ms + my

// LINKS 动态数组（let，可增删）
// ['nodeA-id', 'nodeB-id', '#colorHex', opacity]
```

---

## 当前已实现功能

- [x] 游戏时间流逝（1秒=1游戏分钟，空格×10加速）
- [x] 时间调度事件（`GT.scheduleAt`）
- [x] 通讯终端浮动窗口：打字机口述、选项延迟出现
- [x] 终端多窗口并排、拖拽移动
- [x] 终端最小化收纳到底栏、点击恢复
- [x] 地图节点拖拽 + 平移/缩放
- [x] SVG连线随节点/变换实时重绘（坐标已修正）
- [x] 事件看板：新建事件→自动生成地图节点
- [x] 事件结案：卡片收起→地图节点淡出→连线断开
- [x] 档案库浮动窗口（文件列表/状态/分类操作）
- [x] 部门转接浮动窗口
- [x] 特遣队调度浮动窗口（待命/新建申请/日志三标签）
- [x] 收件箱：接入/忽略
- [x] 字体大小设置窗口（zoom滑块）

## 待实现功能

- [ ] 调查员沉默超时自动提醒
- [ ] 事件升级：未处置事件随时间等级上升
- [ ] 事件来源多样化（民众举报/内部上报随机触发）
- [ ] 调查员污染/失联/死亡状态流转
- [ ] 隐性考核系统（决策记录+后续复盘）
- [ ] 存档/读档（localStorage）
- [ ] 多班次循环（结班→交接→新班次）

---

## 已知历史坑

| 坑 | 描述 | 状态 |
|----|------|------|
| PowerShell编码破坏 | `Get-Content\|Set-Content` 将UTF-8转GBK，`errors='replace'`产生`\ufffd?`替换字符 | 已修复（Python重建HTML） |
| JS残留在`</html>`后 | 多次edit操作将新JS插在旧`</script>`前，旧JS残留为可见文本 | 已修复 |
| SVG连线位置错误 | `nodeCenter()`未应用地图变换矩阵 | 已修复（乘以`ms`加上`mx/my`） |
| `LINKS`用`const`定义 | 无法动态增删连线 | 已修复（改为`let`） |

# SCP Operator — AI 接手指令（Project Skill）
<!-- 本文件供所有AI会话自动导入，等价于项目专属skill -->
<!-- 新会话请先读完本文件，再读 AGENTS.md + UI_SPEC.md -->

## 你是谁

你是 SCP基金会接线员独立游戏的开发助手。项目是**单文件HTML原型**（无框架、无构建工具）。
唯一可运行文件：`ui_prototype.html`，直接浏览器打开即可。

## 必读文档

| 文档 | 内容 |
|------|------|
| `AGENTS.md` | 项目结构 / 技术架构 / 所有JS函数索引 / 已知历史坑 |
| `UI_SPEC.md` | 配色系统 / 布局 / 组件规范 / 每个功能模块实现逻辑 |
| `SCP_Operator_GDD.md` | 游戏设计文档（体验定位/事件系统/调查员系统） |

**接到任何改动任务前，先 read `ui_prototype.html` 对应行段，不要凭记忆修改。**

---

## 强制规则（违反会破坏文件）

1. **绝对不用 PowerShell `Get-Content | Set-Content`** 读写此项目任何文件 → 会GBK编码污染
2. **所有写入必须 `encoding='utf-8'`**（Python脚本）
3. **不在 `</html>` 后追加内容** → 会渲染为页面可见文本
4. **修改 HTML 结构** 前先确认目标行号，用 `edit` 工具精确替换
5. **新增 JS 函数** 放在 `<script>` 内，不要新建 `<script>` 标签

---

## 代码规范（本项目）

```
字体：   'Courier New', monospace —— 所有元素统一
颜色：   只用 CSS 变量（--green/--amber/--red/--blue/--grey/--text-dim等）
         不写 hardcode 色值，SVG连线颜色除外
圆角：   禁止（border-radius:0）
动画：   只用已有的 pulse / blink keyframes，不新增
按钮：   默认灰色系，hover变绿；危险操作红色系；警告操作琥珀色系
z-index层级：
  .fw 浮动窗口   = 500
  .sct 通讯终端  = 3000
  #speed-ind     = 4000
```

---

## 高频操作模板

### 新增 JS 函数

```javascript
// 找到 <script> 标签内合适位置，用 edit 工具插入
// 函数命名：camelCase，动词开头（openX / closeX / updateX / handleX）
```

### 新增 CSS 样式

```css
/* 跟在同类选择器后面插入 */
/* 例：新按钮变体跟在 .bs.d{} 后面 */
.bs.p{border-color:var(--purple-dim);color:var(--purple);}
.bs.p:hover{border-color:var(--purple);}
```

### 新增地图节点类型

```html
<!-- HTML -->
<div class="node node-XX" id="n-xx" style="left:Xpx;top:Ypx">
  <div class="nb">标识</div>
  <div class="n-name">名称</div>
</div>

<!-- CSS -->
.node-XX .nb{ width:Xpx; height:Xpx; border:1px solid var(--颜色); background:rgba(...,.06); color:var(--颜色); }
```

### 新增浮动窗口

```html
<div class="fw" id="win-xxx" style="top:80px;left:200px;width:400px;height:350px;">
  <div class="fh" onmousedown="startDrag(event,'win-xxx')">
    <span class="ft">TITLE — 标题</span>
    <button class="fc" onclick="closeW('win-xxx')">×</button>
  </div>
  <!-- 内容 -->
</div>
```
```javascript
// 触发：
openW('win-xxx');
```

### 新增调度事件（通讯终端弹出）

```javascript
// 在 AGENTS{} 添加调查员（如果新调查员）
// 在 EVENTS[] 添加事件
// GT.scheduleAt({day:X, hour:X, min:X}, ()=>openTerminal(EVENTS[index]));
```

---

## 当前已实现功能（接手后不要重复造轮子）

- `GT.scheduleAt(d, fn)` — 时间调度
- `openTerminal(evt)` — 通讯终端（含打字机+选项）
- `minimizeTerminal(tid)` / `restoreTerminal(tid)` — 停靠栏
- `spawnEventNode(name, agNodeId)` — 地图节点生成
- `resolveEvent(evCard, nodeId)` — 事件结案
- `drawLinks()` — SVG连线重绘（已修正坐标变换）
- `openW(id)` / `closeW(id)` — 浮动窗口
- `addFileToArchive(name, status)` — 档案库写入
- `requestStatus(code, name)` — 请求调查员状态（延迟回调）
- `toast(msg, type)` — 右下角消息提示
- `applyZoom(v)` — 全局字体缩放

---

## 待开发功能（按优先级）

1. 调查员沉默超时自动提醒（`GT._check` 里加计时逻辑）
2. 事件自动升级（未处置事件每N分钟概率升级）
3. localStorage 存档
4. 多班次循环（结班→交接→新班）
5. 隐性考核系统

---

## 调试方法

```javascript
// 浏览器控制台直接调用：
GT.hour = 9; GT.min = 29;        // 快进到事件触发前1分钟
GT.speed = 60;                    // 60倍速
openTerminal(EVENTS[0]);          // 直接触发第一个事件
toast('测试消息','warn');         // 测试提示
spawnEventNode('测试事件', 'n-av'); // 测试地图节点
```

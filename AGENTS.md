# SCP Operator — 接线员 · AI 接手导航
<!-- LAST_REVIEWED: 2026-06-28 -->

## 一句话

单人独立游戏原型，HTML/CSS/JS 单文件，无框架，无构建工具。玩家扮演 SCP 基金会接线员，通过延迟/失真的通讯协调调查员处理异常事件。

---

## 项目文件

```
D:\学习资料\创作项目\接线\
├── ui_prototype.html     ← 唯一可运行主文件，浏览器直接打开
├── events_data.js        ← 所有事件/调查员数据（与逻辑分离，修数据只改这里）
├── AGENTS.md             ← 本文件，AI 接手导航
├── UI_SPEC.md            ← UI 美术规范（CSS 变量/布局/组件/动效）
├── SCP_Operator_GDD.md   ← 游戏设计文档（核心体验/事件/调查员系统）
└── gen_html.py / gen2.py ← 历史重建脚本，不再需要执行
```

---

## 禁区

| 操作 | 原因 |
|------|------|
| PowerShell `Get-Content \| Set-Content` 读写 | 会将 UTF-8 转 GBK，破坏中文 |
| 任何改变文件编码的编辑器 | 同上 |
| 在 `</html>` 后追加内容 | 渲染为可见文本 |

---

## 文件结构（ui_prototype.html 内部）

```
<head>
  <style>   ← 全部 CSS（约 520 行），使用 CSS 变量，分段注释标题
</head>
<body>
  #topbar           顶部状态栏：时钟 / 暴露 / 失控 / 调查员统计
  #terminal-dock    最小化通讯终端停靠栏
  #speed-ind        时间加速提示（空格键时显示）
  #bulletin-area    系统通报浮层（沉默超时/事件升级）
  #main             三栏主布局（grid 3列）
    .panel          左栏：EVENT BOARD（事件索引）
    .panel          中栏：ZONE MAP（白板）
    .panel          右栏：COMMUNICATIONS（来电+调查员通讯）
  #bot              底栏：快捷入口 + 支援派遣图标
  .fw × N           浮动窗口（档案库/部门转接/特遣队/设置/邮件/事件详情/调查员）
  #assign-modal     指派人员模态框（fixed 全屏覆盖层）
  <script>          全部 JS（约 2600 行）
```

---

## CSS 变量（:root）

```css
--bg / --bg2 / --bg3      背景层次
--border                  边框色
--green / --green-dim     绿（在线/正常）
--amber / --amber-dim     琥珀（警告/升级）
--red / --red-dim         红（高危/失控）
--blue / --blue-dim       蓝（转接/情报）
--purple / --purple-dim   紫（特殊）
--grey                    灰（沉默/离线）
--text / --text-dim       文字主/次
```

---

## JS 功能域说明

### 游戏时间（GT 对象）

```javascript
GT.day / .hour / .min / .speed / .paused
GT.tick()          // setInterval 每秒调用，min+=speed
GT.fmt()           // → "D+7 08:00"
GT.toMin()         // → 绝对游戏分钟数
GT.scheduleAt({atDay,atHour,atMin}, fn)  // 预定回调
GT._slowCheck()    // 每 60 tick 调用，检查沉默超时/事件升级/结案
```

1 真实秒 = 1 游戏分钟（speed=1）；空格键 = speed×10。

---

### 通讯终端（调查员对话）

```
CALL_EVENTS[]          // events_data.js 定义，triggerMin 触发
queueCall(evt)         // 加入来电队列，在 #comm-feed 生成 cf-item
cfAccept(id)           // 接取来电 → openTerminal(evt)
openTerminal(evt)      // 弹出 .sct 对话窗，打字机效果
selectOpt(tid,evt,opt,ag)  // 玩家选项 → 调查员回复 → addCallLog
minimizeTerminal / restoreTerminal / closeTerminal
```

打字机停顿：`PAUSE = {'。':320,'，':140,'…':500,...}`

---

### 白板（地图系统）

```javascript
let ms=0.4, mx=0, my=0;   // 缩放 / 平移状态
// 节点坐标 → SVG 坐标：svgX = nodeLeft * ms + mx
spawnMapNodes()            // 初始化，从 events_data.js MAP_NODES 生成节点
bindNodeDrag(n)            // 节点拖拽（nd 变量）
bindCardDrag(c)            // sup-card 拖拽（sd 变量）
drawLinks()                // 重绘所有 SVG 连线（LINKS[] + sup-card data-ev）
applyMap()                 // 应用 ms/mx/my 变换
mzoom(f) / mreset()        // 缩放 / 重置（默认 ms=1.0）
```

地图拖拽三个独立状态变量：
- `ps` → 地图平移（canvas mousedown）
- `nd` → 节点拖拽（node mousedown）
- `sd` → 支援卡拖拽（sup-card mousedown）

---

### 白板任务卡（task-card）

任务卡是**白板上的主要操作入口**，在接取来电（`cfAccept`）后由 `spawnTaskCard()` 生成，附着在白板 `#map-canvas` 上，可独立拖动。

**任务卡结构**（展开态）：
```
task-card-hd        标题行（来源标记 / 事件名 / ▸详情 / ✕关闭）
task-card-detail    内嵌摘要（折叠，点▸展开，三标签：初报/汇报/已知）
task-card-body      事件预览文本
task-card-rate      评级区（初判 ~I/~II/~III + 确认评级按钮）
task-card-res       资源面板（评级确认后内嵌展开）
task-card-threat    威胁等级 + 手动升级按钮
task-card-acts      操作按钮行（指派/请求回报/转接/重新审查/结案）
```

**折叠态**：点击 hd 标题行展开/折叠，保持白板整洁；新卡弹出时自动折叠之前的卡。

**关键函数**：
```javascript
spawnTaskCard({id,src,preview,isConfirmed,isSuspected,agCode,agentKey})
tcToggleDetail(btn)      // 展开/折叠内嵌摘要（自动先展开卡片）
tcSwitchTab(btn,paneId)  // 切换初报/汇报/已知标签
tcResolveFromCard(btn)   // 就地结案（联动左栏事件板条目）
openEvReviewFromCard(tc) // 从任务卡触发重新审查
_syncTaskCardDetail(tc)  // 从 EV_DATA 填充内嵌摘要内容
focusTaskCard(evEl)      // 左栏点击 → 定位到对应白板任务卡
```

---

### 事件评级系统

```
~0 / ~I / ~II / ~III   初判等级（模糊，虚线徽章）
rateAdj(btn, delta)    调整初判 ±1（范围 0-3）
rateConfirm(btn)       确认评级 → 写入事件板 → 展开资源面板 → 折叠任务卡
rateConfirmReview(btn, nodeId)  审批卡确认调整 → 更新事件板徽章
```

资源面板（`buildResPanel(lv, evName)`）按级别解锁：
- LV.0：仅人力（就近基金会人员）
- LV.I：武装/医疗/认知小组/情报支援
- LV.II：上述 + 申请特遣队（需审批）
- LV.III：直接呼叫特遣队

---

### 支援派遣系统（磁吸拖拽）

底栏四个支援图标（◈ 医疗 / ◈ 武装 / ◈ 认知 / ◈ 情报）使用 **mousedown 磁吸方案**（非 HTML5 drag API）：

```javascript
// 状态变量
let dragSupType = null;   // 当前拖拽中的支援类型
let _sdrag = null;        // { stype, snapId, locked }

// 工作流
mousedown 抓取图标
  → mousemove 检测最近事件节点距离（map-inner 本地坐标）
  → < 120px: 绘制 SVG 虚线预览 + 节点 filter:brightness(1.3)
  → < 70px:  实线 + 节点 brightness(1.6)（锁定态）
  → mouseup in-range: _spawnSupCard(nd, stype, evId)
  → mouseup out-range: 取消（无副作用）

// 去重：同事件同类型只能有一个 sup-card
document.querySelector(`.sup-card[data-ev="${evId}"][data-stype="${stype}"]`)

// 自动派遣（对话选项触发）
autoDispatchSupport(nodeId, stype)

// sup-card 连线：drawLinks 通过 data-ev 属性精确连到关联事件节点
```

sup-card 位置：map-inner 本地坐标，不需要屏幕坐标转换。

---

### 事件板（左栏，纯索引）

左栏 EVENT BOARD 是**纯轻量索引**，每行单行显示：`[级别] 事件名 · 调查员 · 日期`

- 点击 → `selEv(el)` 高亮 + `focusTaskCard(el)` 定位白板任务卡
- 无操作按钮（重新审查/结案统一在任务卡内操作）
- `updateEvCount()` 同步标题计数

---

### 噪音事件完整流程

```
cfAccept → spawnTaskCard（初判评级）
→ rateConfirm（确认，生成事件板条目）
→ openAssignModal（指派就近人员，自动生成 LOC-XXXX 代号）
→ addCommFeed（得到基础信息）
→ transferToPolice（指派警局处理，添加"确认误报"按钮）
→ confirmFalseAlarm（确认非超自然，添加"归档"按钮）
→ archiveEvent（结案归档，resolveEvent + addFileToArchive）
```

---

### 调查员指派系统（AGENT_ASSIGNMENTS）

```javascript
const AGENT_ASSIGNMENTS = {};              // { agCode: { evNodeId, evName } }
agentAssignedTo(code)                      // → 指派对象 或 null
agentFree(code)                            // → boolean
setAgentAssignment(code, evNodeId, evName) // 登记指派
clearAgentAssignment(code)                 // 结案时清除（resolveEvent 自动调用）
```

- `doAssign()` 内部自动调用 `setAgentAssignment`
- `resolveEvent()` 自动清除该事件所有调查员指派
- 一名调查员不能同时指派两个事件；冲突时弹出白板冲突卡（`_showAssignConflict`），二选一

---

### 调查员拖拽指派

右栏 `#comm-scroll` 内每个 `.cc-row` 可按住拖拽：

```
mousedown → _agDrag { agCode, agName }
mousemove → SVG 磁吸预览线（同支援拖拽规格：120px 虚线，70px 实线）
mouseup on .node-ev / .node-ev-hi → doAssign() + LINKS 连线
mouseup out-of-range → 取消（无副作用）
```

`initAgentDrag()` 在页面加载后 500ms 绑定；接受新来电 `cfAccept` 后需再次调用（或改为事件委托）。

---

### 非直属调查员显示

接取来电时（`_cfAcceptImpl`），若 `AGENT_ASSIGNMENTS` 中有其他已指派调查员，在通讯卡 `cc-preview` 内追加"◆ 非直属"行，列出其名字和跟进事件。

---

```javascript
INVESTIGATOR_SILENCE{}   // events_data.js，沉默超时阈值
checkSilence()           // 每 60 tick 检查，触发 bulletin 警告
setSilenceIcon(nodeId, level)  // 'warn'/'crit'/'none'
requestStatus(agCode, agName)  // 发送状态请求，pendingStatusReq 防重复
                               // scheduleAt 30-90分钟后调查员自动回报
```

---

### 事件详情（EV_DATA）

```javascript
const EV_DATA = {
  'e031': {
    name: '第十一封信',
    initial: '初步汇报文本...',
    reports: [{ time:'D+3 09:40', agent:'艾娃', hi:false, text:'...' }],
    known: ['已知信息条目...'],
    notes: []    // 接线员运行时追加
  },
  // 'cfn1/cfn2/cfn3': 噪音事件
};
```

- 通过任务卡 `▸ 详情` 按钮内嵌展开（三标签：初报/汇报/已知）
- `_syncTaskCardDetail(tc)` 自动从 EV_DATA 填充
- `appendEvReport(evId, agent, text, hi)` 运行时追加汇报
- 独立浮窗 `#win-ev-detail` 仍保留（通过 `openEvDetail(evId)` 调用）

---

### 浮动窗口通用机制

```javascript
openW(id)     // → el.classList.add('open')
closeW(id)    // → el.classList.remove('open')
bringFront(el) // z-index 提升到最前
startDrag(e, id)  // 所有 .fw 窗口的标题栏拖拽
```

`.fw` 默认 `display:none`，`.fw.open` → `display:flex`。

---

## events_data.js 说明

**只改这个文件就能新增事件/调查员/地图节点，不需要动主逻辑。**

| 数据对象 | 作用 |
|----------|------|
| `AGENTS{}` | 调查员：name/zone/cls/logId/style |
| `INVESTIGATOR_SILENCE{}` | 沉默超时阈值（warnThresh/critThresh，单位：游戏分钟） |
| `CALL_EVENTS[]` | 调度来电：triggerMin/agCode/report/options |
| `MAP_NODES[]` | 地图初始节点：id/type/label/name/left/top |
| `MAP_LINKS_INIT[]` | 地图初始连线：[nodeA,nodeB,color,opacity] |
| `EVENT_ESCALATION{}` | 事件自动升级规则 |
| `EVENT_CLOSURE{}` | 事件自动结案触发规则 |
| `COMM_FEED_INIT[]` | 开局通讯预填（空数组，预填在 HTML 硬写） |

---

## 已实现功能清单

- [x] 游戏时间（1秒=1游戏分钟，空格×10加速）
- [x] 时间调度系统（GT.scheduleAt）
- [x] 通讯终端：打字机效果 / 选项延迟 / 多窗口并排 / 最小化停靠
- [x] 来电流水线（右栏 #comm-feed-wrap）
- [x] 白板浮动任务卡：接取→评级→确认→资源面板内嵌展开
- [x] 任务卡内嵌事件摘要（三标签折叠区）
- [x] 任务卡就地结案（联动左栏索引）
- [x] 左栏纯索引模式（点击定位白板任务卡）
- [x] 事件评级：初判模糊徽章→确认→资源解锁
- [x] 支援派遣：磁吸拖拽（虚线预览→实线锁定→接入生成 sup-card）
- [x] sup-card SVG 连线（通过 data-ev 精确关联）
- [x] 自动派遣支援（对话选项触发 autoDispatchSupport）
- [x] 同事件同类型支援去重
- [x] 指派去重（AGENTS dict 为源，无重复）
- [x] 调查员指派全局追踪（AGENT_ASSIGNMENTS）
- [x] 指派冲突检测（弹出白板冲突卡，二选一）
- [x] 结案自动清除指派（resolveEvent 联动）
- [x] 调查员拖拽指派（右栏 cc-row → 白板事件节点，磁吸）
- [x] 非直属调查员显示（接取来电时自动追加）
- [x] 噪音事件完整流程（接取→指派→确认误报→归档）
- [x] 调查员沉默超时检测（bulletin 通报）
- [x] 事件自动升级（EVENT_ESCALATION）
- [x] 事件自动结案请求（EVENT_CLOSURE）
- [x] 调查员状态请求（防重复，scheduleAt 回报）
- [x] 系统通报浮层（bulletin，沉默/升级）
- [x] 情报标签（SVG 蓝点可视化）
- [x] 调查员节点点击：有通讯卡→滚动高亮；无→打开状态浮窗
- [x] 事件节点点击：高亮左栏对应条目
- [x] 邮箱系统（邮件列表/正文/未读徽章）
- [x] 档案库浮动窗口（文件/标记/归档）
- [x] 部门转接浮动窗口
- [x] 特遣队调度浮动窗口（三标签）
- [x] 地图：节点拖拽 / 平移 / 缩放（默认 100%）
- [x] SVG 连线（LINKS[] 动态增删，结案自动断线）
- [x] 字体缩放（zoom 滑块）

---

## 待实现

- [ ] 事件定性报告（填写类别+表现→隐性计数→代号命名）
- [ ] 调查深度隐性计数（累积解锁收容物新属性）
- [ ] 调查员污染/失联/死亡状态流转
- [ ] 干员池补充（定时触发，出现在来电列表）
- [ ] 职级恢复进度（隐性，上级邮件感知）
- [ ] 存档/读档（localStorage）
- [ ] 多班次循环（结班→交接→新班次）
- [ ] 地图框选打组
- [ ] `appendEvReport` 接入调查员对话回调流

---

## 历史坑与修复记录

| 坑 | 状态 |
|----|------|
| PowerShell 编码破坏（UTF-8→GBK） | 已修复（Python 重建） |
| `n:root` 拼写错误（CSS 变量全失效） | 已修复 |
| HTML div 多余 `</div>` 导致 `#main` 布局崩溃、右栏通讯卡不显示 | 已修复 |
| `let eta=42*60` + GT._ui() ETA 轮询遗留代码 | 已删除 |
| `SUPPORT_TYPES` + `prompt()` 旧支援系统 | 已删除（替换为磁吸拖拽） |
| `#support-toolbar` 死代码 HTML | 已删除 |
| `_supMode` / `handleNodeSupClick` 残留引用 | 已删除 |
| drawLinks 硬编码事件节点 ID | 已改为通过 `data-ev` 动态查找 |
| sup-card 坐标用屏幕坐标（位置偏移） | 已修复（直接用 map-inner 本地坐标） |
| JS 括号平衡 -1（多次重构导致孤立代码块） | 已修复（balance=0） |

---

## 快速调试

```javascript
// 浏览器控制台快速验证
GT.fmt()                          // 当前游戏时间
GT.scheduleAt({atDay:7,atHour:8,atMin:5}, ()=>toast('test','info'))
autoDispatchSupport('n-e031','medical')  // 手动触发支援派遣
openEvDetail('e031')              // 打开事件详情浮窗
queueCall(CALL_EVENTS[0])         // 立即触发第一个来电
```

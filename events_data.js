// ============================================================
// events_data.js — 所有事件内容数据，与引擎逻辑分离
// 修改此文件即可新增/调整事件，无需动 ui_prototype.html 主逻辑
// 格式说明见底部 【新增事件指南】
// ============================================================

// ── 调查员定义 ─────────────────────────────────────────────
// 键为两字母代号，值含显示名/当前区域/状态/日志ID
// style 字段：性格与语言风格简短描述，供剧情文案参考
const AGENTS = {
	'AV': {
		name: '艾娃·塞利克 #002',
		zone: 'ZONE-B · 第十一封信',
		cls:  'online',
		logId:'log-av',
		style:'沉稳、直接，措辞简练，有时显得过于冷静。偏向主动汇报，少问多观察。'
	},
	'LZ': {
		name: '林照野 #001',
		zone: 'ZONE-D · 值班室的人',
		cls:  'silent',
		logId:'log-lz',
		style:'寡言，回复往往只有一两句。不轻易表达情绪，但细节描述精确。停顿是他惯常的节奏。'
	},
	'RF': {
		name: '福斯 #003',
		zone: 'ZONE-C · 7号仓库',
		cls:  'warn',
		logId:'log-rf',
		style:'随和，讲实际，偶尔用俗语或比喻。不喜欢拖延，倾向尽快结案拿结论。'
	},
	'ZL': {
		name: '周磊 #004',
		zone: 'ZONE-A · 待命',
		cls:  'idle',
		logId:'log-zl',
		style:'谨慎，爱确认细节，有时显得啰嗦。习惯在不确定时反复复核再行动。'
	}
};

// ── 调查员沉默超时阈值 ──────────────────────────────────────
// lastContact 单位：游戏分钟（day*1440+hour*60+min）
// warnThresh / critThresh 超出后触发 bulletin 警告
const INVESTIGATOR_SILENCE = {
	'AV': { lastContact: 7*1440+3*60+26,  warnThresh:120, critThresh:240, warned:false, crited:false },
	'LZ': { lastContact: 1*1440+9*60+40,  warnThresh:120, critThresh:240, warned:false, crited:false },
	'RF': { lastContact: 5*1440+17*60+50, warnThresh:180, critThresh:360, warned:false, crited:false },
	'ZL': { lastContact: 6*1440+0*60+0,   warnThresh:180, critThresh:360, warned:false, crited:false }
};

// ── 调度来电事件 ────────────────────────────────────────────
// triggerMin = day*1440 + hour*60 + min（游戏绝对分钟）
// options[].type: 'normal' / 'warn'（warn=琥珀色高风险选项）
const CALL_EVENTS = [

	// =========================================================
	// 【正式事件】第十一封信 — 调查员艾娃 / EVT-031
	// =========================================================
	{
		id: 'call-av-1',
		agCode: 'AV',
		triggerMin: 7*1440+8*60+15,
		report: '接线员，这里是艾娃。\n\n第12封信今早出现了。收件人是同一栋楼的三户居民，邮戳显示的寄件地址不存在。\n\n信件内容经初步判读，存在重复短语结构，我怀疑是低阶模因载体。\n\n目前三名接触者均表现正常，但我需要指示——是否申请认知评估小组介入？',
		options: [
			{ text:'批准申请认知评估小组',       reply:'收到，我这就联系评估小组。保持观察，不要让接触者离开视线范围。', type:'normal' },
			{ text:'继续观察，暂缓申请',          reply:'明白。我会持续监控，24小时内再次回报。',                         type:'normal' },
			{ text:'要求提交信件样本后再决定',    reply:'了解。我会妥善封存一份样本，通过标准渠道送检，预计明天能有结果。', type:'warn'   }
		]
	},
	{
		id: 'call-av-2',
		agCode: 'AV',
		triggerMin: 7*1440+11*60+0,
		report: '接线员，紧急回报。\n\n第13封信到了。这次收件人包括我的线人——他刚才打电话给我，声音有些不对劲。\n\n我需要支援。',
		options: [
			{ text:'立即申请医疗支援待命',          reply:'收到。请确认你当前的坐标，支援预计40分钟后抵达。', type:'warn'   },
			{ text:'让线人远离现场，你继续监控',    reply:'明白，我来处理。如果有变化立刻联系你。',         type:'normal' },
			{ text:'请求状态报告，等待更多信息',    reply:'……好。我再观察一小时。',                         type:'normal' }
		]
	},

	// =========================================================
	// 【正式事件】值班室的人 — 调查员林照野 / EVT-029
	// =========================================================
	{
		id: 'call-lz-1',
		agCode: 'LZ',
		triggerMin: 7*1440+14*60+30,
		report: '……接线员。\n\n（沉默3秒）\n\n我在值班室找到了什么。\n\n你们说那个人失踪了——但失踪记录是伪造的。档案里有他的签名，日期是他"失踪"后第三天。\n\n我需要确认：基金会内部是否有人知道这件事？',
		options: [
			{ text:'告知正在核查，让他先撤离现场', reply:'（沉默）……好。',       type:'warn'   },
			{ text:'要求他继续收集证据',            reply:'明白。',               type:'normal' },
			{ text:'上报内部异常，申请核查',        reply:'……谢谢告知。',         type:'normal' }
		]
	},

	// =========================================================
	// 【噪音事件/低风险】7号仓库气味 — 调查员福斯 / EVT-026
	// =========================================================
	{
		id: 'call-rf-1',
		agCode: 'RF',
		triggerMin: 7*1440+16*60+0,
		report: '接线员，福斯报告。\n\n7号仓库情况已稳定，气味来源确认是腐坏的有机化肥，无异常。\n\n建议关闭本次调查，移交市政部门处理。',
		options: [
			{ text:'批准关闭，移交市政',            reply:'收到，感谢配合。我来办理档案归档。', type:'normal' },
			{ text:'要求进一步检查后再关闭',        reply:'……明白。我再查一遍。',               type:'warn'   },
			{ text:'批准关闭，但保留监控标记',      reply:'了解，我已记录。',                   type:'normal' }
		]
	}

	// =========================================================
	// 【新增事件模板，复制此块添加到上方】
	// {
	//   id: 'call-XX-N',                        // 唯一ID，格式：call-代号-序号
	//   agCode: 'XX',                             // 调查员代号，需与 AGENTS 中的键对应
	//   triggerMin: 7*1440+9*60+0,                // 触发时间（D+7 09:00）
	//   report: '接线员，……\n\n……',              // 调查员汇报内容（支持\n换行）
	//   options: [
	//     { text:'选项文本', reply:'调查员回复', type:'normal' },
	//     { text:'高风险选项', reply:'调查员回复', type:'warn' }
	//   ]
	// },
	// =========================================================
];

// ── 地图初始节点位置 ─────────────────────────────────────────
// 调查员节点（node-ag）和事件节点（node-ev）的初始坐标
// 修改这里的 left/top 即可调整地图初始布局
// spawnNodes() 在引擎初始化时被调用，动态写入 map-inner
const MAP_NODES = [
	// 调查员节点
	{ id:'n-av', type:'ag',    code:'AV', label:'AV', name:'艾娃 #002',   sub:'ZONE-B',  left:680, top:300, cls:'online' },
	{ id:'n-lz', type:'ag',    code:'LZ', label:'LZ', name:'林照野 #001', sub:'○ 沉默',  left:400, top:480, cls:'silent' },
	{ id:'n-rf', type:'ag-lv1',code:'RF', label:'RF', name:'福斯 #003',   sub:'待接异常',left:300, top:350, cls:'warn'   },
	{ id:'n-zl', type:'ag-lv1',code:'ZL', label:'ZL', name:'周磊 #004',   sub:'待命',    left:500, top:560, cls:'idle'   },
	// 事件节点
	{ id:'n-e031', type:'ev-hi',  label:'',   name:'第十一封信', sub:'EVT-031', subColor:'var(--red-dim)',   left:820, top:290 },
	{ id:'n-e029', type:'ev',     label:'',   name:'值班室的人', sub:'EVT-029', subColor:'var(--amber-dim)', left:430, top:600 },
	{ id:'n-e027', type:'ev',     label:'',   name:'X-17异响',   sub:'EVT-027', subColor:'var(--blue-dim)',  left:520, top:420 },
	{ id:'n-e026', type:'ev',     label:'',   name:'7号仓库气味',sub:'EVT-026', subColor:'var(--amber-dim)', left:200, top:350 },
	// 接管/驻点节点
	{ id:'n-x17', type:'xfer',   label:'ε6',  name:'X-17接管',   sub:'',        left:640, top:450, pulse:true }
];

// ── 地图初始连线 ─────────────────────────────────────────────
// 格式: [节点A-id, 节点B-id, 颜色hex, 透明度]
const MAP_LINKS_INIT = [
	['n-av',  'n-e031', '#ff4a4a', 0.5],
	['n-lz',  'n-e029', '#ffb84a', 0.4],
	['n-rf',  'n-e026', '#ffb84a', 0.3],
	['n-x17', 'n-e027', '#4ab8ff', 0.3]
];

// ── 事件自动升级规则 ─────────────────────────────────────────
// level 当前等级（0-based），interval 间隔分钟，maxLevel 上限
const EVENT_ESCALATION = {
	'n-e029': { name:'值班室的人',  level:0, lastEsc: 1*1440,         interval:240, maxLevel:3 },
	'n-e026': { name:'7号仓库气味', level:1, lastEsc: 5*1440+17*60,   interval:300, maxLevel:3 }
};

// ── 事件自动结案规则 ─────────────────────────────────────────
// noProgressMin 从0开始，每次_slowCheck+60；达到threshold触发结案申请
const EVENT_CLOSURE = {
	'n-e027': { name:'北区X-17异响', noProgressMin:0, threshold:480, requested:false }
};

// ── 右栏通讯流水线初始预填 ───────────────────────────────────
// 注意：开局的 cf-item 已直接写在 ui_prototype.html 的 #comm-feed 中
// 此数组为空，避免重复添加；需新增开局来电请直接在 HTML 里加 cf-item
// （或在此添加后删除 HTML 里对应的硬码条目）
const COMM_FEED_INIT = [];

// ============================================================
// 【新增事件指南】
// ─────────────────────────────────────────────────────────
// ① 新增调度通讯（调查员主动联系）：
//    在 CALL_EVENTS 数组末尾添加一个对象，填写 id/agCode/triggerMin/report/options
//    triggerMin 换算：日7第9小时30分 = 7*1440+9*60+30 = 10650+540+30 = 11120+30 = 11130
//
// ② 新增地图节点：
//    在 MAP_NODES 数组添加一项，type 可选：
//    'ag'(LV.2调查员) / 'ag-lv1'(LV.1) / 'ev'(普通事件) / 'ev-hi'(高危事件) / 'xfer'(接管节点)
//
// ③ 新增地图连线：
//    在 MAP_LINKS_INIT 数组添加 ['起点id','终点id','#颜色hex',透明度0-1]
//
// ④ 新增升级/结案规则：
//    在 EVENT_ESCALATION / EVENT_CLOSURE 字典中加键值对
//
// ⑤ 新增开局通讯预填：
//    在 COMM_FEED_INIT 数组添加项，agent 字段用于同源消息合并
// ============================================================

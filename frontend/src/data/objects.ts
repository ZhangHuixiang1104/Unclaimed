import type { ArchiveObject } from '../types/archive'

// Each fictional artifact carries its own investigation. Historical reading is thematic,
// never proof that an in-game object existed.
export const archiveObjects: ArchiveObject[] = [
  {
    key: 'list', order: 1, name: '被雨水浸过的名单', archiveNo: 'LZ-1936-07-01',
    subtitle: '第三项转送事项，缺了一角的姓名栏',
    historicalNode: 'tucheng', historicalLabel: '土城战役后的伤员救护',
    interactionType: 'name-restorer', accent: '#8c5b48', silhouette: '名',
    intro: '一张虚构的行军转送单散成三片。器材与物料之后，第三行写着两位后随者。把纸接回去，看看记录在哪里停笔。',
    investigationQuestion: '这页纸能为两位后随者留下些什么？又有哪些后来必须留白？',
    nextHook: '名单的另一页仍未找到。下一份行军图有自己的故事，不替这张纸写结局。',
    artNote: '游戏名单纯属虚构。已接入散片拼合、正反手写纸面、清泥与线索卡；素材清晰度和浏览器实机验收仍待完成。',
    artifactFront: ['转送事项', '转一　器材　⊡', '转二　备用物料　⊡', '转三　后随二人　□', '姓名　〔纸角缺失〕'],
    artifactBack: ['开口框：待交接；框内加点：已有接收记录', '回执另存', '随借〔缺失〕交回'],
    clues: [
      { id: 'list-task', side: 'front', title: '人写在物品之后', description: '器材与物料之后，第三项写着后随二人；姓名所在的纸角已经不在。', position: { x: 44, y: 57 } },
      { id: 'list-key', side: 'back', title: '没有合上的方框', description: '这页纸在第三项停于待交接，但没有写出后来的结局。', position: { x: 55, y: 47 } },
      { id: 'list-stub', side: 'back', title: '不在这里的回执', description: '纸上指向另一份记录；眼前的三片纸没有给出回执内容。', position: { x: 39, y: 63 } },
    ],
    conclusions: [
      { id: 'list-c1', screeningQuestion: '“转三”是否登记了两位后随者？', text: '“转三”登记了两位后随者。', expectedLevel: 'confirmed', explanation: '文字直接写有“后随二人”，但没有姓名。' },
      { id: 'list-c2', screeningQuestion: '开口框能证明任务已完成吗？', text: '此时的“转三”仍待交接。', expectedLevel: 'confirmed', explanation: '背面注记明确说明开口框的含义。' },
      { id: 'list-c3', screeningQuestion: '能否凭缺失姓名栏确认两人身份？', text: '可以确认这两位后随者的姓名。', expectedLevel: 'unknown', explanation: '缺失栏位无法辨认，不能补造姓名。' },
    ],
    screeningDecoys: [
      { id: 'list-d1', text: '能否认定开口框代表两人已经牺牲？' },
      { id: 'list-d2', text: '能否认定游戏名单就是土城真实红军手迹？' },
    ],
  },
  {
    key: 'map', order: 2, name: '停在河前的行军图', archiveNo: 'LZ-1936-07-02',
    subtitle: '四层笔迹，最后一线停在高地',
    historicalNode: 'jinsha', historicalLabel: '从四渡赤水到金沙江',
    interactionType: 'route-rebuilder', accent: '#817342', silhouette: '图',
    intro: '无名河谷的小图上，几条线不断被改写。最后一笔没有越河，而是停在高处。',
    investigationQuestion: '每一次停笔之前，画图的人又知道了什么？',
    nextHook: '这张图没有替人写下渡河结局。下一件器材也留下了使用与修补的痕迹。',
    artNote: '原创虚构行路小图；正反纸张、手写文字和四层路线已接入。图中地点不对应真实战役。',
    artifactFront: ['营地、沟口、西坡、北滩、下滩与高地', '四层墨线与一处未越河的收笔'],
    artifactBack: ['沟口落石，绕行', '北滩水涨，船未至', '下滩水急，未报可渡', '探路未回，暂不放行'],
    clues: [
      { id: 'map-near-route', side: 'front', title: '近路被改', description: '最淡的一笔原本向北滩；沟口落石的回报，让后画的线绕上西坡。只能看到拟行线，不能证明他们走过近路。', position: { x: 35, y: 62 } },
      { id: 'map-north-bank', side: 'front', title: '渡口没有船', description: '绕开沟口，北滩仍是目的地；背面却写着水涨、船未至。那是此刻的记录，并非永久没有船。', position: { x: 69, y: 30 } },
      { id: 'map-lower-bank', side: 'front', title: '另一处也没有答案', description: '一条新线试着向下滩探去，却止于岸前。水急且尚未报可渡，断笔不能被说成遇难。', position: { x: 68, y: 63 } },
      { id: 'map-crossing', side: 'front', title: '在高处等信', description: '最后一层笔迹从水边收向高地；背面写着探路未回、暂不放行。谁画图、后来是否渡河，纸上都没有答案。', position: { x: 45, y: 39 } },
    ],
    conclusions: [
      { id: 'map-c1', screeningQuestion: '纸上最后可见的安排是什么？', text: '最后的线停在高地，背注要求暂不放行、等信再定。', expectedLevel: 'confirmed', explanation: '末层笔迹与背注可以相互核对。' },
      { id: 'map-c2', screeningQuestion: '可以由这张图确定队伍后来是否渡江吗？', text: '队伍最后已经渡过河流。', expectedLevel: 'unknown', explanation: '江北栏空白，图上没有渡河完成记录。' },
      { id: 'map-c3', screeningQuestion: '被擦淡的近路证明什么？', text: '近路曾被画出并修改；是否真的走过仍未知。', expectedLevel: 'confirmed', explanation: '书写先后可见，实际脚步没有留下足够证据。' },
    ],
    screeningDecoys: [
      { id: 'map-d1', text: '能否将四层墨线分别指认为四渡赤水的四次渡河？' },
      { id: 'map-d2', text: '能否凭断笔推断探路者遇难？' },
    ],
  },
  {
    key: 'battery', order: 3, name: '用布缠过的电池盒', archiveNo: 'LZ-1936-07-03',
    subtitle: '三层布条，修了又修的接线端',
    historicalNode: 'communication', historicalLabel: '长征中的通信保障',
    interactionType: 'material-check', accent: '#9b694c', silhouette: '电',
    intro: '布条缠了三层，接线端有被打磨过的痕迹。一次次修补究竟能证明什么？',
    investigationQuestion: '它是否被多次维修；外壳数字又能否指认使用者？',
    nextHook: '器材留下了维修层次。下一件草鞋，同样被人一补再补。',
    artNote: '虚构电池盒；正式版需盒体、布条层次、接线端与刻痕特写。',
    artifactFront: ['布条缠绕三层　／　压痕不一致', '接线端受潮，局部重新打磨'],
    artifactBack: ['外壳刻着三个不完整的数字', '内侧有反复开合留下的磨损', '未见姓名与明确用途记录'],
    clues: [
      { id: 'battery-cut', side: 'front', title: '三层布条', description: '新旧缠法和压痕不同，显示反复修补。', position: { x: 28, y: 30 } },
      { id: 'battery-first', side: 'front', title: '重新打磨的接线端', description: '接线端附近有受潮与重新处理的痕迹。', position: { x: 70, y: 48 } },
      { id: 'battery-slip', side: 'back', title: '不完整数字', description: '刻痕可以看见，但没有资料解释数字的意义。', position: { x: 48, y: 74 } },
    ],
    conclusions: [
      { id: 'battery-c1', screeningQuestion: '盒体是否经历多次维修？', text: '电池盒有多次维修和继续使用的痕迹。', expectedLevel: 'confirmed', explanation: '布条层次和接线端磨损可以直接观察。' },
      { id: 'battery-c2', screeningQuestion: '使用者可能掌握什么技能？', text: '修补者可能懂得基础器材维护。', expectedLevel: 'inferred', explanation: '维修方式支持推测，但不能确认其身份或职责。' },
      { id: 'battery-c3', screeningQuestion: '刻痕能否指认一位使用者？', text: '盒上的数字就是使用者编号。', expectedLevel: 'unknown', explanation: '数字的用途没有可核对的旁证。' },
    ],
    screeningDecoys: [
      { id: 'battery-d1', text: '能否凭维修痕迹认定这件器材属于某位真实人物？' },
      { id: 'battery-d2', text: '三层布条能否证明恰好只修过三次？' },
    ],
  },
  {
    key: 'shoes', order: 4, name: '被反复修补的草鞋', archiveNo: 'LZ-1936-07-04',
    subtitle: '两只不成双的鞋，留下不同脚步',
    historicalNode: 'snowfield', historicalLabel: '雪山草地的行军生活',
    interactionType: 'shoe-repair', accent: '#68704d', silhouette: '鞋',
    intro: '档案把它们记成“一双”，两只鞋的大小、磨损和补料却并不相同。',
    investigationQuestion: '它们真是一双吗？又能否由此认出穿鞋的人？',
    nextHook: '鞋履不能替人写出姓名。最后一只饭碗，也留下了容易被误读的记号。',
    artNote: '虚构草鞋；正式版需两只鞋的正反面、鞋底磨损与异色补料。',
    artifactFront: ['两只草鞋，一大一小', '编织松紧与磨损位置不同', '其中一只补过多次'],
    artifactBack: ['两只鞋底的磨损方向不一致', '补料颜色和旧草绳不同', '没有使用者的名字'],
    clues: [
      { id: 'shoes-patch', side: 'front', title: '尺寸差异', description: '两只鞋的长度与宽度明显不同。', position: { x: 31, y: 37 } },
      { id: 'shoes-slip', side: 'front', title: '异色补料', description: '旧编织与后补的材料、颜色并不一致。', position: { x: 68, y: 54 } },
      { id: 'shoes-care', side: 'back', title: '不同的鞋底磨损', description: '两只鞋的受力区域并不相同。', position: { x: 48, y: 76 } },
    ],
    conclusions: [
      { id: 'shoes-c1', screeningQuestion: '两只鞋是否具有相同的使用痕迹？', text: '两只鞋的尺寸与磨损方式不同。', expectedLevel: 'confirmed', explanation: '尺寸和鞋底受力位置可以直接比较。' },
      { id: 'shoes-c2', screeningQuestion: '它们可能来自几位穿鞋者？', text: '它们可能曾由不同的人穿过。', expectedLevel: 'inferred', explanation: '差异支持这种解释，但旧鞋也可能被转手。' },
      { id: 'shoes-c3', screeningQuestion: '可以确定穿鞋的人是谁吗？', text: '可以确定两只鞋分别属于哪位行军者。', expectedLevel: 'unknown', explanation: '没有姓名、编号或可靠来源。' },
    ],
    screeningDecoys: [
      { id: 'shoes-d1', text: '能否认定一大一小就证明穿鞋者是亲属？' },
      { id: 'shoes-d2', text: '能否由补料推定草鞋来自某次具体战斗？' },
    ],
  },
  {
    key: 'bowl', order: 5, name: '有两个刻痕的饭碗', archiveNo: 'LZ-1936-07-05',
    subtitle: '两个刻痕，不能轻易写成两个人名',
    historicalNode: 'daily-life', historicalLabel: '长征中的日常供给与互助',
    interactionType: 'mark-comparison', accent: '#76675d', silhouette: '碗',
    intro: '碗底的两道刻痕方向不同，一道还被后来的修补压住。相似的形状不一定是名字。',
    investigationQuestion: '它被怎样使用和修补过？刻痕能否指认主人？',
    nextHook: '五份调查各自留有已知与未知。把证据保存好，再写下你的展签。',
    artNote: '虚构饭碗；正式版需碗底双刻痕、三层修补与拓印效果。',
    artifactFront: ['碗沿有多处旧修补', '碗底两道方向不同的刻痕', '一道刻痕部分压在补痕下'],
    artifactBack: ['底部磨损深浅不一', '修补层次可以区分先后', '没有姓名或归属登记'],
    clues: [
      { id: 'bowl-marks', side: 'front', title: '方向不同的两道刻痕', description: '笔画相似却未必对应同一种记号。', position: { x: 34, y: 37 } },
      { id: 'bowl-note', side: 'front', title: '被修补覆盖的痕迹', description: '较早的一道刻痕被后来的修补压住。', position: { x: 67, y: 52 } },
      { id: 'bowl-receipt', side: 'back', title: '碗底的多层修补', description: '几处补痕与磨损层次显示这只碗被长期使用。', position: { x: 47, y: 76 } },
    ],
    conclusions: [
      { id: 'bowl-c1', screeningQuestion: '碗是否被长期使用和修补？', text: '这只碗经过长期使用与多次修补。', expectedLevel: 'confirmed', explanation: '修补层次与磨损可以直接观察。' },
      { id: 'bowl-c2', screeningQuestion: '两道刻痕可能意味着什么？', text: '这只碗可能经过不止一人的手。', expectedLevel: 'inferred', explanation: '记号及修补时间差支持推测，但不是确定的流转记录。' },
      { id: 'bowl-c3', screeningQuestion: '刻痕能够指向具体人物吗？', text: '两道刻痕对应两位已知人物。', expectedLevel: 'unknown', explanation: '形状相似不足以确认人物身份。' },
    ],
    screeningDecoys: [
      { id: 'bowl-d1', text: '能否把两道刻痕直接写成两位具体的主人？' },
      { id: 'bowl-d2', text: '能否把这只游戏饭碗当成真实馆藏？' },
    ],
  },
]

export const objectByKey = (key: string) => archiveObjects.find((item) => item.key === key)

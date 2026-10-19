export interface HistoryMaterial {
  code: string
  title: string
  type: string
  description: string
  url?: string
}

export interface HistoryRecordContent {
  period: string
  summary: string
  relation: string
  boundary: string
  materials: HistoryMaterial[]
}

// Historical reading is thematic. The five fictional objects must never be
// presented as excavated artifacts or as stops on one documented march route.
export const historyRecords: Record<string, HistoryRecordContent> = {
  list: {
    period: '1935年 · 土城战役后',
    summary: '真实的土城战役红军手迹，记录了七名伤员在四面山一带得到照护的经历；后续地址附页、家庭保存和文物入藏，也有各自的报道与材料。它与游戏名单只在“照护与记录”的主题上呼应。',
    relation: '“转三”“后随二人”、缺角名单及“回执另存”悬念均是名单章节的虚构叙事。真实手迹不是游戏名单的原件、续页或背面。',
    boundary: '史实材料有人名、地点与独立来源；游戏名单刻意不填姓名。玩家读到的是虚构纸件的待交接与留白，不能拿它解释真实手迹。',
    materials: [
      { code: 'A-01', title: '名单三幕故事手账', type: '游戏生成材料', description: '保存玩家从第三行、背面图例与回执裁口读到的三幕故事。' },
      { code: 'A-02', title: '名单故事边界', type: '游戏生成材料', description: '保留此页待交接、回执另存，以及姓名和结局未知的边界。' },
      { code: 'H-01', title: '转送与养伤地点', type: '实地走访报道', description: '2018年重庆日报对手迹所述地点的走访。今景照片不能代替1935年现场影像。', url: 'https://dangshi.people.com.cn/n1/2018/0823/c85037-30247089.html' },
      { code: 'H-02', title: '手迹原件与照护记录', type: '文物研究报道', description: '真实手迹与游戏名单没有原件、续页或人物对应关系；报道中的整理译文不能替代原件。', url: 'https://news.cqjjnet.com/web/aritcle/1365986817104867328/web/content_1365986817104867328.html' },
      { code: 'H-03', title: '1943年地址附页', type: '后续寻访报道', description: '报道记载的真实附页不是游戏中的另存回执。', url: 'https://cq.people.com.cn/n2/2024/0125/c367698-40725931.html' },
      { code: 'H-04', title: '保存、入藏与后人寻访', type: '后续寻访报道', description: '从家庭保存到公共收藏，报道记录了人们如何重新认识这份手迹。', url: 'https://cq.people.com.cn/n2/2024/0125/c367698-40725931.html' },
    ],
  },
  map: {
    period: '1935年 · 从赤水到金沙江',
    summary: '四渡赤水、南渡乌江、入滇与金沙江渡河，有可核对的时间、地点与材料。路线随着消息、地形和摆渡条件改变。',
    relation: '无名河谷小图与四层笔迹是原创虚构。史实展柜阅读真实路线变化、地图资料和皎平渡船工，不把历史当作游戏队伍的结局。',
    boundary: '游戏四层墨线不对应四渡赤水的四次渡河，也不对应龙街渡、洪门渡、皎平渡的具体方位。原创后制图并非历史原件。',
    materials: [
      { code: 'A-01', title: '小图四段故事手账', type: '游戏生成材料', description: '保存沟口、北滩、下滩和高地四次变动的因果；无真实地名。' },
      { code: 'A-02', title: '纸上结局边界', type: '游戏生成材料', description: '末层止于高地，江北栏空白；不能补写最终渡河结果。' },
      { code: 'H-01', title: '四渡赤水至金沙江的阶段', type: '党史大事记', description: '核对1935年1—5月的主要时间关系。', url: 'https://gxt.hunan.gov.cn/gxt/syzt/dsxxjy/dsydyy/dsdsj/202103/t20210329_15075565.html' },
      { code: 'H-02', title: '关下村截获地图报道', type: '实地采访报道', description: '报道提及1935年截获的云南军用地图与后来陈列的副本。', url: 'https://dangshi.people.com.cn/n1/2019/0725/c85037-31254648.html' },
      { code: 'H-03', title: '金沙江渡口条件', type: '军事地理解读', description: '核对龙街、洪门与皎平渡不同条件，不能等同游戏河滩。', url: 'https://www.news.cn/20260917/12f46b49a5914e54a7952bf1d52bb326/c.html' },
      { code: 'H-04', title: '皎平渡船工', type: '采访报道', description: '阅读船工参与摆渡的记述；人数与船数须留意来源口径。', url: 'https://dangshi.people.com.cn/n1/2019/0723/c85037-31251766.html' },
    ],
  },
  battery: {
    period: '长征期间 · 通信保障',
    summary: '通信器材的携行、维护和交接可以帮助理解长途行军中的协同困难。这里呈现的是主题背景，不将某只电池盒指认为真实文物。',
    relation: '三层布条、接线端磨损与不完整数字构成电池盒自身的虚构调查；它不是名单任务的器材交接证明。',
    boundary: '通信保障是历史阅读主题；盒体、纸条、编号和具体使用者是艺术化叙事，不能据此指认真实人物。',
    materials: [
      { code: 'A-01', title: '维修层次记录', type: '游戏生成材料', description: '保存布条、接线端和数字刻痕的观察。' },
      { code: 'A-02', title: '使用者推断边界', type: '游戏生成材料', description: '维修可见，具体使用者与刻痕意义仍未知。' },
    ],
  },
  shoes: {
    period: '长征期间 · 行军生活',
    summary: '鞋履修补与物资再利用，是理解长途行军日常生活的一种尺度。本章以此为阅读主题，不为虚构的两只草鞋指定真实主人。',
    relation: '两只尺寸与磨损不同的草鞋构成独立的归属疑问；不与名单或电池盒拼成同一张交接单。',
    boundary: '历史上的行军艰苦与虚构草鞋应分开展示；尺寸不同不能直接推出穿鞋者的姓名或关系。',
    materials: [
      { code: 'A-01', title: '鞋履痕迹对照', type: '游戏生成材料', description: '比较尺寸、鞋底受力和异色补料。' },
      { code: 'A-02', title: '归属推断边界', type: '游戏生成材料', description: '区分可能由不同人穿过与能够确认具体身份。' },
    ],
  },
  bowl: {
    period: '长征期间 · 日常供给与互助',
    summary: '日常供给与器物反复使用，是理解长征生活的主题之一。本章历史阅读不宣称游戏饭碗真实存在。',
    relation: '碗底双刻痕与多层修补是独立的虚构物件谜题；它既不是名单回执，也不能指认真实主人。',
    boundary: '游戏饭碗并非真实馆藏；刻痕相似不等于姓名或身份一致，也不能附会到土城真实手迹上。',
    materials: [
      { code: 'A-01', title: '刻痕与修补记录', type: '游戏生成材料', description: '记录两道刻痕方向与修补覆盖的先后。' },
      { code: 'A-02', title: '主人推断边界', type: '游戏生成材料', description: '长期使用可以确认，具体主人仍无从指认。' },
    ],
  },
}

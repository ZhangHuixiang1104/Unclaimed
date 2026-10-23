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
    summary: '通信保障不只是机器本身：收发、能源、维护、携行和记住这段经历的人，都有独立材料可查。',
    relation: '游戏里的电池盒、布带、擦痕和短笺都是虚构；史实页分别阅读通信体系、蔡威维修旧电瓶与谢宝金守护手摇发电机的报道。不同部队、人物和器物不能拼成同一件盒子的履历。',
    boundary: '68公斤是报道中手摇发电机的重量，不是游戏电池盒。虚构短笺的“试用结果”仍空白，史实材料不能替它填上“已通”。',
    materials: [
      { code: 'A-01', title: '电池盒四段故事手账', type: '游戏生成材料', description: '旧带、接点、短笺与空栏组成一段原创虚构的维护故事。' },
      { code: 'A-02', title: '试用结果的留白', type: '游戏生成材料', description: '有人留下再试的打算；供电是否成功、谁继续使用，均无从确认。' },
      { code: 'H-01', title: '红军无线电队与通信材料厂', type: '通信史文章', description: '中国军网梳理电台、装配和维修能力；不同设备的能源配置不能压成同一线路。', url: 'https://photo.81.cn/zhuanti/2016-09/23/content_7273348_4.htm' },
      { code: 'H-02', title: '蔡威重做旧电瓶铅板', type: '人物事迹报道', description: '红四方面军通信保障中的维修事例，不是游戏盒或谢宝金发电机的履历。', url: 'https://dangshi.people.com.cn/n1/2022/0104/c436975-32323284.html' },
      { code: 'H-03', title: '谢宝金守护手摇发电机', type: '当代报道', description: '报道记述68公斤手摇发电机的携行。重量与人名只属于这件真实器物。', url: 'https://cpc.people.com.cn/n1/2026/0614/c443712-40739888.html' },
      { code: 'H-04', title: '多年后在军博重见发电机', type: '家属采访', description: '央视网记录谢林贵的回忆；这是后来的采访，不是当年现场影像。', url: 'https://news.cctv.com/2016/09/10/ARTI99Jy7rfn7m2R5Exc9GmD160910.shtml' },
    ],
  },
  shoes: {
    period: '1934—1935 · 于都出发与长征途中',
    summary: '草鞋既是远征中需要不断供给的鞋履，也可能是一个人珍惜并长久保存的记忆。谢志坚与春秀的真实绣球草鞋有独立报道和馆藏信息。',
    relation: '游戏里尺寸、补编和磨损不同的两只旧鞋是原创虚构；史实展柜阅读草鞋供给、春秀赠鞋、谢志坚的穿用和后来的陈列，不能把这段真实经历当作游戏物件的主人答案。',
    boundary: '据报道，真实绣球草鞋只穿过两次，不是游戏里两只反复修补的不成双草鞋。红绣球也仅属于真实文物的报道，不出现在游戏鞋上。',
    materials: [
      { code: 'A-01', title: '《不成双》四段故事手账', type: '游戏生成材料', description: '记录尺寸、补编、磨损和外绳所能说出的虚构故事。' },
      { code: 'A-02', title: '不能替它们写下的姓名', type: '游戏生成材料', description: '并置保存可以确认；原先如何同行、谁穿过、为何留存仍未知。' },
      { code: 'H-01', title: '长征出发时的草鞋供给', type: '公开报道', description: '央视网报道于都群众赶制草鞋。数量为该报道口径，不推成全部长征时期的用量。', url: 'https://news.cctv.com/2026/10/21/ARTI10MD7EZiTOlYTFaDZnyx261019.shtml' },
      { code: 'H-02', title: '春秀在于都赠鞋', type: '地方文史报道', description: '于都县政府介绍黄麻绣球草鞋和谢志坚、春秀的故事。', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml' },
      { code: 'H-03', title: '只穿过两次的记录', type: '公开报道', description: '于都县政府与央视网分别记载谢志坚在金沙江、大渡河相关行动中穿用草鞋。', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml' },
      { code: 'H-04', title: '红绣球与后来的陈列', type: '地方文史报道', description: '于都县政府记载尺寸、材质、上世纪80年代系绣球与捐赠。馆藏/借展口径以原文为准。', url: 'https://www.yudu.gov.cn/yudu/ydrw/202407/5145dce6d37c4875a07fa364de8e6c5f.shtml' },
    ],
  },
  bowl: {
    period: '1934年—2026年 · 仁化红军碗',
    summary: '据公开报道，红军徐排长在仁化得到蒙家照料，临别留下瓷碗；蒙家五代人保存，后来捐赠并展出。',
    relation: '游戏旧碗、修补、两道痕迹及包纸是原创虚构；真实仁化红军碗有自己的来历，不能被用来给游戏碗找主人。',
    boundary: '史实来自公开报道，不是本团队查验的馆藏原始档案。报道对疗养时长及家族称谓有差异；徐排长的完整身份与最终去向未获确认。',
    materials: [
      { code: 'A-01', title: '《留给后来的人》四段手账', type: '游戏生成材料', description: '记录包纸、修补、碗底浅痕与留用嘱咐。均为原创虚构。' },
      { code: 'A-02', title: '没有署名的展签', type: '游戏生成材料', description: '使用者、写字者和嘱咐后续没有记录，不能由痕迹补写姓名。' },
      { code: 'H-01', title: '长征队伍经过仁化', type: '公开采访报道', description: '核对仁化城口、半山村与故事发生地；不对应游戏行军图。', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
      { code: 'H-02', title: '蒙家照顾受伤的徐排长', type: '公开采访报道', description: '记载蒙家财、黄乙秀采药、煮饭、烧水等照护；疗养天数以不同来源分别核对。', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
      { code: 'H-03', title: '临别赠碗与未竟的许诺', type: '公开采访报道', description: '真实瓷碗曾用于吃饭和饮药；报道对临别原话有不同表述，此处只转述意思。', url: 'https://epaper.gmw.cn/gmrb/html/2019-06/26/nw.D110000gmrb_20190626_3-06.htm' },
      { code: 'H-04', title: '五代守护、捐赠与展出', type: '新华社报道', description: '2019年捐赠仁化县史志办公室，新华社2026年报道移至纪念馆展出；未据此推断徐排长的最终去向。', url: 'https://www.news.cn/20260917/976e90392e504a5db5e6f1a32a4b7526/c.html' },
    ],
  },
}

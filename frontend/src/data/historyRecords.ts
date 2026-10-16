export interface HistoryMaterial {
  code: string
  title: string
  type: string
  description: string
}

export interface HistoryRecordContent {
  period: string
  summary: string
  relation: string
  boundary: string
  materials: HistoryMaterial[]
}

export const historyRecords: Record<string, HistoryRecordContent> = {
  list: {
    period: '1934年冬',
    summary: '中央红军突破湘江后，人员、物资与建制都经历了极为艰难的整理。名单、登记页与沿途形成的记录，是理解普通参与者处境的重要线索。',
    relation: '这页名单并非一件已经确认来源的历史文物。作品从水渍、折痕和修补痕迹出发，让玩家体验“先确认痕迹，再讨论身份”的档案工作方法。',
    boundary: '湘江战役及其后的行军背景属于史实；名单的具体保存者、姓名和个人经历仍然未知，不能由物件痕迹直接推定。',
    materials: [
      { code: 'A-01', title: '物件痕迹记录', type: '调查生成材料', description: '汇总玩家标记的折痕、笔迹凹痕与纸角修补，并保留发现位置。' },
      { code: 'A-02', title: '证据判断表', type: '调查生成材料', description: '记录哪些结论可以确认、哪些只是合理推测，以及仍不能回答的问题。' },
      { code: 'H-01', title: '湘江之后背景资料', type: '史实材料位', description: '用于接入团队核验后的战役背景、路线资料、文献出处与图片授权信息。' },
    ],
  },
  map: {
    period: '1935年初',
    summary: '遵义会议前后，中央红军在黔北及赤水河流域展开机动作战，行军方向随敌情和战局多次调整。路线的变化本身，是理解这一阶段的重要入口。',
    relation: '作品中的行军图用多层墨迹表现路线不断修订，但绘图者、修改时间和真实用途都没有被虚构为确定答案。',
    boundary: '相关军事行动与路线变化属于史实；这张虚构物件与某次具体行动之间不存在可直接确认的对应关系。',
    materials: [
      { code: 'A-01', title: '墨色层次记录', type: '调查生成材料', description: '保存四层路线的覆盖顺序、河流定位点和擦除痕迹。' },
      { code: 'A-02', title: '路线判断表', type: '调查生成材料', description: '区分分阶段绘制的证据与对绘图者身份的猜测。' },
      { code: 'H-01', title: '遵义与赤水路线资料', type: '史实材料位', description: '等待接入经团队核验的路线图、时间表和权威出处。' },
    ],
  },
  battery: {
    period: '1935年春夏',
    summary: '长途行军中的通信依赖设备、线路与通信人员共同维系。反复维修和有限条件下的继续使用，能够帮助观众理解通信保障的困难。',
    relation: '电池盒上的布条、腐蚀和刻痕用于构成调查谜题，不对应某位已经确认的历史人物。',
    boundary: '长征中的通信保障属于史实背景；电池盒的具体使用者和刻痕含义在作品中保持未知。',
    materials: [
      { code: 'A-01', title: '维修层次记录', type: '调查生成材料', description: '记录三层布条、接线端腐蚀和外壳刻痕。' },
      { code: 'A-02', title: '通信推断表', type: '调查生成材料', description: '展示物件证据能够支持的范围。' },
      { code: 'H-01', title: '大渡河畔通信资料', type: '史实材料位', description: '等待接入通信工作与相关路线的核验材料。' },
    ],
  },
  shoes: {
    period: '1935—1936年',
    summary: '翻越雪山、穿越草地是长征中极端艰苦的行军阶段。鞋履、补料与磨损可以成为观察个体处境的微小入口。',
    relation: '两只不完全匹配的草鞋构成“是否属于同一人”的问题，但作品不会替玩家把动人的猜想写成事实。',
    boundary: '雪山草地的行军困难属于史实；两只鞋是否曾经流转、交换以及使用者是谁，均无法确认。',
    materials: [
      { code: 'A-01', title: '鞋底磨损记录', type: '调查生成材料', description: '对照尺寸、受力区域和不同阶段的补料。' },
      { code: 'A-02', title: '使用者推断表', type: '调查生成材料', description: '保留多个可能解释，不把叙事愿望当作结论。' },
      { code: 'H-01', title: '雪山草地背景资料', type: '史实材料位', description: '等待接入经核验的行军回忆、图片与文献。' },
    ],
  },
  bowl: {
    period: '1936年秋',
    summary: '1936年秋，红军三大主力在会宁等地会师。长期行军中反复使用和修补的生活器物，为宏大路线留下了日常尺度。',
    relation: '饭碗上的两个刻痕制造了身份悬念，但相似笔画并不足以证明它们对应两位已知人物。',
    boundary: '会宁会师属于史实；饭碗的流转经历、刻痕含义和主人身份属于无法确认的艺术化设问。',
    materials: [
      { code: 'A-01', title: '刻痕拓印记录', type: '调查生成材料', description: '对照两处刻痕方向和修补覆盖关系。' },
      { code: 'A-02', title: '流转推断表', type: '调查生成材料', description: '区分长期使用的证据与人物身份猜测。' },
      { code: 'H-01', title: '会宁节点背景资料', type: '史实材料位', description: '等待接入会师相关的时间、路线和权威出处。' },
    ],
  },
}

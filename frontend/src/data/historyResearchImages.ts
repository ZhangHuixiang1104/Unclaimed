import listOriginal from '../../../stuffs/名单/史实资料/images/01-手迹原件-三峡博物馆供图.jpg'
import listTranslation from '../../../stuffs/名单/史实资料/images/02-手迹与整理译文-江津融媒体.jpg'
import listBridge from '../../../stuffs/名单/史实资料/images/05-四面山红军桥.jpg'
import listCollection from '../../../stuffs/名单/史实资料/images/08-吴贞和肖像与三峡博物馆收藏证书.jpg'
import listTemple from '../../../stuffs/名单/史实资料/images/13-金龙寺疗伤院与石岩寨后门.jpg'
import mapMuseumMap from '../../../stuffs/行军图/史实资料/images/02-三元宫陈列的十万分之一曲靖军用地图.jpg'
import mapBoatmenDisplay from '../../../stuffs/行军图/史实资料/images/19-杉乐纪念馆37名船工名单展板.jpg'
import mapLongjieToday from '../../../stuffs/行军图/史实资料/images/27-龙街渡宽阔江面航拍无遮蔽.jpg'
import batteryGenerator from '../../../stuffs/电池盒/史实材料/images/01-手摇发电机原件-军事博物馆-国防报配图.jpg'
import batteryMemory from '../../../stuffs/电池盒/史实材料/images/09-云鉴馆藏手摇发电机海报-中国文明网.jpg'
import batteryRadio from '../../../stuffs/电池盒/史实材料/images/17-王诤1955年中将肖像.jpg'
import shoesDisplay from '../../../stuffs/草鞋/史实材料/images/01-绣球草鞋展柜-中央红军长征出发纪念馆-央视.jpg'
import shoesDetail from '../../../stuffs/草鞋/史实材料/images/02-绣球草鞋黑白特写-中国军网.jpg'
import shoesLabel from '../../../stuffs/草鞋/史实材料/images/04-绣球草鞋与说明牌-中青在线.jpg'
import shoesPortrait from '../../../stuffs/草鞋/史实材料/images/10-谢志坚肖像与草鞋-央视2026.jpg'
import bowlDetail from '../../../stuffs/饭碗/史实材料/images/01-红军碗实物特写-南方+.jpg'
import bowlDisplay from '../../../stuffs/饭碗/史实材料/images/02-红军碗展柜-红军长征粤北纪念馆-新华社.jpg'
import bowlStreet from '../../../stuffs/饭碗/史实材料/images/03-城口镇红军街-新华社.jpg'

export const historyResearchImages = {
  list: { original: listOriginal, translation: listTranslation, bridge: listBridge, collection: listCollection, temple: listTemple },
  map: { museumMap: mapMuseumMap, boatmenDisplay: mapBoatmenDisplay, longjieToday: mapLongjieToday },
  battery: { generator: batteryGenerator, memory: batteryMemory, radio: batteryRadio },
  shoes: { display: shoesDisplay, detail: shoesDetail, label: shoesLabel, portrait: shoesPortrait },
  bowl: { detail: bowlDetail, display: bowlDisplay, street: bowlStreet },
} as const

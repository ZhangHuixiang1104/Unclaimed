# 章节物品 PNG

这里的 PNG 由项目已有美术图层合成，不包含史实照片。

- `preview-*.png`：五件物品的档案室展示图，裁去透明外边距，显示时保持原始比例。
- `list-front/back.png`：名单的正反面完整图；拼片裁切、泥点擦除和点击区保留在交互组件中。
- `map-front-1..4.png`、`map-back.png`：行军图的四层笔迹与背面；坐标保持 1600 × 1000。
- `map-ruler.png`：描图尺。

原始输入与图层位置记录在 `scripts/object-art-layers.json`。修改母版后，在可加载 `sharp` 的 Node 环境中从项目根目录运行 `node scripts/render-object-art.cjs` 重建。不要改变名单 1448 × 1086、行军图 1600 × 1000 的交互画布尺寸。

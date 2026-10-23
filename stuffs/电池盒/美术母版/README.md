# 电池盒美术母版目录

本目录收录**首批完整电池盒美术素材**。逐张提示词、叠层顺序和互动坐标见[美术资产清单](../电池盒章节-美术资产清单与逐张制作提示词.md)及[坐标与SVG方案](../电池盒前端制作坐标与SVG方案.md)。这些图画的是原创虚构器物，不能把 `../史实材料/images/` 中的真实发电机照片当成游戏盒母版。

已保存的文件：

```text
battery_box_closed_blank.png
battery_box_right_blank.png
battery_lid_inside_blank.png
battery_old_band.png
battery_dry_liner.png
battery_outer_band.png
battery_note_blank.png
battery_terminal_detail.png   # 可选，端子结构仍由SVG校正
ink-battery-note-optional.png # 可选氛围字样，不承担准确文字
ink-battery-problem.svg       # 第一行正式字形轮廓，已接入前端
ink-battery-retry.svg         # 第二行正式字形轮廓，已接入前端
ink-battery-result.svg        # 结果栏正式字形轮廓，已接入前端
battery_note_text.svg         # 三行合版，供独立预览和校字
build_ink_svg.py              # 从SIL OFL字体再生四份自带轮廓的SVG
```

P01—P08及字迹样张都是RGBA PNG；抽查角点alpha为0，P01一个角点仅1/255，均不是黑底矩形。实际尺寸与主体占位不统一，**不能把它们逐张强拉成1600×1000并当作自动对位的拼图**。各层前端以盒体盖缝、左侧旧结、右上端子和盖内纸笺为锚点，按比例定位；尤其P04—P06需在页面里调遮挡与带头转动。笔迹PNG可作为气氛底纹，但正式字句须采用`battery_note_text.svg`或网页文本，保证准确和可读。

三张短句SVG和合版SVG均使用 Noto Serif SC（SIL Open Font License 1.1）的字形轮廓，无运行时系统字体依赖；逐字文本仍在前端可访问的HTML转录与故事卡中提供。P01—P08、三张短句SVG已接入`BatteryInvestigation.vue`，史实四张SVG已接入`BatteryHistoryExhibit.vue`。可选AI手写PNG没有进入正式画面。已通过单张素材透明通道检查与前端构建、自动测试；**仍待PC浏览器实机合成、命中区、125%缩放与字号验收**。图上不烘焙章号、真实馆藏标记或点击标识。真实历史视觉使用隔壁`史实视觉/`的原创SVG，不能把两组混成同一器物。

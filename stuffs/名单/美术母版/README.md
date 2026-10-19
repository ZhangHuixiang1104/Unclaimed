# 名单美术母版｜制作记录

## 当前保留的素材

- [正面完整空白纸张](list_front_master_blank.png)：2026-10-18 以用户选中的最后一张图片为编辑目标，去除黑底。实际输出为 **1448 × 1086 px、4:3、RGBA 透明 PNG**。
- [同纸背面空白纸张](list_back_master_blank.png)：以上述透明正面为唯一图像参考生成，**1448 × 1086 px、4:3、RGBA 透明 PNG**。
- [可擦除泥点透明层](list_mud_overlay.png)：单独生成的**1774 × 887 px、2:1、RGBA 透明 PNG**，用于暂时遮住正面「备用物料」的「料」字；不是纸张本身的污渍。
- [检查台底图](list_desk_bg.png)：**1672 × 941 px、约 16:9、不透明 PNG**，中央保留空白操作区，边角为低对比度灯座、档案夹与夹具；只作环境背景，不包含任何 UI。
- [侧光纸纹辅材](list_raking_light_texture.png)：**1774 × 887 px、2:1、不透明 PNG**，满幅细纸纤维及浅折痕；只供前端低透明度、渐隐蒙版和动态侧光混合使用。
- `ink-front-*.png`、`ink-back-*.png` 共十四张：单独生成并人工逐字校对的透明手写中文图层；分别摆到正反面纸上，不烘焙进纸张母版。姓名缺失处没有任何补字图层。
- 原图是一张**原创虚构道具**，未使用真实手迹照片作参考。纸面母版本身没有文字、方框或切口；中文用上述透明图层，记号、三片断缝和姓名实缺由前端 SVG 精确制作。
- 项目目录保留正反面透明母版、泥点层、检查台底图和侧光纸纹；此前黑底版和更早试稿未留在项目目录。正反面均有透明通道；纸外极低 alpha 的抗锯齿边缘在黑底预览下可能显得发亮。前端现以同一份 SVG 外轮廓和三片切线约束两面，仍待浏览器实机检查彩边。
- 两面的主色与纸张位置接近，但生成式编辑**不能保证像素级同轮廓**；中线采样下左右纸边最多相差约 11 px。不能直接把两张图片各自的自然边缘当作翻面与拼合的精确边界。
- 当前素材仍非最终高分辨率母版；与方案目标 2400 × 1800 px 不一致，200% 放大及实际浏览器呈现仍需验证。

## 所选正面底稿的生成提示词

> Use case: stylized-concept. Asset type: blank FRONT paper master for a PC archival puzzle game, to be cut later by a precisely authored SVG mask. ONE single intact fictional early-20th-century work sheet, perfectly flat and viewed from directly overhead with absolutely no perspective. Landscape 4:3. The sheet is centered, occupying about 84% of the width and height, surrounded by a wide, perfectly uniform, solid matte dark green-black #111410 field. The field is NOT a desk: no texture, props, lighting variations, gradients, shadows, or scattered specks; keep it clean for later masking. The paper itself is gently aged warm gray-beige handmade fiber (#D4C6A8), with sparse fine natural nonrepeating fibers and only very light wear. Its central 70% is pale, evenly bright, and calm to support later crisp Chinese text. One very subtle continuous fold goes diagonally from upper-left to lower-right, one very subtle vertical fold just left of center. A few pale rainwater blooms near top and right edge; only a tiny whisper of gray mud near lower-right edge. The paper outline is simple and clean, with natural muted beige fibers—NO yellow, white, glowing, or chromatic fringes around its edge. No readable or unreadable text, no pseudo-calligraphy, letters, numerals, marks, symbols, tables, boxes, stamps, signatures, names, tears, holes, cuts, missing corners, military iconography, blood, mold, burns, hands, photographs, frame, logo, or watermark. This is an original fictional game texture, not a real museum document or a reproduction.

## 透明正面编辑提示词

> Use case: background-extraction. Image 1 is the exact edit target: a single intact beige historical-game paper sheet on a dark green-black background. Remove ONLY the entire dark background outside the paper silhouette and replace it with genuinely transparent alpha (RGBA 0 outside the paper). Preserve the original paper itself pixel-faithfully: exact outline, size, placement, top-down geometry, fibers, warm color, two folds, rain marks, and subtle lower-right stain. Keep the whole uncut sheet fully opaque except naturally antialiased edge pixels. Do not redraw, rescale, rotate, crop, recolor, or change any paper details. Pay special attention to clean edges: no dark green halo, yellow/white/chromatic fringe, glowing rim, stray opaque pixels, or shadow in the transparent area. No new text, markings, tears, cuts, props, or background. Output a transparent PNG cutout of the same sheet.

## 同纸背面生成提示词

> Use case: precise-object-edit. Asset type: blank BACK master for the very same fictional paper sheet in Image 1, a PC historical narrative puzzle prop. Image 1 is the sole reference and must anchor scale, 4:3 canvas, exact centered paper silhouette, straight-on 90-degree top-down orthographic view, warm gray-beige fibers, restrained aging, edge wear, two continuous shallow folds, faint watermarks, and diffuse flat archival lighting. Show the reverse side of that same uncut sheet, not a new or differently shaped sheet. Preserve exactly the same canvas size, paper dimensions, placement and outer outline; matching cuts will later use the same SVG mask. The physical folds must correspond to the front when the paper is turned over horizontally; a diagonal crease and a slightly-off-center vertical crease remain softly traceable. The reverse may have slightly varied paper-fiber patterns and extremely faint non-letter-like ink shadow, but it must be mostly clean. Keep the upper-middle large enough for two future legend lines and lower-middle clean enough for later annotations, which will be overlaid by software. Keep paper light and legible, no new stain clusters. Genuinely transparent outside the paper silhouette; no dark or light background, no halo, colored fringe, glow, stray opaque pixels, or shadows in transparent space. NO readable or pseudo text, no Chinese characters, letters, numbers, diagram symbols, boxes, stamps, names, tears, holes, cuts, missing corners, props or watermark. Do not replicate a real museum artifact.

## 泥点透明层的生成与复核

用户在三次预览中选定了**第一版的横向泥痕**，项目文件已替换为该版本。它为 1774 × 887 px 的透明 PNG，主体灰褐色、中心较厚，画布角落近乎全透明。第一版边缘有**可见的红黄低透明度杂色**，比后两版更明显；选择它是选择形状和质感，**不是验收彩边**。图已接入前端 Canvas 擦除，运行时暂做灰阶降饱和；原图仍须正式清边和纸面复查。

所选第一版的生成提示词（内置生图工具）：

> Asset type: isolated transparent RGBA game interaction overlay, landscape 2:1 canvas. Create ONLY one localized, irregular, slightly damp mud-and-dust blot in the central part of the canvas, covering approximately 35% of the canvas; the remaining area must be genuinely fully transparent alpha, including all four corners. This is a removable overlay to temporarily obscure ONE Chinese character on a fictional old-paper list in a historical narrative game. The blot is muted light gray-brown / warm umber compatible with aged beige paper, semi-transparent overall, moderately denser at the center so the underlying glyph is initially difficult to read; sparse broken edges and tiny separate fine grains, subtle damp-to-dry transition and natural capillary feathering as if absorbed by paper fibers. The mark should remain compact enough not to obscure an entire line of text. Flat top-down material texture, no cast shadow and no glossy highlights. Absolutely no paper or background surface, no letters or symbols, no text, no handwriting, no brush, no hand, no table, no blood, no scorch, no black or oily patch, no border, no watermark. The output itself must preserve true transparency, not a checkerboard depiction of transparency.

前端已用同一 SVG 轮廓与切线切出三片并散放，玩家可拖动吸附归位；透明手写字和 SVG 记号叠在纸上，泥点在「料」字上方支持鼠标擦除。下一步是浏览器中逐一校准拖动、弹卡和纸面清晰度。姓名处是纸张物理缺失，不用泥点层替代。

## 检查台底图的生成与复核

按章节方案第 4 次要求生成，采用**内置生图工具**。画面为完全俯视的深绿黑工作台，中央没有纸张或其他道具，边缘细节低对比度。实际尺寸低于文档建议的 2560 × 1440 px；已进入名单检查台，仍需在 PC 浏览器检查 `background-size: cover` 的裁切、纸片轮廓对比度与文字可读性。

实际生成提示词：

> Use case: stylized-concept. Asset type: PC historical narrative puzzle game inspection-table BACKGROUND IMAGE only, no interface elements. Create a 16:9 landscape, perfectly orthographic 90-degree top-down view of a quiet night-time archive worktable. The surface is restrained deep green-black near #111410, matte, with extremely subtle non-repeating dark wood grain or linen fibers. Reserve the broad CENTRAL 70% of the frame as flat, clean, empty, evenly legible operating space for several pale paper fragments to be placed by the game later; no objects, shadow shapes, stains, glare, markings or built-in paper in this central area. At the far outer edges ONLY, optional very faint low-contrast hints of one old empty file-folder corner, a small dark archival clip, and soft desk-lamp falloff; keep any props cropped, secondary, quiet, and sufficiently far from the center. Maintain enough tonal separation that light beige paper can sit on top with a crisp silhouette. Flat diffuse controlled lighting, no strong spotlight or bright glow; sophisticated archival atmosphere, not horror or battlefield. This is a complete opaque environmental texture, not a mockup of a UI. Absolutely no text, labels, maps, photos, badges, characters, hands, historical artifacts, paper sheets, panel borders, buttons, toolbars, evidence board, frame, logo, or watermark. Aim for a clean usable background rather than a cinematic illustration.

## 侧光纸纹辅材的生成与复核

按章节方案第 5 次要求使用**内置生图工具**制作。透明淡出初稿出现椭圆外形与红黄彩边，不适合作为纸面叠层，故没有保留在项目中。最终选用满幅矩形纸纹：纤维与压痕无文字或符号，正面母版纸色比该图稍亮；前端已用 `.13` 透明度及随鼠标移动的 SVG 蒙版显示，避免新纹理盖住原有折痕、字或断口。该图不是透明层，效果仍需实机校准。

最终生成提示词：

> Use case: stylized-concept. Asset type: full-bleed subtle microtexture source for a PC archival puzzle game's raking-light effect. A 2:1 landscape RECTANGULAR canvas completely filled edge-to-edge with a close-up of one flat, fictional, warm gray-beige handmade paper surface. No paper outline, no cutout, no oval spot, no vignette, no frame, no isolated island of texture, and no transparent surrounding area. The texture must be calm and consistent across the whole canvas: fine irregular plant fibers, slight matte tooth, one or two very shallow continuous fold lines, and extremely faint compressed surface indentations whose shape cannot be read as letters or symbols. Soft grazing light from the LEFT produces only tiny restrained light-dark relief; no luminous spotlight or gradient, no deep scratches, no obvious cracks. Low contrast and subdued colors near #D4C6A8, keeping the middle quiet enough for clear overlaid Chinese vector text. This is NOT a full document image; it is a small-scale material layer that code will later blend at low opacity and fade with a mask. Absolutely no words, glyphs, pseudo-writing, ink, mud, stains, pen, magnifying glass, hand, desk, object, decorative border, watermark or chromatic aberration. A useful seamless-looking production texture, not cinematic concept art.

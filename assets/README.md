# Generated art assets

Created with the built-in image generation tool, then copied into this project. The standalone build embeds both files, so no remote image service is needed at runtime. Surface tiles are sampled from the atlas in `src/surfaces.ts`; surface normals are approximated from the albedo and are not scanned normal maps.

## medieval-material-atlas-v1.png

Use case: historical-scene. Asset type: a single square four-quadrant medieval videogame MATERIAL TEXTURE ATLAS, to be mapped onto 3D models, NOT a picture of a scene. Precisely fill the entire image with a regular 2 by 2 grid of equal square texture tiles, no margins, no gaps, no borders, no labels. Top-left: ancient grey sandstone fortress masonry, irregular chunky rectangular blocks, deeply eroded mortar, chipped edges, soot staining, subtle lichen and moss at crevices; natural medieval masonry, not tidy modern bricks. Top-right: battered vertical oak planks, desaturated grey-brown, deep wood grain, split ends and knots, occasional iron nail heads, reclaimed prison-camp timber. Bottom-left: overlapping ancient dark grey-green wooden shingles, small uneven rows, moss, cracked warped edges, gritty roof texture. Bottom-right: trampled grey-brown mud with small stones, gritty soil and fine dry straw fragments, no grass tufts or large objects. Style: realistic finely detailed game albedo textures for a gritty dark medieval mining colony reminiscent of Gothic 2001, weathered and tactile, muted cool grey and brown palette. Composition: perfectly straight-on orthographic surfaces, each quadrant individually tileable on its opposite edges. Lighting: diffuse neutral even light, no directional cast shadows, no strong lighting gradients, no vignette, no perspective, no depth-of-field, no writing or watermarks. Highly detailed surface relief with realistic material grain.

## storm-sky-v1.png

Use case: historical-scene. Asset type: seamless horizontal 2:1 panoramic sky texture for a 3D medieval dark-fantasy videogame sky dome. Primary request: paint only the sky, edge-to-edge, with dramatic richly layered late-afternoon grey-blue storm clouds above a narrow warm pale-gold horizon. Equirectangular panoramic environment sky, horizon near bottom 20 percent, upper portion dense slate-blue stratocumulus with soft silver edges and a few breaks showing deep muted blue. Atmospheric and realistic, grounded late-1990s European dark fantasy RPG aesthetic, natural clouds with tremendous depth, no purple fantasy nebulae. Very broad diffuse light breaking through one cloud bank at far left; dark storm clouds toward right, no visible sun disc. No ground, no mountains, no buildings, no landscape silhouettes, no lightning, no text, no watermark. Horizontal opposite edges should match seamlessly; full sky-only environment map, no vignette, no camera lens distortion.


## Valley Edition assets

Photographed albedo and OpenGL normal maps from **Poly Haven**, all CC0:
`castle_wall_slates`, `dark_wooden_planks`, `forest_ground_04`, `roof_slates_02`,
`rock_boulder_dry`, `pine_bark`, `brown_leather`, and `fabric_pattern_05`.
Source API metadata was used to obtain the original 1K/2K maps. WebP copies
retain those dimensions. See `licenses/ASSET-CREDITS.txt` for source links and authors.

`source/male.obj`, `source/male-skin.png`: **3D male**, Drummyfish, CC0,
https://opengameart.org/content/3d-male-0 . The quad mesh is subdivided by
`scripts/prepare-human.py`; the game adds clothing regions, a skeleton, hair,
complexion variations, and weapons. Skin UVs are preserved.

### pine-bough-v1.png

Created with the built-in image-generation tool, transparent alpha retained.
The runtime WebP copy retains the original 1774 × 887 dimensions and alpha.
Final prompt:

> Use case: photorealistic-natural. Asset type: transparent alpha foliage texture for a real-time 3D game, one isolated Norway spruce branch bough. Create a single broad, dense, natural spruce branch viewed exactly from above, lying flat in the image plane, central woody stem running horizontally left to right. Short lateral twigs with thousands of fine dark olive-green needles form an irregular tapered featherlike shape, broad in the left and middle part, tapering to a narrow tip on the right. Realistic temperate European forest botany, gritty muted natural colors, tiny pale dry twig tips, detailed organic needles. Composition: wide horizontal 2:1 image, branch fills about 92% of width and 85% of height with a small transparent margin on all sides. Diffuse neutral overcast lighting, flat albedo style, no cast shadow, no depth of field. Fully transparent background including between needles. No ground, no border, no text, no illustration style, no geometric fern, no holiday ornament, no tree trunk.

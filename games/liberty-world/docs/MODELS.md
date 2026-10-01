# Supplied characters and optimization
Runtime files: assets/models/pcock.glb (16,748 triangles), liberty.glb (10,584), pulse-guy.glb (9,516).
All use one material, a 1024px WebP base-color texture and Meshopt geometry/animation compression.
Manifest paths are relative and versioned. Edit assets/manifest.json to replace a role. Missing or invalid models use procedural stand-ins; missing clips use procedural idle, talk and jump animation.
Originals are preserved at C:/Users/Gamer/Desktop/libertyswap-source-archive-20260930/3d characters/ (including unused zer0-women.glb).
The unmodified base is preserved at C:/Users/Gamer/Desktop/libertyswap-source-archive-20260930/game half built base/badfoundation.html.
Reproduction (development only, outside the repo):
```powershell
python tools/prepare-models.py 'C:\Users\Gamer\Desktop\libertyswap-source-archive-20260930\3d characters' 'C:\Users\Gamer\.cache\pcock-stage1-tools\prepared'
npx --yes @gltf-transform/cli@4.2.1 optimize 'C:\Users\Gamer\.cache\pcock-stage1-tools\prepared\pcock.glb' 'assets/models/pcock.glb' --flatten false --join false --palette false --instance false --compress meshopt --simplify-ratio 0.1 --simplify-error 0.05 --texture-compress false
```
For Liberty and Pulse Guy, change input/output names as in ASSET_INVENTORY.json and use --simplify-ratio 0.05.
Pillow preprocessing avoids a Windows libvips color-space error in the CLI texture compressor; that first attempt failed once per model and the corrected attempt passed.
Valley guided R3: assets/models/env/valley/manifest.json defines 18 original authored models, 393,104 bytes total and at most 684 triangles per model. Nearby/far variants preserve budget; the original environment kit and all supplied character GLBs remain unchanged.

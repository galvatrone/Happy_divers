#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run_all.sh — Run all Blender scripts + gltf-transform post-process pipeline
# Usage: cd blender && bash run_all.sh
#
# Prerequisites:
#   blender  ≥ 4.0   (in PATH or set BLENDER= below)
#   Node.js  ≥ 18    (for npx @gltf-transform/cli)
#   cwebp            (for WebP texture conversion, optional)
# ─────────────────────────────────────────────────────────────────────────────

set -e

BLENDER="${BLENDER:-blender}"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
MODELS_OUT="${SCRIPTS_DIR}/../public/assets/model"

echo "=== Blender asset creation ==="
echo "Scripts: $SCRIPTS_DIR"
echo "Output:  $MODELS_OUT"
echo ""

mkdir -p "$MODELS_OUT"

run_script() {
  local script="$1"
  echo "──> Running $script …"
  "$BLENDER" --background --python "${SCRIPTS_DIR}/${script}" 2>&1 | grep -E '\[OK\]|Error|error'
  echo ""
}

run_script create_fish_small.py
run_script create_fish_large.py
run_script create_shark.py
run_script create_manta_ray.py
run_script create_corals.py
run_script create_reef_rock.py

echo "=== gltf-transform post-process ==="

# Install gltf-transform CLI if needed
npx --yes @gltf-transform/cli --version > /dev/null 2>&1

post_process() {
  local file="$1"
  local base="${file%.glb}"
  local tmp="${base}_tmp.glb"

  echo "──> Post-processing $(basename $file)"

  # 1. Draco compression + deduplicate + prune
  npx @gltf-transform/cli optimize "$file" "$tmp" \
    --draco \
    --texture-compress webp \
    2>&1 | tail -2

  # 2. Resize textures to max 1024
  npx @gltf-transform/cli resize "$tmp" "$file" \
    --width 1024 --height 1024 2>&1 | tail -2

  rm -f "$tmp"
  local size_kb=$(du -k "$file" | cut -f1)
  echo "   Final size: ${size_kb}KB"
}

for glb in "$MODELS_OUT"/*.glb; do
  [ -f "$glb" ] || continue
  post_process "$glb"
done

echo ""
echo "=== DONE ==="
echo "Assets in: $MODELS_OUT"
ls -lh "$MODELS_OUT"/*.glb 2>/dev/null

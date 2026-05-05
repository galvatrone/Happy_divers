"""
create_fish_small.py — Clownfish-type reef fish
Run from Blender 4.x: blender --background --python create_fish_small.py

Output: fish_small.glb (~500–1,200 tris, looping swim cycle, 24fps/24fr)
Action name: "swim" (required by Three.js AnimationMixer)
"""

import bpy, bmesh, math
from mathutils import Vector, Euler

# ── Clean scene ─────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)

# ── Utility ──────────────────────────────────────────────────────────────────
def new_mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    return obj

# ── Body mesh ────────────────────────────────────────────────────────────────
# Elongated, tapered cylinder: 8 segments × 7 rings along Y axis
SEGS  = 8
RINGS = 7
verts, faces = [], []

def push_ring(y, rx, rz):
    idx = len(verts)
    for s in range(SEGS):
        a = 2 * math.pi * s / SEGS
        verts.append((math.cos(a) * rx, y, math.sin(a) * rz))
    return idx

# Profile: (y, rx, rz) — front=head, back=tail
profile = [
    (-0.55, 0.06, 0.05),   # snout tip
    (-0.38, 0.11, 0.10),   # mouth
    (-0.18, 0.14, 0.14),   # eye band
    ( 0.00, 0.14, 0.13),   # mid body (widest)
    ( 0.22, 0.11, 0.10),   # rear body
    ( 0.42, 0.06, 0.06),   # tail root
    ( 0.56, 0.01, 0.01),   # tail tip
]

starts = [push_ring(y, rx, rz) for y, rx, rz in profile]

for r in range(len(starts) - 1):
    s0, s1 = starts[r], starts[r + 1]
    for s in range(SEGS):
        n = (s + 1) % SEGS
        faces.append((s0 + s, s0 + n, s1 + n, s1 + s))

body = new_mesh_obj("fish_body", verts, faces)

# ── Tail fin ─────────────────────────────────────────────────────────────────
tail_verts = [
    (0.0,  0.56, 0.0),
    (0.14, 0.72, 0.12),
    (-0.14, 0.72, 0.12),
    (0.14, 0.72, -0.12),
    (-0.14, 0.72, -0.12),
]
tail_faces = [(0,1,2), (0,3,4), (1,0,3), (2,0,4)]
tail = new_mesh_obj("tail_fin", tail_verts, tail_faces)
tail.parent = body

# ── Dorsal fin ───────────────────────────────────────────────────────────────
dors_verts = [
    (0.0, -0.1, 0.14), (0.0, 0.2, 0.14),
    (0.04, -0.0, 0.24), (0.0, 0.12, 0.26),
]
dors_faces = [(0,1,3,2)]
dors = new_mesh_obj("dorsal_fin", dors_verts, dors_faces)
dors.parent = body

# ── Pectoral fins ─────────────────────────────────────────────────────────────
for side, sx in (("L", 1), ("R", -1)):
    pec_verts = [
        (0.14*sx, -0.05, 0.0),
        (0.22*sx, 0.06,  0.04),
        (0.22*sx, -0.12, 0.04),
    ]
    pec = new_mesh_obj(f"pectoral_{side}", pec_verts, [(0,1,2)])
    pec.parent = body

# ── Apply vertex colours (orange-white clownfish stripes) ────────────────────
bm = bmesh.new()
bm.from_mesh(body.data)
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        y = loop.vert.co.y
        # Alternate bands: orange / white / orange
        if y < -0.2:    col = (1.0, 0.45, 0.0, 1.0)   # orange snout
        elif y < 0.05:  col = (1.0, 1.0, 1.0, 1.0)    # white band
        elif y < 0.30:  col = (1.0, 0.45, 0.0, 1.0)   # orange body
        else:           col = (1.0, 1.0, 1.0, 1.0)    # white tail band
        loop[col_layer] = col
bm.to_mesh(body.data)
bm.free()

# ── Armature ─────────────────────────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True)
arm_obj = bpy.context.active_object
arm_obj.name = "fish_armature"
arm     = arm_obj.data

# Remove default bone
for b in list(arm.edit_bones): arm.edit_bones.remove(b)

# 7-bone spine chain + 2 pectoral bones per side
spine_y = [-0.50, -0.30, -0.10, 0.10, 0.28, 0.44, 0.56]
prev = None
spine_bones = []
for i, y in enumerate(spine_y):
    b = arm.edit_bones.new(f"spine.{i:02d}")
    b.head = Vector((0, y, 0))
    b.tail = Vector((0, y + (spine_y[i+1] - y if i < 6 else 0.10), 0))
    b.roll = 0
    if prev: b.parent = prev
    prev = b
    spine_bones.append(b.name)

for side, sx in (("L", 1), ("R", -1)):
    pb = arm.edit_bones.new(f"pec_{side}")
    pb.head = Vector((0.14*sx, -0.05, 0))
    pb.tail = Vector((0.22*sx,  0.06, 0))
    pb.parent = arm.edit_bones[spine_bones[1]]

bpy.ops.object.editmode_toggle()

# ── Parent body to armature ───────────────────────────────────────────────────
body.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# ── Swim cycle action (24 frames @ 24fps = 1s loop) ─────────────────────────
bpy.context.scene.render.fps = 24
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 24

action = bpy.data.actions.new("swim")
arm_obj.animation_data_create()
arm_obj.animation_data.action = action

pose = arm_obj.pose

TAIL_AMP  = math.radians(25)
PEC_AMP   = math.radians(12)
PHASE_LAG = 2  # frames between each spine bone

for frame in range(1, 25):
    bpy.context.scene.frame_set(frame)
    t = (frame - 1) / 24.0 * 2 * math.pi

    for i, bname in enumerate(spine_bones):
        pbone = pose.bones.get(bname)
        if pbone is None: continue
        phase = t - i * PHASE_LAG / 24.0 * 2 * math.pi
        # Scale amplitude: near-zero at head, max at tail
        amp = TAIL_AMP * (i / (len(spine_bones) - 1)) ** 1.4
        pbone.rotation_euler = Euler((0, 0, math.sin(phase) * amp))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)

    for side in ("L", "R"):
        pbone = pose.bones.get(f"pec_{side}")
        if pbone is None: continue
        sign = 1 if side == "L" else -1
        pbone.rotation_euler = Euler((math.sin(t) * PEC_AMP * sign, 0, 0))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)

# Mark cyclic (loop)
for fcurve in action.fcurves:
    fcurve.modifiers.new(type='CYCLES')

# ── Apply subdivision modifier ────────────────────────────────────────────────
bpy.context.view_layer.objects.active = body
mod = body.modifiers.new("subd", "SUBSURF")
mod.levels = 2
mod.render_levels = 2
bpy.ops.object.modifier_apply(modifier="subd")

# ── UV Unwrap (smart) ─────────────────────────────────────────────────────────
bpy.context.view_layer.objects.active = body
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# ── Material ──────────────────────────────────────────────────────────────────
mat = bpy.data.materials.new("fish_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.45
bsdf.inputs["Subsurface Weight"].default_value = 0.05
vc_node = mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc_node.layer_name = "Col"
mat.node_tree.links.new(vc_node.outputs["Color"], bsdf.inputs["Base Color"])
body.data.materials.append(mat)

# ── Export ────────────────────────────────────────────────────────────────────
export_path = bpy.path.abspath("//../../public/assets/model/fish_small.glb")
bpy.ops.export_scene.gltf(
    filepath=export_path,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_colors=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_animations=True,
    export_frame_range=True,
    export_anim_single_armature=True,
)

print(f"[OK] Exported: {export_path}")

"""
create_fish_large.py — Large reef fish (Napoleon/Humphead wrasse type)
Run: blender --background --python create_fish_large.py

Output: fish_large.glb (~2,000–4,000 tris, swim cycle action "swim")
"""

import bpy, bmesh, math
from mathutils import Vector, Euler

bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)

def new_mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    return obj

SEGS = 10  # more segments for chunkier body

def push_ring(y, rx, rz):
    idx = len(verts)
    for s in range(SEGS):
        a = 2 * math.pi * s / SEGS
        verts.append((math.cos(a) * rx, y, math.sin(a) * rz))
    return idx

verts, faces = [], []

# Napoleon wrasse profile: big forehead hump, deep body, small tail
profile = [
    (-0.70, 0.04, 0.04),   # snout
    (-0.50, 0.13, 0.16),   # upper lip
    (-0.28, 0.20, 0.22),   # eye
    (-0.05, 0.26, 0.28),   # forehead hump (widest)
    ( 0.15, 0.24, 0.26),   # mid body
    ( 0.36, 0.18, 0.20),   # rear body
    ( 0.52, 0.09, 0.10),   # tail root
    ( 0.68, 0.02, 0.02),   # tail tip
]

starts = [push_ring(y, rx, rz) for y, rx, rz in profile]

for r in range(len(starts) - 1):
    s0, s1 = starts[r], starts[r + 1]
    for s in range(SEGS):
        n = (s + 1) % SEGS
        faces.append((s0 + s, s0 + n, s1 + n, s1 + s))

body = new_mesh_obj("fish_large_body", verts, faces)

# Broad tail fin
tail_verts = [
    (0.0,   0.68,  0.0),
    (0.22,  0.86,  0.18),
    (-0.22, 0.86,  0.18),
    (0.22,  0.86, -0.18),
    (-0.22, 0.86, -0.18),
]
tail_faces = [(0,1,2), (0,3,4), (1,0,3), (2,0,4)]
tail = new_mesh_obj("large_tail", tail_verts, tail_faces)
tail.parent = body

# Rounded dorsal fin (multiple vertices)
dors_verts = [
    (0.0, -0.2, 0.28), (0.0, 0.1, 0.28),  (0.0, 0.3, 0.28),
    (0.06, -0.1, 0.42), (0.06, 0.2, 0.44), (0.03, 0.35, 0.36),
]
dors_faces = [(0,1,4,3), (1,2,5,4)]
dors = new_mesh_obj("large_dorsal", dors_verts, dors_faces)
dors.parent = body

# Pectoral fins — larger and more paddle-like
for side, sx in (("L", 1), ("R", -1)):
    pec_verts = [
        (0.26*sx, -0.06, 0.02),
        (0.40*sx,  0.08, 0.08),
        (0.38*sx, -0.18, 0.06),
        (0.28*sx, -0.08, -0.06),
    ]
    pec_faces = [(0,1,2), (0,2,3)]
    pec = new_mesh_obj(f"large_pec_{side}", pec_verts, pec_faces)
    pec.parent = body

# Vertex colours — blue-green iridescent
bm = bmesh.new()
bm.from_mesh(body.data)
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        y = loop.vert.co.y
        t = (y + 0.7) / 1.38  # normalise 0-1
        r = 0.05 + t * 0.2
        g = 0.35 + t * 0.3
        b = 0.55 + (1 - t) * 0.3
        loop[col_layer] = (r, g, b, 1.0)
bm.to_mesh(body.data)
bm.free()

# Armature — same 7-bone spine structure
bpy.ops.object.armature_add(enter_editmode=True)
arm_obj = bpy.context.active_object
arm_obj.name = "fish_large_armature"
arm = arm_obj.data
for b in list(arm.edit_bones): arm.edit_bones.remove(b)

spine_y = [-0.64, -0.42, -0.18, 0.04, 0.26, 0.44, 0.60]
prev, spine_bones = None, []
for i, y in enumerate(spine_y):
    b = arm.edit_bones.new(f"spine.{i:02d}")
    b.head = Vector((0, y, 0))
    b.tail = Vector((0, y + (spine_y[i+1] - y if i < 6 else 0.12), 0))
    if prev: b.parent = prev
    prev = b
    spine_bones.append(b.name)

for side, sx in (("L", 1), ("R", -1)):
    pb = arm.edit_bones.new(f"pec_{side}")
    pb.head = Vector((0.20*sx, -0.06, 0))
    pb.tail = Vector((0.40*sx,  0.08, 0))
    pb.parent = arm.edit_bones[spine_bones[2]]

bpy.ops.object.editmode_toggle()

body.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# Swim action — slower, more majestic than small fish
bpy.context.scene.render.fps = 24
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 24

action = bpy.data.actions.new("swim")
arm_obj.animation_data_create()
arm_obj.animation_data.action = action

TAIL_AMP = math.radians(20)   # calmer oscillation for large fish
PEC_AMP  = math.radians(10)
PHASE_LAG = 2

for frame in range(1, 25):
    bpy.context.scene.frame_set(frame)
    t = (frame - 1) / 24.0 * 2 * math.pi
    for i, bname in enumerate(spine_bones):
        pbone = arm_obj.pose.bones.get(bname)
        if pbone is None: continue
        phase = t - i * PHASE_LAG / 24.0 * 2 * math.pi
        amp   = TAIL_AMP * (i / (len(spine_bones) - 1)) ** 1.6
        pbone.rotation_euler = Euler((0, 0, math.sin(phase) * amp))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)
    for side in ("L", "R"):
        pbone = arm_obj.pose.bones.get(f"pec_{side}")
        if pbone is None: continue
        sign = 1 if side == "L" else -1
        pbone.rotation_euler = Euler((math.sin(t) * PEC_AMP * sign, 0, 0))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)

for fcurve in action.fcurves:
    fcurve.modifiers.new(type='CYCLES')

# Subdivision & UV
bpy.context.view_layer.objects.active = body
mod = body.modifiers.new("subd", "SUBSURF")
mod.levels = 2
bpy.ops.object.modifier_apply(modifier="subd")
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

mat = bpy.data.materials.new("fish_large_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.35
bsdf.inputs["Subsurface Weight"].default_value = 0.05
vc = mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
body.data.materials.append(mat)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/fish_large.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_animations=True, export_frame_range=True,
)
print("[OK] Exported: fish_large.glb")

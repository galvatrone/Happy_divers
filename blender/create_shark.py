"""
create_shark.py — Reef shark with slow patrol swim cycle
Run: blender --background --python create_shark.py

Output: shark.glb (~3,000–6,000 tris, action "swim")
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

SEGS = 12

def push_ring(y, rx, rz):
    idx = len(verts)
    for s in range(SEGS):
        a = 2 * math.pi * s / SEGS
        verts.append((math.cos(a) * rx, y, math.sin(a) * rz))
    return idx

verts, faces = [], []

# Shark body profile: streamlined torpedo with pointed snout
profile = [
    (-1.20, 0.02, 0.02),  # snout tip
    (-0.95, 0.06, 0.07),  # snout
    (-0.70, 0.12, 0.12),  # jaw
    (-0.40, 0.18, 0.16),  # gills
    (-0.10, 0.22, 0.20),  # pec insertion
    ( 0.20, 0.21, 0.19),  # mid body
    ( 0.50, 0.17, 0.15),  # dorsal area
    ( 0.80, 0.10, 0.09),  # rear body
    ( 1.10, 0.05, 0.05),  # peduncle
    ( 1.28, 0.02, 0.02),  # tail root
]

starts = [push_ring(y, rx, rz) for y, rx, rz in profile]
for r in range(len(starts) - 1):
    s0, s1 = starts[r], starts[r + 1]
    for s in range(SEGS):
        n = (s + 1) % SEGS
        faces.append((s0+s, s0+n, s1+n, s1+s))

body = new_mesh_obj("shark_body", verts, faces)

# Caudal (tail) fin — asymmetric, upper lobe larger
caudal_verts = [
    (0.0,  1.28,  0.0),
    (0.16, 1.56,  0.22),   # upper tip
    (-0.08, 1.44, 0.14),
    (0.12, 1.52, -0.12),   # lower lobe
    (-0.06, 1.40, -0.08),
]
caudal_faces = [(0,1,2), (0,3,4), (1,0,3), (2,0,4)]
caudal = new_mesh_obj("caudal_fin", caudal_verts, caudal_faces)
caudal.parent = body

# Dorsal fin — tall triangle
dors_verts = [
    (0.0, 0.38, 0.20), (0.0, 0.70, 0.20),
    (0.0, 0.44, 0.46), (0.0, 0.60, 0.44),
]
dors_faces = [(0,1,3,2)]
dors = new_mesh_obj("dorsal_fin", dors_verts, dors_faces)
dors.parent = body

# Pectoral fins — large, swept back
for side, sx in (("L", 1), ("R", -1)):
    pec_verts = [
        (0.22*sx, -0.08,  0.0),
        (0.55*sx,  0.12,  0.04),
        (0.52*sx, -0.28,  0.02),
        (0.20*sx, -0.02, -0.08),
    ]
    pec_faces = [(0,1,2), (0,2,3)]
    pec = new_mesh_obj(f"pec_{side}", pec_verts, pec_faces)
    pec.parent = body

# Pelvic fins — small, near tail
for side, sx in (("L", 1), ("R", -1)):
    pel_verts = [
        (0.10*sx, 0.68,  0.0),
        (0.20*sx, 0.82,  0.04),
        (0.08*sx, 0.80, -0.04),
    ]
    pel = new_mesh_obj(f"pelvic_{side}", pel_verts, [(0,1,2)])
    pel.parent = body

# Vertex colours — grey-blue countershading
bm = bmesh.new()
bm.from_mesh(body.data)
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        # Dorsal darker, ventral white
        nz = loop.vert.co.z
        t = (nz + 0.22) / 0.44
        t = max(0, min(1, t))
        r = 0.55 + (1 - t) * 0.38
        g = 0.58 + (1 - t) * 0.35
        b = 0.64 + (1 - t) * 0.30
        loop[col_layer] = (r, g, b, 1.0)
bm.to_mesh(body.data)
bm.free()

# ── Armature ──────────────────────────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True)
arm_obj = bpy.context.active_object
arm_obj.name = "shark_armature"
arm = arm_obj.data
for b in list(arm.edit_bones): arm.edit_bones.remove(b)

spine_y = [-1.10, -0.75, -0.40, -0.05, 0.30, 0.65, 0.95, 1.20]
prev, spine_bones = None, []
for i, y in enumerate(spine_y):
    b = arm.edit_bones.new(f"spine.{i:02d}")
    b.head = Vector((0, y, 0))
    b.tail = Vector((0, y + (spine_y[i+1] - y if i < 7 else 0.14), 0))
    if prev: b.parent = prev
    prev = b
    spine_bones.append(b.name)

for side, sx in (("L", 1), ("R", -1)):
    pb = arm.edit_bones.new(f"pec_{side}")
    pb.head = Vector((0.18*sx, -0.08, 0))
    pb.tail = Vector((0.48*sx,  0.10, 0))
    pb.parent = arm.edit_bones[spine_bones[2]]

bpy.ops.object.editmode_toggle()

body.select_set(True)
arm_obj.select_set(True)
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

bpy.context.scene.render.fps = 24
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = 24

action = bpy.data.actions.new("swim")
arm_obj.animation_data_create()
arm_obj.animation_data.action = action

TAIL_AMP  = math.radians(22)  # sharks have strong, decisive tail sweep
PEC_AMP   = math.radians(8)   # pecs barely move — they're rigid hydrofoils
PHASE_LAG = 2

for frame in range(1, 25):
    bpy.context.scene.frame_set(frame)
    t = (frame - 1) / 24.0 * 2 * math.pi
    for i, bname in enumerate(spine_bones):
        pbone = arm_obj.pose.bones.get(bname)
        if pbone is None: continue
        phase = t - i * PHASE_LAG / 24.0 * 2 * math.pi
        amp   = TAIL_AMP * (i / (len(spine_bones) - 1)) ** 2.0
        pbone.rotation_euler = Euler((0, 0, math.sin(phase) * amp))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)
    for side in ("L", "R"):
        pbone = arm_obj.pose.bones.get(f"pec_{side}")
        if pbone is None: continue
        sign = 1 if side == "L" else -1
        pbone.rotation_euler = Euler((math.sin(t * 0.5) * PEC_AMP * sign, 0, 0))
        pbone.rotation_mode  = 'XYZ'
        pbone.keyframe_insert(data_path="rotation_euler", index=-1)

for fcurve in action.fcurves:
    fcurve.modifiers.new(type='CYCLES')

bpy.context.view_layer.objects.active = body
mod = body.modifiers.new("subd", "SUBSURF")
mod.levels = 2
bpy.ops.object.modifier_apply(modifier="subd")
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

mat = bpy.data.materials.new("shark_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.55
bsdf.inputs["Subsurface Weight"].default_value = 0.02
vc = mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
body.data.materials.append(mat)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/shark.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_animations=True, export_frame_range=True,
)
print("[OK] Exported: shark.glb")

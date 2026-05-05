"""
create_manta_ray.py — Manta ray with wing-undulation glide cycle
Run: blender --background --python create_manta_ray.py

Output: manta_ray.glb (~3,000–6,000 tris, action "swim")
Wing bones: 3 per side, undulating ±35°
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

# Manta body — disc-like, wide in X, short in Y (forward direction)
# Build as a radial disc with deformed radius profile
WING_SEGS = 16  # resolution around the disc

verts, faces = [], []

# Centre rows: body and wing
# Y = forward, X = wing span, Z = vertical
def manta_radius(angle_norm):
    """0=front, 0.5=wingtip, 1=rear — returns (rx, rz)"""
    t = angle_norm  # 0-1 around the disc
    # Wing span: widest at t=0.5 (sides), narrow front/rear
    if t <= 0.5:
        u = t * 2  # 0-1 from front to wing tip
        rx = 1.10 * math.sin(u * math.pi) ** 0.7
    else:
        u = (t - 0.5) * 2  # 0-1 from wing tip to rear
        rx = 1.10 * math.sin((1 - u) * math.pi) ** 0.7
    rz = 0.04  # disc thickness
    return rx, rz

idx = 0
segs = 24
for r in range(segs):
    ang = r / segs
    rx, rz = manta_radius(ang)
    theta = ang * 2 * math.pi
    # Y is forward-back axis, X is wing span
    verts.append((rx * math.sin(theta), rx * math.cos(theta) * -0.5, 0))

# Simple flat disc faces
for i in range(segs):
    n = (i + 1) % segs
    faces.append((i, n, 0))  # naive fan — will look rough but functional

body = new_mesh_obj("manta_body", verts, faces)

# Horns (cephalic fins)
for side, sx in (("L", 1), ("R", -1)):
    horn_verts = [
        (0.10*sx, -0.78, 0.02),
        (0.28*sx, -0.92, 0.04),
        (0.06*sx, -0.86, -0.02),
    ]
    horn = new_mesh_obj(f"horn_{side}", horn_verts, [(0,1,2)])
    horn.parent = body

# Tail whip — 4-segment tapered cylinder
tail_pts = [(0.0, 0.65, 0.0), (0.0, 0.95, 0.0), (0.0, 1.30, 0.0), (0.0, 1.60, 0.0)]
tail_r   = [0.018, 0.012, 0.006, 0.002]
tv, tf = [], []
for i, (pt, r) in enumerate(zip(tail_pts, tail_r)):
    for s in range(6):
        a = 2*math.pi*s/6
        tv.append((pt[0]+math.cos(a)*r, pt[1], pt[2]+math.sin(a)*r))
for i in range(len(tail_pts)-1):
    for s in range(6):
        n = (s+1)%6
        tf.append((i*6+s, i*6+n, (i+1)*6+n, (i+1)*6+s))
tail = new_mesh_obj("manta_tail", tv, tf)
tail.parent = body

# Vertex colours — dark dorsal, white ventral patch
bm = bmesh.new()
bm.from_mesh(body.data)
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        xabs = abs(loop.vert.co.x)
        # Wing tip lighter, body dark
        t = min(1, xabs / 1.10)
        loop[col_layer] = (0.06 + t*0.1, 0.06 + t*0.1, 0.10 + t*0.08, 1.0)
bm.to_mesh(body.data)
bm.free()

# ── Armature ──────────────────────────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True)
arm_obj = bpy.context.active_object
arm_obj.name = "manta_armature"
arm = arm_obj.data
for b in list(arm.edit_bones): arm.edit_bones.remove(b)

# Root bone
root = arm.edit_bones.new("root")
root.head = Vector((0, 0, 0))
root.tail = Vector((0, 0.1, 0))

# 3 wing bones per side — from body centre out to wing tip
wing_x = [0.0, 0.40, 0.80, 1.10]
wing_y = [0.0, 0.02, 0.04, 0.06]  # slight forward sweep

wing_bones = {}
for side, sx in (("L", 1), ("R", -1)):
    prev = root
    side_bones = []
    for seg in range(3):
        b = arm.edit_bones.new(f"wing_{side}.{seg:02d}")
        b.head = Vector((sx*wing_x[seg], wing_y[seg], 0))
        b.tail = Vector((sx*wing_x[seg+1], wing_y[seg+1], 0))
        b.parent = prev
        prev = b
        side_bones.append(b.name)
    wing_bones[side] = side_bones

# Tail bones
prev = root
for seg, y in enumerate([0.65, 0.95, 1.30]):
    tb = arm.edit_bones.new(f"tail.{seg:02d}")
    tb.head = Vector((0, y, 0))
    tb.tail = Vector((0, y+0.30, 0))
    tb.parent = prev
    prev = tb

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

WING_AMP  = math.radians(35)   # ±35° wing undulation
PHASE_SEG = 3   # frames delay between inner→outer wing bone

for frame in range(1, 25):
    bpy.context.scene.frame_set(frame)
    t = (frame - 1) / 24.0 * 2 * math.pi

    for side in ("L", "R"):
        sign = 1 if side == "L" else -1
        for seg, bname in enumerate(wing_bones[side]):
            pbone = arm_obj.pose.bones.get(bname)
            if pbone is None: continue
            phase_delay = seg * PHASE_SEG / 24.0 * 2 * math.pi
            amp = WING_AMP * (0.3 + seg * 0.35)
            pbone.rotation_euler = Euler((math.sin(t - phase_delay) * amp * sign, 0, 0))
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

mat = bpy.data.materials.new("manta_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.6
bsdf.inputs["Subsurface Weight"].default_value = 0.04
vc = mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
body.data.materials.append(mat)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/manta_ray.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_animations=True, export_frame_range=True,
)
print("[OK] Exported: manta_ray.glb")

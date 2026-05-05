"""
create_corals.py — coral_01 (branching) and coral_02 (fan coral)
Run: blender --background --python create_corals.py

Uses vertex colours only — zero texture overhead.
No animation (static reef props).
"""

import bpy, bmesh, math, random
from mathutils import Vector, Matrix

bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)

random.seed(42)

def new_mesh_obj(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    return obj

# ── coral_01: branching Acropora-type ────────────────────────────────────────
def make_branch(origin, direction, length, radius, depth=0, max_depth=4, verts=None, faces=None):
    if verts is None: verts, faces = [], []
    if depth > max_depth or length < 0.02: return verts, faces

    SEGS = 5
    steps = 6
    step_len = length / steps
    cur = Vector(origin)
    cur_dir = Vector(direction).normalized()

    ring_start = len(verts)
    for step in range(steps + 1):
        pos = cur + cur_dir * (step * step_len)
        r = radius * (1.0 - step / (steps + 1) * 0.6)
        ring_idx = len(verts)
        perp = cur_dir.cross(Vector((0, 0, 1))).normalized()
        if perp.length < 0.01:
            perp = cur_dir.cross(Vector((0, 1, 0))).normalized()
        perp2 = cur_dir.cross(perp)
        for s in range(SEGS):
            a = 2 * math.pi * s / SEGS
            v = pos + (perp * math.cos(a) + perp2 * math.sin(a)) * r
            verts.append(tuple(v))
        if step > 0:
            prev = ring_idx - SEGS
            for s in range(SEGS):
                n = (s + 1) % SEGS
                faces.append((prev+s, prev+n, ring_idx+n, ring_idx+s))

    # Tip point
    tip = cur + cur_dir * length
    verts.append(tuple(tip))
    tip_idx = len(verts) - 1
    last_ring = tip_idx - SEGS - 1
    for s in range(SEGS):
        n = (s + 1) % SEGS
        faces.append((last_ring + s, last_ring + n, tip_idx))

    # Spawn 2-3 child branches at 60-70% of the way
    num_children = 2 if depth < max_depth - 1 else 1
    for c in range(num_children):
        t = 0.55 + c * 0.12
        branch_origin = Vector(origin) + cur_dir * (length * t)
        # Deviate direction
        angle = math.radians(35 + random.uniform(-10, 10))
        axis  = Vector((
            random.uniform(-1, 1),
            random.uniform(-1, 1),
            random.uniform(-1, 1),
        )).normalized()
        rot = Matrix.Rotation(angle, 4, axis)
        new_dir = (rot @ cur_dir).normalized()
        make_branch(
            branch_origin, new_dir,
            length * 0.62, radius * 0.58,
            depth + 1, max_depth, verts, faces,
        )

    return verts, faces

# Main coral_01 structure — starts from a base stem
v01, f01 = make_branch(
    origin=(0, 0, 0), direction=(0, 0, 1),
    length=0.70, radius=0.045,
    max_depth=3,
)
coral01 = new_mesh_obj("coral_01", v01, f01)

# Vertex colours — orange-pink coral
bm = bmesh.new()
bm.from_mesh(coral01.data)
cl = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        z = loop.vert.co.z
        t = min(1, max(0, z / 0.70))
        loop[cl] = (
            0.90 + t * 0.08,
            0.28 + t * 0.22,
            0.18 + t * 0.10,
            1.0,
        )
bm.to_mesh(coral01.data)
bm.free()

mat01 = bpy.data.materials.new("coral_01_mat")
mat01.use_nodes = True
bsdf = mat01.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.7
bsdf.inputs["Subsurface Weight"].default_value = 0.08
vc = mat01.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
mat01.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
coral01.data.materials.append(mat01)

bpy.context.view_layer.objects.active = coral01
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

# Export coral_01 alone
bpy.ops.object.select_all(action='DESELECT')
coral01.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/coral_01.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print("[OK] Exported: coral_01.glb")

# ── coral_02: fan coral (Gorgonian) ──────────────────────────────────────────
# Flat branching structure on a single plane (XZ), with stem in Y direction
FAN_SEGS   = 4   # polygon resolution per stem
FAN_LEVELS = 4

fan_verts, fan_faces = [], []

def fan_branch(x, z, height, level, max_level):
    if level > max_level: return
    r = 0.018 * (1 - level / max_level * 0.5)
    steps = 5
    step_h = height / steps
    vi = len(fan_verts)
    for i in range(steps + 1):
        h = z + i * step_h
        for s in range(FAN_SEGS):
            a = 2 * math.pi * s / FAN_SEGS
            fan_verts.append((x + math.cos(a)*r, 0, h + math.sin(a)*r*0.1))
        if i > 0:
            prev = len(fan_verts) - FAN_SEGS * 2
            cur  = len(fan_verts) - FAN_SEGS
            for s in range(FAN_SEGS):
                n = (s+1) % FAN_SEGS
                fan_faces.append((prev+s, prev+n, cur+n, cur+s))
    # Two child branches
    if level < max_level:
        split_h = z + height * 0.6
        for dx in (-0.05, 0.05):
            fan_branch(x + dx, split_h, height * 0.55, level + 1, max_level)

fan_branch(0, 0, 0.65, 0, FAN_LEVELS)
coral02 = new_mesh_obj("coral_02", fan_verts, fan_faces)

bm = bmesh.new()
bm.from_mesh(coral02.data)
cl = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        z = loop.vert.co.z
        t = min(1, max(0, z / 0.65))
        loop[cl] = (0.80, 0.20 + t*0.30, 0.55 + t*0.15, 1.0)  # purple-pink
bm.to_mesh(coral02.data)
bm.free()

mat02 = bpy.data.materials.new("coral_02_mat")
mat02.use_nodes = True
bsdf2 = mat02.node_tree.nodes["Principled BSDF"]
bsdf2.inputs["Roughness"].default_value = 0.65
bsdf2.inputs["Subsurface Weight"].default_value = 0.06
vc2 = mat02.node_tree.nodes.new("ShaderNodeVertexColor")
vc2.layer_name = "Col"
mat02.node_tree.links.new(vc2.outputs["Color"], bsdf2.inputs["Base Color"])
coral02.data.materials.append(mat02)

bpy.context.view_layer.objects.active = coral02
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.select_all(action='DESELECT')
coral02.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/coral_02.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    use_selection=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print("[OK] Exported: coral_02.glb")

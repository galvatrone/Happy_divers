"""
create_reef_rock.py — Generic seafloor rock (300–800 tris)
Run: blender --background --python create_reef_rock.py

Static prop. Vertex colours only.
"""

import bpy, bmesh, math, random
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)

random.seed(7)

# Start from a UV sphere, then displace vertices randomly
bpy.ops.mesh.primitive_uv_sphere_add(
    radius=0.5, segments=12, ring_count=8, location=(0, 0, 0.22),
)
rock = bpy.context.active_object
rock.name = "reef_rock"
rock.scale = (1.0, 0.78, 0.55)  # squash vertically — rocks are not spheres
bpy.ops.object.transform_apply(scale=True)

# Displace vertices for organic feel
me = rock.data
bm = bmesh.new()
bm.from_mesh(me)

for vert in bm.verts:
    # Don't displace bottom (keep flat base)
    if vert.co.z < -0.10: continue
    noise = random.uniform(-0.08, 0.08)
    vert.co += vert.normal * noise

# Vertex colours — grey-brown rock with darker crevices
col_layer = bm.loops.layers.color.new("Col")
for face in bm.faces:
    for loop in face.loops:
        z = loop.vert.co.z
        t = (z + 0.30) / 0.60  # normalise
        t = max(0, min(1, t))
        # Top lighter, bottom / crevices darker
        brightness = 0.30 + t * 0.22
        warmth = random.uniform(-0.02, 0.02)
        loop[col_layer] = (
            brightness + warmth + 0.04,
            brightness + warmth,
            brightness - 0.02,
            1.0,
        )

bm.to_mesh(me)
bm.free()

# Flatten base: clamp Z
bm2 = bmesh.new()
bm2.from_mesh(me)
for v in bm2.verts:
    if v.co.z < -0.15: v.co.z = -0.15
bm2.to_mesh(me)
bm2.free()

# Material
mat = bpy.data.materials.new("rock_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.9
bsdf.inputs["Subsurface Weight"].default_value = 0.0
vc = mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
mat.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
rock.data.materials.append(mat)

# UV
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//../../public/assets/model/reef_rock.glb"),
    export_format='GLB', export_yup=True, export_apply=True, export_colors=True,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
)
print("[OK] Exported: reef_rock.glb")

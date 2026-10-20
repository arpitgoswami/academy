extends RefCounted
## Static helpers: cached materials, primitive meshes, environment, scenery props.

static var _mats: Dictionary = {}


static func mat(col: Color, emit: float = 0.0, metal: float = 0.0, rough: float = 0.6) -> StandardMaterial3D:
	var key: String = "%s|%s|%s|%s" % [col.to_html(true), str(emit), str(metal), str(rough)]
	if _mats.has(key):
		return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.metallic = metal
	m.roughness = rough
	if emit > 0.0:
		m.emission_enabled = true
		m.emission = Color(col.r, col.g, col.b)
		m.emission_energy_multiplier = emit
	if col.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mats[key] = m
	return m


static func unshaded(col: Color) -> StandardMaterial3D:
	var key: String = "u|" + col.to_html(true)
	if _mats.has(key):
		return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	if col.a < 1.0:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_mats[key] = m
	return m


static func add_mesh(parent: Node, mesh: Mesh, m: Material, pos: Vector3 = Vector3.ZERO, shadow: bool = true) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.material_override = m
	mi.position = pos
	if not shadow:
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(mi)
	return mi


static func add_box(parent: Node, size: Vector3, pos: Vector3, m: Material, shadow: bool = true) -> MeshInstance3D:
	var bm := BoxMesh.new()
	bm.size = size
	return add_mesh(parent, bm, m, pos, shadow)


static func add_cyl(parent: Node, top: float, bottom: float, height: float, pos: Vector3, m: Material, segs: int = 12, shadow: bool = true) -> MeshInstance3D:
	var cm := CylinderMesh.new()
	cm.top_radius = top
	cm.bottom_radius = bottom
	cm.height = height
	cm.radial_segments = segs
	cm.rings = 1
	return add_mesh(parent, cm, m, pos, shadow)


static func add_sphere(parent: Node, radius: float, pos: Vector3, m: Material, segs: int = 12, shadow: bool = true) -> MeshInstance3D:
	var sm := SphereMesh.new()
	sm.radius = radius
	sm.height = radius * 2.0
	sm.radial_segments = segs
	sm.rings = maxi(2, segs / 2)
	return add_mesh(parent, sm, m, pos, shadow)


static func build_environment(parent: Node, dark: bool = false) -> Dictionary:
	var we := WorldEnvironment.new()
	var env := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	var fog_col: Color
	if dark:
		sm.sky_top_color = Color("03050f")
		sm.sky_horizon_color = Color("1a1650")
		sm.ground_horizon_color = Color("1a1650")
		sm.ground_bottom_color = Color("05060f")
		fog_col = Color("0d0f38")
	else:
		sm.sky_top_color = Color("1b2f86")
		sm.sky_horizon_color = Color("ff8fc2")
		sm.ground_horizon_color = Color("ff8fc2")
		sm.ground_bottom_color = Color("2a1a5e")
		fog_col = Color("d98ac8")
	sm.sky_curve = 0.2
	sky.sky_material = sm
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.8
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_bloom = 0.08
	env.fog_enabled = true
	env.fog_light_color = fog_col
	env.fog_density = 0.0085 if not dark else 0.012
	env.fog_sky_affect = 0.35
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.15
	we.environment = env
	parent.add_child(we)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52, -35, 0)
	sun.light_energy = 1.1 if not dark else 0.7
	sun.light_color = Color("fff0e0") if not dark else Color("9fb4ff")
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 70.0
	parent.add_child(sun)
	return {"env": env, "sun": sun}


static func apply_quality(d: Dictionary, q: int, vp: Viewport) -> void:
	var env: Environment = d["env"]
	var sun: DirectionalLight3D = d["sun"]
	sun.shadow_enabled = q >= 1
	sun.directional_shadow_max_distance = 40.0 if q == 1 else 70.0
	env.glow_enabled = q >= 1
	if q >= 2:
		vp.msaa_3d = Viewport.MSAA_4X
	elif q == 1:
		vp.msaa_3d = Viewport.MSAA_2X
	else:
		vp.msaa_3d = Viewport.MSAA_DISABLED


static func build_cloud(parent: Node, rng: RandomNumberGenerator, pos: Vector3) -> void:
	var holder := Node3D.new()
	holder.position = pos
	parent.add_child(holder)
	var m: StandardMaterial3D = unshaded(Color(1, 1, 1, 0.78))
	var s: float = rng.randf_range(4.0, 9.0)
	for i in rng.randi_range(3, 4):
		var sp := add_sphere(holder, s * rng.randf_range(0.5, 0.9), Vector3(rng.randf_range(-s, s), rng.randf_range(-0.3, 0.5) * s, rng.randf_range(-s, s) * 0.5), m, 8, false)
		sp.scale = Vector3(1.3, 0.55, 1.0)


static func build_island(parent: Node, rng: RandomNumberGenerator, pos: Vector3, r: float) -> void:
	var holder := Node3D.new()
	holder.position = pos
	parent.add_child(holder)
	var palettes: Array = [["2fd6a3", "5b3a8c"], ["8be04e", "6b4a3a"], ["49c6ff", "3a3a7a"]]
	var pal: Array = palettes[rng.randi_range(0, 2)]
	add_cyl(holder, r, r * 0.95, 1.0, Vector3.ZERO, mat(Color(pal[0]), 0.1, 0.0, 0.8), 10, false)
	add_cyl(holder, r * 0.95, 0.0, r * 1.7, Vector3(0, -0.5 - r * 0.85, 0), mat(Color(pal[1]), 0.0, 0.0, 0.9), 10, false)
	for i in rng.randi_range(1, 3):
		var a: float = rng.randf() * TAU
		var d: float = rng.randf_range(0.0, r * 0.6)
		var h: float = rng.randf_range(1.0, 2.6)
		var crystal_col: Color = [Color("00f0ff"), Color("ff40d0"), Color("ffb020")][rng.randi_range(0, 2)]
		add_cyl(holder, 0.0, 0.35, h, Vector3(cos(a) * d, 0.5 + h * 0.5, sin(a) * d), mat(crystal_col, 1.6, 0.0, 0.3), 5, false)


static func build_tower(parent: Node, rng: RandomNumberGenerator, pos: Vector3) -> void:
	var h: float = rng.randf_range(25.0, 55.0)
	var holder := Node3D.new()
	holder.position = pos
	parent.add_child(holder)
	add_box(holder, Vector3(3.0, h, 3.0), Vector3(0, h * 0.5 - 20.0, 0), mat(Color("1a1f4a"), 0.0, 0.6, 0.4), false)
	var wc: Color = [Color("00f0ff"), Color("ff40d0"), Color("ffb020")][rng.randi_range(0, 2)]
	for i in 6:
		add_box(holder, Vector3(3.1, 0.3, 3.1), Vector3(0, -18.0 + float(i) * h / 6.5, 0), mat(wc, 1.8), false)

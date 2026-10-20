extends RefCounted
## Procedural box characters: 10 skins, no external assets.

const WB := preload("res://scripts/world/world_builder.gd")

const SKINS: Array = [
	{"name": "Classic Box", "price": 0, "body": "2f7bff", "accent": "bfe0ff", "glow": "2f7bff", "energy": 0.25, "metal": 0.2, "rough": 0.4, "tex": "", "edge": "", "acc": ""},
	{"name": "Lava Box", "price": 100, "body": "ffffff", "accent": "ffd23a", "glow": "ff5a10", "energy": 1.6, "metal": 0.0, "rough": 0.7, "tex": "lava", "edge": "ff7a00", "acc": "horns"},
	{"name": "Neon Box", "price": 150, "body": "0b1630", "accent": "00f0ff", "glow": "00f0ff", "energy": 0.0, "metal": 0.5, "rough": 0.2, "tex": "", "edge": "00f0ff", "acc": "antenna"},
	{"name": "Gold Box", "price": 250, "body": "ffc83a", "accent": "fff1b0", "glow": "ffb400", "energy": 0.15, "metal": 1.0, "rough": 0.22, "tex": "", "edge": "", "acc": ""},
	{"name": "Toxic Box", "price": 300, "body": "ffffff", "accent": "58ff2a", "glow": "58ff2a", "energy": 0.9, "metal": 0.0, "rough": 0.5, "tex": "hazard", "edge": "", "acc": "antenna"},
	{"name": "Shadow Box", "price": 350, "body": "140c20", "accent": "b040ff", "glow": "8a2be2", "energy": 0.5, "metal": 0.7, "rough": 0.3, "tex": "", "edge": "b040ff", "acc": "spikes"},
	{"name": "Frost Box", "price": 400, "body": "ffffff", "accent": "ffffff", "glow": "7fd8ff", "energy": 0.35, "metal": 0.1, "rough": 0.08, "tex": "frost", "edge": "", "acc": "halo"},
	{"name": "Pixel Box", "price": 450, "body": "ffffff", "accent": "ffe14a", "glow": "ffffff", "energy": 0.25, "metal": 0.0, "rough": 0.9, "tex": "pixels", "edge": "", "acc": ""},
	{"name": "Galaxy Box", "price": 600, "body": "ffffff", "accent": "ff7af0", "glow": "7a4bff", "energy": 1.0, "metal": 0.3, "rough": 0.4, "tex": "stars", "edge": "b58aff", "acc": "halo"},
	{"name": "Royal Box", "price": 800, "body": "5a1a9a", "accent": "ffd23a", "glow": "ffd23a", "energy": 0.2, "metal": 0.7, "rough": 0.28, "tex": "", "edge": "ffd23a", "acc": "crown"},
]

static var _tex_cache: Dictionary = {}


static func skin_count() -> int:
	return SKINS.size()


static func info(i: int) -> Dictionary:
	return SKINS[clampi(i, 0, SKINS.size() - 1)]


static func preview_color(i: int) -> Color:
	var s: Dictionary = info(i)
	var c: Color = Color(String(s["body"]))
	if String(s["tex"]) != "":
		c = Color(String(s["glow"]))
	return c


static func _tex(kind: String) -> ImageTexture:
	if _tex_cache.has(kind):
		return _tex_cache[kind]
	var size: int = 8 if kind == "pixels" else 64
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var n := FastNoiseLite.new()
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	n.seed = 11
	var rng := RandomNumberGenerator.new()
	rng.seed = 5
	match kind:
		"lava":
			n.frequency = 0.07
			for y in size:
				for x in size:
					var v: float = n.get_noise_2d(x, y)
					var c: Color = Color("3a0c05").lerp(Color("ff5a10"), clampf(v * 2.2 + 0.4, 0.0, 1.0))
					if v > 0.22:
						c = Color("ffd23a")
					img.set_pixel(x, y, c)
		"stars":
			n.frequency = 0.05
			for y in size:
				for x in size:
					var v2: float = n.get_noise_2d(x, y) * 0.5 + 0.5
					img.set_pixel(x, y, Color("12062e").lerp(Color("8a2bd0"), v2 * 0.9))
			for i in 28:
				img.set_pixel(rng.randi_range(0, size - 1), rng.randi_range(0, size - 1), Color.WHITE)
		"pixels":
			var pal: Array = [Color("ff4d4d"), Color("ffd23a"), Color("4dff88"), Color("4da6ff"), Color("c84dff")]
			for y in size:
				for x in size:
					img.set_pixel(x, y, pal[rng.randi_range(0, pal.size() - 1)])
		"hazard":
			for y in size:
				for x in size:
					var on: bool = ((x + y) / 10) % 2 == 0
					img.set_pixel(x, y, Color("58ff2a") if on else Color("0f2a0a"))
		"frost":
			n.frequency = 0.09
			for y in size:
				for x in size:
					var v3: float = n.get_noise_2d(x, y) * 0.5 + 0.5
					img.set_pixel(x, y, Color("9fdcff").lerp(Color.WHITE, v3))
	var t := ImageTexture.create_from_image(img)
	_tex_cache[kind] = t
	return t


static func prewarm() -> void:
	for kind in ["lava", "stars", "pixels", "hazard", "frost"]:
		_tex(kind)


static func _body_mat(s: Dictionary) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(String(s["body"]))
	m.metallic = float(s["metal"])
	m.roughness = float(s["rough"])
	var kind: String = String(s["tex"])
	if kind != "":
		var t: ImageTexture = _tex(kind)
		m.albedo_texture = t
		if kind == "pixels":
			m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
		if float(s["energy"]) > 0.0 and (kind == "lava" or kind == "stars" or kind == "hazard"):
			m.emission_enabled = true
			m.emission_texture = t
			m.emission = Color(1, 1, 1)
			m.emission_energy_multiplier = float(s["energy"]) * 0.7
	elif float(s["energy"]) > 0.0:
		m.emission_enabled = true
		m.emission = Color(String(s["glow"]))
		m.emission_energy_multiplier = float(s["energy"])
	return m


static func build_model(index: int) -> Node3D:
	var s: Dictionary = info(index)
	var root := Node3D.new()
	root.name = "Model"
	var body := Node3D.new()
	body.name = "Body"
	body.position = Vector3(0, 0.52, 0)
	root.add_child(body)
	var bm: StandardMaterial3D = _body_mat(s)
	# three overlapping boxes give a chamfered / beveled silhouette
	WB.add_box(body, Vector3(0.9, 0.76, 0.76), Vector3.ZERO, bm)
	WB.add_box(body, Vector3(0.76, 0.9, 0.76), Vector3.ZERO, bm)
	WB.add_box(body, Vector3(0.76, 0.76, 0.9), Vector3.ZERO, bm)
	var accent: Color = Color(String(s["accent"]))
	var acc_m: StandardMaterial3D = WB.mat(accent, 1.2, 0.3, 0.4)
	var white: StandardMaterial3D = WB.mat(Color.WHITE, 0.6)
	var black: StandardMaterial3D = WB.mat(Color("0a0a14"))
	# face (front = -Z)
	for sx in [-0.19, 0.19]:
		WB.add_box(body, Vector3(0.2, 0.25, 0.04), Vector3(sx, 0.1, -0.455), white, false)
		WB.add_box(body, Vector3(0.1, 0.15, 0.04), Vector3(sx, 0.09, -0.48), black, false)
	WB.add_box(body, Vector3(0.22, 0.05, 0.04), Vector3(0, -0.14, -0.455), black, false)
	# backpack / thruster (visible to the chase camera)
	WB.add_box(body, Vector3(0.5, 0.5, 0.1), Vector3(0, 0.0, 0.47), acc_m, false)
	WB.add_box(body, Vector3(0.3, 0.3, 0.04), Vector3(0, 0.0, 0.53), WB.mat(accent, 2.5), false)
	# arms
	for side in [-1.0, 1.0]:
		var arm := Node3D.new()
		arm.name = "ArmL" if side < 0.0 else "ArmR"
		arm.position = Vector3(side * 0.53, 0.12, 0)
		body.add_child(arm)
		WB.add_box(arm, Vector3(0.14, 0.4, 0.16), Vector3(0, -0.2, 0), acc_m, false)
	# feet
	for side2 in [-1.0, 1.0]:
		var foot := WB.add_box(body, Vector3(0.26, 0.1, 0.36), Vector3(side2 * 0.2, -0.5, -0.04), black, false)
		foot.name = "FootL" if side2 < 0.0 else "FootR"
	# glowing edges
	if String(s["edge"]) != "":
		var em: StandardMaterial3D = WB.mat(Color(String(s["edge"])), 3.0)
		for a in [-1.0, 1.0]:
			for b in [-1.0, 1.0]:
				WB.add_box(body, Vector3(0.045, 0.045, 0.93), Vector3(a * 0.455, b * 0.455, 0), em, false)
				WB.add_box(body, Vector3(0.045, 0.93, 0.045), Vector3(a * 0.455, 0, b * 0.455), em, false)
				WB.add_box(body, Vector3(0.93, 0.045, 0.045), Vector3(0, a * 0.455, b * 0.455), em, false)
	# accessories
	var gold: StandardMaterial3D = WB.mat(Color("ffd23a"), 1.5, 0.9, 0.2)
	match String(s["acc"]):
		"crown":
			WB.add_box(body, Vector3(0.5, 0.1, 0.5), Vector3(0, 0.5, 0), gold)
			for cx in [-0.2, 0.2]:
				for cz in [-0.2, 0.2]:
					WB.add_cyl(body, 0.0, 0.07, 0.2, Vector3(cx, 0.65, cz), gold, 4, false)
			WB.add_sphere(body, 0.07, Vector3(0, 0.58, -0.25), WB.mat(Color("ff2a6a"), 2.5), 8, false)
		"horns":
			for hx in [-0.25, 0.25]:
				var h := WB.add_cyl(body, 0.0, 0.09, 0.32, Vector3(hx, 0.58, 0), WB.mat(Color("2a0a05"), 0.6, 0.2, 0.5), 6, false)
				h.rotation.z = -signf(hx) * 0.35
		"antenna":
			WB.add_cyl(body, 0.02, 0.02, 0.3, Vector3(0.18, 0.6, 0), WB.mat(Color("22222a"), 0.0, 0.8, 0.3), 6, false)
			WB.add_sphere(body, 0.08, Vector3(0.18, 0.78, 0), WB.mat(accent, 3.0), 8, false)
		"spikes":
			for sxp in [-0.22, 0.0, 0.22]:
				WB.add_cyl(body, 0.0, 0.08, 0.28, Vector3(sxp, 0.56, 0.05), WB.mat(Color("b040ff"), 1.8), 5, false)
		"halo":
			var t := TorusMesh.new()
			t.inner_radius = 0.2
			t.outer_radius = 0.28
			WB.add_mesh(body, t, WB.mat(accent, 3.0), Vector3(0, 0.78, 0), false)
	return root

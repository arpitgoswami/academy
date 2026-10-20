extends RefCounted
## Coin and power-up visuals + power-up metadata (used by gameplay and the info screen).

const WB := preload("res://scripts/world/world_builder.gd")

const ORDER: Array = ["magnet", "shield", "boost", "double", "hover", "multiplier"]

const INFO: Dictionary = {
	"magnet": {"name": "COIN MAGNET", "color": "ff7a1a", "duration": 10.0,
		"desc": "Pulls nearby coins straight to you.", "tip": "Great for coin trails in neighbouring lanes."},
	"shield": {"name": "SHIELD", "color": "28d8ff", "duration": 12.0,
		"desc": "Absorbs one crash, then shatters. You get a short moment of safety afterwards.", "tip": "Does not save you from falling into a gap."},
	"boost": {"name": "SPEED BOOST", "color": "ffd21a", "duration": 5.0,
		"desc": "Surge forward at +50% speed. Obstacles are smashed and you hover over gaps.", "tip": "Won't end while you are over a gap."},
	"double": {"name": "DOUBLE COINS", "color": "ffc01a", "duration": 15.0,
		"desc": "Every coin you collect counts twice.", "tip": "Stacks nicely with the multiplier."},
	"hover": {"name": "HOVER BOARD", "color": "ff3df0", "duration": 25.0,
		"desc": "Survives one fatal hit or fall, grants a double jump, then disappears.", "tip": "Press jump again in mid-air."},
	"multiplier": {"name": "SCORE x3", "color": "9a4dff", "duration": 12.0,
		"desc": "Score from coins is tripled while active.", "tip": "Combine with Double Coins for huge scores."},
}

static var _coin_mesh: CylinderMesh
static var _rim_mesh: CylinderMesh


static func power_color(id: String) -> Color:
	var d: Dictionary = INFO[id]
	return Color(String(d["color"]))


static func build_coin() -> Node3D:
	if _coin_mesh == null:
		_coin_mesh = CylinderMesh.new()
		_coin_mesh.top_radius = 0.3
		_coin_mesh.bottom_radius = 0.3
		_coin_mesh.height = 0.07
		_coin_mesh.radial_segments = 16
		_coin_mesh.rings = 1
		_rim_mesh = CylinderMesh.new()
		_rim_mesh.top_radius = 0.22
		_rim_mesh.bottom_radius = 0.22
		_rim_mesh.height = 0.1
		_rim_mesh.radial_segments = 16
		_rim_mesh.rings = 1
	var root := Node3D.new()
	var a := WB.add_mesh(root, _coin_mesh, WB.mat(Color("ffb81a"), 1.6, 0.8, 0.3), Vector3.ZERO, false)
	a.rotation.x = PI * 0.5
	var b := WB.add_mesh(root, _rim_mesh, WB.mat(Color("ffe27a"), 2.2, 0.5, 0.3), Vector3.ZERO, false)
	b.rotation.x = PI * 0.5
	return root


static func build_power(id: String) -> Node3D:
	var root := Node3D.new()
	var col: Color = power_color(id)
	var m: StandardMaterial3D = WB.mat(col, 2.0, 0.2, 0.3)
	match id:
		"magnet":
			var t := TorusMesh.new()
			t.inner_radius = 0.22
			t.outer_radius = 0.42
			WB.add_mesh(root, t, m, Vector3.ZERO, false).rotation.x = PI * 0.5
			WB.add_box(root, Vector3(0.14, 0.14, 0.3), Vector3(-0.3, -0.2, 0), WB.mat(Color.WHITE, 1.0), false)
			WB.add_box(root, Vector3(0.14, 0.14, 0.3), Vector3(0.3, -0.2, 0), WB.mat(Color.WHITE, 1.0), false)
		"shield":
			WB.add_sphere(root, 0.4, Vector3.ZERO, m, 8, false)
		"boost":
			WB.add_cyl(root, 0.0, 0.34, 0.8, Vector3.ZERO, m, 6, false)
		"double":
			WB.add_cyl(root, 0.34, 0.34, 0.08, Vector3(0, 0.1, 0), m, 14, false).rotation.x = PI * 0.5
			WB.add_cyl(root, 0.34, 0.34, 0.08, Vector3(0, -0.1, 0), WB.mat(Color("ff7a1a"), 2.0), 14, false).rotation.x = PI * 0.5
		"hover":
			WB.add_box(root, Vector3(0.9, 0.1, 0.5), Vector3.ZERO, m, false)
			WB.add_box(root, Vector3(0.7, 0.05, 0.3), Vector3(0, 0.07, 0), WB.mat(Color.WHITE, 1.0), false)
		"multiplier":
			WB.add_sphere(root, 0.4, Vector3.ZERO, m, 4, false)
	WB.add_sphere(root, 0.62, Vector3.ZERO, WB.unshaded(Color(col.r, col.g, col.b, 0.22)), 12, false)
	return root

extends RefCounted
## Builds obstacle visuals + hitbox data from primitives.

const WB := preload("res://scripts/world/world_builder.gd")
const WT := preload("res://scripts/world/world_types.gd")


static func build(type: String) -> WT.Obstacle:
	var o := WT.Obstacle.new()
	o.type = type
	var root := Node3D.new()
	o.node = root
	var red: StandardMaterial3D = WB.mat(Color("ff4a2a"), 0.25, 0.1, 0.5)
	var yellow: StandardMaterial3D = WB.mat(Color("ffd23a"), 2.0)
	var dark: StandardMaterial3D = WB.mat(Color("23233a"), 0.0, 0.7, 0.4)
	var magenta: StandardMaterial3D = WB.mat(Color("e63cff"), 0.9, 0.2, 0.4)
	match type:
		"low":
			WB.add_box(root, Vector3(1.9, 0.9, 0.7), Vector3(0, 0.45, 0), red)
			WB.add_box(root, Vector3(1.95, 0.12, 0.75), Vector3(0, 0.92, 0), yellow, false)
			for sx in [-0.6, 0.0, 0.6]:
				WB.add_box(root, Vector3(0.18, 0.5, 0.72), Vector3(sx, 0.45, 0), yellow, false).rotation.z = 0.5
			o.hx = 0.95; o.hz = 0.35; o.y0 = 0.0; o.y1 = 0.9
		"overhead":
			for sx in [-1.0, 1.0]:
				WB.add_box(root, Vector3(0.2, 3.0, 0.3), Vector3(sx, 1.5, 0), dark)
			WB.add_box(root, Vector3(2.2, 1.0, 0.35), Vector3(0, 1.45, 0), magenta)
			WB.add_box(root, Vector3(2.2, 0.08, 0.4), Vector3(0, 0.95, 0), yellow, false)
			o.hx = 1.0; o.hz = 0.2; o.y0 = 0.95; o.y1 = 3.0
		"crate":
			WB.add_box(root, Vector3(1.9, 2.8, 1.9), Vector3(0, 1.4, 0), WB.mat(Color("c8641e"), 0.15, 0.2, 0.6))
			for cx in [-0.95, 0.95]:
				for cz in [-0.95, 0.95]:
					WB.add_box(root, Vector3(0.14, 2.85, 0.14), Vector3(cx, 1.4, cz), yellow, false)
			for cy in [0.5, 1.4, 2.3]:
				WB.add_box(root, Vector3(1.96, 0.1, 1.96), Vector3(0, cy, 0), WB.mat(Color("ff9a3c"), 0.8), false)
			o.hx = 0.95; o.hz = 0.95; o.y0 = 0.0; o.y1 = 2.8
		"moving":
			WB.add_box(root, Vector3(1.4, 1.2, 1.4), Vector3(0, 0.7, 0), WB.mat(Color("7a2be2"), 0.5, 0.3, 0.4))
			WB.add_sphere(root, 0.28, Vector3(0, 0.8, -0.72), WB.mat(Color.WHITE, 1.0), 10, false)
			WB.add_sphere(root, 0.13, Vector3(0, 0.8, -0.95), WB.mat(Color.BLACK), 8, false)
			WB.add_box(root, Vector3(1.5, 0.1, 1.5), Vector3(0, 0.15, 0), yellow, false)
			o.hx = 0.7; o.hz = 0.7; o.y0 = 0.1; o.y1 = 1.3
			o.moving = true
		"gate":
			for sx in [-0.95, 0.95]:
				WB.add_box(root, Vector3(0.25, 1.6, 0.25), Vector3(sx, 0.8, 0), dark)
				WB.add_sphere(root, 0.2, Vector3(sx, 1.65, 0), WB.mat(Color("00f0ff"), 2.5), 8, false)
			var beam := Node3D.new()
			root.add_child(beam)
			var bm: StandardMaterial3D = WB.unshaded(Color("7df9ff"))
			WB.add_box(beam, Vector3(1.7, 0.12, 0.12), Vector3(0, 0.45, 0), bm, false)
			WB.add_box(beam, Vector3(1.7, 0.12, 0.12), Vector3(0, 0.85, 0), bm, false)
			WB.add_box(beam, Vector3(1.7, 0.5, 0.04), Vector3(0, 0.65, 0), WB.unshaded(Color(0.2, 0.9, 1.0, 0.35)), false)
			o.beam = beam
			o.hx = 1.0; o.hz = 0.3; o.y0 = 0.0; o.y1 = 1.1
			o.gate = true
	return o

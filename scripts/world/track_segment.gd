extends Node3D
## One recyclable 36 m piece of track: 12 road tiles + scenery + dynamic content.

const WB := preload("res://scripts/world/world_builder.gd")
const WT := preload("res://scripts/world/world_types.gd")
const OF := preload("res://scripts/world/obstacle_factory.gd")
const PF := preload("res://scripts/world/pickup_factory.gd")

const TILE_LEN: float = 3.0
const TILES: int = 12
const SEG_LEN: float = 36.0
const LANE_W: float = 2.2
const ROAD_W: float = 7.4

var seg_start: float = 0.0
var tiles: Array = []
var dyn: Node3D
var obstacles: Array = []
var dyn_obstacles: Array = []
var pickups: Array = []
var gaps: Array = []
var _tunnel: Node3D
var _bridge: Node3D


func build_static(seed_value: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value
	var road: StandardMaterial3D = WB.mat(Color("0d1a3c"), 0.0, 0.5, 0.3)
	var cyan: StandardMaterial3D = WB.mat(Color("00e5ff"), 2.2)
	var dash: StandardMaterial3D = WB.mat(Color("2a8cff"), 1.6)
	for i in TILES:
		var tile := Node3D.new()
		tile.position = Vector3(0, 0, -(float(i) + 0.5) * TILE_LEN)
		add_child(tile)
		WB.add_box(tile, Vector3(ROAD_W, 0.5, TILE_LEN), Vector3(0, -0.25, 0), road, false)
		for sx in [-1.1, 1.1]:
			WB.add_box(tile, Vector3(0.07, 0.02, 1.5), Vector3(sx, 0.01, 0), dash, false)
		for sx2 in [-1.0, 1.0]:
			WB.add_box(tile, Vector3(0.22, 0.26, TILE_LEN), Vector3(sx2 * (ROAD_W * 0.5 - 0.11), 0.13, 0), cyan, false)
		tiles.append(tile)
	dyn = Node3D.new()
	add_child(dyn)
	# pylons
	var pm: StandardMaterial3D = WB.mat(Color("161c46"), 0.0, 0.6, 0.4)
	for k in 3:
		for sx3 in [-1.0, 1.0]:
			var zz: float = -(float(k) * 12.0 + 6.0)
			WB.add_box(self, Vector3(0.5, 5.0, 0.5), Vector3(sx3 * 5.6, 2.5, zz), pm)
			WB.add_box(self, Vector3(0.8, 0.3, 0.8), Vector3(sx3 * 5.6, 5.1, zz), WB.mat([Color("ff40d0"), Color("00e5ff")][(k + (0 if sx3 < 0.0 else 1)) % 2], 2.5), false)
	# floating props
	for i in 5:
		var side: float = -1.0 if rng.randf() < 0.5 else 1.0
		var c: Color = [Color("00e5ff"), Color("ff40d0"), Color("ffb020")][rng.randi_range(0, 2)]
		var cube := WB.add_box(self, Vector3.ONE * rng.randf_range(0.4, 1.0), Vector3(side * rng.randf_range(8.0, 16.0), rng.randf_range(2.0, 9.0), -rng.randf() * SEG_LEN), WB.mat(c, 1.8), false)
		cube.rotation = Vector3(rng.randf() * TAU, rng.randf() * TAU, 0)
	# tunnel arches (visible on tunnel segments)
	_tunnel = Node3D.new()
	add_child(_tunnel)
	for k in 6:
		var az: float = -(float(k) * 6.0 + 3.0)
		for sx4 in [-4.2, 4.2]:
			WB.add_box(_tunnel, Vector3(0.4, 5.6, 0.4), Vector3(sx4, 2.8, az), pm, false)
		WB.add_box(_tunnel, Vector3(8.8, 0.4, 0.5), Vector3(0, 5.6, az), pm, false)
		WB.add_box(_tunnel, Vector3(7.8, 0.1, 0.15), Vector3(0, 5.35, az), cyan, false)
	_tunnel.visible = false
	# bridge rails
	_bridge = Node3D.new()
	add_child(_bridge)
	var rail: StandardMaterial3D = WB.mat(Color("ff40d0"), 2.0)
	for sx5 in [-3.9, 3.9]:
		WB.add_box(_bridge, Vector3(0.1, 0.1, SEG_LEN), Vector3(sx5, 1.1, -SEG_LEN * 0.5), rail, false)
		for k in 12:
			WB.add_box(_bridge, Vector3(0.1, 1.1, 0.1), Vector3(sx5, 0.55, -(float(k) + 0.5) * TILE_LEN), pm, false)
	_bridge.visible = false
	# distant world: clouds, islands, towers
	for sx6 in [-1.0, 1.0]:
		for i in 2:
			WB.build_cloud(self, rng, Vector3(sx6 * rng.randf_range(22.0, 70.0), rng.randf_range(-14.0, 10.0), -rng.randf() * SEG_LEN))
		if rng.randf() < 0.8:
			WB.build_island(self, rng, Vector3(sx6 * rng.randf_range(12.0, 30.0), rng.randf_range(-14.0, -6.0), -rng.randf() * SEG_LEN), rng.randf_range(3.0, 6.0))
		if rng.randf() < 0.6:
			WB.build_island(self, rng, Vector3(sx6 * rng.randf_range(45.0, 100.0), rng.randf_range(-30.0, -8.0), -rng.randf() * SEG_LEN), rng.randf_range(8.0, 16.0))
		if rng.randf() < 0.35:
			WB.build_tower(self, rng, Vector3(sx6 * rng.randf_range(40.0, 90.0), 0, -rng.randf() * SEG_LEN))


func set_theme(t: int) -> void:
	_tunnel.visible = t == 1
	_bridge.visible = t == 2


func clear_dynamic() -> void:
	for c in dyn.get_children():
		c.queue_free()
	obstacles.clear()
	dyn_obstacles.clear()
	pickups.clear()
	gaps.clear()
	for t in tiles:
		t.visible = true


func apply(content: Dictionary, idx: int) -> void:
	seg_start = float(idx) * SEG_LEN
	clear_dynamic()
	if content.is_empty():
		return
	var warn: StandardMaterial3D = WB.mat(Color("ff7a1a"), 2.5)
	for g in content["gaps"]:
		var gd: Dictionary = g
		var gp := WT.Gap.new()
		gp.z0 = -(float(gd["d0"]) - seg_start)
		gp.z1 = -(float(gd["d1"]) - seg_start)
		gaps.append(gp)
		for i in TILES:
			var cz: float = -(float(i) + 0.5) * TILE_LEN
			if cz < gp.z0 and cz > gp.z1:
				(tiles[i] as Node3D).visible = false
		WB.add_box(dyn, Vector3(ROAD_W, 0.03, 0.4), Vector3(0, 0.02, gp.z0 + 0.3), warn, false)
	for od in content["obstacles"]:
		var d: Dictionary = od
		var o: WT.Obstacle = OF.build(String(d["type"]))
		o.base_x = float(int(d["lane"])) * LANE_W
		if o.moving:
			o.base_x = 0.0
		o.x = o.base_x
		o.z = -(float(d["d"]) - seg_start)
		o.phase = float(d["phase"])
		o.node.position = Vector3(o.x, 0, o.z)
		dyn.add_child(o.node)
		obstacles.append(o)
		if o.moving or o.gate:
			dyn_obstacles.append(o)
	for cd in content["coins"]:
		var c: Dictionary = cd
		var p := WT.Pickup.new()
		p.x = float(c["x"])
		p.y = float(c["y"])
		p.z = -(float(c["d"]) - seg_start)
		p.node = PF.build_coin()
		p.node.position = Vector3(p.x, p.y, p.z)
		dyn.add_child(p.node)
		pickups.append(p)
	for pd in content["powers"]:
		var q: Dictionary = pd
		var p2 := WT.Pickup.new()
		p2.kind = "power"
		p2.id = String(q["id"])
		p2.x = float(q["x"])
		p2.y = float(q["y"])
		p2.z = -(float(q["d"]) - seg_start)
		p2.node = PF.build_power(p2.id)
		p2.node.position = Vector3(p2.x, p2.y, p2.z)
		dyn.add_child(p2.node)
		pickups.append(p2)

extends SceneTree
var cur: Node
var n := 0
func _initialize() -> void:
	root.get_node("SaveManager").save_path = "user://soak.json"
	cur = load("res://scenes/game.tscn").instantiate()
	root.add_child(cur)
func _process(_d: float) -> bool:
	n += 1
	cur.player.invuln = 99.0
	if cur.state == 1 and n % 20 == 0:
		var e := InputEventAction.new(); e.action = ["move_left","move_right","jump","slide"][randi() % 4]; e.pressed = true
		Input.parse_input_event(e)
	if n % 1500 == 0:
		print("n=", n, " dist=", int(cur.distance), " speed=", snappedf(cur.world_speed, 0.1), " tier=", cur.generator.difficulty.tier_for(cur.distance), " segs=", cur.generator.segments.size(), " nodes=", int(Performance.get_monitor(Performance.OBJECT_NODE_COUNT)))
	if n >= 9000:
		quit(0)
	return false

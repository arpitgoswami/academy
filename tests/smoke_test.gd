extends SceneTree
## Run: godot --headless --path . --script res://tests/smoke_test.gd --fixed-fps 60
var frames := 0
var stage := 0
var cur: Node
var log_ok := true
var SM: Node

func _initialize() -> void:
	SM = root.get_node("SaveManager")
	SM.save_path = "user://smoke_save.json"
	DirAccess.remove_absolute("user://smoke_save.json")
	SM.load_data()
	_load("res://scenes/loading_screen.tscn")

func _load(p: String) -> void:
	if cur: cur.queue_free()
	cur = load(p).instantiate()
	root.add_child(cur)
	frames = 0

func _press(a: String) -> void:
	var e := InputEventAction.new(); e.action = a; e.pressed = true
	Input.parse_input_event(e)

func _process(_d: float) -> bool:
	frames += 1
	match stage:
		0:
			if frames > 400:
				print("loading screen ran; scene now: ", current_scene)
				_load("res://scenes/main_menu.tscn"); stage = 1
		1:
			if frames == 30:
				cur._open_panel("skins"); cur._cycle_skin(1)
				SM.coins = 500
				cur._refresh_skins(); cur._skin_action()
				print("buy skin1 owned=", SM.is_owned(1), " coins=", SM.coins)
				cur._skin_action()
				print("no double charge coins=", SM.coins)
				for p in ["powerups","scores","settings","credits"]:
					cur._back(); cur._open_panel(p)
				cur._back()
			if frames > 90:
				_load("res://scenes/game.tscn"); stage = 2
		2:
			var g: Node = cur
			if frames == 90:
				print("state=", g.state)
			if frames > 90 and frames % 25 == 0:
				_press(["move_left","move_right","jump","slide"][(frames / 25) % 4])
			if frames == 150:
				for id in ["magnet","shield","boost","double","hover","multiplier"]:
					g.activate_powerup(id)
				print("powerups: ", g.powerups.keys())
			if frames == 400:
				for id in g.powerups.keys(): g.powerups[id].remaining = 0.01
			if frames == 450:
				print("after expire: ", g.powerups.keys(), " boost=", g.boost_mult, " dist=", int(g.distance), " coins=", g.run_coins)
				g.boost_mult = 1.0
			if frames > 450 and g.state == 1:
				g.player.invuln = 0.0
			if frames > 3000 or g.state == 3:
				print("end state=", g.state, " dist=", int(g.distance), " coins=", g.run_coins, " reason=", g.crash_reason, " frames=", frames)
				print("saved: coins=", SM.coins, " best=", SM.best_distance, " scores=", SM.highscores.size())
				g._on_restart()
				stage = 3; frames = 0
		3:
			if frames > 30:
				print("restart scene: ", current_scene)
				quit(0)
	return false

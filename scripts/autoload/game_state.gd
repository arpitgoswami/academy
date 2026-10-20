extends Node
## Global signals, input map, scene transitions.

signal run_started
signal run_ended(distance: int, coins: int, score: int)
signal player_crashed
signal distance_changed(distance: int)
signal coin_collected(run_coins: int, bank_total: int)
signal powerup_collected(id: String)
signal powerup_expired(id: String)

const SCENE_LOADING := "res://scenes/loading_screen.tscn"
const SCENE_MENU := "res://scenes/main_menu.tscn"
const SCENE_GAME := "res://scenes/game.tscn"

var next_scene: String = SCENE_MENU
var open_menu_panel: String = ""
var debug_seed: int = 0   # 0 = random; set for reproducible tracks

var _fade: ColorRect
var _transitioning: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_register_actions()
	var layer := CanvasLayer.new()
	layer.layer = 100
	add_child(layer)
	_fade = ColorRect.new()
	_fade.color = Color(0.01, 0.02, 0.05, 0.0)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(_fade)


func _register_actions() -> void:
	var map: Dictionary = {
		"move_left": [KEY_A, KEY_LEFT], "move_right": [KEY_D, KEY_RIGHT],
		"jump": [KEY_W, KEY_UP, KEY_SPACE], "slide": [KEY_S, KEY_DOWN],
		"pause": [KEY_ESCAPE],
	}
	for action in map:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for k in map[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(action, ev)


func go_to(path: String, use_loading: bool = false) -> void:
	if _transitioning:
		return
	_transitioning = true
	get_tree().paused = false
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", 1.0, 0.22)
	await tw.finished
	if use_loading:
		next_scene = path
		get_tree().change_scene_to_file(SCENE_LOADING)
	else:
		get_tree().change_scene_to_file(path)
	await get_tree().process_frame
	await get_tree().process_frame
	_transitioning = false
	fade_in()


func fade_in(duration: float = 0.3) -> void:
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", 0.0, duration)

extends Node
## Persistent data: coins, best distance, skins, high scores, settings (JSON in user://).

signal settings_changed
signal coins_changed(total: int)
signal skin_unlocked(skin_id: int)
signal skin_selected(skin_id: int)
signal high_score_achieved(distance: int)

const DEFAULT_SETTINGS: Dictionary = {
	"master": 0.8, "music": 0.6, "sfx": 0.9, "mouse_sens": 1.0,
	"quality": 2, "shake": true, "window_mode": 0, "resolution": 0,
}
const RESOLUTIONS: Array = [Vector2i(1280, 720), Vector2i(1600, 900), Vector2i(1920, 1080)]
const SKIN_COUNT: int = 10
const MAX_SCORES: int = 10

var save_path: String = "user://box_surfer_save.json"
var coins: int = 0
var best_distance: int = 0
var owned_skins: Array = [0]
var selected_skin: int = 0
var highscores: Array = []
var settings: Dictionary = DEFAULT_SETTINGS.duplicate()


func _ready() -> void:
	load_data()
	apply_window_settings()


func _to_int(v: Variant, default: int) -> int:
	if typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT:
		return int(v)
	return default


func _to_float(v: Variant, default: float) -> float:
	if typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT:
		return float(v)
	return default


func load_data() -> void:
	coins = 0
	best_distance = 0
	owned_skins = [0]
	selected_skin = 0
	highscores = []
	settings = DEFAULT_SETTINGS.duplicate()
	if not FileAccess.file_exists(save_path):
		return
	var f := FileAccess.open(save_path, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(parsed) != TYPE_DICTIONARY:
		push_warning("Save file invalid; using defaults.")
		return
	var d: Dictionary = parsed
	coins = maxi(0, _to_int(d.get("coins"), 0))
	best_distance = maxi(0, _to_int(d.get("best_distance"), 0))
	var owned: Variant = d.get("owned_skins")
	if typeof(owned) == TYPE_ARRAY:
		for s in owned:
			var sid: int = _to_int(s, -1)
			if sid >= 0 and sid < SKIN_COUNT and not owned_skins.has(sid):
				owned_skins.append(sid)
	selected_skin = _to_int(d.get("selected_skin"), 0)
	if not owned_skins.has(selected_skin):
		selected_skin = 0
	var hs: Variant = d.get("highscores")
	if typeof(hs) == TYPE_ARRAY:
		for e in hs:
			if typeof(e) == TYPE_DICTIONARY:
				var ed: Dictionary = e
				highscores.append({
					"distance": maxi(0, _to_int(ed.get("distance"), 0)),
					"coins": maxi(0, _to_int(ed.get("coins"), 0)),
					"score": maxi(0, _to_int(ed.get("score"), 0)),
				})
		_sort_scores()
	var st: Variant = d.get("settings")
	if typeof(st) == TYPE_DICTIONARY:
		var sd: Dictionary = st
		for key in DEFAULT_SETTINGS:
			if not sd.has(key):
				continue
			var def: Variant = DEFAULT_SETTINGS[key]
			if typeof(def) == TYPE_BOOL:
				settings[key] = bool(sd[key])
			elif typeof(def) == TYPE_INT:
				settings[key] = _to_int(sd[key], int(def))
			else:
				settings[key] = _to_float(sd[key], float(def))
		for k in ["master", "music", "sfx"]:
			settings[k] = clampf(float(settings[k]), 0.0, 1.0)
		settings["mouse_sens"] = clampf(float(settings["mouse_sens"]), 0.2, 3.0)
		settings["quality"] = clampi(int(settings["quality"]), 0, 2)
		settings["window_mode"] = clampi(int(settings["window_mode"]), 0, 1)
		settings["resolution"] = clampi(int(settings["resolution"]), 0, RESOLUTIONS.size() - 1)


func save_data() -> void:
	var data: Dictionary = {
		"version": 1, "coins": coins, "best_distance": best_distance,
		"owned_skins": owned_skins, "selected_skin": selected_skin,
		"highscores": highscores, "settings": settings,
	}
	var f := FileAccess.open(save_path, FileAccess.WRITE)
	if f == null:
		push_warning("Could not write save file.")
		return
	f.store_string(JSON.stringify(data, "\t"))
	f.close()


func _sort_scores() -> void:
	highscores.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return int(a["score"]) > int(b["score"]))
	if highscores.size() > MAX_SCORES:
		highscores.resize(MAX_SCORES)


func add_coins(n: int) -> void:
	if n <= 0:
		return
	coins += n
	save_data()
	coins_changed.emit(coins)


func is_owned(skin_id: int) -> bool:
	return owned_skins.has(skin_id)


func try_buy_skin(skin_id: int, price: int) -> bool:
	if skin_id < 0 or skin_id >= SKIN_COUNT or is_owned(skin_id):
		return false  # never charge twice
	if coins < price:
		return false
	coins -= price
	owned_skins.append(skin_id)
	save_data()
	coins_changed.emit(coins)
	skin_unlocked.emit(skin_id)
	return true


func select_skin(skin_id: int) -> bool:
	if not is_owned(skin_id):
		return false
	selected_skin = skin_id
	save_data()
	skin_selected.emit(skin_id)
	return true


func submit_run(distance: int, run_coins: int, score: int) -> bool:
	if distance <= 0:
		return false
	var new_best: bool = distance > best_distance
	if new_best:
		best_distance = distance
	highscores.append({"distance": distance, "coins": run_coins, "score": score})
	_sort_scores()
	save_data()
	if new_best:
		high_score_achieved.emit(distance)
	return new_best


func set_setting(key: String, value: Variant) -> void:
	settings[key] = value
	save_data()
	if key == "window_mode" or key == "resolution":
		apply_window_settings()
	settings_changed.emit()


func apply_window_settings() -> void:
	if DisplayServer.get_name() == "headless":
		return
	if int(settings["window_mode"]) == 1:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		var r: Vector2i = RESOLUTIONS[clampi(int(settings["resolution"]), 0, RESOLUTIONS.size() - 1)]
		DisplayServer.window_set_size(r)
		var scr: Vector2i = DisplayServer.screen_get_size()
		DisplayServer.window_set_position((scr - r) / 2)

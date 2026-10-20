extends Node3D
## Animated 3D menu + all sub-screens (skins, power-ups, high scores, settings, credits, exit).

const WB := preload("res://scripts/world/world_builder.gd")
const SkinBuilder := preload("res://scripts/skins/skin_builder.gd")
const PF := preload("res://scripts/world/pickup_factory.gd")
const UIT := preload("res://scripts/ui/ui_theme.gd")
const TrackGenerator := preload("res://scripts/world/track_generator.gd")
const PlayerAnim := preload("res://scripts/player/player_animation.gd")
const SettingsMenu := preload("res://scripts/ui/settings_menu.gd")

var env_refs: Dictionary = {}
var cam: Camera3D
var gen: Node3D
var holder: Node3D
var model: Node3D
var anim := PlayerAnim.new()
var pu_model: Node3D
var coin_ring: Node3D
var t: float = 0.0
var mode: String = "main"
var preview_yaw: float = 0.0
var dragging: bool = false
var skin_index: int = 0
var pu_index: int = 0

var ui: Control
var main_box: VBoxContainer
var panels: Dictionary = {}
var main_buttons: Array = []
var coins_label: Label
var best_label: Label
var confirm: Control
var first_btn: Button
# skins
var sk_name: Label
var sk_status: Label
var sk_action: Button
var sk_msg: Label
var sk_swatches: Array = []
# power-ups
var pu_title: Label
var pu_desc: Label
var pu_btns: Array = []
var scores_grid: GridContainer
var settings_menu: Control


func _ready() -> void:
	AudioManager.ensure_built()
	_build_world()
	_build_ui()
	AudioManager.play_music("menu")
	SaveManager.coins_changed.connect(func(_c: int) -> void: _refresh_stats())
	GameState.fade_in(0.4)
	if GameState.open_menu_panel != "":
		var p: String = GameState.open_menu_panel
		GameState.open_menu_panel = ""
		_open_panel(p)


func _build_world() -> void:
	env_refs = WB.build_environment(self, true)
	WB.apply_quality(env_refs, int(SaveManager.settings["quality"]), get_viewport())
	SaveManager.settings_changed.connect(func() -> void: WB.apply_quality(env_refs, int(SaveManager.settings["quality"]), get_viewport()))
	gen = TrackGenerator.new()
	add_child(gen)
	gen.setup(false)
	holder = Node3D.new()
	add_child(holder)
	skin_index = SaveManager.selected_skin
	_set_model(skin_index)
	cam = Camera3D.new()
	cam.fov = 60.0
	add_child(cam)
	cam.make_current()
	coin_ring = Node3D.new()
	add_child(coin_ring)
	for i in 12:
		var c: Node3D = PF.build_coin()
		var a: float = TAU * float(i) / 12.0
		c.position = Vector3(cos(a) * 2.2, 1.3 + sin(a * 3.0) * 0.3, sin(a) * 2.2)
		coin_ring.add_child(c)


func _set_model(i: int) -> void:
	if model != null:
		model.queue_free()
	model = SkinBuilder.build_model(i)
	holder.add_child(model)
	anim.set_model(model)
	anim.idle = true


func _process(delta: float) -> void:
	t += delta
	gen.scroll(7.0 * delta)
	anim.update(delta, false, 0.0, true, false, 0.0, 0.0)
	coin_ring.rotation.y += delta * 0.6
	for c in coin_ring.get_children():
		(c as Node3D).rotation.y = t * 3.0
	var target_pos: Vector3
	var look: Vector3
	match mode:
		"skins":
			if not dragging:
				preview_yaw += delta * 0.6
			holder.rotation.y = preview_yaw
			target_pos = Vector3(-1.2, 1.5, -3.6)
			look = Vector3(-1.2, 0.8, 0)
			holder.position = holder.position.lerp(Vector3(-1.2, 0, 0), 1.0 - exp(-6.0 * delta))
			coin_ring.visible = false
		"powerups":
			holder.visible = false
			target_pos = Vector3(0.0, 1.4, -3.4)
			look = Vector3(0, 0.9, 0)
			if pu_model != null:
				pu_model.rotation.y = t * 1.5
		_:
			holder.visible = true
			holder.rotation.y = lerp_angle(holder.rotation.y, 0.0, 1.0 - exp(-5.0 * delta))
			holder.position = holder.position.lerp(Vector3.ZERO, 1.0 - exp(-6.0 * delta))
			coin_ring.visible = true
			var a: float = PI + sin(t * 0.35) * 0.8
			target_pos = Vector3(sin(a) * 5.0, 1.9 + sin(t * 0.5) * 0.3, cos(a) * 5.0)
			look = Vector3(0, 0.9, 0)
	cam.position = cam.position.lerp(target_pos, 1.0 - exp(-3.0 * delta))
	cam.look_at(look, Vector3.UP)


# ------------------------------------------------------------------ UI
func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	ui = Control.new()
	ui.theme = UIT.build()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(ui)

	var logo := UIT.label("BOX SURFER", 92, Color.WHITE)
	logo.add_theme_color_override("font_outline_color", Color("0a6bff"))
	logo.add_theme_constant_override("outline_size", 14)
	logo.position = Vector2(56, 24)
	ui.add_child(logo)
	var tw := create_tween().set_loops()
	tw.tween_property(logo, "modulate", Color(0.8, 0.95, 1.0), 1.5)
	tw.tween_property(logo, "modulate", Color.WHITE, 1.5)

	var stats := VBoxContainer.new()
	stats.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	stats.offset_left = -320
	stats.offset_right = -28
	stats.offset_top = 24
	ui.add_child(stats)
	coins_label = UIT.label("", 34, Color("ffc41a"))
	coins_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	best_label = UIT.label("", 24, Color("9fd0ff"))
	best_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stats.add_child(coins_label)
	stats.add_child(best_label)
	_refresh_stats()

	main_box = VBoxContainer.new()
	main_box.position = Vector2(64, 200)
	main_box.add_theme_constant_override("separation", 10)
	ui.add_child(main_box)
	var items: Array = [["Play", "play"], ["Skins", "skins"], ["Power-Ups", "powerups"], ["High Scores", "scores"],
		["Settings", "settings"], ["Credits", "credits"], ["Exit Game", "exit"]]
	for it in items:
		var b := UIT.menu_button(String(it[0]), Vector2(340, 52))
		var key: String = it[1]
		b.pressed.connect(func() -> void: _on_main(key))
		main_box.add_child(b)
		main_buttons.append(b)
	first_btn = main_buttons[0]
	first_btn.grab_focus()

	_build_skins_panel()
	_build_powerups_panel()
	_build_scores_panel()
	_build_settings_panel()
	_build_credits_panel()
	_build_confirm()


func _refresh_stats() -> void:
	coins_label.text = "COINS  %d" % SaveManager.coins
	best_label.text = "BEST  %d m" % SaveManager.best_distance


func _panel(key: String, width: float = 560.0) -> VBoxContainer:
	var pc := PanelContainer.new()
	pc.set_anchors_and_offsets_preset(Control.PRESET_CENTER_RIGHT)
	pc.offset_left = -width - 40.0
	pc.offset_right = -40.0
	pc.grow_vertical = Control.GROW_DIRECTION_BOTH
	pc.visible = false
	ui.add_child(pc)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	pc.add_child(v)
	panels[key] = pc
	return v


func _back_btn(parent: Node) -> Button:
	var b := UIT.menu_button("Back", Vector2(200, 48))
	b.pressed.connect(_back)
	parent.add_child(b)
	return b


func _on_main(key: String) -> void:
	match key:
		"play":
			AudioManager.play_sfx("go")
			GameState.go_to(GameState.SCENE_GAME, true)
		"exit":
			confirm.visible = true
			(confirm.get_meta("cancel") as Button).grab_focus()
		_:
			_open_panel(key)


func _open_panel(key: String) -> void:
	if not panels.has(key):
		return
	mode = key
	main_box.visible = false
	for k in panels:
		(panels[k] as Control).visible = false
	var p: Control = panels[key]
	p.visible = true
	p.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(p, "modulate:a", 1.0, 0.25)
	match key:
		"skins":
			skin_index = SaveManager.selected_skin
			_set_model(skin_index)
			_refresh_skins()
			sk_action.grab_focus()
		"powerups":
			_show_power(0)
			(pu_btns[0] as Button).grab_focus()
		"scores":
			_fill_scores()
			(p.get_meta("back") as Button).grab_focus()
		"settings":
			settings_menu.call("focus_first")
		"credits":
			(p.get_meta("back") as Button).grab_focus()


func _back() -> void:
	if confirm.visible:
		confirm.visible = false
		(main_buttons[6] as Button).grab_focus()
		return
	if mode == "main":
		return
	var prev: String = mode
	mode = "main"
	for k in panels:
		(panels[k] as Control).visible = false
	main_box.visible = true
	if pu_model != null:
		pu_model.queue_free()
		pu_model = null
	_set_model(SaveManager.selected_skin)
	var idx: int = ["play", "skins", "powerups", "scores", "settings", "credits"].find(prev)
	(main_buttons[maxi(idx, 0)] as Button).grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_back()
		return
	if mode == "skins":
		if event.is_action_pressed("ui_left"):
			_cycle_skin(-1)
			get_viewport().set_input_as_handled()
		elif event.is_action_pressed("ui_right"):
			_cycle_skin(1)
			get_viewport().set_input_as_handled()
		elif event is InputEventKey and (event as InputEventKey).pressed:
			var k: int = (event as InputEventKey).keycode
			if k == KEY_Q:
				preview_yaw -= 0.4
			elif k == KEY_E:
				preview_yaw += 0.4
		elif event is InputEventMouseButton and (event as InputEventMouseButton).button_index == MOUSE_BUTTON_LEFT:
			dragging = (event as InputEventMouseButton).pressed and (event as InputEventMouseButton).position.x < 640.0
		elif event is InputEventMouseMotion and dragging:
			preview_yaw += (event as InputEventMouseMotion).relative.x * 0.01 * float(SaveManager.settings["mouse_sens"])


# ---- skins
func _build_skins_panel() -> void:
	var v := _panel("skins", 540.0)
	v.add_child(UIT.label("SKINS", 40, Color("00e5ff")))
	sk_name = UIT.label("", 34)
	v.add_child(sk_name)
	sk_status = UIT.label("", 22)
	v.add_child(sk_status)
	var nav := HBoxContainer.new()
	var l := UIT.menu_button("<", Vector2(60, 44))
	l.pressed.connect(func() -> void: _cycle_skin(-1))
	var r := UIT.menu_button(">", Vector2(60, 44))
	r.pressed.connect(func() -> void: _cycle_skin(1))
	nav.add_child(l)
	var hint := UIT.label("  A/D or arrows: browse - Q/E or drag: rotate  ", 14, Color("9fd0ff"))
	hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	nav.add_child(hint)
	nav.add_child(r)
	v.add_child(nav)
	var grid := GridContainer.new()
	grid.columns = 5
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	v.add_child(grid)
	for i in SkinBuilder.skin_count():
		var b := Button.new()
		b.custom_minimum_size = Vector2(92, 58)
		b.focus_mode = Control.FOCUS_NONE
		b.add_theme_font_size_override("font_size", 16)
		var idx: int = i
		b.pressed.connect(func() -> void:
			AudioManager.click()
			skin_index = idx
			_set_model(idx)
			_refresh_skins())
		grid.add_child(b)
		sk_swatches.append(b)
	sk_action = UIT.menu_button("", Vector2(540, 52))
	sk_action.pressed.connect(_skin_action)
	v.add_child(sk_action)
	sk_msg = UIT.label("", 20, Color("7dff9a"))
	v.add_child(sk_msg)
	_back_btn(v)


func _cycle_skin(d: int) -> void:
	var n: int = SkinBuilder.skin_count()
	skin_index = (skin_index + d + n) % n
	_set_model(skin_index)
	AudioManager.play_sfx("lane")
	_refresh_skins()


func _refresh_skins() -> void:
	var s: Dictionary = SkinBuilder.info(skin_index)
	var price: int = int(s["price"])
	var owned: bool = SaveManager.is_owned(skin_index)
	var selected: bool = SaveManager.selected_skin == skin_index
	sk_name.text = String(s["name"]).to_upper()
	if selected:
		sk_status.text = "SELECTED"
		sk_status.add_theme_color_override("font_color", Color("7dff9a"))
		sk_action.text = "SELECTED"
		sk_action.disabled = true
	elif owned:
		sk_status.text = "UNLOCKED"
		sk_status.add_theme_color_override("font_color", Color("9fd0ff"))
		sk_action.text = "SELECT"
		sk_action.disabled = false
	else:
		sk_status.text = "LOCKED  -  %d coins" % price
		sk_status.add_theme_color_override("font_color", Color("ff8a6a"))
		if SaveManager.coins >= price:
			sk_action.text = "BUY  (%d coins)" % price
			sk_action.disabled = false
		else:
			sk_action.text = "NEED %d MORE COINS" % (price - SaveManager.coins)
			sk_action.disabled = true
	for i in sk_swatches.size():
		var b: Button = sk_swatches[i]
		var si: Dictionary = SkinBuilder.info(i)
		var own: bool = SaveManager.is_owned(i)
		var col: Color = SkinBuilder.preview_color(i)
		var border: Color = Color("ffd23a") if SaveManager.selected_skin == i else (Color("ffffff") if i == skin_index else Color("39406a"))
		var bg: Color = col.darkened(0.35) if own else Color(0.08, 0.09, 0.14)
		var sb: StyleBoxFlat = UIT.box(bg, border, 4 if (i == skin_index or SaveManager.selected_skin == i) else 2, 8)
		for st in ["normal", "hover", "pressed", "focus"]:
			b.add_theme_stylebox_override(st, sb)
		b.text = ("ON" if SaveManager.selected_skin == i else "OWN") if own else str(int(si["price"]))
		b.add_theme_color_override("font_color", Color.WHITE if own else Color("ff8a6a"))


func _skin_action() -> void:
	var s: Dictionary = SkinBuilder.info(skin_index)
	if SaveManager.is_owned(skin_index):
		if SaveManager.select_skin(skin_index):
			AudioManager.play_sfx("unlock", 1.2)
			sk_msg.text = "Equipped %s!" % String(s["name"])
	else:
		if SaveManager.try_buy_skin(skin_index, int(s["price"])):
			SaveManager.select_skin(skin_index)
			AudioManager.play_sfx("unlock")
			sk_msg.text = "Unlocked and equipped %s!" % String(s["name"])
			_refresh_stats()
		else:
			AudioManager.play_sfx("nope")
			sk_msg.text = "Not enough coins."
	_refresh_skins()


# ---- power-ups
func _build_powerups_panel() -> void:
	var v := _panel("powerups", 560.0)
	v.add_child(UIT.label("POWER-UPS", 40, Color("00e5ff")))
	v.add_child(UIT.label("Collected during runs. Select one to inspect.", 16, Color("9fd0ff")))
	for i in PF.ORDER.size():
		var id: String = PF.ORDER[i]
		var info: Dictionary = PF.INFO[id]
		var b := UIT.menu_button(String(info["name"]), Vector2(500, 44))
		b.add_theme_color_override("font_color", PF.power_color(id))
		b.add_theme_color_override("font_focus_color", Color.WHITE)
		var idx: int = i
		b.focus_entered.connect(func() -> void: _show_power(idx))
		b.pressed.connect(func() -> void: _show_power(idx))
		v.add_child(b)
		pu_btns.append(b)
	pu_title = UIT.label("", 26)
	v.add_child(pu_title)
	pu_desc = UIT.label("", 18, Color("c8d8ff"))
	pu_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	pu_desc.custom_minimum_size = Vector2(500, 110)
	v.add_child(pu_desc)
	_back_btn(v)


func _show_power(i: int) -> void:
	pu_index = i
	var id: String = PF.ORDER[i]
	var info: Dictionary = PF.INFO[id]
	pu_title.text = "%s  (%ds)" % [String(info["name"]), int(info["duration"])]
	pu_title.add_theme_color_override("font_color", PF.power_color(id))
	pu_desc.text = "%s\nTip: %s" % [String(info["desc"]), String(info["tip"])]
	if pu_model != null:
		pu_model.queue_free()
	pu_model = PF.build_power(id)
	pu_model.position = Vector3(0, 0.9, 0)
	pu_model.scale = Vector3.ONE * 1.8
	add_child(pu_model)


# ---- scores
func _build_scores_panel() -> void:
	var v := _panel("scores", 560.0)
	v.add_child(UIT.label("HIGH SCORES", 40, Color("00e5ff")))
	scores_grid = GridContainer.new()
	scores_grid.columns = 4
	scores_grid.add_theme_constant_override("h_separation", 28)
	v.add_child(scores_grid)
	var b := _back_btn(v)
	(panels["scores"] as Control).set_meta("back", b)


func _fill_scores() -> void:
	for c in scores_grid.get_children():
		c.queue_free()
	for h in ["RANK", "DISTANCE", "COINS", "SCORE"]:
		scores_grid.add_child(UIT.label(h, 18, Color("9fd0ff")))
	for i in SaveManager.MAX_SCORES:
		var e: Dictionary = {}
		if i < SaveManager.highscores.size():
			e = SaveManager.highscores[i]
		var col: Color = Color("ffd23a") if i == 0 else Color.WHITE
		scores_grid.add_child(UIT.label("#%d" % (i + 1), 22, col))
		scores_grid.add_child(UIT.label(("%d m" % int(e["distance"])) if not e.is_empty() else "-", 22, col))
		scores_grid.add_child(UIT.label(str(int(e["coins"])) if not e.is_empty() else "-", 22, col))
		scores_grid.add_child(UIT.label(str(int(e["score"])) if not e.is_empty() else "-", 22, col))


# ---- settings / credits / exit
func _build_settings_panel() -> void:
	var v := _panel("settings", 600.0)
	settings_menu = SettingsMenu.new()
	settings_menu.back_pressed.connect(_back)
	(panels["settings"] as Control).remove_child(v)
	(panels["settings"] as Control).add_child(settings_menu)
	v.queue_free()


func _build_credits_panel() -> void:
	var v := _panel("credits", 560.0)
	v.add_child(UIT.label("CREDITS", 40, Color("00e5ff")))
	v.add_child(UIT.label("Game Design and Idea:", 20, Color("9fd0ff")))
	v.add_child(UIT.label("ARPIT GOSWAMI", 34))
	v.add_child(UIT.label("Everything else:", 20, Color("9fd0ff")))
	v.add_child(UIT.label("CLAUDE SONNET 5.5", 34))
	var b := _back_btn(v)
	(panels["credits"] as Control).set_meta("back", b)


func _build_confirm() -> void:
	confirm = Control.new()
	confirm.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirm.visible = false
	ui.add_child(confirm)
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirm.add_child(dim)
	var cc := CenterContainer.new()
	cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	confirm.add_child(cc)
	var pc := PanelContainer.new()
	cc.add_child(pc)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	pc.add_child(v)
	v.add_child(UIT.label("Exit the game?", 32))
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 12)
	v.add_child(h)
	var cancel := UIT.menu_button("Cancel", Vector2(190, 48))
	cancel.pressed.connect(_back)
	h.add_child(cancel)
	var ex := UIT.menu_button("Exit Game", Vector2(190, 48))
	ex.pressed.connect(func() -> void: get_tree().quit())
	h.add_child(ex)
	confirm.set_meta("cancel", cancel)

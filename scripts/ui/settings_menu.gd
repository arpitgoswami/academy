extends VBoxContainer
## Settings panel (reused by main menu and pause menu). Applies and saves immediately.

signal back_pressed

const UIT := preload("res://scripts/ui/ui_theme.gd")

var back_button: Button


func _ready() -> void:
	add_theme_constant_override("separation", 10)
	add_child(UIT.label("SETTINGS", 40, Color("00e5ff")))
	_slider("Master volume", "master", 0.0, 1.0)
	_slider("Music volume", "music", 0.0, 1.0)
	_slider("SFX volume", "sfx", 0.0, 1.0)
	_slider("Mouse sensitivity", "mouse_sens", 0.2, 3.0)
	_option("Graphics quality", "quality", ["Low", "Medium", "High"])
	_option("Window mode", "window_mode", ["Windowed", "Fullscreen"])
	var res_names: Array = []
	for r in SaveManager.RESOLUTIONS:
		res_names.append("%dx%d" % [r.x, r.y])
	_option("Resolution (windowed)", "resolution", res_names)
	var row := HBoxContainer.new()
	var l := UIT.label("Camera shake", 20)
	l.custom_minimum_size = Vector2(240, 0)
	row.add_child(l)
	var cb := CheckButton.new()
	cb.button_pressed = bool(SaveManager.settings["shake"])
	cb.toggled.connect(func(on: bool) -> void: SaveManager.set_setting("shake", on))
	row.add_child(cb)
	add_child(row)
	back_button = UIT.menu_button("Back", Vector2(200, 48))
	back_button.pressed.connect(func() -> void: back_pressed.emit())
	add_child(back_button)


func focus_first() -> void:
	back_button.grab_focus()


func _slider(text: String, key: String, minv: float, maxv: float) -> void:
	var row := HBoxContainer.new()
	var l := UIT.label(text, 20)
	l.custom_minimum_size = Vector2(240, 0)
	row.add_child(l)
	var s := HSlider.new()
	s.min_value = minv
	s.max_value = maxv
	s.step = 0.05
	s.value = float(SaveManager.settings[key])
	s.custom_minimum_size = Vector2(220, 28)
	s.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(s)
	var v := UIT.label("%d%%" % int(s.value * 100.0), 20)
	v.custom_minimum_size = Vector2(70, 0)
	row.add_child(v)
	s.value_changed.connect(func(val: float) -> void:
		SaveManager.set_setting(key, val)
		v.text = "%d%%" % int(val * 100.0)
		AudioManager.play_sfx("click", 1.0 + val * 0.4)
	)
	add_child(row)


func _option(text: String, key: String, items: Array) -> void:
	var row := HBoxContainer.new()
	var l := UIT.label(text, 20)
	l.custom_minimum_size = Vector2(240, 0)
	row.add_child(l)
	var ob := OptionButton.new()
	for it in items:
		ob.add_item(String(it))
	ob.selected = clampi(int(SaveManager.settings[key]), 0, items.size() - 1)
	ob.custom_minimum_size = Vector2(220, 36)
	ob.item_selected.connect(func(i: int) -> void: SaveManager.set_setting(key, i))
	row.add_child(ob)
	add_child(row)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		back_pressed.emit()

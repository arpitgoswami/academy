extends CanvasLayer
## Pause overlay. Works while the tree is paused (process_mode = ALWAYS).

signal resumed
signal restart_requested
signal menu_requested

const UIT := preload("res://scripts/ui/ui_theme.gd")
const SettingsMenu := preload("res://scripts/ui/settings_menu.gd")

var _main: Control
var _settings: Control
var _resume_btn: Button
var _opened_frame: int = -1


func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	var root := Control.new()
	root.theme = UIT.build()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(root)
	var dim := ColorRect.new()
	dim.color = Color(0, 0.02, 0.06, 0.65)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim)
	_main = CenterContainer.new()
	_main.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(_main)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 12)
	_main.add_child(v)
	v.add_child(UIT.label("PAUSED", 64, Color("00e5ff")))
	_resume_btn = UIT.menu_button("Resume")
	_resume_btn.pressed.connect(_resume)
	v.add_child(_resume_btn)
	var rs := UIT.menu_button("Restart")
	rs.pressed.connect(func() -> void: restart_requested.emit())
	v.add_child(rs)
	var st := UIT.menu_button("Settings")
	st.pressed.connect(_open_settings)
	v.add_child(st)
	var mm := UIT.menu_button("Main Menu")
	mm.pressed.connect(func() -> void: menu_requested.emit())
	v.add_child(mm)

	_settings = CenterContainer.new()
	_settings.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_settings.visible = false
	root.add_child(_settings)
	var pc := PanelContainer.new()
	_settings.add_child(pc)
	var sm := SettingsMenu.new()
	sm.back_pressed.connect(_close_settings)
	pc.add_child(sm)


func open() -> void:
	visible = true
	_opened_frame = Engine.get_process_frames()
	_main.visible = true
	_settings.visible = false
	_resume_btn.grab_focus()


func _resume() -> void:
	visible = false
	resumed.emit()


func _open_settings() -> void:
	_main.visible = false
	_settings.visible = true
	(_settings.get_child(0).get_child(0) as Node).call("focus_first")


func _close_settings() -> void:
	_settings.visible = false
	_main.visible = true
	_resume_btn.grab_focus()


func _unhandled_input(event: InputEvent) -> void:
	if not visible or Engine.get_process_frames() == _opened_frame:
		return
	if _settings.visible:
		return
	if event.is_action_pressed("pause"):
		get_viewport().set_input_as_handled()
		_resume()

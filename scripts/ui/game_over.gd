extends CanvasLayer
## Crash summary screen.

signal play_again
signal skins_requested
signal menu_requested

const UIT := preload("res://scripts/ui/ui_theme.gd")

var _panel: Control
var _lines: VBoxContainer
var _btn_again: Button
var _title: Label
var _banner: Label


func _ready() -> void:
	layer = 15
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	var root := Control.new()
	root.theme = UIT.build()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(root)
	var dim := ColorRect.new()
	dim.color = Color(0.02, 0, 0.05, 0.6)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim)
	var cc := CenterContainer.new()
	cc.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(cc)
	_panel = PanelContainer.new()
	cc.add_child(_panel)
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", 10)
	_panel.add_child(v)
	_title = UIT.label("CRASHED!", 60, Color("ff5a3a"))
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_title)
	_banner = UIT.label("", 30, Color("ffd23a"))
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(_banner)
	_lines = VBoxContainer.new()
	v.add_child(_lines)
	_btn_again = UIT.menu_button("Play Again", Vector2(420, 54))
	_btn_again.pressed.connect(func() -> void: play_again.emit())
	v.add_child(_btn_again)
	var sk := UIT.menu_button("Skins", Vector2(420, 48))
	sk.pressed.connect(func() -> void: skins_requested.emit())
	v.add_child(sk)
	var mm := UIT.menu_button("Main Menu", Vector2(420, 48))
	mm.pressed.connect(func() -> void: menu_requested.emit())
	v.add_child(mm)


func _row(k: String, val: String, col: Color = Color.WHITE) -> void:
	var h := HBoxContainer.new()
	var a := UIT.label(k, 26, Color("9fd0ff"))
	a.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var b := UIT.label(val, 26, col)
	b.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	h.add_child(a)
	h.add_child(b)
	_lines.add_child(h)


func show_results(r: Dictionary) -> void:
	for c in _lines.get_children():
		c.queue_free()
	_banner.text = "DISTANCE RECORD!" if bool(r["new_best"]) else ""
	_row("Distance", "%d m" % int(r["distance"]))
	_row("Score", str(int(r["score"])), Color("ffd23a"))
	_row("Coins collected", "+%d" % int(r["coins"]), Color("ffc41a"))
	_row("Bank", str(int(r["bank"])))
	_row("Best distance", "%d m" % int(r["best"]))
	visible = true
	_panel.modulate.a = 0.0
	_panel.scale = Vector2(0.9, 0.9)
	_panel.pivot_offset = _panel.size * 0.5
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(_panel, "modulate:a", 1.0, 0.3)
	tw.tween_property(_panel, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_btn_again.grab_focus()

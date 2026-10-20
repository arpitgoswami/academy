extends CanvasLayer
## Minimal in-run HUD: distance/best (top-left), coins/bank (top-right), power-up timers (top-centre).

const UIT := preload("res://scripts/ui/ui_theme.gd")
const PF := preload("res://scripts/world/pickup_factory.gd")

var powerups_ref: Dictionary = {}
var _dist: Label
var _best: Label
var _score: Label
var _coins: Label
var _bank: Label
var _msg: Label
var _flash: ColorRect
var _pu_box: HBoxContainer
var _items: Dictionary = {}
var _msg_tween: Tween


func _ready() -> void:
	layer = 5
	var root := Control.new()
	root.theme = UIT.build()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_flash = ColorRect.new()
	_flash.color = Color(1, 1, 1, 0)
	_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_child(_flash)

	var tl := VBoxContainer.new()
	tl.position = Vector2(28, 20)
	root.add_child(tl)
	_dist = UIT.label("0 m", 44)
	_best = UIT.label("BEST %d m" % SaveManager.best_distance, 20, Color("9fd0ff"))
	_score = UIT.label("SCORE 0", 20, Color("ffd23a"))
	tl.add_child(_dist)
	tl.add_child(_best)
	tl.add_child(_score)

	var tr := VBoxContainer.new()
	tr.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	tr.offset_left = -260
	tr.offset_right = -28
	tr.offset_top = 20
	tr.alignment = BoxContainer.ALIGNMENT_END
	root.add_child(tr)
	_coins = UIT.label("0", 44, Color("ffc41a"))
	_coins.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_bank = UIT.label("BANK %d" % SaveManager.coins, 20, Color("ffe27a"))
	_bank.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	tr.add_child(_coins)
	tr.add_child(_bank)

	_pu_box = HBoxContainer.new()
	_pu_box.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	_pu_box.offset_top = 20
	_pu_box.offset_left = -330
	_pu_box.offset_right = 330
	_pu_box.alignment = BoxContainer.ALIGNMENT_CENTER
	_pu_box.add_theme_constant_override("separation", 8)
	root.add_child(_pu_box)

	_msg = UIT.label("", 56, Color.WHITE)
	_msg.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_msg.offset_top = -190
	_msg.offset_bottom = -110
	_msg.offset_left = -400
	_msg.offset_right = 400
	_msg.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_msg.add_theme_constant_override("outline_size", 10)
	_msg.modulate.a = 0.0
	root.add_child(_msg)

	GameState.distance_changed.connect(func(d: int) -> void: _dist.text = "%d m" % d)
	GameState.coin_collected.connect(func(c: int, b: int) -> void:
		_coins.text = str(c)
		_bank.text = "BANK %d" % b)
	GameState.powerup_collected.connect(_on_power_collected)
	GameState.powerup_expired.connect(_on_power_expired)


func set_score(s: int) -> void:
	_score.text = "SCORE %d" % s


func show_message(text: String, col: Color) -> void:
	_msg.text = text
	_msg.add_theme_color_override("font_color", col)
	if _msg_tween != null:
		_msg_tween.kill()
	_msg.modulate.a = 0.0
	_msg.pivot_offset = _msg.size * 0.5
	_msg.scale = Vector2(0.7, 0.7)
	_msg_tween = create_tween()
	_msg_tween.set_parallel(true)
	_msg_tween.tween_property(_msg, "modulate:a", 1.0, 0.15)
	_msg_tween.tween_property(_msg, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	_msg_tween.chain().tween_interval(1.0)
	_msg_tween.chain().tween_property(_msg, "modulate:a", 0.0, 0.4)


func flash(col: Color) -> void:
	_flash.color = Color(col.r, col.g, col.b, 0.35)
	var tw := create_tween()
	tw.tween_property(_flash, "color:a", 0.0, 0.35)


func _on_power_collected(id: String) -> void:
	if _items.has(id):
		return
	var info: Dictionary = PF.INFO[id]
	var col: Color = PF.power_color(id)
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", UIT.box(Color(0.02, 0.04, 0.12, 0.85), col, 2, 8))
	var v := VBoxContainer.new()
	pc.add_child(v)
	var l := UIT.label(String(info["name"]), 16, col)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(l)
	var bar := ProgressBar.new()
	bar.min_value = 0.0
	bar.max_value = 1.0
	bar.value = 1.0
	bar.show_percentage = false
	bar.custom_minimum_size = Vector2(110, 8)
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	bar.add_theme_stylebox_override("fill", fill)
	v.add_child(bar)
	var t := UIT.label("", 16)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	_pu_box.add_child(pc)
	_items[id] = {"panel": pc, "bar": bar, "time": t}


func _on_power_expired(id: String) -> void:
	if _items.has(id):
		var d: Dictionary = _items[id]
		(d["panel"] as Node).queue_free()
		_items.erase(id)


func _process(_delta: float) -> void:
	for id in _items:
		var d: Dictionary = _items[id]
		var pu: Variant = powerups_ref.get(id)
		if pu != null:
			var node: Node = pu
			var rem: float = node.remaining
			(d["bar"] as ProgressBar).value = rem / maxf(node.duration, 0.01)
			(d["time"] as Label).text = "%.1fs" % maxf(rem, 0.0)

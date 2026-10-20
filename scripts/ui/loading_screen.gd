extends Control
## Real loading: builds audio + skin textures, then threaded-loads the target scene.

const UIT := preload("res://scripts/ui/ui_theme.gd")
const SkinBuilder := preload("res://scripts/skins/skin_builder.gd")

const TIPS: Array = [
	"Three lanes. One chance.",
	"Save your shield for crowded sections.",
	"Collect coins to unlock new box skins.",
	"Speed increases the longer you survive.",
	"Press jump again in mid-air with a Hover Board.",
	"Slide under overhead bars - or jump over low ones.",
]

var t: float = 0.0
var progress: float = 0.0
var shown: float = 0.0
var done: bool = false
var packed: PackedScene
var _pct: Label
var _tip: Label
var _parts: Array = []
var _target: String


func _ready() -> void:
	theme = UIT.build()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_target = GameState.next_scene
	for i in 50:
		_parts.append(Vector3(randf(), randf(), randf_range(0.02, 0.1)))
	var logo := UIT.label("BOX SURFER", 84, Color.WHITE)
	logo.add_theme_color_override("font_outline_color", Color("00a8ff"))
	logo.add_theme_constant_override("outline_size", 12)
	logo.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	logo.offset_top = 50
	logo.offset_left = -420
	logo.offset_right = 420
	logo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(logo)
	_pct = UIT.label("0%", 24, Color("00e5ff"))
	_pct.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_pct.offset_top = -120
	_pct.offset_left = -100
	_pct.offset_right = 100
	_pct.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_pct)
	_tip = UIT.label(String(TIPS[randi() % TIPS.size()]), 24, Color("c8d8ff"))
	_tip.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	_tip.offset_top = -70
	_tip.offset_left = -480
	_tip.offset_right = 480
	_tip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(_tip)
	GameState.fade_in(0.25)
	_load()


func _load() -> void:
	var n: int = AudioManager.STEPS.size()
	for i in n:
		AudioManager.build_step(i)
		progress = float(i + 1) / float(n + 2) * 0.5
		await get_tree().process_frame
	SkinBuilder.prewarm()
	progress = 0.6
	await get_tree().process_frame
	var err: int = ResourceLoader.load_threaded_request(_target)
	var waited: float = 0.0
	if err == OK:
		var prog: Array = []
		while waited < 15.0:
			var st: int = ResourceLoader.load_threaded_get_status(_target, prog)
			if prog.size() > 0:
				progress = 0.6 + float(prog[0]) * 0.4
			if st == ResourceLoader.THREAD_LOAD_LOADED:
				packed = ResourceLoader.load_threaded_get(_target) as PackedScene
				break
			if st == ResourceLoader.THREAD_LOAD_FAILED:
				break
			waited += get_process_delta_time()
			await get_tree().process_frame
	if packed == null:
		packed = load(_target) as PackedScene
	progress = 1.0
	done = true


func _process(delta: float) -> void:
	t += delta
	shown = move_toward(shown, progress, delta * 0.9)
	_pct.text = "%d%%" % int(shown * 100.0)
	if int(t / 2.5) != int((t - delta) / 2.5):
		_tip.text = String(TIPS[randi() % TIPS.size()])
	queue_redraw()
	if done and shown >= 0.999 and packed != null:
		done = false
		var tw := create_tween()
		tw.tween_property(self, "modulate:a", 0.0, 0.2)
		tw.tween_callback(func() -> void: get_tree().change_scene_to_packed(packed))


func _draw() -> void:
	var s: Vector2 = size
	draw_rect(Rect2(Vector2.ZERO, s), Color("04060f"))
	draw_rect(Rect2(0, s.y * 0.5, s.x, s.y * 0.5), Color(0.05, 0.08, 0.25, 0.5))
	for p in _parts:
		var v: Vector3 = p
		var y: float = fposmod(v.y - t * v.z, 1.0)
		draw_circle(Vector2(v.x * s.x, y * s.y), 1.0 + v.z * 20.0, Color(0.3, 0.8, 1.0, 0.35))
	_draw_cube(Vector2(s.x * 0.5, s.y * 0.45), minf(s.x, s.y) * 0.13)
	var bw: float = s.x * 0.5
	var bx: float = (s.x - bw) * 0.5
	var by: float = s.y - 150.0
	draw_rect(Rect2(bx, by, bw, 6), Color(1, 1, 1, 0.12))
	draw_rect(Rect2(bx, by, bw * shown, 6), Color("00e5ff"))


func _draw_cube(c: Vector2, sz: float) -> void:
	var b := Basis.from_euler(Vector3(0.5 + sin(t) * 0.2, t * 1.2, 0.2))
	var verts: Array = []
	for i in 8:
		var v := Vector3(1.0 if (i & 1) != 0 else -1.0, 1.0 if (i & 2) != 0 else -1.0, 1.0 if (i & 4) != 0 else -1.0)
		verts.append(b * v)
	var faces: Array = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]]
	var normals: Array = [Vector3(0, 0, -1), Vector3(0, 0, 1), Vector3(0, -1, 0), Vector3(0, 1, 0), Vector3(-1, 0, 0), Vector3(1, 0, 0)]
	for fi in 6:
		var n: Vector3 = b * (normals[fi] as Vector3)
		if n.z <= 0.08:
			continue
		var pts := PackedVector2Array()
		for vi in faces[fi]:
			var v3: Vector3 = verts[vi]
			pts.append(c + Vector2(v3.x, -v3.y) * sz * (1.0 + v3.z * 0.1))
		var br: float = 0.35 + 0.65 * maxf(n.dot(Vector3(0.3, 0.7, 0.6).normalized()), 0.0)
		var fc: Color = Color(0.1, 0.4, 1.0).lerp(Color(0.6, 0.9, 1.0), br * 0.6) * br
		fc.a = 1.0
		draw_primitive(pts, PackedColorArray([fc, fc, fc, fc]), PackedVector2Array([Vector2.ZERO, Vector2.ZERO, Vector2.ZERO, Vector2.ZERO]))
		pts.append(pts[0])
		draw_polyline(pts, Color("00e5ff"), 2.0)

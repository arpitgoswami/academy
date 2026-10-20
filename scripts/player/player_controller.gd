extends Node3D
## Three-lane runner physics (lane lerp, gravity jump, slide). The world scrolls past the
## player, so the player only moves in X/Y. Hit-box helpers are used by game.gd.

signal jumped
signal landed(hard: bool)
signal slid
signal lane_changed(lane: int)

const SkinBuilder := preload("res://scripts/skins/skin_builder.gd")
const PlayerAnim := preload("res://scripts/player/player_animation.gd")
const WB := preload("res://scripts/world/world_builder.gd")

const STAND_H: float = 1.35
const SLIDE_H: float = 0.55

@export var start_speed: float = 14.0
@export var max_speed: float = 34.0
@export var acceleration: float = 0.1
@export var lane_width: float = 2.2
@export var lane_switch_duration: float = 0.14
@export var jump_height: float = 2.4
@export var jump_duration: float = 0.8
@export var slide_duration: float = 0.7
@export var grace_time: float = 1.2

var speed: float = 14.0
var lane: int = 0
var lane_vel: float = 0.0
var vy: float = 0.0
var ground_y: float = 0.0
var grounded: bool = true
var sliding: bool = false
var slide_timer: float = 0.0
var jump_buffer: float = 0.0
var slide_queued: bool = false
var double_jump_enabled: bool = false
var double_jumped: bool = false
var active: bool = false
var alive: bool = true
var falling: bool = false
var invuln: float = 0.0
var boost_hover: bool = false
var anim := PlayerAnim.new()
var model: Node3D

var _gravity: float = 30.0
var _jump_v: float = 12.0
var _shield: MeshInstance3D
var _board: Node3D
var _magnet: MeshInstance3D
var _blob: MeshInstance3D
var _dust: CPUParticles3D
var _trail: CPUParticles3D
var _t: float = 0.0


func _ready() -> void:
	_gravity = 8.0 * jump_height / (jump_duration * jump_duration)
	_jump_v = 4.0 * jump_height / jump_duration
	speed = start_speed
	_build_extras()
	apply_skin(SaveManager.selected_skin)


func _particles(col: Color, amount: int, life: float, size: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	var m := BoxMesh.new()
	m.size = Vector3.ONE * size
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.vertex_color_use_as_albedo = true
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.material = mat
	p.mesh = m
	p.amount = amount
	p.lifetime = life
	p.color = col
	var g := Gradient.new()
	g.set_color(0, Color(1, 1, 1, 0.9))
	g.set_color(1, Color(1, 1, 1, 0.0))
	p.color_ramp = g
	p.gravity = Vector3(0, -2.0, 0)
	p.spread = 25.0
	p.emitting = false
	return p


func _build_extras() -> void:
	_blob = WB.add_cyl(self, 0.5, 0.5, 0.01, Vector3(0, 0.02, 0), WB.unshaded(Color(0, 0, 0, 0.4)), 14, false)
	_shield = WB.add_sphere(self, 1.0, Vector3(0, 0.6, 0), WB.mat(Color(0.2, 0.85, 1.0, 0.3), 1.5), 16, false)
	_shield.visible = false
	_board = Node3D.new()
	_board.visible = false
	add_child(_board)
	WB.add_box(_board, Vector3(1.0, 0.07, 1.8), Vector3(0, -0.02, 0), WB.mat(Color("ff3df0"), 1.5, 0.5, 0.3))
	WB.add_box(_board, Vector3(0.7, 0.03, 1.4), Vector3(0, 0.03, 0), WB.mat(Color.WHITE, 2.0), false)
	var tm := TorusMesh.new()
	tm.inner_radius = 1.5
	tm.outer_radius = 1.65
	_magnet = WB.add_mesh(self, tm, WB.mat(Color(1.0, 0.5, 0.1, 0.5), 2.0), Vector3(0, 0.6, 0), false)
	_magnet.visible = false
	_dust = _particles(Color(0.6, 0.8, 1.0), 14, 0.5, 0.1)
	_dust.position = Vector3(0, 0.05, 0.3)
	_dust.direction = Vector3(0, 0.3, 1)
	add_child(_dust)
	_trail = _particles(Color(1.0, 0.7, 0.1), 40, 0.5, 0.2)
	_trail.position = Vector3(0, 0.6, 0.6)
	_trail.direction = Vector3(0, 0, 1)
	_trail.spread = 10.0
	add_child(_trail)


func apply_skin(index: int) -> void:
	if model != null:
		model.queue_free()
	model = SkinBuilder.build_model(index)
	add_child(model)
	anim.set_model(model)
	anim.extra_y = 0.12 if _board.visible else 0.0


func set_effect(effect: String, on: bool) -> void:
	match effect:
		"shield": _shield.visible = on
		"board":
			_board.visible = on
			anim.extra_y = 0.12 if on else 0.0
		"magnet": _magnet.visible = on
		"boost": _trail.emitting = on


func pulse() -> void:
	anim.on_pulse()


func hit_height() -> float:
	return SLIDE_H if sliding else STAND_H


func is_airborne() -> bool:
	return not grounded


func update_speed(delta: float) -> void:
	speed = minf(speed + acceleration * delta, max_speed)


func _input(event: InputEvent) -> void:
	if not active:
		return
	if event.is_action_pressed("move_left"):
		_change_lane(-1)
	elif event.is_action_pressed("move_right"):
		_change_lane(1)
	elif event.is_action_pressed("jump"):
		jump_buffer = 0.14
	elif event.is_action_pressed("slide"):
		_try_slide()


func _change_lane(dir: int) -> void:
	var nl: int = clampi(lane + dir, -1, 1)
	if nl == lane:
		return
	lane = nl
	lane_changed.emit(lane)
	AudioManager.play_sfx("lane", 1.0 + 0.1 * float(lane))


func _try_jump() -> bool:
	if grounded:
		_do_jump(false)
		return true
	if double_jump_enabled and not double_jumped:
		_do_jump(true)
		return true
	return false


func _do_jump(dbl: bool) -> void:
	sliding = false
	slide_timer = 0.0
	slide_queued = false
	grounded = false
	vy = _jump_v * (0.92 if dbl else 1.0)
	if dbl:
		double_jumped = true
	jumped.emit()
	AudioManager.play_sfx("jump", 1.25 if dbl else 1.0)


func _try_slide() -> void:
	if grounded:
		_start_slide()
	else:
		vy = minf(vy, -22.0)   # fast-fall, slide on landing
		slide_queued = true


func _start_slide() -> void:
	sliding = true
	slide_timer = slide_duration
	slid.emit()
	AudioManager.play_sfx("slide")


func tick(delta: float, world_speed: float) -> void:
	_t += delta
	invuln = maxf(0.0, invuln - delta)
	if alive:
		_tick_alive(delta)
	else:
		_tick_dead(delta)
	var speed01: float = clampf((speed - start_speed) / maxf(max_speed - start_speed, 1.0), 0.0, 1.0)
	anim.update(delta, alive and active, lane_vel, grounded, sliding, vy, speed01)
	_blob.position.y = -position.y + 0.02
	_blob.visible = not falling and alive
	if _shield.visible:
		var s: float = 1.0 + sin(_t * 6.0) * 0.04
		_shield.scale = Vector3.ONE * s
		_shield.visible = true
		if invuln > 0.0:
			_shield.visible = int(_t * 20.0) % 2 == 0
	_magnet.rotation.y += delta * 3.0
	_board.position.y = 0.0
	_dust.emitting = alive and grounded and active
	_dust.initial_velocity_min = world_speed * 0.8
	_dust.initial_velocity_max = world_speed * 1.0
	_trail.initial_velocity_min = world_speed * 0.9 + 3.0
	_trail.initial_velocity_max = world_speed * 1.1 + 3.0


func _tick_alive(delta: float) -> void:
	var tx: float = float(lane) * lane_width
	var k: float = 3.2 / maxf(lane_switch_duration, 0.02)
	var nx: float = lerpf(position.x, tx, 1.0 - exp(-k * delta))
	if absf(tx - nx) < 0.004:
		nx = tx
	lane_vel = tx - nx
	position.x = clampf(nx, -lane_width, lane_width)
	var target_ground: float = 0.9 if boost_hover else 0.0
	ground_y = lerpf(ground_y, target_ground, 1.0 - exp(-6.0 * delta))
	if absf(ground_y - target_ground) < 0.005:
		ground_y = target_ground
	if grounded:
		position.y = ground_y
		vy = 0.0
	else:
		vy -= _gravity * delta
		position.y += vy * delta
		if position.y <= ground_y and vy <= 0.0:
			_land()
	if sliding:
		slide_timer -= delta
		if slide_timer <= 0.0:
			sliding = false
	if jump_buffer > 0.0:
		if _try_jump():
			jump_buffer = 0.0
		else:
			jump_buffer -= delta


func _land() -> void:
	var strength: float = clampf(-vy / 15.0, 0.1, 1.0)
	position.y = ground_y
	grounded = true
	double_jumped = false
	vy = 0.0
	anim.on_land(strength)
	landed.emit(strength > 0.5)
	if strength > 0.35:
		AudioManager.play_sfx("land", 1.0, -4.0)
	if slide_queued:
		slide_queued = false
		_start_slide()


func _tick_dead(delta: float) -> void:
	vy -= _gravity * delta * (1.2 if falling else 1.0)
	position.y += vy * delta
	if not falling and position.y < 0.0:
		position.y = 0.0
		vy = 0.0


func crash(fell: bool) -> void:
	alive = false
	active = false
	falling = fell
	vy = 0.0 if fell else 5.0
	sliding = false
	_shield.visible = false
	_board.visible = false
	_magnet.visible = false
	_trail.emitting = false
	anim.start_crash()


func rescue_hop() -> void:
	## Used by the hover board to save the player from a fall.
	grounded = false
	vy = _jump_v * 1.05
	position.y = maxf(position.y, 0.15)
	sliding = false

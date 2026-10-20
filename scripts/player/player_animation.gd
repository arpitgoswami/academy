extends RefCounted
## Procedural animation for the box character (no AnimationPlayer needed).

var model: Node3D
var t: float = 0.0
var idle: bool = false
var land_squash: float = 0.0
var pulse: float = 0.0
var crash_t: float = -1.0
var crash_spin: Vector3 = Vector3.ZERO
var extra_y: float = 0.0
var _armL: Node3D
var _armR: Node3D
var _footL: Node3D
var _footR: Node3D


func set_model(m: Node3D) -> void:
	model = m
	crash_t = -1.0
	_armL = m.get_node_or_null("Body/ArmL") as Node3D
	_armR = m.get_node_or_null("Body/ArmR") as Node3D
	_footL = m.get_node_or_null("Body/FootL") as Node3D
	_footR = m.get_node_or_null("Body/FootR") as Node3D


func on_land(strength: float) -> void:
	land_squash = clampf(strength, 0.2, 1.0)


func on_pulse() -> void:
	pulse = 1.0


func start_crash() -> void:
	crash_t = 0.0
	crash_spin = Vector3(randf_range(-5.0, 5.0), randf_range(-7.0, 7.0), randf_range(-5.0, 5.0))


func update(delta: float, running: bool, lane_vel: float, grounded: bool, sliding: bool, vy: float, speed01: float) -> void:
	if model == null:
		return
	t += delta
	land_squash = maxf(0.0, land_squash - delta * 4.5)
	pulse = maxf(0.0, pulse - delta * 3.0)
	if crash_t >= 0.0:
		crash_t += delta
		model.rotation += crash_spin * delta * maxf(0.0, 1.0 - crash_t * 0.8)
		model.scale = Vector3.ONE * clampf(1.0 - crash_t * 0.3, 0.5, 1.0)
		return
	var sc: Vector3 = Vector3.ONE
	var bob: float = 0.0
	var rot: Vector3 = Vector3.ZERO
	var f: float = 9.0 + speed01 * 6.0
	var swing: float = 0.0
	if idle:
		bob = absf(sin(t * 3.0)) * 0.12
		sc.y = 1.0 + sin(t * 6.0) * 0.03
		swing = sin(t * 3.0) * 0.3
	elif sliding:
		rot.x = 0.95
		sc.y = 0.8
		bob = -0.04
	elif not grounded:
		sc.y = 1.0 + clampf(absf(vy) * 0.012, 0.0, 0.18)
		sc.x = 1.0 / sqrt(sc.y)
		sc.z = sc.x
		rot.x = clampf(-vy * 0.012, -0.25, 0.25)
		swing = -0.9
	elif running:
		bob = absf(sin(t * f)) * 0.07
		rot.x = -0.08
		swing = sin(t * f) * 0.9
	if land_squash > 0.0:
		sc.y *= 1.0 - land_squash * 0.28
		sc.x *= 1.0 + land_squash * 0.18
		sc.z = sc.x
	sc *= 1.0 + pulse * 0.22
	rot.z = clampf(-lane_vel * 0.22, -0.45, 0.45)
	model.position.y = bob + extra_y
	model.scale = sc
	model.rotation = rot
	if _armL != null:
		_armL.rotation.x = swing
	if _armR != null:
		_armR.rotation.x = -swing
	if _footL != null:
		_footL.position.z = -0.04 + (sin(t * f) * 0.12 if running and grounded else 0.0)
	if _footR != null:
		_footR.position.z = -0.04 - (sin(t * f) * 0.12 if running and grounded else 0.0)

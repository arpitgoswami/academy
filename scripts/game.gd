extends Node3D
## Run controller: scrolling, collisions, pickups, power-ups, camera, crash/pause/restart flow.

enum State { READY, RUNNING, CRASHING, OVER }

const WB := preload("res://scripts/world/world_builder.gd")
const WT := preload("res://scripts/world/world_types.gd")
const PF := preload("res://scripts/world/pickup_factory.gd")
const SkinBuilder := preload("res://scripts/skins/skin_builder.gd")
const TrackGenerator := preload("res://scripts/world/track_generator.gd")
const PlayerScene := preload("res://scenes/player.tscn")
const HudScene := preload("res://scenes/ui/hud.tscn")
const PauseScene := preload("res://scenes/ui/pause_menu.tscn")
const GameOverScene := preload("res://scenes/ui/game_over.tscn")
const POWER_SCRIPTS: Dictionary = {
	"magnet": preload("res://scripts/powerups/coin_magnet.gd"),
	"shield": preload("res://scripts/powerups/shield.gd"),
	"boost": preload("res://scripts/powerups/speed_boost.gd"),
	"double": preload("res://scripts/powerups/double_coins.gd"),
	"hover": preload("res://scripts/powerups/hover_board.gd"),
	"multiplier": preload("res://scripts/powerups/coin_multiplier.gd"),
}
const SEG_LEN: float = 36.0
const PLAYER_HX: float = 0.32
const PLAYER_HZ: float = 0.35
const MILESTONES: Array = [500, 1000, 2500, 5000, 10000]
const MILESTONE_TEXT: Array = ["NICE RUN!", "1,000 m!", "UNSTOPPABLE!", "LEGEND!", "BOX GOD!"]

var state: int = State.READY
var player: Node3D
var camera: Camera3D
var generator: Node3D
var env_refs: Dictionary = {}
var hud: CanvasLayer
var pause_menu: CanvasLayer
var game_over_ui: CanvasLayer
var powerups: Dictionary = {}
var powerup_root: Node

var distance: float = 0.0
var run_coins: int = 0
var coin_score: int = 0
var elapsed: float = 0.0
var spin: float = 0.0
var shake: float = 0.0
var cam_roll: float = 0.0
var world_speed: float = 0.0
var magnet_radius: float = 0.0
var boost_mult: float = 1.0
var coin_mult: int = 1
var score_mult: int = 1
var phase_time: float = 0.0
var committed: bool = false
var result: Dictionary = {}
var best_at_start: int = 0
var best_announced: bool = false
var next_milestone: int = 0
var last_dist_int: int = -1
var last_coin_time: float = -10.0
var coin_pitch: float = 1.0
var fx_pool: Array = []
var fx_life: Array = []
var fx_i: int = 0
var speed_lines: CPUParticles3D
var crash_reason: String = ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	AudioManager.ensure_built()
	env_refs = WB.build_environment(self, false)
	WB.apply_quality(env_refs, int(SaveManager.settings["quality"]), get_viewport())
	SaveManager.settings_changed.connect(_on_settings_changed)

	camera = Camera3D.new()
	camera.fov = 68.0
	camera.far = 500.0
	add_child(camera)
	camera.position = Vector3(0, 3.5, 6.4)
	camera.make_current()
	_build_speed_lines()

	generator = TrackGenerator.new()
	generator.name = "Track"
	add_child(generator)
	generator.setup(true, GameState.debug_seed)

	player = PlayerScene.instantiate()
	add_child(player)
	player.jumped.connect(func() -> void: pass)
	player.landed.connect(_on_player_landed)

	powerup_root = Node.new()
	powerup_root.name = "Powerups"
	add_child(powerup_root)

	hud = HudScene.instantiate()
	add_child(hud)
	hud.powerups_ref = powerups
	pause_menu = PauseScene.instantiate()
	add_child(pause_menu)
	pause_menu.resumed.connect(_on_resume)
	pause_menu.restart_requested.connect(_on_restart)
	pause_menu.menu_requested.connect(_on_to_menu)
	game_over_ui = GameOverScene.instantiate()
	add_child(game_over_ui)
	game_over_ui.play_again.connect(_on_restart)
	game_over_ui.skins_requested.connect(_on_to_skins)
	game_over_ui.menu_requested.connect(_on_to_menu)

	_build_fx_pool()
	best_at_start = SaveManager.best_distance
	AudioManager.play_music("game")
	GameState.fade_in(0.4)
	phase_time = 0.0
	hud.show_message("GET READY", Color("00e5ff"))


func _on_settings_changed() -> void:
	WB.apply_quality(env_refs, int(SaveManager.settings["quality"]), get_viewport())


# ------------------------------------------------------------------ fx
func _build_speed_lines() -> void:
	speed_lines = CPUParticles3D.new()
	var m := BoxMesh.new()
	m.size = Vector3(0.02, 0.02, 1.6)
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(1, 1, 1, 0.35)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.material = mat
	speed_lines.mesh = m
	speed_lines.amount = 36
	speed_lines.lifetime = 0.35
	speed_lines.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	speed_lines.emission_box_extents = Vector3(7, 4, 0.5)
	speed_lines.direction = Vector3(0, 0, 1)
	speed_lines.spread = 0.0
	speed_lines.initial_velocity_min = 70.0
	speed_lines.initial_velocity_max = 90.0
	speed_lines.gravity = Vector3.ZERO
	speed_lines.position = Vector3(0, 0, -14)
	speed_lines.emitting = false
	camera.add_child(speed_lines)


func _build_fx_pool() -> void:
	for i in 10:
		var p := CPUParticles3D.new()
		var m := BoxMesh.new()
		m.size = Vector3.ONE * 0.13
		var mat := StandardMaterial3D.new()
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.vertex_color_use_as_albedo = true
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.material = mat
		p.mesh = m
		p.amount = 16
		p.lifetime = 0.55
		p.one_shot = true
		p.explosiveness = 1.0
		p.local_coords = true
		p.direction = Vector3(0, 1, 0)
		p.spread = 180.0
		p.initial_velocity_min = 2.0
		p.initial_velocity_max = 6.0
		p.gravity = Vector3(0, -9, 0)
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		p.color_ramp = g
		p.emitting = false
		add_child(p)
		fx_pool.append(p)
		fx_life.append(0.0)


func burst(pos: Vector3, col: Color, amount: int = 14) -> void:
	var p: CPUParticles3D = fx_pool[fx_i]
	fx_life[fx_i] = 0.8
	fx_i = (fx_i + 1) % fx_pool.size()
	p.position = pos
	p.color = col
	p.amount = amount
	p.restart()
	p.emitting = true


func add_shake(amount: float) -> void:
	if bool(SaveManager.settings["shake"]):
		shake = minf(1.0, maxf(shake, amount))


# ------------------------------------------------------------------ main loop
func _process(delta: float) -> void:
	delta = minf(delta, 1.0 / 20.0)
	spin += delta * 3.0
	match state:
		State.READY:
			phase_time += delta
			player.tick(delta, 0.0)
			if phase_time > 1.0:
				state = State.RUNNING
				player.active = true
				GameState.run_started.emit()
				hud.show_message("GO!", Color("ffd23a"))
				AudioManager.play_sfx("go")
		State.RUNNING:
			_run_step(delta)
		State.CRASHING:
			_crash_step(delta)
		State.OVER:
			player.tick(delta, 0.0)
	_animate_world()
	_update_camera(delta)
	for i in fx_pool.size():
		if float(fx_life[i]) > 0.0:
			fx_life[i] = float(fx_life[i]) - delta
			(fx_pool[i] as Node3D).position.z += world_speed * delta


func _run_step(delta: float) -> void:
	elapsed += delta
	player.update_speed(delta)
	world_speed = player.speed * boost_mult
	var dz: float = world_speed * delta
	distance += dz
	generator.cur_speed = player.speed
	generator.scroll(dz)
	player.tick(delta, world_speed)
	_collect(delta, dz)
	_check_hazards(dz)
	_update_progress()


func _crash_step(delta: float) -> void:
	phase_time += delta
	world_speed = lerpf(world_speed, 0.0, 1.0 - exp(-4.0 * delta))
	generator.scroll(world_speed * delta)
	player.tick(delta, world_speed)
	if phase_time > 1.2:
		_finish_run()


func _update_progress() -> void:
	var di: int = int(distance)
	if di != last_dist_int:
		last_dist_int = di
		GameState.distance_changed.emit(di)
		if next_milestone < MILESTONES.size() and di >= int(MILESTONES[next_milestone]):
			hud.show_message(String(MILESTONE_TEXT[next_milestone]), Color("ffd23a"))
			AudioManager.play_sfx("milestone")
			next_milestone += 1
		if not best_announced and best_at_start > 0 and di > best_at_start:
			best_announced = true
			hud.show_message("NEW PERSONAL BEST!", Color("ff40d0"))
			AudioManager.play_sfx("milestone", 1.2)
	hud.set_score(score())


func score() -> int:
	return int(distance) + coin_score


func _animate_world() -> void:
	for seg in generator.segments:
		var sz: float = seg.position.z
		if sz < -150.0 or sz - SEG_LEN > 10.0:
			continue
		for pk in seg.pickups:
			var p: WT.Pickup = pk
			if p.collected or p.node == null:
				continue
			p.node.rotation.y = spin
			if p.kind == "power":
				p.node.position.y = p.y + sin(elapsed * 3.0 + p.z) * 0.15
		for ob in seg.dyn_obstacles:
			var o: WT.Obstacle = ob
			if not o.active:
				continue
			if o.moving:
				o.x = o.base_x + sin((elapsed + o.phase) * 1.7) * 2.2
				o.node.position.x = o.x
			elif o.gate:
				o.on = fposmod(elapsed + o.phase, 2.0) < 1.2
				o.beam.visible = o.on


# ------------------------------------------------------------------ pickups
func _collect(delta: float, dz: float) -> void:
	var ppos: Vector3 = player.position
	var pcy: float = ppos.y + 0.65
	var reach: float = maxf(magnet_radius, 3.0)
	for seg in generator.segments:
		var sz: float = seg.position.z
		if sz < -reach - 2.0 or sz - SEG_LEN > reach + 2.0:
			continue
		for pk in seg.pickups:
			var p: WT.Pickup = pk
			if p.collected or p.node == null:
				continue
			var wz: float = sz + p.z
			if magnet_radius > 0.0 and p.kind == "coin":
				var to := Vector3(ppos.x - p.x, pcy - p.y, -wz)
				var dist: float = to.length()
				if dist < magnet_radius and dist > 0.01:
					var step: float = minf(dist, (world_speed * 0.5 + 14.0 + (magnet_radius - dist) * 3.0) * delta)
					var mv: Vector3 = to / dist * step
					p.x += mv.x
					p.y += mv.y
					p.z += mv.z
					p.node.position = Vector3(p.x, p.y, p.z)
					wz = sz + p.z
			var dx: float = absf(p.x - ppos.x)
			var dy: float = absf(p.y - pcy)
			var rx: float = 1.0 if p.kind == "coin" else 1.2
			var ry: float = 1.1 if p.kind == "coin" else 1.4
			if dx < rx and dy < ry and wz >= -0.9 and wz - dz <= 0.9:
				_pick(p, Vector3(p.x, p.y, wz))


func _pick(p: WT.Pickup, world_pos: Vector3) -> void:
	p.collected = true
	if p.node != null:
		p.node.queue_free()
		p.node = null
	if p.kind == "coin":
		var v: int = coin_mult
		run_coins += v
		coin_score += v * 10 * score_mult
		coin_pitch = minf(1.6, coin_pitch + 0.04) if elapsed - last_coin_time < 0.45 else 1.0
		last_coin_time = elapsed
		AudioManager.play_sfx("coin", coin_pitch, -4.0)
		burst(world_pos, Color("ffc41a"), 8)
		GameState.coin_collected.emit(run_coins, SaveManager.coins + run_coins)
		if run_coins % 25 == 0:
			hud.show_message("COIN STREAK!", Color("ffc41a"))
	else:
		activate_powerup(p.id)
		burst(world_pos, PF.power_color(p.id), 22)


func activate_powerup(id: String) -> void:
	if powerups.has(id):
		var existing: Node = powerups[id]
		existing.refresh()
	else:
		var pu: Node = (POWER_SCRIPTS[id] as GDScript).new()
		powerup_root.add_child(pu)
		powerups[id] = pu
		pu.setup(self, id)
	GameState.powerup_collected.emit(id)
	AudioManager.play_sfx("powerup")
	hud.flash(PF.power_color(id))
	player.pulse()
	add_shake(0.25)


func powerup_finished(pu: Node) -> void:
	var id: String = pu.id
	if powerups.get(id) == pu:
		powerups.erase(id)
	GameState.powerup_expired.emit(id)
	pu.queue_free()


func is_player_over_gap() -> bool:
	for seg in generator.segments:
		var sz: float = seg.position.z
		if sz < -8.0 or sz - SEG_LEN > 8.0:
			continue
		for g in seg.gaps:
			var gp: WT.Gap = g
			if sz + gp.z0 > -2.0 and sz + gp.z1 < 2.0:
				return true
	return false


# ------------------------------------------------------------------ hazards
func _check_hazards(dz: float) -> void:
	var py: float = player.position.y
	var ptop: float = py + player.hit_height()
	var px: float = player.position.x
	for seg in generator.segments:
		var sz: float = seg.position.z
		if sz < -4.0 or sz - SEG_LEN > 6.0:
			continue
		for ob in seg.obstacles:
			var o: WT.Obstacle = ob
			if not o.active or (o.gate and not o.on):
				continue
			var wz: float = sz + o.z
			var h: float = o.hz + PLAYER_HZ
			if wz < -h or wz - dz > h:
				continue
			if absf(o.x - px) > o.hx + PLAYER_HX:
				continue
			if py >= o.y1 or ptop <= o.y0:
				continue
			_on_obstacle_hit(o, Vector3(o.x, 0.8, wz))
			if state != State.RUNNING:
				return
		if player.grounded and py <= 0.08 and player.ground_y < 0.2:
			for g in seg.gaps:
				var gp: WT.Gap = g
				var near: float = sz + gp.z0
				var far: float = sz + gp.z1
				if far + 0.45 < 0.0 and near - 0.45 > 0.0:
					_on_fall()
					return


func _absorb() -> bool:
	for id in ["shield", "hover"]:
		if powerups.has(id):
			var pu: Node = powerups[id]
			if pu.absorb_hit():
				return true
	return false


func _on_obstacle_hit(o: WT.Obstacle, wpos: Vector3) -> void:
	if player.invuln > 0.0:
		return
	if boost_mult > 1.0:
		_smash(o, wpos)
		return
	if _absorb():
		_smash(o, wpos)
		player.invuln = player.grace_time
		hud.flash(Color(0.4, 0.9, 1.0))
		return
	_crash("hit")


func _on_fall() -> void:
	if powerups.has("hover") and (powerups["hover"] as Node).absorb_hit():
		player.rescue_hop()
		player.invuln = player.grace_time
		hud.flash(Color("ff3df0"))
		add_shake(0.4)
		return
	_crash("fall")


func _smash(o: WT.Obstacle, wpos: Vector3) -> void:
	o.active = false
	if o.node != null:
		o.node.visible = false
	burst(wpos, Color("ff8a3a"), 20)
	AudioManager.play_sfx("smash")
	add_shake(0.5)


func _on_player_landed(hard: bool) -> void:
	if hard:
		add_shake(0.12)


# ------------------------------------------------------------------ crash / end
func _crash(reason: String) -> void:
	if state != State.RUNNING:
		return
	state = State.CRASHING
	crash_reason = reason
	phase_time = 0.0
	player.crash(reason == "fall")
	AudioManager.play_sfx("crash")
	AudioManager.stop_music(0.8)
	add_shake(1.0)
	hud.flash(Color(1.0, 0.25, 0.1))
	burst(player.position + Vector3(0, 0.6, 0), SkinBuilder.preview_color(SaveManager.selected_skin), 40)
	for id in powerups.keys():
		var pu: Node = powerups[id]
		pu.set_process(false)
	GameState.player_crashed.emit()


func _commit_run() -> Dictionary:
	if committed:
		return result
	committed = true
	var sc: int = score()
	var di: int = int(distance)
	SaveManager.add_coins(run_coins)
	var new_best: bool = SaveManager.submit_run(di, run_coins, sc)
	result = {"distance": di, "coins": run_coins, "score": sc, "best": SaveManager.best_distance,
		"new_best": new_best, "bank": SaveManager.coins}
	GameState.run_ended.emit(di, run_coins, sc)
	return result


func _finish_run() -> void:
	if state == State.OVER:
		return
	state = State.OVER
	var r: Dictionary = _commit_run()
	AudioManager.play_sfx("gameover")
	hud.visible = false
	game_over_ui.show_results(r)


# ------------------------------------------------------------------ pause / navigation
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause") and state == State.RUNNING and not get_tree().paused:
		_pause()
		get_viewport().set_input_as_handled()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and state == State.RUNNING and not get_tree().paused:
		_pause()


func _pause() -> void:
	get_tree().paused = true
	AudioManager.set_ducked(true)
	pause_menu.open()


func _on_resume() -> void:
	get_tree().paused = false
	AudioManager.set_ducked(false)


func _on_restart() -> void:
	if state != State.OVER:
		_commit_run()
	AudioManager.set_ducked(false)
	GameState.go_to(GameState.SCENE_GAME, false)


func _on_to_menu() -> void:
	if state != State.OVER:
		_commit_run()
	AudioManager.set_ducked(false)
	GameState.open_menu_panel = ""
	GameState.go_to(GameState.SCENE_MENU, false)


func _on_to_skins() -> void:
	AudioManager.set_ducked(false)
	GameState.open_menu_panel = "skins"
	GameState.go_to(GameState.SCENE_MENU, false)


# ------------------------------------------------------------------ camera
func _update_camera(delta: float) -> void:
	var px: float = player.position.x
	var py: float = player.position.y
	var dead: bool = state == State.CRASHING or state == State.OVER
	var follow_y: float = 0.0 if player.falling else py
	var target := Vector3(px * 0.6, 3.5 + follow_y * 0.3, 6.4 if not dead else 7.4)
	camera.position = camera.position.lerp(target, 1.0 - exp(-8.0 * delta))
	var look := Vector3(px * 0.85, 1.0 + follow_y * 0.5, -9.0)
	camera.look_at(look, Vector3.UP)
	cam_roll = lerpf(cam_roll, clampf(-player.lane_vel * 0.03, -0.07, 0.07), 1.0 - exp(-6.0 * delta))
	camera.rotation.z = cam_roll
	shake = maxf(0.0, shake - delta * 2.2)
	camera.h_offset = randf_range(-1.0, 1.0) * shake * 0.3
	camera.v_offset = randf_range(-1.0, 1.0) * shake * 0.3
	var speed01: float = clampf((world_speed - 14.0) / 36.0, 0.0, 1.0)
	camera.fov = lerpf(camera.fov, 68.0 + speed01 * 16.0, 1.0 - exp(-3.0 * delta))
	speed_lines.emitting = world_speed > 26.0 and int(SaveManager.settings["quality"]) > 0 and state == State.RUNNING

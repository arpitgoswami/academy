extends Node
## Fully procedural audio. Buses: Master, Music, SFX. No external files.

const RATE: int = 22050
const POOL_SIZE: int = 12
const STEPS: Array = ["sfx", "menu_music", "game_music"]

var sfx: Dictionary = {}
var music_streams: Dictionary = {}
var _built: Dictionary = {}
var _pool: Array = []
var _pool_i: int = 0
var _music: AudioStreamPlayer
var _music_kind: String = ""
var _ducked: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	for bus_name in ["Music", "SFX"]:
		if AudioServer.get_bus_index(bus_name) == -1:
			AudioServer.add_bus()
			var idx: int = AudioServer.get_bus_count() - 1
			AudioServer.set_bus_name(idx, bus_name)
			AudioServer.set_bus_send(idx, "Master")
	for i in POOL_SIZE:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_pool.append(p)
	_music = AudioStreamPlayer.new()
	_music.bus = "Music"
	add_child(_music)
	SaveManager.settings_changed.connect(apply_volumes)
	apply_volumes()


func apply_volumes() -> void:
	for pair in [["Master", "master"], ["Music", "music"], ["SFX", "sfx"]]:
		var idx: int = AudioServer.get_bus_index(pair[0])
		var v: float = float(SaveManager.settings[pair[1]])
		AudioServer.set_bus_mute(idx, v <= 0.001)
		AudioServer.set_bus_volume_db(idx, linear_to_db(maxf(v, 0.0001)))


# ---------------------------------------------------------------- building
func build_step(i: int) -> void:
	var step: String = STEPS[i]
	if _built.has(step):
		return
	_built[step] = true
	match step:
		"sfx": _build_sfx()
		"menu_music": music_streams["menu"] = _make_menu_music()
		"game_music": music_streams["game"] = _make_game_music()


func ensure_built() -> void:
	for i in STEPS.size():
		build_step(i)


func _wav(samples: PackedFloat32Array, loop: bool = false) -> AudioStreamWAV:
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = RATE
	w.stereo = false
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in samples.size():
		bytes.encode_s16(i * 2, int(clampf(samples[i], -1.0, 1.0) * 30000.0))
	w.data = bytes
	if loop:
		w.loop_mode = AudioStreamWAV.LOOP_FORWARD
		w.loop_begin = 0
		w.loop_end = samples.size()
	return w


func _tone(f0: float, f1: float, dur: float, wave: String = "sine", vol: float = 0.5,
		noise_amt: float = 0.0, decay: float = 2.0) -> PackedFloat32Array:
	var n: int = int(dur * RATE)
	var out := PackedFloat32Array()
	out.resize(n)
	var phase: float = 0.0
	for i in n:
		var t: float = float(i) / float(n)
		phase += lerpf(f0, f1, t) / float(RATE)
		var ph: float = fposmod(phase, 1.0)
		var s: float = 0.0
		match wave:
			"sine": s = sin(phase * TAU)
			"square": s = (1.0 if ph < 0.5 else -1.0) * 0.6
			"saw": s = ph * 2.0 - 1.0
			"tri": s = absf(ph * 4.0 - 2.0) - 1.0
		if noise_amt > 0.0:
			s = lerpf(s, randf() * 2.0 - 1.0, noise_amt)
		var env: float = minf(1.0, float(i) / (RATE * 0.004)) * pow(1.0 - t, decay)
		out[i] = s * env * vol
	return out


func _concat(parts: Array) -> PackedFloat32Array:
	var out := PackedFloat32Array()
	for p in parts:
		out.append_array(p)
	return out


func _add_at(dst: PackedFloat32Array, src: PackedFloat32Array, offset: int) -> void:
	for i in src.size():
		var j: int = offset + i
		if j >= dst.size():
			break
		dst[j] += src[i]


func _mix(a: PackedFloat32Array, b: PackedFloat32Array) -> PackedFloat32Array:
	var out := PackedFloat32Array()
	out.resize(maxi(a.size(), b.size()))
	_add_at(out, a, 0)
	_add_at(out, b, 0)
	return out


func _hz(semi: int) -> float:
	return 440.0 * pow(2.0, float(semi - 9) / 12.0)  # semi 0 = C4


func _build_sfx() -> void:
	sfx["click"] = _wav(_tone(900, 1300, 0.05, "square", 0.22))
	sfx["coin"] = _wav(_concat([_tone(1300, 1300, 0.05, "sine", 0.32), _tone(1950, 1950, 0.13, "sine", 0.3)]))
	sfx["jump"] = _wav(_tone(260, 640, 0.2, "tri", 0.4))
	sfx["land"] = _wav(_mix(_tone(130, 50, 0.14, "sine", 0.55), _tone(100, 100, 0.06, "sine", 0.2, 1.0)))
	sfx["lane"] = _wav(_tone(520, 340, 0.07, "tri", 0.22))
	sfx["slide"] = _wav(_tone(300, 200, 0.28, "saw", 0.12, 0.85, 1.5))
	sfx["crash"] = _wav(_mix(_tone(200, 35, 0.8, "saw", 0.5, 0.4, 2.5), _tone(100, 100, 0.7, "sine", 0.6, 1.0, 3.0)))
	sfx["smash"] = _wav(_mix(_tone(160, 60, 0.25, "saw", 0.4, 0.3, 2.5), _tone(100, 100, 0.2, "sine", 0.4, 1.0, 3.0)))
	sfx["powerup"] = _wav(_concat([_tone(_hz(0), _hz(0), 0.07, "square", 0.25), _tone(_hz(4), _hz(4), 0.07, "square", 0.25),
		_tone(_hz(7), _hz(7), 0.07, "square", 0.25), _tone(_hz(12), _hz(12), 0.22, "sine", 0.4)]))
	sfx["shield_hit"] = _wav(_mix(_tone(1000, 300, 0.35, "saw", 0.3, 0.1, 2.0), _tone(1500, 1500, 0.3, "sine", 0.25)))
	sfx["hover"] = _wav(_tone(180, 700, 0.4, "saw", 0.22, 0.15, 1.5))
	sfx["unlock"] = _wav(_concat([_tone(_hz(0), _hz(0), 0.09, "sine", 0.4), _tone(_hz(4), _hz(4), 0.09, "sine", 0.4),
		_tone(_hz(7), _hz(7), 0.09, "sine", 0.4), _tone(_hz(12), _hz(12), 0.3, "sine", 0.45)]))
	sfx["nope"] = _wav(_tone(220, 150, 0.14, "square", 0.25))
	sfx["gameover"] = _wav(_concat([_tone(440, 440, 0.18, "tri", 0.4), _tone(370, 370, 0.18, "tri", 0.4),
		_tone(311, 311, 0.18, "tri", 0.4), _tone(220, 200, 0.6, "tri", 0.45, 0.0, 1.5)]))
	sfx["milestone"] = _wav(_concat([_tone(_hz(7), _hz(7), 0.1, "sine", 0.35), _tone(_hz(14), _hz(14), 0.25, "sine", 0.4)]))
	sfx["go"] = _wav(_tone(660, 880, 0.18, "square", 0.25))


func _snap(f: float, dur: float) -> float:
	return roundf(f * dur) / dur  # integer cycles per loop -> seamless


func _normalize(buf: PackedFloat32Array, target: float) -> void:
	var peak: float = 0.001
	for v in buf:
		peak = maxf(peak, absf(v))
	var g: float = target / peak
	for i in buf.size():
		buf[i] *= g


func _make_menu_music() -> AudioStreamWAV:
	var dur: float = 8.0
	var n: int = int(dur * RATE)
	var buf := PackedFloat32Array()
	buf.resize(n)
	var chords: Array = [[-12, -5, 0, 4], [-16, -9, -4, 0], [-19, -12, -7, -3], [-17, -10, -5, -1]]
	for ci in chords.size():
		var start: int = ci * n / 4
		var len: int = n / 4
		for semi in chords[ci]:
			var f: float = _snap(_hz(int(semi)), dur)
			for i in len:
				var t: float = float(i) / float(len)
				var env: float = sin(t * PI)
				buf[start + i] += sin(TAU * f * float(start + i) / float(RATE)) * 0.12 * env
	for k in 8:
		var bf: float = _hz(12 + [0, 4, 7, 11][k % 4])
		var bell: PackedFloat32Array = _tone(bf, bf, 0.9, "sine", 0.07, 0.0, 3.0)
		_add_at(buf, bell, k * n / 8)
	_normalize(buf, 0.5)
	return _wav(buf, true)


func _make_game_music() -> AudioStreamWAV:
	var beat: int = int(RATE * 60.0 / 128.0)
	var n: int = beat * 16
	var buf := PackedFloat32Array()
	buf.resize(n)
	var roots: Array = [-15, -19, -12, -17]
	var minor: Array = [true, false, false, false]
	for bar in 4:
		var root: int = roots[bar]
		var third: int = 3 if bool(minor[bar]) else 4
		var chord: Array = [0, third, 7, 12]
		for b in 4:
			var off: int = (bar * 4 + b) * beat
			_add_at(buf, _tone(150, 45, 0.2, "sine", 0.7, 0.0, 3.0), off)                     # kick
			if b % 2 == 1:
				_add_at(buf, _tone(200, 200, 0.12, "tri", 0.12, 0.9, 2.5), off)               # snare
			_add_at(buf, _tone(8000, 8000, 0.04, "sine", 0.09, 1.0, 3.0), off + beat / 2)      # hat
			_add_at(buf, _tone(_hz(root), _hz(root), 0.22, "saw", 0.22, 0.0, 1.5), off)        # bass
			_add_at(buf, _tone(_hz(root), _hz(root), 0.18, "saw", 0.18, 0.0, 1.5), off + beat / 2)
			for e in 2:
				var semi: int = root + 24 + int(chord[(b * 2 + e) % 4])
				_add_at(buf, _tone(_hz(semi), _hz(semi), 0.16, "square", 0.08, 0.0, 2.0), off + e * beat / 2)
	_normalize(buf, 0.6)
	return _wav(buf, true)


# ---------------------------------------------------------------- playback
func play_sfx(sfx_name: String, pitch: float = 1.0, vol_db: float = 0.0) -> void:
	if not sfx.has(sfx_name):
		build_step(0)
		if not sfx.has(sfx_name):
			return
	var p: AudioStreamPlayer = _pool[_pool_i]
	_pool_i = (_pool_i + 1) % POOL_SIZE
	p.stream = sfx[sfx_name]
	p.pitch_scale = pitch
	p.volume_db = vol_db
	p.play()


func click() -> void:
	play_sfx("click")


func play_music(kind: String) -> void:
	if kind == _music_kind and _music.playing:
		return
	_music_kind = kind
	if not music_streams.has(kind):
		build_step(1 if kind == "menu" else 2)
	if not music_streams.has(kind):
		return
	_music.stream = music_streams[kind]
	_music.volume_db = -30.0
	_music.play()
	var tw := create_tween()
	tw.tween_property(_music, "volume_db", _target_music_db(), 0.8)


func _target_music_db() -> float:
	return -14.0 if _ducked else -3.0


func stop_music(fade: float = 0.5) -> void:
	_music_kind = ""
	if not _music.playing:
		return
	var tw := create_tween()
	tw.tween_property(_music, "volume_db", -40.0, fade)
	tw.tween_callback(_music.stop)


func set_ducked(on: bool) -> void:
	_ducked = on
	_music.volume_db = _target_music_db()

extends RefCounted
## Coin pattern generation. Emits dictionaries {x, y, d} (d = track distance).

const LANE_W: float = 2.2
const GAP_LEN: float = 6.0
const STEP: float = 1.8


func free_lanes(row: Dictionary) -> Array:
	var out: Array = []
	var lanes: Array = row["lanes"]
	for i in 3:
		if String(lanes[i]) == "" or String(row["kind"]) == "gap" or String(row["kind"]) == "moving":
			out.append(i - 1)
	if out.is_empty():
		out.append(0)
	return out


func _coin(buf: Array, lane_x: float, y: float, d: float) -> void:
	buf.append({"x": lane_x, "y": y, "d": d})


func _line(buf: Array, lane: int, d0: float, d1: float, y: float) -> void:
	var d: float = d0
	while d <= d1:
		_coin(buf, lane * LANE_W, y, d)
		d += STEP


func intro(buf: Array) -> void:
	_line(buf, 0, 30.0, 70.0, 0.65)


func stretch(buf: Array, row: Dictionary, nxt: Dictionary, tier: int, rng: RandomNumberGenerator, with_coins: bool) -> void:
	var kind: String = row["kind"]
	var lanes: Array = row["lanes"]
	var rd: float = row["d"]
	# decorations on this row: arcs over low obstacles, slide trails under bars, gap arcs
	for i in 3:
		var t: String = lanes[i]
		if t == "low" and rng.randf() < 0.55:
			for k in 5:
				var f: float = float(k) / 4.0
				_coin(buf, (i - 1) * LANE_W, 0.7 + sin(f * PI) * 1.35, rd - 2.6 + float(k) * 1.3)
		elif t == "overhead" and rng.randf() < 0.4:
			_line(buf, i - 1, rd - 3.6, rd + 3.6, 0.4)
	if kind == "gap":
		var gl: int = rng.randi_range(-1, 1)
		for k in 7:
			var f2: float = float(k) / 6.0
			_coin(buf, gl * LANE_W, 0.7 + sin(f2 * PI) * 1.5, rd - 0.5 + float(k) * (GAP_LEN + 1.0) / 6.0)
	if not with_coins:
		return
	var a: float = rd + (GAP_LEN if kind == "gap" else 0.0) + 4.5
	var b: float = float(nxt["d"]) - 5.0
	if b - a < 6.0:
		return
	var fnext: Array = free_lanes(nxt)
	var fprev: Array = free_lanes(row)
	var end_lane: int = fnext[rng.randi_range(0, fnext.size() - 1)]
	var start_lane: int = fprev[rng.randi_range(0, fprev.size() - 1)]
	var r: float = rng.randf()
	if r < 0.4 or tier == 0 and r < 0.75:
		_line(buf, end_lane, a, b, 0.65)
	elif r < 0.65:
		var d: float = a
		while d <= b:
			var f3: float = smoothstep(0.0, 1.0, (d - a) / (b - a))
			_coin(buf, lerpf(float(start_lane), float(end_lane), f3) * LANE_W, 0.65, d)
			d += STEP
	elif r < 0.88:
		var lane: int = start_lane
		var d2: float = a
		while d2 <= b:
			for k in 3:
				if d2 + float(k) * STEP <= b:
					_coin(buf, lane * LANE_W, 0.65, d2 + float(k) * STEP)
			d2 += 3.0 * STEP + 2.5
			lane = clampi(lane + (1 if rng.randf() < 0.5 else -1), -1, 1)
		# last group lands in a safe lane for the next row

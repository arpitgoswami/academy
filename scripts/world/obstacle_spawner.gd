extends RefCounted
## Plans rows of obstacles ahead of the player and guarantees fairness:
##  - every row keeps an escape route (an empty lane, or every lane needs the SAME simple action)
##  - spacing scales with predicted speed so reaction time stays reasonable
##  - gaps are tile-aligned, never straddle a segment, and have cooldowns

const CoinSpawner := preload("res://scripts/world/coin_spawner.gd")
const PF := preload("res://scripts/world/pickup_factory.gd")
const SEG_LEN: float = 36.0
const TILE: float = 3.0
const GAP_LEN: float = 6.0
const LANE_W: float = 2.2

const WEIGHTS: Array = [
	{"low": 30, "crate": 28, "overhead": 22, "gap": 8},
	{"low": 20, "crate": 20, "overhead": 18, "double": 16, "gap": 9, "triple_low": 6, "triple_slide": 5},
	{"low": 14, "crate": 14, "overhead": 14, "double": 16, "gap": 9, "triple_low": 6, "triple_slide": 6, "moving": 10, "gate": 9, "mixed": 8},
	{"low": 10, "crate": 10, "overhead": 10, "double": 18, "gap": 10, "triple_low": 7, "triple_slide": 7, "moving": 12, "gate": 12, "mixed": 12},
]
const TIME_GAP: Array = [1.05, 0.9, 0.78, 0.68]   # seconds of reaction time between rows
const HEAVY: Array = ["double", "triple_low", "triple_slide", "mixed", "moving", "gap"]

var coin_spawner := CoinSpawner.new()
var planned: Dictionary = {}
var buffer_coins: Array = []
var buffer_powers: Array = []
var next_power_d: float = 350.0
var rows_since_gap: int = 99
var last_kind: String = ""
var rows_made: int = 0


func _pick_kind(tier: int, rng: RandomNumberGenerator) -> String:
	var table: Dictionary = WEIGHTS[tier]
	var total: float = 0.0
	var allowed: Dictionary = {}
	for k in table:
		var key: String = k
		if rows_made < 3 and not (key == "low" or key == "crate" or key == "overhead"):
			continue
		if key == "gap" and rows_since_gap < 3:
			continue
		if HEAVY.has(key) and key == last_kind:
			continue
		allowed[key] = float(table[key])
		total += float(table[key])
	var r: float = rng.randf() * total
	for k in allowed:
		r -= float(allowed[k])
		if r <= 0.0:
			return k
	return "low"


func _plan_row(d: float, speed: float, tier: int, rng: RandomNumberGenerator) -> Dictionary:
	var kind: String = _pick_kind(tier, rng)
	var lanes: Array = ["", "", ""]
	var row_d: float = d
	var heavy: bool = HEAVY.has(kind)
	var l: int = rng.randi_range(0, 2)
	match kind:
		"low": lanes[l] = "low"
		"crate": lanes[l] = "crate"
		"overhead":
			lanes[l] = "overhead"
			if tier >= 1 and rng.randf() < 0.4:
				lanes[(l + 1 + rng.randi_range(0, 1)) % 3] = "overhead"
		"double":
			var types: Array = ["crate", "low", "overhead"]
			for i in 3:
				if i != l:
					lanes[i] = types[rng.randi_range(0, 2)]
		"triple_low": lanes = ["low", "low", "low"]
		"triple_slide": lanes = ["overhead", "overhead", "overhead"]
		"moving": lanes[1] = "moving"
		"gate":
			lanes[l] = "gate"
			if rng.randf() < 0.5:
				lanes[(l + 1) % 3] = "gate"
		"mixed":
			var others: Array = ["low", "overhead"]
			if rng.randf() < 0.4:
				others = ["crate", "low"]
			var oi: int = 0
			for i in 3:
				if i != l:
					lanes[i] = others[oi]
					oi += 1
		"gap":
			row_d = ceilf(d / TILE) * TILE
			var seg_end_d: float = (floorf(row_d / SEG_LEN) + 1.0) * SEG_LEN
			if row_d + GAP_LEN > seg_end_d:
				kind = "low"
				row_d = d
				lanes[l] = "low"
				heavy = false
	var pred: float = minf(36.0, speed + 6.0)
	var sp: float = maxf(11.0, pred * float(TIME_GAP[tier]))
	if heavy:
		sp += pred * 0.3
	if kind == "gap":
		sp += GAP_LEN
	rows_since_gap = 0 if kind == "gap" else rows_since_gap + 1
	last_kind = kind
	rows_made += 1
	return {"d": row_d, "kind": kind, "lanes": lanes, "spacing": sp}


func generate(seg_idx: int, speed: float, tier: int, rng: RandomNumberGenerator) -> Dictionary:
	var seg_start: float = float(seg_idx) * SEG_LEN
	var seg_end: float = seg_start + SEG_LEN
	var out: Dictionary = {"obstacles": [], "coins": [], "powers": [], "gaps": []}
	if planned.is_empty():
		coin_spawner.intro(buffer_coins)
		planned = _plan_row(85.0, speed, tier, rng)
	while float(planned["d"]) < seg_end:
		var row: Dictionary = planned
		_emit_row(row, out, rng)
		var nxt: Dictionary = _plan_row(float(row["d"]) + float(row["spacing"]), speed, tier, rng)
		var a: float = float(row["d"]) + (GAP_LEN if String(row["kind"]) == "gap" else 0.0) + 4.5
		var b: float = float(nxt["d"]) - 5.0
		var power_here: bool = float(row["d"]) >= next_power_d and b - a >= 12.0
		coin_spawner.stretch(buffer_coins, row, nxt, tier, rng, not power_here)
		if power_here:
			var fl: Array = coin_spawner.free_lanes(nxt)
			var lane: int = fl[rng.randi_range(0, fl.size() - 1)]
			buffer_powers.append({"id": PF.ORDER[rng.randi_range(0, PF.ORDER.size() - 1)],
				"x": float(lane) * LANE_W, "y": 1.1, "d": (a + b) * 0.5})
			next_power_d = (a + b) * 0.5 + rng.randf_range(450.0, 800.0)
		planned = nxt
	_flush(buffer_coins, out["coins"], seg_end)
	_flush(buffer_powers, out["powers"], seg_end)
	return out


func _flush(buf: Array, dst: Array, seg_end: float) -> void:
	var keep: Array = []
	for c in buf:
		if float(c["d"]) < seg_end:
			dst.append(c)
		else:
			keep.append(c)
	buf.clear()
	buf.append_array(keep)


func _emit_row(row: Dictionary, out: Dictionary, rng: RandomNumberGenerator) -> void:
	var d: float = row["d"]
	if String(row["kind"]) == "gap":
		out["gaps"].append({"d0": d, "d1": d + GAP_LEN})
		return
	var lanes: Array = row["lanes"]
	for i in 3:
		var t: String = lanes[i]
		if t != "":
			out["obstacles"].append({"type": t, "lane": i - 1, "d": d, "phase": rng.randf() * TAU})

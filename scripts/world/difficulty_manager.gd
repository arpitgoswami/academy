extends RefCounted
## Difficulty tiers by track distance (metres).
## Tier 0: simple obstacles | 1: lane switching + coin trails | 2: moving hazards, mixed | 3: faster, tighter.

const TIER_START: Array = [0.0, 500.0, 1300.0, 2600.0]
const TIER_NAMES: Array = ["Warm-up", "Rhythm", "Chaos", "Overdrive"]


func tier_for(d: float) -> int:
	for i in range(TIER_START.size() - 1, -1, -1):
		if d >= float(TIER_START[i]):
			return i
	return 0

extends Node3D
## Pool of track segments that scroll toward the player and are recycled to the front.

const TrackSegment := preload("res://scripts/world/track_segment.gd")
const ObstacleSpawner := preload("res://scripts/world/obstacle_spawner.gd")
const Difficulty := preload("res://scripts/world/difficulty_manager.gd")
const SEG_LEN: float = 36.0

@export var segment_count: int = 8

var segments: Array = []
var populate: bool = true
var rng := RandomNumberGenerator.new()
var spawner := ObstacleSpawner.new()
var difficulty := Difficulty.new()
var next_index: int = 0
var cur_speed: float = 14.0
var seed_used: int = 0


func setup(p_populate: bool, p_seed: int = 0) -> void:
	populate = p_populate
	if p_seed != 0:
		rng.seed = p_seed
	else:
		rng.randomize()
	seed_used = rng.seed
	for i in segment_count:
		var seg := TrackSegment.new()
		add_child(seg)
		seg.build_static(rng.randi())
		seg.position = Vector3(0, 0, 12.0 - float(i) * SEG_LEN)
		_prepare(seg)
		segments.append(seg)


func _theme_for(idx: int) -> int:
	if idx % 7 == 4:
		return 1   # tunnel
	if idx % 11 == 7:
		return 2   # bridge
	return 0


func _prepare(seg: Node3D) -> void:
	var idx: int = next_index
	next_index += 1
	seg.set_theme(_theme_for(idx))
	if populate:
		var tier: int = difficulty.tier_for(float(idx) * SEG_LEN - 12.0)
		seg.apply(spawner.generate(idx, cur_speed, tier, rng), idx)
	else:
		seg.apply({}, idx)


func scroll(dz: float) -> void:
	var front_z: float = 0.0
	for seg in segments:
		seg.position.z += dz
		front_z = minf(front_z, seg.position.z)
	for seg in segments:
		if seg.position.z > SEG_LEN + 16.0:
			var fz: float = 0.0
			for s2 in segments:
				fz = minf(fz, s2.position.z)
			seg.position.z = fz - SEG_LEN
			_prepare(seg)

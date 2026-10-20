extends Node
## Shared power-up behaviour. One instance per active power-up id; re-collecting only refreshes
## the timer, so effects never stack beyond one instance.

const PF := preload("res://scripts/world/pickup_factory.gd")

var game: Node
var id: String = ""
var display_name: String = ""
var color: Color = Color.WHITE
var duration: float = 10.0
var remaining: float = 10.0
var charges: int = 0
var finished: bool = false


func setup(p_game: Node, p_id: String) -> void:
	game = p_game
	id = p_id
	var info: Dictionary = PF.INFO[p_id]
	display_name = String(info["name"])
	color = PF.power_color(p_id)
	duration = float(info["duration"])
	remaining = duration
	_on_activate()


func refresh() -> void:
	remaining = duration
	_on_refresh()


func _process(delta: float) -> void:
	if finished:
		return
	remaining -= delta
	if remaining <= 0.0 and can_expire():
		expire()


func can_expire() -> bool:
	return true


func absorb_hit() -> bool:
	return false


func expire() -> void:
	if finished:
		return
	finished = true
	_on_expire()
	game.powerup_finished(self)


func _on_activate() -> void:
	pass


func _on_refresh() -> void:
	pass


func _on_expire() -> void:
	pass

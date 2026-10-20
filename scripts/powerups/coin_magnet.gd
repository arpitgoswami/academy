extends "res://scripts/powerups/powerup_base.gd"
@export var radius: float = 7.0

func _on_activate() -> void:
	game.magnet_radius = radius
	game.player.set_effect("magnet", true)

func _on_expire() -> void:
	game.magnet_radius = 0.0
	game.player.set_effect("magnet", false)

extends "res://scripts/powerups/powerup_base.gd"

func _on_activate() -> void:
	game.coin_mult = 2

func _on_expire() -> void:
	game.coin_mult = 1

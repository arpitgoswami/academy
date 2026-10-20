extends "res://scripts/powerups/powerup_base.gd"
## Score from coins x3 while active.

func _on_activate() -> void:
	game.score_mult = 3

func _on_expire() -> void:
	game.score_mult = 1

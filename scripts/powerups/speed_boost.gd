extends "res://scripts/powerups/powerup_base.gd"
## +50% speed, smashes obstacles and hovers over gaps. Will not end while over a gap.

func _on_activate() -> void:
	game.boost_mult = 1.5
	game.player.boost_hover = true
	game.player.set_effect("boost", true)

func can_expire() -> bool:
	return not game.is_player_over_gap()

func _on_expire() -> void:
	game.boost_mult = 1.0
	game.player.boost_hover = false
	game.player.set_effect("boost", false)
	game.player.invuln = maxf(game.player.invuln, 0.6)

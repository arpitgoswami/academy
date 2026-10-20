extends "res://scripts/powerups/powerup_base.gd"
## Absorbs one hit (or expires after its duration).

func _on_activate() -> void:
	charges = 1
	game.player.set_effect("shield", true)

func _on_refresh() -> void:
	charges = 1

func absorb_hit() -> bool:
	if charges <= 0 or finished:
		return false
	charges -= 1
	AudioManager.play_sfx("shield_hit")
	expire()
	return true

func _on_expire() -> void:
	game.player.set_effect("shield", false)

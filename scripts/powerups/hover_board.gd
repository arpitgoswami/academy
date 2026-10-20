extends "res://scripts/powerups/powerup_base.gd"
## Survives one fatal hit or fall, grants a double jump, then breaks.

func _on_activate() -> void:
	charges = 1
	game.player.double_jump_enabled = true
	game.player.set_effect("board", true)

func _on_refresh() -> void:
	charges = 1

func absorb_hit() -> bool:
	if charges <= 0 or finished:
		return false
	charges -= 1
	AudioManager.play_sfx("hover", 0.7)
	expire()
	return true

func _on_expire() -> void:
	game.player.double_jump_enabled = false
	game.player.set_effect("board", false)

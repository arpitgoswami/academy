# BOX SURFER (Godot 4.3, GDScript)
3D endless runner. Game design and idea: ARPIT GOSWAMI. Everything else: CLAUDE SONNET 5.5.

## Run
Open `project.godot` in Godot 4.3 and press F5 (main scene: loading screen -> main menu).
Headless smoke test: `godot --headless --path . --script res://tests/smoke_test.gd --fixed-fps 60`

## Controls
A/Left, D/Right: change lane | W/Up/Space: jump | S/Down: slide (in air: fast-fall) | Esc: pause
Menus: arrows + Enter, mouse, Esc = back. Skins: arrows browse, Q/E or mouse-drag rotates.

## Features
Loading screen (real progress), 3D animated menu, 10 procedural skins with buy/select/persist,
power-up info screen, top-10 high scores, settings (Master/Music/SFX buses, quality, shake, window/resolution),
credits, exit confirmation, pause/restart, game over with one-time reward commit.
Obstacles: low barrier, overhead bar, crate, moving cart, electric gate, road gaps, multi-lane rows.
Power-ups: Coin Magnet, Shield, Speed Boost, Double Coins, Hover Board (double jump + saves from a fall), Score x3.
4 difficulty tiers (0/500/1300/2600 m), fairness rules in `scripts/world/obstacle_spawner.gd`.
All audio, textures, and models are generated in code. Saves: `user://box_surfer_save.json`.
Set `GameState.debug_seed` for a reproducible track.

## Verified vs untested
Verified by headless Godot 4.3 runs: no script errors; full flow menu -> skin purchase -> run -> power-ups ->
crash -> save -> restart; node count stays stable while recycling.
NOT verified (no display/audio device here): visuals, lighting/materials look, audio quality, game feel/balance,
mouse drag in skins, window mode/resolution changes. Headless prints harmless "mesh_get_surface_count" renderer noise.
Notes: collisions use deterministic swept AABB checks instead of physics bodies; shield doesn't save from gaps (hover board does).

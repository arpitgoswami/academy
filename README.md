<img width="1915" height="982" alt="Screenshot 2026-10-20 235254" src="https://github.com/user-attachments/assets/4fa4d135-c205-4cb2-ba99-f9e1953b8cce" />
<img width="1915" height="982" alt="Screenshot 2026-10-20 235241" src="https://github.com/user-attachments/assets/749f5426-4138-497e-9263-16f95f3ed730" />

# BOX SURFER

A fast-paced 3D endless runner built with **Godot 4.3** and **GDScript**. Surf a neon sky highway as a box-shaped character: switch lanes, jump, slide, grab coins and power-ups, and unlock new skins.

Everything is generated in code. There are no external models, textures, or sound files, so the repo is tiny and has nothing to download.

> **Credits**
> Game Design and Idea: **ARPIT GOSWAMI**
> Everything else: **CLAUDE SONNET 5.5**

---

## Table of contents

- [Quick start](#quick-start)
- [Controls](#controls)
- [Features](#features)
- [Obstacles](#obstacles)
- [Power-ups](#power-ups)
- [Skins](#skins)
- [Difficulty and fairness](#difficulty-and-fairness)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Configuration](#configuration)
- [Save data](#save-data)
- [Testing](#testing)
- [Known limitations](#known-limitations)
- [Roadmap ideas](#roadmap-ideas)
- [Contributing](#contributing)
- [License](#license)

---

## Quick start

**Requirements:** [Godot 4.3](https://godotengine.org/download) (standard build, GDScript only; no .NET needed). Forward+ renderer; a GPU that supports Vulkan is recommended.

```bash
git clone https://github.com/<your-username>/box-surfer.git
cd box-surfer
```

1. Open Godot, click **Import**, and select `project.godot`.
2. Press **F5** (or the Play button). The main scene is the loading screen, which leads into the main menu.

To run from the command line:

```bash
godot --path .
```

## Controls

| Action | Keys |
|---|---|
| Move left | `A` / `Left Arrow` |
| Move right | `D` / `Right Arrow` |
| Jump | `W` / `Up Arrow` / `Space` |
| Slide | `S` / `Down Arrow` (in mid-air: fast-fall, then slide on landing) |
| Pause | `Esc` |
| Double jump | Jump again in the air while a Hover Board is active |

**Menus:** `Up`/`Down` to move, `Enter` to select, `Esc` to go back, or use the mouse.
**Skins screen:** `Left`/`Right` to browse, `Q`/`E` or mouse-drag to rotate the preview.

The input actions (`move_left`, `move_right`, `jump`, `slide`, `pause`) are registered in code by `GameState`, so touch controls can later be added by emitting the same actions.

## Features

- **Gameplay:** three lanes with smooth lane interpolation, gravity-based jump, slide with a lowered hit box, input buffering, and speed that ramps up to a configurable maximum.
- **Endless procedural track:** a pool of 8 recycled 36 m segments, a seedable generator, tunnel and bridge segments, a sky highway with floating islands, towers, and clouds.
- **7 obstacle types** and **6 power-ups** (see below).
- **Coins:** lines, curves, zig-zags, arcs over low obstacles, slide trails, and optional risky trails.
- **10 procedural skins** with buy, select, and persist.
- **Screens:** loading (real progress), animated 3D main menu, skins, power-up info, top-10 high scores, settings, credits, exit confirmation, pause, and game over.
- **Procedural audio:** synthesized SFX and looping music (`AudioStreamWAV`), pooled players, and `Master` / `Music` / `SFX` buses.
- **Game feel:** chase camera with lean and FOV kick, camera shake (toggleable), particle bursts, speed lines, squash and stretch, color flashes, and milestone messages (500, 1000, 2500, 5000, 10000 m).
- **Settings:** volumes, mouse sensitivity, graphics quality (Low, Medium, High), camera shake, window mode, and resolution. All are applied immediately and saved.
- **Robust saves:** JSON in `user://`, validated on load, and safe against missing or corrupt files.

## Obstacles

| Type | How to beat it |
|---|---|
| Low barrier | Jump over it |
| Overhead bar | Slide under it |
| Large crate | Change lanes (too tall to jump) |
| Moving cart | Sweeps across lanes; time a jump or pick a gap |
| Electric gate | Only dangerous while the beam is on; jump or wait |
| Road gap | Jump across |
| Multi-lane rows | Mixed combinations that always leave an escape route |

## Power-ups

| Power-up | Effect | Duration |
|---|---|---|
| Coin Magnet | Pulls nearby coins to you | 10 s |
| Shield | Absorbs one crash, then shatters; brief grace period afterward | 12 s |
| Speed Boost | +50% speed, smashes obstacles, hovers over gaps (will not end while over a gap) | 5 s |
| Double Coins | Every coin counts twice | 15 s |
| Hover Board | Survives one fatal hit **or fall**, grants a double jump, then breaks | 25 s |
| Score x3 | Coin score is tripled | 12 s |

Collecting an active power-up only refreshes its timer, so nothing stacks uncontrollably. Pausing freezes all timers.

## Skins

Classic (free), Lava, Neon, Gold, Toxic, Shadow, Frost, Pixel, Galaxy, and Royal. Prices range from 100 to 800 coins, and every skin has its own procedural material, accessory, and palette. Edit prices and looks in `scripts/skins/skin_builder.gd`.

## Difficulty and fairness

Difficulty is driven by track distance:

| Tier | From | Adds |
|---|---|---|
| 0 Warm-up | 0 m | Simple obstacles, generous spacing |
| 1 Rhythm | 500 m | Double rows, triple rows, more gaps, coin trails |
| 2 Chaos | 1300 m | Moving carts, electric gates, mixed rows |
| 3 Overdrive | 2600 m | Heavier mixes, tighter reaction windows |

Rules enforced in `scripts/world/obstacle_spawner.gd`:

- The first 85 m are empty, and the first three rows are simple.
- Every row keeps an empty lane, except rows where all three lanes need the same simple action (all jump or all slide).
- Row spacing scales with predicted speed, so reaction time stays reasonable. Heavy rows and gaps get extra distance.
- Gaps are tile-aligned, never straddle two segments, and have cooldowns.
- Heavy row types never repeat back to back.

For a reproducible track, set `GameState.debug_seed` to a non-zero value.

## Project structure

```
project.godot
scenes/
  loading_screen.tscn  main_menu.tscn  game.tscn
  player.tscn  track_segment.tscn
  ui/  hud.tscn  pause_menu.tscn  game_over.tscn
scripts/
  game.gd                      # run controller: scroll, collisions, pickups, camera, flow
  autoload/
    save_manager.gd            # persistence, settings, coins, skins, high scores
    audio_manager.gd           # procedural SFX/music, buses, pooled players
    game_state.gd              # global signals, input map, scene transitions
  player/
    player_controller.gd       # lanes, jump, slide, effects
    player_animation.gd        # procedural animation
  world/
    track_generator.gd         # segment pool and recycling
    track_segment.gd           # road tiles, scenery, dynamic content
    obstacle_spawner.gd        # row planning and fairness rules
    coin_spawner.gd            # coin patterns
    difficulty_manager.gd      # tier thresholds
    obstacle_factory.gd        # obstacle meshes and hit boxes
    pickup_factory.gd          # coin/power-up visuals and metadata
    world_builder.gd           # materials, environment, scenery
    world_types.gd             # typed data classes
  powerups/
    powerup_base.gd  coin_magnet.gd  shield.gd  speed_boost.gd
    double_coins.gd  hover_board.gd  coin_multiplier.gd
  skins/skin_builder.gd        # 10 procedural skins
  ui/
    loading_screen.gd  main_menu.gd  settings_menu.gd
    hud.gd  pause_menu.gd  game_over.gd  ui_theme.gd
tests/
  smoke_test.gd  soak_test.gd  persist_test.gd
```

## Architecture notes

- **World scrolls, player stays put.** The player only moves in X and Y; track segments move toward the camera. This avoids floating-point drift in long runs.
- **Deterministic collisions.** Obstacles are checked with swept box overlap in game code, so there is no tunneling at high speed and no dependence on physics-engine timing. Pickups and gaps use the same approach.
- **Data in, nodes out.** Spawners produce plain dictionaries; `track_segment.gd` turns them into nodes when a segment is recycled. Node count stays flat during long runs.
- **Signals.** `GameState` exposes `run_started`, `run_ended`, `player_crashed`, `distance_changed`, `coin_collected`, `powerup_collected`, and `powerup_expired`. `SaveManager` emits `skin_unlocked`, `skin_selected`, `high_score_achieved`, `coins_changed`, and `settings_changed`.
- **One-time rewards.** A run is committed exactly once (crash, restart, or quit to menu), so coins and high scores are never duplicated.
- **No `class_name` globals.** Scripts reference each other with `preload`, so the project works from a fresh checkout without an editor import step.

## Configuration

Exported variables on `scenes/player.tscn` (`player_controller.gd`):

| Variable | Default | Meaning |
|---|---|---|
| `start_speed` | 14.0 | Initial speed (m/s) |
| `max_speed` | 34.0 | Speed cap |
| `acceleration` | 0.1 | Speed gain per second |
| `lane_width` | 2.2 | Distance between lanes |
| `lane_switch_duration` | 0.14 | Lane change time (s) |
| `jump_height` | 2.4 | Apex height (m) |
| `jump_duration` | 0.8 | Time in the air (s) |
| `slide_duration` | 0.7 | Slide time (s) |
| `grace_time` | 1.2 | Safety window after a shield or hover board absorbs a hit |

Other tunables: difficulty thresholds in `difficulty_manager.gd`, obstacle weights and reaction times in `obstacle_spawner.gd`, milestones in `game.gd`, and skin prices in `skin_builder.gd`.

## Save data

Saved to `user://box_surfer_save.json`. Typical locations:

- Windows: `%APPDATA%\Godot\app_userdata\BOX SURFER\`
- macOS: `~/Library/Application Support/Godot/app_userdata/BOX SURFER/`
- Linux: `~/.local/share/godot/app_userdata/BOX SURFER/`

It stores coins, best distance, owned skins, selected skin, the top-10 scores, and settings. Delete the file to reset progress.

## Testing

Headless scripts live in `tests/`:

```bash
# Full flow: menu, skin purchase, run, all power-ups, crash, save, restart
godot --headless --path . --script res://tests/smoke_test.gd --fixed-fps 60

# Long run: segment recycling, tiers, node-count stability
godot --headless --path . --script res://tests/soak_test.gd --fixed-fps 60

# Persistence, corrupt/invalid saves, pause and resume
godot --headless --path . --script res://tests/persist_test.gd --fixed-fps 60
```

Notes:

- The headless renderer prints harmless `mesh_get_surface_count` errors; they are not game bugs.
- The soak test's invulnerable bot can still die by falling into a gap. That is expected, since invulnerability only covers obstacles.
- These tests cover logic and flow. **Visual look, audio quality, game feel, and balance have not been verified on a real display and speakers**, so expect to tune them after playing.

## Known limitations

- Visuals, audio mix, and difficulty balance are untested on real hardware.
- Mouse drag in the skins screen, window mode, and resolution changes are untested.
- Shield does not protect from falling into a gap (Hover Board does).
- Keyboard and mouse only. Touch input is planned but not implemented.
- No localization; UI text is English.

## Roadmap ideas

- Touch and gamepad controls
- Additional worlds and themes
- Daily challenges and missions
- Upgradeable power-up durations
- Replay ghosts and online leaderboards

## Contributing

Issues and pull requests are welcome. Please keep scripts typed where possible, avoid external binary assets, and run the three tests above before submitting.

## License

No license has been chosen yet. Add a `LICENSE` file (for example MIT) before publishing. The game is inspired by lane-switching runners but uses no third-party characters, branding, or assets.

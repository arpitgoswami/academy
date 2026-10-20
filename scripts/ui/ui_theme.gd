extends RefCounted
## Shared UI look: navy panels, cyan focus, bold white text with outlines.

static func box(bg: Color, border: Color, bw: int = 2, radius: int = 10) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(bw)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = 18
	sb.content_margin_right = 18
	sb.content_margin_top = 10
	sb.content_margin_bottom = 10
	return sb


static func bold_font() -> FontVariation:
	var f := FontVariation.new()
	f.base_font = ThemeDB.fallback_font
	f.variation_embolden = 0.7
	return f


static func build() -> Theme:
	var t := Theme.new()
	t.default_font = bold_font()
	t.default_font_size = 22
	t.set_stylebox("normal", "Button", box(Color(0.04, 0.08, 0.2, 0.85), Color("2a6bff")))
	t.set_stylebox("hover", "Button", box(Color(0.07, 0.15, 0.34, 0.95), Color("00e5ff")))
	t.set_stylebox("pressed", "Button", box(Color(0.1, 0.25, 0.5, 1.0), Color("ffffff")))
	t.set_stylebox("focus", "Button", box(Color(0.08, 0.2, 0.42, 0.95), Color("00e5ff"), 3))
	t.set_stylebox("disabled", "Button", box(Color(0.06, 0.07, 0.12, 0.8), Color("333a55")))
	t.set_color("font_color", "Button", Color.WHITE)
	t.set_color("font_hover_color", "Button", Color.WHITE)
	t.set_color("font_focus_color", "Button", Color("aaf6ff"))
	t.set_color("font_pressed_color", "Button", Color.WHITE)
	t.set_color("font_disabled_color", "Button", Color(0.55, 0.58, 0.7))
	t.set_color("font_color", "Label", Color.WHITE)
	t.set_color("font_outline_color", "Label", Color(0, 0, 0, 0.9))
	t.set_constant("outline_size", "Label", 4)
	t.set_stylebox("panel", "PanelContainer", box(Color(0.02, 0.04, 0.12, 0.88), Color("2a6bff"), 2, 14))
	t.set_stylebox("panel", "Panel", box(Color(0.02, 0.04, 0.12, 0.88), Color("2a6bff"), 2, 14))
	return t


static func label(text: String, size: int = 22, col: Color = Color.WHITE) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	return l


static func menu_button(text: String, min_size: Vector2 = Vector2(320, 52)) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = min_size
	b.mouse_entered.connect(func() -> void: if b.is_inside_tree() and not b.disabled: b.grab_focus())
	b.focus_entered.connect(func() -> void:
		var tw := b.create_tween()
		b.pivot_offset = b.size * 0.5
		tw.tween_property(b, "scale", Vector2(1.06, 1.06), 0.08)
	)
	b.focus_exited.connect(func() -> void:
		var tw2 := b.create_tween()
		tw2.tween_property(b, "scale", Vector2.ONE, 0.08)
	)
	b.pressed.connect(func() -> void: AudioManager.click())
	return b

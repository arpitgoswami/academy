extends SceneTree
var cur: Node
var n := 0
var SM: Node
func _initialize() -> void:
	SM = root.get_node("SaveManager")
	SM.save_path = "user://persist.json"
	DirAccess.remove_absolute("user://persist.json")
	SM.load_data()
	SM.coins = 900; SM.save_data()
	print("buy 3:", SM.try_buy_skin(3, 250), " buy 3 again:", SM.try_buy_skin(3, 250), " coins=", SM.coins)
	SM.select_skin(3)
	SM.submit_run(777, 40, 1177)
	SM.set_setting("music", 0.3); SM.set_setting("shake", false); SM.set_setting("quality", 1)
	SM.load_data()   # simulate restart
	print("reload: coins=", SM.coins, " owned=", SM.owned_skins, " sel=", SM.selected_skin, " best=", SM.best_distance, " music=", SM.settings["music"], " shake=", SM.settings["shake"], " q=", SM.settings["quality"])
	var f := FileAccess.open("user://persist.json", FileAccess.WRITE); f.store_string("{garbage"); f.close()
	SM.load_data(); print("corrupt ok coins=", SM.coins, " sel=", SM.selected_skin)
	f = FileAccess.open("user://persist.json", FileAccess.WRITE); f.store_string('{"coins":"x","owned_skins":[99,2],"selected_skin":5,"highscores":[1,{"score":3}],"settings":{"master":"loud","quality":9}}'); f.close()
	SM.load_data(); print("weird ok coins=", SM.coins, " owned=", SM.owned_skins, " sel=", SM.selected_skin, " scores=", SM.highscores.size(), " master=", SM.settings["master"], " q=", SM.settings["quality"])
	cur = load("res://scenes/game.tscn").instantiate(); root.add_child(cur)
func _process(_d: float) -> bool:
	n += 1
	if n == 100: 
		var d0: float = cur.distance
		cur._pause(); print("paused=", paused)
	if n == 160:
		print("distance unchanged during pause: ", cur.distance, " timers frozen")
		cur._on_resume(); print("paused=", paused)
	if n == 220: print("running dist=", int(cur.distance)); quit(0)
	return false

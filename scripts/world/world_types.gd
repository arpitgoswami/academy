extends RefCounted
## Small typed data holders shared by the world scripts.

class Obstacle:
	var type: String = ""
	var node: Node3D = null
	var x: float = 0.0
	var base_x: float = 0.0
	var z: float = 0.0          # local to segment
	var hx: float = 0.9
	var hz: float = 0.4
	var y0: float = 0.0
	var y1: float = 1.0
	var active: bool = true
	var moving: bool = false
	var gate: bool = false
	var on: bool = true         # electric gate state
	var phase: float = 0.0
	var beam: Node3D = null

class Pickup:
	var node: Node3D = null
	var kind: String = "coin"   # "coin" or "power"
	var id: String = ""
	var x: float = 0.0
	var y: float = 0.0
	var z: float = 0.0
	var collected: bool = false

class Gap:
	var z0: float = 0.0   # near edge (local z, larger)
	var z1: float = 0.0   # far edge (local z, smaller)

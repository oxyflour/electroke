var PT = { }

PT.hypot = function(dx, dy) {
	return Math.sqrt(dx * dx + dy * dy)
}

PT.middle = function(p1, p2) {
	return { x:(p1.x + p2.x) / 2, y:(p1.y + p2.y) / 2 }
}

PT.diff = function(p1, p2) {
	return { x:p1.x - p2.x, y:p1.y - p2.y }
}

function shouldReduce(pts) {
	var begin = pts[0],
		end = pts[pts.length - 1],
		middle = PT.middle(begin, end),
		diff = PT.diff(end, begin),
		length = PT.hypot(diff.x, diff.y),
		maxDistToLine = length * 0.15,
		maxDistFromCenter = length * 0.55
	return pts.length > 2 && pts.slice(1, -1).every(pt => {
		var dt = PT.diff(pt, begin),
			distToLine = Math.abs(diff.y * dt.x - diff.x * dt.y) / length,
			distToCenter = PT.hypot(middle.x - pt.x, middle.y - pt.y)
		return distToLine < maxDistToLine && distToCenter < maxDistFromCenter
	})
}

function reduceLast(pts, n) {
	var arr = pts.slice(-n),
		begin = arr[0],
		end = arr[arr.length - 1],
		middle = PT.middle(begin, end)
	return shouldReduce(arr) ?
		pts.slice(0, -n).concat(begin, middle, end) :
		pts
}

function GestureParser() {
	this.pts = [ ]
}

GestureParser.prototype.add = function(x, y) {
	var pts = this.pts,
		last = pts[pts.length - 1] || { x:-1, y:-1 }
	if (PT.hypot(last.x - x, last.y - y) > 5)
		this.pts.push({ x, y })
	if (this.pts.length >= 8)
		this.pts = reduceLast(this.pts, 8)
}

GestureParser.prototype.get = function() {
	var pts = this.pts
	for (var n = pts.length - 1; n >= 3; n --)
		pts = reduceLast(pts, n)
	return pts
}

GestureParser.prototype.toString = function() {
	var pts = this.get(),
		k = 2.5
	return pts.slice(1).reduce((str, _, i) => {
		var begin = pts[i], end = pts[i + 1],
			slope = (end.y - begin.y) / (end.x - begin.x),
			current = ''
		if (slope > k || slope < -k)
			current = end.y < begin.y ? '↑' : '↓'
		else if (slope < 1/k && slope > -1/k)
			current = end.x < begin.x ? '←' : '→'
		else if (end.y < begin.y)
			current = end.x < begin.x ? '↖' : '↗'
		else
			current = end.x < begin.x ? '↙' : '↘'
		return current != str.substr(-1) ? str + current : str
	}, '')
}

module.exports = GestureParser
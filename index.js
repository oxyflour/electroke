var hook = require('./bin/hook'),
	helper = require('./bin/helper'),
	gui = require('./src/gui'),
	config = require('./src/config'),
	GestureParser = require('./src/gesture')
	executeAction = require('./src/action')

var gesture,
	startPosition,
	startWindow

hook.on('mousedown', function(x, y) {
	gesture = new GestureParser()
	gesture.add(x, y)

	startPosition = { x, y }
	startWindow = helper.queryWindowAt(x, y)

	gui.sendMsg('hook-mousedown', x, y, startWindow)
})

hook.on('mouseup', function(x, y) {
	var pts = [{ x, y }],
		str = '.'

	if (startPosition.hasMoved) {
		pts = gesture.get()
		str = gesture.toString()
		var cls = startWindow.windowClass,
			exe = startWindow.exeFileName,
			actions = config.actions || { }
		executeAction(
			actions['cls:' + cls] ||
			actions['exe:' + exe] ||
			actions['default'] || { }, str, pts, actions)
	}
	else {
		setTimeout(() => helper.simulateMouseKey('RIGHT', true),  10)
		setTimeout(() => helper.simulateMouseKey('RIGHT', false), 20)
	}

	console.log('[i] performed gesture "' + str + '"')
	gui.sendMsg('hook-mouseup', pts, str)
})

hook.on('mousemove', function(x, y) {
	gesture.add(x, y)

	var minTriggerDistance = config.minTriggerDistance || 2
	if (Math.abs(x - startPosition.x) > minTriggerDistance ||
		Math.abs(y - startPosition.y) > minTriggerDistance)
		startPosition.hasMoved = true

	gui.sendMsg('hook-mousemove', x, y)
})

const hook = require('./build/hook'),
	helper = require('./build/helper'),
	GestureParser = require('./src/gesture')
	executeAction = require('./src/action')

var config = { }
try {
	config = require(__dirname + '/config.json')
}
catch (e) {
	console.log('[x] load ' + __dirname + '/config.json failed')
}

var gui = process.versions['electron'] ? require('./src/gui') : {
	sendMsg() { }
}

var gesture,
	startPosition,
	startWindow

;(config.disabled || [ ]).forEach(prog => hook.disable(prog))

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
			actions['default'] || { }, str, actions)
	}
	else {
		var MOUSE_BUTTON_RIGHT = 1
		setTimeout(() => helper.simulateMouse(x, y, MOUSE_BUTTON_RIGHT, true),  10)
		setTimeout(() => helper.simulateMouse(x, y, MOUSE_BUTTON_RIGHT, false), 20)
	}

	gui.sendMsg('hook-mouseup', pts, str)
	console.log('[i] ' + str)
})

hook.on('mousemove', function(x, y) {
	gesture.add(x, y)

	var minTriggerDistance = config.minTriggerDistance || 2
	if (Math.abs(x - startPosition.x) > minTriggerDistance ||
		Math.abs(y - startPosition.y) > minTriggerDistance)
		startPosition.hasMoved = true

	gui.sendMsg('hook-mousemove', x, y)
})

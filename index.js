const hook = require('./build/Release/hook'),
	helper = require('./build/Release/helper'),
	GestureParser = require('./src/gesture')
	executeAction = require('./src/action')

const MIN_MOVE_DIST = 2,
	MOUSE_BUTTON_LEFT = 0,
	MOUSE_BUTTON_RIGHT = 1

var gui = process.versions['electron'] ? require('./src/gui') : {
	sendMsg() { }
}

var config = { }
try {
	config = require(__dirname + '/config.json')
}
catch (e) {
	console.log('[x] load ' + __dirname + '/config.json failed')
}
var disabled = config.disabled || [ ]
disabled.forEach(prog => hook.disable(prog))

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
			actions['default'] || { }, str, actions)
	}
	else {
		setTimeout(() => helper.simulateMouse(x, y, MOUSE_BUTTON_RIGHT, true),  10)
		setTimeout(() => helper.simulateMouse(x, y, MOUSE_BUTTON_RIGHT, false), 20)
	}

	gui.sendMsg('hook-mouseup', pts, str)
	console.log('[i] ' + str)
})

hook.on('mousemove', function(x, y) {
	gesture.add(x, y)

	if (Math.abs(x - startPosition.x) > MIN_MOVE_DIST ||
		Math.abs(y - startPosition.y) > MIN_MOVE_DIST)
		startPosition.hasMoved = true

	gui.sendMsg('hook-mousemove', x, y)
})

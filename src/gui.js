const app = require('app'),
	BrowserWindow = require('browser-window'),
	Menu = require('menu'),
	Tray = require('tray')

var mainWindow = null,
	sysTray = null

function createWindow() {
	var window = new BrowserWindow({
		width: 640,
		height: 480,
		minimizable: false,
		icon: __dirname + '/../res/icon.png',
	})
	window.on('closed', function() {
		window.closed = true
	})
	window.setMenu(null)
	window.loadURL('file://' + __dirname + '/../res/index.html')
	return window
}

app.on('window-all-closed', function() {
	// keep it running in the tray 
})

app.on('ready', function() {
	sysTray = new Tray(__dirname + '/../res/icon.png')
	sysTray.setToolTip('click to show')
	sysTray.setContextMenu(Menu.buildFromTemplate([
		{
			label: 'show',
			click(e) {
				if (!mainWindow || mainWindow.closed)
					mainWindow = createWindow()
			},
		},
		{
			label: 'exit',
			click(e) {
				app.quit()
			},
		},
	]))
	sysTray.on('click', function() {
		if (!mainWindow || mainWindow.closed)
			mainWindow = createWindow()
	})
})

module.exports = {
	sendMsg: function() {
		var web = mainWindow && !mainWindow.closed && mainWindow.webContents
		web && web.send.apply(web, arguments)
	},
}
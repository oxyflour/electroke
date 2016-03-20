const app = require('app'),
	BrowserWindow = require('browser-window'),
	Menu = require('menu'),
	Tray = require('tray')

var mainWindow = null,
	sysTray = null

app.on('ready', function() {
	mainWindow = new BrowserWindow({
		width: 640,
		height: 480,
		icon: __dirname + '/../res/icon.png',
	})
	mainWindow.on('minimize', function() {
		mainWindow.setSkipTaskbar(true)
	})
	mainWindow.on('restore', function() {
		mainWindow.setSkipTaskbar(false)
	})
	mainWindow.on('closed', function() {
		// do not use app.on('all-window-close')
		app.quit()
	})
	mainWindow.setMenu(null)
	mainWindow.loadURL('file://' + __dirname + '/../res/index.html')

	sysTray = new Tray(__dirname + '/../res/icon.png')
	sysTray.setToolTip('click to restore main window')
	sysTray.setContextMenu(Menu.buildFromTemplate([
		{
			label: 'restore',
			click(e) { mainWindow.restore() },
		},
		{
			label: 'exit',
			click(e) { app.quit() },
		},
	]))
	sysTray.on('click', function() {
		mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize()
	})
})

module.exports = {
	getWindow: () => mainWindow,
	getTray: () => sysTray,
	sendMsg: function() {
		var web = mainWindow && mainWindow.webContents
		web && web.send.apply(web, arguments)
	},
}
const { app, BrowserWindow, Menu, Tray } = require('electron'),
	hook = require('../bin/hook'),
	config = require('./config')

var mainWindow = null,
	sysTray = null

function createWindow() {
	var window = new BrowserWindow({
		width: 480,
		height: 360,
		title: 'Electroke',
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
	var menuItems = [
		{
			label: 'enabled',
			type: 'checkbox',
			checked: true,
			click(e) {
				var item = menuItems[0]
				item.checked = !item.checked
				item.checked ? hook.enable('*') : hook.disable('*')
				item.type = item.checked ? 'checkbox' : 'normal'
				item.label = item.checked ? 'enabled' : 'disabled'
				sysTray.setContextMenu(Menu.buildFromTemplate(menuItems))
			},
		},
		{
			label: 'reload',
			click(e) {
				config.reload()
			},
		},
		{
			label: 'show',
			click(e) {
				if (!mainWindow || mainWindow.closed)
					mainWindow = createWindow()
				else
					mainWindow.show()
			},
		},
		{
			label: 'exit',
			click(e) {
				app.quit()
			},
		},
	]
	sysTray.setContextMenu(Menu.buildFromTemplate(menuItems))
	sysTray.setToolTip('click to show')
	sysTray.on('click', function() {
		if (!mainWindow || mainWindow.closed)
			mainWindow = createWindow()
		else
			mainWindow.show()
	})
})

module.exports = {
	sendMsg: function() {
		var web = mainWindow && !mainWindow.closed && mainWindow.webContents
		web && web.send.apply(web, arguments)
	},
}
const fs = require('fs'),
	hook = require('../bin/hook')

function load() {
	var configPath = process.env.USERPROFILE + '\\elecnez-config.json'
		config = { }
	try {
		config = require(configPath)
		console.log('[i] load "' + configPath + '" ok')
	}
	catch (e) {
		console.log('[x] load "' + configPath + '" failed')
		var defConfigPath = __dirname + '/../res/config.json',
			jsonText = fs.readFileSync(defConfigPath)
		config = JSON.parse(jsonText)
		try {
			fs.writeFileSync(configPath, jsonText)
			console.log('[i] write "' + configPath + '" with default config ok')
		}
		catch (e) {
			console.log('[x] write "' + configPath + '" failed')
		}
	}
	return config
}

var activeConfig = { }

;(function reload() {
	;(activeConfig.disabled || [ ]).forEach(prog => hook.enable(prog))
	for (var k in activeConfig) delete activeConfig[k]

	var newConfig = load()
	for (var k in newConfig) activeConfig[k] = newConfig[k]

	;(activeConfig.disabled || [ ]).forEach(prog => hook.disable(prog))
	activeConfig.reload = reload
})()

module.exports = activeConfig

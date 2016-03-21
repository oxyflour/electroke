var helper = require('../build/helper')

const env = {
	extend(obj) {
		return [].slice.call(arguments, 1).reduce((r, c) => {
			for (var k in c)
				r[k] = c[k]
			return r
		}, obj || { })
	},
	shortcut(keys) {
		keys = keys.toUpperCase().replace(/\s/g, '').split('+')
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, true)),  10)
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, false)), 20)
	},
}

function apply(func, args) {
	if (typeof(func) === 'function')
		return func.apply(null, args)
	else
		throw func + ' is not an applicable function'
}

function eval(node, env) {
	if (Array.isArray(node)) {
		var vals = node.map(n => eval(n, env))
		return apply(vals[0], vals.slice(1))
	}
	else if (typeof(node) === 'string' && env[node])
		return env[node]
	else
		return node
}

module.exports = function(actions, str, all) {
	// you can write sth like ['extend', 'cls:xxx', { ...actions }]
	if (Array.isArray(actions))
		actions = eval(actions, env.extend({ }, env, all)) || { }
	if (actions[str])
		return eval(actions[str], env)
}
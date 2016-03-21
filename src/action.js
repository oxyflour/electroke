var helper = require('../bin/helper')

const env = {
	extend(obj) {
		return [].slice.call(arguments, 1).reduce((r, c) => {
			for (var k in c)
				r[k] = c[k]
			return r
		}, obj || { })
	},
	shortcut(keys) {
		keys = keys ? keys.toUpperCase().replace(/\s/g, '').split('+') : []
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, true)),  10)
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, false)), 20)
	},
	click(button, keys) {
		var pt = this.pts[0]
		button = { LEFT:0, RIGHT:1, MIDDLE:2 }[button.toUpperCase()]
		keys = keys ? keys.toUpperCase().replace(/\s/g, '').split('+') : []
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, true)),  0)
		setTimeout(() => helper.simulateMouseMove(pt.x, pt.y),            0)
		setTimeout(() => helper.simulateMouseKey(button, true),           10)
		setTimeout(() => helper.simulateMouseKey(button, false),          20)
		setTimeout(() => keys.forEach(k => helper.simulateKey(k, false)), 30)
	},
}

function apply(ctx, func, args) {
	if (typeof(func) === 'function')
		return func.apply(ctx, args)
	else
		throw func + ' is not an applicable function'
}

function eval(ctx, node, env) {
	if (Array.isArray(node)) {
		var vals = node.map(n => eval(ctx, n, env))
		return apply(ctx, vals[0], vals.slice(1))
	}
	else if (typeof(node) === 'string' && env[node])
		return env[node]
	else
		return node
}

module.exports = function(actions, str, pts, all) {
	var ctx = { str, pts }
	// you can write sth like ['extend', 'cls:xxx', { ...actions }]
	if (Array.isArray(actions))
		actions = eval(ctx, actions, env.extend({ }, env, all)) || { }
	if (actions[str])
		return eval(ctx, actions[str], env, ctx)
}
class Hub {
	constructor() {
		this._eventSet = {};
		this._objectSet = {};
	}

	listener(event, callback) {
		let src = this._eventSet;
		if (src.hasOwnProperty(event)) {
			src[event].push(callback);
		} else {
			src[event] = [callback];
		}
		return this;
	}

	noify(event, args) {
		let src = this._eventSet;
		if (src.hasOwnProperty(event)) {
			for (let i in src[event]) {
				if (src[event][i] == null) delete src[event][i];
				if (typeof src[event][i] != "function") delete src[event][i];
				src[event][i].call(src[event][i], args);
			}
		}
	}

	set(name, value) {
		this._objectSet[name] = value;
	}

	get(name, defValue = null) {
		return this._objectSet[name] ? this._objectSet[name] : defValue;
	}

}

const onlyHub = new Hub();

exports.HubClass = Hub;
exports.Hub = onlyHub;
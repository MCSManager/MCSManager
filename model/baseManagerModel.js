class ModelManager {
    constructor() {
        this._mineself = {};
        this.name = null;
        this.len = 0;
    }

    add(key, value) {
        if (key && value) {
            this._mineself[key] = value;
            this.len++;
        }
    }
    del(key) {
        if (key) {
            if (!this._mineself.hasOwnProperty(key)) return;
            this._mineself[key] = undefined;
            delete this._mineself[key];
            this.len--;
        }
    }

    get(key) {
        if (this._mineself.hasOwnProperty(key) && this._mineself[key]) {
            return this._mineself[key];
        }
        return null;
    }

    clear() {
        this._mineself = {};
    }

    returnObj() {
        return this._mineself
    }

}

module.exports.ModelManager = ModelManager;
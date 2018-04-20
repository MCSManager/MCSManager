class ModelManager {
    constructor() {
        this._mineself = {};
        this.name = null;
    }

    add(key, value) {
        if (key && value)
            this._mineself[username] = userdata;
        else
            throw new Error("key or value is Null");
    }
    del(key) {
        if (key) {
            this._mineself[key] = undefined;
            delete this._mineself[key];
        } else
            throw new Error("key is Null");
    }

    get(key) {
        if (this._mineself.hasOwnProperty(key) && this._mineself[key]) {
            return this._mineself[key];
        }
        return null;
    }

}

module.exports.ModelManager = ModelManager;
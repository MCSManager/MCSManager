//表实体
class Table {
    constructor(tableName) {
        this.tableName = tableName;
        this._objs = {};
    }

    setItem(k, v = null) {
        this._objs[k] = v;
    }

    addItem(k, v = null) {
        if (this._objs[k])
            throw new Error("ADD_ITEM_ERROR: This is not null!");
        else
            this._objs[k] = v;
    }

    delItem(k, v = null) {
        delete this._objs[k];
    }

    toString() {
        return JSON.stringify(this._objs);
    }
}

//权限表实体
class PermissionTable extends Table {
    constructor(tableName) {
        super(tableName);
    }
}


module.exports = {
    PermissionTable,
    Table
}
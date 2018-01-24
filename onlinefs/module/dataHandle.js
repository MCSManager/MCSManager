const pathm = require("path");

exports.parseHandle = (form, type) => {
    if (form['request'] != undefined) {
        let result = "";
        try {
            if (type == "string")
                return form.request;
            result = JSON.parse(form.request);
            if (typeof result == 'number') return "" + result; //不能直接int
            return result;
        } catch (err) {
            result = form.request;
            if (typeof result == 'number') return "" + result; //不能直接int
            return result;
        }
    }
    return "";
};


exports.sendHandle = (req, res, obj, key = "response") => {
    let sendObj = {};
    sendObj[key] = obj;
    res.send(sendObj);
};


exports.filesToPaths = (stack, cwd) => {
    let names = [];
    let baseP = cwd;
    for (const v of stack) {
        names.push(pathm.join(baseP, v.name));
    }
    return names;
};
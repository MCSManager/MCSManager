//工具箱

const os = require("os");
const childProcess = require("child_process");

module.exports.startProcess = (command, parList, ProcessConfigs, callback) => {
	let process = childProcess.spawn(command, parList, ProcessConfigs);
	process.on("exit", (code) => {
		callback("exit", code);
	});
};

module.exports.getMineTime = () => {
	var date = new Date();
	return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
};

module.exports.between = (value, MIN, MAX) => {
	if (typeof value === "number") {
		return value >= MIN && value <= MAX;
	}
	if (typeof value === "string" || value instanceof Array) {
		return value.length >= MIN && value.length <= MAX;
	}
};

const crypto = require("crypto");
module.exports.md5 = () => {
	return crypto.createHash("md5").update(text).digest("hex");
};

module.exports.randomString = (len) => {
	len = len || 64;
	var $chars =
		"ABCDEFGHIJKLNMOPQRSTUVWXYZabcdefghijklnmopqrstuvwxyz1234567890_";
	var maxPos = $chars.length;
	var pwd = "";
	for (let i = 0; i < len; i++) {
		pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
	}
	return pwd;
};

const fs = require("fs");
const path = require("path");
module.exports.autoLoadModule = (filePath, routePath, callback) => {
	// filePath 是文件路径
	// minePath 是路由
	// let routeList = fs.readdirSync('./' + proPath);
	// 还是路径 Fix
	let rootDirForApp = path.dirname(path.dirname(__filename));
	// console.log(rootDirForApp);
	let routeList = fs.readdirSync(path.join(rootDirForApp, filePath));
	// console.log(routeList);
	for (let key in routeList) {
		let name = routeList[key].replace(".js", "");
		// 换一种脱去扩展名的处理方式
		// let name = routeList[key].split(".").slice(0, -1).join(".");
		// console.log(name);
		try {
			let modulePath = path.join(rootDirForApp, filePath, name);
			// console.log(modulePath);
			callback(modulePath, routePath);
		} catch (err) {
			MCSERVER.error("autoLoadModule load 过程出错", err);
			throw err;
		}
	}
};

module.exports.mCopyFileSync = (oldpath, newpath) => {
	let resetData = fs.readFileSync(oldpath, {
		encoding: "UTF-8",
	});
	fs.writeFileSync(newpath, resetData, {
		encoding: "UTF-8",
	});
	return true;
};

module.exports.getSystemCodeing = () => {
	let auto_console_coding;
	if (os.platform() == "win32") auto_console_coding = "GBK";
	else auto_console_coding = "UTF-8";
	return auto_console_coding;
};

module.exports.getFullTime = () => {
	var date = new Date();
	return (
		date.getFullYear() +
		"/" +
		date.getMonth() +
		"/" +
		date.getDay() +
		" " +
		date.getHours() +
		":" +
		date.getMinutes() +
		":" +
		date.getSeconds()
	);
};

const REPALCE_STR = "__MCSMANAGER_REPLACE_STR__";
module.exports.CharReplaceTemp = (text = "", replaceStr = "") => {
	let re = new RegExp(replaceStr, "gim");
	text = text.replace(re, REPALCE_STR);
	return text;
};
module.exports.TempReplaceChar = (text = "", replaceStr = "") => {
	let re = new RegExp(REPALCE_STR, "gim");
	text = text.replace(re, replaceStr);
	return text;
};

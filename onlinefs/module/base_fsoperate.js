const fs = require("fs-extra");
const pathm = require("path");
// const os = require("os");

const DEBUG = true;

//基本的操作权限
class BaseFileOperate {
	constructor(rootPath) {
		// console.log("传入的root路径:", rootPath);
		if (pathm.isAbsolute(rootPath)) {
			this.rootPath = pathm.normalize(rootPath);
		} else throw Error("RootPath 必须是一个绝对路径，否则将无法定位");
		// this.rootPath = path_moduel.normalize(path_moduel.resolve(rootPath));
		this.fs = fs;
	}

	root(rootPath) {
		if (rootPath) this.rootPath = pathm.normalize(rootPath);
		else return this.rootPath;
	}

	normalizePath(path) {
		//let normalizedPath = path_moduel.normalize(path);
		//let absPath = path_moduel.resolve(normalizedPath);
		if (pathm.isAbsolute(path)) {
			return path;
		}

		let absPath = pathm.normalize(pathm.join(this.rootPath, path));
		// console.log("普通路径:", path);
		// console.log("绝对路径:", absPath);
		// console.log("root路径:", this.rootPath);
		return absPath;
	}

	isPathAccess(path) {
		let testPath = this.normalizePath(path);
		return testPath.startsWith(this.rootPath);
	}

	pathAccessCheck(path, tcallback = () => null, fcallback = () => null) {
		let result_path = null;
		let result_paths = [];
		if (!(path instanceof Array)) path = [path];

		for (let k in path) {
			result_path = this.normalizePath(path[k]);
			if (pathm.isAbsolute(path[k])) result_path = path[k]; //是绝对路径就无需规范
			if (!this.isPathAccess(path[k])) return fcallback(result_path);
			result_paths.push(result_path);
		}
		if (DEBUG) {
			if (result_paths.length > 1) return tcallback(result_paths);
			return tcallback(result_path);
		} else {
			try {
				if (result_paths.length > 1) return tcallback(result_paths);
				return tcallback(result_path);
			} catch (err) {
				return fcallback(result_path);
			}
		}
	}
}

exports.BaseFileOperate = BaseFileOperate;

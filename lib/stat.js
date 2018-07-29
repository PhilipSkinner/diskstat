var stat = function(child_process, path) {
	this.child_process 	= child_process;
	this.path 			= path;
};

stat.prototype._ensureAbsPath = function(path) {
	if (path === '') {
		return '';
	}

	if (this.path.isAbsolute(path)) {
		return path;
	}

	return this.path.join(process.cwd(), path);
};

stat.prototype._parseResponse = function(response) {
	const lines = response.split('\n').slice(1);
	const ret = {};

	lines.forEach((line) => {
		const parts = line.replace(/  /g, ' ').trim().split(' ').reduce((sum, a) => {
			if (a !== '') {
				sum.push(a);
			}
			return sum;
		}, []);

		if (parts.length >= 4) {
			ret[parts[0]] = {
				total 	: parseInt(parts[1]),
				used 	: parseInt(parts[2]),
				free 	: parseInt(parts[3])
			};	
		}		
	});

	return ret;
};

stat.prototype._fetchSpace = function(path) {
	return new Promise((resolve, reject) => {
		this.child_process.exec('df ' + this._ensureAbsPath(path), (err, stdout) => {
			if (err) {
				return reject(err);
			}			

			return resolve(this._parseResponse(stdout));
		});
	});
};

stat.prototype._fetchInodes = function(path) {
	return new Promise((resolve, reject) => {
		this.child_process.exec('df -i ' + this._ensureAbsPath(path), (err, stdout) => {
			if (err) {
				return reject(err);
			}

			return resolve(this._parseResponse(stdout));
		});
	});
};

stat.prototype.all = function(cb) {
	return this.check('', cb);
};

stat.prototype.check = function(path, cb) {	
	return new Promise((resolve, reject) => {
		var store = {};

		this._fetchSpace(path).then((space) => {
			store = space;
			return this._fetchInodes(path);
		}).then((inodes) => {				
			var count = 0;
			var singleDrive = null;			
			Object.keys(inodes).forEach((drive) => {
				if (typeof(store[drive]) !== 'undefined') {
					store[drive].inodes = inodes[drive];
					count++;
					singleDrive = drive;
				}
			});

			if (cb && typeof(cb) === 'function') {
				cb(null, count !== 1 ? store : store[singleDrive]);
			}
			return resolve(count !== 1 ? store : store[singleDrive]);
		}).catch(cb);
	});	
};

module.exports = function(child_process, path) {
	if (!child_process) {
		child_process = require('child_process');
	}

	if (!path) {
		path = require('path');
	}

	return new stat(child_process, path);
}
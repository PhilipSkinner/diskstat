const 	stat 	= require('./stat'),
		sinon 	= require('sinon');

const child_process = {
	spawn 	: () => {},
	stdout 	: {
		on 	: () => {}
	},
	stderr 	: {
		on 	: () => {}
	},
	on 		: () => {

	}
};

const path = {
	join 		: () => {},
	isAbsolute 	: () => {}
};

const constructorTest = (done) => {
	const instance = stat();

	expect(instance.child_process).not.toBe(undefined);
	expect(instance.child_process).not.toBe(null);
	expect(instance.path).not.toBe(undefined);
	expect(instance.path).not.toBe(null);

	done();
};

const allTest = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('spawn').once().withArgs('df', ['']).returns(child_process);
	processMock.expects('spawn').once().withArgs('df', ['-i', '']).returns(child_process);

	const stdoutMock = sinon.mock(child_process.stdout);
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'ignore\ndrive1 50 100 150\ndrive2 100 150 200\nignore\ndrive3 999 999 999\n');
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'woot\ndrive1 20 30 40\ndrive2 50 60 70\ndrive5 80 90 10\n');

	processMock.expects('on').twice().withArgs('close').callsArgWith(1, 0);

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();

	const instance = stat(child_process, path);
	instance.all().then((results) => {
		expect(results).toEqual({
			drive1 : {
				total 	: 50,
				used 	: 100,
				free 	: 150,
				inodes 	: {
					total 	: 20,
					used 	: 30,
					free 	: 40
				}
			},
			drive2 : {
				total : 100,
				used : 150,
				free : 200,
				inodes : {
					total 	: 50,
					used 	: 60,
					free 	: 70
				}
			},
			drive3 : {
				total 	: 999,
				used 	: 999,
				free 	: 999
			}
		});

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();
		stdoutMock.verify();
		stdoutMock.restore();

		done();
	});
};

const absTest = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('spawn').once().withArgs('df', ['/hello/there']).returns(child_process);
	processMock.expects('spawn').once().withArgs('df', ['-i', '/hello/there']).returns(child_process);

	const stdoutMock = sinon.mock(child_process.stdout);
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'ignore\nme\n');
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'woot\naswell');

	processMock.expects('on').twice().withArgs('close').callsArgWith(1, 0);

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();
	pathMock.expects('isAbsolute').twice().withArgs('/hello/there').returns(true);

	const instance = stat(child_process, path);
	instance.check('/hello/there', (err, results) => {
		expect(err).toBe(null);
		expect(results).toEqual({});

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();
		stdoutMock.verify();
		stdoutMock.restore();

		done();
	});
};

const relativeTest = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('spawn').once().withArgs('df', ['/dir/hello/there']).returns(child_process);
	processMock.expects('spawn').once().withArgs('df', ['-i', '/dir/hello/there']).returns(child_process);

	const stdoutMock = sinon.mock(child_process.stdout);
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'ignore\ndrive1 50 100 150\n');
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'ignore\ndrive1 50 100 150\n');

	processMock.expects('on').twice().withArgs('close').callsArgWith(1, 0);

	const pathMock = sinon.mock(path);
	pathMock.expects('join').twice().withArgs(process.cwd(), './hello/there').returns('/dir/hello/there');
	pathMock.expects('isAbsolute').twice().withArgs('./hello/there').returns(false);

	const instance = stat(child_process, path);
	instance.check('./hello/there', (err, results) => {
		expect(err).toBe(null);
		expect(results).toEqual({
			total : 50,
			used : 100,
			free : 150,
			inodes : {
				total : 50,
				used : 100,
				free : 150
			}
		});

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();
		stdoutMock.verify();
		stdoutMock.restore();

		done();
	});
};

const spaceError = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('spawn').once().withArgs('df', ['/hello/there']).returns(child_process);

	const stderrMock = sinon.mock(child_process.stderr);
	stderrMock.expects('on').once().withArgs('data').callsArgWith(1, 'Not today');

	processMock.expects('on').once().withArgs('close').callsArgWith(1, 100);

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();
	pathMock.expects('isAbsolute').once().withArgs('/hello/there').returns(true);

	const instance = stat(child_process, path);
	instance.check('/hello/there', (err) => {
		expect(err).toEqual(new Error('Not today'));

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();
		stderrMock.verify();
		stderrMock.restore();

		done();
	});
};

const inodeError = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('spawn').once().withArgs('df', ['/hello/there']).returns(child_process);
	processMock.expects('spawn').once().withArgs('df', ['-i', '/hello/there']).returns(child_process);

	const stdoutMock = sinon.mock(child_process.stdout);
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, 'ignore\ndrive1 50 100 150\n');
	stdoutMock.expects('on').once().withArgs('data').callsArgWith(1, '');

	const stderrMock = sinon.mock(child_process.stderr);
	stderrMock.expects('on').once().withArgs('data').callsArgWith(1, '');
	stderrMock.expects('on').once().withArgs('data').callsArgWith(1, 'Not today');

	processMock.expects('on').once().withArgs('close').callsArgWith(1, 0);
	processMock.expects('on').once().withArgs('close').callsArgWith(1, 100);

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();
	pathMock.expects('isAbsolute').twice().withArgs('/hello/there').returns(true);

	const instance = stat(child_process, path);
	instance.check('/hello/there', (err) => {
		expect(err).toEqual(new Error('Not today'));

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();
		stdoutMock.verify();
		stdoutMock.restore();

		done();
	});
};

describe("A disk stat provider", () => {
	it("handles constructor defaults", constructorTest);

	describe("can check all disks", () => {
		it("correctly", allTest);
	});

	describe("can check a path", () => {
		it("handling absolutes", absTest);
		it("handling relative", relativeTest);
	});

	describe("handles errors", () => {
		it("fetching space", spaceError);
		it("fetching inodes", inodeError);
	});
});
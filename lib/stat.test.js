const 	stat 	= require('./stat'),
		sinon 	= require('sinon');

const child_process = {
	exec : () => {}
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
	processMock.expects('exec').once().withArgs('df ').callsArgWith(1, null, 'ignore\ndrive1 50 100 150\ndrive2 100 150 200\nignore\ndrive3 999 999 999\n');
	processMock.expects('exec').once().withArgs('df -i ').callsArgWith(1, null, 'woot\ndrive1 20 30 40\ndrive2 50 60 70\ndrive5 80 90 10\n');

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

		done();		
	});
};

const absTest = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('exec').once().withArgs('df /hello/there').callsArgWith(1, null, 'ignore\nme\n');
	processMock.expects('exec').once().withArgs('df -i /hello/there').callsArgWith(1, null, 'woot\naswell');

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

		done();		
	});
};

const relativeTest = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('exec').once().withArgs('df /dir/hello/there').callsArgWith(1, null, 'ignore\ndrive1 50 100 150\n');
	processMock.expects('exec').once().withArgs('df -i /dir/hello/there').callsArgWith(1, null, 'ignore\ndrive1 50 100 150\n');

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

		done();		
	});
};

const spaceError = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('exec').once().withArgs('df /hello/there').callsArgWith(1, 'Not today');	

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();
	pathMock.expects('isAbsolute').once().withArgs('/hello/there').returns(true);

	const instance = stat(child_process, path);
	instance.check('/hello/there', (err) => {
		expect(err).toEqual('Not today');		

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();

		done();	
	});
};

const inodeError = (done) => {
	const processMock = sinon.mock(child_process);
	processMock.expects('exec').once().withArgs('df /hello/there').callsArgWith(1, null, 'ignore\ndrive1 50 100 150\n');
	processMock.expects('exec').once().withArgs('df -i /hello/there').callsArgWith(1, 'Not today');	

	const pathMock = sinon.mock(path);
	pathMock.expects('join').never();
	pathMock.expects('isAbsolute').twice().withArgs('/hello/there').returns(true);

	const instance = stat(child_process, path);
	instance.check('/hello/there', (err) => {
		expect(err).toEqual('Not today');		

		processMock.verify();
		processMock.restore();
		pathMock.verify();
		pathMock.restore();

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
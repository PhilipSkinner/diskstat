const diskstats = require('./stat');

const test = (done) => {
	let instance = diskstats();

	instance.check('; touch HACKED', (err, results) => {}).catch((err) => {
		let str = err.toString();

		expect(str.indexOf('No such file or directory')).not.toEqual(-1);

		done();
	});
}

describe("A disk stat provider", () => {
	it("protects against attach 864354", test);
});
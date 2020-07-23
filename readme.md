diskstats
========

This library uses df to pull disk information such as free space & inode utilization on your system. This library only works on systems where df is installed and present within your path.

Installation
------------

Install with `npm`:

``` bash
$ npm install diskstats
```

Usage
-----

This module exposes two functions:

**all**

Takes no arguments, returns stats for all drives/partitions on the system. Can be used with a callback function or within a promise chain:

```
const diskstats = require('diskstats');

//callback
diskstats.all((err, results) => {
	console.log(results);
});

//promise
diskstats.all().then((results) => {
	console.log(results);
}).catch((err) => {
	console.log(err);
})
```

**check**

Takes a single argument, the path you would like to stat. This can be a relative path or an absolute path - relative paths will be relative to your process. Can be used with a callback function or within a promise chain:

```
const diskstats = require('diskstats');

//callback
diskstats.check('.', (err, results) => {
	console.log(results);
});

//promise
diskstats.check('.').then((results) => {
	console.log(results);
}).catch((err) => {
	console.log(err);
})
```

Contributors
------------

The following people have contributed to this library:

* Philip Skinner
* Alessio (d3lla) - https://hackerone.com/d3lla?type=user

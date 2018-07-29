diskstat
========

This library uses df to pull disk information such as free space & inode utilization on your system. This library only works on systems where df is installed and present within your path.

Installation
------------

Install with `npm`:

``` bash
$ npm install diskstat
```

Usage
-----

This module exposes two functions:

**all**

Takes no arguments, returns stats for all drives/partitions on the system. Can be used with a callback function or within a promise chain:

```
const diskstat = require('diskstat');

//callback
diskstat.all((err, results) => {
	console.log(results);
});

//promise
diskstat.all().then((results) => {
	console.log(results);
}).catch((err) => {
	console.log(err);
})
```

**check**

Takes a single argument, the path you would like to stat. This can be a relative path or an absolute path - relative paths will be relative to your process. Can be used with a callback function or within a promise chain:

```
const diskstat = require('diskstat');

//callback
diskstat.check('.', (err, results) => {
	console.log(results);
});

//promise
diskstat.check('.').then((results) => {
	console.log(results);
}).catch((err) => {
	console.log(err);
})
```
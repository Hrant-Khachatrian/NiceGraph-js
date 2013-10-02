NiceGraph.js
============

NiceGraph.js is a graph drawing library in JavaScript based on Simulated Annealing algorithm.

Basically, the algorithm takes a random drawing of a graph and tries to modify it in order to get a "better" drawing. It calculates the "energy" of each drawing and tries to choose the one with the lowest energy. Energy is increased because of five factors:

1. Too close vertices
2. Vertices too close to the borders of the canvas
3. Too long edges
4. Vertices too close to the edges
5. Crossed edges

Important files
---------------
1. **sajs.js** - Implementation of the Simulated Annealing method. May be used for any optimization problem.
2. **niceGraph.js** - Implementation of the graph drawing algorithm described in [Davidson, Harel, Drawing graphs nicely using simulated annealing, ACM Transactions on Graphics, 1996, pp. 301-331] available [here](http://www.wisdom.weizmann.ac.il/~dharel/SCANNED.PAPERS/DrawingGraphsNicely.pdf)
3. **playground.html** - UI to play with the algorithm settings

Sample Usage
------------

```javascript
var NG = NiceGraph({
	graph: {
		edges: {	// adjacency list
			1: [2],
			2: []
		},
		vertexCount: 2
	},
	bounds: {	// canvas size
		width: 800,
		height: 500
	},
	SAInitialTemperature: 100, // affects number of iterations
	SATemperatureDecreaseRate: 0.95,
	nodeDistanceFactor: 100,
	borderDistanceFactor: 20,
	edgeLengthFactor: 100,
	nodeEdgeDistanceFactor: 30,
	edgeCrossingsFactor: 0
});
NG.SAInit();
NG.SARun();
var vertices = NG.getPositions();
```

Sample output:
```
{
    "1": {
        "x": 263.77582507027535,
        "y": 303.58632941743184
    },
    "2": {
        "x": 170.52686833599822,
        "y": 319.76684884782725
    }
}
```

Known issues / future work
--------------------------
1. Performance is terrible. Most of the energy functions should be optimized.
2. Some visualization of the values of energy functions during the process is required to monitor and properly debug the algorithm.
3. Some energy functions may be modified to take into account the properties of the input graph, e.g. edge density.

License
-------
Scripts are licensed under the MIT license
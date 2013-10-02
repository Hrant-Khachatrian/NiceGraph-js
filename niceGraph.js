(function () {
	"use strict";
	window.NiceGraph = function (userConfig) {
		var _extend = function (a, b) {
			for (var key in b) {
				if (b.hasOwnProperty(key)) {
					a[key] = b[key];
				}
			}
			return a;
		};
		var _clone = function (obj) {
			if(obj == null || typeof(obj) != 'object')
				return obj;
			var temp = obj.constructor(); // changed
			for(var key in obj)
				temp[key] = _clone(obj[key]);
			return temp;
		};


		var defaultConfig = {
			graph: {
				vertexCount: 3,
				edges: {
					1: [2, 3],
					2: [1, 3],
					3: [1, 2]
				}
			},
			bounds: {
				width: 800,
				height: 500
			},
			SAInitialTemperature : 100,
			SATemperatureDecreaseRate : 0.95,
			nodeDistanceFactor : 100,
			borderDistanceFactor : 50,
			edgeLengthFactor : 50,
			nodeEdgeDistanceFactor : 100,
			edgeCrossingsFactor: 10000
		};

		var config = _extend(defaultConfig, userConfig);
		var _area = config.bounds.width * config.bounds.height;

		var _distance = function (positions, i, j) {
			return Math.sqrt(_distanceSquared(positions, i, j));
		};
		var _distanceSquared = function (positions, i, j) {
			return (positions[i].x - positions[j].x) * (positions[i].x - positions[j].x)
					+ (positions[i].y - positions[j].y) * (positions[i].y - positions[j].y);
		};
		var _segmentIntersection = function (positions, i1, j1, i2, j2) {
			// TODO: Should be called only for the changed vertex
			var x1 = positions[i1].x;
			var y1 = positions[i1].y;
			var x2 = positions[j1].x;
			var y2 = positions[j1].y;
			var x3 = positions[i2].x;
			var y3 = positions[i2].y;
			var x4 = positions[j2].x;
			var y4 = positions[j2].y;
			var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
			var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
			if (isNaN(x)||isNaN(y)) {
				return false;
			} else {
				if (x1>=x2) {
					if (!(x2<=x&&x<=x1)) {return false;}
				} else {
					if (!(x1<=x&&x<=x2)) {return false;}
				}
				if (y1>=y2) {
					if (!(y2<=y&&y<=y1)) {return false;}
				} else {
					if (!(y1<=y&&y<=y2)) {return false;}
				}
				if (x3>=x4) {
					if (!(x4<=x&&x<=x3)) {return false;}
				} else {
					if (!(x3<=x&&x<=x4)) {return false;}
				}
				if (y3>=y4) {
					if (!(y4<=y&&y<=y3)) {return false;}
				} else {
					if (!(y3<=y&&y<=y4)) {return false;}
				}
			}
			return true;
		};
		var _distancePointToSegment = function (positions, p, v, w) {
			var l2 = _distanceSquared(positions, v, w);
			if (l2 == 0) return _distanceSquared(positions, p, v);
			var _p = positions[p];
			var _v = positions[v];
			var _w = positions[w];
			var t = ((_p.x - _v.x) * (_w.x - _v.x) + (_p.y - _v.y) * (_w.y - _v.y)) / l2;
			if (t < 0) return _distanceSquared(positions, p, v);
			if (t > 1) return _distanceSquared(positions, p, w);

			var t = {
				x: _v.x + t * (_w.x - _v.x),
				y: _v.y + t * (_w.y - _v.y)
			};
			return (_p.x - t.x) * (_p.x - t.x) + (_p.y - t.y) * (_p.y - t.y);
		};

		var EnergyFunctions = {
			nodeDistance: function (positions) {
				var distance,
					energy = 0;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					for (var j = i + 1; j <= config.graph.vertexCount; j++) {
						distance = _distanceSquared(positions, i, j) / _area;
						energy += config.nodeDistanceFactor / distance;
					}
				}
				return energy;
			},
			borderDistance: function (positions) {
				var distance,
					energy = 0;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					distance = positions[i].x * positions[i].x;
					energy += config.borderDistanceFactor / (distance / _area);
					distance = positions[i].y * positions[i].y;
					energy += config.borderDistanceFactor / (distance / _area);
					distance = (config.bounds.width - positions[i].x) * (config.bounds.width - positions[i].x);
					energy += config.borderDistanceFactor / (distance / _area);
					distance = (config.bounds.height - positions[i].y) * (config.bounds.height - positions[i].y);
					energy += config.borderDistanceFactor / (distance / _area);
				}
				return energy;
			},
			edgeLength: function (positions) {
				if (!config.edgeLengthFactor) {
					return 0;
				}
				var energy = 0, distance, j;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					for (var jj = 0; jj < config.graph.edges[i].length; jj++) {
						j = config.graph.edges[i][jj];
						distance = _distance(positions, i, j);
						energy += config.edgeLengthFactor * distance;
					}
				}
				return energy;
			},
			nodeEdgeDistance: function (positions) {
				// TODO: implement caching
				if (!config.nodeEdgeDistanceFactor) {
					return 0;
				}
				var energy = 0, j, j2, t;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					for (var i2 = 1; i2 <= config.graph.vertexCount; i2++) {
						for (var jj2 = 0; jj2 < config.graph.edges[i2].length; jj2++) {
							j2 = config.graph.edges[i2][jj2];
							if (i != i2 && i != j2) {
								t = _distancePointToSegment(positions, i, i2, j2);
								energy += config.nodeEdgeDistanceFactor / (t / _area);
							}
						}
					}
				}
				return energy;
			},
			edgeCrossings: function (positions) {
				if (!config.edgeCrossingsFactor) {
					return 0;
				}
				var j, j2, bool;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					for (var jj = 0; jj < config.graph.edges[i].length; jj++) {
						j = config.graph.edges[i][jj];
						for (var i2 = 1; i2 <= config.graph.vertexCount; i2++) {
							if (i === i2 || j === i2) {
								continue;
							}
							for (var jj2 = 0; jj2 < config.graph.edges[i2].length; jj2++) {
								j2 = config.graph.edges[i2][jj2];
								if (i === j2 || j === j2) {
									continue;
								}
								if (i === _currentNode || j === _currentNode || i2 === _currentNode || j2 === _currentNode) {
									// only for the affected edges
									bool = _segmentIntersection(positions, i, j, i2, j2) ? 1 : 0;
									_crossingTemp.energy = _crossingTemp.energy - config.edgeCrossingsFactor * (_crossingTemp.data[i][j][i2][j2] - bool);
									_crossingTemp.data[i][j][i2][j2] = bool
								}
							}
						}
					}
				}
				return _crossingTemp.energy;
			}
		};

		var _state2, _currentNode;
		var _crossingTemp = {
			energy:0,
			data:[]
		};
		var _SAJSConfig = {
			initialTemperature: config.SAInitialTemperature,
			temperatureDecreaseRate: config.SATemperatureDecreaseRate,
			getInitialState: function () {
				var positions = {};
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					positions[i] = {
						x : Math.floor(Math.random() * config.bounds.width),
						y : Math.floor(Math.random() * config.bounds.height)
					}
				}
				_state2 = _clone(positions);

				//calculate initial crossings
				_crossingTemp.energy = 0;
				var j, j2, bool;
				for (var i = 1; i <= config.graph.vertexCount; i++) {
					_crossingTemp.data[i] = [];
					for (var jj = 0; jj < config.graph.edges[i].length; jj++) {
						j = config.graph.edges[i][jj];
						_crossingTemp.data[i][j] = [];
						for (var i2 = 1; i2 <= config.graph.vertexCount; i2++) {
							if (i === i2 || j === i2) {
								continue;
							}
							_crossingTemp.data[i][j][i2] = [];
							for (var jj2 = 0; jj2 < config.graph.edges[i2].length; jj2++) {
								j2 = config.graph.edges[i2][jj2];
								if (i === j2 || j === j2) {
									continue;
								}
								_crossingTemp.data[i][j][i2][j2] = 0;
								bool = _segmentIntersection(positions, i, j, i2, j2);
								if (bool) {
									_crossingTemp.data[i][j][i2][j2] = 1;
									_crossingTemp.energy += config.edgeCrossingsFactor;
								}
							}
						}
					}
				}
				return positions;
			},
			getNeighboringState : function (state, temperature) {
				// changing the coordinate of ONE vertex only
				_currentNode = Math.floor(Math.random() * config.graph.vertexCount) + 1;
				var	factor = Math.pow(temperature / config.SAInitialTemperature, 2) / 2,
					scaleX = config.bounds.width * factor,
					scaleY = config.bounds.height * factor;

				_state2[_currentNode].x += Math.random() * scaleX - (scaleX / 2);
				_state2[_currentNode].y += Math.random() * scaleY - (scaleY / 2);

				// clamp values to the bounds
				_state2[_currentNode].x = Math.max(0, Math.min(_state2[_currentNode].x, config.bounds.width));
				_state2[_currentNode].y = Math.max(0, Math.min(_state2[_currentNode].y, config.bounds.height));
				return _state2;
			},
			calculateEnergy : function (state) {
				var energy = 0;
				for (var i in EnergyFunctions) {
					if (EnergyFunctions.hasOwnProperty(i)) {
						energy += EnergyFunctions[i](state);
					}
				}

				return energy;
			},
			acceptChange : function (currentState, newState) {
				currentState[_currentNode] = _clone(newState[_currentNode]);
			},
			discardChange : function (currentState, nextState) {
				nextState[_currentNode] = _clone(currentState[_currentNode]);
			}
		};
		var _SAJS = SAJS(_SAJSConfig);

		return {
			SAInit : function () {
				_SAJS.init();
			},
			getPositions : function () {
				var obj = _SAJS.getCurrentObject();
				console.log('Energy: ' + obj.energy );
				return obj.state;
			},
			SADoStep : function () {
				_SAJS.doStep();
			},
			SARun : function () {
				_SAJS.run();
			}
		};
	};
})();
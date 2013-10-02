function NiceGraphsCtrl($scope) {
	angular.extend($scope, {
	graph: {
		vertices: {
			1: {
				x: 300,
				y: 300
			}
		},
		edges: {
			1: []
		},
		vertexCount: 1,
		edgeProbability: 0.4
	},
	SAInitialTemperature: 100,
	SATemperatureDecreaseRate: 0.95,
	nodeDistanceFactor: 100,
	borderDistanceFactor: 10,
	edgeLengthFactor: 300,
	nodeEdgeDistanceFactor: 30,
	edgeCrossingsFactor: 0
	});

	$scope.loading = false;

	$scope.$watch('graph.vertexCount + graph.edgeProbability', function () {
		$scope.graph.vertices = [];
		$scope.graph.edges = [];
		for (var v = 1; v <= $scope.graph.vertexCount; v++) {
			$scope.graph.vertices[v] = {
				x: Math.random() * 600,
				y: Math.random() * 400
			};
			$scope.graph.edges[v] = [];
			for (var v2 = v + 1; v2 <= $scope.graph.vertexCount; v2++) {
				if (Math.random() <= $scope.graph.edgeProbability) {
					$scope.graph.edges[v].push(v2);
				}
			}
		}
	});
	$scope.getEdgeStyle = function (v1, v2) {
		var x1 = $scope.graph.vertices[v1].x,
				y1 = $scope.graph.vertices[v1].y,
				x2 = $scope.graph.vertices[v2].x,
				y2 = $scope.graph.vertices[v2].y;

		if (x2 < x1) {
			var temp = x1;
			x1 = x2;
			x2 = temp;
			temp = y1;
			y1 = y2;
			y2 = temp;
		}

		var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

		var angle = Math.atan((y2 - y1) / (x2 - x1));
		var transform = "rotate(" + angle + "rad)";

		return {
			left: x1 - 0.5 * length * (1 - Math.cos(angle)) + "px",
			top: y1 + 0.5 * length * Math.sin(angle) + "px",
			width: length + "px",
			MozTransform: transform,
			WebkitTransform: transform,
			transform: transform
		};
	};


	$scope.redraw = function () {
		$scope.loading = true;
		setTimeout(function () {
			var NG = NiceGraph($scope);
			NG.SAInit();
			NG.SARun();
			$scope.graph.vertices = NG.getPositions();
			$scope.loading = false;
			$scope.$apply();
		}, 40);
	};
}

(function () {
	"use strict";
	window.SAJS = function (userConfig) {
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
			initialTemperature: 100,
			temperatureDecreaseRate: 0.95,
			getInitialState : function (temperature) {
				return {
					value: temperature
				};
			},
			getNeighboringState : function (state, temperature) {
				return {
					value: state.value + (temperature / 2 - temperature * Math.random())
				};
			},
			calculateEnergy : function (state) {
				return Math.abs(state.value);
			},
			terminatingCondition : function (state, temperature) {
				return temperature === 0 || _currentStep > config.initialTemperature * 1000;
			},
			decreaseTemperature : function (state, energy, temperature){
				return temperature * config.temperatureDecreaseRate;
			},
			decideChange : function (newEnergy, oldEnergy, temperature) {
				var delta = newEnergy - oldEnergy;
				if (delta < 0) {
					return true;
				}

				var C = Math.exp(-delta / temperature);
				var R = Math.random();

				return R < C;
			},
			discardChange : function (currentState, nextState) {

			},
			acceptChange : function (currentState, newState) {
				_currentState = _clone(newState);
			}
		};

		var config = _extend(defaultConfig, userConfig);

		var _currentState,
			_currentStep,
			_currentEnergy,
			_currentTemperature;

		return {
			doStep : function () {
				var nextState = config.getNeighboringState(_currentState, _currentTemperature);
				var energy = config.calculateEnergy(nextState);
				if (!config.decideChange(energy, _currentEnergy, _currentTemperature)) {
					_currentStep += 1;
					config.discardChange(_currentState, nextState);
					return;
				}
				config.acceptChange(_currentState, nextState);

				_currentStep += 1;
				_currentEnergy = energy;
				_currentTemperature = config.decreaseTemperature(_currentState, _currentEnergy, _currentTemperature);
			},
			init : function () {
				_currentTemperature = config.initialTemperature;
				_currentState = config.getInitialState(_currentTemperature);
				_currentEnergy = config.calculateEnergy(_currentState);
				_currentStep = 0;
			},
			run : function () {
				this.init();

				while (!config.terminatingCondition(_currentState, _currentTemperature)) {
					this.doStep();
				}

				return this.getCurrentObject();
			},
			getCurrentObject : function () {
				return {
					state: _currentState,
					energy: _currentEnergy,
					temperature: _currentTemperature,
					steps: _currentStep
				};
			}
		};
	};
})();
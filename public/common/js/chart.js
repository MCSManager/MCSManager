//依附于 Tools 工具
//Charts 的图表封装模块

TOOLS.charts = {};

TOOLS.charts.bulider = function (dom, len, config, callback, chartOption) {
	var viewData = [];
	var keyData = [];
	var option = chartOption;
	var myChart = null;
	// var UPMAX = upMAX || 100;
	for (var i = 0; i < len; i++) {
		viewData[i] = 0;
		keyData[i] = '';
	}
	require(['echarts', 'echarts/chart/line'],
		function (ec) {
			// 基于准备好的dom，初始化echarts图表
			myChart = ec.init(document.getElementById(dom));

			option.series[0].data = viewData;
			option.xAxis[0].data = keyData;

			// 为echarts对象加载数据 
			myChart.setOption(option);

			callback({
				chart: myChart,
				reOption: function () {
					myChart.setOption(option);
				},
				pushData: function (key, val) {
					viewData = viewData.slice(1);
					viewData.push(val);
					option.series[0].data = viewData;
					keyData = keyData.slice(1);
					keyData.push(key);
					option.xAxis[0].data = keyData;
				},
				replaceData: function (arr) {
					if (arr == undefined) return;
					viewData = [];
					keyData = [];
					for (var i = 0; i < arr.length; i++) {
						if (arr[i] == null) continue;
						viewData.push(arr[i].val);
						keyData.push(arr[i].key);
					}
					option.series[0].data = viewData;
					option.xAxis[0].data = keyData;
				},
				end: function () {}
			});
		}
	);
}

TOOLS.charts.DefOption = {
	color: [
		'#87cefa', '#da70d6', '#32cd32', '#6495ed',
		'#ff69b4', '#ba55d3', '#cd5c5c', '#ffa500', '#40e0d0',
		'#1e90ff', '#ff6347', '#7b68ee', '#00fa9a', '#ffd700',
		'#6b8e23', '#ff00ff', '#3cb371', '#b8860b', '#30e0e0'
	],
	tooltip: {
		trigger: 'axis'
	},
	legend: {
		data: ['百分比']
	},
	toolbox: {
		show: false,
	},
	calculable: true,
	xAxis: [{
		type: 'category',
		boundaryGap: false,
		data: []
	}],
	yAxis: [{
		type: 'value',
		max: 100,
		min: 0
	}],
	series: [{
		name: '百分比',
		type: 'line',
		smooth: false,
		itemStyle: {
			normal: {
				areaStyle: {
					type: 'default'
				}
			}
		},
		data: []
	}]
}
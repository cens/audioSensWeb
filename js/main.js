var className = "urn:class:audiosens";
var observerId = "org.ohmage.probes.audioSensProbe";
var sensorId = "sensors";
var featuresId = "features";
var classifierId = "classifiers";
var summarizerId = "summarizers";
var eventId = "events";
var observerVersion = 14;
var sensorStreamVersion = 14;
var featuresStreamVersion = 14;
var classifierStreamVersion = 14;
var summarizerStreamVersion = 14;
var eventStreamVersion = 14;
var maximumRecords = 2000;

var auth_token;
var name;
var dashboardArray;
var speechArray;
var secondArray;
var batteryArray;
var locationArray;
var rawdataArray;

var infoWindow;
var markers;
var map;
var markerCluster;

$(document).ready(function() {
    auth_token = oh.getCookie("auth_token");
    name = oh.getCookie("name");
    
    var userList = [];
    charts = new Array();
    dashboardArray = new Array();
    speechArray = new Array();
    speechMap = new Array();
    secondArray = new Array();
    batteryArray = new Array();
    locationArray = new Array();
    rawdataArray = new Array();
    speechReady = false;
    rawdataSize = 0;
    markers = [];
    
    oh.call("/class/read", {
        auth_token : auth_token,
        class_urn_list : className
        },
        function(response){
            var options = $(".userList");
            for(var key in response.data["urn:class:audiosens"].users)
            {
                userList.push(key);
                options.append($("<option />").val(key).text(key));
            }
        });
    
    $("#logout_button").on("click", function(e){
	    oh.logout();
	});
    
    Highcharts.setOptions({ // This is for all plots, change Date axis to local timezone
        global : {
            useUTC : false
            }
        });
    
    $(".userListNone").append($("<option />").val("None").text("None"));
    
    $('#dashboard_date').daterangepicker({startDate: Date.today().add({ months: -1 }), endDate: Date.today()});
    $('#dashboard_date').val(Date.today().add({ months: -1 }).toString('MM/dd/yyyy') + ' - ' + Date.today().toString('MM/dd/yyyy'));
    $('#dashboard_button').button();
    $("#dashboard_button").on("click", dashboard_button_function);
    
    $('#single_date').datepicker({format: 'mm-dd-yyyy'});
    $('#single_date').datepicker('setValue',new Date());
    $('#single_button').button();
    $("#single_button").on("click", single_button_function);
    
    $('#compare_date').datepicker({format: 'mm-dd-yyyy'});
    $('#compare_date').datepicker('setValue',new Date());
    $('#compare_button').button();
    $("#compare_button").on("click", compare_button_function);
    
    $('#rawdata_date').daterangepicker({startDate: Date.today().add({ days: -1 }), endDate: Date.today()});
    $('#rawdata_date').val(Date.today().add({ days: -1 }).toString('MM/dd/yyyy') + ' - ' + Date.today().toString('MM/dd/yyyy'));
    $("#rawdataview_button").on("click", rawdataview_button_function);
    $("#rawdatadump_button").on("click", rawdatadump_button_function);
    
    $("#schema_button").on("click", schema_button_function);

    function dashboard_button_function(e)
    {
	clearContainer();
	addTips(["Select a time range in the graph to zoom in",
		 "Click on 'Number of Samples per hour' to get information about the number of data points uploaded in an hour"]);
	for(index  in userList)
	{
	    options = {uname : userList[index],
		    nextFun : plotDashboard,
		    outerElement : getOuterElement(title="Summary for user '"+userList[index]+"'")};
	    getDashboardData(options=options);
	}
    }
    
    function single_button_function(e)
    {
	//console.log(getStartDateTime($('#single_date').val()));
	//console.log(getEndDateTime($('#single_date').val()));
	clearContainer();
	uname = $("#single_userList").val();
	addTips(["Select a time range in the Dail Summary graph to zoom in. The markers on the mpa are updated as well",
		 "Hover over points in the map to get more details about the point/cluster of points",
		 "In the map, Speech points are green in color, non-speech points are orange in color",
		 "Blue points in the map stand for pending points. Pending points stand for points which are still being processed. Kindly check after sometime to view those points as well",
		 "The 'List of events' logs major events related to the app, such as the app being started/stopped, the phone rebooting and the app crashing",
		 "The charts may take a few seconds to load, kindly be patient"]);
	getSpeech(options = {nextFun : plotSpeech,
		    uname: uname,
		    start: getStartDateTime($("#single_date").val()),
		    end: getEndDateTime($("#single_date").val()),
		    outerElement : getOuterElement(title="Daily Summary for "+uname)});
	getSensors(options = {nextFun : plotSensor,
		    uname: uname,
		    outerElementArr : [getOuterElement(title = "Map"), getOuterElement(title = "Battery Graphs")]});
	getEvents(options = {outerElement : getOuterElement(title = "List of Events")});
    }
    
    function compare_button_function(e)
    {
	//console.log(getStartDateTime($('#single_date').val()));
	//console.log(getEndDateTime($('#single_date').val()));
	clearContainer();
	addTips(["Select a time range in the graph to zoom in",
		 "The x-axis scaling of all the graphs are synchronized",
		 "There might be a small delay after selecting a range, please be patient"]);
	for(i=1; i<=5; i++)
	{
	    if($("#compare_userList"+i).val() != "None")
	    {
		uname = $("#compare_userList"+i).val();
		getSpeech(options = {nextFun : plotSpeech_compare,
				    uname: uname,
				    start: getStartDateTime($("#compare_date").val()),
				    end: getEndDateTime($("#compare_date").val()),
				    outerElement : getOuterElement(title="Daily Summary for "+uname)});
	    }
	}
    }
    
    function rawdatadump_button_function(e)
    {
	//console.log(getStartDateTimeRange($("#rawdata_date").val()));
	//console.log(getEndDateTimeRange($("#rawdata_date").val()));
	clearContainer();
	addTips([]);
	getRawdataDump();
    }
    
    function rawdataview_button_function(e)
    {
	//console.log(getStartDateTimeRange($("#rawdata_date").val()));
	//console.log(getEndDateTimeRange($("#rawdata_date").val()));
	clearContainer();
	addTips([]);
	getRawdataView();
    }
    
    function schema_button_function(e)
    {
	//console.log(getStartDateTimeRange($("#rawdata_date").val()));
	//console.log(getEndDateTimeRange($("#rawdata_date").val()));
	clearContainer();
	getSchema();
    }
    
    function getDashboardData(options, num_to_skip)
    {
	parameters = getParameters(stream_id = summarizerId,
		      stream_version = summarizerStreamVersion,
		      username = options.uname,
		      start_date = getStartDateTimeRange($("#dashboard_date").val()),
		      end_date = getEndDateTimeRange($("#dashboard_date").val()),
		      column_list = "summary, frameNo, end")
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseDashboard,
		options = options,
		num_to_skip = num_to_skip);
    }
    
    function getSpeech(options, num_to_skip)
    {
	console.log("in getSpeech:"+options.uname);
	parameters = getParameters(stream_id = summarizerId,
		      stream_version = summarizerStreamVersion,
		      username = options.uname,
		      start_date = options.start,
		      end_date = options.end,
		      column_list = "data, frameNo, end");
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseSpeech,
		options = options,
		num_to_skip = num_to_skip);
    }
    
    function getSpeech_old(options, num_to_skip)
    {
	console.log("in getSpeech_old");
	parameters = getParameters(stream_id = classifierId,
		      stream_version = classifierStreamVersion,
		      username = $("#single_userList").val(),
		      start_date = getStartDateTime($("#single_date").val()),
		      end_date = getEndDateTime($("#single_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseSpeech_old,
		options = options,
		num_to_skip = num_to_skip);
    }
    
    function getSensors(options, num_to_skip)
      {
	parameters = getParameters(stream_id = sensorId,
		      stream_version = sensorStreamVersion,
		      username = $("#single_userList").val(),
		      start_date = getStartDateTime($("#single_date").val()),
		      end_date = getEndDateTime($("#single_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseSensor,
		options = options,
		num_to_skip = num_to_skip);
    }
    
    function getEvents(options, num_to_skip)
    {
	parameters = getParameters(stream_id = eventId,
		      stream_version = eventStreamVersion,
		      username = $("#single_userList").val(),
		      start_date = getStartDateTime($("#single_date").val()),
		      end_date = getEndDateTime($("#single_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseEvent,
		options = options,
		num_to_skip = num_to_skip);
    }

    function getRawdataDump(options, num_to_skip)
    {
	parameters = getParameters(stream_id = classifierId,
		      stream_version = classifierStreamVersion,
		      username = $("#rawdata_userList").val(),
		      start_date = getStartDateTimeRange($("#rawdata_date").val()),
		      end_date = getEndDateTimeRange($("#rawdata_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	addToParametersIfNotEmpty(parameters, "observer_id", $("#rawdata_observerid").val());
	addToParametersIfNotEmpty(parameters, "observer_version", $("#rawdata_observerversion").val());
	addToParametersIfNotEmpty(parameters, "stream_id", $("#rawdata_streamid").val());
	addToParametersIfNotEmpty(parameters, "stream_version", $("#rawdata_streamversion").val());
	addToParametersIfNotEmpty(parameters, "column_list", $("#rawdata_columnlist").val());
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseRawdataDump,
		num_to_skip = num_to_skip);
    }
    
    function getRawdataView(oprions, num_to_skip)
    {
	parameters = getParameters(stream_id = classifierId,
		      stream_version = classifierStreamVersion,
		      username = $("#rawdata_userList").val(),
		      start_date = getStartDateTimeRange($("#rawdata_date").val()),
		      end_date = getEndDateTimeRange($("#rawdata_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	addToParametersIfNotEmpty(parameters, "observer_id", $("#rawdata_observerid").val());
	addToParametersIfNotEmpty(parameters, "observer_version", $("#rawdata_observerversion").val());
	addToParametersIfNotEmpty(parameters, "stream_id", $("#rawdata_streamid").val());
	addToParametersIfNotEmpty(parameters, "stream_version", $("#rawdata_streamversion").val());
	addToParametersIfNotEmpty(parameters, "column_list", $("#rawdata_columnlist").val());
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseRawdataView,
		num_to_skip = num_to_skip);
    }
    
    function getSchema()
    {
	parameters = getParametersforSchema();
	addToParametersIfNotEmpty(parameters, "observer_id", $("#schema_observerid").val());
	addToParametersIfNotEmpty(parameters, "observer_version", $("#schema_observerversion").val());
	getData(address = "/observer/read",
		parameters = parameters,
		dataFun = parseSchema);
    }
    
    function parseDashboard(response, options)
    {
	if(isFirstResult(response)) //first query
	{
	    dashboardArray[options.uname] = new Array();
	    dashboardArray[options.uname]["count_total"] = new Array();
	    dashboardArray[options.uname]["count_missing"] = new Array();
	    dashboardArray[options.uname]["count_speech"] = new Array();
	    dashboardArray[options.uname]["count_silent"] = new Array();
	    dashboardArray[options.uname]["end"] = new Array();
	}
	
	for(var i=0; i<response.data.length; i++)
	{
	    dashboardArray[options.uname]["count_total"].push([response.data[i].data.frameNo, response.data[i].data.summary.count_total]);
	    dashboardArray[options.uname]["count_missing"].push([response.data[i].data.frameNo, response.data[i].data.summary.count_missing]);
	    dashboardArray[options.uname]["count_speech"].push([response.data[i].data.frameNo, response.data[i].data.summary.count_speech]);
	    dashboardArray[options.uname]["count_silent"].push([response.data[i].data.frameNo, response.data[i].data.summary.count_silent]);
	    dashboardArray[options.uname]["end"].push([response.data[i].data.frameNo, response.data[i].data.summary.end]);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response, getDashboardData, options);
	}
	else
	{
	    options.nextFun(options);
	}
    }
    
    function parseSpeech(response, options)
    {
	if(isFirstResult(response)) //first query
	{
	    speechArray[options.uname] = new Array();
	    speechArray[options.uname]["speech"] = new Array();
	    speechArray[options.uname]["silent"] = new Array();
	    speechArray[options.uname]["missing"] = new Array();
	    speechArray[options.uname]["count"] = new Array();
	    speechMap[options.uname] = {};
	}
	
	var frameNo;
	var inferenceArr;
	var countArr;
	for(var i=0; i<response.data.length; i++)
	{
	    frameNo = response.data[i].data.frameNo;
	    inferenceArr = response.data[i].data.data.inferenceArr;
	    countArr = response.data[i].data.data.countArr;
	    
	    for(var j=0; j< inferenceArr.length; j++)
	    {
		var timestamp = frameNo + j * 60 * 1000;
		if(inferenceArr[j] == -1)
		    pushToSpeechArray(timestamp, options.uname, 0, 0, 1);
		else if(inferenceArr[j] == 0)
		    pushToSpeechArray(timestamp, options.uname, 0, 1, 0);
		else if(inferenceArr[j] == 1)
		    pushToSpeechArray(timestamp, options.uname, 1, 0, 0);

	    }
	    
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun = getSpeech, options =options);
	}
	else
	{
	    speechReady = true;
	    options.nextFun(options = options);
	}
    }
    
    function parseSpeech_old(response, options)
    {
	if(isFirstResult(response)) //first query
	{
	    speechArray[options.uname] = new Array();
	}
	
	var frameNo;
	var data;
	var timestamp;
	var object = new Object();
	var hasSpeech;
	for(var i=0; i<response.data.length; i++)
	{
	    if(response.data[i].data.classifier === "VoiceActivityDetectionClassifier")
	    {
		frameNo = response.data[i].data.frameNo;
		data = response.data[i].data.data;
		timestamp = response.data[i].metadata.timestamp;
		hasSpeech = false;
		var current = 0;
		var total = 0;
		for(var j in data)
		{
		    total ++;
		    if(j>5)
			current++;
		}
		if(total!=0 && current/total>0.25)
		    hasSpeech = true;
		object = new Object();
		object.hasSpeech = hasSpeech;
		object.timestamp = timestamp;
		speechArray[options.uname][frameNo] = object;
	    }
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun = getSpeech_old, options =options);
	}
	else
	{
	    options.nextFun(options = options);
	}
    }
    function parseSensor(response, options)
    {
	if(isFirstResult(response)) //first query
	{
	    batteryArray = new Array();
	    locationArray = new Array();
	    markers = [];
	}
	
	var frameNo;
	for(var i=0; i<response.data.length; i++)
	{
	    batteryArray.push([response.data[i].data.frameNo, response.data[i].data.Battery.percent]);
	    response.data[i].metadata.location['frameNo'] = response.data[i].data.frameNo;
	    locationArray.push([response.data[i].data.frameNo, response.data[i].metadata.location]);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun = getSensors, options = options);
	}
	else
	{
	    //console.log(locationArray);
	    options.nextFun(options = options);
	}
    }
    
    function parseEvent(response, options)
    {
	if(isFirstResult(response)) //first query
	{
	    var $mycontainer = $(".template-event-table").clone();
	    $mycontainer.removeAttr("style");
	    $mycontainer.removeClass("template-event-table");
	    options.outerElement.append($mycontainer);
	    $mycontainer.find("table").attr('id','view_table');
	}

	var tbody = $("#view_table").find("tbody");	
	var frameNo;
	for(var i=0; i<response.data.length; i++)
	{
	    var trow = $("<tr>");
	    $("<td>")
		   .text(response.data[i].metadata.timestamp)
		   .appendTo(trow);
	    $("<td>")
		   .text(JSON.stringify(response.data[i].data.event))
		   .appendTo(trow);
	    if('subevent' in response.data[i].data)
	    {
		$("<td>")
		   .text(JSON.stringify(response.data[i].data.subevent))
		   .appendTo(trow);
	    }
	    if('summary' in response.data[i].data)
	    {
		$("<td>")
		   .text(JSON.stringify(response.data[i].data.summary))
		   .appendTo(trow);
	    }
            trow.appendTo(tbody);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun= getRawdataView);
	}
    }
    
    function parseRawdataDump(response)
    {
	if(isFirstResult(response)) //first query
	{
	    console.log("in first result");
	    rawdataArray.length = 0;
	    rawdataSize = 0;
	}
	
	rawdataArray = rawdataArray.concat(response.data);
	rawdataSize += response.metadata.count;
	updateRawdataTip();
	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun = getRawdataDump);
	}
	else
	{
	    var blob = new Blob([JSON.stringify(rawdataArray)], {type: "text/plain;charset=utf-8"});
	    saveAs(blob, "data.txt");
	}
    }
    
    function parseRawdataView(response)
    {
	if(isFirstResult(response)) //first query
	{
	    var $mycontainer = $(".template-table").clone();
	    $mycontainer.removeAttr("style");
	    $mycontainer.removeClass("template-table");
	    $mycontainer.addClass("span12");
	    $("#container").append($mycontainer);
	    $mycontainer.find("table").attr('id','view_table');
	    rawdataSize = 0;
	}

	var tbody = $("#view_table").find("tbody");	
	var frameNo;
	rawdataSize += response.metadata.count;
	updateRawdataTip();
	for(var i=0; i<response.data.length; i++)
	{
	    var trow = $("<tr>");
	    $("<td>")
		   .text(response.data[i].metadata.timestamp)
		   .appendTo(trow);
	    $("<td>")
		   .text(JSON.stringify(response.data[i].metadata))
		   .appendTo(trow);
	    $("<td>")
		   .text(JSON.stringify(response.data[i].data))
		   .appendTo(trow);
            trow.appendTo(tbody);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response = response, dataFun= getRawdataView);
	}
    }
    
    function parseSchema(response)
    {
	var $mycontainer = $(".template-text").clone();
	$mycontainer.removeAttr("style");
	$mycontainer.removeClass("template-text");
	$mycontainer.addClass("span12");
	$mycontainer.attr("id","schema-text");
	$("#container").append($mycontainer);

	$("#schema-text").find("pre").text(JSON.stringify(response.data, undefined, 2));
    }


});

function plotDashboard(options)
{
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    options.outerElement.append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    borderWidth: 1,
	    zoomType : 'x',
	    alignTicks: false
	},
	credits:{enabled:false},
	plotOptions: {
	  column: {
		borderWidth :0,
		stacking: 'percent',
		animation: false,
		lineWidth:1,
		shadow: false
	  }
	},
	title: false,
	xAxis: {
	    type: 'datetime',
	    minRange: 12 * 3600 * 1000,
	    dateTimeLabelFormats: {
		hour: '%H:%M'
	    }
	},
	yAxis: [{
	    title:
	    {
		enabled: false,
		text: 'Percent'
	    },
	    min: 0,
	    max:100
	}, { // Secondary yAxis
	    min: 0,
	    gridLineWidth: 0,
	    title: {
		text: 'Total Samples per hour',
	    },
	    labels: {
		formatter: function() {
		    return this.value +' samples';
		},
	    },
	    opposite: true
        }],
	
	series: [{
	    name: 'Minutes with missing data',
	    type: 'column',
	    data:  dashboardArray[options.uname]["count_missing"]
	}, {
	    name: 'Speech minutes',
	    type: 'column',
    	    color: '#7FC97F',
	    data:  dashboardArray[options.uname]["count_speech"]
	},{
	    name: 'Non-speech minutes',
	    type: 'column',
	    color: '#FDC086',
	    data:  dashboardArray[options.uname]["count_silent"]
	},{
	    name: 'Number of Sample per hour',
	    type: 'line',
	    visible: false,
	    yAxis: 1,
	    data:  dashboardArray[options.uname]["count_total"],
	    marker: {
                    enabled: false
                },
	}]
    });
}

function plotSpeech(options)
{
    console.log("in plotSpeech");
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    options.outerElement.append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'column',
    	    zoomType : 'x',
	    borderWidth: 1,
	    events : {
		selection: function(event) {
		    if(!event.xAxis)
		    {
			resetMarkers();
		    }
		    else
		    {
			selectMarkers(event.xAxis[0].min, event.xAxis[0].max);
		    }
		}
	    }
	},
	credits:{enabled:false},
	plotOptions: {
	  column: {
		borderWidth :0,
		pointPadding:0,
		groupPadding:0,
		stacking: 'percent',
		animation: false,
		lineWidth:0,
		enableMouseTracking: true,
		shadow: false
	  }
	},
	title: false,
	xAxis: {
	    type: 'datetime',
	    minRange: 1800 * 1000,
	    dateTimeLabelFormats: {
		hour: '%H:%M'
	    }
	},
	yAxis: {
	    labels:
	    {
		enabled: false
	    },
	    title:
	    {
		enabled: false,
		text: ''
	    }
	},
	
	series: [{
	    name: 'Speech Minute',
	    color: '#7FC97F',
	    data: speechArray[options.uname]["speech"]
	}, {
	    name: 'Non-Speech Minute',
	    color: '#FDC086',
	    data: speechArray[options.uname]["silent"]
	}, {
	    name: 'Missing points',
	    data: speechArray[options.uname]["missing"]
	}]
    });
}

function plotSpeech_compare(options)
{
    console.log("in plotSpeech_convert:"+new Date(addTimeZone(options.start)));
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    options.outerElement.append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'column',
    	    zoomType : 'x',
	    borderWidth: 1,
	    events : {
		selection: function(event) {
		    if(!event.xAxis)
		    {
			for(index in charts)
			{
			    charts[index].xAxis[0].setExtremes();
			}
		    }
		    else
		    {
			for(index in charts)
			{
			    charts[index].xAxis[0].setExtremes(event.xAxis[0].min, event.xAxis[0].max);
			    charts[index].showResetZoom();
			}
		    }
		}
	    }
	},
	credits:{enabled:false},
	plotOptions: {
	  column: {
		borderWidth :0,
		pointPadding:0,
		groupPadding:0,
		stacking: 'percent',
		animation: false,
		lineWidth:0,
		enableMouseTracking: true,
		shadow: false
	  }
	},
	title: false,
	xAxis: {
	    type: 'datetime',
	    min : new Date(addTimeZone(options.start)).getTime(),
	    max : new Date(addTimeZone(options.end)).getTime(),
	    minRange: 1800 * 1000,
	    dateTimeLabelFormats: {
		hour: '%e. %b %H:%M'
	    }
	},
	yAxis: {
	    labels:
	    {
		enabled: false
	    },
	    title:
	    {
		enabled: false,
		text: ''
	    }
	},
	
	series: [{
	    name: 'Speech Minute',
	    color: '#7FC97F',
	    data: speechArray[options.uname]["speech"]
	}, {
	    name: 'Non-Speech Minute',
	    color: '#FDC086',
	    data: speechArray[options.uname]["silent"]
	}, {
	    name: 'Missing points',
	    data: speechArray[options.uname]["missing"]
	}]
    });
    charts.push(chart);
}

function plotSpeech_old(options)
{
    console.log("in plotSpeech_old");
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    options.outerElement.append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'column',
	    borderWidth: 1
	},
	credits:{enabled:false},
	plotOptions: {
	  column: {
		borderWidth :0,
		stacking: 'percent',
		animation: false,
		lineWidth:1,
		enableMouseTracking: false,
		shadow: false
	  }
	},
	title: {
	    text: 'Temporal Summary'
	},
	xAxis: {
	    type: 'datetime',
	    dateTimeLabelFormats: {
		hour: '%H:%M'
	    }
	},
	yAxis: {
	    min: 0,
	    max: 1,
	    labels:
	    {
		enabled: false
	    },
	    title:
	    {
		enabled: false,
		text: ''
	    }
	},
	
	series: [{
	    name: 'Speech',
	    color: '#7FC97F',
	    data: getSpeechArrayData(speechArray[options.uname],"speech")
	}, {
	    name: 'Non-Speech',
	    color: '#FDC086',
	    data: getSpeechArrayData(speechArray[options.uname],"nonspeech")
	}]
    });
}

function plotSensor(options)
{
    waitForSpeech(plotSensor_real, options);
}

function plotSensor_real(options)
{
    plotLocation(jQuery.extend(options, {outerElement: options.outerElementArr[0]}));
    plotBattery(jQuery.extend(options, {outerElement: options.outerElementArr[1]}));
}

function plotBattery(options)
{
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    options.outerElement.append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'area',
	    animation: false,
	    borderWidth: 1
	},
	credits:{enabled:false},
	plotOptions: {
	  column: {
	    borderWidth :0
	  }
	},
	title: {
	    text: 'Battery Graph'
	},
	xAxis: {
	    type: 'datetime',
	    dateTimeLabelFormats: {
		hour: '%H:%M'
	    }
	},
	yAxis: {
	    min: 0,
	    max: 100,
	    labels:
	    {
		enabled: true
	    },
	    title:
	    {
		enabled: true,
		text: 'Battery %'
	    }
	},
	
	series: [{
	    name: 'Battery %',
	    data: batteryArray
	}]
    });
}

function plotLocation(options)
{
    var $mycontainer = $(".template-map").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-map");
    $mycontainer.attr('id','map_canvas');
    options.outerElement.append($mycontainer);
    
    var mapOptions = {
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
	
    map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);
        
    var bounds = new google.maps.LatLngBounds();
    var icons = {};
    icons['speech'] = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/micons/green-dot.png");
    icons['silent'] = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/micons/orange-dot.png");
    icons['missing'] = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/micons/blue-dot.png");
    icons['pending'] = new google.maps.MarkerImage("http://www.google.com/intl/en_us/mapfiles/ms/micons/ltblue-dot.png");
    
    for (var i = 0; i < locationArray.length; i++)
    {
        var location = locationArray[i]
	markers.push(createMarker(options, map, location, bounds, icons));
    }
    map.fitBounds(bounds);
    
    markerCluster = new MarkerClusterer(map,
					    markers,
					    {gridSize: 20,
					    ignoreHidden: true,
					    calculator: function(markers, numStyles) {
						// Custom style can be returned here
						return {
						    text: markers.length,
						    index: 2
						};
					    }});
    google.maps.event.addListener(markerCluster,
				'mouseover',
				function(cluster) {
				    resetInfoWindow();
				    infoWindow = new google.maps.InfoWindow({
					content: getClusterText(cluster.getMarkers()),
					position: cluster.getCenter()
				    });
				    infoWindow.open(map);
				});
				

}

function pushToSpeechArray(timestamp, uname, speech, silent, missing)
{
    speechArray[uname]["speech"].push([timestamp, speech]);
    speechArray[uname]["silent"].push([timestamp, silent]);
    speechArray[uname]["missing"].push([timestamp, missing]);
    if(speech > 0)
	speechMap[uname][timestamp] = 'speech';
    else if(silent>0)
        speechMap[uname][timestamp] = 'silent';
    else
        speechMap[uname][timestamp] = 'missing';
}

function waitForSpeech(func, options)
{
    if (!speechReady)
    {
	setTimeout(waitForSpeech,100,func,options);
    }
    else
    {
	func(options);
    }
}

function getSpeechArrayData(dataArray, type)
{
    var ret = [];
    var type0;
    var type1;
    if(type == "speech")
    {
	type0=1;
	type1=0;
    }
    else
    {
	type0=0;
	type1=1;
    }
    for(var index in  dataArray)
    {
	if(dataArray[index].hasSpeech)
	    ret.push([index, type0]);
	else
	    ret.push([index, type1]);
    }
    return ret;
}

function createMarker(options, map, location, bounds, icons)
{
    var pos = new google.maps.LatLng(location[1].latitude, location[1].longitude);
    bounds.extend(pos);
    markerOptions = {};
    
    baseTS = getBase(location[1].frameNo);
    var mode = speechMap[options.uname][baseTS];
    if(mode == undefined)
    {
	mode = "pending";
    }
    markerOptions.icon = icons[mode];
    
    var marker = new google.maps.Marker({
	map: map,
	position: pos,
	icon : icons[mode]
    });
    var contentString = '<div id="content">'+
	'<h4 id="firstHeading" class="firstHeading">'+new Date(location[1].frameNo).toLocaleString()+'</h4>'+
	'<div id="bodyContent">'+
	'<b>Mode:</b>' + mode + '<br/>' +
	'<b>Coordinates:</b>' + location[1].latitude + ',' +  location[1].longitude + '<br/>' +
	'<b>Accuracy:</b>' + location[1].accuracy + '<br/>' +
	'<b>Provider:</b>' + location[1].provider +
	'</div>'+
	'</div>';
    
    google.maps.event.addListener(marker, 'mouseover', function() {
	resetInfoWindow();
	infoWindow = new google.maps.InfoWindow({
	    content: contentString
	});
	infoWindow.open(map,marker);
    });
    
    marker['mode'] = mode;
    marker['frameNo'] = location[1].frameNo;
    return marker;
}

function getClusterText(markers)
{
    var summary = {};
    for(index in markers)
    {
	temp = summary[markers[index]['mode']];
	if(temp == undefined)
	{
	    temp = 0;
	}
	summary[markers[index]['mode']] = temp+1;
    }
    var contentString = '<div id="content">'+
	'<p>There are <b>' + zeroIfNAN(markers.length) + '</b> points in this cluster</p>' +
	'<b>Points with Speech:\t</b>' + zeroIfNAN(summary['speech']) + '<br/>' +
	'<b>Points without Speech:\t</b>' + zeroIfNAN(summary['silent'] )+ '<br/>' +
	'<b>Missing Points:\t</b>' + zeroIfNAN(summary['missing']) + '<br/>' +
	'<b>Pending Points:\t</b>' + zeroIfNAN(summary['pending']) + '<br/>' +
	'</div>';
    return contentString;
}

function resetMarkers()
{
    for(index in markers)
    {
	markers[index].setVisible(true);
    }
    markerCluster.repaint();
    resetInfoWindow();
}

function selectMarkers(start, end)
{
    for(index in markers)
    {
	current = markers[index].frameNo;
	if(current >= start && current <= end)
	{
	    markers[index].setVisible(true);
	}
	else
	{
	    markers[index].setVisible(false);
	}
    }
    markerCluster.repaint();
    resetInfoWindow();
}

function getParameters(stream_id, stream_version, username, start_date, end_date)
{
    return {
	    auth_token : auth_token,
	    observer_id : observerId,
	    stream_id : stream_id,
	    stream_version : stream_version,
	    username : username,
	    start_date : start_date,
	    end_date : end_date,
	    num_to_return : maximumRecords
	    };    
}

function getParametersforSchema()
{
    return {
	    auth_token : auth_token,
	    observer_id : observerId,
	    observer_version : observerVersion,
	    };    
}

function addToParametersIfNotEmpty(parameters, name, value)
{
    if(value != undefined && value.trim() != '')
    {
	parameters[name] = value;
    }
}

function getData(address, parameters, dataFun, options, num_to_skip)
{
    if(num_to_skip)
    {
        parameters.num_to_skip =  num_to_skip;
    }
    oh.call(address, parameters, dataFun, options);   
}

function getMoreData(response, dataFun, options)
{
    console.log("in getMoreData");

    num_to_skip = getURLParameter(response.metadata.next,"num_to_skip");
    dataFun(options=options, num_to_skip=num_to_skip);
}

function isFirstResult(response)
{
    if(response.metadata == undefined)
    {
	return true;
    }
    else
    {
	if(response.metadata.previous == undefined) //first query
	    return true;
	else
	    return false;
    }
}

function getOuterElement(title, outerElement)
{
    var $mycontainer = $(".template-outer").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-outer");
    $mycontainer.addClass("outerDiv");
    if(outerElement == null)
        outerElement = $("#container");
    outerElement.append($mycontainer);
    
    $mycontainer.find('.outerDiv-head').find('h4').text(title);
    
    $(".outerDiv .closeButton").click(function(){
	$(this).parents(".outerDiv").animate({ opacity: "hide" }, "fast");
    });
    
    return $mycontainer;
}

function addTips(strings)
{
    var $mycontainer = $(".template-tip").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-tip");
    $mycontainer.addClass("tip");
    $("#container").append($mycontainer);
    
    for(index in strings)
    {
	$mycontainer.find('ul').append($("<li></li>").html(strings[index]));;
    }
}

function updateRawdataTip()
{
    var $mycontainer = $("#container").find('.tip').find('ul');
    $mycontainer.html('');
    $mycontainer.append($("<li></li>").html('<b>Number of loaded rows (estimated): </b>' + rawdataSize));
    $mycontainer.append($("<li></li>").html('If the above counter does not change for more than a minute, the request may have failed'));
    $mycontainer.append($("<li></li>").html('In such a situation, try again later or contact the webmaster'));
}

function clearContainer()
{
    $("#container").empty();
    charts = [];
    map = null;
    markerCluster = null;
    speechReady = false;
}

function resetInfoWindow()
{
    if(infoWindow != undefined)
	infoWindow.close();
}

function isMoreDataPresent(response)
{
    if((response.metadata != undefined) && (response.metadata.count >= maximumRecords) && !(typeof(response.metadata.next) == undefined))
        return true;
    else
	return false;
}

function getStartDateTime(date)
{
    var arr = date.split("-");
    return arr[2] + "-" + arr[0] + "-" + arr[1] +"T00:00:00.000-00:00"; // + getTimeZone();
}

function getEndDateTime(date)
{
    var arr = date.split("-");
    return arr[2] + "-" + arr[0] + "-" + arr[1] +"T23:59:59.999-00:00";// + getTimeZone();
}

function getStartDateTimeRange(date)
{
    var arr1 = date.split("-");
    var arr2 = arr1[0].trim().split("/");
    return arr2[2] + "-" + arr2[0] + "-" + arr2[1] +"T00:00:00.000-00:00";// + getTimeZone();
}

function getEndDateTimeRange(date)
{
    var arr1 = date.split("-");
    var arr2 = arr1[1].trim().split("/");
    return arr2[2] + "-" + arr2[0] + "-" + arr2[1] +"T23:59:59.999-00:00";// + getTimeZone();
}

function getTimeZone()
{
    var offset = new Date().getTimezoneOffset();
    offset = ((offset<0? '+':'-')+ // Note the reversed sign!
          pad(parseInt(Math.abs(offset/60)), 2) + ":" +
          pad(Math.abs(offset%60), 2));
    return offset;
    
}

function addTimeZone(date)
{
    return date.substring(0,date.length-6)+getTimeZone();
}

function pad(number, length)
{
    var str = "" + number
    while (str.length < length) {
        str = '0'+str
    }
    return str
}

function zeroIfNAN(input)
{
    if(input == undefined)
	return 0;
    return input;
}

function getBase(frameNo)
{
    date = new Date(frameNo);
    date.setMilliseconds(0);
    date.setSeconds(0);
    return date.getTime();
}

function getURLParameter(url, name)
{
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url)||[,""])[1].replace(/\+/g, '%20'))||null;
}
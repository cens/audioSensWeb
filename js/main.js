var className = "urn:class:audiosens";
var observerId = "org.ohmage.probes.audioSensProbe";
var sensorId = "sensors";
var featuresId = "features";
var classifierId = "classifiers";
var observerVersion = 6;
var sensorStreamVersion = 6;
var featuresStreamVersion = 6;
var classifierStreamVersion = 6;
var maximumRecords = 2000;

var auth_token;
var name;

var speechArray;
var secondArray;
var batteryArray;
var locationArray;
var rawdataArray;

$(document).ready(function() {
    auth_token = oh.getCookie("auth_token");
    name = oh.getCookie("name");
    
    var userList = [];
    speechArray = new Array();
    secondArray = new Array();
    batteryArray = new Array();
    locationArray = new Array();
    rawdataArray = new Array();
    
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
    
    $('#dashboard_date').datepicker({format: 'mm-dd-yyyy'});
    $('#dashboard_date').datepicker('setValue',new Date());
    $('#dashboard_button').button();
    $("#dashboard_button").on("click", dashboard_button_function);
    
    $('#single_date').datepicker({format: 'mm-dd-yyyy'});
    $('#single_date').datepicker('setValue',new Date());
    $('#single_button').button();
    $("#single_button").on("click", single_button_function);
    
    $('#rawdata_date').daterangepicker({startDate: Date.today().add({ days: -1 }), endDate: Date.today()});
    $('#rawdata_date').val(Date.today().add({ days: -1 }).toString('MM/dd/yyyy') + ' - ' + Date.today().toString('MM/dd/yyyy'));
    $("#rawdataview_button").on("click", rawdataview_button_function);
    $("#rawdatadump_button").on("click", rawdatadump_button_function);
    
    function dashboard_button_function(e)
    {
	//console.log(getStartDateTime($('#dashboard_date').val()));
	//console.log(getEndDateTime($('#dashboard_date').val()));
	getDashboardSensors();
	clearContainer();
    }
    
    function single_button_function(e)
    {
	//console.log(getStartDateTime($('#single_date').val()));
	//console.log(getEndDateTime($('#single_date').val()));
	clearContainer();
	getSpeech();
	getSensors();
    }
    
    function rawdatadump_button_function(e)
    {
	console.log(getStartDateTimeRange($("#rawdata_date").val()));
	console.log(getEndDateTimeRange($("#rawdata_date").val()));
	clearContainer();
	getRawdataDump();
    }
    
    function rawdataview_button_function(e)
    {
	console.log(getStartDateTimeRange($("#rawdata_date").val()));
	console.log(getEndDateTimeRange($("#rawdata_date").val()));
	clearContainer();
	getRawdataView();
    }
    
    function getSpeech(num_to_skip)
    {
	console.log("in getSpeech");
	console.log(auth_token);
	parameters = getParameters(stream_id = classifierId,
		      stream_version = classifierStreamVersion,
		      username = $("#single_userList").val(),
		      start_date = getStartDateTime($("#single_date").val()),
		      end_date = getEndDateTime($("#single_date").val()));
	addToParametersIfNotEmpty(parameters, "num_to_skip", num_to_skip);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseSpeech,
		secondFun = plotSpeech,
		num_to_skip = num_to_skip);
    }
    
    function getSensors(num_to_skip)
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
		secondFun = plotSensor,
		num_to_skip = num_to_skip);
    }

    function getRawdataDump(num_to_skip)
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
	console.log("hello");
	console.log(parameters);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseRawdataDump,
		num_to_skip = num_to_skip);
    }
    
    function getRawdataView(num_to_skip)
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
	console.log("hello");
	console.log(parameters);
	getData(address = "/stream/read",
		parameters = parameters,
		dataFun = parseRawdataView,
		num_to_skip = num_to_skip);
    }
    
    function getDashboardSensors(num_to_skip)
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
		secondFun = plotDashboard,
		num_to_skip = num_to_skip);
    }
    
    function parseSpeech(response, secondFun)
    {
	if(isFirstResult(response)) //first query
	{
	    speechArray = new Array();
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
		speechArray[frameNo] = object;
	    }
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response, getSpeech);
	}
	else
	{
	    secondFun();
	}
    }
    
    function parseSensor(response, secondFun)
    {
	if(isFirstResult(response)) //first query
	{
	    batteryArray = new Array();
	    locationArray = new Array();
	}
	
	var frameNo;
	for(var i=0; i<response.data.length; i++)
	{
	    batteryArray.push([response.data[i].data.frameNo, response.data[i].data.Battery.percent]);
	    locationArray.push([response.data[i].data.frameNo, response.data[i].data.Location]);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response, getSensor);
	}
	else
	{
	    console.log(locationArray);
	    secondFun();
	}
    }
    
    function parseRawdataDump(response, secondFun)
    {
	if(isFirstResult(response)) //first query
	{
	    console.log("in forst result");
	    rawdataArray.length = 0;
	}
	
	rawdataArray = rawdataArray.concat(response.data);
	if(isMoreDataPresent(response))
	{
	    getMoreData(response, getRawdataDump);
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
		   .text(JSON.stringify(response.data[i].metadata))
		   .appendTo(trow);
	    $("<td>")
		   .text(JSON.stringify(response.data[i].data))
		   .appendTo(trow);
            trow.appendTo(tbody);
	}

	if(isMoreDataPresent(response))
	{
	    getMoreData(response, getRawdataView);
	}
    }


});

function plotSpeech()
{
    //return;
    console.log("in plotSpeech");
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    $("#container").append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'column',
	    borderWidth: 1
	},
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
	    data: getSpeechArrayData(speechArray,"speech")
	}, {
	    name: 'Non-Speech',
	    color: '#FDC086',
	    data: getSpeechArrayData(speechArray,"nonspeech")
	}]
    });
}

function plotSensor()
{
    plotBattery();
    plotLocation();
}

function plotBattery()
{
    var $mycontainer = $(".template-chart").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-chart");
    $("#container").append($mycontainer);
    
    var chart = new Highcharts.Chart({
	chart: {
	    renderTo: $mycontainer[0],
	    type: 'area',
	    borderWidth: 1
	},
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

function plotDashboard()
{
}

function plotLocation()
{
    var $mycontainer = $(".template-map").clone();
    $mycontainer.removeAttr("style");
    $mycontainer.removeClass("template-map");
    $mycontainer.attr('id','map_canvas');
    //$mycontainer.attr('class','span12');
    $("#container").append($mycontainer);
    
    var mapOptions = {
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
	
    var map = new google.maps.Map(document.getElementById("map_canvas"),
            mapOptions);
    
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < locationArray.length; i++)
    {
        var location = locationArray[i]
	var pos = new google.maps.LatLng(location[1].latitude, location[1].longitude);
        bounds.extend(pos);
        var marker = new google.maps.Marker({
            position: pos,
            map: map,
            title: new Date(location[1].frameNo).toDateString(),
        });
    }
    map.fitBounds(bounds);
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
	//console.log();
	//console.log(dataArray[index].timestamp);
	//return [];
	if(dataArray[index].hasSpeech)
	    ret.push([index, type0]);
	else
	    ret.push([index, type1]);
    }
    return ret;
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

function addToParametersIfNotEmpty(parameters, name, value)
{
    if(value != undefined && value.trim() != '')
    {
	parameters[name] = value;
    }
}

function getData(address, parameters, dataFun, secondFun, num_to_skip)
{
    console.log("in getData");

    if(num_to_skip)
    {
        parameters.num_to_skip =  num_to_skip;
        oh.call(address, parameters, dataFun);
    }
    
    oh.call(address, parameters, dataFun, secondFun);   
}

function getMoreData(response, dataFun)
{
    console.log("in getMoreData");

    num_to_skip = getURLParameter(response.metadata.next,"num_to_skip");
    dataFun(num_to_skip);
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

function clearContainer()
{
    $("#container").empty();
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

function pad(number, length)
{
    var str = "" + number
    while (str.length < length) {
        str = '0'+str
    }
    return str
}


function getURLParameter(url, name)
{
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url)||[,""])[1].replace(/\+/g, '%20'))||null;
}
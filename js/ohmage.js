var oh = oh || {};

var ohmageServerUrl = "https://internal.ohmage.org";

oh.call = function(path, data, datafun, options){
	
	function processError(errors){
		if(errors[0].code && errors[0].code == "0200"){
			var pattern = /(is unknown)|(authentication token)|(not provided)/i;
			if(!errors[0].text.match(pattern)) {
				alert(errors[0].text);
			}
			if(!/login.html$/.test(window.location.pathname)){
				oh.sendtologin();
			}
		} else {
			alert(errors[0].text)
		}
	}	
	
	//input processing
	var data = data ? data : {};		
	
	//default parameter
	data.client = "audiosens-viz"
	savedServer = oh.getCookie("server");
	if(savedServer != undefined && savedServer.trim().length > 0)
	{
		ohmageServerUrl = savedServer.trim();
	}
	
	var myrequest = $.ajax({
		type: "POST",
		url : ohmageServerUrl + "/app" + path,
		data: data,
		dataType: "text",
	}).done(function(rsptxt) {
		if(!rsptxt || rsptxt == ""){
			alert("Undefined error.")
			return false;
		}
		var response = jQuery.parseJSON(rsptxt);
		if(response.result == "success"){
			if(datafun){
				datafun(response, options = options);
			}
		} else if(response.result == "failure") {
			processError(response.errors)
			return false;
		} else{
			alert("JSON response did not contain result attribute.")
		}
		
	}).error(function(){alert("Ohmage returned an undefined error.")});		
	
	return(myrequest)
}

oh.login = function(user, password, cb){
	var req = oh.call("/user/auth_token", { 
		user: user, 
		password: password
	}, function(response){
		
		if(!cb) return;
		cb(response);
	})
	return req;
}

oh.logout = function(){
	oh.call("/user/logout", {}, function(){
		oh.sendtologin();
		});
}

oh.sendtologin = function(){
	var next = "login.html"
	if(location.hash) {
		next = next + "?state=" +  location.hash.substring(1);
	}
	if(location.pathname){
		next = next + "?next=" + location.pathname;
	}
	window.location = next;
}

oh.setCookie = function(c_name,value,exdays){
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
	//console.log(c_name + "=" + c_value);
}

oh.getCookie = function (c_name)
{
	var i,x,y,ARRcookies=document.cookie.split(";");
	for (i=0;i<ARRcookies.length;i++)
	{
		x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
		y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
		x=x.replace(/^\s+|\s+$/g,"");
		if (x==c_name)
		{
			return unescape(y);
		}
	}
}


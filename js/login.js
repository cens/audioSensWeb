$(document).ready(function() {

	function getURLParameter(name) {
	    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	}		
	
	$("#loginbutton").on("click", function(e){
		var next = getURLParameter("next") ? getURLParameter("next") : document.referrer;
		var state = getURLParameter("state") ? getURLParameter("state") : "";
	
		var user = $("#user").val();
		var password = $("#password").val();
		var server = $("#server").val();
		oh.setCookie("server", server);

		oh.login(user, password, function(response){
                        oh.setCookie("auth_token",response.token);
			oh.setCookie("user",user);			
			window.location = "./index.html";
		});
		return false;
	});
	
	//logout from pre existing sessions.
	//oh.logout();
});
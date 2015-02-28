  var AccessToken;
            var members;
            var membersList = [];
            var adminName = {};
            
            function checkLogin() {
                FB.getLoginStatus(function(response) {
                    if (response.status === 'connected') {
                        console.log('Logged in.');
                        AccessToken = response.authResponse.accessToken;
                        apiCall("/v2.2/me", function(response) {
                            var objUser = JSON.parse(response);
                                adminName.name = objUser.name;
                                adminName.id = objUser.id;
                        });
                        apiCall("/v2.2/me/permissions", function(response) {
                            var groupsAllowed = false;
                            var objPermissions = JSON.parse(response);
                            var stopLoop = false; //to stop the loop prematurely
                            var x = 0;
                            while (!stopLoop || x < objPermissions.data.length) {
                                if (objPermissions.data[x].permission == "user_groups") {
                                    if (objPermissions.data[x].status == "granted") {
                                        groupsAllowed = true;
                                    }
                                    stopLoop = true;
                                }
                                ++x;
                            }
                            if (groupsAllowed == false) {
                                document.getElementById("permissions").innerHTML = "This app requires permission to view groups in order to administer the ENG Survival group. Please reconsider.<br /><button type=\"button\" onClick=\"reconsider()\">Reconsider</button>";
                            }
                            else {
                                apiCall("/1554896381413406/members?limit=5000&offset=0", function(response){
                                    members = JSON.parse(response); //Note, paging may occur - won't bother controlling for it though
                                    for (x in members.data) {
                                        membersList[x] = members.data[x].name;
                                    }
                                    document.getElementById("members").innerHTML = "Names loaded. Begin checking? \
                                    <input type=\"button\" onclick=\"startChecking()\" value=\"Yes\">";
                                    //adminName.isAdmin = (string === "true");
                                });
                            }
                        });
                        
                        
                        
                    }
                    else {
                        //leave it to the button to deal with it.
                    }
                });
            }
            
            function startChecking() {
                FB.getLoginStatus(function(response) {
                    if (response.status === 'connected') {
                        //checking code
                    }
                    else
                        document.getElementById("permissions").innerHTML = "Not logged in.";
                }
            }
            
            function reconsider() {
                FB.login(
                    function(response) {
                        console.log(response);
                        checkLogin();
                        if (members) {
                            document.getElementById("permissions").innerHTML = ""; //members variable is now stocked with real users, wipe permissions warning.
                        }
                    },
                    {
                        scope: 'user_groups',
                        auth_type: 'rerequest'
                    }
                );
            }
            
            //for all FB API calls
            function apiCall(url, callback) {
                FB.api(url, function(response) {
                    console.log(JSON.stringify(response));
                    if (callback) {
                        callback(JSON.stringify(response));
                    }
                    });
            }
            
            function httpGet(theUrl) {
                var xmlHttp = null;

                xmlHttp = new XMLHttpRequest();
                xmlHttp.open( "GET", theUrl, false );
                xmlHttp.send( null );
                return xmlHttp.responseText;
            }
            
            //FB.Init is up verification code. The rest of the FB functions will not run until fbApiInit = true;
            var fbApiInit = false;
            function checkAPIComplete(globalControlVariable, callback) {
                FB.getLoginStatus(function(response){
                    globalControlVariable = true;
                });
                if (!globalControlVariable) {
                    setTimeout(function() {checkAPIComplete(globalControlVariable,callback);}, 50);
                }
                else {
                    if(callback) {
                        callback();
                    }
                }
            }
            
            window.fbAsyncInit = function() {
                FB.init({
                    appId      : '1461836634038781',
                    status     : true,
                    cookie     : true,
                    xfbml      : true,
                    version    : 'v2.1'
                });
                
                checkAPIComplete(fbApiInit, checkLogin);
            };

            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                fjs.parentNode.insertBefore(js, fjs);
                }(document, 'script', 'facebook-jssdk'));
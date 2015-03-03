var AccessToken; //contains access token, although isn't really necessary with FB.api
var members; //contains object holding the members
var membersList = []; //contains a list only containing the list of users and nothing else
var adminName = {}; //contains some information about the logged in user.
var searchRate = 500; //search rate in ms


function checkLogin(callback) {
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            console.log('Logged in.');
            AccessToken = response.authResponse.accessToken;
            apiCall("/v2.2/me", function(response) {
                var objUser = JSON.parse(response);
                adminName.name = objUser.name;
                adminName.id = objUser.id;
                document.getElementById("name").innerHTML= "Welcome, " + adminName.name + "!";
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
<input type=\"button\" onclick=\"startChecking(0)\" value=\"Yes\">";
                        //adminName.isAdmin = (string === "true");
                    });
                }
                if (callback) {
                    callback(groupsAllowed);
                }
            });



        }
        else {
            //leave it to the button to deal with it.
        }
    });
}

function startChecking(entry) {
    console.log("StartChecking run " + entry + " of " + membersList.length);
    if (entry < membersList.length) {
        var form = document.getElementById("studentForm");
        var field = document.getElementById("student_name");
        var entryFormatted;

        var position = -1;
        var continueLoop = true;
        while (continueLoop) {
            var positionTemp = membersList[entry].indexOf(" ",position + 1);
            if (positionTemp != -1) {
                position = positionTemp;
            }
            else {
                continueLoop = false;
            }
        }

        entryFormatted = membersList[entry].substring(position + 1) + ", " + membersList[entry].substring(0, position);
        field.value = entryFormatted;
        form.submit();
        setTimeout (function() {
            var frame = document.getElementById("theframe").contentDocument;
            if (frame.getElementById("student_search_results") !== null){
                console.log ("ContentFound");
                document.getElementById("output").innerHTML = entryFormatted + "<br /><table>"+frame.getElementById("student_search_results").innerHTML+"</table>" + document.getElementById("output").innerHTML;
                startChecking(entry + 1);
            }
            else {
                if (frame.body.innerHTML.search(" The requested object does not exist on this server. The link you followed is either outdated, inaccurate, or the server has been instructed not to let you have it.") > 0) {
                    document.getElementById("error").innerHTML += entryFormatted + "<br /> Error! Trying again...</br>";
                    startChecking(entry);
                }
                else {
                    document.getElementById("nonExistent").innerHTML = entryFormatted + "<br /> " + document.getElementById("nonExistent").innerHTML;
                    startChecking(entry + 1);
                }
            }
        }, searchRate);
    }
}


function reconsider() {
    FB.login(
        function(response) {
            console.log("Checking...");
            checkLogin(function (groupsAllowed) {
                if (groupsAllowed == true) {
                    console.log("Check done");
                    document.getElementById("permissions").innerHTML = ""; //members variable is now stocked with real users, wipe permissions warning.
                }
            });

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
        //console.log(JSON.stringify(response));
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

    $(document).ready(function() {
        checkAPIComplete(fbApiInit, checkLogin);
    }); //This blocks the initial run of the javascript until jQuery is ready.
};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
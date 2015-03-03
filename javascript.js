//Global variables
var membersList = {name:[], id:[]}; //contains a list only containing the list of users, ids, and nothing else
var adminData = {}; //contains some information about the logged in user.
var searchRate = 500; //search rate in ms per page
var groupsAllowed = false; //A quick and dirty way of signalling to the entire program whether or not they have the permissions to run
var fbGroupId = 1554896381413406; //This is the group's ID

//HTML page elements to speed up javascript execution time
var outputElement;
var nonExistentElement;
var errorElement;
var debugElement;


//Global strings
var reconsiderText = "This app requires permission to view groups in order to administer the ENG Survival group. Please reconsider.<br /><button type=\"button\" onClick=\"reconsider()\">Reconsider</button>";
var beginCheckTest = "Names loaded. Begin checking? <input type=\"button\" onclick=\"startChecking(0)\" value=\"Yes\">";


//Tomiwa Ademidun: 10152756679411139


//This function runs once the user has been identified as logged into both Facebook and the app.
function loggedIn(loginData, callback) {

        //This API call gets the name and needed details of the logged in user, for personalization. Will only run once
        console.log ("Retrieving logged-in user data...");
        FB.api("/v2.2/me", function(response) {
            adminData.name = response.name;
            adminData.id = response.id;
            document.getElementById("name").innerHTML= "Welcome, " + adminData.name + "!"; //Write the welcome message to the user
        });

    checkingGroupPermissions(retrieveNames, askForReconsideration); //Check permissions, act accordingly

    //Starts callback if present
    if (callback) {
        callback();
    }
}

//This function checks group permissions from the user, and sets the global variable "groupsAllowed" accordingly.
function checkingGroupPermissions(grantedCallback, deniedCallback) {
    console.log ("Retrieving permissions...");

    //This API call gets the permissions the user granted the app
    FB.api("/v2.2/me/permissions", function(objPermissions) {

        //loop through the retrieved permissions data stucture, looking for important bit: groups permissions
        for (x = 0, stopLoop = false; !stopLoop || x < objPermissions.data.length; x++) {
            if (objPermissions.data[x].permission === "user_groups") { //if the users_groups section is found...
                if (objPermissions.data[x].status === "granted") { //... and we're granted permissions to groups...
                    groupsAllowed = true; //... tell all other functions that we're clear for operation.
                    console.log ("Groups permissions granted.");
                }
                else { //No groups permissions given
                    groupsAllowed = false; //unncessary, but good for readability and consistency
                    console.log ("Groups permissions denied.");
                }
                stopLoop = true; // stop the loop, we found the permissions for user_groups
            }
        }

        //Run callback functions if they exist and fit the scenario
        if (grantedCallback && groupsAllowed === true) {
            grantedCallback();
        }
        else if (deniedCallback && groupsAllowed === false) {
            deniedCallback();
        }
    });
}


//This function, given appropriate permissions, will start searching the group for member names
function retrieveNames(limit, offset) {

    //Checking to ensure limits and offsets are valid, chop off decimals
    if (isNaN(limit) || limit < 1) {
        limit = 5000;
    }
    if (isNaN(offset) || offset < 1) {
        offset = 0;
    }
    limit = Math.floor(limit);
    offset = Math.floor(offset);

    console.log ("Limit: " + limit + " Offset: " + offset); //output settings of run

    if (groupsAllowed === true) {
        console.log ("Retrieving member names...");
        
        //This function retrieves the member list page
        FB.api("/" + fbGroupId + "/members?limit=" + limit + "&offset=" + offset, function(response){
            //Iterates through member list, recording names
            for (x in response.data) {
                membersList.name.push(response.data[x].name);
                membersList.id.push (response.data[x].id);
            }
            //If there are more pages to go, retrieve them. Else, give the user heads up that we're ready to start.
            if (response.paging.next != null) {
                console.log("Next page...");
                retrieveNames(limit, membersList.name.length);
            }
            else {
                console.log ("Done retrieving names.");
                document.getElementById("members").innerHTML = beginCheckTest;
            }
        });
    }
}

//Given insufficient permissions, this function will ask for them again.
function askForReconsideration() {
    if (groupsAllowed === false) {
        console.log("Asking for reconsideration...");
        document.getElementById("permissions").innerHTML = reconsiderText;
    }
}

//This function coordinates re-asking the user for group permissions.
function reconsider() {
    console.log ("Asking for permissions again...");
    FB.login(
        function(response) {
            console.log("Checking if reconsideration was successful... wipe reconsider message, will reappear if needed.");
            document.getElementById("permissions").innerHTML = "";
            checkLogin(loggedIn);

        },
        {
            scope: 'user_groups',
            auth_type: 'rerequest'
        }
    );
}



//This is the checking function.
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





//Depreciated. Keep it though?
/*function httpGet(theUrl) {
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}*/

//No other javascript will run until we know the FB login status of the user.
//This function also verifies if a login was made successfully by the facebook login button
function checkLogin(successCallback, unauthorizedCallback, unknownCallback) {

    //This block will make sure that there are no empty callback functions
    successCallback = successCallback || function() {console.log("Empty sucessCallback, err. 0001.");};
    unauthorizedCallback = unauthorizedCallback || function() {console.log("Empty unauthorizedCallback, err. 0002.");};
    unknownCallback = unknownCallback || function() {console.log("Empty unknownCallback, err. 0003.");};

    FB.getLoginStatus(function(response){
        console.log ("FB API initialization complete.");

        if (response.status === "connected") {
            console.log ("Connected.");
            successCallback(response);
        }
        else if (response.status === "not_authorized") {
            console.log ("Not authorized.");
            unauthorizedCallback(response);
        }
        else {
            console.log ("Not logged into Facebok.");
            unknownCallback(response);
        }
    });
}


//Don't touch anything below this (exception: jQuery), it's secret Facebook stuff...
window.fbAsyncInit = function() {
    FB.init({
        appId      : '1461836634038781',
        status     : true,
        cookie     : true,
        xfbml      : true,
        version    : 'v2.1'
    });

    //HTML page elements to speed up javascript execution time
    outputElement = document.getElementById("output");
    nonExistentElement = document.getElementById("nonExistent");
    errorElement = document.getElementById("error");
    debugElement = document.getElementById("debug");

    
    //If jQuery was to be implemented, it would be placed here to block initial javascript execution until jQuery is ready.
    checkLogin(loggedIn);

};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
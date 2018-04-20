(function(){
// <copyright file="main.js" company="Shiny Digital Software (PTY) LTD">
// Copyright (c) 2018 All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// </copyright>
// <author>Chesney Carolissen</author>
// <date>20/04/2018 08:21:58 AM </date>
// <summary>Scraper.js File. Scrapes information from third party source.</summary>

	console.log('Report Tool');

	// Check if the user selected the export photos option.
	var withPhotos = false;

	var local = false;

	var srcUrl = "http://localhost/InvestigationLog";

	var totalEvents = 0;	
	
	if (local === true) {
		// Ensure there is a file called events.html
		srcUrl = "http://localhost/events.html"?;
	} else {
		srcUrl = "http://localhost/InvestigationLog?s=";
	}	

	document.onreadystatechange = function () {		
	
		if (document.readyState == "interactive") {
			// Get the total number of events.		
			ajaxCall(srcUrl, function(srcUrl, responseText){
				var totalEvents = 0;
				
				// Get all events.
				var frag = document.createDocumentFragment();
				var eventsDiv = document.createElement('div');
				eventsDiv.setAttribute("id", "eventsTotal");
				eventsDiv.innerHTML = responseText;
				
				try {
					// Get the total number of events.
					totalEvents = eventsDiv.querySelectorAll("p")[1].firstChild.nodeValue.split('of')[1].split(':',1).join('').trim();

					// Set the count
					document.getElementById('totalEvents').innerHTML = "Total Number of events : " + totalEvents;

				} catch(e) {
					console.log(e.name);
					document.getElementById('totalEvents').innerHTML = "Error, could not retrieve events. Are you logged onto the system?";
				}			

			});
		}
	}

	document.getElementById("compileReport").onclick = function () {	
		persons = [];

		// Build the request URL string.
		var min = getParameterByName('min') || 0;
		var max = getParameterByName('max') || 0;

		// Check if the user checked the export photos option.
		withPhotos = document.getElementById('exportPhotos').checked;	
		
		var eventLogUrl = srcUrl + min + "&n=" + max;

		// Get all events.
		ajaxCall(eventLogUrl, getEvents);	
	}

	function getParameterByName(name, url) {
	    if (!url) url = window.location.href;
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	// Clean the date received from the HTML table.
	function formatDate(capturedDate) {			
		var dt = new Date(capturedDate.split('CAT',1)[0]);			
		return dt;
	}

	function getEvents(eventLogUrl, responseText) {		
		// params : url, callback
		ajaxCall(eventLogUrl, function(eventLogUrl, responseText){		

			// Clear variables.
			persons = [];
			
			// Get all events.
			var frag = document.createDocumentFragment();
			var eventsDiv = document.createElement('div');
			eventsDiv.setAttribute("id", "events");
			eventsDiv.innerHTML = responseText;

			// Get the person details of each event.
			var eventsTable = eventsDiv.querySelector("table");
			var rowLength = eventsTable.rows.length;

			numPersons = rowLength;			
			
			// Clear the report progress div
			document.getElementById('report').innerHTML = "Generating report, please wait...";

			// Process the events file. i = 1 to skip the header row.			
			for (var i = 1; i < rowLength; i+=1) {				

				// Format the date.
				var htmlDate = eventsTable.rows[i].cells[0].innerHTML;
				var capturedDate = formatDate(htmlDate);
									
		  		// Set the Person variables.
		  		var person = {
		  			// Event Details.
		  			'result' : eventsTable.rows[i].cells[5].innerHTML,
		  			'confidence' : eventsTable.rows[i].cells[6].innerHTML,
		  			'eventId' : eventsTable.rows[i].cells[1].querySelector('a').innerHTML,
		  			'eventUrl' : eventsTable.rows[i].cells[1].querySelector('a').getAttribute('href'),	  				
		  			'capturedDate' : capturedDate.toLocaleDateString('en-ZA'),
		  			'capturedTime' : capturedDate.toLocaleTimeString('en-ZA')	  				
		  		}
		  		// Add the person to the Persons array.	  			
		  		persons.push(person);	  		
		  	}
		  	matchEvents();	  		
		});		
	}

	function downloadReport(filename, elId, mimeType) {
	    var elHtml = document.getElementById(elId).innerHTML;
	    var link = document.createElement('a');
	    mimeType = mimeType || 'text/plain';

	  	link.setAttribute('download', filename);
		link.setAttribute('href', 'data:' + mimeType  +  ';charset=utf-8,' + encodeURIComponent(elHtml));
		link.click();    	
	}

	document.getElementById('downloadReport').onclick = function(){
		var dtNow = new Date();
		var ts = dtNow.toLocaleTimeString('en-ZA');
		// You can use the .txt extension if you want
		var fileName =  dtNow.toLocaleDateString('en-ZA') + '-' + ts + '-report.html'; 
		downloadReport(fileName, 'report','text/html');
	}		

	function createReport(matches, unprocessedPersons) {		
		writeReport(matches);
		//Clear the errors div.
		document.getElementById('errors').innerHTML = "";

		if (unprocessedPersons.length > 0) {
			for (var i = 0; i < unprocessedPersons.length; i++) {
				document.getElementById('errors').innerHTML += unprocessedPersons[i].eventId + "<br>";
			}
		}
	}

	function writeReport(matches) {

		// sort the matches array by key:value of capturedDate, capturedTime.
		if (matches.length == 0) {
			document.getElementById('report').innerHTML = "No person matches found. Compile a report first";
			return;
		}

		// Write the content to the report iframe.
		document.getElementById('report').innerHTML = "";
	  		
		var headings = ['capturedDate', 'capturedTime', 'location', 'matchId', 
			'result', 'confidence', 'eventId'];

		var text = "<table id='report' border='1'>";
		  		
		// Write headings.
		text += "<tr class='header'>";

		// Check if the user wants photos.
		if (withPhotos === true) {
			headings.push('enrolledImage', 'capturedImage');
		}
		
		headings.forEach(function(h,i){		
			text += "<td>"+ h + "</td>";
		});
		
		text += "</tr>";
		  		
		matches.forEach( function(o, i) {	  			
			text += "<tr>";
			text += "<td>" + o.capturedDate + "</td>";
			text += "<td>" + o.capturedTime + "</td>";
			text += "<td>" + o.location + "</td>";
			text += "<td>" + o.matchId + "</td>";
			text += "<td>" + o.result + "</td>";
			text += "<td>" + o.confidence + "</td>";
			text += "<td>" + o.eventId + "</td>";

			if (withPhotos === true) {
				text += "<td><img src='" + o.enrolledImage + "'</td>";
				text += "<td><img src='" + o.capturedImage + "'</td>";	
			}
			
		  	text += "</tr>";
		});

		text += "</table>";

		var reportContent = "<html><body>" + text + "</body></html>";

		// Write the content to the div
	 	document.getElementById('report').innerHTML = reportContent;
		  	
	}

	function matchEvents() {	
		var matches = [];
		
		var personTotal = 0;

		var matchCount = 0;

		var unprocessedPersons = [];

		personTotal = persons.length;

		for (var i = 0; i < persons.length; i++) {
			// When the callback is registered, i no longer has the value it did when the callback was registered.
			// We need to close over the variable i so that it retains the correct value.
			(function(i) {			
				var p = persons[i];
				var eventUrl = p.eventUrl;
				ajaxCall(p.eventUrl, function(eventUrl, responseText){

					try {
						// Update the person match count.
						matchCount++;

						// Update the progress status.
						document.getElementById('report').innerHTML = "Processed" + (matchCount) + "/" + persons.length;			
									
						// Convert the html response to a variable for easy querying.
						var frag = document.createDocumentFragment();
						var personEventDiv = document.createElement('div');
						personEventDiv.setAttribute("id", "personEvent");

						personEventDiv.innerHTML = responseText;
					
						var matchTable = personEventDiv.querySelector('table table');
						var imagesTable = personEventDiv.getElementsByTagName('table')[2];
						var matchId = matchTable.getElementsByTagName('td')[2].innerHTML;

						matchId = matchId.split(" ", 1)[0];

						// Update the person properties with match details.
						p.matchId = matchId;
						p.location = matchTable.getElementsByTagName('td')[0].innerHTML;

						if (withPhotos === true) {
							p.capturedImage = imagesTable.getElementsByTagName('img')[0].src;
							p.enrolledImage = imagesTable.getElementsByTagName('img')[1].src;	
						}					

						// Push the person item on the matches.
						matches.push(p);
					
						// Show the report.				
						if (matchCount == personTotal) {
							createReport(matches, unprocessedPersons);
						}

					} catch(e) {					
						// Log the unprocessed records
						unprocessedPersons.push(p);

						// Show the report.				
						if (matchCount == personTotal) {
							createReport(matches, unprocessedPersons);
						}				
					}
								
				});
			}(i));
		}	
	}

	function ajaxCall(url, callback) {
		var xmlhttp = new XMLHttpRequest;
		xmlhttp.onreadystatechange = function() {
			if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
	           if (xmlhttp.status == 200) {               
	               callback(url,xmlhttp.responseText);               
	           }
	           else if (xmlhttp.status == 400) {
	              alert('There was an error 400. Ensure that you have logged onto the System.');
	           }
	           else {
	               alert('something else other than 200 was returned.Ensure that you have logged onto the System.');
	           }
	        }
	    };

	    xmlhttp.open("GET", url, true);
	    xmlhttp.send();
		
	}
}());
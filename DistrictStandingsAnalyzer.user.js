// ==UserScript==
// @name         District Standings Analyzer
// @namespace    https://github.com/BHSRobotix
// @version      0.1
// @description  Color code the district standings by the chances the team has to get in to DCMP
// @author       Rick O'Donnell
// @match        http://frc-districtrankings.usfirst.org/2016/NE
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

// Your code here...
var dsa = {};  // use this to not over-pollute the global namespace - not sure what sort of namespacing tampermonkey does

// Constants to fix when page changes
dsa.isFirstRow = function(jqRow) { return jqRow.find("th:eq(0)").find("div").length > 0; };
dsa.eventNotPlayedText = "Not Played";
dsa.notAutoQualifiedText = "---";

// Color scheme for the levels
dsa.colors = {
    in: "#aaffaa",
    likely: "#ccffcc",
    bubble: "#ffffaa",
    unlikely: "#ffcc99",
    out: "#ff9999"
};

// Quick and dirty function to calculate the likely points - CHANGE THIS TO YOUR OWN LIKING
dsa.computeLikelyFinalPoints = function(evt1Score, evt2Score, currPts, agePts) {
    // If they haven't played, give them 50, if not second event double their first event and add age points, otherwise use current points
    return evt1Score === -1 ? 50 : (evt2Score === -1 ? evt1Score*2 + agePts : currPts);
};

// Quick and dirty function to guess level for a team - CHANGE THIS TO YOUR OWN LIKING
dsa.guessLevel = function(pts, evts) {
    if (likelyPts > 90) return "in";
    if (likelyPts > 68) return "likely";
    if (likelyPts > 54) return "bubble";
    if (likelyPts > 42) return "unlikely";
    if (evts === 2) return "out";
    return "unlikely";
}

// Go through and get all the teams data
var teams = [];
$("tr[role=row]").each(function() {
    if (dsa.isFirstRow($(this))) { console.log("found row one"); return true; } // skip the first row
    var tm = {};
    tm.row = $(this);
    tm.currRank = parseInt($(this).find("td:eq(0)").text());
    tm.currPts = parseInt($(this).find("td:eq(1)").text());
    tm.numberName = $(this).find("td:eq(2)").text();
    var evt1 = $(this).find("td:eq(3)").text();
    var evt2 = $(this).find("td:eq(4)").text();
    tm.evt1Pts = evt1 === dsa.eventNotPlayedText ? -1 : parseInt(evt1);
    tm.evt2Pts = evt2 === dsa.eventNotPlayedText ? -1 : parseInt(evt2);
    tm.isAutoQualified = ($(this).find("td:eq(5)").text().indexOf(dsa.notAutoQualifiedText) === -1);
    tm.agePts = parseInt($(this).find("td:eq(7)").text());
    tm.eventsPlayed = tm.evt1Pts === -1 ? 0 : (tm.evt2Pts === -1 ? 1 : 2);
    
    teams.push(tm);
});

// Now run through them all and do the computation
// I separated this into two passes so it would be easier to modify to account for all teams' scores
// in computing a midpoint if anyone really wanted to get creative in their computing of levels
var counts = { in: 0, likely: 0, bubble: 0, unlikely: 0, out: 0};
for (var i = 0; i < teams.length; i++) {
    var likelyLevel = "";
    if (teams[i].isAutoQualified) {
        likelyLevel = "in";
    } else {
        var likelyPts = dsa.computeLikelyFinalPoints(teams[i].evt1Pts, teams[i].evt2Pts, teams[i].currPts, teams[i].agePts);
        var likelyLevel = dsa.guessLevel(likelyPts, teams[i].eventsPlayed);
    }
    teams[i].row.css("background-color", dsa.colors[likelyLevel]);
    counts[likelyLevel]++;
}
console.log(counts);

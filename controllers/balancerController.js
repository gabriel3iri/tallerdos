var MathService = require('../service/mathService')
	,TwitterService = require('../service/twitterService')
	,DBService = require('../service/DBService')
    ,TimelineService = require('../service/timelineService')
	,mongoose = require('mongoose')
	,Twitter = require('twitter');
	var Promise = require('bluebird');
	
	Promise.promisifyAll(mongoose);
	
	
	
// Request
var request = require("request");

// Busco los nodos conocidos
var knownNodesFile = 'knownNodes.json';
var fs = require('fs');
var known = JSON.parse(fs.readFileSync(knownNodesFile, 'utf8'));

/*
 * Consulta el estado de cada nodo
 * y agrega un nuevo attributo: status
 * 0: libre
 * 1: ocupado
 * 2: libre - finalizó el proceso anterior
 * 3: apagado
 */

// Recorre el array de nodos async
exports.checkNodes = function(){
	_checkNodes(known.nodes, function (nodo) {
    requestString = nodo.protocol + '://' + nodo.host+ ':' + nodo.port  + '/status';
    request(requestString, function(error, response, body) {
        //console.log(requestString);
        if(!error){
            //console.log(body);
            var jsonResponse = JSON.parse(body);
            //console.log(jsonResponse);
            nodo.status = jsonResponse.status;
        }else{
            //console.log('Nodo no disponible', error);
            nodo.status = 3;
        }
        console.log(nodo);
    });
});
}
function _checkNodes(items, process) {
//	console.log(items);
 //   var todo = items.concat();
    setTimeout(function() {
        process(items.shift());
        if(items.length > 0) {
            setTimeout(arguments.callee, 25);
        }
    }, 25);
}

exports.llamaTimeLine = function(screenName) {
    return TimelineService.getIntervalsArray(screenName);
}
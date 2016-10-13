var SearchService = require('../../service/balancer/searchService')
	,UtilService = require('../../service/util/utilService')
	,mongoose = require('mongoose');
var Promise = require('bluebird');

Promise.promisifyAll(mongoose);
// Request
var request = require("request");
// Busco los nodos conocidos
var knownNodesFile = 'knownNodes.json';
var fs = require('fs');
var known = JSON.parse(fs.readFileSync(knownNodesFile, 'utf8'));
var currentSearches = [];

exports.search = function(query) {
    return new Promise(function(resolve, reject) {
        SearchService.getIntervalsArray(query)
				.then(function(intervals){
					console.log("intervals",intervals);
					//Meto en una cola para que cuando pueda lo mande a algun nodo
					for(index in intervals){
						currentSearches.push(intervals[index]);
					}
					resolve('Se encolo la busqueda ',intervals);
				})
    });
}

function _sendRequests(){
		console.log("Chequea busquedas pendientes");
		if(currentSearches.length>0){
			//Si tengo algo para buscar, entonces chequeo el estado de los nodos
			UtilService.checkNodes(known.nodes,
				function(nodes){//es el callback
					for(var i=0;i<nodes.length;i++){
						var nodo = nodes[i];
						//si encuentro uno libre entonces mando el request
						if(nodo.status==0){
							var requestNodo = nodo.protocol + '://' + nodo.host+ ':' + nodo.port
															+ '/search?query='+currentSearches[0].query
															+"&since="+currentSearches[0].since
															+"&until="+currentSearches[0].until;
							console.log("pide la request ",requestNodo);
							callNode(requestNodo);
							currentSearches.shift();
							//TODO agregar a una cola de busquedas activas
							if(currentSearches.length==0){
								//Ver como cortar si no tiene busquedas encoladas
								break;
							}
						}
					}
				});
		}
}

function initializeRequests(){
	setInterval(_sendRequests, 12000);
}

/*
Llama al nodo con el timeline y el limite que le diga
*/
function callNode(requestNodo){
	request(requestNodo, function(error, response, body) {
		if(!error){
			//No pude hacer que guarde aca porque para las busquedas grandes
			//parece que se va por timeout aca y no espera a la respuesta
			console.log(body);
		}
	});
}

initializeRequests();

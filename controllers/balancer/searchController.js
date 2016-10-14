var SearchService = require('../../service/balancer/searchService')
	,UtilService = require('../../service/util/utilService')
	,DBService = require('../../service/util/DBService')
	,mongoose = require('mongoose')
	,Promise = require('bluebird');

Promise.promisifyAll(mongoose);
// Request
var request = require("request");

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
		console.log("Chequea busquedas pendientes -> Search");
		if(currentSearches.length>0){
			//Si tengo algo para buscar, entonces chequeo el estado de los nodos
			UtilService.checkNodes(
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
							var aliveSearch = {
								query				: currentSearches[0].query,
								since				: currentSearches[0].since,
								until				: currentSearches[0].until,
								request     : requestNodo,
								protocolo		:	nodo.protocol,
								host				: nodo.host,
								port				: nodo.port,
								type        : 'search',
								date        : UtilService.getCurrentDate()
							};
							var _id ;
							DBService.registerAliveSearch(aliveSearch)
							.then(function(id){
								_id = id;
								requestNodo =requestNodo+"&_id="+_id;
								callNode(requestNodo);
								currentSearches.shift();

								if(currentSearches.length==0){
									//Ver como cortar si no tiene busquedas encoladas
									//break;
									i=nodes.length;
								}
							});

						}
					}
				});
		}
}

function checkAliveSearches(){
	console.log("Chequea las busquedas vivas");
}
function initializeRequests(){
	setInterval(_sendRequests, 12000);
	setInterval(checkAliveSearches, 15000);
}

/*
Llama al nodo con el search y el rango definido de fechas
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
//no lo hago empezar de una porque sino el del timeline
// se ejecuta en el mismo momento
setTimeout(function(){ initializeRequests(); }, 5000);

var SearchService = require('../../service/balancer/searchService')
	,UtilService = require('../../service/util/utilService')
	,DBService = require('../../service/util/DBService')
	,Promise = require('bluebird');

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

function sendRequests(){
		console.log("Chequea busquedas pendientes -> Search");
		if(currentSearches.length>0){
			//Si tengo algo para buscar, entonces chequeo el estado de los nodos
			UtilService.checkNodes(
				function(nodes){//es el callback
						_sendRequests(nodes);
				});
		}
}


function _sendRequests(nodes){
	var nodo = nodes[0];
	//si encuentro uno libre entonces mando el request
	if(nodo.status==0){
		var requestNodo = nodo.protocol + '://' + nodo.host+ ':' + nodo.port
										+ '/search?query='+currentSearches[0].query
										+"&since="+currentSearches[0].since
										+"&until="+currentSearches[0].until;
		//Estructura para registrar la busqueda activa
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
			//Le concateno al request el id para que el nodo sepa informarlo
			//en el estado y para que la marque cuando termina
			requestNodo =requestNodo+"&_id="+_id;
			//Mando al nodo libre que encontre
			callNode(requestNodo);
			//quito de la cola a la busqueda que mande
			currentSearches.shift();
			if(currentSearches.length>0){
				//quito el nodo que ya use
				nodes.shift();
				//si hay todavia nodos disponibles sigo
				if(nodes.length>0){
					_sendRequests(nodes);
				}
			}
		});
	}else{
		//si el primero nodo esta ocupado sigo con los demas
		nodes.shift();
		if(nodes.length>0){
			_sendRequests(nodes);
		}
	}
}

function checkAliveSearches(){
	console.log("Chequea las busquedas vivas");
	//Pido las busquedas activas a la DB
	DBService.getAliveSearch()
		.then(function(data){
			for(index in data){
				//Por cada una chequeo si sigue con esa busqueda
				sigueVivo(data[index])
					.then(function(sigue){
						if(!sigue){
							//Si no sigue la encolo otra vez porque quedo inconsistente
							var search = {query:data[index].query
														,since:data[index].since
														,until: data[index].until};
							console.log("Recupera la busqueda ", search);
							DBService.removeAliveSearch(data[index]._id)
							.then(function(){
								currentSearches.push(search);
							});
						}
					})
			}
		});

}

function sigueVivo(nodo){
	return new Promise(function(resolve, reject) {
		var requestString = nodo.protocolo + '://' + nodo.host+ ':' + nodo.port  + '/status';
		request(requestString, function(error, response, body) {
			if(!error){
				console.log("body ",body);
				var jsonResponse = JSON.parse(body);
				var status = jsonResponse.status;
				var id = jsonResponse.currentId;
				console.log("id ",id,"nodo._id ",nodo._id);
				if(id != nodo._id){
					console.log("devuelve false");
					resolve(false);
				}else{
					resolve(true);
				}
			}else{
				resolve(false);
			}
		});
	});
}
function initializeRequests(){
	setInterval(sendRequests, 12000);
	//setInterval(checkAliveSearches, 20000);
}

/*
Llama al nodo con el search y el rango definido de fechas
*/
function callNode(requestNodo){
	console.log("pide la request ",requestNodo);
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

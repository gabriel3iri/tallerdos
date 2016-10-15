var TimelineService = require('../../service/balancer/timelineService')
	,UtilService = require('../../service/util/utilService')
	,DBService = require('../../service/util/DBService');

var Promise = require('bluebird');

var request = require("request");

var currentSearches = [];

exports.llamaTimeLine = function(screenNames) {
		//No vamos a necesitar mas pedir el perfil de cada usuario
		//Por ahora dejo que puedan pedir mas de un screen_name separados por '*'
    return new Promise(function(resolve, reject) {
			  var users = screenNames.split("*");
        TimelineService.getIntervalsArray(users,function(intervals){
					//Meto en una cola para que cuando pueda lo mande a algun nodo
					for(index in intervals){
						currentSearches.push(intervals[index]);
					}
					resolve('Se encolo la busqueda ',intervals);
				})
    });
}

function sendRequests(){
		console.log("Chequea busquedas pendientes -> Timeline");
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
										+ '/timeline?screen_name='+currentSearches[0].screen_name
										+"&since_id="+currentSearches[0].since_id;
		var aliveSearch = {
			screen_name	: currentSearches[0].screen_name,
			since_id		: currentSearches[0].since_id,
			request     : requestNodo,
			protocolo		:	nodo.protocol,
			host				: nodo.host,
			port				: nodo.port,
			type        : 'timeline',
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


function initializeRequests(){
	setInterval(sendRequests, 12000);
}

/*
Llama al nodo con el timeline y el limite que le diga
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

initializeRequests();

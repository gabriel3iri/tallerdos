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
					resolve('Se encola la peticion');
				})
    });
}

function sendRequests(){
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


function checkAliveTimelines(){
	//Pido las busquedas activas a la DB
	DBService.getAliveSearch("timeline")
		.then(function(data){
			if(data.length>0){
				_checkAliveSearches(data);
			}
		});

}

function _checkAliveSearches(data){
	//Por cada una chequeo si sigue con esa busqueda
	UtilService.sigueVivo(data[0])
		.catch(function(er){
			console.log(er);
				//Si no sigue la encolo otra vez porque quedo inconsistente
				//{screen_name:currentUser,since_id:maxId}
				var search = {screen_name:data[0].screen_name
											,since_id:data[0].since_id};
				console.log("Recupera la busqueda ", search);
				DBService.removeAliveSearch(data[0]._id)
				.then(function(){
					currentSearches.push(search);
					data.shift();
					if(data.length>0){
						_checkAliveSearches(data);
					}
				})
				.catch(function(err){
					console.log("Fallo el remove", err);
				});;
		})
		.finally(function(){
			data.shift();
			if(data.length>0){
				_checkAliveSearches(data);
			}
		});
}


function initializeRequests(){
	setInterval(sendRequests, 12000);
	setInterval(checkAliveTimelines, 19000);

}

/*
Llama al nodo con el timeline y el limite que le diga
*/
function callNode(requestNodo){
	console.log("Get ",requestNodo);
	request(requestNodo, function(error, response, body) {
		if(!error){
			//No pude hacer que guarde aca porque para las busquedas grandes
			//parece que se va por timeout aca y no espera a la respuesta
			console.log(body);
		}
	});
}

initializeRequests();

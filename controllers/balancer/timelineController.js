var TimelineService = require('../../service/balancer/timelineService')
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
var nodes = [];



exports.llamaTimeLine = function(screenNames) {
    var interval;
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

/*
 * Consulta el estado de cada nodo
 * y agrega un nuevo attributo: status
 * 0: libre
 * 1: ocupado
 * 2: apagado
 */
function _checkNodes(items, index,callBack) {
	var nodo = items[index];
	var requestString = nodo.protocol + '://' + nodo.host+ ':' + nodo.port  + '/status';
	request(requestString, function(error, response, body) {
		if(!error){
				var jsonResponse = JSON.parse(body);
				nodo.status = jsonResponse.status;
		}else{
				nodo.status = 2;
		}
		//es el array con los nodos actualizados con el estado
		nodes.push(nodo);
		index++;
		if(items.length > index) {
			_checkNodes(items, index,callBack)
		}else{
			callBack();
		}
	});
}

function _sendRequests(){
		console.log("Chequea busquedas pendientes");
		if(currentSearches.length>0){
			nodes= [];
			//Si tengo algo para buscar, entonces chequeo el estado de los nodos
			_checkNodes(known.nodes,0,
				function(){//es el callback
					for(var i=0;i<nodes.length;i++){
						var nodo = nodes[i];
						//si encuentro uno libre entonces mando el request
						if(nodo.status==0){
							var requestNodo = nodo.protocol + '://' + nodo.host+ ':' + nodo.port
															+ '/timeline?screen_name='+currentSearches[0].screen_name
															+"&since_id="+currentSearches[0].since_id;
							console.log("pide la request ",requestNodo);
							callNode(requestNodo,currentSearches[0].screen_name);
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
function callNode(requestNodo,screen_name){
	request(requestNodo, function(error, response, body) {
		if(!error){
			//No pude hacer que guarde aca porque para las busquedas grandes
			//parece que se va por timeout aca y no espera a la respuesta
			console.log(body);
		}
	});
}

initializeRequests();

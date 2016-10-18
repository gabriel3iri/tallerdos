var request = require("request");
var Promise = require('bluebird');
var nodes ;
// Busco los nodos conocidos
var knownNodesFile = 'config/nodes/knownNodes.json';
var fs = require('fs');
var known = JSON.parse(fs.readFileSync(knownNodesFile, 'utf8'));


exports.sigueVivo = function (nodo){
	return new Promise(function(resolve, reject) {
		var requestString = nodo.protocolo + '://' + nodo.host+ ':' + nodo.port  + '/status';
		request(requestString, function(error, response, body) {
			if(!error){
				var jsonResponse = JSON.parse(body);
				var status = jsonResponse.status;
				var id = jsonResponse.currentId;
				if(id != nodo._id){
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



exports.checkNodes = function(callBack){
	nodes= [];
	_checkNodes (known.nodes, 0,callBack);
}

exports.getCurrentDate = function(){
	var currentDate =new Date();
	currentDate.setUTCHours(7);
	currentDate =currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+(currentDate.getDate());
	return currentDate;
}

exports.decDay = function (date) {
    var result = new Date(date);
    result.setUTCHours(7);
    result.setDate(result.getDate() -1);
    return result.getFullYear()+"-"+(result.getMonth()+1)+"-"+result.getDate();
}

exports.addDay = function (date) {
    var result = new Date(date);
    result.setUTCHours(7);
    result.setDate(result.getDate() +1);
    return result.getFullYear()+"-"+(result.getMonth()+1)+"-"+result.getDate();
}

exports.parseDate = function(result){
	result.setUTCHours(7);
	return result.getFullYear()+"-"+(result.getMonth()+1)+"-"+result.getDate();
}

// Retorna la diferencia en días entre dos fechas
exports.getDaysDiff = function (sinceDate, toDate) {
    var oneDay = 24*60*60*1000;	// hours*minutes*seconds*milliseconds
    var sinceDate = new Date(sinceDate);
    var toDate = new Date(toDate);
    return Math.abs((sinceDate.getTime() - toDate.getTime())/(oneDay));
}

function _checkNodes (items, index,callBack) {
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
			callBack(nodes);
		}
	});
}

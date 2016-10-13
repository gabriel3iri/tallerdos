var request = require("request");
var nodes ;
exports.checkNodes = function(items,callBack){
	nodes= [];
	_checkNodes (items, 0,callBack);
}


exports.decDay = function (date) {
    var result = new Date(date);
    result.setUTCHours(10);
    result.setDate(result.getDate() -1);
    return result.getFullYear()+"-"+(result.getMonth()+1)+"-"+result.getDate();
}

exports.addDay = function (date) {
    var result = new Date(date);
    result.setUTCHours(10);
    result.setDate(result.getDate() +1);
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

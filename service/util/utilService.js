var request = require("request");
var nodes ;
exports.checkNodes = function(items,callBack){
	nodes= [];
	_checkNodes (items, 0,callBack);
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

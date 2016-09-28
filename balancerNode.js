
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
checkNodes(known.nodes, function (nodo) {
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

// Recorre el array de nodos async
function checkNodes(items, process) {
    var todo = items.concat();
    setTimeout(function() {
        process(todo.shift());
        if(todo.length > 0) {
            setTimeout(arguments.callee, 25);
        }
    }, 25);
}

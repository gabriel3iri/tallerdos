// Me pasan el puerto por parámetro
if(process.argv.length==3){
	var port = process.argv[2];
} else {
	console.log("Falta especificar el puerto");
	return;
}

//Required Section
var express = require("express")
	,app = express()
    ,bodyParser  = require("body-parser")
    ,methodOverride = require("method-override")
	,balancerController = require('./controllers/balancerController');


//**********Definicion de Funciones****************************

(function(){
	// Armo el server
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(methodOverride());

	var router = express.Router();
	router.get('/', function(req, res) {
		res.send("<h1>Este es el Nodo Balanceador</h1>"+
					"<ul><li>/timeline?screen_name -> para pedir el timeline de un usuario. "+
					" Ejemplo http://localhost:7777/timeline?screen_name=larocapuerca*castordecrema*BassTincho</li>"+
					"<li>/search?query -> para buscar por palabra clave </li></ul>");
	});

	router.get('/timeline', function(req, res) {
		//EJEMPLO DE REQUEST A CORRER:
		//http://localhost:7777/timeline?screen_name=larocapuerca*castordecrema*BassTincho
		if(req.query.screen_name !== undefined){
			// hago el .then del promise del llamaTimeline
			balancerController.llamaTimeLine(req.query.screen_name)
				.then(function (result) {
					console.log('interval ',result);
				});
			res.send("Process running in background.");
		}else{
			res.send("Not enough params.");
		}
	});

	app.use(router);

	app.listen(port, function() {
		console.log("Node server running on http://localhost:" + port);
	});

})();

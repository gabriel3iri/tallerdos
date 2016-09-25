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
	,twitterController = require('./controllers/twitterController');
	
//Other variables
var nodeStatus = {status: 0, msg: "Nodo libre"};
	
//**********Definicion de Funciones****************************

function createServer(){
	// Armo el server
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(methodOverride());

	var router = express.Router();
	router.get('/', function(req, res) {
		res.send("Hello World!");
	});

	router.get('/status', function(req, res) {
		res.send(nodeStatus);
	});

	router.get('/timeline', function(req, res) {
		//console.log(req.query);
		if(
			(req.query.screen_name !== undefined) &&
			(req.query.since_id !== undefined) &&
			(req.query.max_id !== undefined)
		){
			var params = {screen_name: req.query.screen_name,
							since_id:req.query.since_id,
							max_id: req.query.max_id};
			twitterController.llamaTimeLine(params,nodeStatus, function(){});
			res.send("Process running in background.");
		}else{
			res.send("Not enough params.");
		}
	});
	
	app.use(router);

	app.listen(port, function() {
		console.log("Node server running on http://localhost:" + port);
	});	
}

//**********FIN Definicion de Funciones****************************


//*********Work Flow************
createServer();

//*********FIN Work Flow************

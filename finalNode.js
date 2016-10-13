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
	,twitterController = require('./controllers/nodes/twitterController');
var TimelineService = require('./service/balancer/timelineService');
var SearchService = require('./service/balancer/searchService');



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
		res.send("Node working");
	});

	router.get('/status', function(req, res) {
		res.send(nodeStatus);
	});

	router.get('/timeline', function(req, res) {
		if(nodeStatus.status == 1){
			res.send(nodeStatus.msg);
		} else {
			//console.log(req.query);
			if (
				(req.query.screen_name !== undefined) &&
				(req.query.since_id !== undefined)
			) {
				var params = {
					screen_name: req.query.screen_name
					,since_id: req.query.since_id
					,count: 200
				};
				res.send("busqueda realizandose en background");
				console.log("params",params);
				twitterController.llamaTimeLine(params, nodeStatus,port, function() {
					nodeStatus.status = 0;
					nodeStatus.msg = 'Nodo Libre';
					console.log("Termino la busqueda");
					//Tuve que hacer esto aca porque si tarda se va por timeout
					//el response
					TimelineService.lookForMaxResult(req.query.screen_name)
						.then(function(maxId){
							var date = new Date();
							var currentDate = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
							var finishSearch = {
																	screen_name:req.query.screen_name
																	,date:currentDate
																	,max_id:maxId
																 };
							TimelineService.registerFinishSearch(finishSearch);
						});
				});

			} else {
				res.send("Faltan parámetros. Debes especificar: screen_name, since_id, max_id");
			}
		}
	});

	router.get('/search', function(req, res) {
		if(nodeStatus.status == 1){
			res.send(nodeStatus.msg);
		} else {
			console.log(req.query);
			if(req.query.query !== undefined
				&&req.query.since !== undefined
				&&req.query.until !== undefined
				){
				var params = {
								q: req.query.query
								,count:100
								,since: req.query.since
								,until: req.query.until
				};
				console.log("params",params);
				twitterController.llamaSearchTweet(params, nodeStatus,port,function(){
					nodeStatus.status = 0;
					nodeStatus.msg = 'Nodo Libre';
					var finishSearch = {
															query :req.query.query
															,since: req.query.since
															,until: req.query.until
														 };
					SearchService.registerFinishSearch(finishSearch);
					console.log("termino");
				});
			}else{
				res.send("Faltan parámetros. Debes especificar: q");
			}
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

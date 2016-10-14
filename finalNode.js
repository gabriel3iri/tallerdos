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
var DBService = require('./service/util/DBService');




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
				var _id = req.query._id;

				var params = {
					screen_name: req.query.screen_name
					,since_id: req.query.since_id
					,count: 200
				};
				res.send("busqueda realizandose en background");
				console.log("params",params);
				nodeStatus.currentId = _id;
				twitterController
					.llamaTimeLine(params,nodeStatus,port
												 ,function(){
													 twitterController.toFinishTimeline(nodeStatus,req.query.screen_name,_id);
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
				var _id = req.query._id;
				var query =  req.query.query.replace(/-/g, ' ');
				var params = {
								q: query
								,count:100
								,since: req.query.since
								,until: req.query.until
				};
				console.log("params",params);
				nodeStatus.currentId = _id;
				twitterController
					.llamaSearchTweet(params, nodeStatus,port,
														function(){
															twitterController
														 .toFinishSearch(nodeStatus
															 							,query
																						,req.query.since
																						,req.query.until
																						,_id);
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

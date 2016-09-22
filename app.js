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
	,Twitter = require('twitter')
	,mongoose = require('mongoose')
	,MathService = require('./service/mathService')
	,DBService = require('./service/DBService')
	,TwitterService = require('./service/twitterService');

	
//Other variables
var credentialNumber
	,client
	,nodeStatus
	,bigData
	,smallData
	,tuitSchema
	,Tuit
	,credentials;

	
//**********Definicion de Funciones****************************
/*
 * Método statuses/user_timeline de la API
 */
function llamaTimeLine(llamar, metodo, params){
    // Cambio el estado del nodo
    nodeStatus.status = 1;
	client.get(metodo, params, function(error, tweets, response){
		//console.log("Iniciando la recolección...");
		var date = new Date();
		var time = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
		if (!error) {
			//console.log("length", tweets.length);
			//console.log("tw", tweets);
			if(tweets.length){
				//recorro los 20 tweets que da la API por página
				for(t in tweets){
					// console.log(parseInt(t)+1,tweets[t].id_str, tweets[t].created_at,tweets[t].text);
					//console.log('Tuit encontrado:', parseInt(t)+1,tweets[t].id_str, tweets[t].created_at);
					var maxId = MathService.stringDec(tweets[t].id_str) ;
					//Defino el objeto, que coincide con el schema de mogoose
					tweet = {
						twid: tweets[t].id_str,
						screen_name: tweets[t].user.screen_name,
						text: tweets[t].text,
						date: tweets[t].created_at
					};
					if(t == 1) {
                        nodeStatus.msg = 'Procesando tuit ' + tweet.twid;
						console.log('Analizando: ' + tweet.twid + ' ...');
					}
					//Acá meto el tuit en el schema que creé al principio
					var newTuit = new Tuit(tweet);
					//y lo guardo
					newTuit.save(function(err) {
						if (!err) {
							// If everything is cool, socket.io emits the tweet.
							//console.log('Tuit ' + tweets[t].id_str + ' saved successfully.');
						}
					});
				}

				params.max_id = maxId;
				//console.log('Ejecutado correctamente', time);
			}else{
				//cuando la request viene vacía
				llamar = false;
                nodeStatus.status = 2;
                nodeStatus.msg = 'Finalizó el proceso de la query: ' + params.screen_name + ' [' + params.since_id+ ', ' + params.max_id + ']';
            }
		}else{
			//Se agotaron las peticiones para el token actual, pruebo con otro token
			console.log('Error: ',error);
			var nextCredential = getNextCredential();
			client = new Twitter(credentials[nextCredential]);
            nodeStatus.msg = 'Cambiando a las credenciales ' + nextCredential;
			console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
			//llamar = false;
		}
		if(llamar){
			llamaTimeLine(true, metodo, params);
		}else{
			//Terminó. Entonces tiene que empezar a pasar todo
			exportToBigdata();
		}
	});
}

/*
 * API Search de Twitter
 */
function llamaSearchTweet(x){
	client.get(metodo, params, function(error, tweets, response){
		var date = new Date();
		var time = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
        if (!error) {
            for(t in tweets.statuses) {
                console.log(parseInt(t) + 1, tweets.statuses[t].id, tweets.statuses[t].text);
            }
            console.log(x,'Ejecutado correctamente', time);
        }else{
			console.log(x,'Excedido request ',time);
        }
	});
}

// Paso a la siguiente credencial en el array de credenciales
function getNextCredential() {
    if(credentialNumber < credentials.length){
        credentialNumber = credentialNumber+1;
        return credentialNumber;
    }
    return 0;
}

// Exporta los documentos de la collection local a bigdata
function exportToBigdata() {
    var allTuits = new Array();
    Tuit.find({}, '', function (err, tuit) {
        allTuits.push(tuit);
    });
}


function createServer(){
	// Armo el server
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(methodOverride());

	var router = express.Router();
	router.get('/', function(req, res) {
		res.send("Hello World!");
	});

	app.use(router);

	app.listen(port, function() {
		console.log("Node server running on http://localhost:" + port);
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
			var metodo = 'statuses/user_timeline';
			llamaTimeLine(true, metodo, params);
			res.send("Process running in background.");
		}else{
			res.send("Not enough params.");
		}
	});
}

function initializeTwitter (){
	credentialNumber = 0;
	credentials = TwitterService.getCredentials();
	// Instancio el cliente de Twitter con la primer credencial
	client = new Twitter(credentials[credentialNumber]);
}

function initializeDB(){
	// MongoDB connection a big data
	bigData = 'mongodb://localhost/bigdata';
	// MongoDB connection a base de datos local
	smallData = 'twitter';
	tuitSchema = new mongoose.Schema({
		twid       : String,
		screen_name : String,
		text       : String,
		date       : Date
	});
	Tuit = mongoose.model('Tuit', tuitSchema);
	// Conexión a la DB por medio de mongoose
	DBService.connectTo(smallData);
	
	DBService.cleanData(Tuit,smallData);
	
}
function initializeVariables(){
	initializeTwitter();
	initializeDB();
	nodeStatus = {status: 0, msg: "Nodo libre"};
	
}	
//**********FIN Definicion de Funciones****************************


//*********Work Flow************
initializeVariables();
createServer();

//*********FIN Work Flow************

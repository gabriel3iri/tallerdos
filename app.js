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
	,MathService = require('./service/mathService');
	
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

function cleanData(){
	// Se vacía la base de datos temporal
	Tuit.remove({}, function (err) {
		if(!err){
			console.log('DB ' + smallData + ' cleaned succesfully')
		}else{
			console.log(err);
		}
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

function initializeVariables(){
	credentials= new Array(
		{
			consumer_key: '0koJJXFOFhm830HVXYvjLWO2S',
			consumer_secret: 'YIty1aj6uKYSRJTgUEkS6w36hKwuyvZdJPLhIq2Pnc7p3PEhI5',
			access_token_key: '142500277-MNDZxM1moBIWCjvcvCpCfhqNy3Jj0mUYnjsWyFCi',
			access_token_secret: 'nnieHsh1TzvAVxDC6Z8EQ4Xc4DiWtVBPaQn9CE8rhWLJG'},
		{
			consumer_key: 'uzxEhMcd78wlY6jG8f2A',
			consumer_secret: 'L1M6cbjXQB69218oJbEi1E2SuD53sIsaGmuO0n2jXk',
			access_token_key: '762504943-2julQvMq2z22JHWBGGi4EZlOeVnbldq5O1ABlK3e',
			access_token_secret: 'AFsqwg0a3g9ZXY3vZL5NmhPdLuAdoQt6wWjuk5bAg'},
		{
			consumer_key: 'Lt1THtQDHVUZNmVu1MSnjQ',
			consumer_secret: '1D2HIJr9mJ45hPC4ZPLI2s3vRv2I3b3Vsh6yDBjhk0',
			access_token_key: '762504943-CFZ5RECfW6CvqWQlMEKAM6gYd8MOlgs7qQp9zCkl',
			access_token_secret: 'galU64ISQepz0kZKeOfT9MzFIkVuRxWvwtZLWqdCij4'},
		{
			consumer_key: '3NRvOVtfk8jcqwSdflKc2yLiP',
			consumer_secret: 'AlmHcJ5LQi9Ye9zuwHRbvAPNt344hT3w5vuLbL68xVd7FkMnXq',
			access_token_key: '762504943-swMOhfEz0oDFRG9TISMaEhWKoTwlYsSwZYo8quRF',
			access_token_secret: '7lCqO3bUIG5SkP3qhuPVbNimy1P2lOrPtuqgzDDiqYRob'},
		{
			consumer_key: 'qIh0mbXGhkWWyXW6nvymd2AQW',
			consumer_secret: '6Oe9Kz0eFLnbs1snSEZEyTT1M0vArk8lnFIq7JE6LSxs7kbQzP',
			access_token_key: '762504943-8TOy7ogygWjIC5VpNonjWyEvuD6Apvdf8Y2S5Gmu',
			access_token_secret: 'Vs0iz7PowN8wm5OesQFPN32uraKAjCtyNh20yTzL4gneU'}
		);
	
	credentialNumber = 0;
	// Instancio el cliente de Twitter con la primer credencial
	client = new Twitter(credentials[credentialNumber]);

	nodeStatus = {status: 0, msg: "Nodo libre"};

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
	mongoose.connect('mongodb://localhost/' + smallData);
	
	cleanData();
}	
//**********FIN Definicion de Funciones****************************


//*********Work Flow************
initializeVariables();
createServer();

//*********FIN Work Flow************

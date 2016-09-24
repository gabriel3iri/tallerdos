var MathService = require('../service/mathService')
	,TwitterService = require('../service/twitterService')
	,DBService = require('../service/DBService')
	,mongoose = require('mongoose')
	,Twitter = require('twitter');

var credentialNumber
	,credentials
	,client
	,bigData
	,smallData
	,tuitSchema
	,Tuit
	,tweet;

exports.llamaTimeLine = function (params,nodeStatus){
	_llamaTimeLine(params,nodeStatus);
}
	
	
/*
 * Método statuses/user_timeline de la API
 */
function _llamaTimeLine  (params,nodeStatus){
    var metodoApi = 'statuses/user_timeline';
	var newTuit
		,nextCredential
		,date
		,time
		,seguir
		,maxId;
		
	// Cambio el estado del nodo
    nodeStatus.status = 1;
	seguir =true;
	client.get(metodoApi, params, function(error, tweets, response){
		//console.log("Iniciando la recolección...");
		date = new Date();
		time = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
		if (!error) {
			//console.log("length", tweets.length);
			//console.log("tw", tweets);
			if(tweets.length){
				//recorro los 20 tweets que da la API por página
				for(t in tweets){
					maxId = MathService.stringDec(tweets[t].id_str) ;
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
					newTuit = new Tuit(tweet);
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
				seguir = false;
                nodeStatus.status = 2;
                nodeStatus.msg = 'Finalizó el proceso de la query: ' + params.screen_name + ' [' + params.since_id+ ', ' + params.max_id + ']';
            }
		}else{
			//Se agotaron las peticiones para el token actual, pruebo con otro token
			console.log('Error: ',error);
			nextCredential = getNextCredential();
			client = new Twitter(credentials[nextCredential]);
            nodeStatus.msg = 'Cambiando a las credenciales ' + nextCredential;
			console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
			//llamar = false;
		}
		if(seguir){
			_llamaTimeLine(params,nodeStatus);
		}else{
			//Terminó. Entonces tiene que empezar a pasar todo
			exportToBigdata();
		}
	});
}

/*
 * API Search de Twitter
 */
function _llamaSearchTweet(x){
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


function initializeTwitter (){
	credentialNumber = 0;
	credentials = TwitterService.getCredentials();
	// Instancio el cliente de Twitter con la primer credencial
	client = new Twitter(credentials[credentialNumber]);
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
	console.log("exportando a bigData");
    var allTuits = new Array();
    Tuit.find({}, '', function (err, tuit) {
        allTuits.push(tuit);
    });
}


initializeTwitter();
initializeDB();

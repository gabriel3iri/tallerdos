var MathService = require('../service/mathService')
	,TwitterService = require('../service/twitterService')
	,DBService = require('../service/DBService')
	,mongoose = require('mongoose')
	,Twitter = require('twitter');
	var Promise = require('bluebird');

	Promise.promisifyAll(mongoose);

var credentialNumber
	,credentials
	,client
	,bigData
	,smallData
	,tuitSchema
	,tuitDBSmall
	,tuitDBBig
	,twee
	,connSmall
	,connBig;

exports.llamaTimeLine = function (params,nodeStatus){
	//Vacio la base temporal en cada vuelta
	DBService.cleanData(tuitDBSmall,smallData);
	_llamaTimeLine(params,nodeStatus);
}

exports.llamaSearchTweet = function (params,nodeStatus){
	//Vacio la base temporal en cada vuelta
	DBService.cleanData(tuitDBSmall,smallData);
	_llamaSearchTweet(params,nodeStatus);
}

/*
 * Método statuses/user_timeline de la API
 */
function _llamaTimeLine (params,nodeStatus){
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
					//maxId = MathService.stringDec(tweets[t].id_str) ;
					maxId =tweets[t].id_str;
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
					//Acá meto el tuit en el schema que creó al principio
					newTuit = new tuitDBSmall(tweet);
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
                nodeStatus.status = 0;
                nodeStatus.msg = "Nodo libre";
            }
		}else{
			//Se agotaron las peticiones para el token actual, pruebo con otro token
			console.log('Error: ',error);
			nextCredential = getNextCredential();
            credentialNumber = nextCredential;
			client = new Twitter(credentials[nextCredential]);
            nodeStatus.msg = 'Cambiando a las credenciales ' + nextCredential;
			console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
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
function _llamaSearchTweet(params,nodeStatus){
	var metodoApi = 'search/tweets';
	var newTuit
		,nextCredential
		,seguir
		,maxId;

	// Cambio el estado del nodo
	nodeStatus.status = 1;
	seguir =true;
	client.get(metodoApi, params, function(error, tweets, response){
        if (!error) {
            //console.log(tweets);
            console.log('Procesando ' + tweets.statuses.length + ' tweets');
            // Pagina de a 15 tweets
			if(tweets.statuses.length){
				for(t in tweets.statuses) {
				    maxId = MathService.stringDec(tweets.statuses[t].id_str) ;
                    console.log(parseInt(t) + 1, tweets.statuses[t].id_str);//Defino el objeto, que coincide con el schema de mogoose
                    tweet = {
                        twid: tweets.statuses[t].id_str,
                        screen_name: tweets.statuses[t].user.screen_name,
                        text: tweets.statuses[t].text,
                        date: tweets.statuses[t].created_at
                    };
                    if(t == 1) {
                        nodeStatus.msg = 'Procesando tuit ' + tweet.twid;
                        console.log('Analizando: ' + tweet.twid + ' ...');
                    }
                    //Acá meto el tuit en el schema que creó al principio
                    newTuit = new tuitDBSmall(tweet);
                    //y lo guardo
                    newTuit.save(function(err) {
                        if (!err) {
                            // If everything is cool, socket.io emits the tweet.
                            //console.log('Tuit ' + tweets.statuses[t].id_str + ' saved successfully.');
                        }
                    });
				}

                params.max_id = maxId;
			}else{
				//cuando la request viene vacía
				console.log('Finalizó el proceso',params.q);
				seguir = false;
				nodeStatus.status = 2;
				nodeStatus.msg = 'Finalizó el proceso de la query: ' + params.q;
			}
        }else{
			//Se agotaron las peticiones para el token actual, pruebo con otro token
			console.log('Error: ',error);
			nextCredential = getNextCredential();
            credentialNumber = nextCredential;
			client = new Twitter(credentials[nextCredential]);
			nodeStatus.msg = 'Cambiando a las credenciales ' + nextCredential;
			console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
        }
		if(seguir){
			_llamaSearchTweet(params,nodeStatus);
		}else{
			//Terminó. Entonces tiene que empezar a pasar todo
			exportToBigdata();
		}
	});
}


function initializeDB(){
	// MongoDB connection a big data
	bigData = 'bigdata';
	// MongoDB connection a base de datos local
	smallData = 'twitter';
	connBig      = mongoose.createConnection('mongodb://localhost/'+bigData);
	connSmall     = mongoose.createConnection('mongodb://localhost/'+smallData);
	tuitSchema = new mongoose.Schema({
		twid       : String,
		screen_name : String,
		text       : String,
		date       : Date
	});
	tuitDBSmall = connSmall.model('Tuit', tuitSchema);
	tuitDBBig = connBig.model('Tuit', tuitSchema);
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
    tuitDBSmall.findAsync({}, '')
		.then(function(data){
				for(index in data){
					allTuits.push(data[index]);
				}
				if(allTuits.length>0){
					_exportToBigdata(allTuits);
				}else{
					console.log("La busqueda no arrojó resultados");
				}
		})
		.catch(function(err) {
			console.log("There was an error");
		});
}
function _exportToBigdata(allTuits) {
	var tuitExport;
	var firstTuit ;
	for (firstTuit in allTuits) break;
	tuitExport = new tuitDBBig(allTuits[firstTuit]);
	//Busco que no exista ya en la DB
	tuitDBBig.findAsync({twid:allTuits[firstTuit].twid}, '')
		.then(function(data){
			if(data.length==0){
				console.log("inserta el tuit: ",allTuits[firstTuit].twid);
				tuitExport.save(function(err) {
					if (!err) {
						//console.log('Tuit ' + tweets[t].id_str + ' saved successfully.');
					}
				});
			}else{
				console.log("ya existe el tuit: ",allTuits[firstTuit].twid);
			}
		})
		.catch(function(err) {
			console.log("There was an error");
		})
		.finally(function(){
			//INTENTO BORRAR EL QUE YA ANALIZO. CONTROLAR BIEN ESTO
			delete allTuits[firstTuit];
			if(allTuits.length>(parseInt(firstTuit)+1)){
				_exportToBigdata(allTuits);
			}
		});
}

initializeTwitter();
initializeDB();

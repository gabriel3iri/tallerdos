var MathService = require('../../service/util/mathService')
	,TwitterService = require('../../service/nodes/twitterService')
	,TimelineService = require('../../service/balancer/timelineService')
	,SearchService = require('../../service/balancer/searchService')
	,DBService = require('../../service/util/DBService')
	,mongoose = require('mongoose')
	,Twitter = require('twitter')
	,Promise = require('bluebird');

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
	,connBig
	,fileStructure;

exports.llamaTimeLine = function (params,nodeStatus,nameNodo,cb){
	TwitterService.initialize(nameNodo);
	initializeTwitter();
	tuitDBSmall = connSmall.model('Tuit'+nameNodo, tuitSchema);
	//Vacio la base temporal en cada vuelta
	DBService.cleanData(tuitDBSmall,smallData);
	_llamaTimeLine(params,nodeStatus,cb);
}

exports.llamaSearchTweet = function (params,nodeStatus,nameNodo,cb){
	TwitterService.initialize(nameNodo);
	initializeTwitter();
	tuitDBSmall = connSmall.model('Tuit'+nameNodo, tuitSchema);
	//Vacio la base temporal en cada vuelta
	DBService.cleanData(tuitDBSmall,smallData);
	_llamaSearchTweet(params,nodeStatus,cb);
}

exports.toFinishTimeline = function(nodeStatus,screen_name,_id) {
	nodeStatus.status = 0;
	nodeStatus.msg = 'Nodo Libre';
	nodeStatus.currentId = 0;
	console.log("Termino la busqueda");
	//Tuve que hacer esto aca porque si tarda se va por timeout
	//el response
	TimelineService.lookForMaxResult(screen_name)
		.then(function(maxId){
			var date = new Date();
			var currentDate = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
			var finishSearch = {
													screen_name:screen_name
													,date:currentDate
													,max_id:maxId
												 };
			TimelineService.registerFinishSearch(finishSearch);
			DBService.removeAliveSearch(_id);
		});
};

exports.toFinishSearch = function(nodeStatus,query,since,until,_id){
	nodeStatus.status = 0;
	nodeStatus.msg = 'Nodo Libre';
	nodeStatus.currentId = 0;
	var finishSearch = {
											query : query
											,since: since
											,until: until
										 };
	SearchService.registerFinishSearch(finishSearch);
	DBService.removeAliveSearch(_id);
};
/*
 * Método statuses/user_timeline de la API
 */
function _llamaTimeLine (params,nodeStatus,cb){
  var metodoApi = 'statuses/user_timeline';
	var newTuit
		,nextCredential
		,seguir
		,maxId;
	// Cambio el estado del nodo
  nodeStatus.status = 1;
	seguir =true;
	client.get(metodoApi, params, function(error, tweets, response){
		if (!error) {
			if(tweets.length){
				//recorro los 20 tweets que da la API por página
				for(t in tweets){
					maxId = MathService.stringDec(tweets[t].id_str) ;
					//maxId =tweets[t].id_str;
					//Defino el objeto, que coincide con el schema de mogoose
					tweet = {
						twid: tweets[t].id_str,
						screen_name: tweets[t].user.screen_name.toLowerCase(),
						text: tweets[t].text,
						date: tweets[t].created_at
					};

					for(el in fileStructure){
						for(attr in fileStructure[el]){
							tweet[attr] =  tweets[t][attr];
							}
					}

					if(t == 1) {
          	nodeStatus.msg = 'Procesando tuit ' + tweet.twid;
						console.log('Analizando: ' + tweet.twid + ' ...');
					}
					//Acá meto el tuit en el schema que creó al principio
					newTuit = new tuitDBSmall(tweet);
					//y lo guardo
					newTuit.save(function(err) {
						if (err) {
							console.log("err",err);
						}
					});
				}
				params.max_id = maxId;
			}else{
				//cuando la request viene vacía
				seguir = false;
        }
		}else{
			//user inexistente
			if(error[0].code==34){
					seguir = false;
			}else{
				//Se agotaron las peticiones para el token actual, pruebo con otro token
				console.log('Error: ',error);
				nextCredential = getNextCredential();
	      credentialNumber = nextCredential;
				client = new Twitter(credentials[nextCredential]);
	      nodeStatus.msg = 'Cambiando a las credenciales ' + nextCredential;
				console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
		}
		}
		if(seguir){
			_llamaTimeLine(params,nodeStatus,cb);
		}else{
			//Terminó. Entonces tiene que empezar a pasar todo
			exportToBigdata(cb);
		}
	});
}

/*
 * API Search de Twitter
 */
function _llamaSearchTweet(params,nodeStatus,cb){
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
          console.log('Procesando ' + tweets.statuses.length + ' tweets');
					if(tweets.statuses.length){
						for(t in tweets.statuses) {
					    maxId = MathService.stringDec(tweets.statuses[t].id_str) ;
	            tweet = {
	                twid: tweets.statuses[t].id_str,
	                screen_name: tweets.statuses[t].user.screen_name.toLowerCase(),
	                text: tweets.statuses[t].text,
	                date: tweets.statuses[t].created_at
	            };
							for(el in fileStructure){
								for(attr in fileStructure[el]){
									tweet[attr] =  tweets.statuses[t][attr];
									}
							}


	            if(t == 1) {
	                nodeStatus.msg = 'Procesando tuit ' + tweet.twid;
	                console.log('Analizando: ' + tweet.twid + ' ...');
	            }
	            //Acá meto el tuit en el schema que creó al principio
	            newTuit = new tuitDBSmall(tweet);
	            //y lo guardo
	            newTuit.save(function(err) {
	              if (err) {
									console.log("err",err);
	              }
	            });
						}
						params.max_id = maxId;
					}else{
						//cuando la request viene vacía
						console.log('Finalizó el proceso',params.q);
						seguir = false;
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
				_llamaSearchTweet(params,nodeStatus,cb);
			}else{
				//Terminó. Entonces tiene que empezar a pasar todo
				exportToBigdata(cb);
			}
	});
}

function initializeDB(){
	var structure = {
			twid       : String,
			screen_name : String,
			text       : String,
			date       : Date};
	var tuitStructure = 'config/tweets/tweetStructure.json';
	var fs = require('fs');
	var file = JSON.parse(fs.readFileSync(tuitStructure, 'utf8'));
	fileStructure = file.structure;
	for(el in fileStructure){
		for(attr in fileStructure[el]){
			console.log(attr," ",fileStructure[el][attr]);
			structure[attr] = fileStructure[el][attr];
	    }
	}

	// MongoDB connection a big data
	bigData = 'bigdata';
	// MongoDB connection a base de datos local
	smallData = 'twitter';
	connBig      = mongoose.createConnection('mongodb://localhost/'+bigData);
	connSmall     = mongoose.createConnection('mongodb://localhost/'+smallData);
	tuitSchema = new mongoose.Schema(structure);
	//tuitDBSmall = connSmall.model('Tuit', tuitSchema);
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
function exportToBigdata(cb) {
	console.log("exportando a bigData");
    var allTuits = new Array();
    tuitDBSmall.findAsync({}, '')
		.then(function(data){
				for(index in data){
					allTuits.push(data[index]);
				}
				if(allTuits.length>0){
					_exportToBigdata(allTuits,cb);
				}else{
					console.log("La busqueda no arrojó resultados");
					cb();
				}
		})
		.catch(function(err) {
			console.log("err",err);
		});
}


function _exportToBigdata(allTuits,cb) {
	var currentTuit =	allTuits.shift();
	var tuitExport = new tuitDBBig(currentTuit);
	//Busco que no exista ya en la DB
	tuitDBBig.findAsync({twid:currentTuit.twid}, '')
		.then(function(data){
			if(data.length==0){
				console.log("inserta el tuit: ",currentTuit.twid);
				tuitExport.save(function(err) {
					if (err) {
						console.log("err",err);
					}
				});
			}else{
				console.log("ya existe el tuit: ",currentTuit.twid);
			}
		})
		.catch(function(err) {
			console.log("err",err);
		})
		.finally(function(){
			if(allTuits.length>0){
				_exportToBigdata(allTuits,cb);
			}
			else{
				//Termino, entonces ejecuto el callback
				cb();
			}
		});
}

initializeDB();

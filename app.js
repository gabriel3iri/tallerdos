var express = require("express"),
    app = express(),
    bodyParser  = require("body-parser"),
    methodOverride = require("method-override");

var Twitter = require('twitter');
var mongoose = require('mongoose');
var credentials = new Array(
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
var credentialNumber = 0;
// Instancio el cliente de Twitter con la primer credencial
var client = new Twitter(credentials[credentialNumber]);

// Armo el server
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

var router = express.Router();
router.get('/', function(req, res) {
    res.send("Hello World!");
});

app.use(router);
// Me pasan el puerto por parámetro
if(process.argv.length==3){
    var port = process.argv[2];
} else {
    console.log("Faltan parametros");
    return;
}
app.listen(port, function() {
    console.log("Node server running on http://localhost:" + port);
});

var limite = 1;
/* MongoDB connection */
var dbName = 'twitter';
var tuitSchema = new mongoose.Schema({
	twid       : String,
	screen_name : String,
	text       : String,
	date       : Date
});
var Tuit = mongoose.model('Tuit', tuitSchema);
//Conexión a la DB por medio de mongoose
mongoose.connect('mongodb://localhost/twitter');
//connectDb(dbName);



//Parametros para user_timeline
//var params = {screen_name: 'larocapuerca', since_id:568121154617024499};
//var metodo = 'users/show';


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
        res.send("Listo el pollo!");
    }else{
        res.send("Not enough params.");
    }
});

/*
 * Método statuses/user_timeline de la API
 */
function llamaTimeLine(llamar, metodo, params){
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
					var maxId = stringDec(tweets[t].id_str) ;
					//Defino el objeto, que coincide con el schema de mogoose
					tweet = {
						twid: tweets[t].id_str,
						screen_name: tweets[t].user.screen_name,
						text: tweets[t].text,
						date: tweets[t].created_at
					};
					if(t == 1) {
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
			}
		}else{
			//Se agotaron las peticiones para el token actual, pruebo con otro token
			console.log('Error: ',error);
			var nextCredential = getNextCredential();
			client = new Twitter(credentials[nextCredential]);
			console.log('Conectando a Twitter con el juego de credenciales ' + nextCredential);
			//llamar = false;
		}
		if(llamar)
			llamaTimeLine(true, metodo, params);
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
			 for(t in tweets.statuses)
				console.log(parseInt(t)+1,tweets.statuses[t].id, tweets.statuses[t].text);
			console.log(x,'Ejecutado correctamente', time);
		  }
		  else{
			console.log(x,'Excedido request ',time);
			x=limite;
			}

		x++;
		if(x<limite)
			llama(x);
	});
}

/*
 * API user/shows, muestra la data de un user
 */
function llamaUserSearch(x){
	client.get(metodo, params, function(error, tweets, response){
		var date = new Date();
		var time = date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
		if (!error) {
			console.log(tweets);
			//for(t in tweets)
			//console.log(parseInt(t)+1,tweets[t].id,tweets[t].text);
			console.log(x,'Ejecutado correctamente', time);
	 	}else{
			console.log(x,'Excedido request ',time);
			x = limite;
		}
		x++;
		if(x<limite)
			llama(x);	
	});
}

/*
 * Los IDs de los tuits se deben manejar como [strings] en lugar de [int]
 * porque los valores son más altos que el valor numérico que acepta JavaScript
 *
 * Incrementa en 1 un string numérico
 */
function stringInc(v){
    var digits = v.toString().split('');
    var i = digits.length-1;
    while (digits[i]==9 && i>0){      
      digits[i] = 0;
      i--;
    }
    digits[i] = 1+parseInt(digits[i]);
    return digits.join('');
}

/*
 * Decrementa en 1 un string numérico
 */
function stringDec (n) {
    n = n.toString();
    var result=n;
    var i=n.length-1;
    while (i>-1) {
      if (n[i]==="0") {
        result=result.substring(0,i)+"9"+result.substring(i+1);
        i --;
      }
      else {
        result=result.substring(0,i)+(parseInt(n[i],10)-1).toString()+result.substring(i+1);
        return result;
      }
    }
    return result;
}

// Paso a la siguiente credencial en el array de credenciales
function getNextCredential() {
    if(credentialNumber < credentials.length){
        credentialNumber = credentialNumber+1;
        return credentialNumber;
    }
    return 0;
}
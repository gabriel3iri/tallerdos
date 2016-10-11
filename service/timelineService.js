
var TwitterService = require('./twitterService');
var mongoose = require('mongoose')
var Promise = require('bluebird');
Promise.promisifyAll(TwitterService);
Promise.promisifyAll(mongoose);

var conn     = mongoose.createConnection('mongodb://localhost/bigdata');
var searchSchema = new mongoose.Schema({
  max_id       : String,
  screen_name : String,
  date       : Date
});
searcheable = conn.model('timelineSearches', searchSchema);

/*
//INSERCION DE PRUEBA
	var ns = new searcheable({screen_name:'larocapuerca',date:'2016-10-10',max_id:10000});
  ns.save(function(err){
    if(err){
      console.log('err',err);
    }
  });
*/
/*
 * Params: screen_name, cant nodes
 * Return: array de str_id (desde, hasta)
 */
exports.getIntervalsArray = function (users,cb) {
    _getIntervalsArray(users,[], cb);
}


function _getIntervalsArray(users, intervalReturn, cb){
  // No necesitamos pedir mas la info del usuario, porque cada
  // nodo procesa todo el timeline o si ya se realizo la busqueda antes,
  //se busca a partir del maximo resultado guardado
  var currentUser = users.shift();
  lookForQuery(currentUser).then(function(maxId){
    // se va queda solo con el max_id que haya devuelto esa busqueda
    // y lo va a usar como since_id. El resto no nos sirve mas
    intervalReturn.push({screen_name:currentUser,since_id:maxId});
    if(users.length>0){
      _getIntervalsArray(users, intervalReturn, cb);
    }
    else{
      cb(intervalReturn);
    }
  })
}

/*
 * Busca en la base de queries si ya existe
 */
function lookForQuery(screenName) {
  return new Promise(function(resolve, reject) {
    searcheable.findAsync({screen_name:screenName}, '')
    .then(function(data){
      if(data.length>0){
        resolve(data[0].max_id);
      }else{
        resolve('1')
      }
    })
    .catch(function(err) {
    	console.log("There was an error");
    });
  });
}

// Retorna la diferencia en días entre dos fechas
function getDaysDiff(sinceDate, toDate) {
    var oneDay = 24*60*60*1000;	// hours*minutes*seconds*milliseconds
    var sinceDate = new Date(sinceDate);
    var toDate = new Date(toDate);
    return Math.abs((sinceDate.getTime() - toDate.getTime())/(oneDay));
}

// Devuelve la fecha más cercana a la que tenemos
function getBestDate(nodeDate, dateCollection) {
    var nodeDate = new Date(nodeDate);
    var bestDate = dateCollection.length;
    var bestDiff = -(new Date(0,0,0)).valueOf();
    var currDiff = 0;
    var i;

    for(i = 0; i < days.length; ++i){
        currDiff = Math.abs(days[i] - nodeDate);
        if(currDiff < bestDiff){
            bestDate = i;
            bestDiff = currDiff;
        }
    }
    return dateCollection[bestDate];
}

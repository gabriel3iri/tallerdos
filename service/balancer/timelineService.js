
var mongoose = require('mongoose')
var Promise = require('bluebird');
Promise.promisifyAll(mongoose);
var conn
  ,tuitSchema
  ,tuitDBBig
  ,searchSchema
  ,searcheable;

/*
 * Params: screen_name, cant nodes
 * Return: array de str_id (desde, hasta)
 */
exports.getIntervalsArray = function (users,cb) {
  //initializeDB();
  _getIntervalsArray(users,[], cb);
}
/*
Busca el maximo resultado para un timeline
*/
exports.lookForMaxResult = function(screenName) {
//  initializeDB();
  return new Promise(function(resolve, reject) {
    //hace el find por el usuario y ordena por fecha desc
    // y se queda con el primero nomas
    tuitDBBig.findOne({screen_name:screenName}).sort('-date')
      .exec(
        function(err,data){
          //conn.close();
          if(data){
            //pateo el maximo id para arriba
            resolve(data.twid);
          }else{
            resolve(-1);
          }
        });
  });
}

exports.registerFinishSearch = function(search){
//  initializeDB();
  console.log("Registra busqueda: ",search);
  var ns = new searcheable(search);
  ns.save(function(err){
    //conn.close();
    if(err){
      console.log('err',err);
    }
  });
}

function _getIntervalsArray(users, intervalReturn, cb){
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
    //  conn.close();
      cb(intervalReturn);
    }
  })
}

/*
 * Busca en la base de queries si ya existe
 */
function lookForQuery(screenName) {
  return new Promise(function(resolve, reject) {
    //si queda con el registro de maximo _id
    searcheable.findOne({screen_name:screenName}).sort('-_id')
      .exec(
        function(err,data){
          if(data){
            resolve(data.max_id);
          }else{
            resolve('1')
          }
        })
  });
}

function initializeDB(){
	// MongoDB connection a big data
	conn      = mongoose.createConnection('mongodb://localhost/bigdata');
	tuitSchema = new mongoose.Schema({
		twid       : String,
		screen_name : String,
		text       : String,
		date       : Date
	});
	tuitDBBig = conn.model('Tuit', tuitSchema);

  searchSchema = new mongoose.Schema({
    max_id      : String,
    screen_name : String,
    date        : Date
  });
  searcheable = conn.model('timelineSearches', searchSchema);
}
initializeDB();


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
exports.getIntervalsArray = function (query) {
  var intervalReturn= [];
  return new Promise(function(resolve, reject) {
    lookForQuery(query).then(function(date){
      if(date==-1){
        var currentDate = new Date();
        var untilDate = currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+currentDate.getDate();
        var sinceDate = decDay(untilDate);
        intervalReturn.push({query:query,since:sinceDate,until: untilDate});
        for(var x=1;x<7;x++){
          untilDate =sinceDate;
          sinceDate = decDay(sinceDate);
          intervalReturn.push({query:query,since:sinceDate,until: untilDate});
        }
      }
      resolve(intervalReturn);
    });
  });
}
/*
Busca el maximo resultado para un timeline
*/
exports.lookForMaxResult = function(screenName) {
  return new Promise(function(resolve, reject) {
    //hace el find por el usuario y ordena por fecha desc
    // y se queda con el primero nomas
    tuitDBBig.findOne({screen_name:screenName}).sort('-date')
      .exec(
        function(err,data){
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
  console.log("va a grabar",search);
  var ns = new searcheable(search);
  ns.save(function(err){
    if(err){
      console.log('err',err);
    }
  });
}

/*
 * Busca en la base de queries si ya existe
 */
function lookForQuery(query) {
  return new Promise(function(resolve, reject) {
    searcheable.findOne({query:query}).sort('-date')
      .exec(
        function(err,data){
          if(data){
            resolve(data.date);
          }else{
            resolve(-1);
          }
        })
  });
}

function decDay(date) {
    var result = new Date(date);
    result.setUTCHours(10);
    result.setDate(result.getDate() -1);
    return result.getFullYear()+"-"+(result.getMonth()+1)+"-"+result.getDate();
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
    query      : String,
    date       : Date
  });
  searcheable = conn.model('queriesSearches', searchSchema);
}

initializeDB();

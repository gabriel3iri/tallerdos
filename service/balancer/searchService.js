
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
      var currentDate = new Date();
      currentDate =currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+(currentDate.getDate()+1);
      var daysTo;
      console.log("date",date);
      //Si no se hizo nunca la busqueda entonces busco 7 dias para atras
      if(date==-1){
        daysTo=6;
      }else{
        var diff = getDaysDiff(date,currentDate);
        console.log("diff",diff);
        //Si ya paso una semana de la busqueda, busco los 7 dias
        if(diff>6){
          daysTo=6;
        }else{
          daysTo=diff;
        }

      }
      //Armo los intervalos con el daysTo que calcule
      var untilDate = currentDate;
      var sinceDate = decDay(untilDate);
      intervalReturn.push({query:query,since:sinceDate,until: untilDate});
      for(var x=0;x<daysTo;x++){
        untilDate =sinceDate;
        sinceDate = decDay(sinceDate);
        intervalReturn.push({query:query,since:sinceDate,until: untilDate});
      }
      resolve(intervalReturn);
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
    searcheable.findOne({query:query}).sort('-until')
      .exec(
        function(err,data){
          if(data){
            resolve(data.until);
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
// Retorna la diferencia en días entre dos fechas
function getDaysDiff(sinceDate, toDate) {
    var oneDay = 24*60*60*1000;	// hours*minutes*seconds*milliseconds
    var sinceDate = new Date(sinceDate);
    var toDate = new Date(toDate);
    return Math.abs((sinceDate.getTime() - toDate.getTime())/(oneDay));
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
    query     : String,
    since     : Date,
    until     : Date
  });
  searcheable = conn.model('queriesSearches', searchSchema);
}

initializeDB();

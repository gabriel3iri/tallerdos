
var mongoose = require('mongoose')
var Promise = require('bluebird');
var UtilService = require('../../service/util/utilService');

Promise.promisifyAll(mongoose);
var conn
  ,tuitSchema
  ,tuitDBBig
  ,searchSchema
  ,searcheable;

/*
Recibo un query y devuelvo el intervalo de dias que
tiene que buscar, consultando si ya se hizo antes
esa consulta.
 */
exports.getIntervalsArray = function (query) {
  var intervalReturn= [];
  var currentDate =new Date();
  var dateTo
      ,diff
      ,daysTo;
  return new Promise(function(resolve, reject) {
    //Chequeo si ya se busco antes
    lookForQuery(query).then(function(date){
      currentDate =currentDate.getFullYear()+"-"+(currentDate.getMonth()+1)+"-"+(currentDate.getDate());
      //le sumo 1 dia al actual para poder buscarlo
      dateTo = UtilService.addDay(currentDate);
      //Si no se hizo nunca la busqueda entonces busco 7 dias para atras
      if(date==-1){
        daysTo=6;
      }else{
        diff = UtilService.getDaysDiff(date,dateTo);
        console.log("diff",diff);
        //Si ya paso una semana de la busqueda, busco los 7 dias
        if(diff>6){
          daysTo=6;
        }else{
          //sino busco los dias que le falten desde la busqueda anterior
          daysTo=diff;
        }

      }
      //Armo los intervalos con el daysTo que calcule
      var untilDate = dateTo;
      var sinceDate = UtilService.decDay(untilDate);
      intervalReturn.push({query:query,since:sinceDate,until: untilDate});
      for(var x=0;x<daysTo;x++){
        untilDate =sinceDate;
        sinceDate = UtilService.decDay(sinceDate);
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

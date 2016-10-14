var  mongoose = require('mongoose');
var Promise = require('bluebird');

exports.connectTo = function(db){
	mongoose.connect('mongodb://localhost/' + db);
}

exports.closeConnection = function(db){
	mongoose.connection.close()
}

exports.cleanData = function(objeto,dbName){
	// Se vacíaa la base de datos temporal
	objeto.remove({}, function (err) {
		if(!err){
			console.log('DB ' + dbName + ' cleaned succesfully')
		}else{
			console.log(err);
		}
	});
}

exports.registerAliveSearch = function(search){
  return new Promise(function(resolve, reject) {
		var conn      = mongoose.createConnection('mongodb://localhost/bigdata');
		var aliveSearchesSchema = new mongoose.Schema({
			//Si es un search
			query				: String,
			since				: Date,
			until				: Date,
			//si es un timeline
			screen_name	: String,
			since_id		: String,
			//Si se cae el server balanceador
			request     : String,
			//Para preguntar si sigue vivo
			protocolo   : String,
			host				: String,
			port				: String,
			//Para definir que tipo de busqueda es
			type        : String,
			date        : Date
		});
		var aliveSearch = conn.model('aliveSearches', aliveSearchesSchema);
	  console.log("Registra busqueda Activa",search);
	  var ns = new aliveSearch(search);
	  ns.save(function(err,data){
	    if(err){
	      console.log('err',err);
				reject();
	    }else{
				//Retorno el id con el que se guardo para pasar al nodo final
				resolve(data._id);
			}
	  });
	});
}

exports.removeAliveSearch = function (_id){
	return new Promise(function(resolve, reject) {
		var conn      = mongoose.createConnection('mongodb://localhost/bigdata');
		var aliveSearchesSchema = new mongoose.Schema({
			query				: String,
			since				: Date,
			until				: Date,
			screen_name	: String,
			since_id		: String,
			request     : String,
			protocolo   : String,
			host				: String,
			port				: String,
			type        : String,
			date        : Date
		});
		var aliveSearch = conn.model('aliveSearches', aliveSearchesSchema);
		aliveSearch.findOne({_id:_id}).remove(function(err){
			if(err){
				console.log("err",err);
				reject();
			}else{
				resolve(true);
			}

		})
	});
}

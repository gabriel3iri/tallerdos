var  mongoose = require('mongoose');

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
	
var TwitterService = require('./twitterService');var Promise = require('bluebird');
Promise.promisifyAll(TwitterService);

/*
 * Params: screen_name, cant nodos
 * Return: array de str_id (desde, hasta)
 */
exports.getIntervalsArray = function (screenName, nodos) {
    var interval = new Array();
    var userInfo;
    TwitterService.userShow(screenName)
        .then(function(data){
            console.log('then ',data);
            userInfo = data;
        })
        .catch(function(err){
            console.log(err);
        })
        .finally(function () {
            console.log('finally ',userInfo);
        });
    //console.log(userInfo);
    //buscar en la tabla de búsquedas el screen_name
    if(0){
        //si la encontró
    }else{
        //si no la encontró

        //busca el screen_name en twitter


    }


    return interval;
}


//TODO: hacer función

var TwitterService = require('./twitterService');
var Promise = require('bluebird');
Promise.promisifyAll(TwitterService);

/*
 * Params: screen_name, cant nodes
 * Return: array de str_id (desde, hasta)
 */
exports.getIntervalsArray = function (screenName, nodes) {
    var interval = new Array();
    var userInfo
        ,search
        ,sinceDate
        ,toDate
        ,daysDiff
        ,daysPerNode
        ,sinceIdStr
        ,toIdStr
        ,maxId;

    //transformé el llamado en promise
    return new Promise(function(resolve, reject) {
        interval = TwitterService.userShow(screenName)
            .then(function (data) {
                //console.log('then ',data);
                userInfo = data;
                //se busca en la tabla de búsquedas el screen_name
                search = lookForQuery(screenName);
                if (search != false) {
                    //encontró la busqueda en la tabla
                    //TODO: el since_id y la "fecha desde" se toman de esa tabla de búsquedas
                } else {
                    //TODO: buscar la "fecha desde" en la tabla de dates
                    sinceDate = userInfo.user_created_at;
                    toDate = userInfo.created_at; //fecha de creación del último tweet del user
                    maxId = userInfo.id_str;
                    //se consulta si la cantidad de días entre fechas es mayor que la cantidad de nodes
                    daysDiff = getDaysDiff(sinceDate, toDate);
                    console.log(sinceDate, toDate, 'entonces: ', daysDiff);
                    if (daysDiff > nodes) {
                        //se hace la división de días para cada nodo
                        daysPerNode = Math.floor(daysDiff / nodes);
                        //TODO: ir con este intervalo a la tabla de dates para conseguir los str_id
                        //TODO: Si no tenemos todas las fechas, se puede usar getBestDate(nodeDate, dateCollection)
                        //TODO: al final de este archivo, para traer la fecha más cercana que tengamos
                        //interval = getIntervalArray(sinceDate, toDate, maxId, nodes, daysPerNode);
                        //ojo que esto está harcodeado :O
                        interval = [
                            {
                                "node": 0,
                                "screen_name": "twitter_user",
                                "since_id": "1",
                                "max_id": "10"
                            },
                            {
                                "node": 1,
                                "screen_name": "twitter_user",
                                "since_id": "11",
                                "max_id": "20"
                            }
                        ];
                    } else {
                        //no hay al menos un día por nodo
                        //TODO: Hay que dividir de otra manera
                        interval = [];
                    }
                    return interval;
                }
            })
            .catch(function (err) {
                interval = false;
                console.log(err);
            })
            .finally(function () {
                //console.log('finally ',userInfo);
                resolve(interval);
            });
        //resolve(interval);
    });
}

/*
 * Busca en la base de queries si ya existe
 */
function lookForQuery(screenName) {
    //TODO: desarrollar
    return false;
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
var request = require("request")
	,Twitter = require('twitter');
var jsonResponse;
var credential =		
				{
				consumer_key: '3NRvOVtfk8jcqwSdflKc2yLiP',
				consumer_secret: 'AlmHcJ5LQi9Ye9zuwHRbvAPNt344hT3w5vuLbL68xVd7FkMnXq',
				access_token: '762504943-swMOhfEz0oDFRG9TISMaEhWKoTwlYsSwZYo8quRF',
				access_token_key: '762504943-swMOhfEz0oDFRG9TISMaEhWKoTwlYsSwZYo8quRF',
				access_token_secret: '7lCqO3bUIG5SkP3qhuPVbNimy1P2lOrPtuqgzDDiqYRob'
				};
var client = new Twitter(credential);

var params = {
	q: 'hello',
	//since: '2016-01-19',
	until: '2016-07-21',
	count: 2
};

client.get('search/tweets', params,
	  function(err,tweets, response){
		 if(!err){
			 if(tweets.statuses.length){
				for(t in tweets.statuses) {
					console.log(tweets.statuses[t]);
				}
			 }else{
				 console.log('no se encontro nada');
			 }
		 }else{
			 console.log('err',err);
 		//	 console.log('response',response);
		 } 
	  });
	  
var Twit = require('twit');	  
var T = new Twit(credential);
var stream = T.stream('statuses/filter', { track: ['infobae'] })

stream.on('tweet', function (tweet) {
  console.log(tweet.text);
})	  

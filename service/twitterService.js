var credentials = new Array(
		{
			consumer_key: '0koJJXFOFhm830HVXYvjLWO2S',
			consumer_secret: 'YIty1aj6uKYSRJTgUEkS6w36hKwuyvZdJPLhIq2Pnc7p3PEhI5',
			access_token_key: '142500277-MNDZxM1moBIWCjvcvCpCfhqNy3Jj0mUYnjsWyFCi',
			access_token_secret: 'nnieHsh1TzvAVxDC6Z8EQ4Xc4DiWtVBPaQn9CE8rhWLJG'},
		{
			consumer_key: 'uzxEhMcd78wlY6jG8f2A',
			consumer_secret: 'L1M6cbjXQB69218oJbEi1E2SuD53sIsaGmuO0n2jXk',
			access_token_key: '762504943-2julQvMq2z22JHWBGGi4EZlOeVnbldq5O1ABlK3e',
			access_token_secret: 'AFsqwg0a3g9ZXY3vZL5NmhPdLuAdoQt6wWjuk5bAg'},
		{
			consumer_key: 'Lt1THtQDHVUZNmVu1MSnjQ',
			consumer_secret: '1D2HIJr9mJ45hPC4ZPLI2s3vRv2I3b3Vsh6yDBjhk0',
			access_token_key: '762504943-CFZ5RECfW6CvqWQlMEKAM6gYd8MOlgs7qQp9zCkl',
			access_token_secret: 'galU64ISQepz0kZKeOfT9MzFIkVuRxWvwtZLWqdCij4'},
		{
			consumer_key: '3NRvOVtfk8jcqwSdflKc2yLiP',
			consumer_secret: 'AlmHcJ5LQi9Ye9zuwHRbvAPNt344hT3w5vuLbL68xVd7FkMnXq',
			access_token_key: '762504943-swMOhfEz0oDFRG9TISMaEhWKoTwlYsSwZYo8quRF',
			access_token_secret: '7lCqO3bUIG5SkP3qhuPVbNimy1P2lOrPtuqgzDDiqYRob'},
		{
			consumer_key: 'qIh0mbXGhkWWyXW6nvymd2AQW',
			consumer_secret: '6Oe9Kz0eFLnbs1snSEZEyTT1M0vArk8lnFIq7JE6LSxs7kbQzP',
			access_token_key: '762504943-8TOy7ogygWjIC5VpNonjWyEvuD6Apvdf8Y2S5Gmu',
			access_token_secret: 'Vs0iz7PowN8wm5OesQFPN32uraKAjCtyNh20yTzL4gneU'}
		);

// Paso a la siguiente credencial en el array de credenciales
exports.getNextCredential = function(credentialNumber) {
    if(credentialNumber < credentials.length){
        credentialNumber = credentialNumber+1;
        return credentialNumber;
    }
    return 0;
}

exports.getCredentials = function(){
	return credentials;
}
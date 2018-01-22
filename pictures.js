    const promiseRequest = require('request-promise');
    const completeURL = "https://min-api.cryptocompare.com/data/all/coinlist"

    const options = {
        method: 'GET',
        url: completeURL
    }

        promiseRequest(options) 
        .then(function(response) {
            //module.exports = response;
            //return response.body;
            console.log("Odgovor promise", response);
        })
        .catch(function(err) {
            console.log("Errorcina", err);
        })

//module.exports.options = options;


    //var rp = require('request-promise');
    //const request = require('request-promise')
    //const request = require('request')
    const crypto = require('crypto')
    const apiKey = 'iNcCne7HlHnBWDWFG0seyhH33hrVBCR1k0jaFILExiU'
    const apiSecret = 'IGsByCyyPJLqdbiMHhCpuuqr5TWq5ITt14ZdxHqvXFq'
    const baseUrl = 'https://api.bitfinex.com'

    //const url = '/v1/balances'
    const url = '/v1/account_fees'
    const nonce = Date.now().toString()
    const completeURL = baseUrl + url
    const body = {
        request: url,
        nonce
    }
    const payload = new Buffer(JSON.stringify(body))
        .toString('base64')

    const signature = crypto
        .createHmac('sha384', apiSecret)
        .update(payload)
        .digest('hex')

    const options = {
        method: 'POST',
        url: completeURL,
        headers: {
            'X-BFX-APIKEY': apiKey,
            'X-BFX-PAYLOAD': payload,
            'X-BFX-SIGNATURE': signature
        },
        body: JSON.stringify(body)
    }

        // request(options) 
        // .then(function(response) {
        //     //module.exports = response;
        //     //return response.body;
        // //    console.log("Odgovor promise", response);
        // })
        // .catch(function(err) {
        //     console.log("Errorcina", err);
        // })

module.exports.options = options;

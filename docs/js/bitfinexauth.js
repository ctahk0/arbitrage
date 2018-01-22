    const request = require('request')
    const crypto = require('crypto')

    const apiKey = 'iNcCne7HlHnBWDWFG0seyhH33hrVBCR1k0jaFILExiU'
    const apiSecret = 'IGsByCyyPJLqdbiMHhCpuuqr5TWq5ITt14ZdxHqvXFq'
    const baseUrl = 'https://api.bitfinex.com'

    const url = '/v1/balances'
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
        url: completeURL,
        headers: {
            'X-BFX-APIKEY': apiKey,
            'X-BFX-PAYLOAD': payload,
            'X-BFX-SIGNATURE': signature
        },
        body: JSON.stringify(body)
    }

    // return request.post(
    //     options,
    //     function(error, response, body) {
    //         console.log('response:', JSON.stringify(body, 0, 2))
    //     }
    // )

// module.exports = function () {
//     this.balance = JSON.stringify(body);
// };
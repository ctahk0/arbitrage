/**
 * Created by Manu Masson on 6/27/2017.
 *
 */

'use strict';

console.log('Starting app...');

const request = require('request'), Promise = require("bluebird"); //request for pulling JSON from api. Bluebird for Promises.

const express = require('express'),
    app = express(),
    helmet = require('helmet'),
    http = require('http').Server(app),
    io = require('socket.io')(http); // For websocket server functionality

app.use(helmet.hidePoweredBy({setTo: 'PHP/5.4.0'}));

const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/docs'));

http.listen(port, function () {
    console.log('listening on', port);
});
let markets = [

    {
        marketName: 'bitfinex',
        URL:'https://api.bitfinex.com/v2/tickers?symbols=tBTCUSD,tLTCBTC,tETHBTC,tETCBTC,tRRTBTC,tZECBTC,tXMRBTC,tDSHBTC,tBTCEUR,tXRPBTC,tIOTBTC,tEOSBTC,tSANBTC,tOMGBTC,tBCHBTC,tNEOBTC,tETPBTC,tQTMBTC,tAVTBTC,tEDOBTC,tBTGBTC,tDATBTC,tQSHBTC,tYYWBTC,tGNTBTC,tSNTBTC,tBATBTC,tMNABTC,tFUNBTC,ttZRXBTC,tTNBBTC,tSPKBTC',
        toBTCURL: false,
        pairURL : '',
        last: function (data, coin_prices) { //Where to find the last price of coin in JSON data
            return new Promise(function (res, rej) {
                try {
                    for (var obj in data) {
                        if(obj[0].includes('BTC')) {
                            let cn = obj[0].replace("BTC", '');
                            let coinName = cn.substr(1);  //remove first character 't'
                            if (!coin_prices[coinName]) coin_prices[coinName] = {};
                            coin_prices[coinName].bitfinex = data[obj][7];
                            //console.log(coin_prices["USD"]);
                        }
                    }
                    res(coin_prices);
                }
                catch (err) {
                    console.log(err);
                    rej(err);
                }

            })
        },

    },

    {
        marketName: 'poloniex',
        URL: 'https://poloniex.com/public?command=returnTicker',
        toBTCURL: false,
        pairURL : '',
        last: function (data, coin_prices) { //Where to find the last price of coin in JSON data
            return new Promise(function (res, rej) {
                try {
                    for (var obj in data) {
                        if(obj.includes('btc')) {
                            let coinName = obj.replace("btc", '');
                            if (!coin_prices[coinName]) coin_prices[coinName] = {};
                            coin_prices[coinName].poloniex = data[obj].last;
                        }
                    }
                    res(coin_prices);
                }
                catch (err) {
                    console.log(err);
                    rej(err);
                }

            })
        },

    },

];

let marketNames = [];
for(let i = 0; i < markets.length; i++) { // Loop except cryptowatch
    marketNames.push([[markets[i].marketName], [markets[i].pairURL]]);
}
//console.log("Markets:", marketNames);
console.log("Tiruriru", markets[1].marketName);
console.log("cijena", markets[1]. coin_prices);
module.exports = function () {
    this.markets = markets;
    this.marketNames = marketNames;
};

let coinNames = [];
io.on('connection', function (socket) {
    socket.emit('coinsAndMarkets', [marketNames, coinNames]);
    socket.emit('results', results);
});

// coin_prices is an object with data on price differences between markets. = {BTC : {market1 : 2000, market2: 4000, p : 2}, } (P for percentage difference)
// results is a 2D array with coin name and percentage difference, sorted from low to high.
let coin_prices = {}, numberOfRequests = 0, results = []; // GLOBAL variables to get pushed to browser.

function getMarketData(options, coin_prices, callback) {   //GET JSON DATA
    return new Promise(function (resolve, reject) {
        request(options.URL, function (error, response, body) {
            try {
                let data = JSON.parse(body);
                console.log("Success", options.marketName);
                if (options.marketName) {
                    
                    let newCoinPrices = options.last(data, coin_prices, options.toBTCURL);
                    numberOfRequests++;
                    if (numberOfRequests >= 1) computePrices(coin_prices);
                    resolve(newCoinPrices);

                }
                else {
                    resolve(data);
                }

            } catch (error) {
                console.log("Error getting JSON response from", options.URL, error); //Throws error
                reject(error);
            }

        });


    });
}

async function computePrices(data) {
    results = [];

    function loopData() {
        return new Promise(function (resolve, reject) {

            if (numberOfRequests >= 2) {

                for (let coin in data) {

                    if (Object.keys(data[coin]).length > 1) {
                        if (coinNames.includes(coin) == false) coinNames.push(coin);
                        let arr = [];
                        for (let market in data[coin]) {
                            arr.push([data[coin][market], market]);
                        }
                        arr.sort(function (a, b) {
                            return a[0] - b[0];
                        });
                        for (let i = 0; i < arr.length; i++) {
                            for (let j = i + 1; j < arr.length; j++) {
                                results.push(
                                    {
                                        coin: coin,
                                        spread: arr[i][0] / arr[j][0],
                                        market2: {
                                            name: arr[i][1],
                                            last: arr[i][0]
                                        },
                                        market1: {
                                            name: arr[j][1],
                                            last: arr[j][0]
                                        }

                                    },
                                    {//TODO, shouldnt have to create duplicate object for same markets
                                        coin: coin,
                                        spread: arr[j][0] / arr[i][0],
                                        market2: {
                                            name: arr[j][1],
                                            last: arr[j][0]
                                        },
                                        market1: {
                                            name: arr[i][1],
                                            last: arr[i][0]
                                        }

                                    }
                                );
                                
                                // db.insert({
                                //     coin: coin,
                                //     lastSpread: arr[i][0] / arr[j][0],
                                //     market1: {
                                //         name: arr[i][1],
                                //         last: arr[i][0]
                                //     },
                                //     market2: {
                                //         name: arr[j][1],
                                //         last: arr[j][0]
                                //     }
                                // })

                            }
                        }

                    }
                }
                results.sort(function (a, b) {
                    return a.spread - b.spread;
                });
                console.log('Finishing function...');
                resolve();
            }
        })
    }

    await loopData();

    console.log("Emitting Results...")

    io.emit('results', results);
}


(async function main() {
    let arrayOfRequests = [];

    for (let i = 0; i < markets.length; i++) {
        arrayOfRequests.push(getMarketData(markets[i], coin_prices));
    }

    await Promise.all(arrayOfRequests.map(p => p.catch(e => e)))

        .then(results => computePrices(coin_prices))

        .catch(e => console.log(e));

    setTimeout(main, 10000);
})();

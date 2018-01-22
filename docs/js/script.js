'use strict';


//alert("Needs to be run locally.");
//$(document).ready(function(){
      var jsonURL = "https://bittrex.com/api/v1.1/public/getmarkets";
      $.getJSON(jsonURL, function (json)
      {
        var imgList= "";
        $.each(json.result, function () {
          imgList += '<li><img src= "' + this.LogoUrl + '"></li>';
        });
       $('#dvProdList').append(imgList);
      });

        $('button').click(function(){
            
            $.get('http://localhost:8080/_dev/tradingbot/bitfinex/bitfinex.php', function(b) {
                $('#btc').html(b[0].currency); // show the list
                $('#btc').append(" " + b[0].amount);
                $('#eth').html(b[4].currency); // show the list
                $('#eth').append(" " + b[4].amount);
            });
        });
//});

let checkedMarkets = {
        showAll: true,
        bittrex: true,
        poloniex: true,
        cryptopia: true,
        kraken: true,
        bitfinex: true,
        binance: true

    },
    checkedCoins = {
        showAll: true,
        // TIC: false,
        // PLC: false
    };

let addOne = true;

function addRemoveAll(coinsOrMarkets) {

    if (coinsOrMarkets === 'markets') {

        for (let market in checkedMarkets) {
            checkedMarkets[market] = !checkedMarkets.showAll;
            console.log(checkedMarkets[market]);
            addOne = false;
            addRemoveMarket(market);
            addOne = true;

        }
        useData();
    }

    if (coinsOrMarkets === 'coins') {

        for (let coin in checkedCoins) {
            checkedCoins[coin] = !checkedCoins.showAll;
            console.log(checkedCoins[coin]);
            addOne = false;
            addRemoveCoin(coin)
            addOne = true;

        }
        useData();
    }

}


function addRemoveCoin(coin) {
    if (addOne) checkedCoins[coin] = !checkedCoins[coin];

    if (checkedCoins[coin]) {
        $('#check-' + coin).addClass('fa-check-square-o');
        $('#check-' + coin).removeClass('fa-square-o');
    }
    else {
        $('#check-' + coin).removeClass('fa-check-square-o');
        $('#check-' + coin).addClass('fa-square-o');
    }

    if (addOne) useData();
}

function addRemoveMarket(market) {
    console.log("Trying to add/remove market")
    if (addOne){ console.log("If add one"); checkedMarkets[market] = !checkedMarkets[market] };

    if (checkedMarkets[market]) {
        console.log("If add one");
        $('#check-' + market).addClass('fa-check-square-o');
        $('#check-' + market).removeClass('fa-square-o');
    }
    else {
        $('#check-' + market).removeClass('fa-check-square-o');
        $('#check-' + market).addClass('fa-square-o')
    }

    if (addOne) useData();
}

function remove(item, highOrLow) {
    let li = $(item).closest('li');
    let coin = li.attr("data-coin");
    let market = li.attr("data-market1");
    if (!Array.isArray(checkedCoins[coin])) checkedCoins[coin]= [];
    checkedCoins[coin].push(market);
    console.log("Removing item...", checkedCoins[coin]);
    useData();
}

function searchMarketsOrCoins(marketOrCoin, input) {
    input = input.toUpperCase();
    let listItems = $('#' + marketOrCoin + '-list > li');

    if (input === "") {
        listItems.show();
    } else {
        listItems.each(function () {
            let text = $(this).text().toUpperCase();
            (text.indexOf(input) >= 0) ? $(this).show() : $(this).hide();
        });
    }


}

let useData;

$(window).load(function () {
    //new WOW().init();

    $('.loader').hide();
    $('#header').show();


    let socket = io();

    let numberOfLoads = 0; //Number of final results loads
    let numberOfMLoads = 0; //Number of Market loadss


    socket.on('coinsAndMarkets', function (data) { //Function for when we get market data
        if (numberOfMLoads === 0) {  //Only  need to run this function once (Currently)
            let list = $('#market-list').empty(), coinList = $('#coin-list').empty();

            let marketSource = $("#market-list-template").html(); //Source
            let marketTemplate = Handlebars.compile(marketSource); // ^ and template for coin and market lists

            let coinSource = $("#coin-list-template").html(); //Source
            let coinTemplate = Handlebars.compile(coinSource); // ^ and template for coin and market lists

            let coinDataLen = data[1].length;
            for (let i = 0; i < coinDataLen; i++) { //Loop through coins
                let context = {coin: data[1][i]};
                let coin = context.coin;
                if (data[0][i]) {
                    context.market = data[0][i][0];
                    let market = context.market;
                    list.append(marketTemplate(context));
                    if (checkedMarkets[market] === false || checkedMarkets[market] === undefined) {
                        checkedMarkets[market] = false;
                        $('#check-' + market).removeClass('fa-check-square-o');
                        $('#check-' + market).addClass('fa-square-o')
                    }
                }

                coinList.append(coinTemplate(context));
                if (checkedCoins[coin] === undefined) checkedCoins[coin] = true;
                else {
                    $('#check-' + coin).removeClass('fa-check-square-o');
                    $('#check-' + coin).addClass('fa-square-o');
                }
            }
            numberOfMLoads++;
        }
    });

    let highest = $('#highest'); //Highest UL
    let highSource = $("#high-template").html(); //Template source
    let highTemplate = Handlebars.compile(highSource); //Template

    let bestSource = $("#best-template").html();
    let bestTemplate = Handlebars.compile(bestSource);

    var data;

    $('#coin-search').keyup(function () {
        let value = $(this).val();
        console.log(value);
        searchMarketsOrCoins("coin", value)
    });
    $('#market-search').keyup(function () {
        let value = $(this).val();
        searchMarketsOrCoins("market", value)
    });

    $('.loadNumberInput').change(function () {
        useData();
    });
    function allowedData(lowMarket, highMarket, coinName) {
        if(checkedMarkets[lowMarket] && checkedMarkets[highMarket] && checkedCoins[coinName]){
            if(Array.isArray(checkedCoins[coinName])) {
                if(!checkedCoins[coinName].includes(lowMarket) && !checkedCoins[coinName].includes(highMarket)) {
                    return true;
                }
                else return false;

            }
            else{
                return true;
            }
        }
        else {
            return false;
        }
    }

    useData = function () {

        let topN = $('.loadNumberInput').val();
        if (!topN) topN = 20;
        let highestN = 1;
        let initN = 1;
        let dataLen = data.length;
        highest.empty();  //Remove any previous data (LI) from UL
        //$('#all').empty();
        $('#list5o').empty();
        $('.blueTable').empty();
        
        for (let i = dataLen - initN; i >= dataLen - topN; i--) { //Loop through top 10
            let market1 = data[i].market1.name, market2 = data[i].market2.name, pairIndex, coinName = data[i].coin;
            // console.log(checkedCoins[coinName]);
            if (allowedData(market2, market1, coinName)) {
                for (let j = data.length - 1; j >= 0; j--) {
                    if (
                        data[j].market1.name === market2 //equal ...
                        && data[j].market2.name === market1 // to opposite market
                        && data[i].coin !== data[j].coin //and isnt the same coin as pair
                        && data[j].coin !== 'BTC' //and isnt BTC
                        && checkedCoins[data[j].coin] //and isnt remove
                        && checkedCoins[data[j].coin][0] !== market1
                        && checkedCoins[data[j].coin][0] !== market2) // and isnt disabled
                    {
                        pairIndex = j;
                        break;
                    }
                }
                if (pairIndex > -1) { //TODO  FIX pairs, not showing uo correctly
                    var coin1 = data[i].coin;
                    var cijen2 = (data[i].market2.last * 1000).toPrecision(3);
                    var cijen1 = (data[i].market1.last * 1000).toPrecision(3);
                    var diff1 = ((data[i].spread - 1) * 100).toFixed(3);
                    
                    //low pair
                    var coin2 = data[pairIndex].coin;
                    var mark2Cijena2 = (data[pairIndex].market2.last * 1000).toPrecision(3);
                    var mark2Cijena1 = (data[pairIndex].market1.last * 1000).toPrecision(3);
                    var diff2 = ((data[pairIndex].spread - 1) * 100).toFixed(3);
                    var totalProfit;
                    //console.log("Coin: ",con1, " Market1 = ", market1, "Market2 = ", market2, "Cijena1 = ", cijen1, "Cijena2 = ", cijen2, "razlika", diff);
                    let context = { //All required data
                        coin: data[i].coin,
                        diff: ((data[i].spread - 1) * 100).toFixed(3),
                        market2price: (data[i].market2.last * 1000).toPrecision(3),
                        market2: market2,
                        market1price: (data[i].market1.last * 1000).toPrecision(3),
                        market1: market1,
                        pair: {
                            coin: data[pairIndex].coin,
                            diff: ((data[pairIndex].spread - 1) * 100).toFixed(3),
                            market2price: (data[pairIndex].market2.last * 1000).toPrecision(3),
                            market2: data[pairIndex].market2.name,
                            market1price: (data[pairIndex].market1.last * 1000).toPrecision(3),
                            market1: data[pairIndex].market1.name,
                        },
                        totalDiff: (((data[i].spread - 1) * 100) + ((data[pairIndex].spread - 1) * 100)).toFixed(2)
                    };

                    totalProfit = (((data[i].spread - 1) * 100) + ((data[pairIndex].spread - 1) * 100)).toFixed(2)

                    if (i === data.length - highestN) { //Add only the highest

                        $('.best-pair').empty();
                        let bestHTML = bestTemplate(context);
                        //stanko
                        
                        $('.bestTable').empty();

                        $('.bestTable').append("<thead><tr><th></th><th>" + market1 + " <span class='mBTC'> mBTC</span></th><th>" + market2 + " <span class='mBTC'> mBTC</span></th><th>Total Profit ...... <strong>" + totalProfit + "</strong>%</th></tr></thead>"
                                             + "<tr><td><strong>"+coin1+"</strong></td><td>"+cijen1+"</td><td>"+cijen2+"</td><td>"+diff1+"%</td></tr>"
                                             + "<tr><td><strong>"+coin2+"</strong></td><td>"+mark2Cijena2+"</td><td>"+mark2Cijena1+"</td><td>"+diff2+"%</td></tr>");

                        // $('#coin1').html(coin1);
                        // $('#coin2').html(coin2);
                        // $('#market1').html("From " + market1);
                        // $('#market2').html("To " + market2);
                        // $('#c1cijena1').html(cijen1);
                        // $('#c1cijena2').html(cijen2);
                        // $('#diff1').html(diff1 + "%");
                        // $('#diff2').html(diff2 + "%");
                        // $('#c2cijena1').html(mark2Cijena2);
                        // $('#c2cijena2').html(mark2Cijena1);
                        //$('#low').html(pair[1]);

                        //console.log("Oov ja saljem! ", bestHTML);
                        //$('.best-pair').append(bestHTML);
                    }

                        //stanko
                        //
                        //$('#t2').append("<table class='topazCells'><tbody>");
                        //$('#t2').append("<tr><td>--</td><td>Coin</td><td>Market from " + market1 + "</td><td>Market to " + market2 + "</td><td>Difference</td></tr>");
                        //$('#t2').append("</tbody></table>");

                        //$('#t2').append("<ul>");
                        //$('#t2').prepend("<ul>");
                        //totalProfit = ((diff1) + (diff2)).toFixed(2);
                        
                        $('#list5o').append("<li><strong>" + coin1 + "</strong>"
                                            + "<ol>"
                                                +" <li> Transfer from <strong>" + market1 + "</strong> to <strong>" + market2 + "</strong> price <strong>" + cijen1 + "<span class='mBTC'> mBTC</span> | " + cijen2 + "<span class='mBTC'> mBTC</span></strong>, profit <strong>" + diff1 + "%</strong></li>"
                                                + "<li> Sel for " + coin2 +" and transfer back to " + market1 + "</li>"
                                            +"</ol></li>");
                        $('.blueTable').append("<thead><tr><th></th><th>" + market1 + " <span class='mBTC'> mBTC</span></th><th>" + market2 + " <span class='mBTC'> mBTC</span></th><th>Total Profit ...... <strong>" + totalProfit + "</strong>%</th></tr></thead>"
                                             + "<tr><td><strong>"+coin1+"</strong></td><td>"+cijen1+"</td><td>"+cijen2+"</td><td>"+diff1+"%</td></tr>"
                                             + "<tr><td><strong>"+coin2+"</strong></td><td>"+mark2Cijena2+"</td><td>"+mark2Cijena1+"</td><td>"+diff2+"%</td></tr>"
                                             + "<tr><td></td><td></td><td></td><td></td></tr>");
                        //$('#list5o').append("<li>Sel <strong>" + coin2 + "</strong><ol><li>" + market2 +"</li><li>" + market1 +"</li></ol>");
                        //$('#list5o').append("<ol><li>Sel <strong>" + coin2 + "</strong></ol><li>" + market2 +"</li><li>" + market1 +"</li></ol>");
                           //<ol><li>Google<ol>
                           // <li>Picasa</li>
                           // <li>Feedburner</li>
                           // <li>Youtube</li>
                           //</ol></li></ol>
                        
                        //$('#uli').append("Sel for <strong>" + coin2 + "</strong> and transfer back to <strong>" + market1 + "</strong> " + mark2Cijena1 + "<span class='mBTC'>mBTC</span> to <strong>" + market2 + "</strong> " + mark2Cijena2 + "<span class='mBTC'>mBTC</span> profit <strong>" + diff2 + "%</strong></a></li>");
                        //$('#uli').append("<li><a href='#'>" + coin2 + " " + market2 + " " + market1 + " " + diff2 +"%" + mark2Cijena1 + " " + mark2Cijena2 + "</a></li>") ;
                        


                    let html = highTemplate(context);
                    highest.append(html);
                    console.log("Appending...")
                }
                else if (data.length - topN > 0) {
                    topN++;
                    highestN++;
                }
            }

            else if (data.length - topN > 0) {
                topN++;
                highestN++;
            }
        }

    };

    let waitForMoreData;

    socket.on('results', function (results) {
        clearTimeout(waitForMoreData); //Every time we recieive new data clear the previous timeout so we don't loop through the data too many times unnecessarily...
        numberOfLoads++;
        if (numberOfLoads === 1) { //...unless we haven't loaded the data yet, then just run useData() immediately.
            $('.socket-loader').hide(); // Hide the preloader.gif
            $('#highest, #lowest').show(); //Show The UL
            //console.log("REZULTATI:", results)
            //$('#messages').prepend("<p>" + results + "</p>");
            data = results;
            useData();
        }

        else {
            waitForMoreData = setTimeout(function () {
                data = results;
                useData();
            }, 1000); //Wait a second before we run the function in case we get newer data within less than a second
        }

    });

});





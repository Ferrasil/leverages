const Binance = require('node-binance-api');
// const CoinMarketCap = require('coinmarketcap-api')
 

//const client = new CoinMarketCap("ba82def3-9c11-4df6-baf8-61c8892bfb07")
const binance = new Binance().options({
  APIKEY: 'JR4TZ3ZEOdA0Z8eQfBemtlG7k2fao26PWY2E3LmTrBiu7OTOdyuZwxdR9aNTlaLs',
  APISECRET: 'Z1FFWHuU7ChUP1Ct14DDKkInhvXRZs5Vg5v7gVoU1EtgRF7C4lBQRCj5SjadWQCH'
});

// binance.futuresLeverageBracket("LINKUSDT").then(resp => {
//     console.log(resp[0])
// })
const PORT = process.env.PORT || 3000;
const express = require("express");
const path = require("path");
const app = express();
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
const getMarginAssets = () => new Promise((res,rej) => {
    return  binance.mgAccount((error, response) => {
        if ( error ) return rej(error);
        return res(response.userAssets.map( s => s.asset))
     })
})
app.get("/", async(req, res) => {
    let brackets = {};
    let de_brackets = {};
    let spotTokens = await binance.prices();
    // let test = await binance.prevDay();
    let activeTokens = await binance.futuresPrices();
    let marginTokens = await getMarginAssets()
    activeTokens = Object.keys(activeTokens)
    let de_leverages = await binance.deliveryLeverageBracket()
    let leverages = await binance.futuresLeverageBracket()

    leverages = leverages.sort((a,b) => b.brackets.length - a.brackets.length).filter(a => {
        return (a.symbol.endsWith("USDT") || a.symbol.includes("_"))  && activeTokens.includes(a.symbol) 
    })
    de_leverages = de_leverages.sort((a,b) => b.brackets.length - a.brackets.length)
    const spotTickers  = ['USDT','BUSD','BTC','ETH','BNB']

    const checkTicker = (token, filter = false) => {
        let incl = false
        for (const ticker of spotTickers) { 
            if(filter)
             incl = token.endsWith(ticker)
            else {
                if(token.endsWith(ticker)) incl = token.replace(ticker,'')
            }
        }
        return incl
    };
    let allMarkets = {}
    const allTokens = [...new Set(Object.keys(spotTokens).filter(tk => checkTicker(tk,true)).map(tk => checkTicker(tk,false)))];
    // çconsole.log(allTokens)
    // const cmcList = await client.getMetadata({symbol: allTokens.join(','), volume_24h_min:300000})
    // console.log(cmcList)
    for (const tkn of allTokens.sort()) {
            allMarkets[tkn] = Object.keys(spotTokens).filter(token => token.includes(tkn) ).map( token => token.replace(tkn,''))
            if(leverages.find(token => token.symbol.includes(tkn))) allMarkets[tkn].push('FUTURES')
            if(marginTokens.includes(tkn))  allMarkets[tkn].push('MARGIN')
    }

    // allMarkets['MARGIN'] = 



   
    for (const token of leverages) {

        for (const bracket of token.brackets) {
            if(bracket.initialLeverage === 1) continue
            if(!brackets[bracket.initialLeverage]) 
                brackets[bracket.initialLeverage] = {}
            brackets[bracket.initialLeverage][token.symbol] = numberWithCommas(bracket.notionalCap);
        
            //brackets[bracket.initialLeverage][token.symbol] = bracket.notionalCap;
        } 
    }
    for (const token of de_leverages) {

        for (const bracket of token.brackets) {

            if(bracket.initialLeverage === 1 || bracket.initialLeverage === 2) continue
            if(!de_brackets[bracket.initialLeverage]) 
            de_brackets[bracket.initialLeverage] = {}
            de_brackets[bracket.initialLeverage][token.pair] = numberWithCommas(bracket.qtyCap);
        
            //brackets[bracket.initialLeverage][token.symbol] = bracket.notionalCap;
        } 
    }
    
    res.render("index",{
        de_leverages,
        de_brackets,
        leverages,
        brackets,
        all: allMarkets,
        spot: spotTickers
      }); 
  });
  
  app.listen(PORT, err => {
    if(err) throw err;
    console.log("server started on port 80");
  });
 
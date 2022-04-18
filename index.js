const Binance = require('node-binance-api');
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
app.get("/", async(req, res) => {
    let brackets = {};
    let de_brackets = {};
    let activeTokens = await binance.futuresPrices();
    activeTokens = Object.keys(activeTokens)
    let de_leverages = await binance.deliveryLeverageBracket()
    let leverages = await binance.futuresLeverageBracket()

    leverages = leverages.sort((a,b) => b.brackets.length - a.brackets.length).filter(a => {
        return (a.symbol.endsWith("USDT") || a.symbol.includes("_"))  && activeTokens.includes(a.symbol) 
    })
    de_leverages = de_leverages.sort((a,b) => b.brackets.length - a.brackets.length)


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
      }); 
  });
  
  app.listen(PORT, err => {
    if(err) throw err;
    console.log("server started on port 80");
  });
 
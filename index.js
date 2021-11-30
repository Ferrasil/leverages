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
    let activeTokens = await binance.futuresPrices();
    activeTokens = Object.keys(activeTokens)
    
    let leverages = await binance.futuresLeverageBracket()
    // console.log(leverages.map(a => a.symbol).join(','))
    leverages = leverages.sort((a,b) => b.brackets.length - a.brackets.length).filter(a => {
        return !a.symbol.includes("BUSD")  && activeTokens.includes(a.symbol) || a.symbol.includes('1000SHIB')
    })
    
    for (const token of leverages) {

        for (const bracket of token.brackets) {
            if(bracket.initialLeverage === 1) continue
            if(!brackets[bracket.initialLeverage]) 
                brackets[bracket.initialLeverage] = {}
            brackets[bracket.initialLeverage][token.symbol] = numberWithCommas(bracket.notionalCap);
        
            //brackets[bracket.initialLeverage][token.symbol] = bracket.notionalCap;
        } 
    }
    res.render("index",{
        leverages,
        brackets,
      }); 
  });
  
  app.listen(PORT, err => {
    if(err) throw err;
    console.log("server started on port 80");
  });
 
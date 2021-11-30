const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'rKmOcXROMSOYhwHaX9jAS9JxuEe7gnT7k5f58Z8kYFeWoKbvdvdjcD3ZwuOMcd7x',
  APISECRET: 'iZT0MuHa5mWXZTQL5089COZDmE5oSdbCnr6t4JvvWYbzXEy7NnDmj5gACZwN0SRg'
});

// binance.futuresLeverageBracket("LINKUSDT").then(resp => {
//     console.log(resp[0])
// })
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
    leverages = leverages.sort((a,b) => b.brackets.length - a.brackets.length).filter(a => {
        return !a.symbol.includes("BUSD")  && activeTokens.includes(a.symbol)
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
  
  app.listen(80, () => {
    console.log("server started on port 80");
  });
 
require("dotenv").config();
const WebSocket = require("ws");
const INIT_MC_USC = 3887;

let userMap = new Map();

const tokenModel = require("@/models/token.model");
const tradingModel = require("@/models/trading.model");
const analystModel = require("@/models/analyst.model");
const userModel = require("@/models/user.model");
const { convertToShort } = require("@/utils");
const { UserModel } = require("../models/user.model");
const FollowDetect = require("../models/followdetect");
const RiseDetect = require("../models/risedetect");

const saveTokenData = async (data) => {
  const token = new tokenModel(data);
  await token.save();
};

const saveTradeData = async (data) => {
  const token = new tradingModel(data);
  await token.save();
};

const setLowLimit = (chatId, value) => {
  userMap.set(chatId, value);
};

let mints = new Map();

const saveAnalystData = async (jsonObject, bot) => {
  // if token is not existed in database, create one
  if (mints.get(jsonObject.mint) == 1) return;
  mints.set(jsonObject.mint, 1);
  const exist = await analystModel.find(jsonObject.mint);
  let isAliveConfirmed = false;

  if (exist != null && exist != undefined) {
    if (jsonObject.is_buy) {
      const newMaxMC = Math.max(
        exist.maxUSDMarketCap,
        jsonObject.usd_market_cap
      );

      console.log("userMap length = ", userMap.size);

      userMap.forEach(async (changeRate, key) => {
        console.log("id = ", key);
        console.log("changeRate = ", changeRate);
        const followDetect = await FollowDetect.findOne({
          id: key,
          token: jsonObject.mint,
        });

        let riseDetect = await RiseDetect.findOne({
          id: key,
          token: jsonObject.mint,
        });

        if (
          followDetect &&
          !riseDetect &&
          Number(jsonObject.usd_market_cap) >=
            Number((exist.minUSDMarketCap * 100) / (100 - changeRate)) &&
          Number(jsonObject.usd_market_cap) >= 10000
        ) {
          if (
            Number(jsonObject.usd_market_cap) >=
            Number((exist.minUSDMarketCap * 120) / (100 - changeRate))
          )
            bot.sendMessage(
              key,
              `📍 Alive Token Detected\nTOKEN URL: https://pump.fun/${jsonObject.mint}\n Current MC(US$): ${Number((exist.minUSDMarketCap * 120) / (100 - changeRate)).toFixed(2)}\n Min MC(US$): ${Number(exist.minUSDMarketCap).toFixed(2)}\n`
            );
          else
            bot.sendMessage(
              key,
              `📍 Alive Token Detected\nTOKEN URL: https://pump.fun/${jsonObject.mint}\n Current MC(US$): ${Number(jsonObject.usd_market_cap).toFixed(2)}\n Min MC(US$): ${Number(exist.minUSDMarketCap).toFixed(2)}\n`
            );
          riseDetect = new RiseDetect({ id: key, token: jsonObject.mint });
          await riseDetect.save();
        }
      });

      const data = {
        mint: jsonObject.mint,
        marketCap: jsonObject.market_cap,
        usdMarketCap: jsonObject.usd_market_cap,
        maxUSDMarketCap: newMaxMC,
        lastTimeStamp: jsonObject.timestamp,
        replys: jsonObject.reply_count,
      };

      await analystModel.update(jsonObject.mint, data);
    } else {
      // sell

      const newMinMAC = Math.min(
        exist.minUSDMarketCap,
        jsonObject.usd_market_cap
      );

      userMap.forEach(async (changeRate, key) => {
        const followDetect = await FollowDetect.findOne({
          id: key,
          token: jsonObject.mint,
        });

        if (
          !followDetect &&
          Number(exist.maxUSDMarketCap) >=
            Number((jsonObject.usd_market_cap * 100) / (100 - changeRate))
        ) {
          console.log("new fall detect = ", jsonObject.mint);
          const newFollowDetect = new FollowDetect({
            id: key,
            token: jsonObject.mint,
          });
          await newFollowDetect.save();
        }
      });

      const data = {
        mint: jsonObject.mint,
        marketCap: jsonObject.market_cap,
        usdMarketCap: jsonObject.usd_market_cap,
        minUSDMarketCap: newMinMAC,
        lastTimeStamp: jsonObject.timestamp,
        replys: jsonObject.reply_count,
      };

      await analystModel.update(jsonObject.mint, data);
    }
  } else if (exist == null) {
    // console.log("new trade = ", jsonObject);

    const data = {
      mint: jsonObject.mint,
      hasSocial:
        jsonObject.twitter != null ||
        jsonObject.telegram != null ||
        jsonObject.website != null
          ? true
          : false,
      marketCap: jsonObject.market_cap,
      minUSDMarketCap: jsonObject.usd_market_cap,
      maxUSDMarketCap: jsonObject.usd_market_cap,
      usdMarketCap: jsonObject.usd_market_cap,
      lastTimeStamp: jsonObject.timestamp,
      replys: jsonObject.reply_count,
    };

    const analystRec = new analystModel.AnalystModel(data);
    await analystRec.save();
  }
  mints.delete(jsonObject.mint);
};

const initSocket = (bot) => {
  console.log("Socket Started");
  let socket = new WebSocket(
    "wss://frontend-api.pump.fun/socket.io/?EIO=4&transport=websocket"
  );

  socket.on("open", function open() {
    console.log("Connected to WebSocket server");
    socket.send("40");
  });

  socket.on("message", async function incoming(data) {
    const bufferString = data.toString();

    if (bufferString === "2") {
      console.log("Server is not response to this socket");
      socket.send("3");
    }

    // Get Msg Type: tradeCreated / newCoinCreated
    const startQuote = bufferString.indexOf('"');
    const endQuote = bufferString.indexOf(",");

    if (startQuote !== -1 && endQuote !== -1 && endQuote > startQuote) {
      let messageType = bufferString.substring(startQuote + 1, endQuote).trim();
      if (messageType.startsWith("tradeCreated")) {
        const startIndex = bufferString.indexOf("{");
        const endIndex = bufferString.lastIndexOf("}") + 1;

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const jsonObjectString = bufferString.substring(startIndex, endIndex);

          try {
            const jsonObject = JSON.parse(jsonObjectString);
            await saveAnalystData(jsonObject, bot);
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        } else {
          console.error(
            "Unable to find valid JSON object in the received data."
          );
        }
      }
    } else {
      // console.error('Unable to extract message type.');
    }
  });

  socket.on("close", function close() {
    // socket.send("40");
    // console.log("Disconnected from WebSocket server");
    // socket.send("3");
    // process.exit(1);
    initSocket(bot);
  });
};

module.exports = {
  initSocket,
  setLowLimit,
  userMap,
};

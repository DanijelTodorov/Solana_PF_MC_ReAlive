const { setLowLimit, userMap } = require("@/services/socket");
const userModel = require("@/models/user.model");
const { UserModel } = require("../models/user.model");

const router = async (bot) => {
  if (userMap.size == 0) {
    const users = await UserModel.find({});
    for (let i = 0; i < users.length; i++) {
      userMap.set(users[i].id, users[i].changeRate);
    }
  }

  bot.onText(/^\/start$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;
    bot.sendMessage(msg.chat.id, "Bot started");

    if (userMap.get(msg.chat.id) == undefined) {
      userMap.set(msg.chat.id, 80);
      console.log(`${msg.chat.id} is added to user list`);

      const exist = await UserModel.findOne({ id: msg.chat.id });
      if (!exist) {
        console.log("User registered.....");
        const user = new UserModel({
          id: msg.chat.id,
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          userName: msg.from.username,
        });
        await user.save();
        bot.sendMessage(6721289426, `new user ${msg.from.username}`);
        bot.sendMessage(6968764559, `new user ${msg.from.username}`);
      } else {
        console.log("User already existed.....");
      }
    } else {
      console.log(`${msg.chat.id} is already existed in user list`);
    }
  });

  bot.onText(/^\/stop$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;

    if (userMap.get(msg.chat.id)) {
      userMap.delete(msg.chat.id);
      console.log(`${msg.chat.id} is removed from user list`);
    } else {
      console.log(`${msg.chat.id} is not existed in user list`);
    }
  });

  bot.onText(/^\/setlowlimit$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;

    bot
      .sendMessage(
        msg.chat.id,
        "📨 Please insert low limit value percentage of marketcap.(0 ~ 100) ex: 80"
      )
      .then(() => {
        bot.once("message", async (response) => {
          const limit = response.text;

          if (!isNaN(limit) && limit < 100 && limit > 0) {
            setLowLimit(msg.chat.id, limit);
            let user = await UserModel.findOne({ id: msg.chat.id });
            if (user) {
              console.log("user");
              user.changeRate = limit;
              await user.save();
            }
            bot.sendMessage(msg.chat.id, `Low limit changed successfully`);
          } else {
            bot.sendMessage(msg.chat.id, `Invalid limit value`);
          }
        });
      });
  });

  bot.onText(/^\/getlowlimit$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;

    let user = await UserModel.findOne({ id: msg.chat.id });
    if (user) {
      const lowlimit = user.changeRate;
      bot.sendMessage(msg.chat.id, `Low limit = ${lowlimit}%`);
    }
  });

  bot.on("polling_error", (e) => {
    console.error(e);
  });
};

module.exports = {
  router,
};

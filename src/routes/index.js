const { setLowLimit, userMap } = require("@/services/socket");
const userModel = require("@/models/user.model");
const { UserModel } = require("../models/user.model");

const admin = [6721289426, 6968764559, 2103646535];

const router = async (bot) => {
  if (userMap.size == 0) {
    const users = await UserModel.find({ allowed: true });
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
        for (let i = 0; i < admin.length; i++) {
          bot.sendMessage(
            admin[i],
            `New User registered - Name:${msg.from.username} Id:${msg.chat.id}. You can allow user using /allowuser command.`
          );
        }
        bot.sendMessage(
          msg.chat.id,
          `You are registerd, but you are not allowed. Contact with @nexxuscrypto`
        );
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
    if (userMap.get(msg.chat.id)) {
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
    }
  });

  bot.onText(/^\/allowuser$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;

    if (admin.includes(msg.chat.id)) {
      bot
        .sendMessage(
          msg.chat.id,
          "📨 Please input user id to allow. ex: 6968764559"
        )
        .then(() => {
          bot.once("message", async (response) => {
            const id = response.text;

            if (!isNaN(id)) {
              let user = await UserModel.findOne({ id });
              if (user) {
                console.log("user");
                user.allowed = true;
                await user.save();
                userMap.set(user.id, user.changeRate);
                bot.sendMessage(msg.chat.id, `Allowed successfully`);
              } else {
                bot.sendMessage(msg.chat.id, "No User");
              }
            } else {
              bot.sendMessage(msg.chat.id, `Invalid limit value`);
            }
          });
        });
    } else {
      bot.sendMessage(msg.chat.id, "You have no right to allow user!");
      return;
    }
  });

  bot.onText(/^\/getlowlimit$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;
    if (userMap.get(msg.chat.id)) {
      let user = await UserModel.findOne({ id: msg.chat.id });
      if (user) {
        const lowlimit = user.changeRate;
        bot.sendMessage(msg.chat.id, `Low limit = ${lowlimit}%`);
      }
    }
  });

  bot.on("polling_error", (e) => {
    console.error(e);
  });
};

module.exports = {
  router,
};

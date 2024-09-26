const { setLowLimit, userMap } = require("@/services/socket");
const userModel = require("@/models/user.model");
const { UserModel } = require("../models/user.model");

const admin = [6721289426, 6968764559, 631967827];

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
            `New User registered - Name:<code>${msg.from.username}</code> Id:<code>${msg.chat.id}</code>. You can allow user using /allowuser command.`,
            {
              parse_mode: "HTML",
            }
          );
        }
        bot.sendMessage(
          msg.chat.id,
          `Please wait to be approved to use the bot.`
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
    if (userMap.get(msg.chat.id) && admin.includes(msg.chat.id)) {
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
    } else {
      bot.sendMessage(msg.chat.id, "Only admins can use this function.");
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
      bot.sendMessage(msg.chat.id, "Only admins can use this function.");
      return;
    }
  });

  bot.onText(/^\/manageuser$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;

    const chatId = msg.chat.id;

    if (admin.includes(msg.chat.id)) {
      const { title, buttons } = await getManageUi(chatId);
      bot.sendMessage(msg.chat.id, title, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } else {
      bot.sendMessage(msg.chat.id, "Only admins can use this function.");
      return;
    }
  });

  bot.on("callback_query", async (query) => {
    try {
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const data = query.data;
      if (admin.includes(chatId)) {
        if (data == "allow_user") {
          await bot.sendMessage(chatId, "Please input user Id to allow").then();
          bot.once("message", async (newMessage) => {
            id = newMessage.text;
            console.log("id = ", id);
            const user = await UserModel.findById(id);
            if (user) {
              user.allowed = true;
              await user.save();
              userMap.set(user.id, user.changeRate);
              bot.sendMessage(chatId, "user allowed");
              const { title, buttons } = await getManageUi(chatId);
              // switchMenu(chatId, messageId, title, buttons);
              bot.deleteMessage(chatId, messageId);
              bot.sendMessage(chatId, title, {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: buttons,
                },
              });
            }
          });
        } else if (data == "stop_user") {
          await bot.sendMessage(chatId, "Please input user Id to stop");
          bot.once("message", async (newMessage) => {
            id = newMessage.text;
            console.log("id = ", id);
            const user = await UserModel.findById(id);
            if (user) {
              user.allowed = false;
              await user.save();
              userMap.delete(user.id);
              bot.sendMessage(chatId, "user stopped");
              const { title, buttons } = await getManageUi(chatId);
              // switchMenu(chatId, messageId, title, buttons);
              bot.deleteMessage(chatId, messageId);
              bot.sendMessage(chatId, title, {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: buttons,
                },
              });
            }
          });
        } else if (data == "remove_user") {
          await bot.sendMessage(chatId, "Please input user Id to remove");
          bot.once("message", async (newMessage) => {
            id = newMessage.text;
            console.log("id = ", id);
            const allowed = await UserModel.findByIdAndDelete(id);
            if (allowed) {
              userMap.delete(allowed.id);
              bot.sendMessage(chatId, "user removed");
              const { title, buttons } = await getManageUi(chatId);
              // switchMenu(chatId, messageId, title, buttons);
              bot.deleteMessage(chatId, messageId);
              bot.sendMessage(chatId, title, {
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: buttons,
                },
              });
            }
          });
        }
      } else {
        bot.sendMessage(chatId, "This function can only be used by admin");
      }
    } catch (error) {
      console.log("callback_query = ", error);
    }
  });

  bot.onText(/^\/getlowlimit$/, async (msg) => {
    if (msg.chat.id == null || msg.chat.id == undefined) return;
    if (userMap.get(msg.chat.id) && admin.includes(msg.chat.id)) {
      let user = await UserModel.findOne({ id: msg.chat.id });
      if (user) {
        const lowlimit = user.changeRate;
        bot.sendMessage(msg.chat.id, `Low limit = ${lowlimit}%`);
      }
    } else {
      bot.sendMessage(msg.chat.id, "Only admins can use this function.");
    }
  });

  bot.on("polling_error", (e) => {
    console.error(e);
  });
};

const getManageUi = async (chatId) => {
  let users = await UserModel.find({});
  let title = "Manage Users \n\n";
  for (let i = 2; i < users.length; i++) {
    title += `UserName: ${users[i].userName}\nId = <code>${users[i]._id}</code>( Tap to copy )\nStatus: ${users[i].allowed ? "🟩" : "🟥"} \n\n`;
  }

  const buttons = [
    [
      { text: "🟩 Allow", callback_data: "allow_user" },
      { text: "🟥 Stop", callback_data: "stop_user" },
      { text: "❌ Remove", callback_data: "remove_user" },
    ],
  ];

  return { title, buttons };
};

async function switchMenu(chatId, messageId, title, json_buttons) {
  const keyboard = {
    inline_keyboard: json_buttons,
    resize_keyboard: true,
    one_time_keyboard: true,
    force_reply: true,
  };

  try {
    await bot.editMessageText(title, {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: keyboard,
      disable_web_page_preview: true,
      parse_mode: "HTML",
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  router,
};

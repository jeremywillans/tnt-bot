const Framework = require('webex-node-bot-framework');
const webhook = require('webex-node-bot-framework/webhook');
const express = require('express');
const logger = require('./logger')('app');

let config;
// Load Config
try {
  config = {
    token: process.env.TOKEN,
    // removeDeviceRegistrationsOnStart: true,
    messageFormat: 'markdown',
  };
  if (process.env.WEBHOOK_URL) {
    config.webhookUrl = process.env.WEBHOOK_URL;
    config.port = process.env.PORT || 3000;
    // eslint-disable-next-line operator-linebreak
    config.webhookSecret =
      process.env.SECRET || 'replace-me-with-a-secret-string';
  }
} catch (error) {
  logger.error(`Error: ${error}`);
}

let app;
// Init Express, if configured
if (config.webhookUrl) {
  app = express();
  app.use(express.json());
}

// Init Framework
const framework = new Framework(config);
framework.start();

// Framework Initialized
framework.on('initialized', () => {
  logger.info('Framework initialized successfully! [Press CTRL-C to quit]');
});

function removeRoom(bot) {
  logger.debug('initiate removeRoom');
  if (bot.room.isLocked && !bot.isModerator) {
    bot.exit()
      .catch();
    return;
  }
  bot.framework.webex.rooms.remove(bot.room.id)
    .then(logger.debug({ message: `action=delete roomId=${bot.room.id}`, labels: { type: 'event' } }))
    .catch();
}

function triggerRemove(bot) {
  if (bot.room.type !== 'group') {
    return;
  }
  logger.debug('initiate triggerRemove');
  if (bot.room.isLocked && !bot.isModerator) {
    bot.exit()
      .catch();
    return;
  }

  if (bot.isTeam) {
    bot.say('Sorry, I don\'t work in Team Spaces due to API limitations.');
    logger.debug('skip team space.. leaving');
    setTimeout(() => {
      bot.exit()
        .catch();
    }, 5000);
    return;
  }

  bot.say('🚨 <@all> 🚨\n\n This space will be deleted in 60 seconds! 🧨 💥 \n\nIf this is incorrect, please remove me from this space **NOW**!')
    .then(setTimeout(() => {
      removeRoom(bot);
    }, 60000));
}

// Handle Spawn Event
framework.on('spawn', async (bot, _id, addedBy) => {
  if (!addedBy) {
    // don't say anything here or your bots spaces will get
    // spammed every time your server is restarted
    logger.debug(`Execute spawn in existing space called: ${bot.room.title}`);
    triggerRemove(bot);
  } else {
    let userRef = addedBy;
    try {
      // Capture Reporter
      const person = await bot.framework.webex.people.get(addedBy);
      userRef = person.userName;
    } catch (error) {
      // continue
    }
    logger.debug(`added to new room by ${userRef}`);
    logger.debug({ message: `action=add roomId=${bot.room.id} team=${bot.isTeam} moderated=${bot.isLocked} email=${userRef}`, labels: { type: 'event' } });
    // addedBy is the ID of the user who just added our bot to a new space,
    if (bot.room.type === 'group') {
      if (bot.isTeam) {
        bot.say(`Sorry <@personId:${addedBy}>, I don't work in Team Spaces due to API limitations.`);
        setTimeout(() => {
          bot.exit()
            .catch();
        }, 5000);
        return;
      }
      // Check for Moderation Status
      if (bot.room.isLocked && !bot.isModerator) {
        bot.say(`<@personId:${addedBy}>, This space is moderated.. please assign me as moderator to initiate detonation!`);
        return;
      }
      triggerRemove(bot);
    }
  }
});

// Bot Added Moderator Event
framework.on('botAddedAsModerator', (bot) => {
  logger.debug('trigger botModAdd');
  triggerRemove(bot);
});

// Bot Removed Moderator Event
framework.on('botRemovedAsModerator', (bot) => {
  logger.debug('trigger botModRem');
  // If room is still moderated, exit.
  if (bot.room.isLocked) {
    bot.exit()
      .catch();
  }
});

// Process Messages
framework.hears(/.*/gim, async (bot, trigger) => {
  logger.debug('trigger hears');
  const person = await bot.framework.webex.people.get(trigger.person.id);
  let identifier = person.displayName;
  // Use @mention if group space
  if (bot.isGroup) {
    identifier = `<@personId:${trigger.person.id}>`;
  }
  const message = `Hello ${identifier}!\n\nI am a simple bot used to automatically delete spaces.\nSimply add me to a group space to initiate the destruction!\n\nIf interested, you can find the source code [here](https://github.com/jeremywillans/tnt-bot)!`;
  // Send Message
  bot.say(message);
});

let server;
// Init Server, if configured
if (config.webhookUrl) {
  // Define Express Path for Incoming Webhooks
  app.post('/framework', webhook(framework));

  // Start Express Server
  server = app.listen(config.port, () => {
    logger.info(`Framework listening on port ${config.port}`);
  });
}

// Gracefully Shutdown (CTRL+C)
process.on('SIGINT', () => {
  logger.debug('Stopping...');
  if (config.webhookUrl) {
    server.close();
  }
  framework.stop().then(() => {
    process.exit();
  });
});

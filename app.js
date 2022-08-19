const Framework = require('webex-node-bot-framework');
const webhook = require('webex-node-bot-framework/webhook');
const debug = require('debug')('tnt:app');
const dotenv = require('dotenv');
const express = require('express');

let config;
// Load Config
try {
  // Try Load from ENV
  if (process.env.TOKEN) {
    debug('Load from ENV');
  } else {
    debug('Load from .env');
    dotenv.config();
  }
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
  debug(`Error: ${error}`);
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
  debug('Framework initialized successfully! [Press CTRL-C to quit]');
});

function removeRoom(bot) {
  debug('initiate removeRoom');
  if (bot.room.isLocked && !bot.isModerator) {
    bot.exit()
      .catch();
    return;
  }
  bot.framework.webex.rooms.remove(bot.room.id)
    .catch();
}

function triggerRemove(bot) {
  debug('initiate triggerRemove');
  if (bot.room.isLocked && !bot.isModerator) {
    bot.exit()
      .catch();
    return;
  }

  if (bot.isTeam) {
    bot.say('Sorry, I don\'t work in Team Spaces due to API limitations.');
    setTimeout(() => {
      bot.exit()
        .catch();
    }, 5000);
    return;
  }

  bot.say('🚨 <@all> 🚨\n\n This space will be deleted in 60 seconds! 🧨 💥 \n\nIf this is incorrect, please remove me from this space!')
    .then(setTimeout(() => {
      removeRoom(bot);
    }, 60000));
}

// Handle Spawn Event
framework.on('spawn', (bot, _id, addedBy) => {
  if (!addedBy) {
    // don't say anything here or your bots spaces will get
    // spammed every time your server is restarted
    debug(`Execute spawn in existing space called: ${bot.room.title}`);
    triggerRemove(bot);
  } else {
    debug('new room');
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
    } else {
      bot.say('Hello!');
    }
  }
});

// Bot Added Moderator Event
framework.on('botAddedAsModerator', (bot) => {
  debug('trigger botModAdd');
  triggerRemove(bot);
});

// Bot Removed Moderator Event
framework.on('botRemovedAsModerator', (bot) => {
  debug('trigger botModRem');
  // If room is still moderated, exit.
  if (bot.room.isLocked) {
    bot.exit()
      .catch();
  }
});

let server;
// Init Server, if configured
if (config.webhookUrl) {
  // Define Express Path for Incoming Webhooks
  app.post('/framework', webhook(framework));

  // Start Express Server
  server = app.listen(config.port, () => {
    debug(`Framework listening on port ${config.port}`);
  });
}

// Gracefully Shutdown (CTRL+C)
process.on('SIGINT', () => {
  debug('Stopping...');
  if (config.webhookUrl) {
    server.close();
  }
  framework.stop().then(() => {
    process.exit();
  });
});

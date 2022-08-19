# tnt-bot

Webex TNT Bot used to delete spaces automatically.

## Deployment
1. Register a Bot at [Webex Developers](https://developer.webex.com/my-apps) for your Organization
2. Build and Deploy Docker Container (or deploy to Cloud)

    **Note:** Webhook, Secret and Port can be omitted if you want to use Websockets.

    ```
    > docker build --tag tnt .
    > docker create --name tnt \
      -e TOKEN=bot-token-from-developer-dot-webex-dot-com \
      (optional) -e WEBHOOK_URL=https://yourdomain.com/framework \
      (optional) -e SECRET=replace-me-with-a-secret-string \
      (optional) -e PORT=3000 \
      tnt

3. Verify Docker logs to ensure bot as started successfully.

## Support
In case you've found a bug, please [open an issue on GitHub](../../issues).

## Credits
Leverages the [webex-node-bot-framework](https://github.com/WebexSamples/webex-node-bot-framework)

## Disclaimer
This script is NOT guaranteed to be bug free and production quality.
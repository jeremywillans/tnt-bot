# tnt-bot

Webex TNT Bot used to delete spaces automatically.

## Deployment
1. Register a Bot at [Webex Developers](https://developer.webex.com/my-apps) for your Organization
2. Build and Deploy Docker Container (or deploy to Cloud)

    ```
    > docker build --tag tnt .
    > docker create --name tnt \
      -e TOKEN=bot-token-from-developer-dot-webex-dot-com \
      tnt

3. Verify Docker logs to ensure bot as started successfully.

### Environmental Variables

The following environmental variables can be used to customize the deployment of this app.

| Name | Required | Type | Default |  Description
| ---- | ---- | ---- | ---- | -------
| TOKEN | yes | string |  | Bot Token
| WEBHOOK_URL | no | string |  | Inbound Webhook URL (must be externally facing)
| SECRET | no | string |  | String used to authenticate Webhook
| PORT | no | int | `3000` | Port used by container
| APP_NAME | no | string | `tnt` | App Name used for Loki Logging
| LOKI_ENABLED | no | bool | `false` | Send Logs to external Loki server
| LOKI_HOST| no | string | `http://loki:3100` | Destination address for Loki server
| CONSOLE_LEVEL | no  | bool | `info` | Logging level exposed to Console

## Support
In case you've found a bug, please [open an issue on GitHub](../../issues).

## Credits
Leverages the [webex-node-bot-framework](https://github.com/WebexSamples/webex-node-bot-framework)

## Disclaimer
This script is NOT guaranteed to be bug free and production quality.
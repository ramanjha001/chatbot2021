

const { DialogBot } = require('./dialogBot');
const emoji = require('node-emoji');

class WelcomeBot extends DialogBot {
    constructor(conversationState, userState) {
        super(conversationState, userState);

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context);
            await next();
        });
    }

    async sendWelcomeMessage(turnContext) {
        console.log("came here 3");
        const { activity } = turnContext;
        
        console.log("activity member added", activity.membersAdded);

        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const smily = emoji.get('full_moon_with_face')
                const welcomeMessage = `Hi, I am you travel planner you can ask me to book your flight and hotel rooms ${smily}`;
                console.log("came here 4");
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }
}

module.exports.WelcomeBot = WelcomeBot;

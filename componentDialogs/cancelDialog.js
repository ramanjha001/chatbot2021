const { ComponentDialog } = require('botbuilder-dialogs');
const { MessageFactory } = require('botbuilder');
const emoji = require('node-emoji');

/**
 * This base class watches for common phrase cancel , start over and takes action on them
 * before they reach the normal bot logic.
 */
class CancelDialog extends ComponentDialog {
    constructor(conversationState, userState) {
        super(conversationState, userState);

        this.conversationState = conversationState;
        this.previousIntent = this.conversationState.createProperty("previousIntent");

    }
    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
                case 'cancel': {
                    const cancelMessageText = 'BOOKINGS CANCELLED!!!';
                    await this.previousIntent.set(innerDc.context, { intentName: null });
                    await innerDc.context.sendActivity(cancelMessageText, cancelMessageText);
                    return await innerDc.cancelAllDialogs();
                }
                case 'start over': {
                    await this.previousIntent.set(innerDc.context, { intentName: null });
                    const smily = emoji.get('full_moon_with_face')
                    const welcomeMessage = `Hi, I am you travel planner you can ask me to book your flight and hotel rooms ${smily}`;
                    await innerDc.context.sendActivity(welcomeMessage);
                    var reply = MessageFactory.suggestedActions(['Book flight', 'Book room']);
                    await innerDc.context.sendActivity(reply);
                    return await innerDc.cancelAllDialogs();
                }

            }
        }
    }
}

module.exports.CancelDialog = CancelDialog;

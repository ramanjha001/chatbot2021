
const { MessageFactory } = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { TextPrompt } = require('botbuilder-dialogs');

const { ComponentDialog } = require('botbuilder-dialogs');


const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

const destinationList = ['DELHI', 'MUMBAI', 'KOLKATA', 'CHENNAI']

class FlightDestinationBooking extends ComponentDialog {

    constructor(id) {
        super(id || 'flightDestinationBooking');

        this.addDialog(new TextPrompt(TEXT_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.destinationStep.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async destinationStep(step) {
        await step.context.sendActivity("What's the destination of flight?")
        var reply = MessageFactory.suggestedActions(destinationList);
        await step.context.sendActivity(reply);
        return await step.prompt(TEXT_PROMPT, '')
    }

    async finalStep(step) {
        step.values.destination = step.result;

        return await step.endDialog(step.values.destination);
    }
}

module.exports.FlightDestinationBooking = FlightDestinationBooking;
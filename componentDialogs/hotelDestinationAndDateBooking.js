
const { MessageFactory } = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { DateTimePrompt, TextPrompt } = require('botbuilder-dialogs');

const { ComponentDialog } = require('botbuilder-dialogs');


const TEXT_PROMPT = 'TEXT_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

const commonDestinationList = ['DELHI', 'MUMBAI', 'KOLKATA', 'CHENNAI']
const commonBookingdate = ['Today', 'Tomorrow']

class HotelDestinationAndDateBooking extends ComponentDialog {

    constructor(id) {
        super(id || 'hotelDestinationAndDateBooking');

        this.addDialog(new TextPrompt(TEXT_PROMPT,));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.destinationStep.bind(this),
            this.hotelBookingDate.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async destinationStep(step) {
            await step.context.sendActivity("Please provide destination for Room booking")
            var reply = MessageFactory.suggestedActions(commonDestinationList);
            await step.context.sendActivity(reply);
            return await step.prompt(TEXT_PROMPT, '')
        }

    async hotelBookingDate(step) {
            step.values.destination = step.result;

            await step.context.sendActivity("For when you want to book room?")
            var reply = MessageFactory.suggestedActions(commonBookingdate);
            await step.context.sendActivity(reply);
            return await step.prompt(DATETIME_PROMPT, '')
    }

    async finalStep(step) {
        step.values.bookingDate = step.result;

        let destinationDateInfo = {
            destination: step.values.destination,
            bookingDate: step.values.bookingDate[0].value
        }
        return await step.endDialog(destinationDateInfo);
}

    async validateHotelSelected(promptContext) {
        const selectedHotel = promptContext.recognized.value
        return promptContext.recognized.succeeded && hotelList.includes(selectedHotel.value);
    }
}

module.exports.HotelDestinationAndDateBooking = HotelDestinationAndDateBooking;
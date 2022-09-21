
const { MessageFactory } = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { DateTimePrompt, TextPrompt } = require('botbuilder-dialogs');
const { ComponentDialog } = require('botbuilder-dialogs');

const { FlightDestinationBooking } = require('./flightDestinationBooking')

var moment = require('moment');


const TEXT_PROMPT = 'TEXT_PROMPT';
const DATETIME_PROMPT = 'DATETIME_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const FLIGHT_DATE_BOOKING = 'flightDateBooking';
const FLIGHT_DESTINATION_BOOKING = 'flightDestinationBooking';
const FLIGHT_DESTINATION = 'flightDestination';

const commonBookingdate = ['Today', 'Tomorrow']
const standardOptions = ["CHANGE DESTINATION", "START OVER", "CHANGE DATE"]

class FlightDateBooking extends ComponentDialog {

    constructor(id, conversationState) {
        super(id || FLIGHT_DATE_BOOKING);

        this.conversationState = conversationState
        this.flightDestination = this.conversationState.createProperty(FLIGHT_DESTINATION);
    
        this.addDialog(new TextPrompt(TEXT_PROMPT,));
        this.addDialog(new DateTimePrompt(DATETIME_PROMPT));
        this.addDialog(new FlightDestinationBooking(FLIGHT_DESTINATION_BOOKING));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.flightBookingDate.bind(this),
            this.flightBookingDateCheck.bind(this),
            this.standardOptionCheck.bind(this),
            this.changeDestinationCheck.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async flightBookingDate(step) {

            await step.context.sendActivity("For when you want to book flight?")
            var reply = MessageFactory.suggestedActions(commonBookingdate);
            await step.context.sendActivity(reply);
            return await step.prompt(DATETIME_PROMPT, '')
    }

    async flightBookingDateCheck(step) {
            
        step.values.flightBookingDate = step.result;

        if(moment(step.values.flightBookingDate[0].value) > moment()) {
            step.values.flightBookingDateValid = true
            return await step.continueDialog();
        } else {
            await step.context.sendActivity("No flights are avaliable for today")
            var reply = MessageFactory.suggestedActions(standardOptions);
            await step.context.sendActivity(reply);
            return await step.prompt(TEXT_PROMPT, '')
        }
    }

    async standardOptionCheck(step) {

        if(step.values.flightBookingDateValid) {
            return await step.continueDialog();
        } else {
            step.values.optionSelected = step.result;
            if(step.values.optionSelected == 'CHANGE DATE') {
               return await step.replaceDialog(FLIGHT_DATE_BOOKING);
            } else if(step.values.optionSelected == 'CHANGE DESTINATION') {
                return await step.beginDialog(FLIGHT_DESTINATION_BOOKING);
            }
        }
    }

    async changeDestinationCheck(step) {
       if(step.values.optionSelected == 'CHANGE DESTINATION') {
        step.values.destination = step.result;
        await this.flightDestination.set(step.context, { flightDestinationInfo: step.values.destination });
        return await step.replaceDialog(FLIGHT_DATE_BOOKING);
        }else {
            return await step.continueDialog();
        }

        
    }

    async finalStep(step) {
        if(step.values.flightBookingDateValid) {
            return await step.endDialog(step.values.flightBookingDate);
        }
}

}

module.exports.FlightDateBooking = FlightDateBooking;
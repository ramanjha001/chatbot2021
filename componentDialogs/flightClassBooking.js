
const { WaterfallDialog } = require('botbuilder-dialogs');
const { ChoicePrompt, ChoiceFactory, TextPrompt } = require('botbuilder-dialogs');
const { ComponentDialog } = require('botbuilder-dialogs');

const { FlightDestinationBooking } = require('./flightDestinationBooking')


const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const FLIGHT_CLASS_BOOKING = 'flightClassBooking';
const FLIGHT_DESTINATION_BOOKING = 'flightDestinationBooking';
const FLIGHT_DESTINATION = 'flightDestination';

const flightClassList = ["ÉCONOMY", "BUSSINESS"]
const standardOptions = ["CHANGE DESTINATION", "START OVER"]

class FlightClassBooking extends ComponentDialog {

    constructor(id, conversationState) {
        super(id || FLIGHT_CLASS_BOOKING);

        this.conversationState = conversationState
        this.flightDestination = this.conversationState.createProperty(FLIGHT_DESTINATION);

        this.addDialog(new TextPrompt(TEXT_PROMPT,));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new FlightDestinationBooking(FLIGHT_DESTINATION_BOOKING));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.flightClassBooking.bind(this),
            this.standardOptionCheck.bind(this),
            this.changeDestinationCheck.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async flightClassBooking(step) {

        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Which class you want to travel',
            choices: ChoiceFactory.toChoices(flightClassList.concat(standardOptions))
        });
    }

    async standardOptionCheck(step) {

        step.values.optionSelected = step.result.value;

        if (flightClassList.includes(step.result.value)) {
            step.values.flightClass = step.result.value;
            return await step.continueDialog();
        } else if (step.values.optionSelected == 'CHANGE DESTINATION') {
            return await step.beginDialog(FLIGHT_DESTINATION_BOOKING);
        }
    }

    async changeDestinationCheck(step) {
        if (step.values.optionSelected == 'CHANGE DESTINATION') {
            step.values.destination = step.result;
            await this.flightDestination.set(step.context, { flightDestinationInfo: step.values.destination });
            return await step.replaceDialog(FLIGHT_CLASS_BOOKING);
        } else {
            return await step.continueDialog();
        }


    }

    async finalStep(step) {
        return await step.endDialog(step.values.flightClass);
    }

}

module.exports.FlightClassBooking = FlightClassBooking;
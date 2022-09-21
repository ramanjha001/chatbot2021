
const { MessageFactory } = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { ChoicePrompt, ChoiceFactory } = require('botbuilder-dialogs');

const { ComponentDialog } = require('botbuilder-dialogs');


const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

const hotelList = ['OYO1234', 'HAYAT', 'TAJ', "GOIBIBO123"];

class HotelSelection extends ComponentDialog {

    constructor(id) {
        super(id || 'hotelSelection');

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT, this.validateHotelSelected));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.hotelBookingStep.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async hotelBookingStep(step) {
        if (!step.values.hotelName) {
            return await step.prompt(CHOICE_PROMPT, {
                prompt: 'Please select from below avaliable hotels',
                choices: ChoiceFactory.toChoices(hotelList)
            });
        }
        else {
            return await step.continueDialog()
        }
    }

    async finalStep(step) {
        step.values.selectedHotel = step.result;

        return await step.endDialog(step.values.selectedHotel);
    }

    async validateHotelSelected(promptContext) {
        const selectedHotel = promptContext.recognized.value
        return promptContext.recognized.succeeded && hotelList.includes(selectedHotel.value);
    }
}

module.exports.HotelSelection = HotelSelection;

const { WaterfallDialog } = require('botbuilder-dialogs');
const { TextPrompt } = require('botbuilder-dialogs');

const { ComponentDialog } = require('botbuilder-dialogs');

const {CardFactory} = require('botbuilder');

const SeatSelectionCard = require('../resources/adaptiveCards/seatSelection')

const CARDS = [
    SeatSelectionCard
];

const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';


class SeatSelection extends ComponentDialog {

    constructor(id) {
        super(id || 'seatSelection');

        this.addDialog(new TextPrompt(TEXT_PROMPT, this.seatValidation));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.seatSelection.bind(this),
            this.finalStep.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async seatSelection(step) {

        const seatSelectionInfo = step.options;

        let seatSelectionMsg = `Awesome, please enter your seat for flight from ${seatSelectionInfo.origin} to 
        ${seatSelectionInfo.destination} for ${seatSelectionInfo.flightClass}`

        if(!step.values.selectedSeat) {
        await step.context.sendActivity({
            attachments: [CardFactory.adaptiveCard(CARDS[0])]
        });
        return await step.prompt(TEXT_PROMPT, {
            prompt: seatSelectionMsg,
            retryPrompt: "Please enter correct seat number"
        });
       } else {
        return await step.continueDialog()
       }

    }

    async finalStep(step) {
        step.values.selectedSeat = step.result;

        await step.context.sendActivity(`Seat ${step.values.selectedSeat} is booked for your flight`)

        return await step.endDialog(step.values.selectedSeat);
    }

    async seatValidation(promptContext) {

        const seatSelected = promptContext.recognized.value
        const sectionWithSeatNumber = seatSelected.split(" ")
        const sections = ['A', 'B', 'C']
        const seats = ['1','2','3','4','5','6']

        let success =  promptContext.recognized.succeeded && sectionWithSeatNumber 
        && Array.isArray(sectionWithSeatNumber) 
        && sections.includes(sectionWithSeatNumber[0])
        && seats.includes(sectionWithSeatNumber[1])

        return success
    }

}

module.exports.SeatSelection = SeatSelection;
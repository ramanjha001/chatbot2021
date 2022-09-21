const { MessageFactory } = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, NumberPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');

const { CardFactory } = require('botbuilder');

const FlightPaymentCard = require('../resources/adaptiveCards/flightPayment')

const CARDS = [
    FlightPaymentCard
];

const { FlightProfile } = require('../model/flightProfile');

const { CancelDialog } = require('./cancelDialog');
const { SeatSelection } = require('./seatSelection');
const { HotelSelection } = require('./hotelSelection');
const { FlightDateBooking } = require('./flightDateBooking')
const { FlightDestinationBooking } = require('./flightDestinationBooking')
const { FlightClassBooking } = require('./flightClassBooking')

const originList = ['DELHI', 'MUMBAI', 'KOLKATA', 'CHENNAI']

const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const SEAT_SELECTION = 'seatSelection';
const HOTEL_SELECTION = 'hotelSelection';
const FLIGHT_DATE_BOOKING = 'flightDateBooking';
const FLIGHT_DESTINATION_BOOKING = 'flightDestinationBooking';
const FLIGHT_CLASS_BOOKING = 'flightClassBooking';
const FLIGHT_PROFILE = 'flightProfile';
const FLIGHT_DESTINATION = 'flightDestination';
var endDialog = '';


class FlightBookingDialog extends CancelDialog {

    constructor(conversationState, userState) {
        super(conversationState, userState);

        this.conversationState = conversationState;
        this.flightProfile = this.conversationState.createProperty(FLIGHT_PROFILE);
        this.flightDestination = this.conversationState.createProperty(FLIGHT_DESTINATION);

        this.addDialog(new TextPrompt(TEXT_PROMPT,));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));
        this.addDialog(new SeatSelection(SEAT_SELECTION));
        this.addDialog(new HotelSelection(HOTEL_SELECTION));
        this.addDialog(new FlightDateBooking(FLIGHT_DATE_BOOKING, this.conversationState));
        this.addDialog(new FlightDestinationBooking(FLIGHT_DESTINATION_BOOKING));
        this.addDialog(new FlightClassBooking(FLIGHT_CLASS_BOOKING, this.conversationState))


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.originBooking.bind(this),
            this.destinationBooking.bind(this),
            this.flightBookingDate.bind(this),
            this.flightClassBooking.bind(this),
            this.flightSeatBooking.bind(this),
            this.flightSeatSelection.bind(this),
            this.flightPaymentStep.bind(this),
            this.flightSummaryStep.bind(this),
            this.hotelSelectionForFlightBookedStep.bind(this),
            this.finalStep.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, accessor, entities) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id, entities);
        }
    }

    async originBooking(step) {
        endDialog = false;

        if (step._info.options) {
            step.values.flightDetailProvidedInQuery = step._info.options
        }

        if (step.values.flightDetailProvidedInQuery.originprovidedInQuery) {
            return await step.continueDialog()
        } else {
            await step.context.sendActivity("What's the origin of flight?")
            var reply = MessageFactory.suggestedActions(originList);
            await step.context.sendActivity(reply);
            return await step.prompt(TEXT_PROMPT, '')
        }
    }

    async destinationBooking(step) {
        if (step.values.flightDetailProvidedInQuery.originprovidedInQuery) {
            step.values.origin = step.values.flightDetailProvidedInQuery.origin;
        } else {
            step.values.origin = step.result;
        }

        if (step.values.flightDetailProvidedInQuery.destinationProvidedInQuery) {
            return await step.continueDialog()
        } else {
            return await step.beginDialog(FLIGHT_DESTINATION_BOOKING);
        }
    }

    async flightBookingDate(step) {
        if (step.values.flightDetailProvidedInQuery.destinationProvidedInQuery) {
            step.values.destination = step.values.flightDetailProvidedInQuery.destination;
        } else {
            step.values.destination = step.result;
        }

        await this.flightDestination.set(step.context, { flightDestinationInfo: step.values.destination });

        return await step.beginDialog(FLIGHT_DATE_BOOKING);
    }

    async flightClassBooking(step) {

        step.values.flightBookingDate = step.result;
        return await step.beginDialog(FLIGHT_CLASS_BOOKING);
    }

    async flightSeatBooking(step) {

        step.values.flightClass = step.result;

        return await step.prompt(CONFIRM_PROMPT, 'Do you want to select seat?', ['yes', 'no']);
    }

    async flightSeatSelection(step) {
        step.values.userOptedSeatSelection = step.result;

        if (step.values.userOptedSeatSelection) {

            const flightBookingDestinationInfo = await this.flightDestination.get(step.context, {});

            let seatSelectionInfo = {
                destination: flightBookingDestinationInfo.flightDestinationInfo.toUpperCase(),
                origin: step.values.origin.toUpperCase(),
                flightClass: step.values.flightClass
            }

            return await step.beginDialog(SEAT_SELECTION, seatSelectionInfo);
        } else {
            return await step.continueDialog()
        }
    }

    async flightPaymentStep(step) {

        if (step.values.userOptedSeatSelection) {
            step.values.selectedSeat = step.result;
        } else {
            step.values.selectedSeat = ''
        }

        await step.context.sendActivity({
            text: 'Click below button to make payment',
            attachments: [CardFactory.adaptiveCard(CARDS[0])]
        });

        return await step.prompt(TEXT_PROMPT, '');
    }

    async flightSummaryStep(step) {

        await this.sleep(10000);

        step.values.paymentDone = true

        const flightBookingDestinationInfo = await this.flightDestination.get(step.context, {});
        this.currentFlightProfile = await this.flightProfile.get(step.context, new FlightProfile());

        const generatedBookingId = ("" + Math.random()).substring(2, 8)

        this.currentFlightProfile.origin = step.values.origin;
        this.currentFlightProfile.destination = flightBookingDestinationInfo.flightDestinationInfo;
        this.currentFlightProfile.flightBookingDate = step.values.flightBookingDate[0].value;
        this.currentFlightProfile.flightClass = step.values.flightClass;
        this.currentFlightProfile.userOptedSeatSelection = step.values.userOptedSeatSelection
        this.currentFlightProfile.selectedSeat = step.values.selectedSeat
        this.currentFlightProfile.paymentDone = step.values.paymentDone
        this.currentFlightProfile.bookingId = generatedBookingId;

        await this.flightProfile.set(step.context, { flightInfo: this.currentFlightProfile });

        let flightSummary = `Thank you for your payment. Your tickets have been booked and your booking ID is ${this.currentFlightProfile.bookingId}  `;

        await step.context.sendActivity(flightSummary)

        return await step.prompt(CONFIRM_PROMPT, 'Do you want to book hotel room also?', ['yes', 'no']);
    }

    async hotelSelectionForFlightBookedStep(step) {

        step.values.hotelNeededForFlightBooked = step.result;

        if (step.values.hotelNeededForFlightBooked) {
            return await step.beginDialog(HOTEL_SELECTION);
        } else {
            return await step.continueDialog();
        }

    }

    async finalStep(step) {

        if (step.values.hotelNeededForFlightBooked) {
            step.values.hotelName = step.result.value;
            let hotelBookedMsg = `${step.values.hotelName} room booked for ${this.currentFlightProfile.destination.toUpperCase()} for ${this.currentFlightProfile.flightBookingDate}`
            await step.context.sendActivity(hotelBookedMsg)
        }
        endDialog = true;
        return await step.endDialog();
    }

    sleep(waitSeconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, waitSeconds);
        });
    }

    async isDialogComplete() {
        return endDialog;
    }

    async validateFlightBookingDate(promptContext) {
        const enteredFlightBookedDate = promptContext.recognized.value
        return promptContext.recognized.succeeded && enteredFlightBookedDate
            && moment(enteredFlightBookedDate[0].value) > moment()
    }


}

module.exports.FlightBookingDialog = FlightBookingDialog;
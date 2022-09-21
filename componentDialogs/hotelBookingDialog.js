

const { WaterfallDialog } = require('botbuilder-dialogs');
const { ConfirmPrompt, TextPrompt } = require('botbuilder-dialogs');
const { DialogSet, DialogTurnStatus } = require('botbuilder-dialogs');
const { HotelProfile } = require('../model/hotelProfile');

const { CancelDialog } = require('./cancelDialog');

const { HotelDestinationAndDateBooking } = require('./hotelDestinationAndDateBooking');
const { HotelSelection } = require('./hotelSelection');


const HOTEL_DESTINATION_DATE_BOOKING = 'hotelDestinationAndDateBooking';
const HOTEL_SELECTION = 'hotelSelection'
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const TEXT_PROMPT = 'TEXT_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const HOTEL_PROFILE = 'hotelprofile';
const FLIGHT_PROFILE = 'flightProfile';
var endDialog = '';


class HotelBookingDialog extends CancelDialog {

    constructor(conservsationState, userState) {
        super(conservsationState, userState);

        this.conservsationState = conservsationState;
        this.hotelProfile = conservsationState.createProperty(HOTEL_PROFILE);

        this.addDialog(new TextPrompt(TEXT_PROMPT,));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new HotelDestinationAndDateBooking(HOTEL_DESTINATION_DATE_BOOKING));
        this.addDialog(new HotelSelection(HOTEL_SELECTION));


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.firstStepHotelBooking.bind(this),
            this.hotelBookingForFlightDestination.bind(this),
            this.destinationStep.bind(this),
            this.selectHotel.bind(this),
            this.hotelSummary.bind(this)

        ]));

        this.initialDialogId = WATERFALL_DIALOG;

    }

    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async firstStepHotelBooking(step) {
        endDialog = false;
        return await step.prompt(CONFIRM_PROMPT, 'Is the book room request initiated within 20 seconds of booking flight?', ['yes', 'no']);
   }

    async hotelBookingForFlightDestination(step) {

            step.values.bookedAfterFlightBooking = step.result;

            if (step.values.bookedAfterFlightBooking) {
                this.flightProfile = this.conservsationState.createProperty(FLIGHT_PROFILE);
                const flightBookingInfo = await this.flightProfile.get(step.context, {});
                step.values.hotelBookingDate = flightBookingInfo.flightInfo.flightBookingDate;
                step.values.hotelDestination = flightBookingInfo.flightInfo.destination;

                let hotelBookingForFlightDestinationMsg = `Do you want to book room for destination ${step.values.hotelDestination}`

                return await step.prompt(CONFIRM_PROMPT, hotelBookingForFlightDestinationMsg, ['yes', 'no']);
            } else {
                return await step.continueDialog();
            }
    }

    async destinationStep(step) {

            if (step.values.bookedAfterFlightBooking) {
                step.values.hotelBookingForFlightDestination = step.result;
            } else {
                step.values.hotelBookingForFlightDestination = false;
            }

            if (step.values.hotelBookingForFlightDestination) {
                return await step.continueDialog();
            } else {
                return await step.beginDialog(HOTEL_DESTINATION_DATE_BOOKING);
            }
    }

    async selectHotel(step) {

        if (!step.values.hotelBookingForFlightDestination) {
            step.values.hotelBookingDate = step.result.bookingDate;
            step.values.hotelDestination = step.result.destination;
        }

        return await step.beginDialog(HOTEL_SELECTION);
    }

    async hotelSummary(step) {
        step.values.hotelName = step.result.value;;

        const hotelProfile = await this.hotelProfile.get(step.context, new HotelProfile());

        hotelProfile.bookedAfterFlightBooking = step.values.bookedAfterFlightBooking;
        hotelProfile.hotelBookingForFlightDestination = step.values.hotelBookingForFlightDestination;
        hotelProfile.hotelDestination = step.values.hotelDestination;
        hotelProfile.hotelBookingDate = step.values.hotelBookingDate;
        hotelProfile.hotelName = step.values.hotelName;

        let hotelSummary = `${hotelProfile.hotelName} room booked for ${hotelProfile.hotelDestination} for ${hotelProfile.hotelBookingDate} `;

        await step.context.sendActivity(hotelSummary)
        endDialog = true;
        return await step.endDialog();
    }


    async isDialogComplete() {
        return endDialog;
    }
}

module.exports.HotelBookingDialog = HotelBookingDialog;
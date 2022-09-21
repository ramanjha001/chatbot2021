const { ActivityHandler, MessageFactory } = require('botbuilder');
const { ActionTypes } = require('botframework-schema');
const { HotelBookingDialog } = require('../componentDialogs/hotelBookingDialog');
const { FlightBookingDialog } = require('../componentDialogs/flightBookingDialog');
const { LuisRecognizer } = require('botbuilder-ai');


class DialogBot extends ActivityHandler {
    constructor(conversationState, userState) {
        super(conversationState, userState);

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.hotelBookingDialog = new HotelBookingDialog(this.conversationState, this.userState);
        this.flightBookingDialog = new FlightBookingDialog(this.conversationState, this.userState);

        this.conversationData = this.conversationState.createProperty('conservationData');
        this.previousIntent = this.conversationState.createProperty("previousIntent");


        this.onDialog(async (context, next) => {
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${process.env.LuisAPIHostName}.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true);

        this.onMessage(async (context, next) => {

            const luisOutput = await dispatchRecognizer.recognize(context)
            const intent = LuisRecognizer.topIntent(luisOutput);
            const entities = this.fetchEntities(luisOutput, intent)
            await this.dispatchToIntentAsync(context, intent, entities);
            await next();
        });


    }

    async sendSuggestedActions(turnContext) {
        const cardActions = [
            {
                type: ActionTypes.PostBack,
                title: 'Book Flight',
                value: 'Book Flight'
            },
            {
                type: ActionTypes.PostBack,
                title: 'Book Room',
                value: 'Book Room'
            }
        ];

        var reply = MessageFactory.suggestedActions(cardActions);
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context, intent, entities) {

        var currentIntent = ''
        const previousIntent = await this.previousIntent.get(context, {});
        const conversationData = await this.conversationData.get(context, {});

        if (previousIntent.intentName && conversationData.endDialog === false) {
            currentIntent = previousIntent.intentName;

        }
        else if (previousIntent.intentName && conversationData.endDialog === true) {
            currentIntent = intent;

        }
        else if (!previousIntent.intentName && intent == "None") {
            await this.sendSuggestedActions(context);
        }
        else {
            currentIntent = intent;
            await this.previousIntent.set(context, { intentName: intent });
        }

        switch (currentIntent) {

            case 'Book_Flight':
                console.log("Inside Book flight case");
                await this.conversationData.set(context, { endDialog: false });
                await this.flightBookingDialog.run(context, this.dialogState, entities);
                conversationData.endDialog = await this.flightBookingDialog.isDialogComplete();
                if (conversationData.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;

            case 'Book_Room':
                console.log("Inside Book room Case");
                await this.conversationData.set(context, { endDialog: false });
                await this.hotelBookingDialog.run(context, this.dialogState);
                conversationData.endDialog = await this.hotelBookingDialog.isDialogComplete();
                if (conversationData.endDialog) {
                    await this.previousIntent.set(context, { intentName: null });
                    await this.sendSuggestedActions(context);
                }
                break;
            default:
                await context.sendActivity("Please select suggested bookings")
                await this.previousIntent.set(context, { intentName: null });
                await this.sendSuggestedActions(context);
                break;
        }
    }

    fetchEntities(luisOutput, currentIntent) {

        let currentEntities = null
        let formattedEntities = {
            origin: "",
            destination: "",
            originprovidedInQuery: false,
            destinationProvidedInQuery: false
        }

        if (luisOutput.luisResult.entities && luisOutput.luisResult.entities.length > 0) {
            currentEntities = luisOutput.luisResult.entities[0]
        } else {
            currentEntities = luisOutput.entities;
        }

        if (currentIntent == "Book_Flight" && currentEntities.children && currentEntities.children.length > 0) {
            currentEntities.children.forEach(element => {
                if (element.type == 'origin') {
                    formattedEntities.origin = element.entity
                    formattedEntities.originprovidedInQuery = true
                } else if (element.type == 'destination') {
                    formattedEntities.destination = element.entity
                    formattedEntities.destinationProvidedInQuery = true
                }
            });
        }
        return formattedEntities;
    }
}

module.exports.DialogBot = DialogBot;

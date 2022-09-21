class FlightProfile {
    constructor(origin, destination, flightBookingDate, flightClass,userOptedSeatSelection, selectedSeat, paymentDone, bookingId) {
        this.origin = origin;
        this.destination = destination;
        this.flightBookingDate = flightBookingDate;
        this.flightClass = flightClass;
        this.userOptedSeatSelection = userOptedSeatSelection
        this.selectedSeat = selectedSeat;
        this.paymentDone = paymentDone;
        this.bookingId = bookingId
    }
}

module.exports.FlightProfile = FlightProfile;
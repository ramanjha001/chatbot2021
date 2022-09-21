class HotelProfile {
    constructor(bookedAfterFlightBooking, hotelBookingForFlightDestination, hotelDestination, hotelBookingDate, hotelName) {
        this.bookedAfterFlightBooking = bookedAfterFlightBooking;
        this.hotelBookingForFlightDestination = hotelBookingForFlightDestination;
        this.hotelDestination = hotelDestination;
        this.hotelBookingDate = hotelBookingDate;
        this.hotelName = hotelName;
    }
}

module.exports.HotelProfile = HotelProfile;
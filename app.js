import TicketService from "./src/pairtest/TicketService.js";
import TicketTypeRequest from "./src/pairtest/lib/TicketTypeRequest.js";
import TicketPaymentService from "./src/thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "./src/thirdparty/seatbooking/SeatReservationService.js";

const paymentService = new TicketPaymentService();
const reservationService = new SeatReservationService();
const ticketService = new TicketService(paymentService, reservationService);

const ticketTypeRequests = [
    new TicketTypeRequest("ADULT", 10),
    new TicketTypeRequest("CHILD", 20),
    new TicketTypeRequest("INFANT", 20),
];
  
const data1 = {
    accountId: 1,
    ticketTypeRequests:ticketTypeRequests
}

try {
    const resp = ticketService.purchaseTickets(data1.accountId, ...data1.ticketTypeRequests)
    console.log(resp)
} catch (error) {
    console.log(error)
}
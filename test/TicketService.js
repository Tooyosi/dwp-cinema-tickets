import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService.js";
import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService.js";

const validTicketTypeRequests = [
  new TicketTypeRequest("ADULT", 10),
  new TicketTypeRequest("CHILD", 20),
  new TicketTypeRequest("INFANT", 20),
];

const invalidTicketTypeRequests = [
  new TicketTypeRequest("CHILD", 20),
  new TicketTypeRequest("INFANT", 20),
];

const paymentService = new TicketPaymentService()

const reservationService = new SeatReservationService()

describe("purchaseTickets exceptions", function () {
  const ticketService = new TicketService(paymentService, reservationService);

  test("should throw an InvalidPurchaseException if no parameters are passed", function () {
    expect(() => ticketService.purchaseTickets()).toThrow(InvalidPurchaseException);
  });

  test("should throw an InvalidPurchaseException if wrong account id is passed", function () {
    expect(() => ticketService.purchaseTickets("wrongId")).toThrow(InvalidPurchaseException);
  });

  test("should throw an InvalidPurchaseException if correct id is passed and no requests are passed", function () {
    expect(() => ticketService.purchaseTickets(1)).toThrow(InvalidPurchaseException);
  });

  test("should throw an InvalidPurchaseException if wrong ticket types are passed", function () {
    expect(() => ticketService.purchaseTickets(1, "ticket type")).toThrow(InvalidPurchaseException);
  });

  test("should send invalid information data with invalid requests", function () {
    try {
      ticketService.purchaseTickets(1, ...invalidTicketTypeRequests);
    } catch (error) {
      expect(error.data).toBeTruthy();
      expect(error.data["INFANT"]).toBeTruthy();
      expect(error.data["INFANT"]).toBe(20);
    }
  });
});

describe("purchaseTickets success", function () {
  const ticketService = new TicketService(paymentService, reservationService);
  let request;

  beforeAll(() => {
    request = ticketService.purchaseTickets(1, ...validTicketTypeRequests);
  });

  test("should calculate the correct amount paid", function () {
    expect(request.amount).toBeTruthy();
    expect(request.amount).toBe(400);
  });

  test("should calculate the correct number of seats", function () {
    expect(request.seats).toBeTruthy();
    expect(request.seats).toBe(30);
  });

  test("should calculate the valid tickets", function () {
    expect(request.validTickets).toBeTruthy();
    expect(request.validTickets["INFANT"]).toBe(10);
    expect(request.validTickets["ADULT"]).toBe(10);
  });

  test("should calculate the invalid tickets", function () {
    expect(request.invalidTickets).toBeTruthy();
    expect(request.invalidTickets["INFANT"]).toBe(10);
  });
});

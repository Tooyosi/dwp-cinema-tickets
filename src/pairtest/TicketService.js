import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #paymentService;
  #reservationService;
  #infant = "INFANT";
  #adult = "ADULT";
  #child = "CHILD";
  #childPrice = 10;
  #adultPrice = 20;
  #validTickets = {};
  #invalidTickets = {};

  constructor(paymentService, reservationService) {
    this.#paymentService = paymentService;
    this.#reservationService = reservationService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validatePurchase(accountId, ticketTypeRequests);

    this.#processTicketTypeRequests(ticketTypeRequests);

    const { seats, amount } = this.#getPaymentAmountAndSeats();

    // reserve seats
    this.#reserveSeats(accountId, seats);

    // make payment
    this.#processPayment(accountId, amount);

    // return payment details
    return {
      amount,
      seats,
      validTickets: this.#validTickets,
      invalidTickets: this.#invalidTickets,
    };
  }

  #validatePurchase(accountId, ticketTypeRequests) {
    // throws InvalidPurchaseException
    if (isNaN(accountId) || accountId < 1) {
      throw new InvalidPurchaseException("Invalid Account");
    }

    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException("Invalid Ticket requests");
    }

    for (const request of ticketTypeRequests) {
      if (!(request instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException("Invalid ticket purchase request");
      }
    }
  }

  #processTicketTypeRequests(ticketTypeRequests) {
    for (const request of ticketTypeRequests) {
      const type = request.getTicketType();
      const quantity = request.getNoOfTickets();

      this.#addValidTickets(type, quantity);
    }

    this.#adjustInfantTickets();
    this.#rejectTicketsForNoAdults();
    this.#rejectInvalidTickets();
  }

  #adjustInfantTickets() {
    const infantTickets = this.#getInfantTicket();
    const adultTickets = this.#getAdultTicket();

    // infants sitting on adults' lap and assuming a maximum of one infant to one adult and infants more than adults
    if (infantTickets > adultTickets) {
      // make infants same as adults and reject the remaining infant tickets
      const difference = infantTickets - adultTickets;
      this.#assignTicket(this.#infant, adultTickets);
      this.#addInvalidTickets(this.#infant, difference);
    }
  }

  #rejectTicketsForNoAdults() {
    const adultTickets = this.#getAdultTicket();
    // if no adult, reject all tickets as child and infant cannot purchase tickets
    // however, I assume with one adult, multiple children can purchase tickets
    if (adultTickets === 0) {
      this.#moveAllValidTicketsToInvalid();
    }
  }

  #rejectInvalidTickets() {
    // throw an error if no valid tickets
    if (!this.#hasValidTickets()) {
      const errStr = "There are no valid tickets.\n" + this.#ticketDetails();
      throw new InvalidPurchaseException(errStr, this.#invalidTickets);
    }
  }

  #moveAllValidTicketsToInvalid() {
    Object.entries(this.#validTickets).forEach(([type, quantity]) => {
      this.#addInvalidTickets(type, quantity);
    });

    this.#validTickets = {};
  }

  #hasValidTickets() {
    return Object.keys(this.#validTickets).length > 0;
  }

  #ticketDetails(validity = "invalid") {
    const ticketObj =
      validity === "invalid" ? this.#invalidTickets : this.#validTickets;
    let returnStr =
      Object.keys(ticketObj).length > 0
        ? `The following are ${validity} tickets: \n`
        : "";

    Object.entries(ticketObj).forEach((ticket) => {
      returnStr += `${ticket[0]} - ${ticket[1]}\n`;
    });
    return returnStr;
  }

  #processPayment(accountId, totalAmountToPay) {
    try {
      this.#paymentService.makePayment(accountId, totalAmountToPay);
    } catch (error) {
      throw new InvalidPurchaseException(
        `Account with id: ${accountId} is unable to make a payment`
      );
    }
  }

  #getPaymentAmount(type, amount) {
    switch (type) {
      case this.#child:
        return amount * this.#childPrice;
      case this.#adult:
        return amount * this.#adultPrice;
      default:
        return amount;
    }
  }

  #getPaymentAmountAndSeats() {
    let amount = 0;
    let seats = 0;
    Object.entries(this.#validTickets).forEach((ticket) => {
      // don't calculate for infants since their price is 0 and they sit on adults' lap
      if (ticket[0] !== this.#infant) {
        seats += ticket[1];
        amount += this.#getPaymentAmount(ticket[0], ticket[1]);
      }
    });
    return { seats, amount };
  }

  #reserveSeats(accountId, noOfSeats) {
    try {
      this.#reservationService.reserveSeat(accountId, noOfSeats);
    } catch (error) {
      throw new InvalidPurchaseException(
        `Account with id: ${accountId} is unable to reserve a seat`
      );
    }
  }

  #addValidTickets(type, noOfTickets) {
    this.#validTickets[type] = this.#validTickets[type]
      ? this.#validTickets[type] + noOfTickets
      : noOfTickets;
  }

  #assignTicket(type, noOfTickets) {
    this.#validTickets[type] = noOfTickets;
  }

  #addInvalidTickets(type, noOfTickets) {
    this.#invalidTickets[type] = this.#invalidTickets[type]
      ? this.#invalidTickets[type] + noOfTickets
      : noOfTickets;
  }

  #getInfantTicket() {
    return this.#validTickets[this.#infant] || 0;
  }

  #getAdultTicket() {
    return this.#validTickets[this.#adult] || 0;
  }

  #getChildTicket() {
    return this.#validTickets[this.#child] || 0;
  }
}

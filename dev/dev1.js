(function anonymous(
) {
  const { TRUE, FALSE, JOKER, HEART, deck, playerCount, cardsCount, equals, cardSuit, nextTurn, hasCard, end } = arguments[0] ?? {};
  if (equals(cardSuit(JOKER, HEART), FALSE)) {
    nextTurn(playerCount);
    hasCard(deck, JOKER);
  } else {
    if (equals(TRUE, equals(playerCount, cardsCount))) {
      end();
    } else { }
  }
})

// startsWith(hasCard(players, a1))
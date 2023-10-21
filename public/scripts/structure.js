/// <reference path="../helper/structure.h.ts"/>

/** @type {Structure} */
const BaseStructure = {
  "types": {
    "Number": {
      "info": "Represents a numberic value"
    },
    "String": {
      "info": "Represents a text value"
    },
    "Boolean": {
      "info": "Represents a boolean value. Either true or false"
    },
    "Void": {
      "info": "Represents an empty value or nothing"
    },
    "Player": {
      "info": "Represents a Player entity"
    },
    "Card": {
      "info": "Represents a Player entity"
    },
    "CardSuit": {
      "info": "Represents a card suit"
    },
    "CardRank": {
      "info": "Represents a card rank"
    },
    "CardColor": {
      "info": "Represents a card rank"
    }
  },
  "scopes": {

    "global": {
      "info": "Global scope",
      "literals": {
        "TRUE": {
          "type": "Boolean",
          "info": "true"
        },
        "FALSE": {
          "type": "Boolean",
          "info": "not true"
        },
        "BLACK": {
          "type": "CardColor",
          "info": "Black"
        },
        "RED": {
          "type": "CardColor",
          "info": "Red"
        },
        "SPADE": {
          "type": "CardSuit",
          "info": "Spade"
        },
        "HEART": {
          "type": "CardSuit",
          "info": "Heart"
        },
        "CLUB": {
          "type": "CardSuit",
          "info": "Club"
        },
        "DIAMOND": {
          "type": "CardSuit",
          "info": "Diamond"
        },
        "A": {
          "type": "CardRank",
          "info": "Ace"
        },
        "2": {
          "type": "CardRank",
          "info": "2"
        },
        "3": {
          "type": "CardRank",
          "info": "3"
        },
        "4": {
          "type": "CardRank",
          "info": "4"
        },
        "5": {
          "type": "CardRank",
          "info": "5"
        },
        "6": {
          "type": "CardRank",
          "info": "6"
        },
        "7": {
          "type": "CardRank",
          "info": "7"
        },
        "8": {
          "type": "CardRank",
          "info": "8"
        },
        "9": {
          "type": "CardRank",
          "info": "9"
        },
        "10": {
          "type": "CardRank",
          "info": "10"
        },
        "J": {
          "type": "CardRank",
          "info": "Jack"
        },
        "Q": {
          "type": "CardRank",
          "info": "Queen"
        },
        "K": {
          "type": "CardRank",
          "info": "King"
        },
        "JOKER": {
          "type": "Card",
          "info": "Joker"
        }
      },
      "variables": {
        "players": {
          "type": "Player[]",
          "info": "people playing the game"
        },
        "playersRemaining": {
          "type": "Player[]",
          "info": "remaining players for the rest of the game/round"
        },
        "playersEliminated": {
          "type": "Player[]",
          "info": "eliminated players for the rest of the game"
        },
        "playerCount": {
          "type": "Number",
          "info": "Number of people playing the game"
        },
        "deck": {
          "type": "Card[]",
          "info": "Cards in deck"
        }
      },
      "methods": {
        "equals": {
          "info": "Checks whether two things are same or not",
          "templates": {
            "T": [ "Number", "String", "Boolean", "Player", "Card", "CardRank", "CardSuit" ]
          },
          "params": [ "T", "T" ],
          "returns": "Boolean",
          "representation": [ "$0", " is same as ", "$1" ]
        },
        "isEmpty": {
          "info": "Checks whether the specified collection has any items or not",
          "templates": {
            "T": [ "Player[]", "Card[]", "CardSuit[]" ]
          },
          "params": [ "T" ],
          "returns": "Boolean",
          "representation": [ "$0", " is empty" ]
        },
        "intersect": {
          "info": "The intersection of two set of collections",
          "templates": {
            "T": [ "Player[]", "Card[]", "CardSuit[]" ]
          },
          "params": [ "T", "T" ],
          "returns": "T",
          "representation": [ "items that are present in both ", "$0", " and ", "$1" ]
        },
        "union": {
          "info": "The union of two set of collections",
          "templates": {
            "T": [ "Player[]", "Card[]", "CardSuit[]" ]
          },
          "params": [ "T", "T" ],
          "returns": "T",
          "representation": [ "items that are either present in ", "$0", " or present in ", "$1" ]
        },
        "difference": {
          "info": "The difference of two set of collections",
          "templates": {
            "T": [ "Player[]", "Card[]", "CardSuit[]" ]
          },
          "params": [ "T", "T" ],
          "returns": "T",
          "representation": [ "items that are present in ", "$0", " but not present in ", "$1" ]
        },
        "count": {
          "info": "Count the number of items in a collection",
          "templates": {
            "T": [ "Player[]", "Card[]" ]
          },
          "params": [ "T" ],
          "returns": "Number",
          "representation": [ "number of ", "$0" ]
        },
        "hasCard": {
          "info": "Checks whether a set of cards has the specified card or not",
          "params": [ "Card[]", "Card" ],
          "returns": "Boolean",
          "representation": [ "$0", " has ", "$1" ]
        },
        "concat": {
          "info": "Combines two set of collections into one new collection",
          "templates": {
            "T": [ "Card[]", "CardSuit[]" ]
          },
          "params": [ "T", "T" ],
          "returns": "T",
          "representation": [ "$0", " or ", "$1" ]
        },
        "maxCardRank": {
          "info": "Maximum rank in a set of cards",
          "params": [ "Card[]" ],
          "returns": "Card",
          "representation": [ "largest card rank among ", "$0" ]
        },
        "minCardRank": {
          "info": "Minimum rank in a set of cards",
          "params": [ "Card[]" ],
          "returns": "Card",
          "representation": [ "smallest among ", "$0" ]
        },
        "firstCard": {
          "info": "First card in a set of cards",
          "params": [ "Card[]" ],
          "returns": "Card",
          "representation": [ "first card among ", "$0" ]
        },
        "last": {
          "info": "Last item in a set of items",
          "templates": {
            "T[]": [ "Card", "CardSuit" ]
          },
          "params": [ "T" ],
          "returns": "T",
          "representation": [ "last item among ", "$0" ]
        },
        "firstSuit": {
          "info": "First card suit in a set of card suits",
          "params": [ "CardSuit[]" ],
          "returns": "CardSuit",
          "representation": [ "first suit among ", "$0" ]
        },
        "suitsInCards": {
          "info": "Suits in a set of cards",
          "params": [ "Card[]" ],
          "returns": "CardSuit[]",
          "representation": [ "suits present in ", "$0" ]
        },
        "end": {
          "info": "Ends the game",
          "params": [],
          "returns": "Void",
          "representation": [ "end the game" ]
        },
        "cardsOfPlayer": {
          "info": "gets cards of a player",
          "params": [ "Player" ],
          "returns": "Card[]",
          "representation": [ "cards of ", "$0" ]
        },
        "getPlayerByCard": {
          "info": "Finds the player in a group of players based on the specified card",
          "params": [ "Player[]", "Card" ],
          "returns": "Player",
          "representation": [ "player who has ", "$1", " among ", "$0" ]
        },
        "currentPlayerOfCard": {
          "info": "player who holds/played the card",
          "params": [ "Card" ],
          "returns": "Player",
          "representation": [ "Player who holds/played the ", "$0" ]
        },
        "cardOf": {
          "info": "Get the card using specifying rank and suit",
          "params": [ "CardRank", "CardSuit" ],
          "returns": "Card",
          "representation": [ "$0", " of ", "$1" ]
        },
        "setNextLeader": {
          "info": "Sets the next round leader",
          "params": [ "Player" ],
          "literals": [ "0", "+Number", "-Number" ],
          "returns": "Void",
          "representation": [ "set ", "$0", " to be the next round's leader" ]
        }
      },
      "operators": {
        "$0 + $1": {
          "info": "Adds",
          "operands": [ "CardSuit[]", "CardSuit[]" ],
          "returns": "CardSuit[]",
          "representation": [ "$0", " or ", "$1" ]
        },
        "$0 ++": {
          "info": "Adds",
          "operands": [ "Number" ],
          "returns": "Number",
          "representation": [ "$0", " incremented by 1" ]
        }
      }
    },

    "cardsPlayed": {
      "info": "When player plays/places cards",
      "literals": {},
      "variables": {
        "cardsCount": {
          "type": "Number",
          "info": "Number of cards played/placed by the player"
        },
        "dealer": {
          "type": "Player",
          "info": "Dealer for the current game"
        },
        "currentLeader": {
          "type": "Player",
          "info": "Player who played the first card in the current round"
        },
        "nextLeader": {
          "type": "Player",
          "info": "Player who will be the first to play their card(s) in the next round"
        },
        "player": {
          "type": "Player",
          "info": "Player who played/placed the card"
        },
        "playedCards": {
          "type": "Card[]",
          "info": "Cards played/placed by the player"
        },
        "allPlayedCards": {
          "type": "Card[]",
          "info": "All cards played/placed in the current round"
        },
        "playedPlayers": {
          "type": "Player[]",
          "info": "players who have played their card(s) for the current round"
        }
      },
      "methods": {
        "isFirstToPlay": {
          "info": "Checks whether a player is the first to play their card(s) in the current round or not",
          "params": [ "Player" ],
          "returns": "Boolean",
          "representation": [ "$0", " is the first to play their card(s) in the current round" ]
        },
        "hasCardSuit": {
          "info": "Checks if the card has specified suit",
          "params": [ "Card", "CardSuit" ],
          "returns": "Boolean",
          "representation": [ "$0", " has the ", "$1" ]
        },
        "drawCards": {
          "info": "Draws a specified number of cards from a set of cards for a player",
          "params": [ "Player", "Card[]", "Number" ],
          "returns": "Void",
          "representation": [ "$0", " will draw ", "$2", " card(s) from ", "$1" ]
        },
        "allowCard": {
          "info": "Allows a set of cards to be played for current and future rounds",
          "params": [ "Card[]" ],
          "returns": "Void",
          "representation": [ "Only allow card(s) from ", "$0", " to be played in current and future rounds" ]
        },
        "allowCardSuit": {
          "info": "Allows a set of card suits to be played for current and future rounds",
          "params": [ "CardSuit[]" ],
          "returns": "Void",
          "representation": [ "Only allow card suit(s) from ", "$0", " to be played in current and future rounds" ]
        },
        "allowAllCards": {
          "info": "Allows every card to be played for current and future rounds",
          "params": [],
          "returns": "Void",
          "representation": [ "Allow every card to be played in current and future rounds" ]
        },
        "allowAllCardSuits": {
          "info": "Allows every card suit to be played for current and future rounds",
          "params": [],
          "returns": "Void",
          "representation": [ "Allow every card suit to be played in current and future rounds" ]
        },
        "endRound": {
          "info": "Ends the current round",
          "params": [],
          "returns": "Void",
          "representation": [ "End the current round" ]
        }
      }
    },

    "playTurn": {
      "info": "Before player's turn",
      "literals": {},
      "variables": {
        "player": {
          "type": "Player",
          "info": "player who will be playing his card next"
        },
        "allowedCards": {
          "type": "Card[]",
          "info": "cards allowed to play with for the current round"
        },
        "allowedCardSuits": {
          "type": "CardSuit[]",
          "info": "card suits allowed to play with for current round"
        }
      },
      "methods": {
      }
    },

    "dealingDone": {
      "info": "After all the cards have been dealt",
      "literals": {},
      "variables": {
        "cardsPerPlayer": {
          "type": "Number",
          "info": "Number of cards dealed to each player (floored value)"
        },
        "cardsCount": {
          "type": "Number",
          "info": "Total number of cards dealed"
        },
        "dealer": {
          "type": "Player",
          "info": "Dealer for the current game"
        }
      },
      "methods": {
        "startsWith": {
          "info": "Player who will play/place the first card",
          "params": [ "Player" ],
          "returns": "Void",
          "representation": [ "$0", " will be the first one to play/place their card(s)" ]
        }
      }
    }

  }
};

export default BaseStructure;
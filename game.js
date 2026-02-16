// ─── Game Data ───
const CARD_DEFS = {
  homestead: { name: "The Homestead", tier: 0, cost: 0, activation: [], color: "#6B8E6B", desc: "Produces 1 Resource + 1 Labor on your turn" },
  veggie_farm: { name: "Vegetable Farm", tier: 1, cost: 20, activation: [1, 2], color: "#4a9e4a", desc: "Get 1 Resource", qty: 8, produce: { resources: 1 } },
  suburban_house: { name: "Suburban House", tier: 1, cost: 20, activation: [1, 2, 3], color: "#5b7fbf", desc: "Get 1 Labor", qty: 6, produce: { labor: 1 } },
  grain_field: { name: "Grain Field", tier: 1, cost: 20, activation: [3, 4], color: "#4a9e4a", desc: "Get 1 Resource", qty: 6, produce: { resources: 1 } },
  apartment: { name: "Apartment Block", tier: 1, cost: 40, activation: [4, 5, 6], color: "#5b7fbf", desc: "Get 2 Labor", qty: 6, produce: { labor: 2 } },
  forest: { name: "Old Growth Forest", tier: 1, cost: 40, activation: [5, 6], color: "#4a9e4a", desc: "Get 2 Resources", qty: 4, produce: { resources: 2 } },
  small_factory: { name: "Small Factory", tier: 2, cost: 50, activation: [2, 3], color: "#d4a843", desc: "1 Res + 1 Lab → 1 Good", qty: 6, convert: { resIn: 1, labIn: 1, goodsOut: 1 } },
  bakery: { name: "Bakery", tier: 2, cost: 60, activation: [4, 5], color: "#d4a843", desc: "2 Res → 1 Good", qty: 6, convert: { resIn: 2, labIn: 0, goodsOut: 1 } },
  textile_mill: { name: "Textile Mill", tier: 2, cost: 60, activation: [1, 6], color: "#d4a843", desc: "2 Lab → 1 Good", qty: 6, convert: { resIn: 0, labIn: 2, goodsOut: 1 } },
  tech_mfg: { name: "Tech Manufacturer", tier: 2, cost: 100, activation: [5, 6], color: "#d4a843", desc: "1 Res + 2 Lab → 2 Goods", qty: 6, convert: { resIn: 1, labIn: 2, goodsOut: 2 } },
  general_store: { name: "General Store", tier: 3, cost: 100, activation: [1, 2], color: "#c45454", desc: "Sell 1 Good → $50", qty: 6, sell: { goodsIn: 1, cashOut: 50 } },
  sushi: { name: "Sushi Restaurant", tier: 3, cost: 150, activation: [3, 4], color: "#c45454", desc: "Sell up to 2 Goods → $75 each", qty: 6, sell: { goodsIn: 2, cashOut: 75 } },
  mall: { name: "Shopping Mall", tier: 3, cost: 300, activation: [5, 6], color: "#c45454", desc: "Sell up to 3 Goods → $100 each", qty: 4, sell: { goodsIn: 3, cashOut: 100 } },
  fitness: { name: "Fitness Studio", tier: 3, cost: 80, activation: [7], color: "#c45454", desc: "Roll 2 dice unlock. If sum=7, get $20", qty: 2, sell: null },
};

const ACTION_CARDS = [
  { id: "union_strike", name: "Union Strike", qty: 4, desc: "Place on opponent's Tier 2 card — it won't activate until a Settle Strike is played." },
  { id: "settle_strike", name: "Settle Strike", qty: 6, desc: "Remove a Union Strike from any Tier 2 card." },
  { id: "tax_audit", name: "Tax Audit", qty: 1, desc: "Target player pays $5 per card in their city." },
  { id: "corporate_espionage", name: "Corporate Espionage", qty: 1, desc: "Steal 1 Good from any player." },
  { id: "supply_disruption", name: "Supply Chain Disruption", qty: 1, desc: "All opponents discard 2 Resources or 2 Labor." },
  { id: "hostile_zoning", name: "Hostile Zoning", qty: 1, desc: "Double an opponent's building cost when they try to Build." },
  { id: "legal_injunction", name: "Legal Injunction", qty: 1, desc: "Cancel a Hostile Takeover targeting you." },
  { id: "offshore", name: "Off-Shore Accounts", qty: 1, desc: "Negate any Action Card effect targeting you." },
  { id: "security_detail", name: "Security Detail", qty: 1, desc: "Block token theft. Opponent pays you $10." },
  { id: "gov_grant", name: "Government Grant", qty: 1, desc: "Take $50 from the Bank." },
  { id: "surplus", name: "Surplus Surplus", qty: 1, desc: "Take 3 Resources OR 3 Labor from the Bank." },
  { id: "popup_shop", name: "Pop-Up Shop", qty: 1, desc: "Sell up to 2 Goods for $60 each (no Tier 3 needed)." },
  { id: "angel_investor", name: "Angel Investor", qty: 1, desc: "Get $10 per Tier 2 card you own." },
  { id: "liquidation", name: "Liquidation Sale", qty: 1, desc: "Trade any Resources/Labor to Bank for $5 each." },
  { id: "zoning_permit", name: "Zoning Permit", qty: 1, desc: "Pay half cost (rounded up) for any building." },
  { id: "double_shift", name: "Double Shift", qty: 1, desc: "One of your cards activates twice this turn." },
  { id: "the_fixer", name: 'The "Fixer"', qty: 1, desc: "After rolling, change any die to any number." },
  { id: "urban_renewal", name: "Urban Renewal", qty: 1, desc: "Wipe one Market row for free (doesn't use your action)." },
  { id: "warehouse", name: "Warehouse Expansion", qty: 1, desc: "Storage limit becomes 20 tokens until end of next turn." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function buildDeck(tier) {
  const cards = [];
  Object.entries(CARD_DEFS).forEach(([id, def]) => {
    if (def.tier === tier && def.qty) {
      for (let i = 0; i < def.qty; i++) cards.push({ ...def, id: `${id}_${i}`, defId: id });
    }
  });
  return shuffle(cards);
}

function buildActionDeck() {
  const cards = [];
  ACTION_CARDS.forEach(ac => {
    for (let i = 0; i < ac.qty; i++) cards.push({ ...ac, uid: `${ac.id}_${i}` });
  });
  return shuffle(cards);
}

function createGame(playerNames) {
  const deck1 = buildDeck(1), deck2 = buildDeck(2), deck3 = buildDeck(3);
  const actionDeck = buildActionDeck();
  const market = { tier1: deck1.splice(0, 3), tier2: deck2.splice(0, 3), tier3: deck3.splice(0, 3) };
  const players = playerNames.map((name, i) => ({
    name,
    cash: 50,
    resources: 0, labor: 0, goods: 0,
    city: [{ ...CARD_DEFS.homestead, id: `homestead_${i}`, defId: "homestead" }],
    actionCards: [],
    strikes: {},
    storageBonus: 0,
  }));
  const rolls = players.map(() => rollDie());
  const first = rolls.indexOf(Math.max(...rolls));
  return {
    players, market, deck1, deck2, deck3, actionDeck, actionDiscard: [],
    currentPlayer: first,
    phase: "production",
    diceRoll: null, dice: [null, null],
    usedTwoDice: false, chosenDie: null,
    log: [`Game started! ${players[first].name} goes first.`],
    winner: null,
    pendingConversions: [],
    pendingSales: [],
    turnSubPhase: null,
    discardNeeded: 0,
  };
}

function addLog(game, msg) { game.log.push(msg); }

function checkWinner(game) {
  for (let i = 0; i < game.players.length; i++) {
    if (game.players[i].cash >= 1500 && game.winner === null) {
      game.winner = i;
      addLog(game, `🏆 ${game.players[i].name} wins with $${game.players[i].cash}!`);
      return true;
    }
  }
  return false;
}

function hasTier(player, tier) {
  return player.city.some(c => c.tier === tier);
}

function advanceToNextPlayer(game) {
  const ap = game.players[game.currentPlayer];
  ap.storageBonus = 0;
  game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
  game.phase = "production";
  game.diceRoll = null;
  game.dice = [null, null];
  game.usedTwoDice = false;
  game.chosenDie = null;
  game.pendingConversions = [];
  game.pendingSales = [];
  game.turnSubPhase = null;
  game.discardNeeded = 0;
  addLog(game, `--- ${game.players[game.currentPlayer].name}'s turn ---`);
}

// ─── Game Actions ───

function doRoll(game, useTwoDice) {
  if (game.phase !== "production") return { error: "Not in production phase" };
  const ap = game.players[game.currentPlayer];
  const canRollTwo = ap.city.some(c => c.defId === "fitness");
  if (useTwoDice && !canRollTwo) return { error: "No Fitness Studio" };

  const d1 = rollDie();
  const d2 = useTwoDice ? rollDie() : null;
  game.dice = [d1, d2];
  game.usedTwoDice = useTwoDice;

  if (useTwoDice) {
    game.phase = "choose_die";
    game.diceRoll = null;
    addLog(game, `${ap.name} rolled ${d1} and ${d2}.`);
    if (d1 + d2 === 7) {
      ap.cash += 20;
      addLog(game, `Sum is 7! Fitness Studio pays $20.`);
      // Check all players with fitness for the sum=7 bonus
      game.players.forEach((p, i) => {
        if (i !== game.currentPlayer && p.city.some(c => c.defId === "fitness")) {
          p.cash += 20;
          addLog(game, `${p.name}'s Fitness Studio also pays $20!`);
        }
      });
      checkWinner(game);
    }
  } else {
    game.diceRoll = d1;
    game.phase = "resolve_production";
    addLog(game, `${ap.name} rolled ${d1}.`);
  }
  return { success: true, dice: [d1, d2] };
}

function doChooseDie(game, val) {
  if (game.phase !== "choose_die") return { error: "Not choosing die" };
  if (val !== game.dice[0] && val !== game.dice[1]) return { error: "Invalid die value" };
  game.diceRoll = val;
  game.chosenDie = val;
  game.phase = "resolve_production";
  addLog(game, `Chose ${val} for production.`);
  return { success: true };
}

function doResolveProduction(game) {
  if (game.phase !== "resolve_production") return { error: "Not resolving" };
  const roll = game.diceRoll;

  // Tier 1 production for ALL players
  game.players.forEach((p, pi) => {
    const isActive = pi === game.currentPlayer;
    p.city.forEach(card => {
      if (card.tier === 0 && isActive) {
        p.resources += 1;
        p.labor += 1;
      }
      if (card.tier === 1 && card.activation.includes(roll) && card.produce) {
        p.resources += (card.produce.resources || 0);
        p.labor += (card.produce.labor || 0);
      }
    });
  });

  // Auto-process Tier 2 and Tier 3 for non-active players
  game.players.forEach((p, pi) => {
    if (pi === game.currentPlayer) return;
    p.city.forEach(card => {
      if (card.tier === 2 && card.activation.includes(roll) && card.convert && !p.strikes[card.id]) {
        const cv = card.convert;
        if (p.resources >= cv.resIn && p.labor >= cv.labIn) {
          p.resources -= cv.resIn;
          p.labor -= cv.labIn;
          p.goods += cv.goodsOut;
          addLog(game, `${p.name}'s ${card.name} converts → ${cv.goodsOut} Good(s).`);
        }
      }
    });
    p.city.forEach(card => {
      if (card.tier === 3 && card.activation.includes(roll) && card.sell) {
        const canSell = Math.min(card.sell.goodsIn, p.goods);
        if (canSell > 0) {
          p.goods -= canSell;
          p.cash += canSell * card.sell.cashOut;
          addLog(game, `${p.name}'s ${card.name} sells ${canSell} Good(s) for $${canSell * card.sell.cashOut}.`);
        }
      }
    });
  });

  checkWinner(game);

  // Collect active player's pending conversions and sales
  const ap = game.players[game.currentPlayer];
  const t2 = ap.city.filter(c => c.tier === 2 && c.activation.includes(roll) && !ap.strikes[c.id]);
  const t3 = ap.city.filter(c => c.tier === 3 && c.activation.includes(roll) && c.sell);
  game.pendingConversions = t2.map(c => c.id);
  game.pendingSales = t3.map(c => c.id);

  if (t2.length > 0) {
    game.phase = "convert";
  } else if (t3.length > 0) {
    game.phase = "sell";
  } else {
    game.phase = "action";
  }
  return { success: true };
}

function doConvert(game, cardId, doIt) {
  if (game.phase !== "convert") return { error: "Not converting" };
  const ap = game.players[game.currentPlayer];
  const card = ap.city.find(c => c.id === cardId);
  if (!card || !game.pendingConversions.includes(cardId)) return { error: "Invalid card" };

  if (doIt && card.convert) {
    const cv = card.convert;
    if (ap.resources >= cv.resIn && ap.labor >= cv.labIn) {
      ap.resources -= cv.resIn;
      ap.labor -= cv.labIn;
      ap.goods += cv.goodsOut;
      addLog(game, `${ap.name}'s ${card.name} converts → ${cv.goodsOut} Good(s).`);
    } else {
      addLog(game, `Not enough inputs for ${card.name}.`);
    }
  }

  game.pendingConversions = game.pendingConversions.filter(id => id !== cardId);
  if (game.pendingConversions.length === 0) {
    if (game.pendingSales.length > 0) {
      game.phase = "sell";
    } else {
      game.phase = "action";
    }
  }
  return { success: true };
}

function doSell(game, cardId, doIt) {
  if (game.phase !== "sell") return { error: "Not selling" };
  const ap = game.players[game.currentPlayer];
  const card = ap.city.find(c => c.id === cardId);
  if (!card || !game.pendingSales.includes(cardId)) return { error: "Invalid card" };

  if (doIt && card.sell) {
    const canSell = Math.min(card.sell.goodsIn, ap.goods);
    if (canSell > 0) {
      ap.goods -= canSell;
      ap.cash += canSell * card.sell.cashOut;
      addLog(game, `${ap.name}'s ${card.name} sells ${canSell} Good(s) for $${canSell * card.sell.cashOut}.`);
    }
  }

  game.pendingSales = game.pendingSales.filter(id => id !== cardId);
  if (checkWinner(game)) return { success: true };
  if (game.pendingSales.length === 0) game.phase = "action";
  return { success: true };
}

function doBuild(game, marketTier, idx) {
  if (game.phase !== "action") return { error: "Not action phase" };
  const ap = game.players[game.currentPlayer];
  const tierKey = `tier${marketTier}`;
  const card = game.market[tierKey][idx];
  if (!card) return { error: "No card there" };
  if (marketTier === 2 && !hasTier(ap, 1)) return { error: "Need Tier 1 first" };
  if (marketTier === 3 && !hasTier(ap, 2)) return { error: "Need Tier 2 first" };

  let cost = card.cost;
  const zpIdx = ap.actionCards.findIndex(ac => ac.id === "zoning_permit");
  if (zpIdx >= 0) {
    cost = Math.ceil(cost / 2);
    ap.actionCards.splice(zpIdx, 1);
    addLog(game, `Used Zoning Permit! Half price: $${cost}`);
  }
  if (ap.cash < cost) return { error: `Need $${cost}` };

  ap.cash -= cost;
  ap.city.push(card);
  const deckKey = `deck${marketTier}`;
  game.market[tierKey][idx] = game[deckKey].length > 0 ? game[deckKey].shift() : null;
  addLog(game, `${ap.name} built ${card.name} for $${cost}.`);
  game.phase = "end_turn";
  return { success: true };
}

function doTradeBank(game, tokenType) {
  if (game.phase !== "action") return { error: "Not action phase" };
  const ap = game.players[game.currentPlayer];
  if (tokenType === "resources" && ap.resources >= 3) { ap.resources -= 3; ap.cash += 10; addLog(game, `${ap.name} traded 3 Resources for $10.`); }
  else if (tokenType === "labor" && ap.labor >= 3) { ap.labor -= 3; ap.cash += 10; addLog(game, `${ap.name} traded 3 Labor for $10.`); }
  else if (tokenType === "goods" && ap.goods >= 3) { ap.goods -= 3; ap.cash += 10; addLog(game, `${ap.name} traded 3 Goods for $10.`); }
  else return { error: "Need 3 of that token type" };
  checkWinner(game);
  game.phase = "end_turn";
  return { success: true };
}

function doTakeover(game, targetPI, cardIdx) {
  if (game.phase !== "action") return { error: "Not action phase" };
  const ap = game.players[game.currentPlayer];
  const target = game.players[targetPI];
  if (!target || targetPI === game.currentPlayer) return { error: "Invalid target" };
  const card = target.city[cardIdx];
  if (!card || card.defId === "homestead") return { error: "Can't take Homestead" };
  if (ap.cash < card.cost) return { error: `Need $${card.cost}` };

  ap.cash -= card.cost;
  target.cash += card.cost;
  // Transfer up to 3 tokens
  let given = 0;
  while (given < 3 && ap.goods > 0) { ap.goods--; target.goods++; given++; }
  while (given < 3 && ap.labor > 0) { ap.labor--; target.labor++; given++; }
  while (given < 3 && ap.resources > 0) { ap.resources--; target.resources++; given++; }
  target.city.splice(cardIdx, 1);
  ap.city.push(card);
  addLog(game, `${ap.name} took over ${card.name} from ${target.name} for $${card.cost} + ${given} tokens!`);
  checkWinner(game);
  game.phase = "end_turn";
  return { success: true };
}

function doWipeMarket(game, tier) {
  if (game.phase !== "action") return { error: "Not action phase" };
  const tierKey = `tier${tier}`;
  const deckKey = `deck${tier}`;
  game.market[tierKey] = [];
  for (let i = 0; i < 3; i++) {
    game.market[tierKey].push(game[deckKey].length > 0 ? game[deckKey].shift() : null);
  }
  addLog(game, `${game.players[game.currentPlayer].name} wiped Tier ${tier} market.`);
  game.phase = "end_turn";
  return { success: true };
}

function doLobbyCouncil(game) {
  if (game.phase !== "action") return { error: "Not action phase" };
  const ap = game.players[game.currentPlayer];
  if (ap.cash < 20) return { error: "Need $20" };
  if (game.actionDeck.length === 0) {
    game.actionDeck = shuffle(game.actionDiscard);
    game.actionDiscard = [];
  }
  if (game.actionDeck.length === 0) return { error: "No action cards left" };
  ap.cash -= 20;
  const drawn = game.actionDeck.shift();
  ap.actionCards.push(drawn);
  addLog(game, `${ap.name} lobbied City Council and drew: ${drawn.name}.`);
  game.phase = "end_turn";
  return { success: true };
}

function doPass(game) {
  if (game.phase !== "action") return { error: "Not action phase" };
  addLog(game, `${game.players[game.currentPlayer].name} passed.`);
  game.phase = "end_turn";
  return { success: true };
}

function doPlayActionCard(game, cardIdx) {
  const ap = game.players[game.currentPlayer];
  if (cardIdx < 0 || cardIdx >= ap.actionCards.length) return { error: "Invalid card" };
  const card = ap.actionCards[cardIdx];
  ap.actionCards.splice(cardIdx, 1);

  switch (card.id) {
    case "gov_grant": ap.cash += 50; addLog(game, `${ap.name} played Government Grant: +$50!`); break;
    case "surplus": ap.resources += 3; addLog(game, `${ap.name} played Surplus Surplus: +3 Resources!`); break;
    case "angel_investor": {
      const t2count = ap.city.filter(c => c.tier === 2).length;
      ap.cash += t2count * 10;
      addLog(game, `${ap.name} played Angel Investor: +$${t2count * 10}.`);
      break;
    }
    case "popup_shop": {
      const sold = Math.min(2, ap.goods);
      ap.goods -= sold; ap.cash += sold * 60;
      addLog(game, `${ap.name} played Pop-Up Shop: sold ${sold} Goods for $${sold * 60}.`);
      break;
    }
    case "liquidation": {
      const total = ap.resources + ap.labor;
      ap.cash += total * 5;
      addLog(game, `${ap.name} played Liquidation Sale: ${total} tokens for $${total * 5}.`);
      ap.resources = 0; ap.labor = 0;
      break;
    }
    case "tax_audit": {
      let maxCash = -1, ti = -1;
      game.players.forEach((p, i) => { if (i !== game.currentPlayer && p.cash > maxCash) { maxCash = p.cash; ti = i; } });
      if (ti >= 0) {
        const target = game.players[ti];
        const tax = target.city.length * 5;
        target.cash = Math.max(0, target.cash - tax);
        addLog(game, `${ap.name} played Tax Audit on ${target.name}: -$${tax}!`);
      }
      break;
    }
    case "corporate_espionage": {
      const vi = game.players.findIndex((p, i) => i !== game.currentPlayer && p.goods > 0);
      if (vi >= 0) {
        game.players[vi].goods--;
        ap.goods++;
        addLog(game, `${ap.name} stole 1 Good from ${game.players[vi].name}!`);
      } else { addLog(game, "No one has goods to steal!"); }
      break;
    }
    case "supply_disruption": {
      game.players.forEach((p, i) => {
        if (i === game.currentPlayer) return;
        let rem = 2;
        while (rem > 0 && p.resources > 0) { p.resources--; rem--; }
        while (rem > 0 && p.labor > 0) { p.labor--; rem--; }
        addLog(game, `${p.name} lost ${2 - rem} tokens from Supply Disruption.`);
      });
      break;
    }
    case "warehouse": {
      ap.storageBonus = 10;
      addLog(game, `${ap.name} played Warehouse Expansion: storage limit now 20!`);
      break;
    }
    default:
      addLog(game, `${ap.name} played ${card.name}.`);
  }
  game.actionDiscard.push(card);
  checkWinner(game);
  return { success: true };
}

function doEndTurn(game) {
  if (game.phase !== "end_turn") return { error: "Not end of turn" };
  const ap = game.players[game.currentPlayer];
  const limit = 10 + (ap.storageBonus || 0);
  const total = ap.resources + ap.labor + ap.goods;
  if (total > limit) {
    game.phase = "discard_tokens";
    game.discardNeeded = total - limit;
    return { success: true };
  }
  if (checkWinner(game)) return { success: true };
  advanceToNextPlayer(game);
  return { success: true };
}

function doDiscardToken(game, type) {
  if (game.phase !== "discard_tokens") return { error: "Not discarding" };
  const ap = game.players[game.currentPlayer];
  if (type === "resource" && ap.resources > 0) { ap.resources--; addLog(game, `${ap.name} discarded 1 Resource.`); }
  else if (type === "labor" && ap.labor > 0) { ap.labor--; addLog(game, `${ap.name} discarded 1 Labor.`); }
  else if (type === "goods" && ap.goods > 0) { ap.goods--; addLog(game, `${ap.name} discarded 1 Good.`); }
  else return { error: "None to discard" };

  const limit = 10 + (ap.storageBonus || 0);
  const total = ap.resources + ap.labor + ap.goods;
  game.discardNeeded = Math.max(0, total - limit);
  if (total <= limit) {
    if (checkWinner(game)) return { success: true };
    advanceToNextPlayer(game);
  }
  return { success: true };
}

// Create a sanitized view of the game for a specific player (hides other players' action cards)
function getPlayerView(game, playerIndex) {
  const view = JSON.parse(JSON.stringify(game));
  // Hide deck contents
  delete view.deck1;
  delete view.deck2;
  delete view.deck3;
  delete view.actionDeck;
  delete view.actionDiscard;
  // Hide other players' action card details
  view.players.forEach((p, i) => {
    if (i !== playerIndex) {
      p.actionCards = p.actionCards.map(() => ({ hidden: true }));
    }
  });
  return view;
}

module.exports = {
  createGame, getPlayerView,
  doRoll, doChooseDie, doResolveProduction,
  doConvert, doSell,
  doBuild, doTradeBank, doTakeover, doWipeMarket, doLobbyCouncil, doPass,
  doPlayActionCard, doEndTurn, doDiscardToken,
  CARD_DEFS, ACTION_CARDS,
};

from __future__ import annotations

from decimal import Decimal

from django.utils import timezone

from .data import INDEX_CONFIG, get_live_market_data, market_status, money, nearest_strike


RISK_WARNINGS = [
    "Rule-based educational view only; this is not financial advice.",
    "No guaranteed predictions. Use position sizing, stop loss, and independent judgment.",
]


def analyze_market(
    index: str,
    budget: Decimal,
    risk: str,
    current_price: Decimal | None = None,
) -> dict:
    live = get_live_market_data()
    snapshot = live["indices"][index]
    chain = live["option_chains"][index]
    candles = live["candles"][index]
    step = INDEX_CONFIG[index]["step"]
    price = float(current_price) if current_price is not None else float(snapshot["price"])
    atm = nearest_strike(price, step)
    candle_metrics = _candle_metrics(candles, price)
    status = live["market_status"]
    support = candle_metrics["support"]
    resistance = candle_metrics["resistance"]
    range_width = max(resistance - support, step * 0.35)
    range_pct = (range_width / price) * 100 if price else 0
    volatility = float(chain.get("volatility") or live["volatility"]["value"] or 12)
    high_decay = bool(status["high_decay"])
    near_atm = abs(price - atm) <= step * 0.20
    near_resistance = resistance - price <= step * 0.25
    near_support = price - support <= step * 0.25
    momentum = candle_metrics["momentum_percent"]

    if high_decay and range_pct < _range_threshold(index) and near_atm:
        market_state = "Expiry Trap"
        pattern = "Expiry Sideways Trap"
        interpretation = "Price is pinned close to the ATM strike while time decay accelerates."
    elif momentum > 0.22 and price >= resistance - step * 0.18:
        market_state = "Trend Up"
        pattern = "Momentum Continuation"
        interpretation = "Buyers are defending higher prices and breakout continuation is possible."
    elif momentum < -0.22 and price <= support + step * 0.18:
        market_state = "Trend Down"
        pattern = "Momentum Breakdown"
        interpretation = "Sellers are controlling bounce attempts near lower range levels."
    elif volatility < 11 and range_pct < _range_threshold(index):
        market_state = "Sideways"
        pattern = "Range Compression"
        interpretation = "Premiums can decay quickly because volatility and range expansion are muted."
    elif (near_resistance or near_support) and volatility < 13:
        market_state = "Fake Breakout Risk"
        pattern = "Liquidity Sweep Watch"
        interpretation = "Price is near an obvious range edge without enough volatility confirmation."
    else:
        market_state = "Balanced"
        pattern = "Structure Building"
        interpretation = "Market is waiting for either range acceptance or a confirmed directional break."

    strength = _strength_score(momentum, range_pct, volatility, market_state)
    probabilities = _probabilities(market_state, high_decay, volatility, range_pct)
    decision = _decision(market_state, probabilities, strength, budget, risk, high_decay)

    return {
        "index": index,
        "budget": money(budget),
        "risk": risk,
        "current_price": money(price),
        "source": live["source"],
        "is_live": live["is_live"],
        "time": status["time"],
        "date": status["date"],
        "timezone": status["timezone"],
        "market_status": status["status"],
        "market_state": market_state,
        "pattern": pattern,
        "interpretation": interpretation,
        "strength_score": strength,
        "support_resistance": {
            "support": money(support),
            "resistance": money(resistance),
            "range_width": money(range_width),
            "range_percent": money(range_pct),
            "atm_strike": atm,
        },
        "risk_meter": _risk_meter(market_state, volatility, high_decay, risk),
        "expiry_decay": "High" if high_decay else "Normal",
        "retail": _retail_read(market_state, high_decay),
        "operator": _operator_read(market_state, high_decay),
        "probability": probabilities,
        "decision": decision,
        "volatility": {"value": money(volatility), "label": _volatility_label(volatility)},
        "option_chain": chain,
        "candles": candles,
        "risk_warnings": RISK_WARNINGS,
    }


def suggest_strikes(
    index: str,
    budget: Decimal,
    risk: str,
    current_price: Decimal | None = None,
) -> dict:
    analysis = analyze_market(index=index, budget=budget, risk=risk, current_price=current_price)
    chain = analysis["option_chain"]
    price = float(analysis["current_price"])
    step = INDEX_CONFIG[index]["step"]
    atm = chain.get("atm_strike") or nearest_strike(price, step)
    state = analysis["market_state"]
    direction = _preferred_direction(state)

    templates = [
        {
            "profile": "Conservative",
            "moneyness": "ITM",
            "offset": -step if direction == "CE" else step,
            "side": direction,
            "risk_label": "Low",
            "allocation": 0.35,
            "entry": "Enter only after retest holds beyond the range edge for 5 minutes.",
        },
        {
            "profile": "Balanced",
            "moneyness": "ATM",
            "offset": 0,
            "side": direction,
            "risk_label": "Medium",
            "allocation": 0.30,
            "entry": "Enter after momentum candle closes with no immediate rejection.",
        },
        {
            "profile": "Aggressive",
            "moneyness": "OTM",
            "offset": step if direction == "CE" else -step,
            "side": direction,
            "risk_label": "High",
            "allocation": 0.20,
            "entry": "Use only if breakout expands quickly with volatility confirmation.",
        },
    ]

    if risk == "Low":
        templates = templates[:2]

    suggestions = []
    for template in templates:
        strike = int(atm + template["offset"])
        side = template["side"]
        premium = _premium_from_chain(chain, strike, side)
        stop_loss = max(premium * (0.22 if template["risk_label"] == "Low" else 0.30), 5)
        target = premium + stop_loss * (1.55 if template["risk_label"] == "Low" else 1.85)
        allocation = float(budget) * template["allocation"]
        suggestions.append(
            {
                "profile": template["profile"],
                "strike": strike,
                "moneyness": template["moneyness"],
                "option_type": side,
                "entry_condition": template["entry"],
                "entry_zone": f"Rs {money(max(premium * 0.97, 1))} - Rs {money(premium * 1.05)}",
                "stop_loss": f"Rs {money(max(premium - stop_loss, 1))} premium or index invalidation.",
                "target": f"Rs {money(target)} premium or first exhaustion candle.",
                "risk_label": template["risk_label"],
                "capital_note": f"Suggested max allocation Rs {money(allocation)} from Rs {money(budget)}.",
                "premium_source": chain.get("source", "option chain"),
            }
        )

    return {
        "index": index,
        "budget": money(budget),
        "risk": risk,
        "current_price": money(price),
        "market_state": state,
        "nearest_atm": atm,
        "preferred_direction": direction,
        "suggestions": suggestions,
        "risk_warnings": RISK_WARNINGS,
    }


def generate_copy(
    index: str,
    budget: Decimal,
    risk: str,
    current_price: Decimal | None = None,
) -> dict:
    analysis = analyze_market(index=index, budget=budget, risk=risk, current_price=current_price)
    probability = analysis["probability"]
    message = f"""777c8 MARKET ANALYSIS

Index: {analysis["index"]}
Time: {analysis["time"]} {analysis["timezone"]}
Price: {analysis["current_price"]}

Market State: {analysis["market_state"]}
Pattern: {analysis["pattern"]}

Retail:
{analysis["retail"]}

Operator:
{analysis["operator"]}

Probability:
Sideways: {probability["sideways"]}%
Breakout: {probability["breakout"]}%
Sharp Move: {probability["sharp_move"]}%

Decision:
{analysis["decision"]}

Risk Warning: Rule-based market interpretation only. No guaranteed predictions.

#777c8 #{analysis["index"].title()} #Trading"""
    return {"message": message, "analysis": analysis}


def generate_image_payload(
    index: str,
    budget: Decimal,
    risk: str,
    image_format: str = "square",
    current_price: Decimal | None = None,
) -> dict:
    analysis = analyze_market(index=index, budget=budget, risk=risk, current_price=current_price)
    size = {"square": {"width": 1080, "height": 1080}, "story": {"width": 1080, "height": 1920}}[
        image_format
    ]
    return {
        "format": image_format,
        "size": size,
        "brand": "777c8",
        "watermark": "777c8 Market Intelligence",
        "analysis": analysis,
        "risk_warnings": RISK_WARNINGS,
    }


def _candle_metrics(candles: list[dict], price: float) -> dict:
    if not candles:
        return {"support": price, "resistance": price, "momentum_percent": 0}
    highs = [float(item["high"]) for item in candles if item.get("high")]
    lows = [float(item["low"]) for item in candles if item.get("low")]
    closes = [float(item["close"]) for item in candles if item.get("close")]
    support = min(lows) if lows else price
    resistance = max(highs) if highs else price
    first = closes[0] if closes else price
    last = closes[-1] if closes else price
    return {
        "support": support,
        "resistance": resistance,
        "momentum_percent": ((last - first) / first) * 100 if first else 0,
    }


def _range_threshold(index: str) -> float:
    return 0.42 if index == "NIFTY" else 0.52


def _strength_score(momentum: float, range_pct: float, volatility: float, state: str) -> int:
    if state in {"Expiry Trap", "Sideways"}:
        return int(max(28, min(58, 52 - range_pct * 20 + volatility * 0.4)))
    if state == "Fake Breakout Risk":
        return 46
    score = 52 + abs(momentum) * 80 + min(volatility, 22) * 0.9
    return int(max(0, min(100, score)))


def _probabilities(state: str, high_decay: bool, volatility: float, range_pct: float) -> dict:
    if state == "Expiry Trap":
        sideways, breakout, sharp = 72, 14, 14
    elif state == "Fake Breakout Risk":
        sideways, breakout, sharp = 54, 24, 22
    elif state in {"Trend Up", "Trend Down"}:
        sideways, breakout, sharp = 22, 58, 20
    elif state == "Sideways":
        sideways, breakout, sharp = 64, 22, 14
    else:
        sideways, breakout, sharp = 42, 35, 23

    if high_decay:
        sideways += 8
        breakout -= 5
        sharp -= 3
    if volatility > 18:
        sharp += 6
        sideways -= 4
        breakout -= 2
    if range_pct < 0.35:
        sideways += 5
        breakout -= 3
        sharp -= 2

    total = max(1, sideways + breakout + sharp)
    result = {
        "sideways": round(sideways * 100 / total),
        "breakout": round(breakout * 100 / total),
        "sharp_move": round(sharp * 100 / total),
    }
    result["breakout"] += 100 - sum(result.values())
    return result


def _decision(state: str, probability: dict, strength: int, budget: Decimal, risk: str, high_decay: bool) -> str:
    if budget < (Decimal("2500") if risk == "Low" else Decimal("1500")):
        return "AVOID"
    if state == "Expiry Trap" or (high_decay and probability["sideways"] >= 58):
        return "AVOID"
    if state in {"Sideways", "Fake Breakout Risk", "Balanced"} or strength < 58:
        return "WAIT"
    return "TRADE SETUP"


def _risk_meter(state: str, volatility: float, high_decay: bool, risk: str) -> dict:
    score = 35
    if state in {"Expiry Trap", "Fake Breakout Risk"}:
        score += 25
    if volatility > 18:
        score += 18
    if high_decay:
        score += 15
    if risk == "High":
        score += 8
    score = min(100, score)
    label = "Extreme" if score >= 75 else "High" if score >= 58 else "Moderate" if score >= 38 else "Low"
    return {"score": score, "label": label}


def _retail_read(state: str, high_decay: bool) -> str:
    if state == "Expiry Trap":
        return "Retail is likely buying late options around the ATM strike, expecting a breakout while premium decay accelerates."
    if state == "Fake Breakout Risk":
        return "Retail may chase the visible edge of the range, creating liquidity for a quick rejection."
    if state == "Trend Up":
        return "Retail waits for confirmation, then enters late after the easiest part of the move is priced in."
    if state == "Trend Down":
        return "Retail tries to catch bounces while sellers keep pressure near every weak pullback."
    suffix = " and time decay is becoming more expensive" if high_decay else ""
    return f"Retail is reacting to short-term candles without a clean structural trigger{suffix}."


def _operator_read(state: str, high_decay: bool) -> str:
    if state == "Expiry Trap":
        return "Operators are likely holding price near the strike to compress movement and harvest premium decay."
    if state == "Fake Breakout Risk":
        return "Operators may probe above or below obvious levels to trigger stops before reverting price into range."
    if state == "Trend Up":
        return "Operators are allowing price expansion after absorbing supply near resistance."
    if state == "Trend Down":
        return "Operators are using bounce liquidity to continue downside pressure."
    suffix = " while option sellers stay protected" if high_decay else ""
    return f"Operators appear to be defending range edges and waiting for stronger liquidity imbalance{suffix}."


def _preferred_direction(state: str) -> str:
    if state == "Trend Down":
        return "PE"
    return "CE"


def _premium_from_chain(chain: dict, strike: int, side: str) -> float:
    key = side.lower()
    for row in chain.get("nearby", []):
        if int(row.get("strike", 0)) == int(strike):
            premium = row.get(key, {}).get("ltp")
            if premium:
                return float(premium)
    underlying = float(chain.get("underlying") or strike)
    step = 100 if chain.get("symbol") == "BANKNIFTY" else 50
    intrinsic = max(0.0, underlying - strike) if side == "CE" else max(0.0, strike - underlying)
    return money(max(step * 0.18, intrinsic + step * 0.28))


def _volatility_label(value: float) -> str:
    if value < 11:
        return "Low"
    if value > 18:
        return "Elevated"
    return "Moderate"

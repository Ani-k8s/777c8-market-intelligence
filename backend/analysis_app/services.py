from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone


RISK_WARNINGS = [
    "Rule-based educational view only; this is not financial advice.",
    "No outcome is guaranteed. Use predefined stop losses and position sizing.",
]


def _money(value: Decimal | float | int) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _strike_step(index: str) -> int:
    return 100 if index == "BANKNIFTY" else 50


def _nearest_strike(price: Decimal, step: int) -> int:
    units = (price / Decimal(step)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(units * step)


def _risk_threshold(risk: str) -> int:
    return {"Low": 70, "Medium": 58, "High": 48}[risk]


def analyze_market(index: str, budget: Decimal, risk: str, current_price: Decimal) -> dict:
    step = _strike_step(index)
    nearest = _nearest_strike(current_price, step)
    half_step = Decimal(step) / Decimal("2")
    range_low = Decimal(nearest) - half_step
    range_high = Decimal(nearest) + half_step
    distance = current_price - Decimal(nearest)
    distance_ratio = abs(distance) / Decimal(step)

    local_now = timezone.localtime()
    market_minutes = local_now.hour * 60 + local_now.minute
    high_decay = market_minutes >= (14 * 60 + 30)
    range_hold = abs(distance) <= Decimal(step) * Decimal("0.18")

    if high_decay and range_hold:
        market_state = "Trap"
        pattern = "Expiry Trap"
        strength = 42
    elif distance >= Decimal(step) * Decimal("0.24"):
        market_state = "Trend Up"
        pattern = "Upper Range Breakout Watch"
        strength = int(min(100, 56 + distance_ratio * Decimal("70")))
    elif distance <= -Decimal(step) * Decimal("0.24"):
        market_state = "Trend Down"
        pattern = "Lower Range Breakdown Watch"
        strength = int(min(100, 56 + distance_ratio * Decimal("70")))
    elif range_hold:
        market_state = "Sideways"
        pattern = "Range Compression"
        strength = 48 if high_decay else 54
    else:
        market_state = "Sideways"
        pattern = "Range Hold"
        strength = 52 if high_decay else 58

    probabilities = _probabilities(market_state, high_decay, risk)
    decision = _decision(market_state, strength, probabilities, high_decay, budget, risk)

    return {
        "index": index,
        "budget": _money(budget),
        "risk": risk,
        "current_price": _money(current_price),
        "time": local_now.strftime("%I:%M %p"),
        "date": local_now.strftime("%Y-%m-%d"),
        "timezone": str(local_now.tzinfo),
        "market_state": market_state,
        "strength_score": strength,
        "pattern": pattern,
        "expiry_decay": "High" if high_decay else "Normal",
        "range_detection": {
            "nearest_strike": nearest,
            "range_low": _money(range_low),
            "range_high": _money(range_high),
            "range_status": "Pinned near strike" if range_hold else "Testing range edge",
        },
        "retail": _retail_read(market_state, high_decay),
        "operator": _operator_read(market_state, high_decay),
        "probability": probabilities,
        "decision": decision,
        "risk_warnings": RISK_WARNINGS,
    }


def _probabilities(market_state: str, high_decay: bool, risk: str) -> dict:
    if market_state == "Trap":
        sideways, breakout, sharp = 68, 17, 15
    elif market_state in {"Trend Up", "Trend Down"}:
        sideways, breakout, sharp = 24, 56, 20
    else:
        sideways, breakout, sharp = 60, 25, 15

    if high_decay:
        sideways += 8
        breakout -= 6
        sharp -= 2
    if risk == "High":
        sharp += 5
        sideways -= 3
        breakout -= 2
    elif risk == "Low":
        sideways += 4
        sharp -= 2
        breakout -= 2

    total = max(1, sideways + breakout + sharp)
    normalized = {
        "sideways": round(sideways * 100 / total),
        "breakout": round(breakout * 100 / total),
        "sharp_move": round(sharp * 100 / total),
    }
    drift = 100 - sum(normalized.values())
    normalized["breakout"] += drift
    return normalized


def _decision(
    market_state: str,
    strength: int,
    probabilities: dict,
    high_decay: bool,
    budget: Decimal,
    risk: str,
) -> str:
    minimum_budget = Decimal("2500.00") if risk == "Low" else Decimal("1500.00")
    if budget < minimum_budget:
        return "AVOID"
    if market_state == "Trap" or (high_decay and probabilities["sideways"] >= 58):
        return "AVOID"
    if market_state == "Sideways" or strength < _risk_threshold(risk):
        return "WAIT"
    return "TRADE SETUP"


def _retail_read(market_state: str, high_decay: bool) -> str:
    if market_state == "Trap":
        return "Buying options expecting breakout while entering late into premium decay."
    if market_state == "Sideways":
        return "Chasing both sides of the range and reacting after failed follow-through."
    suffix = " with time decay pressure rising" if high_decay else ""
    return f"Following the visible move after confirmation appears{suffix}."


def _operator_read(market_state: str, high_decay: bool) -> str:
    if market_state == "Trap":
        return "Holding price near the strike, forcing range behavior and inducing time decay."
    if market_state == "Sideways":
        return "Defending the range edges while waiting for retail stops and weak entries."
    suffix = " while keeping option sellers protected" if high_decay else ""
    return f"Allowing directional expansion only after liquidity is absorbed{suffix}."


def suggest_strikes(index: str, budget: Decimal, risk: str, current_price: Decimal) -> dict:
    step = _strike_step(index)
    atm = _nearest_strike(current_price, step)
    price = Decimal(current_price)

    profiles = {
        "Low": [
            ("ITM", atm - step, "CE", Decimal("0.28"), "Only above range high with retest hold"),
            ("ITM", atm + step, "PE", Decimal("0.28"), "Only below range low with retest rejection"),
        ],
        "Medium": [
            ("ATM", atm, "CE", Decimal("0.34"), "Buy only if price sustains above ATM for 5 minutes"),
            ("ATM", atm, "PE", Decimal("0.34"), "Buy only if price sustains below ATM for 5 minutes"),
            ("OTM", atm + step, "CE", Decimal("0.42"), "Use only on clean breakout with volume follow-through"),
        ],
        "High": [
            ("OTM", atm + step, "CE", Decimal("0.48"), "Momentum scalp above upper range with strict SL"),
            ("OTM", atm - step, "PE", Decimal("0.48"), "Momentum scalp below lower range with strict SL"),
            ("ATM", atm, "CE", Decimal("0.40"), "Fast entry only after strong candle close above ATM"),
        ],
    }

    suggestions = []
    budget_per_trade = budget / Decimal(len(profiles[risk]))
    for label, strike, option_type, stop_factor, entry in profiles[risk]:
        stop_points = Decimal(step) * stop_factor
        target_points = stop_points * Decimal("1.7")
        trigger = (
            price + (Decimal(step) * Decimal("0.20"))
            if option_type == "CE"
            else price - (Decimal(step) * Decimal("0.20"))
        )
        invalidation = price - stop_points if option_type == "CE" else price + stop_points
        target = price + target_points if option_type == "CE" else price - target_points

        suggestions.append(
            {
                "strike": int(strike),
                "moneyness": label,
                "option_type": option_type,
                "entry_condition": entry,
                "stop_loss": f"Exit if index crosses {_money(invalidation)} or option loses 30%.",
                "target": f"Book near {_money(target)} or 1.7R, whichever comes first.",
                "risk_label": risk,
                "capital_note": f"Keep allocation near Rs {_money(budget_per_trade)}; avoid averaging.",
                "trigger_level": _money(trigger),
            }
        )

    return {
        "index": index,
        "budget": _money(budget),
        "risk": risk,
        "current_price": _money(current_price),
        "nearest_atm": atm,
        "suggestions": suggestions,
        "risk_warnings": RISK_WARNINGS,
    }


def generate_copy(index: str, budget: Decimal, risk: str, current_price: Decimal) -> dict:
    analysis = analyze_market(index, budget, risk, current_price)
    probability = analysis["probability"]
    message = f"""777c8 MARKET ANALYSIS

Index: {analysis["index"]}
Price: {analysis["current_price"]}

Market State: {analysis["market_state"]}
Pattern: {analysis["pattern"]}

Retail: {analysis["retail"]}
Operator: {analysis["operator"]}

Probability:
Sideways: {probability["sideways"]}%
Breakout: {probability["breakout"]}%
Sharp Move: {probability["sharp_move"]}%

Decision: {analysis["decision"]}

Risk Warning: Rule-based view only. No guaranteed predictions.

#777c8 #{analysis["index"].title()} #Trading"""
    return {"message": message, "analysis": analysis}

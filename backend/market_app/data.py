from __future__ import annotations

import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from http.cookiejar import CookieJar

from django.utils import timezone


INDEX_CONFIG = {
    "NIFTY": {
        "label": "NIFTY",
        "nse_index": "NIFTY 50",
        "nse_option_symbol": "NIFTY",
        "yahoo_symbol": "%5ENSEI",
        "step": 50,
        "fallback_price": 24500.0,
    },
    "BANKNIFTY": {
        "label": "BANKNIFTY",
        "nse_index": "NIFTY BANK",
        "nse_option_symbol": "BANKNIFTY",
        "yahoo_symbol": "%5ENSEBANK",
        "step": 100,
        "fallback_price": 52500.0,
    },
}

NSE_BASE = "https://www.nseindia.com"
YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1d&interval=5m"
CACHE_TTL_SECONDS = 45
HTTP_TIMEOUT_SECONDS = 4
_CACHE: dict[str, dict] = {}


def get_live_market_data(force_refresh: bool = False) -> dict:
    cached = _CACHE.get("live")
    if cached and not force_refresh and cached["expires_at"] > time.time():
        payload = dict(cached["payload"])
        payload["cache"] = {"hit": True, "ttl_seconds": CACHE_TTL_SECONDS}
        return payload

    errors: list[str] = []
    nse_payload = _try_nse(errors)
    if nse_payload:
        payload = _finalize_payload(nse_payload, "nse", True, errors)
        _CACHE["live"] = {"payload": payload, "expires_at": time.time() + CACHE_TTL_SECONDS}
        return payload

    yahoo_payload = _try_yahoo(errors)
    if yahoo_payload:
        payload = _finalize_payload(yahoo_payload, "yahoo", True, errors)
        _CACHE["live"] = {"payload": payload, "expires_at": time.time() + CACHE_TTL_SECONDS}
        return payload

    if cached:
        payload = dict(cached["payload"])
        payload["source"] = f"{payload['source']}_stale_cache"
        payload["is_live"] = False
        payload["errors"] = errors
        payload["cache"] = {"hit": True, "stale": True}
        return payload

    payload = _offline_payload(errors)
    _CACHE["live"] = {"payload": payload, "expires_at": time.time() + 15}
    return payload


def get_index_snapshot(index: str) -> dict:
    data = get_live_market_data()
    return data["indices"][index]


def get_option_chain(index: str) -> dict:
    data = get_live_market_data()
    return data["option_chains"][index]


def market_status() -> dict:
    now = timezone.localtime()
    minutes = now.hour * 60 + now.minute
    weekday_live = now.weekday() < 5
    open_minutes = 9 * 60 + 15
    close_minutes = 15 * 60 + 30
    if weekday_live and open_minutes <= minutes <= close_minutes:
        label = "Live"
    elif weekday_live and minutes < open_minutes:
        label = "Pre-market"
    else:
        label = "Closed"
    return {
        "status": label,
        "time": now.strftime("%I:%M %p"),
        "date": now.strftime("%Y-%m-%d"),
        "timezone": str(now.tzinfo),
        "high_decay": minutes >= 14 * 60 + 30,
    }


def nearest_strike(price: Decimal | float, step: int) -> int:
    value = Decimal(str(price))
    units = (value / Decimal(step)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(units * step)


def money(value: Decimal | float | int) -> float:
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _try_nse(errors: list[str]) -> dict | None:
    try:
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
        _fetch_json(f"{NSE_BASE}/option-chain", opener=opener, timeout=HTTP_TIMEOUT_SECONDS)
        all_indices = _fetch_json(
            f"{NSE_BASE}/api/allIndices",
            opener=opener,
            timeout=HTTP_TIMEOUT_SECONDS,
        )
        index_rows = {row.get("index"): row for row in all_indices.get("data", [])}
        indices: dict[str, dict] = {}
        option_chains: dict[str, dict] = {}
        candles: dict[str, list[dict]] = {}

        for key, config in INDEX_CONFIG.items():
            row = index_rows.get(config["nse_index"]) or {}
            price = _safe_float(row.get("last")) or config["fallback_price"]
            indices[key] = {
                "symbol": key,
                "price": money(price),
                "change": money(_safe_float(row.get("variation")) or 0),
                "change_percent": money(_safe_float(row.get("percentChange")) or 0),
                "source": "NSE",
                "is_live": bool(row),
            }
            chain_raw = _fetch_json(
                f"{NSE_BASE}/api/option-chain-indices?symbol={config['nse_option_symbol']}",
                opener=opener,
                timeout=HTTP_TIMEOUT_SECONDS,
            )
            option_chains[key] = _normalize_nse_option_chain(key, chain_raw, price)
            candles[key] = _derived_candles(price, indices[key]["change"], source="NSE snapshot")

        return {"indices": indices, "option_chains": option_chains, "candles": candles}
    except Exception as exc:
        errors.append(f"NSE unavailable: {exc}")
        return None


def _try_yahoo(errors: list[str]) -> dict | None:
    indices: dict[str, dict] = {}
    option_chains: dict[str, dict] = {}
    candles: dict[str, list[dict]] = {}
    failures: list[str] = []

    for key, config in INDEX_CONFIG.items():
        try:
            raw = _fetch_json(YAHOO_CHART.format(symbol=config["yahoo_symbol"]), timeout=HTTP_TIMEOUT_SECONDS)
            parsed = _normalize_yahoo_chart(key, raw)
            indices[key] = parsed["index"]
            candles[key] = parsed["candles"]
            option_chains[key] = _synthetic_option_chain(key, parsed["index"]["price"], parsed["volatility"])
        except Exception as exc:
            failures.append(f"{key}: {exc}")

    if indices:
        for key, config in INDEX_CONFIG.items():
            if key not in indices:
                indices[key] = _offline_index(key, config["fallback_price"])
                candles[key] = _derived_candles(config["fallback_price"], 0, source="offline fallback")
                option_chains[key] = _synthetic_option_chain(key, config["fallback_price"], 12.0)
        if failures:
            errors.append(f"Yahoo partial fallback: {'; '.join(failures)}")
        return {"indices": indices, "option_chains": option_chains, "candles": candles}

    errors.append(f"Yahoo unavailable: {'; '.join(failures) or 'no data'}")
    return None


def _fetch_json(url: str, opener=None, timeout: int = HTTP_TIMEOUT_SECONDS) -> dict:
    last_error = None
    for _ in range(2):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
                    ),
                    "Accept": "application/json,text/plain,*/*",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": NSE_BASE,
                },
            )
            handler = opener.open if opener else urllib.request.urlopen
            with handler(request, timeout=timeout) as response:
                body = response.read().decode("utf-8", errors="replace")
                if not body.strip().startswith("{"):
                    return {}
                return json.loads(body)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(0.25)
    raise RuntimeError(str(last_error))


def _normalize_nse_option_chain(index: str, raw: dict, fallback_price: float) -> dict:
    config = INDEX_CONFIG[index]
    step = config["step"]
    records = raw.get("records", {})
    price = _safe_float(records.get("underlyingValue")) or fallback_price
    atm = nearest_strike(price, step)
    expiry = (records.get("expiryDates") or [""])[0]
    rows = records.get("data", [])
    nearby = []
    iv_values = []

    for row in rows:
        strike = int(row.get("strikePrice") or 0)
        if abs(strike - atm) > step * 3:
            continue
        item = {"strike": strike}
        for side in ("CE", "PE"):
            leg = row.get(side) or {}
            iv = _safe_float(leg.get("impliedVolatility")) or 0
            if iv > 0:
                iv_values.append(iv)
            item[side.lower()] = {
                "ltp": money(_safe_float(leg.get("lastPrice")) or 0),
                "change": money(_safe_float(leg.get("change")) or 0),
                "iv": money(iv),
                "oi": int(_safe_float(leg.get("openInterest")) or 0),
                "volume": int(_safe_float(leg.get("totalTradedVolume")) or 0),
            }
        nearby.append(item)

    nearby.sort(key=lambda item: item["strike"])
    volatility = money(sum(iv_values) / len(iv_values)) if iv_values else 12.0
    return {
        "symbol": index,
        "source": "NSE option chain",
        "is_live": True,
        "underlying": money(price),
        "atm_strike": atm,
        "expiry": expiry,
        "volatility": volatility,
        "nearby": nearby[:9],
    }


def _normalize_yahoo_chart(index: str, raw: dict) -> dict:
    result = raw["chart"]["result"][0]
    meta = result["meta"]
    timestamps = result.get("timestamp") or []
    quote = result["indicators"]["quote"][0]
    closes = quote.get("close") or []
    highs = quote.get("high") or []
    lows = quote.get("low") or []
    opens = quote.get("open") or []
    volumes = quote.get("volume") or []
    price = _safe_float(meta.get("regularMarketPrice")) or _last_number(closes)
    previous = _safe_float(meta.get("previousClose")) or price
    change = price - previous
    candles = []
    start = max(0, len(timestamps) - 48)
    for offset, stamp in enumerate(timestamps[start:]):
        idx = start + offset
        close = _safe_float(closes[idx]) if idx < len(closes) else None
        if close is None:
            continue
        candles.append(
            {
                "time": datetime.fromtimestamp(stamp, tz=timezone.get_current_timezone()).strftime("%H:%M"),
                "open": money(_safe_float(opens[idx]) or close),
                "high": money(_safe_float(highs[idx]) or close),
                "low": money(_safe_float(lows[idx]) or close),
                "close": money(close),
                "volume": int(_safe_float(volumes[idx]) or 0),
            }
        )
    volatility = _candle_volatility(candles, price)
    return {
        "index": {
            "symbol": index,
            "price": money(price),
            "change": money(change),
            "change_percent": money((change / previous) * 100 if previous else 0),
            "source": "Yahoo Finance",
            "is_live": True,
        },
        "candles": candles or _derived_candles(price, change, source="Yahoo snapshot"),
        "volatility": volatility,
    }


def _synthetic_option_chain(index: str, price: float, volatility: float) -> dict:
    config = INDEX_CONFIG[index]
    step = config["step"]
    atm = nearest_strike(price, step)
    nearby = []
    base_time_value = max(step * 0.22, price * (volatility / 100) * 0.018)
    for strike in range(atm - step * 3, atm + step * 4, step):
        distance = abs(price - strike)
        decay = max(step * 0.06, base_time_value - distance * 0.10)
        ce_intrinsic = max(0.0, price - strike)
        pe_intrinsic = max(0.0, strike - price)
        nearby.append(
            {
                "strike": int(strike),
                "ce": {
                    "ltp": money(ce_intrinsic + decay),
                    "change": 0,
                    "iv": money(volatility),
                    "oi": 0,
                    "volume": 0,
                },
                "pe": {
                    "ltp": money(pe_intrinsic + decay),
                    "change": 0,
                    "iv": money(volatility),
                    "oi": 0,
                    "volume": 0,
                },
            }
        )
    return {
        "symbol": index,
        "source": "derived fallback",
        "is_live": False,
        "underlying": money(price),
        "atm_strike": atm,
        "expiry": "",
        "volatility": money(volatility),
        "nearby": nearby,
    }


def _finalize_payload(payload: dict, source: str, is_live: bool, errors: list[str]) -> dict:
    status = market_status()
    volatility = _aggregate_volatility(payload["option_chains"])
    sentiment = _sentiment(payload["indices"], volatility)
    expiry_warning = "High decay risk" if status["high_decay"] else "Normal premium decay"
    return {
        **payload,
        "source": source,
        "is_live": is_live,
        "fetched_at": timezone.localtime().isoformat(),
        "market_status": status,
        "sentiment": sentiment,
        "volatility": volatility,
        "expiry_warning": expiry_warning,
        "errors": errors,
        "cache": {"hit": False, "ttl_seconds": CACHE_TTL_SECONDS},
    }


def _offline_payload(errors: list[str]) -> dict:
    indices = {}
    option_chains = {}
    candles = {}
    for key, config in INDEX_CONFIG.items():
        price = config["fallback_price"]
        indices[key] = _offline_index(key, price)
        option_chains[key] = _synthetic_option_chain(key, price, 12.0)
        candles[key] = _derived_candles(price, 0, source="offline fallback")
    payload = _finalize_payload(
        {"indices": indices, "option_chains": option_chains, "candles": candles},
        "offline_fallback",
        False,
        errors,
    )
    payload["cache"] = {"hit": False, "offline": True}
    return payload


def _offline_index(index: str, price: float) -> dict:
    return {
        "symbol": index,
        "price": money(price),
        "change": 0,
        "change_percent": 0,
        "source": "offline fallback",
        "is_live": False,
    }


def _derived_candles(price: float, change: float, source: str) -> list[dict]:
    candles = []
    base = price - change
    for idx in range(24):
        drift = change * (idx / 23 if change else 0)
        wave = math.sin(idx / 3.0) * max(price * 0.0008, 8)
        close = base + drift + wave
        candles.append(
            {
                "time": f"{9 + (idx // 4):02d}:{15 + (idx % 4) * 10:02d}",
                "open": money(close - wave * 0.25),
                "high": money(close + abs(wave) * 0.5),
                "low": money(close - abs(wave) * 0.5),
                "close": money(close),
                "volume": 0,
                "source": source,
            }
        )
    return candles


def _candle_volatility(candles: list[dict], price: float) -> float:
    if not candles or not price:
        return 12.0
    ranges = [abs(item["high"] - item["low"]) for item in candles if item.get("high") and item.get("low")]
    if not ranges:
        return 12.0
    intraday = (sum(ranges) / len(ranges)) / price * 100
    return money(max(8.0, min(30.0, intraday * 12)))


def _aggregate_volatility(option_chains: dict) -> dict:
    values = [chain.get("volatility", 0) for chain in option_chains.values() if chain.get("volatility")]
    avg = sum(values) / len(values) if values else 12.0
    label = "Low" if avg < 11 else "Elevated" if avg > 18 else "Moderate"
    return {"value": money(avg), "label": label}


def _sentiment(indices: dict, volatility: dict) -> dict:
    avg_change = sum(item.get("change_percent", 0) for item in indices.values()) / max(len(indices), 1)
    if avg_change > 0.35:
        label = "Risk-on"
        tone = "bullish"
    elif avg_change < -0.35:
        label = "Risk-off"
        tone = "bearish"
    elif volatility["label"] == "Low":
        label = "Compressed"
        tone = "neutral"
    else:
        label = "Balanced"
        tone = "neutral"
    return {"label": label, "tone": tone, "change_percent": money(avg_change)}


def _safe_float(value) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _last_number(values: list) -> float:
    for value in reversed(values):
        parsed = _safe_float(value)
        if parsed is not None:
            return parsed
    return 0.0

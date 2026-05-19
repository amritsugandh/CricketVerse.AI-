from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import os
import random
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

app = FastAPI(
    title="CricketVerse AI Backend",
    description="Real-time cricket analysis and prediction engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MATCH_FORMATS = {
    "IPL": {"competition": "TATA IPL 2026", "label": "IPL T20 2026", "max_overs": 20},
    "TEST": {"competition": "Test Series 2026", "label": "Test match", "max_overs": 90},
}

# IPL 2026 — RR vs LSG Match 64, 19 May 2026, Sawai Mansingh Stadium Jaipur
# RR squad: Riyan Parag (c), Yashasvi Jaiswal, Sanju Samson, Shimron Hetmyer, Dhruv Jurel, Rovman Powell
# LSG squad: Rishabh Pant (c), KL Rahul, Nicholas Pooran, Ayush Badoni, David Miller, Krunal Pandya
BATSMEN_POOL = [
    "Yashasvi Jaiswal", "Sanju Samson", "Riyan Parag", "Shimron Hetmyer",
    "Dhruv Jurel", "Rovman Powell", "KL Rahul", "Nicholas Pooran",
    "Ayush Badoni", "David Miller",
]

BOWLERS_POOL = [
    "Avesh Khan", "Ravi Bishnoi", "Mohsin Khan", "Sandeep Sharma",
    "Yuzvendra Chahal", "Krunal Pandya", "Trent Boult", "Akash Deep",
]

# Today's match context — IPL 2026 Match 64
TODAY_MATCH = {
    "team_a": "RR",
    "team_b": "LSG",
    "competition": "TATA IPL 2026",
    "venue": "Sawai Mansingh Stadium, Jaipur",
    "match_no": 64,
    "date": "19 May 2026",
    "time_ist": "7:30 PM IST",
    # RR recent form: L L W L W (6W 6L in 12 matches, 6th on table, 12 pts)
    # LSG recent form: L W L L L
    "rr_form": ["L", "L", "W", "L", "W"],
    "lsg_form": ["L", "W", "L", "L", "L"],
}

AI_COMMENTARY_TEMPLATES = {
    "0": [
        "Dot ball. Tight line from {bowler}. The pressure is building.",
        "Defended back to the bowler. {batsman} plays it cautiously.",
        "Good length delivery, no run. The run rate pressure rises.",
    ],
    "1": [
        "Quick single taken. Smart cricket by {batsman}.",
        "Single pushed to mid-on. Strike rotated efficiently.",
        "Nudged to leg side for one. {batsman} keeps the scoreboard ticking.",
    ],
    "2": [
        "Two runs taken. Good running between the wickets.",
        "Pushed through the gap for a couple. {batsman} read that well.",
    ],
    "4": [
        "FOUR! {batsman} drives beautifully through cover.",
        "BOUNDARY! Piercing shot through mid-wicket. {batsman} is flying.",
        "Crashing four through point. {bowler} is under pressure now.",
        "Pulled away for FOUR. Effortless batting from {batsman}.",
    ],
    "6": [
        "SIX! Massive hit from {batsman}.",
        "MAXIMUM! {batsman} launches it downtown.",
        "SIX! Scooped over fine leg. Audacious shot from {batsman}.",
        "Into the stands. {batsman} muscles it over long-on for SIX.",
    ],
    "W": [
        "WICKET! {bowler} strikes. {batsman} has to walk back.",
        "OUT! What a delivery from {bowler}. Breakthrough.",
        "GONE! {batsman} edges it to the keeper. {bowler} celebrates.",
    ],
}

AI_INSIGHTS_POOL = {
    "momentum": [
        {"title": "Momentum shift detected", "text": "Back-to-back boundaries have shifted win probability by {shift}%. The bowling team needs a wicket urgently.", "color": "emerald"},
        {"title": "Batting surge", "text": "{batsman} is on fire — {shift}% swing in win probability after that boundary. Bowler under pressure.", "color": "emerald"},
        {"title": "Boundary blitz", "text": "Win probability moved {shift}% in {batsman}'s favour. {bowler} needs to regroup.", "color": "emerald"},
    ],
    "pattern": [
        {"title": "Bowling pattern alert", "text": "{bowler} has been bowling short consistently. AI expects a yorker in the next two balls.", "color": "purple"},
        {"title": "Line and length shift", "text": "{bowler} has varied pace in the last 3 deliveries. Expect a slower ball next.", "color": "purple"},
        {"title": "Batting pattern", "text": "{batsman} is targeting the leg side. Field adjustment expected from the captain.", "color": "purple"},
    ],
    "pressure": [
        {"title": "Pressure building", "text": "{dots} dot balls in a row. The required rate is climbing; expect aggressive shots from {batsman}.", "color": "orange"},
        {"title": "Dot ball squeeze", "text": "{bowler} has strangled the batting with {dots} consecutive dots. Run rate pressure is critical.", "color": "orange"},
        {"title": "Run rate alarm", "text": "Current run rate: {rr}/ov. {dots} dots in a row — {batsman} must break free soon.", "color": "orange"},
    ],
    "matchup": [
        {"title": "Matchup alert", "text": "{batsman} vs {bowler}: historical SR of {sr} in T20s. This is a key battle to watch.", "color": "yellow"},
        {"title": "Key battle", "text": "{bowler} has dismissed {batsman}-type batters {sr}% of the time in this phase. Watch closely.", "color": "yellow"},
        {"title": "Phase matchup", "text": "In death overs, {batsman} averages {sr} against pace. {bowler} will test that record.", "color": "yellow"},
    ],
    "prediction": [
        {"title": "Death overs prediction", "text": "AI model predicts {team} will score {runs} runs in the remaining overs based on current momentum and batting depth.", "color": "blue"},
        {"title": "Over projection", "text": "Based on current run rate of {rr}/ov, AI projects a final score of {runs} for {team}.", "color": "blue"},
        {"title": "Wicket probability", "text": "AI gives a 34% chance of a wicket in the next over. {bowler} is the danger man.", "color": "blue"},
    ],
    "milestone": [
        {"title": "Phase transition", "text": "Entering {phase}. Tactics shift — expect field changes and bowling variations from both sides.", "color": "cyan"},
        {"title": "Wicket impact", "text": "WICKET! {batsman} is out. Win probability swings {shift}% — this changes the match dynamics.", "color": "red"},
        {"title": "Over milestone", "text": "Over {over} complete. {team} have scored {runs} in the last 3 overs — momentum is building.", "color": "cyan"},
    ],
}

STATIC_TOURNAMENTS = [
    {
        "seriesId": "ipl-2026",
        "name": "TATA IPL 2026 (Season 19)",
        "startDate": "2026-03-28",
        "endDate": "2026-05-31",
        "format": "T20",
        "teams": ["RR", "LSG", "CSK", "MI", "RCB", "KKR", "SRH", "GT", "DC", "PBKS"],
        "status": "Ongoing",
    },
    {
        "seriesId": "ban-pak-test-2026",
        "name": "Pakistan in Bangladesh Test Series 2026",
        "startDate": "2026-05-08",
        "endDate": "2026-05-20",
        "format": "Test",
        "teams": ["Bangladesh", "Pakistan"],
        "status": "Ongoing",
    },
    {
        "seriesId": "womens-t20-wc-2026",
        "name": "ICC Women's T20 World Cup 2026",
        "startDate": "2026-06-12",
        "endDate": "2026-07-05",
        "format": "T20",
        "teams": ["England", "Australia", "India", "New Zealand"],
        "status": "Upcoming",
    },
    {
        "seriesId": "ind-afg-odi-2026",
        "name": "Afghanistan in India ODI Series 2026",
        "startDate": "2026-06-14",
        "endDate": "2026-06-21",
        "format": "ODI",
        "teams": ["India", "Afghanistan"],
        "status": "Upcoming",
    },
    {
        "seriesId": "eng-ind-whiteball-2026",
        "name": "India Tour of England 2026 (White Ball)",
        "startDate": "2026-07-10",
        "endDate": "2026-07-28",
        "format": "T20",
        "teams": ["England", "India"],
        "status": "Upcoming",
    },
    {
        "seriesId": "eng-ind-test-2026",
        "name": "India Tour of England Test Series 2026",
        "startDate": "2026-08-05",
        "endDate": "2026-09-10",
        "format": "Test",
        "teams": ["England", "India"],
        "status": "Upcoming",
    },
    {
        "seriesId": "aus-sa-odi-2026",
        "name": "South Africa in Australia ODI Series 2026",
        "startDate": "2026-09-15",
        "endDate": "2026-09-25",
        "format": "ODI",
        "teams": ["Australia", "South Africa"],
        "status": "Upcoming",
    },
    {
        "seriesId": "asia-cup-2026",
        "name": "Asia Cup 2026",
        "startDate": "2026-10-01",
        "endDate": "2026-10-18",
        "format": "ODI",
        "teams": ["India", "Pakistan", "Sri Lanka", "Bangladesh"],
        "status": "Upcoming",
    },
]

APP_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = APP_ROOT / "frontend" / "dist"
BACKEND_ROOT = Path(__file__).resolve().parent


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(BACKEND_ROOT / ".env")

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "cricbuzz-cricket.p.rapidapi.com")
RAPIDAPI_BASE_URL = os.getenv("RAPIDAPI_BASE_URL", f"https://{RAPIDAPI_HOST}")
RAPIDAPI_MATCH_ID = os.getenv("RAPIDAPI_MATCH_ID", "")
RAPIDAPI_POLL_SECONDS = max(10, int(os.getenv("RAPIDAPI_POLL_SECONDS", "20")))


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)


class LiveMatchEngine:
    """Format-aware live cricket simulator for local development."""

    def __init__(self, match_format: str = "IPL"):
        self.match_format = match_format if match_format in MATCH_FORMATS else "IPL"
        self.format_config = MATCH_FORMATS[self.match_format]
        self.max_overs = self.format_config["max_overs"]
        self.reset()

    def reset(self):
        self.competition = self.format_config["competition"]
        self.team_a = TODAY_MATCH["team_a"]   # RR
        self.team_b = TODAY_MATCH["team_b"]   # LSG
        self.venue = TODAY_MATCH["venue"]
        self.match_no = TODAY_MATCH["match_no"]
        # Start mid-match for a realistic live feel — LSG batting first, 8.2 overs
        self.total_runs = 68
        self.wickets = 2
        self.overs = 8
        self.balls_in_over = 2
        self.run_rate = round(self.total_runs / (self.overs + self.balls_in_over / 6), 1)
        self.recent_balls: list[str] = ["1", "0", "4", "1", "6", "0"]
        self.rolling_window: list[str] = ["1", "0", "4", "1", "6", "0"]
        self.batsmen = [
            {"name": "KL Rahul", "runs": 34, "balls": 28, "fours": 3, "sixes": 1, "strikeRate": 121.43, "onStrike": True},
            {"name": "Nicholas Pooran", "runs": 18, "balls": 14, "fours": 1, "sixes": 1, "strikeRate": 128.57, "onStrike": False},
        ]
        self.bowler = {"name": "Yuzvendra Chahal", "overs": "2.2", "maidens": 0, "runs": 18, "wickets": 1, "economy": 7.71, "isBowling": True}
        self.win_prob_a = 55   # RR slightly favoured at home
        self.commentary_count = 0
        self.innings_status = "live"
        self.last_insight_titles: list[str] = []
        self.prev_phase = self.current_phase()
        self.target = None

    def current_phase(self) -> str:
        if self.max_overs == 20 or self.match_format == "IPL":
            if self.overs < 6:
                return "Powerplay"
            if self.overs >= 16:
                return "Death overs"
            return "Middle overs"
        elif self.max_overs == 50 or self.match_format == "ODI":
            if self.overs < 10:
                return "Powerplay"
            if self.overs >= 40:
                return "Death overs"
            return "Middle overs"
        else:
            if self.overs < 10:
                return "New ball"
            if self.overs >= self.max_overs - 10:
                return "Final session"
            return "Settle"

    def is_innings_complete(self) -> bool:
        return self.overs >= self.max_overs or self.wickets >= 10

    def score_payload(self) -> dict:
        return {
            "teamA": self.team_a,
            "teamB": self.team_b,
            "competition": self.competition,
            "venue": getattr(self, "venue", TODAY_MATCH["venue"]),
            "matchNo": getattr(self, "match_no", TODAY_MATCH["match_no"]),
            "matchDate": TODAY_MATCH["date"],
            "matchFormat": self.match_format,
            "maxOvers": self.max_overs,
            "phase": self.current_phase(),
            "inningsStatus": self.innings_status,
            "teamAScore": f"{self.total_runs}/{self.wickets}",
            "teamBScore": "Yet to bat",
            "currentOver": f"{self.overs}.{self.balls_in_over}",
            "runRate": str(self.run_rate),
            "target": None,
            "batsmen": self.batsmen,
            "bowlers": [self.bowler],
            "recentBalls": list(self.recent_balls),
            "winProbability": {"teamA": self.win_prob_a, "teamB": 100 - self.win_prob_a},
        }

    def complete_innings_payload(self) -> dict:
        self.innings_status = "complete"
        self.overs = self.max_overs
        self.balls_in_over = 0
        self.commentary_count += 1
        return {
            "score": self.score_payload(),
            "commentary": {
                "id": f"comm-{self.commentary_count}",
                "over": f"{self.max_overs}.0",
                "text": f"Innings complete at {self.max_overs}.0 overs. {self.team_a} finish on {self.total_runs}/{self.wickets}.",
                "type": "milestone",
                "timestamp": time.time(),
                "ball": "0",
            },
            "aiInsight": {
                "title": "Innings complete",
                "text": f"{self.format_config['label']} limit reached. This feed will not exceed {self.max_overs} overs.",
                "color": "emerald",
                "type": "format-limit",
            },
            "ballResult": "0",
        }

    def _pick_insight(self, category: str, current_batsman: str, win_shift: int) -> dict:
        """Pick an insight template from a category, avoiding recent title repeats."""
        pool = AI_INSIGHTS_POOL.get(category, AI_INSIGHTS_POOL["pattern"])
        # Filter out recently used titles
        candidates = [t for t in pool if t["title"] not in self.last_insight_titles]
        if not candidates:
            candidates = pool
        template = random.choice(candidates)
        # Compute confidence deterministically from match state
        confidence = min(100, max(40, 50 + self.overs * 2 - self.wickets * 5 + (win_shift // 2)))
        text = template["text"].format(
            shift=win_shift,
            bowler=self.bowler["name"],
            rr=self.run_rate,
            runs=random.randint(35, 55),
            dots=self._consecutive_dots(),
            overs=random.randint(2, 4),
            batsman=current_batsman,
            sr=random.randint(120, 180),
            team=self.team_a,
            phase=self.current_phase(),
            over=self.overs,
        )
        insight = {
            "title": template["title"],
            "text": text,
            "color": template["color"],
            "type": category,
            "confidence": confidence,
        }
        # Track last 2 titles
        self.last_insight_titles = (self.last_insight_titles + [template["title"]])[-2:]
        return insight

    def _consecutive_dots(self) -> int:
        count = 0
        for b in reversed(self.rolling_window):
            if b == "0":
                count += 1
            else:
                break
        return count

    def simulate_ball(self) -> dict:
        if self.is_innings_complete():
            return self.complete_innings_payload()

        prev_win_prob = self.win_prob_a
        prev_phase = self.prev_phase

        if self.overs >= max(0, self.max_overs - 4):
            outcomes = ["0", "1", "1", "2", "4", "4", "4", "6", "6", "6", "W"]
        elif self.overs < 6:
            outcomes = ["0", "0", "1", "1", "1", "2", "4", "4", "6", "W"]
        else:
            outcomes = ["0", "0", "0", "1", "1", "1", "1", "2", "4", "4", "6", "W"]

        ball = random.choice(outcomes)

        if ball == "W":
            self.wickets += 1
            self.win_prob_a = max(20, self.win_prob_a - random.randint(5, 12))
            old_batsman_name = self.batsmen[0]["name"] if self.batsmen[0]["onStrike"] else self.batsmen[1]["name"]
            available = [b for b in BATSMEN_POOL if b not in [x["name"] for x in self.batsmen]]
            new_bat = random.choice(available or BATSMEN_POOL)
            for batsman in self.batsmen:
                if batsman["onStrike"]:
                    batsman.update({"name": new_bat, "runs": 0, "balls": 1, "fours": 0, "sixes": 0, "strikeRate": 0.0})
                    break
        else:
            runs = int(ball)
            old_batsman_name = ""
            self.total_runs += runs
            for batsman in self.batsmen:
                if batsman["onStrike"]:
                    batsman["runs"] += runs
                    batsman["balls"] += 1
                    if runs == 4:
                        batsman["fours"] += 1
                    elif runs == 6:
                        batsman["sixes"] += 1
                    batsman["strikeRate"] = round((batsman["runs"] / batsman["balls"]) * 100, 2)
                    old_batsman_name = batsman["name"]
                    break
            if runs % 2 == 1:
                for batsman in self.batsmen:
                    batsman["onStrike"] = not batsman["onStrike"]
            if runs >= 4:
                self.win_prob_a = min(95, self.win_prob_a + random.randint(1, 4))
            elif runs == 0:
                self.win_prob_a = max(20, self.win_prob_a - random.randint(0, 2))

        self.balls_in_over += 1
        if self.balls_in_over >= 6:
            self.balls_in_over = 0
            self.overs += 1
            for batsman in self.batsmen:
                batsman["onStrike"] = not batsman["onStrike"]
            self.bowler["name"] = random.choice(BOWLERS_POOL)

        if ball != "W":
            self.bowler["runs"] += int(ball)
        else:
            self.bowler["wickets"] += 1
        self.bowler["overs"] = f"{self.overs}.{self.balls_in_over}"
        total_balls = self.overs * 6 + self.balls_in_over
        self.bowler["economy"] = round(self.bowler["runs"] / max(total_balls / 6, 1), 1)

        self.recent_balls.append(ball)
        self.recent_balls = self.recent_balls[-6:]
        self.rolling_window.append(ball)
        self.rolling_window = self.rolling_window[-12:]

        self.run_rate = round(self.total_runs / (total_balls / 6), 2) if total_balls > 0 else 0
        if self.is_innings_complete():
            self.innings_status = "complete"
            self.overs = self.max_overs
            self.balls_in_over = 0

        current_batsman = self.batsmen[0]["name"] if self.batsmen[0]["onStrike"] else self.batsmen[1]["name"]
        if ball == "W":
            current_batsman = old_batsman_name or current_batsman

        commentary_text = random.choice(AI_COMMENTARY_TEMPLATES[ball]).format(
            batsman=current_batsman,
            bowler=self.bowler["name"],
        )
        self.commentary_count += 1

        # Always produce an AI insight — pick category based on ball result
        win_shift = abs(self.win_prob_a - prev_win_prob)
        new_phase = self.current_phase()
        phase_changed = new_phase != prev_phase
        self.prev_phase = new_phase

        if phase_changed:
            category = "milestone"
        elif ball == "W":
            category = "milestone"
        elif ball in ("4", "6"):
            if win_shift > 0:
                category = "momentum"
            else:
                category = "pattern"
        elif self._consecutive_dots() >= 5:
            category = "pressure"
        elif self.commentary_count % 4 == 0:
            category = "matchup"
        elif self.commentary_count % 5 == 0:
            category = "prediction"
        else:
            category = "pattern"

        # Deterministic confidence based on match state
        base_conf = 60
        base_conf += min(20, self.overs)
        base_conf += min(15, self.wickets * 2)
        if category == "milestone":
            base_conf += 10
        elif category == "pressure":
            base_conf += 5 + min(5, self._consecutive_dots())
        elif category == "momentum":
            base_conf += min(10, win_shift)
        confidence = min(100, max(0, base_conf))

        if phase_changed:
            title = "Phase transition"
            text = f"Entering {new_phase}. Tactics shift — expect field changes and bowling variations from both sides."
            color = "cyan"
            ai_insight = {
                "title": title,
                "text": text,
                "color": color,
                "type": category,
                "confidence": confidence,
            }
        elif ball == "W":
            title = "Wicket impact"
            text = f"WICKET! {current_batsman} is out. Win probability swings {win_shift}% — this changes the match dynamics completely."
            color = "red"
            ai_insight = {
                "title": title,
                "text": text,
                "color": color,
                "type": category,
                "confidence": confidence,
            }
        elif category == "pressure":
            dots = self._consecutive_dots()
            is_chase = getattr(self, "target", None) is not None
            if is_chase:
                total_balls = self.overs * 6 + self.balls_in_over
                balls_rem = max(0, self.max_overs * 6 - total_balls)
                overs_rem = balls_rem / 6.0
                runs_needed = max(0, self.target - self.total_runs)
                req_rr = round(runs_needed / overs_rem, 2) if overs_rem > 0 else 0.0
                text = f"Intense pressure! {self.bowler['name']} has bowled {dots} consecutive dot balls. {current_batsman} is feeling the squeeze as the required run rate climbs to {req_rr} rpo."
            else:
                text = f"Excellent squeeze from {self.bowler['name']}! {dots} consecutive dot balls. {current_batsman} is struggling to rotate strike, dragging the current run rate to {self.run_rate}."
            title = "Pressure building" if dots < 6 else "Dot ball squeeze"
            color = "orange"
            ai_insight = {
                "title": title,
                "text": text,
                "color": color,
                "type": category,
                "confidence": confidence,
            }
        else:
            ai_insight = self._pick_insight(category, current_batsman, win_shift)
            ai_insight["confidence"] = confidence

        # Track last 2 titles to avoid duplicate adjacent titles
        self.last_insight_titles = (self.last_insight_titles + [ai_insight["title"]])[-2:]

        return {
            "score": self.score_payload(),
            "commentary": {
                "id": f"comm-{self.commentary_count}",
                "over": f"{self.overs}.{self.balls_in_over}",
                "text": commentary_text,
                "type": "wicket" if ball == "W" else ("boundary" if ball in ["4", "6"] else "normal"),
                "timestamp": time.time(),
                "ball": ball,
            },
            "aiInsight": ai_insight,
            "ballResult": ball,
        }


class RapidApiCricketProvider:
    """RapidAPI adapter for Cricbuzz-style cricket live score responses."""

    def __init__(self):
        self.last_commentary_id = ""
        self.last_recent_balls: list[str] = []
        self.last_snapshot: dict | None = None

    @property
    def enabled(self) -> bool:
        return bool(RAPIDAPI_KEY and RAPIDAPI_HOST)

    def request_json(self, path: str) -> dict:
        url = f"{RAPIDAPI_BASE_URL.rstrip('/')}/{path.lstrip('/')}"
        request = Request(
            url,
            headers={
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
                "Accept": "application/json",
            },
        )
        try:
            with urlopen(request, timeout=12) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"RapidAPI request failed for {path}: {exc}") from exc

    def live_matches(self) -> list[dict]:
        data = self.request_json("/matches/v1/live")
        return list(self.iter_matches(data))

    def iter_matches(self, payload: dict):
        for type_match in payload.get("typeMatches", []):
            for series_match in type_match.get("seriesMatches", []):
                wrapper = series_match.get("seriesAdWrapper") or series_match.get("adDetail") or {}
                for match in wrapper.get("matches", []):
                    yield match

    def select_match(self, matches: list[dict]) -> dict:
        if not matches:
            raise RuntimeError("RapidAPI returned no live matches")
        if RAPIDAPI_MATCH_ID:
            for match in matches:
                match_id = str(match.get("matchInfo", {}).get("matchId", ""))
                if match_id == RAPIDAPI_MATCH_ID:
                    return match
        return matches[0]

    def score_from_innings(self, score_block: dict | None) -> tuple[str, str, float]:
        if not score_block:
            return "0/0", "0.0", 0.0
        innings = next((value for key, value in score_block.items() if "inngs" in key.lower()), None)
        if not innings:
            innings = next((value for value in score_block.values() if isinstance(value, dict) and "runs" in value), None)
        if not innings:
            innings = score_block
        runs = innings.get("runs", 0)
        wickets = innings.get("wickets", 0)
        overs = str(innings.get("overs", "0.0"))
        return f"{runs}/{wickets}", overs, float(runs or 0)

    def max_overs_for(self, match_info: dict) -> int:
        text = " ".join(str(match_info.get(key, "")) for key in ("matchDesc", "matchFormat", "seriesName"))
        if re.search(r"\bT20\b|IPL|20", text, re.IGNORECASE):
            return 20
        if re.search(r"\bODI\b|50", text, re.IGNORECASE):
            return 50
        return 20

    def normalize_match(self, match: dict) -> dict:
        match_info = match.get("matchInfo", {})
        match_score = match.get("matchScore", {})
        team1 = match_info.get("team1", {})
        team2 = match_info.get("team2", {})
        team_a = team1.get("teamSName") or team1.get("teamName") or "Team A"
        team_b = team2.get("teamSName") or team2.get("teamName") or "Team B"
        team_a_score, team_a_overs, team_a_runs = self.score_from_innings(match_score.get("team1Score"))
        team_b_score, team_b_overs, team_b_runs = self.score_from_innings(match_score.get("team2Score"))
        current_over = team_b_overs if team_b_score != "0/0" else team_a_overs
        max_overs = self.max_overs_for(match_info)
        current_runs = team_b_runs if team_b_score != "0/0" else team_a_runs
        current_over_float = max(float(current_over), 0.1)
        run_rate = round(current_runs / current_over_float, 2)
        lead = team_a_runs - team_b_runs
        win_probability = max(8, min(92, 50 + int(lead / 3)))
        status = match_info.get("status") or "Live match in progress"
        recent_balls = self.last_recent_balls or ["-", "-", "-", "-", "-", "-"]

        return {
            "teamA": team_a,
            "teamB": team_b,
            "competition": match_info.get("seriesName", "Live cricket"),
            "matchFormat": "IPL" if max_overs == 20 else "TEST",
            "maxOvers": max_overs,
            "phase": "Live from RapidAPI",
            "inningsStatus": "complete" if "won" in status.lower() else "live",
            "teamAScore": team_a_score,
            "teamBScore": team_b_score,
            "currentOver": current_over,
            "runRate": str(run_rate),
            "target": None,
            "batsmen": [
                {"name": "Live batter", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "strikeRate": 0, "onStrike": True},
                {"name": "Non-striker", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "strikeRate": 0, "onStrike": False},
            ],
            "bowlers": [
                {"name": "Live bowler", "overs": current_over, "maidens": 0, "runs": 0, "wickets": 0, "economy": 0, "isBowling": True},
            ],
            "recentBalls": recent_balls,
            "winProbability": {"teamA": win_probability, "teamB": 100 - win_probability},
            "status": status,
            "matchId": str(match_info.get("matchId", "")),
        }

    def commentary_for(self, score: dict) -> dict:
        status = score.get("status", "Live match update from RapidAPI")
        over = score.get("currentOver", "0.0")
        comment_id = f"rapid-{score.get('matchId', 'match')}-{over}-{hash(status)}"
        return {
            "id": comment_id,
            "over": over,
            "text": status,
            "type": "milestone" if score.get("inningsStatus") == "complete" else "normal",
            "timestamp": time.time(),
        }

    def insight_for(self, score: dict) -> dict:
        team_a = score["teamA"]
        team_b = score["teamB"]
        probability = score["winProbability"]["teamA"]

        # Determine category and title
        if "won" in (score.get("status") or "").lower():
            category = "milestone"
            title = "Match concluded"
            color = "cyan"
        elif probability > 65 or probability < 35:
            category = "prediction"
            title = "Win projection"
            color = "blue"
        else:
            category = "momentum"
            title = "High pressure clash"
            color = "emerald"

        confidence = 70 + (abs(probability - 50) // 2)

        return {
            "title": title,
            "text": f"{team_a} vs {team_b}: live score is {score['teamAScore']} and {score['teamBScore']}. Current AI model edge: {team_a} has a {probability}% chance to win.",
            "color": color,
            "type": category,
            "confidence": confidence,
        }

    def fetch_snapshot(self) -> dict:
        if not self.enabled:
            raise RuntimeError("RapidAPI is not configured")
        match = self.select_match(self.live_matches())
        score = self.normalize_match(match)
        self.last_snapshot = score
        return score

    def fetch_update(self) -> dict:
        score = self.fetch_snapshot()
        commentary = self.commentary_for(score)
        return {
            "score": score,
            "commentary": commentary,
            "aiInsight": self.insight_for(score),
            "ballResult": "LIVE",
        }


manager = ConnectionManager()
leaderboard_manager = ConnectionManager()
match_engine = LiveMatchEngine(match_format="IPL")
rapidapi_provider = RapidApiCricketProvider()

class LeaderboardEngine:
    def __init__(self):
        self.players = [
            {"rank": 1, "name": "CricMaster99", "xp": 12840, "streak": 12, "acc": 78, "change": 0, "medal": "🥇", "avatar": "C", "predictions": 184, "trend": "same"},
            {"rank": 2, "name": "IPL_Junkie", "xp": 11610, "streak": 9, "acc": 74, "change": 2, "medal": "🥈", "avatar": "I", "predictions": 162, "trend": "up"},
            {"rank": 3, "name": "SpinWizard", "xp": 10450, "streak": 8, "acc": 71, "change": -1, "medal": "🥉", "avatar": "S", "predictions": 149, "trend": "down"},
            {"rank": 4, "name": "BoundaryKing", "xp": 9280, "streak": 6, "acc": 69, "change": 1, "medal": "", "avatar": "B", "predictions": 137, "trend": "up"},
            {"rank": 5, "name": "SixHitter42", "xp": 8900, "streak": 5, "acc": 67, "change": -2, "medal": "", "avatar": "S", "predictions": 121, "trend": "down"},
            {"rank": 6, "name": "DhoniFC", "xp": 8100, "streak": 4, "acc": 65, "change": 3, "medal": "", "avatar": "D", "predictions": 115, "trend": "up"},
            {"rank": 7, "name": "PaceAttack", "xp": 7600, "streak": 3, "acc": 63, "change": 0, "medal": "", "avatar": "P", "predictions": 109, "trend": "same"},
            {"rank": 8, "name": "CoverDrive", "xp": 7200, "streak": 2, "acc": 61, "change": -1, "medal": "", "avatar": "C", "predictions": 98, "trend": "down"},
            {"rank": 9, "name": "GullyBoy", "xp": 6800, "streak": 1, "acc": 58, "change": 2, "medal": "", "avatar": "G", "predictions": 91, "trend": "up"},
            {"rank": 10, "name": "You", "xp": 500, "streak": 0, "acc": 0, "change": 15, "medal": "", "avatar": "Y", "predictions": 3, "isYou": True, "trend": "up"},
        ]
        self.momentum_events = [
            {"user": "CricMaster99", "action": "called a SIX! 🎆 +100 XP", "type": "six"},
            {"user": "IPL_Junkie", "action": "predicted WICKET correctly 🎯", "type": "wicket"},
            {"user": "SpinWizard", "action": "hit a 5-ball streak! 🔥", "type": "streak"},
            {"user": "BoundaryKing", "action": "predicted DOT BALL +20 XP", "type": "dot"},
            {"user": "DhoniFC", "action": "climbed 3 ranks to #6! ⬆️", "type": "rank"},
            {"user": "SixHitter42", "action": "called BOUNDARY correctly 🎯 +80", "type": "four"},
            {"user": "GullyBoy", "action": "prediction accuracy hit 70%! 📈", "type": "milestone"},
            {"user": "You", "action": "made first prediction! Welcome 🎉", "type": "welcome"},
        ]
        self.tick_count = 0

    def simulate_update(self):
        self.tick_count += 1
        
        # Update players
        for p in self.players:
            if p.get("isYou"): continue
            xpDelta = int((random.random() - 0.3) * 60)
            p["xp"] = max(100, p["xp"] + xpDelta)
            accDelta = int((random.random() - 0.4) * 1)
            p["acc"] = max(40, min(95, p["acc"] + accDelta))
            if random.random() > 0.85:
                p["streak"] = max(0, p["streak"] + (1 if random.random() > 0.5 else -1))
            p["trend"] = "up" if xpDelta > 0 else "down" if xpDelta < -20 else "same"
            
        self.players.sort(key=lambda x: x["xp"], reverse=True)
        for i, p in enumerate(self.players):
            p["rank"] = i + 1

        # Rotate event feed
        next_event = self.momentum_events[self.tick_count % len(self.momentum_events)]
        current_events = [next_event] + self.momentum_events[:3]
        
        # Proper Real-Time Data Analysis — IPL 2026 Match 64: RR vs LSG
        match_phase = match_engine.current_phase()
        
        # Dynamically generate prediction stats based on recent balls
        recent_str = "".join(match_engine.recent_balls)
        has_boundaries = "4" in recent_str or "6" in recent_str
        has_wickets = "W" in recent_str
        
        match_stats = [
            {"label": "Dot Ball Calls", "pct": 45 if "0" in recent_str else 25, "color": "bg-slate-400", "correct": 34},
            {"label": "Boundary Calls", "pct": 35 if has_boundaries else 15, "color": "bg-emerald-400", "correct": 82},
            {"label": "Wicket Calls", "pct": 25 if has_wickets else 8, "color": "bg-red-400", "correct": 12},
            {"label": "Six Calls", "pct": 18 if "6" in recent_str else 5, "color": "bg-purple-400", "correct": 45},
            {"label": "Single/Double", "pct": 22, "color": "bg-cyan-400", "correct": 67},
        ]
        
        # Ensure percentages roughly sum to reasonable numbers (display purposes)
        total_pct = sum(s["pct"] for s in match_stats)
        for s in match_stats:
            s["pct"] = int((s["pct"] / total_pct) * 100)
            
        # Sort by highest pct
        match_stats.sort(key=lambda x: x["pct"], reverse=True)
        
        # Dynamically generate AI Trend Analysis based on match phase — RR vs LSG context
        ai_trends = []
        if has_boundaries:
            ai_trends.append({
                "title": f"RR vs LSG: Boundary Surge in {match_phase}",
                "desc": f"LSG batters attacking at Sawai Mansingh. Win probability at {match_engine.win_prob_a}% for RR. Users predicting more boundaries.",
                "color": "emerald"
            })
        elif has_wickets:
            ai_trends.append({
                "title": f"Wicket Alert — IPL 2026 Match 64",
                "desc": f"RR bowling attack striking in {match_phase}. {match_engine.wickets} down now! High volume of Wicket predictions incoming.",
                "color": "red"
            })
        else:
            ai_trends.append({
                "title": f"LSG Building Innings — {match_phase}",
                "desc": f"KL Rahul and Pooran consolidating at Jaipur. Current Run Rate: {match_engine.run_rate}. Majority calling for singles.",
                "color": "cyan"
            })
            
        # Add a secondary trend regarding XP
        ai_trends.append({
            "title": "High XP Multiplier Window",
            "desc": "Calling a wicket right now yields 3x XP due to the established partnership.",
            "color": "yellow"
        })
        
        return {
            "players": self.players,
            "eventFeed": current_events,
            "matchStats": match_stats,
            "aiTrends": ai_trends
        }

leaderboard_engine = LeaderboardEngine()



async def get_live_update() -> dict:
    if rapidapi_provider.enabled:
        try:
            return await asyncio.to_thread(rapidapi_provider.fetch_update)
        except RuntimeError:
            pass
    return match_engine.simulate_ball()


@app.get("/")
def read_root():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"status": "running", "service": "CricketVerse AI Engine", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "uptime": time.time(),
        "connections": len(manager.active_connections),
        "dataSource": "rapidapi" if rapidapi_provider.enabled else "simulator",
        "rapidapiHost": RAPIDAPI_HOST if rapidapi_provider.enabled else None,
    }


@app.get("/api/live-match")
def live_match_snapshot():
    if rapidapi_provider.enabled:
        try:
            return rapidapi_provider.fetch_snapshot()
        except RuntimeError as exc:
            return JSONResponse(
                {"error": str(exc), "fallback": match_engine.score_payload()},
                status_code=502,
            )
    return match_engine.score_payload()


@app.get("/api/matches")
def live_matches():
    if not rapidapi_provider.enabled:
        return {"source": "simulator", "matches": [match_engine.score_payload()]}
    try:
        matches = [rapidapi_provider.normalize_match(match) for match in rapidapi_provider.live_matches()]
        return {"source": "rapidapi", "matches": matches}
    except RuntimeError as exc:
        return JSONResponse({"error": str(exc), "matches": []}, status_code=502)


@app.get("/api/matches/live")
def live_matches_v2():
    """Returns all live matches with stable matchId fields."""
    if not rapidapi_provider.enabled:
        sim = match_engine.score_payload()
        sim["matchId"] = "sim-match-1"
        return {"matches": [sim]}
    try:
        raw = rapidapi_provider.live_matches()
        matches = []
        for m in raw:
            normalized = rapidapi_provider.normalize_match(m)
            if not normalized.get("matchId"):
                normalized["matchId"] = f"match-{len(matches)}"
            matches.append(normalized)
        return {"matches": matches}
    except RuntimeError as exc:
        sim = match_engine.score_payload()
        sim["matchId"] = "sim-match-1"
        return JSONResponse({"error": str(exc), "fallback": sim, "matches": []}, status_code=502)


@app.get("/api/tournaments/upcoming")
def upcoming_tournaments():
    """Returns upcoming cricket series/tournaments."""
    if not rapidapi_provider.enabled:
        return {"tournaments": STATIC_TOURNAMENTS}
    try:
        data = rapidapi_provider.request_json("/series/v1/upcoming")
        tournaments = _parse_tournaments(data)
        return {"tournaments": tournaments[:20]}
    except RuntimeError as exc:
        return JSONResponse({"error": str(exc), "tournaments": []}, status_code=502)


def _parse_tournaments(data: dict) -> list[dict]:
    import hashlib
    seen: set[str] = set()
    result: list[dict] = []

    series_types = data.get("seriesMapProto", data.get("seriesMap", []))
    if isinstance(series_types, dict):
        series_types = list(series_types.values())

    for group in series_types:
        series_list = group.get("series", []) if isinstance(group, dict) else []
        for s in series_list:
            raw_id = str(s.get("id", "") or s.get("seriesId", ""))
            name = s.get("name", "") or s.get("seriesName", "Unknown")
            start_ts = s.get("startDate", s.get("startDt", 0))
            end_ts = s.get("endDate", s.get("endDt", 0))

            start_date = _ts_to_date(start_ts)
            end_date = _ts_to_date(end_ts)

            if not raw_id:
                slug = f"{name}-{start_date}"
                raw_id = hashlib.md5(slug.encode()).hexdigest()[:12]

            if raw_id in seen:
                continue
            seen.add(raw_id)

            fmt_raw = (s.get("seriesType", "") or "").upper()
            if "T20" in fmt_raw or "IPL" in fmt_raw:
                fmt = "T20"
            elif "ODI" in fmt_raw or "ONE DAY" in fmt_raw:
                fmt = "ODI"
            elif "TEST" in fmt_raw:
                fmt = "Test"
            elif "T10" in fmt_raw:
                fmt = "T10"
            else:
                fmt = "Other"

            status_raw = (s.get("status", "") or "").lower()
            if "live" in status_raw or "ongoing" in status_raw or "progress" in status_raw:
                status = "Ongoing"
            elif "complet" in status_raw or "finish" in status_raw or "ended" in status_raw:
                status = "Completed"
            else:
                status = "Upcoming"

            teams_raw = s.get("teams", []) or []
            teams = [t.get("teamSName") or t.get("teamName") or str(t) for t in teams_raw[:4]]

            result.append({
                "seriesId": raw_id,
                "name": name,
                "startDate": start_date,
                "endDate": end_date,
                "format": fmt,
                "teams": teams,
                "status": status,
            })

    # Sort by startDate ascending, unknowns last
    result.sort(key=lambda x: (x["startDate"] == "unknown", x["startDate"]))
    return result


def _ts_to_date(ts) -> str:
    """Convert a millisecond timestamp or date string to YYYY-MM-DD."""
    import datetime
    if not ts:
        return "unknown"
    try:
        ms = int(ts)
        if ms > 1e10:
            ms = ms // 1000
        return datetime.datetime.utcfromtimestamp(ms).strftime("%Y-%m-%d")
    except (ValueError, TypeError, OSError):
        pass
    try:
        s = str(ts)
        if len(s) >= 10:
            return s[:10]
    except Exception:
        pass
    return "unknown"


@app.websocket("/ws/match")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        initial_ball = await get_live_update()
        await manager.send_personal(websocket, {"type": "SCORE_UPDATE", "data": initial_ball["score"]})
        await manager.send_personal(websocket, {"type": "COMMENTARY", "data": initial_ball["commentary"]})
        if initial_ball["aiInsight"]:
            await manager.send_personal(websocket, {"type": "AI_INSIGHT", "data": initial_ball["aiInsight"]})

        async def auto_push_balls():
            while True:
                await asyncio.sleep(RAPIDAPI_POLL_SECONDS if rapidapi_provider.enabled else random.uniform(4, 7))
                if websocket not in manager.active_connections:
                    break
                result = await get_live_update()
                await manager.broadcast({"type": "SCORE_UPDATE", "data": result["score"]})
                await manager.broadcast({"type": "COMMENTARY", "data": result["commentary"]})
                await manager.broadcast({"type": "BALL_RESULT", "data": {"outcome": result["ballResult"], "timestamp": time.time()}})
                if result["aiInsight"]:
                    await manager.broadcast({"type": "AI_INSIGHT", "data": result["aiInsight"]})

        push_task = asyncio.create_task(auto_push_balls())

        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)

                if message.get("type") == "CHAT_MESSAGE":
                    await manager.broadcast({
                        "type": "NEW_CHAT",
                        "data": {"user": message.get("user", "Anonymous"), "text": message.get("text", "")},
                    })
                elif message.get("type") == "PREDICTION":
                    result = await get_live_update()
                    await manager.broadcast({"type": "SCORE_UPDATE", "data": result["score"]})
                    await manager.broadcast({"type": "COMMENTARY", "data": result["commentary"]})
                    await manager.broadcast({"type": "BALL_RESULT", "data": {"outcome": result["ballResult"], "timestamp": time.time()}})
                    if result["aiInsight"]:
                        await manager.broadcast({"type": "AI_INSIGHT", "data": result["aiInsight"]})
        finally:
            push_task.cancel()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@app.websocket("/ws/leaderboard")
async def websocket_leaderboard(websocket: WebSocket):
    await leaderboard_manager.connect(websocket)
    try:
        # Send initial state immediately
        initial_data = leaderboard_engine.simulate_update()
        await leaderboard_manager.send_personal(websocket, {"type": "LEADERBOARD_UPDATE", "data": initial_data})

        async def auto_push_leaderboard():
            while True:
                await asyncio.sleep(5)
                if websocket not in leaderboard_manager.active_connections:
                    break
                update_data = leaderboard_engine.simulate_update()
                await leaderboard_manager.broadcast({"type": "LEADERBOARD_UPDATE", "data": update_data})

        push_task = asyncio.create_task(auto_push_leaderboard())

        try:
            while True:
                data = await websocket.receive_text()
                # Handled client messages if needed, currently read-only
        finally:
            push_task.cancel()

    except WebSocketDisconnect:
        leaderboard_manager.disconnect(websocket)
    except Exception:
        leaderboard_manager.disconnect(websocket)


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    requested_file = FRONTEND_DIST / full_path
    index_file = FRONTEND_DIST / "index.html"

    if requested_file.is_file():
        return FileResponse(requested_file)
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse(
        {"status": "running", "service": "CricketVerse AI Engine", "version": "1.0.0"},
        status_code=404,
    )

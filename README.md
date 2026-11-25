# Pyramid Manager

A browser football-management game covering all 55 UEFA associations: the English
pyramid (Premier League to League Two, FA Cup and EFL Cup), the top flights of 53 other
countries plus second tiers in Spain, Italy, Germany and France, every domestic cup, and
the Champions League, Europa League and Conference League. Pick any of ~900 clubs, run
its finances, and watch how your spending shifts the odds of every match against AI
clubs that manage their own money.

## Running it

No build step or dependencies. Either:

- open `index.html` directly in a browser, or
- serve the folder: `python3 -m http.server 8000`, then visit <http://localhost:8000>

Progress is saved automatically in your browser (IndexedDB, falling back to
localStorage). Careers saved before the European expansion can't be continued.

## Careers

You can keep any number of careers side by side. The opening screen lists them with
their core details (career name, manager, club, division, season and matchday,
league position, seasons completed, trophies, reputation and when you last played):

- **Continue** any career; the **Careers** button in the game saves and takes you back.
- **Rename** a career, or **Copy** it to try something different without touching the original.
- **Export** a career to a file (a backup, or to move it to another browser) and **Import** it again.
- **Delete** careers you're done with.

A career saved by an earlier version (one save slot) is copied into the list the first
time you open the game; the old copy is left where it was. When you start a career you
can give your manager a name and choose whether the board can sack you.

## How it plays

1. **Choose a club** from any division. The picker shows each club's turnover and wage bill.
2. **Allocate resources** across seven categories, paid for out of your club's finances
   (see below). Each has diminishing returns, so
   spreading money around usually beats going all-in on one area:
   | Category | Effect |
   |---|---|
   | Forwards | + attacking rating |
   | Midfielders | + attack and defence (smaller) |
   | Defenders & Keeper | + defensive rating |
   | Coaching Staff | small all-round boost, softens losing streaks |
   | Sports Science | fewer and shorter injury crises |
   | Fans & Matchday | bigger home advantage and more demand for tickets |
   | Academy & Scouting | no effect now; raises your squad rating next season |
3. **Transfer windows:** player signings (the first three categories) can only be
   made before matchday 1 and during a 3-matchday January window at the halfway
   point. Club categories can be topped up at any time.
4. **Commitment:** once a matchday is played, money spent is locked in. You can add
   more, but you can't take it back.
5. **Play** one match at a time, five at a time, or to the end of the season. Cup
   rounds you're not involved in are simulated on the way. **Kick off** plays the first
   half of your next match and stops at half-time (see *Matches*); untick *Stop at
   half-time* to play matches straight through.
6. **Season outlook** runs 300 Monte Carlo simulations of the remaining fixtures,
   with and without your spending, to show projected points and finishing odds.
7. **Play-offs:** finish in the EFL play-off places and you play them yourself:
   two-legged semi-finals (3rd v 6th, 4th v 5th, higher seed at home second), then
   a one-off final at Wembley. Level ties go to extra time, then penalties. Transfers
   are closed, but you can still invest in club areas between matches, and the match
   card shows your chance of winning the tie.
8. **End of season:** the other divisions' play-offs are simulated and
   promotion/relegation is applied across the pyramid. Your bank balance carries over.
   Get relegated out of League Two and you have to find a new club (see *Your job*).

## Tactics

Before every match you choose a **formation**, a **mentality** and how hard to **press**.
The match card and the season outlook update as you change them.

| Formation | Attack / defence | Character |
|---|---|---|
| 4-4-2 | even | two banks of four, a strike pair |
| 4-2-3-1 | +0.5 / −0.5 | double pivot behind three creators |
| 4-3-3 | +1.5 / −1.5 | wingers and a midfield three |
| 3-4-3 | +2.5 / −2.5 | all-out attack |
| 3-5-2 | +1 / −1 | wing-backs, three central midfielders |
| 4-1-4-1 | −1 / +1 | a holding midfielder screens the back four |
| 5-3-2 | −2 / +2 | five at the back, two to counter |
| 5-4-1 | −3 / +3 | park the bus |

- **Matchups:** shapes do better or worse against each other: midfield numbers, wingers
  against wing-backs, strike pairs against back threes and fours, back fives against front
  threes. Mentalities form a cycle: attacking beats balanced, balanced picks apart a deep
  defensive block, and a defensive side counters an attacking one. The **Tactics** panel
  scouts your next opponent (their manager's usual shape and how they'll set up against
  you) and shows the edge and the reasons for it. **Assistant's pick** chooses the shape and
  mentality with the best odds.
- **Familiarity:** your squad knows its current shape. A new formation costs up to 2.5
  rating points at first and is learned over about five matches.
- **Pressing and fatigue:** a high press adds a point to attack and defence but tires the
  squad; cup and European games tire it too. Above 2 (of 8), fatigue costs rating and raises
  the injury risk. Mid press and the low block let players recover, and rotating in a cup
  tie rests them. Everyone recovers fully over the summer, so every club starts a season
  fresh.

The trade-off between attack and defence matters most through goals: more goals at both
ends suits the stronger side, fewer suits the underdog.

## Matches

Your matches are played live. Kick off and you watch minute by minute, stopping at
half-time (and whenever someone is sent off, see *Cards*) with the score, the goals so far
and the stats. Change your
formation, mentality or pressing and the odds from here (and, in a knockout decider, the
chance of going through) update as you do; **Assistant's pick** finds the best set-up for
the score. The other manager reacts too: a side that's behind goes for it, and a side that's
ahead may sit deeper, and you're told before the second half. Expected goals are split
45/55 between the halves, so if nobody changes anything (and nobody is sent off) the odds
are exactly those of a whole match. *Sim 5* and *Sim to end* play straight through.

After every match you get a report: goals with the minute and how they were scored
(penalties, headers, free kicks, long shots, own goals), bookings and sendings-off, the
half-time score, extra time, penalty shootouts, the other manager's half-time change, and
possession, xG, shots, shots on target and cards. Spending is locked from kick-off until
full time.

**Cards** are simulated in every match in every league:

- **How many:** each country has its own rate of bookings, from about 3 a match in Norway
  to 5 in Spain and Portugal (3.9 in England, 3.9 in European competition). Away sides, the
  weaker side, a defensive mentality, a high press and derbies all draw more, and every
  match has a referee who is a little stricter or more lenient than usual. About 37% of
  bookings come before half-time.
- **Red cards:** a booking can be a player's second (likelier the more of the team are
  already booked), and there are straight reds too: roughly one red every eight to ten
  matches, more in Spain, Italy, Portugal and Turkey.
- **Ten men:** from the minute of a sending-off, the side with fewer players scores less and
  concedes more for the rest of the match, and how much depends on how both sides set up:

  | Ten-man side | Its scoring | Opponent's scoring |
  |---|---|---|
  | Defensive (sit deep) | −50% | +22% |
  | Balanced | −40% | +50% |
  | Attacking | −30% | +80% |

  The side with the extra man scores 15% more (and concedes 8% more) if it goes for it, and
  15% less if it sits back. Possession, shots and xG in the match report shift with the
  numbers. In simulated games between equal sides a home red card cuts the home win rate
  from 44% to 35%, and an away red raises it to 54%. Reds come in the 59th minute on average
  (about a quarter before half-time).
- **Stopping for a red card:** with *Stop at half-time and red cards* ticked, your match also
  stops the moment anyone is sent off, with the minute, the score, what the numbers mean for
  each side and your odds from here, so you can react (with ten men and a lead, sitting deep
  is usually right: 1–0 up with half an hour left it wins about 63% of the time against 57%
  staying balanced). The other manager reacts too: down to ten and not losing, they sit deep;
  with an extra man and not winning, they go for it. When you sim straight through, your
  assistant reacts to red cards the same way, and so does every AI club.
- **Suspensions** (for clubs in your division): a straight red is a three-match ban (−1.0
  rating), a second booking one match (−0.8), and now and then a booking is a player's fifth
  of the season (one match, −0.6). Bans are served match by match in any competition; the
  Condition tile shows them.
- **Discipline** on the Analysis page: your division's fair-play table (a yellow is one
  point, a red three). Red cards are marked 🟥 in the latest results.

**Derbies:** 140 real rivalries are named in `js/data/derbies.js` (the North London derby,
El Clásico, the Old Firm, the Eternal derby, the Intercontinental derby…), each with a
heat from 1 to 3. Derbies draw bigger crowds, count for more with the board, and the
underdog raises its game (+0.4 rating per point of heat). The match card flags them, and
the Manager page keeps your record in every derby you've played.

## Managers and your job

Every club has a manager with a name, age, nationality, reputation, tactical quality
(about −1 to +1.5 rating), a preferred formation with a defensive plan B, and an approach
to spending.

- **Boards** set an objective each season from where they expect to finish (win the league,
  qualify for Europe, win promotion, avoid relegation…). Confidence rises and falls with
  results against expectations, league position after the first third of the season, cup
  upsets and trophies.
- **Sackings:** boards that lose faith sack their manager mid-season or over the summer.
  New managers get a short bounce. Clubs hire from unemployed managers, sometimes poach one
  who is doing well at a smaller club, and old managers retire. The **Managers** tab shows
  every manager in a division with their job security, plus the comings and goings.
- **Your job:** the **Board** panel shows your objective, the board's confidence and your
  reputation. Fall far enough below expectations and you get a warning, then the sack
  (unless you chose a career where you can't be sacked). Sacked managers pick their next
  club from the offers they get, or retire. Clubs whose manager has just been sacked may
  approach you mid-season, and at the end of a season bigger clubs may offer you a job.
  Moving mid-season takes you into the new club's division straight away, even in
  another country; the History tab keeps your managerial record at every club.

## Europe

### Leagues

| | Format |
|---|---|
| England | Four divisions, EFL play-offs, National League pool (see below) |
| Spain, Italy, Germany, France | Two tiers with promotion and relegation: Segunda play-offs (3rd–6th, two-legged), Serie B play-offs (3rd–8th, preliminary round then two-legged), German and French relegation play-offs (16th v the second tier's 3rd / play-off winner). Second tiers are closed at the bottom. |
| Everyone else | Top flight only, in its real format: single, double, triple or quadruple round-robins and split seasons (e.g. Scotland's top six, Belgium's halved-points play-offs, Austria, Switzerland, Denmark, Greece, Cyprus, Israel, Serbia, Czechia), plus European play-offs where the league has them (e.g. the Eredivisie) |

Every country has its domestic cup (the strongest clubs get first-round byes; the final is
neutral). Liechtenstein has no league: its clubs play only the Liechtenstein Cup, whose
winner enters the Conference League. Russian clubs are suspended from UEFA competition.

If your club is in any play-off or relegation play-off you play it match by match; the
rest are simulated.

### European competitions

- **Places** come from the UEFA association ranking (five seasons of points per club
  entered), which the game updates from results. The access list follows the current
  format in simplified form: the top four associations get four Champions League places,
  champions of lower-ranked leagues go through the champions path, title holders qualify
  automatically, and the two best associations each season earn an extra place.
- **Qualifying:** up to four two-legged rounds (champions path and league path in the
  Champions League). Losers drop into the Europa League or Conference League, as in the
  real competitions. Round sizes are planned each season so every league phase has 36 clubs.
- **League phase:** 36 clubs in four pots (six in the Conference League), 8 matches each
  (6 in the Conference League) against different opponents, with no same-country games.
  1st–8th go to the round of 16, 9th–24th to two-legged knockout play-offs.
- **Knockouts:** round of 16, quarter-finals and semi-finals over two legs, then a one-off
  final. Prize money, gate receipts and coefficient points are paid at every stage.

The **Europe** page shows each competition's knockout bracket (filled in provisionally
from the league-phase table until the knockouts start), its league phase and qualifying
ties, the association ranking, and the European roll of honour.

## Finances

Every club in the Football League runs real-style accounts, at roughly 2024/25 levels:

| Income | How it works |
|---|---|
| TV & central payments | Equal share by division: £95m PL, £10m Championship, £2.4m L1, £1.7m L2 |
| Merit payments | Premier League only: £3m per place, paid at season end |
| Parachute payments | £45m then £35m in the two seasons after Premier League relegation |
| European football | £75m (top four), £30m (5th or FA Cup winners), £15m (6th or EFL Cup winners) |
| Commercial | Each club's brand (Man City £340m at PL level, smaller clubs from their fan base), scaled by division |
| Matchday | Crowd × £40 PL / £22 Championship / £17 L1 / £15 L2 per fan, plus a premium for big brands |
| Cups and player sales | Prize money, shared gates, and transfer fees |
| Owner funding | An annual injection that varies by owner (not counted as revenue by the rules) |

Costs are the **wage bill** (the market cost of your squad rating, times your club's pay
level, so signings that stick raise next season's wages), **running costs** by division,
your **spending** on the seven categories, and **stadium work**. Money flows in and out
every matchday; your spending is paid when the next match kicks off.

- **Bank and credit:** your bank balance carries over between seasons. You can spend into a
  credit line (15% of revenue). **Safe to spend** keeps half the credit line unused and a
  cautious end-of-season forecast in the black; the **Balanced split** button uses it.
- **Selling players** in a transfer window raises a fee and cuts wages, at the cost of rating.
- **Profitability & Sustainability** (PL and Championship): losses over three seasons above
  £105m / £39m (excluding owner funding, academy and stadium spending) cost up to 10 / 12
  points next season.
- **Squad cost cap** (Leagues One and Two): wages plus transfer spending above 60% / 55% of
  turnover plus owner funding means a transfer embargo next season.
- **Administration:** a club past its credit line with no way back gets a points deduction
  (12, or 9 in the PL), debts written down, a −2 rating fire sale, new owners and an embargo.

AI clubs run the same accounts. Their spending style sets how far into debt they'll go and how
close to the rules they'll sail, so takeovers, owners pulling out, fire sales, embargoes,
deductions and the odd administration all happen on their own. The **Finances** page shows your
accounts line by line (so far and full-season forecast), your bank balance through the season,
your headroom under the rules, player sales, and every club's finances in your division.

## Stadiums and gate money

Every club has its real stadium capacity and a fan base. Ticket demand for a home game
depends on the fan base, the division (bigger divisions draw bigger crowds), how the
season is going, and Fans & Matchday spending. The crowd is the demand capped at capacity,
and gate money is the crowd times the division's per-fan matchday income (see Finances).
Fan bases grow with promotion and good seasons and shrink with relegation.

The **Stadium** panel (under Resources) shows capacity, average crowd, sell-outs, gate
money and how many fans miss out. You can pay to expand:

| Project | Seats | Opens |
|---|---|---|
| Corner infill | +1,500 | after 6 league matchdays (costs 30% more per seat) |
| Extend a stand | +4,000 | next season |
| Build a new stand | +10,000 | next season |

Costs are about three and a half seasons of a sold-out seat's takings in your current
division, so expanding only pays off if you're turning fans away. Building cheaply in a lower division
before a promotion is a good long-term play. AI clubs that keep selling out expand too.
Cup ties share the gate 45/45 at the home club's ground, or at Wembley for the
FA Cup semi-finals and both finals.

## Cups

**Super cups** open the season: last season's league champions against the cup winners (the
league runners-up after a double). England has the Community Shield at Wembley, and 30 other
countries have their own (Spain's and Italy's are four-team tournaments in January).
In the first season only the real 2025 line-ups are known: Liverpool v Crystal Palace and,
in the UEFA Super Cup, PSG v Tottenham. The **UEFA Super Cup** (Champions League winners v
Europa League winners) is on the Europe page.

Both cups are drawn round by round and slotted into the league calendar. Once 16 clubs
are left (and nobody else is due to enter), the rest of the draw is made in one go as a
fixed bracket. The **Cups** page shows the bracket for any country's cup, the earlier
rounds and recent winners.

| | EFL Cup | FA Cup |
|---|---|---|
| Round 1 | Championship, League One, League Two | League One, League Two, 32 non-league clubs |
| Later entry | 12 PL clubs in R2, the 8 strongest in R3 | Premier League and Championship in R3 |
| Ties | One match, straight to penalties; two-legged semi-finals | One match, extra time then penalties |
| Final | Wembley, extra time then penalties | Wembley, extra time then penalties |

Before each cup tie you choose **full strength** or **rotate squad**. Rotating costs
rating for that match but rules out injuries before your next league games. AI clubs
rotate too: big clubs often rest players in early rounds, which is where giant-killings
come from. Cup ties pay prize money to the winner and share gate receipts, so a lower-league
club drawn away at a Premier League giant gets a windfall.

## Investors

Success attracts money, especially lower down the pyramid. After a strong season (promotion,
a title, a cup, a European trophy), or at the halfway point while you're in the top two of a
lower division, investors may offer to buy into your club. The offer shows up in the Board
panel (or the season review) and you choose whether to accept:

| Investor | Money | In return |
|---|---|---|
| Local consortium | half to most of a season's typical budget now, plus a little every season | nothing |
| Celebrity owners | more now and every season; commercial income +40% and fan base +10% | the board expects one place higher for three seasons |
| Investment fund | one and a half to two and a half budgets now, plus yearly money | interest (6% of the money put in) for six seasons, and one place higher |
| Sovereign wealth fund | three to five budgets now and a full budget every season | three places higher; only for top-flight clubs in the top ten leagues after a strong season |

Offers are likelier in League One and League Two and in smaller leagues, and much rarer
straight after another investment. They lapse at the end of the season. The Finances page
lists your club's investors.

## The long run

Without help, the richest clubs would win everything for ever: titles grow commercial
income, which buys better squads, which win more titles. Several things now make the
football world change over the decades:

- **Squad age.** Every club has an average squad age. Each summer the squad ages a year and
  part of it is replaced: natural turnover brings in players in their early twenties, signings
  bring in older ones (players in their prime at clubs in the top four), and the academy
  brings in teenagers. Squads under about 25.5 improve, those over about 27 decline (up to −4
  a season). A title-winning squad tends to stay together, so it gets older; relegation
  breaks a squad up. AI clubs with an ageing squad rebuild. Your squad's age is on the Club
  page and every club's is in the Clubs tab.
- **Golden generations.** Now and then an academy produces a generation that improves a club
  by 0.9 to 1.6 rating a season for three seasons. Academy spending makes them likelier; the
  very top clubs, whose youngsters rarely play, see fewer.
- **Commercial income drifts back.** Success still lifts a club's commercial income, but 12%
  of the gap to its usual level closes every season, so it has to keep winning to stay rich.
- **Blockbuster takeovers.** Once in a while super-rich owners buy a well-supported club
  outside the top three of a major league, which can become a new power.
- **Hard to improve on the best.** The further a club is above its division's average
  rating, the less its signings and academy add (down to 35% of the usual effect 16 points
  above the average): players better than the ones it already has are rare and expensive.
  This applies to your club too.
- **Managers matter.** An AI manager's tactical quality now also shapes how the squad
  develops over the summer (±0.5 rating per point of quality).
- **A stronger pull to the mean.** AI clubs regress towards their division's average a little
  more than before (18% of the gap a season, was 15%).

In 30-season test runs the leading club's share of titles fell sharply (Ligue 1 from 24 of
30 to 18, Serie A from 20 to 14, the Premier League from 20 to 12), with five to eight
different champions in the big leagues. Your own club ages too, but it isn't pulled towards
the mean, so a dynasty you build is yours to keep or lose.

## AI clubs

Every AI club has a budget on the same scale as yours, plus:

- **A spending style:** Ambitious, Balanced, Pragmatic, Prudent, Youth project or
  Gambler. Each splits money differently, keeps a different reserve, and adds random
  variation to every decision. The style comes from the manager (or the owners, after a
  takeover or a crisis), so a new manager can change it.
- **Recruitment quality:** how much squad improvement a club gets per pound. Some
  clubs waste money (Wasteful), others are Shrewd. You always get full value.
- **In-season decisions:** clubs earn match and cup money during the season. In
  January they react to the table: relegation-threatened clubs panic-buy, contenders
  push, mid-table clubs mostly save. Every few matchdays they may put spare cash into staff.
- **Events:** takeovers (a cash injection and an ambitious new approach) and financial
  trouble (budget slashed).

The **Clubs** tab shows every club's style, spending, cash and the rating boost it's
getting. All four divisions play week by week, and the **Table** tab can show any of them.
Between seasons every club develops from its own signings and academy spending, and each
division is re-centred so ratings don't inflate year on year.

## Analysis page

Compares your club with the rest of your division:

- **Ranks** for attack and defence ratings, goals scored and conceded per game, and
  home and away points per game.
- **Where to invest next:** for each area, what the next slice of money (10% of the
  division's typical budget) would add in expected league points over your remaining
  fixtures, allowing for diminishing returns, transfer windows and injury risk. You can
  spend straight from this table.
- **Attack vs defence** scatter of every club, your **spending vs the division
  average**, your **position week by week**, and plain-English takeaways.

## Records page

- **League position, week by week** for any division and any season, with up to
  three clubs highlighted against the rest.
- **Roll of honour:** champions of every division, play-off winners, and FA Cup and
  EFL Cup winners for every season.
- **Club history** for any club: season-by-season finishes, cup runs (super cups
  included), promotions, relegations and honours.
- **Season records** per division: most and fewest points, most wins, most goals,
  fewest conceded and biggest win.

Completed seasons are archived in your save (about 175 KB per season, mostly every
league's final table with its finances).

## Manager page

Your whole career in one place: matches, record and win rate; a **trophy cabinet** with every
league title, cup, super cup and European trophy and the club you won it with; every club
you've managed with your record and best finish there; your **reputation** season by
season; your **derby record**; and **achievements**: 28 milestones such as winning the
Double or the Treble, taking one club from League Two to the Premier League, winning titles
in three countries, an unbeaten league season, a great escape, a giant-killing or a
comeback from two goals down at half-time. Achievements are worked out from your history,
so an existing career is credited (and dated) for what it has already done; the season
review lists any you unlock.

## Match model

Each match is a Poisson goal model. Expected goals for a side are

```
xG = 1.35 × exp(0.03 × (attack − opponent defence)) × venue factor
```

with a home factor of 1.12 (raised by Stadium spending) and an away factor of 0.89.
Win/draw/loss probabilities are calculated exactly from the two Poisson
distributions; results are then sampled. Recent form (last five results), injury
crises, tactics (shape, mentality, pressing, familiarity, fatigue and the formation
matchup) and the manager's quality adjust ratings for each match. Simulated seasons average about 2.8 goals
per game with roughly 45% home wins, close to real English football.

## Project layout

```
index.html        page shell
css/styles.css    styling (light and dark themes)
js/data.js        England: clubs, divisions, investments, AI styles, cups, finance settings
js/data/world.js  UEFA association ranking at the start of the game
js/data/countries/*.js  the other 54 associations: leagues, formats, money, clubs (schema in README.md there)
js/leagues.js     every division: formats, splits, tables, foreign cups, play-offs, promotion/relegation
js/europe.js      Champions League, Europa League, Conference League, coefficients, prize money
js/achievements.js  career achievements, worked out from your history
js/data/derbies.js  named derbies and how heated they are
tools/fetch_crests.py  crest downloader
js/crests.js      which clubs have a crest image in img/crests/
js/data/names.js  name pools for generated managers, by region
js/engine.js      fixtures, Poisson match engine, tables, Monte Carlo projection
js/tactics.js     formations, mentality, pressing, matchups, familiarity, fatigue
js/managers.js    managers, board objectives and confidence, sackings, hiring, your job
js/careers.js     saved careers: list, load, save, rename, copy, export, import
js/charts.js      SVG charts: position-by-week, attack vs defence, spending comparison
js/game.js        game state, finances, AI clubs, calendar, cups and brackets, play-offs, changing jobs, archive, analysis
js/app.js         UI rendering and controls
```

League lineups are the 2025/26 compositions, and ratings are estimates on a
single pyramid-wide scale. Change anything in `js/data.js` to update them.

## Club crests

Every club in the game has a crest: `img/crests/<club id>.png` (128px), listed in
`js/crests.js`. They come from English Wikipedia (each club article's lead image) and
[TheSportsDB](https://www.thesportsdb.com); `tools/crest_sources.txt` records the page each
recent one came from. Real Sociedad B uses Real Sociedad's crest. If you add clubs, or a
crest looks wrong, the download script fills the gaps (Python 3, no extra packages):

```
python3 tools/fetch_crests.py                 # every club without a crest (resumable)
python3 tools/fetch_crests.py --dry-run       # show what each club would match, download nothing
python3 tools/fetch_crests.py --european      # just the clubs that regularly play in Europe
python3 tools/fetch_crests.py --country ESP ITA
python3 tools/fetch_crests.py --source thesportsdb   # or wikipedia (default: both)
python3 tools/fetch_crests.py --list-missing
python3 tools/fetch_crests.py --rebuild-only  # after adding PNGs by hand
```

It looks each club up on Wikipedia first and accepts an article only if it describes a
football club in the right country; clubs Wikipedia doesn't have go to TheSportsDB. Both
limit how fast you can ask, so the script paces itself (a few hundred clubs take about an
hour); stop and restart it any time. To replace a crest, delete its file and re-run, or save
a PNG as `img/crests/<club id>.png` (for example `ESP_RSO.png`) and run with
`--rebuild-only`. Clubs it can't match are listed in `tools/crest_misses.txt`, and a club
without a crest falls back to a coloured badge with its short code. The crests of
Peterborough, Randers and Dinamo Tbilisi were recoloured to club blue and those of Juventus
and Torpedo Kutaisi to black, because their source images are all white; five crests that came
on a white box (College 1975, Jeunesse Canach, Gżira United, Arsenal Tivat, Cosmos) had the
box made transparent. Crests are the clubs' trademarks, so they're fine for a personal game
but shouldn't be redistributed publicly.

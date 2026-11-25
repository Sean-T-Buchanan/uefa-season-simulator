// Club data for the English professional pyramid (2025/26 league compositions).
// Each row: [name, short code, base rating, primary colour].
// Ratings are on a single pyramid-wide scale so promoted/relegated clubs keep
// a realistic strength gap against their new division. Edit freely.

const LEAGUES = [
  {
    id: "PL", name: "Premier League", short: "PL", tier: 1,
    budgetBase: 60,  // £m — typical spending on players and staff in a season (scales investment effects)
    impact: 1,        // rating effects scale with how tightly bunched the division is
    ticketYield: 40,  // £ matchday income per fan per home game (before brand premium)
    zones: { champion: 1, europe: 4, europe2: 6, autoUp: 0, playoff: [0, 0], down: 3 },
    teams: [
      ["Liverpool", "LIV", 88, "#C8102E"],
      ["Arsenal", "ARS", 88, "#EF0107"],
      ["Manchester City", "MCI", 87, "#6CABDD"],
      ["Chelsea", "CHE", 84, "#034694"],
      ["Newcastle United", "NEW", 82, "#241F20"],
      ["Aston Villa", "AVL", 80, "#670E36"],
      ["Tottenham Hotspur", "TOT", 79, "#132257"],
      ["Manchester United", "MUN", 78, "#DA291C"],
      ["Crystal Palace", "CRY", 78, "#1B458F"],
      ["Brighton & Hove Albion", "BHA", 78, "#0057B8"],
      ["Nottingham Forest", "NFO", 77, "#DD0000"],
      ["Bournemouth", "BOU", 77, "#B50E12"],
      ["Brentford", "BRE", 76, "#E30613"],
      ["Fulham", "FUL", 76, "#1A1A1A"],
      ["Everton", "EVE", 75, "#003399"],
      ["West Ham United", "WHU", 74, "#7A263A"],
      ["Wolverhampton Wanderers", "WOL", 73, "#FDB913"],
      ["Leeds United", "LEE", 72, "#1D428A"],
      ["Burnley", "BUR", 71, "#6C1D45"],
      ["Sunderland", "SUN", 71, "#EB172B"],
    ],
  },
  {
    id: "CH", name: "Championship", short: "Champ", tier: 2,
    budgetBase: 10, impact: 0.8, ticketYield: 22,
    zones: { champion: 1, autoUp: 2, playoff: [3, 6], down: 3 },
    teams: [
      ["Leicester City", "LEI", 72, "#003090"],
      ["Ipswich Town", "IPS", 72, "#3A64A3"],
      ["Southampton", "SOU", 71, "#D71920"],
      ["Sheffield United", "SHU", 69, "#EE2737"],
      ["Middlesbrough", "MID", 68, "#E11B22"],
      ["Coventry City", "COV", 68, "#59CBE8"],
      ["West Bromwich Albion", "WBA", 67, "#122F67"],
      ["Norwich City", "NOR", 67, "#00A650"],
      ["Birmingham City", "BIR", 66, "#1F3C99"],
      ["Bristol City", "BRC", 66, "#E21B23"],
      ["Millwall", "MIL", 65, "#001D5E"],
      ["Watford", "WAT", 65, "#E8C80E"],
      ["Wrexham", "WRE", 65, "#C8102E"],
      ["Stoke City", "STK", 65, "#E03A3E"],
      ["Hull City", "HUL", 64, "#F5A12D"],
      ["Swansea City", "SWA", 64, "#2B2B2B"],
      ["Preston North End", "PNE", 63, "#002B5C"],
      ["Derby County", "DER", 63, "#1A1A1A"],
      ["Blackburn Rovers", "BLB", 63, "#009EE0"],
      ["Queens Park Rangers", "QPR", 62, "#1D5BA4"],
      ["Portsmouth", "POR", 62, "#001489"],
      ["Charlton Athletic", "CHA", 61, "#D4021D"],
      ["Oxford United", "OXF", 60, "#F2C200"],
      ["Sheffield Wednesday", "SHW", 59, "#3366CC"],
    ],
  },
  {
    id: "L1", name: "League One", short: "L1", tier: 3,
    budgetBase: 2.5, impact: 0.7, ticketYield: 17,
    zones: { champion: 1, autoUp: 2, playoff: [3, 6], down: 4 },
    teams: [
      ["Luton Town", "LUT", 61, "#F78F1E"],
      ["Cardiff City", "CAR", 60, "#0070B5"],
      ["Huddersfield Town", "HUD", 58, "#0E63AD"],
      ["Bolton Wanderers", "BOL", 68, "#1B2A5A"],
      ["Stockport County", "STO", 58, "#1C4F9C"],
      ["Plymouth Argyle", "PLY", 57, "#00543C"],
      ["Wycombe Wanderers", "WYC", 57, "#2E7DC0"],
      ["Barnsley", "BAR", 55, "#D71920"],
      ["Wigan Athletic", "WIG", 55, "#1D59AF"],
      ["Reading", "REA", 55, "#004494"],
      ["Lincoln City", "LIN", 55, "#D3121B"],
      ["Leyton Orient", "LEY", 55, "#C8102E"],
      ["Bradford City", "BRA", 55, "#7A1F35"],
      ["Peterborough United", "PET", 54, "#1A5DAD"],
      ["Blackpool", "BPL", 54, "#F68712"],
      ["Mansfield Town", "MNS", 54, "#E0A100"],
      ["Doncaster Rovers", "DON", 54, "#D71920"],
      ["Rotherham United", "ROT", 53, "#D71920"],
      ["Port Vale", "POV", 53, "#1A1A1A"],
      ["Exeter City", "EXE", 52, "#D71920"],
      ["Stevenage", "STE", 52, "#C8102E"],
      ["AFC Wimbledon", "WIM", 52, "#2F3B8F"],
      ["Northampton Town", "NTH", 51, "#7A1E2C"],
      ["Burton Albion", "BRT", 51, "#E0A100"],
    ],
  },
  {
    id: "L2", name: "League Two", short: "L2", tier: 4,
    budgetBase: 1.2, impact: 0.6, ticketYield: 15,
    zones: { champion: 1, autoUp: 3, playoff: [4, 7], down: 2 },
    teams: [
      ["Notts County", "NTC", 51, "#1A1A1A"],
      ["Cambridge United", "CAM", 50, "#E5A800"],
      ["Chesterfield", "CHF", 50, "#0057B8"],
      ["Salford City", "SAL", 50, "#D71920"],
      ["Milton Keynes Dons", "MKD", 50, "#B8952A"],
      ["Walsall", "WAL", 50, "#D71920"],
      ["Bristol Rovers", "BRR", 49, "#1D428A"],
      ["Grimsby Town", "GRI", 49, "#1A1A1A"],
      ["Crawley Town", "CRA", 48, "#C8102E"],
      ["Colchester United", "COL", 48, "#0057B8"],
      ["Swindon Town", "SWI", 48, "#D71920"],
      ["Shrewsbury Town", "SHR", 47, "#0A3B8E"],
      ["Crewe Alexandra", "CRE", 47, "#D71920"],
      ["Gillingham", "GIL", 47, "#1D428A"],
      ["Fleetwood Town", "FLE", 47, "#D71920"],
      ["Bromley", "BRO", 47, "#1A1A1A"],
      ["Oldham Athletic", "OLD", 47, "#0057B8"],
      ["Tranmere Rovers", "TRA", 46, "#2B5BA8"],
      ["Barrow", "BRW", 46, "#0A63B4"],
      ["Cheltenham Town", "CHL", 46, "#D71920"],
      ["Barnet", "BNT", 46, "#E58A00"],
      ["Accrington Stanley", "ACC", 45, "#D71920"],
      ["Harrogate Town", "HAR", 45, "#E5B800"],
      ["Newport County", "NWP", 45, "#E58A00"],
    ],
  },
];

// National League clubs that can be promoted into League Two in later seasons.
const NATIONAL_LEAGUE_POOL = [
  ["Carlisle United", "CRL", 46, "#0055A4"],
  ["York City", "YOR", 45, "#D71920"],
  ["Forest Green Rovers", "FGR", 44, "#4FA83D"],
  ["Southend United", "SND", 44, "#0050A0"],
  ["Rochdale", "ROC", 44, "#1D428A"],
  ["Morecambe", "MOR", 42, "#D71920"],
  ["Hartlepool United", "HPL", 42, "#0057B8"],
  ["Scunthorpe United", "SCU", 42, "#7A263A"],
  ["Sutton United", "SUT", 41, "#E5A800"],
  ["Boston United", "BOS", 40, "#E5A800"],
];

// Other non-league clubs. They never join the Football League here, but enter
// the FA Cup first round alongside the National League clubs above.
const NON_LEAGUE_CLUBS = [
  ["Gateshead", "GAT", 40, "#1A1A1A"],
  ["Aldershot Town", "ALD", 40, "#D71920"],
  ["Altrincham", "ALT", 39, "#D71920"],
  ["FC Halifax Town", "HAL", 39, "#0057B8"],
  ["Solihull Moors", "SOL", 39, "#E58A00"],
  ["Boreham Wood", "BWD", 38, "#1A1A1A"],
  ["Brackley Town", "BRK", 38, "#D71920"],
  ["Eastleigh", "EAS", 38, "#0057B8"],
  ["Woking", "WOK", 38, "#D71920"],
  ["Yeovil Town", "YEO", 38, "#2E8B57"],
  ["Tamworth", "TAM", 37, "#D71920"],
  ["Braintree Town", "BRN", 36, "#E58A00"],
  ["Wealdstone", "WEA", 36, "#0057B8"],
  ["Kidderminster Harriers", "KID", 36, "#D71920"],
  ["Torquay United", "TOR", 36, "#E5B800"],
  ["Dagenham & Redbridge", "DAG", 36, "#D71920"],
  ["Truro City", "TRU", 35, "#1A1A1A"],
  ["Chorley", "CHO", 35, "#1A1A1A"],
  ["Hereford", "HER", 35, "#1A1A1A"],
  ["AFC Fylde", "FYL", 35, "#003F8C"],
  ["Macclesfield", "MAC", 35, "#0057B8"],
  ["Maidstone United", "MAI", 35, "#E5B800"],
];

// The resource categories a manager can invest in.
// `max` is the ceiling of the effect; spending follows diminishing returns:
//   effect = max * (1 - exp(-spend / (budgetBase * scale)))
// Rating effects (`rating: true`) are further scaled by the division's `impact`.
const INVESTMENTS = [
  {
    id: "attack", rating: true, name: "Forwards", group: "transfer", icon: "⚽",
    desc: "Sign strikers and wingers. Raises attacking strength — you score more.",
    max: 6, scale: 0.3, effectLabel: (v) => `+${v.toFixed(1)} ATT`,
  },
  {
    id: "midfield", rating: true, name: "Midfielders", group: "transfer", icon: "🔁",
    desc: "Control games. Smaller boost to both attack and defence.",
    max: 3, scale: 0.25, effectLabel: (v) => `+${v.toFixed(1)} ATT / DEF`,
  },
  {
    id: "defence", rating: true, name: "Defenders & Keeper", group: "transfer", icon: "🧤",
    desc: "Shore up the back line. Raises defensive strength — you concede less.",
    max: 6, scale: 0.3, effectLabel: (v) => `+${v.toFixed(1)} DEF`,
  },
  {
    id: "coaching", rating: true, name: "Coaching Staff", group: "club", icon: "📋",
    desc: "Better tactics and training. Small all-round boost and softens losing streaks.",
    max: 2.5, scale: 0.15, effectLabel: (v) => `+${v.toFixed(1)} ATT / DEF`,
  },
  {
    id: "medical", name: "Sports Science", group: "club", icon: "🩺",
    desc: "Medical team and fitness. Fewer injury crises, and quicker recoveries.",
    max: 1, scale: 0.12, effectLabel: (v) => `−${Math.round(v * 70)}% injuries`,
  },
  {
    id: "stadium", name: "Fans & Matchday", group: "club", icon: "📣",
    desc: "Fan engagement and matchday experience. Bigger home advantage and more demand for tickets.",
    max: 1, scale: 0.15, effectLabel: (v) => `+${Math.round(v * 10)}% home edge · +${Math.round(v * 15)}% demand`,
  },
  {
    id: "academy", rating: true, name: "Academy & Scouting", group: "club", icon: "🌱",
    desc: "Long-term investment. No effect this season — raises squad rating next season.",
    max: 3, scale: 0.2, effectLabel: (v) => `+${v.toFixed(1)} next season`,
  },
];

// How AI clubs use their money. Each club gets a style (which can change with
// a new owner or manager), and every decision adds its own random noise.
//   spend:   share of preseason funds spent before the season (rest is a reserve)
//   january: appetite for spending in the January window
//   weights: how money is split across INVESTMENTS (null = picks 1–2 areas at random)
const AI_STYLES = [
  {
    id: "ambitious", name: "Ambitious", desc: "Spends almost everything, mostly on attackers.",
    spend: [0.9, 1.0], january: 1.3,
    weights: { attack: 0.34, midfield: 0.16, defence: 0.24, coaching: 0.1, medical: 0.06, stadium: 0.05, academy: 0.05 },
  },
  {
    id: "balanced", name: "Balanced", desc: "Spreads money sensibly across the squad and staff.",
    spend: [0.75, 0.9], january: 1,
    weights: { attack: 0.26, midfield: 0.15, defence: 0.26, coaching: 0.11, medical: 0.08, stadium: 0.06, academy: 0.08 },
  },
  {
    id: "pragmatic", name: "Pragmatic", desc: "Defence first. Hard to beat, short of goals.",
    spend: [0.75, 0.9], january: 1,
    weights: { attack: 0.16, midfield: 0.16, defence: 0.38, coaching: 0.14, medical: 0.08, stadium: 0.04, academy: 0.04 },
  },
  {
    id: "prudent", name: "Prudent", desc: "Keeps a war chest and invests in staff.",
    spend: [0.45, 0.65], january: 0.7,
    weights: { attack: 0.18, midfield: 0.12, defence: 0.18, coaching: 0.18, medical: 0.12, stadium: 0.08, academy: 0.14 },
  },
  {
    id: "youth", name: "Youth project", desc: "Builds for the future through the academy.",
    spend: [0.7, 0.85], january: 0.8,
    weights: { attack: 0.17, midfield: 0.12, defence: 0.17, coaching: 0.12, medical: 0.06, stadium: 0.04, academy: 0.32 },
  },
  {
    id: "gambler", name: "Gambler", desc: "Unpredictable. Splurges on one or two areas.",
    spend: [0.85, 1.0], january: 1.5, weights: null,
  },
];

// Cup competitions. `after` (fraction of the league season) places each round
// in the calendar. `prize` (£m) goes to the winner of the tie.
// Entry: EFL Cup R1 = EFL clubs, R2 = most PL clubs, R3 = the 8 strongest PL clubs.
//        FA Cup R1 = League One, League Two and non-league; R3 = PL and Championship.
const CUPS = [
  {
    id: "EFL", name: "EFL Cup", short: "EFL Cup",
    rounds: [
      { name: "First round", short: "R1", at: 0.02, prize: 0.03 },
      { name: "Second round", short: "R2", at: 0.07, prize: 0.04 },
      { name: "Third round", short: "R3", at: 0.14, prize: 0.05 },
      { name: "Fourth round", short: "R4", at: 0.26, prize: 0.08 },
      { name: "Quarter-final", short: "QF", at: 0.40, prize: 0.12 },
      { name: "Semi-final, 1st leg", short: "SF1", at: 0.50, firstLeg: true },
      { name: "Semi-final, 2nd leg", short: "SF2", at: 0.56, secondLeg: true, prize: 0.25 },
      { name: "Final", short: "Final", at: 0.70, neutral: true, extraTime: true, prize: 0.5 },
    ],
  },
  {
    id: "FA", name: "FA Cup", short: "FA Cup",
    rounds: [
      { name: "First round", short: "R1", at: 0.30, prize: 0.04, extraTime: true },
      { name: "Second round", short: "R2", at: 0.38, prize: 0.06, extraTime: true },
      { name: "Third round", short: "R3", at: 0.50, prize: 0.1, extraTime: true },
      { name: "Fourth round", short: "R4", at: 0.58, prize: 0.12, extraTime: true },
      { name: "Fifth round", short: "R5", at: 0.68, prize: 0.225, extraTime: true },
      { name: "Quarter-final", short: "QF", at: 0.76, prize: 0.45, extraTime: true },
      { name: "Semi-final", short: "SF", at: 0.88, prize: 1.0, neutral: true, extraTime: true },
      { name: "Final", short: "Final", at: 0.97, prize: 2.0, neutral: true, extraTime: true },
    ],
  },
];

// Stadium capacities (approximate, 2025).
const CAPACITY = {
  LIV: 61276, ARS: 60704, MCI: 53400, CHE: 40343, NEW: 52305, AVL: 42640, TOT: 62850, MUN: 74310, CRY: 25486, BHA: 31876,
  NFO: 30404, BOU: 11307, BRE: 17250, FUL: 29589, EVE: 52888, WHU: 62500, WOL: 31750, LEE: 37645, BUR: 21944, SUN: 49000,
  LEI: 32262, IPS: 30056, SOU: 32384, SHU: 32050, MID: 34742, COV: 32609, WBA: 26688, NOR: 27244, BIR: 29409, BRC: 27000,
  MIL: 20146, WAT: 22200, WRE: 12600, STK: 30089, HUL: 25586, SWA: 21088, PNE: 23404, DER: 32956, BLB: 31367, QPR: 18439,
  POR: 20899, CHA: 27111, OXF: 12500, SHW: 39732,
  LUT: 12000, CAR: 33280, HUD: 24121, BOL: 28723, STO: 10852, PLY: 17900, WYC: 10137, BAR: 23287, WIG: 25133, REA: 24161,
  LIN: 10669, LEY: 9271, BRA: 25136, PET: 15314, BPL: 16616, MNS: 9186, DON: 15231, ROT: 12021, POV: 15036, EXE: 8714,
  STE: 7800, WIM: 9215, NTH: 7798, BRT: 6912,
  NTC: 19841, CAM: 8127, CHF: 10504, SAL: 5108, MKD: 30500, WAL: 11300, BRR: 9832, GRI: 9052, CRA: 6134, COL: 10105,
  SWI: 15728, SHR: 9875, CRE: 10153, GIL: 11582, FLE: 5327, BRO: 5000, OLD: 13512, TRA: 16587, BRW: 5045, CHL: 7066,
  BNT: 6500, ACC: 5450, HAR: 5000, NWP: 7850,
  CRL: 17949, YOR: 8500, FGR: 5147, SND: 12392, ROC: 10249, MOR: 6476, HPL: 7865, SCU: 9088, SUT: 5013, BOS: 5000,
  GAT: 11800, ALD: 7100, ALT: 6085, HAL: 10401, SOL: 5500, BWD: 4502, BRK: 3500, EAS: 5192, WOK: 6036, YEO: 9565,
  TAM: 4000, BRN: 4222, WEA: 4085, KID: 6444, TOR: 6500, DAG: 6078, TRU: 3000, CHO: 4100, HER: 4913, FYL: 6000,
  MAC: 5908, MAI: 4200,
};

// Rough ticket demand relative to capacity in recent seasons (1 = full;
// above 1 = more fans want tickets than there are seats). Clubs not listed
// use 0.9 in the Football League and 0.5 outside it.
const ATTENDANCE = {
  LIV: 1.15, ARS: 1.1, MCI: 1.0, CHE: 1.05, NEW: 1.1, AVL: 1.05, TOT: 1.0, MUN: 1.05, CRY: 1.05, BHA: 1.05,
  NFO: 1.05, BOU: 1.1, BRE: 1.05, FUL: 1.0, EVE: 0.97, WHU: 0.97, WOL: 0.97, LEE: 1.0, BUR: 0.9, SUN: 0.95,
  LEI: 0.98, IPS: 0.98, SOU: 0.95, MID: 0.78, COV: 0.85, NOR: 0.97, BIR: 0.95, BRC: 0.8, MIL: 0.8, WAT: 0.85,
  WRE: 1.2, STK: 0.8, HUL: 0.7, SWA: 0.82, PNE: 0.65, DER: 0.85, BLB: 0.5, QPR: 0.85, POR: 1.05, CHA: 0.7,
  OXF: 1.0, SHW: 0.7,
  LUT: 1.1, CAR: 0.62, HUD: 0.7, BOL: 0.78, STO: 1.05, PLY: 0.95, WYC: 0.8, BAR: 0.55, WIG: 0.38, REA: 0.45,
  LIN: 0.95, LEY: 0.85, BRA: 0.8, PET: 0.62, BPL: 0.75, MNS: 0.85, DON: 0.55, ROT: 0.7, POV: 0.6, EXE: 0.95,
  STE: 0.7, WIM: 0.95, BRT: 0.45,
  NTC: 0.55, CAM: 0.8, CHF: 0.85, SAL: 0.55, MKD: 0.3, WAL: 0.55, BRR: 0.75, GRI: 0.9, CRA: 0.6, COL: 0.4,
  SWI: 0.55, SHR: 0.55, CRE: 0.45, GIL: 0.5, FLE: 0.55, BRO: 0.75, OLD: 0.7, TRA: 0.38, BRW: 0.65, CHL: 0.6,
  BNT: 0.4, ACC: 0.6, HAR: 0.55, NWP: 0.5,
  CRL: 0.45, YOR: 0.85, SND: 0.7, ROC: 0.35, HPL: 0.65, SCU: 0.4, GAT: 0.2, HAL: 0.25, YEO: 0.35,
};

// Ground improvements you can pay for. Costs scale with your division's gate
// money: about 3.5 seasons of takings for a sold-out seat (more for a quick build).
const EXPANSIONS = [
  { id: "infill", name: "Corner infill", seats: 1500, matchdays: 6, premium: 1.3,
    desc: "Quick build. Opens after 6 league matchdays." },
  { id: "extend", name: "Extend a stand", seats: 4000, nextSeason: true, premium: 1,
    desc: "Built over the summer. Opens at the start of next season." },
  { id: "stand", name: "Build a new stand", seats: 10000, nextSeason: true, premium: 1,
    desc: "A major project. Opens at the start of next season." },
];

// Club finances, roughly at 2024/25 levels. All money is £m per season.
const FINANCE = {
  central: { PL: 95, CH: 10, L1: 2.4, L2: 1.7 },        // equal share of TV and central money (incl. solidarity)
  operations: { PL: 35, CH: 6, L1: 1.8, L2: 1.0 },      // non-playing staff, stadium running costs, travel
  meritPerPlace: 3,                                     // Premier League merit payment per place
  parachute: [45, 35],                                  // paid in the two seasons after PL relegation
  europe: { cl: 75, el: 30, ecl: 15 },                  // next season, from a top-six finish or a domestic cup win
  commercialShare: { 1: 1, 2: 0.4, 3: 0.14, 4: 0.08 },  // share of a club's PL-level commercial pull it earns
  wages: { base: 3, from: 47, growth: 0.118 },          // squad market value: base × e^(growth × (rating − from))
  wageRatio: { 1: 0.62, 2: 0.95, 3: 0.52, 4: 0.47 },     // starting wages as a share of revenue (sets each club's pay level)
  payChange: { promoted: 1.25, relegated: 0.75 },       // pay level after moving division (bonuses, relegation clauses)
  owner: { PL: [0, 25], CH: [4, 22], L1: [0.5, 3.5], L2: [0.2, 1.2] }, // owner funding per season
  credit: 0.15,                                         // credit line as a share of season revenue
  // Profitability & Sustainability: maximum losses over three seasons, and
  // the points deducted per £m over the limit (capped).
  ps: { PL: { limit: 105, perPoint: 5, max: 10 }, CH: { limit: 39, perPoint: 2, max: 12 } },
  scmp: { L1: 0.6, L2: 0.55 },                          // squad cost cap: wages + transfers ÷ (turnover + owner funding)
  administration: { PL: 9, CH: 12, L1: 12, L2: 12 },    // points deducted on entering administration
  saleFeeYears: 2.5,                                    // transfer fee ≈ this many years of the wages saved
};

// Commercial pull (£m a season at Premier League level) for clubs whose brand
// is bigger than their crowds suggest. Everyone else: 8 + £0.55m per 1,000 fans.
const COMMERCIAL = {
  MCI: 340, MUN: 300, LIV: 270, TOT: 230, ARS: 220, CHE: 200, NEW: 100, AVL: 80, WHU: 70, LEI: 60,
  EVE: 50, LEE: 45, BHA: 45, WOL: 40, CRY: 40, SOU: 40, NFO: 35, FUL: 35, SUN: 30, BRE: 30, BUR: 25, BOU: 25,
};

// Players you can sell to raise money (in transfer windows).
const SALES = [
  { id: "squad", name: "Sell a squad player", points: 0.5 },
  { id: "key", name: "Sell a key player", points: 1.5 },
  { id: "star", name: "Sell your star player", points: 3 },
];

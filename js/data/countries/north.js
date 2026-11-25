// Northern Europe, the Baltics, Ireland, Northern Ireland, Wales and Poland: top flights only.
// Line-ups: 2025/26 for autumn-spring leagues, the 2025 season for calendar-year leagues.
// [name, code, rating, colour, capacity, demand, commercial]

addCountry({
  id: "DEN", name: "Denmark", flag: "🇩🇰",
  cup: { name: "Danish Cup", short: "Pokalen", divisions: ["DEN1"] },
  divisions: [
    {
      id: "DEN1", name: "Superliga", short: "Superliga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 6, rr: 2, carry: "full" },
            { name: "Relegation group", size: 6, rr: 2, carry: "full" },
          ],
        },
        playoff: { name: "European play-offs", from: 4, to: 7 },
      },
      money: { tv: 3, ops: 4, ticket: 15, owner: [0, 3], wageRatio: 0.6, budget: 4 },
      teams: [
        ["FC Copenhagen", "FCK", 70, "#1C3F94", 38065, 0.75, 20],
        ["Midtjylland", "FCM", 69, "#000000", 11800, 0.7, 9],
        ["Brøndby", "BIF", 64, "#FFD200", 28000, 0.62, 10],
        ["AGF", "AGF", 63, "#004B93", 19433, 0.6, 6],
        ["Nordsjælland", "FCN", 63, "#E30613", 10300, 0.45, 5],
        ["Randers", "RFC", 60, "#005EB8", 10300, 0.5, 3],
        ["Silkeborg", "SIF", 60, "#E2001A", 10000, 0.55, 3],
        ["Viborg", "VFF", 59, "#00843D", 9566, 0.55, 2.5],
        ["Sønderjyske", "SJE", 58, "#0055A4", 10000, 0.5, 2.5],
        ["OB", "OBO", 58, "#0047AB", 15761, 0.5, 3],
        ["Vejle", "VBK", 57, "#D2001E", 10418, 0.5, 2.5],
        ["FC Fredericia", "FRE", 56, "#E30613", 4000, 0.6, 1.5],
      ],
    },
  ],
});

addCountry({
  id: "NOR", name: "Norway", flag: "🇳🇴",
  cup: { name: "Norwegian Cup", short: "NM Cup", divisions: ["NOR1"] },
  divisions: [
    {
      id: "NOR1", name: "Eliteserien", short: "Eliteserien", tier: 1,
      format: { rr: 2 },
      money: { tv: 2.5, ops: 4, ticket: 15, owner: [0, 2], wageRatio: 0.6, budget: 3.5 },
      teams: [
        ["Bodø/Glimt", "BOD", 72, "#FFE500", 8200, 0.95, 10],
        ["Molde", "MOL", 65, "#003B7B", 11249, 0.6, 6],
        ["Brann", "BRA", 64, "#D2001E", 17500, 0.9, 6],
        ["Viking", "VIK", 63, "#002D72", 15900, 0.8, 4],
        ["Rosenborg", "ROS", 62, "#1A1A1A", 21423, 0.75, 7],
        ["Vålerenga", "VIF", 59, "#00205B", 16556, 0.6, 4],
        ["Fredrikstad", "FFK", 59, "#C8102E", 12560, 0.75, 2.5],
        ["Sarpsborg 08", "SAR", 58, "#003F87", 8022, 0.55, 2],
        ["Tromsø", "TIL", 58, "#D00000", 6691, 0.7, 2],
        ["Sandefjord", "SFJ", 56, "#005BAC", 6582, 0.6, 1.5],
        ["KFUM Oslo", "KFU", 56, "#0047AB", 3300, 0.6, 1],
        ["HamKam", "HAM", 55, "#00843D", 8068, 0.6, 1.5],
        ["Kristiansund", "KBK", 55, "#3EA8E5", 4364, 0.6, 1.2],
        ["Strømsgodset", "SIF", 55, "#00559F", 8935, 0.6, 1.8],
        ["Haugesund", "FKH", 54, "#003DA5", 8983, 0.45, 1.5],
        ["Bryne", "BRY", 54, "#CC0000", 5000, 0.8, 1],
      ],
    },
  ],
});

addCountry({
  id: "SWE", name: "Sweden", flag: "🇸🇪",
  cup: { name: "Svenska Cupen", short: "Cupen", divisions: ["SWE1"] },
  divisions: [
    {
      id: "SWE1", name: "Allsvenskan", short: "Allsvenskan", tier: 1,
      format: { rr: 2 },
      money: { tv: 2.5, ops: 4, ticket: 15, owner: [0, 1], wageRatio: 0.6, budget: 3.5 },
      teams: [
        ["Malmö FF", "MFF", 68, "#6CB4EE", 22500, 0.8, 12],
        ["Hammarby", "HAM", 63, "#00843D", 30000, 0.85, 8],
        ["Djurgården", "DIF", 63, "#1C4E9D", 30000, 0.65, 7],
        ["AIK", "AIK", 62, "#000000", 50000, 0.45, 7],
        ["BK Häcken", "HAC", 61, "#FFE600", 6316, 0.55, 4],
        ["IF Elfsborg", "ELF", 61, "#FFE500", 16200, 0.45, 4],
        ["Mjällby AIF", "MJA", 60, "#FFD700", 7500, 0.65, 2],
        ["GAIS", "GAI", 58, "#006A3A", 18454, 0.6, 2],
        ["IFK Göteborg", "IFG", 58, "#003F87", 18454, 0.75, 5],
        ["IK Sirius", "SIR", 57, "#0055A4", 10522, 0.55, 2],
        ["IF Brommapojkarna", "BRO", 57, "#C8102E", 5000, 0.6, 1.5],
        ["IFK Norrköping", "NOR", 56, "#002F6C", 16000, 0.5, 3],
        ["Halmstads BK", "HBK", 55, "#0057B8", 10873, 0.45, 1.5],
        ["Östers IF", "OST", 55, "#D2232A", 12000, 0.6, 1.5],
        ["Degerfors IF", "DEG", 54, "#D0021B", 5880, 0.7, 1.2],
        ["IFK Värnamo", "VAR", 54, "#E30613", 5000, 0.6, 1.2],
      ],
    },
  ],
});

addCountry({
  id: "POL", name: "Poland", flag: "🇵🇱",
  cup: { name: "Polish Cup", short: "Puchar", divisions: ["POL1"] },
  divisions: [
    {
      id: "POL1", name: "Ekstraklasa", short: "Ekstraklasa", tier: 1,
      format: { rr: 2 },
      money: { tv: 5, ops: 4, ticket: 10, owner: [0, 5], wageRatio: 0.65, budget: 5 },
      teams: [
        ["Legia Warsaw", "LEG", 68, "#00843D", 31103, 0.75, 15],
        ["Lech Poznań", "LEC", 68, "#004A97", 42837, 0.55, 12],
        ["Raków Częstochowa", "RAK", 66, "#D7182A", 5500, 0.9, 6],
        ["Jagiellonia Białystok", "JAG", 65, "#FFD200", 22432, 0.6, 5],
        ["Pogoń Szczecin", "POG", 63, "#002D62", 21163, 0.65, 5],
        ["Górnik Zabrze", "GOR", 62, "#0050A0", 24563, 0.8, 4],
        ["Cracovia", "CRA", 61, "#E30613", 15016, 0.6, 3],
        ["Widzew Łódź", "WID", 61, "#C8102E", 18018, 1.0, 4],
        ["Motor Lublin", "MOT", 60, "#FFD100", 15247, 0.8, 2.5],
        ["GKS Katowice", "KAT", 60, "#006633", 15048, 0.7, 2.5],
        ["Piast Gliwice", "PIA", 60, "#1E3A8A", 9913, 0.45, 2.5],
        ["Radomiak Radom", "RAD", 59, "#007A3D", 8840, 0.6, 2],
        ["Korona Kielce", "KOR", 59, "#FFD700", 15550, 0.5, 2.5],
        ["Zagłębie Lubin", "ZAG", 59, "#F37021", 16068, 0.4, 3],
        ["Lechia Gdańsk", "LGD", 58, "#00A651", 41620, 0.3, 3],
        ["Wisła Płock", "WPL", 58, "#0055A5", 15004, 0.5, 2.5],
        ["Arka Gdynia", "ARK", 57, "#FFDD00", 15139, 0.6, 2],
        ["Bruk-Bet Termalica Nieciecza", "TER", 57, "#F39200", 4666, 0.5, 1.5],
      ],
    },
  ],
});

addCountry({
  id: "FIN", name: "Finland", flag: "🇫🇮",
  cup: { name: "Finnish Cup", short: "Suomen Cup", divisions: ["FIN1"] },
  divisions: [
    {
      id: "FIN1", name: "Veikkausliiga", short: "Veikkausliiga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship series", size: 6, rr: 1, carry: "full" },
            { name: "Relegation series", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 0.3, ops: 1, ticket: 10, owner: [0, 1], wageRatio: 0.7, budget: 0.6 },
      teams: [
        ["HJK Helsinki", "HJK", 56, "#003DA5", 10770, 0.42, 2.5],
        ["KuPS", "KUP", 54, "#FFD700", 4778, 0.6, 1.2],
        ["SJK", "SJK", 51, "#1A1A1A", 6075, 0.5, 1.2],
        ["Ilves", "ILV", 51, "#009B3A", 8000, 0.45, 1],
        ["FC Inter Turku", "INT", 50, "#0A2240", 9372, 0.27, 1],
        ["VPS", "VPS", 49, "#1A1A1A", 6005, 0.4, 0.7],
        ["IF Gnistan", "GNI", 47, "#1F3A93", 2700, 0.45, 0.5],
        ["AC Oulu", "ACO", 47, "#1A1A1A", 5000, 0.4, 0.6],
        ["FC Haka", "HAK", 46, "#1A1A1A", 3516, 0.55, 0.5],
        ["IFK Mariehamn", "MAR", 46, "#006B3F", 1650, 0.7, 0.5],
        ["FF Jaro", "JAR", 45, "#1A1A1A", 5000, 0.35, 0.4],
        ["KTP", "KTP", 44, "#00843D", 4780, 0.5, 0.4],
      ],
    },
  ],
});

addCountry({
  id: "ISL", name: "Iceland", flag: "🇮🇸",
  cup: { name: "Icelandic Cup", short: "Bikarinn", divisions: ["ISL1"] },
  divisions: [
    {
      id: "ISL1", name: "Besta deild karla", short: "Besta deild", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 6, rr: 1, carry: "full" },
            { name: "Relegation group", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 0.2, ops: 0.6, ticket: 8, owner: [0.05, 1], wageRatio: 0.7, budget: 0.5 },
      teams: [
        ["Víkingur Reykjavík", "VIK", 52, "#C8102E", 1450, 0.6, 1],
        ["Breiðablik", "BRE", 51, "#00A651", 3009, 0.45, 1],
        ["Valur", "VAL", 50, "#D2001E", 2465, 0.4, 0.8],
        ["Stjarnan", "STJ", 48, "#0055A4", 1400, 0.55, 0.6],
        ["FH", "FHH", 46, "#1A1A1A", 6450, 0.15, 0.6],
        ["KR", "KRR", 45, "#1A1A1A", 2781, 0.4, 0.6],
        ["ÍA", "IAA", 45, "#FFD700", 3000, 0.35, 0.4],
        ["Fram", "FRA", 43, "#0047AB", 1500, 0.45, 0.4],
        ["KA", "KAA", 43, "#FFD200", 1770, 0.4, 0.4],
        ["ÍBV", "IBV", 41, "#1A1A1A", 2983, 0.25, 0.3],
        ["Vestri", "VES", 40, "#0055A4", 1000, 0.4, 0.2],
        ["Afturelding", "AFT", 39, "#E30613", 1000, 0.45, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "FRO", name: "Faroe Islands", flag: "🇫🇴",
  cup: { name: "Faroe Islands Cup", short: "Løgmanssteypið", divisions: ["FRO1"] },
  divisions: [
    {
      id: "FRO1", name: "Betri deildin", short: "Betri deildin", tier: 1,
      format: { rr: 3 },
      money: { tv: 0.1, ops: 0.3, ticket: 6, owner: [0.05, 0.8], wageRatio: 0.7, budget: 0.25 },
      teams: [
        ["KÍ Klaksvík", "KIK", 50, "#0047AB", 4000, 0.2, 0.6],
        ["Víkingur Gøta", "VIK", 46, "#C8102E", 3000, 0.15, 0.3],
        ["HB Tórshavn", "HBT", 46, "#C8102E", 5000, 0.15, 0.4],
        ["NSÍ Runavík", "NSI", 43, "#FFD200", 2000, 0.2, 0.25],
        ["B36 Tórshavn", "BTS", 42, "#1A1A1A", 5000, 0.12, 0.3],
        ["B68 Toftir", "TOF", 37, "#C8102E", 6000, 0.08, 0.1],
        ["EB/Streymur", "EBS", 37, "#00843D", 2000, 0.15, 0.1],
        ["07 Vestur", "VES", 37, "#0055A4", 2000, 0.15, 0.1],
        ["TB Tvøroyri", "TBT", 36, "#1A1A1A", 4000, 0.08, 0.1],
        ["Suðuroy", "SUD", 35, "#0047AB", 3000, 0.1, 0.1],
      ],
    },
  ],
});

addCountry({
  id: "EST", name: "Estonia", flag: "🇪🇪",
  cup: { name: "Estonian Cup", short: "Karikas", divisions: ["EST1"] },
  divisions: [
    {
      id: "EST1", name: "Meistriliiga", short: "Meistriliiga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.1, ops: 0.5, ticket: 5, owner: [0.05, 1], wageRatio: 0.7, budget: 0.35 },
      teams: [
        ["FCI Levadia", "LEV", 49, "#00843D", 14336, 0.06, 0.8],
        ["Flora Tallinn", "FLO", 48, "#00A651", 14336, 0.07, 0.8],
        ["Paide Linnameeskond", "PAI", 44, "#FFD200", 500, 0.6, 0.3],
        ["Nõmme Kalju", "KAL", 42, "#E30613", 570, 0.5, 0.3],
        ["Narva Trans", "NAR", 39, "#0055A4", 1000, 0.3, 0.15],
        ["Tammeka Tartu", "TAM", 38, "#0047AB", 1750, 0.2, 0.15],
        ["Kuressaare", "KUR", 37, "#FFD200", 1000, 0.3, 0.1],
        ["Harju JK Laagri", "HAR", 37, "#0055A4", 500, 0.4, 0.1],
        ["Vaprus Pärnu", "VAP", 36, "#C8102E", 1501, 0.2, 0.1],
        ["Tallinna Kalev", "TKL", 35, "#C8102E", 5000, 0.05, 0.1],
      ],
    },
  ],
});

addCountry({
  id: "LVA", name: "Latvia", flag: "🇱🇻",
  cup: { name: "Latvian Cup", short: "Kauss", divisions: ["LVA1"] },
  divisions: [
    {
      id: "LVA1", name: "Virslīga", short: "Virslīga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.1, ops: 0.6, ticket: 5, owner: [0.05, 1], wageRatio: 0.7, budget: 0.4 },
      teams: [
        ["RFS Riga", "RFS", 52, "#0055A4", 1700, 0.5, 1],
        ["Riga FC", "RIG", 52, "#1A1A1A", 6747, 0.1, 0.8],
        ["Auda", "AUD", 47, "#FFD200", 6747, 0.06, 0.4],
        ["Liepāja", "LIE", 43, "#C8102E", 4022, 0.2, 0.3],
        ["BFC Daugavpils", "DAU", 38, "#C8102E", 575, 0.4, 0.1],
        ["Grobiņa", "GRO", 39, "#00843D", 4022, 0.06, 0.1],
        ["FS Jelgava", "JEL", 39, "#0055A4", 1560, 0.2, 0.15],
        ["Metta", "MET", 38, "#0047AB", 2500, 0.08, 0.1],
        ["Tukums 2000", "TUK", 37, "#00843D", 425, 0.5, 0.1],
        ["Super Nova", "SNO", 36, "#FF6600", 396, 0.5, 0.1],
      ],
    },
  ],
});

addCountry({
  id: "LTU", name: "Lithuania", flag: "🇱🇹",
  cup: { name: "Lithuanian Football Cup", short: "LFF Cup", divisions: ["LTU1"] },
  divisions: [
    {
      id: "LTU1", name: "A Lyga", short: "A Lyga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.1, ops: 0.6, ticket: 5, owner: [0.05, 1], wageRatio: 0.7, budget: 0.4 },
      teams: [
        ["Žalgiris", "ZAL", 50, "#00843D", 5067, 0.3, 1],
        ["Kauno Žalgiris", "KZA", 47, "#00843D", 15026, 0.08, 0.5],
        ["Hegelmann", "HEG", 46, "#0055A4", 490, 0.6, 0.6],
        ["Sūduva", "SUD", 44, "#0055A4", 6523, 0.15, 0.4],
        ["Panevėžys", "PAN", 43, "#C8102E", 6600, 0.1, 0.3],
        ["Banga Gargždai", "BAN", 40, "#0055A4", 2216, 0.2, 0.15],
        ["FA Šiauliai", "SIA", 39, "#C8102E", 3017, 0.15, 0.15],
        ["Džiugas Telšiai", "DZI", 38, "#0047AB", 2069, 0.2, 0.1],
        ["Riteriai", "RIT", 37, "#1A1A1A", 5067, 0.05, 0.1],
        ["DFK Dainava", "DAI", 36, "#0055A4", 3726, 0.15, 0.1],
      ],
    },
  ],
});

addCountry({
  id: "IRL", name: "Republic of Ireland", flag: "🇮🇪",
  cup: { name: "FAI Cup", short: "FAI Cup", divisions: ["IRL1"] },
  divisions: [
    {
      id: "IRL1", name: "League of Ireland Premier Division", short: "LOI Premier", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.3, ops: 1, ticket: 10, owner: [0, 1], wageRatio: 0.7, budget: 0.6 },
      teams: [
        ["Shamrock Rovers", "SHA", 58, "#00843D", 10000, 0.75, 1.5],
        ["Shelbourne", "SHE", 55, "#C8102E", 4700, 0.95, 0.8],
        ["Derry City", "DER", 55, "#C8102E", 3700, 0.95, 0.7],
        ["St Patrick's Athletic", "STP", 54, "#C8102E", 5340, 0.85, 0.8],
        ["Bohemians", "BOH", 53, "#C8102E", 4500, 0.95, 1],
        ["Drogheda United", "DRO", 49, "#87CEEB", 3000, 0.8, 0.3],
        ["Galway United", "GAL", 49, "#7A1F3D", 5000, 0.6, 0.4],
        ["Sligo Rovers", "SLI", 47, "#C8102E", 3873, 0.6, 0.35],
        ["Waterford", "WAT", 45, "#0055A4", 5160, 0.55, 0.35],
        ["Cork City", "COR", 45, "#00843D", 7485, 0.65, 0.5],
      ],
    },
  ],
});

addCountry({
  id: "NIR", name: "Northern Ireland", flag: "🇬🇧",
  cup: { name: "Irish Cup", short: "Irish Cup", divisions: ["NIR1"] },
  divisions: [
    {
      id: "NIR1", name: "NIFL Premiership", short: "Premiership", tier: 1,
      format: {
        rr: 3,
        split: {
          groups: [
            { name: "Top six", size: 6, rr: 1, carry: "full" },
            { name: "Bottom six", size: 6, rr: 1, carry: "full" },
          ],
        },
        playoff: { name: "European play-offs", from: 4, to: 7 },
      },
      money: { tv: 0.2, ops: 0.8, ticket: 8, owner: [0.05, 1], wageRatio: 0.7, budget: 0.5 },
      teams: [
        ["Linfield", "LIN", 48, "#0055A4", 18434, 0.14, 1.2],
        ["Larne", "LAR", 45, "#C8102E", 2732, 0.45, 0.8],
        ["Glentoran", "GLE", 44, "#00843D", 6054, 0.5, 1],
        ["Cliftonville", "CLI", 43, "#C8102E", 3054, 0.6, 0.6],
        ["Coleraine", "COL", 42, "#0055A4", 4843, 0.3, 0.4],
        ["Crusaders", "CRU", 41, "#C8102E", 3208, 0.35, 0.4],
        ["Dungannon Swifts", "DUN", 40, "#0055A4", 2000, 0.3, 0.2],
        ["Glenavon", "GLV", 38, "#0055A4", 3302, 0.27, 0.25],
        ["Portadown", "POR", 37, "#C8102E", 3940, 0.4, 0.25],
        ["Ballymena United", "BAL", 37, "#0047AB", 3824, 0.25, 0.25],
        ["Carrick Rangers", "CAR", 36, "#FFD200", 2100, 0.3, 0.15],
        ["Bangor", "BAN", 35, "#FFD200", 1895, 0.6, 0.15],
      ],
    },
  ],
});

addCountry({
  id: "WAL", name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  cup: { name: "Welsh Cup", short: "Welsh Cup", divisions: ["WAL1"] },
  divisions: [
    {
      id: "WAL1", name: "Cymru Premier", short: "Cymru Premier", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship conference", size: 6, rr: 2, carry: "full" },
            { name: "Play-off conference", size: 6, rr: 2, carry: "full" },
          ],
        },
        playoff: { name: "European play-offs", from: 3, to: 7 },
      },
      money: { tv: 0.15, ops: 0.4, ticket: 6, owner: [0.05, 1], wageRatio: 0.7, budget: 0.3 },
      teams: [
        ["The New Saints", "TNS", 50, "#00843D", 2034, 0.2, 0.8],
        ["Penybont", "PEN", 41, "#C8102E", 3000, 0.1, 0.15],
        ["Connah's Quay Nomads", "CQN", 40, "#0055A4", 3000, 0.1, 0.15],
        ["Caernarfon Town", "CAE", 39, "#FFD200", 3000, 0.25, 0.15],
        ["Haverfordwest County", "HAV", 38, "#0055A4", 2100, 0.2, 0.1],
        ["Barry Town United", "BAR", 38, "#0055A4", 2650, 0.15, 0.1],
        ["Bala Town", "BAL", 37, "#C8102E", 3000, 0.1, 0.1],
        ["Cardiff Metropolitan University", "CMU", 37, "#00A3E0", 1620, 0.09, 0.05],
        ["Colwyn Bay", "COL", 37, "#FF6600", 3000, 0.15, 0.1],
        ["Flint Town United", "FLI", 36, "#1A1A1A", 3000, 0.1, 0.08],
        ["Briton Ferry Llansawel", "BFL", 35, "#00843D", 2300, 0.08, 0.05],
        ["Llanelli Town", "LLA", 35, "#C8102E", 3700, 0.15, 0.1],
      ],
    },
  ],
});

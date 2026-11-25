// Central & south-eastern Europe: top flights only (2025/26 line-ups).
// Czech Republic, Slovakia, Hungary, Romania, Bulgaria, Serbia, Croatia, Slovenia.
// Team tuple: [name, code, rating, colour, capacity, demand, commercial]

addCountry({
  id: "CZE",
  name: "Czech Republic",
  flag: "🇨🇿",
  cup: { name: "Czech Cup", short: "Pohár", divisions: ["CZE1"] },
  divisions: [
    {
      id: "CZE1", name: "Chance Liga", short: "Chance Liga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 6, rr: 1, carry: "full" },
            { name: "Play-off group", size: 4, rr: 1, carry: "full" },
            { name: "Relegation group", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 2, ops: 3, ticket: 10, owner: [0, 8], wageRatio: 0.65, budget: 4 },
      teams: [
        ["Slavia Prague", "SLA", 74, "#E31E24", 19370, 0.9, 15],
        ["Sparta Prague", "SPA", 72, "#7A1E2B", 18944, 0.88, 15],
        ["Viktoria Plzeň", "PLZ", 70, "#1E3A8A", 11700, 0.8, 8],
        ["Baník Ostrava", "BAN", 66, "#0055A4", 15123, 0.7, 4],
        ["Sigma Olomouc", "SIG", 64, "#003DA5", 12483, 0.4, 2.5],
        ["Jablonec", "JAB", 63, "#00843D", 6108, 0.45, 2],
        ["Slovan Liberec", "LIB", 63, "#2D66B0", 9900, 0.4, 2],
        ["Hradec Králové", "HRA", 62, "#000000", 9300, 0.65, 2],
        ["Mladá Boleslav", "MBO", 61, "#0B3D91", 5000, 0.6, 2],
        ["Karviná", "KAR", 60, "#007A33", 4833, 0.5, 1.5],
        ["Bohemians 1905", "BOH", 59, "#00A651", 6300, 0.85, 2],
        ["Teplice", "TEP", 59, "#FFD700", 18221, 0.25, 1.5],
        ["Slovácko", "SLO", 58, "#005BAC", 8121, 0.5, 1.5],
        ["Zlín", "ZLI", 58, "#FFE500", 5898, 0.55, 1.2],
        ["Pardubice", "PAR", 56, "#D50032", 4620, 0.7, 1.2],
        ["Dukla Prague", "DUK", 55, "#FFD100", 8150, 0.3, 1],
      ],
    },
  ],
});

addCountry({
  id: "SVK",
  name: "Slovakia",
  flag: "🇸🇰",
  cup: { name: "Slovak Cup", short: "Pohár", divisions: ["SVK1"] },
  divisions: [
    {
      id: "SVK1", name: "Niké liga", short: "Niké liga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 6, rr: 2, carry: "full" },
            { name: "Relegation group", size: 6, rr: 2, carry: "full" },
          ],
        },
      },
      money: { tv: 0.8, ops: 1, ticket: 5, owner: [0, 3], wageRatio: 0.7, budget: 1.2 },
      teams: [
        ["Slovan Bratislava", "SLO", 63, "#4FA3DB", 22500, 0.35, 5],
        ["Spartak Trnava", "TRN", 58, "#C8102E", 19200, 0.4, 2],
        ["DAC Dunajská Streda", "DAC", 58, "#FFD100", 12700, 0.5, 3],
        ["Žilina", "ZIL", 57, "#F2C500", 11258, 0.3, 1.5],
        ["Podbrezová", "POD", 53, "#0057A8", 4061, 0.2, 1],
        ["Ružomberok", "RUZ", 52, "#003399", 4817, 0.3, 0.8],
        ["Košice", "KOS", 52, "#FFD200", 12555, 0.4, 1.2],
        ["Michalovce", "MIC", 50, "#1A1A1A", 4440, 0.3, 0.6],
        ["Trenčín", "TRE", 50, "#D71920", 6366, 0.3, 0.8],
        ["Komárno", "KOM", 50, "#005BAB", 3000, 0.4, 0.5],
        ["Tatran Prešov", "PRE", 49, "#000000", 6500, 0.5, 0.6],
        ["Skalica", "SKA", 48, "#0033A0", 2000, 0.5, 0.4],
      ],
    },
  ],
});

addCountry({
  id: "HUN",
  name: "Hungary",
  flag: "🇭🇺",
  cup: { name: "Magyar Kupa", short: "Kupa", divisions: ["HUN1"] },
  divisions: [
    {
      id: "HUN1", name: "Nemzeti Bajnokság I", short: "NB I", tier: 1,
      format: { rr: 3 },
      money: { tv: 1.5, ops: 2, ticket: 6, owner: [0, 5], wageRatio: 0.7, budget: 2.5 },
      teams: [
        ["Ferencváros", "FTC", 69, "#006633", 22043, 0.45, 12],
        ["Puskás Akadémia", "PUS", 60, "#003A70", 3816, 0.4, 4],
        ["Paks", "PAK", 58, "#00843D", 6500, 0.4, 2.5],
        ["Győr", "GYO", 58, "#009A44", 15600, 0.35, 3],
        ["Debrecen", "DEB", 56, "#E2001A", 20340, 0.3, 2.5],
        ["MTK Budapest", "MTK", 55, "#003DA5", 5014, 0.3, 2],
        ["Diósgyőr", "DIO", 54, "#D2122E", 15325, 0.4, 2],
        ["Újpest", "UJP", 54, "#5B2C83", 13501, 0.4, 2],
        ["Zalaegerszeg", "ZTE", 53, "#0055A5", 11200, 0.3, 1.5],
        ["Nyíregyháza", "NYI", 51, "#0057B8", 8151, 0.45, 1.2],
        ["Kisvárda", "KIS", 51, "#C8102E", 2850, 0.4, 1.2],
        ["Kazincbarcika", "KAZ", 50, "#0072CE", 3000, 0.4, 1],
      ],
    },
  ],
});

addCountry({
  id: "ROU",
  name: "Romania",
  flag: "🇷🇴",
  cup: { name: "Cupa României", short: "Cupa", divisions: ["ROU1"] },
  divisions: [
    {
      id: "ROU1", name: "SuperLiga", short: "SuperLiga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship play-off", size: 6, rr: 2, carry: "half" },
            { name: "Relegation play-out", size: 10, rr: 1, carry: "half" },
          ],
        },
      },
      money: { tv: 2, ops: 2, ticket: 7, owner: [0, 5], wageRatio: 0.7, budget: 2.5 },
      teams: [
        ["FCSB", "FCS", 65, "#E30613", 55634, 0.3, 8],
        ["CFR Cluj", "CFR", 62, "#7B1E2E", 22198, 0.3, 4],
        ["Universitatea Craiova", "UCV", 62, "#00A3E0", 30983, 0.4, 4],
        ["Rapid București", "RAP", 60, "#6E1E2B", 14047, 0.8, 4],
        ["Dinamo București", "DIN", 59, "#C8102E", 8207, 0.8, 3],
        ["Universitatea Cluj", "UCJ", 59, "#1A1A1A", 30201, 0.3, 2.5],
        ["Farul Constanța", "FAR", 57, "#0055A4", 4554, 0.4, 2],
        ["Oțelul Galați", "OTE", 56, "#D71920", 13500, 0.4, 1.5],
        ["Petrolul Ploiești", "PET", 55, "#FFCC00", 15073, 0.4, 1.5],
        ["UTA Arad", "UTA", 55, "#D2122E", 12700, 0.4, 1.2],
        ["FC Botoșani", "BOT", 55, "#B22234", 7782, 0.35, 1],
        ["Argeș Pitești", "ARG", 55, "#5B2C83", 15000, 0.5, 1],
        ["Hermannstadt", "HER", 54, "#000000", 12363, 0.3, 1.2],
        ["Unirea Slobozia", "UNS", 52, "#0055A4", 5000, 0.3, 0.7],
        ["Csíkszereda", "CSI", 52, "#C8102E", 4500, 0.6, 1.5],
        ["Metaloglobus București", "MET", 51, "#F68B1F", 4500, 0.1, 0.5],
      ],
    },
  ],
});

addCountry({
  id: "BUL",
  name: "Bulgaria",
  flag: "🇧🇬",
  cup: { name: "Bulgarian Cup", short: "Kupa", divisions: ["BUL1"] },
  divisions: [
    {
      id: "BUL1", name: "efbet Liga", short: "efbet Liga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 4, rr: 2, carry: "full" },
            { name: "Conference group", size: 4, rr: 1, carry: "full" },
            { name: "Relegation group", size: 8, rr: 1, carry: "full" },
          ],
        },
        playoff: { name: "European play-offs", from: 4, to: 5 },
      },
      money: { tv: 0.8, ops: 1, ticket: 5, owner: [0, 3], wageRatio: 0.7, budget: 1.2 },
      teams: [
        ["Ludogorets", "LUD", 67, "#006A44", 10422, 0.5, 7],
        ["Levski Sofia", "LEV", 59, "#0055A4", 18000, 0.45, 3],
        ["CSKA Sofia", "CSK", 58, "#D50032", 22995, 0.4, 3],
        ["Cherno More", "CHE", 54, "#00843D", 8250, 0.4, 1],
        ["CSKA 1948", "CKA", 54, "#C8102E", 2500, 0.3, 1],
        ["Lokomotiv Plovdiv", "LPL", 52, "#000000", 13220, 0.3, 1],
        ["Arda Kardzhali", "ARD", 52, "#0033A0", 15000, 0.2, 0.6],
        ["Botev Plovdiv", "BPL", 51, "#FFD100", 18777, 0.35, 1],
        ["Slavia Sofia", "SLA", 50, "#FFFFFF", 25556, 0.06, 0.6],
        ["Beroe", "BER", 49, "#009A44", 12128, 0.25, 0.5],
        ["Lokomotiv Sofia", "LSO", 49, "#B22222", 22000, 0.06, 0.5],
        ["Spartak Varna", "SPV", 48, "#003DA5", 7500, 0.3, 0.4],
        ["Septemvri Sofia", "SEP", 48, "#D71920", 3000, 0.2, 0.4],
        ["Botev Vratsa", "BVR", 48, "#00843D", 12000, 0.15, 0.3],
        ["Dobrudzha Dobrich", "DOB", 47, "#FFD100", 12500, 0.2, 0.3],
        ["Montana", "MON", 47, "#0055A4", 6000, 0.2, 0.3],
      ],
    },
  ],
});

addCountry({
  id: "SRB",
  name: "Serbia",
  flag: "🇷🇸",
  cup: { name: "Serbian Cup", short: "Kup", divisions: ["SRB1"] },
  divisions: [
    {
      id: "SRB1", name: "Serbian SuperLiga", short: "SuperLiga", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship round", size: 8, rr: 1, carry: "full" },
            { name: "Relegation round", size: 8, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 1.2, ops: 2, ticket: 6, owner: [0, 5], wageRatio: 0.7, budget: 2 },
      teams: [
        ["Red Star Belgrade", "RSB", 71, "#E3002B", 51755, 0.3, 12],
        ["Partizan", "PAR", 64, "#000000", 29775, 0.3, 6],
        ["Vojvodina", "VOJ", 57, "#C8102E", 14458, 0.3, 2],
        ["TSC Bačka Topola", "TSC", 56, "#0047AB", 4500, 0.3, 1.5],
        ["Čukarički", "CUK", 55, "#1A1A1A", 4070, 0.2, 1],
        ["Novi Pazar", "NPZ", 53, "#C8102E", 10000, 0.4, 0.8],
        ["Radnički 1923", "RKG", 53, "#D71920", 15100, 0.4, 1],
        ["OFK Beograd", "OFK", 52, "#0055A4", 13900, 0.15, 0.8],
        ["Radnički Niš", "RNI", 51, "#B22234", 18151, 0.25, 0.8],
        ["IMT Belgrade", "IMT", 51, "#00539F", 3000, 0.15, 0.6],
        ["Spartak Subotica", "SPA", 50, "#0033A0", 13000, 0.15, 0.6],
        ["Mladost Lučani", "MLA", 50, "#D21034", 8000, 0.15, 0.6],
        ["Železničar Pančevo", "ZEL", 50, "#00539F", 2500, 0.3, 0.5],
        ["Napredak Kruševac", "NAP", 49, "#C8102E", 10331, 0.3, 0.5],
        ["Javor Ivanjica", "JAV", 48, "#0057B8", 4000, 0.3, 0.4],
        ["Radnik Surdulica", "RSU", 48, "#005BAC", 3312, 0.3, 0.4],
      ],
    },
  ],
});

addCountry({
  id: "CRO",
  name: "Croatia",
  flag: "🇭🇷",
  cup: { name: "Croatian Cup", short: "Kup", divisions: ["CRO1"] },
  divisions: [
    {
      id: "CRO1", name: "SuperSport HNL", short: "HNL", tier: 1,
      format: { rr: 4 },
      money: { tv: 1.5, ops: 2, ticket: 8, owner: [0, 5], wageRatio: 0.7, budget: 3 },
      teams: [
        ["Dinamo Zagreb", "DIN", 71, "#004A9F", 24851, 0.55, 10],
        ["Hajduk Split", "HAJ", 64, "#FFFFFF", 33987, 0.6, 7],
        ["Rijeka", "RIJ", 63, "#FFFFFF", 8279, 0.7, 4],
        ["Osijek", "OSI", 60, "#0033A0", 13005, 0.45, 3],
        ["Varaždin", "VAR", 58, "#F58220", 8818, 0.4, 1.2],
        ["Lokomotiva Zagreb", "LOK", 57, "#003DA5", 5350, 0.15, 0.6],
        ["Slaven Belupo", "SLB", 57, "#0055A4", 3205, 0.4, 1],
        ["Istra 1961", "IST", 57, "#FFD100", 8923, 0.35, 1.2],
        ["Gorica", "GOR", 56, "#D71920", 5200, 0.25, 0.8],
        ["Vukovar 1991", "VUK", 54, "#0055A4", 4000, 0.5, 0.6],
      ],
    },
  ],
});

addCountry({
  id: "SVN",
  name: "Slovenia",
  flag: "🇸🇮",
  cup: { name: "Slovenian Cup", short: "Pokal", divisions: ["SVN1"] },
  divisions: [
    {
      id: "SVN1", name: "Prva Liga", short: "PrvaLiga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.6, ops: 1, ticket: 5, owner: [0, 3], wageRatio: 0.7, budget: 1 },
      teams: [
        ["Olimpija Ljubljana", "OLI", 58, "#00843D", 16038, 0.25, 3],
        ["Celje", "CEL", 58, "#FFD100", 13059, 0.15, 2.5],
        ["Maribor", "MAR", 56, "#5B2C83", 11709, 0.4, 2.5],
        ["Koper", "KOP", 52, "#F2C500", 4047, 0.3, 0.8],
        ["Bravo", "BRA", 50, "#00539F", 2300, 0.2, 0.5],
        ["Mura", "MUR", 50, "#000000", 4506, 0.35, 0.6],
        ["Radomlje", "RAD", 47, "#F2A900", 3100, 0.2, 0.3],
        ["Primorje", "PRI", 46, "#D71920", 1630, 0.3, 0.4],
        ["Domžale", "DOM", 45, "#FDB913", 3100, 0.25, 0.4],
        ["Aluminij", "ALU", 45, "#0057B8", 1500, 0.3, 0.3],
      ],
    },
  ],
});

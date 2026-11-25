// Smaller European associations: top flights only (2025/26 line-ups),
// plus Liechtenstein, which has no league of its own and enters only its cup.

addCountry({
  id: "BIH",
  name: "Bosnia and Herzegovina",
  flag: "🇧🇦",
  cup: { name: "Bosnian Cup", short: "Cup", divisions: ["BIH1"] },
  divisions: [
    {
      id: "BIH1", name: "Premijer Liga BiH", short: "Premijer Liga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.4, ops: 0.9, ticket: 4, owner: [0.1, 2], wageRatio: 0.7, budget: 0.6 },
      teams: [
        ["Zrinjski Mostar", "ZRI", 55, "#C8102E", 9000, 0.35, 1.5],
        ["Borac Banja Luka", "BOR", 54, "#D2122E", 10030, 0.4, 1.3],
        ["Sarajevo", "SAR", 51, "#7B1F3A", 34700, 0.15, 1.2],
        ["Željezničar", "ZEL", 48, "#1D4F91", 13057, 0.35, 0.9],
        ["Velež Mostar", "VEL", 48, "#D52B1E", 7000, 0.45, 0.6],
        ["Široki Brijeg", "SIR", 47, "#1F3F8F", 5147, 0.3, 0.6],
        ["Radnik Bijeljina", "RAD", 44, "#1E5AA8", 6000, 0.25, 0.35],
        ["Sloga Doboj", "SLO", 44, "#E30613", 3000, 0.35, 0.3],
        ["Posušje", "POS", 43, "#0B3D91", 5040, 0.3, 0.35],
        ["Rudar Prijedor", "RUD", 42, "#1A1A1A", 3540, 0.35, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "MNE",
  name: "Montenegro",
  flag: "🇲🇪",
  cup: { name: "Montenegrin Cup", short: "Cup", divisions: ["MNE1"] },
  divisions: [
    {
      id: "MNE1", name: "Prva Crnogorska Liga", short: "1. CFL", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.25, ops: 0.6, ticket: 4, owner: [0.1, 1.5], wageRatio: 0.7, budget: 0.4 },
      teams: [
        ["Budućnost Podgorica", "BUD", 48, "#1C3F94", 11080, 0.15, 0.9],
        ["Dečić", "DEC", 45, "#1F5FAD", 1001, 0.4, 0.3],
        ["Sutjeska Nikšić", "SUT", 45, "#0057B8", 5214, 0.25, 0.4],
        ["Mladost Donja Gorica", "MDG", 43, "#F28C00", 3791, 0.15, 0.3],
        ["Petrovac", "PET", 43, "#2E6DB4", 1630, 0.3, 0.2],
        ["Jezero Plav", "JEZ", 42, "#1E88E5", 2500, 0.3, 0.15],
        ["Mornar Bar", "MOR", 42, "#0D47A1", 2200, 0.3, 0.2],
        ["Arsenal Tivat", "ARS", 41, "#C62828", 1200, 0.35, 0.15],
        ["Bokelj", "BOK", 41, "#1565C0", 425, 1.0, 0.2],
        ["Jedinstvo Bijelo Polje", "JED", 40, "#2E7D32", 4000, 0.2, 0.12],
      ],
    },
  ],
});

addCountry({
  id: "MKD",
  name: "North Macedonia",
  flag: "🇲🇰",
  cup: { name: "Macedonian Football Cup", short: "Cup", divisions: ["MKD1"] },
  divisions: [
    {
      id: "MKD1", name: "Macedonian First League", short: "Prva Liga", tier: 1,
      format: { rr: 3 },
      money: { tv: 0.25, ops: 0.6, ticket: 4, owner: [0.1, 2], wageRatio: 0.7, budget: 0.45 },
      teams: [
        ["Shkëndija", "SHK", 48, "#C8102E", 15000, 0.15, 1.0],
        ["Vardar", "VAR", 46, "#C62828", 33011, 0.05, 0.8],
        ["Struga", "STR", 45, "#0057B8", 3000, 0.3, 0.6],
        ["Sileks", "SIL", 44, "#1A1A1A", 4800, 0.15, 0.3],
        ["Rabotnički", "RAB", 43, "#C8102E", 33011, 0.05, 0.3],
        ["Shkupi", "SKP", 43, "#0B1C3F", 6000, 0.2, 0.4],
        ["Tikvesh", "TIK", 42, "#7B1F3A", 7500, 0.12, 0.2],
        ["Pelister", "PEL", 41, "#2E7D32", 10000, 0.15, 0.25],
        ["AP Brera Strumica", "BRE", 41, "#1565C0", 6370, 0.1, 0.4],
        ["Bashkimi", "BAS", 41, "#C8102E", 7000, 0.15, 0.25],
        ["Arsimi", "ARS", 40, "#1E3A8A", 2000, 0.2, 0.15],
        ["Makedonija G.P.", "MGP", 40, "#D52B1E", 3000, 0.15, 0.15],
      ],
    },
  ],
});

addCountry({
  id: "ALB",
  name: "Albania",
  flag: "🇦🇱",
  cup: { name: "Albanian Cup", short: "Cup", divisions: ["ALB1"] },
  divisions: [
    {
      id: "ALB1", name: "Kategoria Superiore", short: "Superiore", tier: 1,
      format: {
        rr: 4,
        split: {
          groups: [
            { name: "Championship round", size: 4, rr: 1, carry: "half" },
            { name: "Remaining clubs", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 0.45, ops: 0.8, ticket: 4, owner: [0.1, 2], wageRatio: 0.7, budget: 0.55 },
      teams: [
        ["Egnatia", "EGN", 47, "#D50000", 4267, 0.3, 0.8],
        ["Partizani", "PAR", 47, "#C8102E", 3959, 0.35, 0.8],
        ["Vllaznia", "VLL", 46, "#B71C1C", 16022, 0.15, 0.7],
        ["Dinamo City", "DIN", 46, "#1565C0", 22500, 0.05, 0.6],
        ["Tirana", "TIR", 45, "#1A1A1A", 7308, 0.3, 0.8],
        ["Elbasani", "ELB", 45, "#0B3D91", 12800, 0.15, 0.5],
        ["Teuta", "TEU", 43, "#5E2D79", 12040, 0.1, 0.4],
        ["Flamurtari", "FLA", 42, "#1A1A1A", 5600, 0.3, 0.3],
        ["Bylis", "BYL", 41, "#1E5AA8", 2464, 0.35, 0.3],
        ["Vora", "VOR", 40, "#F57C00", 1500, 0.3, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "KOS",
  name: "Kosovo",
  flag: "🇽🇰",
  cup: { name: "Kosovar Cup", short: "Cup", divisions: ["KOS1"] },
  divisions: [
    {
      id: "KOS1", name: "Superliga e Kosovës", short: "Superliga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.3, ops: 0.6, ticket: 4, owner: [0.1, 2], wageRatio: 0.7, budget: 0.5 },
      teams: [
        ["Ballkani", "BAL", 50, "#F57C00", 1500, 0.8, 1.0],
        ["Drita", "DRI", 49, "#1E8E3E", 1500, 0.8, 0.8],
        ["Prishtina", "PRI", 46, "#0057B8", 13000, 0.15, 0.6],
        ["Llapi", "LLA", 44, "#D50000", 8000, 0.2, 0.35],
        ["Malisheva", "MAL", 43, "#1565C0", 2000, 0.4, 0.3],
        ["Gjilani", "GJI", 43, "#1A1A1A", 1500, 0.5, 0.3],
        ["Dukagjini", "DUK", 42, "#1E5AA8", 3000, 0.3, 0.25],
        ["Ferizaj", "FER", 42, "#0B3D91", 3000, 0.3, 0.25],
        ["Drenica", "DRE", 40, "#C8102E", 3000, 0.25, 0.15],
        ["Prishtina e Re", "PRE", 40, "#1976D2", 2500, 0.15, 0.15],
      ],
    },
  ],
});

addCountry({
  id: "MLT",
  name: "Malta",
  flag: "🇲🇹",
  cup: { name: "Maltese FA Trophy", short: "FA Trophy", divisions: ["MLT1"] },
  divisions: [
    {
      // Real format: opening and closing rounds (single round robin + top/bottom-six split each);
      // approximated as a double round robin followed by a double round robin split.
      id: "MLT1", name: "Maltese Premier League", short: "Premier League", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Top six", size: 6, rr: 2, carry: "full" },
            { name: "Bottom six", size: 6, rr: 2, carry: "full" },
          ],
        },
      },
      money: { tv: 0.2, ops: 0.5, ticket: 5, owner: [0.1, 1.5], wageRatio: 0.7, budget: 0.4 },
      teams: [
        ["Hamrun Spartans", "HAM", 46, "#C8102E", 16997, 0.08, 1.2],
        ["Hibernians", "HIB", 42, "#1E8E3E", 2968, 0.25, 0.6],
        ["Floriana", "FLO", 41, "#1E8E3E", 16997, 0.06, 0.7],
        ["Birkirkara", "BIR", 41, "#C8102E", 16997, 0.05, 0.6],
        ["Valletta", "VAL", 40, "#FFFFFF", 16997, 0.06, 0.6],
        ["Sliema Wanderers", "SLI", 39, "#64B5F6", 16997, 0.05, 0.5],
        ["Marsaxlokk", "MXK", 39, "#1A1A1A", 3000, 0.15, 0.35],
        ["Gżira United", "GZI", 39, "#E53935", 3000, 0.15, 0.4],
        ["Mosta", "MOS", 37, "#D50000", 3000, 0.12, 0.3],
        ["Naxxar Lions", "NAX", 37, "#C8102E", 3000, 0.1, 0.25],
        ["Żabbar St. Patrick", "ZAB", 36, "#1E8E3E", 3000, 0.1, 0.2],
        ["Tarxien Rainbows", "TAR", 35, "#F9A825", 3000, 0.1, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "LUX",
  name: "Luxembourg",
  flag: "🇱🇺",
  cup: { name: "Luxembourg Cup", short: "Cup", divisions: ["LUX1"] },
  divisions: [
    {
      id: "LUX1", name: "Luxembourg National Division", short: "BGL Ligue", tier: 1,
      format: { rr: 2 },
      money: { tv: 0.2, ops: 0.5, ticket: 5, owner: [0.1, 1.5], wageRatio: 0.7, budget: 0.4 },
      teams: [
        ["Differdange 03", "DIF", 45, "#D50000", 3500, 0.2, 1.0],
        ["F91 Dudelange", "DUD", 44, "#C8102E", 2558, 0.25, 0.9],
        ["Atert Bissen", "ATE", 42, "#1E5AA8", 1500, 0.25, 0.5],
        ["Progrès Niederkorn", "PRO", 42, "#1A1A1A", 2800, 0.25, 0.6],
        ["Swift Hesperange", "SWI", 41, "#0D47A1", 3058, 0.15, 0.7],
        ["Racing FC Union Luxembourg", "RAC", 40, "#1565C0", 5814, 0.08, 0.5],
        ["US Hostert", "HOS", 38, "#2E7D32", 1500, 0.15, 0.3],
        ["Jeunesse Esch", "JEU", 38, "#1A1A1A", 4000, 0.2, 0.4],
        ["UNA Strassen", "STR", 38, "#1E88E5", 2500, 0.1, 0.35],
        ["US Mondorf-les-Bains", "MON", 37, "#F9A825", 3600, 0.08, 0.3],
        ["Victoria Rosport", "ROS", 36, "#1E5AA8", 2500, 0.1, 0.25],
        ["UN Käerjéng 97", "KAE", 35, "#C8102E", 2500, 0.1, 0.2],
        ["Jeunesse Canach", "CAN", 34, "#1E8E3E", 1000, 0.2, 0.15],
        ["Mamer 32", "MAM", 34, "#0D47A1", 2600, 0.08, 0.15],
        ["Rodange 91", "ROD", 33, "#D50000", 3400, 0.08, 0.15],
        ["Union Titus Pétange", "PET", 33, "#1A1A1A", 2400, 0.1, 0.15],
      ],
    },
  ],
});

addCountry({
  id: "GIB",
  name: "Gibraltar",
  flag: "🇬🇮",
  cup: { name: "Rock Cup", short: "Rock Cup", divisions: ["GIB1"] },
  divisions: [
    {
      // All games at Europa Sports Park while Victoria Stadium is rebuilt.
      id: "GIB1", name: "Gibraltar Football League", short: "GFL", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship group", size: 6, rr: 1, carry: "full" },
            { name: "Remaining clubs", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 0.05, ops: 0.15, ticket: 3, owner: [0.02, 0.5], wageRatio: 0.7, budget: 0.1 },
      teams: [
        ["Lincoln Red Imps", "LRI", 45, "#C8102E", 2000, 0.2, 0.6],
        ["St Joseph's", "STJ", 38, "#1E5AA8", 2000, 0.06, 0.15],
        ["Europa", "EUR", 37, "#1A1A1A", 2000, 0.06, 0.15],
        ["Mons Calpe", "MCA", 36, "#1E88E5", 2000, 0.05, 0.12],
        ["Lions Gibraltar", "LIO", 33, "#F9A825", 2000, 0.05, 0.08],
        ["Lynx", "LYN", 32, "#1A1A1A", 2000, 0.05, 0.06],
        ["FC Magpies", "MAG", 32, "#FFFFFF", 2000, 0.05, 0.06],
        ["Europa Point", "EPT", 30, "#D50000", 2000, 0.05, 0.05],
        ["College 1975", "COL", 30, "#0D47A1", 2000, 0.05, 0.05],
        ["Glacis United", "GLA", 29, "#1E5AA8", 2000, 0.05, 0.05],
        ["Hound Dogs", "HOU", 28, "#C8102E", 2000, 0.05, 0.04],
        ["Manchester 62", "MAN", 28, "#C8102E", 2000, 0.05, 0.04],
      ],
    },
  ],
});

addCountry({
  id: "AND",
  name: "Andorra",
  flag: "🇦🇩",
  cup: { name: "Copa Constitució", short: "Copa", divisions: ["AND1"] },
  divisions: [
    {
      // Ten clubs started 2025/26; Pas de la Casa were expelled in November 2025, leaving nine.
      id: "AND1", name: "Primera Divisió", short: "Primera Divisió", tier: 1,
      format: { rr: 3 },
      money: { tv: 0.05, ops: 0.15, ticket: 3, owner: [0.02, 0.5], wageRatio: 0.7, budget: 0.1 },
      teams: [
        ["Inter Club d'Escaldes", "INT", 38, "#1E5AA8", 1000, 0.15, 0.3],
        ["Atlètic Club d'Escaldes", "ATL", 36, "#C8102E", 1000, 0.12, 0.2],
        ["FC Santa Coloma", "FSC", 34, "#C8102E", 1000, 0.12, 0.15],
        ["Penya Encarnada", "PEN", 33, "#D50000", 1000, 0.1, 0.1],
        ["FC Ordino", "ORD", 32, "#1A1A1A", 1000, 0.08, 0.15],
        ["FC Rànger's", "RAN", 30, "#1E5AA8", 1000, 0.06, 0.05],
        ["UE Santa Coloma", "USC", 30, "#1565C0", 1000, 0.08, 0.08],
        ["Esperança d'Andorra", "ESP", 29, "#1E8E3E", 1000, 0.06, 0.05],
        ["CE Carroi", "CAR", 28, "#F9A825", 1000, 0.05, 0.04],
      ],
    },
  ],
});

addCountry({
  id: "SMR",
  name: "San Marino",
  flag: "🇸🇲",
  cup: { name: "Coppa Titano", short: "Coppa", divisions: ["SMR1"] },
  divisions: [
    {
      // Real format adds a 2nd–11th Conference League play-off after the league phase.
      id: "SMR1", name: "Campionato Sammarinese", short: "Campionato", tier: 1,
      format: { rr: 2 },
      money: { tv: 0.05, ops: 0.12, ticket: 3, owner: [0.02, 0.4], wageRatio: 0.7, budget: 0.08 },
      teams: [
        ["Virtus", "VIR", 35, "#F9A825", 700, 0.1, 0.12],
        ["Tre Penne", "TPE", 35, "#1E5AA8", 700, 0.1, 0.12],
        ["Tre Fiori", "TFI", 34, "#F9A825", 700, 0.1, 0.1],
        ["La Fiorita", "FIO", 34, "#7B1FA2", 700, 0.1, 0.1],
        ["Folgore", "FOL", 31, "#1E88E5", 700, 0.08, 0.06],
        ["Domagnano", "DOM", 30, "#C8102E", 700, 0.08, 0.05],
        ["Fiorentino", "FRN", 29, "#7B1FA2", 700, 0.08, 0.05],
        ["Cosmos", "COS", 28, "#1E5AA8", 700, 0.07, 0.04],
        ["Juvenes/Dogana", "JUV", 28, "#1A1A1A", 700, 0.07, 0.04],
        ["Libertas", "LIB", 28, "#C8102E", 700, 0.07, 0.04],
        ["San Marino Academy U22", "ACA", 27, "#64B5F6", 4801, 0.05, 0.03],
        ["Pennarossa", "PNR", 27, "#C8102E", 700, 0.06, 0.03],
        ["San Giovanni", "SGI", 26, "#1E8E3E", 700, 0.06, 0.03],
        ["Faetano", "FAE", 26, "#1565C0", 700, 0.06, 0.03],
        ["Cailungo", "CAI", 25, "#1E5AA8", 700, 0.06, 0.03],
        ["Murata", "MUR", 25, "#1A1A1A", 700, 0.06, 0.03],
      ],
    },
  ],
});

addCountry({
  id: "LIE",
  name: "Liechtenstein",
  flag: "🇱🇮",
  cup: { name: "Liechtenstein Cup", short: "Cup", divisions: [] },
  divisions: [],
  // Liechtenstein clubs play in the Swiss pyramid; first teams only.
  cupTeams: [
    ["FC Vaduz", "VAD", 52, "#C8102E", 7584, 0.25, 1.5],
    ["USV Eschen/Mauren", "ESC", 32, "#1E5AA8", 6000, 0.05, 0.2],
    ["FC Balzers", "BAL", 29, "#C8102E", 2000, 0.1, 0.1],
    ["FC Ruggell", "RUG", 27, "#1E5AA8", 1000, 0.1, 0.05],
    ["FC Schaan", "SCH", 27, "#C8102E", 1500, 0.08, 0.05],
    ["FC Triesen", "TRI", 25, "#1E8E3E", 1000, 0.08, 0.04],
    ["FC Triesenberg", "TRB", 25, "#1A1A1A", 800, 0.08, 0.03],
  ],
});

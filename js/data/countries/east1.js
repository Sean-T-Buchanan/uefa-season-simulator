// Top flights: Scotland, Turkey, Greece, Cyprus, Israel, Russia, Ukraine, Belarus,
// Kazakhstan, Azerbaijan, Armenia, Georgia, Moldova.
// Line-ups: 2025/26 seasons (calendar-year leagues: 2025).
// [name, code, rating, colour, capacity, demand, commercial]

addCountry({
  id: "SCO",
  name: "Scotland",
  flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  cup: { name: "Scottish Cup", short: "Cup", divisions: ["SCO1"] },
  divisions: [
    {
      id: "SCO1", name: "Scottish Premiership", short: "Premiership", tier: 1,
      format: {
        rr: 3,
        split: {
          groups: [
            { name: "Top six", size: 6, rr: 1, carry: "full" },
            { name: "Bottom six", size: 6, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 3, ops: 4, ticket: 25, owner: [0, 5], wageRatio: 0.65, budget: 4 },
      teams: [
        ["Celtic", "CEL", 72, "#018749", 60411, 0.98, 45],
        ["Rangers", "RAN", 70, "#1B458F", 50817, 0.97, 40],
        ["Heart of Midlothian", "HEA", 62, "#8B1E3F", 19852, 0.92, 8],
        ["Aberdeen", "ABE", 60, "#C8102E", 20866, 0.8, 7],
        ["Hibernian", "HIB", 60, "#006B3F", 20421, 0.85, 6],
        ["Motherwell", "MOT", 58, "#FDB913", 13677, 0.6, 2],
        ["Dundee United", "DDU", 58, "#F47920", 14223, 0.7, 2.5],
        ["St Mirren", "STM", 57, "#000000", 7937, 0.75, 2],
        ["Kilmarnock", "KIL", 56, "#1F3F94", 15003, 0.4, 2],
        ["Falkirk", "FAL", 56, "#002B5C", 8750, 0.85, 1.5],
        ["Dundee", "DUN", 55, "#00205B", 11775, 0.6, 2],
        ["Livingston", "LIV", 54, "#FFD100", 9713, 0.4, 1.5],
      ],
    },
  ],
});

addCountry({
  id: "TUR",
  name: "Turkey",
  flag: "🇹🇷",
  cup: { name: "Turkish Cup", short: "Cup", divisions: ["TUR1"] },
  divisions: [
    {
      id: "TUR1", name: "Süper Lig", short: "Süper Lig", tier: 1,
      format: { rr: 2 },
      money: { tv: 10, ops: 10, ticket: 12, owner: [0, 15], wageRatio: 0.8, budget: 10 },
      teams: [
        ["Galatasaray", "GAL", 77, "#A90432", 53978, 0.9, 70],
        ["Fenerbahçe", "FEN", 76, "#FFED00", 47430, 0.85, 65],
        ["Beşiktaş", "BES", 72, "#000000", 42445, 0.8, 45],
        ["Trabzonspor", "TRA", 70, "#6D0E2B", 40980, 0.6, 25],
        ["Başakşehir", "BAS", 68, "#F26522", 17067, 0.15, 8],
        ["Samsunspor", "SAM", 67, "#E30613", 33303, 0.45, 8],
        ["Göztepe", "GOZ", 66, "#FFD200", 20756, 0.6, 6],
        ["Konyaspor", "KON", 64, "#00843D", 41600, 0.3, 5],
        ["Alanyaspor", "ALA", 64, "#F7941D", 9789, 0.3, 4],
        ["Eyüpspor", "EYU", 63, "#5C2D91", 13797, 0.2, 4],
        ["Kasımpaşa", "KAS", 63, "#1E3F8A", 13797, 0.15, 4],
        ["Gaziantep", "GAZ", 63, "#D7182A", 30320, 0.2, 4],
        ["Rizespor", "RIZ", 63, "#008D47", 14850, 0.4, 4],
        ["Antalyaspor", "ANT", 62, "#E2001A", 29307, 0.2, 5],
        ["Kayserispor", "KAY", 62, "#FFD700", 32856, 0.2, 4],
        ["Gençlerbirliği", "GEN", 61, "#C8102E", 20000, 0.35, 4],
        ["Kocaelispor", "KOC", 61, "#007A3D", 34829, 0.55, 4],
        ["Fatih Karagümrük", "FKG", 60, "#E30613", 77563, 0.06, 3],
      ],
    },
  ],
});

addCountry({
  id: "GRE",
  name: "Greece",
  flag: "🇬🇷",
  cup: { name: "Greek Cup", short: "Cup", divisions: ["GRE1"] },
  divisions: [
    {
      id: "GRE1", name: "Super League Greece", short: "Super League", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship play-offs", size: 4, rr: 2, carry: "full" },
            { name: "Europe play-offs", size: 4, rr: 2, carry: "half" },
            { name: "Relegation play-outs", size: 6, rr: 2, carry: "full" },
          ],
        },
      },
      money: { tv: 4, ops: 5, ticket: 10, owner: [0, 10], wageRatio: 0.75, budget: 4 },
      teams: [
        ["Olympiacos", "OLY", 75, "#E30613", 33334, 0.75, 25],
        ["PAOK", "PAO", 73, "#000000", 28703, 0.8, 20],
        ["AEK Athens", "AEK", 72, "#FFD700", 32500, 0.8, 18],
        ["Panathinaikos", "PAN", 71, "#00843D", 16003, 0.8, 18],
        ["Aris", "ARI", 64, "#FFDE00", 22800, 0.45, 5],
        ["OFI", "OFI", 62, "#000000", 26240, 0.25, 2.5],
        ["Levadiakos", "LEV", 60, "#00843D", 5915, 0.4, 1],
        ["Asteras Tripolis", "AST", 60, "#FFD700", 7423, 0.3, 1.5],
        ["Atromitos", "ATR", 60, "#1E90FF", 9050, 0.25, 1.5],
        ["Panetolikos", "PNT", 59, "#FFD700", 7321, 0.4, 1.2],
        ["Volos", "VOL", 59, "#1E3F8A", 22700, 0.1, 1.5],
        ["Kifisia", "KIF", 57, "#1C3F94", 5500, 0.2, 1],
        ["AEL", "AEL", 56, "#8B1E3F", 16118, 0.5, 1.5],
        ["Panserraikos", "SER", 56, "#C8102E", 9500, 0.4, 1],
      ],
    },
  ],
});

addCountry({
  id: "CYP",
  name: "Cyprus",
  flag: "🇨🇾",
  cup: { name: "Cypriot Cup", short: "Cup", divisions: ["CYP1"] },
  divisions: [
    {
      id: "CYP1", name: "Cypriot First Division", short: "First Division", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship round", size: 6, rr: 2, carry: "full" },
            { name: "Relegation round", size: 8, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 1.5, ops: 2.5, ticket: 8, owner: [0.5, 6], wageRatio: 0.8, budget: 2.5 },
      teams: [
        ["Pafos", "PAF", 64, "#1E4D9C", 9394, 0.3, 5],
        ["Omonia", "OMO", 63, "#00843D", 22859, 0.35, 6],
        ["APOEL", "APO", 62, "#FFD200", 22859, 0.25, 6],
        ["AEK Larnaca", "AEK", 61, "#00843D", 7400, 0.6, 4],
        ["Aris Limassol", "ARI", 60, "#00843D", 10700, 0.3, 4],
        ["Apollon Limassol", "APL", 57, "#1E90FF", 10700, 0.4, 3],
        ["Anorthosis Famagusta", "ANO", 56, "#1E3F8A", 10230, 0.4, 3],
        ["AEL Limassol", "AEL", 55, "#FFD200", 10700, 0.35, 2.5],
        ["Enosis Neon Paralimni", "ENP", 52, "#C8102E", 5800, 0.3, 1],
        ["Ethnikos Achna", "ACH", 52, "#00843D", 7000, 0.2, 1],
        ["Omonia Aradippou", "OAR", 51, "#00843D", 10230, 0.1, 0.6],
        ["Krasava ENY Ypsonas", "KRA", 51, "#D4AF37", 5500, 0.15, 0.6],
        ["Olympiakos Nicosia", "OLN", 51, "#000000", 22859, 0.06, 0.8],
        ["Akritas Chlorakas", "AKR", 50, "#1E3F8A", 9394, 0.1, 0.5],
      ],
    },
  ],
});

addCountry({
  id: "ISR",
  name: "Israel",
  flag: "🇮🇱",
  cup: { name: "Israel State Cup", short: "State Cup", divisions: ["ISR1"] },
  divisions: [
    {
      id: "ISR1", name: "Israeli Premier League", short: "Ligat Ha'Al", tier: 1,
      format: {
        rr: 2,
        split: {
          groups: [
            { name: "Championship round", size: 6, rr: 2, carry: "full" },
            { name: "Relegation round", size: 8, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 2, ops: 3, ticket: 8, owner: [0.5, 6], wageRatio: 0.75, budget: 3 },
      teams: [
        ["Maccabi Tel Aviv", "MTA", 66, "#FFD200", 29400, 0.8, 10],
        ["Hapoel Be'er Sheva", "HBS", 65, "#C8102E", 16126, 0.85, 7],
        ["Maccabi Haifa", "MHA", 63, "#00843D", 30950, 0.7, 9],
        ["Beitar Jerusalem", "BEI", 63, "#FFD200", 31733, 0.5, 6],
        ["Hapoel Tel Aviv", "HTA", 59, "#C8102E", 29400, 0.8, 5],
        ["Hapoel Haifa", "HHA", 57, "#C8102E", 30950, 0.25, 2],
        ["Maccabi Netanya", "NET", 56, "#FFD200", 13610, 0.45, 2],
        ["Hapoel Jerusalem", "HJE", 55, "#C8102E", 31733, 0.2, 1.5],
        ["Hapoel Petah Tikva", "HPT", 55, "#1E3F8A", 11500, 0.4, 1.2],
        ["Ironi Kiryat Shmona", "IKS", 53, "#1E90FF", 13610, 0.1, 1],
        ["Bnei Sakhnin", "SAK", 52, "#C8102E", 8500, 0.5, 1],
        ["Ironi Tiberias", "TIB", 51, "#1E90FF", 5200, 0.3, 0.8],
        ["Maccabi Bnei Reineh", "REI", 51, "#FFD200", 5200, 0.2, 0.8],
        ["F.C. Ashdod", "ASH", 50, "#C8102E", 7800, 0.3, 0.8],
      ],
    },
  ],
});

addCountry({
  id: "RUS",
  name: "Russia",
  flag: "🇷🇺",
  cup: { name: "Russian Cup", short: "Cup", divisions: ["RUS1"] },
  divisions: [
    {
      id: "RUS1", name: "Russian Premier League", short: "RPL", tier: 1,
      format: { rr: 2 },
      money: { tv: 4, ops: 8, ticket: 8, owner: [2, 30], wageRatio: 0.75, budget: 12 },
      teams: [
        ["Zenit", "ZEN", 74, "#0099D8", 60177, 0.6, 60],
        ["Krasnodar", "KRA", 73, "#00843D", 33395, 0.6, 25],
        ["Spartak Moscow", "SPA", 70, "#E30613", 44897, 0.5, 35],
        ["CSKA Moscow", "CSK", 70, "#C8102E", 29071, 0.6, 25],
        ["Lokomotiv Moscow", "LOK", 69, "#E30613", 27084, 0.4, 20],
        ["Dynamo Moscow", "DYN", 68, "#0055A4", 25716, 0.35, 20],
        ["Rubin Kazan", "RUB", 64, "#8B1E3F", 43284, 0.3, 8],
        ["Rostov", "ROS", 64, "#FFD200", 45415, 0.4, 6],
        ["Baltika Kaliningrad", "BAL", 63, "#1E3F8A", 33399, 0.4, 5],
        ["Akhmat Grozny", "AKH", 62, "#00843D", 30000, 0.3, 8],
        ["Krylia Sovetov", "KRY", 62, "#1E3F8A", 42389, 0.35, 5],
        ["Dynamo Makhachkala", "DMK", 61, "#0055A4", 26364, 0.4, 5],
        ["Akron Tolyatti", "AKR", 61, "#00205B", 42389, 0.1, 4],
        ["Orenburg", "ORE", 60, "#1E90FF", 10046, 0.5, 3],
        ["Pari Nizhny Novgorod", "PNN", 60, "#00205B", 42532, 0.2, 4],
        ["Sochi", "SOC", 60, "#1E90FF", 45994, 0.25, 4],
      ],
    },
  ],
});

addCountry({
  id: "UKR",
  name: "Ukraine",
  flag: "🇺🇦",
  cup: { name: "Ukrainian Cup", short: "Cup", divisions: ["UKR1"] },
  divisions: [
    {
      id: "UKR1", name: "Ukrainian Premier League", short: "UPL", tier: 1,
      format: { rr: 2 },
      money: { tv: 1, ops: 2, ticket: 4, owner: [0.5, 10], wageRatio: 0.8, budget: 2.5 },
      teams: [
        ["Shakhtar Donetsk", "SHA", 73, "#F47920", 34725, 0.15, 20],
        ["Dynamo Kyiv", "DYN", 70, "#FFFFFF", 16873, 0.3, 15],
        ["Polissya Zhytomyr", "POL", 61, "#00843D", 5928, 0.5, 3],
        ["LNZ Cherkasy", "LNZ", 59, "#FFFFFF", 10321, 0.3, 1.5],
        ["Kryvbas Kryvyi Rih", "KRY", 58, "#C8102E", 3219, 0.6, 1.5],
        ["Karpaty Lviv", "KAR", 58, "#00843D", 28051, 0.25, 1.5],
        ["Oleksandriya", "OLE", 57, "#FFD200", 7000, 0.3, 1],
        ["Zorya Luhansk", "ZOR", 57, "#000000", 16873, 0.05, 1.5],
        ["Kolos Kovalivka", "KOL", 56, "#FFD200", 5050, 0.2, 1],
        ["Veres Rivne", "VER", 55, "#00843D", 7122, 0.5, 0.8],
        ["Rukh Lviv", "RUK", 55, "#FFD200", 3742, 0.4, 1],
        ["Metalist 1925 Kharkiv", "MET", 55, "#FFD200", 5928, 0.15, 1],
        ["Obolon Kyiv", "OBO", 54, "#1E3F8A", 5103, 0.3, 0.8],
        ["Epitsentr Kamianets-Podilskyi", "EPI", 53, "#1E3F8A", 15150, 0.1, 1],
        ["Kudrivka", "KUD", 53, "#00843D", 5103, 0.1, 0.6],
        ["Poltava", "PLT", 52, "#C8102E", 13305, 0.08, 0.5],
      ],
    },
  ],
});

addCountry({
  id: "BLR",
  name: "Belarus",
  flag: "🇧🇾",
  cup: { name: "Belarusian Cup", short: "Cup", divisions: ["BLR1"] },
  divisions: [
    {
      id: "BLR1", name: "Belarusian Premier League", short: "Vysheyshaya Liga", tier: 1,
      format: { rr: 2 },
      money: { tv: 0.2, ops: 0.5, ticket: 3, owner: [0.1, 2], wageRatio: 0.8, budget: 0.6 },
      teams: [
        ["Dinamo Minsk", "DMI", 57, "#1E90FF", 22246, 0.2, 2],
        ["BATE Borisov", "BAT", 56, "#FFD200", 13126, 0.2, 2],
        ["Neman Grodno", "NEM", 53, "#00843D", 8479, 0.35, 1],
        ["ML Vitebsk", "MLV", 52, "#1E3F8A", 8144, 0.3, 1],
        ["Torpedo-BelAZ Zhodino", "TOR", 51, "#00843D", 6524, 0.3, 1],
        ["Slavia Mozyr", "SLA", 50, "#C8102E", 5300, 0.3, 0.6],
        ["Dinamo Brest", "DBR", 50, "#1E90FF", 10037, 0.25, 0.8],
        ["Isloch Minsk Raion", "ISL", 49, "#1E3F8A", 3050, 0.2, 0.5],
        ["Minsk", "MIN", 48, "#C8102E", 3050, 0.3, 0.5],
        ["Gomel", "GOM", 48, "#00843D", 14307, 0.15, 0.6],
        ["Arsenal Dzerzhinsk", "ARS", 46, "#C8102E", 1000, 0.4, 0.3],
        ["Vitebsk", "VIT", 45, "#1E3F8A", 8144, 0.15, 0.4],
        ["Naftan Novopolotsk", "NAF", 44, "#1E3F8A", 4522, 0.3, 0.3],
        ["Smorgon", "SMO", 41, "#C8102E", 3200, 0.2, 0.2],
        ["Slutsk", "SLU", 42, "#1E3F8A", 1896, 0.4, 0.2],
        ["Molodechno", "MOL", 40, "#C8102E", 4560, 0.15, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "KAZ",
  name: "Kazakhstan",
  flag: "🇰🇿",
  cup: { name: "Kazakhstan Cup", short: "Cup", divisions: ["KAZ1"] },
  divisions: [
    {
      id: "KAZ1", name: "Kazakhstan Premier League", short: "Premier League", tier: 1,
      format: { rr: 2 },
      money: { tv: 0.5, ops: 1, ticket: 3, owner: [0.5, 4], wageRatio: 0.8, budget: 1.5 },
      teams: [
        ["Kairat Almaty", "KAI", 61, "#FFD200", 23804, 0.6, 4],
        ["Astana", "AST", 60, "#00A3E0", 30200, 0.2, 5],
        ["Tobol", "TOB", 55, "#00843D", 9500, 0.5, 2],
        ["Aktobe", "AKT", 55, "#C8102E", 12729, 0.6, 2],
        ["Ordabasy", "ORD", 54, "#1E3F8A", 20000, 0.4, 2],
        ["Elimai", "ELI", 54, "#1E90FF", 8000, 0.7, 1.5],
        ["Kaisar", "KSR", 50, "#C8102E", 7500, 0.5, 0.8],
        ["Zhenis", "ZHE", 50, "#1E3F8A", 30200, 0.05, 0.8],
        ["Kyzylzhar", "KYZ", 49, "#C8102E", 11000, 0.4, 0.8],
        ["Atyrau", "ATY", 49, "#FFD200", 8900, 0.4, 0.8],
        ["Okzhetpes", "OKZ", 47, "#00843D", 4100, 0.5, 0.5],
        ["Ulytau", "ULY", 46, "#1E3F8A", 2500, 0.5, 0.5],
        ["Zhetysu", "ZHT", 45, "#FFD200", 4000, 0.4, 0.4],
        ["Turan", "TUR", 45, "#1E90FF", 7000, 0.5, 0.4],
      ],
    },
  ],
});

addCountry({
  id: "AZE",
  name: "Azerbaijan",
  flag: "🇦🇿",
  cup: { name: "Azerbaijan Cup", short: "Cup", divisions: ["AZE1"] },
  divisions: [
    {
      id: "AZE1", name: "Azerbaijan Premier League", short: "Premier League", tier: 1,
      format: { rr: 3 },
      money: { tv: 0.5, ops: 0.8, ticket: 3, owner: [0.2, 3], wageRatio: 0.8, budget: 1 },
      teams: [
        ["Qarabağ", "QAR", 67, "#000000", 31200, 0.3, 8],
        ["Sabah", "SAB", 57, "#1E3F8A", 8969, 0.25, 2],
        ["Zira", "ZIR", 55, "#FFFFFF", 1256, 0.5, 1],
        ["Neftçi", "NEF", 54, "#000000", 10289, 0.4, 2],
        ["Turan Tovuz", "TUR", 53, "#C8102E", 6500, 0.4, 0.8],
        ["Araz-Naxçıvan", "ARA", 53, "#1E3F8A", 6502, 0.2, 1],
        ["Sumgayit", "SUM", 50, "#C8102E", 9502, 0.15, 0.6],
        ["Gabala", "GAB", 49, "#C8102E", 3748, 0.3, 0.6],
        ["Kapaz", "KAP", 48, "#1E3F8A", 15343, 0.15, 0.5],
        ["Shamakhi", "SHA", 47, "#1E90FF", 2176, 0.3, 0.4],
        ["Imishli", "IMI", 45, "#FFD200", 8500, 0.1, 0.3],
        ["Karvan", "KRV", 45, "#C8102E", 6000, 0.15, 0.3],
      ],
    },
  ],
});

addCountry({
  id: "ARM",
  name: "Armenia",
  flag: "🇦🇲",
  cup: { name: "Armenian Cup", short: "Cup", divisions: ["ARM1"] },
  divisions: [
    {
      id: "ARM1", name: "Armenian Premier League", short: "Premier League", tier: 1,
      format: { rr: 3 },
      money: { tv: 0.2, ops: 0.4, ticket: 3, owner: [0.1, 2], wageRatio: 0.8, budget: 0.5 },
      teams: [
        ["Noah", "NOA", 54, "#000000", 3100, 0.3, 1.5],
        ["Ararat-Armenia", "AAR", 53, "#FFD200", 1428, 0.4, 1],
        ["Pyunik", "PYU", 52, "#1E3F8A", 1000, 0.5, 1],
        ["Urartu", "URA", 50, "#FFD200", 4860, 0.15, 0.6],
        ["Alashkert", "ALA", 48, "#FFD200", 3100, 0.2, 0.5],
        ["Ararat Yerevan", "ARY", 46, "#C8102E", 14403, 0.05, 0.4],
        ["Van", "VAN", 44, "#1E90FF", 5000, 0.1, 0.2],
        ["Shirak", "SHI", 43, "#000000", 4000, 0.3, 0.2],
        ["BKMA Yerevan", "BKM", 42, "#C8102E", 1000, 0.2, 0.2],
        ["Gandzasar Kapan", "GAN", 41, "#1E3F8A", 1000, 0.2, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "GEO",
  name: "Georgia",
  flag: "🇬🇪",
  cup: { name: "Georgian Cup", short: "Cup", divisions: ["GEO1"] },
  divisions: [
    {
      id: "GEO1", name: "Erovnuli Liga", short: "Erovnuli Liga", tier: 1,
      format: { rr: 4 },
      money: { tv: 0.3, ops: 0.4, ticket: 3, owner: [0.1, 1.5], wageRatio: 0.8, budget: 0.4 },
      teams: [
        ["Dinamo Tbilisi", "DTB", 54, "#1E90FF", 54549, 0.05, 1.5],
        ["Iberia 1999", "IBE", 53, "#C8102E", 22754, 0.05, 1],
        ["Dinamo Batumi", "DBA", 52, "#1E3F8A", 20000, 0.1, 1],
        ["Torpedo Kutaisi", "TOR", 51, "#000000", 19400, 0.1, 0.6],
        ["Dila Gori", "DIL", 51, "#1E90FF", 5000, 0.3, 0.5],
        ["Samgurali Tskaltubo", "SAM", 47, "#FFD200", 300, 0.8, 0.2],
        ["Gagra", "GAG", 46, "#1E90FF", 2130, 0.2, 0.2],
        ["Kolkheti-1913 Poti", "KOL", 44, "#C8102E", 1000, 0.3, 0.2],
        ["Telavi", "TEL", 43, "#C8102E", 1000, 0.4, 0.2],
        ["Gareji Sagarejo", "GAR", 42, "#00843D", 2000, 0.3, 0.2],
      ],
    },
  ],
});

addCountry({
  id: "MDA",
  name: "Moldova",
  flag: "🇲🇩",
  cup: { name: "Moldovan Cup", short: "Cup", divisions: ["MDA1"] },
  divisions: [
    {
      id: "MDA1", name: "Moldovan Super Liga", short: "Super Liga", tier: 1,
      format: {
        rr: 3,
        split: {
          groups: [
            { name: "Championship round", size: 6, rr: 2, carry: "half" },
            { name: "Relegation group", size: 2, rr: 1, carry: "full" },
          ],
        },
      },
      money: { tv: 0.1, ops: 0.3, ticket: 3, owner: [0.1, 2], wageRatio: 0.8, budget: 0.3 },
      teams: [
        ["Sheriff Tiraspol", "SHE", 58, "#FFD200", 9181, 0.15, 2],
        ["Petrocub Hîncești", "PET", 52, "#1E3F8A", 1633, 0.4, 0.5],
        ["Milsami Orhei", "MIL", 50, "#C8102E", 3000, 0.3, 0.4],
        ["Zimbru Chișinău", "ZIM", 49, "#FFD200", 10104, 0.1, 0.4],
        ["Bălți", "BAL", 46, "#C8102E", 5200, 0.2, 0.2],
        ["Dacia Buiucani", "DAC", 44, "#1E90FF", 5200, 0.1, 0.2],
        ["Spartanii Sportul", "SPA", 41, "#C8102E", 350, 0.5, 0.1],
        ["Politehnica UTM", "UTM", 40, "#1E3F8A", 350, 0.5, 0.1],
      ],
    },
  ],
});

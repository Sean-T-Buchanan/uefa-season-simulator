// Named rivalries. Each entry: { name, clubs: [id, id], heat }.
//   heat: 1 = local/regional rivalry, 2 = major derby, 3 = one of the fiercest in Europe.
// Club ids: English clubs use their bare code (e.g. "ARS"); everyone else is COUNTRY_CODE (e.g. "ESP_RMA").
const DERBIES = [
  // England
  { name: "North London derby", clubs: ["ARS", "TOT"], heat: 3 },
  { name: "Merseyside derby", clubs: ["LIV", "EVE"], heat: 3 },
  { name: "Manchester derby", clubs: ["MUN", "MCI"], heat: 3 },
  { name: "North West derby", clubs: ["LIV", "MUN"], heat: 3 },
  { name: "Tyne–Wear derby", clubs: ["NEW", "SUN"], heat: 3 },
  { name: "South Wales derby", clubs: ["CAR", "SWA"], heat: 3 },
  { name: "Second City derby", clubs: ["AVL", "BIR"], heat: 2 },
  { name: "Steel City derby", clubs: ["SHU", "SHW"], heat: 2 },
  { name: "South Coast derby", clubs: ["SOU", "POR"], heat: 2 },
  { name: "Dockers derby", clubs: ["WHU", "MIL"], heat: 2 },
  { name: "Black Country derby", clubs: ["WOL", "WBA"], heat: 2 },
  { name: "East Midlands derby", clubs: ["NFO", "DER"], heat: 2 },
  { name: "M23 derby", clubs: ["CRY", "BHA"], heat: 2 },
  { name: "East Anglian derby", clubs: ["NOR", "IPS"], heat: 2 },
  { name: "East Lancashire derby", clubs: ["BLB", "BUR"], heat: 2 },
  { name: "Roses rivalry", clubs: ["LEE", "MUN"], heat: 2 },
  { name: "London derby", clubs: ["CHE", "TOT"], heat: 2 },
  { name: "Bristol derby", clubs: ["BRC", "BRR"], heat: 2 },
  { name: "Potteries derby", clubs: ["STK", "POV"], heat: 2 },
  { name: "West Lancashire derby", clubs: ["PNE", "BPL"], heat: 2 },
  { name: "Beds–Herts derby", clubs: ["WAT", "LUT"], heat: 2 },
  { name: "Dons rivalry", clubs: ["WIM", "MKD"], heat: 2 },
  { name: "Devon derby", clubs: ["PLY", "EXE"], heat: 1 },

  // Spain
  { name: "El Clásico", clubs: ["ESP_RMA", "ESP_BAR"], heat: 3 },
  { name: "Madrid derby", clubs: ["ESP_RMA", "ESP_ATM"], heat: 3 },
  { name: "Seville derby", clubs: ["ESP_SEV", "ESP_BET"], heat: 3 },
  { name: "Basque derby", clubs: ["ESP_ATH", "ESP_RSO"], heat: 2 },
  { name: "Barcelona derby", clubs: ["ESP_BAR", "ESP_ESP"], heat: 2 },
  { name: "Valencia derby", clubs: ["ESP_VAL", "ESP_LEV"], heat: 2 },
  { name: "Galician derby", clubs: ["ESP_CEL", "ESP_DEP"], heat: 2 },
  { name: "Asturian derby", clubs: ["ESP_SPG", "ESP_OVI"], heat: 2 },
  { name: "Aragonese derby", clubs: ["ESP_ZAR", "ESP_HUE"], heat: 1 },

  // Italy
  { name: "Derby della Madonnina", clubs: ["ITA_INT", "ITA_MIL"], heat: 3 },
  { name: "Derby della Capitale", clubs: ["ITA_ROM", "ITA_LAZ"], heat: 3 },
  { name: "Derby d'Italia", clubs: ["ITA_INT", "ITA_JUV"], heat: 3 },
  { name: "Derby della Lanterna", clubs: ["ITA_GEN", "ITA_SAM"], heat: 3 },
  { name: "Derby della Mole", clubs: ["ITA_JUV", "ITA_TOR"], heat: 2 },
  { name: "Derby del Sole", clubs: ["ITA_NAP", "ITA_ROM"], heat: 2 },
  { name: "Derby dell'Appennino", clubs: ["ITA_BOL", "ITA_FIO"], heat: 1 },
  { name: "Derby di Puglia", clubs: ["ITA_BAR", "ITA_LEC"], heat: 1 },
  { name: "Derby toscano", clubs: ["ITA_FIO", "ITA_EMP"], heat: 1 },

  // Germany
  { name: "Der Klassiker", clubs: ["GER_FCB", "GER_BVB"], heat: 3 },
  { name: "Revierderby", clubs: ["GER_BVB", "GER_SCH"], heat: 3 },
  { name: "Nordderby", clubs: ["GER_SVW", "GER_HSV"], heat: 2 },
  { name: "Rheinderby", clubs: ["GER_KOE", "GER_BMG"], heat: 2 },
  { name: "Hamburg derby", clubs: ["GER_HSV", "GER_STP"], heat: 2 },
  { name: "Frankenderby", clubs: ["GER_FCN", "GER_SGF"], heat: 2 },
  { name: "Niedersachsen derby", clubs: ["GER_HAN", "GER_EBS"], heat: 2 },
  { name: "Baden-Württemberg derby", clubs: ["GER_VFB", "GER_KSC"], heat: 2 },
  { name: "Berlin derby", clubs: ["GER_FCU", "GER_BSC"], heat: 1 },
  { name: "Bavarian derby", clubs: ["GER_FCB", "GER_FCN"], heat: 1 },
  { name: "Rheinderby", clubs: ["GER_KOE", "GER_FOR"], heat: 1 },

  // France
  { name: "Le Classique", clubs: ["FRA_PSG", "FRA_OLM"], heat: 3 },
  { name: "Derby du Rhône", clubs: ["FRA_OLY", "FRA_ASE"], heat: 3 },
  { name: "Derby du Nord", clubs: ["FRA_LIL", "FRA_RCL"], heat: 2 },
  { name: "Choc des Olympiques", clubs: ["FRA_OLM", "FRA_OLY"], heat: 2 },
  { name: "Derby de la Côte d'Azur", clubs: ["FRA_NIC", "FRA_ASM"], heat: 2 },
  { name: "Derby breton", clubs: ["FRA_REN", "FRA_FCN"], heat: 2 },
  { name: "Derby lorrain", clubs: ["FRA_FCM", "FRA_ASN"], heat: 2 },
  { name: "Paris derby", clubs: ["FRA_PSG", "FRA_PFC"], heat: 1 },

  // Portugal
  { name: "Derby de Lisboa", clubs: ["POR_BEN", "POR_SCP"], heat: 3 },
  { name: "O Clássico", clubs: ["POR_BEN", "POR_POR"], heat: 3 },
  { name: "O Clássico", clubs: ["POR_POR", "POR_SCP"], heat: 2 },
  { name: "Minho derby", clubs: ["POR_BRA", "POR_VSC"], heat: 2 },

  // Netherlands
  { name: "De Klassieker", clubs: ["NED_AJA", "NED_FEY"], heat: 3 },
  { name: "De Topper", clubs: ["NED_AJA", "NED_PSV"], heat: 2 },
  { name: "Derby van het Noorden", clubs: ["NED_GRO", "NED_HEE"], heat: 2 },
  { name: "Twentse derby", clubs: ["NED_TWE", "NED_HER"], heat: 2 },
  { name: "IJsselderby", clubs: ["NED_GAE", "NED_PEC"], heat: 2 },
  { name: "Rotterdam derby", clubs: ["NED_FEY", "NED_SPA"], heat: 1 },

  // Belgium
  { name: "Belgian Clasico", clubs: ["BEL_AND", "BEL_STL"], heat: 2 },
  { name: "De Topper", clubs: ["BEL_CLB", "BEL_AND"], heat: 2 },
  { name: "Bruges derby", clubs: ["BEL_CLB", "BEL_CER"], heat: 2 },
  { name: "Brussels derby", clubs: ["BEL_AND", "BEL_USG"], heat: 2 },
  { name: "Walloon derby", clubs: ["BEL_STL", "BEL_CHA"], heat: 2 },
  { name: "Limburg derby", clubs: ["BEL_GNK", "BEL_STV"], heat: 1 },

  // Scotland
  { name: "Old Firm", clubs: ["SCO_CEL", "SCO_RAN"], heat: 3 },
  { name: "Edinburgh derby", clubs: ["SCO_HEA", "SCO_HIB"], heat: 2 },
  { name: "Aberdeen–Rangers rivalry", clubs: ["SCO_ABE", "SCO_RAN"], heat: 2 },
  { name: "Dundee derby", clubs: ["SCO_DUN", "SCO_DDU"], heat: 1 },
  { name: "New Firm", clubs: ["SCO_ABE", "SCO_DDU"], heat: 1 },

  // Turkey
  { name: "Intercontinental derby", clubs: ["TUR_GAL", "TUR_FEN"], heat: 3 },
  { name: "Istanbul derby", clubs: ["TUR_GAL", "TUR_BES"], heat: 2 },
  { name: "Istanbul derby", clubs: ["TUR_FEN", "TUR_BES"], heat: 2 },
  { name: "Fenerbahçe–Trabzonspor rivalry", clubs: ["TUR_FEN", "TUR_TRA"], heat: 2 },

  // Greece
  { name: "Derby of the Eternal Enemies", clubs: ["GRE_OLY", "GRE_PAN"], heat: 3 },
  { name: "Thessaloniki derby", clubs: ["GRE_PAO", "GRE_ARI"], heat: 2 },
  { name: "Athens derby", clubs: ["GRE_AEK", "GRE_PAN"], heat: 2 },
  { name: "Athens–Piraeus derby", clubs: ["GRE_OLY", "GRE_AEK"], heat: 2 },
  { name: "Olympiacos–PAOK rivalry", clubs: ["GRE_OLY", "GRE_PAO"], heat: 2 },

  // Cyprus
  { name: "Nicosia derby", clubs: ["CYP_APO", "CYP_OMO"], heat: 2 },
  { name: "Limassol derby", clubs: ["CYP_AEL", "CYP_APL"], heat: 2 },

  // Israel
  { name: "Tel Aviv derby", clubs: ["ISR_MTA", "ISR_HTA"], heat: 3 },
  { name: "Haifa derby", clubs: ["ISR_MHA", "ISR_HHA"], heat: 2 },
  { name: "Jerusalem derby", clubs: ["ISR_BEI", "ISR_HJE"], heat: 2 },

  // Russia
  { name: "Moscow derby", clubs: ["RUS_SPA", "RUS_CSK"], heat: 2 },
  { name: "Zenit–Spartak rivalry", clubs: ["RUS_ZEN", "RUS_SPA"], heat: 2 },

  // Ukraine
  { name: "Ukrainian Klasychne", clubs: ["UKR_DYN", "UKR_SHA"], heat: 3 },
  { name: "Lviv derby", clubs: ["UKR_KAR", "UKR_RUK"], heat: 1 },

  // Serbia
  { name: "Eternal derby", clubs: ["SRB_RSB", "SRB_PAR"], heat: 3 },

  // Croatia
  { name: "Eternal derby", clubs: ["CRO_DIN", "CRO_HAJ"], heat: 3 },
  { name: "Adriatic derby", clubs: ["CRO_HAJ", "CRO_RIJ"], heat: 2 },

  // Slovenia
  { name: "Eternal derby", clubs: ["SVN_OLI", "SVN_MAR"], heat: 2 },
  { name: "Styrian derby", clubs: ["SVN_MAR", "SVN_CEL"], heat: 1 },

  // Bulgaria
  { name: "Eternal derby", clubs: ["BUL_LEV", "BUL_CSK"], heat: 3 },
  { name: "Plovdiv derby", clubs: ["BUL_LPL", "BUL_BPL"], heat: 2 },

  // Romania
  { name: "Eternal derby", clubs: ["ROU_FCS", "ROU_DIN"], heat: 3 },
  { name: "Bucharest derby", clubs: ["ROU_FCS", "ROU_RAP"], heat: 2 },
  { name: "Cluj derby", clubs: ["ROU_CFR", "ROU_UCJ"], heat: 2 },

  // Hungary
  { name: "Örökrangadó", clubs: ["HUN_FTC", "HUN_UJP"], heat: 3 },
  { name: "Budapest derby", clubs: ["HUN_FTC", "HUN_MTK"], heat: 1 },

  // Czechia
  { name: "Prague derby", clubs: ["CZE_SLA", "CZE_SPA"], heat: 3 },

  // Slovakia
  { name: "Slovak derby", clubs: ["SVK_SLO", "SVK_TRN"], heat: 2 },
  { name: "East Slovak derby", clubs: ["SVK_KOS", "SVK_PRE"], heat: 1 },

  // Austria
  { name: "Vienna derby", clubs: ["AUT_RAP", "AUT_FAK"], heat: 3 },
  { name: "Graz derby", clubs: ["AUT_STU", "AUT_GAK"], heat: 2 },
  { name: "Linz derby", clubs: ["AUT_LAS", "AUT_BWL"], heat: 2 },

  // Switzerland
  { name: "Zürich derby", clubs: ["SUI_FCZ", "SUI_GCZ"], heat: 2 },
  { name: "Swiss Klassiker", clubs: ["SUI_BAS", "SUI_FCZ"], heat: 2 },

  // Denmark
  { name: "New Firm (Copenhagen derby)", clubs: ["DEN_FCK", "DEN_BIF"], heat: 3 },

  // Sweden
  { name: "Tvillingderbyt", clubs: ["SWE_AIK", "SWE_DIF"], heat: 3 },
  { name: "Stockholm derby", clubs: ["SWE_DIF", "SWE_HAM"], heat: 2 },
  { name: "Stockholm derby", clubs: ["SWE_AIK", "SWE_HAM"], heat: 2 },
  { name: "Gothenburg derby", clubs: ["SWE_IFG", "SWE_GAI"], heat: 2 },

  // Norway
  { name: "Oslo derby", clubs: ["NOR_VIF", "NOR_KFU"], heat: 1 },
  { name: "Vestlandsderby", clubs: ["NOR_VIK", "NOR_BRA"], heat: 2 },
  { name: "Northern Norway derby", clubs: ["NOR_BOD", "NOR_TIL"], heat: 1 },

  // Poland
  { name: "Legia–Lech rivalry", clubs: ["POL_LEG", "POL_LEC"], heat: 2 },
  { name: "Legia–Widzew rivalry", clubs: ["POL_LEG", "POL_WID"], heat: 2 },
  { name: "Tricity derby", clubs: ["POL_LGD", "POL_ARK"], heat: 2 },

  // Republic of Ireland
  { name: "Dublin derby", clubs: ["IRL_SHA", "IRL_BOH"], heat: 2 },
  { name: "Northside derby", clubs: ["IRL_BOH", "IRL_SHE"], heat: 1 },

  // Northern Ireland
  { name: "Big Two derby", clubs: ["NIR_LIN", "NIR_GLE"], heat: 2 },
  { name: "North Belfast derby", clubs: ["NIR_CRU", "NIR_CLI"], heat: 2 },
  { name: "Mid-Ulster derby", clubs: ["NIR_GLV", "NIR_POR"], heat: 2 },

  // Bosnia and Herzegovina
  { name: "Sarajevo derby", clubs: ["BIH_SAR", "BIH_ZEL"], heat: 3 },
  { name: "Mostar derby", clubs: ["BIH_ZRI", "BIH_VEL"], heat: 2 },

  // Montenegro, Albania, Malta
  { name: "Montenegrin derby", clubs: ["MNE_BUD", "MNE_SUT"], heat: 1 },
  { name: "Tirana derby", clubs: ["ALB_PAR", "ALB_TIR"], heat: 2 },
  { name: "Maltese derby", clubs: ["MLT_VAL", "MLT_FLO"], heat: 1 },
];

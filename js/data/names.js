// Name pools for generated (fictional) managers, by region. A manager's
// nationality picks the region; first names and surnames are combined at random.

const MANAGER_NAMES = {
  en: {
    first: ["Gary", "Steve", "Paul", "Mark", "Neil", "Darren", "Lee", "Craig", "Ian", "Alan", "Martin", "Kevin", "Stuart", "Rob", "Danny", "Chris", "Graham", "Simon", "Sean", "Ryan"],
    last: ["Hartley", "Crossland", "Pickering", "Whitlock", "Barraclough", "Fenwick", "Ashworth", "Holloway", "Marsden", "Thornton", "Bramwell", "Kettering", "Dunmore", "Haworth", "McAllister", "Sutcliffe", "Dawlish", "Ormerod", "Brennan", "Rowntree", "Gallagher", "Kinsella", "McCreadie", "Pryce"],
  },
  es: {
    first: ["Javier", "Andrés", "Sergio", "Rubén", "Óscar", "Luis", "Iñaki", "Diego", "Pablo", "Raúl", "Álvaro", "Manuel", "Jorge", "Víctor", "Íker", "Fernando"],
    last: ["Herrera", "Castaño", "Velasco", "Aranda", "Ibarra", "Montoya", "Salcedo", "Echeverría", "Lozano", "Bermejo", "Cuesta", "Gallardo", "Olmedo", "Zubiría", "Peralta", "Navas", "Quintana", "Robledo"],
  },
  pt: {
    first: ["João", "Rui", "Nuno", "Tiago", "Bruno", "Hélder", "Sérgio", "Paulo", "Ricardo", "Vítor", "Miguel", "André"],
    last: ["Carvalho", "Mourão", "Teixeira", "Barbosa", "Quaresma", "Antunes", "Fontes", "Valente", "Rebelo", "Gouveia", "Pinheiro", "Seabra", "Tavares"],
  },
  it: {
    first: ["Marco", "Luca", "Stefano", "Davide", "Alessandro", "Roberto", "Fabio", "Massimo", "Paolo", "Andrea", "Claudio", "Giorgio", "Simone", "Gianluca", "Francesco"],
    last: ["Benedetti", "Ferraresi", "Lombardi", "Caruso", "Marchetti", "Santoro", "Bellandi", "Vitale", "Moretti", "Galletti", "Fabbri", "Orlandini", "Testa", "Rinaldi", "Pellegrini", "Cattaneo", "Brambilla"],
  },
  de: {
    first: ["Thomas", "Markus", "Stefan", "Jürgen", "Michael", "Florian", "Sebastian", "Jens", "Tobias", "Dirk", "Matthias", "Andreas", "Lukas", "Christoph", "Daniel", "Uwe"],
    last: ["Brandner", "Kessler", "Hoffmeister", "Lindner", "Stellmacher", "Vogt", "Reinholz", "Wendler", "Kaltenbach", "Seidel", "Brückner", "Hartmann", "Engel", "Riedl", "Sommerfeld", "Baumgart", "Pfeiffer", "Zander"],
  },
  nl: {
    first: ["Jeroen", "Ruud", "Erik", "Bart", "Dennis", "Sander", "Wim", "Pieter", "Arjen", "Kees", "Joost", "Tom", "Niels", "Koen"],
    last: ["van Dalen", "de Groot", "Verhoeven", "Bakker", "Peeters", "van Rijn", "Janssens", "de Wit", "Mertens", "Hendriks", "van der Berg", "Claes", "Smits", "Wouters"],
  },
  fr: {
    first: ["Laurent", "Thierry", "Christophe", "Olivier", "Frédéric", "Stéphane", "Nicolas", "Julien", "Sébastien", "Philippe", "Didier", "Antoine", "Bruno", "Romain"],
    last: ["Delacroix", "Marchand", "Lefèvre", "Girardot", "Bonnefoy", "Chauvin", "Roussel", "Moreau", "Dufresne", "Perrin", "Garnier", "Lemaire", "Vasseur", "Fournier", "Delorme"],
  },
  nord: {
    first: ["Lars", "Anders", "Henrik", "Mikkel", "Jonas", "Erik", "Kasper", "Magnus", "Rasmus", "Ståle", "Jukka", "Gunnar", "Ole", "Niklas", "Pekka", "Thomas"],
    last: ["Lindqvist", "Halvorsen", "Bergström", "Kristiansen", "Sørensen", "Nyberg", "Mortensen", "Dahlberg", "Johannessen", "Virtanen", "Eriksen", "Haugland", "Sigurdsson", "Holm", "Ekström", "Lauritsen"],
  },
  slav: {
    first: ["Tomasz", "Marek", "Pavel", "Jan", "Michal", "Piotr", "Ondřej", "Jakub", "Andriy", "Oleksandr", "Dmytro", "Ivan", "Viktor", "Martin", "Sergei", "Georgi", "Radek"],
    last: ["Nowicki", "Kowalczyk", "Dvořák", "Hrubý", "Kovalenko", "Petrenko", "Zieliński", "Sýkora", "Wiśniewski", "Bondarenko", "Novotný", "Marchenko", "Kaczmarek", "Holub", "Petrov", "Dimitrov", "Ivanov"],
  },
  yu: {
    first: ["Dragan", "Zoran", "Goran", "Nenad", "Igor", "Marko", "Ivica", "Dejan", "Slaven", "Branko", "Vladimir", "Milan", "Aleksandar", "Damir", "Mladen"],
    last: ["Petrović", "Jovanović", "Kovačević", "Marić", "Babić", "Stanković", "Jurić", "Radović", "Nikolić", "Perić", "Lukić", "Vuković", "Hadžić", "Tomić", "Knežević"],
  },
  ro: {
    first: ["Adrian", "Dan", "Cosmin", "Florin", "Mihai", "Ionuț", "Cătălin", "Bogdan", "Costel", "Vasile", "Gheorghe"],
    last: ["Popescu", "Ionescu", "Dumitrescu", "Constantin", "Stan", "Munteanu", "Neagu", "Rusu", "Ciobanu", "Lungu", "Moldovan"],
  },
  hu: {
    first: ["Zoltán", "László", "Gábor", "Péter", "Attila", "Tamás", "Csaba", "István", "Balázs", "Sándor"],
    last: ["Nagy", "Kovács", "Szabó", "Horváth", "Tóth", "Varga", "Farkas", "Molnár", "Balogh", "Papp", "Lakatos"],
  },
  alb: {
    first: ["Arben", "Edmond", "Ilir", "Besnik", "Fatmir", "Genc", "Valon", "Agim", "Lorik", "Ardian"],
    last: ["Hoxha", "Krasniqi", "Berisha", "Gashi", "Shala", "Leka", "Duka", "Bytyqi", "Kelmendi", "Rama"],
  },
  gr: {
    first: ["Giorgos", "Nikos", "Kostas", "Dimitris", "Vasilis", "Christos", "Yannis", "Takis", "Andreas", "Michalis", "Panagiotis"],
    last: ["Papadopoulos", "Georgiou", "Karagiannis", "Konstantinou", "Vlachos", "Dimitriou", "Nikolaidis", "Christodoulou", "Antoniou", "Theodorou", "Makris"],
  },
  tr: {
    first: ["Mehmet", "Ahmet", "Mustafa", "Hakan", "Emre", "Serkan", "Okan", "Murat", "Orhan", "Tolga", "Rashad", "Elvin", "Kenan"],
    last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aliyev", "Mammadov", "Huseynov"],
  },
  il: {
    first: ["Avi", "Yossi", "Eli", "Moshe", "Ronen", "Guy", "Itay", "Barak", "Nir", "Amir"],
    last: ["Cohen", "Levi", "Mizrahi", "Peretz", "Biton", "Dahan", "Friedman", "Azoulay", "Ben-David", "Shapira"],
  },
  cauc: {
    first: ["Giorgi", "Levan", "Davit", "Zurab", "Irakli", "Aram", "Vardan", "Armen", "Tigran", "Gevorg"],
    last: ["Beridze", "Kapanadze", "Gelashvili", "Lomidze", "Tsiklauri", "Petrosyan", "Hovhannisyan", "Grigoryan", "Sargsyan", "Avetisyan"],
  },
  balt: {
    first: ["Andris", "Jānis", "Mārtiņš", "Tomas", "Mindaugas", "Darius", "Rimantas", "Tarmo", "Mart", "Indrek", "Aleksei"],
    last: ["Ozols", "Kalniņš", "Bērziņš", "Kazlauskas", "Petrauskas", "Jankauskas", "Tamm", "Saar", "Kask", "Rebane", "Vaitkus"],
  },
};

// Region of each association's names.
const NAME_REGION = {
  ENG: "en", SCO: "en", WAL: "en", NIR: "en", IRL: "en", GIB: "en",
  ESP: "es", AND: "es", POR: "pt",
  ITA: "it", SMR: "it", MLT: "it",
  GER: "de", AUT: "de", SUI: "de", LIE: "de",
  NED: "nl", BEL: "nl",
  FRA: "fr", LUX: "fr",
  DEN: "nord", NOR: "nord", SWE: "nord", FIN: "nord", ISL: "nord", FRO: "nord",
  POL: "slav", CZE: "slav", SVK: "slav", UKR: "slav", RUS: "slav", BLR: "slav", BUL: "slav", KAZ: "slav",
  SVN: "yu", CRO: "yu", SRB: "yu", BIH: "yu", MNE: "yu", MKD: "yu",
  ROU: "ro", MDA: "ro", HUN: "hu", ALB: "alb", KOS: "alb",
  GRE: "gr", CYP: "gr", TUR: "tr", AZE: "tr", ISR: "il",
  GEO: "cauc", ARM: "cauc", LVA: "balt", LTU: "balt", EST: "balt",
};

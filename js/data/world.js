// Registry for the rest of Europe. Each file in js/data/countries/ calls
// addCountry({...}) once per country; see the schema in js/data/countries/README.md.

const COUNTRIES = [];
function addCountry(country) { COUNTRIES.push(country); }

// UEFA association ranking at the start of the game (approximate 2025 values):
// five-season coefficient totals. The game updates them from results.
const ASSOCIATIONS = [
  ["ENG", 115], ["ITA", 98], ["ESP", 90], ["GER", 88], ["FRA", 70], ["NED", 62], ["POR", 58], ["BEL", 56],
  ["TUR", 44], ["CZE", 43], ["GRE", 41], ["NOR", 38], ["POL", 35], ["DEN", 33], ["AUT", 32], ["SUI", 31],
  ["SCO", 30], ["SWE", 28], ["ISR", 27], ["CYP", 26], ["CRO", 25], ["SRB", 24], ["HUN", 23], ["SVN", 22],
  ["UKR", 21], ["ROU", 20], ["SVK", 19], ["BUL", 18], ["AZE", 17], ["RUS", 16], ["KAZ", 15], ["MDA", 14],
  ["LIE", 13], ["IRL", 12], ["ARM", 11], ["FIN", 11], ["BIH", 10], ["ISL", 10], ["LVA", 9.5], ["KOS", 9],
  ["LTU", 9], ["FRO", 8.5], ["MLT", 8], ["BLR", 7.5], ["MKD", 7], ["ALB", 7], ["LUX", 6.5], ["GEO", 6],
  ["MNE", 5.5], ["NIR", 5], ["EST", 4.5], ["WAL", 4], ["GIB", 3.5], ["AND", 3], ["SMR", 2.5],
];

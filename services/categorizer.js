import Anthropic from '@anthropic-ai/sdk';
import pool from '../database/db.js';

const client = new Anthropic();

// Rule-based keyword map: lowercase keyword -> department name
const RULES = {
  // Produce
  apple: 'Produce', apples: 'Produce', banana: 'Produce', bananas: 'Produce',
  orange: 'Produce', oranges: 'Produce', lemon: 'Produce', lemons: 'Produce',
  lime: 'Produce', limes: 'Produce', grape: 'Produce', grapes: 'Produce',
  strawberry: 'Produce', strawberries: 'Produce', blueberry: 'Produce', blueberries: 'Produce',
  raspberry: 'Produce', raspberries: 'Produce', watermelon: 'Produce', melon: 'Produce',
  peach: 'Produce', peaches: 'Produce', pear: 'Produce', pears: 'Produce',
  plum: 'Produce', plums: 'Produce', mango: 'Produce', mangoes: 'Produce',
  pineapple: 'Produce', avocado: 'Produce', avocados: 'Produce',
  lettuce: 'Produce', spinach: 'Produce', kale: 'Produce', arugula: 'Produce',
  cabbage: 'Produce', broccoli: 'Produce', cauliflower: 'Produce',
  carrot: 'Produce', carrots: 'Produce', celery: 'Produce',
  potato: 'Produce', potatoes: 'Produce', 'sweet potato': 'Produce', 'sweet potatoes': 'Produce',
  onion: 'Produce', onions: 'Produce', garlic: 'Produce', shallot: 'Produce', shallots: 'Produce',
  tomato: 'Produce', tomatoes: 'Produce', cucumber: 'Produce', cucumbers: 'Produce',
  pepper: 'Produce', peppers: 'Produce', zucchini: 'Produce', squash: 'Produce',
  mushroom: 'Produce', mushrooms: 'Produce', corn: 'Produce', asparagus: 'Produce',
  'green bean': 'Produce', 'green beans': 'Produce', pea: 'Produce', peas: 'Produce',
  herb: 'Produce', herbs: 'Produce', cilantro: 'Produce', parsley: 'Produce',
  basil: 'Produce', mint: 'Produce', ginger: 'Produce',

  // Meat & Seafood
  chicken: 'Meat & Seafood', beef: 'Meat & Seafood', pork: 'Meat & Seafood',
  turkey: 'Meat & Seafood', lamb: 'Meat & Seafood', veal: 'Meat & Seafood',
  steak: 'Meat & Seafood', 'ground beef': 'Meat & Seafood', hamburger: 'Meat & Seafood',
  bacon: 'Meat & Seafood', ham: 'Meat & Seafood', sausage: 'Meat & Seafood',
  'hot dog': 'Meat & Seafood', 'hot dogs': 'Meat & Seafood',
  salmon: 'Meat & Seafood', tuna: 'Meat & Seafood', shrimp: 'Meat & Seafood',
  fish: 'Meat & Seafood', tilapia: 'Meat & Seafood', cod: 'Meat & Seafood',
  crab: 'Meat & Seafood', lobster: 'Meat & Seafood', scallop: 'Meat & Seafood', scallops: 'Meat & Seafood',
  clam: 'Meat & Seafood', clams: 'Meat & Seafood', oyster: 'Meat & Seafood', oysters: 'Meat & Seafood',

  // Dairy & Eggs
  milk: 'Dairy & Eggs', cream: 'Dairy & Eggs', 'half and half': 'Dairy & Eggs',
  butter: 'Dairy & Eggs', margarine: 'Dairy & Eggs',
  cheese: 'Dairy & Eggs', cheddar: 'Dairy & Eggs', mozzarella: 'Dairy & Eggs',
  parmesan: 'Dairy & Eggs', brie: 'Dairy & Eggs', gouda: 'Dairy & Eggs',
  yogurt: 'Dairy & Eggs', 'sour cream': 'Dairy & Eggs', 'cream cheese': 'Dairy & Eggs',
  'cottage cheese': 'Dairy & Eggs', ricotta: 'Dairy & Eggs',
  egg: 'Dairy & Eggs', eggs: 'Dairy & Eggs',
  'almond milk': 'Dairy & Eggs', 'oat milk': 'Dairy & Eggs', 'soy milk': 'Dairy & Eggs',

  // Bakery & Bread
  bread: 'Bakery & Bread', loaf: 'Bakery & Bread', bagel: 'Bakery & Bread', bagels: 'Bakery & Bread',
  muffin: 'Bakery & Bread', muffins: 'Bakery & Bread', croissant: 'Bakery & Bread', croissants: 'Bakery & Bread',
  roll: 'Bakery & Bread', rolls: 'Bakery & Bread', bun: 'Bakery & Bread', buns: 'Bakery & Bread',
  tortilla: 'Bakery & Bread', tortillas: 'Bakery & Bread', pita: 'Bakery & Bread',
  cake: 'Bakery & Bread', pie: 'Bakery & Bread', pastry: 'Bakery & Bread', pastries: 'Bakery & Bread',
  cookie: 'Bakery & Bread', cookies: 'Bakery & Bread', brownie: 'Bakery & Bread', brownies: 'Bakery & Bread',
  donut: 'Bakery & Bread', donuts: 'Bakery & Bread',

  // Frozen
  'ice cream': 'Frozen', 'frozen pizza': 'Frozen', 'frozen vegetables': 'Frozen',
  'frozen fruit': 'Frozen', 'frozen meals': 'Frozen', 'frozen dinner': 'Frozen',
  popsicle: 'Frozen', popsicles: 'Frozen', sorbet: 'Frozen', gelato: 'Frozen',
  'frozen waffles': 'Frozen', 'frozen fries': 'Frozen',

  // Pantry / Dry Goods
  pasta: 'Pantry / Dry Goods', spaghetti: 'Pantry / Dry Goods', noodle: 'Pantry / Dry Goods', noodles: 'Pantry / Dry Goods',
  rice: 'Pantry / Dry Goods', quinoa: 'Pantry / Dry Goods', oats: 'Pantry / Dry Goods', oatmeal: 'Pantry / Dry Goods',
  flour: 'Pantry / Dry Goods', sugar: 'Pantry / Dry Goods', salt: 'Pantry / Dry Goods',
  oil: 'Pantry / Dry Goods', 'olive oil': 'Pantry / Dry Goods', 'vegetable oil': 'Pantry / Dry Goods',
  vinegar: 'Pantry / Dry Goods', sauce: 'Pantry / Dry Goods', 'tomato sauce': 'Pantry / Dry Goods',
  'soy sauce': 'Pantry / Dry Goods', ketchup: 'Pantry / Dry Goods', mustard: 'Pantry / Dry Goods',
  mayonnaise: 'Pantry / Dry Goods', mayo: 'Pantry / Dry Goods',
  soup: 'Pantry / Dry Goods', broth: 'Pantry / Dry Goods', stock: 'Pantry / Dry Goods',
  beans: 'Pantry / Dry Goods', lentils: 'Pantry / Dry Goods', chickpeas: 'Pantry / Dry Goods',
  cereal: 'Pantry / Dry Goods', granola: 'Pantry / Dry Goods',
  'peanut butter': 'Pantry / Dry Goods', jelly: 'Pantry / Dry Goods', jam: 'Pantry / Dry Goods',
  honey: 'Pantry / Dry Goods', syrup: 'Pantry / Dry Goods',
  spice: 'Pantry / Dry Goods', spices: 'Pantry / Dry Goods', seasoning: 'Pantry / Dry Goods',
  baking: 'Pantry / Dry Goods', 'baking powder': 'Pantry / Dry Goods', 'baking soda': 'Pantry / Dry Goods',
  'canned tomatoes': 'Pantry / Dry Goods', 'canned corn': 'Pantry / Dry Goods',

  // Beverages
  water: 'Beverages', juice: 'Beverages', soda: 'Beverages', 'sparkling water': 'Beverages',
  coffee: 'Beverages', tea: 'Beverages', 'energy drink': 'Beverages', 'energy drinks': 'Beverages',
  beer: 'Beverages', wine: 'Beverages', spirits: 'Beverages', liquor: 'Beverages',
  lemonade: 'Beverages', smoothie: 'Beverages',

  // Snacks
  chips: 'Snacks', crackers: 'Snacks', popcorn: 'Snacks', pretzels: 'Snacks',
  nuts: 'Snacks', almonds: 'Snacks', cashews: 'Snacks', peanuts: 'Snacks', walnuts: 'Snacks',
  'trail mix': 'Snacks', 'granola bar': 'Snacks', 'granola bars': 'Snacks',
  chocolate: 'Snacks', candy: 'Snacks', gum: 'Snacks',

  // Household / Cleaning
  'paper towels': 'Household / Cleaning', 'toilet paper': 'Household / Cleaning',
  'dish soap': 'Household / Cleaning', detergent: 'Household / Cleaning',
  'laundry detergent': 'Household / Cleaning', bleach: 'Household / Cleaning',
  'trash bags': 'Household / Cleaning', 'zip lock': 'Household / Cleaning', 'ziploc': 'Household / Cleaning',
  'aluminum foil': 'Household / Cleaning', 'plastic wrap': 'Household / Cleaning',
  'cleaning spray': 'Household / Cleaning', sponge: 'Household / Cleaning', sponges: 'Household / Cleaning',
  'paper plates': 'Household / Cleaning', 'napkins': 'Household / Cleaning',

  // Personal Care
  shampoo: 'Personal Care', conditioner: 'Personal Care', soap: 'Personal Care',
  toothpaste: 'Personal Care', toothbrush: 'Personal Care', floss: 'Personal Care',
  deodorant: 'Personal Care', razors: 'Personal Care', razor: 'Personal Care',
  lotion: 'Personal Care', sunscreen: 'Personal Care',
  'feminine hygiene': 'Personal Care', tampons: 'Personal Care', pads: 'Personal Care',
  vitamins: 'Personal Care', medicine: 'Personal Care', bandages: 'Personal Care',
};

// Load departments from DB into a name->id map
let departmentMap = null;
async function getDepartmentMap() {
  if (departmentMap) return departmentMap;
  const [rows] = await pool.query('SELECT id, name FROM departments');
  departmentMap = {};
  for (const row of rows) {
    departmentMap[row.name] = row.id;
  }
  return departmentMap;
}

// Try rule-based match first, then learned cache, then Claude
export async function categorizeItem(itemName) {
  const lower = itemName.toLowerCase().trim();
  const deptMap = await getDepartmentMap();

  // 1. Full phrase rule match
  if (RULES[lower]) {
    return deptMap[RULES[lower]] ?? deptMap['Other / Uncategorized'];
  }
  // 2. Single-word rule match
  const words = lower.split(/\s+/);
  if (words.length === 1 && RULES[words[0]]) {
    return deptMap[RULES[words[0]]] ?? deptMap['Other / Uncategorized'];
  }

  // 3. Learned cache
  const [cached] = await pool.query(
    'SELECT department_id FROM learned_categories WHERE item_name = ?',
    [lower]
  );
  if (cached.length) return cached[0].department_id;

  // 4. Claude Haiku fallback — save result to learned cache
  const departmentNames = Object.keys(deptMap).join(', ');
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [{
      role: 'user',
      content: `Which grocery store department does "${itemName}" belong to? Choose exactly one from this list: ${departmentNames}. Reply with only the department name, nothing else.`,
    }],
  });

  const suggested = message.content[0].text.trim();
  const departmentId = deptMap[suggested] ?? deptMap['Other / Uncategorized'];

  await pool.query(
    'INSERT INTO learned_categories (item_name, department_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE department_id = VALUES(department_id)',
    [lower, departmentId]
  );

  return departmentId;
}

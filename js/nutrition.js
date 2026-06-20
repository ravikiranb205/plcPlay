import { getProfile } from './store.js';
import { getNutrientTargets } from './profile.js';

let waterInterval = null;
let mealInterval  = null;

const MEAL_SCHEDULE = [
  { hour: 8,  label: 'Breakfast', type: 'breakfast' },
  { hour: 11, label: 'Morning Snack', type: 'snack' },
  { hour: 13, label: 'Lunch', type: 'lunch' },
  { hour: 16, label: 'Afternoon Snack', type: 'snack' },
  { hour: 19, label: 'Dinner', type: 'dinner' }
];

const CUISINE_MEALS = {
  indian: {
    breakfast: ['Poha with peanuts & curry leaves', 'Idli with sambar & chutney', 'Besan chilla with mint chutney', 'Oats upma with vegetables'],
    lunch:     ['Dal + roti + sabzi + raita', 'Chicken curry with brown rice', 'Paneer tikka with roti & salad', 'Rajma chawal with curd'],
    dinner:    ['Grilled chicken tikka + salad', 'Palak paneer with roti', 'Fish curry with steamed rice', 'Moong dal khichdi with ghee'],
    snack:     ['Roasted chana', 'Sprout chaat', 'Masala buttermilk + handful of nuts', 'Paneer tikka bites']
  },
  american: {
    breakfast: ['Scrambled eggs + whole wheat toast + avocado', 'Greek yogurt parfait with berries & granola', 'Oatmeal with banana & almond butter', 'Protein smoothie with spinach'],
    lunch:     ['Grilled chicken breast + sweet potato + broccoli', 'Turkey wrap with mixed greens', 'Quinoa bowl with black beans & veggies', 'Salmon salad with olive oil dressing'],
    dinner:    ['Lean steak + roasted vegetables', 'Baked salmon + asparagus + rice', 'Chicken stir-fry with brown rice', 'Turkey meatballs with zucchini noodles'],
    snack:     ['Apple + peanut butter', 'Protein bar', 'Hard-boiled eggs', 'Trail mix (nuts + dried fruit)']
  },
  mediterranean: {
    breakfast: ['Greek yogurt with honey, walnuts & figs', 'Whole grain toast with olive oil & tomatoes', 'Shakshuka (eggs in tomato sauce)', 'Overnight oats with dates & almonds'],
    lunch:     ['Grilled fish with quinoa & roasted vegetables', 'Falafel wrap with hummus & tabbouleh', 'Greek salad with feta & olive oil', 'Lentil soup with whole grain bread'],
    dinner:    ['Baked salmon with lemon, capers & asparagus', 'Chicken souvlaki with tzatziki & pita', 'Stuffed bell peppers with rice & herbs', 'Grilled lamb chops with roasted eggplant'],
    snack:     ['Hummus with cucumber & carrots', 'Olives + feta + almonds', 'Dates stuffed with almond butter', 'Whole grain crackers with labneh']
  },
  east_asian: {
    breakfast: ['Congee with egg & scallions', 'Miso soup + rice + grilled fish', 'Steamed buns with vegetables', 'Tofu scramble with soy sauce & rice'],
    lunch:     ['Teriyaki chicken with steamed rice & edamame', 'Bibimbap with mixed vegetables', 'Stir-fried tofu with bok choy & noodles', 'Sushi bowl with salmon & avocado'],
    dinner:    ['Grilled fish with miso glaze + brown rice', 'Korean BBQ beef with kimchi & rice', 'Steamed fish with ginger & soy + vegetables', 'Chicken katsu with cabbage salad'],
    snack:     ['Edamame', 'Seaweed snacks + rice crackers', 'Mochi (small portion)', 'Steamed dumplings (3-4 pieces)']
  },
  mexican: {
    breakfast: ['Huevos rancheros with beans', 'Breakfast burrito with eggs, beans & salsa', 'Chilaquiles with chicken', 'Avocado toast with lime & chili flakes'],
    lunch:     ['Chicken burrito bowl with rice & beans', 'Fish tacos with cabbage slaw', 'Grilled chicken with black bean salad', 'Pozole with lean pork & vegetables'],
    dinner:    ['Grilled carne asada with grilled peppers', 'Chicken enchiladas with tomatillo sauce', 'Shrimp fajitas with guacamole', 'Stuffed poblano peppers with quinoa'],
    snack:     ['Guacamole with jicama sticks', 'Black bean dip with tortilla chips', 'Mango with chili & lime', 'Roasted pepitas']
  },
  middle_eastern: {
    breakfast: ['Ful medames with pita & olive oil', 'Labneh with za\'atar, cucumber & pita', 'Shakshuka with feta', 'Halloumi with tomato & mint'],
    lunch:     ['Grilled chicken shawarma with hummus & salad', 'Lamb kofta with tabbouleh & pita', 'Falafel plate with tahini & pickles', 'Freekeh salad with roasted vegetables'],
    dinner:    ['Grilled kebabs with rice pilaf', 'Baked fish with tahini sauce & roasted cauliflower', 'Stuffed grape leaves with lamb & rice', 'Chicken tagine with couscous'],
    snack:     ['Hummus with raw vegetables', 'Dates with almonds', 'Labneh balls with olive oil', 'Mixed nuts with dried apricots']
  },
  european: {
    breakfast: ['Scrambled eggs with smoked salmon & rye bread', 'Muesli with yogurt & berries', 'Avocado toast with poached egg', 'Overnight oats with nuts & honey'],
    lunch:     ['Grilled chicken Caesar salad', 'Nicoise salad with tuna', 'Minestrone soup with crusty bread', 'Open-faced sandwich with turkey & avocado'],
    dinner:    ['Pan-seared salmon with roasted root vegetables', 'Chicken marsala with steamed vegetables', 'Beef bourguignon with mashed potatoes', 'Grilled pork tenderloin with apple compote'],
    snack:     ['Cheese + whole grain crackers', 'Greek yogurt with granola', 'Dark chocolate + almonds', 'Caprese skewers']
  },
  african: {
    breakfast: ['Porridge with groundnuts & banana', 'Akara (bean fritters) with pap', 'Eggs with plantain', 'Millet porridge with milk & honey'],
    lunch:     ['Jollof rice with grilled chicken', 'Lentil stew with injera', 'Grilled fish with couscous & vegetables', 'Peanut soup with rice'],
    dinner:    ['Grilled chicken with ugali & sukuma wiki', 'Fish stew with plantain', 'Beef suya with vegetable salad', 'Chicken yassa with brown rice'],
    snack:     ['Roasted groundnuts', 'Plantain chips', 'Fresh fruit (mango, papaya)', 'Chin chin (small portion)']
  },
  south_american: {
    breakfast: ['Arepa with scrambled eggs & avocado', 'Acai bowl with granola & banana', 'Tapioca crepe with cheese', 'Eggs with black beans & plantain'],
    lunch:     ['Grilled chicken with rice, beans & farofa', 'Ceviche with sweet potato', 'Lomo saltado with rice', 'Empanadas with salad'],
    dinner:    ['Grilled steak with chimichurri & vegetables', 'Baked fish with yuca & salad', 'Chicken with quinoa & avocado salad', 'Bean stew with rice & collard greens'],
    snack:     ['Mixed nuts with dried fruit', 'Cheese bread (pao de queijo)', 'Fresh tropical fruit', 'Hummus with cassava chips']
  }
};

const VEG_FILTER = {
  vegetarian: meal => !(/chicken|fish|salmon|beef|steak|turkey|pork|lamb|tuna|shrimp|carne|kebab|meat|suya|kofta/i.test(meal)),
  vegan: meal => !(/chicken|fish|salmon|beef|steak|turkey|pork|lamb|tuna|shrimp|egg|yogurt|cheese|paneer|honey|ghee|curd|raita|butter|cream|feta|halloumi|labneh|milk|mochi|carne|kebab|meat|suya|kofta/i.test(meal)),
  pescatarian: meal => !(/chicken|beef|steak|turkey|pork|lamb|carne|kebab|meat|suya|kofta/i.test(meal))
};

export function getMealSuggestions(profile) {
  if (!profile) return [];

  const cuisines = profile.cuisinePreferences?.length
    ? profile.cuisinePreferences
    : [profile.nationality || 'american'];

  const targets = getNutrientTargets(profile);
  const filter = VEG_FILTER[profile.dietPreference];

  return MEAL_SCHEDULE.map(slot => {
    const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    const meals = CUISINE_MEALS[cuisine]?.[slot.type] || CUISINE_MEALS.american[slot.type];

    let options = filter ? meals.filter(filter) : meals;
    if (!options.length) options = meals;

    const pick = options[Math.floor(Math.random() * options.length)];

    return {
      ...slot,
      suggestion: pick,
      cuisine: cuisine.replace('_', ' '),
      targets
    };
  });
}

export function startWaterReminder(intervalMinutes = 15) {
  stopWaterReminder();

  const show = () => {
    const toast = document.getElementById('waterToast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 5000);
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('FitWin', { body: 'Time to sip some water! Stay hydrated.', icon: './icons/icon-192.png' }); } catch {}
    }
  };

  waterInterval = setInterval(show, intervalMinutes * 60 * 1000);
}

export function stopWaterReminder() {
  if (waterInterval) { clearInterval(waterInterval); waterInterval = null; }
}

export function startMealNotifications() {
  stopMealNotifications();

  const profile = getProfile();
  if (!profile) return;

  const check = () => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();

    const slot = MEAL_SCHEDULE.find(s => s.hour === hour && min >= 0 && min <= 5);
    if (!slot) return;

    const targets = getNutrientTargets(profile);
    const meals = getMealSuggestions(profile);
    const meal = meals.find(m => m.type === slot.type);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`FitWin · ${slot.label}`, {
          body: `${meal?.suggestion || 'Time to eat!'}\nTargets: ${targets.protein}g protein · ${targets.calories} cal`,
          icon: './icons/icon-192.png'
        });
      } catch {}
    }
  };

  mealInterval = setInterval(check, 60 * 1000);
  check();
}

export function stopMealNotifications() {
  if (mealInterval) { clearInterval(mealInterval); mealInterval = null; }
}

// Each theme has an anchor category (people) at index 0, followed by
// attribute categories. Phrase templates turn items into English:
//   ref   – a noun phrase that can start a sentence ("the camper in the Red cabin")
//   pred  – what follows "is" ("in the Red cabin")
//   short – compact label used in grids and math ("Red cabin")
// Ordered categories (numbers, times) support comparison clues.
export const THEMES = [
  {
    id: 'camp',
    name: 'Summer Camp',
    entity: 'camper',
    entities: 'campers',
    categories: [
      { name: 'Camper', items: ['Ava', 'Ben', 'Chloe', 'Diego', 'Emma'], ref: '{x}', pred: '{x}' },
      {
        name: 'Activity',
        items: ['Archery', 'Canoeing', 'Pottery', 'Hiking', 'Chess'],
        ref: 'the camper who chose {x}',
        pred: 'the one who chose {x}',
        lower: true,
      },
      {
        name: 'Cabin',
        items: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'],
        ref: 'the camper in the {x} cabin',
        pred: 'in the {x} cabin',
        short: '{x} cabin',
      },
      {
        name: 'Age',
        items: ['10', '11', '12', '13', '14'],
        ref: 'the {x}-year-old',
        pred: '{x} years old',
        short: 'age {x}',
        ordered: {
          fn: 'Age',
          step: 1,
          unit: ['year', 'years'],
          less: 'is younger than',
          offset: '{B} is {d} {unit} older than {A}',
          nextTo: '{A} and {B} are exactly one year apart in age',
        },
      },
    ],
  },
  {
    id: 'fair',
    name: 'Science Fair',
    entity: 'student',
    entities: 'students',
    categories: [
      { name: 'Student', items: ['Hana', 'Ivan', 'Jun', 'Kira', 'Leo'], ref: '{x}', pred: '{x}' },
      {
        name: 'Project',
        items: ['Robot', 'Volcano', 'Solar oven', 'Crystal garden', 'Weather station'],
        ref: 'the student who built the {x}',
        pred: 'the one who built the {x}',
        lower: true,
      },
      {
        name: 'Table',
        items: ['1', '2', '3', '4', '5'],
        ref: 'the student at table {x}',
        pred: 'at table {x}',
        short: 'table {x}',
        ordered: {
          fn: 'Table',
          step: 1,
          unit: ['table', 'tables'],
          less: 'sits at a lower-numbered table than',
          offset: '{B} sits {d} {unit} to the right of {A}',
          nextTo: '{A} and {B} sit at neighboring tables',
        },
      },
      {
        name: 'Score',
        items: ['70', '75', '80', '85', '90'],
        ref: 'the student who scored {x}',
        pred: 'the one who scored {x}',
        short: '{x} pts',
        ordered: {
          fn: 'Score',
          step: 5,
          unit: ['point', 'points'],
          less: 'scored lower than',
          offset: '{B} scored {d} {unit} more than {A}',
          nextTo: '{A} and {B} scored exactly 5 points apart',
        },
      },
    ],
  },
  {
    id: 'pets',
    name: 'Pet Talent Show',
    entity: 'owner',
    entities: 'owners',
    categories: [
      { name: 'Owner', items: ['Mia', 'Noah', 'Olivia', 'Pablo', 'Quinn'], ref: '{x}', pred: '{x}' },
      {
        name: 'Pet',
        items: ['Cat', 'Dog', 'Parrot', 'Rabbit', 'Turtle'],
        ref: 'the {x} owner',
        pred: 'the {x} owner',
        lower: true,
      },
      {
        name: 'Hometown',
        items: ['Paris', 'Tokyo', 'Lima', 'Cairo', 'Oslo'],
        ref: 'the owner from {x}',
        pred: 'from {x}',
      },
      {
        name: 'Time',
        items: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM'],
        ref: 'the owner who performed at {x}',
        pred: 'the one who performed at {x}',
        ordered: {
          fn: 'Time',
          step: 1,
          unit: ['hour', 'hours'],
          less: 'performed earlier than',
          offset: '{B} performed {d} {unit} after {A}',
          nextTo: '{A} and {B} performed in back-to-back hours',
        },
      },
    ],
  },
  {
    id: 'olympiad',
    name: 'Logic Olympiad',
    entity: 'competitor',
    entities: 'competitors',
    categories: [
      { name: 'Competitor', items: ['Ravi', 'Sofia', 'Tomás', 'Uma', 'Wei'], ref: '{x}', pred: '{x}' },
      {
        name: 'Country',
        items: ['Brazil', 'Canada', 'Kenya', 'Korea', 'Spain'],
        ref: 'the competitor from {x}',
        pred: 'from {x}',
      },
      {
        name: 'Topic',
        items: ['Logic', 'Geometry', 'Graph theory', 'Number theory', 'Combinatorics'],
        ref: 'the {x} fan',
        pred: 'the {x} fan',
        lower: true,
      },
      {
        name: 'Score',
        items: ['6', '7', '8', '9', '10'],
        ref: 'the competitor who scored {x}',
        pred: 'the one who scored {x}',
        short: '{x} pts',
        ordered: {
          fn: 'Score',
          step: 1,
          unit: ['point', 'points'],
          less: 'scored lower than',
          offset: '{B} scored {d} {unit} more than {A}',
          nextTo: '{A} and {B} scored exactly one point apart',
        },
      },
    ],
  },
];

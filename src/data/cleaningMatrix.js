// Cleaning Matrix — sourced from Cleaning_matrix.xlsx
// Separated from component code so the main bundle stays small.
//
// Floor type tags on tasks:
//   floorType: 'hard'   → only applies to hard floor rooms
//   floorType: 'carpet' → only applies to carpet rooms
//   floorType: 'both'   → applies to both (default — no tag needed)
//   For 'mixed' rooms, hard tasks apply to hardSplit% of sqft, carpet tasks to (1-hardSplit)%

export const TASK_LIBRARY = {
  wD:  ["Waste and recycling collection, liner replacement","b",2,"Daily"],
  wW:  ["Waste and recycling collection, liner replacement","b",2,"Weekly"],
  w2:  ["Waste and recycling collection, liner replacement (2×/day)","b",2,"2x Daily"],
  swD: ["Sweep and clean all hard flooring","s",5.5,"Daily",     "hard"],
  sw2: ["Sweep and clean all hard flooring","s",5.5,"2x Weekly", "hard"],
  sv:  ["Spot vacuum carpet (incl. walk-off matting)","s",2.5,"Daily",    "carpet"],
  vc:  ["Vacuum all carpet (incl. walk-off matting)","s",3.8,"2x Weekly", "carpet"],
  sp:  ["Clean spills","s",1.5,"Daily"],
  sw:  ["Spot clean walls, cupboards, doors, glass, partitions","s",3,"Daily"],
  dW:  ["Dust all flat surfaces, including railings","s",3.2,"Weekly"],
  ct:  ["Clean tables, counter tops, furniture with disinfectant","s",4.5,"Daily"],
  di:  ["Disinfect all touch points","s",2.8,"Daily"],
  mr:  ["Clean mirrors","m",1.5,"Daily"],
  rf:  ["Reset all furniture to room standards","s",2,"Daily"],
  pp:  ["Replenish all paper products and soap dispensers","d",1.2,"Daily"],
  ap:  ["Clean all exterior surfaces of large & small appliances","a",4.5,"Weekly"],
  mc:  ["Clean all exterior and interior surfaces of microwave","a",3.5,"Daily"],
  dr:  ["Clean dryer vents from lint","f",6,"Weekly"],
  gd:  ["Disinfect gym equipment (machines, mats)","f",3,"Daily"],
  gr2: ["Reset all loose fitness equipment","f",2,"Daily"],
  tl:  ["Clean & disinfect toilet bowls, urinals, sinks, hygiene containers, floor drains, all fixtures","f",3.5,"2x Daily"],
  gr:  ["Remove graffiti","s",8,"As required"],
  se:  ["Sweep external outside areas (entrances)","s",4,"2x Weekly", "hard"],
  sn:  ["Remove snow, apply melt, prevent build-up (egress)","s",15,"Daily"],
  gdc: ["Deep clean of gym equipment","f",12,"Monthly"],
  fg:  ["Clean foot grills","f",12,"6 Months"],
  hd:  ["High dust","s",6.5,"6 Months"],
  wb:  ["Wash all waste & recycling containers (in/out)","b",5,"Monthly"],
  wd:  ["Wash down all cabinets, doors, windows, glass","s",8,"Monthly"],
  fv:  ["Exterior/interior cleaning of all fans/vents","f",5,"6 Months"],
  fc:  ["Restorative floor care","s",18,"Annual"],
  do_: ["Reset deep cleaning on demand","s",20,"On Demand"],
  dc:  ["Deep cleaning","s",22,"Annual"],
  et:  ["Clean elevator tracks","f",3,"Weekly"],
  wc:  ["Exterior window cleaning","s",6,"Monthly"],
};

export const UNIT_LABEL = {
  s: "per 100 sqft",
  f: "per fixture/unit",
  b: "per bin",
  d: "per dispenser",
  m: "per mirror",
  a: "per appliance",
  t: "per mat",
};

// Space type → ordered list of task keys
export const MATRIX = {
  "Common Kitchens":
    ["wD","swD","sp","sw","dW","ct","di","rf","pp","ap","mc","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Common Washroom":
    ["wD","swD","sp","sw","dW","di","mr","pp","tl","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Study Rooms / Multipurpose Space, etc.":
    ["wD","swD","sv","vc","sp","sw","dW","ct","di","mr","rf","pp","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Lobby / Circulation Space":
    ["w2","swD","sv","vc","sp","sw","dW","ct","di","rf","gr","fg","hd","wb","wd","fv","fc","do_","dc","wc"],
  "Corridor / Common Space with Carpet":
    ["wD","sv","vc","sp","sw","dW","ct","di","mr","rf","pp","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Corridor / Common Space with Hard Flooring (inc. Garbage Rms)":
    ["wD","swD","sp","sw","dW","ct","di","mr","rf","pp","dr","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Entrances / Vestibules":
    ["w2","swD","sv","vc","sp","sw","dW","ct","di","rf","se","sn","gr","fg","hd","wb","wd","fv","fc","do_","dc","wc"],
  "Gym / Fitness":
    ["wD","swD","sp","sw","dW","di","mr","rf","pp","gd","gr2","gr","gdc","hd","wb","wd","fv","fc","do_","dc"],
  "Office Space / Admin Space":
    ["wW","sw2","sv","vc","sp","sw","dW","ct","di","rf","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Lounge":
    ["wD","sw2","sp","sw","dW","ct","di","pp","ap","mc","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Elevator":
    ["sw2","sp","sw","di","gr","fg","hd","wb","wd","fv","fc","do_","dc","et"],
  "Dining Hall / Main Kitchen":
    ["w2","swD","sp","ct","di","rf","mc","gr","hd","wb","fv","fc","do_","dc"],
  "Stairwell":
    ["sw2","sp","sw","dW","di","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Parking Garage":
    ["wW","sp","di","gr","sn","wb"],
  "Utility Rooms (Laundry Room / Storage Space / Janitor Closet, etc.)":
    ["wW","sw2","sp","dW","di","mr","ap","dr","gr","hd","wb"],
};

export const SPACE_TYPES = Object.keys(MATRIX);

// Expand matrix to full task objects for use in components
export const ISSA_TASKS = Object.fromEntries(
  Object.entries(MATRIX).map(([sp, keys]) => [
    sp,
    keys.map(k => {
      const [task, uc, time, freq, floorType] = TASK_LIBRARY[k];
      return { task, unit: UNIT_LABEL[uc], uc, time, freq, floorType: floorType || null };
    })
  ])
);

// Frequency → weekly multiplier for FTE calculations
export const FREQ_WEEKS = {
  "2x Daily":   10,
  "Daily":       5,
  "2x Weekly":   2,
  "Weekly":      1,
  "Monthly":     0.25,
  "Quarterly":   0.083,
  "6 Months":   0.042,
  "Annual":      0.019,
  "On Demand":   0,
  "As required": 0,
};

// Frequency → display colour
export const FREQ_COLOR = {
  "2x Daily":   "#276749",
  "Daily":      "#38A169",
  "2x Weekly":  "#68D391",
  "Weekly":     "#D69E2E",
  "Monthly":    "#FC8181",
  "Quarterly":  "#9F7AEA",
  "6 Months":   "#718096",
  "Annual":     "#4A5568",
  "On Demand":  "#2D3748",
  "As required":"#374151",
};

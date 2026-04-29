// Cleaning Matrix — sourced from Cleaning_matrix.xlsx (Rev2)
// Separated from component code so the main bundle stays small.

export const TASK_LIBRARY = {
  wD:  ["Waste & recycling collection, liner replacement","b",2,"Daily"],
  wW:  ["Waste & recycling collection, liner replacement","b",2,"Weekly"],
  w2:  ["Waste & recycling collection, liner replacement (2×/day)","b",2,"2x Daily"],
  swD: ["Sweep and clean all hard flooring","s",5.5,"Daily"],
  sw2: ["Sweep and clean all hard flooring","s",5.5,"2x Weekly"],
  sv:  ["Spot vacuum carpet (incl. walk-off matting)","s",2.5,"Daily"],
  vc:  ["Vacuum all carpet","s",3.8,"2x Weekly"],
  mt:  ["Walk-off matting","t",2.5,"Daily"],
  sp:  ["Clean spills","s",1.5,"Daily"],
  sw:  ["Spot clean walls, cupboards, doors, glass, partitions","s",3,"Daily"],
  dD:  ["Dust all flat surfaces, including railings","s",3.2,"Daily"],
  dW:  ["Dust all flat surfaces, including railings","s",3.2,"Weekly"],
  ct:  ["Clean tables, counter tops, furniture with disinfectant","s",4.5,"Daily"],
  di:  ["Disinfect all touch points","s",2.8,"Daily"],
  mr:  ["Clean mirrors","m",1.5,"Daily"],
  rf:  ["Reset all furniture","s",2,"Daily"],
  pp:  ["Replenish all paper products and soap dispensers","d",1.2,"Daily"],
  ap:  ["Clean all exterior surfaces of large & small appliances (incl. laundry)","a",4.5,"Daily"],
  mc:  ["Clean all exterior and interior surfaces of microwave","a",3.5,"Daily"],
  gr:  ["Remove graffiti","s",8,"As required"],
  sn:  ["Remove snow, apply melt, prevent build-up","s",15,"As required"],
  hd:  ["High dust","s",6.5,"Quarterly"],
  wb:  ["Wash all waste & recycling containers (in/out)","b",5,"Monthly"],
  wd:  ["Wash down all cabinets, doors, windows, glass","s",8,"Monthly"],
  fv:  ["Exterior/interior cleaning of all fans/vents","f",5,"Weekly"],
  fc:  ["Restorative floor care","s",18,"Annual"],
  do_: ["Reset deep cleaning on demand","s",20,"On Demand"],
  dc:  ["Deep cleaning","s",22,"Annual"],
  dr:  ["Clean dryer vents from lint","f",6,"Weekly"],
  gd:  ["Disinfect gym equipment (machines, mats)","f",3,"Daily"],
  gr2: ["Reset all loose fitness equipment","f",2,"Daily"],
  gdc: ["Deep clean of gym equipment","f",12,"Weekly"],
  tl:  ["Clean & disinfect toilet bowls, urinals, sinks, hygiene containers, floor drains, all fixtures","f",3.5,"Daily"],
  fg:  ["Clean foot grills / elevator tracks","f",12,"6 Months"],
  se:  ["Sweep external outside areas","s",4,"Daily"],
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
  "Common Kitchen":                                    ["wD","swD","mt","sp","sw","dD","ct","di","rf","pp","ap","mc","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Common Washroom":                                   ["wD","swD","sp","sw","dD","di","mr","pp","tl","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Study Rooms / Lounges / Library / Theatre":         ["wD","swD","sv","vc","sp","sw","dD","ct","di","mr","rf","pp","ap","mc","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Lobby / Circulation Space":                         ["w2","swD","sv","vc","mt","sp","sw","dD","ct","di","mr","rf","gr","fg","hd","wb","wd","fv","fc","do_","dc"],
  "Corridor / Common Space (Carpet)":                  ["wD","sv","vc","sp","sw","dD","ct","di","mr","rf","pp","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Corridor / Common Space (Hard Floor)":              ["wD","sw2","sp","sw","dD","ct","di","mr","rf","pp","dr","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Entrances / Vestibules":                            ["wD","swD","sv","vc","mt","sp","sw","dD","ct","di","rf","se","gr","sn","fg","hd","wb","wd","fv","fc","do_","dc"],
  "Fitness / Gym":                                     ["wD","swD","sp","sw","dD","di","mr","rf","pp","gd","gr2","gr","gdc","hd","wb","wd","fv","fc","do_","dc"],
  "Office / Admin Space":                              ["wW","sw2","vc","sp","sw","dW","di","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Employee Lounge":                                   ["wD","sw2","sp","sw","dW","ct","di","pp","ap","mc","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Elevator":                                          ["sw2","sp","sw","di","gr","fg","hd","wb","wd","fv","fc","do_","dc"],
  "Stairwell":                                         ["sw2","sp","sw","dW","di","gr","hd","wb","wd","fv","fc","do_","dc"],
  "Parking Garage":                                    ["wW","sp","di","gr","sn","wb"],
  "Dining Areas":                                      ["w2","swD","sp","ct","di","rf","pp","ap","mc","gr","wb","fc","dc"],
  "Locker Rooms":                                      ["wD","sw2","sp","sw","dW","ct","di","pp","ap","mc","gr","hd","wb","wd","fc","dc"],
  "Storage":                                           ["wW","sp","sw","dW","di","gr","hd","wb","fc"],
  "Garbage Room":                                      ["wD","swD","sp","sw","di","gr","wb","wd","fc","dc"],
};

export const SPACE_TYPES = Object.keys(MATRIX);

// Expand matrix to full task objects for use in components
export const ISSA_TASKS = Object.fromEntries(
  Object.entries(MATRIX).map(([sp, keys]) => [
    sp,
    keys.map(k => {
      const [task, uc, time, freq] = TASK_LIBRARY[k];
      return { task, unit: UNIT_LABEL[uc], uc, time, freq };
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

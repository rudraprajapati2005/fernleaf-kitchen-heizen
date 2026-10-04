import { PrismaClient, UserRole, DishTemperature, PackagingType, PriceDerivationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const staff = [
  ['admin@test.com', 'Admin', UserRole.ADMIN],
  ['kitchen@test.com', 'Kitchen', UserRole.KITCHEN],
  ['dispatch@test.com', 'Dispatch', UserRole.DISPATCH],
  ['driver@test.com', 'Driver', UserRole.DRIVER],
] as const;

const allergens = ['Peanuts', 'Tree Nuts', 'Milk', 'Soy', 'Wheat', 'Gluten', 'Sesame', 'Mustard'];
const dietaryTags = ['Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Dairy-Free', 'High-Protein', 'Low-Carb', 'Nut-Free'];
const stations = ['Hot Kitchen', 'Grill', 'Rice & Grains', 'Cold Prep', 'Salads', 'Dessert', 'Packing'];
const portions = ['Regular', 'Large'];
const optionNames = ['Paneer', 'Tofu', 'Chickpeas', 'Brown Rice', 'Jeera Rice', 'Steamed Rice', 'Quinoa', 'Raita', 'Mint Chutney', 'Green Chutney', 'Pickled Onions', 'Roasted Vegetables', 'Mixed Salad', 'Dal Tadka', 'Papad', 'Extra Paneer', 'Cucumber Raita', 'Lemon Dressing', 'Thai Peanut Sauce', 'Avocado'];
const dishData = [
  ['Paneer Tikka Rice Bowl', 'Smoky paneer, fragrant rice and seasonal vegetables.', 'FL-BWL-001', 8.25, 'HOT', 'Grill'],
  ['Teriyaki Tofu Bowl', 'Glazed tofu with steamed rice and crunchy vegetables.', 'FL-BWL-002', 7.5, 'HOT', 'Hot Kitchen'],
  ['Chickpea Masala Bowl', 'Slow-cooked chickpeas, rice and fresh herbs.', 'FL-BWL-003', 6.75, 'HOT', 'Hot Kitchen'],
  ['Grilled Veggie Power Bowl', 'Charred vegetables, quinoa and lemon dressing.', 'FL-BWL-004', 7.95, 'HOT', 'Grill'],
  ['Butter Paneer Rice Bowl', 'Creamy tomato paneer with jeera rice.', 'FL-BWL-005', 8.5, 'HOT', 'Hot Kitchen'],
  ['Thai Basil Tofu Bowl', 'Basil tofu, vegetables and aromatic jasmine rice.', 'FL-BWL-006', 7.85, 'HOT', 'Hot Kitchen'],
  ['Rajma Quinoa Bowl', 'Rajma curry with quinoa and pickled onions.', 'FL-BWL-007', 7.25, 'HOT', 'Hot Kitchen'],
  ['Peri Peri Paneer Bowl', 'Spiced paneer, roasted vegetables and rice.', 'FL-BWL-008', 8.4, 'HOT', 'Grill'],
  ['Dal Makhani Combo', 'Dal makhani, rice, salad and chutney.', 'FL-IND-001', 7.25, 'HOT', 'Hot Kitchen'],
  ['Paneer Lababdar Meal', 'Paneer in a rich tomato gravy with rice.', 'FL-IND-002', 8.75, 'HOT', 'Hot Kitchen'],
  ['Kadai Vegetable Meal', 'Seasonal vegetables in a kadai masala.', 'FL-IND-003', 7.5, 'HOT', 'Hot Kitchen'],
  ['Chole Rice Meal', 'Punjabi chickpeas with steamed basmati rice.', 'FL-IND-004', 6.95, 'HOT', 'Hot Kitchen'],
  ['Palak Paneer Meal', 'Spinach and paneer with jeera rice.', 'FL-IND-005', 8.25, 'HOT', 'Hot Kitchen'],
  ['Gujarati Dal Rice Meal', 'Sweet-spiced Gujarati dal with rice.', 'FL-IND-006', 6.8, 'HOT', 'Hot Kitchen'],
  ['Masala Poha', 'Flattened rice with vegetables and roasted peanuts.', 'FL-BRK-001', 5.5, 'HOT', 'Hot Kitchen'],
  ['Vegetable Upma', 'Semolina breakfast with vegetables and curry leaves.', 'FL-BRK-002', 5.25, 'HOT', 'Hot Kitchen'],
  ['Idli Sambar', 'Steamed idli with sambar and chutney.', 'FL-BRK-003', 5.75, 'HOT', 'Hot Kitchen'],
  ['Paneer Paratha', 'Stuffed paneer paratha with raita.', 'FL-BRK-004', 6.5, 'HOT', 'Hot Kitchen'],
  ['Veggie Breakfast Wrap', 'Egg-free wrap with vegetables and paneer.', 'FL-BRK-005', 6.25, 'HOT', 'Grill'],
  ['Mediterranean Chickpea Salad', 'Chickpeas, herbs, cucumber and lemon dressing.', 'FL-SAL-001', 6.95, 'COLD', 'Salads'],
  ['Thai Peanut Salad', 'Crunchy vegetables with Thai peanut dressing.', 'FL-SAL-002', 7.25, 'COLD', 'Salads'],
  ['Grilled Vegetable Salad', 'Grilled seasonal vegetables over mixed greens.', 'FL-SAL-003', 7.5, 'COLD', 'Salads'],
  ['Quinoa Avocado Salad', 'Quinoa, avocado, greens and citrus dressing.', 'FL-SAL-004', 8.25, 'COLD', 'Salads'],
  ['Mango Yogurt Cup', 'Mango, yogurt and toasted seeds.', 'FL-DES-001', 4.25, 'COLD', 'Dessert'],
  ['Chocolate Brownie', 'Rich fudgy brownie portion.', 'FL-DES-002', 3.95, 'COLD', 'Dessert'],
] as const;
const companies = [
  ['Meridian Technologies', 'meridiantech.com', 'Meridian HQ', '500 Congress Ave', 'Austin', 'TX', '78701'],
  ['BluePeak Consulting', 'bluepeakconsulting.com', 'BluePeak Campus', '1200 Market Street', 'San Francisco', 'CA', '94102'],
  ['Northstar Finance', 'northstarfinance.com', 'Northstar Plaza', '200 Nicollet Mall', 'Minneapolis', 'MN', '55402'],
  ['Atlas Digital Labs', 'atlasdigitallabs.com', 'Atlas Studio', '30 Hudson Street', 'New York', 'NY', '10013'],
  ['Greenfield Analytics', 'greenfieldanalytics.com', 'Greenfield Center', '1801 Main Street', 'Dallas', 'TX', '75201'],
  ['Vertex Mobility', 'vertexmobility.com', 'Vertex Mobility Hub', '1 Market Street', 'San Jose', 'CA', '95113'],
  ['Horizon Systems', 'horizonsystems.com', 'Horizon Office', '100 Peachtree Street', 'Atlanta', 'GA', '30303'],
  ['Summit HealthTech', 'summithealthtech.com', 'Summit Wellness Campus', '401 Union Street', 'Seattle', 'WA', '98101'],
] as const;
const people = ['Aarav Mehta', 'Maya Shah', 'Liam Carter', 'Sofia Nguyen', 'Noah Williams', 'Anika Patel', 'Ethan Brooks', 'Priya Nair', 'Lucas Martin', 'Zoe Thompson', 'Rohan Kapoor', 'Emma Davis', 'Arjun Rao', 'Olivia Wilson', 'Daniel Kim', 'Isha Verma', 'Henry Moore', 'Leah Anderson', 'Kabir Singh', 'Grace Taylor', 'Dev Malhotra', 'Chloe Brown', 'Mateo Garcia', 'Nisha Iyer', 'James Clark', 'Meera Joshi', 'Benjamin Lee', 'Sara Miller', 'Vihaan Desai', 'Amelia Scott', 'Aditya Shah', 'Ella Walker', 'Karan Bhat', 'Harper Young', 'Neil Menon', 'Ava Harris', 'Samir Kulkarni', 'Mia King', 'Rahul Jain', 'Isla Wright'];
const categories = ['Bowls', 'Indian Classics', 'Breakfast', 'Salads', 'Sides', 'Desserts'];

async function idMap(model: 'allergen' | 'dietaryTag' | 'kitchenStation' | 'portionSize', names: readonly string[]) {
  const result = new Map<string, string>();
  for (const name of names) {
    const record = await (prisma[model] as any).upsert({ where: { name }, create: { name }, update: { isActive: true } });
    result.set(name, record.id);
  }
  return result;
}

async function seedStaffUsers() {
  for (const [email, name, role] of staff) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, role: true, isActive: true } });
    const passwordHash = existing && await bcrypt.compare('Test@1234', existing.passwordHash) ? existing.passwordHash : await bcrypt.hash('Test@1234', 12);
    if (!existing) await prisma.user.create({ data: { email, name, passwordHash, role, isActive: true } });
    else await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, role, isActive: true } });
  }
}

async function seed() {
  console.log('Seeding staff and reference data...');
  await seedStaffUsers();
  const allergenIds = await idMap('allergen', allergens);
  const dietaryIds = await idMap('dietaryTag', dietaryTags);
  const stationIds = await idMap('kitchenStation', stations);
  const portionIds = await idMap('portionSize', portions);
  const driver = await prisma.user.findUniqueOrThrow({ where: { email: 'driver@test.com' } });
  console.log('Seeding pricing tiers and companies...');
  const tiers = new Map<string, string>();
  const tierDefinitions = [['Standard', true], ['Enterprise', false], ['Partner', false]] as const;
  for (const [name, isDefault] of tierDefinitions) {
    const tier = await prisma.priceTier.upsert({ where: { name }, create: { name, isDefault, isActive: true }, update: { isDefault, isActive: true } });
    tiers.set(name, tier.id);
  }
  await prisma.priceTier.update({ where: { id: tiers.get('Enterprise')! }, data: { derivationType: PriceDerivationType.TIER_PERCENTAGE, sourceTierId: tiers.get('Standard')!, percentage: '10' } });
  await prisma.priceTier.update({ where: { id: tiers.get('Partner')! }, data: { derivationType: PriceDerivationType.COST_MULTIPLIER, costMultiplier: '2.20' } });

  const companyRecords = [];
  for (let index = 0; index < companies.length; index += 1) {
    const [name, domain, label, addressLine1, city, state, postalCode] = companies[index]!;
    const company = await prisma.company.upsert({
      where: { externalId: `seed-company-${index + 1}` },
      create: { externalId: `seed-company-${index + 1}`, name, billingContactName: `${name} Billing`, billingContactEmail: `billing@${domain}`, billingContactPhone: `+1 555 21${String(index).padStart(2, '0')} 0100`, defaultDeliveryTime: '12:00', defaultPackaging: PackagingType.STANDARD, driverInstructions: 'Use the main reception entrance.', priceTierId: (index % 3 === 0 ? tiers.get('Enterprise') : index % 3 === 1 ? tiers.get('Partner') : tiers.get('Standard'))!, emailDomains: { create: { domain } }, deliveryAddresses: { create: { label, addressLine1, city, state, postalCode } } },
      update: { name, billingContactName: `${name} Billing`, billingContactEmail: `billing@${domain}`, priceTierId: (index % 3 === 0 ? tiers.get('Enterprise') : index % 3 === 1 ? tiers.get('Partner') : tiers.get('Standard'))!, defaultDriverId: driver.id },
    });
    const address = await prisma.companyDeliveryAddress.findFirstOrThrow({ where: { companyId: company.id }, orderBy: { createdAt: 'asc' } });
    await prisma.company.update({ where: { id: company.id }, data: { defaultDriverId: driver.id, defaultDeliveryAddressId: address.id } });
    companyRecords.push({ ...company, address });
  }

  const employeeRecords = [];
  console.log('Seeding employees...');
  for (let index = 0; index < people.length; index += 1) {
    const company = companyRecords[index % companyRecords.length]!;
    const email = `${people[index]!.toLowerCase().replace(/[^a-z]+/g, '.')}@${companies[index % companies.length]![1]}`;
    const data = { name: people[index]!, email, phone: `+1 555 4${String(index).padStart(3, '0')} 0100`, companyId: company.id, canChooseOwnDeliveryAddress: index % 3 === 0, canChangeDeliveryTime: index % 4 === 0, canChangePackaging: index % 5 === 0, allergies: { connect: index % 4 === 0 ? [{ id: allergenIds.get('Milk')! }] : [] }, dietaryPreferences: { connect: index % 3 === 0 ? [{ id: dietaryIds.get('Vegetarian')! }] : index % 5 === 0 ? [{ id: dietaryIds.get('Vegan')! }] : [] } };
    const existing = await prisma.employee.findFirst({ where: { email } });
    const employee = existing ? await prisma.employee.update({ where: { id: existing.id }, data }) : await prisma.employee.create({ data });
    employeeRecords.push(employee);
  }
  for (let index = 0; index < companyRecords.length; index += 1) await prisma.company.update({ where: { id: companyRecords[index]!.id }, data: { ownerEmployeeId: employeeRecords[index]!.id } });

  const dishRecords = [];
  console.log('Seeding dishes and prices...');
  for (let index = 0; index < dishData.length; index += 1) {
    const [name, description, sku, costPrice, temperature, station] = dishData[index]!;
    const dish = await prisma.dish.upsert({ where: { sku }, create: { name, description, sku, costPrice: String(costPrice), temperature: temperature as DishTemperature, kitchenStationId: stationIds.get(station)!, ...(index % 6 === 0 ? { minimumOrderQuantity: 2 } : {}), allergens: { connect: index % 4 === 0 ? [{ id: allergenIds.get('Milk')! }] : [] }, dietaryTags: { connect: index % 3 === 0 ? [{ id: dietaryIds.get('Vegetarian')! }] : index % 5 === 0 ? [{ id: dietaryIds.get('Vegan')! }] : [] } }, update: { name, description, costPrice: String(costPrice), temperature: temperature as DishTemperature, kitchenStationId: stationIds.get(station)!, isActive: true } });
    dishRecords.push(dish);
    for (const [tierName, multiplier] of [['Standard', 1.45], ['Enterprise', 1.6], ['Partner', 1.35]] as const) await prisma.dishPrice.upsert({ where: { dishId_tierId: { dishId: dish.id, tierId: tiers.get(tierName)! } }, create: { dishId: dish.id, tierId: tiers.get(tierName)!, price: (Number(costPrice) * multiplier).toFixed(2) }, update: { price: (Number(costPrice) * multiplier).toFixed(2) } });
  }

  const optionRecords = [];
  console.log('Seeding options and prices...');
  for (let index = 0; index < optionNames.length; index += 1) {
    console.log(`Option ${index + 1}/${optionNames.length}: ${optionNames[index]}`);
    const name = optionNames[index]!;
    const cost = (index < 3 ? 1.75 : index < 7 ? 0.75 : 0.5 + (index % 4) * 0.15).toFixed(2);
    const existing = await prisma.option.findFirst({ where: { name } });
    const option = existing ? await prisma.option.update({ where: { id: existing.id }, data: { cost, isActive: true } }) : await prisma.option.create({ data: { name, cost, allergens: { connect: name === 'Thai Peanut Sauce' ? [{ id: allergenIds.get('Peanuts')! }] : [] }, dietaryTags: { connect: name === 'Tofu' ? [{ id: dietaryIds.get('Vegan')! }] : [] } } });
    optionRecords.push(option);
    await prisma.optionPrice.deleteMany({ where: { optionId: option.id } });
    await prisma.optionPrice.createMany({ data: ['Standard', 'Enterprise', 'Partner'].map((tierName) => ({ optionId: option.id, tierId: tiers.get(tierName)!, price: (Number(cost) * 1.35).toFixed(2) })) });
  }

  for (let index = 0; index < categories.length; index += 1) {
    console.log(`Category ${index + 1}/${categories.length}: ${categories[index]}`);
    const category = await prisma.menuCategory.findFirst({ where: { name: categories[index]! } }) ?? await prisma.menuCategory.create({ data: { name: categories[index]!, displayOrder: index } });
    const matches = dishRecords.filter((_, dishIndex) => {
      if (index === 0) return dishIndex < 8;
      if (index === 1) return dishIndex >= 8 && dishIndex < 14;
      if (index === 2) return dishIndex >= 14 && dishIndex < 19;
      if (index === 3) return dishIndex >= 19 && dishIndex < 23;
      if (index === 5) return dishIndex >= 23;
      return dishIndex < 4;
    });
    for (let itemIndex = 0; itemIndex < matches.length; itemIndex += 1) await prisma.menuCategoryDish.upsert({ where: { categoryId_dishId: { categoryId: category.id, dishId: matches[itemIndex]!.id } }, create: { categoryId: category.id, dishId: matches[itemIndex]!.id, displayOrder: itemIndex }, update: { displayOrder: itemIndex, isActive: true } });
    console.log(`  linked ${matches.length} dishes`);
  }
  console.log('Seeding menu categories and option groups...');
  const secret = await prisma.menuCategory.findFirstOrThrow({ where: { name: 'Desserts' } });
  await prisma.menuCategory.update({ where: { id: secret.id }, data: { secret: true } });

  const groupSpecs = [['Choose your protein', true, ['Paneer', 'Tofu', 'Chickpeas']], ['Choose your base', true, ['Brown Rice', 'Jeera Rice', 'Quinoa']], ['Add a side', false, ['Raita', 'Papad', 'Mixed Salad']], ['Sauce', false, ['Mint Chutney', 'Green Chutney']]] as const;
  for (let dishIndex = 0; dishIndex < 8; dishIndex += 1) {
    for (let groupIndex = 0; groupIndex < groupSpecs.length; groupIndex += 1) {
      const [name, isRequired, names] = groupSpecs[groupIndex]!;
      const dish = dishRecords[dishIndex]!;
      const group = await prisma.optionGroup.findFirst({ where: { dishId: dish.id, name } }) ?? await prisma.optionGroup.create({ data: { dishId: dish.id, name, isRequired, displayOrder: groupIndex, usesPortions: groupIndex === 1 } });
      for (let optionIndex = 0; optionIndex < names.length; optionIndex += 1) {
        const option = optionRecords.find((item) => item.name === names[optionIndex])!;
        const link = await prisma.optionGroupOption.upsert({ where: { groupId_optionId: { groupId: group.id, optionId: option.id } }, create: { groupId: group.id, optionId: option.id, displayOrder: optionIndex }, update: { displayOrder: optionIndex } });
        if (groupIndex === 1) for (let portionIndex = 0; portionIndex < portions.length; portionIndex += 1) {
          const portion = await prisma.optionGroupPortion.upsert({ where: { groupId_portionSizeId: { groupId: group.id, portionSizeId: portionIds.get(portions[portionIndex]!)! } }, create: { groupId: group.id, portionSizeId: portionIds.get(portions[portionIndex]!)!, displayOrder: portionIndex, extraCharge: portionIndex ? '1.50' : '0.00' }, update: { extraCharge: portionIndex ? '1.50' : '0.00' } });
          await prisma.optionGroupOptionPortion.upsert({ where: { optionGroupOptionId_optionGroupPortionId: { optionGroupOptionId: link.id, optionGroupPortionId: portion.id } }, create: { optionGroupOptionId: link.id, optionGroupPortionId: portion.id }, update: {} });
        }
      }
    }
  }
  await prisma.companyHiddenCategory.createMany({ data: [{ companyId: companyRecords[1]!.id, categoryId: secret.id }], skipDuplicates: true });
  await prisma.companyHiddenDish.createMany({ data: [{ companyId: companyRecords[2]!.id, dishId: dishRecords[0]!.id }, { companyId: companyRecords[3]!.id, dishId: dishRecords[10]!.id }], skipDuplicates: true });
  console.log(`Seeded ${companies.length} companies, ${employeeRecords.length} employees, ${dishRecords.length} dishes, ${optionRecords.length} options.`);
}

seed().catch((error: unknown) => { console.error('Business seed failed', error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());

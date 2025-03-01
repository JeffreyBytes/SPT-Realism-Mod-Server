"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotLoader = void 0;
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const utils_1 = require("../utils/utils");
const seasonalevents_1 = require("../misc/seasonalevents");
const arrays_1 = require("../utils/arrays");
const enums_1 = require("../utils/enums");
const scavLO = require("../../db/bots/loadouts/scavs/scavLO.json");
const bearLO = require("../../db/bots/loadouts/PMCs/bearLO.json");
const usecLO = require("../../db/bots/loadouts/PMCs/usecLO.json");
const tier5LO = require("../../db/bots/loadouts/PMCs/tier5PMC.json");
const raiderLO = require("../../db/bots/loadouts/special/raiderLO.json");
const zombieLO = require("../../db/bots/loadouts/special/zombieLO.json");
const rogueLO = require("../../db/bots/loadouts/special/rogueLO.json");
const knightLO = require("../../db/bots/loadouts/bosses/goons/knightLO.json");
const bigpipeLO = require("../../db/bots/loadouts/bosses/goons/bigpipeLO.json");
const birdeyeLO = require("../../db/bots/loadouts/bosses/goons/birdeyeLO.json");
const killaLO = require("../../db/bots/loadouts/bosses/killaLO.json");
const tagillaLO = require("../../db/bots/loadouts/bosses/tagillaLO.json");
const saniLO = require("../../db/bots/loadouts/bosses/sanitar/sanitarLO.json");
const saniFollowerLO = require("../../db/bots/loadouts/bosses/sanitar/sanitarfollowerLO.json");
const reshLO = require("../../db/bots/loadouts/bosses/reshalla/reshallaLO.json");
const reshFollowerLO = require("../../db/bots/loadouts/bosses/reshalla/reshallafollowerLO.json");
const cultistLO = require("../../db/bots/loadouts/special/cultistLO.json");
const priestLO = require("../../db/bots/loadouts/special/priestLO.json");
const botHealth = require("../../db/bots/botHealth.json");
const rmBotConfig = require("../../db/bots/botconfig.json");
const USECNames = require("../../db/bots/names/USECNames.json");
const bearNames = require("../../db/bots/names/bearNames.json");
const pmcTypes = require("../../db/bots/pmcTypes.json");
const keys = require("../../db/bots/loadouts/templates/keys.json");
const realismAmmo = require("../../db/bots/loadouts/templates/pmc_ammo_realism.json");
const vanillaAmmo = require("../../db/bots/loadouts/templates/pmc_ammo_vanilla.json");
const lootOdds = require("../../db/bots/loadouts/templates/lootOdds.json");
const pmcLootLimits = require("../../db/bots/loadouts/PMCs/PMCLootLimitCat.json");
const userItems = require("../../db/bots/user_bot_templates/items_to_add.json");
const userAmmo = require("../../db/bots/user_bot_templates/ammo_to_add.json");
class BotLoader {
    logger;
    tables;
    configServ;
    modConfig;
    arrays;
    utils;
    scavBase;
    usecBase;
    bearBase;
    raiderBase;
    rogueBase;
    knightBase;
    bigpipeBase;
    birdeyeBase;
    killaBase;
    tagillaBase;
    saniBase;
    saniFollowerBase;
    reshBase;
    reshFollowerBase;
    priestBase;
    cultBase;
    mapDB() {
        return this.tables.locations;
    }
    botConf() {
        return this.configServ.getConfig(ConfigTypes_1.ConfigTypes.BOT);
    }
    botConfPMC() {
        return this.configServ.getConfig(ConfigTypes_1.ConfigTypes.PMC);
    }
    itemDB() {
        return this.tables.templates.items;
    }
    armorModsData = {};
    allValidArmorSlots = [
        "front_plate",
        "back_plate",
        "left_side_plate",
        "right_side_plate",
        "soft_armor_front",
        "soft_armor_back",
        "soft_armor_left",
        "soft_armor_right",
        "collar",
        "shoulder_l",
        "shoulder_r",
        "groin",
        "groin_back",
        "helmet_top",
        "helmet_back",
        "helmet_ears",
        "helmet_eyes",
        "helmet_jaw"
    ];
    constructor(logger, tables, configServ, modConfig, arrays, utils) {
        this.logger = logger;
        this.tables = tables;
        this.configServ = configServ;
        this.modConfig = modConfig;
        this.arrays = arrays;
        this.utils = utils;
        this.intitailizeBotDbRefs();
    }
    static instance;
    static getInstance(logger, tables, configServ, modConfig, arrays, utils) {
        if (!BotLoader.instance)
            BotLoader.instance = new BotLoader(logger, tables, configServ, modConfig, arrays, utils);
        return BotLoader.instance;
    }
    intitailizeBotDbRefs() {
        const botDB = this.tables.bots.types;
        this.scavBase = botDB["assault"];
        this.usecBase = botDB["usec"];
        this.bearBase = botDB["bear"];
        this.raiderBase = botDB["pmcbot"];
        this.rogueBase = botDB["exusec"];
        this.knightBase = botDB["bossknight"];
        this.bigpipeBase = botDB["followerbigpipe"];
        this.birdeyeBase = botDB["followerbirdeye"];
        this.killaBase = botDB["bosskilla"];
        this.tagillaBase = botDB["bosstagilla"];
        this.saniBase = botDB["bosssanitar"];
        this.saniFollowerBase = botDB["followersanitar"];
        this.reshBase = botDB["bossbully"];
        this.reshFollowerBase = botDB["followerbully"];
        this.priestBase = botDB["sectantpriest"];
        this.cultBase = botDB["sectantwarrior"];
    }
    loadBots() {
        if (this.modConfig.dynamic_loot_pmcs === true)
            this.botConfPMC().looseWeaponInBackpackChancePercent = 0;
        this.genArmorMods();
        this.setBotSkills();
        this.adjustBotLootWeights();
        this.adjustEquipmentTemplates();
        this.pushGearMods();
        this.adjustPlayerScavs();
        if (this.modConfig.logEverything == true) {
            this.logger.info("Bots Loaded");
        }
    }
    adjustBotLootWeights() {
        this.botConfPMC().vestLoot.whitelist = [];
        this.botConfPMC().vestLoot.blacklist = [];
        this.botConfPMC().pocketLoot.whitelist = [];
        this.botConfPMC().pocketLoot.blacklist = [];
        this.botConfPMC().backpackLoot.whitelist = [];
        this.botConfPMC().backpackLoot.blacklist = [];
        this.botConfPMC().vestLoot.blacklist.push(...arrays_1.StaticArrays.botLootBlacklist);
        this.botConfPMC().pocketLoot.blacklist.push(...arrays_1.StaticArrays.botLootBlacklist);
        this.botConfPMC().backpackLoot.blacklist.push(...arrays_1.StaticArrays.botLootBlacklist);
    }
    adjustEquipmentTemplates() {
        const botEquipmentTemplate = {
            "weaponModLimits": {
                "scopeLimit": 2,
                "lightLaserLimit": 2
            },
            "lightIsActiveDayChancePercent": 50,
            "lightIsActiveNightChancePercent": 50,
            "laserIsActiveChancePercent": 50,
            "faceShieldIsActiveChancePercent": 100,
            "nvgIsActiveChanceNightPercent": 50,
            "nvgIsActiveChanceDayPercent": 50,
            "weightingAdjustmentsByPlayerLevel": [],
            "weightingAdjustmentsByBotLevel": [],
            "weaponSightWhitelist": {},
            "randomisation": [],
            "blacklist": [],
            "whitelist": [],
            "forceStock": true,
            "filterPlatesByLevel": true,
            "weaponSlotIdsToMakeRequired": [],
            "forceOnlyArmoredRigWhenNoArmor": false,
        };
        this.botConf().equipment["assault"] = botEquipmentTemplate;
        this.botConf().equipment["pmcbot"] = botEquipmentTemplate;
        this.botConf().equipment["exusec"] = botEquipmentTemplate;
        this.botConf().equipment["bossknight"] = botEquipmentTemplate;
        this.botConf().equipment["followerbigpipe"] = botEquipmentTemplate;
        this.botConf().equipment["followerbirdeye"] = botEquipmentTemplate;
        this.botConf().equipment["bosskilla"] = botEquipmentTemplate;
        this.botConf().equipment["bosstagilla"] = botEquipmentTemplate;
        this.botConf().equipment["bosssanitar"] = botEquipmentTemplate;
        this.botConf().equipment["followersanitar"] = botEquipmentTemplate;
        this.botConf().equipment["bossbully"] = botEquipmentTemplate;
        this.botConf().equipment["followerbossbully"] = botEquipmentTemplate;
        this.botConf().equipment["pmc"] = botEquipmentTemplate;
        this.botConf().equipment["pmc"].weaponModLimits.scopeLimit = 100;
        this.botConf().equipment["pmc"].weaponModLimits.lightLaserLimit = 2;
        this.botConf().equipment["pmc"].randomisation = [];
        this.botConf().equipment["pmc"].blacklist = [];
        this.botConf().itemSpawnLimits["pmc"] = pmcLootLimits.PMCLootLimit1;
        this.botConf().equipment["pmc"].weightingAdjustmentsByBotLevel = [];
        this.botConf().equipment["pmc"].weightingAdjustmentsByPlayerLevel = [];
        this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 100;
        this.botConf().equipment["pmc"].filterPlatesByLevel = true;
    }
    adjustPlayerScavs() {
        this.botConf().playerScavBrainType = pmcTypes.playerScavBrainType;
        this.botConf().chanceAssaultScavHasPlayerScavName = 0;
    }
    addGasMaskFilters(mods) {
        arrays_1.StaticArrays.gasMasks.forEach(g => {
            mods[g] = {
                "mod_equipment": [
                    "590c595c86f7747884343ad7"
                ]
            };
        });
    }
    addArmorInserts(mods) {
        if (mods == null)
            return;
        Object.keys(this.armorModsData).forEach(outerKey => {
            // If the outer key exists in mods, compare inner keys
            if (mods[outerKey]) {
                Object.keys(this.armorModsData[outerKey]).forEach(innerKey => {
                    // If the inner key doesn't exist in mods, insert it
                    if (!mods[outerKey][innerKey]) {
                        mods[outerKey][innerKey] = JSON.parse(JSON.stringify(this.armorModsData[outerKey][innerKey]));
                    }
                });
            }
            //if mods doesnt have the outer key, insert it
            else {
                mods[outerKey] = JSON.parse(JSON.stringify(this.armorModsData[outerKey]));
            }
        });
    }
    //thse bots have their .mods obj overwritten, so I can't assign like I do for the other bots
    pushGearModsHelper(botLO) {
        for (const tier in botLO) {
            const mods = botLO[tier]?.inventory?.mods;
            if (mods) {
                this.addArmorInserts(mods);
                this.addGasMaskFilters(mods);
            }
        }
    }
    pushGearMods() {
        //I don't like it, but it is what it is
        this.pushGearModsHelper(scavLO);
        this.pushGearModsHelper(bearLO);
        this.pushGearModsHelper(usecLO);
        this.pushGearModsHelper(tier5LO);
        this.pushGearModsHelper(raiderLO);
        this.pushGearModsHelper(rogueLO);
        this.pushGearModsHelper(knightLO);
        this.pushGearModsHelper(bigpipeLO);
        this.pushGearModsHelper(killaLO);
        this.pushGearModsHelper(tagillaLO);
        this.pushGearModsHelper(saniLO);
        this.pushGearModsHelper(saniFollowerLO);
        this.pushGearModsHelper(reshLO);
        this.pushGearModsHelper(reshFollowerLO);
    }
    genArmorMods() {
        for (let i in this.itemDB()) {
            let serverItem = this.itemDB()[i];
            if ((serverItem._parent === enums_1.ParentClasses.ARMORVEST ||
                serverItem._parent === enums_1.ParentClasses.CHESTRIG ||
                serverItem._parent === enums_1.ParentClasses.HEADWEAR ||
                serverItem._parent === enums_1.ParentClasses.FACECOVER)) {
                this.storeArmorMods(i, serverItem);
            }
        }
    }
    storeArmorMods(index, serverItem) {
        let armorObj = this.extractArmorData(serverItem);
        if (armorObj != null)
            this.armorModsData[index] = this.extractArmorData(serverItem);
    }
    extractArmorData(serverItem) {
        let armor = {};
        if (!Array.isArray(serverItem._props.Slots) || serverItem._props.Slots.length == 0) {
            return null;
        }
        for (const slot of serverItem._props.Slots) {
            if (this.allValidArmorSlots.includes(slot._name.toLowerCase())) {
                let slotItems = [];
                for (const filter of slot._props.filters) {
                    for (const item of filter.Filter) {
                        slotItems.push(item);
                    }
                }
                armor[slot._name] = slotItems;
            }
        }
        return armor;
    }
    mergeHelper(loadOutItems, newItems) {
        for (let key in newItems) {
            if (!loadOutItems.hasOwnProperty(key) && this.itemDB()[key]) {
                loadOutItems[key] = JSON.parse(JSON.stringify(newItems[key]));
            }
        }
    }
    mergeLoot(botTier, userTier) {
        this.mergeHelper(botTier.inventory.items.TacticalVest, userTier.loot.TacticalVest);
        this.mergeHelper(botTier.inventory.items.Pockets, userTier.loot.Pockets);
        this.mergeHelper(botTier.inventory.items.Backpack, userTier.loot.Backpack);
        this.mergeHelper(botTier.inventory.items.SecuredContainer, userTier.loot.SecuredContainer);
        this.mergeHelper(botTier.inventory.items.SpecialLoot, userTier.loot.SpecialLoot);
    }
    mergeAmmo(botTier, ammoTier) {
        for (const c in botTier.inventory.Ammo) {
            const originlCaliber = botTier.inventory.Ammo[c];
            const userCaliber = ammoTier[c];
            this.mergeHelper(originlCaliber, userCaliber);
        }
    }
    getWeaponRecord(userTier, mapType) {
        const weaponMap = {
            [utils_1.MapType.Urban]: userTier.FirstPrimaryWeapon_urban,
            [utils_1.MapType.Outdoor]: userTier.FirstPrimaryWeapon_outdoor,
            [utils_1.MapType.CQB]: userTier.FirstPrimaryWeapon_cqb,
        };
        return weaponMap[mapType];
    }
    getPropertyNames(path) {
        return path.split('.');
    }
    //split the string path to get the property string names
    //use that property name string as the key to retrieve the actual json object
    getJsonObj(file, path) {
        const properties = this.getPropertyNames(path);
        let result = file;
        for (const key of properties) {
            result = result?.[key];
        }
        return result;
    }
    mergeWithUserEquipmentItems(botTier, dataPath) {
        const userTier = this.getJsonObj(userItems, dataPath);
        const ammoTier = this.getJsonObj(userAmmo, dataPath);
        let primaryWeapon = this.getWeaponRecord(userTier, utils_1.RaidInfoTracker.mapType) ?? userTier.FirstPrimaryWeapon;
        if (Object.keys(primaryWeapon).length === 0)
            primaryWeapon = userTier.FirstPrimaryWeapon;
        const helmets = utils_1.RaidInfoTracker.isNight && userTier.Headwear_night != null ? userTier.Headwear_night : userTier.Headwear;
        this.mergeHelper(botTier.inventory.equipment.FirstPrimaryWeapon, primaryWeapon);
        this.mergeHelper(botTier.inventory.equipment.SecondPrimaryWeapon, userTier.SecondPrimaryWeapon);
        this.mergeHelper(botTier.inventory.equipment.Holster, userTier.Holster);
        this.mergeHelper(botTier.inventory.equipment.Scabbard, userTier.Scabbard);
        this.mergeHelper(botTier.inventory.equipment.ArmBand, userTier.ArmBand);
        this.mergeHelper(botTier.inventory.equipment.Backpack, userTier.Backpack);
        this.mergeHelper(botTier.inventory.equipment.Earpiece, userTier.Earpiece);
        this.mergeHelper(botTier.inventory.equipment.Eyewear, userTier.Eyewear);
        this.mergeHelper(botTier.inventory.equipment.FaceCover, userTier.FaceCover);
        this.mergeHelper(botTier.inventory.equipment.TacticalVest, userTier.TacticalVest);
        this.mergeHelper(botTier.inventory.equipment.Headwear, helmets);
        this.mergeHelper(botTier.inventory.equipment.ArmorVest, userTier.ArmorVest);
        this.mergeHelper(botTier.appearance.body, userTier.appearance.body);
        this.mergeHelper(botTier.appearance.feet, userTier.appearance.feet);
        this.mergeLoot(botTier, userTier);
        this.mergeAmmo(botTier, ammoTier);
    }
    loadBotLootChanges() {
        for (const i in this.tables.bots.types) {
            this.botConf().lootItemResourceRandomization[i] =
                {
                    "food": {
                        "chanceMaxResourcePercent": 30,
                        "resourcePercent": 40
                    },
                    "meds": {
                        "chanceMaxResourcePercent": 50,
                        "resourcePercent": 40
                    }
                };
        }
    }
    botNames() {
        this.usecBase.firstName = USECNames.firstName;
        this.usecBase.lastName = USECNames.lastName;
        if (this.modConfig.cyrillic_bear_names == false) {
            this.bearBase.firstName = bearNames.firstName;
            this.bearBase.lastName = bearNames.lastName;
        }
        if (this.modConfig.cyrillic_bear_names == true) {
            this.bearBase.firstName = bearNames.firstNameCyr;
            this.bearBase.lastName = bearNames.lastNameCyr;
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("Bot Names Changed");
        }
    }
    bossDifficulty() {
        for (let i in this.mapDB()) {
            let mapBase = this.mapDB()[i]?.base;
            if (mapBase != null && mapBase?.BossLocationSpawn != null) {
                let bossLocationSpawn = mapBase.BossLocationSpawn;
                for (let k in bossLocationSpawn) {
                    let boss = bossLocationSpawn[k];
                    boss.BossDifficult = "hard";
                    boss.BossEscortDifficult = "hard";
                }
            }
        }
    }
    increaseBotCap() {
        this.botConf().maxBotCap = rmBotConfig.maxBotCapHigh;
        this.botConf().presetBatch = rmBotConfig.presetBatch;
    }
    testBotCap() {
        this.botConf().maxBotCap = rmBotConfig.testBotCap;
        this.botConf().presetBatch = rmBotConfig.presetBatch;
    }
    increasePerformance() {
        this.botConf().maxBotCap = rmBotConfig.maxBotCapLow;
        this.botConf().presetBatch = rmBotConfig.presetBatch;
    }
    setBotSkills() {
        const highSkill = {
            "min": 5100,
            "max": 5000
        };
        const midSkill = {
            "min": 1000,
            "max": 2000
        };
        const lowSkill = {
            "min": 100,
            "max": 1000
        };
        for (let bot in this.arrays.botArr) {
            let botType = this.arrays.botArr[bot];
            if (botType.skills?.Common == null) {
                botType.skills.Common = [];
            }
            if (!bot.includes("assault"))
                botType.skills.Common["Vitality"] = highSkill; //prevent bleedouts
            botType.skills.Common["BotReload"] = lowSkill;
            botType.skills.Common["BotSound"] = midSkill;
            botType.skills.Common["Strength"] = midSkill;
            botType.skills.Common["Endurance"] = midSkill;
            botType.skills.Common["Immunity"] = midSkill;
            botType.skills.Common["Health"] = midSkill;
        }
    }
    //stops bots from bleeding out too often with medical changes enabled
    setBotHealth() {
        this.setBotHPHelper(this.arrays.standardBotHPArr);
        if (this.modConfig.realistic_boss_health == true) {
            this.setBotHPHelper(this.arrays.bossBotArr);
            this.knightBase.health = knightLO.health;
            this.bigpipeBase.health = bigpipeLO.health;
            this.birdeyeBase.health = birdeyeLO.health;
            this.killaBase.health = killaLO.health;
            this.tagillaBase.health = tagillaLO.health;
            this.saniBase.health = saniLO.health;
            this.reshBase.health = reshLO.health;
        }
        if (this.modConfig.realistic_boss_follower_health == true) {
            this.setBotHPHelper(this.arrays.bossFollowerArr);
            this.saniFollowerBase.health = saniFollowerLO.health;
            this.reshFollowerBase.health = reshFollowerLO.health;
        }
        if (this.modConfig.realistic_raider_rogue_health == true) {
            this.setBotHPHelper(this.arrays.rogueRaiderArr);
            this.raiderBase.health = raiderLO.health;
        }
        if (this.modConfig.realistic_zombies == true) {
            this.setBotHPFromArr(this.arrays.zombiesArr, zombieLO.health);
        }
        if (this.modConfig.realistic_cultist_health == true) {
            this.priestBase.health = priestLO.health;
            this.cultBase.health = cultistLO.health;
        }
    }
    setBotHPHelper(botArr) {
        for (let bot of botArr) {
            for (let botPartSet of bot.health.BodyParts) {
                for (let part in botPartSet) {
                    for (let tempPart in botHealth.health.BodyParts[0]) {
                        if (part === tempPart) {
                            botPartSet[part].min = botHealth.health.BodyParts[0][tempPart].min;
                            botPartSet[part].max = botHealth.health.BodyParts[0][tempPart].max;
                        }
                    }
                }
            }
            bot.health.Temperature = botHealth.health.Temperature;
        }
    }
    setBotHPFromArr(botArr, healthObj) {
        for (let zombie of botArr) {
            zombie.health = healthObj;
        }
    }
    //this thing is demonic and cursed
    botHpMulti() {
        this.botHPMultiHelper(this.arrays.standardBotHPArr, this.modConfig.standard_bot_hp_multi);
        this.botHPMultiHelper(this.arrays.midBotHPArr, this.modConfig.mid_bot_hp_multi);
        this.botHPMultiHelper(this.arrays.bossBotArr, this.modConfig.boss_bot_hp_multi);
        //sanity check
        if (this.modConfig.logEverything == true) {
            this.logger.info("Killa chest health = " + this.tables.bots.types["bosskilla"].health.BodyParts[0].Chest.max);
            this.logger.info("Killa vitality = " + this.tables.bots.types["bosskilla"].skills.Common["Vitality"].min);
            this.logger.info("USEC chest health = " + this.tables.bots.types["usec"].health.BodyParts[0].Chest.min);
            this.logger.info("Bear chest health = " + this.tables.bots.types["bear"].health.BodyParts[0].Chest.min);
            this.logger.info("USEC head health = " + this.tables.bots.types["usec"].health.BodyParts[0].Head.min);
            this.logger.info("Bear head health = " + this.tables.bots.types["bear"].health.BodyParts[0].Head.min);
            this.logger.info("Bear leg health = " + this.tables.bots.types["bear"].health.BodyParts[0].LeftLeg.min);
            this.logger.info("Bear arm health = " + this.tables.bots.types["bear"].health.BodyParts[0].LeftArm.min);
            this.logger.info("Scav head health  max = " + this.tables.bots.types["assault"].health.BodyParts[0].Head.max);
            this.logger.info("Scav chest health  max = " + this.tables.bots.types["assault"].health.BodyParts[0].Chest.max);
            this.logger.info("Scav leg health max = " + this.tables.bots.types["assault"].health.BodyParts[0].LeftLeg.max);
            this.logger.info("Scav arm health  max = " + this.tables.bots.types["assault"].health.BodyParts[0].LeftArm.max);
            this.logger.info("Scav stomach health  max = " + this.tables.bots.types["assault"].health.BodyParts[0].Stomach.max);
            this.logger.info("Cultist chest health = " + this.tables.bots.types["sectantwarrior"].health.BodyParts[0].Chest.max);
            this.logger.info("Bot Health Set");
        }
    }
    //the devil himself
    botHPMultiHelper(botArr, multi) {
        for (let bot of botArr) {
            for (let botPartSet of bot.health.BodyParts) {
                for (let part in botPartSet) {
                    botPartSet[part].min = Math.round(botPartSet[part].min * multi);
                    botPartSet[part].max = Math.round(botPartSet[part].max * multi);
                }
            }
        }
    }
    botTest(tier) {
        if (tier == 1) {
            this.botConfig1();
            this.scavLoad1();
            this.rogueLoad1();
            this.raiderLoad1();
            this.goonsLoad1();
            this.killaLoad1();
            this.tagillaLoad1();
            this.sanitarLoad1();
            this.reshallaLoad1();
            utils_1.BotTierTracker.cultTier = 1;
            this.logger.warning(`Tier ${tier} Test Selected`);
        }
        if (tier == 2) {
            this.botConfig2();
            this.scavLoad2();
            this.rogueLoad2();
            this.raiderLoad2();
            this.goonsLoad2();
            this.killaLoad2();
            this.tagillaLoad2();
            this.sanitarLoad2();
            this.reshallaLoad2();
            utils_1.BotTierTracker.cultTier = 2;
            this.logger.warning(`Tier ${tier} Test Selected`);
        }
        if (tier == 3) {
            this.botConfig3();
            this.scavLoad3();
            this.rogueLoad3();
            this.raiderLoad3();
            this.goonsLoad3();
            this.killaLoad3();
            this.tagillaLoad3();
            this.sanitarLoad3();
            this.reshallaLoad3();
            utils_1.BotTierTracker.cultTier = 3;
            this.logger.warning(`Tier ${tier} Test Selected`);
        }
        if (tier == 4 || tier == 5) {
            this.botConfig3();
            this.scavLoad3();
            this.rogueLoad3();
            this.raiderLoad3();
            this.goonsLoad3();
            this.killaLoad3();
            this.tagillaLoad3();
            this.sanitarLoad3();
            this.reshallaLoad3();
            utils_1.BotTierTracker.cultTier = 4;
            this.logger.warning(`Tier ${tier} Test Selected`);
        }
        if (this.modConfig.bot_test_weps_enabled == false) {
            this.arrays.botArr.forEach(removeWeps);
            function removeWeps(bot) {
                bot.inventory.equipment.FirstPrimaryWeapon = [];
                bot.inventory.equipment.Holster = [];
                bot.inventory.equipment.Backpack = [];
            }
            this.botConfPMC().looseWeaponInBackpackChancePercent = 0;
        }
        if (this.modConfig.all_scavs == true) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.scavTest.convertIntoPmcChance;
            this.logger.warning("All Scavs");
        }
        if (this.modConfig.all_PMCs == true) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmcTest.convertIntoPmcChance;
            this.logger.warning("All PMCs");
        }
        if (this.modConfig.all_bear == true) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmcTest.convertIntoPmcChance;
            this.botConfPMC().isUsec = 0;
            this.logger.warning("All Bear");
        }
        if (this.modConfig.all_USEC == true) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmcTest.convertIntoPmcChance;
            this.botConfPMC().isUsec = 100;
            this.logger.warning("All USEC");
        }
    }
    setBotTiers(pmcData, bots) {
        this.setBotTierHelper(pmcData, "scav", bots);
        this.setBotTierHelper(pmcData, "raider", bots);
        this.setBotTierHelper(pmcData, "rogue", bots);
        this.setBotTierHelper(pmcData, "goons", bots);
        this.setBotTierHelper(pmcData, "killa", bots);
        this.setBotTierHelper(pmcData, "tagilla", bots);
        this.setBotTierHelper(pmcData, "sanitar", bots);
        this.setBotTierHelper(pmcData, "reshalla", bots);
        this.setBotTierHelper(pmcData, "cult", bots);
    }
    setBotTierHelper(pmcData, type, bots) {
        let tier = 1;
        let tierArray = [1, 2, 3];
        if (pmcData?.Info?.Level == null)
            tier = 1;
        else if (pmcData.Info.Level <= 5) {
            tier = this.utils.probabilityWeighter(tierArray, [100, 0, 0]);
        }
        if (pmcData.Info.Level <= 10) {
            tier = this.utils.probabilityWeighter(tierArray, [100, 0, 0]);
        }
        if (pmcData.Info.Level <= 15) {
            tier = this.utils.probabilityWeighter(tierArray, [90, 10, 0]);
        }
        if (pmcData.Info.Level <= 20) {
            tier = this.utils.probabilityWeighter(tierArray, [60, 30, 0]);
        }
        if (pmcData.Info.Level <= 25) {
            tier = this.utils.probabilityWeighter(tierArray, [50, 40, 10]);
        }
        if (pmcData.Info.Level <= 30) {
            tier = this.utils.probabilityWeighter(tierArray, [40, 40, 20]);
        }
        if (pmcData.Info.Level <= 35) {
            tier = this.utils.probabilityWeighter(tierArray, [20, 40, 40]);
        }
        if (pmcData.Info.Level <= 40) {
            tier = this.utils.probabilityWeighter(tierArray, [20, 30, 50]);
        }
        if (pmcData.Info.Level > 40) {
            tier = this.utils.probabilityWeighter(tierArray, [10, 20, 70]);
        }
        if (type === "cult") {
            if (tier == 1)
                utils_1.BotTierTracker.cultTier = 1;
            if (tier == 2)
                utils_1.BotTierTracker.cultTier = 2;
            if (tier == 3)
                utils_1.BotTierTracker.cultTier = 3;
            return;
        }
        if (type === "reshalla") {
            if (tier == 1)
                bots.reshallaLoad1();
            if (tier == 2)
                bots.reshallaLoad2();
            if (tier == 3)
                bots.reshallaLoad3();
            return;
        }
        if (type === "sanitar") {
            if (tier == 1)
                bots.sanitarLoad1();
            if (tier == 2)
                bots.sanitarLoad2();
            if (tier == 3)
                bots.sanitarLoad3();
            return;
        }
        if (type === "tagilla") {
            if (tier == 1)
                bots.tagillaLoad1();
            if (tier == 2)
                bots.tagillaLoad2();
            if (tier == 3)
                bots.tagillaLoad3();
            return;
        }
        if (type === "killa") {
            if (tier == 1)
                bots.killaLoad1();
            if (tier == 2)
                bots.killaLoad2();
            if (tier == 3)
                bots.killaLoad3();
            return;
        }
        if (type === "goons") {
            if (tier == 1)
                bots.goonsLoad1();
            if (tier == 2)
                bots.goonsLoad2();
            if (tier == 3)
                bots.goonsLoad3();
            return;
        }
        if (type === "raider") {
            if (tier == 1)
                bots.raiderLoad1();
            if (tier == 2)
                bots.raiderLoad2();
            if (tier == 3)
                bots.raiderLoad3();
            return;
        }
        if (type === "rogue") {
            if (tier == 1)
                bots.rogueLoad1();
            if (tier == 2)
                bots.rogueLoad2();
            if (tier == 3)
                bots.rogueLoad3();
            return;
        }
        if (type === "scav") {
            if (tier == 1)
                bots.scavLoad1();
            if (tier == 2)
                bots.scavLoad2();
            if (tier == 3)
                bots.scavLoad3();
            return;
        }
    }
    updateBots(pmcData, logger, config, bots, utils) {
        if (config.bot_testing == true) {
            bots.botTest(config.bot_test_tier);
            logger.warning("Realism Mod: Bots Are In Test Mode");
        }
        if (config.bot_testing == false) {
            if (pmcData.Info.Level <= 16) {
                bots.botConfig1();
            }
            if (pmcData.Info.Level <= 35) {
                bots.botConfig2();
            }
            if (pmcData.Info.Level > 35) {
                bots.botConfig3();
            }
            this.setBotTiers(pmcData, bots);
            if (config.logEverything == true) {
                logger.info("Realism Mod: Bot Tiers Have Been Set");
            }
        }
        if (this.modConfig.force_boss_items == true) {
            bots.forceBossItems();
        }
        //there are bots I do not modify yet, so I need to make sure they have all armor inserts and gas mask filters
        for (const i in this.tables.bots.types) {
            let bot = this.tables.bots.types[i];
            this.addArmorInserts(bot.inventory.mods);
            this.addGasMaskFilters(bot.inventory.mods);
        }
    }
    botConfig1() {
        //Set bot armor and weapon min durability
        this.botConf().durability.pmc = rmBotConfig.durability1.pmc;
        this.botConf().durability.pmcbot = rmBotConfig.durability1.pmcbot;
        this.botConf().durability.boss = rmBotConfig.durability1.boss;
        this.botConf().durability.follower = rmBotConfig.durability1.follower;
        this.botConf().durability.assault = rmBotConfig.durability1.assault;
        this.botConf().durability.cursedassault = rmBotConfig.durability1.cursedassault;
        this.botConf().durability.marksman = rmBotConfig.durability1.marksman;
        this.botConf().durability.exusec = rmBotConfig.durability1.exusec;
        this.botConf().durability.sectantpriest = rmBotConfig.durability1.sectantpriest;
        this.botConf().durability.sectantwarrior = rmBotConfig.durability1.sectantwarrior;
        //adjust PMC max loot in rubles
        this.botConfPMC().maxBackpackLootTotalRub = rmBotConfig.pmc1.maxBackpackLootTotalRub;
        this.botConfPMC().maxPocketLootTotalRub = rmBotConfig.pmc1.maxPocketLootTotalRub;
        this.botConfPMC().maxVestLootTotalRub = rmBotConfig.pmc1.maxVestLootTotalRub;
        this.botConfPMC().looseWeaponInBackpackChancePercent = rmBotConfig.pmc1.looseWeaponInBackpackChancePercent;
        this.botConfPMC().isUsec = rmBotConfig.pmc1.isUsec;
        if (this.modConfig.spawn_waves == true && !utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbSpawnsActive) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmc1.convertIntoPmcChance;
        }
        this.botConf().itemSpawnLimits.pmc = pmcLootLimits.PMCLootLimit1;
        this.usecBase.appearance.head = usecLO.appearance.head;
        this.bearBase.appearance.head = bearLO.appearance.head;
        this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 100;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 50;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 75;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 75;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 50;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 75;
        }
        else {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 55;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 80;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 80;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 50;
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            }
        }
        if (this.modConfig.pmc_types == true && utils_1.ModTracker.sainPresent == false && utils_1.ModTracker.swagPresent == false) {
            if (!utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes2.pmcTypeDay.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes2.pmcTypeDay.sptbear;
            }
            if (utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes2.pmcTypeNight.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes2.pmcTypeNight.sptbear;
            }
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("botConfig1 loaded");
        }
    }
    botConfig2() {
        //Set bot armor and weapon min durability
        this.botConf().durability.pmc = rmBotConfig.durability2.pmc;
        this.botConf().durability.pmcbot = rmBotConfig.durability2.pmcbot;
        this.botConf().durability.boss = rmBotConfig.durability2.boss;
        this.botConf().durability.follower = rmBotConfig.durability2.follower;
        this.botConf().durability.assault = rmBotConfig.durability2.assault;
        this.botConf().durability.cursedassault = rmBotConfig.durability2.cursedassault;
        this.botConf().durability.marksman = rmBotConfig.durability2.marksman;
        this.botConf().durability.exusec = rmBotConfig.durability2.exusec;
        this.botConf().durability.sectantpriest = rmBotConfig.durability2.sectantpriest;
        this.botConf().durability.sectantwarrior = rmBotConfig.durability2.sectantwarrior;
        //adjust PMC max loot in rubles
        this.botConfPMC().maxBackpackLootTotalRub = rmBotConfig.pmc2.maxBackpackLootTotalRub;
        this.botConfPMC().maxPocketLootTotalRub = rmBotConfig.pmc2.maxPocketLootTotalRub;
        this.botConfPMC().maxVestLootTotalRub = rmBotConfig.pmc2.maxVestLootTotalRub;
        this.botConfPMC().looseWeaponInBackpackChancePercent = rmBotConfig.pmc2.looseWeaponInBackpackChancePercent;
        this.botConfPMC().isUsec = rmBotConfig.pmc2.isUsec;
        if (this.modConfig.spawn_waves == true && !utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbSpawnsActive) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmc2.convertIntoPmcChance;
        }
        this.botConf().itemSpawnLimits.pmc = pmcLootLimits.PMCLootLimit2;
        this.usecBase.appearance.head = usecLO.appearance.head;
        this.bearBase.appearance.head = bearLO.appearance.head;
        this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 100;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 15;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 50;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 75;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 50;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 75;
        }
        else {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 35;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 100;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 50;
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            }
        }
        if (this.modConfig.pmc_types == true && utils_1.ModTracker.sainPresent == false && utils_1.ModTracker.swagPresent == false) {
            if (!utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes2.pmcTypeDay.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes2.pmcTypeDay.sptbear;
            }
            if (utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes2.pmcTypeNight.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes2.pmcTypeNight.sptbear;
            }
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("boatConfig2 loaded");
        }
    }
    botConfig3() {
        //Set bot armor and weapon min durabilityf
        this.botConf().durability.pmc = rmBotConfig.durability3.pmc;
        this.botConf().durability.pmcbot = rmBotConfig.durability3.pmcbot;
        this.botConf().durability.boss = rmBotConfig.durability3.boss;
        this.botConf().durability.follower = rmBotConfig.durability3.follower;
        this.botConf().durability.assault = rmBotConfig.durability3.assault;
        this.botConf().durability.cursedassault = rmBotConfig.durability3.cursedassault;
        this.botConf().durability.marksman = rmBotConfig.durability3.marksman;
        this.botConf().durability.exusec = rmBotConfig.durability3.exusec;
        this.botConf().durability.sectantpriest = rmBotConfig.durability3.sectantpriest;
        this.botConf().durability.sectantwarrior = rmBotConfig.durability3.sectantwarrior;
        //adjust PMC max loot in rubles
        this.botConfPMC().maxBackpackLootTotalRub = rmBotConfig.pmc3.maxBackpackLootTotalRub;
        this.botConfPMC().maxPocketLootTotalRub = rmBotConfig.pmc3.maxPocketLootTotalRub;
        this.botConfPMC().maxVestLootTotalRub = rmBotConfig.pmc3.maxVestLootTotalRub;
        this.botConfPMC().looseWeaponInBackpackChancePercent = rmBotConfig.pmc3.looseWeaponInBackpackChancePercent;
        this.botConfPMC().isUsec = rmBotConfig.pmc3.isUsec;
        if (this.modConfig.spawn_waves == true && !utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbSpawnsActive) {
            this.botConfPMC().convertIntoPmcChance = rmBotConfig.pmc3.convertIntoPmcChance;
        }
        this.botConf().itemSpawnLimits.pmc = pmcLootLimits.PMCLootLimit3;
        this.usecBase.appearance.head = usecLO.appearance.head;
        this.bearBase.appearance.head = bearLO.appearance.head;
        this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 100;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 25;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 100;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 100;
        }
        else {
            this.botConf().equipment["pmc"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 15;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 100;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["pmc"].faceShieldIsActiveChancePercent = 75;
                this.botConf().equipment["pmc"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["pmc"].laserIsActiveChancePercent = 0;
            }
        }
        if (this.modConfig.pmc_types == true && utils_1.ModTracker.sainPresent == false && utils_1.ModTracker.swagPresent == false) {
            if (!utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes3.pmcTypeDay.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes3.pmcTypeDay.sptbear;
            }
            if (utils_1.RaidInfoTracker.isNight) {
                this.botConfPMC().pmcType.pmcusec = pmcTypes.BotTypes3.pmcTypeNight.sptusec;
                this.botConfPMC().pmcType.pmcbear = pmcTypes.BotTypes3.pmcTypeNight.sptbear;
            }
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("botConfig3 loaded");
        }
    }
    scavLoad1() {
        let tier1Json = JSON.parse(JSON.stringify(scavLO.scavLO1));
        this.scavBase.inventory.Ammo = tier1Json.inventory.Ammo;
        this.scavBase.inventory.equipment = tier1Json.inventory.equipment;
        this.scavBase.inventory.mods = tier1Json.inventory.mods;
        this.scavBase.chances = tier1Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier1Json.inventory.items;
            this.scavBase.generation = lootOdds.scav;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.scavBase.chances.weaponMods.mod_flashlight = 40;
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 100;
        }
        else {
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 10;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 10;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 70;
                this.botConf().equipment["assault"].laserIsActiveChancePercent = 70;
            }
        }
        if (this.modConfig.dynamic_loot_scavs === true && this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier1Json.inventory.dynamic_looting;
            this.scavBase.generation.items.backpackLoot.weights = lootOdds.dynamic_scav.items.backpackLoot.weights;
            this.scavBase.generation.items.vestLoot.weights = lootOdds.dynamic_scav.items.vestLoot.weights;
            this.scavBase.generation.items.pocketLoot.weights = lootOdds.dynamic_scav.items.pocketLoot.weights;
            this.scavBase.generation.items.drink.weights = lootOdds.dynamic_scav.items.food.weights;
            this.scavBase.generation.items.food.weights = lootOdds.dynamic_scav.items.drink.weights;
        }
        this.mergeWithUserEquipmentItems(this.scavBase, "scav.tier1");
        utils_1.BotTierTracker.scavTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("scavLoad1 loaded");
        }
    }
    scavLoad2() {
        let tier2Json = JSON.parse(JSON.stringify(scavLO.scavLO2));
        this.scavBase.inventory.Ammo = tier2Json.inventory.Ammo;
        this.scavBase.inventory.equipment = tier2Json.inventory.equipment;
        this.scavBase.inventory.mods = tier2Json.inventory.mods;
        this.scavBase.chances = tier2Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier2Json.inventory.items;
            this.scavBase.generation = lootOdds.scav;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.scavBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 90;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 90;
        }
        else {
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 10;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 10;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 80;
                this.botConf().equipment["assault"].laserIsActiveChancePercent = 80;
            }
        }
        if (this.modConfig.dynamic_loot_scavs === true && this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier2Json.inventory.dynamic_looting;
            this.scavBase.generation.items.vestLoot.weights = lootOdds.dynamic_scav.items.vestLoot.weights;
            this.scavBase.generation.items.pocketLoot.weights = lootOdds.dynamic_scav.items.pocketLoot.weights;
            this.scavBase.generation.items.drink.weights = lootOdds.dynamic_scav.items.food.weights;
            this.scavBase.generation.items.food.weights = lootOdds.dynamic_scav.items.drink.weights;
        }
        this.mergeWithUserEquipmentItems(this.scavBase, "scav.tier2");
        utils_1.BotTierTracker.scavTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("scavLoad2 loaded");
        }
    }
    scavLoad3() {
        let tier3Json = JSON.parse(JSON.stringify(scavLO.scavLO3));
        this.scavBase.inventory.Ammo = tier3Json.inventory.Ammo;
        this.scavBase.inventory.equipment = tier3Json.inventory.equipment;
        this.scavBase.inventory.mods = tier3Json.inventory.mods;
        this.scavBase.chances = tier3Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier3Json.inventory.items;
            this.scavBase.generation = lootOdds.scav;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.scavBase.chances.weaponMods.mod_flashlight = 80;
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 60;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 60;
        }
        else {
            this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 10;
            this.botConf().equipment["assault"].laserIsActiveChancePercent = 10;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["assault"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["assault"].laserIsActiveChancePercent = 90;
            }
        }
        if (this.modConfig.dynamic_loot_scavs === true && this.modConfig.bot_loot_changes === true) {
            this.scavBase.inventory.items = tier3Json.inventory.dynamic_looting;
            this.scavBase.generation.items.vestLoot.weights = lootOdds.dynamic_scav.items.vestLoot.weights;
            this.scavBase.generation.items.pocketLoot.weights = lootOdds.dynamic_scav.items.pocketLoot.weights;
            this.scavBase.generation.items.drink.weights = lootOdds.dynamic_scav.items.food.weights;
            this.scavBase.generation.items.food.weights = lootOdds.dynamic_scav.items.drink.weights;
        }
        this.mergeWithUserEquipmentItems(this.scavBase, "scav.tier3");
        utils_1.BotTierTracker.scavTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("scavLoad3 loaded");
        }
    }
    usecLoad1(botJsonTemplate) {
        let tier1Json = JSON.parse(JSON.stringify(usecLO.usecLO1));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier1USEC } : { ...vanillaAmmo.Tier1USEC };
        botJsonTemplate.inventory.equipment = tier1Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier1Json.inventory.mods;
        botJsonTemplate.chances = tier1Json.chances;
        botJsonTemplate.appearance.body = tier1Json.appearance.body;
        botJsonTemplate.appearance.feet = tier1Json.appearance.feet;
        botJsonTemplate.appearance.voice = { ...usecLO.appearance.voice };
        botJsonTemplate.experience.level = tier1Json.experience.level;
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier1Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier1 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier1_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight) {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 20;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 40;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 25;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 40;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 10;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 10;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 30;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 15;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 15;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 40;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 10;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 10;
            }
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier1Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...usecLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 10; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "usec.tier1");
        if (this.modConfig.logEverything == true) {
            this.logger.info("usecLoad1 loaded");
        }
    }
    usecLoad2(botJsonTemplate) {
        let tier2Json = JSON.parse(JSON.stringify(usecLO.usecLO2));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier2USEC } : { ...vanillaAmmo.Tier2USEC };
        botJsonTemplate.inventory.equipment = tier2Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier2Json.inventory.mods;
        botJsonTemplate.chances = tier2Json.chances;
        botJsonTemplate.appearance.body = tier2Json.appearance.body;
        botJsonTemplate.appearance.feet = tier2Json.appearance.feet;
        botJsonTemplate.appearance.voice = { ...usecLO.appearance.voice };
        botJsonTemplate.experience.level = tier2Json.experience.level;
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier2Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier2 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier2_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 50;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 40;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 60;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 50;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 50;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier2Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...usecLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["5b432c305acfc40019478128"] = 5; //gp5
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 10; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "usec.tier2");
        if (this.modConfig.logEverything == true) {
            this.logger.info("usecLoad2 loaded");
        }
    }
    usecLoad3(botJsonTemplate) {
        let tier3Json = JSON.parse(JSON.stringify(usecLO.usecLO3));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier3USEC } : { ...vanillaAmmo.Tier3USEC };
        botJsonTemplate.inventory.equipment = tier3Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier3Json.inventory.mods;
        botJsonTemplate.chances = tier3Json.chances;
        botJsonTemplate.appearance.body = tier3Json.appearance.body;
        botJsonTemplate.appearance.feet = tier3Json.appearance.feet;
        botJsonTemplate.appearance.voice = { ...usecLO.appearance.voice };
        botJsonTemplate.experience.level = tier3Json.experience.level;
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier3Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier3 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier3_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight) {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 65;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.inventory.equipment.Headwear = tier3Json.inventory.Headwear_night;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 100;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 80;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 50;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 50;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 85;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 85;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.Headwear = tier3Json.inventory.Headwear_cqb;
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier3Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...usecLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["60363c0c92ec1c31037959f5"] = 5; //gp7
            botJsonTemplate.inventory.equipment.FaceCover["5b432c305acfc40019478128"] = 15; //gp5
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 5; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "usec.tier3");
        if (this.modConfig.logEverything == true) {
            this.logger.info("usecLoad3 loaded");
        }
    }
    usecLoad4(botJsonTemplate) {
        let tier4Json = JSON.parse(JSON.stringify(usecLO.usecLO4));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier4USEC } : { ...vanillaAmmo.Tier4USEC };
        botJsonTemplate.inventory.equipment = tier4Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier4Json.inventory.mods;
        botJsonTemplate.chances = tier4Json.chances;
        botJsonTemplate.appearance.body = tier4Json.appearance.body;
        botJsonTemplate.appearance.feet = tier4Json.appearance.feet;
        botJsonTemplate.appearance.voice = { ...usecLO.appearance.voice };
        botJsonTemplate.experience.level = tier4Json.experience.level;
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier4 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier4_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 100;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.inventory.equipment.Headwear = tier4Json.inventory.Headwear_night;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 60;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 60;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 80;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 80;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 25;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 25;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.Headwear = tier4Json.inventory.Headwear_cqb;
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...usecLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
            this.addOptionalGasMasks(botJsonTemplate);
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["60363c0c92ec1c31037959f5"] = 20; //gp7
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "usec.tier4");
        if (this.modConfig.logEverything == true) {
            this.logger.info("usecLoad4 loaded");
        }
    }
    usecLoad5(botJsonTemplate) {
        let tier4Json = JSON.parse(JSON.stringify(usecLO.usecLO4));
        let tier5Json = JSON.parse(JSON.stringify(tier5LO.tier5LO));
        botJsonTemplate.inventory.items = tier4Json.inventory.items;
        botJsonTemplate.appearance.body = tier5Json.appearance_usec.body;
        botJsonTemplate.appearance.feet = tier5Json.appearance_usec.feet;
        botJsonTemplate.appearance.voice = { ...usecLO.appearance.voice };
        this.tier5PMCLoad(botJsonTemplate);
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier5 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier4_PMC_Keys };
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("usecLoad5 loaded");
        }
    }
    bearLoad1(botJsonTemplate) {
        let tier1Json = JSON.parse(JSON.stringify(bearLO.bearLO1));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier1Bear } : { ...vanillaAmmo.Tier1Bear };
        botJsonTemplate.inventory.equipment = tier1Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier1Json.inventory.mods;
        botJsonTemplate.chances = tier1Json.chances;
        botJsonTemplate.appearance.body = tier1Json.appearance.body;
        botJsonTemplate.appearance.feet = tier1Json.appearance.feet;
        botJsonTemplate.experience.level = tier1Json.experience.level;
        botJsonTemplate.appearance.voice = { ...bearLO.LowTierVoice };
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier1Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier1 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier1_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight) {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 20;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 70;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 25;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 40;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 35;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 35;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 50;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 50;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier1Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.inventory.equipment.FaceCover = { ...bearLO.FaceCoverLabs };
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 10; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "bear.tier1");
        if (this.modConfig.logEverything == true) {
            this.logger.info("bearLoad1 loaded");
        }
    }
    bearLoad2(botJsonTemplate) {
        let tier2Json = JSON.parse(JSON.stringify(bearLO.bearLO2));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier2Bear } : { ...vanillaAmmo.Tier2Bear };
        botJsonTemplate.inventory.equipment = tier2Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier2Json.inventory.mods;
        botJsonTemplate.chances = tier2Json.chances;
        botJsonTemplate.appearance.body = tier2Json.appearance.body;
        botJsonTemplate.appearance.feet = tier2Json.appearance.feet;
        botJsonTemplate.experience.level = tier2Json.experience.level;
        botJsonTemplate.appearance.voice = { ...bearLO.LowTierVoice };
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier2Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier2 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier2_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 50;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 80;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 45;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 45;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 70;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 70;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier2Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.inventory.equipment.FaceCover = { ...bearLO.FaceCoverLabs };
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["5b432c305acfc40019478128"] = 5; //gp5
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 10; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "bear.tier2");
        if (this.modConfig.logEverything == true) {
            this.logger.info("bearLoad2 loaded");
        }
    }
    bearLoad3(botJsonTemplate) {
        let tier3Json = JSON.parse(JSON.stringify(bearLO.bearLO3));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier3Bear } : { ...vanillaAmmo.Tier3Bear };
        botJsonTemplate.inventory.equipment = tier3Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier3Json.inventory.mods;
        botJsonTemplate.chances = tier3Json.chances;
        botJsonTemplate.appearance.body = tier3Json.appearance.body;
        botJsonTemplate.appearance.feet = tier3Json.appearance.feet;
        botJsonTemplate.experience.level = tier3Json.experience.level;
        botJsonTemplate.appearance.voice = { ...bearLO.HighTierVoice };
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier3Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier3 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier3_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight) {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 65;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.inventory.equipment.Headwear = tier3Json.inventory.Headwear_night;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 100;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 70;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 70;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier3Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...bearLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["60363c0c92ec1c31037959f5"] = 5; //gp7
            botJsonTemplate.inventory.equipment.FaceCover["5b432c305acfc40019478128"] = 15; //gp5
            botJsonTemplate.inventory.equipment.FaceCover["59e7715586f7742ee5789605"] = 5; //resp
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "bear.tier3");
        if (this.modConfig.logEverything == true) {
            this.logger.info("bearLoad3 loaded");
        }
    }
    bearLoad4(botJsonTemplate) {
        let tier4Json = JSON.parse(JSON.stringify(bearLO.bearLO4));
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier4Bear } : { ...vanillaAmmo.Tier4Bear };
        botJsonTemplate.inventory.equipment = tier4Json.inventory.equipment;
        botJsonTemplate.inventory.mods = tier4Json.inventory.mods;
        botJsonTemplate.chances = tier4Json.chances;
        botJsonTemplate.appearance.body = tier4Json.appearance.body;
        botJsonTemplate.appearance.feet = tier4Json.appearance.feet;
        botJsonTemplate.experience.level = tier4Json.experience.level;
        botJsonTemplate.appearance.voice = { ...bearLO.HighTierVoice };
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier4 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier4_PMC_Keys };
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 100;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.weaponMods.mod_mount = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_000 = 100;
            botJsonTemplate.chances.weaponMods.mod_mount_001 = 100;
            botJsonTemplate.chances.weaponMods.mod_tactical = 100;
            botJsonTemplate.chances.weaponMods.mod_flashlight = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.inventory.equipment.Headwear = tier4Json.inventory.Headwear_night;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 20;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 20;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier4Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...bearLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
            this.addOptionalGasMasks(botJsonTemplate);
        }
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["60363c0c92ec1c31037959f5"] = 20; //gp7
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "bear.tier4");
        if (this.modConfig.logEverything == true) {
            this.logger.info("bearLoad4 loaded");
        }
    }
    bearLoad5(botJsonTemplate) {
        let tier4Json = JSON.parse(JSON.stringify(bearLO.bearLO4));
        let tier5Json = JSON.parse(JSON.stringify(tier5LO.tier5LO));
        botJsonTemplate.appearance.body = tier5Json.appearance_bear.body;
        botJsonTemplate.appearance.feet = tier5Json.appearance_bear.feet;
        botJsonTemplate.appearance.voice = { ...bearLO.HighTierVoice };
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.items;
            botJsonTemplate.generation = { ...lootOdds.tier5 };
        }
        if (this.modConfig.add_keys === true) {
            botJsonTemplate.inventory.items.Backpack = { ...botJsonTemplate.inventory.items.Backpack, ...keys.tier4_PMC_Keys };
        }
        this.tier5PMCLoad(botJsonTemplate);
        if (this.modConfig.dynamic_loot_pmcs === true) {
            botJsonTemplate.inventory.items = tier4Json.inventory.dynamic_looting;
            botJsonTemplate.generation.items.backpackLoot.weights = { ...lootOdds.dynamic.items.backpackLoot.weights };
            botJsonTemplate.generation.items.vestLoot.weights = { ...lootOdds.dynamic.items.vestLoot.weights };
            botJsonTemplate.generation.items.pocketLoot.weights = { ...lootOdds.dynamic.items.pocketLoot.weights };
            botJsonTemplate.generation.items.drink.weights = { ...lootOdds.dynamic.items.drink.weights };
            botJsonTemplate.generation.items.food.weights = { ...lootOdds.dynamic.items.food.weights };
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("bearLoad5 loaded");
        }
    }
    addOptionalGasMasks(botJsonTemplate) {
        if (utils_1.ModTracker.tgcPresent) {
            botJsonTemplate.inventory.equipment.FaceCover["672e2e756803734b60f5ac1e"] = 1;
            botJsonTemplate.inventory.equipment.FaceCover["672e2e7517018293d11bbdc1"] = 1;
        }
        if (this.modConfig.enable_hazard_zones) {
            botJsonTemplate.inventory.equipment.FaceCover["67a13809c3bc1e2fa47e6eec"] = 1;
        }
    }
    tier5PMCLoad(botJsonTemplate) {
        let tier5Json = JSON.parse(JSON.stringify(tier5LO.tier5LO));
        botJsonTemplate.experience.level = tier5Json.experience.level;
        botJsonTemplate.chances = tier5Json.chances;
        botJsonTemplate.inventory.mods = tier5Json.inventory.mods;
        botJsonTemplate.inventory.Ammo = this.modConfig.realistic_ballistics == true ? { ...realismAmmo.Tier5 } : { ...vanillaAmmo.Tier5 };
        botJsonTemplate.inventory.equipment = tier5Json.inventory.equipment;
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 100;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.inventory.equipment.Headwear = tier5Json.inventory.Headwear_night;
        }
        else {
            botJsonTemplate.chances.equipmentMods.mod_nvg = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 100;
                botJsonTemplate.inventory.equipment.Headwear = tier5Json.inventory.Headwear_cqb;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 100;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 100;
                botJsonTemplate.inventory.equipment.Headwear = tier5Json.inventory.Headwear_cqb;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 25;
                botJsonTemplate.chances.equipmentMods.mod_equipment = 25;
            }
        }
        //don't want TOD to be a factor
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier5Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier5Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = tier5Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            botJsonTemplate.chances.equipmentMods.mod_equipment = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_000 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_001 = 0;
            botJsonTemplate.chances.equipmentMods.mod_equipment_002 = 0;
            botJsonTemplate.inventory.equipment.FaceCover = { ...bearLO.FaceCoverLabs };
            botJsonTemplate.inventory.equipment.Eyewear = {};
            botJsonTemplate.chances.equipment.FaceCover = 100;
            this.addOptionalGasMasks(botJsonTemplate);
        }
        this.mergeWithUserEquipmentItems(botJsonTemplate, "tier5");
        if (utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "rezervbase") {
            botJsonTemplate.inventory.equipment.FaceCover["60363c0c92ec1c31037959f5"] = 20; //gp7
        }
    }
    raiderLoad1() {
        let tier1Json = JSON.parse(JSON.stringify(raiderLO.raiderLO1));
        this.raiderBase.inventory.Ammo = tier1Json.inventory.Ammo;
        this.raiderBase.inventory.equipment = tier1Json.inventory.equipment;
        this.raiderBase.inventory.mods = tier1Json.inventory.mods;
        this.raiderBase.chances = tier1Json.chances;
        this.raiderBase.appearance.body = raiderLO.appearance.body;
        this.raiderBase.appearance.feet = raiderLO.appearance.feet;
        this.raiderBase.appearance.head = raiderLO.appearance.head;
        this.raiderBase.appearance.voice = raiderLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.raiderBase.inventory.items = tier1Json.inventory.items;
            this.raiderBase.generation = lootOdds.tier4;
        }
        this.botConf().equipment["pmcbot"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.raiderBase.chances.equipmentMods.mod_nvg = 70;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
            this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 50;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 100;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier1Json.inventory.FirstPrimaryWeapon_cqb;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 70;
            this.raiderBase.chances.equipmentMods.mod_nvg = 70;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 50;
            this.raiderBase.chances.equipmentMods.mod_equipment = 50;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 50;
        }
        else {
            this.raiderBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 50;
                this.raiderBase.chances.equipmentMods.mod_equipment = 50;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 50;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 80;
                this.raiderBase.chances.equipmentMods.mod_equipment = 80;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
                this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier1Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier1Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier1Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.enable_hazard_zones == true && (utils_1.RaidInfoTracker.mapName === "laboratory" || utils_1.RaidInfoTracker.mapName === "rezervbase"
            || utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "factory4_night"
            || utils_1.RaidInfoTracker.mapName === "factory4_day")) {
            this.raiderBase.chances.equipmentMods.mod_equipment = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.raiderBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.raiderBase.inventory.equipment.Eyewear = {};
        }
        utils_1.BotTierTracker.raiderTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("raiderLoad1 loaded");
        }
    }
    raiderLoad2() {
        let tier2Json = JSON.parse(JSON.stringify(raiderLO.raiderLO2));
        this.raiderBase.inventory.Ammo = tier2Json.inventory.Ammo;
        this.raiderBase.inventory.equipment = tier2Json.inventory.equipment;
        this.raiderBase.inventory.mods = tier2Json.inventory.mods;
        this.raiderBase.chances = tier2Json.chances;
        this.raiderBase.appearance.body = raiderLO.appearance.body;
        this.raiderBase.appearance.feet = raiderLO.appearance.feet;
        this.raiderBase.appearance.head = raiderLO.appearance.head;
        this.raiderBase.appearance.voice = raiderLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.raiderBase.inventory.items = tier2Json.inventory.items;
            this.raiderBase.generation = lootOdds.tier5;
        }
        this.botConf().equipment["pmcbot"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.raiderBase.chances.equipmentMods.mod_nvg = 80;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
            this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 100;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_cqb;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 50;
            this.raiderBase.chances.equipmentMods.mod_nvg = 80;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 50;
            this.raiderBase.chances.equipmentMods.mod_equipment = 50;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 50;
        }
        else {
            this.raiderBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 70;
                this.raiderBase.chances.equipmentMods.mod_equipment = 70;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 60;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 90;
                this.raiderBase.chances.equipmentMods.mod_equipment = 90;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
                this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier2Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.enable_hazard_zones == true && (utils_1.RaidInfoTracker.mapName === "laboratory" || utils_1.RaidInfoTracker.mapName === "rezervbase"
            || utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "factory4_night"
            || utils_1.RaidInfoTracker.mapName === "factory4_day")) {
            this.raiderBase.chances.equipmentMods.mod_equipment = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.raiderBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.raiderBase.inventory.equipment.Eyewear = {};
        }
        this.addOptionalGasMasks(this.raiderBase);
        utils_1.BotTierTracker.raiderTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("raiderLoad2 loaded");
        }
    }
    raiderLoad3() {
        let tier3Json = JSON.parse(JSON.stringify(raiderLO.raiderLO3));
        this.raiderBase.inventory.Ammo = tier3Json.inventory.Ammo;
        this.raiderBase.inventory.equipment = tier3Json.inventory.equipment;
        this.raiderBase.inventory.mods = tier3Json.inventory.mods;
        this.raiderBase.chances = tier3Json.chances;
        this.raiderBase.appearance.body = raiderLO.appearance.body;
        this.raiderBase.appearance.feet = raiderLO.appearance.feet;
        this.raiderBase.appearance.head = raiderLO.appearance.head;
        this.raiderBase.appearance.voice = raiderLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.raiderBase.inventory.items = tier3Json.inventory.items;
            this.raiderBase.generation = lootOdds.tier5;
        }
        this.botConf().equipment["pmcbot"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight) {
            this.raiderBase.chances.equipmentMods.mod_nvg = 100;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
            this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 100;
        }
        else if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_cqb;
            this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 0;
            this.raiderBase.chances.equipmentMods.mod_nvg = 100;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 60;
            this.raiderBase.chances.equipmentMods.mod_equipment = 60;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 50;
        }
        else {
            this.raiderBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["pmcbot"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 100;
                this.raiderBase.chances.equipmentMods.mod_equipment = 100;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 80;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 = 100;
                this.raiderBase.chances.equipmentMods.mod_equipment = 100;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.raiderBase.chances.equipmentMods.mod_equipment_000 *= 0.5;
                this.raiderBase.chances.equipmentMods.mod_equipment *= 0.5;
                this.botConf().equipment["pmcbot"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_urban;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_cqb;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.raiderBase.inventory.equipment.FirstPrimaryWeapon = tier3Json.inventory.FirstPrimaryWeapon_outdoor;
        }
        if (this.modConfig.enable_hazard_zones == true && (utils_1.RaidInfoTracker.mapName === "laboratory" || utils_1.RaidInfoTracker.mapName === "rezervbase"
            || utils_1.RaidInfoTracker.mapName === "reservebase" || utils_1.RaidInfoTracker.mapName === "factory4_night"
            || utils_1.RaidInfoTracker.mapName === "factory4_day")) {
            this.raiderBase.chances.equipmentMods.mod_equipment = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.raiderBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.raiderBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.raiderBase.inventory.equipment.Eyewear = {};
        }
        this.addOptionalGasMasks(this.raiderBase);
        utils_1.BotTierTracker.raiderTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("raiderLoad3 loaded");
        }
    }
    rogueLoad1() {
        let tier1Json = JSON.parse(JSON.stringify(rogueLO.rogueLO1));
        this.rogueBase.inventory.Ammo = tier1Json.inventory.Ammo;
        this.rogueBase.inventory.equipment = tier1Json.inventory.equipment;
        this.rogueBase.inventory.mods = tier1Json.inventory.mods;
        ;
        this.rogueBase.chances = tier1Json.chances;
        this.rogueBase.appearance.body = rogueLO.appearance.body;
        this.rogueBase.appearance.feet = rogueLO.appearance.feet;
        this.rogueBase.appearance.head = rogueLO.appearance.head;
        this.rogueBase.appearance.voice = rogueLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.rogueBase.inventory.items = tier1Json.inventory.items;
            this.rogueBase.generation = lootOdds.tier4;
        }
        this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 60;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.isNight && utils_1.RaidInfoTracker.mapName === "Lighthouse" || utils_1.RaidInfoTracker.mapName === "lighthouse") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 60;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.rogueBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 30;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            }
        }
        utils_1.BotTierTracker.rogueTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("rogueLoad1 loaded");
        }
    }
    rogueLoad2() {
        let tier2Json = JSON.parse(JSON.stringify(rogueLO.rogueLO2));
        this.rogueBase.inventory.Ammo = tier2Json.inventory.Ammo;
        this.rogueBase.inventory.equipment = tier2Json.inventory.equipment;
        this.rogueBase.inventory.mods = tier2Json.inventory.mods;
        this.rogueBase.chances = tier2Json.chances;
        this.rogueBase.appearance.body = rogueLO.appearance.body;
        this.rogueBase.appearance.feet = rogueLO.appearance.feet;
        this.rogueBase.appearance.head = rogueLO.appearance.head;
        this.rogueBase.appearance.voice = rogueLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.rogueBase.inventory.items = tier2Json.inventory.items;
            this.rogueBase.generation = lootOdds.tier5;
        }
        this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 80;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.isNight && utils_1.RaidInfoTracker.mapName === "Lighthouse" || utils_1.RaidInfoTracker.mapName === "lighthouse") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 80;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.rogueBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 30;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            }
        }
        utils_1.BotTierTracker.rogueTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("rogueLoad2 loaded");
        }
    }
    rogueLoad3() {
        let tier3Json = JSON.parse(JSON.stringify(rogueLO.rogueLO3));
        this.rogueBase.inventory.Ammo = tier3Json.inventory.Ammo;
        this.rogueBase.inventory.equipment = tier3Json.inventory.equipment;
        this.rogueBase.inventory.items = tier3Json.inventory.items;
        this.rogueBase.inventory.mods = tier3Json.inventory.mods;
        this.rogueBase.chances = tier3Json.chances;
        this.rogueBase.appearance.body = rogueLO.appearance.body;
        this.rogueBase.appearance.feet = rogueLO.appearance.feet;
        this.rogueBase.appearance.head = rogueLO.appearance.head;
        this.rogueBase.appearance.voice = rogueLO.appearance.voice;
        if (this.modConfig.bot_loot_changes === true) {
            this.rogueBase.inventory.items = tier3Json.inventory.items;
            this.rogueBase.generation = lootOdds.tier5;
        }
        this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.isNight && utils_1.RaidInfoTracker.mapName === "Lighthouse" || utils_1.RaidInfoTracker.mapName === "lighthouse") {
            this.rogueBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.rogueBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["exusec"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 100;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 100;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                this.botConf().equipment["exusec"].faceShieldIsActiveChancePercent = 30;
                this.botConf().equipment["exusec"].lightIsActiveDayChancePercent = 0;
            }
        }
        utils_1.BotTierTracker.rogueTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("rogueLoad3 loaded");
        }
    }
    goonsLoad1() {
        let knight1Json = JSON.parse(JSON.stringify(knightLO.knightLO1));
        let bird1Json = JSON.parse(JSON.stringify(birdeyeLO.birdeyeLO1));
        let pipe1Json = JSON.parse(JSON.stringify(bigpipeLO.bigpipeLO1));
        this.knightBase.inventory.Ammo = knight1Json.inventory.Ammo;
        this.knightBase.inventory.equipment = knight1Json.inventory.equipment;
        this.knightBase.inventory.mods = knight1Json.inventory.mods;
        this.knightBase.chances = knight1Json.chances;
        this.botConf().equipment["bossknight"].faceShieldIsActiveChancePercent = 100;
        const randNum = this.utils.pickRandNumOneInTen();
        this.bigpipeBase.inventory.Ammo = pipe1Json.inventory.Ammo;
        this.bigpipeBase.inventory.equipment = pipe1Json.inventory.equipment;
        this.bigpipeBase.inventory.mods = pipe1Json.inventory.mods;
        this.bigpipeBase.chances = pipe1Json.chances;
        this.botConf().equipment["followerbigpipe"].faceShieldIsActiveChancePercent = 100;
        this.birdeyeBase.inventory.Ammo = bird1Json.inventory.Ammo;
        this.birdeyeBase.inventory.equipment = bird1Json.inventory.equipment;
        this.birdeyeBase.inventory.mods = bird1Json.inventory.mods;
        this.birdeyeBase.chances = bird1Json.chances;
        this.botConf().equipment["followerbirdeye"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.bot_loot_changes === true) {
            this.knightBase.inventory.items = knight1Json.inventory.items;
            this.bigpipeBase.inventory.items = pipe1Json.inventory.items;
            this.birdeyeBase.inventory.items = bird1Json.inventory.items;
            this.knightBase.generation = lootOdds.boss;
            this.bigpipeBase.generation = lootOdds.boss;
            this.birdeyeBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.isNight) {
            if (randNum >= 6) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            if (randNum >= 6) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 5;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.knightBase.chances.equipmentMods.mod_nvg = 0;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 0;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                if (randNum >= 6) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 100;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
                this.birdeyeBase.chances.equipment.Headwear = 50;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 50;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                if (randNum >= 8) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.knightBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.knightBase.chances.equipmentMods.mod_equipment_001 *= 0.5;
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
                this.birdeyeBase.chances.equipment.Headwear = 25;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird1Json.inventory.FirstPrimaryWeapon_cqb;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird1Json.inventory.FirstPrimaryWeapon_urban;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird1Json.inventory.FirstPrimaryWeapon_outdoor;
            this.birdeyeBase.inventory.equipment.Holster = {};
        }
        utils_1.BotTierTracker.goonsTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("goonsLoad1 loaded");
        }
    }
    goonsLoad2() {
        let knight2Json = JSON.parse(JSON.stringify(knightLO.knightLO2));
        let bird2Json = JSON.parse(JSON.stringify(birdeyeLO.birdeyeLO2));
        let pipe2Json = JSON.parse(JSON.stringify(bigpipeLO.bigpipeLO2));
        this.knightBase.inventory.Ammo = knight2Json.inventory.Ammo;
        this.knightBase.inventory.equipment = knight2Json.inventory.equipment;
        this.knightBase.inventory.mods = knight2Json.inventory.mods;
        this.knightBase.chances = knight2Json.chances;
        this.botConf().equipment["bossknight"].faceShieldIsActiveChancePercent = 100;
        const randNum = this.utils.pickRandNumOneInTen();
        this.bigpipeBase.inventory.Ammo = pipe2Json.inventory.Ammo;
        this.bigpipeBase.inventory.equipment = pipe2Json.inventory.equipment;
        this.bigpipeBase.inventory.mods = pipe2Json.inventory.mods;
        this.bigpipeBase.chances = pipe2Json.chances;
        this.botConf().equipment["followerbigpipe"].faceShieldIsActiveChancePercent = 100;
        this.birdeyeBase.inventory.Ammo = bird2Json.inventory.Ammo;
        this.birdeyeBase.inventory.equipment = bird2Json.inventory.equipment;
        this.birdeyeBase.inventory.mods = bird2Json.inventory.mods;
        this.birdeyeBase.chances = bird2Json.chances;
        this.botConf().equipment["followerbirdeye"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.bot_loot_changes === true) {
            this.birdeyeBase.inventory.items = bird2Json.inventory.items;
            this.bigpipeBase.inventory.items = bigpipeLO.bigpipeLO2.inventory.items;
            this.knightBase.inventory.items = knight2Json.inventory.items;
            this.knightBase.generation = lootOdds.boss;
            this.bigpipeBase.generation = lootOdds.boss;
            this.birdeyeBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.isNight) {
            if (randNum >= 4) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 5;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            if (randNum >= 3) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 10;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.knightBase.chances.equipmentMods.mod_nvg = 0;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 0;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                if (randNum >= 4) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 100;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
                this.birdeyeBase.chances.equipment.Headwear = 65;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 50;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                if (randNum >= 5) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.knightBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.knightBase.chances.equipmentMods.mod_equipment_001 *= 0.5;
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
                this.birdeyeBase.chances.equipment.Headwear = 25;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird2Json.inventory.FirstPrimaryWeapon_cqb;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird2Json.inventory.FirstPrimaryWeapon_urban;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird2Json.inventory.FirstPrimaryWeapon_outdoor;
            this.birdeyeBase.inventory.equipment.Holster = {};
        }
        utils_1.BotTierTracker.goonsTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("goonsLoad2 loaded");
        }
    }
    goonsLoad3() {
        let knight3Json = JSON.parse(JSON.stringify(knightLO.knightLO3));
        let bird3Json = JSON.parse(JSON.stringify(birdeyeLO.birdeyeLO3));
        let pipe3Json = JSON.parse(JSON.stringify(bigpipeLO.bigpipeLO3));
        this.knightBase.inventory.Ammo = knight3Json.inventory.Ammo;
        this.knightBase.inventory.equipment = knight3Json.inventory.equipment;
        this.knightBase.inventory.mods = knight3Json.inventory.mods;
        this.knightBase.chances = knight3Json.chances;
        this.botConf().equipment["bossknight"].faceShieldIsActiveChancePercent = 100;
        const randNum = this.utils.pickRandNumOneInTen();
        this.bigpipeBase.inventory.Ammo = pipe3Json.inventory.Ammo;
        this.bigpipeBase.inventory.equipment = pipe3Json.inventory.equipment;
        this.bigpipeBase.inventory.mods = pipe3Json.inventory.mods;
        this.bigpipeBase.chances = pipe3Json.chances;
        this.botConf().equipment["followerbigpipe"].faceShieldIsActiveChancePercent = 100;
        this.birdeyeBase.inventory.Ammo = bird3Json.inventory.Ammo;
        this.birdeyeBase.inventory.equipment = bird3Json.inventory.equipment;
        this.birdeyeBase.inventory.mods = bird3Json.inventory.mods;
        this.birdeyeBase.chances = bird3Json.chances;
        this.botConf().equipment["followerbirdeye"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.bot_loot_changes === true) {
            this.birdeyeBase.inventory.items = bird3Json.inventory.items;
            this.bigpipeBase.inventory.items = pipe3Json.inventory.items;
            this.knightBase.inventory.items = knight3Json.inventory.items;
            this.knightBase.generation = lootOdds.boss;
            this.bigpipeBase.generation = lootOdds.boss;
            this.birdeyeBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.isNight) {
            if (randNum >= 3) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 10;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            if (randNum >= 2) {
                this.knightBase.chances.equipment.Headwear = 100;
                this.knightBase.chances.equipment.FaceCover = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                this.knightBase.chances.equipment.FaceCover = 0;
            }
            else {
                this.knightBase.chances.equipment.FaceCover = 100;
                this.knightBase.chances.equipment.Headwear = 0;
                this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                this.knightBase.chances.equipment.FaceCover = 100;
            }
            this.knightBase.chances.equipmentMods.mod_nvg = 100;
            this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 100;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 100;
            this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 100;
            this.birdeyeBase.chances.equipment.Headwear = 100;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 100;
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 1;
            this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 20;
            this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 100;
        }
        if (!utils_1.RaidInfoTracker.isNight) {
            this.knightBase.chances.equipmentMods.mod_nvg = 0;
            this.bigpipeBase.chances.equipmentMods.mod_nvg = 0;
            this.birdeyeBase.chances.equipmentMods.mod_nvg = 0;
            this.botConf().equipment["bossknight"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbigpipe"].nvgIsActiveChanceDayPercent = 0;
            this.botConf().equipment["followerbirdeye"].nvgIsActiveChanceDayPercent = 0;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban || utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                if (randNum >= 3) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 100;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 100;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 100;
                this.birdeyeBase.chances.equipment.Headwear = 100;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 80;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
                if (randNum >= 4) {
                    this.knightBase.chances.equipment.Headwear = 100;
                    this.knightBase.chances.equipment.FaceCover = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 1;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 0;
                    this.knightBase.chances.equipment.FaceCover = 0;
                }
                else {
                    this.knightBase.chances.equipment.FaceCover = 100;
                    this.knightBase.chances.equipment.Headwear = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["5ac8d6885acfc400180ae7b0"] = 0;
                    this.bigpipeBase.inventory.equipment.Headwear["628e4dd1f477aa12234918aa"] = 1;
                    this.knightBase.chances.equipment.FaceCover = 100;
                }
                this.knightBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.knightBase.chances.equipmentMods.mod_equipment_001 *= 0.5;
                this.botConf().equipment["bossknight"].lightIsActiveDayChancePercent = 0;
                this.bigpipeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.botConf().equipment["followerbigpipe"].lightIsActiveDayChancePercent = 0;
                this.birdeyeBase.chances.equipment.Headwear = 50;
                this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
                this.birdeyeBase.inventory.equipment.Headwear["5a16bb52fcdbcb001a3b00dc"] = 0;
                this.birdeyeBase.inventory.equipment.Headwear["61bca7cda0eae612383adf57"] = 1;
                this.botConf().equipment["followerbirdeye"].lightIsActiveDayChancePercent = 0;
            }
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird3Json.inventory.FirstPrimaryWeapon_cqb;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Urban) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird3Json.inventory.FirstPrimaryWeapon_urban;
            this.birdeyeBase.inventory.equipment.SecondPrimaryWeapon = {};
            this.birdeyeBase.chances.equipmentMods.mod_equipment_000 = 0;
        }
        if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.Outdoor) {
            this.birdeyeBase.inventory.equipment.FirstPrimaryWeapon = bird3Json.inventory.FirstPrimaryWeapon_outdoor;
            this.birdeyeBase.inventory.equipment.Holster = {};
        }
        utils_1.BotTierTracker.goonsTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("goonsLoad3 loaded");
        }
    }
    killaLoad1() {
        let killa1Json = JSON.parse(JSON.stringify(killaLO.killaLO1));
        this.killaBase.inventory.Ammo = killa1Json.inventory.Ammo;
        this.killaBase.inventory.equipment = killa1Json.inventory.equipment;
        this.killaBase.inventory.mods = killa1Json.inventory.mods;
        this.killaBase.chances = killa1Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.killaBase.inventory.items = killa1Json.inventory.items;
            this.killaBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.killaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.killaBase.chances.equipmentMods.mod_equipment = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.killaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.killaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.killaTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("killaLoad1 loaded");
        }
    }
    killaLoad2() {
        let killa2Json = JSON.parse(JSON.stringify(killaLO.killaLO2));
        this.killaBase.inventory.Ammo = killa2Json.inventory.Ammo;
        this.killaBase.inventory.equipment = killa2Json.inventory.equipment;
        this.killaBase.inventory.mods = killa2Json.inventory.mods;
        this.killaBase.chances = killa2Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.killaBase.inventory.items = killa2Json.inventory.items;
            this.killaBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.killaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 50;
        }
        else if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.killaBase.chances.equipmentMods.mod_equipment = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.killaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.killaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.killaTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("killaLoad2 loaded");
        }
    }
    killaLoad3() {
        let killa3Json = JSON.parse(JSON.stringify(killaLO.killaLO3));
        this.killaBase.inventory.Ammo = killa3Json.inventory.Ammo;
        this.killaBase.inventory.equipment = killa3Json.inventory.equipment;
        this.killaBase.inventory.mods = killa3Json.inventory.mods;
        this.killaBase.chances = killa3Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.killaBase.inventory.items = killa3Json.inventory.items;
            this.killaBase.generation = lootOdds.boss;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.killaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 25;
        }
        if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosskilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.killaBase.chances.equipmentMods.mod_equipment = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.killaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.killaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.killaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.killaTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("killaLoad3 loaded");
        }
    }
    tagillaLoad1() {
        let tagilla1Json = JSON.parse(JSON.stringify(tagillaLO.tagillaLO1));
        this.tagillaBase.inventory.Ammo = tagilla1Json.inventory.Ammo;
        this.tagillaBase.inventory.equipment = tagilla1Json.inventory.equipment;
        this.tagillaBase.inventory.mods = tagilla1Json.inventory.mods;
        this.tagillaBase.chances = tagilla1Json.chances;
        if (seasonalevents_1.EventTracker.isHalloween) {
            this.tagillaBase.inventory.equipment.Scabbard = { "63495c500c297e20065a08b1": 1 };
        }
        if (this.modConfig.bot_loot_changes === true) {
            this.tagillaBase.inventory.items = tagilla1Json.inventory.items;
            this.tagillaBase.generation = lootOdds.boss;
        }
        const randnum = this.utils.pickRandNumOneInTen();
        if (randnum >= 9) {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 1;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 0;
            this.tagillaBase.chances.equipment.FaceCover = 0;
            this.tagillaBase.chances.equipment.Headwear = 100;
        }
        else {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 0;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 1;
            this.tagillaBase.chances.equipment.FaceCover = 100;
            this.tagillaBase.chances.equipment.Headwear = 100;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.tagillaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 100;
        }
        else if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.tagillaBase.chances.equipmentMods.mod_equipment = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.tagillaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.tagillaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.tagillaTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("tagillaLoad1 loaded");
        }
    }
    tagillaLoad2() {
        let tagilla2Json = JSON.parse(JSON.stringify(tagillaLO.tagillaLO2));
        this.tagillaBase.inventory.Ammo = tagilla2Json.inventory.Ammo;
        this.tagillaBase.inventory.equipment = tagilla2Json.inventory.equipment;
        this.tagillaBase.inventory.mods = tagilla2Json.inventory.mods;
        this.tagillaBase.chances = tagilla2Json.chances;
        if (seasonalevents_1.EventTracker.isHalloween) {
            this.tagillaBase.inventory.equipment.Scabbard = { "63495c500c297e20065a08b1": 1 };
        }
        if (this.modConfig.bot_loot_changes === true) {
            this.tagillaBase.inventory.items = tagilla2Json.inventory.items;
            this.tagillaBase.generation = lootOdds.boss;
        }
        const randnum = this.utils.pickRandNumOneInTen();
        if (randnum >= 7) {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 1;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 0;
            this.tagillaBase.chances.equipment.FaceCover = 0;
        }
        else {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 0;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 1;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.tagillaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 50;
        }
        else if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.tagillaBase.chances.equipmentMods.mod_equipment = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.tagillaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.tagillaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.tagillaTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("tagillaLoad2 loaded");
        }
    }
    tagillaLoad3() {
        let tagilla3Json = JSON.parse(JSON.stringify(tagillaLO.tagillaLO3));
        this.tagillaBase.inventory.Ammo = tagilla3Json.inventory.Ammo;
        this.tagillaBase.inventory.equipment = tagilla3Json.inventory.equipment;
        this.tagillaBase.inventory.mods = tagilla3Json.inventory.mods;
        this.tagillaBase.chances = tagilla3Json.chances;
        if (seasonalevents_1.EventTracker.isHalloween) {
            this.tagillaBase.inventory.equipment.Scabbard = { "63495c500c297e20065a08b1": 1 };
        }
        if (this.modConfig.bot_loot_changes === true) {
            this.tagillaBase.inventory.items = tagilla3Json.inventory.items;
            this.tagillaBase.generation = lootOdds.boss;
        }
        const randnum = this.utils.pickRandNumOneInTen();
        if (randnum >= 5) {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 1;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 0;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 0;
            this.tagillaBase.chances.equipment.FaceCover = 0;
        }
        else {
            this.tagillaBase.inventory.equipment.Headwear["5f60c74e3b85f6263c145586"] = 0;
            this.tagillaBase.inventory.equipment.Headwear["60a7acf20c5cb24b01346648"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad2a2198820d95707a2e"] = 1;
            this.tagillaBase.inventory.equipment.FaceCover["60a7ad3a0c5cb24b0134664a"] = 1;
        }
        if (utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.tagillaBase.chances.weaponMods.mod_flashlight = 60;
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 25;
        }
        else if (utils_1.RaidInfoTracker.mapName === "interchange") {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosstagilla"].lightIsActiveDayChancePercent = 100;
        }
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.tagillaBase.chances.equipmentMods.mod_equipment = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.tagillaBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.tagillaBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.tagillaBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.tagillaTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("tagillaLoad3 loaded");
        }
    }
    sanitarLoad1() {
        let sanitar1Json = JSON.parse(JSON.stringify(saniLO.sanitarLO1));
        let follower1Json = JSON.parse(JSON.stringify(saniFollowerLO.sanitarfollowerLO1));
        this.saniBase.inventory.Ammo = sanitar1Json.inventory.Ammo;
        this.saniBase.inventory.equipment = sanitar1Json.inventory.equipment;
        this.saniBase.inventory.mods = sanitar1Json.inventory.mods;
        this.saniBase.chances = sanitar1Json.chances;
        this.saniFollowerBase.inventory.Ammo = follower1Json.inventory.Ammo;
        this.saniFollowerBase.inventory.equipment = follower1Json.inventory.equipment;
        this.saniFollowerBase.inventory.mods = follower1Json.inventory.mods;
        this.saniFollowerBase.chances = follower1Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.saniBase.inventory.items = sanitar1Json.inventory.items;
            this.saniFollowerBase.inventory.items = follower1Json.inventory.items;
            this.saniBase.generation = lootOdds.boss;
            this.saniFollowerBase.generation = lootOdds.tier4;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 0;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 25;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 90;
                this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 90;
            }
        }
        this.botConf().equipment["followersanitar"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.saniBase.chances.equipmentMods.mod_equipment = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniBase.inventory.equipment.Headwear = {};
            this.saniBase.inventory.equipment.Eyewear = {};
            this.saniBase.chances.equipment.FaceCover = 100;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniFollowerBase.inventory.equipment.Eyewear = {};
            this.saniFollowerBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.sanitarTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("saintarLoad1 loaded");
        }
    }
    sanitarLoad2() {
        let sanitar2Json = JSON.parse(JSON.stringify(saniLO.sanitarLO2));
        let follower2Json = JSON.parse(JSON.stringify(saniFollowerLO.sanitarfollowerLO2));
        this.saniBase.inventory.Ammo = sanitar2Json.inventory.Ammo;
        this.saniBase.inventory.equipment = sanitar2Json.inventory.equipment;
        this.saniBase.inventory.mods = sanitar2Json.inventory.mods;
        this.saniBase.chances = sanitar2Json.chances;
        this.saniFollowerBase.inventory.Ammo = follower2Json.inventory.Ammo;
        this.saniFollowerBase.inventory.equipment = follower2Json.inventory.equipment;
        this.saniFollowerBase.inventory.mods = follower2Json.inventory.mods;
        this.saniFollowerBase.chances = follower2Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.saniBase.inventory.items = sanitar2Json.inventory.items;
            this.saniFollowerBase.inventory.items = follower2Json.inventory.items;
            this.saniBase.generation = lootOdds.boss;
            this.saniFollowerBase.generation = lootOdds.tier4;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 0;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 25;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 90;
                this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 90;
            }
        }
        this.botConf().equipment["followersanitar"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.saniBase.chances.equipmentMods.mod_equipment = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniBase.inventory.equipment.Headwear = {};
            this.saniBase.inventory.equipment.Eyewear = {};
            this.saniBase.chances.equipment.FaceCover = 100;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniFollowerBase.inventory.equipment.Eyewear = {};
            this.saniFollowerBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.sanitarTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("saintarLoad2 loaded");
        }
    }
    sanitarLoad3() {
        let sanitar3Json = JSON.parse(JSON.stringify(saniLO.sanitarLO3));
        let follower3Json = JSON.parse(JSON.stringify(saniFollowerLO.sanitarfollowerLO3));
        this.saniBase.inventory.Ammo = sanitar3Json.inventory.Ammo;
        this.saniBase.inventory.equipment = sanitar3Json.inventory.equipment;
        this.saniBase.inventory.mods = sanitar3Json.inventory.mods;
        this.saniBase.chances = sanitar3Json.chances;
        this.saniFollowerBase.inventory.Ammo = follower3Json.inventory.Ammo;
        this.saniFollowerBase.inventory.equipment = follower3Json.inventory.equipment;
        this.saniFollowerBase.inventory.mods = follower3Json.inventory.mods;
        this.saniFollowerBase.chances = follower3Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.saniBase.inventory.items = sanitar3Json.inventory.items;
            this.saniFollowerBase.inventory.items = follower3Json.inventory.items;
            this.saniBase.generation = lootOdds.boss;
            this.saniFollowerBase.generation = lootOdds.tier5;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 0;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 0;
        }
        else {
            this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 25;
            this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bosssanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["bosssanitar"].laserIsActiveChancePercent = 90;
                this.botConf().equipment["followersanitar"].lightIsActiveDayChancePercent = 90;
                this.botConf().equipment["followersanitar"].laserIsActiveChancePercent = 90;
            }
        }
        this.botConf().equipment["followersanitar"].faceShieldIsActiveChancePercent = 100;
        if (this.modConfig.enable_hazard_zones == true && utils_1.RaidInfoTracker.mapName === "laboratory") {
            this.saniBase.chances.equipmentMods.mod_equipment = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniBase.inventory.equipment.Headwear = {};
            this.saniBase.inventory.equipment.Eyewear = {};
            this.saniBase.chances.equipment.FaceCover = 100;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_001 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_002 = 0;
            this.saniFollowerBase.chances.equipmentMods.mod_equipment_000 = 0;
            this.saniFollowerBase.inventory.equipment.FaceCover = { "60363c0c92ec1c31037959f5": 1 };
            this.saniFollowerBase.inventory.equipment.Eyewear = {};
            this.saniFollowerBase.chances.equipment.FaceCover = 100;
        }
        utils_1.BotTierTracker.sanitarTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("sanitarLoad3 loaded");
        }
    }
    reshallaLoad1() {
        let resh1Json = JSON.parse(JSON.stringify(reshLO.reshallaLO1));
        let follower1Json = JSON.parse(JSON.stringify(reshFollowerLO.reshallafollowerLO1));
        this.reshBase.inventory.Ammo = resh1Json.inventory.Ammo;
        this.reshBase.inventory.equipment = resh1Json.inventory.equipment;
        this.reshBase.inventory.mods = resh1Json.inventory.mods;
        this.reshBase.chances = resh1Json.chances;
        this.reshFollowerBase.inventory.Ammo = follower1Json.inventory.Ammo;
        this.reshFollowerBase.inventory.equipment = follower1Json.inventory.equipment;
        this.reshFollowerBase.inventory.mods = follower1Json.inventory.mods;
        this.reshFollowerBase.chances = follower1Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.reshBase.inventory.items = resh1Json.inventory.items;
            this.reshFollowerBase.inventory.items = follower1Json.inventory.items;
            this.reshBase.generation = lootOdds.boss;
            this.reshFollowerBase.generation = lootOdds.tier3;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 25;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 50;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 50;
        }
        else {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 25;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 50;
                this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 50;
                this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 50;
                this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 50;
            }
        }
        this.botConf().equipment["followerbully"].faceShieldIsActiveChancePercent = 100;
        utils_1.BotTierTracker.reshallaTier = 1;
        if (this.modConfig.logEverything == true) {
            this.logger.info("reshallaLoad1 loaded");
        }
    }
    reshallaLoad2() {
        let resh2Json = JSON.parse(JSON.stringify(reshLO.reshallaLO2));
        let follower2Json = JSON.parse(JSON.stringify(reshFollowerLO.reshallafollowerLO2));
        this.reshBase.inventory.Ammo = resh2Json.inventory.Ammo;
        this.reshBase.inventory.equipment = resh2Json.inventory.equipment;
        this.reshBase.inventory.mods = resh2Json.inventory.mods;
        this.reshBase.chances = resh2Json.chances;
        this.reshFollowerBase.inventory.Ammo = follower2Json.inventory.Ammo;
        this.reshFollowerBase.inventory.equipment = follower2Json.inventory.equipment;
        this.reshFollowerBase.inventory.mods = follower2Json.inventory.mods;
        this.reshFollowerBase.chances = follower2Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.reshBase.inventory.items = resh2Json.inventory.items;
            this.reshFollowerBase.inventory.items = follower2Json.inventory.items;
            this.reshBase.generation = lootOdds.boss;
            this.reshFollowerBase.generation = lootOdds.tier4;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 12;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 12;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 25;
        }
        else {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 12;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 12;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 25;
                this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 25;
                this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 75;
                this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 75;
            }
        }
        utils_1.BotTierTracker.reshallaTier = 2;
        if (this.modConfig.logEverything == true) {
            this.logger.info("reshallaLoad2 loaded");
        }
    }
    reshallaLoad3() {
        let resh3Json = JSON.parse(JSON.stringify(reshLO.reshallaLO3));
        let follower3Json = JSON.parse(JSON.stringify(reshFollowerLO.reshallafollowerLO3));
        this.reshBase.inventory.Ammo = resh3Json.inventory.Ammo;
        this.reshBase.inventory.equipment = resh3Json.inventory.equipment;
        this.reshBase.inventory.mods = resh3Json.inventory.mods;
        this.reshBase.chances = resh3Json.chances;
        this.reshFollowerBase.inventory.Ammo = follower3Json.inventory.Ammo;
        this.reshFollowerBase.inventory.equipment = follower3Json.inventory.equipment;
        this.reshFollowerBase.inventory.mods = follower3Json.inventory.mods;
        this.reshFollowerBase.chances = follower3Json.chances;
        if (this.modConfig.bot_loot_changes === true) {
            this.reshBase.inventory.items = resh3Json.inventory.items;
            this.reshFollowerBase.inventory.items = follower3Json.inventory.items;
            this.reshBase.generation = lootOdds.boss;
            this.reshFollowerBase.generation = lootOdds.tier5;
        }
        if (utils_1.RaidInfoTracker.isNight || utils_1.RaidInfoTracker.mapName === "factory4_night") {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 0;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 5;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 5;
        }
        else {
            this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 0;
            this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 0;
            this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 25;
            this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 25;
            if (utils_1.RaidInfoTracker.mapType == utils_1.MapType.CQB) {
                this.botConf().equipment["bossbully"].lightIsActiveDayChancePercent = 0;
                this.botConf().equipment["bossbully"].laserIsActiveChancePercent = 0;
                this.botConf().equipment["followerbully"].lightIsActiveDayChancePercent = 75;
                this.botConf().equipment["followerbully"].laserIsActiveChancePercent = 75;
            }
        }
        utils_1.BotTierTracker.reshallaTier = 3;
        if (this.modConfig.logEverything == true) {
            this.logger.info("reshallaLoad3 loaded");
        }
    }
    assignRandomCultLO(botJsonTemplate, tier, isPriest) {
        const roleNumber = this.utils.pickRandNumInRange(0, 3);
        const pmcTierModifierMin = isPriest ? Math.min(tier, 4) : Math.max(tier, 2);
        const pmcTierModifierMax = isPriest ? Math.min(tier + 2, 4) : Math.max(tier, 2);
        const pmcTierModifier = this.utils.pickRandNumInRange(pmcTierModifierMin, pmcTierModifierMax);
        const usecJson = JSON.parse(JSON.stringify(usecLO[`usecLO${pmcTierModifier}`]));
        const bearJson = JSON.parse(JSON.stringify(bearLO[`bearLO${pmcTierModifier}`]));
        const rogueJson = JSON.parse(JSON.stringify(rogueLO[`rogueLO${tier}`]));
        const raiderJson = JSON.parse(JSON.stringify(raiderLO[`raiderLO${tier}`]));
        const roles = isPriest ?
            {
                0: usecJson,
                1: bearJson,
                2: rogueJson,
                3: raiderJson,
            }
            :
                {
                    0: usecJson,
                    1: bearJson,
                    2: usecJson,
                    3: bearJson,
                };
        const role = roles[roleNumber];
        botJsonTemplate.inventory.equipment.FirstPrimaryWeapon = role.inventory.equipment.FirstPrimaryWeapon;
        botJsonTemplate.inventory.equipment.SecondPrimaryWeapon = role.inventory.equipment.SecondPrimaryWeapon;
        botJsonTemplate.inventory.equipment.Holster = role.inventory.equipment.Holster;
        botJsonTemplate.inventory.mods = role.inventory.mods;
        botJsonTemplate.chances.equipmentMods = role.chances.equipmentMods;
        botJsonTemplate.chances.weaponMods = role.chances.weaponMods;
        if (isPriest)
            utils_1.BotTierTracker.priestBaseJson = roleNumber;
        else
            utils_1.BotTierTracker.cultistBaseJson = roleNumber;
    }
    cultistHelper(clonedLO, botJsonTemplate) {
        botJsonTemplate.inventory.equipment.ArmBand = clonedLO.inventory.equipment.ArmBand;
        botJsonTemplate.inventory.equipment.Eyewear = clonedLO.inventory.equipment.Eyewear;
        botJsonTemplate.inventory.equipment.FaceCover = clonedLO.inventory.equipment.FaceCover;
        botJsonTemplate.inventory.equipment.Headwear = clonedLO.inventory.equipment.Headwear;
        botJsonTemplate.inventory.equipment.ArmorVest = clonedLO.inventory.equipment.ArmorVest;
        botJsonTemplate.inventory.equipment.TacticalVest = clonedLO.inventory.equipment.TacticalVest;
        botJsonTemplate.inventory.equipment.Earpiece = clonedLO.inventory.equipment.Earpiece;
        botJsonTemplate.inventory.equipment.Scabbard = clonedLO.inventory.equipment.Scabbard;
        botJsonTemplate.inventory.equipment.Pockets = clonedLO.inventory.equipment.Pockets;
    }
    cultistsLoad1(botJsonTemplate, isPriest) {
        const clonedJson = isPriest ? JSON.parse(JSON.stringify(priestLO.priestLO1)) : JSON.parse(JSON.stringify(cultistLO.cultLO1));
        const odds = isPriest ? 30 : 60;
        this.cultistHelper(clonedJson, botJsonTemplate);
        if (isPriest)
            botJsonTemplate.appearance = clonedJson.appearance;
        botJsonTemplate.inventory.Ammo = clonedJson.inventory.Ammo;
        botJsonTemplate.chances = clonedJson.chances;
        if (odds > this.utils.pickRandNumInRange(1, 100))
            this.assignRandomCultLO(botJsonTemplate, 1, isPriest);
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = clonedJson.inventory.items;
            botJsonTemplate.generation = isPriest ? lootOdds.boss : lootOdds.tier2;
        }
        this.botConf().equipment["sectantpriest"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantpriest"].laserIsActiveChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].laserIsActiveChancePercent = 0;
        if (this.modConfig.logEverything == true) {
            this.logger.info("cultLoad1 loaded");
        }
    }
    cultistsLoad2(botJsonTemplate, isPriest) {
        const clonedJson = isPriest ? JSON.parse(JSON.stringify(priestLO.priestLO2)) : JSON.parse(JSON.stringify(cultistLO.cultLO2));
        const odds = isPriest ? 40 : 65;
        this.cultistHelper(clonedJson, botJsonTemplate);
        if (isPriest)
            botJsonTemplate.appearance = clonedJson.appearance;
        botJsonTemplate.inventory.Ammo = clonedJson.inventory.Ammo;
        botJsonTemplate.chances = clonedJson.chances;
        if (odds > this.utils.pickRandNumInRange(1, 100))
            this.assignRandomCultLO(botJsonTemplate, 2, isPriest);
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = clonedJson.inventory.items;
            botJsonTemplate.generation = isPriest ? lootOdds.boss : lootOdds.tier2;
        }
        this.botConf().equipment["sectantpriest"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantpriest"].laserIsActiveChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].laserIsActiveChancePercent = 0;
        if (this.modConfig.logEverything == true) {
            this.logger.info("cultLoad2 loaded");
        }
    }
    cultistsLoad3(botJsonTemplate, isPriest) {
        const clonedJson = isPriest ? JSON.parse(JSON.stringify(priestLO.priestLO3)) : JSON.parse(JSON.stringify(cultistLO.cultLO3));
        const odds = isPriest ? 50 : 70;
        this.cultistHelper(clonedJson, botJsonTemplate);
        if (isPriest)
            botJsonTemplate.appearance = clonedJson.appearance;
        botJsonTemplate.inventory.Ammo = clonedJson.inventory.Ammo;
        botJsonTemplate.chances = clonedJson.chances;
        if (odds > this.utils.pickRandNumInRange(1, 100))
            this.assignRandomCultLO(botJsonTemplate, 3, isPriest);
        if (this.modConfig.bot_loot_changes === true) {
            botJsonTemplate.inventory.items = clonedJson.inventory.items;
            botJsonTemplate.generation = isPriest ? lootOdds.boss : lootOdds.tier2;
        }
        this.botConf().equipment["sectantpriest"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].lightIsActiveDayChancePercent = 0;
        this.botConf().equipment["sectantpriest"].laserIsActiveChancePercent = 0;
        this.botConf().equipment["sectantwarrior"].laserIsActiveChancePercent = 0;
        if (this.modConfig.logEverything == true) {
            this.logger.info("cultLoad3 loaded");
        }
    }
    forceBossItems() {
        this.tagillaBase.inventory.equipment.Headwear = { "60a7acf20c5cb24b01346648": 1 };
        this.tagillaBase.inventory.equipment.FaceCover = { "60a7ad2a2198820d95707a2e": 1, "60a7ad3a0c5cb24b0134664a": 1 };
        this.tagillaBase.chances.equipment.FaceCover = 100;
        this.tagillaBase.chances.equipment.Headwear = 100;
        this.bigpipeBase.inventory.equipment.Headwear = { "628e4dd1f477aa12234918aa": 1 };
        this.bigpipeBase.inventory.equipment.FaceCover = { "62a61bbf8ec41a51b34758d2": 1 };
        this.bigpipeBase.chances.equipment.FaceCover = 100;
        this.knightBase.inventory.equipment.Headwear = {};
        this.knightBase.chances.equipment.Headwear = 0;
        this.knightBase.chances.equipment.FaceCover = 100;
        this.reshBase.inventory.equipment.SecondPrimaryWeapon = { "5b3b713c5acfc4330140bd8d": 1 };
    }
}
exports.BotLoader = BotLoader;
//# sourceMappingURL=bots.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Main = void 0;
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const ContextVariableType_1 = require("C:/snapshot/project/obj/context/ContextVariableType");
;
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const LogBackgroundColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogBackgroundColor");
const ExitStatis_1 = require("C:/snapshot/project/obj/models/enums/ExitStatis");
const attatchment_base_1 = require("./weapons/attatchment_base");
const fleamarket_1 = require("./traders/fleamarket");
const utils_1 = require("./utils/utils");
const arrays_1 = require("./utils/arrays");
const meds_1 = require("./items/meds");
const player_1 = require("./player/player");
const weapons_globals_1 = require("./weapons/weapons_globals");
const bots_1 = require("./bots/bots");
const bot_gen_1 = require("./bots/bot_gen");
const items_1 = require("./items/items");
const json_gen_1 = require("./json/json_gen");
const quests_1 = require("./traders/quests");
const insurance_1 = require("./traders/insurance");
const traders_1 = require("./traders/traders");
const spawns_1 = require("./bots/spawns");
const gear_1 = require("./items/gear");
const seasonalevents_1 = require("./misc/seasonalevents");
const item_cloning_1 = require("./items/item_cloning");
const description_gen_1 = require("./json/description_gen");
const json_handler_1 = require("./json/json-handler");
const ammo_1 = require("./ballistics/ammo");
const armor_1 = require("./ballistics/armor");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const instance_manager_1 = require("./instance_manager");
const crafts = require("../db/items/hideout_crafts.json");
const medItems = require("../db/items/med_items.json");
const medBuffs = require("../db/items/buffs.json");
const foodItems = require("../db/items/food_items.json");
const foodBuffs = require("../db/items/buffs_food.json");
const stimBuffs = require("../db/items/buffs_stims.json");
const modConfig = require("../config/config.json");
const realismInfo = require("../data/info.json");
const baseMapLoot = require("../db/maps/original_lootModifiers.json");
const playerMapLoot = require("../data/player_lootModifiers.json");
let adjustedTradersOnStart = false;
class Main {
    modLoader;
    preSptLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const jsonUtil = container.resolve("JsonUtil");
        const hashUtil = container.resolve("HashUtil");
        const randomUtil = container.resolve("RandomUtil");
        const weightedRandomHelper = container.resolve("WeightedRandomHelper");
        const staticRouterModService = container.resolve("StaticRouterModService");
        const HttpResponse = container.resolve("HttpResponseUtil");
        const configServer = container.resolve("ConfigServer");
        const databaseService = container.resolve("DatabaseService");
        const localisationService = container.resolve("LocalisationService");
        const fleaConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
        const profileHelper = container.resolve("ProfileHelper");
        const cloner = container.resolve("PrimaryCloner");
        const assortHelper = container.resolve("AssortHelper");
        const paymentHelper = container.resolve("PaymentHelper");
        const mathUtil = container.resolve("MathUtil");
        const timeUtil = container.resolve("TimeUtil");
        const traderAssortService = container.resolve("TraderAssortService");
        const traderHelper = container.resolve("TraderHelper");
        const fenceService = container.resolve("FenceService");
        const traderPurchasePefrsisterService = container.resolve("TraderPurchasePersisterService");
        const ragfairOfferGenerator = container.resolve("RagfairOfferGenerator");
        const ragfairAssortGenerator = container.resolve("RagfairAssortGenerator");
        const dynamicRouter = container.resolve("DynamicRouterModService");
        const preSptModLoader = container.resolve("PreSptModLoader");
        const traderRefersh = new traders_1.TraderRefresh(logger, mathUtil, timeUtil, databaseService, profileHelper, assortHelper, paymentHelper, ragfairAssortGenerator, ragfairOfferGenerator, traderAssortService, localisationService, traderPurchasePefrsisterService, traderHelper, fenceService, configServer, cloner);
        const flea = new fleamarket_1.FleaChangesPreDBLoad(logger, fleaConf, modConfig);
        const instanceManager = instance_manager_1.InstanceManager.getInstance();
        this.checkForMods(preSptModLoader, logger, modConfig);
        flea.loadFleaConfig();
        //way of checking if QB spawn system is active, and disabling certain aspects of Realism's spawn changes to compenstate
        dynamicRouter.registerDynamicRouter(`DynamicQuestingBotsSpawnSystemCheck`, [
            {
                url: "/QuestingBots/AdjustPMCConversionChances/",
                action: async (output) => {
                    utils_1.ModTracker.qtbSpawnsActive = true;
                    return output;
                }
            }
        ], "QuestingBotsSpawnSystemCheck");
        dynamicRouter.registerDynamicRouter("realismGetConfig", [
            {
                url: "/RealismMod/GetConfig",
                action: async (url, info, sessionID, output) => {
                    try {
                        return jsonUtil.serialize(modConfig);
                    }
                    catch (e) {
                        logger.error("Realism: Failed to read config file" + e);
                    }
                }
            }
        ], "RealismMod");
        dynamicRouter.registerDynamicRouter("realismGetTemplateData", [
            {
                url: "/RealismMod/GetTemplateData",
                action: async (url, info, sessionID, output) => {
                    try {
                        const statHandler = json_handler_1.ItemStatHandler.getInstance();
                        const data = await statHandler.processTemplateJson(true, path.join(__dirname, '..', 'db', 'templates'));
                        return jsonUtil.serialize(data);
                    }
                    catch (e) {
                        logger.error("Realism: Failed to get server template data" + e);
                    }
                }
            }
        ], "RealismMod");
        dynamicRouter.registerDynamicRouter("realismGetInfo", [
            {
                url: "/RealismMod/GetInfo",
                action: async (url, info, sessionID, output) => {
                    try {
                        const profileHelper = container.resolve("ProfileHelper");
                        const postLoadDBServer = container.resolve("DatabaseService");
                        const utils = utils_1.Utils.getInstance();
                        const pmcData = profileHelper.getPmcProfile(sessionID);
                        this.getEventData(pmcData, logger, utils);
                        this.setModInfo(logger);
                        return jsonUtil.serialize(realismInfo);
                    }
                    catch (e) {
                        logger.error("Realism: Failed to read info file" + e);
                    }
                }
            }
        ], "RealismMod");
        dynamicRouter.registerDynamicRouter("realismGetTOD", [
            {
                url: "/RealismMod/GetTimeOfDay",
                action: async (url, info, sessionID, output) => {
                    try {
                        this.setModInfo(logger);
                        return jsonUtil.serialize(realismInfo);
                    }
                    catch (e) {
                        logger.error("Failed to read info file" + e);
                    }
                }
            }
        ], "RealismMod");
        if (modConfig.bot_changes == true && utils_1.ModTracker.alpPresent == false) {
            const botLevelGenerator = container.resolve("BotLevelGenerator");
            const botInventoryGenerator = container.resolve("BotInventoryGenerator");
            const botHelper = container.resolve("BotHelper");
            const botEquipmentFilterService = container.resolve("BotEquipmentFilterService");
            const seasonalEventService = container.resolve("SeasonalEventService");
            const botGeneratorHelper = container.resolve("BotGeneratorHelper");
            const botNameService = container.resolve("BotNameService");
            const itemFilterService = container.resolve("ItemFilterService");
            const botGen = new bot_gen_1.BotGen(logger, hashUtil, randomUtil, timeUtil, profileHelper, databaseService, botInventoryGenerator, botLevelGenerator, botEquipmentFilterService, weightedRandomHelper, botHelper, botGeneratorHelper, seasonalEventService, itemFilterService, botNameService, configServer, cloner);
            container.afterResolution("BotGenerator", (_t, result) => {
                result.prepareAndGenerateBot = (sessionId, botGenerationDetails) => {
                    return botGen.myPrepareAndGenerateBot(sessionId, botGenerationDetails);
                };
            }, { frequency: "Always" });
            container.afterResolution("BotGenerator", (_t, result) => {
                result.generatePlayerScav = (sessionId, role, difficulty, botTemplate) => {
                    return botGen.myGeneratePlayerScav(sessionId, role, difficulty, botTemplate);
                };
            }, { frequency: "Always" });
        }
        container.afterResolution("TraderAssortHelper", (_t, result) => {
            result.resetExpiredTrader = (trader) => {
                return traderRefersh.myResetExpiredTrader(trader);
            };
        }, { frequency: "Always" });
        if (modConfig.randomize_trader_stock == true) {
            const httpResponse = container.resolve("HttpResponseUtil");
            const ragfairController = container.resolve("RagfairController");
            const ragfairTaxServ = container.resolve("RagfairTaxService");
            const ragfairServer = container.resolve("RagfairServer");
            const ragFairCallback = new traders_1.RagCallback(httpResponse, ragfairServer, ragfairController, ragfairTaxServ, configServer);
            container.afterResolution("RagfairCallbacks", (_t, result) => {
                result.search = (url, info, sessionID) => {
                    return ragFairCallback.mySearch(url, info, sessionID);
                };
            }, { frequency: "Always" });
        }
        if (modConfig.insurance_changes == true) {
            const eventOutputHolder = container.resolve("HttpResponseUtil");
            const saveServer = container.resolve("SaveServer");
            const itemHelper = container.resolve("ItemHelper");
            const InsuranceService = container.resolve("InsuranceService");
            const mailSendService = container.resolve("MailSendService");
            const ragfairPriceService = container.resolve("RagfairPriceService");
            const localizationService = container.resolve("LocalisationService");
            const dialogueHelper = container.resolve("DialogueHelper");
            const paymentService = container.resolve("PaymentService");
            const insuranceOverride = new insurance_1.InsuranceOverride(logger, randomUtil, mathUtil, hashUtil, eventOutputHolder, timeUtil, saveServer, databaseService, itemHelper, profileHelper, dialogueHelper, weightedRandomHelper, traderHelper, paymentService, InsuranceService, mailSendService, ragfairPriceService, localizationService, configServer, cloner);
            container.afterResolution("InsuranceController", (_t, result) => {
                result.processReturnByProfile = (sessionID) => {
                    return insuranceOverride.myProcessReturnByProfile(sessionID);
                };
            }, { frequency: "Always" });
        }
        staticRouterModService.registerStaticRouter("Realism-OnValidate", [
            {
                url: "/client/game/version/validate",
                action: async (url, info, sessionID, output) => {
                    const ragfairOfferGenerator = container.resolve("RagfairOfferGenerator");
                    const profileHelper = container.resolve("ProfileHelper");
                    const postLoadDBServer = container.resolve("DatabaseService");
                    const aKIFleaConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
                    const ragfairServer = container.resolve("RagfairServer");
                    const weatherConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.WEATHER);
                    const seeasonalEventConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.SEASONAL_EVENT);
                    const locationConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
                    const seasonalEventsService = container.resolve("SeasonalEventService");
                    const postLoadTables = postLoadDBServer.getTables();
                    const utils = utils_1.Utils.getInstance();
                    const tieredFlea = new fleamarket_1.TieredFlea(postLoadTables, aKIFleaConf);
                    const player = new player_1.Player(logger, postLoadTables, modConfig, medItems, utils);
                    const maps = new spawns_1.Spawns(logger, postLoadTables, modConfig, postLoadTables.locations, utils);
                    const quests = new quests_1.Quests(logger, postLoadTables, modConfig);
                    const randomizeTraderAssort = new traders_1.RandomizeTraderAssort();
                    const pmcData = profileHelper.getPmcProfile(sessionID);
                    const scavData = profileHelper.getScavProfile(sessionID);
                    const profileData = profileHelper.getFullProfile(sessionID);
                    try {
                        utils_1.ProfileTracker.checkLoggedInProfiles(pmcData, profileData, false);
                        if (modConfig.backup_profiles == true)
                            this.backupProfile(profileData, logger);
                        if (modConfig.enable_hazard_zones)
                            quests.resetRepeatableQuests(profileData);
                        this.checkForSeasonalEvents(logger, seasonalEventsService, seeasonalEventConfig, weatherConfig);
                        this.tryLockTradersForEvent(pmcData, logger, postLoadTables.globals.config);
                        if (modConfig.loot_changes)
                            this.loadMapLoot(locationConfig, sessionID, logger);
                        const healthProp = pmcData?.Health;
                        const hydroProp = pmcData?.Health?.Hydration;
                        if (healthProp != null) {
                            player.correctNegativeHP(pmcData);
                            player.setPlayerHealth(pmcData, scavData);
                            if (hydroProp != null) {
                                if (modConfig.revert_med_changes == true && modConfig.med_changes == false) {
                                    this.revertMeds(pmcData, utils);
                                    this.revertMeds(scavData, utils);
                                    this.revertHydroEnergy(pmcData, postLoadTables);
                                    this.revertHydroEnergy(scavData, postLoadTables);
                                    modConfig.revert_med_changes = false;
                                    utils.writeConfigJSON(modConfig, 'config/config.json');
                                    logger.info("Realism Mod: Meds in Inventory/Stash Reverted To Defaults");
                                }
                                this.checkProfile(pmcData, pmcData.Info.Experience, utils, player, logger);
                                this.checkProfile(scavData, pmcData.Info.Experience, utils, player, logger);
                            }
                        }
                        if (adjustedTradersOnStart == false) {
                            const profilesData = utils_1.ProfileTracker.getPmcProfileData(profileHelper);
                            randomizeTraderAssort.adjustTraderStockAtGameStart(profilesData);
                        }
                        adjustedTradersOnStart = true;
                        const traders = ragfairServer.getUpdateableTraders();
                        for (let traderID of traders) {
                            ragfairOfferGenerator.generateFleaOffersForTrader(traderID);
                        }
                        if (modConfig.tiered_flea == true) {
                            tieredFlea.updateFlea(logger, ragfairOfferGenerator, container, utils_1.ProfileTracker.averagePlayerLevel);
                        }
                        if (modConfig.boss_spawns == true) {
                            maps.setBossSpawnChance(utils_1.ProfileTracker.averagePlayerLevel, databaseService, seeasonalEventConfig);
                        }
                        if (modConfig.logEverything == true) {
                            logger.info("Realism Mod: Profile Checked");
                        }
                    }
                    catch (err) {
                        logger.error("Realism Mod: Error Checking Player Profile: " + err);
                    }
                    return output;
                }
            }
        ], "Realism");
        staticRouterModService.registerStaticRouter("Realism-RunOnGameLogout", [
            {
                url: "/client/game/logout",
                action: async (url, info, sessionID, output) => {
                    try {
                        const pmcData = profileHelper.getPmcProfile(sessionID);
                        const profileData = profileHelper.getFullProfile(sessionID);
                        utils_1.ProfileTracker.checkLoggedInProfiles(pmcData, profileData, true);
                    }
                    catch (err) {
                        logger.error("Realism Mod: Error At Log Out: " + err);
                    }
                    return output;
                }
            }
        ], "Realism");
        staticRouterModService.registerStaticRouter("Realism-RunAtProfileCreation", [
            {
                url: "/client/game/profile/create",
                action: async (url, info, sessionID, output) => {
                    const profileHelper = container.resolve("ProfileHelper");
                    const postLoadDBService = container.resolve("DatabaseService");
                    const postLoadtables = postLoadDBService.getTables();
                    const utils = utils_1.Utils.getInstance();
                    const player = new player_1.Player(logger, postLoadtables, modConfig, medItems, utils);
                    const pmcData = profileHelper.getPmcProfile(sessionID);
                    const scavData = profileHelper.getScavProfile(sessionID);
                    try {
                        this.checkProfile(pmcData, pmcData.Info.Experience, utils, player, logger);
                        this.checkProfile(scavData, scavData.Info.Experience, utils, player, logger);
                        if (modConfig.realistic_player_health == true) {
                            player.correctNewHealth(pmcData, scavData);
                        }
                        logger.info("Realism Mod: New Profile Modified");
                    }
                    catch (e) {
                        logger.error("Realism Mod: Error Editing New Profile: " + e);
                    }
                    return output;
                }
            }
        ], "Realism");
        staticRouterModService.registerStaticRouter("Realism-RunAtRaidStart", [
            {
                url: "/client/match/local/start",
                action: async (url, info, sessionID, output) => {
                    try {
                        const postLoadDBService = container.resolve("DatabaseService");
                        const postLoadTables = postLoadDBService.getTables();
                        const profileHelper = container.resolve("ProfileHelper");
                        const appContext = container.resolve("ApplicationContext");
                        const weatherGenerator = container.resolve("WeatherGenerator");
                        const matchInfo = appContext.getLatestValue(ContextVariableType_1.ContextVariableType.RAID_CONFIGURATION).getValue();
                        const pmcConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.PMC);
                        const arrays = new arrays_1.BotArrays(postLoadTables);
                        const utils = utils_1.Utils.getInstance();
                        const botLoader = bots_1.BotLoader.getInstance();
                        const pmcData = profileHelper.getPmcProfile(sessionID);
                        const profileData = profileHelper.getFullProfile(sessionID);
                        utils_1.RaidInfoTracker.generatedBotsCount = 0;
                        //had a concern that bot loot cache isn't being reset properly since I've overriden it with my own implementation, so to be safe...
                        // const myGetLootCache = new MyLootCache(logger, jsonUtil, itemHelper, postLoadDBServer, pmcLootGenerator, localisationService, ragfairPriceService);
                        // myGetLootCache.myClearCache();
                        const baseTime = weatherGenerator.calculateGameTime({ acceleration: 0, time: "", date: "", weather: undefined, season: 1 }).time; //apparently regenerates weather?
                        utils_1.RaidInfoTracker.mapName = matchInfo.location.toLowerCase();
                        let realTime = "";
                        let mapType;
                        //update global player level
                        utils_1.ProfileTracker.checkLoggedInProfiles(pmcData, profileData, false);
                        if (matchInfo.timeVariant === "PAST") {
                            realTime = utils.getTime(baseTime, 12);
                        }
                        if (matchInfo.timeVariant === "CURR") {
                            realTime = utils.getTime(baseTime, 0);
                        }
                        utils_1.RaidInfoTracker.isNight = utils.isNight(realTime, matchInfo.location);
                        if (arrays_1.StaticArrays.cqbMaps.includes(utils_1.RaidInfoTracker.mapName)) {
                            mapType = utils_1.MapType.CQB;
                        }
                        if (arrays_1.StaticArrays.outdoorMaps.includes(utils_1.RaidInfoTracker.mapName)) {
                            mapType = utils_1.MapType.Outdoor;
                        }
                        if (arrays_1.StaticArrays.urbanMaps.includes(utils_1.RaidInfoTracker.mapName)) {
                            mapType = utils_1.MapType.Urban;
                        }
                        utils_1.RaidInfoTracker.mapType = mapType;
                        if (modConfig.bot_changes == true && utils_1.ModTracker.alpPresent == false) {
                            botLoader.updateBots(pmcData, logger, modConfig, botLoader, utils);
                        }
                        if (!utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbSpawnsActive) {
                            pmcConf.convertIntoPmcChance.laboratory = {
                                "assault": {
                                    "min": 100,
                                    "max": 100
                                },
                                "pmcbot": {
                                    "min": 0,
                                    "max": 0
                                }
                            };
                        }
                        logger.warning("Avg. Player Level = " + utils_1.ProfileTracker.averagePlayerLevel);
                        logger.warning("Map Name = " + matchInfo.location);
                        logger.warning("Map Type  = " + mapType);
                        logger.warning("Base Time: " + baseTime + " Real Time: " + realTime);
                        logger.warning("Is Night = " + utils_1.RaidInfoTracker.isNight);
                    }
                    catch (err) {
                        logger.error("Realism Mod: Failed To Fetch Application Context Data" + err);
                    }
                    return output;
                }
            }
        ], "Realism");
        staticRouterModService.registerStaticRouter("Realism-RunAtRaidEnd", [
            {
                url: "/client/match/local/end",
                action: async (url, info, sessionID, output) => {
                    const postLoadDBService = container.resolve("DatabaseService");
                    const postLoadTables = postLoadDBService.getTables();
                    const profileHelper = container.resolve("ProfileHelper");
                    const ragfairOfferGenerator = container.resolve("RagfairOfferGenerator");
                    const locationConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
                    // const localisationService = container.resolve<LocalisationService>("LocalisationService");
                    // const ragfairPriceService = container.resolve<RagfairPriceService>("RagfairPriceService");
                    // const pmcLootGenerator = container.resolve<PMCLootGenerator>("PMCLootGenerator");
                    // const itemHelper = container.resolve<ItemHelper>("ItemHelper");
                    const aKIFleaConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
                    const tieredFlea = new fleamarket_1.TieredFlea(postLoadTables, aKIFleaConf);
                    const utils = utils_1.Utils.getInstance();
                    const player = new player_1.Player(logger, postLoadTables, modConfig, medItems, utils);
                    const pmcData = profileHelper.getPmcProfile(sessionID);
                    const scavData = profileHelper.getScavProfile(sessionID);
                    const profileData = profileHelper.getFullProfile(sessionID);
                    const quests = new quests_1.Quests(logger, postLoadTables, modConfig);
                    const seeasonalEventConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.SEASONAL_EVENT);
                    const maps = new spawns_1.Spawns(logger, postLoadTables, modConfig, postLoadTables.locations, utils);
                    //had a concern that bot loot cache isn't being reset properly since I've overriden it with my own implementation, so to be safe...
                    // const myGetLootCache = new MyLootCache(logger, jsonUtil, itemHelper, postLoadDBServer, pmcLootGenerator, localisationService, ragfairPriceService);
                    // myGetLootCache.myClearCache();
                    try {
                        utils_1.RaidInfoTracker.generatedBotsCount = 0;
                        //update global player level
                        utils_1.ProfileTracker.checkLoggedInProfiles(pmcData, profileData, false);
                        if (modConfig.tiered_flea == true)
                            tieredFlea.updateFlea(logger, ragfairOfferGenerator, container, utils_1.ProfileTracker.averagePlayerLevel);
                        if (modConfig.enable_hazard_zones)
                            quests.resetRepeatableQuests(profileData);
                        if (modConfig.boss_spawns == true)
                            maps.setBossSpawnChance(utils_1.ProfileTracker.averagePlayerLevel, databaseService, seeasonalEventConfig);
                        if (modConfig.loot_changes)
                            this.modifyMapLoot(locationConfig, utils_1.RaidInfoTracker.mapName, info, pmcData, sessionID, utils, logger);
                        this.checkEventQuests(pmcData);
                        player.correctNegativeHP(pmcData);
                        if (modConfig.realistic_player_health == true)
                            player.setNewScavRealisticHealth(scavData);
                        this.tryLockTradersForEvent(pmcData, logger, postLoadTables.globals.config);
                        if (modConfig.logEverything == true) {
                            logger.info("Realism Mod: Updated at Raid End");
                        }
                    }
                    catch (err) {
                        logger.error("Realism Mod: Error Updating At Raid End: " + err);
                    }
                    return output;
                }
            }
        ], "Realism");
    }
    backupProfile(profileData, logger) {
        const profileFileData = JSON.stringify(profileData, null, 4);
        let index = 0;
        if (index == 0) {
            index = 1;
            let modPath = path.join(__dirname, '..');
            let profileFolderPath = modPath + "/ProfileBackups/";
            let profileFilePath = modPath + "/ProfileBackups/" + profileData.info.id;
            if (fs.existsSync(profileFilePath)) {
                this.profileBackupHelper(profileFileData, profileFilePath, profileData, logger);
            }
            else {
                fs.mkdir(path.join(profileFolderPath, profileData.info.id), (err) => {
                    if (err) {
                        return logger.error("Realism Mod: Error Backing Up Profile; " + err);
                    }
                    logger.log("Realism Mod: Backup path does not exist, creating folder....", "magenta");
                });
                this.profileBackupHelper(profileFileData, profileFilePath, profileData, logger);
            }
        }
    }
    profileBackupHelper(profileFileData, pathforProfile, profileData, logger) {
        let date = new Date();
        let time = date.toLocaleTimeString();
        let edit_time = time.replaceAll(" ", "_");
        let edit_time2 = edit_time.replaceAll(":", "-");
        let day = date.toISOString().slice(0, 10);
        let combinedTime = "_" + day + "_" + edit_time2;
        let backupName = pathforProfile + "/" + profileData.info.id + combinedTime + ".json";
        fs.writeFile(backupName, profileFileData, {
            encoding: "utf8",
            flag: "w",
            mode: 0o666
        }, (err) => {
            if (err)
                logger.error("Realism Mod: Error Backing Up Profile; " + err);
            else {
                logger.log(`Realism Mod: Profile backup executed successfully: ${combinedTime}`, "green");
            }
        });
    }
    postDBLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const databaseService = container.resolve("DatabaseService");
        const configServer = container.resolve("ConfigServer");
        const jsonUtil = container.resolve("JsonUtil");
        const weatherConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.WEATHER);
        const locationConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.LOCATION);
        const seeasonalEventConfig = container.resolve("ConfigServer").getConfig(ConfigTypes_1.ConfigTypes.SEASONAL_EVENT);
        const seasonalEventsService = container.resolve("SeasonalEventService");
        const hashUtil = container.resolve("HashUtil");
        const tables = databaseService.getTables();
        const aKIFleaConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
        const inventoryConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.INVENTORY);
        const raidConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.IN_RAID);
        const itemConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.ITEM);
        const traderConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        const insConf = configServer.getConfig(ConfigTypes_1.ConfigTypes.INSURANCE);
        const arrays = new arrays_1.BotArrays(tables);
        const utils = utils_1.Utils.getInstance(tables);
        const ammo = new ammo_1.Ammo(logger, tables, modConfig);
        const armor = new armor_1.Armor(logger, tables, modConfig);
        const attachBase = new attatchment_base_1.AttachmentBase(logger, tables, modConfig, utils);
        const botLoader = bots_1.BotLoader.getInstance(logger, tables, configServer, modConfig, arrays, utils);
        const itemsClass = new items_1.ItemsClass(logger, tables, modConfig, inventoryConf, raidConf, aKIFleaConf, itemConf);
        const consumables = new meds_1.Consumables(logger, tables, modConfig, medItems, foodItems, medBuffs, foodBuffs, stimBuffs);
        const player = new player_1.Player(logger, tables, modConfig, medItems, utils);
        const weaponsGlobals = new weapons_globals_1.WeaponsGlobals(logger, tables, modConfig);
        const fleaChangesPostDB = new fleamarket_1.FleaChangesPostDBLoad(logger, tables, modConfig, aKIFleaConf);
        const jsonGen = new json_gen_1.JsonGen(logger, tables, modConfig, utils);
        const fleaChangesPreDB = new fleamarket_1.FleaChangesPreDBLoad(logger, aKIFleaConf, modConfig);
        const quests = new quests_1.Quests(logger, tables, modConfig);
        const traders = new traders_1.Traders(logger, tables, modConfig, traderConf, utils);
        const maps = new spawns_1.Spawns(logger, tables, modConfig, tables.locations, utils);
        const gear = new gear_1.Gear(tables, logger, modConfig);
        const itemCloning = new item_cloning_1.ItemCloning(logger, tables, modConfig, jsonUtil, medItems, crafts);
        const statHandler = json_handler_1.ItemStatHandler.getInstance(tables, logger, hashUtil);
        const descGen = new description_gen_1.DescriptionGen(tables, modConfig, logger, statHandler);
        //Remember to back up json data before using this, and make sure it isn't overriding existing json objects
        // jsonGen.attTemplatesCodeGen();
        // jsonGen.weapTemplatesCodeGen();
        // jsonGen.gearTemplatesCodeGen();
        // jsonGen.ammoTemplatesCodeGen();
        // jsonGen.genArmorMods();
        this.checkForSeasonalEvents(logger, seasonalEventsService, seeasonalEventConfig, weatherConfig, true);
        if (modConfig.enable_hazard_zones) {
            quests.loadHazardQuests();
        }
        if (modConfig.enable_hazard_zones) {
            gear.loadSpecialSlotChanges();
            gear.addResourceToGasMaskFilters();
            itemCloning.createCustomHazardItems();
        }
        if (modConfig.recoil_attachment_overhaul == true) {
            itemCloning.createCustomWeapons();
            itemCloning.createCustomAttachments();
            attachBase.loadAttCompat();
            attachBase.loadCaliberConversions();
        }
        itemsClass.addCustomItems();
        if (modConfig.realistic_ballistics) {
            itemCloning.createCustomPlates();
            botLoader.setBotHealth();
        }
        if (modConfig.open_zones_fix == true && !utils_1.ModTracker.swagPresent) {
            maps.openZonesFix();
        }
        maps.loadSpawnChanges(locationConfig);
        if (modConfig.bot_changes == true && utils_1.ModTracker.alpPresent == false) {
            botLoader.loadBots();
        }
        //spt bug: items can have zero uses
        // if(modConfig.bot_loot_changes){
        //     bots.loadBotLootChanges();
        // }
        if (modConfig.bot_testing == true && modConfig.bot_test_weps_enabled == true && modConfig.all_scavs == true && modConfig.bot_test_tier == 4) {
            logger.warning("Realism Mod: testing enabled, bots will be limited to a cap of 1");
            botLoader.testBotCap();
        }
        else if (modConfig.increased_bot_cap == true && !utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbPresent) {
            botLoader.increaseBotCap();
        }
        else if (modConfig.spawn_waves == true && !utils_1.ModTracker.swagPresent && !utils_1.ModTracker.qtbPresent) {
            botLoader.increasePerformance();
        }
        if (modConfig.bot_names == true) {
            botLoader.botNames();
        }
        if (modConfig.guarantee_boss_spawn == true) {
            maps.forceBossSpawns();
        }
        //need to add diffuclity values to experience obj or abandon
        // if (modConfig.boss_difficulty == true) {
        //     bots.bossDifficulty();
        // }
        if (modConfig.med_changes == true) {
            itemCloning.createCustomMedItems();
            // bots.botMeds();
            consumables.loadMeds();
        }
        if (modConfig.food_changes == true) {
            consumables.loadFood();
        }
        if (modConfig.stim_changes == true) {
            consumables.loadStims();
        }
        botLoader.botHpMulti();
        fleaChangesPostDB.loadFleaGlobal(); //has to run post db load, otherwise item templates are undefined 
        fleaChangesPreDB.loadFleaConfig(); //probably redundant, but just in case
        // if (modConfig.headset_changes) {
        //     gear.loadHeadsetTweaks();
        // }
        if (modConfig.remove_quest_fir_req == true) {
            quests.removeFIRQuestRequire();
        }
        //traders
        traders.modifyInsurance(insConf);
        traders.loadTraderTweaks();
        traders.setBaseOfferValues();
        if (modConfig.add_cust_trader_items == true) {
            traders.addItemsToAssorts();
        }
        if (modConfig.bot_changes == true && utils_1.ModTracker.alpPresent == false) {
            attachBase.loadAttRequirements();
        }
        if (modConfig.trader_refresh_time > 0) {
            traders.setTraderRefreshTimes();
        }
        itemsClass.loadItemBlacklists();
        itemsClass.loadItemsRestrictions();
        player.loadPlayerStats();
        player.playerProfiles(jsonUtil);
        weaponsGlobals.loadGlobalWeps();
        traders.loadTraderRepairs();
        if (modConfig.realistic_ballistics)
            traders.adjustArmorHandbookPrices();
        //have to run this async to ensure correct load order
        (async () => {
            if (modConfig.realistic_ballistics == true) {
                ammo.loadAmmoStats();
                armor.loadArmorStats();
                ammo.grenadeTweaks();
            }
            if (modConfig.recoil_attachment_overhaul) {
                statHandler.pushModsToServer();
                statHandler.pushWeaponsToServer();
            }
            statHandler.pushGearToServer();
            await statHandler.processTemplateJson(false);
            descGen.descriptionGen();
            if (modConfig.malf_changes == true) {
                weaponsGlobals.loadGlobalMalfChanges();
            }
            if (modConfig.recoil_attachment_overhaul) {
                ammo.loadAmmoFirerateChanges();
                quests.fixMechancicQuests();
            }
            gear.loadGearConflicts();
            statHandler.modifiedItems = {}; //empty temp template object
        })();
    }
    postSptLoad(container) {
        this.modLoader = container.resolve("PreSptModLoader");
    }
    setModInfo(logger) {
        realismInfo.IsNightTime = utils_1.RaidInfoTracker.isNight;
        realismInfo.IsHalloween = seasonalevents_1.EventTracker.isHalloween;
        realismInfo.isChristmas = seasonalevents_1.EventTracker.isChristmas;
        realismInfo.DoGasEvent = seasonalevents_1.EventTracker.doGasEvent;
        realismInfo.HasExploded = seasonalevents_1.EventTracker.isHalloween && !seasonalevents_1.EventTracker.endExplosionEvent && seasonalevents_1.EventTracker.hasExploded;
        realismInfo.IsPreExplosion = seasonalevents_1.EventTracker.isHalloween && !seasonalevents_1.EventTracker.endExplosionEvent && seasonalevents_1.EventTracker.isPreExplosion;
        realismInfo.DoExtraRaiders = seasonalevents_1.EventTracker.isHalloween && seasonalevents_1.EventTracker.doExtraRaiderSpawns;
        realismInfo.DoExtraCultists = seasonalevents_1.EventTracker.isHalloween && seasonalevents_1.EventTracker.doExtraCultistSpawns;
        if (modConfig.logEverything) {
            logger.warning("realismInfo.DoExtraRaiders " + realismInfo.DoExtraRaiders);
            logger.warning("realismInfo.DoExtraCultists " + realismInfo.DoExtraCultists);
            logger.warning("realismInfo.IsPreExplosion " + realismInfo.IsPreExplosion);
            logger.warning("realismInfo.HasExploded " + realismInfo.HasExploded);
            logger.warning("realismInfo.DoGasEvent " + realismInfo.DoGasEvent);
            logger.warning("realismInfo.IsHalloween " + realismInfo.IsHalloween);
            logger.warning("realismInfo.IsNightTime " + realismInfo.IsNightTime);
        }
    }
    revertMeds(profileData, utils) {
        utils.revertMedItems(profileData);
    }
    revertHydroEnergy(profileData, tables) {
        const healthTemplate = tables.templates.profiles.Standard.bear.character.Health;
        const defaultHydration = healthTemplate.Hydration.Maximum;
        const defaultEnergy = healthTemplate.Energy.Maximum;
        profileData.Health.Hydration.Maximum = defaultHydration;
        profileData.Health.Energy.Maximum = defaultEnergy;
        if (profileData.Health.Energy.Current > profileData.Health.Energy.Maximum) {
            profileData.Health.Hydration.Current = defaultHydration;
            profileData.Health.Energy.Current = defaultEnergy;
        }
    }
    loadMapLoot(locationConfig, profileId, logger) {
        if (!playerMapLoot[profileId]) {
            playerMapLoot[profileId] =
                {
                    looseLootMultiplier: { ...baseMapLoot.looseLootMultiplier },
                    staticLootMultiplier: { ...baseMapLoot.staticLootMultiplier }
                };
        }
        locationConfig.looseLootMultiplier = playerMapLoot[profileId].looseLootMultiplier;
        locationConfig.staticLootMultiplier = playerMapLoot[profileId].staticLootMultiplier;
    }
    modifyMapLoot(locationConfig, map, raidData, pmcData, profileId, utils, logger) {
        const exitStatus = raidData.results.result;
        let lootXp = 0;
        if (exitStatus !== ExitStatis_1.ExitStatus.KILLED && exitStatus !== ExitStatis_1.ExitStatus.MISSINGINACTION) {
            const counters = pmcData.Stats.Eft.OverallCounters.Items;
            for (const counter of counters) {
                if (counter.Key.includes("ExpLooting")) {
                    lootXp = Math.min(lootXp + counter.Value, 1000);
                }
            }
        }
        const looseModifier = utils.clampNumber(lootXp * 0.000035, 0, 0.04);
        const staticModifier = utils.clampNumber(lootXp * 0.00002, 0, 0.03);
        const looseLootRegenRate = 0.04;
        const staticLootRegenRate = 0.03;
        const baseLooseLoot = baseMapLoot.looseLootMultiplier;
        const baseStaticLoot = baseMapLoot.staticLootMultiplier;
        const originalLooseMapModi = baseLooseLoot[map];
        const originalStaticMapModi = baseStaticLoot[map];
        const minLooseLoot = originalLooseMapModi * 0.75;
        const minstaticLoot = originalLooseMapModi * 0.4;
        const mapAliases = {
            "factory4_day": ["factory4_day", "factory4_night"],
            "factory4_night": ["factory4_day", "factory4_night"]
        };
        const mapsToUpdate = mapAliases[map] || [map]; //if mapAliases has a key, use the corresponding array, otherwise make an array of our singular map
        // logger.warning("==============" + map + "==============");
        // logger.warning("==loose loot modi: " + looseModifier);
        // logger.warning("==static loot modi: " + staticModifier);
        if (!playerMapLoot[profileId]) {
            //logger.warning("no profile found, creating new entry");
            playerMapLoot[profileId] =
                {
                    looseLootMultiplier: { ...baseLooseLoot },
                    staticLootMultiplier: { ...baseStaticLoot }
                };
        }
        //logger.warning("Found profile entry ");
        let looseLootModis = playerMapLoot[profileId].looseLootMultiplier;
        let staticLootModis = playerMapLoot[profileId].staticLootMultiplier;
        mapsToUpdate.forEach((currentMap) => {
            // logger.warning("current loose loot modi: " + looseLootModis[currentMap]);
            // logger.warning("current static loot modi: " + staticLootModis[currentMap]);
            looseLootModis[map] = utils.clampNumber(looseLootModis[currentMap] - looseModifier, minLooseLoot, originalLooseMapModi);
            staticLootModis[map] = utils.clampNumber(staticLootModis[currentMap] - staticModifier, minstaticLoot, originalStaticMapModi);
            // logger.warning("modified loose loot modi: " + looseLootModis[currentMap]);
            // logger.warning("modified static loot modi: " + staticLootModis[currentMap]);
        });
        //logger.warning("==Regenerating other map loot");
        if (exitStatus !== ExitStatis_1.ExitStatus.RUNNER) {
            for (const i in playerMapLoot[profileId].staticLootMultiplier) {
                //logger.warning("==");
                //logger.warning("map " + i);
                if (!mapsToUpdate.includes(i)) {
                    let looseMapLootModi = playerMapLoot[profileId].looseLootMultiplier;
                    let staticMapLootModi = playerMapLoot[profileId].staticLootMultiplier;
                    // logger.warning("current loose loot modi: " + looseMapLootModis[i]);
                    // logger.warning("current static loot modi: " + staticMapLootModis[i]);
                    looseMapLootModi[i] = utils.clampNumber(looseMapLootModi[i] + looseLootRegenRate, minLooseLoot, baseLooseLoot[i]);
                    staticMapLootModi[i] = utils.clampNumber(staticMapLootModi[i] + staticLootRegenRate, minstaticLoot, baseStaticLoot[i]);
                    // logger.warning("modified loose loot modi: " + looseMapLootModis[i]);
                    // logger.warning("modified static loot modi: " + staticMapLootModis[i]);
                }
            }
        }
        utils.writeConfigJSON(playerMapLoot, 'data/player_lootModifiers.json');
        //logger.warning("==Saved to file");
        locationConfig.looseLootMultiplier = playerMapLoot[profileId].looseLootMultiplier;
        locationConfig.staticLootMultiplier = playerMapLoot[profileId].staticLootMultiplier;
        //logger.warning("==Updated SPT configs");
    }
    checkForSeasonalEvents(logger, seasonalEventsService, seasonalConfig, weatherConfig, logGreetings = false) {
        if (modConfig.enable_hazard_zones) {
            const currentDate = new Date();
            const halloweenStart = new Date(currentDate.getFullYear(), 9, 20);
            const halloweenEnd = new Date(currentDate.getFullYear(), 10, 5);
            if (currentDate >= halloweenStart && currentDate <= halloweenEnd) {
                seasonalConfig.enableSeasonalEventDetection = false; //otherwise it enables BSG's summoning event which interferes with my events
                seasonalevents_1.EventTracker.isHalloween = true;
            }
        }
        seasonalevents_1.EventTracker.isChristmas = seasonalEventsService.christmasEventEnabled() && seasonalEventsService.isAutomaticEventDetectionEnabled() ? true : false;
        if (seasonalevents_1.EventTracker.isChristmas == true && logGreetings) {
            logger.warning("Merry Christmas!");
        }
        if (seasonalevents_1.EventTracker.isHalloween == true && logGreetings) {
            weatherConfig.overrideSeason = 1;
            const skull = `
   _______     
  /       \\   
 /  O   O  \\  
 |    ^    | 
 |   ---   | 
  \\___ ___/  
   |     |    
   |__ __|    
  /       \\   
 /_/|   |\\_\\`;
            logger.logWithColor(skull, LogTextColor_1.LogTextColor.MAGENTA);
        }
    }
    tryLockTradersForEvent(pmcData, logger, globalConfig) {
        let completedQuest;
        let didExplosion;
        let shouldDisableTraders = false;
        if (pmcData?.Quests == null)
            return;
        pmcData.Quests.forEach(q => {
            //blue flame part 2
            if (q.qid === "6702b4a27d4a4a89fce96fbc") {
                completedQuest = q.status === 4;
                didExplosion = q.completedConditions.includes("6702b4c1fda5e39ba46ccf35");
            }
        });
        if (seasonalevents_1.EventTracker.isHalloween && didExplosion && !completedQuest) {
            shouldDisableTraders = true;
        }
        for (const traderId in pmcData.TradersInfo) {
            const trader = pmcData.TradersInfo[traderId];
            if (traderId === "579dc571d53a0658a154fbec")
                continue;
            trader.disabled = shouldDisableTraders;
        }
        if (shouldDisableTraders) {
            globalConfig.RagFair.minUserLevel = 99;
        }
    }
    checkEventQuests(pmcData) {
        seasonalevents_1.EventTracker.doGasEvent = false;
        seasonalevents_1.EventTracker.doExtraCultistSpawns = false;
        seasonalevents_1.EventTracker.hasExploded = false;
        seasonalevents_1.EventTracker.doExtraRaiderSpawns = false;
        seasonalevents_1.EventTracker.isPreExplosion = false;
        seasonalevents_1.EventTracker.endExplosionEvent = false;
        let baseGasChance = seasonalevents_1.EventTracker.isHalloween ? 20 : 0;
        if (pmcData?.Quests != null) {
            pmcData.Quests.forEach(q => {
                const isStarted = q.status === 2 || q.status === 3;
                const isCompleted = q.status === 4;
                //bad omens part 1
                if (q.qid === "6702afe9504c9aca4ed75d9a") {
                    if (isStarted || isCompleted) {
                        baseGasChance += 50;
                    }
                }
                //bad omens part 2
                if (q.qid === "6702b0a1b9fb4619debd0697") {
                    if (isStarted || isCompleted) {
                        baseGasChance += 50;
                    }
                }
                //bad omens part 3
                if (q.qid === "6702b0e9601acf629d212eeb") {
                    if (isStarted || isCompleted) {
                        baseGasChance += 100;
                    }
                }
                //former patients
                if (q.qid === "6702b8b3c0f2f525d988e428") {
                    if (isStarted || isCompleted) {
                        baseGasChance += 250;
                    }
                }
                //critical mass
                if (q.qid === "670ae811bd43cbf026768126") {
                    if (isStarted || isCompleted) {
                        baseGasChance += 150;
                    }
                }
                //do no harm
                if (q.qid === "6702b3b624c7ac4e2d3e9c37") {
                    if (isStarted) {
                        baseGasChance = 1000;
                        seasonalevents_1.EventTracker.doExtraCultistSpawns = true;
                    }
                    else if (isCompleted) {
                        baseGasChance = seasonalevents_1.EventTracker.isHalloween ? 100 : 10;
                    }
                }
                //blue flame part 1
                if (q.qid === "6702b3e4aff397fa3e666fa5") {
                }
                //blue flame part 2
                if (q.qid === "6702b4a27d4a4a89fce96fbc") {
                    const didExplosion = q.completedConditions.includes("6702b4c1fda5e39ba46ccf35");
                    seasonalevents_1.EventTracker.isPreExplosion = isStarted;
                    if (isStarted) {
                        seasonalevents_1.EventTracker.doExtraRaiderSpawns = seasonalevents_1.EventTracker.isHalloween;
                    }
                    if (didExplosion || isCompleted) {
                        seasonalevents_1.EventTracker.doExtraRaiderSpawns = false;
                        seasonalevents_1.EventTracker.hasExploded = true;
                    }
                    if (didExplosion && !isCompleted) {
                        baseGasChance = 0;
                    }
                    if (isCompleted) {
                        seasonalevents_1.EventTracker.endExplosionEvent = true;
                    }
                }
            });
        }
        return baseGasChance;
    }
    getEventData(pmcData, logger, utils) {
        const gasChance = this.checkEventQuests(pmcData);
        seasonalevents_1.EventTracker.doGasEvent = gasChance > utils.pickRandNumInRange(0, 1000);
        if (modConfig.logEverything)
            logger.warning("gas chance " + gasChance);
    }
    checkProfile(pmcData, pmcEXP, utils, player, logger) {
        utils.correctItemResources(pmcData, pmcEXP, logger);
        if (modConfig.med_changes == true) {
            pmcData.Health.Hydration.Maximum = player.realisticHydration;
            pmcData.Health.Energy.Maximum = player.realisticEnergy;
            if (pmcData.Info.Experience == 0) {
                pmcData.Health.Hydration.Current = player.realisticHydration;
                pmcData.Health.Energy.Current = player.realisticEnergy;
                logger.info("Realism Mod: New Profile Meds And Hydration/Energy Adjusted");
            }
        }
        if (modConfig.logEverything == true) {
            logger.info("Realism Mod: Profile Checked");
        }
    }
    checkForMods(preSptModLoader, logger, modConf) {
        const activeMods = preSptModLoader.getImportedModDetails();
        for (const modname in activeMods) {
            // if (modname.includes("Jiro-BatterySystem")) {
            //     ModTracker.batteryModPresent = true;
            //     logger.logWithColor("Realism: Jiro Battery Mod Detected, Making Adjustments", LogTextColor.GREEN);
            // }
            if (modname.includes("Solarint-SAIN-ServerMod")) {
                utils_1.ModTracker.sainPresent = true;
                logger.logWithColor("Realism: SAIN Detected, Making Adjustments", LogTextColor_1.LogTextColor.GREEN);
            }
            if (modname.includes("QuestingBots")) {
                utils_1.ModTracker.qtbPresent = true;
                logger.logWithColor("Realism: Questing Bots Detected, Making Adjustments", LogTextColor_1.LogTextColor.GREEN);
            }
            if (modname.includes("SWAG")) {
                utils_1.ModTracker.swagPresent = true;
                logger.logWithColor("Realism: SWAG Detected, Making Adjustments", LogTextColor_1.LogTextColor.GREEN);
            }
            if (modname.includes("TacticalGearComponent")) {
                utils_1.ModTracker.tgcPresent = true;
                logger.logWithColor("Realism: TGC Detected, Making Adjustments", LogTextColor_1.LogTextColor.GREEN);
            }
            if (modname.includes("AlgorithmicLevelProgression")) {
                utils_1.ModTracker.alpPresent = true;
                if (modConf.bot_changes == true) {
                    logger.logWithColor("===========================!============================", LogTextColor_1.LogTextColor.WHITE, LogBackgroundColor_1.LogBackgroundColor.RED);
                    logger.logWithColor("Realism: WARNING, ALP DETECTED! You have Realism's bot progression enabled already. Either uninstall ALP or disable Realism's bot changes!", LogTextColor_1.LogTextColor.WHITE, LogBackgroundColor_1.LogBackgroundColor.RED);
                    logger.logWithColor("===========================!============================", LogTextColor_1.LogTextColor.WHITE, LogBackgroundColor_1.LogBackgroundColor.RED);
                }
                else {
                    logger.logWithColor("Realism: ALP Detected, Making Adjustments", LogTextColor_1.LogTextColor.GREEN);
                }
            }
        }
    }
}
exports.Main = Main;
module.exports = { mod: new Main() };
//# sourceMappingURL=mod.js.map
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotTierTracker = exports.RaidInfoTracker = exports.MapType = exports.ConfigChecker = exports.ProfileTracker = exports.ModTracker = exports.Utils = void 0;
const path = __importStar(require("path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const instance_manager_1 = require("../instance_manager");
const LogTextColor_1 = require("C:/snapshot/project/obj/models/spt/logging/LogTextColor");
const fs = require('fs');
const modConfig = require("../../config/config.json");
class Utils {
    tables;
    constructor(tables) {
        this.tables = tables;
    }
    static instance;
    static getInstance(tables) {
        if (!Utils.instance)
            Utils.instance = new Utils(tables);
        return Utils.instance;
    }
    itemDB() {
        return this.tables.templates.items;
    }
    getInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return (max > min) ? Math.floor(Math.random() * (max - min + 1) + min) : min;
    }
    getArrayValue(arr) {
        return arr[this.getInt(0, arr.length - 1)];
    }
    revertMedItems(playerData) {
        if (playerData?.Inventory != null) {
            for (let i in playerData.Inventory.items) {
                if (playerData.Inventory.items[i]?.upd?.MedKit?.HpResource != null) {
                    let templateItem = this.itemDB()[playerData.Inventory.items[i]._tpl];
                    if (templateItem != null) {
                        playerData.Inventory.items[i].upd.MedKit.HpResource = templateItem._props.MaxHpResource;
                    }
                }
            }
        }
    }
    correctItemResources(playerData, playerXP, logger) {
        if (playerData?.Inventory != null) {
            for (let i in playerData.Inventory.items) {
                let profileItem = playerData.Inventory.items[i];
                if (profileItem?.upd?.Repairable?.Durability != null) {
                    this.correctDuraHelper(profileItem, playerXP);
                }
                if (modConfig.med_changes == true && profileItem?.upd?.MedKit?.HpResource != null) {
                    this.correctMedicalRes(profileItem, playerXP, logger);
                }
                if (modConfig.food_changes == true && profileItem?.upd?.FoodDrink?.HpPercent != null) {
                    this.correctProvisionRes(profileItem, playerXP, logger);
                }
            }
        }
    }
    correctProvisionRes(profileItem, playerXP, logger) {
        let templateItem = this.itemDB()[profileItem._tpl];
        if (templateItem != null && (profileItem.upd.FoodDrink.HpPercent > templateItem._props.MaxResource || playerXP == 0)) {
            profileItem.upd.FoodDrink.HpPercent = templateItem._props.MaxResource;
        }
    }
    correctMedicalRes(profileItem, playerXP, logger) {
        let templateItem = this.itemDB()[profileItem._tpl];
        if (templateItem != null && (profileItem.upd.MedKit.HpResource > templateItem._props.MaxHpResource || playerXP == 0)) {
            profileItem.upd.MedKit.HpResource = templateItem._props.MaxHpResource;
        }
    }
    correctDuraHelper(profileItem, playerXP) {
        let templateItem = this.itemDB()[profileItem._tpl];
        if (templateItem != null && (profileItem.upd.Repairable.Durability > templateItem._props.MaxDurability || playerXP == 0)) {
            profileItem.upd.Repairable.Durability = templateItem._props.Durability;
            profileItem.upd.Repairable.MaxDurability = templateItem._props.MaxDurability;
        }
    }
    probabilityWeighter(items, weights) {
        function add(a, b) { return a + b; }
        let totalWeight = weights.reduce(add, 0);
        let weighedElems = [];
        let currentElem = 0;
        while (currentElem < items.length) {
            for (let i = 0; i < weights[currentElem]; i++)
                weighedElems[weighedElems.length] = items[currentElem];
            currentElem++;
        }
        let randomTier = Math.floor(Math.random() * totalWeight);
        return weighedElems[randomTier];
    }
    pickRandNumInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    pickRandNumOneInTen() {
        return Math.floor(Math.random() * 10);
    }
    clampNumber(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }
    writeConfigJSON(data, filePath) {
        const baseFolderPath = path.resolve(path.join(__dirname, '../../'));
        fs.writeFile(path.join(baseFolderPath, filePath), JSON.stringify(data, null, 4), function (err) {
            if (err) {
                console.log(`Trying to save the config to ${path.join(baseFolderPath, filePath)} failed:`);
                throw err;
            }
        });
    }
    genId() {
        const shasum = node_crypto_1.default.createHash("sha256");
        const time = Math.random() * Math.floor(new Date().getTime() / 1000);
        shasum.update(time.toString());
        return shasum.digest("hex").substring(0, 24);
    }
    getTime(time, hourDiff) {
        const [h, m] = time.split(":");
        if (hourDiff == 12 && parseInt(h) >= 12) {
            return `${Math.abs(parseInt(h) - hourDiff)}:${m}`;
        }
        if (hourDiff == 12 && parseInt(h) < 12) {
            return `${Math.abs(parseInt(h) + hourDiff)}:${m}`;
        }
        return `${h}:${m}`;
    }
    isNight(time, map) {
        const [hours, minutes] = time.split(":");
        const isNightByHours = parseInt(hours) < 5 || parseInt(hours) >= 21;
        const isNightByMap = map == "factory4_night";
        const isDayByMap = map == "factory4_day" || map == "laboratory";
        if (!isDayByMap && (isNightByHours || isNightByMap)) {
            return true;
        }
        else {
            return false;
        }
    }
}
exports.Utils = Utils;
class ModTracker {
    static sainPresent = false;
    static swagPresent = false;
    static tgcPresent = false;
    static qtbPresent = false;
    static qtbSpawnsActive = false;
    static alpPresent = false;
}
exports.ModTracker = ModTracker;
class ProfileTracker {
    static averagePlayerLevel = 1;
    static playerRecord = {};
    static checkLoggedInProfiles(pmcData, profileData, removeProfile) {
        const level = pmcData?.Info?.Level ?? 1;
        if (removeProfile)
            delete ProfileTracker.playerRecord[profileData.info.id];
        else
            ProfileTracker.playerRecord[profileData.info.id] = level;
        let playerCount = 0;
        let cumulativePlayerLevel = 0;
        for (const key in ProfileTracker.playerRecord) {
            const playerLevel = ProfileTracker.playerRecord[key];
            if (!isNaN(playerLevel)) {
                cumulativePlayerLevel += playerLevel;
                playerCount += 1;
            }
        }
        ProfileTracker.averagePlayerLevel = playerCount > 0 ? cumulativePlayerLevel / playerCount : 1;
        instance_manager_1.InstanceManager.getLoggerInstance().logWithColor(`Realism Mod: Players in server ${playerCount}, average level: ${ProfileTracker.averagePlayerLevel}`, LogTextColor_1.LogTextColor.GREEN);
    }
    static getPmcProfileData(profileHelper) {
        let profiles = [];
        for (const key in ProfileTracker.playerRecord) {
            profiles.push(profileHelper.getPmcProfile(key));
        }
        return profiles;
    }
}
exports.ProfileTracker = ProfileTracker;
class ConfigChecker {
    static dllIsPresent = false;
}
exports.ConfigChecker = ConfigChecker;
var MapType;
(function (MapType) {
    MapType["Urban"] = "urban";
    MapType["Outdoor"] = "uutdoor";
    MapType["CQB"] = "cqb";
})(MapType || (exports.MapType = MapType = {}));
class RaidInfoTracker {
    static isNight = false;
    static mapType = MapType.Urban;
    static mapName = "";
    static generatedBotsCount = 0;
}
exports.RaidInfoTracker = RaidInfoTracker;
class BotTierTracker {
    static scavTier = 1;
    static rogueTier = 1;
    static raiderTier = 1;
    static goonsTier = 1;
    static killaTier = 1;
    static tagillaTier = 1;
    static sanitarTier = 1;
    static reshallaTier = 1;
    static cultTier = 1;
    static cultistBaseJson = 0;
    static priestBaseJson = 0;
    getTier(botType) {
        if (botType === "assault") {
            return BotTierTracker.scavTier;
        }
        if (botType === "pmcbot") {
            return BotTierTracker.raiderTier;
        }
        if (botType === "exusec") {
            return BotTierTracker.rogueTier;
        }
        if (botType === "bossknight" || botType === "followerbigpipe" || botType === "followerbirdeye") {
            return BotTierTracker.goonsTier;
        }
        if (botType === "bosskilla") {
            return BotTierTracker.killaTier;
        }
        if (botType === "bosstagilla") {
            return BotTierTracker.tagillaTier;
        }
        if (botType.includes("sanitar")) {
            return BotTierTracker.sanitarTier;
        }
        if (botType.includes("bully")) {
            return BotTierTracker.reshallaTier;
        }
        if (botType.includes("sectant")) {
            return BotTierTracker.cultTier;
        }
        return 2;
    }
}
exports.BotTierTracker = BotTierTracker;
//# sourceMappingURL=utils.js.map
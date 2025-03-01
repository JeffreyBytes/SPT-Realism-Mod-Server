import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { IItem } from "@spt/models/eft/common/tables/IItem";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import * as path from 'path';
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import crypto from "node:crypto";
import { IMods } from "@spt/models/eft/common/tables/IBotType";
import { StaticArrays } from "./arrays";
import { ISptProfile } from "@spt/models/eft/profile/ISptProfile";
import { InstanceManager } from "../instance_manager";
import { LogTextColor } from "@spt/models/spt/logging/LogTextColor";
import { ProfileHelper } from "@spt/helpers/ProfileHelper";

const fs = require('fs');
const modConfig = require("../../config/config.json");

export class Utils {

    private constructor(private tables: IDatabaseTables) { }

    private static instance: Utils;
    public static getInstance(tables?: IDatabaseTables): Utils {
        if (!Utils.instance) Utils.instance = new Utils(tables);
        return Utils.instance;
    }

    itemDB(): Record<string, ITemplateItem> {
        return this.tables.templates.items;
    }

    public getInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return (max > min) ? Math.floor(Math.random() * (max - min + 1) + min) : min;
    }

    public getArrayValue<T>(arr: T[]): T {
        return arr[this.getInt(0, arr.length - 1)];
    }

    public revertMedItems(playerData: IPmcData) {
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

    public correctItemResources(playerData: IPmcData, playerXP: number, logger: ILogger) {
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

    private correctProvisionRes(profileItem: IItem, playerXP: number, logger: ILogger) {
        let templateItem = this.itemDB()[profileItem._tpl];
        if (templateItem != null && (profileItem.upd.FoodDrink.HpPercent > templateItem._props.MaxResource || playerXP == 0)) {
            profileItem.upd.FoodDrink.HpPercent = templateItem._props.MaxResource;
        }
    }

    private correctMedicalRes(profileItem: IItem, playerXP: number, logger: ILogger) {
        let templateItem = this.itemDB()[profileItem._tpl];
        if (templateItem != null && (profileItem.upd.MedKit.HpResource > templateItem._props.MaxHpResource || playerXP == 0)) {
            profileItem.upd.MedKit.HpResource = templateItem._props.MaxHpResource;
        }
    }

    private correctDuraHelper(profileItem: IItem, playerXP: number) {
        let templateItem = this.itemDB()[profileItem._tpl]
        if (templateItem != null && (profileItem.upd.Repairable.Durability > templateItem._props.MaxDurability || playerXP == 0)) {
            profileItem.upd.Repairable.Durability = templateItem._props.Durability;
            profileItem.upd.Repairable.MaxDurability = templateItem._props.MaxDurability;
        }
    }

    public probabilityWeighter(items: any, weights: number[]): any {
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

    public pickRandNumInRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public pickRandNumOneInTen(): number {
        return Math.floor(Math.random() * 10);
    }

    public clampNumber(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(value, max));
    }

    public writeConfigJSON(data: any, filePath: string) {
        const baseFolderPath = path.resolve(path.join(__dirname, '../../'));
        fs.writeFile(path.join(baseFolderPath, filePath), JSON.stringify(data, null, 4), function (err) {
            if (err) {
                console.log(`Trying to save the config to ${path.join(baseFolderPath, filePath)} failed:`);
                throw err;
            }
        });
    }

    public genId(): string {
        const shasum = crypto.createHash("sha256");
        const time = Math.random() * Math.floor(new Date().getTime() / 1000);

        shasum.update(time.toString());
        return shasum.digest("hex").substring(0, 24);
    }

    public getTime(time, hourDiff): string {
        const [h, m] = time.split(":");
        if (hourDiff == 12 && parseInt(h) >= 12) {
            return `${Math.abs(parseInt(h) - hourDiff)}:${m}`
        }
        if (hourDiff == 12 && parseInt(h) < 12) {
            return `${Math.abs(parseInt(h) + hourDiff)}:${m}`
        }
        return `${h}:${m}`
    }

    public isNight(time: string, map: string): boolean {
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

export class ModTracker {
    static sainPresent: boolean = false;
    static swagPresent: boolean = false;
    static tgcPresent: boolean = false;
    static qtbPresent: boolean = false;
    static qtbSpawnsActive: boolean = false;
    static alpPresent: boolean = false;
}

export class ProfileTracker {
    static averagePlayerLevel: number = 1;
    static playerRecord: Record<string, number> = {};

    public static checkLoggedInProfiles(pmcData: IPmcData, profileData: ISptProfile, removeProfile: boolean) {
       
        const level = pmcData?.Info?.Level ?? 1;

        if (removeProfile) delete ProfileTracker.playerRecord[profileData.info.id];
        else ProfileTracker.playerRecord[profileData.info.id] = level;

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
        InstanceManager.getLoggerInstance().logWithColor(`Realism Mod: Players in server ${playerCount}, average level: ${ProfileTracker.averagePlayerLevel}`, LogTextColor.GREEN);
    }

    public static getPmcProfileData(profileHelper: ProfileHelper): IPmcData[] {
        let profiles: IPmcData[] = [];
        for (const key in ProfileTracker.playerRecord) {
            profiles.push(profileHelper.getPmcProfile(key));
        }
        return profiles;
    }
}

export class ConfigChecker {
    static dllIsPresent: boolean = false;
}

export enum MapType {
    Urban = "urban",
    Outdoor = "uutdoor",
    CQB = "cqb",
}

export class RaidInfoTracker {
    static isNight: boolean = false;
    static mapType: MapType = MapType.Urban;
    static mapName: string = "";
    static generatedBotsCount: number = 0;
    // static activeRaids: RaidInfo[] = [];
}

export class BotTierTracker {
    static scavTier: number = 1;
    static rogueTier: number = 1;
    static raiderTier: number = 1;
    static goonsTier: number = 1;
    static killaTier: number = 1;
    static tagillaTier: number = 1;
    static sanitarTier: number = 1;
    static reshallaTier: number = 1;
    static cultTier: number = 1;
    static cultistBaseJson: number = 0;
    static priestBaseJson: number = 0;

    public getTier(botType: string): number {
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
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { IRepairConfig } from "@spt/models/spt/config/IRepairConfig";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ParentClasses } from "../utils/enums";
import { ConfigChecker } from "../utils/utils";
import { IConfig } from "@spt/models/eft/common/IGlobals";
import { ITemplateItem } from "@spt/models/eft/common/tables/ITemplateItem";

const mastering = require("../../db/items/mastering.json");

export class WeaponsGlobals {
    constructor(private logger: ILogger, private tables: IDatabaseTables, private modConf) { }

    globalDB(): IConfig {
        return this.tables.globals.config;
    }
    itemDB(): Record<string, ITemplateItem> {
        return this.tables.templates.items;
    }

    public loadGlobalMalfChanges() {
        this.globalDB().Malfunction.DurRangeToIgnoreMalfs["x"] = 98;
        this.globalDB().Malfunction.DurRangeToIgnoreMalfs["y"] = 100;
        this.globalDB().Malfunction.AmmoMalfChanceMult = 1;
        this.globalDB().Malfunction.MagazineMalfChanceMult = 1;
        this.globalDB().Overheat.MaxCOIIncreaseMult = 2.5;
        this.globalDB().Overheat.FirerateReduceMinMult = 1;
        this.globalDB().Overheat.FirerateReduceMaxMult = 1.12;
        this.globalDB().Overheat.FirerateOverheatBorder = 25;
        this.globalDB().Overheat.OverheatProblemsStart = 40;
        this.globalDB().Overheat.OverheatWearLimit = 0.85;
        this.globalDB().Overheat.MinWearOnOverheat = 0;
        this.globalDB().Overheat.MaxWearOnOverheat = 0.2;
        this.globalDB().Overheat.AutoshotChance = 0.5;
        this.globalDB().Overheat.AutoshotPossibilityDuration = 4;
        //this.globalDB().UncheckOnShot = false; this causes ammo count to always be known, don't remember why I changed it...

        for (let i in this.itemDB()) {
            let serverItem = this.itemDB()[i];
            if (this.modConf.trader_repair_changes) {
                if (serverItem._parent === ParentClasses.SMG
                    || serverItem._parent === ParentClasses.WEAPON
                    || serverItem._parent === ParentClasses.SHOTGUN
                    || serverItem._parent === ParentClasses.ASSAULT_CARBINE
                    || serverItem._parent === ParentClasses.SNIPER_RIFLE
                    || serverItem._parent === ParentClasses.ASSAULT_RIFLE
                    || serverItem._parent === ParentClasses.MACHINE_GUN
                    || serverItem._parent === ParentClasses.MARKSMAN_RIFLE
                    || serverItem._parent === ParentClasses.PISTOL
                    || serverItem._parent === ParentClasses.GRENADE_LAUNCHER
                    || serverItem._parent === ParentClasses.SPECIAL_WEAPON
                ) {
                    serverItem._props.MinRepairDegradation = 0;
                    serverItem._props.MaxRepairDegradation = 0.04;
                    serverItem._props.MinRepairKitDegradation = 0;
                    serverItem._props.MaxRepairKitDegradation = 0.005;
                    if (serverItem._props.HeatFactorGun) serverItem._props.HeatFactorGun *= 1.125;
                    if (serverItem._props.CoolFactorGun) serverItem._props.CoolFactorGun *= 2;
                }
                if (serverItem._parent === ParentClasses.REPAIRKITS) {
                    serverItem._props.RepairQuality = 0.1
                }
            }
        }
    }

    public loadGlobalWeps() {

        for (let i in this.itemDB()) {
            let serverItem = this.itemDB()[i];
            if (serverItem._parent === ParentClasses.KNIFE) {
                serverItem._props.DeflectionConsumption /= 5;
                serverItem._props.SlashPenetration += 1;
                serverItem._props.StabPenetration += 3;
                // serverItem._props.Unlootable = false;
                // serverItem._props.UnlootableFromSide = [];
            }
        }

        if (this.modConf.mastery_changes == true) {
            this.globalDB().Mastering = mastering.Mastering;
        }

        if (this.modConf.recoil_attachment_overhaul == true) {
            // vertical
            this.globalDB().Aiming.RecoilXIntensityByPose["x"] = 1.1; //prone
            this.globalDB().Aiming.RecoilXIntensityByPose["y"] = 0.78; //crouch
            this.globalDB().Aiming.RecoilXIntensityByPose["z"] = 1; //stand
            //spread
            this.globalDB().Aiming.RecoilYIntensityByPose["x"] = 1.05;
            this.globalDB().Aiming.RecoilYIntensityByPose["y"] = 1.1;
            this.globalDB().Aiming.RecoilYIntensityByPose["z"] = 1;
            //rearward 
            this.globalDB().Aiming.RecoilZIntensityByPose["x"] = 0.7;
            this.globalDB().Aiming.RecoilZIntensityByPose["y"] = 1.35;
            this.globalDB().Aiming.RecoilZIntensityByPose["z"] = 1;

            this.globalDB().Aiming.ProceduralIntensityByPose["x"] = 0.2;
            this.globalDB().Aiming.ProceduralIntensityByPose["y"] = 0.7;

            this.globalDB().Aiming.AimProceduralIntensity = 1;

            this.globalDB().Aiming.RecoilCrank = true;

            if (this.modConf.logEverything == true) {
                this.logger.info("Recoil Changes Enabled");
            }
        }

        if (this.modConf.logEverything == true) {
            this.logger.info("Weapons Globals Loaded");
        }

    }
}

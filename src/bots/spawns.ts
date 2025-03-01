import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILocations } from "@spt/models/spt/server/ILocations";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { ModTracker, Utils } from "../utils/utils";
import { EventTracker } from "../misc/seasonalevents";
import { ILocationConfig } from "@spt/models/spt/config/ILocationConfig";
import { DatabaseService } from "@spt/services/DatabaseService";
import { ISeasonalEventConfig } from "@spt/models/spt/config/ISeasonalEventConfig";
import { IBossLocationSpawn, ILocationBase } from "@spt/models/eft/common/ILocationBase";
import { IGlobals } from "@spt/models/eft/common/IGlobals";
import { ILocation } from "@spt/models/eft/common/ILocation";


const botZones = require("../../db/maps/spawnZones.json");
const bossSpawns = require("../../db/maps/bossSpawns.json");
const spawnWaves = require("../../db/maps/spawnWaves.json");

export class Spawns {
    constructor(private logger: ILogger, private tables: IDatabaseTables, private modConf, private mapDB: ILocations, private utils: Utils) { }

    public setBossSpawnChance(level: number, databaseService: DatabaseService, seasonalEventConfig: ISeasonalEventConfig) {
        level = level <= 5 ? 0 : level;
        const levelFactor = level * 0.02;
        let spawnModifier = Math.pow(levelFactor, 1.85);
        spawnModifier = this.utils.clampNumber(spawnModifier, 0, 1);
        this.bossSpawnHelper(spawnModifier, databaseService, seasonalEventConfig);
    }

    private bossSpawnHelper(chanceMulti: number, databaseService: DatabaseService, seasonalEventConfig: ISeasonalEventConfig) {
        //refresh boss spawn chances
        this.loadBossSpawnChanges();
        //if (this.modConf.realistic_zombies) this.configureZombies(databaseService, seasonalEventConfig);

        for (const i in this.mapDB) {
            const mapBase: ILocationBase = this.mapDB[i]?.base;
            if (mapBase == null || mapBase?.BossLocationSpawn == null) continue;
            for (const bossSpawnLocation of mapBase.BossLocationSpawn) {
                let chance = 0;
                if (i === "lighthouse" || i === "laboratory") continue;
                if (bossSpawnLocation?.TriggerId != null && bossSpawnLocation?.TriggerId !== "") {
                    chance = bossSpawnLocation.BossChance * chanceMulti * 2;
                } else {
                    chance = bossSpawnLocation.BossChance * chanceMulti;
                }
                bossSpawnLocation.BossChance = Math.round(this.utils.clampNumber(chance, 0, 100));
            }
        }
    }

    public loadBossSpawnChanges() {
        if (this.modConf.boss_spawns == true) {
            this.mapDB.bigmap.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.CustomsBossLocationSpawn));
            this.mapDB.factory4_day.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.FactoryDayBossLocationSpawn));
            this.mapDB.factory4_night.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.FactoryNightBossLocationSpawn));
            this.mapDB.rezervbase.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.ReserveBossLocationSpawn));
            this.mapDB.interchange.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.InterchangeBossLocationSpawn));
            this.mapDB.shoreline.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.ShorelineBossLocationSpawn));
            this.mapDB.lighthouse.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.LighthouseBossLocationSpawn));
            this.mapDB.laboratory.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.LabsBossLocationSpawn));
            this.mapDB.woods.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.WoodsBossLocationSpawn));
            this.mapDB.tarkovstreets.base.BossLocationSpawn = JSON.parse(JSON.stringify(bossSpawns.StreetsBossLocationSpawn));
        }
    }


    private configureZombies(databaseService: DatabaseService, seasonalEventConfig: ISeasonalEventConfig) {
        const infectionLevel = 25;
        const chance = 18;
        const globals: IGlobals = databaseService.getGlobals();
        const infectionHalloween = globals.config.SeasonActivity.InfectionHalloween;
        const botsToAddPerMap = seasonalEventConfig.eventBossSpawns["halloweenzombies"];
        //infectionHalloween.Enabled = true;
        
        //infectionHalloween.DisplayUIEnabled = true;
        //this.mapDB.bigmap.base.BossLocationSpawn = [];
        //this.mapDB.bigmap.base.waves = [];       
        const mapKeys = Object.keys(botsToAddPerMap) ?? [];
        const locations = this.mapDB;
        for (const mapKey of mapKeys) {
            const bossesToAdd = botsToAddPerMap[mapKey];
            for (const boss of bossesToAdd) {
                const map = locations[mapKey].base;
                const bossLocationSpawns: IBossLocationSpawn[] = map.BossLocationSpawn;
                map.Events.Halloween2024.InfectionPercentage = infectionLevel;
                globals.LocationInfection[mapKey] = infectionLevel;
                let rnd = this.utils.pickRandNumInRange(1, 100);
                if (rnd < chance && !bossLocationSpawns.some((bossSpawn) => bossSpawn.BossName === boss.BossName)) {
                    map.BossLocationSpawn.push(boss);
                }
            }
        }
    }

    public forceBossSpawns() {
        for (let i in this.mapDB) {
            let mapBase = this.mapDB[i]?.base;
            if (mapBase != null && mapBase?.BossLocationSpawn != null) {
                let bossSpawn = mapBase.BossLocationSpawn;
                for (let k in bossSpawn) {
                    bossSpawn[k].BossChance = 100;
                }
            }
        }
    }


    public loadSpawnChanges(locationConfig: ILocationConfig) {
        //&& ModTracker.swagPresent == false
        this.loadBossSpawnChanges();

        //SPT does its own custom PMC waves, this couble be doubling up or interfering in some way
        if (this.modConf.spawn_waves == true && !ModTracker.swagPresent && !ModTracker.qtbSpawnsActive) {
            // locationConfig.customWaves.normal = {}; //get rid of the extra waves of scavs SPT adds
            // locationConfig.customWaves.boss = {}; //get rid of extra PMC spawns
            //locationConfig.addCustomBotWavesToMaps = true;
            locationConfig.splitWaveIntoSingleSpawnsSettings.enabled = false;
            // this.mapDB.bigmap.base.waves = spawnWaves.CustomsWaves;
            // this.mapDB.lighthouse.base.waves = spawnWaves.LighthouseWaves;
            this.mapDB.factory4_day.base.waves = spawnWaves.FactoryWaves;
            this.mapDB.factory4_night.base.waves = spawnWaves.FactoryWaves;
            this.mapDB.shoreline.base.waves = [];
            this.mapDB.tarkovstreets.base.waves = [];
            // this.mapDB.interchange.base.waves = spawnWaves.InterchangeWaves;
            // this.mapDB.shoreline.base.waves = spawnWaves.ShorelineWaves;
            // this.mapDB.rezervbase.base.waves = spawnWaves.ReserveWaves;
            // this.mapDB.tarkovstreets.base.waves = spawnWaves.StreetsWaves;
            // this.mapDB.woods.base.waves = spawnWaves.WoodsWaves;
            this.mapDB.laboratory.base.waves = spawnWaves.LabsWaves;
            // this.mapDB.sandbox.base.waves = spawnWaves.GroundZeroWaves;
            // this.mapDB.sandbox_high.base.waves = spawnWaves.GroundZeroWaves;
            for (const i in this.mapDB) {
                const map = this.mapDB[i]?.base;
                if (map != null && map?.BossLocationSpawn != null) {
                    if (map.NonWaveGroupScenario) map.NonWaveGroupScenario.Enabled = false;
                    map.BotStart = 0;
                    map["BotStartPlayer"] = 0;
                    map.BotStop = 40;
                    map.BotSpawnPeriodCheck = 100000;
                    map.BotSpawnTimeOnMin = 1000000;
                    map.BotSpawnTimeOnMax = 10000000;
                    map.BotSpawnTimeOffMin = 1000000;
                    map.BotSpawnTimeOffMax = 10000000;
                    map.BotSpawnCountStep = 10000000;
                    // map.NewSpawn = false;
                    // map.OldSpawn = true;
                    map["NewSpawnForPlayers"] = false;
                }
            }
        }

        if (this.modConf.logEverything == true) {
            this.logger.info("Map Spawn Changes Loaded");
        }
    }

    public openZonesFix() {

        for (let location in botZones.zones) {
            this.mapDB[location].base.OpenZones = botZones.zones[location];
        }

        if (this.modConf.logEverything == true) {
            this.logger.info("OpenZones Fix Enabled");
        }
    }

}
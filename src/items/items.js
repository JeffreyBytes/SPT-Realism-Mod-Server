"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsClass = void 0;
const arrays_1 = require("../utils/arrays");
const myTemplates = require("../../db/new_items/items.json");
const myLocales = require("../../db/new_items/en.json");
const myHandbook = require("../../db/new_items/handbook.json");
class ItemsClass {
    logger;
    tables;
    modConfig;
    inventoryConf;
    raidConf;
    fleaConf;
    itemConfig;
    constructor(logger, tables, modConfig, inventoryConf, raidConf, fleaConf, itemConfig) {
        this.logger = logger;
        this.tables = tables;
        this.modConfig = modConfig;
        this.inventoryConf = inventoryConf;
        this.raidConf = raidConf;
        this.fleaConf = fleaConf;
        this.itemConfig = itemConfig;
    }
    globalDB() {
        return this.tables.globals.config;
    }
    itemDB() {
        return this.tables.templates.items;
    }
    locales() {
        return this.tables.locales.global;
    }
    handbook() {
        return this.tables.templates.handbook.Items;
    }
    //6kh4
    createGTFilter(slotName, parentID) {
        return {
            "_id": slotName,
            "_mergeSlotWithChildren": false,
            "_name": "mod_muzzle",
            "_parent": parentID,
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "6783b079e4585dfb0fec3c73",
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        };
    }
    addCustomItems() {
        for (const item in myTemplates) {
            this.itemDB()[item] = myTemplates[item];
        }
        for (const item of myHandbook.items) {
            this.handbook().push(item);
        }
        for (const localeID in this.locales()) {
            for (const [itemId, template] of Object.entries(myLocales.templates)) {
                for (const [key, value] of Object.entries(template)) {
                    this.locales()[localeID][`${itemId} ${key}`] = value;
                }
            }
        }
        //mosin bayonet to mosin barrels
        this.itemDB()["5ae09bff5acfc4001562219d"]._props.Slots[2]._props.filters[0].Filter.push("6783afddef9d6f5d579c43f1");
        this.itemDB()["5bfd4cbe0db834001b73449f"]._props.Slots[2]._props.filters[0].Filter.push("6783afddef9d6f5d579c43f1");
        // this.itemDB()["649ec107961514b22506b10c"]._props.Prefab.path = "ak12_gt.bundle"
        // this.itemDB()["649ec107961514b22506b10c"]._props.Slots.push({
        //     "_id": "ak74_slot0",
        //     "_mergeSlotWithChildren": false,
        //     "_name": "mod_muzzle",
        //     "_parent": "649ec107961514b22506b10c",
        //     "_props": {
        //         "filters": [
        //             {
        //                 "Filter": [
        //                     "6kh5_bayonet"
        //                 ],
        //                 "Shift": 0
        //             }
        //         ]
        //     },
        //     "_proto": "55d30c4c4bdc2db4468b457e",
        //     "_required": false
        // });
        this.itemDB()["59c6633186f7740cf0493bb9"]._props.Prefab.path = "ak74_gt.bundle";
        this.itemDB()["59c6633186f7740cf0493bb9"]._props.Slots.push(this.createGTFilter("a74_slot0", "59c6633186f7740cf0493bb9"));
        this.itemDB()["59d64ec286f774171d1e0a42"]._props.Prefab.path = "akm_gt.bundle";
        this.itemDB()["59d64ec286f774171d1e0a42"]._props.Slots.push(this.createGTFilter("akm_slot0", "59d64ec286f774171d1e0a42"));
        this.itemDB()["59e649f986f77411d949b246"]._props.Prefab.path = "vepr_136_gt.bundle";
        this.itemDB()["59e649f986f77411d949b246"]._props.Slots.push(this.createGTFilter("vepr_slot0", "59e649f986f77411d949b246"));
        //m9 bayonet
        this.itemDB()["5ae30e795acfc408fb139a0b"]._props.Prefab.path = "m4_gas_block.bundle";
        this.itemDB()["5ae30e795acfc408fb139a0b"]._props.Slots[0] = {
            "_id": "m4_slot0",
            "_mergeSlotWithChildren": false,
            "_name": "mod_muzzle",
            "_parent": "5ae30e795acfc408fb139a0b",
            "_props": {
                "filters": [
                    {
                        "Filter": [
                            "6783b041281387d669fd3722"
                        ],
                        "Shift": 0
                    }
                ]
            },
            "_proto": "55d30c4c4bdc2db4468b457e",
            "_required": false
        };
        //m9 bayonet
        this.itemDB()["6783b041281387d669fd3722"]._props.ConflictingItems =
            [
                "5c0e2f94d174af029f650d56",
                "5d440b9fa4b93601354d480c",
                "5d440b93a4b9364276578d4b",
                "6783af433f159a5ae961078a",
                "55d35ee94bdc2d61338b4568",
                "6357c98711fb55120211f7e1",
                "638612b607dfed1ccb7206ba",
                "57dbb57e2459774673234890",
                "57da93632459771cb65bf83f"
            ];
        for (let i in this.itemDB()["55d3632e4bdc2d972f8b4569"]._props.Slots[0]._props.filters[0].Filter) {
            let item = this.itemDB()["55d3632e4bdc2d972f8b4569"]._props.Slots[0]._props.filters[0].Filter[i];
            if (item !== "544a38634bdc2d58388b4568" && item !== "5c0fafb6d174af02a96260ba" && item !== "56ea8180d2720bf2698b456a") {
                this.itemDB()["6783b041281387d669fd3722"]._props.ConflictingItems.push(item);
            }
        }
        let allowedAKMuzzles = [
            "6783af4a205ba84b88b7372b",
            "59d64fc686f774171b243fe2",
            "5ac7655e5acfc40016339a19",
            "5ac72e7d5acfc40016339a02",
            "5649aa744bdc2ded0b8b457e",
            "59e61eb386f77440d64f5daf"
        ];
        let incompatibleWeapons = [
            "62e7e7bbe6da9612f743f1e0",
            "5ac66cb05acfc40198510a10",
            "5ac66d725acfc43b321d4b60",
            "5ac66d9b5acfc4001633997a"
        ];
        this.itemDB()["6783b079e4585dfb0fec3c73"]._props.ConflictingItems = incompatibleWeapons;
        // this.itemDB()["6kh5_bayonet"]._props.ConflictingItems = incompatibleWeapons;
        for (let i in this.itemDB()["5bf3e03b0db834001d2c4a9c"]._props.Slots[2]._props.filters[0].Filter) {
            let item = this.itemDB()["5bf3e03b0db834001d2c4a9c"]._props.Slots[2]._props.filters[0].Filter[i];
            if (!allowedAKMuzzles.includes(item)) {
                this.itemDB()["6783b079e4585dfb0fec3c73"]._props.ConflictingItems.push(item);
                // this.itemDB()["6kh5_bayonet"]._props.ConflictingItems.push(item);
            }
        }
        for (let i in this.itemDB()["59d6088586f774275f37482f"]._props.Slots[2]._props.filters[0].Filter) {
            let item = this.itemDB()["59d6088586f774275f37482f"]._props.Slots[2]._props.filters[0].Filter[i];
            if (!allowedAKMuzzles.includes(item)) {
                this.itemDB()["6783b079e4585dfb0fec3c73"]._props.ConflictingItems.push(item);
                // this.itemDB()["6kh5_bayonet"]._props.ConflictingItems.push(item);
            }
        }
        for (let i in this.itemDB()["5ac66d2e5acfc43b321d4b53"]._props.Slots[2]._props.filters[0].Filter) {
            let item = this.itemDB()["5ac66d2e5acfc43b321d4b53"]._props.Slots[2]._props.filters[0].Filter[i];
            if (!allowedAKMuzzles.includes(item)) {
                this.itemDB()["6783b079e4585dfb0fec3c73"]._props.ConflictingItems.push(item);
                // this.itemDB()["6kh5_bayonet"]._props.ConflictingItems.push(item);
            }
        }
    }
    loadItemBlacklists() {
        this.itemConfig.blacklist.push(...arrays_1.StaticArrays.blacklistedItems);
        this.itemConfig.rewardItemBlacklist.push(...arrays_1.StaticArrays.blacklistedItems);
        this.itemConfig.lootableItemBlacklist.push(...arrays_1.StaticArrays.blacklistedItems);
    }
    loadItemsRestrictions() {
        if (this.modConfig.all_examined == true) {
            for (let i in this.itemDB()) {
                let serverItem = this.itemDB()[i];
                serverItem._props.ExaminedByDefault = true;
            }
            if (this.modConfig.logEverything == true) {
                this.logger.info("All Items Examined");
            }
        }
        if (this.modConfig.remove_fir_req == true) {
            this.inventoryConf.newItemsMarkedFound = true;
            this.raidConf.keepFiRSecureContainerOnDeath = true;
            this.fleaConf.dynamic.purchasesAreFoundInRaid = true;
        }
        if (this.modConfig.remove_inraid_restrictions == true) {
            this.globalDB().RestrictionsInRaid = [];
            this.globalDB().DiscardLimitsEnabled = false;
            // for (let item in this.itemDB()) {
            //     if (this.itemDB()[item]?._props?.DiscardLimit != null) {
            //         this.itemDB()[item]._props.DiscardLimit = -1;
            //     }
            // }
            if (this.modConfig.logEverything == true) {
                this.logger.info("In-Raid Restrictions Removed");
            }
        }
        if (this.modConfig.logEverything == true) {
            this.logger.info("Items Loaded");
        }
    }
}
exports.ItemsClass = ItemsClass;
//# sourceMappingURL=items.js.map